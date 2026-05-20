from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
import json
from backend.app.services.groq_service import call_groq_api

class ComplianceValidationTool:
    """
    Audits and validates the compliance of interaction transcripts with pharma regulatory standards.
    Checks for:
    - Bribes, incentives, or personal gifts.
    - Unsanctioned off-label promotions.
    - False clinical efficacy or cure assertions.
    """
    
    def __init__(self, db: Optional[Session] = None):
        self.db = db

    async def execute(self, text: str) -> Dict[str, Any]:
        prompt = (
            "You are a pharmaceutical compliance audit bot. Analyze the following field representative's "
            "meeting notes and flag any violations of PhRMA, FDA, and anti-kickback compliance regulations.\n\n"
            "Particularly check for:\n"
            "1. Bribery/Incentives: Offering doctors direct cash, personal gifts, vacations, or lunches in exchange for prescribing products.\n"
            "2. Off-label Marketing: Promoting a drug for unapproved indications (e.g., promising Cardiox cures cancer).\n"
            "3. Absolute Claims: Claims of 100% cure rate, miracle remedies, or absolute results lacking clinical trials.\n\n"
            "Return a strictly structured JSON object with the following fields:\n"
            "{\n"
            "  \"is_compliant\": bool,\n"
            "  \"violations\": [\"list of specific descriptions of violations found, if any\"],\n"
            "  \"regulatory_risk_score\": float (between 0.0 safe and 1.0 critical violation)\n"
            "}\n\n"
            f"Meeting Notes: \"{text}\"\n"
        )
        
        messages = [
            {"role": "system", "content": "You are a pharma compliance auditor. Return ONLY a valid JSON object."},
            {"role": "user", "content": prompt}
        ]
        
        try:
            response_text = await call_groq_api(messages, json_mode=True, db=self.db)
            data = json.loads(response_text)
            
            # Standardize output
            return {
                "is_compliant": data.get("is_compliant", True),
                "violations": data.get("violations", []),
                "regulatory_risk_score": data.get("regulatory_risk_score", 0.0)
            }
        except Exception as e:
            # Safe default fallback
            return {
                "is_compliant": True,
                "violations": [],
                "regulatory_risk_score": 0.0
            }
