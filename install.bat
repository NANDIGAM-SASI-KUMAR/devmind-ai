@echo off
echo =========================================
echo DevMind AI - Installation Script
echo =========================================

echo.
echo [1/3] Installing Server Node.js Dependencies...
cd server
call npm install
cd ..

echo.
echo [2/3] Installing Client Node.js Dependencies...
cd client
call npm install
cd ..

echo.
echo [3/3] Installing Python Dependencies (Chroma DB)...
pip install -r requirements.txt

echo.
echo =========================================
echo Installation Complete!
echo =========================================
echo.
echo IMPORTANT NEXT STEPS:
echo 1. Go to the "server" folder and copy ".env.example" to ".env". Fill in your MongoDB URI and API keys.
echo 2. Go to the "client" folder and copy ".env.example" to ".env".
echo 3. Run "run.bat" to start the application.
echo.
pause

