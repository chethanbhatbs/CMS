"""OCPP Connection Registry - Tracks connected charge points"""

class ConnectionRegistry:
    def __init__(self):
        self._registry = {}

    def add(self, cp_id: str, cp):
        """Add a charge point connection"""
        self._registry[cp_id] = cp
        print(f"✓ CP {cp_id} registered")

    def get(self, cp_id: str):
        """Get a charge point connection"""
        return self._registry.get(cp_id)

    def remove(self, cp_id: str):
        """Remove a charge point connection"""
        if cp_id in self._registry:
            self._registry.pop(cp_id)
            print(f"✓ CP {cp_id} removed")

    def get_all(self):
        """Get all connected charge points"""
        return list(self._registry.keys())

    def count(self):
        """Get total connected charge points"""
        return len(self._registry)

# Global registry instance
registry = ConnectionRegistry()