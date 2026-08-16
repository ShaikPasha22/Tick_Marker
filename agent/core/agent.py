from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langgraph.prebuilt import create_react_agent
from core.config import settings

def create_agent_executor(auth_token: str):
    llm = ChatOpenAI(
        model="gpt-4o-mini",
        api_key=settings.OPENROUTER_API_KEY,
        base_url="https://openrouter.ai/api/v1",
        temperature=0
    )

    # Recreate tools with the bound token to avoid passing it to the LLM
    from langchain_core.tools import StructuredTool
    from tools.habit_tools import create_habit, complete_habit
    from tools.finance_tools import create_expense, get_finance_summary
    from tools.trip_tools import create_trip, add_trip_expense

    def _create_habit(name: str, frequency: str = 'daily'):
        return create_habit.invoke({"name": name, "frequency": frequency, "auth_token": auth_token})
    
    def _complete_habit(habit_name: str):
        return complete_habit.invoke({"habit_name": habit_name, "auth_token": auth_token})

    def _create_expense(amount: float, category: str, date: str, description: str = ""):
        return create_expense.invoke({"amount": amount, "category": category, "date": date, "description": description, "auth_token": auth_token})

    def _get_finance_summary():
        return get_finance_summary.invoke({"auth_token": auth_token})

    def _create_trip(destination: str, start_date: str, end_date: str, budget: float = 0):
        return create_trip.invoke({"destination": destination, "start_date": start_date, "end_date": end_date, "budget": budget, "auth_token": auth_token})

    def _add_trip_expense(amount: float, category: str, trip_name: str = "", trip_id: str = "", paid_by: str = "Me"):
        return add_trip_expense.invoke({"amount": amount, "category": category, "trip_name": trip_name, "trip_id": trip_id, "paid_by": paid_by, "auth_token": auth_token})

    bound_tools = [
        StructuredTool.from_function(func=_create_habit, name="create_habit", description=create_habit.description, args_schema=create_habit.args_schema),
        StructuredTool.from_function(func=_complete_habit, name="complete_habit", description=complete_habit.description, args_schema=complete_habit.args_schema),
        StructuredTool.from_function(func=_create_expense, name="create_expense", description=create_expense.description, args_schema=create_expense.args_schema),
        StructuredTool.from_function(func=_get_finance_summary, name="get_finance_summary", description=get_finance_summary.description, args_schema=get_finance_summary.args_schema),
        StructuredTool.from_function(func=_create_trip, name="create_trip", description=create_trip.description, args_schema=create_trip.args_schema),
        StructuredTool.from_function(func=_add_trip_expense, name="add_trip_expense", description=add_trip_expense.description, args_schema=add_trip_expense.args_schema),
    ]

    system_prompt = """You are TickMark's intelligent application assistant.
You have access to tools that operate on the user's TickMark data.

RULES:
1. Use tools instead of guessing. Never claim an action succeeded unless the tool confirms success.
2. Ask ONLY for information that is actually missing.
3. Never invent application capabilities.
4. Never expose internal reasoning or raw JSON to the user.
5. If the user asks for destructive operations, confirm first before executing.
6. If the user corrects you, update the context and use the tool again.
7. Always provide a concise natural language response summarizing what you did.

Current UI Context: {context}"""

    # create_react_agent from langgraph uses system_prompt and messages state natively
    return create_react_agent(llm, tools=bound_tools, prompt=system_prompt)
