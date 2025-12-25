# Puppeteer API

PDF 생성을 위한 독립적인 Puppeteer 서버입니다.

## 기능

- HTML 콘텐츠를 PDF로 변환
- Google Cloud Run에 최적화
- 이미지 로딩 대기
- PDF 스타일 자동 적용

## 로컬 개발

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 프로덕션 실행
npm start
```

## API 엔드포인트

### POST /api/pdf

HTML 콘텐츠를 PDF로 변환합니다.

**Request:**
```json
{
  "htmlContent": "<html>...</html>"
}
```

**Response:**
- Content-Type: `application/pdf`
- PDF 파일 바이너리

## Google Cloud Run 배포

### 방법 1: 배포 스크립트 사용 (권장)

**Linux/macOS:**
```bash
cd apps/puppeteer-api
chmod +x deploy.sh
./deploy.sh your-project-id
```

**Windows (PowerShell):**
```powershell
cd apps/puppeteer-api
.\deploy.ps1 your-project-id
```

### 방법 2: Cloud Build 사용 (자동 배포)

```bash
# 프로젝트 루트에서 실행
gcloud builds submit --config apps/puppeteer-api/cloudbuild.yaml .
```

### 방법 3: 수동 배포

```bash
# 프로젝트 ID 설정
export PROJECT_ID=your-project-id

# 이미지 빌드 및 푸시
docker build -t gcr.io/$PROJECT_ID/puppeteer-api:latest -f apps/puppeteer-api/Dockerfile apps/puppeteer-api
docker push gcr.io/$PROJECT_ID/puppeteer-api:latest

# Cloud Run에 배포
gcloud run deploy puppeteer-api \
  --image gcr.io/$PROJECT_ID/puppeteer-api:latest \
  --region asia-northeast3 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --max-instances 10 \
  --concurrency 1
```

### 사전 요구사항

1. **Google Cloud SDK 설치 및 인증**
   ```bash
   gcloud auth login
   gcloud auth application-default login
   ```

2. **Docker 설치** (로컬 빌드 시)

3. **필요한 API 활성화**
   - Container Registry API
   - Cloud Run API
   - Cloud Build API (Cloud Build 사용 시)

배포 스크립트는 위 API들을 자동으로 활성화합니다.

## Health Check

```bash
curl http://your-service-url/health
```

응답:
```json
{
  "status": "ok",
  "service": "puppeteer-api"
}
```

