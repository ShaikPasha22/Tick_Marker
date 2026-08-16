import requests
from core.config import settings

class TickMarkAPIClient:
    def __init__(self, auth_token: str):
        self.base_url = settings.NODE_API_URL
        self.headers = {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }

    def get(self, endpoint: str, params=None):
        url = f"{self.base_url}{endpoint}"
        response = requests.get(url, headers=self.headers, params=params)
        response.raise_for_status()
        return response.json()

    def post(self, endpoint: str, data=None):
        url = f"{self.base_url}{endpoint}"
        response = requests.post(url, headers=self.headers, json=data)
        response.raise_for_status()
        return response.json()

    def put(self, endpoint: str, data=None):
        url = f"{self.base_url}{endpoint}"
        response = requests.put(url, headers=self.headers, json=data)
        response.raise_for_status()
        return response.json()

    def delete(self, endpoint: str):
        url = f"{self.base_url}{endpoint}"
        response = requests.delete(url, headers=self.headers)
        response.raise_for_status()
        return response.json()
