import os
from dotenv import load_dotenv

# Try to load the .env from the root of the server if it exists
# In the original structure, the user had server/.env
load_dotenv(os.path.join(os.path.dirname(__file__), '../../server/.env'))

class Settings:
    OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY', '')
    NODE_API_URL = os.getenv('NODE_API_URL', 'http://localhost:5000/api')
    AGENT_MEMORY_TTL_MINUTES = int(os.getenv('AGENT_MEMORY_TTL_MINUTES', '20'))

settings = Settings()
