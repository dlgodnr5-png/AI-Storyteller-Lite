# CLAUDE.md — AI Storyteller Lite

이 파일은 Claude Code가 이 프로젝트 작업 시 자동으로 읽는 가이드입니다.

## 앱 개요

React + TypeScript + Vite 기반 AI 영상 제작 도구.
- **AI**: Gemini API (대본 생성 / 이미지 생성 / TTS)
- **TTS**: Gemini TTS + ElevenLabs
- **렌더링**: MediaRecorder API + FFmpeg WASM (브라우저 내)
- **배포**: Vercel (순수 프론트엔드, 별도 서버 없음)

---

## 이원화 흐름 구조

두 흐름은 **분리**되어 있으나 **공유 기능**을 함께 사용한다.

### 흐름 A — 일반 유튜브 영상 (쇼츠 / 롱폼)

| 항목 | 내용 |
|------|------|
| 진입 | YouTube 검색(패널1) → 제목 선택(패널2) → 대본(패널3) → 순차 진행 |
| 자동 제작 | `runOneClickFromTitle()` (`App.tsx:4082`) |
| 대본 유형 | `shorts`(60초), `long-form`(10·20·30·60분) |
| 컷 길이 | **쇼츠 = 4초**, **롱폼 = 8초** |
| 단계 | `AUTO_FLOW_STEPS` 9단계 (`App.tsx:129`) |

**쇼츠 대본 규칙** (`src/guidelines/rules.ts`, `SCRIPT_RULES.SHORTS`):
- 구조: Hook(3-5초) → Body(48-50초) → CTA(3-5초)
- 길이: KR 450-500자 / EN 130-150단어 / JP 550-600자
- 출력: 순수 말하기 대본만 (제목·태그·JSON 금지)

**롱폼 대본 규칙** (`src/guidelines/rules.ts`, `SCRIPT_RULES.LONGFORM`):
- 구조: 도입(20%) → 본론(60%) → 결론(20%)
- 길이: 10분=3,500자 / 20분=7,000자 / 30분=10,500자 / 60분=21,000자

### 흐름 B — 상품 쇼츠 (자동 / 수동)

| 항목 | 내용 |
|------|------|
| 진입 | 상품 이미지·URL·설명 입력 → 자동 분석 → 제작 |
| 자동 제작 | `runProductPromoOneClick()` (`App.tsx:4849`) |
| 대본 유형 | 상품 구매 훅 쇼츠 (20초 고정) |
| 컷 길이 | **4초 고정** (5컷 × 4초 = 20초) |
| 단계 | `PRODUCT_FLOW_STEPS` 3단계 (`App.tsx:141`) |

**상품 쇼츠 대본 규칙**:
- 타깃: 구매 고려 중인 30-50대 한국 사용자
- 훅: 비포&애프터 / 사실 기반 강한 후킹 / 구매 FOMO 자극
- 출력: 사실 기반 구매 유도 대본 (허위 과장 금지)

---

## 4초 싱크 규칙 (중요)

```typescript
IMAGE_SLIDE_DURATION_SEC = 4   // App.tsx:202 — 이미지 슬라이드
SHORTS_VIDEO_DURATION_SEC = 4  // App.tsx:203 — 쇼츠 AI 비디오
LONGFORM_VIDEO_DURATION_SEC = 8 // App.tsx:204 — 롱폼 AI 비디오
```

- **1컷 = 4초** (쇼츠·상품), **1컷 = 8초** (롱폼)
- 사용자 업로드 영상도 4초 단위로 강제 컷 분할
- 컷 수 계산: `Math.round(TTS실측초 / IMAGE_SLIDE_DURATION_SEC)`
- `resolveVideoCutDurationSec(scriptType)` — 타입별 초 반환 (`App.tsx:206`)

---

## 공유 기능 (양쪽 흐름에서 사용)

| 함수 | 위치 | 역할 |
|------|------|------|
| `generateImage()` | `App.tsx:6277` | 컷별 이미지 생성 |
| `handleGenerateTTS()` | `App.tsx:3925` | TTS 생성 (Gemini/ElevenLabs) |
| `runAutoImageBatch()` | `App.tsx:3994` | 전체 컷 이미지 일괄 생성 |
| `handleGenerateFinalVideo()` | `App.tsx:6424` | 슬라이드 구성 |
| `handleExportSlideVideo()` | `App.tsx:6552` | 최종 영상 렌더링 |
| `generateContentWithFallback()` | `App.tsx:502` | Gemini 429 폴백 체인 |
| `splitScriptToCuts()` | `App.tsx:1676` | 대본 → 컷 분할 |
| `rebalanceCutsToTarget()` | `App.tsx:855` | 컷 수 조정 |

---

## 패널 구조 (14개)

| 패널 | ID | 기능 |
|------|-----|------|
| 1 | p1 | YouTube 검색 (트렌딩/키워드) |
| 2 | p2 | 훅 제목 선택 |
| 3 | p3 | 대본·전략 생성 |
| 4 | p4 | TTS 음성 생성 |
| p_style | p_style | 영상 스타일 선택 (31가지) |
| 5 | p5 | 컷 분할 |
| 6 | p6 | 이미지 프롬프트 생성 |
| 7 | p7 | 이미지 렌더링 |
| 9 | p9 | 썸네일 생성 |
| 10 | p10 | 설명·태그 생성 |
| 11 | p11 | 프롬프트 세부 편집 |
| 12 | p12 | 최종 영상 편집·렌더링 (`Panel12Section.tsx`) |
| 14 | p14 | YouTube 자동 발행 (5단계) |

---

## 핵심 파일

```
src/
  App.tsx                          ← 메인 (491KB — 단일 대형 파일)
  features/panel12/Panel12Section.tsx  ← 자막·렌더링 편집
  components/ApiStatusBar.tsx      ← API 상태 표시 바
  prompts.ts                       ← AI 프롬프트 상수
  guidelines/rules.ts              ← 대본 작성 규칙 (CORE_GUIDELINES, SCRIPT_RULES)
  types.ts                         ← LS_KEYS (localStorage 키)
  index.css                        ← 글로벌 스타일 + 폰트 로드
```

---

## 개발 주의사항

- **App.tsx는 491KB 단일 파일** — `Read` 시 반드시 `offset`+`limit` 사용
- 두 흐름(일반/상품)이 공유 함수를 호출하므로 한쪽 수정이 다른 흐름에 영향 가능
- Gemini 모델명은 자주 업데이트됨 — `App.tsx` 내 모델 상수 확인 후 수정
- FFmpeg WASM은 `unpkg.com`에서 런타임 로드 (`App.tsx:7455`) — 네트워크 필요
- `vercel.json`은 OAuth 콜백 리다이렉트만 설정됨

## 알려진 이슈 (미해결)

- `아네모네` 폰트 미로드 → canvas 자막 렌더링이 폴백 폰트 사용
- `Pretendard`, `Noto Sans KR` 폰트 미로드 (index.css Google Fonts URL에 없음)

---

## Skill 카테고리 구조

`.claude/skills/`에 카테고리별 대본 가이드가 저장됨.
사용자가 특정 카테고리 대본 작성 시 해당 스킬 자동 적용.

| 스킬 | 대상 |
|------|------|
| `product-shorts` | 상품 쇼츠 구매 훅 대본 |
| `shorts-senior-story` | 시니어 감동 이야기 |
| `shorts-religion` | 종교 (기독교·불교·이슬람) |
| `shorts-psychology` | 심리학·자기계발 |
| `shorts-senior-health` | 시니어 건강 정보 |
| `shorts-comedy` | 코믹·유머 |
| `shorts-science` | 과학·자연 |
| `shorts-ai-tech` | AI·기술 트렌드 |
| `shorts-travel` | 여행·문화 |
| `longform-story` | 롱폼 스토리텔링 |
| `save-script` | 현재 대본 패턴 → skill.md 저장 |

---

## Git 커밋 규칙

**파일별 개별 커밋** — 여러 파일을 한 커밋에 묶지 않는다.

```
git add src/App.tsx
git commit -m "Fix YouTube upload in runPublishAttempt"

git add .claude/skills/shorts-senior-story/SKILL.md
git commit -m "Add senior story shorts skill"
```
