[CmdletBinding()]
param(
  [string]$OutputPath,
  [switch]$Force
)

$ErrorActionPreference = 'Stop'

$repoRoot = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
if ([string]::IsNullOrWhiteSpace($OutputPath)) {
  $OutputPath = Join-Path (Split-Path -Parent $repoRoot) 'landnote-handoff.zip'
}
$outputFullPath = [IO.Path]::GetFullPath($OutputPath)
$repoPrefix = $repoRoot.TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar

if ($outputFullPath.StartsWith($repoPrefix, [StringComparison]::OrdinalIgnoreCase)) {
  throw 'OutputPath must be outside the repository so the ZIP cannot include itself.'
}

if ((Test-Path -LiteralPath $outputFullPath) -and -not $Force) {
  throw "Output already exists: $outputFullPath. Use -Force to replace it."
}

$excludedDirectories = @(
  '.git', '.claude', '.idea', '.vscode', '.vercel', '.supabase',
  'node_modules', '.next', 'dist', '.turbo', 'coverage', 'test-results',
  'playwright-report', 'out', 'build'
)

function Test-ExcludedFile {
  param([IO.FileInfo]$File)

  $name = $File.Name
  $lowerName = $name.ToLowerInvariant()
  $extension = $File.Extension.ToLowerInvariant()

  if ($lowerName -in @('.env.example', '.env.local.example')) {
    return $false
  }

  if ($lowerName -match '^\.env($|\.)' -or $lowerName -like '*.env') {
    return $true
  }

  if ($extension -in @('.pem', '.key', '.p12', '.pfx', '.jks', '.keystore', '.dump', '.backup', '.bak', '.sqlite', '.sqlite3', '.db', '.log', '.zip')) {
    return $true
  }

  if ($lowerName -match '^(credentials?|secrets?)(\.|$)' -or $lowerName -like 'tmp_*.html') {
    return $true
  }

  return $false
}

$tempRoot = Join-Path ([IO.Path]::GetTempPath()) ("landnote-handoff-" + [guid]::NewGuid().ToString('N'))
$copiedCount = 0

try {
  New-Item -ItemType Directory -Path $tempRoot | Out-Null

  foreach ($file in (Get-ChildItem -LiteralPath $repoRoot -Recurse -Force -File)) {
    $relativePath = $file.FullName.Substring($repoRoot.Length).TrimStart('\', '/')
    $pathParts = $relativePath -split '[\\/]'
    $containsExcludedDirectory = $false

    foreach ($part in $pathParts[0..([Math]::Max(0, $pathParts.Count - 2))]) {
      if ($excludedDirectories -contains $part) {
        $containsExcludedDirectory = $true
        break
      }
    }

    if ($containsExcludedDirectory -or (Test-ExcludedFile -File $file)) {
      continue
    }

    $destination = Join-Path $tempRoot $relativePath
    $destinationDirectory = Split-Path -Parent $destination
    if (-not (Test-Path -LiteralPath $destinationDirectory)) {
      New-Item -ItemType Directory -Path $destinationDirectory -Force | Out-Null
    }
    Copy-Item -LiteralPath $file.FullName -Destination $destination
    $copiedCount++
  }

  @"
LandNote handoff package

This package contains source code, migrations, documentation, and environment-variable examples only.
It does not contain Git history, installed dependencies, build outputs, real .env files, service credentials, database dumps, or customer data.

The recipient must create and configure their own GitHub, Vercel, Railway, Supabase, Toss Payments, Resend, and DNS resources by following README.md and docs/deploy.md.
"@ | Set-Content -LiteralPath (Join-Path $tempRoot 'HANDOFF_PACKAGE.txt') -Encoding UTF8

  $outputDirectory = Split-Path -Parent $outputFullPath
  if (-not (Test-Path -LiteralPath $outputDirectory)) {
    New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
  }
  if (Test-Path -LiteralPath $outputFullPath) {
    Remove-Item -LiteralPath $outputFullPath -Force
  }

  Add-Type -AssemblyName System.IO.Compression.FileSystem
  [IO.Compression.ZipFile]::CreateFromDirectory(
    $tempRoot,
    $outputFullPath,
    [IO.Compression.CompressionLevel]::Optimal,
    $false
  )

  Write-Output "Created: $outputFullPath"
  Write-Output "Included source files: $copiedCount"
  Write-Output 'Excluded: real env files, credentials, Git history, dependencies, build/test outputs, dumps, logs, and temporary files.'
}
finally {
  if (Test-Path -LiteralPath $tempRoot) {
    Remove-Item -LiteralPath $tempRoot -Recurse -Force
  }
}
