$root='C:\Users\MY PC\alchemistwebsite\backend'
if(-not (Test-Path $root)){Write-Output "ERROR: backend path not found"; exit 1}
Write-Output "Top-level counts (excluding _archive):"
Get-ChildItem -Path $root -Force | Where-Object { $_.Name -ne '_archive' } | ForEach-Object {
  if ($_.PSIsContainer) {
    $c = (Get-ChildItem -Path $_.FullName -Recurse -File -ErrorAction SilentlyContinue | Measure-Object).Count
    Write-Output "$($_.Name) : $c files"
  } else {
    Write-Output "$($_.Name) : file"
  }
}
Write-Output ""
$v = Join-Path $root "_archive\vendor"
Write-Output "Sample contents of backend/_archive/vendor (first 200 entries):"
if(Test-Path $v) {
  Get-ChildItem -Path $v -Recurse -File -ErrorAction SilentlyContinue | Select-Object -First 200 | ForEach-Object { Write-Output $_.FullName }
} else {
  Write-Output "_archive/vendor not found"
}
