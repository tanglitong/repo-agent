param(
  [string]$Archive = "release/repo-agent-node-offline.zip"
)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path ".").Path
$archivePath = (Resolve-Path $Archive).Path
$temporaryRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("repo-agent-windows-" + [guid]::NewGuid())
$extractRoot = Join-Path $temporaryRoot "offline"
$projectRoot = Join-Path $temporaryRoot "project with space"

try {
  New-Item -ItemType Directory -Force -Path $extractRoot, $projectRoot | Out-Null
  Expand-Archive -Path $archivePath -DestinationPath $extractRoot -Force
  $bundle = Join-Path $extractRoot "repo-agent/repo-agent.bundle.js"

  Push-Location $projectRoot
  try {
    @{
      name = "repo-agent-windows-smoke"
      private = $true
      scripts = @{
        test = "node --test"
        typecheck = "tsc --noEmit"
      }
    } | ConvertTo-Json -Depth 3 | Set-Content -Encoding utf8 "package.json"
    Set-Content -Encoding utf8 "SECURITY.md" "# Security"

    $version = (& node $bundle --version).Trim()
    if ($version -ne "1.0.0") {
      throw "版本输出异常：$version"
    }

    $init = (& node $bundle init --mode team --tool all --json | ConvertFrom-Json)
    if (-not $init.ok) {
      throw "初始化失败"
    }

    $validation = (& node $bundle validate --strict --json | ConvertFrom-Json)
    if (-not $validation.ok) {
      throw "严格校验失败"
    }

    foreach ($relative in @(
      ".codex/config.toml",
      ".codex/hooks.json",
      ".claude/settings.json",
      ".mcp.json",
      "opencode.json",
      ".opencode/plugins/repo-agent.js"
    )) {
      if (-not (Test-Path (Join-Path $projectRoot $relative))) {
        throw "接入文件缺失：$relative"
      }
    }

    $context = (& node $bundle context "修复 OAuth state 无效问题" --json | ConvertFrom-Json)
    if ($context.data.risk.level -ne "high") {
      throw "上下文风险判断异常"
    }

    $session = "windows-smoke-session"
    $preflightInput = @{
      session_id = $session
      turn_id = "turn-1"
      prompt = "验证 Windows OpenCode 自动闭环"
      hook_event_name = "UserPromptSubmit"
    } | ConvertTo-Json -Compress
    $preflight = ($preflightInput |
      & node $bundle hook user-prompt-submit --tool opencode |
      ConvertFrom-Json)
    if (-not $preflight.hookSpecificOutput.additionalContext) {
      throw "OpenCode Preflight 未注入上下文"
    }

    $stopInput = @{
      session_id = $session
      turn_id = "turn-1"
      stop_hook_active = $true
      last_assistant_message = "Windows smoke completed"
      outcome_status = "success"
      hook_event_name = "Stop"
    } | ConvertTo-Json -Compress
    $stop = ($stopInput |
      & node $bundle hook stop --tool opencode |
      ConvertFrom-Json)
    if ($stop.systemMessage -notmatch "闭环步骤完整") {
      throw "OpenCode Stop 闭环失败"
    }

    $health = (& node $bundle health check --deep --json | ConvertFrom-Json)
    if ($health.data.score -ne 100) {
      throw "Health 未达到 100：$($health.data.issues | ConvertTo-Json -Compress)"
    }
    if ($health.data.metrics.closureRate24h -ne 1) {
      throw "24 小时闭环率异常：$($health.data.metrics.closureRate24h)"
    }

    $request = @{
      jsonrpc = "2.0"
      id = 1
      method = "initialize"
      params = @{}
    } | ConvertTo-Json -Compress
    $mcp = ($request | & node $bundle mcp stdio | ConvertFrom-Json)
    if ($mcp.result.serverInfo.name -ne "repo-agent") {
      throw "MCP 初始化失败"
    }

    $checksumFile = Join-Path $extractRoot "repo-agent/CHECKSUMS.txt"
    foreach ($line in Get-Content $checksumFile) {
      if (-not $line.Trim()) { continue }
      $parts = $line -split "  ", 2
      $target = Join-Path (Join-Path $extractRoot "repo-agent") (
        $parts[1].Replace("/", [System.IO.Path]::DirectorySeparatorChar)
      )
      $actual = (Get-FileHash -Algorithm SHA256 $target).Hash.ToLowerInvariant()
      if ($actual -ne $parts[0]) {
        throw "Checksum 不一致：$($parts[1])"
      }
    }

    Write-Host "Windows 冒烟测试通过：Node $version，三端配置与 OpenCode 闭环正常"
  }
  finally {
    Pop-Location
  }
}
finally {
  if (Test-Path $temporaryRoot) {
    Remove-Item -Recurse -Force $temporaryRoot
  }
}
