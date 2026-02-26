@echo off
setlocal enabledelayedexpansion

REM AlumniAI Portal - Service Stop Script (Windows)
REM This script stops all running services

echo.
echo 🛑 Stopping AlumniAI Portal Services...
echo =====================================

REM Function to stop service by port
:stop_service_by_port
set port=%1
set service_name=%2

echo [INFO] Checking for %service_name% on port %port%...

for /f "tokens=5" %%a in ('netstat -ano ^| find ":%port% " ^| find "LISTENING"') do (
    set pid=%%a
    echo [INFO] Stopping %service_name% ^(PID: !pid!^) on port %port%...
    taskkill /PID !pid! /F >nul 2>&1
    if !errorlevel! == 0 (
        echo [SUCCESS] %service_name% stopped
    ) else (
        echo [WARNING] Could not stop %service_name%
    )
)

exit /b 0

REM Stop services by port
call :stop_service_by_port 3000 "Frontend"
call :stop_service_by_port 5000 "Backend"
call :stop_service_by_port 8001 "AI Service"

REM Stop any remaining Node.js processes related to the project
echo [INFO] Checking for remaining Node.js processes...
taskkill /F /IM node.exe >nul 2>&1

REM Stop any remaining Python processes related to the project
echo [INFO] Checking for remaining Python processes...
taskkill /F /IM python.exe >nul 2>&1

REM Final verification
echo [INFO] Verifying all services are stopped...

set services_running=false

netstat -an | find ":3000 " | find "LISTENING" >nul
if %errorlevel% == 0 (
    echo [WARNING] Something is still running on port 3000
    set services_running=true
)

netstat -an | find ":5000 " | find "LISTENING" >nul
if %errorlevel% == 0 (
    echo [WARNING] Something is still running on port 5000
    set services_running=true
)

netstat -an | find ":8001 " | find "LISTENING" >nul
if %errorlevel% == 0 (
    echo [WARNING] Something is still running on port 8001
    set services_running=true
)

if "%services_running%" == "false" (
    echo [SUCCESS] All AlumniAI Portal services have been stopped successfully!
) else (
    echo [WARNING] Some services may still be running. Check manually if needed.
    echo.
    echo To check what's running on ports:
    echo   netstat -ano ^| find ":3000"  # Frontend
    echo   netstat -ano ^| find ":5000"  # Backend
    echo   netstat -ano ^| find ":8001"  # AI Service
)

echo.
echo 📝 To start services again, run: start-services.bat
echo.

pause