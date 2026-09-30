@echo off
REM =====================================================================
REM SwiftChat - Complete Smoke & E2E Test Suite Runner
REM =====================================================================

echo [SwiftChat] Launching Full-Stack Smoke & E2E Test Suite...
node "%~dp0scripts\run-all-tests.mjs"
exit /b %ERRORLEVEL%
