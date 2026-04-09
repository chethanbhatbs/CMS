# EV Charging CMS

A production-ready **EV Charging Management System** for Charge Point Operators (CPOs). Manage charging stations, monitor live sessions, handle OCPP 1.6 communication, and administer users — all from a single dashboard.

## Features

- **Charging Stations** — manage locations, charge points, and connectors
- **Live Sessions** — monitor active charging sessions in real-time
- **OCPP 1.6 Integration** — WebSocket communication with charging hardware
- **Remote Operations** — start/stop charging remotely
- **CRM** — manage retail and group (fleet/corporate) customers
- **Monitoring** — charger logs, alarms, reports, and analytics
- **Administration** — user management, franchise management, role-based access control (RBAC)
- **Virtual Charger** — simulate a charge point for testing without real hardware

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Radix UI / Shadcn, Tailwind CSS, Inter + JetBrains Mono fonts |
| Backend | Python (FastAPI/Flask), OCPP 1.6 WebSocket server |
| Database | PostgreSQL / SQLite (configurable) |
| Protocol | OCPP 1.6 over WebSocket |
| Testing | Python unittest, pytest |

## Prerequisites

- **Node.js** v18+ and npm
- **Python** 3.9+
- **pip**

## Local Setup

### 1. Clone the repo

```bash
git clone https://github.com/chethanbhatbs/CMS.git
cd CMS
```

### 2. Backend

```bash
cd backend
pip install -r requirements.txt

# Seed initial admin user (first time only)
python seed_admin.py

# Optional: seed demo data
python seed_demo_data.py

# Start the server
python run_local.py
```

The API + OCPP WebSocket server starts at `http://localhost:8000`.

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

The dashboard opens at `http://localhost:3000`.

### 4. Run both together

```bash
# Terminal 1 — Backend
cd backend && pip install -r requirements.txt && python run_local.py

# Terminal 2 — Frontend
cd frontend && npm install && npm start
```

Open **http://localhost:3000** in your browser.

### 5. Virtual Charger (optional)

Simulate a charge point for testing without real hardware:

```bash
cd backend
python virtual_charger.py
```

This connects a virtual charger to the OCPP WebSocket server so you can test start/stop sessions, monitoring, and alarms.

## OCPP WebSocket

```
ws://localhost:8000/ocpp/{charge_point_id}
```

- **Subprotocol:** `ocpp1.6`
- See [OCPP_INTEGRATION.md](OCPP_INTEGRATION.md) for full protocol documentation
- See [OCPP_VALIDATION.md](OCPP_VALIDATION.md) for message validation details

## Project Structure

```
CMS/
├── frontend/                # React dashboard
│   ├── src/pages/
│   │   ├── CRM/            # Customer management
│   │   ├── Operations/     # Transactions, active sessions
│   │   ├── RemoteOperations/  # Remote start/stop
│   │   ├── Monitoring/     # Logs, alarms, reports
│   │   └── Administration/ # Users, roles, franchises
│   └── package.json
├── backend/
│   ├── server.py           # Main API server
│   ├── ocpp_server.py      # OCPP WebSocket handler
│   ├── ocpp_chargepoint.py # Charge point protocol logic
│   ├── models.py           # Database models
│   ├── run_local.py        # Local development entry point
│   ├── seed_admin.py       # Create initial admin user
│   ├── seed_demo_data.py   # Populate demo data
│   ├── virtual_charger.py  # Simulated charge point for testing
│   └── requirements.txt
├── MODULE_STRUCTURE.md      # Detailed module documentation
├── OCPP_INTEGRATION.md      # OCPP protocol details
├── VIRTUAL_CHARGER_GUIDE.md # Virtual charger usage guide
└── README.md
```

## Documentation

- [Module Structure](MODULE_STRUCTURE.md) — detailed breakdown of all frontend/backend modules
- [OCPP Integration](OCPP_INTEGRATION.md) — WebSocket protocol, message formats, flows
- [OCPP Validation](OCPP_VALIDATION.md) — message validation rules
- [Virtual Charger Guide](VIRTUAL_CHARGER_GUIDE.md) — how to simulate a charge point
- [Local Development](LOCAL_DEVELOPMENT.md) — additional dev setup notes

## Testing

```bash
# Backend tests
cd backend && python -m pytest tests/

# Or run directly
python backend_test.py
```

## License

MIT
