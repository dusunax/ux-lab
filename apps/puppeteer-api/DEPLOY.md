# Puppeteer API 배포 가이드

프로젝트 ID: `project-afterglow-2025-482305`

## 사전 준비

### 1. Google Cloud SDK 설치

1. [Google Cloud SDK 다운로드](https://cloud.google.com/sdk/docs/install)
2. 설치 후 PowerShell에서 인증:
   ```powershell
   gcloud auth login
   gcloud auth application-default login
   ```

### 2. Docker Desktop 실행

Docker Desktop이 실행 중인지 확인하세요.

### 3. 프로젝트 설정

```powershell
gcloud config set project project-afterglow-2025-482305
```

### 4. 환경변수 설정 (선택사항)

프로젝트 ID를 환경변수로 설정하면 배포 스크립트 실행 시 매번 입력할 필요가 없습니다.

**방법 1: 스크립트 사용 (권장)**
```powershell
cd apps/puppeteer-api
.\set-env.ps1
```

**방법 2: 직접 설정 (현재 세션만 유효)**
```powershell
$env:PROJECT_ID = "project-afterglow-2025-482305"
```

**방법 3: 영구적으로 설정 (시스템 환경변수)**
1. Windows 설정 → 시스템 → 정보 → 고급 시스템 설정
2. 환경 변수 → 새로 만들기
3. 변수 이름: `PROJECT_ID`
4. 변수 값: `project-afterglow-2025-482305`

## 배포 방법

### 방법 1: PowerShell 스크립트 사용 (권장)

**환경변수 설정 후:**
```powershell
cd apps/puppeteer-api
.\deploy.ps1
```

**또는 파라미터로 직접 전달:**
```powershell
cd apps/puppeteer-api
.\deploy.ps1 project-afterglow-2025-482305
```

### 방법 2: Cloud Build 사용

```powershell
# 프로젝트 루트에서 실행
gcloud builds submit --config apps/puppeteer-api/cloudbuild.yaml .
```

### 방법 3: 수동 배포

#### 3-1. Docker 이미지 빌드

```powershell
cd apps/puppeteer-api
docker build -t gcr.io/project-afterglow-2025-482305/puppeteer-api:latest -f Dockerfile .
```

#### 3-2. Container Registry 인증

```powershell
gcloud auth configure-docker
```

#### 3-3. 이미지 푸시

```powershell
docker push gcr.io/project-afterglow-2025-482305/puppeteer-api:latest
```

#### 3-4. Cloud Run 배포

```powershell
gcloud run deploy puppeteer-api `
  --image gcr.io/project-afterglow-2025-482305/puppeteer-api:latest `
  --region asia-northeast3 `
  --platform managed `
  --allow-unauthenticated `
  --port 8080 `
  --memory 2Gi `
  --cpu 2 `
  --timeout 300 `
  --max-instances 10 `
  --concurrency 1
```

## 배포 확인

배포가 완료되면 서비스 URL이 표시됩니다. Health Check:

```powershell
curl https://[서비스-URL]/health
```

또는 브라우저에서 직접 접속해도 됩니다.

## 문제 해결

### Docker Desktop 오류
- Docker Desktop이 실행 중인지 확인
- Docker Desktop 재시작

### gcloud 인증 오류
```powershell
gcloud auth login
gcloud auth application-default login
```

### API 활성화 오류
```powershell
gcloud services enable containerregistry.googleapis.com
gcloud services enable run.googleapis.com
```

## 배포 후 설정

Cloud Run 콘솔에서 다음을 확인/설정할 수 있습니다:
- 환경 변수
- 트래픽 할당
- 로그 확인
- 모니터링

