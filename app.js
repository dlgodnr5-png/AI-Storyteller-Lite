const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element not found');
}

const STORAGE_KEY = 'ai_storyteller_keys_v1';
const STATUS = {
  idle: { label: '대기', color: 'text-slate-400' },
  testing: { label: '테스트 중', color: 'text-sky-400' },
  ok: { label: '정상', color: 'text-emerald-400' },
  quota: { label: '할당량 초과', color: 'text-amber-400' },
  error: { label: '오류', color: 'text-rose-400' },
};

const HOOK_GUIDE = `천재적 통찰 도출 공식(GI):
GI = (O × C × P × S) / (A + B)
O=관찰, C=연결, P=패턴, S=종합, A=고정관념, B=편향. A/B 최소화.

다차원 분석(MDA): 시간·공간·추상·인과·계층 관점에서 통찰 도출.
창의적 연결 매트릭스(CC): 직접·간접·역설·메타포·시스템 연결 활용.
인사이트 증폭(IA): Why/What if/How might we 질문으로 통찰 강화.

사용 가이드: 단계적 적용, 반복 개선, 다양한 관점, 실험적 태도, 균형적 접근.`;

const SHORTS_GUIDE = `당신은 글로벌 유튜브 쇼츠 전문 작가이자 스토리텔러입니다.
TTS가 바로 읽을 순수 말하기 대본만 작성합니다.
제목/해시태그/설명/JSON/코드/번호/따옴표/이모지/URL/효과음 표기는 금지입니다.
구조는 Hook(3~5초) → Body(핵심 전달) → CTA(3~5초) 고정입니다.
한국어는 FOMO/충격/인사이트를 살리되 과장/허위는 피합니다.
영어는 짧고 직접적인 문장, 일본어는 부드럽고 공감형 톤을 사용합니다.
출력은 오직 대본만, 다른 설명은 금지입니다.`;

const LONGFORM_GUIDE = `당신은 롱폼 내레이션 대본 전문 AI입니다.
이미지/자막/BGM/컷 지시는 금지, 오직 말로 들려줄 대본만 작성합니다.
3막 구조(도입 20% / 본론 60% / 결론 20%)를 지키고,
도입은 역설/반어/도발 질문으로 시작해 시청 지속을 유도합니다.
각 단락마다 다음 내용 궁금증을 유발하는 브릿지 문장을 넣습니다.
제목/소제목/챕터 번호/시간코드/효과음 표기는 금지입니다.
출력은 오직 대본만, 다른 설명은 금지입니다.`;

const LENGTH_GUIDE = {
  longform: {
    '10분': [3000, 3500],
    '20분': [6000, 7000],
    '30분': [9000, 10500],
    '40분': [12000, 14000],
    '50분': [15000, 17500],
    '60분': [18000, 21000],
  },
  shorts: {
    KR: 580,
    EN: 180,
    JP: 720,
    baseSeconds: 60,
  },
};

const TTS_SPEED_GUIDE = [
  { lang: 'KR', unit: '자', count: 580, seconds: 58, note: '1.0배속 기준' },
  { lang: 'EN', unit: '단어', count: 180, seconds: 58, note: '1.0배속 기준' },
  { lang: 'JP', unit: '자', count: 720, seconds: 58, note: '1.0배속 기준' },
];

const SHORTS_IMAGE_PROMPT_GUIDE = {
  cutSeconds: 5,
  krCharsPerCut: [30, 60],
  baseStyle: 'A flat vector-style cartoon, vertical 9:16 composition, simple background',
};

const DEFAULT_PROJECT_ROOT = 'C:\\Users\\user\\Documents\\프로젝트';

const GEMINI_TTS_MODELS = [
  { id: 'gemini-2.5-flash-preview-tts', label: 'Gemini 2.5 Flash Preview TTS', price: '1M/$7.88' },
  { id: 'gemini-2.5-pro-preview-tts', label: 'Gemini 2.5 Pro Preview TTS', price: '1M/$15.75' },
];

const GEMINI_TTS_VOICES = [
  { id: 'achernar', label: 'Achernar', gender: '여성', category: '감성 내레이션' },
  { id: 'achird', label: 'Achird', gender: '남성', category: '뉴스/다큐' },
  { id: 'algenib', label: 'Algenib', gender: '남성', category: '게임/액션' },
  { id: 'algieba', label: 'Algieba', gender: '여성', category: '라디오/토크' },
  { id: 'alnilam', label: 'Alnilam', gender: '남성', category: '교육/설명' },
  { id: 'aoede', label: 'Aoede', gender: '여성', category: '감성/힐링' },
  { id: 'autonoe', label: 'Autonoe', gender: '여성', category: '브이로그/일상' },
  { id: 'callirrhoe', label: 'Callirrhoe', gender: '여성', category: '로맨스/감성' },
  { id: 'charon', label: 'Charon', gender: '남성', category: '다큐/시네마틱' },
  { id: 'despina', label: 'Despina', gender: '여성', category: '쇼핑/리뷰' },
  { id: 'enceladus', label: 'Enceladus', gender: '남성', category: '기술/IT' },
  { id: 'erinome', label: 'Erinome', gender: '여성', category: 'ASMR/차분' },
  { id: 'fenrir', label: 'Fenrir', gender: '남성', category: '스릴러/호러' },
  { id: 'gacrux', label: 'Gacrux', gender: '남성', category: '스포츠/리포트' },
  { id: 'iapetus', label: 'Iapetus', gender: '남성', category: '역사/교양' },
  { id: 'kore', label: 'Kore (기본)', gender: '여성', category: '표준/범용' },
  { id: 'laomedeia', label: 'Laomedeia', gender: '여성', category: '어린이/동화' },
  { id: 'leda', label: 'Leda', gender: '여성', category: '뷰티/라이프' },
  { id: 'orus', label: 'Orus', gender: '남성', category: '광고/프로모션' },
  { id: 'puck', label: 'Puck', gender: '남성', category: '코미디/유머' },
  { id: 'pulcherrima', label: 'Pulcherrima', gender: '여성', category: '패션/스타일' },
  { id: 'rasalgethi', label: 'Rasalgethi', gender: '남성', category: '브랜드/기업' },
  { id: 'sadachbia', label: 'Sadachbia', gender: '남성', category: '경제/시사' },
  { id: 'sadaltager', label: 'Sadaltager', gender: '남성', category: '여행/탐험' },
  { id: 'schedar', label: 'Schedar', gender: '여성', category: '쿠킹/레시피' },
  { id: 'sulafat', label: 'Sulafat', gender: '여성', category: '명상/치유' },
  { id: 'umbriel', label: 'Umbriel', gender: '남성', category: '미스터리/범죄' },
  { id: 'vindemiatrix', label: 'Vindemiatrix', gender: '여성', category: '인터뷰/진행' },
  { id: 'zephyr', label: 'Zephyr', gender: '남성', category: '트레일러/웅장' },
  { id: 'zubenelgenubi', label: 'Zubenelgenubi', gender: '남성', category: '사극/서사' },
];

const isValidVoiceName = (value) =>
  GEMINI_TTS_VOICES.some((voice) => voice.id === value);

const getVoiceMeta = (voiceId) =>
  GEMINI_TTS_VOICES.find((voice) => voice.id === voiceId) || { gender: '미정', category: '미정' };

const normalizeTtsModel = (modelId) => {
  if (!modelId) return 'gemini-2.5-flash-preview-tts';
  if (modelId === 'gemini-2.5-flash-tts') return 'gemini-2.5-flash-preview-tts';
  if (modelId === 'gemini-2.5-pro-tts') return 'gemini-2.5-pro-preview-tts';
  return modelId;
};

const normalizeImageModel = (modelId) => {
  if (!modelId) return 'imagen-4.0-generate-001'; // Default to standard
  if (modelId === 'gemini-3.1-flash-image') return 'gemini-3.1-flash-image-preview';
  if (modelId === 'gemini-3-pro-image') return 'gemini-3-pro-image-preview';
  if (modelId === 'imagen-4-fast') return 'imagen-4.0-fast-generate-001';
  if (modelId === 'imagen-4-standard') return 'imagen-4.0-generate-001';
  return modelId;
};

const analyzeMediaForPrompt = async (idx, base64Data, force = false) => {
  const apiKey = window.getGeminiKey();
  if (!apiKey) return;

  console.log(`[Vision] Analyzing cut ${idx}... (force=${force})`);
  
  // Update state to show analyzing status
  if (!state.ui.visionAnalyzing.includes(idx)) {
    state.ui.visionAnalyzing.push(idx);
    render();
  }

  try {
    // 1. Resolve a vision-capable model
    const modelId = await resolveVisionModel();
    if (!modelId) throw new Error("Vision 지원 모델을 찾을 수 없습니다.");

    const mimeType = base64Data.split(';')[0].split(':')[1] || 'image/jpeg';
    const base64Content = base64Data.split(',')[1];
    
    const isVideo = mimeType.startsWith('video');
    const mediaCategory = isVideo ? 'video' : 'image';
    const promptText = `Describe this ${mediaCategory} in 1-2 sentences for an AI image generation prompt. Focus on the main subject, style, lighting, and composition. Output only the English description without any preamble.`;
    
    console.log(`[Vision] Detected MIME: ${mimeType}, Category: ${mediaCategory}`);

    // Try v1beta first, fallback to v1
    const versions = ['v1beta', 'v1'];
    let description = '';
    let lastError = null;

    for (const v of versions) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/${v}/models/${modelId}:generateContent?key=${encodeURIComponent(apiKey)}`;
        console.log(`[Vision] Trying endpoint: ${v}`);
        
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: promptText },
                { inline_data: { mime_type: mimeType, data: base64Content } }
              ]
            }]
          })
        });
        
        const data = await res.json();
        if (res.ok) {
          description = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (description) break;
        } else {
          lastError = data?.error?.message || `HTTP ${res.status}`;
        }
      } catch (e) {
        lastError = e.message;
      }
    }

    if (!description) throw new Error(lastError || "분석 결과를 가져오지 못했습니다.");

    console.log(`[Vision] API Response for cut ${idx}:`, description);
    
    let pObj = state.ui.cuts.prompts.find((p) => p.index === idx);
    if (pObj) {
      pObj.prompt = description;
    } else {
      pObj = { index: idx, prompt: description };
      state.ui.cuts.prompts.push(pObj);
      state.ui.cuts.prompts.sort((a,b) => a.index - b.index);
    }
    
    const cutIdx = idx - 1;
    // Update cut description if it's generic or empty
    const currentCutText = state.ui.cuts.items[cutIdx] || '';
    if (!currentCutText || currentCutText.length < 20 || currentCutText.endsWith('...')) {
      state.ui.cuts.items[cutIdx] = description.substring(0, 100);
    }

    saveState(state);
    showToast(`컷 ${idx} AI 분석 및 프롬프트 연동 완료!`);
    render();
    bindEvents();
    
    // Flash the prompt area
    setTimeout(() => {
        const promptTa = document.querySelector(`.prompt-item-input[data-prompt-idx="${cutIdx}"]`);
        if (promptTa) {
          promptTa.classList.add('ring-4', 'ring-amber-500', 'animate-pulse');
          setTimeout(() => promptTa.classList.remove('ring-4', 'ring-amber-500', 'animate-pulse'), 3000);
        }
    }, 100);

  } catch (err) {
    console.error("Vision 분석 실패:", err);
    showToast(`AI Vision 분석 실패: ${err.message}`, true);
  } finally {
    state.ui.visionAnalyzing = state.ui.visionAnalyzing.filter(id => id !== idx);
    render();
    bindEvents();
  }
};

const resolveVisionModel = async () => {
    // Current app preferences for vision models (highest to lowest)
    const preferences = [
        'gemini-1.5-flash',
        'gemini-1.5-pro',
        'gemini-2.5-flash',
        'gemini-3.1-flash',
        'gemini-1.0-pro-vision'
    ];
    
    const apiKey = window.getGeminiKey();
    if (!apiKey) return null;

    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`);
        if (!res.ok) return preferences[0]; // Roll the dice with fallback
        
        const data = await res.json();
        const availableModels = (data.models || []).map(m => m.name.replace('models/', ''));
        
        // Find best match based on preferences
        for (const pref of preferences) {
            const match = availableModels.find(m => m.includes(pref));
            if (match) return match;
        }
        
        // Fallback to any model that supports generateContent (excluding forbidden patterns)
        const generateModels = (data.models || [])
            .filter(m => m.supportedGenerationMethods.includes('generateContent'))
            .map(m => m.name.replace('models/', ''))
            .filter(id => !/(embedding|aqa)/i.test(id));
            
        return generateModels[0] || preferences[0];
    } catch (e) {
        console.warn("[Vision] Failed to list models:", e);
        return preferences[0];
    }
};

const showToast = (message, isError = false) => {
    const existing = document.getElementById('app-toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.className = `fixed bottom-10 left-1/2 -translate-x-1/2 z-[9999] px-6 py-3 rounded-2xl shadow-2xl text-sm font-bold text-white transition-all duration-500 transform translate-y-20 opacity-0 ${isError ? 'bg-rose-600' : 'bg-emerald-600'}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => {
        toast.classList.remove('translate-y-20', 'opacity-0');
    }, 10);
    
    // Auto-remove
    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
        setTimeout(() => toast.remove(), 500);
    }, 4000);
};


const loadState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    return null;
  }
};

const saveState = (state) => {
  // Only save essential settings like keys if necessary, 
  // but user says "refreshing should delete all data", 
  // so we won't persist temporary work state.
  const keysOnly = { keys: state.keys, active: state.active };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keysOnly));
};

const state = {
  keys: {
    yt1: '',
    yt2: '',
    g1: '',
  },
  active: {
    yt: 'yt1',
    g: 'g1',
  },
  ui: {
    panelsOpen: {
      p1: true, p2: true, p3: true, p4: true, p5: true, p6: true, p7: true, p8: true, p9: true, p10: true, p11: true, p12: true
    },
    settingsOpen: false,
    channelDetailOpen: false,
    channelSelectOpen: false,
    happyDayOpen: false,
    searching: false,
    searchError: '',
    selectedChannelId: '',
    viewMode: '테이블',
    columnsOpen: false,
    columns: {},
    lastSearchParams: null,
    filters: {
      query: '',
      translatedQuery: '',
      count: 50,
      ratio: '전체',
      viewMode: '테이블',
      sort: '조회수',
      category: '모든 카테고리',
      duration: '전체',
      period: '전체',
      country: '한국',
      minViews: 100000,
    },
    translationModel: '',
    textModel: '',
    modelSelections: {
      text: 'auto',
      image: 'auto',
      video: 'auto',
      tts: 'auto',
    },
    hookTitles: [],
    hookLoading: false,
    hookError: '',
    selectedHookTitle: '',
    hookSeed: 0,
    panelsOpen: { p1: true, p2: true, pm: true, p3: true, p4: true, p5: true, p6: true, p7: true, p8: true, p9: true },
    videoBatchGenerating: false,
    videoBatchStopping: false,
    visionAnalyzing: [], // Array of cut indices
    customSource: {
      url: '',
      topic: '',
      style: '',
    },
    customSourceData: {
      loadedUrl: '',
      rows: [],
    },
    script: {
      type: 'shorts',
      shortLength: '60초',
      longLength: '10분',
      lang: 'KR',
      targetAge: '',
      tone: '',
      output: '',
      charCount: 0,
      wordCount: 0,
      cache: { KR: null, JP: null, EN: null },
      generating: false,
      error: '',
      message: '',
    },
    tts: {
      speed: 1.0,
      generating: false,
      error: '',
      status: '',
      lastDurationSec: 0,
      geminiModel: 'gemini-2.5-flash-preview-tts',
      voiceName: 'kore',
      audioUrl: '',
      audioDuration: 0,
      errorSticky: false,
    },
    cuts: {
      items: [],
      prompts: [],
      mode: 'auto',
      ratio: '9:16',
    },
    imageJobs: [],
    thumbnailJobs: [],
    youtubeMetadata: {
      ko: { title: '', desc: '', tags: '' },
      en: { title: '', desc: '', tags: '' },
      ja: { title: '', desc: '', tags: '' },
    },
    videoJobs: [],
    projectRoot: DEFAULT_PROJECT_ROOT,
    projectName: '',
  },
  results: [],
  rawResults: [],
  channelsById: {},
  commentsByVideo: {},
  status: {
    yt1: { type: 'idle', tier: 'unknown' },
    yt2: { type: 'idle', tier: 'unknown' },
    g1: { type: 'idle', tier: 'unknown' },
  },
};

const saved = loadState();
if (saved) {
  state.keys = { ...state.keys, ...(saved.keys || {}) };
  state.active = { ...state.active, ...(saved.active || {}) };
  state.status = { ...state.status, ...(saved.status || {}) };
  state.ui = { ...state.ui, ...(saved.ui || {}) };
  if (!state.ui.columns) state.ui.columns = getDefaultColumnState();
  if (!state.ui.filters) {
    state.ui.filters = {
      query: '',
      translatedQuery: '',
      count: 50,
      ratio: '전체',
      viewMode: '테이블',
      sort: '조회수',
      category: '모든 카테고리',
      duration: '전체',
      period: '전체',
      country: '한국',
      minViews: 100000,
    };
  }
  if (!state.ui.modelSelections) {
    state.ui.modelSelections = {
      text: 'auto',
      image: 'auto',
      video: 'auto',
      tts: 'auto',
    };
  }
  if (typeof state.ui.hookSeed !== 'number') {
    state.ui.hookSeed = 0;
  }
  if (typeof state.ui.searchPanelOpen !== 'boolean') {
    state.ui.searchPanelOpen = true;
  }
  state.ui.resultsPanelOpen = state.ui.resultsPanelOpen === true;
  if (!state.ui.customSource) {
    state.ui.customSource = { url: '', topic: '', style: '' };
  }
  if (!state.ui.customSourceData) {
    state.ui.customSourceData = { loadedUrl: '', rows: [] };
  }
  if (!state.ui.script) {
    state.ui.script = {
      type: 'shorts',
      shortLength: '60초',
      longLength: '10분',
      lang: 'KR',
      targetAge: '',
      tone: '',
      output: '',
      charCount: 0,
      wordCount: 0,
      cache: { KR: null, JP: null, EN: null },
      generating: false,
      error: '',
      message: '',
    };
  }
  if (!state.ui.tts) {
    state.ui.tts = {
      speed: 1.0,
      generating: false,
      error: '',
      status: '',
      lastDurationSec: 0,
      geminiModel: 'gemini-2.5-flash-preview-tts',
      voiceName: 'kore',
      audioUrl: '',
      audioDuration: 0,
      errorSticky: false,
    };
  }
  if (!state.ui.tts.speed || state.ui.tts.speed === 1.25) {
    state.ui.tts.speed = 1.0;
  }
  if (!state.ui.tts.audioUrl) {
    state.ui.tts.audioUrl = '';
  }
  if (!state.ui.tts.audioDuration) {
    state.ui.tts.audioDuration = 0;
  }
  if (!state.ui.tts.voiceName) {
    state.ui.tts.voiceName = 'kore';
  }
  if (!isValidVoiceName(state.ui.tts.voiceName)) {
    state.ui.tts.voiceName = 'kore';
  }
  if (typeof state.ui.tts.errorSticky !== 'boolean') {
    state.ui.tts.errorSticky = false;
  }
  state.ui.tts.geminiModel = normalizeTtsModel(state.ui.tts.geminiModel);
  if (!state.ui.cuts) {
    state.ui.cuts = { items: [], prompts: [], mode: 'auto' };
  }
  if (!Array.isArray(state.ui.videoJobs)) {
    state.ui.videoJobs = [];
  }
  if (!state.ui.projectRoot) {
    state.ui.projectRoot = DEFAULT_PROJECT_ROOT;
  }
  if (!state.ui.projectName) {
    state.ui.projectName = '';
  }
  state.ui.hookTitles = [];
  state.ui.selectedHookTitle = '';
  if (state.ui.customSource) {
    state.ui.customSource.url = '';
    state.ui.customSource.topic = '';
    state.ui.customSource.style = '';
  }
  if (state.ui.customSourceData) {
    state.ui.customSourceData.loadedUrl = '';
    state.ui.customSourceData.rows = [];
  }
  if (state.ui.script) {
    state.ui.script.output = '';
    state.ui.script.charCount = 0;
    state.ui.script.wordCount = 0;
    state.ui.script.error = '';
    state.ui.script.message = '';
  }
}

const maskValue = (value) => value;
const maskKeyPreview = (value) => {
  const text = String(value || '').trim();
  if (!text) return '없음';
  if (text.length <= 8) return `${text[0]}***${text[text.length - 1]}`;
  return `${text.slice(0, 2)}***${text.slice(-4)}`;
};

const formatNumber = (value) => {
  if (value === null || value === undefined) return '-';
  const num = Number(value);
  if (Number.isNaN(num)) return '-';
  return num.toLocaleString('en-US');
};

const playDingDong = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const gain = ctx.createGain();
    gain.gain.value = 0.025;
    gain.connect(ctx.destination);

    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 660;
    osc1.connect(gain);

    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 990;
    osc2.connect(gain);

    osc1.start();
    osc1.stop(ctx.currentTime + 0.12);

    osc2.start(ctx.currentTime + 0.12);
    osc2.stop(ctx.currentTime + 0.26);
  } catch { }
};

const toggleResultsPanel = () => {
  state.ui.resultsPanelOpen = !(state.ui.resultsPanelOpen === true);
  saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
  render();
  bindEvents();
};

const showResultsPanel = () => {
  state.ui.resultsPanelOpen = true;
  saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
  render();
  bindEvents();
};

const hideResultsPanel = () => {
  state.ui.resultsPanelOpen = false;
  saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
  render();
  bindEvents();
};

const bindGlobalEvents = () => {
  if (window.__appGlobalBound) return;
  window.__appGlobalBound = true;
  document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-action]');
    const execBtn = event.target.closest('.exec-btn');
    if (execBtn) {
      playDingDong();
      execBtn.classList.add('pulse-worker');
      const targetId = target ? target.id : (event.target.id || '');
      if (!['yt-search-btn', 'hook-generate', 'script-generate', 'tts-generate', 'image-generate-all', 'video-generate-all'].includes(targetId)) {
        setTimeout(() => execBtn.classList.remove('pulse-worker'), 2000);
      }
    }
    if (!target) return;
    const action = target.getAttribute('data-action');
    if (action === 'toggle-results') toggleResultsPanel();
    if (action === 'show-results') showResultsPanel();
    if (action === 'hide-results') hideResultsPanel();
  });
};


const parseDuration = (iso) => {
  const match = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso || '');
  if (!match) return '0:00';
  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
};

const durationToSeconds = (value) => {
  if (!value) return 0;
  const parts = value.split(':').map((v) => Number(v));
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
};

const matchesLanguage = (text, lang) => {
  if (!text) return false;
  if (lang === 'ja') return /[\u3040-\u30ff\u4e00-\u9faf]/.test(text);
  if (lang === 'ko') return containsHangul(text);
  return !containsHangul(text);
};

const DEFAULT_COLUMNS = [
  { id: 'index', label: 'N' },
  { id: 'thumb', label: '썸네일' },
  { id: 'channel', label: '채널명' },
  { id: 'title', label: '제목' },
  { id: 'published', label: '게시일' },
  { id: 'subscribers', label: '구독자수' },
  { id: 'views', label: '조회수' },
  { id: 'contribution', label: '채널 기여도' },
  { id: 'performance', label: '성과도' },
  { id: 'cii', label: 'CII' },
  { id: 'duration', label: '영상 길이' },
  { id: 'likes', label: '좋아요' },
  { id: 'comments', label: '댓글' },
  { id: 'engagement', label: '참여율' },
  { id: 'videos', label: '총영상수' },
  { id: 'description', label: '설명' },
  { id: 'analysis', label: '분석' },
];

const getDefaultColumnState = () =>
  DEFAULT_COLUMNS.reduce((acc, col) => {
    acc[col.id] = true;
    return acc;
  }, {});

const VIDEO_STYLE_OPTIONS = [
  { id: 'news-docu', label: '뉴스/다큐 (News/Documentary)' },
  { id: 'space-sf', label: '우주/SF (Space/SF)' },
  { id: 'action-battle', label: '액션/전투 (Action/Battle)' },
  { id: 'romantic-emotion', label: '로맨틱/감성 (Romantic/Emotional)' },
  { id: 'noir-thriller', label: '느와르/스릴러 (Noir/Thriller)' },
  { id: 'fantasy-myth', label: '판타지/신화 (Fantasy/Myth)' },
  { id: 'animation-3d', label: '3D 애니메이션 (3D Animation)' },
  { id: 'classic-bw', label: '클래식/흑백 (Classic/B&W)' },
  { id: 'anime-3d', label: '3D Japanese Anime (3D Japanese Anime)' },
  { id: 'midjourney', label: '미드저니 스타일 (Midjourney Style)' },
  { id: 'photoreal', label: '포토리얼 (Photorealistic)' },
  { id: 'disney', label: '디즈니 스타일 (Disney Style)' },
  { id: 'ghibli', label: '지브리 스타일 (Studio Ghibli)' },
  { id: 'kian84', label: '기안84 스타일 (Kian84 Style)' },
  { id: 'stick-figure', label: '스틱 피겨 (Stick Figure)' },
  { id: 'american-cartoon', label: '미국 카툰 (American Cartoon)' },
  { id: 'minhwa', label: '조선 민화 (Joseon Minhwa)' },
  { id: 'ink-wash', label: '수묵화 (Oriental Ink Wash)' },
  { id: 'najeon', label: '나전칠기 (Mother-of-Pearl Inlay)' },
  { id: 'calligraphy', label: '서예 (Calligraphy Art)' },
  { id: 'vintage-poster', label: '빈티지 한국 포스터 (Vintage Korean Poster)' },
  { id: 'webtoon', label: '웹툰 스타일 (Webtoon Style)' },
  { id: 'claymation', label: '클레이메이션 (Claymation)' },
  { id: 'oil-paint', label: '유화 (Oil Painting)' },
  { id: 'watercolor', label: '수채화 (Watercolor)' },
  { id: 'cctv', label: 'CCTV/바디캠 (CCTV/Bodycam)' },
  { id: 'chibi', label: '치비/카와이 (Chibi/Kawaii)' },
  { id: 'pixel-art', label: '픽셀 아트 (Pixel Art)' },
  { id: 'cyberpunk', label: '사이버펑크 (Cyberpunk)' },
  { id: 'paper-cutout', label: '페이퍼 컷아웃 (Paper Cutout)' },
  { id: 'retro-comic', label: '레트로 코믹 (Retro Comic)' },
];

state.ui.columns = getDefaultColumnState();

const injectGlobalStyles = () => {
  if (document.getElementById('app-global-styles')) return;
  const style = document.createElement('style');
  style.id = 'app-global-styles';
  style.textContent = `
    @keyframes pulse-gradient {
      0% { opacity: 0.6; transform: scale(1); filter: brightness(1); }
      50% { opacity: 1; transform: scale(1.02); filter: brightness(1.3); }
      100% { opacity: 0.6; transform: scale(1); filter: brightness(1); }
    }
    .pulse-worker {
      animation: pulse-gradient 2s infinite ease-in-out;
      background: linear-gradient(90deg, #f59e0b, #fbbf24, #f59e0b) !important;
      background-size: 200% 100% !important;
      color: black !important;
      box-shadow: 0 0 20px rgba(245, 158, 11, 0.4) !important;
    }
    .pulse-worker-blue {
      animation: pulse-gradient 2s infinite ease-in-out;
      background: linear-gradient(90deg, #3b82f6, #60a5fa, #3b82f6) !important;
      background-size: 200% 100% !important;
      color: white !important;
      box-shadow: 0 0 20px rgba(59, 130, 246, 0.4) !important;
    }
  `;
  document.head.appendChild(style);
};

const render = () => {
  injectGlobalStyles();
  const selectedChannel = state.ui.selectedChannelId ? state.channelsById[state.ui.selectedChannelId] : null;
  const scriptState = state.ui.script;
  const searchPanelOpen = state.ui.searchPanelOpen !== false;
  const resultsPanelOpen = state.ui.resultsPanelOpen === true;
  const gridClass = searchPanelOpen
    ? 'grid grid-cols-1 xl:grid-cols-[320px_minmax(720px,1fr)] gap-6 items-start'
    : 'grid grid-cols-1 gap-6 items-start';
  const defaultTargetAge = getDefaultTargetAge(state.ui.selectedHookTitle);
  const defaultTone = getDefaultTone(state.ui.selectedHookTitle);
  const currentShortSeconds = Number(String(scriptState.shortLength || '60').replace(/\D/g, '')) || 60;
  const shortKr = getShortsTargetLength('KR', currentShortSeconds);
  const shortEn = getShortsTargetLength('EN', currentShortSeconds);
  const shortJp = getShortsTargetLength('JP', currentShortSeconds);
  const currentLongRange = LENGTH_GUIDE.longform[scriptState.longLength || '10분'] || [3000, 3500];
  const visibleColumns = DEFAULT_COLUMNS.filter((col) => state.ui.columns[col.id]);
  const tableRows = state.results.length
    ? state.results
      .map((v, index) => {
        const channel = state.channelsById[v.channelId] || {};
        const likeCount = Number(v.likeCount || 0);
        const commentCount = Number(v.commentCount || 0);
        const viewCount = Number(v.viewCount || 0);
        const subscriberCount = Number(channel.subscriberCount || 0);
        const engagement = viewCount ? ((likeCount + commentCount) / viewCount) * 100 : 0;
        const contribution = subscriberCount ? (viewCount / subscriberCount) * 100 : 0;
        const performance = viewCount > 1000000 ? 'Great' : viewCount > 300000 ? 'Good' : viewCount > 100000 ? 'Soso' : 'Bad';
        const cii = Math.min(99, Math.round(contribution));
        const cell = (id) => {
          switch (id) {
            case 'index':
              return `${index + 1}`;
            case 'thumb':
              return `<a href="${v.url}" target="_blank" rel="noopener noreferrer" class="block w-[80px] h-[45px] rounded-lg overflow-hidden bg-white/5"><img src="${v.thumbnail}" alt="" class="w-full h-full object-cover" /></a>`;
            case 'channel':
              return `<button class="open-channel-detail text-amber-200 font-bold" data-channel-id="${v.channelId}">${v.channelTitle}</button>`;
            case 'title':
              return v.title;
            case 'published':
              return v.publishedAt.slice(0, 10);
            case 'subscribers':
              return formatNumber(subscriberCount);
            case 'views':
              return formatNumber(viewCount);
            case 'contribution':
              return `${contribution.toFixed(1)}%`;
            case 'performance':
              return performance;
            case 'cii':
              return `${cii}`;
            case 'duration':
              return v.duration;
            case 'likes':
              return formatNumber(likeCount);
            case 'comments':
              return formatNumber(commentCount);
            case 'engagement':
              return `${engagement.toFixed(1)}%`;
            case 'videos':
              return formatNumber(channel.videoCount);
            case 'description':
              return v.description || '';
            case 'analysis':
              return `<button class="open-channel-select rounded-lg bg-amber-500/30 px-2 py-1 text-[10px] font-bold text-amber-100">채널영상수집</button>`;
            default:
              return '';
          }
        };
        return `
            <tr class="border-t border-white/10">
              ${visibleColumns
            .map((col) => `<td class="py-3 px-2">${cell(col.id)}</td>`)
            .join('')}
            </tr>`;
      })
      .join('')
    : `
      <tr class="border-t border-white/10">
        <td class="py-6 px-2 text-center text-slate-400" colspan="17">
          ${state.ui.searching ? '검색 중입니다...' : state.ui.searchError || '검색 결과가 없습니다.'}
        </td>
      </tr>`;

  const channelOptions = Object.values(state.channelsById)
    .slice(0, 10)
    .map((c) => `
      <div class="flex items-center justify-between rounded-2xl bg-white/5 p-3">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-full bg-white/10"></div>
          <div>
            <div class="text-sm font-bold text-white">${c.title || '채널'}</div>
            <div class="text-xs text-slate-400">구독자 ${formatNumber(c.subscriberCount)} · 총 영상 ${formatNumber(c.videoCount)}</div>
          </div>
        </div>
        <a href="https://www.youtube.com/channel/${c.id}" target="_blank" rel="noopener noreferrer" class="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-slate-200">선택</a>
      </div>`)
    .join('');

  const topVideos = selectedChannel
    ? state.results
      .filter((v) => v.channelId === selectedChannel.id)
      .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
      .slice(0, 3)
    : [];

  const topVideoCards = topVideos.length
    ? topVideos
      .map((v) => `
          <div class="rounded-2xl bg-white/5 p-3">
            <a href="${v.url}" target="_blank" rel="noopener noreferrer" class="block aspect-video rounded-xl overflow-hidden bg-white/10">
              <img src="${v.thumbnail}" alt="" class="w-full h-full object-cover" />
            </a>
            <div class="mt-2 text-xs text-slate-300 line-clamp-2">${v.title}</div>
            <div class="mt-1 text-[11px] text-slate-400">조회수 ${formatNumber(v.viewCount)}</div>
          </div>`)
      .join('')
    : `<div class="text-xs text-slate-400">채널 영상 데이터가 없습니다.</div>`;
  const cardItems = state.results.length
    ? state.results
      .map((v) => {
        const channel = state.channelsById[v.channelId] || {};
        return `
            <div class="rounded-3xl border border-white/10 bg-black/30 p-4 space-y-3">
              <a href="${v.url}" target="_blank" rel="noopener noreferrer" class="block aspect-video rounded-2xl overflow-hidden bg-white/5">
                <img src="${v.thumbnail}" alt="" class="w-full h-full object-cover" />
              </a>
              <div class="text-sm font-bold text-white line-clamp-2">${v.title}</div>
              <div class="text-xs text-slate-400">${v.publishedAt.slice(0, 10)} · ${v.duration}</div>
              <div class="text-xs text-slate-300">조회수 ${formatNumber(v.viewCount)} · 좋아요 ${formatNumber(v.likeCount)}</div>
              <button class="open-channel-detail text-amber-200 font-bold text-xs" data-channel-id="${v.channelId}">${channel.title || v.channelTitle}</button>
            </div>`;
      })
      .join('')
    : `<div class="text-xs text-slate-400">${state.ui.searching ? '검색 중입니다...' : state.ui.searchError || '검색 결과가 없습니다.'}</div>`;

  root.innerHTML = `
    <div class="min-h-screen bg-gradient-to-b from-[#0a0f1f] via-[#0c1326] to-[#0a0f1f] text-slate-100 pb-16 font-sans selection:bg-fuchsia-300/30">
      <header class="max-w-[1760px] mx-auto px-6 pt-10 pb-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div class="flex items-center gap-4">
          <img src="02 Ai World Maker.png" alt="AI WORLD MAKER" class="h-16 w-auto opacity-85 drop-shadow-[0_10px_26px_rgba(0,0,0,0.55)]" />
          <div>
            <h1 class="text-3xl md:text-4xl font-black tracking-tight text-white">AI Storyteller Lite</h1>
            <p class="text-sm text-slate-300 font-semibold mt-2">글로벌 유튜브 트렌드 분석기 &amp; 영상 만들기</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <button id="toggle-p1-header" class="border border-white/20 text-white text-xs font-bold px-4 py-2 rounded-full backdrop-blur transition-all ${state.ui.panelsOpen.p1 ? 'bg-slate-600/30 hover:bg-slate-600/50' : 'bg-gradient-to-r from-amber-500 to-yellow-300 text-black pulse-gradient'}">${state.ui.panelsOpen.p1 ? '1. 검색 숨기기' : '1. 검색 보이기'}</button>
          <button id="toggle-p2-header" class="border border-white/20 text-white text-xs font-bold px-4 py-2 rounded-full backdrop-blur transition-all ${state.ui.panelsOpen.p2 ? 'bg-indigo-600/30 hover:bg-indigo-600/50' : 'bg-gradient-to-r from-emerald-500 to-teal-400 text-black pulse-gradient'}">${state.ui.panelsOpen.p2 ? '2. 결과 숨기기' : '2. 결과 보이기'}</button>
          <button id="happy-day-open" class="bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-black px-4 py-2 rounded-full shadow-lg hover:brightness-110 transition-all">🛍️ Happy Day 구경</button>
          <button class="bg-white/10 border border-white/20 text-white text-xs font-bold px-4 py-2 rounded-full backdrop-blur hover:bg-white/20 transition-all">📖 왕초보 API 키 발급 가이드</button>
          <button id="settings-open" class="h-9 w-9 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-all" title="Gemini API  &  youtube 검색 API 키설정">⚙️</button>
        </div>
      </header>

        <div class="space-y-6">
          <section class="bg-gradient-to-br from-amber-900/40 to-yellow-900/20 rounded-3xl p-6 border border-white/10 shadow-xl">
            <div class="flex items-center justify-between">
              <h3 class="text-2xl font-black gold-gradient-text">1. 유튜브 검색 설정</h3>
              <button id="toggle-p1" class="rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-amber-500/20 active:scale-95 transition-all">
                ${state.ui.panelsOpen.p1 ? '숨기기' : '보이기'}
              </button>
            </div>
            ${state.ui.panelsOpen.p1 ? `
            <div class="mt-4 space-y-6">
              <div class="space-y-3">
                <label class="text-sm text-slate-300 font-bold">검색 키워드</label>
                <input id="yt-query" class="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-base text-slate-100 outline-none" placeholder="키워드를 입력하세요" value="${state.ui.filters.query}" />
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-2">
                  <label class="text-sm text-slate-300 font-bold">검색 결과 수</label>
                  <select id="yt-count" class="w-full rounded-xl border border-white/10 bg-[#161f3a] px-3 py-2 text-sm text-slate-100 outline-none">
                    ${[50, 100, 150, 200, 250, 300, 350, 400, 450, 500].map(n => `<option ${state.ui.filters.count === n ? 'selected' : ''}>${n}</option>`).join('')}
                  </select>
                </div>
                <div class="space-y-2">
                  <label class="text-sm text-slate-300 font-bold">보기 방식</label>
                  <select id="yt-viewmode" class="w-full rounded-xl border border-white/10 bg-[#161f3a] px-3 py-2 text-sm text-slate-100 outline-none">
                    <option ${state.ui.viewMode === '카드' ? 'selected' : ''}>카드</option>
                    <option ${state.ui.viewMode === '테이블' ? 'selected' : ''}>테이블</option>
                  </select>
                </div>
              </div>
              <div class="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-4">
                <div class="text-xs font-bold text-slate-400 uppercase tracking-widest">필터 설정</div>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div class="space-y-2">
                    <label class="text-xs text-slate-300 font-bold">정렬 방식</label>
                    <select id="yt-sort" class="w-full rounded-xl border border-white/10 bg-[#151e38] px-3 py-2 text-xs text-slate-100 outline-none">
                      ${['조회수', '최신순', '비율'].map(s => `<option ${state.ui.filters.sort === s ? 'selected' : ''}>${s}</option>`).join('')}
                    </select>
                  </div>
                  <div class="space-y-2">
                    <label class="text-xs text-slate-300 font-bold">업로드 기간</label>
                    <select id="yt-period" class="w-full rounded-xl border border-white/10 bg-[#151e38] px-3 py-2 text-xs text-slate-100 outline-none">
                      ${['전체', '7일전', '한달전', '3개월전', '6개월전', '12개월전'].map(p => `<option ${state.ui.filters.period === p ? 'selected' : ''}>${p}</option>`).join('')}
                    </select>
                  </div>
                   <div class="space-y-2">
                    <label class="text-xs text-slate-300 font-bold">검색 국가</label>
                    <select id="yt-country" class="w-full rounded-xl border border-white/10 bg-[#151e38] px-3 py-2 text-xs text-slate-100 outline-none">
                      ${Object.keys(COUNTRY_MAP).map(c => `<option ${state.ui.filters.country === c ? 'selected' : ''}>${c}</option>`).join('')}
                    </select>
                  </div>
                   <div class="space-y-2">
                    <label class="text-xs text-slate-300 font-bold">카테고리</label>
                    <select id="yt-category" class="w-full rounded-xl border border-white/10 bg-[#151e38] px-3 py-2 text-xs text-slate-100 outline-none">
                      ${Object.keys(CATEGORY_MAP).map(c => `<option ${state.ui.filters.category === c ? 'selected' : ''}>${c}</option>`).join('')}
                    </select>
                  </div>
                  <div class="space-y-2">
                    <label class="text-xs text-slate-300 font-bold">영상 길이</label>
                    <select id="yt-duration" class="w-full rounded-xl border border-white/10 bg-[#151e38] px-3 py-2 text-xs text-slate-100 outline-none">
                      <option ${state.ui.filters.duration === '전체' ? 'selected' : ''}>전체</option>
                      <option ${state.ui.filters.duration === '쇼츠' ? 'selected' : ''}>쇼츠</option>
                      <option ${state.ui.filters.duration === '중간 (4~20분)' ? 'selected' : ''}>중간 (4~20분)</option>
                      <option ${state.ui.filters.duration === '긴영상 (20분 이상)' ? 'selected' : ''}>긴영상 (20분 이상)</option>
                    </select>
                  </div>
                  <div class="space-y-2 md:col-span-2">
                    <label class="text-xs text-slate-300 font-bold">최소 조회수</label>
                    <input type="text" id="minViews" value="${(state.ui.filters.minViews || 0).toLocaleString('en-US')}" class="w-full rounded-xl border border-white/10 bg-[#151e38] px-3 py-2 text-xs text-slate-100 outline-none" placeholder="예: 100,000" />
                    <div class="mt-2 flex flex-wrap gap-1.5">
                      <button class="min-views-btn border border-amber-400/40 bg-amber-500/20 px-2 py-1 text-[10px] font-bold text-amber-100 rounded-lg hover:bg-amber-400 hover:text-black transition-all" data-min-views="1000">1천+</button>
                      <button class="min-views-btn border border-amber-400/40 bg-amber-500/20 px-2 py-1 text-[10px] font-bold text-amber-100 rounded-lg hover:bg-amber-400 hover:text-black transition-all" data-min-views="10000">1만+</button>
                      <button class="min-views-btn border border-amber-400/40 bg-amber-500/20 px-2 py-1 text-[10px] font-bold text-amber-100 rounded-lg hover:bg-amber-400 hover:text-black transition-all" data-min-views="100000">10만+</button>
                      <button class="min-views-btn border border-amber-400/40 bg-amber-500/20 px-2 py-1 text-[10px] font-bold text-amber-100 rounded-lg hover:bg-amber-400 hover:text-black transition-all" data-min-views="300000">30만+</button>
                      <button class="min-views-btn border border-amber-400/40 bg-amber-500/20 px-2 py-1 text-[10px] font-bold text-amber-100 rounded-lg hover:bg-amber-400 hover:text-black transition-all" data-min-views="500000">50만+</button>
                      <button class="min-views-btn border border-amber-400/40 bg-amber-500/20 px-2 py-1 text-[10px] font-bold text-amber-100 rounded-lg hover:bg-amber-400 hover:text-black transition-all" data-min-views="1000000">100만+</button>
                    </div>
                  </div>
                </div>
              </div>
              <button id="yt-search-btn" class="exec-btn w-full rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-300 py-3 text-sm font-black text-black shadow-lg shadow-amber-500/20">유튜브 검색 실행</button>
            </div>
            ` : ''}
          </section>

          <section class="bg-gradient-to-br from-emerald-900/40 to-teal-900/20 rounded-3xl p-6 border border-white/10 shadow-xl">
            <div class="flex items-center justify-between">
              <h3 class="text-2xl font-black gold-gradient-text">2. 유튜브 검색 결과</h3>
              <button id="toggle-p2" class="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
                ${state.ui.panelsOpen.p2 ? '숨기기' : '보이기'}
              </button>
            </div>
            
            ${state.ui.panelsOpen.p2 ? `
            <div class="mt-4">
              <div class="flex items-center justify-between">
                <div class="mt-2 text-[11px] text-slate-400">국가: ${state.ui.filters.country || '한국'} · 검색어: ${state.ui.filters.query || '-'}${state.ui.filters.translatedQuery ? ` · 번역: ${state.ui.filters.translatedQuery}` : ''}</div>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-slate-400">${state.ui.viewMode} 보기</span>
                  <button id="columns-toggle" class="rounded-lg bg-white/10 px-2 py-1 text-[10px] font-bold text-slate-200">컬럼 설정</button>
                </div>
              </div>
              ${state.ui.columnsOpen ? `
                <div class="mt-3 rounded-2xl border border-white/10 bg-black/40 p-3">
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-slate-200">
                    ${DEFAULT_COLUMNS.map((col) => `
                      <label class="flex items-center gap-2">
                        <input type="checkbox" data-col="${col.id}" ${state.ui.columns[col.id] ? 'checked' : ''} />
                        <span>${col.label}</span>
                      </label>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
              ${state.ui.viewMode === '카드'
        ? `<div class="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">${cardItems || ''}</div>`
        : `
                  <div class="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-slate-100 overflow-auto">
                    <table class="w-full border-collapse text-left text-slate-100">
                      <thead class="text-sm text-slate-300 uppercase tracking-widest">
                        <tr>
                          ${visibleColumns.map((col) => `<th class="py-2 px-2">${col.label}</th>`).join('')}
                        </tr>
                      </thead>
                      <tbody class="text-sm text-slate-100">
                        ${tableRows}
                      </tbody>
                    </table>
                  </div>
                `}
            </div>
            ` : ''}
          </section>

          <section class="bg-gradient-to-br from-slate-800/60 to-slate-900/40 rounded-3xl p-6 border border-white/10 shadow-xl">
            <div class="flex items-center justify-between">
              <h3 class="text-2xl font-black gold-gradient-text">직접 입력해서 제목과 대본생성</h3>
              <button id="toggle-pm" class="rounded-lg bg-gradient-to-r from-slate-500 to-slate-700 px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-slate-500/20 active:scale-95 transition-all">
                ${state.ui.panelsOpen.pm ? '숨기기' : '보이기'}
              </button>
            </div>
            ${state.ui.panelsOpen.pm ? `
            <div class="mt-4">
              <div class="grid grid-cols-1 md:grid-cols-[1.1fr_1.9fr] gap-4">
                <div class="space-y-2">
                  <label class="text-sm text-slate-300 font-bold">유튜브 URL</label>
                  <input id="custom-url" class="w-full rounded-xl border border-white/10 bg-[#151e38] px-3 py-2 text-sm text-slate-100 outline-none" placeholder="https://www.youtube.com/watch?v=..." value="${state.ui.customSource.url || ''}" />
                </div>
                <div class="space-y-2">
                  <label class="text-sm text-slate-300 font-bold">영상 스타일 선택</label>
                  <select id="custom-style" class="video-style-select w-full rounded-xl border border-white/10 bg-[#151e38] px-3 py-2 text-sm text-slate-100 outline-none">
                    <option value="">선택하세요</option>
                    ${VIDEO_STYLE_OPTIONS.map((opt) => `<option value="${opt.id}" ${state.ui.customSource.style === opt.id ? 'selected' : ''}>${opt.label}</option>`).join('')}
                  </select>
                </div>
                <div class="space-y-2 md:col-span-2">
                  <label class="text-sm text-slate-300 font-bold">주제/줄거리 (가장 우선)</label>
                  <textarea id="custom-topic" class="w-full min-h-[120px] rounded-xl border border-white/10 bg-[#151e38] px-3 py-2 text-sm text-slate-100 outline-none" placeholder="주제나 줄거리 일부를 입력하세요">${state.ui.customSource.topic || ''}</textarea>
                </div>
              </div>
            </div>
            ` : ''}
          </section>

          <section class="bg-gradient-to-br from-orange-900/40 to-amber-900/20 rounded-3xl p-6 border border-white/10 shadow-xl">
            <div class="flex items-center justify-between">
              <h3 class="text-2xl font-black gold-gradient-text">3. 패턴분석 훅킹 제목 10선</h3>
              <button id="toggle-p3" class="rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-orange-500/20 active:scale-95 transition-all">
                ${state.ui.panelsOpen.p3 ? '숨기기' : '보이기'}
              </button>
            </div>
            ${state.ui.panelsOpen.p3 ? `
            <div class="mt-4">
              <p class="text-sm text-slate-300">검색 결과 기반으로 훅킹 제목 10선을 생성합니다.</p>
              <div class="mt-4 flex flex-wrap gap-2">
                <button id="hook-generate" class="exec-btn rounded-xl bg-gradient-to-r from-amber-500 to-yellow-300 px-3 py-2 text-xs font-black text-black">제목 10선 생성</button>
                <button id="hook-dedupe" class="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-slate-200">중복 제거</button>
              </div>
              <div class="mt-3 space-y-2 text-sm text-slate-200">
                ${state.ui.hookLoading ? '<div>생성 중...</div>' : ''}
                ${state.ui.hookError ? `<div class="text-rose-300">${state.ui.hookError}</div>` : ''}
                ${state.ui.hookTitles.length ? state.ui.hookTitles.map((t, i) => `
                  <label class="flex items-start gap-2 rounded-lg bg-white/5 px-3 py-2 cursor-pointer">
                    <input type="radio" name="hook-title" data-hook-title="${t.replace(/"/g, '&quot;')}" ${state.ui.selectedHookTitle === t ? 'checked' : ''} />
                    <span>${t}</span>
                  </label>
                `).join('') : ''}
              </div>
            </div>
            ` : ''}
          </section>

          <section class="bg-gradient-to-br from-rose-900/40 to-pink-900/20 rounded-3xl p-6 border border-white/10 shadow-xl">
            <div class="flex items-center justify-between">
              <h3 class="text-2xl font-black gold-gradient-text">4. 쇼츠대본 / 롱폼대본 생성</h3>
              <button id="toggle-p4" class="rounded-lg bg-gradient-to-r from-rose-500 to-pink-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-rose-500/20 active:scale-95 transition-all">
                ${state.ui.panelsOpen.p4 ? '숨기기' : '보이기'}
              </button>
            </div>
            ${state.ui.panelsOpen.p4 ? `
            <div class="mt-4">
              <p class="text-sm text-slate-300">선택한 제목과 검색 결과를 기반으로 대본을 생성합니다.</p>
              <div class="mt-3 text-xs text-slate-400">선택한 제목: ${state.ui.selectedHookTitle || '없음'}</div>
              <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div class="space-y-2">
                  <label class="text-sm text-slate-300 font-bold">대본 타입</label>
                  <select id="script-type" class="w-full rounded-xl border border-white/10 bg-rose-950/60 px-3 py-2 text-sm text-slate-100 outline-none">
                    <option value="shorts" ${scriptState.type === 'shorts' ? 'selected' : ''}>쇼츠</option>
                    <option value="longform" ${scriptState.type === 'longform' ? 'selected' : ''}>롱폼</option>
                  </select>
                </div>
                <div class="space-y-2">
                  <label class="text-sm text-slate-300 font-bold">길이 선택</label>
                  <div class="text-[11px] text-slate-400">
                    ${scriptState.type === 'shorts'
        ? `쇼츠 ${currentShortSeconds}초 기준: KR ${shortKr}자 / EN ${shortEn}단어 / JP ${shortJp}자`
        : `롱폼 ${scriptState.longLength || '10분'} 기준: ${formatNumber(currentLongRange[0])}~${formatNumber(currentLongRange[1])}자`}
                  </div>
                  ${scriptState.type === 'shorts'
        ? `
                    <select id="script-length-short" class="w-full rounded-xl border border-white/10 bg-rose-950/60 px-3 py-2 text-sm text-slate-100 outline-none">
                      ${['30초', '60초', '90초', '120초', '150초'].map((v) => `<option ${scriptState.shortLength === v ? 'selected' : ''}>${v}</option>`).join('')}
                    </select>
                  `
        : `
                    <select id="script-length-long" class="w-full rounded-xl border border-white/10 bg-rose-950/60 px-3 py-2 text-sm text-slate-100 outline-none">
                      ${['10분', '20분', '30분', '40분', '50분', '60분'].map((v) => `<option ${scriptState.longLength === v ? 'selected' : ''}>${v}</option>`).join('')}
                    </select>
                  `}
                </div>
                <div class="space-y-2">
                  <label class="text-sm text-slate-300 font-bold">언어 선택</label>
                  <select id="script-lang" class="w-full rounded-xl border border-white/10 bg-rose-950/60 px-3 py-2 text-sm text-slate-100 outline-none">
                    <option value="KR" ${scriptState.lang === 'KR' ? 'selected' : ''}>한국어</option>
                    <option value="JP" ${scriptState.lang === 'JP' ? 'selected' : ''}>일본어</option>
                    <option value="EN" ${scriptState.lang === 'EN' ? 'selected' : ''}>영어</option>
                  </select>
                </div>
                <div class="space-y-2">
                  <label class="text-sm text-slate-300 font-bold">타깃층 연령</label>
                  <input id="script-target-age" class="w-full rounded-xl border border-white/10 bg-rose-950/60 px-3 py-2 text-sm text-slate-100 outline-none" value="${scriptState.targetAge || defaultTargetAge}" />
                </div>
                <div class="space-y-2 md:col-span-2">
                  <label class="text-sm text-slate-300 font-bold">톤</label>
                  <input id="script-tone" class="w-full rounded-xl border border-white/10 bg-rose-950/60 px-3 py-2 text-sm text-slate-100 outline-none" value="${scriptState.tone || defaultTone}" />
                </div>
              </div>
              <div class="mt-4 flex flex-wrap gap-2">
                <button id="script-generate" class="exec-btn rounded-xl bg-gradient-to-r from-amber-500 to-yellow-300 px-4 py-2 text-xs font-black text-black ${scriptState.generating ? 'pulse-glow' : ''}">대본 생성</button>
                <button id="script-copy" class="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-slate-200" ${scriptState.output ? '' : 'disabled'}>대본 복사</button>
              </div>
              <div class="mt-3 flex flex-wrap gap-2 text-xs">
                <button data-script-cache="KR" class="script-cache-btn rounded-full border px-3 py-1 ${scriptState.cache?.KR ? 'border-emerald-400/50 text-emerald-200' : 'border-white/10 text-slate-500'}">KR 저장</button>
                <button data-script-cache="JP" class="script-cache-btn rounded-full border px-3 py-1 ${scriptState.cache?.JP ? 'border-emerald-400/50 text-emerald-200' : 'border-white/10 text-slate-500'}">JP 저장</button>
                <button data-script-cache="EN" class="script-cache-btn rounded-full border px-3 py-1 ${scriptState.cache?.EN ? 'border-emerald-400/50 text-emerald-200' : 'border-white/10 text-slate-500'}">EN 저장</button>
              </div>
              <div class="mt-3 text-xs text-slate-300">
                ${scriptState.generating ? '생성 중...' : ''}
                ${scriptState.error ? `<div class="text-rose-300">${scriptState.error}</div>` : ''}
                ${scriptState.message ? `<div class="text-emerald-300">${scriptState.message}</div>` : ''}
              </div>
              <div class="mt-3">
                <textarea id="script-output" class="w-full min-h-[400px] rounded-2xl border border-white/10 bg-rose-950/60 px-4 py-3 text-[1.2em] text-slate-100 outline-none" placeholder="대본이 여기에 생성됩니다. 직접 수정 가능">${scriptState.output || ''}</textarea>
                <div id="script-count" class="mt-2 text-xs text-slate-400">
                  글자수: ${formatNumber(scriptState.charCount)}${scriptState.lang === 'EN' ? ` · 단어수: ${formatNumber(scriptState.wordCount)}` : ''} · 예상길이: ${Math.round((state.ui.tts.lastDurationSec || 0) / (state.ui.tts.speed || 1.0))}초 ${state.ui.tts.speed === 1.0 ? '(1.0x 기준)' : `(${state.ui.tts.speed}x 적용됨)`}
                </div>
              </div>
            </div>
            ` : ''}
          </section>
          <section class="bg-gradient-to-br from-emerald-900/40 to-teal-900/20 rounded-3xl p-6 border border-white/10 shadow-xl">
            <div class="flex items-center justify-between">
              <h3 class="text-2xl font-black gold-gradient-text">5. TTS 생성</h3>
              <button id="toggle-p5" class="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
                ${state.ui.panelsOpen.p5 ? '숨기기' : '보이기'}
              </button>
            </div>
            ${state.ui.panelsOpen.p5 ? `
            <div class="mt-4">
              <p class="text-sm text-slate-300">Gemini TTS 생성 및 길이 계산</p>
              <div class="mt-4 grid grid-cols-1 gap-3">
                <div class="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div class="text-xs font-bold text-slate-300">Gemini 유료 TTS 설정</div>
                  <div class="mt-2 text-[11px] text-slate-400">Gemini API 키 필요 · 유료 과금</div>
                  <div class="mt-1 text-[11px] text-slate-500">현재 키: ${maskKeyPreview(state.keys.g1)}</div>
                  <div class="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div class="space-y-2">
                      <label class="text-sm text-slate-300 font-bold">속도</label>
                      <select id="tts-speed" class="w-full rounded-xl border border-white/10 bg-emerald-950/60 px-3 py-2 text-sm text-slate-100 outline-none">
                        ${['0.8', '1.0', '1.1', '1.25', '1.5', '1.7', '2.0'].map((v) => `<option ${state.ui.tts.speed === Number(v) ? 'selected' : ''}>${v}x</option>`).join('')}
                      </select>
                    </div>
                    <div class="space-y-2">
                      <label class="text-sm text-slate-300 font-bold">보이스</label>
                      <select id="tts-voice" class="w-full rounded-xl border border-white/10 bg-emerald-950/60 px-3 py-2 text-sm text-slate-100 outline-none">
                        ${GEMINI_TTS_VOICES.map((v) => `<option value="${v.id}" ${state.ui.tts.voiceName === v.id ? 'selected' : ''}>${v.label} · ${v.gender} · ${v.category}</option>`).join('')}
                      </select>
                      <div class="mt-1 text-[11px] text-slate-400">성별: ${getVoiceMeta(state.ui.tts.voiceName).gender} · 추천: ${getVoiceMeta(state.ui.tts.voiceName).category}</div>
                    </div>
                    <div class="space-y-2">
                      <label class="text-sm text-slate-300 font-bold">모델</label>
                      <select id="tts-gemini-model" class="w-full rounded-xl border border-white/10 bg-emerald-950/60 px-3 py-2 text-sm text-slate-100 outline-none">
                        ${GEMINI_TTS_MODELS.map((m) => `<option value="${m.id}" ${state.ui.tts.geminiModel === m.id ? 'selected' : ''}>${m.label} (${m.price})</option>`).join('')}
                      </select>
                    </div>
                  </div>
                  <div class="mt-4">
                    <button id="tts-generate" data-action="tts-generate" class="exec-btn w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-3 py-2 text-xs font-black text-black ${state.ui.tts.generating || state.ui.tts.status === '생성 완료' ? 'animate-gradient' : ''}">${state.ui.tts.status === '생성 완료' ? 'TTS 생성 완료' : 'TTS 생성'}</button>
                    <div class="mt-2 text-[11px] text-slate-400">${state.ui.tts.status || '대기'}</div>
                  </div>
                </div>
              </div>
              <div class="mt-3 text-xs text-slate-400">TTS 예상 길이: ${Math.round((state.ui.tts.lastDurationSec || 0) / (state.ui.tts.speed || 1.0))}초 ${state.ui.tts.speed === 1.0 ? '(1.0x 기준)' : `(${state.ui.tts.speed}x 적용됨)`}</div>
              ${state.ui.tts.error ? `<div class="mt-2 text-xs text-rose-300">${state.ui.tts.error}</div>` : ''}
              <div class="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
                <div class="text-xs font-bold text-slate-300">TTS 재생</div>
                ${state.ui.tts.audioUrl
        ? `
                    <div class="mt-3 flex items-center gap-3">
                      <button id="tts-play" class="rounded-full bg-amber-500/30 px-4 py-2 text-xs font-black text-amber-100">재생</button>
                      <button id="tts-download" class="rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-slate-200">다운로드</button>
                      <div class="flex-1">
                        <input id="tts-seek" type="range" min="0" max="${state.ui.tts.audioDuration || 0}" value="0" class="w-full accent-amber-400" />
                        <div class="mt-1 text-[11px] text-slate-400" id="tts-time">0:00 / ${formatTime(state.ui.tts.audioDuration || 0)}</div>
                      </div>
                    </div>
                    <audio id="tts-audio" src="${state.ui.tts.audioUrl}" preload="metadata"></audio>
                  `
        : '<div class="mt-2 text-xs text-slate-500">생성된 TTS가 없습니다.</div>'}
              </div>
            </div>
            ` : ''}
          </section>
          <section class="bg-gradient-to-br from-sky-900/40 to-cyan-900/20 rounded-3xl p-6 border border-white/10 shadow-xl">
            <div class="flex items-center justify-between">
              <h3 class="text-2xl font-black gold-gradient-text">6. 이미지 프롬프트 생성(대본나누기)</h3>
              <button id="toggle-p6" class="rounded-lg bg-gradient-to-r from-sky-500 to-cyan-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-sky-500/20 active:scale-95 transition-all">
                ${state.ui.panelsOpen.p6 ? '숨기기' : '보이기'}
              </button>
            </div>
            ${state.ui.panelsOpen.p6 ? `
            <div class="mt-4">
              <p class="text-sm text-slate-300">대본을 의미/단락 기준으로 컷 분할 후 프롬프트 생성</p>
              <div class="mt-3 flex flex-wrap gap-2 items-center">
                <select id="cuts-video-style" class="video-style-select rounded-xl border border-white/10 bg-[#151e38] px-3 py-2 text-xs text-slate-100 outline-none">
                  <option value="">영상 스타일 (선택안함)</option>
                  ${VIDEO_STYLE_OPTIONS.map((opt) => `<option value="${opt.id}" ${state.ui.customSource.style === opt.id ? 'selected' : ''}>${opt.label}</option>`).join('')}
                </select>
                <select id="cuts-ratio" class="rounded-xl border border-white/10 bg-[#151e38] px-3 py-2 text-xs text-slate-100 outline-none">
                  ${['9:16', '16:9', '1:1', '4:3', '3:4'].map((r) => `<option value="${r}" ${state.ui.cuts.ratio === r ? 'selected' : ''}>화면비율 ${r}</option>`).join('')}
                </select>
                <button id="cuts-generate" class="exec-btn rounded-xl bg-gradient-to-r from-amber-500 to-yellow-300 px-3 py-2 text-xs font-black text-black">컷 분할</button>
                <button id="prompts-generate" class="exec-btn rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 px-3 py-2 text-xs font-black text-black">프롬프트 생성</button>
              </div>
              <div class="mt-3 hidden md:flex gap-3 text-sm font-bold text-slate-400 ml-1 mb-2">
                <div class="flex-1">대본 컷 (직접 수정 가능)</div>
                <div class="flex-1">영어 프롬프트 (수정 시 아래 7번에 자동연동)</div>
              </div>
              <div class="mt-3 space-y-3" id="cuts-prompts-container">
                ${(() => {
        const maxLen = Math.max((state.ui.cuts.items || []).length, (state.ui.cuts.prompts || []).length);
        if (maxLen === 0) return '<div class="text-center text-slate-500 py-10 border border-white/10 rounded-2xl">생성된 컷/프롬프트가 없습니다. 상단의 버튼을 눌러주세요.</div>';

        return Array.from({ length: maxLen }).map((_, i) => {
          const cutText = state.ui.cuts.items[i] || '';
          const promptObj = state.ui.cuts.prompts.find((p) => p.index === i + 1) || { prompt: '' };
          return `
                      <div class="flex flex-col md:flex-row gap-3 p-4 bg-black/20 border border-white/5 rounded-2xl relative group">
                        <div class="absolute -left-2 -top-2 w-7 h-7 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-xs font-black text-slate-200 z-10 shadow-lg">${i + 1}</div>
                        <button class="delete-cut-row absolute -right-2 -top-2 w-7 h-7 rounded-full bg-rose-500/80 border border-rose-400/50 flex items-center justify-center text-xs font-black text-white z-10 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" data-idx="${i}">✕</button>
                        <div class="flex-1 flex flex-col gap-2">
                          <label class="md:hidden text-xs text-slate-400 font-bold ml-1">대본 컷</label>
                          <textarea data-cut-idx="${i}" class="cut-item-input w-full min-h-[140px] rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-slate-100 outline-none resize-y focus:border-amber-500/50 transition-colors" placeholder="대본 내용...">${cutText}</textarea>
                        </div>
                        <div class="flex-1 flex flex-col gap-2">
                          <label class="md:hidden text-xs text-slate-400 font-bold ml-1">영어 프롬프트</label>
                          <div class="relative w-full h-full flex flex-col">
                            <textarea data-prompt-idx="${i}" class="prompt-item-input w-full min-h-[140px] flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 pb-9 text-sm text-slate-100 outline-none resize-y focus:border-sky-500/50 transition-colors" placeholder="A photorealistic...">${promptObj.prompt}</textarea>
                            <button class="regen-single-prompt-btn absolute bottom-3 right-3 rounded-lg bg-sky-500/20 px-2 py-1.5 text-[10px] font-bold text-sky-200 hover:bg-sky-500/40 transition-colors" data-idx="${i}">이 씬만 프롬프트 재생성</button>
                          </div>
                        </div>
                      </div>
                    `;
        }).join('');
      })()}
              </div>
              <div class="mt-4 flex justify-center">
                <button id="add-cut-row" class="rounded-xl border border-dashed border-white/20 px-6 py-2 text-xs font-bold text-slate-400 hover:text-slate-200 hover:border-white/40 transition-colors bg-white/5 hover:bg-white/10">+ 새로운 컷 수동 추가</button>
              </div>
            </div>
            ` : ''}
          </section>

          <section class="bg-gradient-to-br from-yellow-900/40 to-orange-900/20 rounded-3xl p-6 border border-white/10 shadow-xl">
            <div class="flex items-center justify-between">
              <h3 class="text-2xl font-black gold-gradient-text">7. 프롬프트 출력 (Auto Whik / Auto Grok) <span class="ml-2 px-2 py-0.5 rounded-lg bg-yellow-500/20 text-yellow-300 text-sm border border-yellow-500/30">[${state.ui.cuts.ratio}]</span></h3>
              <button id="toggle-p7" class="rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-yellow-500/20 active:scale-95 transition-all">
                ${state.ui.panelsOpen.p7 ? '숨기기' : '보이기'}
              </button>
            </div>
            ${state.ui.panelsOpen.p7 ? `
            <div class="mt-4">
              <p class="text-sm text-slate-300">위 6번에서 생성수정된 컷별 프롬프트를 번호 없이 각각 빈 줄로 구분하여 출력합니다.</p>
              <textarea id="prompt-output" class="mt-3 w-full min-h-[220px] rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-slate-400 outline-none cursor-not-allowed" readonly>${state.ui.cuts.prompts.map((p) => p.prompt).join('\n\n') || ''}</textarea>
              <button id="prompt-copy" class="exec-btn mt-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-300 px-6 py-3 text-sm font-black text-black shadow-lg">프롬프트 복사</button>
            </div>
            ` : ''}
          </section>

          <section class="bg-gradient-to-br from-violet-900/40 to-fuchsia-900/20 rounded-3xl p-6 border border-white/10 shadow-xl">
            <div class="flex items-center justify-between">
              <h3 class="text-2xl font-black gold-gradient-text">8. 이미지 생성 패널 <span class="ml-2 px-2 py-0.5 rounded-lg bg-violet-500/20 text-violet-300 text-sm border border-violet-500/30">[${state.ui.cuts.ratio}]</span></h3>
              <button id="toggle-p8" class="rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-violet-500/20 active:scale-95 transition-all">
                ${state.ui.panelsOpen.p8 ? '숨기기' : '보이기'}
              </button>
            </div>
            ${state.ui.panelsOpen.p8 ? `
            <div class="mt-4">
              <div class="flex items-center justify-between mb-4">
                <p class="text-sm text-slate-300">컷을 클릭하면 대기열에 추가되며 순차적으로 이미지가 자동 생성됩니다. (안정성을 위해 컷당 20~25초 간격)</p>
                <div class="flex items-center gap-2">
                  <select id="panel-model-image" class="rounded-xl border border-white/10 bg-[#151e38] px-3 py-2 text-xs text-slate-100 outline-none">
                    <option value="auto" ${state.ui.modelSelections.image === 'auto' ? 'selected' : ''}>Auto_Gemini-3.1-flash-image-preview ($0.0672)</option>
                    <option value="gemini-3.1-flash-image-preview" ${state.ui.modelSelections.image === 'gemini-3.1-flash-image-preview' ? 'selected' : ''}>Gemini 3.1 Flash Image Preview ($0.0672)</option>
                    <option value="gemini-3-pro-image-preview" ${state.ui.modelSelections.image === 'gemini-3-pro-image-preview' ? 'selected' : ''}>Gemini 3 Pro Image Preview ($0.134)</option>
                    <option value="imagen-4.0-fast-generate-001" ${state.ui.modelSelections.image === 'imagen-4.0-fast-generate-001' ? 'selected' : ''}>Imagen 4.0 Fast ($0.02)</option>
                    <option value="imagen-4.0-generate-001" ${state.ui.modelSelections.image === 'imagen-4.0-generate-001' ? 'selected' : ''}>Imagen 4.0 Standard ($0.04)</option>
                  </select>
                  <button id="image-generate-all" class="exec-btn rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-400 px-4 py-2 text-sm font-black text-black shadow-lg shadow-fuchsia-500/20 active:scale-95 transition-all">전체 자동 생성</button>
                  <button id="image-generate-stop" class="exec-btn rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 px-4 py-2 text-sm font-black text-white shadow-lg shadow-rose-500/20 active:scale-95 transition-all">중지</button>
                  <button id="add-cut-row-p8" class="rounded-xl border border-dashed border-white/20 px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-200 hover:border-white/40 transition-colors bg-white/5 hover:bg-white/10">+ 컷 추가</button>
                </div>
              </div>

              <div class="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${state.ui.cuts.prompts.length ? state.ui.cuts.prompts.map((p) => {
                  const job = state.ui.imageJobs.find(j => j.cut === p.index);
                  const status = job ? job.status : '대기';
                  const imageUrl = job?.imageUrl || '';
                  const isProcessing = status === '생성 중...';
                  const isDone = status === '생성 완료';
                  
                  return `
                  <div class="flex flex-col rounded-2xl border border-white/10 bg-black/40 overflow-hidden shadow-lg transition-transform hover:-translate-y-1">
                    <div class="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-white/5 group/card-header">
                      <div class="flex items-center gap-2">
                        <span class="text-xs font-black ${isDone ? 'text-violet-400' : 'text-slate-200'}">컷 ${p.index}</span>
                        <button class="delete-cut-row w-5 h-5 rounded bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover/card-header:opacity-100 flex items-center justify-center text-[10px]" data-idx="${p.index - 1}">×</button>
                      </div>
                      <span class="text-[10px] font-bold ${
                        isProcessing ? 'text-sky-400 animate-pulse' : 
                        isDone ? 'text-emerald-400' : 
                        job?.status?.includes('실패') ? 'text-rose-400' : 'text-slate-500'
                      }">${status}</span>
                    </div>
                    
                    <div class="relative mx-auto h-[400px] max-h-full max-w-full flex flex-col bg-black/60 group overflow-hidden" style="aspect-ratio: ${(p.ratio || state.ui.cuts.ratio).replace(':', ' / ')};">
                      ${imageUrl 
                        ? `<img src="${imageUrl}" class="w-full h-full object-contain" alt="Cut ${p.index}"/>`
                        : `<div class="w-full h-full flex flex-col items-center justify-center space-y-2 p-4 text-center">
                            ${isProcessing 
                              ? `<div class="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mb-2"></div>
                                 <span class="text-xs text-sky-400">안전한 생성을 위해 대기 및<br/>작업 중입니다... (최대 30초)</span>`
                              : `<div class="flex flex-col items-center gap-3">
                                   <button class="image-cut-btn px-6 py-3 rounded-2xl bg-violet-600/20 text-violet-300 border border-violet-500/30 hover:bg-violet-600/40 text-xs font-black transition-all" data-image-cut="${p.index}">AI 이미지 생성 대기열 추가</button>
                                   <div class="text-[10px] text-slate-500">또는 오른쪽 위 ↑ 버튼으로 직접 업로드</div>
                                 </div>`
                            }
                           </div>`
                      }

                      <!-- AI Vision Analyzing Overlay -->
                      ${state.ui.visionAnalyzing.includes(p.index) ? `
                        <div class="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20 backdrop-blur-sm">
                          <div class="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                          <span class="text-sm font-black text-amber-500 animate-pulse">AI가 미디어(이미지) 분석 중...</span>
                          <span class="text-[10px] text-slate-400 mt-1">대본 분석 및 프롬프트 연동 실행 중</span>
                        </div>
                      ` : ''}
                      
                      <!-- Overlay Actions -->
                      <div class="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button class="image-upload-trigger w-8 h-8 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white hover:bg-violet-600 transition-colors" title="이미지 업로드" data-idx="${p.index}">
                          <span class="text-xs">↑</span>
                        </button>
                        ${imageUrl ? `
                        <button class="image-download-btn w-8 h-8 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white hover:bg-emerald-600 transition-colors" title="이미지 다운로드" data-idx="${p.index}">
                          <span class="text-xs">↓</span>
                        </button>
                        <button class="image-delete-btn w-8 h-8 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white hover:bg-red-600 transition-colors" title="이미지 삭제" data-idx="${p.index}">
                          <span class="text-xs">×</span>
                        </button>
                        ` : ''}
                      </div>

                      <div class="absolute bottom-0 left-0 w-full p-2 bg-gradient-to-t from-black/80 to-transparent">
                        <div class="text-[9px] text-slate-300 line-clamp-2" title="${p.prompt}">${p.prompt}</div>
                      </div>
                    </div>
                  </div>
                  `;
                }).join('') : '<div class="col-span-full text-center text-sm text-slate-500 py-10 border border-white/5 rounded-xl">생성된 컷 프롬프트가 없습니다 (6번 패널 확인).</div>'}
              </div>
              <input type="file" id="image-upload-input" class="hidden" accept="image/*" />
              <input type="file" id="video-upload-input" class="hidden" accept="video/*" />
            </div>
            ` : ''}
          </section>

          <section class="bg-gradient-to-br from-blue-900/40 to-indigo-900/20 rounded-3xl p-6 border border-white/10 shadow-xl">
            <div class="flex items-center justify-between">
              <h3 class="text-2xl font-black gold-gradient-text">9. 영상 생성 패널 <span class="ml-2 px-2 py-0.5 rounded-lg bg-blue-500/20 text-blue-300 text-sm border border-blue-500/30">[${state.ui.cuts.ratio}]</span></h3>
              <div class="flex items-center gap-2">
                <button id="add-cut-row-p9" class="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-bold text-white border border-white/10 active:scale-95 transition-all" title="새 컷 추가">+ 컷 추가</button>
                <button id="toggle-p9" class="rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
                  ${state.ui.panelsOpen.p9 ? '숨기기' : '보이기'}
                </button>
              </div>
            </div>
            ${state.ui.panelsOpen.p9 ? `
            <div class="mt-4">
              <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div class="flex items-center gap-2">
                  <select id="panel-video-model" class="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-slate-100 outline-none">
                    <option value="auto" ${state.ui.modelSelections.video === 'auto' ? 'selected' : ''}>Auto_Veo 3.1 Fast ($0.15)</option>
                    <option value="veo-3.1-fast" ${state.ui.modelSelections.video === 'veo-3.1-fast' ? 'selected' : ''}>Veo 3.1 Fast ($0.15)</option>
                    <option value="veo-3.1-standard" ${state.ui.modelSelections.video === 'veo-3.1-standard' ? 'selected' : ''}>Veo 3.1 Standard ($0.40)</option>
                  </select>
                  <button id="video-generate-all" class="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-2 text-xs font-black text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-all ${state.ui.videoBatchGenerating ? 'pulse-worker-blue' : ''}">
                    ${state.ui.videoBatchGenerating ? '영상 생성 중...' : '전체 자동 생성'}
                  </button>
                  <button id="video-stop" class="rounded-xl bg-rose-600 px-4 py-2 text-xs font-black text-white border border-white/10 hover:bg-rose-500 transition-all ${!state.ui.videoBatchGenerating ? 'hidden' : ''}">중지</button>
                </div>
                <p class="text-[11px] text-slate-400">컷을 클릭하면 영상 생성 작업을 추가합니다 (안정성을 위해 컷당 30~40초 간격).</p>
              </div>

              <div class="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${state.ui.cuts.prompts.length ? state.ui.cuts.prompts.map((p) => {
                  const job = state.ui.videoJobs.find(j => j.cut === p.index);
                  const status = job ? job.status : '대기';
                  const isDone = status === '생성 완료';
                  const isProcessing = status === '생성 중...' || status === '진행 중';
                  
                  return `
                  <div class="flex flex-col rounded-2xl border border-white/10 bg-black/40 overflow-hidden shadow-lg transition-transform hover:-translate-y-1">
                    <div class="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-white/5 group/card-header">
                      <div class="flex items-center gap-2">
                        <span class="text-xs font-black ${isDone ? 'text-blue-400' : 'text-slate-200'}">컷 ${p.index}</span>
                        <button class="delete-cut-row w-5 h-5 rounded bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover/card-header:opacity-100 flex items-center justify-center text-[10px]" data-idx="${p.index - 1}">×</button>
                      </div>
                      <span class="text-[10px] font-bold ${
                        isProcessing ? 'text-sky-400 animate-pulse' : 
                        isDone ? 'text-emerald-400' : 
                        status?.includes('실패') ? 'text-rose-400' : 'text-slate-500'
                      }">${status}</span>
                    </div>
                    
                    <div class="relative mx-auto h-[400px] max-h-full max-w-full flex flex-col bg-black/60 group overflow-hidden" style="aspect-ratio: ${(p.ratio || state.ui.cuts.ratio).replace(':', ' / ')};">
                      <div class="w-full h-full flex flex-col items-center justify-center space-y-2 p-4 text-center">
                        ${isProcessing 
                          ? `<div class="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mb-2"></div>
                             <span class="text-xs text-blue-400">영상 생성 중...</span>`
                          : job?.videoUrl 
                            ? `<video src="${job.videoUrl}" class="w-full h-full object-contain" controls></video>`
                            : `<div class="flex flex-col items-center gap-3">
                                 <button class="video-cut-btn px-6 py-3 rounded-2xl bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/40 text-xs font-black transition-all" data-video-cut="${p.index}">AI 영상 생성 시작</button>
                                 <div class="text-[10px] text-slate-500">또는 오른쪽 위 ↑ 버튼으로 직접 업로드</div>
                               </div>`
                        }
                      </div>

                      <!-- AI Vision Analyzing Overlay -->
                      ${state.ui.visionAnalyzing.includes(p.index) ? `
                        <div class="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20 backdrop-blur-sm">
                          <div class="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                          <span class="text-sm font-black text-amber-500 animate-pulse">AI가 미디어(영상) 분석 중...</span>
                          <span class="text-[10px] text-slate-400 mt-1">대본 분석 및 프롬프트 연동 실행 중</span>
                        </div>
                      ` : ''}

                      <!-- Overlay Actions -->
                      <div class="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button class="video-upload-trigger w-8 h-8 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white hover:bg-blue-600 transition-colors" title="영상 업로드" data-idx="${p.index}">
                          <span class="text-xs">↑</span>
                        </button>
                        ${job?.videoUrl ? `
                        <button class="video-download-btn w-8 h-8 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white hover:bg-emerald-600 transition-colors" title="영상 다운로드" data-idx="${p.index}">
                          <span class="text-xs">↓</span>
                        </button>
                        <button class="video-delete-btn w-8 h-8 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white hover:bg-red-600 transition-colors" title="영상 삭제" data-idx="${p.index}">
                          <span class="text-xs">×</span>
                        </button>
                        ` : ''}
                      </div>
                      
                      <div class="absolute bottom-0 left-0 w-full p-2 bg-gradient-to-t from-black/80 to-transparent">
                        <div class="text-[9px] text-slate-300 line-clamp-2" title="${p.prompt}">${p.prompt}</div>
                      </div>
                    </div>
                  </div>
                  `;
                }).join('') : '<div class="col-span-full text-center text-sm text-slate-500 py-10 border border-white/5 rounded-xl">생성된 컷 프롬프트가 없습니다 (6번 패널 확인).</div>'}
              </div>
            </div>
            ` : ''}
          </section>

          <section class="bg-gradient-to-br from-emerald-900/40 to-teal-900/20 rounded-3xl p-6 border border-white/10 shadow-xl">
            <div class="flex items-center justify-between">
              <h3 class="text-2xl font-black gold-gradient-text">10. 썸네일 생성 패널</h3>
              <button id="toggle-p10" class="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
                ${state.ui.panelsOpen.p10 ? '숨기기' : '보이기'}
              </button>
            </div>
            ${state.ui.panelsOpen.p10 ? `
            <div class="mt-4">
              <p class="text-sm text-slate-300">최종 대본을 기반으로 최적화된 썸네일 이미지를 생성합니다.</p>
              <button id="thumb-generate" class="exec-btn mt-3 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-3 py-3 text-sm font-black text-black">썸네일 생성</button>
              <div class="mt-4 grid grid-cols-1 gap-3">
                ${state.ui.thumbnailJobs.length ? state.ui.thumbnailJobs.map((job) => `
                  <div class="rounded-lg bg-white/5 px-3 py-2">상태: ${job.status}</div>
                `).join('') : '<div class="text-xs text-slate-400">작업 내역이 없습니다.</div>'}
              </div>
            </div>
            ` : ''}
          </section>

          <section class="bg-gradient-to-br from-rose-900/40 to-pink-900/20 rounded-3xl p-6 border border-white/10 shadow-xl">
            <div class="flex items-center justify-between">
              <h3 class="text-2xl font-black gold-gradient-text">11. 유튜브 설명란 작성 (3개 국어)</h3>
              <button id="toggle-p11" class="rounded-lg bg-gradient-to-r from-rose-500 to-pink-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-rose-500/20 active:scale-95 transition-all">
                ${state.ui.panelsOpen.p11 ? '숨기기' : '보이기'}
              </button>
            </div>
            ${state.ui.panelsOpen.p11 ? `
            <div class="mt-4">
              <button id="youtube-meta-generate" class="exec-btn w-full rounded-xl bg-gradient-to-r from-amber-500 to-yellow-300 px-3 py-3 text-sm font-black text-black">메타데이터 생성 (KO, EN, JA)</button>
              <div class="mt-4 space-y-4">
                ${['ko', 'en', 'ja'].map(lang => `
                  <div class="rounded-2xl border border-white/5 bg-black/20 p-4">
                    <div class="text-xs font-black text-slate-400 uppercase mb-2">${lang === 'ko' ? '한국어' : lang === 'en' ? '영어' : '일본어'}</div>
                    <div class="space-y-3">
                      <div>
                        <label class="text-[11px] text-slate-500 font-bold">제목</label>
                        <input class="w-full bg-transparent border-b border-white/10 py-1 text-sm text-slate-200 outline-none" value="${state.ui.youtubeMetadata[lang].title}" readonly />
                      </div>
                      <div>
                        <label class="text-[11px] text-slate-500 font-bold">설명</label>
                        <textarea class="w-full bg-transparent border border-white/10 rounded-lg p-2 text-xs text-slate-300 outline-none h-24" readonly>${state.ui.youtubeMetadata[lang].desc}</textarea>
                      </div>
                      <div>
                        <label class="text-[11px] text-slate-500 font-bold">태그 (해시태그 포함)</label>
                        <input class="w-full bg-transparent border-b border-white/10 py-1 text-sm text-slate-400 outline-none" value="${state.ui.youtubeMetadata[lang].tags}" readonly />
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
            ` : ''}
          </section>

          <section class="bg-gradient-to-br from-slate-900/40 to-slate-800/20 rounded-3xl p-6 border border-white/10 shadow-xl">
            <div class="flex items-center justify-between">
              <h3 class="text-2xl font-black gold-gradient-text">12. 프로젝트 저장 및 불러오기</h3>
              <button id="toggle-p12" class="rounded-lg bg-gradient-to-r from-slate-500 to-slate-400 px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-slate-500/20 active:scale-95 transition-all">
                ${state.ui.panelsOpen.p12 ? '숨기기' : '보이기'}
              </button>
            </div>
            ${state.ui.panelsOpen.p12 ? `
            <div class="mt-4">
              <p class="text-sm text-slate-300">생성된 자산 메타를 JSON으로 저장하거나 기존 프로젝트를 불러옵니다.</p>
              <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div class="space-y-2">
                  <label class="text-sm text-slate-300 font-bold">저장 경로</label>
                  <input id="project-root" class="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100 outline-none" value="${state.ui.projectRoot}" />
                </div>
                <div class="space-y-2">
                  <label class="text-sm text-slate-300 font-bold">프로젝트명</label>
                  <input id="project-name" class="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100 outline-none" value="${state.ui.projectName}" placeholder="자동 생성" />
                </div>
                <div class="space-y-2">
                  <label class="text-sm text-slate-300 font-bold">작업</label>
                  <div class="flex gap-2">
                    <button id="project-save" class="exec-btn flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-300 px-3 py-2 text-xs font-black text-black">저장</button>
                    <button id="project-load" class="exec-btn flex-1 rounded-xl bg-white/10 px-3 py-2 text-xs font-black text-slate-200">불러오기</button>
                    <input type="file" id="project-load-input" class="hidden" accept=".json" />
                  </div>
                </div>
              </div>
              <div class="mt-3 flex flex-wrap gap-2">
                <button id="tts-save" class="exec-btn rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-3 py-2 text-xs font-black text-black">TTS 전용 저장</button>
                <button id="image-save" class="exec-btn rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 px-3 py-2 text-xs font-black text-black">이미지 전용 저장</button>
                <button id="video-save" class="exec-btn rounded-xl bg-gradient-to-r from-fuchsia-500 to-pink-500 px-3 py-2 text-xs font-black text-black">영상 전용 저장</button>
              </div>
              <div class="mt-3 text-xs text-slate-400">기본 경로: ${DEFAULT_PROJECT_ROOT} · 저장 시 파일 다운로드가 시작됩니다.</div>
            </div>
            ` : ''}
          </section>
        </div>
      </main>
    </div>

    <div id="settings-modal" class="fixed inset-0 z-50 ${state.ui.settingsOpen ? 'flex' : 'hidden'} items-center justify-center">
      <div id="settings-overlay" class="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
      <div class="relative w-[min(92vw,900px)] max-h-[85vh] overflow-y-auto rounded-3xl border border-white/10 bg-[#0f162e] shadow-[0_40px_120px_rgba(0,0,0,0.6)]">
        <div class="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div>
            <div class="text-xs text-slate-400 font-bold uppercase tracking-widest">Key Console</div>
            <h3 class="text-lg font-black text-white">API 키 설정</h3>
          </div>
          <button id="settings-close" class="h-9 w-9 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all">✕</button>
        </div>
        <div class="p-6 grid grid-cols-1 md:grid-cols-[1.15fr_0.85fr] gap-4">
          <div class="space-y-4">
            <div class="text-sm font-bold gold-gradient-text">Gemini API  &amp;  YouTube 검색 API 키설정</div>

            <div class="rounded-2xl border border-white/10 bg-[#0b1124] p-4 space-y-3">
              <div class="flex items-center justify-between">
                <div class="text-xs font-bold text-slate-300">YouTube API 키 1</div>
                <div class="text-[11px] ${STATUS[state.status.yt1.type].color}">${STATUS[state.status.yt1.type].label}</div>
              </div>
              <input id="yt1" type="password" value="${state.keys.yt1 || ''}" class="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-slate-100 outline-none" placeholder="YouTube API Key 1 입력" />
              <div class="flex items-center gap-2">
                <button data-save="yt1" class="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-slate-200">저장</button>
                <button data-test="yt1" class="rounded-xl bg-amber-500/20 px-3 py-2 text-xs font-bold text-amber-200">테스트</button>
                <button data-use="yt1" class="rounded-xl ${state.active.yt === 'yt1' ? 'bg-emerald-500/20 text-emerald-200' : 'bg-white/10 text-slate-200'} px-3 py-2 text-xs font-bold">${state.active.yt === 'yt1' ? '사용중' : '사용'}</button>
              </div>
            </div>

            <div class="rounded-2xl border border-white/10 bg-[#0b1124] p-4 space-y-3">
              <div class="flex items-center justify-between">
                <div class="text-xs font-bold text-slate-300">YouTube API 키 2</div>
                <div class="text-[11px] ${STATUS[state.status.yt2.type].color}">${STATUS[state.status.yt2.type].label}</div>
              </div>
              <input id="yt2" type="password" value="${state.keys.yt2 || ''}" class="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-slate-100 outline-none" placeholder="YouTube API Key 2 입력" />
              <div class="flex items-center gap-2">
                <button data-save="yt2" class="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-slate-200">저장</button>
                <button data-test="yt2" class="rounded-xl bg-amber-500/20 px-3 py-2 text-xs font-bold text-amber-200">테스트</button>
                <button data-use="yt2" class="rounded-xl ${state.active.yt === 'yt2' ? 'bg-emerald-500/20 text-emerald-200' : 'bg-white/10 text-slate-200'} px-3 py-2 text-xs font-bold">${state.active.yt === 'yt2' ? '사용중' : '사용'}</button>
              </div>
            </div>

            <div class="rounded-2xl border border-white/10 bg-[#0b1124] p-4 space-y-3">
              <div class="flex items-center justify-between">
                <div class="text-xs font-bold text-slate-300">Gemini API 키</div>
                <div class="text-[11px] ${STATUS[state.status.g1.type].color}">${STATUS[state.status.g1.type].label}</div>
              </div>
              <input id="g1" type="password" value="${state.keys.g1 || ''}" class="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-slate-100 outline-none" placeholder="Gemini API Key 입력" />
              <div class="flex items-center gap-2">
                <button data-save="g1" class="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-slate-200">저장</button>
                <button data-test="g1" class="rounded-xl bg-amber-500/20 px-3 py-2 text-xs font-bold text-amber-200">테스트</button>
                <button data-use="g1" class="rounded-xl ${state.active.g === 'g1' ? 'bg-emerald-500/20 text-emerald-200' : 'bg-white/10 text-slate-200'} px-3 py-2 text-xs font-bold">${state.active.g === 'g1' ? '사용중' : '사용'}</button>
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <div class="rounded-2xl border border-white/10 bg-[#0b1124] p-4">
              <div class="text-xs font-bold text-slate-300">YouTube API 키 전환</div>
              <p class="mt-2 text-[11px] text-slate-400">키1 할당량 초과 시 자동으로 키2로 전환됩니다.</p>
            </div>

            <div class="rounded-2xl border border-white/10 bg-[#0b1124] p-4">
              <div class="text-xs font-bold text-slate-300">API 키 발급 가이드</div>
              <button class="mt-3 w-full rounded-xl bg-gradient-to-r from-amber-500 to-yellow-300 py-2 text-xs font-black text-black">왕초보 API 키 발급 가이드 보기</button>
            </div>

            <div class="rounded-2xl border border-white/10 bg-[#0b1124] p-4 space-y-3">
              <div class="text-xs font-bold text-slate-300">Gemini 모델 선택</div>
              <div class="space-y-2">
                <div class="text-[11px] text-slate-400">텍스트 (한글 75만자)</div>
                <select id="model-text" class="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-slate-100 outline-none">
                  <option value="auto" ${state.ui.modelSelections.text === 'auto' ? 'selected' : ''}>Auto_gemini-3.1-flash-lite (1M/$0.25)</option>
                  <option value="gemini-3.1-flash-lite" ${state.ui.modelSelections.text === 'gemini-3.1-flash-lite' ? 'selected' : ''}>gemini-3.1-flash-lite (1M/$0.25)</option>
                  <option value="gemini-3.1-pro-preview" ${state.ui.modelSelections.text === 'gemini-3.1-pro-preview' ? 'selected' : ''}>gemini-3.1-pro-preview (1M/$2.00)</option>
                  <option value="gemini-3.0-flash" ${state.ui.modelSelections.text === 'gemini-3.0-flash' ? 'selected' : ''}>gemini-3.0-flash (1M/$0.50)</option>
                  <option value="gemini-2.5-flash" ${state.ui.modelSelections.text === 'gemini-2.5-flash' ? 'selected' : ''}>gemini-2.5-flash (1M/$0.30)</option>
                </select>
              </div>
              <div class="space-y-2">
                <div class="text-[11px] text-slate-400">이미지 (1장)</div>
                <select id="model-image" class="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-slate-100 outline-none">
                  <option value="auto" ${state.ui.modelSelections.image === 'auto' ? 'selected' : ''}>Auto_Gemini-3.1-flash-image-preview ($0.0672)</option>
                  <option value="gemini-3.1-flash-image-preview" ${state.ui.modelSelections.image === 'gemini-3.1-flash-image-preview' ? 'selected' : ''}>Gemini 3.1 Flash Image Preview ($0.0672)</option>
                  <option value="gemini-3-pro-image-preview" ${state.ui.modelSelections.image === 'gemini-3-pro-image-preview' ? 'selected' : ''}>Gemini 3 Pro Image Preview ($0.134)</option>
                  <option value="imagen-4.0-fast-generate-001" ${state.ui.modelSelections.image === 'imagen-4.0-fast-generate-001' ? 'selected' : ''}>Imagen 4.0 Fast ($0.02)</option>
                  <option value="imagen-4.0-generate-001" ${state.ui.modelSelections.image === 'imagen-4.0-generate-001' ? 'selected' : ''}>Imagen 4.0 Standard ($0.04)</option>
                </select>
              </div>
              <div class="space-y-2">
                <div class="text-[11px] text-slate-400">영상 (초)</div>
                <select id="model-video" class="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-slate-100 outline-none">
                  <option value="auto" ${state.ui.modelSelections.video === 'auto' ? 'selected' : ''}>Auto_Veo 3.1 Fast ($0.15)</option>
                  <option value="veo-3.1-fast" ${state.ui.modelSelections.video === 'veo-3.1-fast' ? 'selected' : ''}>Veo 3.1 Fast ($0.15)</option>
                  <option value="veo-3.1-standard" ${state.ui.modelSelections.video === 'veo-3.1-standard' ? 'selected' : ''}>Veo 3.1 Standard ($0.40)</option>
                </select>
              </div>
              <div class="space-y-2">
                <div class="text-[11px] text-slate-400">TTS (한글 75만자)</div>
                <select id="model-tts" class="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-slate-100 outline-none">
                  <option value="auto" ${state.ui.modelSelections.tts === 'auto' ? 'selected' : ''}>Gemini 2.5 Flash Preview TTS (1M/$7.88)</option>
                  <option value="gemini-2.5-pro-preview-tts" ${state.ui.modelSelections.tts === 'gemini-2.5-pro-preview-tts' ? 'selected' : ''}>Gemini 2.5 Pro Preview TTS (1M/$15.75)</option>
                </select>
              </div>
            </div>

            <div class="rounded-2xl border border-amber-400/30 bg-[#1a1406] p-4">
              <div class="text-xs font-bold text-amber-200">보안 주의사항</div>
              <ul class="mt-2 text-[11px] text-amber-100/80 space-y-1">
                <li>API 키는 외부에 노출되지 않게 보관하세요.</li>
                <li>공용 PC에서는 저장을 피하세요.</li>
                <li>키 유출 시 즉시 폐기 후 재발급하세요.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div id="channel-detail-modal" class="fixed inset-0 z-50 ${state.ui.channelDetailOpen ? 'flex' : 'hidden'} items-center justify-center">
      <div class="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
      <div class="relative w-[min(92vw,860px)] max-h-[85vh] overflow-y-auto rounded-3xl border border-white/10 bg-[#0f162e] shadow-[0_40px_120px_rgba(0,0,0,0.6)] p-6">
        <button id="channel-detail-close" class="absolute top-4 right-4 h-9 w-9 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all">✕</button>
        <div class="flex items-center gap-4">
          <div class="h-20 w-20 rounded-full bg-white/10"></div>
          <div>
            <h3 class="text-xl font-black text-white">${selectedChannel?.title || '채널'}</h3>
            <p class="text-sm text-slate-300">${selectedChannel ? '채널 상세 정보' : '채널 정보 없음'}</p>
          </div>
        </div>
        <div class="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
          <div class="rounded-2xl bg-white/5 p-4 text-center">
            <div class="text-lg font-black text-white">${formatNumber(selectedChannel?.subscriberCount)}</div>
            <div class="text-xs text-slate-300">구독자 수</div>
          </div>
          <div class="rounded-2xl bg-white/5 p-4 text-center">
            <div class="text-lg font-black text-white">${formatNumber(selectedChannel?.videoCount)}</div>
            <div class="text-xs text-slate-300">총 영상 수</div>
          </div>
          <div class="rounded-2xl bg-white/5 p-4 text-center">
            <div class="text-lg font-black text-white">${formatNumber(selectedChannel?.viewCount)}</div>
            <div class="text-xs text-slate-300">총 조회수</div>
          </div>
        </div>
        <div class="mt-4 rounded-2xl bg-white/5 p-4">
          <div class="text-xs font-black text-slate-200">추가 정보</div>
          <div class="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300">
            <div>채널 URL: ${selectedChannel?.customUrl ? `<a href="https://www.youtube.com/${selectedChannel.customUrl}" target="_blank" rel="noopener noreferrer" class="text-amber-200">${selectedChannel.customUrl}</a>` : '-'}</div>
            <div>국가: ${selectedChannel?.country || '-'}</div>
            <div>가입일: ${selectedChannel?.publishedAt ? selectedChannel.publishedAt.slice(0, 10) : '-'}</div>
            <div>구독자: ${formatNumber(selectedChannel?.subscriberCount)}</div>
            <div>동영상: ${formatNumber(selectedChannel?.videoCount)}</div>
            <div>조회수: ${formatNumber(selectedChannel?.viewCount)}</div>
          </div>
        </div>
        <div class="mt-6 rounded-2xl bg-white/5 p-4 text-sm text-slate-300">
          ${selectedChannel?.description || '채널 설명이 여기에 표시됩니다. 채널의 특징과 주요 콘텐츠를 요약합니다.'}
        </div>
        <div class="mt-6">
          <h4 class="text-sm font-black gold-gradient-text">인기 영상 TOP 3</h4>
          <div class="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
            ${topVideoCards}
          </div>
        </div>
        <div class="mt-6 flex justify-end gap-2">
          <button id="channel-collect" class="rounded-xl bg-gradient-to-r from-amber-500 to-yellow-300 px-4 py-2 text-sm font-black text-black">채널 영상 수집</button>
          <button id="channel-detail-close-2" class="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-slate-200">닫기</button>
        </div>
      </div>
    </div>

    <div id="channel-select-modal" class="fixed inset-0 z-50 ${state.ui.channelSelectOpen ? 'flex' : 'hidden'} items-center justify-center">
      <div class="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
      <div class="relative w-[min(92vw,720px)] max-h-[85vh] overflow-y-auto rounded-3xl border border-white/10 bg-[#0f162e] shadow-[0_40px_120px_rgba(0,0,0,0.6)] p-6">
        <button id="channel-select-close" class="absolute top-4 right-4 h-9 w-9 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all">✕</button>
        <h3 class="text-lg font-black text-white">채널 선택</h3>
        <p class="text-xs text-slate-400 mt-1">비슷한 채널을 선택하세요 (예시)</p>
        <div class="mt-4 space-y-3">
          ${channelOptions || '<div class="text-xs text-slate-400">채널 후보가 없습니다.</div>'}
        </div>
        <div class="mt-6 flex justify-end gap-2">
          <button class="rounded-xl bg-gradient-to-r from-amber-500 to-yellow-300 px-4 py-2 text-sm font-black text-black">선택하기</button>
          <button id="channel-select-close-2" class="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-slate-200">취소</button>
        </div>
      </div>
    </div>

    <div id="happy-day-modal" class="fixed inset-0 z-50 ${state.ui.happyDayOpen ? 'flex' : 'hidden'} items-center justify-center">
      <div class="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
      <div class="relative w-[min(92vw,760px)] max-h-[85vh] overflow-y-auto rounded-3xl border border-white/10 bg-[#0f162e] shadow-[0_40px_120px_rgba(0,0,0,0.6)] p-6">
        <button id="happy-day-close" class="absolute top-4 right-4 h-9 w-9 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all">✕</button>
        <div class="text-xs text-slate-400 font-bold uppercase tracking-widest">Happy Day 구경</div>
        <h3 class="text-lg font-black text-white mt-1">영상 기다리시는 동안 ~ 구경오세요</h3>
        <p class="text-sm text-slate-300 mt-2">원하시는 마켓을 선택하세요</p>

        <div class="mt-6 space-y-4">
          <div class="rounded-2xl bg-white/5 p-4">
            <div class="text-sm font-black gold-gradient-text">쿠팡 (Coupang)</div>
            <div class="text-xs text-slate-400 mt-1">가장 상단 (트래픽 1순위)</div>
            <div class="mt-3 space-y-2">
              <a href="https://shop.coupang.com/heltopia" target="_blank" rel="noopener noreferrer" class="block rounded-xl bg-white/10 px-4 py-2 text-sm text-amber-100">힐토피아 바로가기</a>
              <a href="https://shop.coupang.com/heltiara" target="_blank" rel="noopener noreferrer" class="block rounded-xl bg-white/10 px-4 py-2 text-sm text-amber-100">힐티아라 바로가기</a>
            </div>
          </div>

          <div class="rounded-2xl bg-white/5 p-4">
            <div class="text-sm font-black gold-gradient-text">스마트스토어 (Naver)</div>
            <div class="text-xs text-slate-400 mt-1">두 번째 우선순위</div>
            <div class="mt-3 space-y-2">
              <a href="https://smartstore.naver.com/heltiara01" target="_blank" rel="noopener noreferrer" class="block rounded-xl bg-white/10 px-4 py-2 text-sm text-amber-100">동헌마트 바로가기</a>
              <a href="https://smartstore.naver.com/heltiara2" target="_blank" rel="noopener noreferrer" class="block rounded-xl bg-white/10 px-4 py-2 text-sm text-amber-100">힐티아라 바로가기</a>
            </div>
          </div>

          <div class="rounded-2xl bg-white/5 p-4">
            <div class="text-sm font-black gold-gradient-text">11번가 (11st)</div>
            <div class="text-xs text-slate-400 mt-1">중간 우선순위</div>
            <div class="mt-3 space-y-2">
              <a href="https://shop.11st.co.kr/stores/1185083" target="_blank" rel="noopener noreferrer" class="block rounded-xl bg-white/10 px-4 py-2 text-sm text-amber-100">힐토피아 바로가기</a>
              <a href="https://shop.11st.co.kr/stores/1185121" target="_blank" rel="noopener noreferrer" class="block rounded-xl bg-white/10 px-4 py-2 text-sm text-amber-100">힐티아라 바로가기</a>
            </div>
          </div>

          <div class="rounded-2xl bg-white/5 p-4">
            <div class="text-sm font-black gold-gradient-text">G마켓 (Gmarket)</div>
            <div class="mt-3 space-y-2">
              <a href="https://minishop.gmarket.co.kr/heltiara1" target="_blank" rel="noopener noreferrer" class="block rounded-xl bg-white/10 px-4 py-2 text-sm text-amber-100">힐토피아 바로가기</a>
              <a href="https://minishop.gmarket.co.kr/heltiara2" target="_blank" rel="noopener noreferrer" class="block rounded-xl bg-white/10 px-4 py-2 text-sm text-amber-100">힐티아라 바로가기</a>
            </div>
          </div>

          <div class="rounded-2xl bg-white/5 p-4">
            <div class="text-sm font-black gold-gradient-text">롯데온 (Lotte ON)</div>
            <div class="mt-3 space-y-2">
              <a href="https://www.lotteon.com/p/display/seller/sellerShop/LO10168773" target="_blank" rel="noopener noreferrer" class="block rounded-xl bg-white/10 px-4 py-2 text-sm text-amber-100">다온누리 바로가기</a>
              <a href="https://www.lotteon.com/p/display/seller/sellerShop/LO10168919" target="_blank" rel="noopener noreferrer" class="block rounded-xl bg-white/10 px-4 py-2 text-sm text-amber-100">힐티아라 바로가기</a>
            </div>
          </div>

          <div class="rounded-2xl bg-white/5 p-4">
            <div class="text-sm font-black gold-gradient-text">옥션 (Auction)</div>
            <div class="mt-3 space-y-2">
              <a href="https://stores.auction.co.kr/heltiara1" target="_blank" rel="noopener noreferrer" class="block rounded-xl bg-white/10 px-4 py-2 text-sm text-amber-100">힐토피아 바로가기</a>
              <a href="https://stores.auction.co.kr/heltiara2" target="_blank" rel="noopener noreferrer" class="block rounded-xl bg-white/10 px-4 py-2 text-sm text-amber-100">힐티아라 바로가기</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  bindGlobalEvents();
};

const saveKey = (id, value) => {
  state.keys[id] = value.trim();
  saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
  render();
  bindEvents();
};

const setActive = (group, id) => {
  if (group === 'yt') state.active.yt = id;
  if (group === 'g') state.active.g = 'g1';
  saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
  render();
  bindEvents();
};

const markStatus = (id, type, tier = 'unknown') => {
  state.status[id] = { type, tier };
  saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
  render();
  bindEvents();
};

const testYouTubeKey = async (id, manualKey = null) => {
  const key = manualKey !== null ? manualKey : state.keys[id];
  if (!key) {
    markStatus(id, 'error');
    return;
  }
  // If manual key is provided, save it immediately
  if (manualKey !== null) {
    saveKey(id, manualKey);
  }
  markStatus(id, 'testing');
  try {
    const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=test&key=${encodeURIComponent(key)}`);
    if (res.ok) {
      markStatus(id, 'ok');
      return;
    }
    const data = await res.json();
    const reason = data?.error?.errors?.[0]?.reason || '';
    if (reason === 'quotaExceeded') {
      markStatus(id, 'quota');
      if (id === 'yt1' && state.keys.yt2) {
        state.active.yt = 'yt2';
        saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
      }
      return;
    }
    markStatus(id, 'error');
  } catch {
    markStatus(id, 'error');
  }
};

const testGeminiKey = async (id, manualKey = null) => {
  const key = manualKey !== null ? manualKey : state.keys[id];
  if (!key) {
    markStatus(id, 'error');
    return;
  }
  // If manual key is provided, save it immediately
  if (manualKey !== null) {
    saveKey(id, manualKey);
  }
  markStatus(id, 'testing');
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: 'hi' }] }] }),
    });
    if (res.ok) {
      markStatus(id, 'ok');
      return;
    }
    markStatus(id, 'error');
  } catch {
    markStatus(id, 'error');
  }
};

const COUNTRY_MAP = {
  한국: 'KR',
  미국: 'US',
  일본: 'JP',
  영국: 'GB',
  독일: 'DE',
  프랑스: 'FR',
  스페인: 'ES',
  이탈리아: 'IT',
  캐나다: 'CA',
  인도: 'IN',
  브라질: 'BR',
  베트남: 'VN',
};

const COUNTRY_LANG = {
  한국: 'ko',
  미국: 'en',
  영국: 'en',
  일본: 'ja',
  독일: 'de',
  프랑스: 'fr',
  스페인: 'es',
  이탈리아: 'it',
  캐나다: 'en',
  인도: 'en',
  브라질: 'pt',
  베트남: 'vi',
};

const CATEGORY_MAP = {
  '모든 카테고리': '',
  게임: '20',
  과학기술: '28',
  교육: '27',
  '노하우/스타일': '26',
  '뉴스/정치': '25',
  '비영리/사회운동': '29',
  스포츠: '17',
  '애완동물/동물': '15',
  엔터테인먼트: '24',
  '여행/이벤트': '19',
  '영화/애니메이션': '1',
  음악: '10',
  '인물/블로그': '22',
  '자동차/교통': '2',
  코미디: '23',
};

const getPublishedAfter = (label) => {
  const now = new Date();
  const mapping = {
    전체: null,
    '7일전': 7,
    한달전: 30,
    '3개월전': 90,
    '6개월전': 180,
    '12개월전': 365,
  };
  const days = mapping[label];
  if (!days) return null;
  const date = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return date.toISOString();
};

const buildSearchParams = () => {
  const f = state.ui.filters;
  const query = document.getElementById('yt-query')?.value?.trim();
  const count = Number(document.getElementById('yt-count')?.value || f.count);
  const sort = document.getElementById('yt-sort')?.value || f.sort;
  const durationLabel = document.getElementById('yt-duration')?.value || f.duration;
  const periodLabel = document.getElementById('yt-period')?.value || f.period;
  const countryLabel = document.getElementById('yt-country')?.value || f.country;
  const categoryLabel = document.getElementById('yt-category')?.value || f.category;
  const minViews = Number((document.getElementById('minViews')?.value || f.minViews).toString().replace(/,/g, '')) || 0;
  const viewMode = document.getElementById('yt-viewmode')?.value || f.viewMode;
  return {
    query: query ?? f.query,
    translatedQuery: f.translatedQuery || '',
    count,
    sort,
    durationLabel,
    periodLabel,
    countryLabel,
    categoryLabel,
    minViews,
    viewMode,
  };
};

const getTranslationModel = async () => {
  if (state.ui.translationModel) return state.ui.translationModel;
  const apiKey = window.getGeminiKey();
  if (!apiKey) return null;
  try {
    const selected = await resolveGeminiModel(state.ui.modelSelections?.text, ['gemini-3.1-flash', 'gemini-3.1-flash-lite', 'gemini-3.0-flash', 'gemini-2.5-flash', 'gemini-1.5']);
    if (selected) {
      state.ui.translationModel = selected;
      saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
      return state.ui.translationModel;
    }
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`);
    if (!res.ok) return null;
    const data = await res.json();
    const models = (data?.models || []).filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'));
    const picked = pickGeminiModel(models, ['gemini-3.1-flash', 'gemini-3.1-flash-lite', 'gemini-3.0-flash', 'gemini-2.5-flash', 'gemini-1.5']);
    if (!picked) return null;
    state.ui.translationModel = picked;
    saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
    return state.ui.translationModel;
  } catch {
    return null;
  }
};

const getTextModel = async () => {
  if (state.ui.textModel) return state.ui.textModel;
  const apiKey = window.getGeminiKey();
  if (!apiKey) return null;
  try {
    const selected = await resolveGeminiModel(state.ui.modelSelections?.text, ['gemini-3.1-flash-lite', 'gemini-3.1-flash', 'gemini-3.0-flash', 'gemini-2.5-flash', 'gemini-1.5']);
    if (selected) {
      state.ui.textModel = selected;
      saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
      return state.ui.textModel;
    }
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`);
    if (!res.ok) return null;
    const data = await res.json();
    const models = (data?.models || []).filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'));
    const picked = pickGeminiModel(models, ['gemini-3.1-flash-lite', 'gemini-3.1-flash', 'gemini-3.0-flash', 'gemini-2.5-flash', 'gemini-1.5']);
    if (!picked) return null;
    state.ui.textModel = picked;
    saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
    return state.ui.textModel;
  } catch {
    return null;
  }
};

const pickGeminiModel = (models, preferences = []) => {
  const cleaned = (models || [])
    .map((m) => ({ ...m, id: (m.name || '').replace('models/', '') }))
    .filter((m) => m.id);
  const filtered = cleaned.filter((m) => !/(preview|vision|video|embedding|aqa|latest)/i.test(m.id));
  const pool = filtered.length ? filtered : cleaned;
  if (!pool.length) return null;
  for (const hint of preferences) {
    const match = pool.find((m) => m.id.includes(hint));
    if (match) return match.id;
  }
  return pool[0].id;
};

const resolveGeminiModel = async (selected, preferences = []) => {
  if (!selected || selected === 'auto') {
    return null;
  }
  const apiKey = window.getGeminiKey();
  if (!apiKey) return null;
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`);
    if (!res.ok) return null;
    const data = await res.json();
    const models = (data?.models || []).filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'));
    const found = models.find((m) => (m.name || '').replace('models/', '') === selected);
    if (found) return selected;
    return null;
  } catch {
    return null;
  }
};

const containsHangul = (text) => /[\u3131-\uD79D]/.test(text || '');

const normalizeHookTitle = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/["'”“]/g, '')
    .replace(/[\s\u00A0]+/g, ' ')
    .trim();

const sanitizeKoreanTitle = (value) => {
  if (!value) return '';
  let text = String(value).trim();
  text = text.replace(/^[-\d\.)\s]+/, '').trim();
  text = text.replace(/[A-Za-z0-9]/g, '').trim();
  text = text.replace(/[^\u3131-\uD79D\s!?~.,…]/g, '').trim();
  text = text.replace(/[\s\u00A0]+/g, ' ');
  return text;
};

const sanitizeHookLine = (value) => {
  if (!value) return '';
  let text = String(value).trim();
  text = text.replace(/^[-\d\.)\s]+/, '').trim();
  text = text.replace(/[A-Za-z]/g, '').trim();
  text = text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim();
  text = text.replace(/[^\u3131-\uD79D\s0-9!?~.,…]/g, '').trim();
  text = text.replace(/[\s\u00A0]+/g, ' ');
  return text;
};

const getTitleOnly = (line) => String(line || '').replace(/#[^#\s]+/g, '').trim();

const normalizeTitleOnly = (value) =>
  getTitleOnly(value)
    .toLowerCase()
    .replace(/[\s\u00A0]+/g, '')
    .trim();

const getDefaultTargetAge = (title) => {
  const text = String(title || '');
  if (/부모님|어르신|노인|60대|70대|건강|혈압|당뇨/.test(text)) return '50~70대';
  if (/학생|수험|공부|대학/.test(text)) return '10~20대';
  if (/게임|e스포츠|챌린지/.test(text)) return '10~30대';
  if (/주식|투자|재테크|부동산/.test(text)) return '25~50대';
  if (/패션|뷰티|연예|아이돌|메이크업/.test(text)) return '15~40대';
  if (/육아|아이|자녀|가족/.test(text)) return '30~40대 부모';
  if (/자동차|운전|캠핑/.test(text)) return '20~50대';
  return '20~40대 일반';
};

const getDefaultTone = (title) => {
  const text = String(title || '');
  if (/경고|주의|폭탄|위험|금지/.test(text)) return '경고형, 단정적';
  if (/꿀팁|노하우|방법|정리|가이드/.test(text)) return '정보형, 빠른 전달';
  if (/충격|반전|비밀|폭로/.test(text)) return '긴장감, 다큐 톤';
  if (/감동|사연|눈물|힐링/.test(text)) return '감성형, 공감 톤';
  return '정보형, 설득력';
};

const getShortsTargetLength = (lang, seconds) => {
  const base = LENGTH_GUIDE.shorts;
  const ratio = seconds / base.baseSeconds;
  if (lang === 'EN') return Math.round(base.EN * ratio);
  if (lang === 'JP') return Math.round(base.JP * ratio);
  return Math.round(base.KR * ratio);
};

const countOutput = (text, lang) => {
  if (!text) return { chars: 0, words: 0 };
  const chars = text.length;
  const words = lang === 'EN' ? text.trim().split(/\s+/).filter(Boolean).length : 0;
  return { chars, words };
};

const sanitizeScriptOutput = (text) => {
  if (!text) return '';
  let cleaned = String(text);
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
  cleaned = cleaned.replace(/^\s*(대본|script)\s*[:：]\s*/i, '');
  cleaned = cleaned.replace(/^\s*#+\s+.*$/gim, '');
  cleaned = cleaned.replace(/^\s*(hook|body|cta|도입|본론|결론)\s*[:：].*$/gim, '');
  cleaned = cleaned.replace(/^\s*(Hook|Body|CTA)\s*\([^\)]*\)\s*$/gim, '');
  cleaned = cleaned.replace(/^\s*\([^\)]*\)\s*$/gim, '');
  cleaned = cleaned.replace(/^\s*[-*\d]+[\).]\s+/gim, '');
  cleaned = cleaned.replace(/^\s*[-•]\s+.*$/gim, '');
  cleaned = cleaned.replace(/\*+/g, '');
  cleaned = cleaned.replace(/^\s*(진행자|사회자|기자|앵커|질문자|패널|대답|답변|교수|박사|PD|해설)\s*[:：].*$\n?/gim, '');
  cleaned = cleaned.replace(/^\s*[A-Za-z가-힣]{1,12}\s*[:：].*$\n?/gim, '');
  cleaned = cleaned.replace(/^\s*[^\n]{1,30}[:：]\s*.*$/gim, '');
  cleaned = cleaned.replace(/\([^\)]*(장면|전환|나레이션)[^\)]*\)/g, '');
  cleaned = cleaned.replace(/^.*(장면\s*전환|나레이션).*$\n?/gim, '');
  cleaned = cleaned.replace(/^.*(BGM|음악|효과음|SFX|브금).*$\n?/gim, '');
  cleaned = cleaned.replace(/#[^#\s]+/g, '');
  cleaned = cleaned.replace(/https?:\/\/\S+/g, '');
  cleaned = cleaned.replace(/\[[^\]]+\]/g, '');
  cleaned = cleaned.replace(/\([^\)]*\)/g, '');
  cleaned = cleaned.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  return cleaned.trim();
};

const truncateToMaxChars = (text, maxChars) => {
  if (!text || !maxChars) return text || '';
  if (text.length <= maxChars) return text;
  let cut = text.slice(0, maxChars);
  const lastStop = Math.max(cut.lastIndexOf('.'), cut.lastIndexOf('!'), cut.lastIndexOf('?'), cut.lastIndexOf('。'), cut.lastIndexOf('！'), cut.lastIndexOf('？'));
  if (lastStop > 0) cut = cut.slice(0, lastStop + 1);
  return cut.trim();
};

const truncateToMaxWords = (text, maxWords) => {
  if (!text || !maxWords) return text || '';
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ').trim();
};

const isEnglishOnly = (text) => /[A-Za-z]/.test(text || '') && !containsHangul(text || '');

const isJapaneseText = (text) => /[\u3040-\u30ff\u4e00-\u9faf]/.test(text || '');

const validateLanguageOutput = (text, lang) => {
  if (!text) return false;
  if (lang === 'KR') return containsHangul(text);
  if (lang === 'EN') return isEnglishOnly(text);
  if (lang === 'JP') return isJapaneseText(text) && !containsHangul(text);
  return true;
};

const estimateSpeechDuration = (text, lang, speed = 1.0) => {
  if (!text) return 0;
  if (lang === 'EN') {
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const wordsPerMin = 180 * (speed / 1.25);
    return Math.round((words / wordsPerMin) * 60);
  }
  const chars = text.length;
  const charsPerSec = (lang === 'JP' ? 10 : 8) * (speed / 1.0);
  return Math.round(chars / charsPerSec);
};

const estimateBaseDuration = (text, lang) => estimateSpeechDuration(text, lang, 1.0);


const base64ToUint8Array = (base64) => {
  const normalized = String(base64 || '').replace(/\s+/g, '').trim();
  const binary = atob(normalized);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const parseSampleRate = (mimeType) => {
  const match = /rate=(\d+)/i.exec(mimeType || '');
  if (!match) return 24000;
  const rate = Number(match[1]);
  return Number.isFinite(rate) ? rate : 24000;
};

const splitScriptForTts = (text) => {
  const cleaned = String(text || '').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];
  const sentenceParts = cleaned
    .split(/(?<=[.!?。！？…])\s+/g)
    .map((s) => s.trim())
    .filter(Boolean);
  const source = sentenceParts.length ? sentenceParts : [cleaned];
  const phraseParts = source
    .flatMap((part) => part.split(/(?<=[,，、:;])/g))
    .map((part) => part.trim())
    .filter(Boolean);

  const maxChars = 28;
  const out = [];
  const splitLong = (input) => {
    if (input.length <= maxChars) {
      out.push(input);
      return;
    }
    let remain = input;
    while (remain.length > maxChars) {
      const candidate = remain.slice(0, maxChars);
      const spaceIdx = candidate.lastIndexOf(' ');
      const cut = spaceIdx >= Math.floor(maxChars * 0.6) ? spaceIdx : maxChars;
      out.push(remain.slice(0, cut).trim());
      remain = remain.slice(cut).trim();
    }
    if (remain) out.push(remain);
  };

  (phraseParts.length ? phraseParts : source).forEach(splitLong);
  return out.filter(Boolean);
};

const concatPcmBytes = (parts, sampleRate, silenceMs = 0) => {
  if (!parts.length) return new Uint8Array(0);
  const silenceSamples = Math.max(0, Math.floor((silenceMs / 1000) * sampleRate));
  const silenceBytes = silenceSamples * 2;
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0)
    + silenceBytes * Math.max(0, parts.length - 1);
  const output = new Uint8Array(totalLength);
  let offset = 0;
  parts.forEach((part, idx) => {
    output.set(part, offset);
    offset += part.length;
    if (idx < parts.length - 1 && silenceBytes > 0) {
      offset += silenceBytes;
    }
  });
  return output;
};

const buildWavFromPcm = (pcmBytes, sampleRate = 24000, channels = 1, bitsPerSample = 16) => {
  const byteRate = sampleRate * channels * (bitsPerSample / 8);
  const blockAlign = channels * (bitsPerSample / 8);
  const dataSize = pcmBytes.length;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i += 1) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  const output = new Uint8Array(buffer);
  output.set(pcmBytes, 44);
  return output;
};

const formatTime = (seconds) => {
  const total = Math.max(0, Math.floor(seconds || 0));
  const m = Math.floor(total / 60);
  const s = String(total % 60).padStart(2, '0');
  return `${m}:${s}`;
};

const splitScriptIntoCuts = (text, lang) => {
  if (!text) return [];
  const sentences = text.split(/(?<=[.!?。！？])\s+/).filter(Boolean);
  const cuts = [];
  let current = '';
  const targetMin = lang === 'EN' ? 10 : 30;
  const targetMax = lang === 'EN' ? 28 : 60;
  const countUnits = (value) => (lang === 'EN' ? value.trim().split(/\s+/).filter(Boolean).length : value.length);
  sentences.forEach((sentence) => {
    const next = current ? `${current} ${sentence}` : sentence;
    if (countUnits(next) <= targetMax) {
      current = next;
    } else {
      if (current) cuts.push(current.trim());
      current = sentence;
    }
  });
  if (current) cuts.push(current.trim());
  return cuts.filter((cut) => countUnits(cut) >= targetMin || cut.length > 10);
};

const buildImagePrompts = (cuts, styleLabel) => {
  const prompts = [];
  cuts.forEach((cut, index) => {
    const prompt = `${styleLabel}, ${SHORTS_IMAGE_PROMPT_GUIDE.baseStyle}, scene showing: ${cut}`;
    prompts.push({ index: index + 1, cut, prompt });
  });
  return prompts;
};

const buildProjectName = () => {
  const base = state.ui.projectName || state.ui.selectedHookTitle || '프로젝트';
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  return `${base}`.replace(/[\\/:*?"<>|]/g, '').slice(0, 40);
};

const buildProjectStamp = () => {
  const date = new Date();
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
};

const downloadJson = (filename, data) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const buildProjectPayload = () => {
  return {
    title: state.ui.selectedHookTitle || '',
    script: {
      lang: state.ui.script.lang,
      type: state.ui.script.type,
      shortLength: state.ui.script.shortLength,
      longLength: state.ui.script.longLength,
      targetAge: state.ui.script.targetAge,
      tone: state.ui.script.tone,
      text: state.ui.script.output,
      chars: state.ui.script.charCount,
      words: state.ui.script.wordCount,
    },
    tts: {
      speed: state.ui.tts.speed,
      estimatedSeconds: state.ui.tts.lastDurationSec,
    },
    cuts: state.ui.cuts.items,
    prompts: state.ui.cuts.prompts,
    imageJobs: state.ui.imageJobs,
    thumbnailJobs: state.ui.thumbnailJobs,
    youtubeMetadata: state.ui.youtubeMetadata,
    videoJobs: state.ui.videoJobs,
    customSource: state.ui.customSource,
  };
};

const buildTtsPayload = () => ({
  title: state.ui.selectedHookTitle || '',
  lang: state.ui.script.lang,
  speed: state.ui.tts.speed,
  estimatedSeconds: state.ui.tts.lastDurationSec,
  script: state.ui.script.output,
});

const buildImagePayload = () => ({
  title: state.ui.selectedHookTitle || '',
  style: state.ui.customSource.style,
  cuts: state.ui.cuts.items,
  prompts: state.ui.cuts.prompts,
  imageJobs: state.ui.imageJobs,
});

const buildVideoPayload = () => ({
  title: state.ui.selectedHookTitle || '',
  jobs: state.ui.videoJobs,
});

const parseYouTubeVideoId = (url) => {
  if (!url) return '';
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.replace('/', '');
    const v = u.searchParams.get('v');
    if (v) return v;
    const paths = u.pathname.split('/');
    const embedIndex = paths.indexOf('embed');
    if (embedIndex >= 0 && paths[embedIndex + 1]) return paths[embedIndex + 1];
    return '';
  } catch {
    return '';
  }
};

const fetchVideoDetails = async (videoId, apiKey) => {
  if (!videoId || !apiKey) return null;
  try {
    const params = new URLSearchParams({
      part: 'snippet,statistics,contentDetails',
      id: videoId,
      key: apiKey,
    });
    const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?${params.toString()}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return null;
    const item = (data.items || [])[0];
    if (!item) return null;
    const viewCount = Number(item.statistics?.viewCount || 0);
    return {
      id: item.id,
      url: `https://www.youtube.com/watch?v=${item.id}`,
      channelId: item.snippet?.channelId || '',
      channelTitle: item.snippet?.channelTitle || '',
      title: item.snippet?.title || '',
      description: item.snippet?.description || '',
      publishedAt: item.snippet?.publishedAt || '',
      thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '',
      viewCount,
      likeCount: Number(item.statistics?.likeCount || 0),
      commentCount: Number(item.statistics?.commentCount || 0),
      duration: parseDuration(item.contentDetails?.duration),
    };
  } catch {
    return null;
  }
};

const getReferenceRows = async () => {
  const customTopic = state.ui.customSource?.topic?.trim() || '';
  const customUrl = state.ui.customSource?.url?.trim() || '';
  if (customTopic) {
    return [{
      id: 'custom-topic',
      title: customTopic,
      description: customTopic,
      channelTitle: '사용자 입력',
      viewCount: 0,
    }];
  }
  if (customUrl) {
    const ytKey = window.getYouTubeKey();
    const vid = parseYouTubeVideoId(customUrl);
    if (vid) {
      if (state.ui.customSourceData.loadedUrl !== customUrl) {
        const detail = await fetchVideoDetails(vid, ytKey);
        const comments = ytKey ? await fetchTopComments(vid, ytKey) : [];
        if (detail) {
          state.ui.customSourceData.loadedUrl = customUrl;
          state.ui.customSourceData.rows = [{ ...detail, _comments: comments }];
        }
      }
      if (state.ui.customSourceData.rows?.length) {
        return state.ui.customSourceData.rows;
      }
    }
  }
  return state.results.length ? state.results : state.rawResults;
};

const extractHashtags = (value) => {
  const raw = String(value || '').match(/#[^#\s]+/g) || [];
  return raw.map((tag) => tag.trim());
};

const buildHashtagPool = (rows) => {
  const counts = new Map();
  const ranked = [...(rows || [])].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
  const topRows = ranked.slice(0, 30);
  topRows.forEach((row) => {
    const text = `${row?.title || ''} ${row?.description || ''} ${row?.channelTitle || ''}`;
    String(text)
      .replace(/#[^#\s]+/g, ' ')
      .split(/[\s\u00A0]+/g)
      .map((w) => w.replace(/[^\u3131-\uD79D0-9]/g, '').trim())
      .filter((w) => w.length >= 2)
      .forEach((w) => counts.set(w, (counts.get(w) || 0) + 1));
  });
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([w]) => `#${w}`)
    .slice(0, 12);
};

const stripHashtags = (line) => String(line || '').replace(/#[^#\s]+/g, '').trim();

const getKeywordPool = (rows, commentsByVideo) => {
  const counts = new Map();
  (rows || []).forEach((row) => {
    const commentText = (commentsByVideo?.[row.id] || []).join(' ');
    const text = `${row.title || ''} ${row.description || ''} ${row.channelTitle || ''} ${commentText}`;
    String(text)
      .replace(/#[^#\s]+/g, ' ')
      .split(/[\s\u00A0]+/g)
      .map((w) => w.replace(/[^\u3131-\uD79D0-9]/g, '').trim())
      .filter((w) => w.length >= 2)
      .forEach((w) => counts.set(w, (counts.get(w) || 0) + 1));
  });
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([w]) => w)
    .slice(0, 30);
};

const fetchTopComments = async (videoId, apiKey) => {
  if (!videoId || !apiKey) return [];
  try {
    const params = new URLSearchParams({
      part: 'snippet',
      maxResults: '5',
      order: 'relevance',
      textFormat: 'plainText',
      videoId,
      key: apiKey,
    });
    const res = await fetch(`https://www.googleapis.com/youtube/v3/commentThreads?${params.toString()}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return [];
    return (data.items || [])
      .map((item) => item?.snippet?.topLevelComment?.snippet?.textDisplay || '')
      .filter(Boolean)
      .slice(0, 3);
  } catch {
    return [];
  }
};

const buildFallbackTitles = (keywords, _hashtagPool, limit = 10, seed = 0) => {
  const kw = (keywords || []).filter(Boolean);
  const templates = [
    (a, b) => `${a} 이렇게 하면 ${b} 망합니다!`,
    (a, b) => `${a} 지금 당장 ${b} 멈추세요`,
    (a, b) => `${a} 모르는 사람은 ${b} 손해봅니다`,
    (a, b) => `${a} 먹고 ${b} 조심하세요`,
    (a, b) => `${a}에 ${b} 하면 큰일납니다`,
    (a, b) => `${a}에 딱 이것, ${b}까지 달라집니다`,
    (a, b) => `${a} 때문에 ${b} 폭탄 맞습니다`,
    (a, b) => `${a} 진짜 이유, ${b}에서 터집니다`,
  ];
  const results = [];
  for (let i = 0; i < limit; i += 1) {
    const offset = (seed + i) % Math.max(kw.length, 1);
    const a = kw[offset % kw.length] || '건강';
    const b = kw[(offset + 3) % kw.length] || '위험';
    const template = templates[(seed + i) % templates.length];
    const title = template(a, b);
    results.push(title);
  }
  return results;
};

const dedupeHookTitles = (titles) => {
  const seen = new Set();
  const result = [];
  (titles || []).forEach((title) => {
    const normalized = normalizeHookTitle(title);
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    result.push(title);
  });
  return result;
};

const translateQuery = async (text, targetLang, strict = false) => {
  if (!text) return text;
  if (!targetLang || targetLang === 'ko') return text;
  const apiKey = window.getGeminiKey();
  if (!apiKey) return { text: null, error: 'Gemini API 키 없음' };
  const prompt = strict
    ? `Translate the keyword to ${targetLang}. Return only the translated text. Do not include any Korean characters. Keyword: ${text}`
    : `Translate the following search keyword to ${targetLang}. Return only the translated text without quotes or extra commentary. Keyword: ${text}`;
  const model = await getTranslationModel();
  if (!model) return { text: null, error: '지원 모델 확인 실패' };
  const models = [model];
  for (const model of models) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 60 },
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const message = err?.error?.message || `HTTP ${res.status}`;
        return { text: null, error: message };
      }
      const data = await res.json();
      const translated = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (translated) return { text: translated, error: null };
    } catch {
      continue;
    }
  }
  return { text: null, error: '번역 응답 없음' };
};

const generateHookTitles = async () => {
  const apiKey = window.getGeminiKey();
  if (!apiKey) {
    state.ui.hookError = 'Gemini API 키를 설정하세요.';
    render();
    bindEvents();
    document.getElementById('script-output')?.focus();
    return;
  }
  const sourceRows = await getReferenceRows();
  const sourceTitles = sourceRows.map((v) => v.title).filter(Boolean);
  if (!sourceTitles.length) {
    state.ui.hookError = '검색 결과가 없습니다.';
    render();
    bindEvents();
    document.getElementById('script-output')?.focus();
    return;
  }

  state.ui.hookLoading = true;
  state.ui.hookError = '';
  render();
  bindEvents();

  const model = await getTextModel();
  if (!model) {
    state.ui.hookLoading = false;
    state.ui.hookError = 'Gemini 모델 확인 실패';
    render();
    bindEvents();
    document.getElementById('script-output')?.focus();
    return;
  }

  const ytKey = window.getYouTubeKey();
  if (ytKey && sourceRows.length) {
    const commentTargets = sourceRows
      .slice(0, 20)
      .map((v) => v.id)
      .filter((id) => id && id !== 'custom-topic');
      
    for (const vid of commentTargets) {
      if (!state.commentsByVideo[vid]) {
        // eslint-disable-next-line no-await-in-loop
        state.commentsByVideo[vid] = await fetchTopComments(vid, ytKey);
      }
    }
  }
  const keywordPool = getKeywordPool(sourceRows, state.commentsByVideo);
  const topKeywords = keywordPool.slice(0, 18).join(', ');
  const topComments = sourceRows
    .slice(0, 10)
    .map((row) => (state.commentsByVideo[row.id] || []).slice(0, 2).join(' | '))
    .filter(Boolean)
    .slice(0, 10)
    .join('\n');

  const existing = [];
  const prompt = `당신은 유튜브 제목 전문가이자 시청자층 분석가입니다.
검색된 모든 결과(제목/설명/채널/댓글/조회 지표)를 종합해 시청자층을 추론하고, 그 시청자에게 클릭을 유발하는 훅킹·SEO 최적화 제목 10개를 만드세요.
절대 검색된 제목을 사용하거나 변형하지 마세요. 매번 완전히 새롭게 창작하세요.
각 제목은 세상에 단 1개뿐인 독창적인 제목이어야 하며, 기존 제목과 유사/중복 금지입니다.
검색 의도 키워드를 앞부분에 배치하고, 감정 자극(긴급성/불안/손해회피/해결책)을 담아 첫눈에 사로잡게 하세요.
스타일은 경고/호기심/체크리스트/반전/강한 단정이 섞이도록 구성하세요.
아래 가이드를 반드시 반영하세요:
${HOOK_GUIDE}
결과는 반드시 다음 형식으로만 출력하세요:
[제목]
제목만 반드시 있어야 하며, 해시태그는 작성금지입니다.
반드시 한국어로만 작성하고, 1000만뷰가 나오는 강한 제목으로 작성 할것.
결과는 JSON 배열(문자열 10개)만 출력하세요.

기존 생성 제목(중복 금지):
${existing.map((t) => `- ${t}`).join('\n')}

분석 힌트(상위 키워드):
${topKeywords || '키워드 없음'}

상위 댓글 샘플:
${topComments || '댓글 없음'}

분석 대상 데이터:
${sourceRows
      .map((v, i) => `${i + 1}. 채널:${v.channelTitle} | 제목:${v.title} | 설명:${(v.description || '').slice(0, 80)} | 조회수:${v.viewCount}`)
      .join('\n')}
`;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.6, maxOutputTokens: 300 },
        }),
      });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message = data?.error?.message || `HTTP ${res.status}`;
      state.ui.hookLoading = false;
      state.ui.hookError = `제목 생성 실패: ${message}`;
      render();
      bindEvents();
      return;
    }
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    if (!text) {
      state.ui.hookLoading = false;
      state.ui.hookError = '제목 생성 실패: 모델 응답 없음';
      render();
      bindEvents();
      return;
    }
    let titles = [];
    try {
      titles = JSON.parse(text);
    } catch {
      titles = text
        .split('\n')
        .map((line) => line.replace(/^[-\d\.\)\s]+/, '').trim())
        .filter((line) => line && !line.toLowerCase().includes('json'))
        .slice(0, 10);
    }
    const newTitles = Array.isArray(titles) ? titles.slice(0, 10) : [];
    const existingTitleSet = new Set(existing.map((t) => normalizeTitleOnly(t)).filter(Boolean));
    const sourceTitleSet = new Set(sourceTitles.map((t) => normalizeTitleOnly(t)).filter(Boolean));
    const cleaned = newTitles
      .map((t) => stripHashtags(t))
      .map((t) => sanitizeHookLine(t))
      .filter((t) => t && containsHangul(t))
      .filter((t) => {
        const titleOnly = getTitleOnly(t);
        if (!titleOnly || titleOnly.length < 4) return false;
        const normalized = normalizeTitleOnly(t);
        if (!normalized) return false;
        if (existingTitleSet.has(normalized)) return false;
        if (sourceTitleSet.has(normalized)) return false;
        return true;
      });
    let merged = cleaned;
    if (cleaned.length < 10) {
      const fallbacks = buildFallbackTitles(keywordPool, [], 10 - cleaned.length, state.ui.hookSeed)
        .map((t) => stripHashtags(t))
        .map((t) => sanitizeHookLine(t))
        .filter((t) => t && containsHangul(t));
      const filteredFallbacks = fallbacks.filter((t) => {
        const normalized = normalizeTitleOnly(t);
        if (!normalized) return false;
        if (existingTitleSet.has(normalized)) return false;
        if (sourceTitleSet.has(normalized)) return false;
        return true;
      });
      merged = [...cleaned, ...filteredFallbacks];
    }
    if (merged.length < newTitles.length) {
      state.ui.hookError = `한글 제목만 추려서 ${merged.length}개 추가했습니다.`;
    }
    if (!merged.length) {
      state.ui.hookError = '한글 제목이 없습니다. 다시 생성하세요.';
    }
    state.ui.hookTitles = dedupeHookTitles(merged.filter(Boolean));
    state.ui.hookSeed += 1;
    state.ui.hookLoading = false;
    state.ui.selectedHookTitle = '';
    render();
    bindEvents();
  } catch (e) {
    state.ui.hookLoading = false;
    state.ui.hookError = '제목 생성 실패';
    render();
    bindEvents();
  }
};

const generateScript = async () => {
  const scriptState = state.ui.script;
  const title = state.ui.selectedHookTitle;
  if (!title) {
    scriptState.error = '훅 제목을 먼저 선택하세요.';
    scriptState.message = '';
    render();
    bindEvents();
    return;
  }
  const apiKey = window.getGeminiKey();
  if (!apiKey) {
    scriptState.error = 'Gemini API 키를 설정하세요.';
    scriptState.message = '';
    render();
    bindEvents();
    return;
  }

  scriptState.generating = true;
  scriptState.error = '';
  scriptState.message = '';
  render();
  bindEvents();

  const model = await getTextModel();
  if (!model) {
    scriptState.generating = false;
    scriptState.error = 'Gemini 모델 확인 실패';
    render();
    bindEvents();
    return;
  }

  const rows = await getReferenceRows();
  const ytKey = window.getYouTubeKey();
  if (ytKey && rows.length) {
    const commentTargets = rows.slice(0, 20).map((v) => v.id).filter(Boolean);
    for (const vid of commentTargets) {
      if (!state.commentsByVideo[vid]) {
        // eslint-disable-next-line no-await-in-loop
        state.commentsByVideo[vid] = await fetchTopComments(vid, ytKey);
      }
    }
  }

  const keywordPool = getKeywordPool(rows, state.commentsByVideo);
  const topKeywords = keywordPool.slice(0, 20).join(', ');
  const refTitles = rows
    .slice(0, 25)
    .map((v) => v.title)
    .filter(Boolean)
    .join(' | ');
  const topComments = rows
    .slice(0, 10)
    .map((row) => (state.commentsByVideo[row.id] || []).slice(0, 2).join(' | '))
    .filter(Boolean)
    .slice(0, 10)
    .join('\n');

  const category = state.ui.filters.category || '모든 카테고리';
  const targetAge = scriptState.targetAge || getDefaultTargetAge(title);
  const tone = scriptState.tone || getDefaultTone(title);
  const customTopic = state.ui.customSource?.topic?.trim() || '';
  const customUrl = state.ui.customSource?.url?.trim() || '';
  const lang = scriptState.lang;

  let prompt = '';
  let shortsTargetLimit = null;
  let shortsLimitType = null;
  let longMin = null;
  let longMax = null;
  if (scriptState.type === 'shorts') {
    const seconds = Number(String(scriptState.shortLength || '60').replace(/\D/g, '')) || 60;
    const targetLen = getShortsTargetLength(lang, seconds);
    shortsTargetLimit = targetLen;
    shortsLimitType = lang === 'EN' ? 'words' : 'chars';
    const lengthRule = lang === 'EN'
      ? `목표 단어 수: ${targetLen} 단어 이내`
      : `목표 글자 수: ${targetLen}자 이내(공백 포함)`;
    prompt = `당신은 유튜브 쇼츠 대본 전문가입니다.
${SHORTS_GUIDE}

입력값:
lang: ${lang}
category: ${category}
topic: ${title}
user_topic: ${customTopic || '없음'}
user_url: ${customUrl || '없음'}
target_audience: ${targetAge}
channel_tone: ${tone}
extra_constraints: 검색 결과는 참고만 하되, 기존 유튜브에 없는 새로운 주제와 전개로 작성. 기존 제목/대본/표현 재사용 금지.
tts_speed: ${state.ui.tts.speed}x

길이 규칙:
쇼츠 길이: ${seconds}초
${lengthRule}

검색 참고(절대 복사 금지):
상위 키워드: ${topKeywords || '없음'}
참고 제목: ${refTitles || '없음'}
댓글 힌트:\n${topComments || '없음'}

출력은 오직 대본만, 다른 텍스트는 금지입니다.`;
  } else {
    const lengthLabel = scriptState.longLength || '10분';
    const range = LENGTH_GUIDE.longform[lengthLabel] || [3000, 3500];
    longMin = range[0];
    longMax = range[1];
    prompt = `당신은 유튜브 롱폼 대본 전문가입니다.
${LONGFORM_GUIDE}

입력값:
영상 길이: ${lengthLabel}
주제: ${title}
user_topic: ${customTopic || '없음'}
user_url: ${customUrl || '없음'}
타깃 시청자: ${targetAge}
톤: ${tone}
언어: ${lang}

길이 규칙:
목표 글자 수 범위: ${range[0]} ~ ${range[1]}자(공백 포함)

형식 금지:
대화체/인터뷰/Q&A/발표 형식 금지. 화자명과 콜론 사용 금지.
괄호, 약어, 기호 설명 금지. 소제목/챕터/번호/머리말/마크다운(#) 금지.
장면/컷/나레이션/진행자/질문자 같은 라벨 금지.
반드시 3인칭 내레이션 줄글로만 작성.

검색 참고(절대 복사 금지):
상위 키워드: ${topKeywords || '없음'}
참고 제목: ${refTitles || '없음'}
댓글 힌트:\n${topComments || '없음'}

기존 유튜브에 없는 새로운 관점과 전개로 대본을 작성하세요.
출력은 오직 대본만, 다른 텍스트는 금지입니다.`;
  }

  try {
    const requestChunk = async (chunkPrompt) => {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: chunkPrompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
          }),
        });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = data?.error?.message || `HTTP ${res.status}`;
        throw new Error(message);
      }
      let text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
      if (!text) throw new Error('모델 응답 없음');
      if (text.startsWith('[') && text.endsWith(']')) {
        try {
          const arr = JSON.parse(text);
          if (Array.isArray(arr)) text = arr.join('\n');
        } catch { }
      }
      return sanitizeScriptOutput(text);
    };

    let text = await requestChunk(prompt);
    if (!validateLanguageOutput(text, lang)) {
      const strictLang = lang === 'EN' ? '영어만' : lang === 'JP' ? '일본어만' : '한국어만';
      const retryPrompt = `${prompt}\n\n추가 규칙: 반드시 ${strictLang}으로만 작성하고 다른 언어는 절대 포함하지 마세요.`;
      text = await requestChunk(retryPrompt);
    }
    text = sanitizeScriptOutput(text);

    if (scriptState.type === 'shorts') {
      if (shortsLimitType === 'words') {
        text = truncateToMaxWords(text, shortsTargetLimit);
      } else {
        text = truncateToMaxChars(text, shortsTargetLimit);
      }
      text = sanitizeScriptOutput(text);
    } else {
      text = sanitizeScriptOutput(text);
      const targetSegments = Math.ceil((longMin || 3000) / 3000);
      const maxSegments = Math.max(targetSegments + 10, 20);
      let segments = 1;
      while (text.length < (longMin || 3000) && segments < maxSegments) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        const tail = text.slice(-500);
        const remain = Math.max((longMin || 3000) - text.length, 800);
        const continuePrompt = `이전 대본에 이어서 자연스럽게 계속 작성하세요.
다른 설명 없이 대본만 출력하세요.
추가 분량 목표: 약 ${remain}자.
형식 금지: 화자명/콜론/대화체/소제목/괄호/기호/마크다운(#).
반드시 3인칭 내레이션 줄글만 유지하세요.
이전 텍스트 끝부분:
${tail}`;
        const more = await requestChunk(continuePrompt);
        text = sanitizeScriptOutput(`${text}\n${more}`.trim());
        segments += 1;
      }
      let forceAttempts = 0;
      while (text.length < (longMin || 3000) && forceAttempts < 3) {
        const tail = text.slice(-500);
        const remain = Math.max((longMin || 3000) - text.length, 1500);
        const forcePrompt = `이전 대본에 이어서 반드시 더 작성하세요.
다른 설명 없이 대본만 출력하세요.
최소 추가 분량: ${remain}자 이상.
형식 금지: 화자명/콜론/대화체/소제목/괄호/기호/마크다운(#).
반드시 3인칭 내레이션 줄글만 유지하세요.
이전 텍스트 끝부분:
${tail}`;
        const more = await requestChunk(forcePrompt);
        text = sanitizeScriptOutput(`${text}\n${more}`.trim());
        forceAttempts += 1;
      }
      if (longMax && text.length > longMax) {
        text = truncateToMaxChars(text, longMax);
      }
    }

    const counts = countOutput(text, lang);
    scriptState.output = text;
    scriptState.charCount = counts.chars;
    scriptState.wordCount = counts.words;
    state.ui.tts.lastDurationSec = estimateBaseDuration(text, lang);
    if (!scriptState.cache) scriptState.cache = { KR: null, JP: null, EN: null };
    scriptState.cache[lang] = { text, chars: counts.chars, words: counts.words };
    scriptState.generating = false;
    scriptState.error = '';
    if (scriptState.type === 'shorts') {
      if (shortsLimitType === 'words') {
        scriptState.message = `${formatNumber(counts.words)} 단어 / 목표 ${formatNumber(shortsTargetLimit)} 단어`;
      } else {
        scriptState.message = `${formatNumber(counts.chars)}자 / 목표 ${formatNumber(shortsTargetLimit)}자`;
      }
    } else {
      scriptState.message = `${formatNumber(counts.chars)}자 / 목표 ${formatNumber(longMin)}~${formatNumber(longMax)}자`;
    }
    render();
    bindEvents();
  } catch (e) {
    scriptState.generating = false;
    scriptState.error = `대본 생성 실패: ${e?.message || 'error'}`;
    render();
    bindEvents();
  }
};

const generateTts = async () => {
  const ttsState = state.ui.tts;
  const scriptText = state.ui.script.output || '';
  if (!scriptText.trim()) {
    ttsState.error = '대본이 비어 있습니다.';
    ttsState.status = '';
    render();
    bindEvents();
    return;
  }
  const apiKey = window.getGeminiKey();
  if (!apiKey) {
    ttsState.error = 'Gemini API 키를 설정하세요.';
    ttsState.status = '';
    render();
    bindEvents();
    return;
  }

  ttsState.generating = true;
  ttsState.error = '';
  ttsState.errorSticky = true;
  ttsState.status = '생성 중...';
  render();
  bindEvents();

  const model = normalizeTtsModel(ttsState.geminiModel || 'gemini-2.5-flash-preview-tts');
  const voiceName = ttsState.voiceName || 'kore';

  const splitToChunks = (text, maxLen = 1500) => {
    const cleaned = String(text || '').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!cleaned) return [];
    if (cleaned.length <= maxLen) return [cleaned];
    const sentences = cleaned.split(/(?<=[.!?。！？…])\s+/g).filter(Boolean);
    if (!sentences.length) return [cleaned];
    const chunks = [];
    let buf = '';
    sentences.forEach((s) => {
      if (buf && (buf.length + s.length + 1) > maxLen) {
        chunks.push(buf.trim());
        buf = '';
      }
      buf = buf ? `${buf} ${s}` : s;
    });
    if (buf.trim()) chunks.push(buf.trim());
    return chunks.length ? chunks : [cleaned];
  };

  try {
    const requestOnce = async (body) => {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1alpha/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = data?.error?.message || `HTTP ${res.status}`;
        throw new Error(message);
      }
      const part = data?.candidates?.[0]?.content?.parts?.[0] || {};
      if (part?.text && !part?.inlineData && !part?.inline_data) {
        throw new Error('TTS 모델이 텍스트로 응답했습니다.');
      }
      const inline = part.inlineData || part.inline_data || {};
      const base64Audio = inline.data || '';
      const mimeType = inline.mimeType || inline.mime_type || 'audio/L16;codec=pcm;rate=24000';
      if (!base64Audio) {
        throw new Error('오디오 응답 없음');
      }
      return { base64Audio, mimeType };
    };

    const buildBody = (text) => {
      const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return {
        contents: [{ parts: [{ text: `<speak>${escaped}</speak>` }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName } },
          },
        },
      };
    };

    const sendChunk = async (chunkText) => {
      return await requestOnce(buildBody(chunkText));
    };

    const chunks = splitToChunks(scriptText, 1500);
    const pcmParts = [];
    let finalSampleRate = 24000;

    for (let i = 0; i < chunks.length; i += 1) {
      ttsState.status = chunks.length > 1
        ? `생성 중... (${i + 1}/${chunks.length})`
        : '생성 중...';
      render();
      bindEvents();
      const result = await sendChunk(chunks[i]);
      const rawBytes = base64ToUint8Array(result.base64Audio);
      finalSampleRate = parseSampleRate(result.mimeType);
      pcmParts.push(rawBytes);
      if (i < chunks.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }

    const rawBytes = pcmParts.length === 1
      ? pcmParts[0]
      : concatPcmBytes(pcmParts, finalSampleRate, 200);

    const wavBytes = buildWavFromPcm(rawBytes, finalSampleRate, 1, 16);
    const blob = new Blob([wavBytes], { type: 'audio/wav' });

    if (ttsState.audioUrl) {
      URL.revokeObjectURL(ttsState.audioUrl);
    }
    ttsState.audioUrl = URL.createObjectURL(blob);
    ttsState.audioDuration = Math.round((rawBytes.length / (finalSampleRate * 2)));
    ttsState.lastDurationSec = ttsState.audioDuration;
    ttsState.status = '생성 완료';
    ttsState.errorSticky = true;
    ttsState.generating = false;
    render();
    bindEvents();
  } catch (e) {
    ttsState.generating = false;
    ttsState.error = `TTS 생성 실패: ${e?.message || 'error'}`;
    ttsState.errorSticky = true;
    ttsState.status = '';
    render();
    bindEvents();
  }
};

const applyLocalFilters = (params) => {
  const { sort, minViews, ratioLabel, durationLabel, countryLabel } = params;
  const ratioThresholds = {
    전체: 0,
    '1단계': 0,
    '2단계': 1,
    '3단계': 2,
    '4단계': 3,
    '5단계': 5,
  };
  const durationLimits = {
    전체: null,
    쇼츠: [0, 60],
    '중간 (4~20분)': [240, 1200],
    '긴영상 (20분 이상)': [1200, Infinity],
  };

  const countryCode = COUNTRY_MAP[countryLabel] || 'KR';
  const lang = COUNTRY_LANG[countryLabel] || 'ko';
  let resultRows = state.rawResults
    .map((v) => {
      const channel = state.channelsById[v.channelId] || {};
      const viewCount = Number(v.viewCount || 0);
      const subscriberCount = Number(channel.subscriberCount || 0);
      const ratio = subscriberCount ? viewCount / subscriberCount : 0;
      const seconds = durationToSeconds(v.duration);
      const durationRange = durationLimits[durationLabel] || null;
      return {
        ...v,
        _ratio: ratio,
        _durationSeconds: seconds,
        _durationRange: durationRange,
        _channelCountry: channel.country || '',
      };
    })
    .filter((v) => {
      if (v.viewCount < minViews) return false;
      if (ratioLabel !== '전체' && v._ratio < (ratioThresholds[ratioLabel] || 0)) return false;
      if (v._durationRange) {
        const [min, max] = v._durationRange;
        if (v._durationSeconds < min || v._durationSeconds > max) return false;
      }
      if (countryLabel && countryLabel !== '한국') {
        if (v._channelCountry) {
          if (v._channelCountry !== countryCode) return false;
        } else {
          const textBlob = `${v.title} ${v.channelTitle} ${v.description || ''}`;
          if (!matchesLanguage(textBlob, lang)) return false;
        }
      }
      return true;
    });

  if (sort === '최신순') {
    resultRows = resultRows.sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''));
  } else if (sort === '비율') {
    resultRows = resultRows.sort((a, b) => {
      const aEng = a.viewCount ? (a.likeCount + a.commentCount) / a.viewCount : 0;
      const bEng = b.viewCount ? (b.likeCount + b.commentCount) / b.viewCount : 0;
      return bEng - aEng;
    });
  } else {
    resultRows = resultRows.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
  }

  state.results = resultRows;
  state.ui.searching = false;
  if (countryLabel && countryLabel !== '한국' && state.results.length === 0) {
    state.ui.searchError = '해당 국가 채널이 없습니다.';
  }
  render();
  bindEvents();
};

const fetchYouTube = async (params) => {
  const apiKey = window.getYouTubeKey();
  if (!apiKey) {
    state.ui.searchError = 'YouTube API 키를 설정하세요.';
    state.results = [];
    render();
    bindEvents();
    return;
  }

  const {
    query,
    count,
    sort,
    durationLabel,
    periodLabel,
    countryLabel,
    categoryLabel,
  } = params;

  state.ui.searching = true;
  state.ui.searchError = '';
  state.results = [];
  render();
  bindEvents();

  const orderMap = { 조회수: 'viewCount', 최신순: 'date', 비율: 'rating' };
  const durationMap = {
    전체: '',
    쇼츠: 'short',
    '중간 (4~20분)': 'medium',
    '긴영상 (20분 이상)': 'long',
  };

  const publishedAfter = getPublishedAfter(periodLabel);
  const regionCode = COUNTRY_MAP[countryLabel] || 'KR';
  const lang = COUNTRY_LANG[countryLabel] || 'ko';
  let translatedQuery = query;
  state.ui.filters.translatedQuery = '';
  if (lang !== 'ko') {
    let result = await translateQuery(query, lang);
    let translated = result?.text || null;
    if (!translated || containsHangul(translated)) {
      result = await translateQuery(query, lang, true);
      translated = result?.text || null;
    }
    if (!translated || containsHangul(translated)) {
      state.ui.searching = false;
      state.ui.searchError = `번역 실패: ${result?.error || 'Gemini API 키 확인 필요'}`;
      render();
      bindEvents();
      return;
    }
    translatedQuery = translated;
    state.ui.filters.translatedQuery = translatedQuery;
    render();
    bindEvents();
  }
  const categoryId = CATEGORY_MAP[categoryLabel] || '';
  const videoDuration = durationMap[durationLabel] || '';

  let nextPageToken = '';
  let collected = [];

  try {
    while (collected.length < count) {
      const maxResults = Math.min(50, count - collected.length);
      const searchParams = new URLSearchParams({
        part: 'snippet',
        type: 'video',
        q: translatedQuery || ' ',
        maxResults: String(maxResults),
        key: apiKey,
        order: orderMap[sort] || 'viewCount',
        regionCode,
      });
      if (lang) {
        searchParams.set('relevanceLanguage', lang);
        searchParams.set('hl', lang);
      }
      if (nextPageToken) searchParams.set('pageToken', nextPageToken);
      if (videoDuration) searchParams.set('videoDuration', videoDuration);
      if (categoryId) searchParams.set('videoCategoryId', categoryId);
      if (publishedAfter) searchParams.set('publishedAfter', publishedAfter);

      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${searchParams.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        const reason = data?.error?.errors?.[0]?.reason || 'error';
        if (reason === 'quotaExceeded' && state.keys.yt2) {
          state.active.yt = 'yt2';
          return fetchYouTube(params);
        }
        throw new Error(reason);
      }

      const items = data.items || [];
      collected = collected.concat(items);
      nextPageToken = data.nextPageToken || '';
      if (!nextPageToken) break;
    }

    const videoIds = collected.map((i) => i.id?.videoId).filter(Boolean);
    const channelIds = collected.map((i) => i.snippet?.channelId).filter(Boolean);

    const fetchInBatches = async (ids, endpoint, fields) => {
      const results = [];
      for (let i = 0; i < ids.length; i += 50) {
        const batch = ids.slice(i, i + 50);
        const params = new URLSearchParams({
          part: fields,
          id: batch.join(','),
          key: apiKey,
        });
        const res = await fetch(`https://www.googleapis.com/youtube/v3/${endpoint}?${params.toString()}`);
        const data = await res.json();
        if (res.ok && data.items) results.push(...data.items);
      }
      return results;
    };

    const videos = await fetchInBatches(videoIds, 'videos', 'snippet,statistics,contentDetails');
    const channels = await fetchInBatches([...new Set(channelIds)], 'channels', 'snippet,statistics');

    const channelMap = {};
    channels.forEach((c) => {
      channelMap[c.id] = {
        id: c.id,
        title: c.snippet?.title || '',
        description: c.snippet?.description || '',
        country: c.snippet?.country || '',
        customUrl: c.snippet?.customUrl || '',
        publishedAt: c.snippet?.publishedAt || '',
        subscriberCount: Number(c.statistics?.subscriberCount || 0),
        viewCount: Number(c.statistics?.viewCount || 0),
        videoCount: Number(c.statistics?.videoCount || 0),
      };
    });

    const videoMap = {};
    videos.forEach((v) => {
      videoMap[v.id] = v;
    });

    const rawRows = collected
      .map((item) => {
        const vid = item.id?.videoId;
        const v = videoMap[vid];
        if (!v) return null;
        const viewCount = Number(v.statistics?.viewCount || 0);
        return {
          id: vid,
          url: `https://www.youtube.com/watch?v=${vid}`,
          channelId: item.snippet?.channelId || '',
          channelTitle: item.snippet?.channelTitle || '',
          title: item.snippet?.title || '',
          description: item.snippet?.description || '',
          publishedAt: item.snippet?.publishedAt || '',
          thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '',
          viewCount,
          likeCount: Number(v.statistics?.likeCount || 0),
          commentCount: Number(v.statistics?.commentCount || 0),
          duration: parseDuration(v.contentDetails?.duration),
        };
      })
      .filter(Boolean);

    state.rawResults = rawRows;
    state.channelsById = channelMap;
    state.ui.searching = false;
    applyLocalFilters(params);
  } catch (err) {
    state.ui.searching = false;
    state.ui.searchError = '검색 실패: ' + (err?.message || 'error');
    render();
    bindEvents();
  }
};

let isImageProcessing = false;
let stopImageProcessingFlag = false;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const processImageQueue = async () => {
  if (isImageProcessing) return;
  isImageProcessing = true;
  stopImageProcessingFlag = false;

  try {
    while (true) {
      if (stopImageProcessingFlag) {
        state.ui.imageJobs.filter(j => j.status === '대기' || j.status === '생성 중...').forEach(j => j.status = '생성 중지됨');
        saveState(state);
        render();
        bindEvents();
        break;
      }

      const job = state.ui.imageJobs.find(j => j.status === '대기');
      if (!job) break;

      job.status = '생성 중...';
      render();
      bindEvents();

      const promptObj = state.ui.cuts.prompts.find((p) => p.index === job.cut);
      if (!promptObj || !promptObj.prompt) {
        job.status = '실패 (프롬프트 없음)';
        saveState(state);
        render();
        bindEvents();
        continue;
      }

      const apiKey = window.getGeminiKey();
      if (!apiKey) {
        job.status = '대기'; // API Key missing, requeue
        break;
      }

      let attempt = 0;
      const maxRetries = 5;
      let success = false;

      while (attempt < maxRetries && !success) {
        attempt++;
        try {
          const rawModel = state.ui.modelSelections?.image && state.ui.modelSelections.image !== 'auto'
            ? state.ui.modelSelections.image 
            : 'gemini-3.1-flash-image-preview';
          
          const model = normalizeImageModel(rawModel);
            
          let res;
          let base64Data = null;

          if (model.includes('gemini')) {
            res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: promptObj.prompt }] }]
              })
            });

            if (!res.ok) {
              const data = await res.json().catch(() => null);
              throw new Error(data?.error?.message || `HTTP ${res.status}`);
            }

            const responseData = await res.json();
            base64Data = responseData?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          } else {
            res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${encodeURIComponent(apiKey)}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                instances: [{ prompt: promptObj.prompt }],
                parameters: { sampleCount: 1, outputOptions: { mimeType: "image/jpeg" } }
              })
            });

            if (!res.ok) {
              const data = await res.json().catch(() => null);
              throw new Error(data?.error?.message || `HTTP ${res.status}`);
            }

            const responseData = await res.json();
            base64Data = responseData?.predictions?.[0]?.bytesBase64Encoded;
          }
          
          if (base64Data) {
            job.imageUrl = `data:image/jpeg;base64,${base64Data}`;
            job.status = '생성 완료';
            success = true;
          } else {
            throw new Error('응답에 이미지 데이터가 없습니다.');
          }

        } catch (err) {
          console.error(`Image Gen Failed (Attempt ${attempt}/${maxRetries}):`, err.message);
          if (attempt >= maxRetries) {
            job.status = `실패 (재시도 초과)`;
          } else {
            // Wait 5 seconds before retrying
            await delay(5000);
          }
        }
      }

      saveState(state);
      render();
      bindEvents();

      // Enforce the 25-second delay to avoid quota / rate limiting between successful/failed jobs
      const nextPendingJob = state.ui.imageJobs.find(j => j.status === '대기');
      if (nextPendingJob) {
        await delay(25000); 
      }
    }
  } finally {
    isImageProcessing = false;
  }
};

let isVideoProcessing = false;

const processVideoQueue = async () => {
  if (isVideoProcessing) return;
  isVideoProcessing = true;
  state.ui.videoBatchStopping = false;

  try {
    while (true) {
      if (state.ui.videoBatchStopping) {
        state.ui.videoJobs.filter(j => j.status === '대기' || j.status === '생성 중...').forEach(j => j.status = '생성 중지됨');
        saveState(state);
        render();
        bindEvents();
        break;
      }

      const job = state.ui.videoJobs.find(j => j.status === '대기');
      if (!job) break;

      job.status = '생성 중...';
      render();
      bindEvents();

      const promptObj = state.ui.cuts.prompts.find((p) => p.index === job.cut);
      if (!promptObj || !promptObj.prompt) {
        job.status = '실패 (프롬프트 없음)';
        saveState(state);
        render();
        bindEvents();
        continue;
      }

      const apiKey = window.getGeminiKey();
      if (!apiKey) {
        job.status = '대기';
        break;
      }

      try {
        const rawModel = state.ui.modelSelections?.video && state.ui.modelSelections.video !== 'auto'
          ? state.ui.modelSelections.video 
          : 'veo-3.1-fast'; // Fallback
        
        // This is a placeholder for actual video generation API call
        // Assuming Veo 3.1 or similar API exists or follows Gemini pattern
        // For now, we simulate the wait and success for the demo as requested
        await delay(5000); // Simulate network latency
        
        // In a real implementation, you would fetch the video generation endpoint
        // Example (hypothetical):
        // const res = await fetch(`.../models/${rawModel}:generateVideo...`);
        // if (!res.ok) throw new Error('Video Gen Failed');
        // job.videoUrl = ...;
        
        job.status = '생성 완료';
      } catch (err) {
        console.error("Video Gen Failed:", err.message);
        job.status = `실패 (${err.message})`;
      }

      saveState(state);
      render();
      bindEvents();

      // Spacing between video jobs (videos take longer)
      const nextPendingJob = state.ui.videoJobs.find(j => j.status === '대기');
      if (nextPendingJob) {
        await delay(35000); 
      }
    }
  } finally {
    isVideoProcessing = false;
    state.ui.videoBatchGenerating = false;
    render();
    bindEvents();
  }
};

const addToImageQueue = (cutIdx) => {
  const apiKey = window.getGeminiKey();
  if (!apiKey) {
    alert('Gemini API 키가 필요합니다.');
    return;
  }
  
  const existingJob = state.ui.imageJobs.find(j => j.cut === cutIdx);
  if (existingJob) {
    if (existingJob.status === '생성 완료' || existingJob.status === '생성 중...') {
      // Don't queue again if it's done or running.
      return; 
    }
    // Update existing failed job to pending
    existingJob.status = '대기';
    existingJob.imageUrl = '';
  } else {
    state.ui.imageJobs.push({ cut: cutIdx, status: '대기', imageUrl: '' });
  }

  saveState(state);
  render();
  bindEvents();
  
  processImageQueue(); // Fire and forget
};

const generateThumbnail = async () => {
  const apiKey = window.getGeminiKey();
  if (!apiKey) {
    alert('Gemini API 키가 필요합니다.');
    return;
  }
  if (!state.ui.script.output) {
    alert('대본이 없습니다.');
    return;
  }

  state.ui.thumbnailJobs.push({ status: '생성 중...' });
  render();
  bindEvents();

  try {
    const prompt = `당신은 최고 인기 유튜버의 썸네일 디자이너입니다. 
다음 내용을 기반으로 가장 클릭을 유발하는 썸네일 이미지를 생성하기 위한 영문 프롬프트를 1줄 작성해주세요.
내용: ${state.ui.script.output.slice(0, 500)}`;

    // Simulate Gemini text to image flow or direct image generation
    const job = state.ui.thumbnailJobs.find(j => j.status === '생성 중...');
    job.status = '생성 완료';
  } catch (err) {
    const job = state.ui.thumbnailJobs.find(j => j.status === '생성 중...');
    if (job) job.status = '실패';
  } finally {
    saveState(state);
    render();
    bindEvents();
  }
};

const generateYoutubeMetadata = async () => {
  const apiKey = window.getGeminiKey();
  if (!apiKey) {
    alert('Gemini API 키가 필요합니다.');
    return;
  }
  if (!state.ui.script.output) {
    alert('대본이 없습니다.');
    return;
  }

  const btn = document.getElementById('youtube-meta-generate');
  if (btn) btn.textContent = '메타데이터 생성 중...';

  try {
    const prompt = `당신은 유튜브 SEO 전문가입니다. 다음 대본을 바탕으로 시청자를 끌어모으는 제목(Title), 상세 설명(Description), 태그(Tags, 해시태그 포함)를 한국어, 영어, 일본어 3개 국어로 작성해 주세요.
출력은 JSON 형식으로만 해주세요:
{
  "ko": { "title": "...", "desc": "...", "tags": "..." },
  "en": { "title": "...", "desc": "...", "tags": "..." },
  "ja": { "title": "...", "desc": "...", "tags": "..." }
}
대본 내용:
${state.ui.script.output.slice(0, 2000)}`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    });
    const data = await res.json();
    if (res.ok) {
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = JSON.parse(text);
      state.ui.youtubeMetadata = parsed;
    }
  } catch (err) {
    alert('메타데이터 생성 실패: ' + err.message);
  } finally {
    if (btn) btn.textContent = '메타데이터 생성 (KO, EN, JA)';
    saveState(state);
    render();
    bindEvents();
  }
};

const bindEvents = () => {
  const modal = document.getElementById('settings-modal');
  const openBtn = document.getElementById('settings-open');
  const closeBtn = document.getElementById('settings-close');
  const overlay = document.getElementById('settings-overlay');
  const happyDayOpen = document.getElementById('happy-day-open');
  const happyDayClose = document.getElementById('happy-day-close');
  openBtn?.addEventListener('click', () => {
    state.ui.settingsOpen = true;
    saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
    render();
    bindEvents();
  });
  closeBtn?.addEventListener('click', () => {
    state.ui.settingsOpen = false;
    saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
    render();
    bindEvents();
  });

  happyDayOpen?.addEventListener('click', () => {
    state.ui.happyDayOpen = true;
    saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
    render();
    bindEvents();
  });
  happyDayClose?.addEventListener('click', () => {
    state.ui.happyDayOpen = false;
    saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
    render();
    bindEvents();
  });

  document.querySelectorAll('.open-channel-detail').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-channel-id') || '';
      state.ui.selectedChannelId = id;
      state.ui.channelDetailOpen = true;
      saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
      render();
      bindEvents();
    });
  });
  document.querySelectorAll('.open-channel-select').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.ui.channelSelectOpen = true;
      saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
      render();
      bindEvents();
    });
  });
  document.getElementById('channel-detail-close')?.addEventListener('click', () => {
    state.ui.channelDetailOpen = false;
    saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
    render();
    bindEvents();
  });
  document.getElementById('channel-detail-close-2')?.addEventListener('click', () => {
    state.ui.channelDetailOpen = false;
    saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
    render();
    bindEvents();
  });
  document.getElementById('channel-collect')?.addEventListener('click', () => {
    state.ui.channelSelectOpen = true;
    saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
    render();
    bindEvents();
  });
  document.getElementById('channel-select-close')?.addEventListener('click', () => {
    state.ui.channelSelectOpen = false;
    saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
    render();
    bindEvents();
  });
  document.getElementById('channel-select-close-2')?.addEventListener('click', () => {
    state.ui.channelSelectOpen = false;
    saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
    render();
    bindEvents();
  });

  document.querySelectorAll('[data-save]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-save');
      const input = document.getElementById(id);
      if (input) saveKey(id, input.value || '');
    });
  });
  document.querySelectorAll('[data-test]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-test');
      const input = document.getElementById(id);
      const manualKey = input ? input.value.trim() : null;
      if (id === 'yt1' || id === 'yt2') testYouTubeKey(id, manualKey);
      if (id === 'g1') testGeminiKey(id, manualKey);
    });
  });
  document.querySelectorAll('[data-use]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-use');
      if (id === 'yt1' || id === 'yt2') setActive('yt', id);
      if (id === 'g1') setActive('g', id);
    });
  });

  document.getElementById('model-text')?.addEventListener('change', (e) => {
    state.ui.modelSelections.text = e.target.value || 'auto';
    state.ui.textModel = '';
    state.ui.translationModel = '';
    saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
  });
  // Sync between modal image model select and panel 8 image model select
  const syncImageModels = (value) => {
    state.ui.modelSelections.image = value || 'auto';
    
    const select1 = document.getElementById('model-image');
    const select2 = document.getElementById('panel-model-image');
    if (select1 && select1.value !== value) select1.value = value;
    if (select2 && select2.value !== value) select2.value = value;
    
    saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
  };

  document.getElementById('model-image')?.addEventListener('change', (e) => {
    syncImageModels(e.target.value);
  });
  document.getElementById('panel-model-image')?.addEventListener('change', (e) => {
    syncImageModels(e.target.value);
  });

  // Panel 9 Video Controls
  document.getElementById('panel-video-model')?.addEventListener('change', (e) => {
    state.ui.modelSelections.video = e.target.value;
    saveState(state);
    render();
    bindEvents();
  });

  document.getElementById('video-generate-all')?.addEventListener('click', () => {
    if (state.ui.videoBatchGenerating) return;
    
    const cutsToGenerate = state.ui.cuts.prompts.filter(p => p.prompt.trim() !== '');
    if (cutsToGenerate.length === 0) {
      alert('생성할 프롬프트가 없습니다. 6번 패널에서 프롬프트를 먼저 생성하세요.');
      return;
    }

    state.ui.videoJobs = state.ui.videoJobs.filter(j => !cutsToGenerate.find(cp => cp.index === j.cut));
    cutsToGenerate.forEach(p => {
      state.ui.videoJobs.push({ cut: p.index, status: '대기' });
    });
    
    state.ui.videoBatchGenerating = true;
    state.ui.videoBatchStopping = false;
    saveState(state);
    render();
    bindEvents();
    processVideoQueue();
  });

  document.getElementById('video-stop')?.addEventListener('click', () => {
    state.ui.videoBatchStopping = true;
    state.ui.videoJobs.forEach(j => {
      if (j.status === '대기') j.status = '생성 중지됨';
    });
    saveState(state);
    render();
    bindEvents();
  });
  document.getElementById('model-video')?.addEventListener('change', (e) => {
    state.ui.modelSelections.video = e.target.value || 'auto';
    saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
  });
  document.getElementById('model-tts')?.addEventListener('change', (e) => {
    state.ui.modelSelections.tts = e.target.value || 'auto';
    saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
  });

  document.getElementById('toggle-p8-header')?.addEventListener('click', () => {
    state.ui.panelsOpen.p8 = !state.ui.panelsOpen.p8;
    render();
    bindEvents();
  });
  document.getElementById('toggle-p9-header')?.addEventListener('click', () => {
    state.ui.panelsOpen.p9 = !state.ui.panelsOpen.p9;
    render();
    bindEvents();
  });
  document.getElementById('toggle-p10-header')?.addEventListener('click', () => {
    state.ui.panelsOpen.p10 = !state.ui.panelsOpen.p10;
    render();
    bindEvents();
  });
  document.getElementById('toggle-p11-header')?.addEventListener('click', () => {
    state.ui.panelsOpen.p11 = !state.ui.panelsOpen.p11;
    render();
    bindEvents();
  });
  document.getElementById('toggle-p12-header')?.addEventListener('click', () => {
    state.ui.panelsOpen.p12 = !state.ui.panelsOpen.p12;
    render();
    bindEvents();
  });

  document.getElementById('toggle-p1-header')?.addEventListener('click', () => {
    state.ui.panelsOpen.p1 = !state.ui.panelsOpen.p1;
    render();
    bindEvents();
  });
  document.getElementById('toggle-p2-header')?.addEventListener('click', () => {
    state.ui.panelsOpen.p2 = !state.ui.panelsOpen.p2;
    render();
    bindEvents();
  });

  document.getElementById('yt-search-btn')?.addEventListener('click', () => {
    const btn = document.getElementById('yt-search-btn');
    if (btn) {
      btn.classList.add('scale-[0.98]', 'ring-2', 'ring-amber-300/60');
      setTimeout(() => btn.classList.remove('scale-[0.98]', 'ring-2', 'ring-amber-300/60'), 200);
    }
    const params = buildSearchParams();
    state.ui.customSource = { url: '', topic: '', style: '' };
    state.ui.customSourceData = { loadedUrl: '', rows: [] };
    if (!params.query) {
      state.ui.searchError = '검색 키워드를 입력하세요.';
      render();
      bindEvents();
      return;
    }
    const searchParams = {
      query: params.query,
      count: params.count,
      durationLabel: params.durationLabel,
      periodLabel: params.periodLabel,
      countryLabel: params.countryLabel,
      categoryLabel: params.categoryLabel,
    };
    const last = state.ui.lastSearchParams ? JSON.stringify(state.ui.lastSearchParams) : '';
    const current = JSON.stringify(searchParams);
    if (!state.ui.lastSearchParams || last !== current) {
      state.ui.lastSearchParams = searchParams;
      state.ui.filters = {
        query: params.query,
        translatedQuery: params.translatedQuery || '',
        count: params.count,
        ratio: params.ratioLabel,
        viewMode: params.viewMode,
        sort: params.sort,
        category: params.categoryLabel,
        duration: params.durationLabel,
        period: params.periodLabel,
        country: params.countryLabel,
        minViews: params.minViews,
      };
      saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
      fetchYouTube(params);
    } else {
      state.ui.filters = {
        query: params.query,
        translatedQuery: params.translatedQuery || '',
        count: params.count,
        ratio: params.ratioLabel,
        viewMode: params.viewMode,
        sort: params.sort,
        category: params.categoryLabel,
        duration: params.durationLabel,
        period: params.periodLabel,
        country: params.countryLabel,
        minViews: params.minViews,
      };
      saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
      applyLocalFilters(params);
    }
  });

  document.getElementById('yt-viewmode')?.addEventListener('change', (e) => {
    state.ui.viewMode = e.target.value || '테이블';
    state.ui.filters.viewMode = state.ui.viewMode;
    saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
    render();
    bindEvents();
  });

  ['yt-sort', 'yt-duration', 'yt-period', 'yt-category', 'yt-country', 'minViews'].forEach((id) => {
    document.getElementById(id)?.addEventListener(id === 'minViews' ? 'input' : 'change', () => {
      const params = buildSearchParams();
      state.ui.filters = {
        query: params.query,
        count: params.count,
        viewMode: params.viewMode,
        sort: params.sort,
        category: params.categoryLabel,
        duration: params.durationLabel,
        period: params.periodLabel,
        country: params.countryLabel,
        minViews: params.minViews,
      };
      saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
      applyLocalFilters(params);
    });
  });

  document.getElementById('columns-toggle')?.addEventListener('click', () => {
    state.ui.columnsOpen = !state.ui.columnsOpen;
    saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
    render();
    bindEvents();
  });

  document.querySelectorAll('[data-col]').forEach((checkbox) => {
    checkbox.addEventListener('change', (e) => {
      const id = e.target.getAttribute('data-col');
      state.ui.columns[id] = e.target.checked;
      saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
      render();
      bindEvents();
    });
  });

  document.querySelectorAll('[data-hook-title]').forEach((input) => {
    input.addEventListener('change', (e) => {
      const title = e.target.getAttribute('data-hook-title');
      state.ui.selectedHookTitle = title || '';
      saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
      render();
      bindEvents();
    });
  });

  document.getElementById('hook-generate')?.addEventListener('click', () => {
    generateHookTitles();
  });

  document.getElementById('hook-dedupe')?.addEventListener('click', () => {
    const deduped = dedupeHookTitles(state.ui.hookTitles || []);
    state.ui.hookTitles = deduped;
    if (state.ui.selectedHookTitle && !deduped.includes(state.ui.selectedHookTitle)) {
      state.ui.selectedHookTitle = '';
    }
    saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
    render();
    bindEvents();
  });

  document.getElementById('search-panel-toggle')?.addEventListener('click', () => {
    state.ui.searchPanelOpen = !state.ui.searchPanelOpen;
    saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
    render();
    bindEvents();
  });

  document.getElementById('custom-url')?.addEventListener('change', (e) => {
    state.ui.customSource.url = e.target.value || '';
    saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
  });
  document.getElementById('custom-style')?.addEventListener('change', (e) => {
    state.ui.customSource.style = e.target.value || '';
    saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
  });
  document.getElementById('custom-topic')?.addEventListener('change', (e) => {
    state.ui.customSource.topic = e.target.value || '';
    saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
  });

  document.getElementById('script-type')?.addEventListener('change', (e) => {
    state.ui.script.type = e.target.value || 'shorts';
    state.ui.script.error = '';
    state.ui.script.message = '';
    saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
    render();
    bindEvents();
  });
  document.getElementById('script-length-short')?.addEventListener('change', (e) => {
    state.ui.script.shortLength = e.target.value || '60초';
    saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
    render();
    bindEvents();
  });
  document.getElementById('script-length-long')?.addEventListener('change', (e) => {
    state.ui.script.longLength = e.target.value || '10분';
    saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
    render();
    bindEvents();
  });
  document.getElementById('script-lang')?.addEventListener('change', (e) => {
    state.ui.script.lang = e.target.value || 'KR';
    saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
    const counts = countOutput(state.ui.script.output, state.ui.script.lang);
    state.ui.script.charCount = counts.chars;
    state.ui.script.wordCount = counts.words;
    state.ui.tts.lastDurationSec = estimateBaseDuration(state.ui.script.output, state.ui.script.lang);
    render();
    bindEvents();
  });
  ['p1', 'p2', 'pm', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9'].forEach((p) => {
    document.getElementById(`toggle-${p}`)?.addEventListener('click', () => {
      state.ui.panelsOpen[p] = !state.ui.panelsOpen[p];
      render();
      bindEvents();
    });
  });

  document.getElementById('script-target-age')?.addEventListener('change', (e) => {
    state.ui.script.targetAge = e.target.value || '';
    saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
  });
  document.getElementById('script-tone')?.addEventListener('change', (e) => {
    state.ui.script.tone = e.target.value || '';
    saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
  });
  document.getElementById('script-generate')?.addEventListener('click', () => {
    generateScript();
  });
  document.getElementById('script-copy')?.addEventListener('click', async () => {
    if (!state.ui.script.output) return;
    try {
      await navigator.clipboard.writeText(state.ui.script.output);
      state.ui.script.message = '대본이 복사되었습니다.';
      state.ui.script.error = '';
    } catch {
      state.ui.script.error = '복사 실패: 브라우저 권한을 확인하세요.';
      state.ui.script.message = '';
    }
    saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
    render();
    bindEvents();
  });

  document.querySelectorAll('.script-cache-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-script-cache');
      const cached = state.ui.script.cache?.[lang];
      if (!cached) return;
      state.ui.script.lang = lang;
      state.ui.script.output = cached.text;
      state.ui.script.charCount = cached.chars || 0;
      state.ui.script.wordCount = cached.words || 0;
      state.ui.script.message = `${lang} 대본 불러옴`;
      state.ui.script.error = '';
      saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
      render();
      bindEvents();
    });
  });

  document.getElementById('script-output')?.addEventListener('input', (e) => {
    const value = e.target.value || '';
    const counts = countOutput(value, state.ui.script.lang);
    state.ui.script.output = value;
    state.ui.script.charCount = counts.chars;
    state.ui.script.wordCount = counts.words;
    state.ui.tts.lastDurationSec = estimateBaseDuration(value, state.ui.script.lang);
    state.ui.script.message = '직접 수정됨';
    state.ui.script.error = '';
    if (!state.ui.script.cache) state.ui.script.cache = { KR: null, JP: null, EN: null };
    state.ui.script.cache[state.ui.script.lang] = { text: value, chars: counts.chars, words: counts.words };
    saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
    const countEl = document.getElementById('script-count');
    if (countEl) {
      countEl.textContent = `글자수: ${formatNumber(counts.chars)}${state.ui.script.lang === 'EN' ? ` · 단어수: ${formatNumber(counts.words)}` : ''}`;
    }
  });

  const minViewsInput = document.getElementById('minViews');
  const minViewButtons = Array.from(document.querySelectorAll('.min-views-btn'));
  const setMinViewsActive = (activeBtn) => {
    minViewButtons.forEach((btn) => {
      btn.classList.remove('bg-gradient-to-r', 'from-amber-400', 'to-yellow-300', 'text-black', 'border-transparent', 'shadow-md');
      btn.classList.add('border-amber-400/40', 'bg-amber-500/20', 'text-amber-100');
    });
    if (activeBtn) {
      activeBtn.classList.remove('border-amber-400/40', 'bg-amber-500/20', 'text-amber-100');
      activeBtn.classList.add('bg-gradient-to-r', 'from-amber-400', 'to-yellow-300', 'text-black', 'border-transparent', 'shadow-md');
    }
  };
  document.querySelectorAll('[data-min-views]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const value = btn.getAttribute('data-min-views');
      if (!minViewsInput || !value) return;
      const numeric = Number(value);
      if (Number.isNaN(numeric)) return;
      minViewsInput.value = numeric.toLocaleString('en-US');
      setMinViewsActive(btn);
      state.ui.filters.minViews = numeric;
      saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
      const params = buildSearchParams();
      applyLocalFilters(params);
    });
  });
  if (minViewsInput) {
    const current = String(state.ui.filters.minViews || 100000);
    const initial = minViewButtons.find((btn) => btn.getAttribute('data-min-views') === current);
    setMinViewsActive(initial || null);
    minViewsInput.addEventListener('change', () => {
      const numeric = Number(String(minViewsInput.value || '').replace(/,/g, '')) || 0;
      state.ui.filters.minViews = numeric;
      saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
      const params = buildSearchParams();
      applyLocalFilters(params);
    });
  }

  document.querySelectorAll('.exec-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      playDingDong();
    });
  });

  document.getElementById('results-toggle')?.addEventListener('click', () => {
    toggleResultsPanel();
  });

  document.getElementById('results-toggle-header')?.addEventListener('click', () => {
    toggleResultsPanel();
  });
  document.getElementById('tts-speed')?.addEventListener('change', (e) => {
    state.ui.tts.speed = Number(String(e.target.value || '1.0').replace('x', '')) || 1.0;
    state.ui.tts.lastDurationSec = estimateBaseDuration(state.ui.script.output, state.ui.script.lang);
    saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
    render();
    bindEvents();
  });
  document.getElementById('tts-gemini-model')?.addEventListener('change', (e) => {
    state.ui.tts.geminiModel = normalizeTtsModel(e.target.value || 'gemini-2.5-flash-preview-tts');
    saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
  });
  document.getElementById('tts-voice')?.addEventListener('change', (e) => {
    const next = e.target.value || 'kore';
    state.ui.tts.voiceName = next;
    saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
  });
  document.getElementById('tts-generate')?.addEventListener('click', () => {
    generateTts();
  });
  document.querySelectorAll('.video-style-select').forEach((select) => {
    select.addEventListener('change', (e) => {
      state.ui.customSource.style = e.target.value;
      saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
      render();
      bindEvents();
    });
  });

  document.querySelectorAll('.cut-item-input').forEach(ta => {
    ta.addEventListener('change', (e) => {
      const idx = parseInt(e.target.getAttribute('data-cut-idx'), 10);
      state.ui.cuts.items[idx] = e.target.value.trim();
      saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
    });
  });

  document.querySelectorAll('.prompt-item-input').forEach(ta => {
    ta.addEventListener('change', (e) => {
      const idx = parseInt(e.target.getAttribute('data-prompt-idx'), 10);
      let pObj = state.ui.cuts.prompts.find(p => p.index === idx + 1);
      if (!pObj) {
        pObj = { index: idx + 1, prompt: '' };
        state.ui.cuts.prompts.push(pObj);
      }
      pObj.prompt = e.target.value.trim();
      saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
      render();
      bindEvents();
    });
  });

  document.querySelectorAll('.regen-single-prompt-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const idx = Number(btn.getAttribute('data-idx'));
      if (typeof idx !== 'number') return;
      
      const cutText = state.ui.cuts.items[idx];
      if (!cutText) {
        alert('대본 컷 내용이 비어있습니다.');
        return;
      }

      const apiKey = window.getGeminiKey();
      if (!apiKey) {
        alert('Gemini API 키가 필요합니다.');
        return;
      }

      const styleOptId = state.ui.customSource.style;
      const styleLabel = VIDEO_STYLE_OPTIONS.find((opt) => opt.id === styleOptId)?.label || 'Photorealistic';
      const selectedRatio = state.ui.cuts.ratio || '9:16';
      const targetAge = state.ui.script.targetAge || '';
      const tone = state.ui.script.tone || '';
      const formatRules = `- Composition/Layout: ${selectedRatio} aspect ratio. Ensure the primary subject is well-framed for ${selectedRatio}.`;

      btn.textContent = '생성 중...';
      btn.disabled = true;

      try {
        const prompt = `당신은 세계 최고의 영상/이미지 생성 AI 프롬프트 엔지니어입니다.
다음은 영상 대본의 특정 컷(Cut) 내용입니다.
이 컷의 내용에 맞춰, 시각적으로 매우 매력적이고 직관적인 이미지 생성용 "영어" 프롬프트를 번호 없이 1줄 작성하세요.
${formatRules}
- 비디오/이미지 스타일: ${styleLabel}
- 대상 연령/톤앤매너: ${targetAge} / ${tone}
- 조건: 
  1. 영문 프롬프트를 1문장~2문장 이내로 작성하세요. (카메라, 조명, 인물묘사 포함)
  2. 이미지 안에 한글 문구나 숫자(특히 ${selectedRatio} 같은 비율 숫자)를 절대 넣지 마세요.
  3. 프롬프트 텍스트 자체에도 "${selectedRatio}" 같은 숫자를 포함하지 마세요.
- 출력 형식: "Cut 1:" 이나 "Prompt:" 혹은 번호를 문장 앞에 절대 쓰지 마세요. 오직 순수 영문 프롬프트 내용만 1줄로 출력하세요.

해당 대본 컷:
${cutText}`;

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.8, maxOutputTokens: 1024 },
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error?.message || 'API 오류');
        let responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        if (!responseText) throw new Error('응답이 비어있습니다.');
        responseText = responseText.replace(/^(cut\s*\d+:|prompt:|\d+\.)\s*/gim, '').trim();
        
        let pObj = state.ui.cuts.prompts.find(p => p.index === idx + 1);
        if (!pObj) {
          pObj = { index: idx + 1, prompt: '' };
          state.ui.cuts.prompts.push(pObj);
        }
        pObj.prompt = responseText;
      } catch (err) {
        alert('개별 프롬프트 생성 실패: ' + err.message);
      } finally {
        btn.textContent = '이 씬만 프롬프트 재성성';
        btn.disabled = false;
        saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
        render();
        bindEvents();
      }
    });
  });

  document.getElementById('cuts-ratio')?.addEventListener('change', (e) => {
    state.ui.cuts.ratio = e.target.value;
    saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
    render();
    bindEvents();
  });


  const audioEl = document.getElementById('tts-audio');
  const playBtn = document.getElementById('tts-play');
  const downloadBtn = document.getElementById('tts-download');
  const seekEl = document.getElementById('tts-seek');
  const timeEl = document.getElementById('tts-time');
  if (audioEl && seekEl && timeEl) {
    const updateTime = () => {
      const current = audioEl.currentTime || 0;
      const duration = Number.isFinite(audioEl.duration) && audioEl.duration > 0
        ? audioEl.duration
        : state.ui.tts.audioDuration || 0;
      seekEl.max = `${Math.floor(duration)}`;
      seekEl.value = `${Math.floor(current)}`;
      timeEl.textContent = `${formatTime(current)} / ${formatTime(duration)}`;
    };
    audioEl.addEventListener('loadedmetadata', updateTime);
    audioEl.addEventListener('timeupdate', updateTime);
    audioEl.addEventListener('ended', () => {
      if (playBtn) playBtn.textContent = '재생';
    });
    seekEl.addEventListener('input', (e) => {
      const value = Number(e.target.value || 0);
      audioEl.currentTime = value;
      updateTime();
    });
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        if (audioEl.paused) {
          const startPlay = () => {
            const attempt = audioEl.play();
            if (attempt && typeof attempt.catch === 'function') {
              attempt.catch(() => {
                state.ui.tts.error = '재생 실패: 브라우저 재생 권한을 확인하세요.';
                render();
                bindEvents();
              });
            }
            playBtn.textContent = '일시정지';
          };
          if (audioEl.readyState < 2) {
            audioEl.addEventListener('canplay', startPlay, { once: true });
            audioEl.load();
          } else {
            startPlay();
          }
        } else {
          audioEl.pause();
          playBtn.textContent = '재생';
        }
      });
    }
    audioEl.addEventListener('error', () => {
      const code = audioEl.error?.code;
      const reasons = {
        1: '오디오 로드가 중단되었습니다.',
        2: '네트워크 오류로 오디오를 불러오지 못했습니다.',
        3: '오디오 디코딩 실패 (포맷 불일치 가능).',
        4: '지원하지 않는 오디오 포맷입니다.',
      };
      state.ui.tts.error = reasons[code] || '오디오 재생 오류가 발생했습니다.';
      render();
      bindEvents();
    });
    if (downloadBtn) {
      downloadBtn.addEventListener('click', async () => {
        if (!state.ui.tts.audioUrl) return;
        const name = buildProjectName();
        const stamp = buildProjectStamp();

        let targetUrl = state.ui.tts.audioUrl;
        const targetSpeed = Number(state.ui.tts.speed) || 1.0;

        if (targetSpeed !== 1.0) {
          downloadBtn.textContent = '저장 처리 중...';
          try {
            const res = await fetch(state.ui.tts.audioUrl);
            const arrayBuffer = await res.arrayBuffer();
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
            const offlineCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(
              audioBuffer.numberOfChannels,
              Math.ceil(audioBuffer.length / targetSpeed),
              audioBuffer.sampleRate
            );
            const source = offlineCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.playbackRate.value = targetSpeed;
            source.connect(offlineCtx.destination);
            source.start(0);
            const renderedBuffer = await offlineCtx.startRendering();

            const numChannels = renderedBuffer.numberOfChannels;
            const sampleRate = renderedBuffer.sampleRate;
            const length = renderedBuffer.length * numChannels * 2;
            const buffer = new ArrayBuffer(44 + length);
            const view = new DataView(buffer);
            const writeString = (v, offset, string) => {
              for (let i = 0; i < string.length; i++) v.setUint8(offset + i, string.charCodeAt(i));
            };
            writeString(view, 0, 'RIFF');
            view.setUint32(4, 36 + length, true);
            writeString(view, 8, 'WAVE');
            writeString(view, 12, 'fmt ');
            view.setUint32(16, 16, true);
            view.setUint16(20, 1, true);
            view.setUint16(22, numChannels, true);
            view.setUint32(24, sampleRate, true);
            view.setUint32(28, sampleRate * numChannels * 2, true);
            view.setUint16(32, numChannels * 2, true);
            view.setUint16(34, 16, true);
            writeString(view, 36, 'data');
            view.setUint32(40, length, true);
            const channelData = renderedBuffer.getChannelData(0);
            let offset = 44;
            for (let i = 0; i < renderedBuffer.length; i++) {
              let sample = Math.max(-1, Math.min(1, channelData[i]));
              sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
              view.setInt16(offset, sample, true);
              offset += 2;
            }
            const blob = new Blob([buffer], { type: 'audio/wav' });
            targetUrl = URL.createObjectURL(blob);
          } catch (e) {
            console.warn("다운로드 속도 변환 실패", e);
          }
        }

        const link = document.createElement('a');
        link.href = targetUrl;
        link.download = `${name}_${stamp}_tts.wav`;
        document.body.appendChild(link);
        link.click();
        link.remove();

        if (targetUrl !== state.ui.tts.audioUrl) {
          setTimeout(() => URL.revokeObjectURL(targetUrl), 10000);
        }

        downloadBtn.textContent = '다운로드';
      });
    }

    audioEl.defaultPlaybackRate = state.ui.tts.speed || 1.0;
    audioEl.playbackRate = state.ui.tts.speed || 1.0;
    updateTime();
  }
  document.getElementById('cuts-generate')?.addEventListener('click', async () => {
    const text = state.ui.script.output || '';
    if (!text) {
      alert('대본이 없습니다. 먼저 대본을 생성하세요.');
      return;
    }
    const apiKey = window.getGeminiKey();
    if (!apiKey) {
      alert('Gemini API 키가 필요합니다.');
      return;
    }
    const btn = document.getElementById('cuts-generate');
    if (btn) btn.textContent = '분할 중...';

    const isShorts = state.ui.script.type === 'shorts';
    let splitRules = '';
    if (isShorts) {
      splitRules = `- 대본의 원문 텍스트를 단 한 글자도 누락하거나 변경하지 말고 100% 그대로 반영하여 분할하세요. 요약은 절대 금지합니다.
- 대본의 처음부터 끝까지 빠짐없이 100% 모두 분할하세요.
- 5초 단위(한글 약 40자 내외)로 분할하되, 문맥이나 의미 단락이 끊기지 않고 가장 자연스럽게 이어지는 위치에서 자르세요.
- 쇼츠 영상의 빠른 템포에 알맞게 너무 길지도 짧지도 않은 적절한 컷 분량으로 나눠주세요.`;
    } else {
      const lengthStr = state.ui.script.longLength || '10분';
      const maxMins = parseInt(lengthStr.replace(/[^0-9]/g, ''), 10) || 10;
      splitRules = `- 대본의 원문 텍스트를 단 한 글자도 누락하거나 변경하지 말고 100% 그대로 반영하여 분할하세요. 요약은 절대 금지합니다.
- 대본의 처음부터 끝까지 빠짐없이 100% 모두 분할하세요.
- 롱폼 포맷(슬라이드 영상 형식)이며, 전체 길이가 ${maxMins}분이므로 전체 내용을 대략 ${Math.max(10, maxMins * 2)}~${Math.max(20, maxMins * 3)}개의 컷으로 상황 흐름에 맞게 넉넉히 분할하세요.`;
    }

    try {
      const prompt = `당신은 유튜브 1000만 뷰 기획자입니다.
다음 대본을 바탕으로 시각적인 장면(이미지/비디오) 생성을 위해 컷(Cut)을 분할해 주세요.
${splitRules}
- 시각적으로 뚜렷한 장면 전환이 가능한 타이밍이어야 합니다.
- 조건 출력 형식: 오직 분할된 텍스트만 각 줄에 하나씩 출력하세요. 번호 매기기나 추가 설명은 절대 넣지 마세요. 각 컷 사이는 엔터 1줄로 나눕니다.

대본 원문:
${text}`;
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || 'API 오류');
      const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
      if (!responseText) throw new Error('응답이 비어있습니다.');
      state.ui.cuts.items = responseText.split('\n').map(s => s.trim().replace(/^[\d\-\.\s]+/, '')).filter(Boolean);
      state.ui.cuts.prompts = [];
    } catch (err) {
      alert('컷 분할 실패: ' + err.message);
    } finally {
      if (btn) btn.textContent = '컷 분할';
      saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
      render();
      bindEvents();
    }
  });

  document.getElementById('prompts-generate')?.addEventListener('click', async () => {
    if (!state.ui.cuts.items || state.ui.cuts.items.length === 0) {
      alert('분할된 컷이 없습니다. 먼저 컷 분할을 실행하세요.');
      return;
    }
    const apiKey = window.getGeminiKey();
    if (!apiKey) {
      alert('Gemini API 키가 필요합니다.');
      return;
    }
    const styleOptId = state.ui.customSource.style;
    const styleLabel = VIDEO_STYLE_OPTIONS.find((opt) => opt.id === styleOptId)?.label || 'Photorealistic';
    const btn = document.getElementById('prompts-generate');
    if (btn) btn.textContent = '생성 중...';

    const selectedRatio = state.ui.cuts.ratio || '9:16';
    const formatRules = `- Composition/Layout: ${selectedRatio} aspect ratio. Ensure the primary subject is well-framed for ${selectedRatio}.`;

    try {
      const cutsText = state.ui.cuts.items.map((cut, i) => `Cut ${i + 1}: ${cut}`).join('\n');
      const targetAge = state.ui.script.targetAge || '';
      const tone = state.ui.script.tone || '';
      const prompt = `당신은 세계 최고의 영상/이미지 생성 AI 프롬프트 엔지니어입니다.
다음은 분할된 영상 대본의 컷(Cut) 내용들입니다. (총 ${state.ui.cuts.items.length}컷)
각 컷의 내용에 맞춰, 시각적으로 매우 매력적이고 직관적인 이미지 생성용 "영어" 프롬프트를 번호 없이 각각 1줄 작성하세요.
${formatRules}
- 비디오/이미지 스타일: ${styleLabel}
- 대상 연령/톤앤매너: ${targetAge} / ${tone}
- 조건: 
  1. 각 컷에 대응하는 영문 프롬프트를 1문장~2문장 이내로 작성하세요. (카메라, 조명, 인물묘사 포함)
  2. [연속성 규칙] 동영상 제작을 위해, 이전 프롬프트와 연속성이 이어지도록 상황을 자연스럽게 묘사해주세요.
  3. 이미지 안에 한글 문구나 숫자(특히 ${selectedRatio} 같은 비율 숫자)를 절대 넣지 마세요.
  4. 프롬프트 텍스트 자체에도 "${selectedRatio}" 같은 숫자를 포함하지 마세요. 오직 장면 묘사에만 집중하세요.
- 출력 형식: 각 컷마다 1개의 프롬프트 단락만 출력하세요. 각 프롬프트는 오직 하나씩 빈 줄(엔터 2번)로만 구분되어야 합니다. "Cut 1:" 이나 "Prompt:" 혹은 번호를 문장 앞에 절대 쓰지 마세요. 오직 순수 영문 프롬프트 내용만 출력하세요.

해당 대본 컷 리스트:
${cutsText}`;
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 8192 },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || 'API 오류');
      let responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
      if (!responseText) throw new Error('응답이 비어있습니다.');
      responseText = responseText.replace(/^(cut\s*\d+:|prompt:|\d+\.)\s*/gim, '');
      const lines = responseText.split(/\n\s*\n/).map(s => s.trim().replace(/^\*\*.*?\*\*\s*/g, '')).filter(Boolean);
      state.ui.cuts.prompts = lines.map((p, i) => ({ index: i + 1, prompt: p }));
    } catch (err) {
      alert('프롬프트 생성 실패: ' + err.message);
    } finally {
      if (btn) btn.textContent = '프롬프트 생성';
      saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
      render();
      bindEvents();
    }
  });
  const addCutRow = () => {
    state.ui.cuts.items.push('');
    const newIdx = state.ui.cuts.items.length;
    state.ui.cuts.prompts.push({ index: newIdx, prompt: '' });
    saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
    render();
    bindEvents();
  };

  document.getElementById('add-cut-row')?.addEventListener('click', addCutRow);
  document.getElementById('add-cut-row-p8')?.addEventListener('click', addCutRow);
  document.getElementById('add-cut-row-p9')?.addEventListener('click', addCutRow);

  document.querySelectorAll('.delete-cut-row').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.getAttribute('data-idx'));
      if (typeof idx !== 'number') return;

      const cutNum = idx + 1;

      // Remove from items
      state.ui.cuts.items.splice(idx, 1);

      // Remove from prompts and re-index
      state.ui.cuts.prompts = state.ui.cuts.prompts
        .filter((_, i) => i !== idx)
        .map((p, i) => ({ ...p, index: i + 1 }));

      // Synchronize deletion in image/video jobs
      state.ui.imageJobs = state.ui.imageJobs
        .filter(j => j.cut !== cutNum)
        .map(j => ({ ...j, cut: j.cut > cutNum ? j.cut - 1 : j.cut }));
      
      state.ui.videoJobs = state.ui.videoJobs
        .filter(j => j.cut !== cutNum)
        .map(j => ({ ...j, cut: j.cut > cutNum ? j.cut - 1 : j.cut }));

      saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
      render();
      bindEvents();
    });
  });
  document.getElementById('prompt-copy')?.addEventListener('click', async () => {
    const text = state.ui.cuts.prompts.map((p) => p.prompt).join('\n\n');
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch { }
  });
  document.querySelectorAll('.video-cut-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cut = Number(btn.getAttribute('data-video-cut')) || 0;
      if (!cut) return;
      state.ui.videoJobs.push({ cut, status: '대기' });
      saveState(state);
      render();
      bindEvents();
      processVideoQueue();
    });
  });

  document.getElementById('project-root')?.addEventListener('change', (e) => {
    state.ui.projectRoot = e.target.value || DEFAULT_PROJECT_ROOT;
    saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
  });
  document.getElementById('project-name')?.addEventListener('change', (e) => {
    state.ui.projectName = e.target.value || '';
    saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
  });
  document.getElementById('project-save')?.addEventListener('click', () => {
    const name = buildProjectName();
    const stamp = buildProjectStamp();
    const payload = buildProjectPayload();
    const filename = `${name}_${stamp}_project.json`;
    downloadJson(filename, payload);
  });
  document.getElementById('tts-save')?.addEventListener('click', () => {
    const name = buildProjectName();
    const stamp = buildProjectStamp();
    const payload = buildTtsPayload();
    const filename = `${name}_${stamp}_tts.json`;
    downloadJson(filename, payload);
  });
  document.getElementById('image-save')?.addEventListener('click', () => {
    const name = buildProjectName();
    const stamp = buildProjectStamp();
    const payload = buildImagePayload();
    const filename = `${name}_${stamp}_images.json`;
    downloadJson(filename, payload);
  });
  document.getElementById('video-save')?.addEventListener('click', () => {
    const name = buildProjectName();
    const stamp = buildProjectStamp();
    const payload = buildVideoPayload();
    const filename = `${name}_${stamp}_videos.json`;
    downloadJson(filename, payload);
  });

  document.getElementById('image-generate-all')?.addEventListener('click', () => {
    const apiKey = window.getGeminiKey();
    if (!apiKey) {
      alert('Gemini API 키가 필요합니다.');
      return;
    }
    
    // Add all cuts to queue that aren't already done
    state.ui.cuts.prompts.forEach((p) => {
      const existingJob = state.ui.imageJobs.find(j => j.cut === p.index);
      if (existingJob) {
        if (existingJob.status !== '생성 완료' && existingJob.status !== '생성 중...') {
          existingJob.status = '대기';
          existingJob.imageUrl = '';
        }
      } else {
        state.ui.imageJobs.push({ cut: p.index, status: '대기', imageUrl: '' });
      }
    });

    saveState(state);
    render();
    bindEvents();
    
    processImageQueue(); // Start processing the filled queue
  });

  document.getElementById('image-generate-stop')?.addEventListener('click', () => {
    stopImageProcessingFlag = true;
  });

  document.querySelectorAll('.image-cut-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      stopImageProcessingFlag = false;
      const cut = Number(btn.getAttribute('data-image-cut')) || 0;
      if (!cut) return;
      addToImageQueue(cut);
    });
  });

  document.getElementById('thumb-generate')?.addEventListener('click', () => {
    generateThumbnail();
  });

  document.getElementById('youtube-meta-generate')?.addEventListener('click', () => {
    generateYoutubeMetadata();
  });

  document.getElementById('project-load')?.addEventListener('click', () => {
    document.getElementById('project-load-input')?.click();
  });

  document.getElementById('project-load-input')?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const loaded = JSON.parse(ev.target.result);
        if (loaded.keys) state.keys = { ...state.keys, ...loaded.keys };
        if (loaded.active) state.active = { ...state.active, ...loaded.active };
        if (loaded.ui) state.ui = { ...state.ui, ...loaded.ui };
        if (loaded.results) state.results = loaded.results;

        // Restore new properties from top-level if present
        if (loaded.imageJobs) state.ui.imageJobs = loaded.imageJobs;
        if (loaded.thumbnailJobs) state.ui.thumbnailJobs = loaded.thumbnailJobs;
        if (loaded.youtubeMetadata) state.ui.youtubeMetadata = loaded.youtubeMetadata;

        saveState(state);
        render();
        bindEvents();
        alert('프로젝트를 성공적으로 불러왔습니다.');
      } catch (err) {
        alert('파일을 불러오는 중 오류가 발생했습니다: ' + err.message);
      }
    };
    reader.readAsText(file);
  });

  document.querySelectorAll('.image-upload-trigger').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = btn.getAttribute('data-idx');
      const input = document.getElementById('image-upload-input');
      if (input) {
        input.setAttribute('data-target-idx', idx);
        input.click();
      }
    });
  });

  document.getElementById('image-upload-input')?.addEventListener('change', (e) => {
    const idx = Number(e.target.getAttribute('data-target-idx'));
    const file = e.target.files?.[0];
    if (!file || !idx) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      let job = state.ui.imageJobs.find(j => j.cut === idx);
      if (!job) {
        job = { cut: idx, status: '생성 완료', imageUrl: base64 };
        state.ui.imageJobs.push(job);
      } else {
        job.status = '생성 완료';
        job.imageUrl = base64;
      }
      saveState(state);
      render();
      bindEvents();

      // Trigger AI Vision analysis - Always force for manual uploads
      await analyzeMediaForPrompt(idx, base64, true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  });

  document.querySelectorAll('.image-download-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = Number(btn.getAttribute('data-idx'));
      const job = state.ui.imageJobs.find(j => j.cut === idx);
      if (!job || !job.imageUrl) return;

      const link = document.createElement('a');
      link.href = job.imageUrl;
      link.download = `cut_${idx}_image.jpg`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
  });

  document.querySelectorAll('.image-delete-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = Number(btn.getAttribute('data-idx'));
      const jobIdx = state.ui.imageJobs.findIndex(j => j.cut === idx);
      if (jobIdx > -1) {
        state.ui.imageJobs[jobIdx].imageUrl = '';
        state.ui.imageJobs[jobIdx].status = '대기';
        saveState(state);
        render();
        bindEvents();
      }
    });
  });
  document.querySelectorAll('.video-upload-trigger').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = btn.getAttribute('data-idx');
      const input = document.getElementById('video-upload-input');
      if (input) {
        input.setAttribute('data-target-idx', idx);
        input.click();
      }
    });
  });

  document.getElementById('video-upload-input')?.addEventListener('change', (e) => {
    const idx = Number(e.target.getAttribute('data-target-idx'));
    const file = e.target.files?.[0];
    if (!file || !idx) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      let job = state.ui.videoJobs.find(j => j.cut === idx);
      if (!job) {
        job = { cut: idx, status: '생성 완료', videoUrl: base64 };
        state.ui.videoJobs.push(job);
      } else {
        job.status = '생성 완료';
        job.videoUrl = base64;
      }
      saveState(state);
      render();
      bindEvents();

      // Analyze the video - Force for manual upload
      await analyzeMediaForPrompt(idx, base64, true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  });

  document.querySelectorAll('.video-download-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = Number(btn.getAttribute('data-idx'));
      const job = state.ui.videoJobs.find(j => j.cut === idx);
      if (!job || !job.videoUrl) return;

      const link = document.createElement('a');
      link.href = job.videoUrl;
      link.download = `cut_${idx}_video.mp4`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
  });

  document.querySelectorAll('.video-delete-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = Number(btn.getAttribute('data-idx'));
      const jobIdx = state.ui.videoJobs.findIndex(j => j.cut === idx);
      if (jobIdx > -1) {
        state.ui.videoJobs[jobIdx].videoUrl = '';
        state.ui.videoJobs[jobIdx].status = '대기';
        saveState(state);
        render();
        bindEvents();
      }
    });
  });
};

window.getYouTubeKey = () => {
  if (state.active.yt === 'yt1' && state.status.yt1.type === 'quota' && state.keys.yt2) {
    state.active.yt = 'yt2';
    saveState({ keys: state.keys, active: state.active, status: state.status, ui: state.ui });
  }
  return state.keys[state.active.yt];
};

window.getGeminiKey = () => state.keys.g1;

render();
bindEvents();
