# Ensures Windows junctions so React Native autolinking can find codegen
# after buildDir is redirected to apps/traveler-app/android/build/<name>.
# Run from repo root if assembleDebug fails with missing codegen directories.

$ErrorActionPreference = "Stop"
$repoRoot = (Get-Item "$PSScriptRoot\..\..\..\..").FullName
$androidBuild = "$PSScriptRoot\..\build"
$autolinkingCmake = "$PSScriptRoot\..\build\app\generated\autolinking\src\main\jni\Android-autolinking.cmake"

$pkgMap = @{
  "@react-native-async-storage/async-storage" = "react-native-async-storage_async-storage"
  "@react-native-community/datetimepicker"     = "react-native-community_datetimepicker"
  "react-native-reanimated"                   = "react-native-reanimated"
  "react-native-webview"                      = "react-native-webview"
  "react-native-worklets"                     = "react-native-worklets"
  "react-native-gesture-handler"              = "react-native-gesture-handler"
  "react-native-safe-area-context"           = "react-native-safe-area-context"
  "react-native-screens"                      = "react-native-screens"
  "react-native-svg"                          = "react-native-svg"
}

$fromPaths = @{}

# 1. Parse Android-autolinking.cmake if present to get exact path expected by CMake
if (Test-Path $autolinkingCmake) {
  $content = Get-Content $autolinkingCmake
  foreach ($line in $content) {
    if ($line -match 'add_subdirectory\("([^"]+)"') {
      $path = $matches[1]
      foreach ($pkg in $pkgMap.Keys) {
        $escapedPkg = [regex]::Escape($pkg)
        if ($path -match "node_modules[/\\]$escapedPkg[/\\]android") {
          $androidDir = $path -replace "([/\\]android).*", '$1'
          $fromPaths[$pkg] = ((Join-Path $androidDir "build") -replace '/', '\')
        }
      }
    }
  }
}

# 2. Fallback to searching .pnpm directory dynamically
$pnpmDir = Join-Path $repoRoot "node_modules\.pnpm"
if (Test-Path $pnpmDir) {
  $pnpmEntries = Get-ChildItem -Path $pnpmDir -Directory -ErrorAction SilentlyContinue
  foreach ($pkg in $pkgMap.Keys) {
    if (-not $fromPaths.ContainsKey($pkg)) {
      $found = $pnpmEntries | Where-Object {
        Test-Path (Join-Path $_.FullName "node_modules\$pkg\android")
      } | Select-Object -First 1
      if ($found) {
        $fromPaths[$pkg] = Join-Path $found.FullName "node_modules\$pkg\android\build"
      }
    }
  }
}

# 3. Create junctions for all resolved package build directories
foreach ($pkg in $pkgMap.Keys) {
  $name = $pkgMap[$pkg]
  $to = Join-Path $androidBuild $name
  New-Item -ItemType Directory -Force -Path $to | Out-Null

  if ($fromPaths.ContainsKey($pkg)) {
    $from = $fromPaths[$pkg]
    if (Test-Path $from) {
      $item = Get-Item $from -Force
      $linked = $false
      try {
        $linked = $item.Target -and ($item.Target -join "") -like "*$name*"
      } catch {}
      if (-not $linked) {
        cmd /c "rmdir /S /Q `"$from`"" | Out-Null
        cmd /c "mklink /J `"$from`" `"$to`""
      } else {
        Write-Host "OK junction: $pkg"
      }
    } else {
      $parent = Split-Path $from -Parent
      if (-not (Test-Path $parent)) {
        New-Item -ItemType Directory -Force -Path $parent | Out-Null
      }
      cmd /c "mklink /J `"$from`" `"$to`""
    }

    $codegen = Join-Path $from "generated\source\codegen\jni\CMakeLists.txt"
    Write-Host "${pkg}: codegen=$(Test-Path $codegen)"
  } else {
    Write-Warning "Could not find node_modules path for $pkg"
  }
}

