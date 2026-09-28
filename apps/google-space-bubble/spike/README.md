# Phase 0 Spike

`docs/spec.md` §20 Open Issues를 실제 API 응답으로 확인하기 위한 스크립트입니다.

```bash
npm install
cp .env.example .env   # 값 채우기
node --env-file=.env spike.mjs
```

- Token은 메모리에만 두고 디스크에 저장하지 않습니다.
- 출력 결과에 사내 메시지 본문과 사용자 ID가 포함되므로 공유할 때는 마스킹하세요.
