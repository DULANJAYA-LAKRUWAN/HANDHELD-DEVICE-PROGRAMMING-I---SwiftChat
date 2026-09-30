# =====================================================================
# SwiftChat - Complete Smoke & E2E Test Suite Runner (PowerShell)
# =====================================================================

Write-Host "[SwiftChat] Launching Full-Stack Smoke & E2E Test Suite..." -ForegroundColor Cyan
node "$PSScriptRoot\scripts\run-all-tests.mjs"
exit $LASTEXITCODE
