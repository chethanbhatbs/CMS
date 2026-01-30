"""OCPP Charge Point Handler - Enhanced with validation and error handling"""

import asyncio
from datetime import datetime, timezone
from ocpp.v16 import ChargePoint as CP
from ocpp.v16 import call_result
from ocpp.v16.enums import RegistrationStatus, ChargePointStatus, ChargePointErrorCode
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging

logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'test_database')]

class ChargePoint(CP):
    """OCPP 1.6 Charge Point Handler with validation"""
    
    async def on_boot_notification(self, charge_point_vendor, charge_point_model, **kwargs):
        """Handle BootNotification from charge point
        
        Validates:
        - CP exists in database
        - Vendor/Model match ChargerModel (warning if mismatch)
        - Unknown CPs are rejected
        """
        logger.info(f"BootNotification from {self.id}: {charge_point_vendor} {charge_point_model}")
        
        # Check if CP exists in database
        cp_record = await db.charge_points.find_one({"charge_point_id": self.id}, {"_id": 0})
        
        if not cp_record:
            # Unknown/unregistered CP
            logger.warning(f"REJECTED: Unknown CP {self.id} attempted to connect")
            
            await db.charger_logs.insert_one({
                "charge_point_id": self.id,
                "log_level": "ERROR",
                "message": f"Boot Notification REJECTED: Unknown CP {self.id}",
                "action": "BootNotification",
                "metadata": {
                    "vendor": charge_point_vendor,
                    "model": charge_point_model,
                    "reason": "CP not registered in CMS",
                    **kwargs
                },
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
            
            return call_result.BootNotificationPayload(
                current_time=datetime.now(timezone.utc).isoformat(),
                interval=0,  # Don't heartbeat
                status=RegistrationStatus.rejected
            )
        
        # Fetch ChargerModel to validate vendor/model
        charger_model = await db.charger_models.find_one(
            {"id": cp_record.get("charger_model_id")}, 
            {"_id": 0}
        )
        
        if charger_model:
            # Get OEM name
            oem = await db.oems.find_one({"id": charger_model.get("oem_id")}, {"_id": 0})
            expected_vendor = oem.get("oem_name") if oem else "Unknown"
            expected_model = charger_model.get("model_name", "Unknown")
            
            # Validate vendor/model match
            if (charge_point_vendor != expected_vendor or 
                charge_point_model != expected_model):
                logger.warning(
                    f"MISMATCH: {self.id} reports {charge_point_vendor}/{charge_point_model} "
                    f"but CMS expects {expected_vendor}/{expected_model}"
                )
                
                await db.charger_logs.insert_one({
                    "charge_point_id": self.id,
                    "log_level": "WARNING",
                    "message": f"Vendor/Model mismatch detected",
                    "action": "BootNotification",
                    "metadata": {
                        "reported_vendor": charge_point_vendor,
                        "reported_model": charge_point_model,
                        "expected_vendor": expected_vendor,
                        "expected_model": expected_model,
                        **kwargs
                    },
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })
        
        # Accept connection and update database
        await db.charge_points.update_one(
            {"charge_point_id": self.id},
            {"$set": {
                "is_online": True,
                "last_heartbeat": datetime.now(timezone.utc).isoformat(),
                "websocket_id": str(id(self)),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Log successful boot
        await db.charger_logs.insert_one({
            "charge_point_id": self.id,
            "log_level": "INFO",
            "message": f"Boot Notification ACCEPTED: {charge_point_vendor} {charge_point_model}",
            "action": "BootNotification",
            "metadata": kwargs,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        logger.info(f"ACCEPTED: {self.id} registered successfully")
        
        return call_result.BootNotificationPayload(
            current_time=datetime.now(timezone.utc).isoformat(),
            interval=300,  # Heartbeat interval in seconds
            status=RegistrationStatus.accepted
        )
    
    async def on_authorize(self, id_tag, **kwargs):
        """Handle Authorize request - Validate RFID
        
        OCPP Behavior:
        - Active RFID → Accepted
        - Inactive/Expired/Unknown RFID → Rejected
        """
        logger.info(f"Authorize request from {self.id} for ID Tag: {id_tag}")
        
        # Validate RFID against database
        rfid_card = await db.rfid_cards.find_one({"rfid_tag": id_tag}, {"_id": 0})
        
        if not rfid_card:
            logger.warning(f"RFID {id_tag} not found in database")
            return call_result.AuthorizePayload(
                id_tag_info={'status': 'Invalid'}
            )
        
        # Check status
        if rfid_card["status"] != "ACTIVE":
            logger.warning(f"RFID {id_tag} is {rfid_card['status']}")
            return call_result.AuthorizePayload(
                id_tag_info={'status': 'Blocked'}
            )
        
        # Check expiry
        if rfid_card.get("expiry_date"):
            expiry = datetime.fromisoformat(rfid_card["expiry_date"]) if isinstance(rfid_card["expiry_date"], str) else rfid_card["expiry_date"]
            if expiry < datetime.now(timezone.utc):
                logger.warning(f"RFID {id_tag} has expired")
                await db.rfid_cards.update_one(
                    {"rfid_tag": id_tag},
                    {"$set": {"status": "EXPIRED"}}
                )
                return call_result.AuthorizePayload(
                    id_tag_info={'status': 'Expired'}
                )
        
        # RFID is valid
        logger.info(f"RFID {id_tag} authorized for user: {rfid_card.get('user_name', 'Unknown')}")
        return call_result.AuthorizePayload(
            id_tag_info={'status': 'Accepted'}
        )
    
    async def on_heartbeat(self, **kwargs):
        """Handle Heartbeat from charge point"""
        logger.debug(f"Heartbeat from {self.id}")
        
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
        """Handle StatusNotification from charge point
        
        OCPP Status Mapping:
        - Available → AVAILABLE
        - Charging/Preparing/Finishing → OCCUPIED
        - Faulted → FAULTED
        - Unavailable → UNAVAILABLE
        - Unknown → UNKNOWN
        """
        logger.info(f"StatusNotification from {self.id} Connector {connector_id}: {status}")
        
        # Normalize OCPP status to CMS enum (uppercase)
        normalized_status = status.upper() if status else "UNKNOWN"
        
        # Map OCPP statuses to CMS enum values
        status_mapping = {
            "AVAILABLE": "AVAILABLE",
            "CHARGING": "OCCUPIED",
            "PREPARING": "OCCUPIED",
            "FINISHING": "OCCUPIED",
            "RESERVED": "OCCUPIED",
            "SUSPENDEDEVSE": "UNAVAILABLE",
            "SUSPENDEDEV": "UNAVAILABLE",
            "FAULTED": "FAULTED",
            "UNAVAILABLE": "UNAVAILABLE"
        }
        
        mapped_status = status_mapping.get(normalized_status, "UNKNOWN")
        
        # Store connector status with mapped value
        await db.connector_status.update_one(
            {"charge_point_id": self.id, "connector_id": connector_id},
            {"$set": {
                "status": mapped_status,
                "ocpp_status": status,  # Keep original OCPP status for reference
                "error_code": error_code,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "info": kwargs.get("info", ""),
                "vendor_id": kwargs.get("vendor_id", ""),
                "vendor_error_code": kwargs.get("vendor_error_code", "")
            }},
            upsert=True
        )
        
        # Derive overall charge point status from ALL connectors
        connector_statuses = await db.connector_status.find(
            {"charge_point_id": self.id}
        ).to_list(10)
        
        if not connector_statuses:
            cp_status = "UNAVAILABLE"
        else:
            statuses = [c["status"] for c in connector_statuses]
            
            # FAULTED has highest priority
            if "Faulted" in statuses:
                cp_status = "FAULTED"
            # Any available makes CP available
            elif "Available" in statuses:
                cp_status = "AVAILABLE"
            # All busy (Charging/Preparing/Finishing/Reserved)
            elif all(s in ["Charging", "Preparing", "Finishing", "Reserved"] for s in statuses):
                cp_status = "OCCUPIED"
            # Mixed busy + unknown or all unavailable
            else:
                cp_status = "UNAVAILABLE"
        
        # Update charge point status (derived, not stored from message directly)
        await db.charge_points.update_one(
            {"charge_point_id": self.id},
            {"$set": {
                "status": cp_status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Log status notification
        log_level = "INFO"
        if error_code != ChargePointErrorCode.no_error:
            log_level = "WARNING" if "Faulted" in statuses else "ERROR"
        
        await db.charger_logs.insert_one({
            "charge_point_id": self.id,
            "log_level": log_level,
            "message": f"Connector {connector_id} status: {status} (CP status derived: {cp_status})",
            "action": "StatusNotification",
            "metadata": {"connector_id": connector_id, "error_code": error_code, **kwargs},
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        logger.info(f"CP {self.id} status derived as {cp_status} from connectors")
        
        return call_result.StatusNotificationPayload()
    
    async def on_start_transaction(self, connector_id, id_tag, meter_start, timestamp, **kwargs):
        """Handle StartTransaction from charge point"""
        logger.info(f"StartTransaction from {self.id} Connector {connector_id}, ID Tag: {id_tag}")
        
        transaction_id = int(datetime.now(timezone.utc).timestamp() * 1000)
        
        # Create session in database
        await db.charging_sessions.insert_one({
            "session_id": str(transaction_id),
            "charge_point_id": self.id,
            "connector_id": connector_id,
            "rfid_tag": id_tag,
            "start_time": timestamp,
            "start_meter_kwh": meter_start / 1000,  # Convert Wh to kWh
            "current_meter_kwh": meter_start / 1000,
            "energy_kwh": 0.0,
            "status": "ACTIVE",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        })
        
        # Update session count
        await db.charge_points.update_one(
            {"charge_point_id": self.id},
            {"$inc": {"total_sessions": 1}}
        )
        
        logger.info(f"Session {transaction_id} started for {self.id}")
        
        return call_result.StartTransactionPayload(
            transaction_id=transaction_id,
            id_tag_info={'status': 'Accepted'}
        )
    
    async def on_stop_transaction(self, meter_stop, timestamp, transaction_id, **kwargs):
        """Handle StopTransaction from charge point"""
        logger.info(f"StopTransaction from {self.id}: Transaction {transaction_id}")
        
        # Find session
        session = await db.charging_sessions.find_one({"session_id": str(transaction_id)})
        
        if session:
            start_meter = session.get("start_meter_kwh", 0) * 1000  # Convert back to Wh
            energy_kwh = (meter_stop - start_meter) / 1000
            
            await db.charging_sessions.update_one(
                {"session_id": str(transaction_id)},
                {"$set": {
                    "end_time": timestamp,
                    "end_meter_kwh": meter_stop / 1000,
                    "energy_kwh": energy_kwh,
                    "stop_reason": kwargs.get("reason", ""),
                    "status": "COMPLETED",
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            # Update total energy
            await db.charge_points.update_one(
                {"charge_point_id": self.id},
                {"$inc": {"total_energy_kwh": energy_kwh}}
            )
            
            logger.info(f"Session {transaction_id} completed: {energy_kwh:.2f} kWh")
        else:
            logger.warning(f"Session {transaction_id} not found for StopTransaction")
        
        return call_result.StopTransactionPayload()
    
    async def on_meter_values(self, connector_id, meter_value, transaction_id=None, **kwargs):
        """Handle MeterValues from charge point
        
        Links to transaction_id and connector_id
        Updates current_meter_kwh in active session
        """
        logger.debug(f"MeterValues from {self.id} Connector {connector_id}")
        
        # Extract power and energy from meter_value
        if transaction_id:
            # Update active session with latest meter value
            for sampled_value in meter_value:
                for sample in sampled_value.get('sampled_value', []):
                    if sample.get('measurand') == 'Energy.Active.Import.Register':
                        current_kwh = float(sample.get('value', 0)) / 1000
                        
                        await db.charging_sessions.update_one(
                            {"session_id": str(transaction_id), "status": "ACTIVE"},
                            {"$set": {
                                "current_meter_kwh": current_kwh,
                                "updated_at": datetime.now(timezone.utc).isoformat()
                            }}
                        )
        
        # Optionally log meter values (can be frequent, so only log significant changes)
        return call_result.MeterValuesPayload()
