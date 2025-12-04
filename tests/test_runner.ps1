# PowerShell test runner
Write-Host "🚀 Starting Mutation Tests..." -ForegroundColor Green

$testResults = @()

# Function to run a test and capture output
function Run-Test {
    param([string]$testName, [string]$testFile)

    Write-Host "🔬 Running $testName..." -ForegroundColor Yellow

    try {
        $output = & node $testFile 2>&1
        $testResults += @{
            Name = $testName
            Status = "Completed"
            Output = $output -join "`n"
        }
        Write-Host "✅ $testName completed" -ForegroundColor Green
    } catch {
        $testResults += @{
            Name = $testName
            Status = "Failed"
            Error = $_.Exception.Message
        }
        Write-Host "❌ $testName failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Run individual tests
Run-Test "Debug Test" "debug_test.js"
Run-Test "Mutation Tests" "mutation_tests.js"
Run-Test "Advanced Tests" "advanced_mutation_tests.js"
Run-Test "Integration Tests" "integration_mutation_tests.js"

# Summary
$totalTests = $testResults.Count
$passedTests = ($testResults | Where-Object { $_.Status -eq "Completed" }).Count
$failedTests = $totalTests - $passedTests

Write-Host "`n📊 Test Summary:" -ForegroundColor Cyan
Write-Host "Total Tests: $totalTests" -ForegroundColor White
Write-Host "Passed: $passedTests" -ForegroundColor Green
Write-Host "Failed: $failedTests" -ForegroundColor Red

if ($failedTests -eq 0) {
    Write-Host "🎉 All tests passed!" -ForegroundColor Green
} else {
    Write-Host "⚠️ Some tests failed" -ForegroundColor Yellow
}

# Save results to file
$resultsFile = "test_execution_results.json"
$testResults | ConvertTo-Json | Out-File -FilePath $resultsFile -Encoding UTF8
Write-Host "📝 Results saved to $resultsFile" -ForegroundColor Blue

Read-Host "Press Enter to exit"
