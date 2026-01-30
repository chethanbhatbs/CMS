#!/usr/bin/env python3
"""
Local Development Startup Script for macOS
Handles graceful fallback if MongoDB is not available
"""

import os
import sys
from pathlib import Path

# Ensure we're in the backend directory
backend_dir = Path(__file__).parent
os.chdir(backend_dir)

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Check if MongoDB is required or mock mode
USE_MOCK_DB = os.getenv('USE_MOCK_DB', 'false').lower() == 'true'

if not USE_MOCK_DB:
    # Try to connect to MongoDB
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        
        mongo_url = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
        print(f"🔗 Attempting to connect to MongoDB: {mongo_url}")
        
        client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=2000)
        # Test connection
        import asyncio
        asyncio.get_event_loop().run_until_complete(client.server_info())
        print("✅ MongoDB connection successful!")
        client.close()
        
    except Exception as e:
        print(f"\n⚠️  MongoDB connection failed: {e}")
        print("\nOptions:")
        print("1. Install and start MongoDB:")
        print("   brew install mongodb-community")
        print("   brew services start mongodb-community")
        print("\n2. Use Docker:")
        print("   docker run -d -p 27017:27017 --name mongodb mongo:latest")
        print("\n3. Continue without database (mock mode):")
        print("   Set USE_MOCK_DB=true in .env")
        print("\n❌ Exiting. Please start MongoDB or enable mock mode.")
        sys.exit(1)

# Check if .env exists
if not Path('.env').exists():
    print("⚠️  .env file not found!")
    print("Creating .env from .env.example...")
    
    if Path('.env.example').exists():
        import shutil
        shutil.copy('.env.example', '.env')
        print("✅ .env created. Please review and update if needed.")
    else:
        print("❌ .env.example not found. Creating minimal .env...")
        with open('.env', 'w') as f:
            f.write(f"""MONGO_URL=mongodb://localhost:27017
DB_NAME=cms_local
JWT_SECRET_KEY={os.urandom(32).hex()}
CORS_ORIGINS=http://localhost:3000
USE_MOCK_DB=false
""")
        print("✅ Minimal .env created.")

print("\n" + "="*60)
print("🚀 Starting FastAPI Server for Local Development")
print("="*60)
print(f"Backend: http://localhost:8001")
print(f"API Docs: http://localhost:8001/docs")
print(f"OCPP WebSocket: ws://localhost:8001/ocpp/{{cp_id}}")
print("="*60 + "\n")

# Start uvicorn
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )
