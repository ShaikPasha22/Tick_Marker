import time
from typing import Dict, Any, List

class MemoryStore:
    def __init__(self, ttl_minutes: int = 20):
        self.store: Dict[str, Dict[str, Any]] = {}
        self.ttl_seconds = ttl_minutes * 60

    def get_memory(self, session_id: str) -> Dict[str, Any]:
        current_time = time.time()
        
        # Cleanup stale memories
        stale_keys = [
            sid for sid, data in self.store.items() 
            if current_time - data['last_accessed'] > self.ttl_seconds
        ]
        for key in stale_keys:
            del self.store[key]

        if session_id not in self.store:
            self.store[session_id] = {
                'chat_history': [],
                'last_accessed': current_time
            }
        
        self.store[session_id]['last_accessed'] = current_time
        return self.store[session_id]

    def clear_memory(self, session_id: str):
        if session_id in self.store:
            del self.store[session_id]

# Singleton instance
memory_store = MemoryStore()
