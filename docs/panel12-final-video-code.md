# 12. 최종 영상생성 코드

아래는 현재 `12. 최종 영상생성` 관련 핵심 코드 위치입니다.

## 원본 파일

- `src/App.tsx:1619` `handleGenerateFinalVideo`
- `src/App.tsx:1670` `handleExportSlideVideo`
- `src/App.tsx:2226` `handleConvertToMp4`
- `src/App.tsx:3301` `/* 12. 최종 영상생성 */` UI 섹션 시작

## 핵심 함수

```tsx
// src/App.tsx:1619
const handleGenerateFinalVideo = async () => {
  // 이미지 컷 -> 슬라이드 구성
  // 모션 자동 배정/유지
  // image_slide 모드면 slides 구성
  // ai_video 모드는 현재 목업 안내
};

// src/App.tsx:1670
const handleExportSlideVideo = async () => {
  // 캔버스 렌더링 + MediaRecorder
  // TTS 오디오 병합
  // 자막 세그먼트 싱크 렌더
  // webm 결과 저장
};

// src/App.tsx:2226
const handleConvertToMp4 = async () => {
  // ffmpeg.wasm 로딩
  // input.webm -> output.mp4 변환
  // 변환 결과 URL 교체
};
```

## UI 섹션

```tsx
// src/App.tsx:3301 부근
{/* 12. 최종 영상생성 */}
<section>
  {/* 생성 방식 선택 (AI 비디오 / 이미지 슬라이드) */}
  {/* 자막 템플릿 카드 (작은그림 + 호버 확대 + 이미지 선택/초기화) */}
  {/* 자막 위치 10등분 슬라이더 */}
  {/* 키워드, 컷별 키워드, 강조 강도, 등장 애니메이션 */}
  {/* 슬라이드 렌더링 / MP4 변환 / SRT 다운로드 */}
  {/* 비율 강제 미리보기 */}
</section>
```

## 그대로 복사하려면

`src/App.tsx`에서 아래 범위를 그대로 복사하면 됩니다.

- 함수 로직: `src/App.tsx:1619`, `src/App.tsx:1670`, `src/App.tsx:2226`
- 패널 UI: `src/App.tsx:3301`

필요하면 다음 단계에서 이 패널만 `src/features/panel12/`로 분리해서 파일 단위로 다운로드/재사용하기 쉽게 리팩터링할 수 있습니다.

---

## AI Studio Mini 도입/보류 보고서 (간소화)

### 참조 경로
- `D:\Naver MYBOX\04 티스토리\25 앱\200 앱개발중\ai-studio-mini\components\FinalVideoEditorPanel.tsx`
- `D:\Naver MYBOX\04 티스토리\25 앱\200 앱개발중\ai-studio-mini\engine\canvasRenderer.ts`
- `D:\Naver MYBOX\04 티스토리\25 앱\200 앱개발중\ai-studio-mini\video-editor\fonts\snsFontData.ts`
- `D:\Naver MYBOX\04 티스토리\25 앱\200 앱개발중\ai-studio-mini\video-editor\fonts\snsFonts.css`

### 도입됨
- 자막 스타일 확장: `impact`, `neon` 프리셋 추가
- 제목/자막 크기 정합: 제목 스케일을 자막 프리셋 `fontScale` 기반으로 통일
- 무료 한글 폰트 확장 + 폰트명 한글/영문 병기
- 원클릭 고정 설정에 TTS/BGM 미리듣기 추가
- 모바일 패널 퀵 점프 버튼 추가

### 간소화 도입
- 복합 툴바는 그대로 복사하지 않고, 현재 Panel12에 카드형 스타일 선택 UI로 축약 적용
- 렌더 엔진은 핵심 파라미터(폰트 크기/라인 하이트/스트로크)만 선택 적용

### 보류
- 멀티트랙 타임라인 편집기 전체 이식
- 편집기 전용 고급 키프레임/이펙트 시스템
- 외부 폰트 동적 로딩 파이프라인 전면 이식

### 다음 권장
1. 스타일 카드에 샘플 문구 미리보기 추가
2. 패널12 상단 섹션 미니 탭 추가
3. TTS 기준 컷 재계산 로그를 동기 리포트에 표시
