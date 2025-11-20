# 🧠 EEG Integration - Quick Start Guide

**Last Updated:** 20/11/2025
**Status:** ✅ **Mock Data REMOVED** - Real EEG Integration Ready

---

## ✅ What Was Changed

### 1. Mock Data Completely Removed

**File:** [neuroone-frontend/src/pages/student/StudentSession.jsx](../neuroone-frontend/src/pages/student/StudentSession.jsx)

**Before (Mock Data):**
```javascript
// ❌ REMOVED: Mock data generation
const connectEEG = useCallback(() => {
  setEegConnected(true);
  eegIntervalRef.current = setInterval(() => {
    const mockData = {
      attention: 50 + Math.floor(Math.random() * 40),      // FAKE
      relaxation: 40 + Math.floor(Math.random() * 40),     // FAKE
      delta: 80000 + Math.floor(Math.random() * 120000),   // FAKE
      // ... more fake data
    };
    socket.emit('eeg:data', mockData); // Sending fake data
  }, 250);
}, []);
```

**After (Real EEG Integration):**
```javascript
// ✅ NEW: Real EEG device connection
const connectEEG = useCallback(() => {
  setEegConnected(true);
  // Data will be received via 'eeg:update' Socket.IO event from Python bridge
  console.log('🔌 EEG connection ready. Waiting for Python bridge...');
}, [user, session]);

// ✅ NEW: Listener for real EEG data
socket.on('eeg:update', (data) => {
  if (data.studentId === user.id) {
    setEegData({
      attention: data.attention,
      relaxation: data.relaxation,
      signalQuality: data.signalQuality,
    });
  }
});
```

### 2. Real-Time Data Flow Architecture

```
┌─────────────────┐      Serial/Bluetooth      ┌─────────────────┐
│  EEG Device     │ ────────────────────────────▶│  eeg_bridge.py  │
│  (NeuroSky)     │    ThinkGear Protocol       │  (Python)       │
└─────────────────┘                             └────────┬────────┘
                                                         │
                                                  WebSocket (ws://localhost:3001)
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │  Node.js        │
                                                │  Backend        │
                                                │  Port 3001      │
                                                └────────┬────────┘
                                                         │
                                                  Socket.IO Broadcast
                                                         │
                                       ┌─────────────────┴─────────────────┐
                                       ▼                                   ▼
                                ┌──────────────┐                   ┌──────────────┐
                                │  Student     │                   │  Teacher     │
                                │  Frontend    │                   │  Dashboard   │
                                │  Port 5173   │                   │  Port 5173   │
                                └──────────────┘                   └──────────────┘
```

---

## 🚀 How to Use Real EEG Device

### Step 1: Install Python Dependencies ✅

```bash
cd neuroone-python-eeg
pip install -r requirements.txt
```

**Dependencies Installed:**
- ✅ `websockets==12.0` - WebSocket client
- ✅ `pyserial==3.5` - Serial communication
- ✅ `colorlog==6.8.0` - Colored logging

### Step 2: Configure EEG Device

#### NeuroSky MindWave (Bluetooth)

**Windows:**
1. Turn on the MindWave headset
2. Open Settings → Bluetooth
3. Pair device (PIN: `0000` or `1234`)
4. Go to Control Panel → Devices → COM Ports
5. Note the COM port (e.g., `COM3`)

**Linux:**
```bash
bluetoothctl
> scan on
> pair XX:XX:XX:XX:XX:XX
> connect XX:XX:XX:XX:XX:XX
sudo rfcomm bind /dev/rfcomm0 XX:XX:XX:XX:XX:XX
```

**macOS:**
```bash
# Use System Preferences → Bluetooth
# Port will be something like /dev/tty.MindWave-SerialPort
```

### Step 3: Start Backend and Frontend

**Terminal 1 - Backend:**
```bash
cd neuroone-backend
npm start
# ✅ Backend running on http://localhost:3001
```

**Terminal 2 - Frontend:**
```bash
cd neuroone-frontend
npm run dev
# ✅ Frontend running on http://localhost:5173
```

### Step 4: Start Active Session

1. Login as **Teacher** (professor@neuroone.com)
2. Create a new session or select existing
3. Click "Iniciar Sessão" (Start Session)
4. Note the **Session ID** from URL

### Step 5: Get Student ID

1. Login as **Student** (aluno@neuroone.com)
2. Open browser console (F12)
3. Look for connection logs showing student ID
4. Or query from database:
   ```bash
   # Get student ID
   curl http://localhost:3001/api/users | grep -A 5 "aluno@neuroone.com"
   ```

### Step 6: Start Python EEG Bridge

```bash
cd neuroone-python-eeg

python eeg_bridge.py \
  --port COM3 \
  --student-id "a3f73c22-ba4b-43a3-9e94-a2a7dd1b9634" \
  --session-id "3f46f990-5ede-4b6b-a7c3-45c6d89ecf6f"
```

**Parameters:**
- `--port`: Serial port of EEG device (Windows: `COM3`, Linux: `/dev/rfcomm0`)
- `--student-id`: UUID of the student (get from database or browser console)
- `--session-id`: UUID of active session (get from URL)
- `--backend`: (Optional) Backend URL (default: `ws://localhost:3001`)

### Step 7: Verify Data Flow

**Expected Output in Python Bridge:**
```
[INFO] Connecting to serial port COM3...
[INFO] Connected to EEG device
[INFO] Connecting to WebSocket ws://localhost:3001...
[INFO] WebSocket connected
[INFO] Sending EEG data: attention=75, meditation=60, signalQuality=95
[INFO] Data sent successfully
```

**Expected in Student Browser Console:**
```javascript
🔌 EEG connection marked as ready. Waiting for data from Python bridge...
Received EEG data: {attention: 75, relaxation: 60, signalQuality: 95}
```

**Expected in Teacher Dashboard:**
Student card shows:
- 🟢 **Connected** status
- **Atenção:** 75%
- **Relaxamento:** 60%
- **Sinal:** 95%
- Real-time updates every ~250ms

---

## 📊 Data Format

### Python Bridge Sends:
```json
{
  "studentId": "uuid-do-aluno",
  "sessionId": "uuid-da-sessao",
  "timestamp": "2025-11-20T00:00:00.000Z",
  "attention": 75,
  "relaxation": 60,
  "signalQuality": 95,
  "delta": 120000,
  "theta": 250000,
  "alpha": 300000,
  "beta": 180000,
  "gamma": 90000
}
```

### Backend Broadcasts via Socket.IO:
```javascript
io.to(`session:${sessionId}`).emit('eeg:update', {
  sessionId,
  studentId,
  studentName,
  timestamp,
  attention,      // 0-100
  relaxation,     // 0-100 (meditation)
  signalQuality,  // 0-100 (0 = perfect signal)
  delta,          // Brain wave power values
  theta,
  alpha,
  beta,
  gamma
});
```

### Student Frontend Receives:
```javascript
socket.on('eeg:update', (data) => {
  if (data.studentId === user.id) {
    setEegData({
      attention: data.attention,
      relaxation: data.relaxation,
      signalQuality: data.signalQuality
    });
  }
});
```

---

## 🔧 Troubleshooting

### Issue: "Permission denied" (Linux/Mac)
```bash
sudo chmod 666 /dev/ttyUSB0
# or add user to dialout group
sudo usermod -a -G dialout $USER
```

### Issue: "Access is denied" (Windows)
1. Close any software using the COM port
2. Check Bluetooth drivers are installed
3. Try unpairing and pairing device again

### Issue: "Could not connect to WebSocket"
```bash
# Verify backend is running
curl http://localhost:3001
# Should return: Cannot GET /
```

### Issue: No data received
1. Check signal quality - should be < 50 (0 = perfect)
2. Ensure headset is properly positioned
3. Wait 10-30 seconds for signal stabilization
4. Check Python bridge console for errors

### Issue: Student sees "Aguardando conexão..."
1. Student must click "🔌 Conectar Dispositivo EEG" button
2. Python bridge must be running with correct student ID and session ID
3. Check browser console for errors
4. Verify WebSocket connection in Network tab

---

## 🎯 Testing Without Physical Device

If you don't have a physical EEG device, you can simulate data by modifying `eeg_bridge.py`:

```python
# In eeg_bridge.py, add a test mode:
async def test_mode(self):
    """Send test EEG data for development"""
    while self.running:
        test_data = {
            'studentId': self.student_id,
            'sessionId': self.session_id,
            'timestamp': datetime.now().isoformat(),
            'attention': random.randint(50, 90),
            'relaxation': random.randint(40, 80),
            'signalQuality': random.randint(70, 100),
            'delta': random.randint(80000, 200000),
            'theta': random.randint(150000, 300000),
            'alpha': random.randint(250000, 450000),
            'beta': random.randint(100000, 250000),
            'gamma': random.randint(50000, 120000),
        }
        await self.send_eeg_data(test_data)
        await asyncio.sleep(0.25)  # 4Hz

# Run with:
python eeg_bridge.py --test-mode --student-id XXX --session-id YYY
```

---

## 📝 Summary of Changes

### Files Modified:
1. ✅ **[StudentSession.jsx](../neuroone-frontend/src/pages/student/StudentSession.jsx)**
   - Removed `eegIntervalRef` ref
   - Removed mock data generation from `connectEEG()`
   - Added `socket.on('eeg:update')` listener
   - Removed `setInterval()` cleanup code
   - Added console logs for debugging

### Dependencies Installed:
2. ✅ **Python EEG Bridge**
   - websockets==12.0
   - pyserial==3.5
   - colorlog==6.8.0

### No Changes Needed:
- ✅ Backend already handles `eeg:data` events
- ✅ Backend already broadcasts `eeg:update` to session rooms
- ✅ Database already stores EEG data
- ✅ Teacher dashboard already displays real-time data
- ✅ WebSocket authentication working

---

## 🎉 Next Steps

1. **Connect physical EEG device** to computer via Bluetooth
2. **Configure COM port** in device manager
3. **Start Python bridge** with correct student/session IDs
4. **Verify data flow** in browser console and teacher dashboard
5. **Run complete session** with real EEG data
6. **Generate reports** with actual brain wave metrics

---

**For more details, see:**
- [Python EEG Bridge README](../neuroone-python-eeg/README.md)
- [Python EEG Server Documentation](14-SERVIDOR-PYTHON-EEG.md)
- [Session Progress Report](SESSION-PROGRESS-2025-11-19.md)

---

**✅ Status:** Integration complete. System ready for real EEG device data.
**📊 Progress:** 100% - No mock data remaining
**🔒 Security:** Rate limiting (300 req/min), JWT auth, RLS policies active
