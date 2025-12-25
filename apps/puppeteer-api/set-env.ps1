# 프로젝트 환경변수 설정 스크립트
# 이 스크립트를 실행하면 현재 PowerShell 세션에 환경변수가 설정됩니다.

$env:PROJECT_ID = "project-afterglow-2025-482305"

Write-Host "✅ 환경변수가 설정되었습니다!" -ForegroundColor Green
Write-Host "PROJECT_ID = $env:PROJECT_ID" -ForegroundColor Cyan
Write-Host ""
Write-Host "이제 배포 스크립트를 실행할 수 있습니다:" -ForegroundColor Yellow
Write-Host "  .\deploy.ps1" -ForegroundColor White
Write-Host ""
Write-Host "참고: 이 환경변수는 현재 PowerShell 세션에만 유효합니다." -ForegroundColor Gray
Write-Host "영구적으로 설정하려면 시스템 환경변수로 설정하세요." -ForegroundColor Gray
Write-Host ""

