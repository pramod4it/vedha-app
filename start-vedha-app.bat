@echo off
setlocal

cd /d "%~dp0"

set "VITE_API_BASE_URL=http://localhost:9090"
set "VITE_BACKEND_MANUAL_WS_URL=ws://localhost:9090/ws/interview/manual"
set "VEDHA_SERVICE_DIR=D:\vedha-service"

echo Starting Vedha app...
echo Backend API: %VITE_API_BASE_URL%

if "%OPENAI_API_KEY%"=="" (
  echo.
  echo OPENAI_API_KEY is missing.
  echo Set it in this PowerShell window before running this file:
  echo   $env:OPENAI_API_KEY="sk-..."
  echo.
  echo The backend will not start without this key, so no OpenAI API calls can happen.
  pause
  exit /b 1
)

where docker >nul 2>nul
if errorlevel 1 (
  echo Docker was not found. Please start Docker Desktop and try again.
  pause
  exit /b 1
)

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

if not exist "%VEDHA_SERVICE_DIR%\docker-compose.yml" (
  echo Backend folder was not found: %VEDHA_SERVICE_DIR%
  pause
  exit /b 1
)

echo Starting backend Docker service on http://localhost:9090 ...
pushd "%VEDHA_SERVICE_DIR%"
docker compose up -d mysql
if errorlevel 1 (
  popd
  echo MySQL container failed to start.
  pause
  exit /b 1
)

docker compose up -d --build vedha-service
if errorlevel 1 (
  popd
  echo Vedha backend container failed to start.
  pause
  exit /b 1
)
popd

echo Starting renderer support process on http://localhost:54321 ...
start "Vedha Renderer" /min cmd /k "cd /d ""%~dp0"" && set VITE_API_BASE_URL=%VITE_API_BASE_URL%&& set VITE_BACKEND_MANUAL_WS_URL=%VITE_BACKEND_MANUAL_WS_URL%&& corepack pnpm run dev:serve-renderer"

timeout /t 4 /nobreak >nul

echo Launching Electron...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath 'cmd.exe' -ArgumentList '/c cd /d ""%~dp0"" && set VITE_API_BASE_URL=%VITE_API_BASE_URL%&& set VITE_BACKEND_MANUAL_WS_URL=%VITE_BACKEND_MANUAL_WS_URL%&& corepack pnpm exec electron .' -WindowStyle Hidden"

echo.
echo Vedha app startup requested. Use only the Vedha app window.
echo The minimized renderer window is only a local support process.

endlocal
