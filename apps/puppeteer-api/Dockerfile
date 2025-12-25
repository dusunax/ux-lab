# Node.js 20 LTS 사용
FROM node:20-slim AS base

# 작업 디렉토리 설정
WORKDIR /app

# 의존성 설치 단계
FROM base AS deps
COPY package.json ./
COPY package-lock.json* ./
# package-lock.json이 있으면 npm ci, 없으면 npm install 사용
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# 빌드 단계
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 프로덕션 단계
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Chromium 의존성 설치 (Cloud Run용)
RUN apt-get update && apt-get install -y \
    chromium \
    chromium-sandbox \
    fonts-liberation \
    fonts-noto-cjk \
    fonts-noto-color-emoji \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    xdg-utils \
    wget \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Pretendard 폰트 설치
RUN mkdir -p /usr/share/fonts/truetype/pretendard && \
    wget -q https://github.com/orioncactus/pretendard/releases/download/v1.3.9/Pretendard-1.3.9.zip -O /tmp/pretendard.zip && \
    unzip -q /tmp/pretendard.zip -d /tmp/pretendard && \
    find /tmp/pretendard -name "*.ttf" -exec cp {} /usr/share/fonts/truetype/pretendard/ \; && \
    rm -rf /tmp/pretendard /tmp/pretendard.zip && \
    fc-cache -fv

# 프로덕션 의존성만 설치
COPY package.json ./
COPY package-lock.json* ./
# package-lock.json이 있으면 npm ci, 없으면 npm install 사용
RUN if [ -f package-lock.json ]; then npm ci --only=production; else npm install --only=production; fi

# 빌드된 파일 복사
COPY --from=builder /app/dist ./dist

# Chromium 경로 설정
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

EXPOSE 8080

# 서버 실행
CMD ["node", "dist/server.js"]

