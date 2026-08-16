from fastapi import FastAPI, HTTPException, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from schemas.request import CommandRequest
from schemas.responses import AgentResponse
from core.agent import create_agent_executor
from core.memory import memory_store
from langchain_core.messages import HumanMessage, AIMessage

app = FastAPI(title="TickMark Agent Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/agent/command", response_model=AgentResponse)
async def process_command(request: CommandRequest, authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")
    
    auth_token = authorization.split(" ")[1]
    
    executor = create_agent_executor(auth_token)
    memory = memory_store.get_memory(request.session_id)
    
    # Process history from UI if provided, otherwise rely on backend memory
    # Actually, we can just use the memory directly. The UI sends `text`.
    
    try:
        chat_history = memory.get("chat_history", [])
        
        # Prepare context message if available
        context_msg = f"Current UI Context: {request.context}\n" if request.context else ""
        
        messages = chat_history + [HumanMessage(content=context_msg + request.text)]
        
        result = executor.invoke({"messages": messages})
        
        # The output message is the last message in result["messages"]
        output_msg = result["messages"][-1].content
        
        # Save context to memory
        memory["chat_history"].extend([
            HumanMessage(content=request.text),
            AIMessage(content=output_msg)
        ])
        
        return AgentResponse(
            status="success",
            message=output_msg,
            action=None,
            requires_input=False,
            missing_fields=[]
        )
    except Exception as e:
        return AgentResponse(
            status="error",
            message=f"An error occurred: {str(e)}",
            action=None,
            requires_input=False,
            missing_fields=[]
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
