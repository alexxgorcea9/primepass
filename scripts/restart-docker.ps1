# PowerShell script to restart Docker containers for PrimePass
# This ensures all configuration changes are applied

Write-Host "🔄 Restarting PrimePass Docker containers..." -ForegroundColor Cyan

# Stop all containers
Write-Host "`n📦 Stopping containers..." -ForegroundColor Yellow
docker-compose down

# Remove orphaned containers
Write-Host "`n🧹 Cleaning up..." -ForegroundColor Yellow
docker-compose down --remove-orphans

# Rebuild containers (optional - uncomment if you made Dockerfile changes)
# Write-Host "`n🔨 Rebuilding containers..." -ForegroundColor Yellow
# docker-compose build --no-cache

# Start containers
Write-Host "`n🚀 Starting containers..." -ForegroundColor Green
docker-compose up -d

# Wait for services to be healthy
Write-Host "`n⏳ Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check container status
Write-Host "`n📊 Container Status:" -ForegroundColor Cyan
docker-compose ps

# Show backend logs (last 20 lines)
Write-Host "`n📝 Backend Logs:" -ForegroundColor Cyan
docker-compose logs --tail=20 backend

# Show frontend logs (last 20 lines)
Write-Host "`n📝 Frontend Logs:" -ForegroundColor Cyan
docker-compose logs --tail=20 frontend

Write-Host "`n✅ Done! Access the app at:" -ForegroundColor Green
Write-Host "   - Frontend: http://192.168.100.133:3000" -ForegroundColor White
Write-Host "   - Backend:  http://192.168.100.133:8000" -ForegroundColor White
Write-Host "   - Health:   http://192.168.100.133:8000/health/" -ForegroundColor White

Write-Host "`n💡 To view live logs, run:" -ForegroundColor Yellow
Write-Host "   docker-compose logs -f backend" -ForegroundColor White
Write-Host "   docker-compose logs -f frontend" -ForegroundColor White
