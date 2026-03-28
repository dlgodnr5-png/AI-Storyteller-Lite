import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Video, Image as ImageIcon, Download, Loader2, Trash2, Play } from 'lucide-react';

type Props = {
  ui: any;
  setUi: React.Dispatch<React.SetStateAction<any>>;
  PanelHeader: any;
  handleGenerateFinalVideo: () => Promise<void> | void;
  handleExportSlideVideo: () => Promise<void>;
  handleDownloadSrt: () => void;
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
};

export default function Panel12Section(props: Props) {
  const {
    ui,
    setUi,
    PanelHeader,
    handleGenerateFinalVideo,
    handleExportSlideVideo,
    handleDownloadSrt,
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
  } = props;

  const [previewTemplateId, setPreviewTemplateId] = React.useState<string>(BUILTIN_SUBTITLE_TEMPLATES[0]?.id || '');
  const previewTemplate = BUILTIN_SUBTITLE_TEMPLATES.find(t => t.id === previewTemplateId) || BUILTIN_SUBTITLE_TEMPLATES[0];

  return (
    <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl">
      <PanelHeader title="12. 최종 영상생성" id="p12" colorClass="text-emerald-400" />
      {ui.panelsOpen.p12 && (
        <div className="space-y-8">
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
                  <div className="flex items-center justify-between gap-4">
                    <label className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">컷당 재생 시간</label>
                    <span className="text-xs text-emerald-200 font-bold">{ui.finalVideo.slideDuration}초</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="8"
                    step="1"
                    value={ui.finalVideo.slideDuration}
                    onChange={(e) => setUi((prev: any) => ({ ...prev, finalVideo: { ...prev.finalVideo, slideDuration: Number(e.target.value) } }))}
                    className="w-full accent-emerald-400"
                  />
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
                        onChange={(e) => setUi((prev: any) => ({ ...prev, finalVideo: { ...prev.finalVideo, bgmTrack: e.target.value } }))}
                        className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white outline-none"
                      >
                        {BGM_LIBRARY.map(track => (
                          <option key={track.path} value={track.path}>{track.label}</option>
                        ))}
                      </select>
                      <div className="flex items-center justify-between gap-3">
                        <label className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">BGM 볼륨</label>
                        <span className="text-[10px] text-emerald-100 font-bold">{ui.finalVideo.bgmVolume}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={ui.finalVideo.bgmVolume}
                        onChange={(e) => setUi((prev: any) => ({ ...prev, finalVideo: { ...prev.finalVideo, bgmVolume: Number(e.target.value) } }))}
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
                          <input
                            type="range"
                            min="3"
                            max="18"
                            step="1"
                            value={ui.finalVideo.bgmDuckingDb}
                            onChange={(e) => setUi((prev: any) => ({ ...prev, finalVideo: { ...prev.finalVideo, bgmDuckingDb: Number(e.target.value) } }))}
                            className="w-full accent-emerald-300"
                          />
                        </>
                      )}
                    </>
                  )}
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <label className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">전환 효과음(SFX)</label>
                    <button
                      onClick={() => setUi((prev: any) => ({ ...prev, finalVideo: { ...prev.finalVideo, sfxEnabled: !prev.finalVideo.sfxEnabled } }))}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black border transition-all ${ui.finalVideo.sfxEnabled ? 'bg-emerald-400 text-black border-emerald-300' : 'bg-black/30 text-slate-300 border-white/15'}`}
                    >
                      {ui.finalVideo.sfxEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  {ui.finalVideo.sfxEnabled && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setUi((prev: any) => ({ ...prev, finalVideo: { ...prev.finalVideo, sfxMode: 'auto' } }))}
                          className={`py-2 rounded-lg text-[10px] font-black border transition-all ${ui.finalVideo.sfxMode === 'auto' ? 'bg-emerald-400 text-black border-emerald-300' : 'bg-black/30 text-slate-300 border-white/15'}`}
                        >
                          자동 추천
                        </button>
                        <button
                          onClick={() => setUi((prev: any) => ({ ...prev, finalVideo: { ...prev.finalVideo, sfxMode: 'single' } }))}
                          className={`py-2 rounded-lg text-[10px] font-black border transition-all ${ui.finalVideo.sfxMode === 'single' ? 'bg-emerald-400 text-black border-emerald-300' : 'bg-black/30 text-slate-300 border-white/15'}`}
                        >
                          수동 고정
                        </button>
                      </div>
                      {ui.finalVideo.sfxMode === 'single' ? (
                        <select
                          value={ui.finalVideo.sfxTrack}
                          onChange={(e) => setUi((prev: any) => ({ ...prev, finalVideo: { ...prev.finalVideo, sfxTrack: e.target.value } }))}
                          className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white outline-none"
                        >
                          {SFX_LIBRARY.map(track => (
                            <option key={track.path} value={track.path}>{track.label}</option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-[10px] text-emerald-100/90 bg-emerald-500/10 border border-emerald-300/20 rounded-lg px-3 py-2">
                          대본 키워드(긴장/유머/사건/총격/전화/강조)를 분석해 컷 전환 효과음을 자동 추천합니다.
                        </p>
                      )}
                      <div className="flex items-center justify-between gap-3">
                        <label className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">SFX 볼륨</label>
                        <span className="text-[10px] text-emerald-100 font-bold">{ui.finalVideo.sfxVolume}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={ui.finalVideo.sfxVolume}
                        onChange={(e) => setUi((prev: any) => ({ ...prev, finalVideo: { ...prev.finalVideo, sfxVolume: Number(e.target.value) } }))}
                        className="w-full accent-emerald-300"
                      />
                      <div className="flex items-center justify-between gap-3">
                        <label className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">컷 전환마다 삽입</label>
                        <button
                          onClick={() => setUi((prev: any) => ({ ...prev, finalVideo: { ...prev.finalVideo, sfxEveryCut: !prev.finalVideo.sfxEveryCut } }))}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black border transition-all ${ui.finalVideo.sfxEveryCut ? 'bg-emerald-400 text-black border-emerald-300' : 'bg-black/30 text-slate-300 border-white/15'}`}
                        >
                          {ui.finalVideo.sfxEveryCut ? 'ON' : '1회'}
                        </button>
                      </div>
                    </>
                  )}
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
                              return (
                                <div
                                  key={template.id}
                                  onMouseEnter={() => setPreviewTemplateId(template.id)}
                                  className={`h-full text-left border rounded-lg p-2 transition-all flex flex-col gap-2 ${isActive ? 'bg-slate-700 border-emerald-400/60' : 'bg-slate-800/80 border-white/10 hover:bg-slate-700'}`}
                                >
                                  <button
                                    onClick={() => {
                                      setPreviewTemplateId(template.id);
                                      applyBuiltinSubtitleTemplate(template.id);
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
                                    </div>
                                    <p className="text-[11px] font-black text-white flex items-center justify-between gap-2 mt-2">
                                      <span>{template.name}</span>
                                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-200 border border-emerald-300/25">
                                        {template.config.subtitlePreset}
                                      </span>
                                    </p>
                                    <p className="text-[9px] text-slate-300 mt-1 line-clamp-2">{template.description}</p>
                                  </button>
                                  <div className="grid grid-cols-2 gap-2">
                                    <label className="text-center text-[9px] font-black bg-black/40 border border-white/10 rounded-md py-1 cursor-pointer hover:bg-black/60">
                                      이미지 선택
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                          handleTemplatePreviewUpload(template.id, e.target.files?.[0] || null);
                                          e.currentTarget.value = '';
                                        }}
                                      />
                                    </label>
                                    <button
                                      onClick={() => resetTemplatePreview(template.id)}
                                      className="text-[9px] font-black bg-black/40 border border-white/10 rounded-md py-1 hover:bg-black/60"
                                    >
                                      이미지 초기화
                                    </button>
                                  </div>
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
                                onClick={() => applyBuiltinSubtitleTemplate(previewTemplate.id)}
                                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-black py-2 rounded-lg"
                              >
                                이 템플릿 적용
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            onClick={saveCurrentSubtitleTemplate}
                            className="bg-emerald-500/80 border border-emerald-300/40 rounded-lg px-2 py-1.5 text-[10px] font-black text-black hover:bg-emerald-400 transition-all"
                          >
                            현재 설정 저장
                          </button>
                          <button
                            onClick={() => applySubtitleTemplate('shorts')}
                            className="bg-slate-800 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-black text-white hover:bg-slate-700 transition-all"
                          >
                            빠른 기본값
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            onClick={exportSubtitleTemplates}
                            className="bg-slate-800 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-black text-slate-100 hover:bg-slate-700 transition-all"
                          >
                            템플릿 내보내기
                          </button>
                          <label className="bg-slate-800 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-black text-slate-100 hover:bg-slate-700 transition-all text-center cursor-pointer">
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
                                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-200 border border-white/10">
                                        {template.subtitleHighlightStrength}
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
                      <div className="flex items-center justify-between gap-3 pt-1">
                        <label className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">줄당 글자수</label>
                        <span className="text-[10px] text-emerald-100 font-bold">{ui.finalVideo.subtitleMaxChars}자</span>
                      </div>
                      <input
                        type="range"
                        min="14"
                        max="34"
                        step="1"
                        value={ui.finalVideo.subtitleMaxChars}
                        onChange={(e) => setUi((prev: any) => ({ ...prev, finalVideo: { ...prev.finalVideo, subtitleMaxChars: Number(e.target.value) } }))}
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
                        <select
                          value={ui.finalVideo.subtitlePreset}
                          onChange={(e) => setUi((prev: any) => ({ ...prev, finalVideo: { ...prev.finalVideo, subtitlePreset: e.target.value as any } }))}
                          className="bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] text-white outline-none"
                        >
                          {Object.entries(SUBTITLE_PRESETS).map(([id, preset]) => (
                            <option key={id} value={id}>{preset.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center justify-between gap-3 pt-1">
                        <label className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">단어 하이라이트</label>
                        <button
                          onClick={() => setUi((prev: any) => ({ ...prev, finalVideo: { ...prev.finalVideo, subtitleWordHighlight: !prev.finalVideo.subtitleWordHighlight } }))}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black border transition-all ${ui.finalVideo.subtitleWordHighlight ? 'bg-emerald-400 text-black border-emerald-300' : 'bg-black/30 text-slate-300 border-white/15'}`}
                        >
                          {ui.finalVideo.subtitleWordHighlight ? 'ON' : 'OFF'}
                        </button>
                      </div>
                      <div className="flex items-center justify-between gap-3 pt-1">
                        <label className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">강조 강도</label>
                        <select
                          value={ui.finalVideo.subtitleHighlightStrength}
                          onChange={(e) => setUi((prev: any) => ({ ...prev, finalVideo: { ...prev.finalVideo, subtitleHighlightStrength: e.target.value as any } }))}
                          className="bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] text-white outline-none"
                        >
                          <option value="low">약</option>
                          <option value="medium">중</option>
                          <option value="high">강</option>
                        </select>
                      </div>
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-[10px] font-black text-emerald-300 uppercase tracking-widest block">키워드 강조 (쉼표 구분)</label>
                          <button
                            onClick={handleSuggestSubtitleKeywords}
                            disabled={ui.finalVideo.subtitleSuggesting}
                            className="text-[9px] px-2 py-1 rounded-md bg-emerald-400/20 text-emerald-100 border border-emerald-300/30 font-black disabled:opacity-50"
                          >
                            {ui.finalVideo.subtitleSuggesting ? '추출 중...' : 'AI 추천'}
                          </button>
                        </div>
                        <input
                          value={ui.finalVideo.subtitleKeywords}
                          onChange={(e) => setUi((prev: any) => ({ ...prev, finalVideo: { ...prev.finalVideo, subtitleKeywords: e.target.value } }))}
                          placeholder="핵심, 충격, 비밀"
                          className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white outline-none"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-3 pt-1">
                        <label className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">컷별 키워드 사용</label>
                        <button
                          onClick={() => setUi((prev: any) => ({ ...prev, finalVideo: { ...prev.finalVideo, subtitleUsePerCutKeywords: !prev.finalVideo.subtitleUsePerCutKeywords } }))}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black border transition-all ${ui.finalVideo.subtitleUsePerCutKeywords ? 'bg-emerald-400 text-black border-emerald-300' : 'bg-black/30 text-slate-300 border-white/15'}`}
                        >
                          {ui.finalVideo.subtitleUsePerCutKeywords ? 'ON' : 'OFF'}
                        </button>
                      </div>
                      {ui.finalVideo.subtitleUsePerCutKeywords && ui.finalVideo.slides.length > 0 && (
                        <div className="space-y-2 bg-black/30 border border-white/10 rounded-xl p-3 max-h-40 overflow-y-auto custom-scrollbar">
                          {ui.finalVideo.slides.map((slide: any) => (
                            <div key={`kw-${slide.cut}`} className="flex items-center gap-2">
                              <span className="w-12 text-[10px] font-black text-emerald-200">CUT {slide.cut}</span>
                              <input
                                value={ui.finalVideo.subtitleKeywordsByCut[slide.cut] || ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setUi((prev: any) => ({
                                    ...prev,
                                    finalVideo: {
                                      ...prev.finalVideo,
                                      subtitleKeywordsByCut: {
                                        ...prev.finalVideo.subtitleKeywordsByCut,
                                        [slide.cut]: value,
                                      },
                                    },
                                  }));
                                }}
                                placeholder="컷 전용 키워드"
                                className="flex-1 bg-slate-800 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] text-white outline-none"
                              />
                            </div>
                          ))}
                        </div>
                      )}
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

              <div className="grid grid-cols-2 gap-3">
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
                      const a = document.createElement('a');
                      a.href = ui.finalVideo.url;
                      a.download = ui.finalVideo.outputFormat === 'mp4' ? 'final_slide_video.mp4' : 'final_slide_video.webm';
                      a.click();
                      return;
                    }
                    if (!ui.finalVideo.url) return alert('생성되거나 업로드된 영상이 없습니다.');
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={handleDownloadSrt}
                    disabled={ui.finalVideo.slides.length === 0}
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
            </div>

            <div className="bg-black/40 border border-white/5 rounded-[2rem] p-6 flex flex-col items-center justify-center text-center space-y-4">
              {ui.finalVideo.url ? (
                <div className="w-full bg-black rounded-2xl overflow-hidden relative border border-white/10" style={{ aspectRatio: ratioToCss(ui.cuts.ratio || '16:9') }}>
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
                </div>
              ) : ui.finalVideo.type === 'image_slide' && ui.finalVideo.slides.length > 0 ? (
                <div className="w-full space-y-3">
                  <div className="w-full bg-black rounded-2xl overflow-hidden relative border border-white/10" style={{ aspectRatio: ratioToCss(ui.cuts.ratio || '16:9') }}>
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
                        className={`absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-[86%] px-4 py-2 rounded-xl border border-white/15 ${ui.finalVideo.subtitlePreset === 'shorts' ? 'bg-black/55' : ui.finalVideo.subtitlePreset === 'docu' ? 'bg-slate-950/70' : 'bg-slate-900/65'}`}
                        style={{ top: `${gridPositionToPercent(ui.finalVideo.subtitleGridPosition)}%` }}
                      >
                        <p className={`text-xs font-black leading-snug drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)] line-clamp-2 ${ui.finalVideo.subtitlePreset === 'shorts' ? 'text-white' : ui.finalVideo.subtitlePreset === 'docu' ? 'text-slate-100' : 'text-white'}`}>
                          {ui.cuts.items[(ui.finalVideo.slides[ui.finalVideo.activeSlide]?.cut || 1) - 1] || ''}
                        </p>
                      </div>
                    )}
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
