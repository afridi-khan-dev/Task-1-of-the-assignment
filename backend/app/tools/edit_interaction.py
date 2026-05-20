from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
import json
from datetime import datetime
from backend.app.models import Interaction, Followup, HCP
from backend.app.services.groq_service import call_groq_api
from backend.app.tools.compliance import ComplianceValidationTool

class EditInteractionTool:
    """
    Mandatory AI Tool to modify previously logged interactions.
    Updates logs, regenerates summaries if raw inputs change, updates due schedules, 
    and checks compliance, ensuring full data consistency.
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.compliance_tool = ComplianceValidationTool(db)

    async def execute(self, interaction_id: int, modifications: Dict[str, Any], user_id: int) -> Dict[str, Any]:
        interaction = self.db.query(Interaction).filter(Interaction.id == interaction_id).first()
        if not interaction:
            return {"status": "failed", "error": "Interaction not found."}

        # 1. Update basic fields if provided
        if "interaction_type" in modifications:
            interaction.interaction_type = modifications["interaction_type"]
        if "interaction_date" in modifications:
            # Handle date formats
            val = modifications["interaction_date"]
            if isinstance(val, str):
                interaction.interaction_date = datetime.strptime(val, "%Y-%m-%d").date()
            else:
                interaction.interaction_date = val

        # 2. If raw input was updated, completely regenerate LLM summary, compliance check, and follow-ups
        regenerated = False
        if "raw_input" in modifications and modifications["raw_input"] != interaction.raw_input:
            interaction.raw_input = modifications["raw_input"]
            
            # Re-run compliance
            compliance = await self.compliance_tool.execute(interaction.raw_input)
            
            # Re-run entity extraction
            prompt = (
                "Re-analyze this modified healthcare representative meeting notes. "
                "Synthesize a new CRM summary and extract products and sentiment.\n\n"
                f"Meeting Notes: \"{interaction.raw_input}\"\n\n"
                "Return a JSON object with fields:\n"
                "{\n"
                "  \"products_discussed\": [\"list of products\"],\n"
                "  \"sentiment\": \"Positive/Neutral/Negative\",\n"
                "  \"summary\": \"concise clinical crm summary (2-3 sentences)\"\n"
                "}\n"
            )
            
            messages = [
                {"role": "system", "content": "You are a clinical CRM database manager. Return ONLY JSON."},
                {"role": "user", "content": prompt}
            ]
            
            try:
                entity_res = await call_groq_api(messages, json_mode=True, db=self.db)
                entities = json.loads(entity_res)
                
                interaction.products_discussed = entities.get("products_discussed", interaction.products_discussed)
                interaction.sentiment = entities.get("sentiment", interaction.sentiment)
                interaction.summary = entities.get("summary", interaction.summary)
            except Exception as e:
                pass
                
            regenerated = True

        # 3. Direct field overrides (if user manually corrected AI output)
        if "summary" in modifications:
            interaction.summary = modifications["summary"]
        if "sentiment" in modifications:
            interaction.sentiment = modifications["sentiment"]
        if "products_discussed" in modifications:
            interaction.products_discussed = modifications["products_discussed"]
        if "follow_up_date" in modifications:
            val = modifications["follow_up_date"]
            if isinstance(val, str):
                interaction.follow_up_date = datetime.strptime(val, "%Y-%m-%d").date()
            else:
                interaction.follow_up_date = val
                
            # Keep related followups table dates in sync
            followup = self.db.query(Followup).filter(Followup.interaction_id == interaction.id).first()
            if followup and interaction.follow_up_date:
                followup.due_date = interaction.follow_up_date
                if "follow_up_description" in modifications:
                    followup.description = modifications["follow_up_description"]
                self.db.add(followup)

        # Update timestamps
        interaction.updated_at = datetime.utcnow()
        self.db.add(interaction)
        self.db.commit()
        self.db.refresh(interaction)

        hcp = self.db.query(HCP).filter(HCP.id == interaction.hcp_id).first()

        return {
            "status": "success",
            "interaction_id": interaction.id,
            "summary": interaction.summary,
            "sentiment": interaction.sentiment,
            "products_discussed": interaction.products_discussed,
            "follow_up_date": interaction.follow_up_date.isoformat() if interaction.follow_up_date else None,
            "regenerated_by_ai": regenerated,
            "hcp_name": hcp.name if hcp else "Dr. Unknown"
        }
