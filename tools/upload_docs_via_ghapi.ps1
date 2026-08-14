# 临时脚本：用 gh api PUT contents 上传文档（git push 443 被干扰时的备选通道）
$ErrorActionPreference = 'Stop'
Set-Location "C:\Users\23017\Desktop\AI比赛\music-village"

$files = @(
    @{ path = 'docs/项目说明文档_完整版.md';  msg = '导演：说明文档加入发起人理念原话(挖掘潜力到探索世界到回报家乡)+结尾祝愿呼应' },
    @{ path = 'docs/项目说明文档_完整版.html'; msg = '导演：说明文档html同步理念原话与祝愿' },
    @{ path = 'docs/项目说明文档_完整版.pdf';  msg = '导演：生成PDF版项目说明文档(1.3MB)' },
    @{ path = 'docs/社媒发布文案_分平台定制.md'; msg = '导演：抖音钩子改纯文字卡无需实拍素材;微博补发起人理念原话' }
)

foreach ($f in $files) {
    $local = $f.path -replace '/', '\'
    if (-not (Test-Path $local)) { Write-Output ("MISSING " + $local); continue }
    $content = [Convert]::ToBase64String([IO.File]::ReadAllBytes((Resolve-Path $local)))
    $apiPath = $f.path
    # 获取当前远程 sha（存在则更新，不存在则新建）
    $sha = $null
    try { $sha = gh api "repos/sunwindy91/music-village/contents/$apiPath" --jq '.sha' 2>$null } catch { $sha = $null }
    if ($sha) {
        $r = gh api -X PUT "repos/sunwindy91/music-village/contents/$apiPath" -f "message=$($f.msg)" -f "content=$content" -f "sha=$sha" --jq '.commit.sha' 2>&1
    } else {
        $r = gh api -X PUT "repos/sunwindy91/music-village/contents/$apiPath" -f "message=$($f.msg)" -f "content=$content" --jq '.commit.sha' 2>&1
    }
    Write-Output ("UPLOADED " + $f.path + " -> " + $r)
}
Write-Output "ALL_DONE"
