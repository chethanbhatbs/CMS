import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime, timezone
import uuid
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def seed_admin():
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    # Check if admin already exists
    existing_admin = await db.users.find_one({"email": "admin@cms.com"})
    if existing_admin:
        print("✓ Admin user already exists")
        print(f"  Email: admin@cms.com")
        client.close()
        return
    
    # Create admin user
    admin_user = {
        "id": str(uuid.uuid4()),
        "email": "admin@cms.com",
        "password_hash": pwd_context.hash("admin123"),
        "full_name": "System Administrator",
        "role": "SUPER_ADMIN",
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(admin_user)
    print("✓ Admin user created successfully!")
    print("\n=== Default Login Credentials ===")
    print("Email: admin@cms.com")
    print("Password: admin123")
    print("=================================")
    print("\n⚠️  Please change the password after first login!")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_admin())