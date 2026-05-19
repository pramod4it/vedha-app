@echo off
setlocal

set "VEDHA_APP_DIR=%~dp0"
set "VEDHA_EXE=%VEDHA_APP_DIR%release\win-unpacked\Vedha.exe"
set "VEDHA_SERVICE_DIR=D:\vedha-service"

echo Stopping Vedha backend Docker service...

if exist "%VEDHA_SERVICE_DIR%\docker-compose.yml" (
  pushd "%VEDHA_SERVICE_DIR%"
  docker compose stop vedha-service
  popd
) else (
  echo Backend folder was not found: %VEDHA_SERVICE_DIR%
)

echo.
echo Stopping Vedha desktop app...

if not exist "%VEDHA_EXE%" (
  echo Vedha executable was not found: %VEDHA_EXE%
  goto app_stop_done
)

powershell -NoProfile -ExecutionPolicy Bypass -Command "$exe = [IO.Path]::GetFullPath('%VEDHA_EXE%'); $processes = Get-Process -Name 'Vedha' -ErrorAction SilentlyContinue | Where-Object { $_.Path -and ([IO.Path]::GetFullPath($_.Path) -ieq $exe) }; if (-not $processes) { Write-Host 'Vedha desktop app is not running.'; exit 0 }; $ids = ($processes | Select-Object -ExpandProperty Id) -join ', '; $processes | Stop-Process -Force; Write-Host \"Stopped Vedha desktop app process(es): $ids\""

:app_stop_done
echo.
echo Backend stopped. OpenAI API calls cannot happen while vedha-service is stopped.
pause

endlocal
