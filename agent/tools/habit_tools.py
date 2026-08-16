from langchain.tools import tool
from pydantic import BaseModel, Field
from typing import Optional
from services.api_client import TickMarkAPIClient
import json

class CreateHabitInput(BaseModel):
    name: str = Field(description="Name of the habit to create.")
    frequency: str = Field(description="Frequency of the habit. E.g., 'daily', 'weekly', 'monthly'. Default is 'daily'.")

@tool("create_habit", args_schema=CreateHabitInput)
def create_habit(name: str, frequency: str = 'daily', auth_token: str = "") -> str:
    """Creates a new habit for the user. Do NOT use this to mark a habit as complete."""
    client = TickMarkAPIClient(auth_token)
    try:
        data = {"name": name, "frequency": frequency}
        result = client.post("/habits", data)
        return json.dumps({"success": True, "data": result})
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})

class CompleteHabitInput(BaseModel):
    habit_name: str = Field(description="The name of the habit to mark as complete.")

@tool("complete_habit", args_schema=CompleteHabitInput)
def complete_habit(habit_name: str, auth_token: str = "") -> str:
    """Marks a habit as complete for today. Use this when the user says 'I finished reading' or 'Mark reading as done'."""
    client = TickMarkAPIClient(auth_token)
    try:
        # First, search for the habit
        habits = client.get("/habits")
        target = next((h for h in habits if habit_name.lower() in h.get('name', '').lower()), None)
        if not target:
            return json.dumps({"success": False, "error": f"Habit '{habit_name}' not found."})
        
        result = client.post(f"/habits/{target['_id']}/complete")
        return json.dumps({"success": True, "data": result})
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})
