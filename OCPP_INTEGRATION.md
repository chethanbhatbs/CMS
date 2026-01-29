# OCPP 1.6 WebSocket Integration

## Overview
This CMS implements OCPP 1.6 (Open Charge Point Protocol) for real-time communication with EV charging stations.

## Architecture

### WebSocket Endpoint
```
wss://cms-auth-starter.preview.emergentagent.com/ocpp/{charge_point_id}
```

**Subprotocol:** `ocpp1.6`

### Components

1. **ocpp_chargepoint.py** - OCPP message handlers
   - BootNotification
   - Heartbeat
   - StatusNotification
   - StartTransaction
   - StopTransaction
   - MeterValues

2. **ocpp_registry.py** - Connection tracking
   - Maintains active WebSocket connections
   - Provides CP lookup by ID

3. **ocpp_server.py** - WebSocket server
   - Accepts OCPP connections
   - Manages connection lifecycle

4. **server.py** - REST API for remote commands
   - Remote Start/Stop Transaction
   - Soft/Hard Reset
   - Change Availability
   - Get Connected CPs

## Message Flow

### Charge Point Connects
```
1. CP opens WebSocket to /ocpp/{cp_id}
2. Sends BootNotification
3. CMS responds with Accepted status
4. CP registered in connection registry
5. Database updated: is_online = True
```

### Status Updates
```
1. CP sends StatusNotification for each connector
2. CMS stores connector status in connector_status collection
3. CMS derives overall CP status:
   - FAULTED: any connector faulted
   - AVAILABLE: any connector available
   - OCCUPIED: all charging/preparing
   - UNAVAILABLE: otherwise
4. Database updated with derived status
5. Charger log created
```

### Heartbeat
```
1. CP sends Heartbeat every 300 seconds
2. CMS updates last_heartbeat timestamp
3. CMS responds with current time
```

### Transaction Flow
```
Start:
1. User starts charging (RFID or mobile app)
2. CP sends StartTransaction
3. CMS creates session in charging_sessions collection
4. CMS increments total_sessions counter
5. Returns transaction_id

Stop:
1. User stops charging or session ends
2. CP sends StopTransaction with meter_stop
3. CMS calculates energy consumed
4. Updates session with end_time and energy_kwh
5. Increments total_energy_kwh for CP
```

## Remote Commands (CMS → CP)

### 1. Remote Start Transaction
**Endpoint:** `POST /api/charge-points/{cp_id}/remote-start`
**Body:**
```json
{
  "id_tag": "USER_RFID_TAG",
  "connector_id": 1
}
```

### 2. Remote Stop Transaction
**Endpoint:** `POST /api/charge-points/{cp_id}/remote-stop`
**Body:**
```json
{
  "transaction_id": 123456
}
```

### 3. Reset
**Endpoint:** `POST /api/charge-points/{cp_id}/reset`
**Body:**
```json
{
  "reset_type": "Soft"  // or "Hard"
}
```

### 4. Change Availability
**Endpoint:** `POST /api/charge-points/{cp_id}/change-availability`
**Body:**
```json
{
  "connector_id": 1,
  "availability_type": "Operative"  // or "Inoperative"
}
```

## Database Collections

### connector_status
```json
{
  "charge_point_id": "CP-001",
  "connector_id": 1,
  "status": "Available",  // Available, Charging, Preparing, Faulted, etc.
  "error_code": "NoError",
  "timestamp": "2026-01-29T12:00:00Z",
  "info": "",
  "vendor_id": "",
  "vendor_error_code": ""
}
```

### charging_sessions
```json
{
  "session_id": "1738156800000",
  "charge_point_id": "CP-001",
  "connector_id": 1,
  "rfid_tag": "USER123",
  "start_time": "2026-01-29T12:00:00Z",
  "end_time": "2026-01-29T13:00:00Z",
  "start_meter_kwh": 100.0,
  "end_meter_kwh": 150.0,
  "energy_kwh": 50.0,
  "status": "COMPLETED"  // ACTIVE, COMPLETED, FAILED
}
```

### charger_logs
```json
{
  "charge_point_id": "CP-001",
  "log_level": "INFO",  // INFO, WARNING, ERROR
  "message": "Boot Notification: ABB Terra 54",
  "action": "BootNotification",
  "metadata": {},
  "timestamp": "2026-01-29T12:00:00Z"
}
```

## Status Logic

### Connector Status (OCPP)
- Available
- Preparing
- Charging
- SuspendedEVSE
- SuspendedEV
- Finishing
- Reserved
- Unavailable
- Faulted

### Derived Charge Point Status (CMS)
```python
if any_connector_faulted:
    cp_status = "FAULTED"
elif any_connector_available:
    cp_status = "AVAILABLE"
elif all_connectors_busy:
    cp_status = "OCCUPIED"
else:
    cp_status = "UNAVAILABLE"
```

## Testing OCPP

### Using OCPP Simulator
```bash
# Install OCPP simulator
npm install -g ocpp-chargepoint-simulator

# Connect to CMS
ocpp-chargepoint-simulator \
  --url wss://cms-auth-starter.preview.emergentagent.com/ocpp/CP-TEST-001 \
  --protocol ocpp1.6
```

### Testing Commands
```bash
# Get connected CPs
curl -X GET https://cms-auth-starter.preview.emergentagent.com/api/charge-points/connected/list \
  -H "Authorization: Bearer YOUR_TOKEN"

# Remote start
curl -X POST https://cms-auth-starter.preview.emergentagent.com/api/charge-points/CP-001/remote-start \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id_tag":"USER123","connector_id":1}'
```

## UI Integration

### CP Details Page - CMS Actions
- Buttons connected to API endpoints
- Show toast notifications for command results
- Display connection status (online/offline)
- Real-time status updates via polling or WebSocket

### Active Sessions Page
- List all active charging sessions
- Show real-time power and energy
- Remote stop functionality

## Security

### Production Recommendations
1. **Authentication:** Implement HTTP Basic Auth for CP connections
2. **TLS:** Use WSS (WebSocket Secure) in production
3. **Authorization:** Validate CP identity before accepting connection
4. **Rate Limiting:** Prevent message flooding

## Monitoring

### Key Metrics
- Connected CPs count
- Active sessions count
- Total energy delivered
- Connector availability rate
- Error rate per CP

### Logs
All OCPP messages are logged in `charger_logs` collection with:
- Timestamp
- CP ID
- Action type
- Message details
- Error codes (if any)

## Next Steps

1. **Real-time Dashboard:** WebSocket for UI to show live updates
2. **Billing Integration:** Link sessions to user accounts and tariffs
3. **Notifications:** Alert on faults, low availability, etc.
4. **Analytics:** Session duration, peak usage, revenue reports
5. **Mobile App API:** Reuse same endpoints for mobile client
