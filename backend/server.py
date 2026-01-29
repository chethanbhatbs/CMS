from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import Optional, List
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt
import secrets
from models import ChargingLocation, ChargePoint, Connector, OEM, ChargerModel, ConnectorConfig
from ocpp_server import ocpp_router
from ocpp_registry import registry

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', secrets.token_urlsafe(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Models
class UserRole:
    SUPER_ADMIN = "SUPER_ADMIN"
    CPO_ADMIN = "CPO_ADMIN"
    OPERATOR = "OPERATOR"
    FINANCE = "FINANCE"

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    password_hash: str
    full_name: str
    role: str = UserRole.SUPER_ADMIN
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = UserRole.SUPER_ADMIN

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class PasswordResetToken(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    token: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime
    used: bool = False

# Helper functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> UserResponse:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication credentials")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication failed")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    
    return UserResponse(**user)

# Routes
@api_router.get("/")
async def root():
    return {"message": "EV Charging CMS API"}

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserRegister):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    user = User(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        role=user_data.role
    )
    
    # Store in database
    user_dict = user.model_dump()
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    user_dict['updated_at'] = user_dict['updated_at'].isoformat()
    await db.users.insert_one(user_dict)
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id})
    
    user_response = UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at
    )
    
    return TokenResponse(access_token=access_token, user=user_response)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    # Find user
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify password
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Check if user is active
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Account is inactive")
    
    # Create access token
    access_token = create_access_token(data={"sub": user["id"]})
    
    user_response = UserResponse(
        id=user["id"],
        email=user["email"],
        full_name=user["full_name"],
        role=user["role"],
        is_active=user["is_active"],
        created_at=datetime.fromisoformat(user["created_at"]) if isinstance(user["created_at"], str) else user["created_at"]
    )
    
    return TokenResponse(access_token=access_token, user=user_response)

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: UserResponse = Depends(get_current_user)):
    return current_user

@api_router.post("/auth/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    # Find user
    user = await db.users.find_one({"email": request.email}, {"_id": 0})
    if not user:
        # Don't reveal if email exists or not
        return {"message": "If the email exists, a reset token has been generated"}
    
    # Generate reset token
    reset_token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
    
    token_obj = PasswordResetToken(
        user_id=user["id"],
        token=reset_token,
        expires_at=expires_at
    )
    
    # Store token
    token_dict = token_obj.model_dump()
    token_dict['created_at'] = token_dict['created_at'].isoformat()
    token_dict['expires_at'] = token_dict['expires_at'].isoformat()
    await db.password_reset_tokens.insert_one(token_dict)
    
    # In production, send email with reset link
    # For now, return the token (remove this in production)
    return {
        "message": "If the email exists, a reset token has been generated",
        "reset_token": reset_token,
        "reset_link": f"/reset-password?token={reset_token}"
    }

@api_router.post("/auth/reset-password")
async def reset_password(request: ResetPasswordRequest):
    # Find token
    token = await db.password_reset_tokens.find_one(
        {"token": request.token, "used": False},
        {"_id": 0}
    )
    
    if not token:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    # Check if token is expired
    expires_at = datetime.fromisoformat(token["expires_at"]) if isinstance(token["expires_at"], str) else token["expires_at"]
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Reset token has expired")
    
    # Update user password
    new_password_hash = get_password_hash(request.new_password)
    await db.users.update_one(
        {"id": token["user_id"]},
        {"$set": {"password_hash": new_password_hash, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Mark token as used
    await db.password_reset_tokens.update_one(
        {"token": request.token},
        {"$set": {"used": True}}
    )
    
    return {"message": "Password reset successful"}


# ============================================
# CHARGING LOCATIONS ENDPOINTS
# ============================================

class ChargingLocationCreate(BaseModel):
    name: str
    address: str
    city: str
    state: str
    postal_code: str
    country: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    image_url: Optional[str] = None
    franchise_id: Optional[str] = None


class ChargingLocationUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    image_url: Optional[str] = None
    franchise_id: Optional[str] = None


class ChargingLocationResponse(BaseModel):
    id: str
    name: str
    address: str
    city: str
    state: str
    postal_code: str
    country: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    image_url: Optional[str] = None
    franchise_id: Optional[str] = None
    total_charge_points: int
    status: str
    created_at: datetime
    updated_at: datetime


@api_router.get("/locations", response_model=List[ChargingLocationResponse])
async def get_locations(
    search: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get all charging locations with optional search and filters"""
    query = {}
    
    # Add search filter
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"city": {"$regex": search, "$options": "i"}},
            {"address": {"$regex": search, "$options": "i"}}
        ]
    
    # Add status filter
    if status:
        query["status"] = status
    
    locations = await db.charging_locations.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    
    # Convert ISO strings back to datetime
    for location in locations:
        if isinstance(location.get("created_at"), str):
            location["created_at"] = datetime.fromisoformat(location["created_at"])
        if isinstance(location.get("updated_at"), str):
            location["updated_at"] = datetime.fromisoformat(location["updated_at"])
    
    return locations


@api_router.get("/locations/{location_id}", response_model=ChargingLocationResponse)
async def get_location(
    location_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get a specific charging location by ID"""
    location = await db.charging_locations.find_one({"id": location_id}, {"_id": 0})
    
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    # Convert ISO strings back to datetime
    if isinstance(location.get("created_at"), str):
        location["created_at"] = datetime.fromisoformat(location["created_at"])
    if isinstance(location.get("updated_at"), str):
        location["updated_at"] = datetime.fromisoformat(location["updated_at"])
    
    return location


@api_router.post("/locations", response_model=ChargingLocationResponse)
async def create_location(
    location_data: ChargingLocationCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    """Create a new charging location"""
    # Create location object
    location = ChargingLocation(
        name=location_data.name,
        address=location_data.address,
        city=location_data.city,
        state=location_data.state,
        postal_code=location_data.postal_code,
        country=location_data.country,
        latitude=location_data.latitude,
        longitude=location_data.longitude,
        franchise_id=location_data.franchise_id
    )
    
    # Store in database
    location_dict = location.model_dump()
    location_dict['created_at'] = location_dict['created_at'].isoformat()
    location_dict['updated_at'] = location_dict['updated_at'].isoformat()
    await db.charging_locations.insert_one(location_dict)
    
    return ChargingLocationResponse(**location.model_dump())


@api_router.put("/locations/{location_id}", response_model=ChargingLocationResponse)
async def update_location(
    location_id: str,
    location_data: ChargingLocationUpdate,
    current_user: UserResponse = Depends(get_current_user)
):
    """Update an existing charging location"""
    # Find existing location
    existing_location = await db.charging_locations.find_one({"id": location_id}, {"_id": 0})
    
    if not existing_location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    # Prepare update data
    update_data = {k: v for k, v in location_data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Update location
    await db.charging_locations.update_one(
        {"id": location_id},
        {"$set": update_data}
    )
    
    # Get updated location
    updated_location = await db.charging_locations.find_one({"id": location_id}, {"_id": 0})
    
    # Convert ISO strings back to datetime
    if isinstance(updated_location.get("created_at"), str):
        updated_location["created_at"] = datetime.fromisoformat(updated_location["created_at"])
    if isinstance(updated_location.get("updated_at"), str):
        updated_location["updated_at"] = datetime.fromisoformat(updated_location["updated_at"])
    
    return updated_location


@api_router.patch("/locations/{location_id}/status")
async def update_location_status(
    location_id: str,
    status: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Update location status (enable/disable)"""
    # Validate status
    if status not in ["ACTIVE", "INACTIVE"]:
        raise HTTPException(status_code=400, detail="Invalid status. Must be ACTIVE or INACTIVE")
    
    # Update status
    result = await db.charging_locations.update_one(
        {"id": location_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Location not found")
    
    return {"message": f"Location status updated to {status}"}


@api_router.delete("/locations/{location_id}")
async def delete_location(
    location_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Delete (soft delete) a charging location"""
    # Soft delete by setting status to INACTIVE
    result = await db.charging_locations.update_one(
        {"id": location_id},
        {"$set": {"status": "INACTIVE", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Location not found")
    
    return {"message": "Location deleted successfully"}


# ============================================
# OEM MANAGEMENT ENDPOINTS
# ============================================

class OEMCreate(BaseModel):
    oem_name: str
    website: Optional[str] = None
    support_email: Optional[EmailStr] = None


class OEMUpdate(BaseModel):
    oem_name: Optional[str] = None
    website: Optional[str] = None
    support_email: Optional[EmailStr] = None


class OEMResponse(BaseModel):
    id: str
    oem_name: str
    website: Optional[str]
    support_email: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime


@api_router.get("/oems", response_model=List[OEMResponse])
async def get_oems(
    current_user: UserResponse = Depends(get_current_user)
):
    """Get all OEMs"""
    oems = await db.oems.find({"status": "ACTIVE"}, {"_id": 0}).to_list(100)
    
    for oem in oems:
        if isinstance(oem.get("created_at"), str):
            oem["created_at"] = datetime.fromisoformat(oem["created_at"])
        if isinstance(oem.get("updated_at"), str):
            oem["updated_at"] = datetime.fromisoformat(oem["updated_at"])
    
    return oems


@api_router.post("/oems", response_model=OEMResponse)
async def create_oem(
    oem_data: OEMCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    """Create a new OEM"""
    oem = OEM(**oem_data.model_dump())
    
    oem_dict = oem.model_dump()
    oem_dict['created_at'] = oem_dict['created_at'].isoformat()
    oem_dict['updated_at'] = oem_dict['updated_at'].isoformat()
    await db.oems.insert_one(oem_dict)
    
    return OEMResponse(**oem.model_dump())


@api_router.put("/oems/{oem_id}", response_model=OEMResponse)
async def update_oem(
    oem_id: str,
    oem_data: OEMUpdate,
    current_user: UserResponse = Depends(get_current_user)
):
    """Update an existing OEM"""
    existing_oem = await db.oems.find_one({"id": oem_id}, {"_id": 0})
    
    if not existing_oem:
        raise HTTPException(status_code=404, detail="OEM not found")
    
    update_data = {k: v for k, v in oem_data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.oems.update_one(
        {"id": oem_id},
        {"$set": update_data}
    )
    
    updated_oem = await db.oems.find_one({"id": oem_id}, {"_id": 0})
    
    if isinstance(updated_oem.get("created_at"), str):
        updated_oem["created_at"] = datetime.fromisoformat(updated_oem["created_at"])
    if isinstance(updated_oem.get("updated_at"), str):
        updated_oem["updated_at"] = datetime.fromisoformat(updated_oem["updated_at"])
    
    return updated_oem


@api_router.delete("/oems/{oem_id}")
async def delete_oem(
    oem_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Delete (soft delete) an OEM"""
    result = await db.oems.update_one(
        {"id": oem_id},
        {"$set": {"status": "INACTIVE", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="OEM not found")
    
    return {"message": "OEM deleted successfully"}


# ============================================
# CHARGER MODEL MANAGEMENT ENDPOINTS
# ============================================

class ChargerModelCreate(BaseModel):
    oem_id: str
    model_name: str
    description: Optional[str] = None
    charger_type: str = "DC"
    max_power_kw: float
    max_voltage_v: float
    connector_configs: List[ConnectorConfig] = []


class ChargerModelResponse(BaseModel):
    id: str
    oem_id: str
    model_name: str
    description: Optional[str]
    protocol: str
    charger_type: str
    max_power_kw: float
    max_voltage_v: float
    connector_configs: List[ConnectorConfig]
    status: str
    created_at: datetime
    updated_at: datetime


@api_router.get("/charger-models", response_model=List[ChargerModelResponse])
async def get_charger_models(
    oem_id: Optional[str] = None,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get all charger models, optionally filtered by OEM"""
    query = {"status": "ACTIVE"}
    if oem_id:
        query["oem_id"] = oem_id
    
    models = await db.charger_models.find(query, {"_id": 0}).to_list(100)
    
    for model in models:
        if isinstance(model.get("created_at"), str):
            model["created_at"] = datetime.fromisoformat(model["created_at"])
        if isinstance(model.get("updated_at"), str):
            model["updated_at"] = datetime.fromisoformat(model["updated_at"])
    
    return models


@api_router.post("/charger-models", response_model=ChargerModelResponse)
async def create_charger_model(
    model_data: ChargerModelCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    """Create a new charger model"""
    # Verify OEM exists
    oem = await db.oems.find_one({"id": model_data.oem_id}, {"_id": 0})
    if not oem:
        raise HTTPException(status_code=404, detail="OEM not found")
    
    # Validate max 4 connectors
    if len(model_data.connector_configs) > 4:
        raise HTTPException(status_code=400, detail="Maximum 4 connectors allowed per charger model")
    
    charger_model = ChargerModel(**model_data.model_dump())
    
    model_dict = charger_model.model_dump()
    model_dict['created_at'] = model_dict['created_at'].isoformat()
    model_dict['updated_at'] = model_dict['updated_at'].isoformat()
    await db.charger_models.insert_one(model_dict)
    
    return ChargerModelResponse(**charger_model.model_dump())


@api_router.get("/charger-models/{model_id}", response_model=ChargerModelResponse)
async def get_charger_model(
    model_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get a specific charger model"""
    model = await db.charger_models.find_one({"id": model_id}, {"_id": 0})
    
    if not model:
        raise HTTPException(status_code=404, detail="Charger model not found")
    
    if isinstance(model.get("created_at"), str):
        model["created_at"] = datetime.fromisoformat(model["created_at"])
    if isinstance(model.get("updated_at"), str):
        model["updated_at"] = datetime.fromisoformat(model["updated_at"])
    
    return model


@api_router.put("/charger-models/{model_id}", response_model=ChargerModelResponse)
async def update_charger_model(
    model_id: str,
    model_data: ChargerModelCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    """Update an existing charger model"""
    existing_model = await db.charger_models.find_one({"id": model_id}, {"_id": 0})
    
    if not existing_model:
        raise HTTPException(status_code=404, detail="Charger model not found")
    
    if len(model_data.connector_configs) > 4:
        raise HTTPException(status_code=400, detail="Maximum 4 connectors allowed per charger model")
    
    update_data = model_data.model_dump()
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.charger_models.update_one(
        {"id": model_id},
        {"$set": update_data}
    )
    
    updated_model = await db.charger_models.find_one({"id": model_id}, {"_id": 0})
    
    if isinstance(updated_model.get("created_at"), str):
        updated_model["created_at"] = datetime.fromisoformat(updated_model["created_at"])
    if isinstance(updated_model.get("updated_at"), str):
        updated_model["updated_at"] = datetime.fromisoformat(updated_model["updated_at"])
    
    return updated_model


@api_router.delete("/charger-models/{model_id}")
async def delete_charger_model(
    model_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Delete (soft delete) a charger model"""
    result = await db.charger_models.update_one(
        {"id": model_id},
        {"$set": {"status": "INACTIVE", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Charger model not found")
    
    return {"message": "Charger model deleted successfully"}


# ============================================
# CHARGE POINTS ENDPOINTS
# ============================================

class ChargePointCreate(BaseModel):
    charge_point_id: str
    name: str
    location_id: str
    oem_id: str
    charger_model_id: str
    serial_number: Optional[str] = None
    firmware_version: Optional[str] = None
    websocket_id: Optional[str] = None
    go_live_date: Optional[datetime] = None
    connectors: List[Connector] = []  # Will be populated from model


class ChargePointUpdate(BaseModel):
    name: Optional[str] = None
    serial_number: Optional[str] = None
    firmware_version_override: Optional[str] = None
    websocket_id: Optional[str] = None
    go_live_date: Optional[datetime] = None


class ChargePointResponse(BaseModel):
    id: str
    charge_point_id: str
    name: str
    location_id: str
    oem_id: str
    charger_model_id: str
    vendor: str  # Derived from OEM
    model: str  # Derived from ChargerModel
    protocol: str  # Derived from ChargerModel
    charger_type: str  # Derived from ChargerModel
    max_power_kw: float  # Derived from ChargerModel
    max_voltage_v: float  # Derived from ChargerModel
    serial_number: Optional[str] = None
    firmware_version: str  # From ChargerModel or override
    websocket_id: Optional[str] = None
    go_live_date: Optional[datetime] = None
    connectors: List[Connector]  # Derived from ChargerModel
    status: str
    is_online: bool
    last_heartbeat: Optional[datetime] = None
    total_energy_kwh: float
    total_sessions: int
    created_at: datetime
    updated_at: datetime


# Helper function to enrich charge point with model data
async def enrich_charge_point(cp_doc: dict) -> dict:
    """Enrich charge point with data from ChargerModel and OEM"""
    # Fetch ChargerModel
    charger_model = await db.charger_models.find_one({"id": cp_doc.get("charger_model_id")}, {"_id": 0})
    if not charger_model:
        raise HTTPException(status_code=404, detail=f"Charger model not found for CP {cp_doc.get('charge_point_id')}")
    
    # Fetch OEM
    oem = await db.oems.find_one({"id": cp_doc.get("oem_id")}, {"_id": 0})
    if not oem:
        raise HTTPException(status_code=404, detail=f"OEM not found for CP {cp_doc.get('charge_point_id')}")
    
    # Derive fields from model
    cp_doc["vendor"] = oem["oem_name"]
    cp_doc["model"] = charger_model["model_name"]
    cp_doc["protocol"] = charger_model.get("protocol", "OCPP 1.6")
    cp_doc["charger_type"] = charger_model.get("charger_type", "DC")
    cp_doc["max_power_kw"] = charger_model.get("max_power_kw", 0)
    cp_doc["max_voltage_v"] = charger_model.get("max_voltage_v", 0)
    
    # Firmware: use override if present, otherwise use model default
    cp_doc["firmware_version"] = cp_doc.get("firmware_version_override") or charger_model.get("default_firmware_version") or "Not Set"
    
    # Connectors: derive from model's connector_configs
    cp_doc["connectors"] = [
        {
            "connector_id": config["connector_number"],
            "connector_type": config["connector_type"],
            "power_kw": config["max_power_kw"],
            "status": "AVAILABLE"  # Default status, will be updated by OCPP
        }
        for config in charger_model.get("connector_configs", [])
    ]
    
    return cp_doc


@api_router.get("/charge-points", response_model=List[ChargePointResponse])
async def get_charge_points(
    location_id: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get all charge points with enriched data from models"""
    query = {}
    
    # Add location filter
    if location_id:
        query["location_id"] = location_id
    
    # Add status filter
    if status:
        query["status"] = status
    
    # Add search filter
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"charge_point_id": {"$regex": search, "$options": "i"}}
        ]
    
    charge_points = await db.charge_points.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    
    # Enrich each charge point
    enriched_cps = []
    for cp in charge_points:
        try:
            enriched_cp = await enrich_charge_point(cp)
            
            # Convert ISO strings back to datetime
            if isinstance(enriched_cp.get("created_at"), str):
                enriched_cp["created_at"] = datetime.fromisoformat(enriched_cp["created_at"])
            if isinstance(enriched_cp.get("updated_at"), str):
                enriched_cp["updated_at"] = datetime.fromisoformat(enriched_cp["updated_at"])
            if enriched_cp.get("last_heartbeat") and isinstance(enriched_cp["last_heartbeat"], str):
                enriched_cp["last_heartbeat"] = datetime.fromisoformat(enriched_cp["last_heartbeat"])
            if enriched_cp.get("go_live_date") and isinstance(enriched_cp["go_live_date"], str):
                enriched_cp["go_live_date"] = datetime.fromisoformat(enriched_cp["go_live_date"])
            
            enriched_cps.append(enriched_cp)
        except HTTPException as e:
            # Skip CPs with missing model/oem references
            logger.warning(f"Skipping CP {cp.get('charge_point_id')}: {e.detail}")
            continue
    
    return enriched_cps


@api_router.get("/locations/{location_id}/charge-points", response_model=List[ChargePointResponse])
async def get_charge_points_by_location(
    location_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get all charge points for a specific location with enriched data"""
    # Verify location exists
    location = await db.charging_locations.find_one({"id": location_id}, {"_id": 0})
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    charge_points = await db.charge_points.find({"location_id": location_id}, {"_id": 0}).to_list(100)
    
    # Enrich each charge point
    enriched_cps = []
    for cp in charge_points:
        try:
            enriched_cp = await enrich_charge_point(cp)
            
            # Convert ISO strings back to datetime
            if isinstance(enriched_cp.get("created_at"), str):
                enriched_cp["created_at"] = datetime.fromisoformat(enriched_cp["created_at"])
            if isinstance(enriched_cp.get("updated_at"), str):
                enriched_cp["updated_at"] = datetime.fromisoformat(enriched_cp["updated_at"])
            if enriched_cp.get("last_heartbeat") and isinstance(enriched_cp["last_heartbeat"], str):
                enriched_cp["last_heartbeat"] = datetime.fromisoformat(enriched_cp["last_heartbeat"])
            if enriched_cp.get("go_live_date") and isinstance(enriched_cp["go_live_date"], str):
                enriched_cp["go_live_date"] = datetime.fromisoformat(enriched_cp["go_live_date"])
            
            enriched_cps.append(enriched_cp)
        except HTTPException:
            continue
    
    return enriched_cps


@api_router.get("/charge-points/{charge_point_id}", response_model=ChargePointResponse)
async def get_charge_point(
    charge_point_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get a specific charge point by ID with enriched data"""
    charge_point = await db.charge_points.find_one({"id": charge_point_id}, {"_id": 0})
    
    if not charge_point:
        raise HTTPException(status_code=404, detail="Charge point not found")
    
    # Enrich with model data
    enriched_cp = await enrich_charge_point(charge_point)
    
    # Convert ISO strings back to datetime
    if isinstance(enriched_cp.get("created_at"), str):
        enriched_cp["created_at"] = datetime.fromisoformat(enriched_cp["created_at"])
    if isinstance(enriched_cp.get("updated_at"), str):
        enriched_cp["updated_at"] = datetime.fromisoformat(enriched_cp["updated_at"])
    if enriched_cp.get("last_heartbeat") and isinstance(enriched_cp["last_heartbeat"], str):
        enriched_cp["last_heartbeat"] = datetime.fromisoformat(enriched_cp["last_heartbeat"])
    if enriched_cp.get("go_live_date") and isinstance(enriched_cp["go_live_date"], str):
        enriched_cp["go_live_date"] = datetime.fromisoformat(enriched_cp["go_live_date"])
    
    return enriched_cp


@api_router.post("/charge-points", response_model=ChargePointResponse)
@api_router.post("/charge-points", response_model=ChargePointResponse)
async def create_charge_point(
    charge_point_data: ChargePointCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    """Create a new charge point (reference-based)"""
    # Verify location exists
    location = await db.charging_locations.find_one({"id": charge_point_data.location_id}, {"_id": 0})
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    # Verify OEM exists
    oem = await db.oems.find_one({"id": charge_point_data.oem_id}, {"_id": 0})
    if not oem:
        raise HTTPException(status_code=404, detail="OEM not found")
    
    # Verify ChargerModel exists
    charger_model = await db.charger_models.find_one({"id": charge_point_data.charger_model_id}, {"_id": 0})
    if not charger_model:
        raise HTTPException(status_code=404, detail="Charger model not found")
    
    # Check if charge_point_id already exists
    existing_cp = await db.charge_points.find_one({"charge_point_id": charge_point_data.charge_point_id}, {"_id": 0})
    if existing_cp:
        raise HTTPException(status_code=400, detail="Charge Point ID already exists")
    
    # Create charge point (store only references and instance-specific data)
    cp_id = str(uuid.uuid4())
    charge_point_doc = {
        "id": cp_id,
        "charge_point_id": charge_point_data.charge_point_id,
        "name": charge_point_data.name,
        "location_id": charge_point_data.location_id,
        "oem_id": charge_point_data.oem_id,
        "charger_model_id": charge_point_data.charger_model_id,
        "serial_number": charge_point_data.serial_number,
        "firmware_version_override": charge_point_data.firmware_version,
        "websocket_id": charge_point_data.websocket_id,
        "go_live_date": charge_point_data.go_live_date.isoformat() if charge_point_data.go_live_date else None,
        "status": "UNAVAILABLE",  # Default to UNAVAILABLE until OCPP StatusNotification
        "is_online": False,
        "last_heartbeat": None,
        "total_energy_kwh": 0.0,
        "total_sessions": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.charge_points.insert_one(charge_point_doc)
    
    # Update location's total_charge_points count
    await db.charging_locations.update_one(
        {"id": charge_point_data.location_id},
        {"$inc": {"total_charge_points": 1}}
    )
    
    # Fetch and enrich for response
    created_cp = await db.charge_points.find_one({"id": cp_id}, {"_id": 0})
    enriched_cp = await enrich_charge_point(created_cp)
    
    # Convert ISO strings
    enriched_cp["created_at"] = datetime.fromisoformat(enriched_cp["created_at"])
    enriched_cp["updated_at"] = datetime.fromisoformat(enriched_cp["updated_at"])
    
    return ChargePointResponse(**enriched_cp)


@api_router.put("/charge-points/{charge_point_id}", response_model=ChargePointResponse)
async def update_charge_point(
    charge_point_id: str,
    charge_point_data: ChargePointUpdate,
    current_user: UserResponse = Depends(get_current_user)
):
    """Update an existing charge point (instance-specific fields only)"""
    # Find existing charge point
    existing_cp = await db.charge_points.find_one({"id": charge_point_id}, {"_id": 0})
    
    if not existing_cp:
        raise HTTPException(status_code=404, detail="Charge point not found")
    
    # Prepare update data (only instance-specific fields)
    update_data = {k: v for k, v in charge_point_data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Update charge point
    await db.charge_points.update_one(
        {"id": charge_point_id},
        {"$set": update_data}
    )
    
    # Get updated charge point and enrich
    updated_cp = await db.charge_points.find_one({"id": charge_point_id}, {"_id": 0})
    enriched_cp = await enrich_charge_point(updated_cp)
    
    # Convert ISO strings back to datetime
    if isinstance(enriched_cp.get("created_at"), str):
        enriched_cp["created_at"] = datetime.fromisoformat(enriched_cp["created_at"])
    if isinstance(enriched_cp.get("updated_at"), str):
        enriched_cp["updated_at"] = datetime.fromisoformat(enriched_cp["updated_at"])
    if enriched_cp.get("last_heartbeat") and isinstance(enriched_cp["last_heartbeat"], str):
        enriched_cp["last_heartbeat"] = datetime.fromisoformat(enriched_cp["last_heartbeat"])
    if enriched_cp.get("go_live_date") and isinstance(enriched_cp["go_live_date"], str):
        enriched_cp["go_live_date"] = datetime.fromisoformat(enriched_cp["go_live_date"])
    
    return enriched_cp
    
    # Update charge point
    await db.charge_points.update_one(
        {"id": charge_point_id},
        {"$set": update_data}
    )
    
    # Get updated charge point
    updated_cp = await db.charge_points.find_one({"id": charge_point_id}, {"_id": 0})
    
    # Convert ISO strings back to datetime
    if isinstance(updated_cp.get("created_at"), str):
        updated_cp["created_at"] = datetime.fromisoformat(updated_cp["created_at"])
    if isinstance(updated_cp.get("updated_at"), str):
        updated_cp["updated_at"] = datetime.fromisoformat(updated_cp["updated_at"])
    if updated_cp.get("last_heartbeat") and isinstance(updated_cp["last_heartbeat"], str):
        updated_cp["last_heartbeat"] = datetime.fromisoformat(updated_cp["last_heartbeat"])
    
    return updated_cp


@api_router.patch("/charge-points/{charge_point_id}/status")
async def update_charge_point_status(
    charge_point_id: str,
    status: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Update charge point status"""
    # Validate status
    valid_statuses = ["AVAILABLE", "OCCUPIED", "UNAVAILABLE", "FAULTED", "OFFLINE"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}")
    
    # Update status
    result = await db.charge_points.update_one(
        {"id": charge_point_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Charge point not found")
    
    return {"message": f"Charge point status updated to {status}"}


@api_router.delete("/charge-points/{charge_point_id}")
async def delete_charge_point(
    charge_point_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Delete (soft delete) a charge point"""
    # Get charge point to find location_id
    charge_point = await db.charge_points.find_one({"id": charge_point_id}, {"_id": 0})
    
    if not charge_point:
        raise HTTPException(status_code=404, detail="Charge point not found")
    
    # Soft delete by setting status to UNAVAILABLE
    await db.charge_points.update_one(
        {"id": charge_point_id},
        {"$set": {"status": "UNAVAILABLE", "is_online": False, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Decrement location's total_charge_points count
    await db.charging_locations.update_one(
        {"id": charge_point["location_id"]},
        {"$inc": {"total_charge_points": -1}}
    )
    
    return {"message": "Charge point deleted successfully"}


# ============================================
# OCPP REMOTE COMMANDS
# ============================================

@api_router.post("/charge-points/{cp_id}/remote-start")
async def remote_start_transaction(
    cp_id: str,
    id_tag: str,
    connector_id: int = 1,
    current_user: UserResponse = Depends(get_current_user)
):
    """Send RemoteStartTransaction command to charge point"""
    from ocpp.v16 import call as ocpp_call
    
    # Get charge point from registry
    cp = registry.get(cp_id)
    if not cp:
        raise HTTPException(status_code=404, detail="Charge point not connected")
    
    try:
        request = ocpp_call.RemoteStartTransactionPayload(
            id_tag=id_tag,
            connector_id=connector_id
        )
        response = await cp.call(request)
        
        # Log action
        await db.charger_logs.insert_one({
            "charge_point_id": cp_id,
            "log_level": "INFO",
            "message": f"Remote start initiated for connector {connector_id}",
            "action": "RemoteStartTransaction",
            "metadata": {"id_tag": id_tag, "connector_id": connector_id, "status": response.status},
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        return {"status": response.status, "message": "Remote start command sent"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/charge-points/{cp_id}/remote-stop")
async def remote_stop_transaction(
    cp_id: str,
    transaction_id: int,
    current_user: UserResponse = Depends(get_current_user)
):
    """Send RemoteStopTransaction command to charge point"""
    from ocpp.v16 import call as ocpp_call
    
    cp = registry.get(cp_id)
    if not cp:
        raise HTTPException(status_code=404, detail="Charge point not connected")
    
    try:
        request = ocpp_call.RemoteStopTransactionPayload(
            transaction_id=transaction_id
        )
        response = await cp.call(request)
        
        await db.charger_logs.insert_one({
            "charge_point_id": cp_id,
            "log_level": "INFO",
            "message": f"Remote stop initiated for transaction {transaction_id}",
            "action": "RemoteStopTransaction",
            "metadata": {"transaction_id": transaction_id, "status": response.status},
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        return {"status": response.status, "message": "Remote stop command sent"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/charge-points/{cp_id}/reset")
async def reset_charge_point(
    cp_id: str,
    reset_type: str = "Soft",
    current_user: UserResponse = Depends(get_current_user)
):
    """Send Reset command to charge point"""
    from ocpp.v16 import call as ocpp_call
    from ocpp.v16.enums import ResetType
    
    cp = registry.get(cp_id)
    if not cp:
        raise HTTPException(status_code=404, detail="Charge point not connected")
    
    try:
        reset_enum = ResetType.soft if reset_type == "Soft" else ResetType.hard
        request = ocpp_call.ResetPayload(type=reset_enum)
        response = await cp.call(request)
        
        await db.charger_logs.insert_one({
            "charge_point_id": cp_id,
            "log_level": "WARNING",
            "message": f"{reset_type} reset initiated",
            "action": "Reset",
            "metadata": {"reset_type": reset_type, "status": response.status},
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        return {"status": response.status, "message": f"{reset_type} reset command sent"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/charge-points/{cp_id}/change-availability")
async def change_availability(
    cp_id: str,
    connector_id: int,
    availability_type: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Send ChangeAvailability command to charge point"""
    from ocpp.v16 import call as ocpp_call
    from ocpp.v16.enums import AvailabilityType
    
    cp = registry.get(cp_id)
    if not cp:
        raise HTTPException(status_code=404, detail="Charge point not connected")
    
    try:
        avail_enum = AvailabilityType.operative if availability_type == "Operative" else AvailabilityType.inoperative
        request = ocpp_call.ChangeAvailabilityPayload(
            connector_id=connector_id,
            type=avail_enum
        )
        response = await cp.call(request)
        
        await db.charger_logs.insert_one({
            "charge_point_id": cp_id,
            "log_level": "INFO",
            "message": f"Availability changed for connector {connector_id} to {availability_type}",
            "action": "ChangeAvailability",
            "metadata": {"connector_id": connector_id, "type": availability_type, "status": response.status},
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        return {"status": response.status, "message": "Change availability command sent"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/charge-points/connected/list")
async def get_connected_charge_points(
    current_user: UserResponse = Depends(get_current_user)
):
    """Get list of currently connected charge points"""
    connected_cps = registry.get_all()
    return {
        "connected_count": registry.count(),
        "charge_points": connected_cps
    }

# Include the router in the main app
app.include_router(api_router)
app.include_router(ocpp_router)  # Add OCPP WebSocket router

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()