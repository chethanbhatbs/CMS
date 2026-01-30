#!/usr/bin/env python3
"""
OCPP 1.6 Virtual Charger Simulator
Interactive CLI to test CMS OCPP integration
"""

import asyncio
import websockets
import logging
from datetime import datetime, timezone
from ocpp.v16 import ChargePoint as CP
from ocpp.v16 import call, call_result
from ocpp.v16.enums import ChargePointStatus, Action
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class VirtualChargePoint(CP):
    """Virtual Charger with interactive controls"""
    
    def __init__(self, id, connection):
        super().__init__(id, connection)
        self.is_connected = False
        self.is_charging = False
        self.current_transaction_id = None
        self.meter_value = 100000  # Start at 100 kWh (in Wh)
        self.connector_status = ChargePointStatus.available
    
    async def send_boot_notification(self):
        """Send BootNotification to CMS"""
        logger.info("Sending BootNotification...")
        request = call.BootNotificationPayload(
            charge_point_vendor='ABB',
            charge_point_model='Terra 54'
        )
        try:
            response = await self.call(request)
            logger.info(f"✓ BootNotification Response: {response.status}")
            logger.info(f"  Interval: {response.interval}s")
            self.is_connected = True
            return response
        except Exception as e:
            logger.error(f"✗ BootNotification failed: {e}")
            return None
    
    async def send_status_notification(self, connector_id=1, status=ChargePointStatus.available):
        """Send StatusNotification"""
        logger.info(f"Sending StatusNotification: Connector {connector_id} = {status}")
        request = call.StatusNotificationPayload(
            connector_id=connector_id,
            error_code='NoError',
            status=status,
            timestamp=datetime.now(timezone.utc).isoformat()
        )
        try:
            response = await self.call(request)
            logger.info(f"✓ StatusNotification sent")
            self.connector_status = status
            return response
        except Exception as e:
            logger.error(f"✗ StatusNotification failed: {e}")
            return None
    
    async def send_heartbeat(self):
        """Send Heartbeat"""
        logger.info("Sending Heartbeat...")
        request = call.HeartbeatPayload()
        try:
            response = await self.call(request)
            logger.info(f"✓ Heartbeat Response: {response.current_time}")
            return response
        except Exception as e:
            logger.error(f"✗ Heartbeat failed: {e}")
            return None
    
    async def send_authorize(self, id_tag):
        """Send Authorize request"""
        logger.info(f"Sending Authorize for ID Tag: {id_tag}")
        request = call.AuthorizePayload(
            id_tag=id_tag
        )
        try:
            response = await self.call(request)
            logger.info(f"✓ Authorize Response: {response.id_tag_info['status']}")
            return response
        except Exception as e:
            logger.error(f"✗ Authorize failed: {e}")
            return None
    
    async def send_start_transaction(self, connector_id=1, id_tag="USER-TEST"):
        """Send StartTransaction"""
        logger.info(f"Sending StartTransaction: Connector {connector_id}, ID Tag: {id_tag}")
        request = call.StartTransactionPayload(
            connector_id=connector_id,
            id_tag=id_tag,
            meter_start=self.meter_value,
            timestamp=datetime.now(timezone.utc).isoformat()
        )
        try:
            response = await self.call(request)
            self.current_transaction_id = response.transaction_id
            self.is_charging = True
            logger.info(f"✓ StartTransaction Response: Transaction ID = {response.transaction_id}")
            logger.info(f"  ID Tag Status: {response.id_tag_info['status']}")
            
            # Update status to Charging
            await self.send_status_notification(connector_id, ChargePointStatus.charging)
            
            return response
        except Exception as e:
            logger.error(f"✗ StartTransaction failed: {e}")
            return None
    
    async def send_meter_values(self, connector_id=1):
        """Send MeterValues"""
        if not self.current_transaction_id:
            logger.warning("No active transaction for MeterValues")
            return
        
        # Simulate energy consumption (+5 kWh per call)
        self.meter_value += 5000  # Add 5 kWh in Wh
        
        logger.info(f"Sending MeterValues: {self.meter_value / 1000:.2f} kWh")
        request = call.MeterValuesPayload(
            connector_id=connector_id,
            transaction_id=self.current_transaction_id,
            meter_value=[{
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'sampled_value': [{
                    'value': str(self.meter_value),
                    'measurand': 'Energy.Active.Import.Register',
                    'unit': 'Wh'
                }]
            }]
        )
        try:
            response = await self.call(request)
            logger.info(f"✓ MeterValues sent: Current = {self.meter_value / 1000:.2f} kWh")
            return response
        except Exception as e:
            logger.error(f"✗ MeterValues failed: {e}")
            return None
    
    async def send_stop_transaction(self):
        """Send StopTransaction"""
        if not self.current_transaction_id:
            logger.warning("No active transaction to stop")
            return
        
        logger.info(f"Sending StopTransaction: Transaction ID = {self.current_transaction_id}")
        request = call.StopTransactionPayload(
            transaction_id=self.current_transaction_id,
            meter_stop=self.meter_value,
            timestamp=datetime.now(timezone.utc).isoformat(),
            reason='Local'
        )
        try:
            response = await self.call(request)
            logger.info(f"✓ StopTransaction sent")
            logger.info(f"  Energy consumed: {(self.meter_value - 100000) / 1000:.2f} kWh")
            
            self.is_charging = False
            self.current_transaction_id = None
            
            # Update status to Available
            await self.send_status_notification(1, ChargePointStatus.available)
            
            return response
        except Exception as e:
            logger.error(f"✗ StopTransaction failed: {e}")
            return None
    
    # Handle incoming messages from CMS
    async def on_remote_start_transaction(self, id_tag, connector_id=1, **kwargs):
        """Handle RemoteStartTransaction from CMS"""
        logger.info(f"📥 Received RemoteStartTransaction: ID Tag = {id_tag}, Connector = {connector_id}")
        
        if self.is_charging:
            logger.warning("Already charging, rejecting RemoteStart")
            return call_result.RemoteStartTransactionPayload(status='Rejected')
        
        # Start transaction
        logger.info("Accepting RemoteStart, starting transaction...")
        asyncio.create_task(self.send_start_transaction(connector_id, id_tag))
        
        return call_result.RemoteStartTransactionPayload(status='Accepted')
    
    async def on_remote_stop_transaction(self, transaction_id, **kwargs):
        """Handle RemoteStopTransaction from CMS"""
        logger.info(f"📥 Received RemoteStopTransaction: Transaction ID = {transaction_id}")
        
        if transaction_id != self.current_transaction_id:
            logger.warning("Transaction ID mismatch, rejecting")
            return call_result.RemoteStopTransactionPayload(status='Rejected')
        
        # Stop transaction
        logger.info("Accepting RemoteStop, stopping transaction...")
        asyncio.create_task(self.send_stop_transaction())
        
        return call_result.RemoteStopTransactionPayload(status='Accepted')
    
    async def on_reset(self, type, **kwargs):
        """Handle Reset from CMS"""
        logger.info(f"📥 Received Reset: Type = {type}")
        
        if self.is_charging:
            logger.warning("Currently charging, rejecting reset")
            return call_result.ResetPayload(status='Rejected')
        
        logger.info(f"Accepting {type} reset...")
        return call_result.ResetPayload(status='Accepted')
    
    async def on_change_availability(self, connector_id, type, **kwargs):
        """Handle ChangeAvailability from CMS"""
        logger.info(f"📥 Received ChangeAvailability: Connector {connector_id} = {type}")
        
        # Update connector status
        new_status = ChargePointStatus.available if type == 'Operative' else ChargePointStatus.unavailable
        asyncio.create_task(self.send_status_notification(connector_id, new_status))
        
        return call_result.ChangeAvailabilityPayload(status='Accepted')


async def show_menu():
    """Display interactive menu"""
    print("\n" + "="*60)
    print("🔌 OCPP 1.6 Virtual Charger Simulator")
    print("="*60)
    print("\nAvailable Commands:")
    print("  1. Connect to CMS")
    print("  2. Send BootNotification")
    print("  3. Send StatusNotification (Available)")
    print("  4. Send StatusNotification (Charging)")
    print("  5. Send StatusNotification (Faulted)")
    print("  6. Send Heartbeat")
    print("  7. Authorize RFID")
    print("  8. Start Charging Session")
    print("  9. Send MeterValues (simulate charging)")
    print(" 10. Stop Charging Session")
    print(" 11. Simulate Full Charging Cycle")
    print(" 12. Show Current State")
    print("  0. Exit")
    print("="*60)


async def main():
    """Main interactive loop"""
    print("\n🚀 OCPP Virtual Charger Simulator")
    print("="*60)
    
    # Configuration
    cp_id = input("Enter Charge Point ID (default: CP-001): ").strip() or "CP-001"
    ws_url = input("Enter WebSocket URL (default: ws://localhost:8001/ocpp): ").strip()
    
    if not ws_url:
        # Use local by default, user can override
        ws_url = f"ws://localhost:8001/ocpp/{cp_id}"
    elif '{cp_id}' in ws_url:
        ws_url = ws_url.replace('{cp_id}', cp_id)
    elif not ws_url.endswith(cp_id):
        ws_url = f"{ws_url}/{cp_id}"
    
    print(f"\n📡 Will connect to: {ws_url}")
    print(f"🆔 Charge Point ID: {cp_id}")
    
    input("\nPress Enter to start...")
    
    cp = None
    ws = None
    
    while True:
        await show_menu()
        choice = input("\nEnter command number: ").strip()
        
        try:
            if choice == '1':
                # Connect
                print(f"\n🔌 Connecting to {ws_url}...")
                try:
                    ws = await websockets.connect(
                        ws_url,
                        subprotocols=['ocpp1.6'],
                        ping_interval=None
                    )
                    cp = VirtualChargePoint(cp_id, ws)
                    asyncio.create_task(cp.start())
                    await asyncio.sleep(1)
                    print("✓ Connected successfully!")
                except Exception as e:
                    print(f"✗ Connection failed: {e}")
                    continue
            
            elif choice == '2':
                if cp:
                    await cp.send_boot_notification()
                else:
                    print("⚠️  Not connected. Choose option 1 first.")
            
            elif choice == '3':
                if cp:
                    await cp.send_status_notification(1, ChargePointStatus.available)
                else:
                    print("⚠️  Not connected.")
            
            elif choice == '4':
                if cp:
                    await cp.send_status_notification(1, ChargePointStatus.charging)
                else:
                    print("⚠️  Not connected.")
            
            elif choice == '5':
                if cp:
                    await cp.send_status_notification(1, ChargePointStatus.faulted)
                else:
                    print("⚠️  Not connected.")
            
            elif choice == '6':
                if cp:
                    await cp.send_heartbeat()
                else:
                    print("⚠️  Not connected.")
            
            elif choice == '7':
                if cp:
                    id_tag = input("Enter RFID Tag (default: USER-TEST): ").strip() or "USER-TEST"
                    await cp.send_authorize(id_tag)
                else:
                    print("⚠️  Not connected.")
            
            elif choice == '8':
                if cp:
                    id_tag = input("Enter ID Tag (default: USER-TEST): ").strip() or "USER-TEST"
                    await cp.send_start_transaction(1, id_tag)
                else:
                    print("⚠️  Not connected.")
            
            elif choice == '9':
                if cp:
                    if cp.current_transaction_id:
                        await cp.send_meter_values(1)
                    else:
                        print("⚠️  No active transaction. Start charging first (option 8).")
                else:
                    print("⚠️  Not connected.")
            
            elif choice == '10':
                if cp:
                    if cp.current_transaction_id:
                        await cp.send_stop_transaction()
                    else:
                        print("⚠️  No active transaction.")
                else:
                    print("⚠️  Not connected.")
            
            elif choice == '11':
                # Full charging cycle
                if cp:
                    print("\n🔄 Simulating Full Charging Cycle...")
                    print("="*60)
                    
                    # 1. Set Available
                    print("Step 1: Setting connector to Available...")
                    await cp.send_status_notification(1, ChargePointStatus.available)
                    await asyncio.sleep(2)
                    
                    # 2. Authorize
                    id_tag = input("Enter ID Tag (default: USER-TEST): ").strip() or "USER-TEST"
                    print(f"Step 2: Authorizing {id_tag}...")
                    auth_response = await cp.send_authorize(id_tag)
                    await asyncio.sleep(1)
                    
                    if auth_response and auth_response.id_tag_info['status'] == 'Accepted':
                        # 3. Start Transaction
                        print("Step 3: Starting transaction...")
                        await cp.send_start_transaction(1, id_tag)
                        await asyncio.sleep(2)
                        
                        # 4. Simulate charging with meter values
                        print("Step 4: Simulating charging (3 meter value updates)...")
                        for i in range(3):
                            await cp.send_meter_values(1)
                            print(f"  Charging... {cp.meter_value / 1000:.2f} kWh")
                            await asyncio.sleep(2)
                        
                        # 5. Stop Transaction
                        print("Step 5: Stopping transaction...")
                        await cp.send_stop_transaction()
                        
                        print("\n✓ Full cycle completed!")
                        print(f"  Total energy: {(cp.meter_value - 100000) / 1000:.2f} kWh")
                    else:
                        print("✗ Authorization failed, cannot start charging")
                else:
                    print("⚠️  Not connected.")
            
            elif choice == '12':
                # Show state
                if cp:
                    print("\n📊 Current Charger State:")
                    print("="*60)
                    print(f"  Connected: {cp.is_connected}")
                    print(f"  Charging: {cp.is_charging}")
                    print(f"  Connector Status: {cp.connector_status}")
                    print(f"  Current Meter: {cp.meter_value / 1000:.2f} kWh")
                    print(f"  Active Transaction: {cp.current_transaction_id or 'None'}")
                else:
                    print("⚠️  Not connected.")
            
            elif choice == '0':
                print("\n👋 Disconnecting...")
                if ws:
                    await ws.close()
                print("Goodbye!")
                break
            
            else:
                print("❌ Invalid option")
        
        except KeyboardInterrupt:
            print("\n\n👋 Interrupted. Disconnecting...")
            if ws:
                await ws.close()
            break
        except Exception as e:
            logger.error(f"Error: {e}")
            import traceback
            traceback.print_exc()


if __name__ == "__main__":
    print("""
    ╔══════════════════════════════════════════════════════════╗
    ║     OCPP 1.6 Virtual Charger Simulator                   ║
    ║     For testing EV Charging CMS                          ║
    ╚══════════════════════════════════════════════════════════╝
    """)
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\nSimulator stopped.")
