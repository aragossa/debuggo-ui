#!/bin/bash
# Script to build and test production React frontend locally
# Serves the optimized build with nginx

set -e

echo "🎨 AuroQA Frontend - Local Production Testing"
echo "=============================================="
echo ""

# Configuration
IMAGE_NAME="auroqa-ui:production-local"
CONTAINER_NAME="auroqa-ui-local"
DOCKERFILE="Dockerfile.production"
COMPOSE_FILE="docker-compose.local.yml"

# Function to print colored output
print_info() {
    echo -e "\033[1;34m[INFO]\033[0m $1"
}

print_success() {
    echo -e "\033[1;32m[SUCCESS]\033[0m $1"
}

print_error() {
    echo -e "\033[1;31m[ERROR]\033[0m $1"
}

print_warning() {
    echo -e "\033[1;33m[WARNING]\033[0m $1"
}

# Check if required files exist
if [ ! -f "$DOCKERFILE" ]; then
    print_error "Dockerfile not found: $DOCKERFILE"
    exit 1
fi

if [ ! -f "$COMPOSE_FILE" ]; then
    print_error "Docker Compose file not found: $COMPOSE_FILE"
    exit 1
fi

if [ ! -f ".env" ]; then
    print_error ".env file not found"
    print_info "Creating default .env file..."
    echo "REACT_APP_API_URL=http://localhost:9000" > .env
    print_success ".env file created with default values"
fi

if [ ! -f "package.json" ]; then
    print_error "package.json not found. Are you in the correct directory?"
    exit 1
fi

echo ""
print_info "📋 Configuration Check:"
echo "   Dockerfile:     $DOCKERFILE"
echo "   Compose file:   $COMPOSE_FILE"
echo "   Image name:     $IMAGE_NAME"
echo "   Container name: $CONTAINER_NAME"
echo ""

# Read API URL from .env
API_URL=$(grep REACT_APP_API_URL .env | cut -d '=' -f2)
print_info "API URL configured: $API_URL"
echo ""

# Check if backend is running (if using localhost:9000)
if [[ "$API_URL" == *"localhost:9000"* ]] || [[ "$API_URL" == *"127.0.0.1:9000"* ]]; then
    print_info "Checking if backend is running at $API_URL..."
    if curl -f -s "$API_URL/api/health" > /dev/null 2>&1; then
        print_success "Backend is running!"
    else
        print_warning "Backend is not responding at $API_URL"
        print_warning "Make sure to start the backend before using the UI"
        echo ""
        read -p "Continue anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    echo ""
fi

print_info "Step 1: Building production React application..."
echo ""

# Build the image
docker build -f "$DOCKERFILE" -t "$IMAGE_NAME" . || {
    print_error "Failed to build Docker image"
    exit 1
}

print_success "Docker image built successfully!"
echo ""

print_info "Step 2: Verifying build..."
docker run --rm "$IMAGE_NAME" sh -c "
    echo '  📊 Build Statistics:'
    echo '    Build directory size: \$(du -sh /usr/share/nginx/html | cut -f1)'
    echo '    Total files: \$(find /usr/share/nginx/html -type f | wc -l)'
    echo '    JS files: \$(find /usr/share/nginx/html -name '*.js' | wc -l)'
    echo '    CSS files: \$(find /usr/share/nginx/html -name '*.css' | wc -l)'
    echo ''
    echo '  🔍 Key files present:'
    ls -lh /usr/share/nginx/html/index.html 2>/dev/null && echo '    ✅ index.html found' || echo '    ❌ index.html missing'
    ls /usr/share/nginx/html/static/js/*.js 2>/dev/null | head -1 | xargs -I {} echo '    ✅ JavaScript bundle: {}' || echo '    ❌ JS bundle missing'
    ls /usr/share/nginx/html/static/css/*.css 2>/dev/null | head -1 | xargs -I {} echo '    ✅ CSS bundle: {}' || echo '    ❌ CSS bundle missing'
"
echo ""

print_info "Step 3: Starting UI with Docker Compose..."
echo ""

# Stop existing containers
docker-compose -f "$COMPOSE_FILE" down 2>/dev/null || true

# Start services (UI only, without backend)
print_info "Starting frontend only (use full-stack mode for backend too)..."
docker-compose -f "$COMPOSE_FILE" up -d auroqa-ui-local

print_success "Services started!"
echo ""

# Wait for UI to start
print_info "Step 4: Waiting for UI to start (15 seconds)..."
sleep 15

# Check health
print_info "Step 5: Testing UI availability..."
if curl -f -s http://localhost:3000/index.html > /dev/null; then
    print_success "UI is available!"
else
    print_warning "UI health check failed. Check logs below."
fi

echo ""
echo "=========================================="
echo "🎉 Setup Complete!"
echo "=========================================="
echo ""
echo "📍 Frontend URLs:"
echo "   Main UI:       http://localhost:3000"
echo "   Health Check:  http://localhost:3000/index.html"
echo ""
echo "📍 Backend URLs (if configured):"
echo "   API Base:      $API_URL"
echo "   Health:        $API_URL/api/health"
echo ""
echo "📊 Management Commands:"
echo "   View logs:     docker-compose -f $COMPOSE_FILE logs -f auroqa-ui-local"
echo "   Stop:          docker-compose -f $COMPOSE_FILE down"
echo "   Restart:       docker-compose -f $COMPOSE_FILE restart auroqa-ui-local"
echo "   Shell access:  docker exec -it $CONTAINER_NAME sh"
echo ""
echo "🚀 Full-stack mode (UI + Backend):"
echo "   Start both:    docker-compose -f $COMPOSE_FILE up -d"
echo "   Stop both:     docker-compose -f $COMPOSE_FILE down"
echo ""
echo "📝 View Recent Logs:"
docker-compose -f "$COMPOSE_FILE" logs --tail=15 auroqa-ui-local
echo ""
echo "🌐 Open in browser: http://localhost:3000"
echo ""
