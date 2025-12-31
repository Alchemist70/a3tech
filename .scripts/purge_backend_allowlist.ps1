# Purge backend top-level items NOT in allowlist
$root = 'C:\Users\MY PC\alchemistwebsite\backend'
if (-not (Test-Path $root)) {
    Write-Host "ERROR: backend path not found: $root"
    exit 1
}

$allow = @(
    'controllers', 'routes', 'models', 'utils', 'scripts', '__tests__', 'src',
    'server.js', 'server.ts', 'server.d.ts', 'package.json', 'package-lock.json',
    'tsconfig.json', 'env.example', 'README.md', '.gitignore', '.env',
    'backend-cleanup-proposal.md', 'backend-cleanup-classification.json', '.scripts'
)

$removed = 0
$removedBytes = 0

Write-Host "ALLOWLIST:"
$allow | ForEach-Object { Write-Host " - $_" }
Write-Host ""

$items = Get-ChildItem -Path $root -Force
foreach ($it in $items) {
    if ($allow -contains $it.Name) { continue }
    try {
        if ($it.PSIsContainer) {
            $files = Get-ChildItem -Path $it.FullName -Recurse -File -ErrorAction SilentlyContinue
            $count = $files.Count
            $size = 0
            if ($count -gt 0) { $size = ($files | Measure-Object -Property Length -Sum).Sum }
            Remove-Item -Path $it.FullName -Recurse -Force -ErrorAction Stop
            $removed += $count
            $removedBytes += $size
            Write-Host "REMOVED_DIR: $($it.FullName) files=$count size_bytes=$size"
        } else {
            $size = $it.Length
            Remove-Item -LiteralPath $it.FullName -Force -ErrorAction Stop
            $removed += 1
            $removedBytes += $size
            Write-Host "REMOVED_FILE: $($it.FullName) size_bytes=$size"
        }
    } catch {
        Write-Host "WARN: failed to remove $($it.FullName): $($_.Exception.Message)"
    }
}

Write-Host "\nSUMMARY:"
Write-Host "total_files_removed=$removed"
Write-Host "total_bytes_removed=$removedBytes"
Write-Host ""
Write-Host "Remaining top-level entries:"
Get-ChildItem -Path $root -Force | ForEach-Object {
    if ($_.PSIsContainer) {
        $c = (Get-ChildItem -Path $_.FullName -Recurse -File -ErrorAction SilentlyContinue | Measure-Object).Count
        Write-Host "$("$($_.Name) : $c files")"
    } else {
        Write-Host "$("$($_.Name) : file")"
    }
}
