# Puppeteer API 배포 스크립트 (PowerShell)
# 사용법: .\deploy.ps1 [PROJECT_ID]
# 또는 환경변수 PROJECT_ID 설정 후: .\deploy.ps1

param(
    [Parameter(Mandatory=$false)]
    [string]$ProjectId
)

$ErrorActionPreference = "Stop"

# PATH 새로고침 (gcloud CLI 인식용)
$env:PATH = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# 프로젝트 ID 확인 (파라미터 또는 환경변수)
if (-not $ProjectId) {
    $ProjectId = $env:PROJECT_ID
}

if (-not $ProjectId) {
    Write-Host "❌ 프로젝트 ID가 필요합니다." -ForegroundColor Red
    Write-Host ""
    Write-Host "사용 방법:" -ForegroundColor Yellow
    Write-Host "  1. 파라미터로 전달: .\deploy.ps1 project-afterglow-2025-482305"
    Write-Host "  2. 환경변수 설정: `$env:PROJECT_ID = 'project-afterglow-2025-482305'"
    Write-Host ""
    exit 1
}

$ServiceName = "puppeteer-api"
$Region = "asia-northeast3"
$ImageName = "gcr.io/$ProjectId/$ServiceName`:latest"

Write-Host "🚀 Puppeteer API 배포를 시작합니다..." -ForegroundColor Cyan
Write-Host "프로젝트 ID: $ProjectId"
Write-Host "서비스 이름: $ServiceName"
Write-Host "리전: $Region"
Write-Host ""

# gcloud CLI 확인
try {
    $null = Get-Command gcloud -ErrorAction Stop
} catch {
    Write-Host "❌ gcloud CLI가 설치되어 있지 않습니다." -ForegroundColor Red
    Write-Host "https://cloud.google.com/sdk/docs/install 에서 설치하세요."
    exit 1
}

# Docker 확인
try {
    $null = Get-Command docker -ErrorAction Stop
} catch {
    Write-Host "❌ Docker가 설치되어 있지 않습니다." -ForegroundColor Red
    exit 1
}

# gcloud 인증 확인
Write-Host "🔐 gcloud 인증 확인 중..." -ForegroundColor Yellow
$authAccounts = gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>$null
if (-not $authAccounts) {
    Write-Host "⚠️  gcloud 인증이 필요합니다. 다음 명령어를 실행하세요:" -ForegroundColor Yellow
    Write-Host "   gcloud auth login"
    exit 1
}

# 프로젝트 설정
Write-Host "📦 GCP 프로젝트 설정 중..." -ForegroundColor Yellow
gcloud config set project $ProjectId

# Container Registry API 활성화
Write-Host "🔧 Container Registry API 활성화 중..." -ForegroundColor Yellow
gcloud services enable containerregistry.googleapis.com 2>$null

# Cloud Run API 활성화
Write-Host "🔧 Cloud Run API 활성화 중..." -ForegroundColor Yellow
gcloud services enable run.googleapis.com 2>$null

# Docker 이미지 빌드
Write-Host "🏗️  Docker 이미지 빌드 중..." -ForegroundColor Yellow
# 현재 디렉토리가 puppeteer-api인지 확인
$currentDir = Get-Location
if ($currentDir.Path -like "*puppeteer-api*") {
    # puppeteer-api 디렉토리에서 실행 중
    docker build -t $ImageName -f Dockerfile .
} else {
    # 프로젝트 루트에서 실행 중
    docker build -t $ImageName -f apps/puppeteer-api/Dockerfile apps/puppeteer-api
}

# Docker 인증
Write-Host "🔐 Container Registry 인증 중..." -ForegroundColor Yellow
gcloud auth configure-docker --quiet

# 이미지 푸시
Write-Host "📤 Docker 이미지 푸시 중..." -ForegroundColor Yellow
docker push $ImageName

# Cloud Run 배포
Write-Host "🚀 Cloud Run에 배포 중..." -ForegroundColor Yellow
gcloud run deploy $ServiceName `
  --image $ImageName `
  --region $Region `
  --platform managed `
  --allow-unauthenticated `
  --port 8080 `
  --memory 2Gi `
  --cpu 2 `
  --timeout 300 `
  --max-instances 10 `
  --concurrency 1

# 서비스 URL 가져오기
$ServiceUrl = gcloud run services describe $ServiceName --region $Region --format="value(status.url)"

Write-Host ""
Write-Host "✅ 배포가 완료되었습니다!" -ForegroundColor Green
Write-Host "🌐 서비스 URL: $ServiceUrl" -ForegroundColor Cyan
Write-Host "🏥 Health Check: $ServiceUrl/health" -ForegroundColor Cyan
Write-Host ""

