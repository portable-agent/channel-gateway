$ErrorActionPreference = "Stop"

$requiredFiles = @(
    "README.md",
    "AGENTS.md",
    "SERVICE.md",
    "catalog-info.yaml",
    "mkdocs.yml",
    "docs/index.md",
    "docs/architecture.md",
    "docs/development.md",
    "docs/runbook.md",
    "docs/decisions/0001-gateway-boundary.md",
    "docs/decisions/0002-conversation-route.md",
    "docs/decisions/0003-action-decision-route.md"
)

$missingFiles = $requiredFiles | Where-Object { -not (Test-Path -LiteralPath $_ -PathType Leaf) }
if ($missingFiles.Count -gt 0) {
    throw "Required documentation files are missing: $($missingFiles -join ', ')"
}

$catalogText = Get-Content -LiteralPath "catalog-info.yaml" -Raw
if ($catalogText -notmatch "backstage\.io/techdocs-ref:\s*dir:\.") {
    throw "catalog-info.yaml must contain backstage.io/techdocs-ref: dir:."
}
if ($catalogText -notmatch "channel-gateway-api@2\.5\.0") {
    throw "catalog-info.yaml must pin Channel Gateway API 2.5.0."
}

$serviceText = Get-Content -LiteralPath "SERVICE.md" -Raw
if ($serviceText -notmatch "Conversation Service" -or $serviceText -notmatch "Action Service" -or $serviceText -notmatch "stateless") {
    throw "SERVICE.md must describe the service boundary and dependency."
}

Write-Host "Channel Gateway documentation checks passed."
