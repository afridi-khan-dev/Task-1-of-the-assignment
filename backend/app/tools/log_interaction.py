from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
import json
from datetime import datetime, date
from backend.app.models import HCP, Interaction, Followup, Product
from backend.app.services.groq_service import call_groq_api
from backend.app.tools.compliance import ComplianceValidationTool
from backend.app.tools.followups import FollowUpRecommendationTool

class LogInteractionTool:
    """
    Mandatory AI Tool that processes natural language inputs, extracts entities,
    finds or registers HCPs, runs compliance checks, saves interaction entries, 
    and provisions follow-up tasks in the database.
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.compliance_tool = ComplianceValidationTool(db)
        self.followup_tool = FollowUpRecommendationTool(db)

    async def execute(self, text: str, user_id: int, interaction_date: Optional[date] = None) -> Dict[str, Any]:
        """
        Parses text, checks compliance, resolves HCP, logs in DB, and generates follow-ups.
        """
        # 1. Run Compliance Audit First
        compliance = await self.compliance_tool.execute(text)
        
        # 2. Extract Entities via Groq
        prompt = (
            "You are a medical CRM entity extractor. Parse the field representative's notes and extract entities.\n\n"
            "Meeting Notes:\n"
            f"\"{text}\"\n\n"
            "Return a strictly structured JSON object with the following fields:\n"
            "{\n"
            "  \"hcp_name\": \"Extracted Full Doctor Name (e.g. Dr. Amit Sharma)\",\n"
            "  \"specialty\": \"Extracted medical specialty (e.g. Cardiology, Endocrinology, Oncology)\",\n"
            "  \"hospital\": \"Extracted Hospital / Clinic (e.g. Apollo Hospital, Mayo Clinic)\",\n"
            "  \"city\": \"Extracted city (e.g. Mumbai, New York, default to New York if unknown)\",\n"
            "  \"products_discussed\": [\"list of pharmaceutical product names discussed (e.g. Cardiox, GlycaCare, Lipidex, NephroGard)\"],\n"
            "  \"interaction_type\": \"In-Person / Video Call / Email / Phone (deduce from text, default In-Person)\",\n"
            "  \"sentiment\": \"Positive / Neutral / Negative (sentiment of doctor's engagement)\",\n"
            "  \"summary\": \"A concise, clinical-style CRM interaction summary (2-3 sentences)\"\n"
            "}\n"
        )
        
        messages = [
            {"role": "system", "content": "You are a clinical database agent. Return ONLY valid JSON objects matching the schema."},
            {"role": "user", "content": prompt}
        ]
        
        try:
            entity_response = await call_groq_api(messages, json_mode=True, db=self.db)
            entities = json.loads(entity_response)
        except Exception as e:
            # Fallback mock/simulated entities
            entities = {
                "hcp_name": "Dr. Unknown",
                "specialty": "General Practice",
                "hospital": "Local Clinic",
                "city": "Unknown",
                "products_discussed": [],
                "interaction_type": "In-Person",
                "sentiment": "Neutral",
                "summary": f"Field rep met with HCP. Raw text: {text[:100]}"
            }

        # 3. Resolve or Register HCP
        hcp_name_clean = entities.get("hcp_name", "Dr. Unknown").replace("Dr.", "").strip()
        hcp = self.db.query(HCP).filter(HCP.name.like(f"%{hcp_name_clean}%")).first()
        
        if not hcp:
            # Auto-register HCP since AI-first CRM dynamically populates HCP profiles
            hcp = HCP(
                name=entities.get("hcp_name", "Dr. Unknown"),
                specialty=entities.get("specialty", "General Practice"),
                hospital=entities.get("hospital", "Local Hospital"),
                city=entities.get("city", "Unknown City"),
                email=f"{hcp_name_clean.lower().replace(' ', '')}@hospital.com",
                phone="555-0199",
                priority="Medium",
                status="Active"
            )
            self.db.add(hcp)
            self.db.commit()
            self.db.refresh(hcp)

        # 4. Synthesize follow-up recommendation
        followup_rec = await self.followup_tool.execute(hcp.id, text)
        
        # Deduce dates
        meeting_date = interaction_date or date.today()
        fup_date_str = followup_rec.get("due_date")
        try:
            follow_up_date_obj = datetime.strptime(fup_date_str, "%Y-%m-%d").date()
        except Exception:
            follow_up_date_obj = (datetime.utcnow() + date.timedelta(days=14))

        # Ensure products are recorded or exist
        products = entities.get("products_discussed", [])
        for prod_name in products:
            prod_db = self.db.query(Product).filter(Product.name == prod_name).first()
            if not prod_db:
                # dynamically seed new product if referenced by field rep
                new_prod = Product(
                    name=prod_name,
                    category="AI Discovered Specialty",
                    description=f"Auto-generated profile for {prod_name}",
                    indication="Consult medical literature for indications."
                )
                self.db.add(new_prod)
                self.db.commit()

        # 5. Insert Interaction
        interaction = Interaction(
            hcp_id=hcp.id,
            user_id=user_id,
            raw_input=text,
            summary=entities.get("summary", ""),
            interaction_type=entities.get("interaction_type", "In-Person"),
            products_discussed=products,
            sentiment=entities.get("sentiment", "Neutral"),
            interaction_date=meeting_date,
            follow_up_date=follow_up_date_obj
        )
        
        self.db.add(interaction)
        self.db.commit()
        self.db.refresh(interaction)

        # 6. Create Followup Task
        followup = Followup(
            interaction_id=interaction.id,
            hcp_id=hcp.id,
            user_id=user_id,
            description=followup_rec.get("description", "Deliver latest trial results"),
            status="Pending",
            due_date=follow_up_date_obj,
            priority=followup_rec.get("priority", "Medium")
        )
        
        self.db.add(followup)
        self.db.commit()
        self.db.refresh(followup)

        # Return comprehensive result payload
        return {
            "interaction_id": interaction.id,
            "hcp_details": {
                "id": hcp.id,
                "name": hcp.name,
                "specialty": hcp.specialty,
                "hospital": hcp.hospital,
                "city": hcp.city
            },
            "extracted_entities": entities,
            "compliance_status": compliance,
            "follow_up_recommendation": followup_rec,
            "status": "success"
        }
