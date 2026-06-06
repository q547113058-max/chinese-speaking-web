param(
  [string]$Owner = "q547113058-max",
  [string]$Repo = "chinese-speaking-web",
  [string]$Branch = "main",
  [string]$Message = "Sync project files"
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  throw "GitHub CLI 'gh' is required. Install it and run 'gh auth login' first."
}

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$rootPath = $root.ProviderPath.TrimEnd([System.IO.Path]::DirectorySeparatorChar, [System.IO.Path]::AltDirectorySeparatorChar)
$skipDirs = @(".git", "node_modules")
$skipFiles = @(".env")

function Convert-ToRepoPath([string]$Path) {
  $relative = $Path.Substring($rootPath.Length).TrimStart([System.IO.Path]::DirectorySeparatorChar, [System.IO.Path]::AltDirectorySeparatorChar)
  return $relative.Replace([System.IO.Path]::DirectorySeparatorChar, "/")
}

function Get-RemoteSha([string]$RepoPath) {
  $encodedPath = ($RepoPath -split "/" | ForEach-Object { [System.Uri]::EscapeDataString($_) }) -join "/"
  $output = gh api "repos/$Owner/$Repo/contents/$encodedPath`?ref=$Branch" 2>$null
  if ($LASTEXITCODE -ne 0) {
    return $null
  }

  $json = $output | ConvertFrom-Json
  return $json.sha
}

function Invoke-GitHubPut([string]$RepoPath, [string]$Json) {
  $Json | gh api -X PUT "repos/$Owner/$Repo/contents/$RepoPath" --input - | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to sync $RepoPath"
  }
}

$files = Get-ChildItem -LiteralPath $root -Recurse -File -Force | Where-Object {
  $relative = $_.FullName.Substring($rootPath.Length).TrimStart([System.IO.Path]::DirectorySeparatorChar, [System.IO.Path]::AltDirectorySeparatorChar)
  $parts = $relative -split "[\\/]"
  -not ($parts | Where-Object { $skipDirs -contains $_ }) -and
  -not ($skipFiles -contains $_.Name) -and
  $_.Extension -ne ".log"
}

foreach ($file in $files) {
  $repoPath = Convert-ToRepoPath $file.FullName
  $content = [Convert]::ToBase64String([System.IO.File]::ReadAllBytes($file.FullName))
  $sha = Get-RemoteSha $repoPath
  $body = @{
    message = $Message
    branch = $Branch
    content = $content
  }

  if ($sha) {
    $body.sha = $sha
  }

  $json = $body | ConvertTo-Json -Compress
  Invoke-GitHubPut $repoPath $json
  Write-Output "synced $repoPath"
}
