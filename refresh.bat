@echo off
REM DigiHub Development Helper - Windows Batch Script
REM Usage: Run this script after making code changes to see updates

echo.
echo ================================================
echo    DigiHub Frontend Refresh Script
echo ================================================
echo.

echo [1] Restarting frontend container...
docker compose restart frontend

echo.
echo [2] Reloading Nginx in container...
docker exec digihub-frontend nginx -s reload 2>nul

echo.
echo [3] Clearing browser cache hint:
echo     - Press Ctrl+Shift+R (Windows)
echo     - Or press F12, right-click refresh, select "Empty Cache and Hard Reload"
echo.

echo ================================================
echo    Done! Frontend should be updated now.
echo ================================================
echo.

REM Optionally open browser
set /p open_browser="Open browser? (y/n): "
if /i "%open_browser%"=="y" start http://localhost:3000

pause

