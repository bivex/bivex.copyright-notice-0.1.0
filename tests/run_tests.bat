@echo off
REM Quick test runner for Windows
echo 🚀 Running Copyright Algorithm Mutation Tests...
echo.

cd /d "%~dp0"

echo 🔬 Running Basic Mutation Tests...
node mutation_tests.js
echo.

echo 🧬 Running Advanced Mutation Tests...
node advanced_mutation_tests.js
echo.

echo 🔗 Running Integration Tests...
node integration_mutation_tests.js
echo.

echo 🎯 Running Complete Test Suite...
node run_all_mutation_tests.js
echo.

echo ✅ All tests completed! Check the generated report files.
echo 📄 HTML Report: mutation_test_report.html
echo 📊 JSON Reports: mutation_test_master_report.json

pause
