@echo off
setlocal

cd /d "%~dp0"

set "VITE_API_BASE_URL=http://localhost:9090"
set "VITE_BACKEND_MANUAL_WS_URL=ws://localhost:9090/ws/interview/manual"

echo Starting Vedha app...
echo Backend API: %VITE_API_BASE_URL%

where corepack >nul 2>nul
if errorlevel 1 (
  echo corepack was not found. Please install Node.js 24+ and try again.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Installing dependencies...
  corepack pnpm install
  if errorlevel 1 (
    echo Dependency install failed.
    pause
    exit /b 1
  )
)

echo Starting renderer on http://localhost:54321 ...
start "Vedha Renderer" cmd /k "cd /d ""%~dp0"" && set VITE_API_BASE_URL=%VITE_API_BASE_URL%&& set VITE_BACKEND_MANUAL_WS_URL=%VITE_BACKEND_MANUAL_WS_URL%&& corepack pnpm run dev:serve-renderer"

timeout /t 4 /nobreak >nul

echo Launching Electron...
start "Vedha Electron" cmd /k "cd /d ""%~dp0"" && set VITE_API_BASE_URL=%VITE_API_BASE_URL%&& set VITE_BACKEND_MANUAL_WS_URL=%VITE_BACKEND_MANUAL_WS_URL%&& corepack pnpm exec electron ."

echo.
echo Vedha app startup requested.
echo Keep the opened terminal windows running while using the app.

endlocal
