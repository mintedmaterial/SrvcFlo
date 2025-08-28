@echo off
echo ========================================
echo Activating Correct Virtual Environment  
echo ========================================
echo.

REM Navigate to the project root
cd /d "C:\Users\PC\ServiceApp\myserviceprovider-app"

REM Deactivate any current environment
call deactivate 2>NUL

REM Activate the correct virtual environment
echo 🔄 Activating virtual environment at: .venv
call .venv\Scripts\activate.bat

REM Verify activation
echo.
echo ✅ Virtual environment activated!
echo 🐍 Python location: 
python -c "import sys; print(sys.executable)"

echo.
echo 📦 Available packages:
python -c "import agno; print('   ✅ Agno version:', agno.__version__)" 2>NUL || echo "   ❌ Agno not found"
python -c "import flask; print('   ✅ Flask version:', flask.__version__)" 2>NUL || echo "   ❌ Flask not found"

echo.
echo 🎯 You can now run:
echo    - cd Agents && python http_srvcflo_agent.py
echo    - cd Agents && python playground.py  
echo    - cd Agents && python srvcflo_team_agent.py
echo.
echo 💡 This terminal now has the correct environment activated!
echo    Keep this terminal open and use it for all Python commands.