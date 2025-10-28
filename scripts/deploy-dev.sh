#!/bin/bash

# Deploy Development Environment Script
# This script deploys the Case Task Manager to development environment

set -e

echo "🚀 Starting development deployment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if .env files exist
if [ ! -f "case-task-manager-api/.env" ]; then
    echo "⚠️  API .env file not found. Copying from .env.example..."
    cp case-task-manager-api/.env.example case-task-manager-api/.env
    echo "✅ Please edit case-task-manager-api/.env with your configuration"
fi

if [ ! -f "case-task-manager-front/.env.local" ]; then
    echo "⚠️  Frontend .env.local file not found. Copying from .env.example..."
    cp case-task-manager-front/.env.example case-task-manager-front/.env.local
    echo "✅ Please edit case-task-manager-front/.env.local with your configuration"
fi

# Stop any running containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Remove old images (optional)
read -p "🗑️  Remove old Docker images? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker-compose down --rmi all
fi

# Build and start services
echo "🔨 Building and starting services..."
docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ Services are running!"
    echo ""
    echo "🌐 Application URLs:"
    echo "   Frontend: http://localhost:3000"
    echo "   API: http://localhost:3001"
    echo "   Database: localhost:5433"
    echo ""
    echo "📊 To view logs: docker-compose logs -f"
    echo "🛑 To stop: docker-compose down"
else
    echo "❌ Some services failed to start. Check logs with: docker-compose logs"
    exit 1
fi

echo "🎉 Development deployment completed successfully!"