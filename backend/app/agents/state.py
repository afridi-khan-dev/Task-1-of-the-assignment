from typing import TypedDict, Dict, Any, List, Optional

class AgentState(TypedDict):
    # Core User Details
    user_input: str
    user_id: int
    hcp_id: Optional[int]
    interaction_id: Optional[int]
    
    # Mode details
    mode: str  # "log", "edit", "chat"
    
    # LLM Extracted Details
    extracted_entities: Dict[str, Any]
    interaction_summary: str
    sentiment: str
    
    # Specialized analysis
    compliance_status: Dict[str, Any]      # {is_compliant: bool, violations: List[str]}
    follow_up_recommendation: Dict[str, Any] # {description: str, due_date: str, priority: str}
    
    # Orchestration State
    next_action: str  # routing decision
    database_status: str  # "success", "failed", "pending"
    chat_history: List[Dict[str, str]]
    
    # Final Output
    final_output: str
