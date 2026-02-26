@echo off
setlocal enabledelayedexpansion

REM AlumniAI Portal - Service Startup Script (Windows)
REM This script starts all services in the correct order

echo.
echo 🚀 Starting AlumniAI Portal Services...
echo ======================================

REM Function to check if a port is in use
:check_port
netstat -an | find ":%1 " | find "LISTENING" >nul
if %errorlevel% == 0 (
    echo [WARNING] Port %1 is already in use
    exit /b 0
) else (
    exit /b 1
)

REM Function to wait for service
:wait_for_service
set url=%1
set service_name=%2
set attempts=0
set max_attempts=30

echo [INFO] Waiting for %service_name% to be ready...

:wait_loop
curl -s %url% >nul 2>&1
if %errorlevel% == 0 (
    echo [SUCCESS] %service_name% is ready!
    exit /b 0
)

set /a attempts+=1
if %attempts% geq %max_attempts% (
    echo [ERROR] %service_name% failed to start within expected time
    exit /b 1
)

timeout /t 2 /nobreak >nul
goto wait_loop

REM Setup environment files
echo [INFO] Setting up environment files...

if not exist "alumni-portal-backend\.env" (
    if exist "alumni-portal-backend\.env.example" (
        copy "alumni-portal-backend\.env.example" "alumni-portal-backend\.env" >nul
        echo [SUCCESS] Created backend .env file from example
    )
)

if not exist "alumni-ai-service\.env" (
    if exist "alumni-ai-service\.env.example" (
        copy "alumni-ai-service\.env.example" "alumni-ai-service\.env" >nul
        echo [SUCCESS] Created AI service .env file from example
    )
)

if not exist "alumni-portal-frontend\.env" (
    if exist "alumni-portal-frontend\.env.example" (
        copy "alumni-portal-frontend\.env.example" "alumni-portal-frontend\.env" >nul
        echo [SUCCESS] Created frontend .env file from example
    )
)

REM Install dependencies
echo [INFO] Installing dependencies...

if exist "alumni-portal-backend" (
    echo [INFO] Installing backend dependencies...
    cd alumni-portal-backend
    call npm install
    cd ..
    echo [SUCCESS] Backend dependencies installed
)

if exist "alumni-ai-service" (
    echo [INFO] Installing AI service dependencies...
    cd alumni-ai-service
    pip install -r requirements.txt
    cd ..
    echo [SUCCESS] AI service dependencies installed
)

if exist "alumni-portal-frontend" (
    echo [INFO] Installing frontend dependencies...
    cd alumni-portal-frontend
    call npm install
    cd ..
    echo [SUCCESS] Frontend dependencies installed
)

REM Start Backend Service
echo [INFO] Starting backend service...
call :check_port 5000
if %errorlevel% == 0 (
    echo [WARNING] Backend might already be running on port 5000
) else (
    cd alumni-portal-backend
    start "Backend Service" cmd /c "npm start"
    cd ..
    
    REM Wait for backend to be ready
    call :wait_for_service "http://localhost:5000/health" "Backend"
    if !errorlevel! == 0 (
        echo [SUCCESS] Backend service started successfully
    ) else (
        echo [ERROR] Failed to start backend service
        pause
        exit /b 1
    )
)

REM Start AI Service
echo [INFO] Starting AI service...
call :check_port 8001
if %errorlevel% == 0 (
    echo [WARNING] AI service might already be running on port 8001
) else (
    cd alumni-ai-service
    start "AI Service" cmd /c "python -m app.main"
    cd ..
    
    REM Wait for AI service to be ready
    call :wait_for_service "http://localhost:8001/health" "AI Service"
    if !errorlevel! == 0 (
        echo [SUCCESS] AI service started successfully
    ) else (
        echo [ERROR] Failed to start AI service
        pause
        exit /b 1
    )
)

REM Start Frontend
echo [INFO] Starting frontend application...
call :check_port 3000
if %errorlevel% == 0 (
    echo [WARNING] Frontend might already be running on port 3000
) else (
    cd alumni-portal-frontend
    start "Frontend Application" cmd /c "npm start"
    cd ..
    
    REM Wait for frontend to be ready
    call :wait_for_service "http://localhost:3000" "Frontend"
    if !errorlevel! == 0 (
        echo [SUCCESS] Frontend application started successfully
    ) else (
        echo [ERROR] Failed to start frontend application
        pause
        exit /b 1
    )
)

REM Run integration tests
echo [INFO] Running integration tests...
timeout /t 5 /nobreak >nul

curl -s http://localhost:5000/health >nul
if %errorlevel% == 0 (
    echo [SUCCESS] Backend health check passed
) else (
    echo [ERROR] Backend health check failed
)

curl -s http://localhost:8001/health >nul
if %errorlevel% == 0 (
    echo [SUCCESS] AI service health check passed
) else (
    echo [ERROR] AI service health check failed
)

curl -s http://localhost:3000 >nul
if %errorlevel% == 0 (
    echo [SUCCESS] Frontend accessibility check passed
) else (
    echo [ERROR] Frontend accessibility check failed
)

REM Display service information
echo.
echo 🚀 AlumniAI Portal Services Started Successfully!
echo ================================================
echo.
echo 📱 Frontend Application: http://localhost:3000
echo 🔧 Backend API:          http://localhost:5000
echo 🤖 AI Service:           http://localhost:8001
echo.
echo 📊 API Documentation:
echo    Backend API:          http://localhost:5000/api
echo    AI Service Docs:      http://localhost:8001/api/v1/docs
echo.
echo 🔍 Health Checks:
echo    Backend Health:       http://localhost:5000/health
echo    AI Service Health:    http://localhost:8001/health
echo.
echo 📝 To stop all services, run: stop-services.bat
echo.

pause