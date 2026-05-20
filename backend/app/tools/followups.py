from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
import json
from datetime import datetime, timedelta
from backend.app.models import HCP, Interaction
from backend.app.services.groq_service import call_groq_api

class FollowUpRecommendationTool:
    """
    Analyzes historical meeting records and clinician specialties to synthesize relevant follow-up actions.
    """
    
    def __init__(self, db: Session):
        self.db = db

    async def execute(self, hcp_id: int, current_interaction_context: str) -> Dict[str, Any]:
        hcp = self.db.query(HCP).filter(HCP.id == hcp_id).first()
        if not hcp:
            return {
                "description": "Schedule a routine clinical follow-up call.",
                "due_date": (datetime.utcnow() + timedelta(days=14)).date().isoformat(),
                "priority": "Medium",
                "reasoning": "Doctor not found in system; standard onboarding schedule triggered."
            }
            
        # Retrieve past 3 interactions for historical context
        past_interactions = self.db.query(Interaction).filter(
            Interaction.hcp_id == hcp_id
        ).order_by(Interaction.interaction_date.desc()).limit(3).all()
        
        history_text = ""
        for i, idx in enumerate(past_interactions):
            history_text += f"\nPast Meeting {i+1} ({idx.interaction_date}): {idx.summary} (Sentiment: {idx.sentiment})\n"

        prompt = (
            f"You are an AI advisor for pharmaceutical medical sales. Generate a personalized follow-up clinical recommendation for a doctor.\n\n"
            f"Doctor Profile:\n"
            f"- Name: {hcp.name}\n"
            f"- Specialty: {hcp.specialty}\n"
            f"- Hospital/Clinic: {hcp.hospital}\n"
            f"- Segment priority: {hcp.priority}\n\n"
            f"Recent CRM History: {history_text or 'No previous interactions recorded.'}\n\n"
            f"Current Meeting Details: {current_interaction_context}\n\n"
            "Formulate the next clinical discussion topic, educational material to share, or scheduled demo."
            "Return a strictly structured JSON object with the following fields:\n"
            "{\n"
            "  \"description\": \"Specific task description, clinical brochures, or trial papers to send\",\n"
            "  \"due_date\": \"YYYY-MM-DD (format follow up date: default to 14 days from today if not specified)\",\n"
            "  \"priority\": \"High / Medium / Low\",\n"
            "  \"reasoning\": \"Pharma-expert reasoning justifying why this follow-up is relevant for this specific specialty and engagement state\"\n"
            "}\n"
        )
        
        messages = [
            {"role": "system", "content": "You are a life sciences field sales clinical advisor. Return ONLY valid JSON."},
            {"role": "user", "content": prompt}
        ]
        
        try:
            response_text = await call_groq_api(messages, json_mode=True, db=self.db)
            data = json.loads(response_text)
            return {
                "description": data.get("description", "Deliver latest product brochure."),
                "due_date": data.get("due_date", (datetime.utcnow() + timedelta(days=14)).date().isoformat()),
                "priority": data.get("priority", "Medium"),
                "reasoning": data.get("reasoning", "Standard protocol engagement.")
            }
        except Exception as e:
            return {
                "description": "Send follow-up details and Phase III literature regarding product discussion.",
                "due_date": (datetime.utcnow() + timedelta(days=14)).date().isoformat(),
                "priority": "Medium",
                "reasoning": "Standard scheduled clinical follow-up task."
            }
        
