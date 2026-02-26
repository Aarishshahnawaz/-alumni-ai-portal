#!/bin/bash

# AlumniAI Portal - Service Startup Script
# This script starts all services in the correct order

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

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1

    print_status "Waiting for $service_name to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" >/dev/null 2>&1; then
            print_success "$service_name is ready!"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "$service_name failed to start within expected time"
    return 1
}

# Function to check if MongoDB is running
check_mongodb() {
    print_status "Checking MongoDB connection..."
    
    if mongosh --eval "db.adminCommand('ping')" >/dev/null 2>&1; then
        print_success "MongoDB is running"
        return 0
    else
        print_error "MongoDB is not running. Please start MongoDB first."
        print_status "To start MongoDB:"
        print_status "  - On macOS: brew services start mongodb-community"
        print_status "  - On Ubuntu: sudo systemctl start mongod"
        print_status "  - On Windows: net start MongoDB"
        return 1
    fi
}

# Function to setup environment files
setup_env_files() {
    print_status "Setting up environment files..."
    
    # Backend .env
    if [ ! -f "alumni-portal-backend/.env" ]; then
        if [ -f "alumni-portal-backend/.env.example" ]; then
            cp alumni-portal-backend/.env.example alumni-portal-backend/.env
            print_success "Created backend .env file from example"
        else
            print_warning "Backend .env.example not found"
        fi
    fi
    
    # AI Service .env
    if [ ! -f "alumni-ai-service/.env" ]; then
        if [ -f "alumni-ai-service/.env.example" ]; then
            cp alumni-ai-service/.env.example alumni-ai-service/.env
            print_success "Created AI service .env file from example"
        else
            print_warning "AI service .env.example not found"
        fi
    fi
    
    # Frontend .env
    if [ ! -f "alumni-portal-frontend/.env" ]; then
        if [ -f "alumni-portal-frontend/.env.example" ]; then
            cp alumni-portal-frontend/.env.example alumni-portal-frontend/.env
            print_success "Created frontend .env file from example"
        else
            print_warning "Frontend .env.example not found"
        fi
    fi
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Backend dependencies
    if [ -d "alumni-portal-backend" ]; then
        print_status "Installing backend dependencies..."
        cd alumni-portal-backend
        npm install
        cd ..
        print_success "Backend dependencies installed"
    fi
    
    # AI Service dependencies
    if [ -d "alumni-ai-service" ]; then
        print_status "Installing AI service dependencies..."
        cd alumni-ai-service
        if command -v python3 &> /dev/null; then
            python3 -m pip install -r requirements.txt
        elif command -v python &> /dev/null; then
            python -m pip install -r requirements.txt
        else
            print_error "Python not found. Please install Python 3.8+"
            return 1
        fi
        cd ..
        print_success "AI service dependencies installed"
    fi
    
    # Frontend dependencies
    if [ -d "alumni-portal-frontend" ]; then
        print_status "Installing frontend dependencies..."
        cd alumni-portal-frontend
        npm install
        cd ..
        print_success "Frontend dependencies installed"
    fi
}

# Function to start backend service
start_backend() {
    print_status "Starting backend service..."
    
    if check_port 5000; then
        print_warning "Port 5000 is already in use. Backend might already be running."
        return 0
    fi
    
    cd alumni-portal-backend
    npm start &
    BACKEND_PID=$!
    cd ..
    
    # Wait for backend to be ready
    if wait_for_service "http://localhost:5000/health" "Backend"; then
        print_success "Backend service started successfully (PID: $BACKEND_PID)"
        echo $BACKEND_PID > .backend.pid
        return 0
    else
        print_error "Failed to start backend service"
        return 1
    fi
}

# Function to start AI service
start_ai_service() {
    print_status "Starting AI service..."
    
    if check_port 8001; then
        print_warning "Port 8001 is already in use. AI service might already be running."
        return 0
    fi
    
    cd alumni-ai-service
    if command -v python3 &> /dev/null; then
        python3 -m app.main &
    elif command -v python &> /dev/null; then
        python -m app.main &
    else
        print_error "Python not found"
        return 1
    fi
    AI_PID=$!
    cd ..
    
    # Wait for AI service to be ready
    if wait_for_service "http://localhost:8001/health" "AI Service"; then
        print_success "AI service started successfully (PID: $AI_PID)"
        echo $AI_PID > .ai.pid
        return 0
    else
        print_error "Failed to start AI service"
        return 1
    fi
}

# Function to start frontend
start_frontend() {
    print_status "Starting frontend application..."
    
    if check_port 3000; then
        print_warning "Port 3000 is already in use. Frontend might already be running."
        return 0
    fi
    
    cd alumni-portal-frontend
    npm start &
    FRONTEND_PID=$!
    cd ..
    
    # Wait for frontend to be ready
    if wait_for_service "http://localhost:3000" "Frontend"; then
        print_success "Frontend application started successfully (PID: $FRONTEND_PID)"
        echo $FRONTEND_PID > .frontend.pid
        return 0
    else
        print_error "Failed to start frontend application"
        return 1
    fi
}

# Function to run integration tests
run_integration_tests() {
    print_status "Running integration tests..."
    
    # Test backend health
    if curl -s http://localhost:5000/health >/dev/null; then
        print_success "Backend health check passed"
    else
        print_error "Backend health check failed"
        return 1
    fi
    
    # Test AI service health
    if curl -s http://localhost:8001/health >/dev/null; then
        print_success "AI service health check passed"
    else
        print_error "AI service health check failed"
        return 1
    fi
    
    # Test frontend accessibility
    if curl -s http://localhost:3000 >/dev/null; then
        print_success "Frontend accessibility check passed"
    else
        print_error "Frontend accessibility check failed"
        return 1
    fi
    
    print_success "All integration tests passed!"
}

# Function to display service URLs
display_service_info() {
    echo ""
    echo "🚀 AlumniAI Portal Services Started Successfully!"
    echo "================================================"
    echo ""
    echo "📱 Frontend Application: http://localhost:3000"
    echo "🔧 Backend API:          http://localhost:5000"
    echo "🤖 AI Service:           http://localhost:8001"
    echo ""
    echo "📊 API Documentation:"
    echo "   Backend API:          http://localhost:5000/api"
    echo "   AI Service Docs:      http://localhost:8001/api/v1/docs"
    echo ""
    echo "🔍 Health Checks:"
    echo "   Backend Health:       http://localhost:5000/health"
    echo "   AI Service Health:    http://localhost:8001/health"
    echo ""
    echo "📝 To stop all services, run: ./stop-services.sh"
    echo ""
}

# Main execution
main() {
    echo "🚀 Starting AlumniAI Portal Services..."
    echo "======================================"
    
    # Check prerequisites
    if ! check_mongodb; then
        exit 1
    fi
    
    # Setup environment files
    setup_env_files
    
    # Install dependencies
    if ! install_dependencies; then
        exit 1
    fi
    
    # Start services in order
    if ! start_backend; then
        print_error "Failed to start backend service"
        exit 1
    fi
    
    if ! start_ai_service; then
        print_error "Failed to start AI service"
        exit 1
    fi
    
    if ! start_frontend; then
        print_error "Failed to start frontend application"
        exit 1
    fi
    
    # Run integration tests
    sleep 5  # Give services time to fully initialize
    if ! run_integration_tests; then
        print_warning "Some integration tests failed, but services are running"
    fi
    
    # Display service information
    display_service_info
    
    # Keep script running
    print_status "All services are running. Press Ctrl+C to stop all services."
    
    # Trap Ctrl+C to cleanup
    trap 'print_status "Stopping all services..."; ./stop-services.sh; exit 0' INT
    
    # Wait indefinitely
    while true; do
        sleep 1
    done
}

# Run main function
main "$@"