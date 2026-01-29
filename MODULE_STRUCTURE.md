# EV Charging CMS - Module Structure

## Overview
Production-ready EV Charging Management System with comprehensive module structure for CPO (Charge Point Operator) operations.

## System Architecture

### Frontend Structure
```
/app/frontend/src/
├── pages/
│   ├── CRM/                          # Customer Relationship Management
│   │   ├── RetailUsers.js            # Individual customers
│   │   └── GroupUsers.js             # Corporate/fleet accounts
│   ├── Operations/                   # Day-to-day operations
│   │   ├── ChargingTransactions.js   # Completed transactions
│   │   ├── ActiveSessions.js         # Live charging sessions
│   │   └── OnHoldTransactions.js     # Pending/paused transactions
│   ├── RemoteOperations/             # Remote control features
│   │   └── StartRemoteSession.js     # Initiate charging remotely
│   ├── Monitoring/                   # System monitoring
│   │   ├── ChargerLogs.js            # Detailed system logs
│   │   ├── AlarmSummary.js           # Alarms and alerts
│   │   └── ReportsLogs.js            # Reports and analytics
│   ├── Administration/               # System administration
│   │   ├── AdminUserManagement.js    # Staff accounts
│   │   ├── FranchiseManagement.js    # Franchise partners
│   │   └── RoleManagement.js         # RBAC configuration
│   ├── ChargingLocations.js          # Physical locations
│   ├── ChargePoints.js               # Individual EVSE units
│   ├── RFIDManagement.js             # Access cards
│   ├── TariffManagement.js           # Pricing configuration
│   ├── AssetManagement.js            # Infrastructure tracking
│   └── Configuration.js              # System settings
├── layouts/
│   └── DashboardLayout.js            # Main layout with collapsible sidebar sections
├── contexts/
│   └── AuthContext.js                # JWT authentication context
└── components/
    └── ProtectedRoute.js             # Route protection wrapper
```

### Backend Structure
```
/app/backend/
├── server.py                         # FastAPI application with auth endpoints
├── models.py                         # Pydantic models for all entities
├── seed_admin.py                     # Admin user seeder
└── .env                              # Environment configuration
```

## Module Breakdown

### 1. CRM (Customer Relationship Management)
**Purpose:** Manage customer accounts and billing

**Modules:**
- **Retail Users:** Individual EV owners
  - Fields: Name, Email, Phone, RFID Cards, Wallet Balance, Status
- **Group Users:** Corporate/fleet accounts
  - Fields: Company Name, Contact Person, Billing Plan, Member Count

### 2. Charging Network
**Purpose:** Infrastructure management

**Modules:**
- **Charging Locations:** Physical sites with charge points
  - Fields: Name, Address, Coordinates, Total Charge Points
- **Charge Points:** Individual EVSE units
  - Fields: ID, Location, Connectors, Status, Vendor, Model

### 3. Operations
**Purpose:** Transaction and session management

**Modules:**
- **Charging Transactions:** Completed transactions with billing
  - Fields: Transaction ID, User, Energy (kWh), Amount, Status
- **Active Sessions:** Real-time monitoring of charging sessions
  - Fields: Session ID, User, Charge Point, Duration, Current Power
- **On-Hold Transactions:** Paused or pending transactions
  - Fields: Transaction ID, Hold Reason, Duration, Actions

### 4. Remote Operations
**Purpose:** Remote control and management

**Modules:**
- **Start Remote Session:** Initiate charging remotely
  - Configure: User, Charge Point, Connector, RFID Tag

### 5. Monitoring
**Purpose:** System health and logging

**Modules:**
- **Charger Logs:** Detailed system logs with filters
  - Filters: Charge Point, Log Level, Date Range
- **Alarm Summary:** Critical alerts and warnings
  - Types: Critical, Warning, Resolved
- **Reports & Logs:** Analytics and audit trails

### 6. Administration
**Purpose:** System configuration and user management

**Modules:**
- **Admin User Management:** Staff and administrator accounts
  - Fields: Name, Email, Role, Franchise, Last Login
- **Franchise Management:** Partner organizations
  - Fields: Franchise Name, Contact, Locations, Charge Points
- **Role Management:** RBAC configuration
  - Roles: SUPER_ADMIN, CPO_ADMIN, OPERATOR, FINANCE
- **RFID Management:** Access card administration
- **Tariff Management:** Pricing configuration
- **Asset Management:** Infrastructure tracking and maintenance
- **Configuration:** System-wide settings

## Database Schemas (MongoDB)

### Core Entities

#### User (Admin/Staff)
```python
{
  id, email, password_hash, full_name, role, 
  franchise_id, is_active, last_login, 
  created_at, updated_at
}
```

#### RetailUser (Customer)
```python
{
  id, email, phone, full_name, rfid_cards[], 
  wallet_balance, status, created_at, updated_at
}
```

#### GroupUser (Corporate)
```python
{
  id, company_name, contact_person, contact_email, 
  contact_phone, billing_plan, member_count, 
  status, created_at, updated_at
}
```

#### ChargingLocation
```python
{
  id, name, address, city, state, postal_code, country,
  latitude, longitude, franchise_id, total_charge_points,
  status, created_at, updated_at
}
```

#### ChargePoint
```python
{
  id, charge_point_id, name, location_id, vendor, model,
  firmware_version, connectors[], status, is_online,
  last_heartbeat, created_at, updated_at
}
```

#### ChargingSession
```python
{
  id, session_id, user_id, user_type, charge_point_id,
  connector_id, rfid_tag, start_time, end_time,
  energy_kwh, current_power_kw, status,
  created_at, updated_at
}
```

#### ChargingTransaction
```python
{
  id, transaction_id, session_id, user_id, user_type,
  charge_point_id, connector_id, start_time, end_time,
  duration_minutes, energy_kwh, tariff_id, amount,
  currency, payment_method, status, created_at, updated_at
}
```

#### ChargerLog
```python
{
  id, charge_point_id, log_level, message, action,
  metadata{}, timestamp
}
```

#### Alarm
```python
{
  id, charge_point_id, alarm_type, severity, message,
  status, acknowledged_by, acknowledged_at, resolved_at,
  created_at, updated_at
}
```

#### Franchise
```python
{
  id, franchise_name, contact_person, contact_email,
  contact_phone, address, city, state, country,
  total_locations, total_charge_points, status,
  created_at, updated_at
}
```

#### RolePermission
```python
{
  id, role_name, description, permissions[],
  user_count, status, created_at, updated_at
}
```

#### RFIDCard
```python
{
  id, rfid_tag, user_id, user_type, status,
  expiry_date, created_at, updated_at
}
```

#### Tariff
```python
{
  id, tariff_name, description, price_per_kwh,
  price_per_minute, currency, is_default, status,
  created_at, updated_at
}
```

#### Asset
```python
{
  id, asset_name, asset_type, charge_point_id, location_id,
  serial_number, purchase_date, warranty_expiry,
  last_maintenance, next_maintenance, status,
  created_at, updated_at
}
```

## Features Implemented

### Authentication ✓
- [x] JWT-based authentication
- [x] Email/password login
- [x] Forgot password flow
- [x] Reset password with token
- [x] Protected routes
- [x] User roles (SUPER_ADMIN, CPO_ADMIN, OPERATOR, FINANCE)

### Layout ✓
- [x] Responsive dashboard layout
- [x] Collapsible sidebar (desktop: 256px ↔ 64px)
- [x] Mobile-friendly sidebar
- [x] Organized sections (CRM, Charging Network, Operations, etc.)
- [x] User dropdown with profile and logout
- [x] Toast notifications

### Pages ✓
- [x] Dashboard with stats and recent activity
- [x] All placeholder pages with consistent design
- [x] Proper routing and navigation
- [x] Search functionality placeholders
- [x] Filter interfaces (Charger Logs)
- [x] Form interfaces (Start Remote Session)

### Database ✓
- [x] Complete Pydantic models
- [x] MongoDB schema definitions
- [x] User model with authentication
- [x] All entity models defined

## Next Steps (Business Logic)

### Phase 1: Core CRUD Operations
1. Retail Users management
2. Group Users management
3. Charging Locations CRUD
4. Charge Points CRUD

### Phase 2: Operations
1. Transaction history API
2. Active sessions monitoring
3. Session start/stop functionality

### Phase 3: OCPP Integration
1. OCPP 1.6/2.0.1 protocol implementation
2. Real-time charge point communication
3. Remote commands (Start/Stop transaction)
4. Heartbeat and status updates

### Phase 4: Advanced Features
1. Real-time dashboard updates
2. Analytics and reporting
3. Billing and invoicing
4. Email notifications
5. Mobile app integration

## Default Credentials
- Email: `admin@cms.com`
- Password: `admin123`

## Tech Stack
- **Frontend:** React 19, React Router, TailwindCSS, Shadcn/UI
- **Backend:** FastAPI, Python 3.11
- **Database:** MongoDB
- **Authentication:** JWT with passlib/bcrypt
- **Fonts:** Manrope (headings), Inter (body)

## Running the Application
```bash
# Backend
cd /app/backend
python seed_admin.py  # Create default admin
sudo supervisorctl restart backend

# Frontend (auto-restart with hot reload)
# Access at http://localhost:3000
```

## Notes
- All pages are placeholder UI ready for business logic implementation
- No OCPP logic implemented yet
- All database schemas defined but no CRUD endpoints yet
- Focus on clean, maintainable, production-ready code structure
