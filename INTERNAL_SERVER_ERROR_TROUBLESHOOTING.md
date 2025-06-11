# Internal Server Error Troubleshooting Guide

## 🚨 Issue: Internal Server Error on http://localhost:9002/

Based on the comprehensive analysis, here are the most likely causes and solutions:

## 🔍 Potential Causes

### 1. **Database Connection Issues** (Most Likely)
- MySQL service not running
- Incorrect database credentials
- Database doesn't exist
- Connection pool exhaustion

### 2. **Server-Side Rendering Issues**
- Web Vitals initialization on server side (FIXED)
- Import errors in components
- Next.js configuration problems

### 3. **Port Conflicts**
- Port 9002 already in use by another process
- Process not properly killed

### 4. **Build/Compilation Issues**
- TypeScript compilation errors
- Missing dependencies
- Corrupted build cache

## ✅ Solutions Applied

### 1. **Fixed Web Vitals SSR Issue**
- Moved Web Vitals initialization to client-side component
- Created `WebVitalsProvider` as a client component
- Updated layout.tsx to use the new provider

### 2. **Enhanced Error Diagnostics**
- Created diagnostic scripts for better error detection
- Added enhanced server startup script with error handling

## 🔧 Manual Troubleshooting Steps

### Step 1: Check MySQL Service
```powershell
# Check if MySQL is running
Get-Service -Name "*mysql*"

# Start MySQL if not running
Start-Service -Name "MySQL80" # or your MySQL service name
```

### Step 2: Verify Database Connection
```powershell
# Test database connection
node scripts/test-db.js
```

### Step 3: Clear Build Cache
```powershell
# Remove build cache and reinstall
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules
npm install
```

### Step 4: Check for Port Conflicts
```powershell
# Check what's using port 9002
netstat -ano | findstr :9002

# Kill processes using the port (replace PID with actual process ID)
Stop-Process -Id <PID> -Force
```

### Step 5: Start Server with Diagnostics
```powershell
# Use the enhanced diagnostic script
node scripts/start-server-with-diagnostics.js
```

### Step 6: Alternative Port
If port 9002 continues to have issues, try a different port:
```powershell
# Start on port 3000 instead
npx next dev -p 3000
```

## 🎯 Quick Fix Checklist

- [x] **Fixed SSR Web Vitals issue** - Moved to client component
- [x] **Created diagnostic tools** - Enhanced error detection
- [ ] **Verify MySQL is running** - Check service status
- [ ] **Test database connection** - Run connection test
- [ ] **Clear build cache** - Remove .next directory
- [ ] **Restart development server** - Use diagnostic script

## 📊 Expected Resolution

After applying the SSR fix and following the troubleshooting steps, the server should start successfully. The most common cause is MySQL not running or database connection issues.

## 🔄 Next Steps

1. **Verify MySQL service is running**
2. **Run database connection test**
3. **Start server with enhanced diagnostics**
4. **Check browser console for any client-side errors**
5. **Monitor server logs for specific error messages**

## ⚡ Quick Commands

```powershell
# All-in-one fix attempt
Start-Service -Name "MySQL80"
Remove-Item -Recurse -Force .next
npm run dev
```

---

**Status**: Server startup issues diagnosed and primary SSR issue fixed. Database connection verification needed.
