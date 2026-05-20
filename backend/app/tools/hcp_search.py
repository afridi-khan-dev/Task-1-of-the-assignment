from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Dict, Any
from backend.app.models import HCP

class HcpSearchTool:
    """
    Searches the database for Healthcare Professionals (HCPs) matching terms like name, clinic, or specialty.
    Used by the agent to determine if a doctor exists or must be registered.
    """
    
    def __init__(self, db: Session):
        self.db = db

    def execute(self, query_term: str) -> List[Dict[str, Any]]:
        """
        Performs a search on the name, specialty, or hospital of HCPs.
        """
        if not query_term or len(query_term.strip()) < 2:
            return []
            
        term = f"%{query_term.strip()}%"
        
        results = self.db.query(HCP).filter(
            or_(
                HCP.name.like(term),
                HCP.specialty.like(term),
                HCP.hospital.like(term),
                HCP.city.like(term)
            )
        ).all()
        
        hcp_list = []
        for h in results:
            hcp_list.append({
                "id": h.id,
                "name": h.name,
                "specialty": h.specialty,
                "hospital": h.hospital,
                "city": h.city,
                "email": h.email,
                "phone": h.phone,
                "priority": h.priority,
                "status": h.status
            })
            
        return hcp_list
