@echo off
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0"
echo Starting SuiviDesk Desktop App (Dev Mode + SQLite)...
npm run dev
