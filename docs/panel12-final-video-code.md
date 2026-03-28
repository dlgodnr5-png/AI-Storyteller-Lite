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
