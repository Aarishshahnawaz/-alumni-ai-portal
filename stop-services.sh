#!/bin/bash

# AlumniAI Portal - Service Stop Script
# This script stops all running services

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to stop service by PID file
stop_service_by_pid() {
    local pid_file=$1
    local service_name=$2
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            print_status "Stopping $service_name (PID: $pid)..."
            kill "$pid"
            
            # Wait for process to stop
            local attempts=0
            while kill -0 "$pid" 2>/dev/null && [ $attempts -lt 10 ]; do
                sleep 1
                attempts=$((attempts + 1))
            done
            
            if kill -0 "$pid" 2>/dev/null; then
                print_warning "Force killing $service_name..."
                kill -9 "$pid"
            fi
            
            print_success "$service_name stopped"
        else
            print_warning "$service_name was not running"
        fi
        rm -f "$pid_file"
    else
        print_warning "No PID file found for $service_name"
    fi
}

# Function to stop services by port
stop_service_by_port() {
    local port=$1
    local service_name=$2
    
    print_status "Checking for $service_name on port $port..."
    
    local pid=$(lsof -ti:$port 2>/dev/null || true)
    if [ -n "$pid" ]; then
        print_status "Stopping $service_name (PID: $pid) on port $port..."
        kill "$pid" 2>/dev/null || true
        
        # Wait for process to stop
        local attempts=0
        while lsof -ti:$port >/dev/null 2>&1 && [ $attempts -lt 10 ]; do
            sleep 1
            attempts=$((attempts + 1))
        done
        
        if lsof -ti:$port >/dev/null 2>&1; then
            print_warning "Force killing $service_name..."
            kill -9 "$pid" 2>/dev/null || true
        fi
        
        print_success "$service_name stopped"
    else
        print_status "$service_name is not running on port $port"
    fi
}

# Function to cleanup temporary files
cleanup_temp_files() {
    print_status "Cleaning up temporary files..."
    
    # Remove PID files
    rm -f .backend.pid .ai.pid .frontend.pid
    
    # Remove log files if they exist
    rm -f *.log
    
    print_success "Temporary files cleaned up"
}

# Main execution
main() {
    echo "🛑 Stopping AlumniAI Portal Services..."
    echo "====================================="
    
    # Stop services by PID files first
    stop_service_by_pid ".frontend.pid" "Frontend"
    stop_service_by_pid ".backend.pid" "Backend"
    stop_service_by_pid ".ai.pid" "AI Service"
    
    # Stop services by port as backup
    stop_service_by_port 3000 "Frontend"
    stop_service_by_port 5000 "Backend"
    stop_service_by_port 8001 "AI Service"
    
    # Stop any remaining Node.js processes related to the project
    print_status "Checking for remaining Node.js processes..."
    pkill -f "alumni-portal" 2>/dev/null || true
    
    # Stop any remaining Python processes related to the project
    print_status "Checking for remaining Python processes..."
    pkill -f "alumni-ai-service" 2>/dev/null || true
    pkill -f "app.main" 2>/dev/null || true
    
    # Cleanup temporary files
    cleanup_temp_files
    
    # Final verification
    print_status "Verifying all services are stopped..."
    
    local services_running=false
    
    if lsof -ti:3000 >/dev/null 2>&1; then
        print_warning "Something is still running on port 3000"
        services_running=true
    fi
    
    if lsof -ti:5000 >/dev/null 2>&1; then
        print_warning "Something is still running on port 5000"
        services_running=true
    fi
    
    if lsof -ti:8001 >/dev/null 2>&1; then
        print_warning "Something is still running on port 8001"
        services_running=true
    fi
    
    if [ "$services_running" = false ]; then
        print_success "All AlumniAI Portal services have been stopped successfully!"
    else
        print_warning "Some services may still be running. Check manually if needed."
        echo ""
        echo "To check what's running on ports:"
        echo "  lsof -i:3000  # Frontend"
        echo "  lsof -i:5000  # Backend"
        echo "  lsof -i:8001  # AI Service"
    fi
    
    echo ""
    echo "📝 To start services again, run: ./start-services.sh"
    echo ""
}

# Run main function
main "$@"