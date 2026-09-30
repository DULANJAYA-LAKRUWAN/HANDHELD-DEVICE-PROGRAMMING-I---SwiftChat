@echo off
title SwiftChat Frontend (Expo Metro Bundler)
echo ========================================================
echo Starting SwiftChat Frontend (React Native Expo)
echo ========================================================
cd /d "%~dp0frontend"
call npx expo start -c
pause
