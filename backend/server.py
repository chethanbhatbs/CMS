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
from models import ChargingLocation, ChargePoint, Connector

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
    franchise_id: Optional[str] = None


class ChargingLocationResponse(BaseModel):
    id: str
    name: str
    address: str
    city: str
    state: str
    postal_code: str
    country: str
    latitude: Optional[float]
    longitude: Optional[float]
    franchise_id: Optional[str]
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
# CHARGE POINTS ENDPOINTS
# ============================================

class ChargePointCreate(BaseModel):
    charge_point_id: str
    name: str
    location_id: str
    vendor: str
    model: str
    serial_number: Optional[str] = None
    firmware_version: Optional[str] = None
    connectors: List[Connector] = []


class ChargePointUpdate(BaseModel):
    name: Optional[str] = None
    vendor: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    firmware_version: Optional[str] = None
    connectors: Optional[List[Connector]] = None


class ChargePointResponse(BaseModel):
    id: str
    charge_point_id: str
    name: str
    location_id: str
    vendor: str
    model: str
    serial_number: Optional[str] = None
    firmware_version: Optional[str] = None
    connectors: List[Connector]
    status: str
    is_online: bool
    last_heartbeat: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


@api_router.get("/charge-points", response_model=List[ChargePointResponse])
async def get_charge_points(
    location_id: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get all charge points with optional filters"""
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
            {"charge_point_id": {"$regex": search, "$options": "i"}},
            {"vendor": {"$regex": search, "$options": "i"}},
            {"model": {"$regex": search, "$options": "i"}}
        ]
    
    charge_points = await db.charge_points.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    
    # Convert ISO strings back to datetime
    for cp in charge_points:
        if isinstance(cp.get("created_at"), str):
            cp["created_at"] = datetime.fromisoformat(cp["created_at"])
        if isinstance(cp.get("updated_at"), str):
            cp["updated_at"] = datetime.fromisoformat(cp["updated_at"])
        if cp.get("last_heartbeat") and isinstance(cp["last_heartbeat"], str):
            cp["last_heartbeat"] = datetime.fromisoformat(cp["last_heartbeat"])
    
    return charge_points


@api_router.get("/locations/{location_id}/charge-points", response_model=List[ChargePointResponse])
async def get_charge_points_by_location(
    location_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get all charge points for a specific location"""
    # Verify location exists
    location = await db.charging_locations.find_one({"id": location_id}, {"_id": 0})
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    charge_points = await db.charge_points.find({"location_id": location_id}, {"_id": 0}).to_list(100)
    
    # Convert ISO strings back to datetime
    for cp in charge_points:
        if isinstance(cp.get("created_at"), str):
            cp["created_at"] = datetime.fromisoformat(cp["created_at"])
        if isinstance(cp.get("updated_at"), str):
            cp["updated_at"] = datetime.fromisoformat(cp["updated_at"])
        if cp.get("last_heartbeat") and isinstance(cp["last_heartbeat"], str):
            cp["last_heartbeat"] = datetime.fromisoformat(cp["last_heartbeat"])
    
    return charge_points


@api_router.get("/charge-points/{charge_point_id}", response_model=ChargePointResponse)
async def get_charge_point(
    charge_point_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get a specific charge point by ID"""
    charge_point = await db.charge_points.find_one({"id": charge_point_id}, {"_id": 0})
    
    if not charge_point:
        raise HTTPException(status_code=404, detail="Charge point not found")
    
    # Convert ISO strings back to datetime
    if isinstance(charge_point.get("created_at"), str):
        charge_point["created_at"] = datetime.fromisoformat(charge_point["created_at"])
    if isinstance(charge_point.get("updated_at"), str):
        charge_point["updated_at"] = datetime.fromisoformat(charge_point["updated_at"])
    if charge_point.get("last_heartbeat") and isinstance(charge_point["last_heartbeat"], str):
        charge_point["last_heartbeat"] = datetime.fromisoformat(charge_point["last_heartbeat"])
    
    return charge_point


@api_router.post("/charge-points", response_model=ChargePointResponse)
async def create_charge_point(
    charge_point_data: ChargePointCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    """Create a new charge point"""
    # Verify location exists
    location = await db.charging_locations.find_one({"id": charge_point_data.location_id}, {"_id": 0})
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    # Check if charge_point_id already exists
    existing_cp = await db.charge_points.find_one({"charge_point_id": charge_point_data.charge_point_id}, {"_id": 0})
    if existing_cp:
        raise HTTPException(status_code=400, detail="Charge Point ID already exists")
    
    # Create charge point object
    charge_point = ChargePoint(
        charge_point_id=charge_point_data.charge_point_id,
        name=charge_point_data.name,
        location_id=charge_point_data.location_id,
        vendor=charge_point_data.vendor,
        model=charge_point_data.model,
        serial_number=charge_point_data.serial_number,
        firmware_version=charge_point_data.firmware_version,
        connectors=[c.model_dump() for c in charge_point_data.connectors]
    )
    
    # Store in database
    charge_point_dict = charge_point.model_dump()
    charge_point_dict['created_at'] = charge_point_dict['created_at'].isoformat()
    charge_point_dict['updated_at'] = charge_point_dict['updated_at'].isoformat()
    if charge_point_dict.get('last_heartbeat'):
        charge_point_dict['last_heartbeat'] = charge_point_dict['last_heartbeat'].isoformat()
    await db.charge_points.insert_one(charge_point_dict)
    
    # Update location's total_charge_points count
    await db.charging_locations.update_one(
        {"id": charge_point_data.location_id},
        {"$inc": {"total_charge_points": 1}}
    )
    
    return ChargePointResponse(**charge_point.model_dump())


@api_router.put("/charge-points/{charge_point_id}", response_model=ChargePointResponse)
async def update_charge_point(
    charge_point_id: str,
    charge_point_data: ChargePointUpdate,
    current_user: UserResponse = Depends(get_current_user)
):
    """Update an existing charge point"""
    # Find existing charge point
    existing_cp = await db.charge_points.find_one({"id": charge_point_id}, {"_id": 0})
    
    if not existing_cp:
        raise HTTPException(status_code=404, detail="Charge point not found")
    
    # Prepare update data
    update_data = {k: v for k, v in charge_point_data.model_dump().items() if v is not None}
    
    # Convert connectors to dict if provided
    if "connectors" in update_data and update_data["connectors"]:
        update_data["connectors"] = [c.model_dump() for c in charge_point_data.connectors]
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
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

# Include the router in the main app
app.include_router(api_router)

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