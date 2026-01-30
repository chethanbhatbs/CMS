"""
Database models/schemas for EV Charging CMS

This file defines Pydantic models for all entities in the system.
These models are used for:
1. Request/Response validation
2. MongoDB document structure
3. API documentation

Note: All  exclude MongoDB's _id field using model_config
"""

from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from enum import Enum
import uuid


# ============================================
# ENUMS
# ============================================

class UserRole(str, Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    CPO_ADMIN = "CPO_ADMIN"
    OPERATOR = "OPERATOR"
    FINANCE = "FINANCE"


class UserStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    SUSPENDED = "SUSPENDED"


class ChargePointStatus(str, Enum):
    AVAILABLE = "AVAILABLE"
    OCCUPIED = "OCCUPIED"
    UNAVAILABLE = "UNAVAILABLE"
    FAULTED = "FAULTED"
    OFFLINE = "OFFLINE"


class ConnectorStatus(str, Enum):
    AVAILABLE = "AVAILABLE"
    OCCUPIED = "OCCUPIED"
    UNAVAILABLE = "UNAVAILABLE"
    FAULTED = "FAULTED"
    UNKNOWN = "UNKNOWN"


class SessionStatus(str, Enum):
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    SUSPENDED = "SUSPENDED"
    FAILED = "FAILED"


class TransactionStatus(str, Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"
    ON_HOLD = "ON_HOLD"


class AlarmSeverity(str, Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"


class AlarmStatus(str, Enum):
    ACTIVE = "ACTIVE"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    RESOLVED = "RESOLVED"


# ============================================
# USER MODELS (Admin Users)
# ============================================

class User(BaseModel):
    """Admin/Staff user model"""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    password_hash: str
    full_name: str
    phone: Optional[str] = None
    role: UserRole = UserRole.OPERATOR
    franchise_id: Optional[str] = None
    is_active: bool = True
    email_verified: bool = False
    last_login: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class UserResponse(BaseModel):
    """User response without sensitive data"""
    id: str
    email: str
    full_name: str
    phone: Optional[str] = None
    role: str
    franchise_id: Optional[str] = None
    is_active: bool
    email_verified: bool
    last_login: Optional[datetime] = None
    created_at: datetime


# ============================================
# CRM MODELS (Customer Users)
# ============================================

class RetailUser(BaseModel):
    """Individual retail customer model"""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    phone: str
    full_name: str
    rfid_cards: List[str] = []
    wallet_balance: float = 0.0
    status: UserStatus = UserStatus.ACTIVE
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class GroupUser(BaseModel):
    """Corporate/Fleet customer model"""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_name: str
    contact_person: str
    contact_email: EmailStr
    contact_phone: str
    billing_plan: str
    member_count: int = 0
    status: UserStatus = UserStatus.ACTIVE
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ============================================
# CHARGING NETWORK MODELS
# ============================================

class ChargingLocation(BaseModel):
    """Physical location of charging stations"""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    address: str
    city: str
    state: str
    postal_code: str
    country: str
    latitude: float
    longitude: float
    image_url: Optional[str] = None  # Location image
    franchise_id: Optional[str] = None
    total_charge_points: int = 0
    status: str = "ACTIVE"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Connector(BaseModel):
    """Connector within a charge point"""
    connector_id: int
    connector_type: str  # Type2, CCS, CHAdeMO, etc.
    power_kw: float
    status: ConnectorStatus = ConnectorStatus.AVAILABLE


class ChargePoint(BaseModel):
    """Individual charging station/EVSE - References Charger Model"""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    charge_point_id: str  # OCPP Identity
    name: str
    location_id: str
    oem_id: str  # Reference to OEM
    charger_model_id: str  # Reference to ChargerModel (source of truth)
    serial_number: Optional[str] = None  # Instance-specific serial
    firmware_version_override: Optional[str] = None  # Override model's default firmware
    websocket_id: Optional[str] = None  # OCPP WebSocket connection ID
    go_live_date: Optional[datetime] = None
    is_24x7: bool = True  # 24×7 availability
    availability_from: Optional[str] = None  # HH:MM format
    availability_to: Optional[str] = None  # HH:MM format
    status: ChargePointStatus = ChargePointStatus.UNAVAILABLE  # Default UNKNOWN until first StatusNotification
    is_online: bool = False
    last_heartbeat: Optional[datetime] = None
    total_energy_kwh: float = 0.0  # Total energy consumed
    total_sessions: int = 0  # Total number of sessions
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ============================================
# OPERATIONS MODELS
# ============================================

class ChargingSession(BaseModel):
    """Active or completed charging session"""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str  # OCPP transaction ID
    user_id: str  # Retail or Group user
    user_type: str  # "retail" or "group"
    charge_point_id: str
    connector_id: int
    rfid_tag: Optional[str] = None
    start_time: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    end_time: Optional[datetime] = None
    energy_kwh: float = 0.0
    current_power_kw: float = 0.0
    status: SessionStatus = SessionStatus.ACTIVE
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ChargingTransaction(BaseModel):
    """Completed transaction with billing"""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    transaction_id: str
    session_id: str
    user_id: Optional[str] = None
    user_name: Optional[str] = None
    location_id: str
    location_name: str
    charge_point_id: str
    connector_id: int
    start_time: datetime
    end_time: datetime
    duration_minutes: int
    energy_kwh: float
    tariff_id: Optional[str] = None
    tariff_name: Optional[str] = None
    unit_rate: float = 0.0
    session_type: str = "PUBLIC"  # PUBLIC, RESERVED, FLEET
    base_cost: float = 0.0
    tax_amount: float = 0.0
    total_cost: float = 0.0
    currency: str = "USD"
    payment_method: Optional[str] = None
    status: TransactionStatus = TransactionStatus.COMPLETED
    meter_start: float = 0.0  # kWh
    meter_stop: float = 0.0  # kWh
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ============================================
# MONITORING MODELS
# ============================================

class ChargerLog(BaseModel):
    """System logs from charge points"""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    charge_point_id: str
    log_level: str  # INFO, WARNING, ERROR
    message: str
    action: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Alarm(BaseModel):
    """System alarms and alerts"""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    charge_point_id: str
    alarm_type: str  # e.g., "CONNECTOR_FAULT", "OFFLINE", etc.
    severity: AlarmSeverity = AlarmSeverity.WARNING
    message: str
    status: AlarmStatus = AlarmStatus.ACTIVE
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ============================================
# ADMINISTRATION MODELS
# ============================================

class Franchise(BaseModel):
    """Franchise partner organization"""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    franchise_name: str
    contact_person: str
    contact_email: EmailStr
    contact_phone: str
    address: str
    city: str
    state: str
    country: str
    total_locations: int = 0
    total_charge_points: int = 0
    status: str = "ACTIVE"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class RolePermission(BaseModel):
    """Role-based access control"""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    role_name: str
    description: str
    permissions: Dict[str, Dict[str, bool]] = {}  # {"module_name": {"view": True, "modify": False}}
    user_count: int = 0
    status: str = "ACTIVE"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class UserInvitation(BaseModel):
    """User invitation with activation token"""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    role: str
    invitation_token: str
    expires_at: datetime
    used: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AccountTransaction(BaseModel):
    """Account transactions for admin top-ups and user payments"""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    transaction_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_name: str
    phone: Optional[str] = None
    gateway_id: Optional[str] = None  # Payment gateway transaction ID
    session_id: Optional[str] = None  # Charging session ID (if linked)
    transaction_type: str  # "CREDIT" or "DEBIT"
    amount: float
    currency: str = "USD"
    status: str  # "PENDING", "COMPLETED", "FAILED", "REFUNDED"
    payment_method: Optional[str] = None  # "CARD", "WALLET", "CASH", etc.
    description: Optional[str] = None
    invoice_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class RFIDCard(BaseModel):
    """RFID card for charging access"""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    rfid_tag: str  # RFID identifier
    serial_number: Optional[str] = None
    user_id: Optional[str] = None  # Link to Retail User
    user_name: Optional[str] = None
    expiry_date: Optional[datetime] = None
    status: str = "ACTIVE"  # ACTIVE, INACTIVE, EXPIRED
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Tariff(BaseModel):
    """Pricing tariff"""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tariff_name: str
    tariff_type: str  # "energy_based" or "time_based"
    unit_rate: float  # Price per kWh or per minute
    tax_percentage: float = 0.0
    description: Optional[str] = None
    is_default: bool = False
    status: str = "ACTIVE"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class TariffAssignment(BaseModel):
    """Tariff assignment to location/CP/connector with time windows"""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tariff_id: str
    location_id: Optional[str] = None  # If set, applies to all CPs at location
    charge_point_id: Optional[str] = None  # If set, applies to specific CP
    connector_id: Optional[int] = None  # If set, applies to specific connector
    effective_from: datetime
    effective_to: Optional[datetime] = None  # None means indefinite
    time_window_start: Optional[str] = None  # HH:MM format for peak/off-peak
    time_window_end: Optional[str] = None  # HH:MM format
    days_of_week: List[int] = Field(default_factory=list)  # 0=Monday, 6=Sunday
    is_peak_tariff: bool = False
    status: str = "ACTIVE"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Asset(BaseModel):
    """Infrastructure asset tracking"""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    asset_name: str
    asset_type: str  # e.g., "CHARGE_POINT", "TRANSFORMER", etc.
    charge_point_id: Optional[str] = None
    location_id: str
    serial_number: Optional[str] = None
    purchase_date: Optional[datetime] = None
    warranty_expiry: Optional[datetime] = None
    last_maintenance: Optional[datetime] = None
    next_maintenance: Optional[datetime] = None
    status: str = "ACTIVE"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ============================================
# OEM & CHARGER MODEL
# ============================================

class ChargerType(str, Enum):
    AC = "AC"
    DC = "DC"
    HYBRID = "HYBRID"


class ConnectorConfig(BaseModel):
    """Connector configuration for a charger model"""
    connector_number: int
    connector_type: str  # Type2, CCS, CHAdeMO, Type1
    max_power_kw: float
    max_voltage_v: float
    frequency_hz: Optional[int] = 50  # 50 or 60 Hz


class OEM(BaseModel):
    """OEM (Original Equipment Manufacturer) for charge points"""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    oem_name: str
    website: Optional[str] = None
    support_email: Optional[EmailStr] = None
    status: str = "ACTIVE"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ChargerModel(BaseModel):
    """Charger model with pre-configured connectors"""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    oem_id: str
    model_name: str
    description: Optional[str] = None
    charger_type: ChargerType = ChargerType.DC
    max_power_kw: float
    max_voltage_v: float
    serial_number_pattern: Optional[str] = None  # Serial number format/pattern
    default_firmware_version: Optional[str] = None  # Default firmware version
    connector_configs: List[ConnectorConfig] = []  # Max 4 connectors
    image_url: Optional[str] = None
    status: str = "ACTIVE"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ============================================
# PASSWORD RESET (Keep existing)
# ============================================

class PasswordResetToken(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    token: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime
    used: bool = False
