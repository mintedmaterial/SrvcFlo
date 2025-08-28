@echo off
echo ========================================
echo Delete Problematic agnoenv Directory
echo ========================================
echo.
echo This script will delete the old virtual environment that's causing
echo auto-activation issues in PowerShell.
echo.
echo Directory to delete: C:\Users\PC\ServiceApp\agnoenv
echo.

if exist "C:\Users\PC\ServiceApp\agnoenv\" (
    echo ✅ Found the problematic directory.
    echo.
    echo ⚠️  WARNING: This will permanently delete the agnoenv directory!
    echo    Make sure you're not using it for any other projects.
    echo.
    set /p choice="Continue with deletion? (y/N): "
    
    if /i "%choice%"=="y" (
        echo.
        echo 🗑️  Deleting C:\Users\PC\ServiceApp\agnoenv...
        
        REM First try to deactivate if it's active
        call deactivate 2>NUL
        
        REM Delete the directory
        rmdir /s /q "C:\Users\PC\ServiceApp\agnoenv"
        
        REM Check if deletion was successful
        if exist "C:\Users\PC\ServiceApp\agnoenv\" (
            echo ❌ Failed to delete directory completely.
            echo    You may need administrator privileges or close any programs using it.
            echo.
            echo 💡 Try these steps:
            echo    1. Close all terminals/PowerShell windows
            echo    2. Close VS Code or any IDEs
            echo    3. Run this script as Administrator
        ) else (
            echo ✅ Successfully deleted agnoenv directory!
            echo.
            echo 🎉 The auto-activation issue should now be resolved!
            echo.
            echo 📋 Next steps:
            echo    1. Close this terminal
            echo    2. Open a new PowerShell window
            echo    3. Navigate to: C:\Users\PC\ServiceApp\myserviceprovider-app\Agents
            echo    4. Run: run_http_agent.ps1
            echo.
            echo The correct .venv should now activate properly.
        )
    ) else (
        echo.
        echo ❌ Deletion cancelled. The auto-activation issue will persist.
        echo    You can run this script again when ready.
    )
) else (
    echo ❌ Directory not found: C:\Users\PC\ServiceApp\agnoenv
    echo    It may have already been deleted or moved.
    echo    The auto-activation issue might be resolved already.
)

echo.
echo ========================================
pause