$ErrorActionPreference = "Stop"

Write-Host ""

Write-Host "DisateQ VENDOR"
Write-Host "Setup Layout v1"

Write-Host ""

$frontendPath = Join-Path $PSScriptRoot "..\..\apps\vendor-desktop\src"

$sharedLayoutPath = Join-Path $frontendPath "shared\layout"

New-Item -ItemType Directory -Force $sharedLayoutPath | Out-Null

$files = @(
    "AppShell.tsx",
    "Sidebar.tsx",
    "Topbar.tsx",
    "StatusBar.tsx"
)

foreach ($file in $files) {

    $filePath = Join-Path $sharedLayoutPath $file

    if (-not (Test-Path $filePath)) {

        New-Item -ItemType File $filePath | Out-Null

        Write-Host "[CREATED] $file"
    }
    else {

        Write-Host "[SKIPPED] $file already exists"
    }
}

Write-Host ""

Write-Host "Layout structure ready."

Write-Host ""