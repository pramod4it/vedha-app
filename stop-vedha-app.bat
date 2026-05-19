@echo off
setlocal

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
echo Backend stopped. OpenAI API calls cannot happen while vedha-service is stopped.
pause

endlocal
