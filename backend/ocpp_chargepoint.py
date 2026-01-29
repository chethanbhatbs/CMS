"""OCPP Charge Point Handler - Handles OCPP 1.6 messages"""

import asyncio
from datetime import datetime, timezone
from ocpp.v16 import ChargePoint as CP
from ocpp.v16 import call_result
from ocpp.v16.enums import RegistrationStatus, ChargePointStatus, ChargePointErrorCode
from motor.motor_asyncio import AsyncIOMotorClient
import os

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'test_database')]

class ChargePoint(CP):
    """OCPP 1.6 Charge Point Handler"""
    
    async def on_boot_notification(self, charge_point_vendor, charge_point_model, **kwargs):
        """Handle BootNotification from charge point"""
        print(f"BootNotification from {self.id}: {charge_point_vendor} {charge_point_model}")
        
        # Update charge point in database
        await db.charge_points.update_one(
            {"charge_point_id": self.id},
            {"$set": {
                "is_online": True,
                "last_heartbeat": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Log boot notification
        await db.charger_logs.insert_one({
            "charge_point_id": self.id,
            "log_level": "INFO",
            "message": f"Boot Notification: {charge_point_vendor} {charge_point_model}",
            "action": "BootNotification",
            "metadata": kwargs,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        return call_result.BootNotificationPayload(
            current_time=datetime.now(timezone.utc).isoformat(),
            interval=300,  # Heartbeat interval in seconds
            status=RegistrationStatus.accepted
        )
    
    async def on_heartbeat(self, **kwargs):
        """Handle Heartbeat from charge point"""
        print(f"Heartbeat from {self.id}")
        
        # Update last heartbeat
        await db.charge_points.update_one(
            {"charge_point_id": self.id},
            {"$set": {
                "last_heartbeat": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        return call_result.HeartbeatPayload(
            current_time=datetime.now(timezone.utc).isoformat()
        )
    
    async def on_status_notification(self, connector_id, error_code, status, **kwargs):
        """Handle StatusNotification from charge point"""
        print(f"StatusNotification from {self.id} Connector {connector_id}: {status}")
        
        # Store connector status
        await db.connector_status.update_one(
            {"charge_point_id": self.id, "connector_id": connector_id},
            {"$set": {
                "status": status,
                "error_code": error_code,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "info": kwargs.get("info", ""),
                "vendor_id": kwargs.get("vendor_id", ""),
                "vendor_error_code": kwargs.get("vendor_error_code", "")
            }},
            upsert=True
        )
        
        # Derive overall charge point status from all connectors
        connector_statuses = await db.connector_status.find(
            {"charge_point_id": self.id}
        ).to_list(10)
        
        # Status logic:
        # - If any connector is Faulted -> FAULTED
        # - If any connector is Available -> AVAILABLE
        # - If all are Charging/Preparing -> OCCUPIED
        # - Otherwise -> UNAVAILABLE
        statuses = [c["status"] for c in connector_statuses]
        if "Faulted" in statuses:
            cp_status = "FAULTED"
        elif "Available" in statuses:
            cp_status = "AVAILABLE"
        elif all(s in ["Charging", "Preparing"] for s in statuses):
            cp_status = "OCCUPIED"
        else:
            cp_status = "UNAVAILABLE"
        
        # Update charge point status
        await db.charge_points.update_one(
            {"charge_point_id": self.id},
            {"$set": {
                "status": cp_status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Log status notification
        await db.charger_logs.insert_one({
            "charge_point_id": self.id,
            "log_level": "INFO" if error_code == ChargePointErrorCode.no_error else "WARNING",
            "message": f"Connector {connector_id} status: {status}",
            "action": "StatusNotification",
            "metadata": {"connector_id": connector_id, "error_code": error_code, **kwargs},
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        return call_result.StatusNotificationPayload()
    
    async def on_start_transaction(self, connector_id, id_tag, meter_start, timestamp, **kwargs):
        """Handle StartTransaction from charge point"""
        print(f"StartTransaction from {self.id} Connector {connector_id}")
        
        transaction_id = int(datetime.now(timezone.utc).timestamp() * 1000)
        
        # Create session in database
        await db.charging_sessions.insert_one({
            "session_id": str(transaction_id),
            "charge_point_id": self.id,
            "connector_id": connector_id,
            "rfid_tag": id_tag,
            "start_time": timestamp,
            "start_meter_kwh": meter_start / 1000,  # Convert Wh to kWh
            "status": "ACTIVE",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        })
        
        # Update session count
        await db.charge_points.update_one(
            {"charge_point_id": self.id},
            {"$inc": {"total_sessions": 1}}
        )
        
        return call_result.StartTransactionPayload(
            transaction_id=transaction_id,
            id_tag_info={'status': 'Accepted'}
        )
    
    async def on_stop_transaction(self, meter_stop, timestamp, transaction_id, **kwargs):
        """Handle StopTransaction from charge point"""
        print(f"StopTransaction from {self.id}: Transaction {transaction_id}")
        
        # Update session
        session = await db.charging_sessions.find_one({"session_id": str(transaction_id)})
        if session:
            energy_kwh = (meter_stop - (session["start_meter_kwh"] * 1000)) / 1000
            
            await db.charging_sessions.update_one(
                {"session_id": str(transaction_id)},
                {"$set": {
                    "end_time": timestamp,
                    "end_meter_kwh": meter_stop / 1000,
                    "energy_kwh": energy_kwh,
                    "status": "COMPLETED",
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            # Update total energy
            await db.charge_points.update_one(
                {"charge_point_id": self.id},
                {"$inc": {"total_energy_kwh": energy_kwh}}
            )
        
        return call_result.StopTransactionPayload()
    
    async def on_meter_values(self, connector_id, meter_value, **kwargs):
        """Handle MeterValues from charge point"""
        # Log meter values (optional, can be frequent)
        return call_result.MeterValuesPayload()