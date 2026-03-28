## Open-source Notes (Step 2)

This project plans to integrate subtitle/TTS/video-sync workflows using permissive licenses only.

### Verified permissive sources

1. ffmpeg.wasm
- Repository: https://github.com/ffmpegwasm/ffmpeg.wasm
- License: MIT
- Implemented use: browser-side WebM -> MP4 conversion option in panel 12

2. subtitle.js
- Repository: https://github.com/gsantiago/subtitle.js
- License: MIT
- Planned use: optional SRT/VTT parse utilities (not directly copied yet)

3. wavesurfer.js
- Repository: https://github.com/katspaugh/wavesurfer.js
- License: BSD-3-Clause
- Planned use: optional waveform and cue-point preview UX

### Current implementation status

- Subtitle sync: implemented with in-app timing builder and canvas overlay.
- SRT export: implemented (`story_subtitles.srt`).
- FFmpeg MP4 conversion: implemented as optional post-process button.

### Excluded for now

- remotion
  - Repository: https://github.com/remotion-dev/remotion
  - Current license model is not simple MIT/Apache/BSD-only.
  - Excluded to keep free redistribution clear and low-risk.
