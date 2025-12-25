#!/bin/bash

# Puppeteer API 배포 스크립트
# 사용법: ./deploy.sh [PROJECT_ID]

set -e

# 프로젝트 ID 확인
if [ -z "$1" ]; then
  echo "사용법: ./deploy.sh [PROJECT_ID]"
  echo "예시: ./deploy.sh my-gcp-project"
  exit 1
fi

PROJECT_ID=$1
SERVICE_NAME="puppeteer-api"
REGION="asia-northeast3"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME:latest"

echo "🚀 Puppeteer API 배포를 시작합니다..."
echo "프로젝트 ID: $PROJECT_ID"
echo "서비스 이름: $SERVICE_NAME"
echo "리전: $REGION"
echo ""

# gcloud CLI 확인
if ! command -v gcloud &> /dev/null; then
  echo "❌ gcloud CLI가 설치되어 있지 않습니다."
  echo "https://cloud.google.com/sdk/docs/install 에서 설치하세요."
  exit 1
fi

# Docker 확인
if ! command -v docker &> /dev/null; then
  echo "❌ Docker가 설치되어 있지 않습니다."
  exit 1
fi

# gcloud 인증 확인
echo "🔐 gcloud 인증 확인 중..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
  echo "⚠️  gcloud 인증이 필요합니다. 다음 명령어를 실행하세요:"
  echo "   gcloud auth login"
  exit 1
fi

# 프로젝트 설정
echo "📦 GCP 프로젝트 설정 중..."
gcloud config set project $PROJECT_ID

# Container Registry API 활성화
echo "🔧 Container Registry API 활성화 중..."
gcloud services enable containerregistry.googleapis.com

# Cloud Run API 활성화
echo "🔧 Cloud Run API 활성화 중..."
gcloud services enable run.googleapis.com

# Docker 이미지 빌드
echo "🏗️  Docker 이미지 빌드 중..."
docker build -t $IMAGE_NAME -f apps/puppeteer-api/Dockerfile apps/puppeteer-api

# Docker 인증
echo "🔐 Container Registry 인증 중..."
gcloud auth configure-docker

# 이미지 푸시
echo "📤 Docker 이미지 푸시 중..."
docker push $IMAGE_NAME

# Cloud Run 배포
echo "🚀 Cloud Run에 배포 중..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --max-instances 10 \
  --concurrency 1

# 서비스 URL 가져오기
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format="value(status.url)")

echo ""
echo "✅ 배포가 완료되었습니다!"
echo "🌐 서비스 URL: $SERVICE_URL"
echo "🏥 Health Check: $SERVICE_URL/health"
echo ""

