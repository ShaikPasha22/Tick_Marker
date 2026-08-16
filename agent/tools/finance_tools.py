from langchain.tools import tool
from pydantic import BaseModel, Field
from typing import Optional
from services.api_client import TickMarkAPIClient
import json

class CreateExpenseInput(BaseModel):
    amount: float = Field(description="The amount of the expense.")
    category: str = Field(description="The category of the expense. E.g., 'Food', 'Petrol'.")
    date: str = Field(description="ISO date string (YYYY-MM-DD) for the expense.")
    description: Optional[str] = Field(default="", description="Description of the expense.")

@tool("create_expense", args_schema=CreateExpenseInput)
def create_expense(amount: float, category: str, date: str, description: str = "", auth_token: str = "") -> str:
    """Creates a personal expense. Do NOT use this for trip expenses. For trips, use add_trip_expense."""
    client = TickMarkAPIClient(auth_token)
    try:
        # Resolve category ID
        categories = client.get("/finance/categories")
        target_cat = next((c for c in categories if category.lower() in c.get('name', '').lower()), None)
        
        category_id = None
        if target_cat:
            category_id = target_cat['_id']
        else:
            # Create a new category if not found
            new_cat = client.post("/finance/categories", {"name": category, "type": "expense", "color": "#ff0000"})
            category_id = new_cat.get('data', {}).get('_id') or new_cat.get('_id')

        data = {
            "amount": amount,
            "categoryId": category_id,
            "date": date,
            "description": description or f"{category} Expense",
            "type": "expense"
        }
        result = client.post("/finance/transactions", data)
        return json.dumps({"success": True, "data": result})
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})

class GetFinanceSummaryInput(BaseModel):
    pass

@tool("get_finance_summary", args_schema=GetFinanceSummaryInput)
def get_finance_summary(auth_token: str = "") -> str:
    """Retrieves the user's finance summary including balance, total income, and total expense."""
    client = TickMarkAPIClient(auth_token)
    try:
        result = client.get("/finance/dashboard")
        return json.dumps({"success": True, "data": result})
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})
