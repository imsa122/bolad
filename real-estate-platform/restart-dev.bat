@echo off
echo Stopping any running Next.js processes...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

echo Starting Next.js development server...
npm run dev
