from pydantic import BaseModel
from typing import Optional, Dict, Any, List

class CommandMessage(BaseModel):
    role: str
    content: str

class CommandRequest(BaseModel):
    text: str
    session_id: str
    context: Optional[Dict[str, Any]] = None
    history: Optional[List[CommandMessage]] = None
