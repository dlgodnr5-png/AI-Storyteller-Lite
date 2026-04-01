import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Video, Image as ImageIcon, Download, Loader2, Trash2, Play } from 'lucide-react';

const TITLE_FONT_OPTIONS = [
  { value: '아네모네', label: '아네모네 (Anemone)' },
  { value: 'Pretendard', label: '프리텐다드 (Pretendard)' },
  { value: 'Noto Sans KR', label: '노토 산스 KR (Noto Sans KR)' },
  { value: 'Do Hyeon', label: '도현체 (Do Hyeon)' },
  { value: 'Jua', label: '주아체 (Jua)' },
  { value: 'Black Han Sans', label: '블랙 한 산스 (Black Han Sans)' },
  { value: 'Nanum Gothic', label: '나눔고딕 (Nanum Gothic)' },
  { value: 'Gowun Dodum', label: '고운돋움 (Gowun Dodum)' },
  { value: 'Gothic A1', label: '고딕 A1 (Gothic A1)' },
  { value: 'IBM Plex Sans KR', label: 'IBM 플렉스 산스 KR (IBM Plex Sans KR)' },
  { value: 'Nanum Myeongjo', label: '나눔명조 (Nanum Myeongjo)' },
  { value: 'Hahmlet', label: '함렛 (Hahmlet)' },
  { value: 'Nanum Pen Script', label: '나눔펜체 (Nanum Pen Script)' },
  { value: 'Nanum Brush Script', label: '나눔붓글씨 (Nanum Brush Script)' },
];

const TEXT_SCALE_MIN = 0.7;
const TEXT_SCALE_MAX = 2.2;
const MM_TO_PX_1080 = 3.7795275591;

const SUBTITLE_STYLE_SWATCH: Record<string, string> = {
  shorts: 'from-amber-400 to-orange-500',
  docu: 'from-slate-400 to-slate-600',
  lecture: 'from-sky-400 to-blue-500',
  impact: 'from-rose-500 to-red-600',
  neon: 'from-cyan-400 to-indigo-500',
};

const mmToPxScaled = (mm: number, width: number) => mm * MM_TO_PX_1080 * (width / 1080);

const normalizeSubtitleText = (text: string) => String(text || '').replace(/\s+/g, ' ').trim();

const splitSubtitleLines = (text: string, maxChars: number) => {
  const manualLines = String(text || '')
    .split(/\r?\n/)
    .map(line => normalizeSubtitleText(line))
    .filter(Boolean);
  if (manualLines.length >= 2) {
    return manualLines.slice(0, 2);
  }

  const clean = normalizeSubtitleText(text);
  if (!clean) return [''];
  const words = clean.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if (!current) {
      current = word;
      continue;
    }
    const candidate = `${current} ${word}`;
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines.slice(0, 2);
};

const splitTitlePreviewLines = (text: string) => {
  const manualLines = String(text || '')
    .split(/\r?\n/)
    .map(line => normalizeSubtitleText(line))
    .filter(Boolean);
  if (manualLines.length > 0) {
    return manualLines.slice(0, 2);
  }

  const compact = normalizeSubtitleText(text);
  if (!compact) return [] as string[];
  return [compact];
};

type Props = {
  ui: any;
  setUi: React.Dispatch<React.SetStateAction<any>>;
  PanelHeader: any;
  handleGenerateFinalVideo: () => Promise<void> | void;
  handleExportSlideVideo: () => Promise<void>;
  handleDownloadSrt: () => void;
  canDownload: boolean;
  handleConvertToMp4: () => Promise<void>;
  saveCurrentSubtitleTemplate: () => void;
  applySubtitleTemplate: (preset: any) => void;
  exportSubtitleTemplates: () => void;
  importSubtitleTemplates: (file?: File | null) => Promise<void>;
  applySavedSubtitleTemplate: (template: any) => void;
  removeSavedSubtitleTemplate: (name: string) => void;
  applyBuiltinSubtitleTemplate: (templateId: string) => void;
  handleTemplatePreviewUpload: (templateId: string, file?: File | null) => void;
  resetTemplatePreview: (templateId: string) => void;
  handleSuggestSubtitleKeywords: () => Promise<void> | void;
  rewriteTemplateTitleFromHook: () => Promise<void> | void;
  subtitleTemplates: any[];
  templatePreviewOverrides: Record<string, string>;
  BUILTIN_SUBTITLE_TEMPLATES: any[];
  SUBTITLE_PRESETS: Record<string, { label: string }>;
  RESOLUTION_PRESETS: Array<{ id: string; label: string }>;
  SLIDE_MOTIONS: Array<{ id: string; label: string }>;
  SLIDE_MOTION_ANIMATION: Record<string, { initial: any; animate: any }>;
  PRESET_SAMPLE_TEXT: Record<string, string>;
  BGM_LIBRARY: Array<{ label: string; path: string }>;
  SFX_LIBRARY: Array<{ label: string; path: string }>;
  ratioToCss: (ratio: string) => string;
  gridPositionToPercent: (n: number) => number;
  getBuiltinTemplatePreview: (template: any) => string;
  syncReport: {
    scriptSec: number;
    ttsSec: number;
    cutsSec: number;
    renderSec: number;
    srtLastEndSec: number;
    deltaSec: number;
    status: '정상' | '주의' | '실패';
  };
  isOneClickFixed?: boolean;
};

const InlineSmoothRange = React.memo(({
  min,
  max,
  step,
  value,
  onChange,
  className,
  disabled,
}: {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  className?: string;
  disabled?: boolean;
}) => {
  const rafRef = React.useRef<number>(0);

  const schedule = (v: number) => {
    window.cancelAnimationFrame(rafRef.current);
    rafRef.current = window.requestAnimationFrame(() => onChange(v));
  };

  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      className={className}
      disabled={disabled}
      style={{ touchAction: 'none' }}
      onInput={(e) => schedule(Number((e.target as HTMLInputElement).value))}
      onChange={(e) => onChange(Number((e.target as HTMLInputElement).value))}
    />
  );
});

export default function Panel12Section(props: Props) {
  const {
    ui,
    setUi,
    PanelHeader,
    handleGenerateFinalVideo,
    handleExportSlideVideo,
    handleDownloadSrt,
    canDownload,
    handleConvertToMp4,
    saveCurrentSubtitleTemplate,
    applySubtitleTemplate,
    exportSubtitleTemplates,
    importSubtitleTemplates,
    applySavedSubtitleTemplate,
    removeSavedSubtitleTemplate,
    applyBuiltinSubtitleTemplate,
    handleTemplatePreviewUpload,
    resetTemplatePreview,
    handleSuggestSubtitleKeywords,
    rewriteTemplateTitleFromHook,
    subtitleTemplates,
    templatePreviewOverrides,
    BUILTIN_SUBTITLE_TEMPLATES,
    SUBTITLE_PRESETS,
    RESOLUTION_PRESETS,
    SLIDE_MOTIONS,
    SLIDE_MOTION_ANIMATION,
    PRESET_SAMPLE_TEXT,
    BGM_LIBRARY,
    SFX_LIBRARY,
    ratioToCss,
    gridPositionToPercent,
    getBuiltinTemplatePreview,
    syncReport,
    isOneClickFixed,
  } = props;

  const [previewTemplateId, setPreviewTemplateId] = React.useState<string>(BUILTIN_SUBTITLE_TEMPLATES[0]?.id || '');
  const [templateTitleManualEdited, setTemplateTitleManualEdited] = React.useState(false);
  const previewAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const previewFrameRef = React.useRef<HTMLDivElement | null>(null);
  const [previewAudioPath, setPreviewAudioPath] = React.useState('');
  const [previewAudioType, setPreviewAudioType] = React.useState<'' | 'bgm' | 'sfx'>('');
  const [previewGuideMode, setPreviewGuideMode] = React.useState<'shorts' | 'reels' | 'tiktok'>('shorts');
  const [previewFrameWidth, setPreviewFrameWidth] = React.useState(360);
  const previewTemplate = BUILTIN_SUBTITLE_TEMPLATES.find(t => t.id === previewTemplateId) || BUILTIN_SUBTITLE_TEMPLATES[0];
  const maxHookVideoCount = Math.max(1, ui.cuts.items?.length || 1);
  const resolvedBgmTrack = String(
    (isOneClickFixed ? (ui.autoFlow?.fixed?.bgmTrack || '') : '') ||
    ui.finalVideo.bgmTrack ||
    '',
  );

  React.useEffect(() => {
    if (!previewFrameRef.current) return;
    const target = previewFrameRef.current;
    const update = () => setPreviewFrameWidth(Math.max(180, target.clientWidth || 360));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const previewTitleFontPx = React.useMemo(() => {
    const preset = SUBTITLE_PRESETS[ui.finalVideo.subtitlePreset] as any;
    const baseScale = Number(preset?.fontScale || 0.048);
    const titleScale = Math.max(TEXT_SCALE_MIN, Math.min(TEXT_SCALE_MAX, Number(ui.finalVideo.templateTitleScale || 1)));
    return Math.max(10, Math.round(previewFrameWidth * baseScale * titleScale));
  }, [previewFrameWidth, ui.finalVideo.templateTitleScale, ui.finalVideo.subtitlePreset, SUBTITLE_PRESETS]);

  const previewSubtitleFontPx = React.useMemo(() => {
    const preset = SUBTITLE_PRESETS[ui.finalVideo.subtitlePreset] as any;
    const baseScale = Number(preset?.fontScale || 0.045);
    const subtitleScale = Math.max(TEXT_SCALE_MIN, Math.min(TEXT_SCALE_MAX, Number(ui.finalVideo.subtitleScale || 1)));
    return Math.max(10, Math.round(previewFrameWidth * baseScale * subtitleScale));
  }, [previewFrameWidth, ui.finalVideo.subtitlePreset, ui.finalVideo.subtitleScale, SUBTITLE_PRESETS]);

  const previewSubtitleLines = React.useMemo(() => {
    const activeCut = Number(ui.finalVideo.slides?.[ui.finalVideo.activeSlide]?.cut || 1);
    const sourceText = ui.cuts.items?.[Math.max(0, activeCut - 1)] || '';
    const maxChars = Math.max(12, Number(ui.finalVideo.subtitleMaxChars || 24));
    return splitSubtitleLines(String(sourceText), maxChars).filter(Boolean).slice(0, 2);
  }, [ui.finalVideo.slides, ui.finalVideo.activeSlide, ui.cuts.items, ui.finalVideo.subtitleMaxChars]);

  const previewTitleLines = React.useMemo(() => {
    return splitTitlePreviewLines(String(ui.finalVideo.templateTitleText || ''));
  }, [ui.finalVideo.templateTitleText]);

  const previewTitleTopPercent = React.useMemo(() => {
    const previewHeight = previewFrameWidth * (16 / 9);
    const topMm = Math.max(0, Number(ui.finalVideo.templateTitleLine1TopMm || 20));
    const topPx = mmToPxScaled(topMm, previewFrameWidth);
    return Math.max(1, Math.min(95, (topPx / Math.max(1, previewHeight)) * 100));
  }, [previewFrameWidth, ui.finalVideo.templateTitleLine1TopMm]);

  const jumpToEditorSection = (id: string) => {
    const target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const stopPreviewAudio = React.useCallback(() => {
    if (!previewAudioRef.current) return;
    previewAudioRef.current.pause();
    previewAudioRef.current.currentTime = 0;
    previewAudioRef.current = null;
    setPreviewAudioPath('');
    setPreviewAudioType('');
  }, []);

  const playPreviewAudio = React.useCallback((path: string, type: 'bgm' | 'sfx') => {
    if (!path) return;
    if (previewAudioPath === path) {
      stopPreviewAudio();
      return;
    }

    stopPreviewAudio();
    const audio = new Audio(encodeURI(path));
    audio.loop = type === 'bgm';
    const volumePercent = type === 'bgm' ? Number(ui.finalVideo.bgmVolume || 0) : Number(ui.finalVideo.sfxVolume || 0);
    audio.volume = Math.min(1, Math.max(0, volumePercent / 100));
    audio.onended = () => {
      if (type === 'sfx') {
        setPreviewAudioPath('');
        setPreviewAudioType('');
        previewAudioRef.current = null;
      }
    };
    previewAudioRef.current = audio;
    setPreviewAudioPath(path);
    setPreviewAudioType(type);
    void audio.play().catch(() => {
      stopPreviewAudio();
      alert('오디오 미리듣기를 시작할 수 없습니다. 브라우저 권한/자동재생 설정을 확인해 주세요.');
    });
  }, [previewAudioPath, stopPreviewAudio, ui.finalVideo.bgmVolume, ui.finalVideo.sfxVolume]);

  React.useEffect(() => {
    return () => stopPreviewAudio();
  }, [stopPreviewAudio]);

  React.useEffect(() => {
    if (!previewAudioRef.current) return;
    const volumePercent = previewAudioType === 'bgm' ? Number(ui.finalVideo.bgmVolume || 0) : Number(ui.finalVideo.sfxVolume || 0);
    previewAudioRef.current.volume = Math.min(1, Math.max(0, volumePercent / 100));
  }, [previewAudioType, ui.finalVideo.bgmVolume, ui.finalVideo.sfxVolume]);

  const applyTemplateAndAutoTitle = (template: any) => {
    applyBuiltinSubtitleTemplate(template.id);
    setTemplateTitleManualEdited(false);
    if (ui.selectedHookTitle) {
      rewriteTemplateTitleFromHook();
      return;
    }
    const fallbackTitle = (template.sample || template.name || '').trim();
    if (fallbackTitle) {
      setUi((prev: any) => ({
        ...prev,
        finalVideo: {
          ...prev.finalVideo,
          templateTitleText: fallbackTitle,
        },
      }));
    }
  };

  return (
    <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 min-w-0">
          <h3 className="text-xl font-black text-emerald-400">12. 최종 영상생성</h3>
          <p className="text-[11px] text-emerald-100/95 bg-emerald-500/15 border border-emerald-300/25 rounded-lg px-3 py-1.5 sm:truncate">
            최적 순서: 이미지 준비 → 훅 영상 업로드 → 훅 컷 수 지정 → 슬라이드 구성 → 렌더링/MP4
          </p>
        </div>
        <button
          onClick={() => setUi((prev: any) => ({ ...prev, panelsOpen: { ...prev.panelsOpen, p12: !prev.panelsOpen.p12 } }))}
          className="text-xs font-bold bg-white/10 px-3 py-1 rounded-lg hover:bg-white/20 transition-all w-full sm:w-auto"
        >
          {ui.panelsOpen.p12 ? '숨기기' : '보이기'}
        </button>
      </div>
      {ui.panelsOpen.p12 && (
        <div className="space-y-8">
          <div className="rounded-2xl border border-emerald-300/45 bg-emerald-500/20 px-4 py-3">
            <p className="text-[11px] font-black text-white uppercase tracking-widest">최적 제작 순서 가이드 (고정)</p>
            <p className="text-[12px] text-white mt-1 font-semibold">1) 컷 이미지 준비 → 2) 초반 훅 컷 영상 업로드 → 3) 영상 훅 컷 수 지정 → 4) 슬라이드 구성 → 5) 렌더링/MP4 변환</p>
            <p className="text-[10px] text-emerald-50 mt-1">권장: 쇼츠는 훅 5~7컷, 이미지 슬라이드 컷당 4초 고정, TTS 완료 후 렌더링</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <p className="text-[10px] font-black text-emerald-200 uppercase tracking-widest mb-2">편집 섹션 바로가기</p>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => jumpToEditorSection('panel12-title')} className="rounded-lg bg-white/10 border border-white/15 py-1.5 text-[10px] font-black text-white">제목</button>
              <button onClick={() => jumpToEditorSection('panel12-subtitle')} className="rounded-lg bg-white/10 border border-white/15 py-1.5 text-[10px] font-black text-white">자막</button>
              <button onClick={() => jumpToEditorSection('panel12-render')} className="rounded-lg bg-white/10 border border-white/15 py-1.5 text-[10px] font-black text-white">렌더</button>
            </div>
          </div>
          <div className="rounded-2xl border border-amber-300/40 bg-amber-500/10 px-4 py-3 space-y-3">
            <p className="text-[11px] font-black text-amber-100 uppercase tracking-widest">오디오 빠른 미리듣기 (항상 표시)</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-amber-100 uppercase tracking-widest">배경음악</label>
                <select
                  value={resolvedBgmTrack}
                  onChange={(e) => setUi((prev: any) => ({ ...prev, finalVideo: { ...prev.finalVideo, bgmTrack: e.target.value, bgmTrackUserSelected: true } }))}
                  disabled={isOneClickFixed}
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {BGM_LIBRARY.map(track => (
                    <option key={track.path} value={track.path}>{track.label}</option>
                  ))}
                </select>
                <button
                  onClick={() => playPreviewAudio(resolvedBgmTrack, 'bgm')}
                  className={`w-full rounded-lg border px-3 py-2 text-[11px] font-black transition-all flex items-center justify-center gap-1 ${previewAudioType === 'bgm' && previewAudioPath === resolvedBgmTrack ? 'bg-amber-400 text-black border-amber-300' : 'bg-white/10 text-white border-white/30 hover:bg-white/20'}`}
                >
                  <Play className="w-3 h-3" /> {previewAudioType === 'bgm' && previewAudioPath === resolvedBgmTrack ? '배경음악 미리듣기 중지' : '배경음악 미리듣기'}
                </button>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-amber-100 uppercase tracking-widest">효과음</label>
                <select
                  value={ui.finalVideo.sfxTrack}
                  onChange={(e) => setUi((prev: any) => ({ ...prev, finalVideo: { ...prev.finalVideo, sfxTrack: e.target.value } }))}
                  disabled={isOneClickFixed}
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {SFX_LIBRARY.map(track => (
                    <option key={track.path} value={track.path}>{track.label}</option>
                  ))}
                </select>
                <button
                  onClick={() => playPreviewAudio(ui.finalVideo.sfxTrack, 'sfx')}
                  disabled={isOneClickFixed}
                  className={`w-full rounded-lg border px-3 py-2 text-[11px] font-black transition-all flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed ${previewAudioType === 'sfx' && previewAudioPath === ui.finalVideo.sfxTrack ? 'bg-amber-400 text-black border-amber-300' : 'bg-white/10 text-white border-white/30 hover:bg-white/20'}`}
                >
                  <Play className="w-3 h-3" /> {previewAudioType === 'sfx' && previewAudioPath === ui.finalVideo.sfxTrack ? '효과음 미리듣기 중지' : '효과음 미리듣기'}
                </button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">영상 생성 방식</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'ai_video', label: 'AI 비디오 생성', icon: <Video className="w-4 h-4" /> },
                    { id: 'image_slide', label: '이미지 슬라이드', icon: <ImageIcon className="w-4 h-4" /> }
                  ].map(type => (
                    <button
                      key={type.id}
                      onClick={() => setUi((prev: any) => ({ ...prev, finalVideo: { ...prev.finalVideo, type: type.id as any } }))}
                      className={`flex items-center justify-center gap-2 py-4 rounded-2xl text-xs font-black transition-all border ${ui.finalVideo.type === type.id ? 'bg-emerald-500 text-black border-emerald-500' : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'}`}
                    >
                      {type.icon} {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">추가 수정 사항 (AI 비디오용)</label>
                <textarea
                  value={ui.finalVideo.modifications}
                  onChange={(e) => setUi((prev: any) => ({ ...prev, finalVideo: { ...prev.finalVideo, modifications: e.target.value } }))}
                  placeholder="예: 카메라가 천천히 줌인되게 해주세요, 배경에 눈이 내리게 해주세요..."
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs text-slate-300 outline-none h-24 resize-none focus:ring-2 ring-emerald-500/50"
                />
              </div>

              {ui.finalVideo.type === 'image_slide' && (
                <div className="space-y-3 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4">
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <label className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">영상 훅 혼합 사용</label>
                    <button
                      onClick={() => setUi((prev: any) => ({ ...prev, finalVideo: { ...prev.finalVideo, useHybridHookVideos: !prev.finalVideo.useHybridHookVideos } }))}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black border transition-all ${ui.finalVideo.useHybridHookVideos ? 'bg-emerald-400 text-black border-emerald-300' : 'bg-black/30 text-slate-300 border-white/15'}`}
                    >
                      {ui.finalVideo.useHybridHookVideos ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  {ui.finalVideo.useHybridHookVideos && (
                    <>
                      <div className="flex items-center justify-between gap-4">
                        <label className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">영상 생성 컷 수</label>
                        <span className="text-xs text-emerald-200 font-bold">{Math.max(0, Number(ui.finalVideo.hookVideoCount || 0))}컷</span>
                      </div>
                      <InlineSmoothRange
                        min={0}
                        max={maxHookVideoCount}
                        step={1}
                        value={Math.max(0, Math.min(maxHookVideoCount, Number(ui.finalVideo.hookVideoCount || 0)))}
                        onChange={(v) => setUi((prev: any) => ({ ...prev, finalVideo: { ...prev.finalVideo, hookVideoCount: Number(v) } }))}
                        className="w-full accent-emerald-300"
                      />
                      <p className="text-[10px] text-emerald-100/90">앞에서부터 지정한 컷 수만큼 업로드된 영상을 우선 배치하고, 나머지는 이미지 슬라이드로 렌더링합니다.</p>
                    </>
                  )}
                  <div className="flex items-center justify-between gap-4">
                    <label className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">컷당 재생 시간</label>
                    <span className="text-xs text-emerald-200 font-bold">4초 (고정)</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-lg py-2 text-center text-[10px] text-emerald-200">이미지 슬라이드는 4초 고정으로 싱크를 유지합니다.</div>
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <label className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">렌더링 해상도</label>
                    <select
                      value={ui.finalVideo.resolution}
                      onChange={(e) => setUi((prev: any) => ({ ...prev, finalVideo: { ...prev.finalVideo, resolution: e.target.value as any } }))}
                      className="bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] text-white outline-none"
                    >
                      {RESOLUTION_PRESETS.map(p => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <label className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">첫 프레임 썸네일 고정</label>
                    <button
                      onClick={() => setUi((prev: any) => ({ ...prev, finalVideo: { ...prev.finalVideo, includeThumbnailIntro: !prev.finalVideo.includeThumbnailIntro } }))}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black border transition-all ${ui.finalVideo.includeThumbnailIntro ? 'bg-emerald-400 text-black border-emerald-300' : 'bg-black/30 text-slate-300 border-white/15'}`}
                    >
                      {ui.finalVideo.includeThumbnailIntro ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  {ui.finalVideo.includeThumbnailIntro && (
                    <div className="flex items-center justify-between gap-3 pt-1">
                      <label className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">고정 시간</label>
                      <select
                        value={String(ui.finalVideo.thumbnailIntroDuration)}
                        onChange={(e) => setUi((prev: any) => ({ ...prev, finalVideo: { ...prev.finalVideo, thumbnailIntroDuration: Number(e.target.value) } }))}
                        className="bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] text-white outline-none"
                      >
                        <option value="0.5">0.5초</option>
                        <option value="1">1.0초</option>
                        <option value="1.5">1.5초</option>
                        <option value="2">2.0초</option>
                      </select>
                    </div>
                  )}
                  {ui.finalVideo.includeThumbnailIntro && !ui.thumbnail?.url && (
                    <p className="text-[10px] text-amber-300">썸네일이 아직 없습니다. 4번 패널에서 썸네일을 먼저 생성하면 첫 프레임 고정이 적용됩니다.</p>
                  )}
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <label className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">배경음원(BGM)</label>
                    <button
                      onClick={() => setUi((prev: any) => ({ ...prev, finalVideo: { ...prev.finalVideo, bgmEnabled: !prev.finalVideo.bgmEnabled } }))}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black border transition-all ${ui.finalVideo.bgmEnabled ? 'bg-emerald-400 text-black border-emerald-300' : 'bg-black/30 text-slate-300 border-white/15'}`}
                    >
                      {ui.finalVideo.bgmEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  {ui.finalVideo.bgmEnabled && (
                    <>
                      <select
                        value={ui.finalVideo.bgmTrack}
                        onChange={(e) => setUi((prev: any) => ({ ...prev, finalVideo: { ...prev.finalVideo, bgmTrack: e.target.value, bgmTrackUserSelected: true } }))}
                        className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white outline-none"
                      >
                        {BGM_LIBRARY.map(track => (
                          <option key={track.path} value={track.path}>{track.label}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => playPreviewAudio(ui.finalVideo.bgmTrack, 'bgm')}
                        className={`w-full rounded-lg border px-3 py-2 text-[10px] font-black transition-all flex items-center justify-center gap-1 ${previewAudioType === 'bgm' && previewAudioPath === ui.finalVideo.bgmTrack ? 'bg-amber-400 text-black border-amber-300' : 'bg-white/5 text-slate-200 border-white/15 hover:bg-white/10'}`}
                      >
                        <Play className="w-3 h-3" /> {previewAudioType === 'bgm' && previewAudioPath === ui.finalVideo.bgmTrack ? '배경음악 미리듣기 중지' : '배경음악 미리듣기'}
                      </button>
                      <div className="flex items-center justify-between gap-3">
                        <label className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">BGM 볼륨</label>
                        <span className="text-[10px] text-emerald-100 font-bold">{ui.finalVideo.bgmVolume}%</span>
                      </div>
                      <InlineSmoothRange
                        min={0}
                        max={100}
                        step={1}
                        value={Number(ui.finalVideo.bgmVolume || 0)}
                        onChange={(v) => setUi((prev: any) => ({ ...prev, finalVideo: { ...prev.finalVideo, bgmVolume: Number(v) } }))}
                        className="w-full accent-emerald-300"
                      />
                      <div className="flex items-center justify-between gap-3">
                        <label className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">TTS 중 BGM 덕킹</label>
                        <button
                          onClick={() => setUi((prev: any) => ({ ...prev, finalVideo: { ...prev.finalVideo, bgmDuckingEnabled: !prev.finalVideo.bgmDuckingEnabled } }))}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black border transition-all ${ui.finalVideo.bgmDuckingEnabled ? 'bg-emerald-400 text-black border-emerald-300' : 'bg-black/30 text-slate-300 border-white/15'}`}
                        >
                          {ui.finalVideo.bgmDuckingEnabled ? 'ON' : 'OFF'}
                        </button>
                      </div>
                      {ui.finalVideo.bgmDuckingEnabled && (
                        <>
                          <div className="flex items-center justify-between gap-3">
                            <label className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">덕킹 강도</label>
                            <span className="text-[10px] text-emerald-100 font-bold">-{ui.finalVideo.bgmDuckingDb} dB</span>
                          </div>
                          <InlineSmoothRange
                            min={3}
                            max={18}
                            step={1}
                            value={Number(ui.finalVideo.bgmDuckingDb || 3)}
                            onChange={(v) => setUi((prev: any) => ({ ...prev, finalVideo: { ...prev.finalVideo, bgmDuckingDb: Number(v) } }))}
                            className="w-full accent-emerald-300"
                          />
                        </>
                      )}
                    </>
                  )}
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <label className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">전환 효과음(SFX)</label>
                    <button
                      disabled
                      className="px-3 py-1.5 rounded-lg text-[10px] font-black border transition-all bg-black/30 text-slate-500 border-white/10 cursor-not-allowed"
                    >
                      영상편집에서 설정
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">효과음은 자동 오류를 줄이기 위해 12번에서 비활성화했습니다. 13번 영상편집(준비중)에서 최종 수동 적용하도록 이동됩니다.</p>
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <label className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">자막</label>
                    <button
                      onClick={() => setUi((prev: any) => ({ ...prev, finalVideo: { ...prev.finalVideo, subtitleEnabled: !prev.finalVideo.subtitleEnabled } }))}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black border transition-all ${ui.finalVideo.subtitleEnabled ? 'bg-emerald-400 text-black border-emerald-300' : 'bg-black/30 text-slate-300 border-white/15'}`}
                    >
                      {ui.finalVideo.subtitleEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  {ui.finalVideo.subtitleEnabled && (
                    <>
                      <div className="space-y-1 pt-1">
                        <label className="text-[10px] font-black text-emerald-300 uppercase tracking-widest block">자막 템플릿</label>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                          <div
                            className="grid grid-cols-2 gap-2 h-[478px] overflow-y-auto custom-scrollbar pr-1"
                            style={{ gridAutoRows: '235px' }}
                          >
                            {BUILTIN_SUBTITLE_TEMPLATES.map(template => {
                              const isActive = previewTemplate?.id === template.id;
                              const isLocked = ui.finalVideo.subtitleTemplateLockedId === template.id;
                              return (
                                <div
                                  key={template.id}
                                  onMouseEnter={() => setPreviewTemplateId(template.id)}
                                  className={`h-full text-left border rounded-lg p-2 transition-all flex flex-col gap-2 ${isLocked ? 'bg-emerald-500/10 border-emerald-300' : isActive ? 'bg-slate-700 border-emerald-400/60' : 'bg-slate-800/80 border-white/10 hover:bg-slate-700'}`}
                                >
                                  <button
                                    onClick={() => {
                                      setPreviewTemplateId(template.id);
                                      applyTemplateAndAutoTitle(template);
                                    }}
                                    className="w-full text-left flex-1"
                                  >
                                    <div className="aspect-video rounded-md overflow-hidden border border-white/10 bg-slate-900 relative">
                                      <img
                                        src={templatePreviewOverrides[template.id] || getBuiltinTemplatePreview(template)}
                                        alt={template.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          e.currentTarget.src = `https://picsum.photos/seed/subtitle-${template.id}/640/360`;
                                        }}
                                      />
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                                      <p className="absolute left-2 bottom-2 text-[10px] font-black text-white">{template.sample}</p>
                                      <div className={`absolute right-2 top-2 w-4 h-4 rounded-sm border-2 ${isLocked ? 'bg-emerald-400 border-emerald-200' : 'bg-black/40 border-white/40'}`}>
                                        {isLocked && <span className="block w-full h-full text-[10px] leading-[12px] text-black font-black text-center">✓</span>}
                                      </div>
                                    </div>
                                    <p className="text-[11px] font-black text-white flex items-center justify-between gap-2 mt-2">
                                      <span>{template.name}</span>
                                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-200 border border-emerald-300/25">
                                        {template.config.subtitlePreset}
                                      </span>
                                    </p>
                                    <p className="text-[9px] text-slate-300 mt-1 line-clamp-2">{template.description}</p>
                                  </button>
                                </div>
                              );
                            })}
                          </div>

                          {previewTemplate && (
                            <div className="rounded-xl border border-emerald-400/30 bg-[#0c1628] p-3 space-y-2">
                              <p className="text-[10px] font-black text-emerald-200 uppercase tracking-widest">템플릿 확대 미리보기</p>
                              <div className="w-full max-w-[280px] mx-auto rounded-lg overflow-hidden border border-white/15 bg-black" style={{ aspectRatio: '9 / 16' }}>
                                <img
                                  src={templatePreviewOverrides[previewTemplate.id] || getBuiltinTemplatePreview(previewTemplate)}
                                  alt={`${previewTemplate.name}-preview`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = `https://picsum.photos/seed/subtitle-preview-${previewTemplate.id}/540/960`;
                                  }}
                                />
                              </div>
                              <p className="text-[11px] font-black text-white">{previewTemplate.name}</p>
                              <p className="text-[10px] text-slate-300">{previewTemplate.sample}</p>
                              <button
                                onClick={() => applyTemplateAndAutoTitle(previewTemplate)}
                                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-black py-2 rounded-lg"
                              >
                                이 템플릿 적용
                              </button>
                              <p className="text-[10px] text-emerald-200/90 bg-emerald-500/10 border border-emerald-300/20 rounded-lg px-2 py-1.5">
                                템플릿을 클릭하면 즉시 고정됩니다. 다른 템플릿을 클릭하면 새 템플릿으로 변경 고정됩니다.
                              </p>
                            </div>
                          )}
                        </div>
                        <label className="block bg-slate-800 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-black text-slate-100 hover:bg-slate-700 transition-all text-center cursor-pointer mt-1">
                          템플릿 가져오기
                          <input
                            type="file"
                            accept="application/json,.json"
                            className="hidden"
                            onChange={async (e) => {
                              await importSubtitleTemplates(e.target.files?.[0] || null);
                              e.currentTarget.value = '';
                            }}
                          />
                        </label>
                        <div id="panel12-title" className="space-y-2 pt-2 border-t border-white/10">
                          <div className="flex items-center justify-between gap-2">
                            <label className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">템플릿 제목 오버레이</label>
                            <button
                              onClick={() => setUi((prev: any) => ({ ...prev, finalVideo: { ...prev.finalVideo, templateTitleEnabled: !prev.finalVideo.templateTitleEnabled } }))}
                              className={`px-3 py-1 rounded-md text-[10px] font-black border transition-all ${ui.finalVideo.templateTitleEnabled ? 'bg-emerald-400 text-black border-emerald-300' : 'bg-black/30 text-slate-300 border-white/15'}`}
                            >
                              {ui.finalVideo.templateTitleEnabled ? 'ON' : 'OFF'}
                            </button>
                          </div>
                          {ui.finalVideo.templateTitleEnabled && (
                            <>
                                <textarea
                                  value={ui.finalVideo.templateTitleText}
                                  onChange={(e) => {
                                    setTemplateTitleManualEdited(true);
                                    const nextTitle = String(e.target.value || '');
                                    setUi((prev: any) => ({ ...prev, finalVideo: { ...prev.finalVideo, templateTitleText: nextTitle } }));
                                  }}
                                  placeholder="템플릿 스타일로 넣을 제목"
                                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white outline-none min-h-[56px] resize-y"
                                />
                              {templateTitleManualEdited && (
                                <p className="text-[10px] text-amber-200/95 bg-amber-500/10 border border-amber-300/25 rounded-md px-2 py-1">
                                  수정됨
                                </p>
                              )}
                              <button
                                onClick={rewriteTemplateTitleFromHook}
                                disabled={ui.finalVideo.templateTitleGenerating || !ui.selectedHookTitle}
                                className={`w-full py-2 rounded-lg text-[10px] font-black border transition-all ${ui.finalVideo.templateTitleGenerating ? 'running-gradient text-black' : 'bg-amber-500/80 text-black border-amber-300/40'} disabled:opacity-40`}
                              >
                                {ui.finalVideo.templateTitleGenerating ? '적용 중' : '선택 제목 그대로 적용'}
                              </button>
                              <div className="grid grid-cols-2 gap-2">
                                <label className="text-[10px] text-slate-300 flex items-center justify-between gap-2 bg-black/20 border border-white/10 rounded-lg px-2 py-1.5">
                                  1줄 색상
                                  <input
                                    type="color"
                                    value={ui.finalVideo.templateTitleLine1Color}
                                    onChange={(e) => setUi((prev: any) => ({ ...prev, finalVideo: { ...prev.finalVideo, templateTitleLine1Color: e.target.value } }))}
                                    className="w-7 h-6 bg-transparent border-0"
                                  />
                                </label>
                                <label className="text-[10px] text-slate-300 flex items-center justify-between gap-2 bg-black/20 border border-white/10 rounded-lg px-2 py-1.5">
                                  2줄 색상
                                  <input
                                    type="color"
                                    value={ui.finalVideo.templateTitleLine2Color}
                                    onChange={(e) => setUi((prev: any) => ({ ...prev, finalVideo: { ...prev.finalVideo, templateTitleLine2Color: e.target.value } }))}
                                    className="w-7 h-6 bg-transparent border-0"
                                  />
                                </label>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <label className="text-[10px] text-slate-300 flex items-center justify-between gap-2 bg-black/20 border border-white/10 rounded-lg px-2 py-1.5">
                                  강조 단어
                                  <input
                                    value={ui.finalVideo.templateTitleHighlightWord}
                                    onChange={(e) => setUi((prev: any) => ({ ...prev, finalVideo: { ...prev.finalVideo, templateTitleHighlightWord: e.target.value } }))}
                                    className="w-20 bg-transparent text-right outline-none"
                                  />
                                </label>
                                <label className="text-[10px] text-slate-300 flex items-center justify-between gap-2 bg-black/20 border border-white/10 rounded-lg px-2 py-1.5">
                                  강조색
                                  <input
                                    type="color"
                                    value={ui.finalVideo.templateTitleHighlightColor}
                                    onChange={(e) => setUi((prev: any) => ({ ...prev, finalVideo: { ...prev.finalVideo, templateTitleHighlightColor: e.target.value } }))}
                                    className="w-7 h-6 bg-transparent border-0"
                                  />
                                </label>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <label className="text-[10px] text-slate-300 flex items-center justify-between gap-2 bg-black/20 border border-white/10 rounded-lg px-2 py-1.5">
                                  폰트
                                  <select
                                    value={ui.finalVideo.templateTitleFontFamily}
                                    onChange={(e) => setUi((prev: any) => ({ ...prev, finalVideo: { ...prev.finalVideo, templateTitleFontFamily: e.target.value } }))}
                                    className="w-28 bg-transparent text-right outline-none"
                                  >
                                    {TITLE_FONT_OPTIONS.map(font => (
                                      <option key={font.value} value={font.value}>{font.label}</option>
                                    ))}
                                  </select>
                                </label>
                                <label className="text-[10px] text-slate-300 flex items-center justify-between gap-2 bg-black/20 border border-white/10 rounded-lg px-2 py-1.5">
                                  외곽선
                                  <input
                                    type="color"
                                    value={ui.finalVideo.templateTitleStrokeColor}
                                    onChange={(e) => setUi((prev: any) => ({ ...prev, finalVideo: { ...prev.finalVideo, templateTitleStrokeColor: e.target.value } }))}
                                    className="w-7 h-6 bg-transparent border-0"
                                  />
                                </label>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <label className="text-[10px] text-slate-300 flex items-center justify-between gap-2 bg-black/20 border border-white/10 rounded-lg px-2 py-1.5">
                                  1줄 상단(mm)
                                  <input
                                    type="number"
                                    min="5"
                                    max="80"
                                    step="1"
                                    value={ui.finalVideo.templateTitleLine1TopMm}
                                    onChange={(e) => {
                                      const line1 = Math.max(5, Math.min(80, Number(e.target.value) || 60));
                                      const autoLine2 = Math.max(20, Math.min(120, Math.round(line1 * 1.6)));
                                      setUi((prev: any) => ({
                                        ...prev,
                                        finalVideo: {
                                          ...prev.finalVideo,
                                          templateTitleLine1TopMm: line1,
                                          templateTitleLine2BottomMm: autoLine2,
                                        },
                                      }));
                                    }}
                                    className="w-14 bg-transparent text-right outline-none"
                                  />
                                </label>
                                <label className="text-[10px] text-slate-300 flex items-center justify-between gap-2 bg-black/20 border border-white/10 rounded-lg px-2 py-1.5">
                                  2줄 하단(mm, 자동)
                                  <input
                                    type="number"
                                    min="20"
                                    max="120"
                                    step="1"
                                    value={ui.finalVideo.templateTitleLine2BottomMm}
                                    readOnly
                                    className="w-14 bg-transparent text-right outline-none"
                                  />
                                </label>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <label className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">제목 크기</label>
                                <span className="text-[10px] text-emerald-100 font-bold">{ui.finalVideo.templateTitleScale.toFixed(2)}x</span>
                              </div>
                              <InlineSmoothRange
                                min={TEXT_SCALE_MIN}
                                max={TEXT_SCALE_MAX}
                                step={0.05}
                                value={Number(ui.finalVideo.templateTitleScale || 1)}
                                onChange={(v) => setUi((prev: any) => ({ ...prev, finalVideo: { ...prev.finalVideo, templateTitleScale: Number(v) } }))}
                                className="w-full accent-emerald-300"
                              />
                            </>
                          )}
                        </div>
                        {subtitleTemplates.length > 0 && (
                          <div className="space-y-1 pt-1">
                            <p className="text-[10px] text-slate-400">저장한 템플릿</p>
                            <div className="flex flex-wrap gap-2">
                              {subtitleTemplates.map(template => (
                                <div key={template.name} className="flex items-center gap-1 bg-slate-900/70 border border-white/10 rounded-lg px-2 py-1">
                                  <button
                                    onClick={() => applySavedSubtitleTemplate(template)}
                                    className="text-[10px] font-bold text-slate-100 hover:text-white flex flex-col items-start gap-1"
                                  >
                                    <span className="flex items-center gap-1">
                                      {template.name}
                                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-200 border border-emerald-300/25">
                                        {template.subtitlePreset}
                                      </span>
                                    </span>
                                    <span className="text-[9px] text-slate-400 font-medium">
                                      {PRESET_SAMPLE_TEXT[template.subtitlePreset]}
                                    </span>
                                  </button>
                                  <button
                                    onClick={() => removeSavedSubtitleTemplate(template.name)}
                                    className="text-[10px] font-black text-rose-300 hover:text-rose-200"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div id="panel12-subtitle" className="flex items-center justify-between gap-3 pt-1">
                        <label className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">자막 글자 크기</label>
                        <span className="text-[10px] text-emerald-100 font-bold">{Number(ui.finalVideo.subtitleScale || 1).toFixed(2)}x</span>
                      </div>
                      <InlineSmoothRange
                        min={TEXT_SCALE_MIN}
                        max={TEXT_SCALE_MAX}
                        step={0.05}
                        value={Number(ui.finalVideo.subtitleScale || 1)}
                        onChange={(v) => setUi((prev: any) => ({ ...prev, finalVideo: { ...prev.finalVideo, subtitleScale: Number(v) } }))}
                        className="w-full accent-emerald-300"
                      />
                      <div className="flex items-center justify-between gap-3 pt-1">
                        <label className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">자막 정렬</label>
                        <select
                          value={String(ui.finalVideo.subtitleGridPosition)}
                          onChange={(e) => {
                            const nextPos = Number(e.target.value);
                            setUi((prev: any) => ({
                              ...prev,
                              finalVideo: {
                                ...prev.finalVideo,
                                subtitleGridPosition: nextPos,
                                subtitlePosition: nextPos <= 5 ? 'middle' : 'bottom',
                              },
                            }));
                          }}
                          className="bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] text-white outline-none"
                        >
                          {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                            <option key={n} value={n}>{n}/10</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center justify-between gap-3 pt-1">
                        <label className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">자막 스타일</label>
                        <span className="text-[10px] text-emerald-100 font-bold">{SUBTITLE_PRESETS?.[ui.finalVideo.subtitlePreset]?.label || '기본'}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(SUBTITLE_PRESETS).map(([id, preset]) => (
                          <button
                            key={id}
                            onClick={() => setUi((prev: any) => ({ ...prev, finalVideo: { ...prev.finalVideo, subtitlePreset: id as any } }))}
                            className={`rounded-lg border px-2 py-2 text-left transition-all ${ui.finalVideo.subtitlePreset === id ? 'border-emerald-300 bg-emerald-500/15' : 'border-white/10 bg-black/20 hover:bg-white/5'}`}
                          >
                            <div className={`h-2 w-full rounded-full bg-gradient-to-r ${SUBTITLE_STYLE_SWATCH[id] || 'from-slate-500 to-slate-700'}`} />
                            <p className="mt-1 text-[10px] font-black text-white">{preset.label}</p>
                            <p className="text-[9px] text-slate-300 mt-0.5 line-clamp-1">{PRESET_SAMPLE_TEXT[id as keyof typeof PRESET_SAMPLE_TEXT]}</p>
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-400">단어 하이라이트/키워드 강조 기능은 혼란을 줄이기 위해 비활성화되었습니다.</p>
                      <div className="flex items-center justify-between gap-3 pt-1">
                        <label className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">등장 애니메이션</label>
                        <select
                          value={ui.finalVideo.subtitleEntryAnimation}
                          onChange={(e) => setUi((prev: any) => ({ ...prev, finalVideo: { ...prev.finalVideo, subtitleEntryAnimation: e.target.value as any } }))}
                          className="bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] text-white outline-none"
                        >
                          <option value="none">없음</option>
                          <option value="fade">페이드 인</option>
                          <option value="pop">팝 인</option>
                          <option value="slide_up">위로 슬라이드</option>
                          <option value="slide_down">아래로 슬라이드</option>
                          <option value="slide_left">왼쪽 슬라이드</option>
                          <option value="slide_right">오른쪽 슬라이드</option>
                        </select>
                      </div>
                    </>
                  )}
                  <p className="text-[10px] text-slate-400">6가지 모션(확대/축소/좌/우/상/하)이 컷 내용 기준으로 자동 배정됩니다.</p>
                </div>
              )}

              {ui.finalVideo.type === 'image_slide' && ui.finalVideo.slides.length > 0 && (
                <div className="space-y-2 bg-black/30 border border-white/10 rounded-2xl p-4 max-h-52 overflow-y-auto custom-scrollbar">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">컷별 모션 수동 조정</p>
                  {ui.finalVideo.slides.map((slide: any, idx: number) => (
                    <div key={`${slide.cut}-${idx}`} className="flex items-center gap-3">
                      <span className="w-14 text-[10px] font-black text-emerald-300">CUT {slide.cut}</span>
                      <select
                        value={slide.motion}
                        onChange={(e) => {
                          const motion = e.target.value as any;
                          setUi((prev: any) => ({
                            ...prev,
                            finalVideo: {
                              ...prev.finalVideo,
                              slides: prev.finalVideo.slides.map((s: any) => s.cut === slide.cut ? { ...s, motion } : s),
                            },
                          }));
                        }}
                        className="flex-1 bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white outline-none"
                      >
                        {SLIDE_MOTIONS.map(m => (
                          <option key={m.id} value={m.id}>{m.label}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}

              <div id="panel12-render" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleGenerateFinalVideo}
                  disabled={ui.finalVideo.generating || ui.imageJobs.filter((j: any) => j.imageUrl).length === 0}
                  className={`text-black font-black py-4 rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-xs ${ui.finalVideo.generating ? 'running-gradient' : 'bg-emerald-500 hover:bg-emerald-600'}`}
                >
                  {ui.finalVideo.generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Video className="w-4 h-4" /> {ui.finalVideo.type === 'image_slide' ? '슬라이드 구성' : '영상 생성'}</>}
                </button>
                <label className="bg-amber-500 hover:bg-amber-600 text-black font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-xs cursor-pointer">
                  <Download className="w-4 h-4 rotate-180" /> 업로드
                  <input
                    type="file"
                    className="hidden"
                    accept="video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = URL.createObjectURL(file);
                        setUi((prev: any) => ({
                          ...prev,
                          finalVideo: {
                            ...prev.finalVideo,
                            url,
                            outputFormat: file.type.includes('mp4') ? 'mp4' : 'webm',
                          },
                        }));
                      }
                    }}
                  />
                </label>
                <button
                  onClick={async () => {
                    if (ui.finalVideo.generating) {
                      await handleExportSlideVideo();
                      return;
                    }
                    if (ui.finalVideo.type === 'image_slide') {
                      if (!ui.finalVideo.url) {
                        await handleExportSlideVideo();
                        return;
                      }
                      if (!canDownload) {
                        alert('승인된 사용자만 다운로드할 수 있습니다.');
                        return;
                      }
                      const a = document.createElement('a');
                      a.href = ui.finalVideo.url;
                      a.download = ui.finalVideo.outputFormat === 'mp4' ? 'final_slide_video.mp4' : 'final_slide_video.webm';
                      a.click();
                      return;
                    }
                    if (!ui.finalVideo.url) return alert('생성되거나 업로드된 영상이 없습니다.');
                    if (!canDownload) {
                      alert('승인된 사용자만 다운로드할 수 있습니다.');
                      return;
                    }
                    const a = document.createElement('a');
                    a.href = ui.finalVideo.url;
                    a.download = 'final_video.mp4';
                    a.click();
                  }}
                  disabled={ui.finalVideo.type === 'image_slide' && ui.finalVideo.slides.length === 0}
                  className={`font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-xs disabled:opacity-50 ${ui.finalVideo.generating ? 'running-gradient text-black' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                >
                  {ui.finalVideo.generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} {ui.finalVideo.generating ? '렌더링 중지' : ui.finalVideo.type === 'image_slide' ? (ui.finalVideo.url ? '영상 다운로드' : '슬라이드 렌더링') : '다운로드'}
                </button>
                <button
                  onClick={() => setUi((prev: any) => ({
                    ...prev,
                    finalVideo: { ...prev.finalVideo, url: '', slides: [], activeSlide: 0, outputFormat: 'webm' },
                  }))}
                  className="bg-rose-500 hover:bg-rose-600 text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-xs"
                >
                  <Trash2 className="w-4 h-4" /> 삭제
                </button>
              </div>

              {ui.finalVideo.type === 'image_slide' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleDownloadSrt}
                    disabled={ui.finalVideo.slides.length === 0 || !canDownload}
                    className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 font-black py-3 rounded-2xl transition-all text-xs disabled:opacity-40"
                  >
                    자막(SRT) 다운로드
                  </button>
                  <button
                    onClick={handleConvertToMp4}
                    disabled={!ui.finalVideo.url || ui.finalVideo.generating}
                    title="권장 최소 사양: 8GB RAM, 4코어 CPU. 브라우저 탭 여유 메모리 2GB 이상 확보 후 실행하세요."
                    className={`w-full font-black py-3 rounded-2xl transition-all text-xs disabled:opacity-40 ${ui.finalVideo.transcoding ? 'running-gradient text-black' : 'bg-indigo-500/90 hover:bg-indigo-500 text-white'}`}
                  >
                    {ui.finalVideo.transcoding ? '변환 중지' : 'FFmpeg MP4 변환'}
                  </button>
                </div>
              )}
              {ui.finalVideo.ffmpegNote && (
                <p className="text-[10px] text-indigo-200 bg-indigo-500/10 border border-indigo-400/20 rounded-lg px-3 py-2">
                  {ui.finalVideo.ffmpegNote}
                </p>
              )}
              {!canDownload && (
                <p className="text-[10px] text-rose-200 bg-rose-500/10 border border-rose-300/25 rounded-lg px-3 py-2">
                  승인된 사용자만 영상/SRT 다운로드가 가능합니다. STEP 1에서 관리자 승인 요청을 보내세요.
                </p>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[10px]">
                <div className="bg-black/30 border border-white/10 rounded-lg px-3 py-2">
                  <p className="text-slate-400">대본(참고)</p>
                  <p className="font-black text-amber-300">{Math.ceil(syncReport.scriptSec)}초</p>
                </div>
                <div className="bg-black/30 border border-white/10 rounded-lg px-3 py-2">
                  <p className="text-slate-400">TTS 실측</p>
                  <p className="font-black text-cyan-300">{syncReport.ttsSec > 0 ? `${Math.ceil(syncReport.ttsSec)}초` : '미생성'}</p>
                </div>
                <div className="bg-black/30 border border-white/10 rounded-lg px-3 py-2">
                  <p className="text-slate-400">컷 총길이</p>
                  <p className="font-black text-emerald-300">{Math.ceil(syncReport.cutsSec)}초</p>
                </div>
                <div className="bg-black/30 border border-white/10 rounded-lg px-3 py-2">
                  <p className="text-slate-400">렌더 기준</p>
                  <p className="font-black text-white">{Math.ceil(syncReport.renderSec)}초</p>
                </div>
                <div className="bg-black/30 border border-white/10 rounded-lg px-3 py-2">
                  <p className="text-slate-400">자막 마지막</p>
                  <p className="font-black text-white">{Math.ceil(syncReport.srtLastEndSec)}초</p>
                </div>
                <div className={`border rounded-lg px-3 py-2 ${syncReport.status === '정상' ? 'bg-emerald-500/10 border-emerald-300/30' : syncReport.status === '주의' ? 'bg-amber-500/10 border-amber-300/30' : 'bg-rose-500/10 border-rose-300/30'}`}>
                  <p className="text-slate-300">싱크 오차</p>
                  <p className="font-black text-white">{syncReport.deltaSec.toFixed(2)}초 · {syncReport.status}</p>
                </div>
              </div>
            </div>

            <div className="bg-black/40 border border-white/5 rounded-[2rem] p-6 flex flex-col items-stretch justify-start text-center space-y-4 md:sticky md:top-4 self-start">
              <div className="flex flex-wrap items-center justify-center gap-2">
                {[
                  { key: 'shorts', label: 'YouTube Shorts' },
                  { key: 'reels', label: 'Instagram Reels' },
                  { key: 'tiktok', label: 'TikTok' },
                ].map(item => {
                  const active = previewGuideMode === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setPreviewGuideMode(item.key as any)}
                      className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-black transition-all ${active ? 'bg-emerald-400 text-black border-emerald-300' : 'bg-white/5 text-slate-300 border-white/10'}`}
                    >
                      {item.label} {active ? 'ON' : 'OFF'}
                    </button>
                  );
                })}
              </div>
              {ui.finalVideo.url ? (
                <div ref={previewFrameRef} className="w-full max-w-[360px] mx-auto bg-black rounded-2xl overflow-hidden relative border border-white/10" style={{ aspectRatio: '9 / 16' }}>
                  {ui.finalVideo.url.startsWith('data:image') ? (
                    <div className="w-full h-full flex items-center justify-center bg-slate-900">
                      <img src={ui.finalVideo.url} className="w-full h-full object-contain opacity-50" alt="" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                        <Play className="w-12 h-12 text-white mb-2" />
                        <p className="text-[10px] text-white font-bold uppercase tracking-widest">Video Preview Simulation</p>
                      </div>
                    </div>
                  ) : (
                    <video src={ui.finalVideo.url} controls className="w-full h-full" />
                  )}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-0 right-0 h-[11%] bg-black/18" />
                    <div className="absolute bottom-0 left-0 right-0 h-[15%] bg-black/18" />
                    {previewGuideMode === 'shorts' && (
                      <>
                        <div className="absolute right-[4%] top-[27%] text-white/80 text-[11px] font-black leading-6 text-right">
                          <p>👍 2.8M</p><p>👎 2.8M</p><p>💬 2.8M</p><p>↗ 2.8M</p>
                        </div>
                        <p className="absolute left-[6%] bottom-[7%] text-white/75 text-[11px] font-black">@Your name</p>
                      </>
                    )}
                    {previewGuideMode === 'reels' && (
                      <>
                        <div className="absolute right-[4%] top-[33%] text-white/80 text-[11px] font-black leading-7 text-right">
                          <p>♡ 2.8M</p><p>◌ 2.8M</p><p>✈ 2.8M</p>
                        </div>
                        <p className="absolute left-[6%] bottom-[8%] text-white/75 text-[11px] font-black">@Your name</p>
                      </>
                    )}
                    {previewGuideMode === 'tiktok' && (
                      <>
                        <div className="absolute top-[5%] left-0 right-0 text-center text-white/75 text-[10px] font-black">Explore   Following   For You</div>
                        <div className="absolute right-[4%] top-[36%] text-white/80 text-[11px] font-black leading-7 text-right">
                          <p>👤</p><p>♥ 2.8M</p><p>💬 2.8M</p><p>🔖 2.8M</p>
                        </div>
                        <p className="absolute left-[6%] bottom-[8%] text-white/75 text-[11px] font-black">Your name</p>
                      </>
                    )}
                  </div>
                </div>
              ) : ui.finalVideo.type === 'image_slide' && ui.finalVideo.slides.length > 0 ? (
                <div className="w-full space-y-3">
                  <div ref={previewFrameRef} className="w-full max-w-[360px] mx-auto bg-black rounded-2xl overflow-hidden relative border border-white/10" style={{ aspectRatio: '9 / 16' }}>
                    <AnimatePresence mode="wait">
                      {(() => {
                        const active = ui.finalVideo.slides[ui.finalVideo.activeSlide];
                        if (!active) return null;
                        const animation = SLIDE_MOTION_ANIMATION?.[active.motion] || { initial: {}, animate: {} };
                        return (
                          <motion.img
                            key={`${active.cut}-${ui.finalVideo.activeSlide}`}
                            src={active.imageUrl}
                            alt={`slide-${active.cut}`}
                            className="absolute inset-0 w-full h-full object-cover"
                            initial={animation.initial}
                            animate={animation.animate}
                            exit={{ opacity: 0.2 }}
                            transition={{ duration: ui.finalVideo.slideDuration, ease: 'linear' }}
                          />
                        );
                      })()}
                    </AnimatePresence>
                    <div className="absolute bottom-2 right-2 bg-black/60 text-[10px] text-emerald-300 px-2 py-1 rounded-md font-black">
                      CUT {ui.finalVideo.slides[ui.finalVideo.activeSlide]?.cut} · {SLIDE_MOTIONS.find(m => m.id === ui.finalVideo.slides[ui.finalVideo.activeSlide]?.motion)?.label}
                    </div>
                    {ui.finalVideo.subtitleEnabled && (
                      <div
                        className={`absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-[84%] rounded-xl border border-white/15 ${ui.finalVideo.subtitlePreset === 'shorts' ? 'bg-black/55' : ui.finalVideo.subtitlePreset === 'docu' ? 'bg-slate-950/70' : 'bg-slate-900/65'}`}
                        style={{ top: `${gridPositionToPercent(ui.finalVideo.subtitleGridPosition)}%` }}
                      >
                        <p
                          className={`font-black drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)] ${ui.finalVideo.subtitlePreset === 'shorts' ? 'text-white' : ui.finalVideo.subtitlePreset === 'docu' ? 'text-slate-100' : 'text-white'}`}
                          style={{
                            fontSize: `${previewSubtitleFontPx}px`,
                            lineHeight: `${Math.round(previewSubtitleFontPx * 1.34)}px`,
                            paddingTop: '14px',
                            paddingBottom: '14px',
                            textAlign: 'center',
                            WebkitTextStroke: `${Math.max(1, Math.round(previewSubtitleFontPx * 0.08))}px rgba(0,0,0,0.9)`,
                          }}
                        >
                          {(previewSubtitleLines.length > 0 ? previewSubtitleLines : ['']).map((line, idx) => (
                            <span key={`${line}-${idx}`} className="block">{line}</span>
                          ))}
                        </p>
                      </div>
                    )}
                    {ui.finalVideo.templateTitleEnabled && Boolean(ui.finalVideo.templateTitleText) && (
                      <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none" style={{ top: `${previewTitleTopPercent}%` }}>
                        <p
                          className="font-black tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] whitespace-pre-line text-center"
                          style={{
                            color: ui.finalVideo.templateTitleLine1Color || '#ff554a',
                            fontFamily: ui.finalVideo.templateTitleFontFamily || 'Pretendard',
                            fontSize: `${previewTitleFontPx}px`,
                            lineHeight: `${Math.round(previewTitleFontPx * 1.1)}px`,
                          }}
                        >
                          {(previewTitleLines.length > 0 ? previewTitleLines : ['']).map((line, idx) => (
                            <span key={`${line}-${idx}`} className="block">{line}</span>
                          ))}
                        </p>
                      </div>
                    )}
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-0 left-0 right-0 h-[11%] bg-black/18" />
                      <div className="absolute bottom-0 left-0 right-0 h-[15%] bg-black/18" />
                      {previewGuideMode === 'shorts' && (
                        <>
                          <div className="absolute right-[4%] top-[27%] text-white/80 text-[11px] font-black leading-6 text-right">
                            <p>👍 2.8M</p>
                            <p>👎 2.8M</p>
                            <p>💬 2.8M</p>
                            <p>↗ 2.8M</p>
                          </div>
                          <p className="absolute left-[6%] bottom-[7%] text-white/75 text-[11px] font-black">@Your name</p>
                        </>
                      )}
                      {previewGuideMode === 'reels' && (
                        <>
                          <div className="absolute right-[4%] top-[33%] text-white/80 text-[11px] font-black leading-7 text-right">
                            <p>♡ 2.8M</p>
                            <p>◌ 2.8M</p>
                            <p>✈ 2.8M</p>
                          </div>
                          <p className="absolute left-[6%] bottom-[8%] text-white/75 text-[11px] font-black">@Your name</p>
                        </>
                      )}
                      {previewGuideMode === 'tiktok' && (
                        <>
                          <div className="absolute top-[5%] left-0 right-0 text-center text-white/75 text-[10px] font-black">Explore   Following   For You</div>
                          <div className="absolute right-[4%] top-[36%] text-white/80 text-[11px] font-black leading-7 text-right">
                            <p>👤</p>
                            <p>♥ 2.8M</p>
                            <p>💬 2.8M</p>
                            <p>🔖 2.8M</p>
                          </div>
                          <p className="absolute left-[6%] bottom-[8%] text-white/75 text-[11px] font-black">Your name</p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    <div className="bg-white/5 border border-white/10 rounded-lg py-2">총 컷 {ui.finalVideo.slides.length}</div>
                    <div className="bg-white/5 border border-white/10 rounded-lg py-2">컷당 {ui.finalVideo.slideDuration}초</div>
                    <div className="bg-white/5 border border-white/10 rounded-lg py-2">총 {ui.finalVideo.slides.length * ui.finalVideo.slideDuration}초 · {ui.finalVideo.resolution.toUpperCase()}</div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Video className="w-10 h-10 text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-white">영상 생성 미리보기</h4>
                    <p className="text-xs text-slate-500 max-w-[250px] mx-auto mt-2">생성된 이미지 {ui.imageJobs.filter((j: any) => j.imageUrl).length}개와 TTS 음원을 결합하여 영상을 제작합니다.</p>
                  </div>
                </>
              )}

              <div className="w-full flex gap-2 overflow-x-auto py-2 custom-scrollbar">
                {(ui.finalVideo.type === 'image_slide' && ui.finalVideo.slides.length > 0
                  ? ui.finalVideo.slides
                  : ui.imageJobs.filter((j: any) => j.imageUrl)
                ).map((job: any, i: number) => (
                  <img key={i} src={job.imageUrl} style={{ aspectRatio: ratioToCss(ui.cuts.ratio || '16:9') }} className={`h-16 object-cover rounded-lg border shrink-0 ${ui.finalVideo.type === 'image_slide' && i === ui.finalVideo.activeSlide ? 'border-emerald-400' : 'border-white/10'}`} alt="" />
                ))}
                {(ui.finalVideo.type === 'image_slide' ? ui.finalVideo.slides.length === 0 : ui.imageJobs.filter((j: any) => j.imageUrl).length === 0) && (
                  <div className="w-full h-16 border border-dashed border-white/10 rounded-lg flex items-center justify-center text-[10px] text-slate-600">이미지가 없습니다.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
