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
    "docs/decisions/0001-gateway-boundary.md"
)

$missingFiles = $requiredFiles | Where-Object { -not (Test-Path -LiteralPath $_ -PathType Leaf) }
if ($missingFiles.Count -gt 0) {
    throw "Нет обязательных файлов: $($missingFiles -join ', ')"
}

$catalogText = Get-Content -LiteralPath "catalog-info.yaml" -Raw
if ($catalogText -notmatch "backstage\.io/techdocs-ref:\s*dir:\.") {
    throw "В catalog-info.yaml нет backstage.io/techdocs-ref: dir:."
}
if ($catalogText -notmatch "channel-gateway-api@2\.2\.0") {
    throw "В catalog-info.yaml должна быть закреплена версия Channel Gateway API 2.2.0."
}

$serviceText = Get-Content -LiteralPath "SERVICE.md" -Raw
if ($serviceText -notmatch "Agent Runtime" -or $serviceText -notmatch "stateless") {
    throw "SERVICE.md не описывает границу и зависимость сервиса."
}

Write-Host "Документация channel-gateway соответствует стандарту."
