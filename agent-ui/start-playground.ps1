#!/usr/bin/env powershell
Write-Host "🚀 Starting ServiceFlow AI Agent-UI Playground..." -ForegroundColor Green

# Change to Agents directory
Set-Location -Path "$PSScriptRoot\Agents"

# Run the playground with uv
Write-Host "📍 Current directory: $(Get-Location)" -ForegroundColor Cyan
Write-Host "🔧 Running uv run playground.py..." -ForegroundColor Yellow

try {
    uv run playground.py
} catch {
    Write-Host "❌ Error running playground: $_" -ForegroundColor Red
    Write-Host "💡 Make sure dependencies are installed: uv sync" -ForegroundColor Yellow
}

Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")