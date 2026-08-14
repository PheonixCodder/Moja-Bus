# Ensures Windows junctions so React Native autolinking can find codegen
# after buildDir is redirected to apps/traveler-app/android/build/<name>.
# Run from repo root if assembleDebug fails with missing codegen directories.

$ErrorActionPreference = "Stop"
$androidBuild = "C:\dev\moja-buss\apps\traveler-app\android\build"

$pairs = @(
  @{ pkg = "@react-native-async-storage/async-storage"; hash = "_41b442779b6924d2a26a8d8f7d9ac86d"; name = "react-native-async-storage_async-storage" },
  @{ pkg = "@react-native-community/datetimepicker"; hash = "_f2d82b814553fea13f8f901249083e4d"; name = "react-native-community_datetimepicker" },
  @{ pkg = "react-native-reanimated"; hash = "_1b9e74e040a57818530d3df9c1d53fba"; name = "react-native-reanimated" },
  @{ pkg = "react-native-webview"; hash = "_3f89b10e21759a6c8056da2f607e8677"; name = "react-native-webview" },
  @{ pkg = "react-native-worklets"; hash = "_cab0d8f1bbac8513f6b0715ba12333c1"; name = "react-native-worklets" },
  @{ pkg = "react-native-gesture-handler"; hash = "_5b8852894aba3f9cc31e174add47a342"; name = "react-native-gesture-handler" },
  @{ pkg = "react-native-safe-area-context"; hash = "_4ec990aa712a1eb04bc58f8b47ae6fd8"; name = "react-native-safe-area-context" },
  @{ pkg = "react-native-screens"; hash = "_8a4f556744b40950f5ddd4a392f4ea70"; name = "react-native-screens" },
  @{ pkg = "react-native-svg"; hash = "_f6be43d28efe15216aa0a10f14aafda7"; name = "react-native-svg" }
)

foreach ($p in $pairs) {
  $from = "C:\dev\moja-buss\node_modules\.pnpm\$($p.hash)\node_modules\$($p.pkg)\android\build"
  $to = Join-Path $androidBuild $p.name
  New-Item -ItemType Directory -Force -Path $to | Out-Null

  if (Test-Path $from) {
    $item = Get-Item $from -Force
    $linked = $false
    try {
      $linked = $item.Target -and ($item.Target -join "") -like "*$($p.name)*"
    } catch {}
    if (-not $linked) {
      # Real leftover dir — remove, then junction
      cmd /c "rmdir /S /Q `"$from`"" | Out-Null
      cmd /c "mklink /J `"$from`" `"$to`""
    } else {
      Write-Host "OK junction: $($p.pkg)"
    }
  } else {
    cmd /c "mklink /J `"$from`" `"$to`""
  }

  $codegen = Join-Path $from "generated\source\codegen\jni\CMakeLists.txt"
  Write-Host "$($p.pkg): codegen=$(Test-Path $codegen)"
}
