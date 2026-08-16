from pydantic import BaseModel
from typing import Literal, Optional, List, Dict, Any

class AgentResponse(BaseModel):
    status: Literal["success", "needs_input", "needs_confirmation", "cancelled", "error"]
    message: str
    action: Optional[str] = None
    requires_input: bool = False
    requires_confirmation: bool = False
    missing_fields: List[str] = []
    data: Optional[Dict[str, Any]] = None
