# 🍎 Local Development Setup for macOS

## Prerequisites

### 1. Install Python 3.11+
```bash
# Check Python version
python3 --version

# If not 3.11+, install via Homebrew
brew install python@3.11
```

### 2. Install MongoDB (Option A - Recommended)
```bash
# Install MongoDB Community Edition
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Verify it's running
mongosh --eval "db.version()"
```

**OR MongoDB via Docker (Option B):**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

---

## 🚀 Backend Setup

### Step 1: Navigate to backend
```bash
cd /app/backend
```

### Step 2: Create virtual environment
```bash
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install dependencies
```bash
# Use minimal local requirements (no Docker/Emergent packages)
pip install -r requirements-local.txt
```

### Step 4: Configure environment
```bash
# Copy example env file
cp .env.example .env

# Edit if needed (optional)
nano .env
```

### Step 5: Seed admin user
```bash
python seed_admin.py
```

**Output:**
```
✓ Admin user created successfully!
=== Default Login Credentials ===
Email: admin@cms.com
Password: admin123
=================================
```

### Step 6: (Optional) Seed demo data
```bash
python seed_demo_data.py
```

### Step 7: Start backend server
```bash
python run_local.py
```

**Expected Output:**
```
🔗 Attempting to connect to MongoDB: mongodb://localhost:27017
✅ MongoDB connection successful!

============================================================
🚀 Starting FastAPI Server for Local Development
============================================================
Backend: http://localhost:8001
API Docs: http://localhost:8001/docs
OCPP WebSocket: ws://localhost:8001/ocpp/{cp_id}
============================================================

INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8001
```

### Step 8: Test backend
```bash
# In another terminal
curl http://localhost:8001/api/

# Should return: {"message":"EV Charging CMS API"}
```

---

## 🔌 Virtual Charger Setup

### Step 1: Keep backend running (from above)

### Step 2: Open new terminal
```bash
cd /app
```

### Step 3: Activate same virtual environment
```bash
source backend/venv/bin/activate
```

### Step 4: Run virtual charger
```bash
python virtual_charger.py
```

### Step 5: Configure when prompted
```
Enter Charge Point ID: CP-001
Enter WebSocket URL: (just press Enter for default)
```

### Step 6: Use interactive menu
```
1. Connect to CMS
2. Send BootNotification
3. Send StatusNotification (Available)
11. Simulate Full Charging Cycle
```

---

## 🌐 Frontend Setup (Optional)

### Step 1: Navigate to frontend
```bash
cd /app/frontend
```

### Step 2: Install dependencies
```bash
yarn install
# or: npm install
```

### Step 3: Configure environment
```bash
# Create .env
echo "REACT_APP_BACKEND_URL=http://localhost:8001" > .env
```

### Step 4: Start frontend
```bash
yarn start
# or: npm start
```

**Access:** http://localhost:3000
**Login:** admin@cms.com / admin123

---

## 🧪 Testing Workflow

### Test 1: Backend Only
```bash
# Terminal 1: Backend
cd /app/backend
source venv/bin/activate
python run_local.py

# Terminal 2: Virtual Charger
cd /app
source backend/venv/bin/activate
python virtual_charger.py

# Test OCPP commands via simulator menu
```

### Test 2: Full Stack
```bash
# Terminal 1: Backend (keep running)

# Terminal 2: Frontend
cd /app/frontend
yarn start

# Terminal 3: Virtual Charger
cd /app
source backend/venv/bin/activate
python virtual_charger.py

# Access CMS at http://localhost:3000
# Control charger via CLI
# See changes in CMS UI
```

---

## 🐛 Troubleshooting

### MongoDB Not Running
```bash
# Check if MongoDB is running
brew services list | grep mongodb

# Start if stopped
brew services start mongodb-community

# Or use Docker
docker start mongodb
```

### Port Already in Use
```bash
# Kill process on port 8001
lsof -ti:8001 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Import Errors
```bash
# Reinstall dependencies
pip install --force-reinstall -r requirements-local.txt
```

### WebSocket Connection Refused
```bash
# Make sure backend is running
curl http://localhost:8001/api/

# Check backend logs for errors
# Make sure CP-001 exists in database
```

---

## 📝 Quick Start Commands

**One-line backend start:**
```bash
cd /app/backend && source venv/bin/activate && python run_local.py
```

**One-line virtual charger start:**
```bash
cd /app && source backend/venv/bin/activate && python virtual_charger.py
```

**One-line frontend start:**
```bash
cd /app/frontend && yarn start
```

---

## ✅ Success Indicators

**Backend Started:**
- See: "Uvicorn running on http://0.0.0.0:8001"
- curl http://localhost:8001/api/ returns JSON

**Virtual Charger Connected:**
- Menu shows: "✓ Connected successfully!"
- BootNotification returns: "Accepted"

**Frontend Working:**
- Browser opens to http://localhost:3000
- Login page loads
- Can log in with admin@cms.com / admin123

---

**Your local development environment is ready! 🎉**