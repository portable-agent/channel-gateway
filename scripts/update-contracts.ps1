param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^\d+\.\d+\.\d+$')]
    [string]$Version
)

$ErrorActionPreference = 'Stop'
$repoPath = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$tempPath = Join-Path ([System.IO.Path]::GetTempPath()) ("portable-agent-contracts-" + [guid]::NewGuid())
$archiveName = "portable-agent-contracts-$Version.tgz"
$archivePath = Join-Path $tempPath $archiveName
$checksumPath = Join-Path $tempPath 'SHA256SUMS'
$releaseUrl = "https://github.com/portable-agent/contracts/releases/download/v$Version"
$names = @('channel-gateway-api.yaml', 'agent-runtime-api.yaml')
$staged = @{}
$backups = @{}
$replaced = @()

try {
    if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
        throw 'GitHub CLI is required to verify the contract attestation.'
    }
    New-Item -ItemType Directory -Path $tempPath | Out-Null
    Invoke-WebRequest -Uri "$releaseUrl/$archiveName" -OutFile $archivePath
    Invoke-WebRequest -Uri "$releaseUrl/SHA256SUMS" -OutFile $checksumPath

    $escapedName = [regex]::Escape($archiveName)
    $entries = @(Get-Content -LiteralPath $checksumPath | Where-Object {
        $_ -match "^(?<hash>[a-fA-F0-9]{64})\s+\*?$escapedName$"
    })
    if ($entries.Count -ne 1) {
        throw 'Checksum file does not contain exactly one entry for the contract bundle.'
    }
    $null = $entries[0] -match '^(?<hash>[a-fA-F0-9]{64})'
    if ((Get-FileHash -Algorithm SHA256 -LiteralPath $archivePath).Hash -ne $Matches.hash.ToUpperInvariant()) {
        throw 'Checksum contract bundle does not match the release.'
    }

    & gh attestation verify $archivePath --repo portable-agent/contracts
    if ($LASTEXITCODE -ne 0) {
        throw 'Cannot verify the GitHub attestation for the contract bundle.'
    }

    foreach ($name in $names) {
        & tar -xzf $archivePath -C $tempPath "package/openapi/$name"
        if ($LASTEXITCODE -ne 0) {
            throw "Cannot unpack $name."
        }
        $source = Join-Path $tempPath "package/openapi/$name"
        if ((Get-Content -Raw -LiteralPath $source) -notmatch "(?m)^  version: $([regex]::Escape($Version))$") {
            throw "$name version does not match the requested release."
        }
        $staged[$name] = Join-Path $repoPath "contracts/.$name.$([guid]::NewGuid()).stage"
        $backups[$name] = Join-Path $repoPath "contracts/.$name.$([guid]::NewGuid()).backup"
        Copy-Item -LiteralPath $source -Destination $staged[$name]
    }

    foreach ($name in $names) {
        $target = Join-Path $repoPath "contracts/$name"
        [System.IO.File]::Replace($staged[$name], $target, $backups[$name], $true)
        $replaced += $name
    }
    Write-Output "Channel Gateway contracts updated to version $Version."
} catch {
    foreach ($name in $replaced) {
        if (Test-Path -LiteralPath $backups[$name]) {
            Copy-Item -LiteralPath $backups[$name] -Destination (Join-Path $repoPath "contracts/$name") -Force
        }
    }
    throw
} finally {
    foreach ($path in @($staged.Values) + @($backups.Values)) {
        if ($path -and (Test-Path -LiteralPath $path)) {
            Remove-Item -LiteralPath $path -Force
        }
    }
    $resolvedTemp = [System.IO.Path]::GetFullPath($tempPath)
    $systemTemp = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())
    if ($resolvedTemp.StartsWith($systemTemp, [System.StringComparison]::OrdinalIgnoreCase) -and
        (Test-Path -LiteralPath $resolvedTemp)) {
        Remove-Item -LiteralPath $resolvedTemp -Recurse -Force
    }
}
