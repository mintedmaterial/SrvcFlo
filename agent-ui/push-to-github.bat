@echo off
echo 🚀 Setting up agent-ui for GitHub...
echo Repository: https://github.com/mintedmaterial/SrvcFlo.git
echo.

REM Navigate to agent-ui directory
cd /d "C:\Users\PC\ServiceApp\agent-ui"

REM Initialize git repository
echo 📝 Initializing Git repository...
git init
echo.

REM Add all files (gitignore will exclude sensitive files)
echo 📂 Adding files to git...
git add .
echo.

REM Check git status to verify sensitive files are excluded
echo 🔍 Checking git status...
git status
echo.

echo ✅ Setup complete! Review the git status above.
echo 🔒 CRITICAL: Verify that sensitive files (.env, token.json, client_secret_*.json) are NOT listed.
echo.

REM Ask user to verify before proceeding
set /p proceed="Do the files above look safe to commit? (y/n): "
if /i "%proceed%"=="y" (
    echo.
    echo 📝 Creating initial commit...
    git commit -m "Initial commit: ServiceFlow AI Agent UI"
    echo.
    
    echo 🔗 Adding GitHub remote...
    git remote add origin https://github.com/mintedmaterial/SrvcFlo.git
    echo.
    
    echo 🚀 Pushing to GitHub...
    git branch -M main
    git push -u origin main
    echo.
    
    echo ✅ Successfully pushed to GitHub!
    echo 🌐 Repository: https://github.com/mintedmaterial/SrvcFlo
) else (
    echo.
    echo ❌ Aborted. Please review the files and fix any issues before pushing.
    echo 💡 Check .gitignore and ensure sensitive files are excluded.
)
echo.
pause
