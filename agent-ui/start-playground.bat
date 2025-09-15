@echo off
echo Starting ServiceFlow AI Agent-UI Playground...
cd /d "%~dp0Agents"
uv run playground.py
pause