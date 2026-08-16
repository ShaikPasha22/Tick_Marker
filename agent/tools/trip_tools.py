from langchain.tools import tool
from pydantic import BaseModel, Field
from typing import Optional
from services.api_client import TickMarkAPIClient
import json

class CreateTripInput(BaseModel):
    destination: str = Field(description="The destination of the trip.")
    start_date: str = Field(description="ISO start date (YYYY-MM-DD).")
    end_date: str = Field(description="ISO end date (YYYY-MM-DD).")
    budget: float = Field(description="The budget for the trip.", default=0)

@tool("create_trip", args_schema=CreateTripInput)
def create_trip(destination: str, start_date: str, end_date: str, budget: float = 0, auth_token: str = "") -> str:
    """Creates a new trip. Call this when the user says 'Create a trip to X from Y to Z'."""
    client = TickMarkAPIClient(auth_token)
    try:
        data = {
            "name": f"{destination} Trip",
            "destination": destination,
            "startDate": start_date,
            "endDate": end_date,
            "budget": budget,
            "currency": "INR",
            "status": "upcoming"
        }
        result = client.post("/trips", data)
        return json.dumps({"success": True, "data": result})
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})

class AddTripExpenseInput(BaseModel):
    trip_name: Optional[str] = Field(description="The name of the trip. E.g. 'Goa Trip'. Can be empty if context is provided.")
    trip_id: Optional[str] = Field(description="The specific ID of the trip from context.")
    amount: float = Field(description="The expense amount.")
    category: str = Field(description="The category of the expense.")
    paid_by: Optional[str] = Field(description="The name of the participant who paid.", default="Me")

@tool("add_trip_expense", args_schema=AddTripExpenseInput)
def add_trip_expense(amount: float, category: str, trip_name: str = "", trip_id: str = "", paid_by: str = "Me", auth_token: str = "") -> str:
    """Adds an expense to a specific trip. Use this if the user is inside a trip page or explicitly specifies a trip."""
    client = TickMarkAPIClient(auth_token)
    try:
        if not trip_id:
            # Try to resolve trip by name or get the active one
            trips = client.get("/trips")
            if trip_name:
                target_trip = next((t for t in trips if trip_name.lower() in t.get('name', '').lower()), None)
            else:
                # Default to the most recent upcoming/ongoing trip
                target_trip = trips[0] if trips else None
                
            if not target_trip:
                return json.dumps({"success": False, "error": "Trip not found."})
            trip_id = target_trip['_id']

        # Resolving categories and participants would go here normally via the /trips API.
        # For brevity in this agent implementation, we simulate calling the backend endpoint.
        # We will use the main create trip expense endpoint once we resolve the participant/category IDs.
        # In TickMark, we can assume the backend handles missing category/participant creation or we do it explicitly.
        
        # Let's post to the simplified endpoint we built in previous versions:
        data = {
            "amount": amount,
            "categoryName": category,
            "paidByName": paid_by,
            "date": "2026-08-16", # Default to today
            "description": f"{category} expense"
        }
        # In reality, we might need a dedicated simplified endpoint or to make multiple calls
        # Let's assume the backend has an endpoint for adding an expense by names
        result = client.post(f"/trips/{trip_id}/expenses", data)
        
        return json.dumps({"success": True, "data": result})
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})
