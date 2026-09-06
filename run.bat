@echo off
echo =========================================
echo DevMind AI - Startup Script
echo =========================================

echo Starting Chroma DB...
start "Chroma DB Server" cmd /k "cd server && npm run chroma"

echo Starting Backend Server...
start "Backend Server" cmd /k "cd server && npm run dev"

echo Starting Frontend Client...
start "Frontend Client" cmd /k "cd client && npm run dev"

echo.
echo All services have been launched in separate windows!
echo Once the Vite server is ready, you can access the frontend at http://localhost:5173
echo.
pause

