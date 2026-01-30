# 🔌 Virtual Charger Simulator - Quick Start Guide

## Overview
This Python OCPP 1.6 simulator allows you to test the CMS without physical hardware.

## Prerequisites

The simulator uses the same OCPP library as the backend, so it's already installed.

## Usage

### 1. Make sure backend is running
```bash
sudo supervisorctl status backend
# Should show: backend RUNNING
```

### 2. Run the simulator
```bash
cd /app
python virtual_charger.py
```

### 3. Configuration
When prompted:
- **Charge Point ID:** Enter `CP-001` (or any CP registered in CMS)
- **WebSocket URL:** Press Enter for default `ws://localhost:8001/ocpp`

### 4. Interactive Commands

**Basic Flow:**
1. Connect to CMS (option 1)
2. Send BootNotification (option 2)
3. Send StatusNotification Available (option 3)
4. Send Heartbeat (option 6)

**Full Charging Session:**
- Option 11: Simulates complete charging cycle
  - Authorize RFID
  - Start transaction
  - Send 3 meter value updates
  - Stop transaction
  - **Check CMS for wallet debit!**

**Manual Session:**
1. Authorize RFID (option 7) - Use ID: `USER-TEST`
2. Start Charging (option 8) - Returns transaction ID
3. Send MeterValues multiple times (option 9) - Simulates consumption
4. Stop Charging (option 10) - Completes session

**Status Changes:**
- Available (option 3) → Green dot in CMS
- Charging (option 4) → Orange dot in CMS
- Faulted (option 5) → Red dot in CMS

### 5. What to Check in CMS

After running simulator:

**Charge Points Page:**
- CP-001 should show "Online" if BootNotification accepted
- Connector dots should change color based on status sent

**Charge Point Details:**
- Last Heartbeat should update
- OCPP Message Logs should show all messages

**Charging Transactions:**
- After option 11, check for new transaction
- Verify energy consumption
- Check cost calculation

**Account Transactions:**
- Check if wallet was debited (if user exists)

**On-Hold Transactions:**
- Test by sending StopTransaction with meter_stop < meter_start

---

## Testing Scenarios

### Scenario 1: Basic Connection Test
```
1. Connect (option 1)
2. BootNotification (option 2)
   → Check CMS: CP should be online
3. StatusNotification Available (option 3)
   → Check CMS: Connector dot should be green
4. Heartbeat (option 6)
   → Check CMS: Last heartbeat timestamp updated
```

### Scenario 2: RFID Validation Test
```
1. Connect + Boot
2. In CMS: Add RFID card "USER-TEST" (ACTIVE status)
3. Authorize "USER-TEST" (option 7)
   → Should return: Accepted
4. Try with non-existent RFID
   → Should return: Invalid
```

### Scenario 3: Full Charging Cycle
```
1. Connect + Boot
2. In CMS: Create Retail User with USER-TEST id
3. In CMS: Add $50 to wallet
4. Run Full Cycle (option 11)
5. Check CMS:
   - New charging transaction created
   - Wallet debited (e.g., $50 - $8.93 = $41.07)
   - Account transaction logged
```

### Scenario 4: Remote Commands Test
```
1. Connect + Boot + Available
2. In CMS: Go to CP Details page
3. Click "Soft Reset" button
4. Simulator shows: "📥 Received Reset: Type = Soft"
5. Simulator responds: Accepted
6. CMS shows: Success toast
```

### Scenario 5: On-Hold Detection
```
1. Start charging session normally
2. In simulator code, manually set meter_stop < meter_start
3. Stop transaction
4. Check CMS On-Hold Transactions:
   → Session should appear with reason "Meter anomaly"
```

---

## Configuration for Production Testing

### Testing Against Live CMS
```bash
# When prompted for WebSocket URL, enter:
wss://cms-auth-starter.preview.emergentagent.com/ocpp

# Charge Point ID:
CP-001  (or CP-REF-001, or CP-DEMO-001)
```

### Testing Locally
```bash
# WebSocket URL:
ws://localhost:8001/ocpp

# Make sure backend is running on port 8001
```

---

## Expected Output

### Successful Connection:
```
🔌 Connecting to ws://localhost:8001/ocpp/CP-001...
✓ Connected successfully!

Sending BootNotification...
✓ BootNotification Response: Accepted
  Interval: 300s

Sending StatusNotification: Connector 1 = Available
✓ StatusNotification sent
```

### Full Charging Cycle Output:
```
🔄 Simulating Full Charging Cycle...
Step 1: Setting connector to Available...
✓ StatusNotification sent

Step 2: Authorizing USER-TEST...
✓ Authorize Response: Accepted

Step 3: Starting transaction...
✓ StartTransaction Response: Transaction ID = 456789

Step 4: Simulating charging (3 meter value updates)...
  Charging... 105.00 kWh
  Charging... 110.00 kWh
  Charging... 115.00 kWh

Step 5: Stopping transaction...
✓ StopTransaction sent
  Energy consumed: 15.00 kWh

✓ Full cycle completed!
  Total energy: 15.00 kWh
```

---

## Troubleshooting

### Connection Refused
- Check if backend is running: `sudo supervisorctl status backend`
- Check URL is correct
- Make sure CP is registered in CMS

### BootNotification Rejected
- CP-001 must exist in CMS database
- Go to CMS → Charge Points → Add Charge Point first

### Authorize Returns Invalid
- RFID tag must exist in CMS
- Go to CMS → RFID Management → Add RFID Card
- Status must be ACTIVE

### No Wallet Debit
- User must exist in retail_users with matching user_id
- Wallet must have sufficient balance
- Default tariff must be set in CMS

---

## Advanced: Multiple Chargers

Run multiple simulators in different terminals:

```bash
# Terminal 1
python virtual_charger.py
# Enter: CP-001

# Terminal 2
python virtual_charger.py
# Enter: CP-002

# Terminal 3
python virtual_charger.py
# Enter: CP-003
```

All will connect independently and show in CMS.

---

## Next Steps

After testing with simulator:
1. Verify all OCPP messages work
2. Confirm wallet debit works
3. Test on-hold detection
4. Then proceed to Mobile App development
