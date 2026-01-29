"""OCPP WebSocket Server - Handles charge point connections"""

import asyncio
from fastapi import WebSocket, WebSocketDisconnect, APIRouter
from ocpp_chargepoint import ChargePoint
from ocpp_registry import registry
import logging

logger = logging.getLogger(__name__)

# Create OCPP router
ocpp_router = APIRouter()

@ocpp_router.websocket("/ocpp/{cp_id}")
async def ocpp_websocket_endpoint(websocket: WebSocket, cp_id: str):
    """OCPP 1.6 WebSocket endpoint for charge points"""
    # Accept connection with OCPP 1.6 subprotocol
    await websocket.accept(subprotocol="ocpp1.6")
    logger.info(f"CP {cp_id} connected via WebSocket")
    
    # Create ChargePoint instance
    cp = ChargePoint(cp_id, websocket)
    
    # Register connection
    registry.add(cp_id, cp)
    
    try:
        # Start OCPP message loop
        await cp.start()
    except WebSocketDisconnect:
        logger.info(f"CP {cp_id} disconnected")
    except Exception as e:
        logger.error(f"Error with CP {cp_id}: {e}")
    finally:
        # Cleanup
        registry.remove(cp_id)
        
        # Update database
        from motor.motor_asyncio import AsyncIOMotorClient
        import os
        from datetime import datetime, timezone
        
        mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
        client = AsyncIOMotorClient(mongo_url)
        db = client[os.environ.get('DB_NAME', 'test_database')]
        
        await db.charge_points.update_one(
            {"charge_point_id": cp_id},
            {"$set": {"is_online": False, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        client.close()
