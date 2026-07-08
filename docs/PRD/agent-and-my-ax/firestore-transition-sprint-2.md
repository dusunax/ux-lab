# Agent를 부탁해 — Firestore 전환 설계 초안

> Sprint 2 · 2026-06-30 · mock repository에서 Firestore adapter로 전환하기 위한 계약 문서

---

## 결정

- Sprint 2는 Firebase production 연결 없이 `AgentRepository` interface와 mock persistence를 완성한다.
- Firestore 연결은 Sprint 3에서 환경변수, Google Workspace OAuth client, security rules 검증 후 진행한다.
- UI와 API는 repository interface만 바라보게 하여 adapter 교체 비용을 낮춘다.

---

## 컬렉션 구조

| Collection | Document ID | 용도 |
|------------|-------------|------|
| `users` | `userId` | 실명제 사용자, 팀, 역할, 프로필 |
| `agents` | `agentId` | Agent 메타데이터, 실행 가이드, 결과 프리셋, 다운로드 에셋 |
| `comments` | `commentId` | Agent 상세 댓글 |
| `interactions` | `${userId}_${agentId}_${type}` | 좋아요, 써봤어요, Fork 등 사용자별 1회 interaction |
| `requests` | `requestId` | Request Board 요청, 투표, 상태 |

---

## Document Shape

### `users/{userId}`

```ts
{
  id: string;
  name: string;
  email: string;
  team: string;
  role: string;
  avatarBg: string;
  avatarFg: string;
  bio: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### `agents/{agentId}`

```ts
{
  id: string;
  title: string;
  description: string;
  category: 'productivity' | 'development' | 'planning' | 'analytics' | 'communication';
  tags: string[];
  platform: 'ChatGPT' | 'Claude' | 'Gen.AI' | 'Document.AI' | 'Agent Builder';
  usageGuide: string;
  visibility: 'company' | 'team' | 'private';
  creatorId: string;
  runLabel: string;
  runPlaceholder: string;
  sampleInput: string;
  sampleOutput: string;
  resultPreset: {
    resultTitle: string;
    primaryActionLabel: string;
    artifacts: Array<{
      title: string;
      kind: 'task' | 'finding' | 'summary' | 'recommendation';
      badge: string;
      description: string;
      meta: Array<{ label: string; value: string }>;
    }>;
  };
  downloads: Array<{
    kind: 'cursor' | 'claude' | 'codex' | 'prompt';
    label: string;
    filename: string;
    content: string;
  }>;
  counts: {
    likes: number;
    tried: number;
    forks: number;
    comments: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### `interactions/{interactionId}`

```ts
{
  userId: string;
  agentId: string;
  type: 'like' | 'tried' | 'fork';
  parentAgentId?: string;
  forkedFromVersion?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### `requests/{requestId}`

```ts
{
  id: string;
  title: string;
  description: string;
  requesterId: string;
  team: string;
  status: 'open' | 'planned' | 'in-progress' | 'shipped';
  votes: number;
  tags: string[];
  visibility: 'company';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## Index 후보

| Query | Index |
|-------|-------|
| Feed category + updatedAt | `agents(category ASC, updatedAt DESC)` |
| Feed visibility + likes | `agents(visibility ASC, counts.likes DESC)` |
| Creator profile | `agents(creatorId ASC, updatedAt DESC)` |
| Request status + votes | `requests(status ASC, votes DESC)` |
| User interactions | `interactions(userId ASC, type ASC, createdAt DESC)` |

---

## Security Rules 초안

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return signedIn() && request.auth.uid == userId;
    }

    match /users/{userId} {
      allow read: if signedIn();
      allow create, update: if isOwner(userId);
    }

    match /agents/{agentId} {
      allow read: if signedIn() && (
        resource.data.visibility == 'company' ||
        resource.data.creatorId == request.auth.uid
      );
      allow create: if signedIn() && request.resource.data.creatorId == request.auth.uid;
      allow update: if signedIn() && resource.data.creatorId == request.auth.uid;
    }

    match /comments/{commentId} {
      allow read: if signedIn();
      allow create: if signedIn() && request.resource.data.authorId == request.auth.uid;
    }

    match /interactions/{interactionId} {
      allow read, create, update: if signedIn() && request.resource.data.userId == request.auth.uid;
    }

    match /requests/{requestId} {
      allow read: if signedIn();
      allow create: if signedIn() && request.resource.data.requesterId == request.auth.uid;
      allow update: if signedIn();
    }
  }
}
```

---

## Sprint 3 전환 체크리스트

- [ ] Google Workspace OAuth client 생성
- [ ] Firebase project와 Firestore database 생성
- [ ] `.env.local` / 배포 환경변수 정의
- [ ] `FirestoreAgentRepository` adapter 구현
- [ ] seed migration script 작성
- [ ] security rules emulator 테스트
- [ ] production write canary 검증
