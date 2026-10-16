[CmdletBinding()]
param([switch]$WebhookOnly)

$ErrorActionPreference = 'Stop'
$previousToken = $env:TGCLOUD_TOKEN
$statusPath = Join-Path $PSScriptRoot 'deployment-status.json'
$stage = 'token'
$temporaryModule = Join-Path $PSScriptRoot 'tgcloud\endpoints\verifyDeployment.js'
$createdModule = $false
$success = $false

function Invoke-Tgcloud {
    param([string[]]$CliArguments, [switch]$RetryRateLimit)
    for ($attempt = 1; $attempt -le 5; $attempt++) {
        # Windows PowerShell 5 treats redirected native stderr as ErrorRecord.
        $previousErrorPreference = $ErrorActionPreference
        try {
            $ErrorActionPreference = 'Continue'
            $cliOutput = & (Join-Path $PSScriptRoot 'node_modules\.bin\tgcloud.cmd') @CliArguments 2>&1
            $cliExitCode = $LASTEXITCODE
        } finally {
            $ErrorActionPreference = $previousErrorPreference
        }
        $outputText = ($cliOutput | ForEach-Object { $_.ToString() }) -join "`n"
        if ($outputText) { Write-Host $outputText }
        if ($cliExitCode -eq 0) { return }
        if ($RetryRateLimit -and $attempt -lt 5 -and $outputText -match '(?i)retry after\s+(\d+)') {
            $retrySeconds = [long]$Matches[1]
            if ($retrySeconds -le 55) {
                $waitSeconds = [int]$retrySeconds + 1
                Write-Host "Telegram pide esperar. Reintentando en $waitSeconds segundos ($attempt/5)..."
                Start-Sleep -Seconds $waitSeconds
                continue
            }
        }
        throw "El CLI falló en la etapa: $stage (código $cliExitCode)."
    }
}

Push-Location -LiteralPath $PSScriptRoot
try {
    $cliToken = $env:ALMUERZIN8OR_SL_KEY
    if (-not $cliToken) { $cliToken = [Environment]::GetEnvironmentVariable('ALMUERZIN8OR_SL_KEY', 'User') }
    if (-not $cliToken) { $cliToken = [Environment]::GetEnvironmentVariable('ALMUERZIN8OR_SL_KEY', 'Machine') }
    if (-not $cliToken) { throw 'No se encuentra ALMUERZIN8OR_SL_KEY en esta sesión, usuario o sistema. Ejecuta este script desde tu cuenta de Windows.' }
    $cliToken = $cliToken.Trim()
    if ($cliToken -notmatch '^app\d+:.+$') { throw 'ALMUERZIN8OR_SL_KEY no tiene formato de token CLI (app<id>:<secret>). Comprueba CLI Access en BotFather.' }
    $env:TGCLOUD_TOKEN = $cliToken
    $cliToken = $null

    $stage = 'dependencias'
    if (-not (Test-Path -LiteralPath 'node_modules\.bin\tgcloud.cmd')) {
        & npm.cmd ci
        if ($LASTEXITCODE -ne 0) { throw 'No se pudieron instalar las dependencias.' }
    }
    if (-not $WebhookOnly) {
    $stage = 'pruebas locales'
    & npm.cmd test
    if ($LASTEXITCODE -ne 0) { throw 'Las pruebas locales han fallado.' }

    $stage = 'consulta de la nube'
    Invoke-Tgcloud -CliArguments @('fetch')
    Invoke-Tgcloud -CliArguments @('status')

    # Schema first: handlers only become live after the table and cloud check pass.
    $stage = 'esquema'
    Invoke-Tgcloud -CliArguments @('push', 'tgcloud/schema.js')
    $stage = 'migraciones seguras'
    Invoke-Tgcloud -CliArguments @('migrate', '--safe')

    $stage = 'comprobación remota'
    if (Test-Path -LiteralPath $temporaryModule) { throw 'Ya existe el módulo temporal verifyDeployment.js. Revísalo antes de continuar.' }
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $temporaryModule) | Out-Null
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'tests\cloud-smoke.source') -Destination $temporaryModule
    $createdModule = $true
    Invoke-Tgcloud -CliArguments @('run', 'endpoints/verifyDeployment', '{}')
    Remove-Item -LiteralPath $temporaryModule -Force
    $createdModule = $false

    $stage = 'publicación del bot'
    Invoke-Tgcloud -CliArguments @('push', 'tgcloud/lib/', 'tgcloud/handlers/')
    }
    $stage = 'webhook'
    Invoke-Tgcloud -CliArguments @('webhook', 'sync') -RetryRateLimit
    Invoke-Tgcloud -CliArguments @('webhook') -RetryRateLimit
    $success = $true
    $stage = 'completado'
    Write-Host 'Despliegue completado. Prueba /pedido en Telegram, también con otro miembro del grupo.'
} finally {
    if ($createdModule -and (Test-Path -LiteralPath $temporaryModule)) {
        Remove-Item -LiteralPath $temporaryModule -Force
    }
    $env:TGCLOUD_TOKEN = $previousToken
    $cliToken = $null
    @{ success = $success; stage = $stage; checkedAt = [DateTimeOffset]::Now.ToString('o') } |
        ConvertTo-Json | Set-Content -LiteralPath $statusPath -Encoding UTF8
    Pop-Location
}
