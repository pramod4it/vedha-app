@echo off
setlocal

set "VEDHA_APP_DIR=%~dp0"
set "VEDHA_SERVICE_DIR=D:\vedha-service"
set "VEDHA_EXE=%VEDHA_APP_DIR%release\win-unpacked\Vedha.exe"
set "VEDHA_SERVICE_URL=http://localhost:9191"

echo Starting Vedha backend Docker service...

if not exist "%VEDHA_SERVICE_DIR%\docker-compose.yml" (
  echo Backend folder was not found: %VEDHA_SERVICE_DIR%
  echo.
  pause
  exit /b 1
)

where docker >nul 2>nul
if errorlevel 1 (
  echo Docker was not found on PATH. Start Docker Desktop, then try again.
  echo.
  pause
  exit /b 1
)

pushd "%VEDHA_SERVICE_DIR%"
docker compose up -d mysql vedha-service
if errorlevel 1 (
  popd
  echo.
  echo Failed to start Vedha backend service.
  pause
  exit /b 1
)
popd

echo Waiting for backend on %VEDHA_SERVICE_URL% ...
for /l %%i in (1,1,30) do (
  powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $r = Invoke-WebRequest -Uri '%VEDHA_SERVICE_URL%' -UseBasicParsing -TimeoutSec 2; exit 0 } catch { if ($_.Exception.Response) { exit 0 } else { exit 1 } }" >nul 2>nul
  if not errorlevel 1 goto backend_ready
  timeout /t 2 /nobreak >nul
)

echo Backend did not respond yet. Opening the app anyway; Docker may still be finishing startup.
goto launch_app

:backend_ready
echo Backend is responding.

:launch_app
if not exist "%VEDHA_EXE%" (
  echo Vedha executable was not found: %VEDHA_EXE%
  echo Run pnpm build first, or check the release\win-unpacked folder.
  echo.
  pause
  exit /b 1
)

for /f "usebackq delims=" %%p in (`powershell -NoProfile -ExecutionPolicy Bypass -Command "$exe = [IO.Path]::GetFullPath('%VEDHA_EXE%'); $process = Get-Process -Name 'Vedha' -ErrorAction SilentlyContinue | Where-Object { $_.Path -and ([IO.Path]::GetFullPath($_.Path) -ieq $exe) } | Select-Object -First 1; if ($process) { $process.Id }"`) do set "VEDHA_RUNNING_PID=%%p"

if defined VEDHA_RUNNING_PID (
  echo Vedha is already running ^(PID %VEDHA_RUNNING_PID%^). Skipping app launch.
  echo Press Ctrl+B to show or hide the existing Vedha window.
  echo.
  pause
  exit /b 0
)

echo Launching Vedha...
start "" "%VEDHA_EXE%"

echo.
echo Vedha launch requested. You can close this window.
pause

endlocal
