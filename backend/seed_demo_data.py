"""Seed demo data for CMS"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
import uuid
import random

load_dotenv('.env')

async def seed_demo_data():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("🌱 Seeding demo data...\n")
    
    # Seed Account Transactions
    print("Adding Account Transactions...")
    account_transactions = [
        {
            "id": str(uuid.uuid4()),
            "transaction_id": f"TXN-{random.randint(10000, 99999)}",
            "user_id": "user-001",
            "user_name": "John Doe",
            "phone": "+1234567890",
            "gateway_id": f"stripe_pi_{random.randint(100000, 999999)}",
            "session_id": None,
            "transaction_type": "CREDIT",
            "amount": 50.00,
            "currency": "USD",
            "status": "COMPLETED",
            "payment_method": "CARD",
            "description": "Wallet top-up",
            "invoice_url": None,
            "created_at": (datetime.now(timezone.utc) - timedelta(days=2)).isoformat(),
            "updated_at": (datetime.now(timezone.utc) - timedelta(days=2)).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "transaction_id": f"TXN-{random.randint(10000, 99999)}",
            "user_id": "user-002",
            "user_name": "Jane Smith",
            "phone": "+1987654321",
            "gateway_id": f"stripe_pi_{random.randint(100000, 999999)}",
            "session_id": None,
            "transaction_type": "DEBIT",
            "amount": 25.50,
            "currency": "USD",
            "status": "COMPLETED",
            "payment_method": "WALLET",
            "description": "Charging session payment",
            "invoice_url": None,
            "created_at": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat(),
            "updated_at": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "transaction_id": f"TXN-{random.randint(10000, 99999)}",
            "user_id": "user-003",
            "user_name": "Mike Johnson",
            "phone": "+1555123456",
            "gateway_id": f"stripe_pi_{random.randint(100000, 999999)}",
            "session_id": None,
            "transaction_type": "CREDIT",
            "amount": 100.00,
            "currency": "USD",
            "status": "COMPLETED",
            "payment_method": "BANK_TRANSFER",
            "description": "Initial account setup",
            "invoice_url": None,
            "created_at": (datetime.now(timezone.utc) - timedelta(days=5)).isoformat(),
            "updated_at": (datetime.now(timezone.utc) - timedelta(days=5)).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "transaction_id": f"TXN-{random.randint(10000, 99999)}",
            "user_id": "user-001",
            "user_name": "John Doe",
            "phone": "+1234567890",
            "gateway_id": None,
            "session_id": None,
            "transaction_type": "DEBIT",
            "amount": 15.75,
            "currency": "USD",
            "status": "PENDING",
            "payment_method": "CARD",
            "description": "Charging fee",
            "invoice_url": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "transaction_id": f"TXN-{random.randint(10000, 99999)}",
            "user_id": "user-004",
            "user_name": "Sarah Wilson",
            "phone": "+1444555666",
            "gateway_id": f"stripe_pi_{random.randint(100000, 999999)}",
            "session_id": None,
            "transaction_type": "CREDIT",
            "amount": 75.00,
            "currency": "USD",
            "status": "COMPLETED",
            "payment_method": "CARD",
            "description": "Monthly subscription",
            "invoice_url": None,
            "created_at": (datetime.now(timezone.utc) - timedelta(hours=12)).isoformat(),
            "updated_at": (datetime.now(timezone.utc) - timedelta(hours=12)).isoformat()
        }
    ]
    
    for txn in account_transactions:
        await db.account_transactions.insert_one(txn)
    print(f"✓ Added {len(account_transactions)} account transactions")
    
    # Verify Charge Points exist
    print("\nChecking Charge Points...")
    cps = await db.charge_points.find({}).to_list(100)
    print(f"✓ Found {len(cps)} charge points in database")
    
    if len(cps) < 2:
        print("\n⚠️  Less than 2 CPs found. Creating demo CPs...")
        
        # Get location and models
        location = await db.charging_locations.find_one({})
        oem = await db.oems.find_one({})
        model = await db.charger_models.find_one({})
        
        if location and oem and model:
            demo_cp = {
                "id": str(uuid.uuid4()),
                "charge_point_id": "CP-DEMO-001",
                "name": "Demo Fast Charger",
                "location_id": location["id"],
                "oem_id": oem["id"],
                "charger_model_id": model["id"],
                "serial_number": "SN-DEMO-12345",
                "firmware_version_override": None,
                "websocket_id": None,
                "go_live_date": None,
                "status": "UNAVAILABLE",
                "is_online": False,
                "last_heartbeat": None,
                "total_energy_kwh": 125.5,
                "total_sessions": 23,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            await db.charge_points.insert_one(demo_cp)
            
            # Create connector statuses
            for config in model.get("connector_configs", []):
                await db.connector_status.insert_one({
                    "charge_point_id": "CP-DEMO-001",
                    "connector_id": config["connector_number"],
                    "status": "Unknown",
                    "error_code": "NoError",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })
            
            print("✓ Created demo charge point")
    
    print("\n✅ Demo data seeded successfully!")
    print("\n=== Summary ===")
    print(f"Account Transactions: {len(account_transactions)}")
    print(f"Charge Points: {len(cps) + (1 if len(cps) < 2 else 0)}")
    
    client.close()

asyncio.run(seed_demo_data())
