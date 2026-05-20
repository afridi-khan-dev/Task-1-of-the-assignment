from langgraph.graph import StateGraph, END
from sqlalchemy.orm import Session
import json
import logging
from typing import Dict, Any, Optional

from backend.app.agents.state import AgentState
from backend.app.tools.log_interaction import LogInteractionTool
from backend.app.tools.edit_interaction import EditInteractionTool
from backend.app.tools.hcp_search import HcpSearchTool
from backend.app.tools.followups import FollowUpRecommendationTool
from backend.app.tools.compliance import ComplianceValidationTool
from backend.app.services.groq_service import call_groq_api

logger = logging.getLogger("langgraph_agent")

class LangGraphCRMOrchestrator:
    """
    StateGraph compiler and orchestrator for our CRM agent workflow.
    Intelligently routes user queries, coordinates tool execution, 
    and handles state aggregation.
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.log_tool = LogInteractionTool(db)
        self.edit_tool = EditInteractionTool(db)
        self.search_tool = HcpSearchTool(db)
        self.followup_tool = FollowUpRecommendationTool(db)
        self.compliance_tool = ComplianceValidationTool(db)

    async def route_intent(self, state: AgentState) -> AgentState:
        """
        NLU Node: Evaluates user intent to route to the correct tool or dialogue tree.
        """
        user_input = state.get("user_input", "")
        
        prompt = (
            "Analyze the following user input from a pharmaceutical field representative and determine their core intent.\n\n"
            f"User Input: \"{user_input}\"\n\n"
            "Respond with a single JSON word under the key 'intent'. Must be one of:\n"
            "- 'log' (rep is trying to log a new meeting, visit, or interaction with an HCP)\n"
            "- 'edit' (rep is trying to modify, edit, or update a past logged interaction or date)\n"
            "- 'search' (rep is trying to find, look up, or list healthcare professionals or doctors)\n"
            "- 'recommend' (rep is asking for recommendations, follow-up actions, next steps, or clinical insights for a doctor)\n"
            "- 'chat' (rep is asking a general CRM question, greeting, or chatting about products)\n"
        )
        
        messages = [
            {"role": "system", "content": "You are a CRM router. Return JSON with key 'intent'."},
            {"role": "user", "content": prompt}
        ]
        
        intent = "chat"
        try:
            res = await call_groq_api(messages, json_mode=True, db=self.db)
            data = json.loads(res)
            intent = data.get("intent", "chat")
        except Exception as e:
            logger.error(f"Intent routing failed: {e}")
            # Heuristic fallbacks if LLM fails
            lower_input = user_input.lower()
            if any(w in lower_input for w in ["met", "saw", "discussed", "spoke to", "logged"]):
                intent = "log"
            elif any(w in lower_input for w in ["change", "edit", "update", "modify"]):
                intent = "edit"
            elif any(w in lower_input for w in ["find", "search", "lookup", "who"]):
                intent = "search"
            elif any(w in lower_input for w in ["recommend", "next", "advice", "followup", "follow-up"]):
                intent = "recommend"
                
        state["next_action"] = intent
        return state

    async def execute_log_node(self, state: AgentState) -> AgentState:
        """
        Invokes LogInteractionTool to parse notes, check compliance, and persist records.
        """
        user_input = state["user_input"]
        user_id = state["user_id"]
        
        try:
            result = await self.log_tool.execute(user_input, user_id)
            
            state["extracted_entities"] = result["extracted_entities"]
            state["compliance_status"] = result["compliance_status"]
            state["follow_up_recommendation"] = result["follow_up_recommendation"]
            state["interaction_summary"] = result["extracted_entities"].get("summary", "")
            state["sentiment"] = result["extracted_entities"].get("sentiment", "Neutral")
            state["interaction_id"] = result["interaction_id"]
            state["hcp_id"] = result["hcp_details"]["id"]
            state["database_status"] = "success"
        except Exception as e:
            logger.error(f"LangGraph log node execution failed: {e}")
            state["database_status"] = "failed"
            
        return state

    async def execute_edit_node(self, state: AgentState) -> AgentState:
        """
        Invokes EditInteractionTool to modify a previously saved entry.
        """
        user_input = state["user_input"]
        user_id = state["user_id"]
        interaction_id = state.get("interaction_id")
        
        # If no explicit ID is in state, deduce it or use the last logged one
        if not interaction_id:
            # Let's extract interaction details or request user to select one
            state["final_output"] = "Please specify which interaction ID you wish to edit."
            state["database_status"] = "failed"
            return state
            
        modifications = {"raw_input": user_input}
        try:
            result = await self.edit_tool.execute(interaction_id, modifications, user_id)
            if result.get("status") == "success":
                state["interaction_summary"] = result["summary"]
                state["sentiment"] = result["sentiment"]
                state["database_status"] = "success"
            else:
                state["database_status"] = "failed"
        except Exception as e:
            logger.error(f"LangGraph edit node execution failed: {e}")
            state["database_status"] = "failed"
            
        return state

    async def execute_search_node(self, state: AgentState) -> AgentState:
        """
        Uses HcpSearchTool to resolve doctor profiles.
        """
        user_input = state["user_input"]
        # Extract search query
        prompt = (
            "Extract the search query (name, specialty, or clinic) from this prompt.\n\n"
            f"User Input: \"{user_input}\"\n\n"
            "Return JSON with key 'query'."
        )
        messages = [
            {"role": "system", "content": "Return ONLY valid JSON with 'query'."},
            {"role": "user", "content": prompt}
        ]
        
        search_query = user_input
        try:
            res = await call_groq_api(messages, json_mode=True, db=self.db)
            data = json.loads(res)
            search_query = data.get("query", user_input)
        except Exception:
            pass
            
        try:
            results = self.search_tool.execute(search_query)
            state["extracted_entities"] = {"search_results": results}
            state["database_status"] = "success"
        except Exception:
            state["database_status"] = "failed"
            
        return state

    async def execute_recommend_node(self, state: AgentState) -> AgentState:
        """
        Evaluates interaction histories to produce strategic next-steps.
        """
        user_input = state["user_input"]
        hcp_id = state.get("hcp_id")
        
        if not hcp_id:
            # Let's extract the doctor name to search for
            prompt = (
                "Identify the doctor name the rep is asking about.\n\n"
                f"User Input: \"{user_input}\"\n\n"
                "Return JSON with key 'doctor_name'."
            )
            try:
                res = await call_groq_api([{"role": "user", "content": prompt}], json_mode=True, db=self.db)
                doc_name = json.loads(res).get("doctor_name")
                results = self.search_tool.execute(doc_name)
                if results:
                    hcp_id = results[0]["id"]
                    state["hcp_id"] = hcp_id
            except Exception:
                pass
                
        if not hcp_id:
            state["final_output"] = "Could you please specify the doctor name so I can look up recommendations?"
            state["database_status"] = "failed"
            return state
            
        try:
            rec = await self.followup_tool.execute(hcp_id, user_input)
            state["follow_up_recommendation"] = rec
            state["database_status"] = "success"
        except Exception:
            state["database_status"] = "failed"
            
        return state

    async def execute_chat_node(self, state: AgentState) -> AgentState:
        """
        Conversational assistant node to discuss pharmaceutical catalog and operations.
        """
        user_input = state["user_input"]
        messages = [
            {"role": "system", "content": "You are a professional life sciences CRM conversational assistant. "
                                         "Answer questions about clinical detailing, products, or guidelines."},
            {"role": "user", "content": user_input}
        ]
        
        try:
            res = await call_groq_api(messages, json_mode=False, db=self.db)
            state["final_output"] = res
            state["database_status"] = "success"
        except Exception:
            state["final_output"] = "I apologize, I am experiencing temporary issues processing your request."
            state["database_status"] = "failed"
            
        return state

    async def synthesize_response_node(self, state: AgentState) -> AgentState:
        """
        Assembles a beautifully aggregated, context-aware human response detailing node achievements.
        """
        intent = state.get("next_action")
        db_status = state.get("database_status")
        
        if intent == "chat" and state.get("final_output"):
            # Chat node already synthesized response
            return state
            
        if db_status == "failed":
            state["final_output"] = "I ran into an issue fulfilling your request. Please check database logs or try again."
            return state
            
        if intent == "log":
            hcp_info = state["extracted_entities"].get("hcp_name", "the doctor")
            hosp_info = state["extracted_entities"].get("hospital", "their hospital")
            summary = state.get("interaction_summary", "")
            sentiment = state.get("sentiment", "Neutral")
            fup = state.get("follow_up_recommendation", {})
            compliance = state.get("compliance_status", {})
            
            compliance_warning = ""
            if not compliance.get("is_compliant", True):
                violations = ", ".join(compliance.get("violations", []))
                compliance_warning = f"\n\n⚠️ **COMPLIANCE ALERT DETECTED**: {violations}"
            
            output = (
                f"✅ **Interaction Logged Successfully!**\n\n"
                f"I recorded your meeting with **{hcp_info}** at **{hosp_info}**.\n"
                f"**CRM Summary**: {summary}\n"
                f"**Sentiment**: {sentiment}\n"
                f"**Follow-Up Task**: {fup.get('description')} (Due: {fup.get('due_date')}, Priority: {fup.get('priority')})"
                f"{compliance_warning}"
            )
            state["final_output"] = output
            
        elif intent == "edit":
            output = (
                f"✅ **Interaction ID {state.get('interaction_id')} Updated Successfully!**\n\n"
                f"**Updated CRM Summary**: {state.get('interaction_summary')}\n"
                f"**Updated Sentiment**: {state.get('sentiment')}"
            )
            state["final_output"] = output
            
        elif intent == "search":
            results = state["extracted_entities"].get("search_results", [])
            if not results:
                output = "🔍 No healthcare professionals found matching your search term."
            else:
                lines = []
                for idx, r in enumerate(results):
                    lines.append(f"{idx+1}. **{r['name']}** - {r['specialty']} at {r['hospital']} ({r['city']}) [Priority: {r['priority']}]")
                output = "🔍 **HCP Search Results:**\n\n" + "\n".join(lines)
            state["final_output"] = output
            
        elif intent == "recommend":
            fup = state.get("follow_up_recommendation", {})
            output = (
                f"💡 **AI Follow-Up Recommendation Plan:**\n\n"
                f"**Suggested Task**: {fup.get('description')}\n"
                f"**Timeline**: within {fup.get('due_date')}\n"
                f"**Priority**: {fup.get('priority')}\n"
                f"**Clinical Reasoning**: {fup.get('reasoning')}"
            )
            state["final_output"] = output
            
        return state

    def compile_graph(self):
        """
        Compiles the LangGraph StateGraph workflow.
        """
        # Create StateGraph
        workflow = StateGraph(AgentState)
        
        # Add Nodes
        workflow.add_node("intent_routing", self.route_intent)
        workflow.add_node("log_interaction", self.execute_log_node)
        workflow.add_node("edit_interaction", self.execute_edit_node)
        workflow.add_node("hcp_search", self.execute_search_node)
        workflow.add_node("followup_recommendation", self.execute_recommend_node)
        workflow.add_node("chat_assistance", self.execute_chat_node)
        workflow.add_node("response_synthesis", self.synthesize_response_node)
        
        # Set Entry Point
        workflow.set_entry_point("intent_routing")
        
        # Add Conditional Router
        def route_node(state):
            return state.get("next_action", "chat_assistance")
            
        workflow.add_conditional_edges(
            "intent_routing",
            route_node,
            {
                "log": "log_interaction",
                "edit": "edit_interaction",
                "search": "hcp_search",
                "recommend": "followup_recommendation",
                "chat": "chat_assistance"
            }
        )
        
        # Connect nodes to final synthesizer
        workflow.add_edge("log_interaction", "response_synthesis")
        workflow.add_edge("edit_interaction", "response_synthesis")
        workflow.add_edge("hcp_search", "response_synthesis")
        workflow.add_edge("followup_recommendation", "response_synthesis")
        workflow.add_edge("chat_assistance", "response_synthesis")
        
        # End at response synthesis
        workflow.add_edge("response_synthesis", END)
        
        return workflow.compile()
