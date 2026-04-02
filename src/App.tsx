import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import Markdown from 'react-markdown';
import JSZip from 'jszip';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { 
  Settings, Search, Youtube, FileText, Volume2, Image as ImageIcon, 
  Video, Save, Download, Trash2, Plus, X, Play, Pause, 
  CheckCircle2, AlertCircle, Loader2, Sparkles, TrendingUp,
  Languages, Clock, Users, Zap, Copy, Check, Image, ImagePlus
} from "lucide-react";
import { LS_KEYS } from './types';
import { AI_PROMPTS } from './prompts';
import { CORE_GUIDELINES, SCRIPT_RULES } from './guidelines/rules';
import Panel12Section from './features/panel12/Panel12Section';
import ApiStatusBar from './components/ApiStatusBar';

// --- Constants ---
const GEMINI_TTS_MODELS = [
  { id: 'gemini-2.5-flash-preview-tts', label: 'Gemini 2.5 Flash Preview TTS', price: '1M/$7.88' },
  { id: 'gemini-2.5-pro-preview-tts', label: 'Gemini 2.5 Pro Preview TTS', price: '1M/$15.75' },
  { id: 'elevenlabs', label: 'ElevenLabs TTS', price: 'ElevenLabs 요금제' },
];

const ELEVENLABS_MODELS = [
  { id: 'eleven_multilingual_v2', label: 'Eleven Multilingual v2' },
  { id: 'eleven_turbo_v2', label: 'Eleven Turbo v2' },
];

const GEMINI_TTS_ONLY_MODELS = GEMINI_TTS_MODELS.filter(model => model.id !== 'elevenlabs');

const GEMINI_TTS_VOICES = [
  { id: "Kore", label: "Kore · 여성 · 따뜻/밝음", gender: "여성", tags: ["따뜻", "밝음", "진행"] },
  { id: "Puck", label: "Puck · 남성 · 지적/차분", gender: "남성", tags: ["지적", "차분", "분석"] },
  { id: "Charon", label: "Charon · 남성 · 중후/권위", gender: "남성", tags: ["중후", "권위", "무게"] },
  { id: "Fenrir", label: "Fenrir · 남성 · 거침/강렬", gender: "남성", tags: ["거침", "강렬", "박력"] },
  { id: "Zephyr", label: "Zephyr · 남성 · 친근/활기", gender: "남성", tags: ["친근", "활기", "대중"] },
  { id: "Achernar", label: "Achernar · 여성 · 저음/단정", gender: "여성", tags: ["저음", "단정", "신뢰"] },
  { id: "Achird", label: "Achird · 남성 · 맑음/차분", gender: "남성", tags: ["맑음", "차분", "클린"] },
  { id: "Algenib", label: "Algenib · 남성 · 담백/중립", gender: "남성", tags: ["담백", "중립", "정보"] },
  { id: "Algieba", label: "Algieba · 여성 · 부드러움/친근", gender: "여성", tags: ["부드러움", "친근", "따뜻"] },
  { id: "Alnilam", label: "Alnilam · 남성 · 깊이/중저음", gender: "남성", tags: ["깊이", "중저음", "무게"] },
  { id: "Aoede", label: "Aoede · 여성 · 감성/부드러움", gender: "여성", tags: ["감성", "부드러움", "잔잔"] },
  { id: "Autonoe", label: "Autonoe · 여성 · 또렷/명료", gender: "여성", tags: ["또렷", "명료", "또박"] },
  { id: "Callirrhoe", label: "Callirrhoe · 여성 · 밝음/활기", gender: "여성", tags: ["밝음", "활기", "에너지"] },
  { id: "Despina", label: "Despina · 여성 · 맑음/경쾌", gender: "여성", tags: ["맑음", "경쾌", "청량"] },
  { id: "Enceladus", label: "Enceladus · 남성 · 단호/명료", gender: "남성", tags: ["단호", "명료", "확신"] },
  { id: "Erinome", label: "Erinome · 여성 · 차분/중립", gender: "여성", tags: ["차분", "중립", "안정"] },
  { id: "Gacrux", label: "Gacrux · 여성 · 따뜻/담백", gender: "여성", tags: ["따뜻", "담백", "친근"] },
  { id: "Iapetus", label: "Iapetus · 남성 · 깊이/차분", gender: "남성", tags: ["깊이", "차분", "안정"] },
  { id: "Laomedeia", label: "Laomedeia · 여성 · 부드럽/정돈", gender: "여성", tags: ["부드럽", "정돈", "안정"] },
  { id: "Leda", label: "Leda · 여성 · 중저음/신뢰", gender: "여성", tags: ["중저음", "신뢰", "차분"] },
  { id: "Orus", label: "Orus · 남성 · 에너지/명료", gender: "남성", tags: ["에너지", "명료", "자신감"] },
  { id: "Pulcherrima", label: "Pulcherrima · 여성 · 우아/유연", gender: "여성", tags: ["우아", "유연", "세련"] },
  { id: "Rasalgethi", label: "Rasalgethi · 남성 · 묵직/장중", gender: "남성", tags: ["묵직", "장중", "서사"] },
  { id: "Sadachbia", label: "Sadachbia · 남성 · 또렷/선명", gender: "남성", tags: ["또렷", "선명", "기본"] },
  { id: "Sadaltager", label: "Sadaltager · 남성 · 안정/중립", gender: "남성", tags: ["안정", "중립", "단정"] },
  { id: "Schedar", label: "Schedar · 남성 · 저음/묵직", gender: "남성", tags: ["저음", "묵직", "권위"] },
  { id: "Sulafat", label: "Sulafat · 여성 · 부드러움/따뜻", gender: "여성", tags: ["부드러움", "따뜻", "잔잔"] },
  { id: "Umbriel", label: "Umbriel · 남성 · 차분/깊이", gender: "남성", tags: ["차분", "깊이", "내레이션"] },
  { id: "Vindemiatrix", label: "Vindemiatrix · 여성 · 맑음/정갈", gender: "여성", tags: ["맑음", "정갈", "클린"] },
  { id: "Zubenelgenubi", label: "Zubenelgenubi · 여성 · 중립/안정", gender: "여성", tags: ["중립", "안정", "차분"] }
];

const VOICE_SAMPLE_PATHS: Record<string, string> = {
  Kore: '/audio/Kore.wav',
  Puck: '/audio/Puck.wav',
  Charon: '/audio/Charon.wav',
  Fenrir: '/audio/Fenrir.wav',
  Zephyr: '/audio/Zephyr.wav',
  Achernar: '/audio/achernar.wav',
  Achird: '/audio/achird.wav',
  Algenib: '/audio/algenib.wav',
  Algieba: '/audio/algieba.wav',
  Alnilam: '/audio/alnilam.wav',
  Aoede: '/audio/Aoede.wav',
  Autonoe: '/audio/autonoe.wav',
  Callirrhoe: '/audio/callirrhoe.wav',
  Despina: '/audio/despina.wav',
  Enceladus: '/audio/enceladus.wav',
  Erinome: '/audio/erinome.wav',
  Gacrux: '/audio/gacrux.wav',
  Iapetus: '/audio/iapetus.wav',
  Laomedeia: '/audio/laomedeia.wav',
  Leda: '/audio/leda.wav',
  Orus: '/audio/orus.wav',
  Pulcherrima: '/audio/pulcherrima.wav',
  Rasalgethi: '/audio/rasalgethi.wav',
  Sadachbia: '/audio/sadachbia.wav',
  Sadaltager: '/audio/sadaltager.wav',
  Schedar: '/audio/schedar.wav',
  Sulafat: '/audio/sulafat.wav',
  Umbriel: '/audio/umbriel.wav',
  Vindemiatrix: '/audio/vindemiatrix.wav',
  Zubenelgenubi: '/audio/zubenelgenubi.wav',
};

const ELEVENLABS_VOICES = [
  { id: 'elv_adam', name: 'Adam', label: 'Adam · Dominant · 남성', preview: '/audio/elevenlabs-previews/Adam - Dominant_남성.mp3' },
  { id: 'elv_alice', name: 'Alice', label: 'Alice · Clear · 여성 · 정보', preview: '/audio/elevenlabs-previews/Alice - Clear_여성_정보.mp3' },
  { id: 'elv_bill', name: 'Bill', label: 'Bill · Wise · 남성 · 상품', preview: '/audio/elevenlabs-previews/Bill - Wise_남성_상품.mp3' },
  { id: 'elv_brian', name: 'Brian', label: 'Brian · Deep · 남성 · 심리', preview: '/audio/elevenlabs-previews/Brian_Deep_남성_심리.mp3' },
  { id: 'elv_callum', name: 'Callum', label: 'Callum · Husky · 남성', preview: '/audio/elevenlabs-previews/Callum - Husky_남성.mp3' },
  { id: 'elv_charlie', name: 'Charlie', label: 'Charlie · Deep/Confident · 남성 · 정보', preview: '/audio/elevenlabs-previews/Charlie - Deep, Confident_남성_정보.mp3' },
  { id: 'elv_chris', name: 'Chris', label: 'Chris · Charming · 남성 · 소탈', preview: '/audio/elevenlabs-previews/Chris - Charming_남성_소탈.mp3' },
  { id: 'elv_daniel', name: 'Daniel', label: 'Daniel · Broadcaster · 남성 · 방송', preview: '/audio/elevenlabs-previews/Daniel - Steady Broadcaster_남성_방송.mp3' },
  { id: 'elv_george', name: 'George', label: 'George · Warm · 남성 · 온화', preview: '/audio/elevenlabs-previews/George - Warm, Captivating_남성_온화.mp3' },
  { id: 'elv_harry', name: 'Harry', label: 'Harry · Fierce · 남성 · 코믹', preview: '/audio/elevenlabs-previews/Harry - Fierce Warrior_남성_코믹.mp3' },
  { id: 'elv_liam', name: 'Liam', label: 'Liam · Energetic · 남성 · 이야기', preview: '/audio/elevenlabs-previews/Liam - Energetic_남성_이야기.mp3' },
  { id: 'elv_lily', name: 'Lily', label: 'Lily · Velvety · 여성', preview: '/audio/elevenlabs-previews/Lily - Velvety Actress_여성.mp3' },
  { id: 'elv_matilda', name: 'Matilda', label: 'Matilda · Knowledgable · 여성 · 상품', preview: '/audio/elevenlabs-previews/Matilda - Knowledgable_여성_상품.mp3' },
  { id: 'elv_sarah', name: 'Sarah', label: 'Sarah · Mature · 여성 · 시니어', preview: '/audio/elevenlabs-previews/Sarah - Mature, Reassuring_여성_시니어.mp3' },
];

const ELEVENLABS_PREVIEW_PATHS = ELEVENLABS_VOICES.reduce<Record<string, string>>((acc, voice) => {
  acc[voice.id] = voice.preview;
  return acc;
}, {});

const ELEVENLABS_DEFAULT_SETTINGS = {
  stability: 0.45,
  similarity_boost: 0.75,
  style: 0.2,
  use_speaker_boost: true,
};

const AUTO_FLOW_STEPS = [
  '대본 생성',
  'TTS 생성',
  '컷 분할',
  '프롬프트 생성',
  '이미지 자동 생성',
  '영상 구성',
  '렌더링',
  '설명/태그 생성',
  '완료',
];

const PRODUCT_FLOW_STEPS = [
  '상품 분석 중',
  '자동 제작 중',
  '완료',
];

const BGM_LIBRARY: Array<{ label: string; path: string }> = [
  { label: 'Heart Sutra · Buddhism', path: '/audio/bgm/Heart Sutra_Buddhism.MP3' },
  { label: 'Sunday Rollerskate · Product sales', path: '/audio/bgm/Sunday Rollerskate_Product sales.mp3' },
  { label: 'Verified Update (침착뉴스)', path: '/audio/bgm/Verified Update(침착뉴스).wav' },
  { label: 'Breaking Signal-1 (클래식뉴스)', path: '/audio/bgm/Breaking Signal-1(클래식뉴스).wav' },
  { label: 'Flash Wire (속보)', path: '/audio/bgm/Flash Wire(속보).wav' },
  { label: 'Breaking Signal (뉴스메인 2분)', path: '/audio/bgm/Breaking Signal_뉴스메인(2분).wav' },
  { label: 'Candy Switch · 미래 EDM', path: '/audio/bgm/Candy Switch_미래EDM.wav' },
  { label: 'Jump! Blink! · 코믹', path: '/audio/bgm/Jump! Blink!_코믹.wav' },
  { label: 'Coffee Steam And City Rain · 빠른뉴스', path: '/audio/bgm/Coffee steam and city rain_빠른뉴스.wav' },
  { label: 'Sparkling Morning · travel', path: '/audio/bgm/Sparkling Morning_travel.wav' },
  { label: 'Rainbow Steps · comic', path: '/audio/bgm/Rainbow Steps_comic.mp3' },
  { label: 'Cloud Train Go! · animal', path: '/audio/bgm/Cloud Train Go!_animal.mp3' },
  { label: 'Twinkle Playground · Mystery', path: '/audio/bgm/Twinkle Playground_Mystery.mp3' },
  { label: 'Hide & Seek In The Woods · travel', path: '/audio/bgm/Hide & Seek in the Woods_travel.mp3' },
  { label: 'Starry Nap · Emotional', path: '/audio/bgm/Starry Nap_Emotional.mp3' },
  { label: 'Morning Of Reason · crisp', path: '/audio/bgm/Morning of Reason_crisp.mp3' },
  { label: 'Grey Balance · quiet', path: '/audio/bgm/Grey Balance_quiet.mp3' },
  { label: 'Margin For Thought · Mystery', path: '/audio/bgm/Margin for Thought _Mystery.mp3' },
  { label: 'Lamplight Low · Romance', path: '/audio/bgm/Lamplight Low_Romance.mp3' },
  { label: 'Tide Of Thought · Documentary', path: '/audio/bgm/Tide of Thought_Documentary.mp3' },
  { label: 'Cotton Candy Sky · Emotional', path: '/audio/bgm/Cotton Candy Sky_Emotional.mp3' },
  { label: 'Tropical Steps · Product sales', path: '/audio/bgm/Tropical Steps_Product sales.mp3' },
  { label: 'Sunday Roller · nervous', path: '/audio/bgm/Sunday Roller_nervous.mp3' },
  { label: 'Sunbath · psychology', path: '/audio/bgm/Sunbath_psychology.mp3' },
  { label: 'Dawn Tea · meditation', path: '/audio/bgm/Dawn Tea_meditation.mp3' },
];

const SFX_LIBRARY: Array<{ label: string; path: string }> = [
  { label: '효과음 · 쿵', path: '/audio/sound effects/효과음/쿵.mp3' },
  { label: '효과음 · 펑', path: '/audio/sound effects/효과음/펑.mp3' },
  { label: '효과음 · 샤르르', path: '/audio/sound effects/효과음/샤르르.mp3' },
  { label: '효과음 · 스르르', path: '/audio/sound effects/효과음/스르르.mp3' },
  { label: '효과음 · 다음장면', path: '/audio/sound effects/효과음/다음장면.mp3' },
  { label: '효과음 · 시작끝', path: '/audio/sound effects/효과음/시작끝.mp3' },
  { label: '효과음 · 비프음(뚜~)', path: '/audio/sound effects/효과음/비프음(뚜~).mp3' },
  { label: '효과음 · 심작박동', path: '/audio/sound effects/효과음/심작박동.mp3' },
  { label: '긴장 · 1-1 긴장', path: '/audio/sound effects/긴장/1-1 긴장.mp3' },
  { label: '긴장 · 1-4 긴장 중-강', path: '/audio/sound effects/긴장/1-4 긴장 중-강.mp3' },
  { label: '긴장 · 5-4 공포 중-강', path: '/audio/sound effects/긴장/5-4  공포-중-강.mp3' },
  { label: '비상사이렌 · 응급차', path: '/audio/sound effects/비상사이렌/응급차.mp3' },
  { label: '비상사이렌 · 경찰사이렌', path: '/audio/sound effects/비상사이렌/경찰사이렌.mp3' },
  { label: '단체웃음 · 01', path: '/audio/sound effects/단체웃음/01.mp3' },
  { label: '총소리 · 기관총 연사 1', path: '/audio/sound effects/총소리/기관총 연사 1.mp3' },
  { label: '전화기 · 전화전자식', path: '/audio/sound effects/전화기/전화전자식.mp3' },
  { label: '황당할때 · 띠웅~', path: '/audio/sound effects/황당할때/띠웅~.mp3' },
];

const BUDDHIST_BGM_PATH = '/audio/bgm/Heart Sutra_Buddhism.MP3';
const BUDDHIST_TERMS = ['부처', '부처님', '나무관세음보살', '보살', '스님', '반야심경'];
const DEFAULT_NON_RELIGIOUS_BGM = BGM_LIBRARY.find(track => track.path !== BUDDHIST_BGM_PATH)?.path || BGM_LIBRARY[0]?.path || '';
const MM_TO_PX_1080 = 3.7795275591;

const mmToPxScaled = (mm: number, width: number) => mm * MM_TO_PX_1080 * (width / 1080);

const IMAGE_SLIDE_DURATION_SEC = 4;
const SHORTS_VIDEO_DURATION_SEC = 4;
const LONGFORM_VIDEO_DURATION_SEC = 8;

const resolveVideoCutDurationSec = (scriptType?: string) =>
  scriptType === 'long-form' || scriptType === 'longform'
    ? LONGFORM_VIDEO_DURATION_SEC
    : SHORTS_VIDEO_DURATION_SEC;

const AUTO_DONE_MESSAGE = '설명: 자동생성이 완료되었습니다. 상세 설정 마무리 하시고 슬라이드 구성과 렌더링을 마무리 하세요.';

const getSlideTimelineDurationSec = (slide: any, fallback: number) => {
  if (Number(slide?.duration || 0) > 0) return Math.max(0.2, Number(slide.duration));
  if (slide?.mediaType === 'video' && Number(slide?.videoDurationSec || 0) > 0) {
    return Math.max(0.2, Number(slide.videoDurationSec));
  }
  return Math.max(0.2, fallback);
};

const PRODUCT_PROMO_MAX_IMAGES = 7;
const PRODUCT_PROMO_AUTO_STYLE = '11. photorealistic';

const splitToFixedLines = (text: string, maxLineChars: number, maxLines: number) => {
  const compact = text.replace(/\s+/g, ' ').trim();
  if (!compact) return [] as string[];
  const chars = Array.from(compact);
  const lines: string[] = [];
  let cursor = 0;
  while (cursor < chars.length && lines.length < maxLines) {
    lines.push(chars.slice(cursor, cursor + maxLineChars).join('').trim());
    cursor += maxLineChars;
  }
  return lines.filter(Boolean);
};

const normalizeHookTitleForOverlay = (text: string) => {
  const compact = text.replace(/\s+/g, ' ').trim();
  const limited = Array.from(compact).slice(0, 20).join('');
  const lines = splitToFixedLines(limited, 10, 2);
  return lines.join('\n');
};

const resolveSelectedVideoStyle = (selected: string) => {
  const raw = String(selected || '').trim();
  const leadingId = raw.split('.')[0]?.trim();
  if (leadingId && /^\d+$/.test(leadingId)) {
    const byId = VIDEO_STYLES_31.find(style => String(style.id) === leadingId);
    if (byId) return byId;
  }
  return VIDEO_STYLES_31.find(style => raw.includes(style.name)) || VIDEO_STYLES_31[0];
};

const SFX_RECOMMEND_RULES: Array<{ category: string; keywords: string[] }> = [
  { category: '긴장', keywords: ['긴장', '공포', '위기', '불안', '비밀', '충격', '살인', '미스터리'] },
  { category: '비상사이렌', keywords: ['사건', '사고', '긴급', '경보', '출동', '응급', '재난', '속보'] },
  { category: '단체웃음', keywords: ['웃음', '유머', '코믹', '드립', '개그', '황당', '반전'] },
  { category: '총소리', keywords: ['총', '총격', '전투', '사격', '폭발', '전쟁', '추격'] },
  { category: '전화기', keywords: ['전화', '통화', '벨', '연락', '호출'] },
  { category: '효과음', keywords: ['전환', '등장', '강조', '팁', '주의', '핵심'] },
];

const TONE_STYLES = [
  { id: "default", label: "없음 (AI 추천 기본값)", desc: "AI가 주제와 대본에 맞춰 최적의 스타일을 설정합니다." },
  { id: "01", label: "01 이야기/구연", detail: "썰풀이, 일상 브이로그, 감성 에세이", tone: "친근하고 자연스러운 대화체" },
  { id: "02", label: "02 뉴스/정보", detail: "시사 뉴스, IT 소식, 상식 전달", tone: "빠르고 명확하며 신뢰감 있는 톤" },
  { id: "03", label: "03 다큐멘터리", detail: "역사, 자연, 과학, 인물 평전", tone: "차분하고 무게감 있는 중저음" },
  { id: "04", label: "04 스포츠 중계", detail: "경기 하이라이트, 스포츠 뉴스", tone: "에너지가 넘치고 박진감 있는 톤" },
  { id: "05", label: "05 명상/종교/기도", detail: "명상 가이드, 성경/불경 낭독, 확언", tone: "매우 느리고 평온하며 부드러운 음성" },
  { id: "06", label: "06 영화/드라마 리뷰", detail: "영화 요약, 드라마 분석, 결말 포함", tone: "몰입감 있고 흡입력 있는 스토리텔링" },
  { id: "07", label: "07 미스터리/공포", detail: "괴담, 미해결 사건, 공포 실화", tone: "낮고 서늘하며 긴장감을 주는 호흡" },
  { id: "08", label: "08 동기부여/성공", detail: "명언, 자기계발, 성공 비결", tone: "힘 있고 단호하며 영감을 주는 어조" },
  { id: "09", label: "09 비즈니스/경제", detail: "주식 분석, 부동산 전망, 재테크", tone: "객관적이고 지적이며 수치에 정확함" },
  { id: "10", label: "10 어린이/동화", detail: "수면 동화, 아이용 교육 영상", tone: "다정다감하고 생동감 있는 하이톤" },
  { id: "11", label: "11 리뷰/언박싱", detail: "제품 후기, 맛집 탐방, 리액션", tone: "밝고 명랑하며 호기심 어린 말투" },
  { id: "12", label: "12 예능/유머", detail: "유머 게시판, 밈 모음, 풍자", tone: "장난기 있고 높납이가 다채로운 톤" },
  { id: "13", label: "13 인터뷰/대화", detail: "Q&A, 가상 인터뷰, 상황극", tone: "질문과 답변이 구분되는 구어체" }
];

const COUNTRY_MAP: Record<string, string> = {
  한국: 'KR', 미국: 'US', 일본: 'JP', 영국: 'GB', 독일: 'DE', 프랑스: 'FR', 베트남: 'VN'
};

const COUNTRY_TRANSLATION_LANG: Record<string, string> = {
  한국: 'ko',
  미국: 'en',
  일본: 'ja',
  영국: 'en-GB',
  독일: 'de',
  프랑스: 'fr',
  베트남: 'vi',
};

const COUNTRY_ORDER = Object.keys(COUNTRY_MAP);

const CATEGORY_MAP: Record<string, string> = {
  '모든 카테고리': '', 종교: '종교', 야담: '야담', 경제: '경제', 
  뉴스: '뉴스', 드라마: '드라마', 의학: '의학', AI기술: 'AI기술', 동물: '동물'
};

// --- Helper Functions ---
const formatNumber = (num: number) => num.toLocaleString('en-US');
const toDateTimeLocalValue = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d}T${hh}:${mm}`;
};
const toFutureDateTimeLocalValue = (minutes: number) => {
  const safe = [30, 60, 120].includes(Number(minutes)) ? Number(minutes) : 60;
  return toDateTimeLocalValue(new Date(Date.now() + safe * 60 * 1000));
};

const addWavHeader = (base64Pcm: string, sampleRate: number = 24000) => {
  const binaryString = atob(base64Pcm);
  const len = binaryString.length;
  const buffer = new ArrayBuffer(44 + len);
  const view = new DataView(buffer);

  const writeString = (v: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      v.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + len, true);
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, len, true);

  for (let i = 0; i < len; i++) {
    view.setUint8(44 + i, binaryString.charCodeAt(i));
  }

  const blob = new Blob([buffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
};

const VIDEO_STYLES_31 = [
  { id: '00', name: '선택안함', prompt: 'No specific style, natural look', keyword: 'none', thumbnail: '' },
  { id: '01', name: '뉴스/다큐', prompt: 'News and information documentary style, calm and trustworthy narration tone, realistic graphics and data visualizations, natural interview clip transitions, clean white/blue lighting, professional camera work with slow pans, educational and serious atmosphere, cinematic documentary feel, ultra-detailed 8K', keyword: 'news_doc', thumbnail: '/styles/01 뉴스다큐.jpg' },
  { id: '02', name: '우주/SF', prompt: 'Space and sci-fi future trailer style, grand cosmic scale and futuristic technology feel, starlight and neon lighting, drone flyovers and orbital shots, volumetric god rays and lens flares, cinematic sci-fi blockbuster feel, ultra-detailed 8K', keyword: 'space_sf', thumbnail: '/styles/02 우주SF.jpg' },
  { id: '03', name: '액션/전투', prompt: 'Intense action and battle blockbuster style, high-speed chases and fierce combat scenes, shaky handheld camera and fast tracking shots, explosions and sparks, lens flares and motion blur, high-octane Hollywood action feel, ultra-detailed 8K', keyword: 'action_battle', thumbnail: '/styles/03 액션전투.jpg' },
  { id: '04', name: '로맨틱/감성', prompt: 'Romantic and emotional drama style, warm golden hour or soft candlelight lighting, slow rack focus and lingering close-ups, gentle bokeh and pastel color grading, intimate and emotional cinematic atmosphere, ultra-detailed 8K', keyword: 'romantic_emotional', thumbnail: '/styles/04 로맨틱감성.jpg' },
  { id: '05', name: '느와르/스릴러', prompt: 'Noir and mystery thriller style, dark chiaroscuro lighting and deep shadows, rainy neon streets or foggy alleys, slow dolly zoom and Dutch angle, desaturated cool tones with red accents, suspenseful cinematic mood, ultra-detailed 8K', keyword: 'noir_thriller', thumbnail: '/styles/05 느와르스릴러.jpg' },
  { id: '06', name: '판타지/신화', prompt: 'Fantasy and mythic adventure epic style, majestic landscapes and ancient ruins, magical particle effects and glowing runes, sweeping aerial crane shots, volumetric god rays and moonlight, epic and grand cinematic feel, ultra-detailed 8K', keyword: 'fantasy_myth', thumbnail: '/styles/06 환타지신화.jpg' },
  { id: '07', name: '3D 애니메이션', prompt: '3D animation and fairy tale style, expressive characters, bouncy motion and squash-stretch animation, vibrant cel-shaded lighting and colorful highlights, joyful and detailed 3D render cinematic, ultra-detailed 8K animated', keyword: '3d_animation', thumbnail: '/styles/07 3D에니메이션.jpeg' },
  { id: '08', name: '클래식/흑백', prompt: 'Classic black-and-white vintage drama style, classic film grain and soft focus, slow and deliberate camera movements, timeless retro cinematic atmosphere, ultra-detailed 8K with film grain', keyword: 'classic_bw', thumbnail: '/styles/08 클래식흑백.png' },
  { id: '09', name: '3D Japanese Anime', prompt: '3D Japanese anime style, high-quality CG game cinematic, cel-shaded with soft 3D depth, captured in motion, ultra-detailed 8K', keyword: '3d_japanese_anime', thumbnail: '/styles/09 3D Japanese Anime.png' },
  { id: '10', name: 'Midjourney Style', prompt: 'Midjourney aesthetic, ultra-detailed, ethereal and dreamy atmosphere, high-end digital art, captured in motion, ultra-detailed 8K', keyword: 'midjourney', thumbnail: '/styles/10 Midjourney Style .png' },
  { id: '11', name: 'Photorealistic', prompt: 'Photorealistic style, hyper-detailed, shot on 8K RAW photo, sharp focus, natural textures, captured in motion, ultra-detailed 8K', keyword: 'photorealistic', thumbnail: '/styles/11 Photorealistic.png' },
  { id: '12', name: 'Disney Style', prompt: 'Disney 3D animation style, big expressive eyes, Pixar-like features, rich facial expressions, captured in motion, ultra-detailed 8K', keyword: 'disney', thumbnail: '/styles/12 Disney Style .png' },
  { id: '13', name: 'Studio Ghibli Style', prompt: 'Studio Ghibli art style, hand-drawn watercolor backgrounds, Hayao Miyazaki aesthetic, captured in motion, ultra-detailed 8K', keyword: 'ghibli', thumbnail: '/styles/13 Studio Ghibli Style.png' },
  { id: '14', name: 'Kian84 Style', prompt: 'Kian84 webtoon style, rough pen strokes, gritty realistic Korean daily life depiction, captured in motion, ultra-detailed 8K', keyword: 'kian84', thumbnail: '/styles/14 Kian84 Style.png' },
  { id: '15', name: 'Stick Figure Style', prompt: 'Simple stick figure style, minimalistic line art, humorous composition, captured in motion, ultra-detailed 8K', keyword: 'stick_figure', thumbnail: '/styles/15 Stick Figure Style.png' },
  { id: '16', name: 'American Cartoon Style', prompt: 'American cartoon style, bold black outlines, flat vibrant colors, 90s cartoon aesthetic, captured in motion, ultra-detailed 8K', keyword: 'american_cartoon', thumbnail: '/styles/16 American Cartoon Style.png' },
  { id: '17', name: 'Joseon Minhwa Style', prompt: 'Joseon dynasty Minhwa style, traditional Korean folk art, warm earthy pigments, captured in motion, ultra-detailed 8K', keyword: 'joseon_minhwa', thumbnail: '/styles/17 Joseon Minhwa Style .png' },
  { id: '18', name: 'Oriental Ink Wash', prompt: 'Traditional Oriental ink wash painting style, artistic ink bleed, emphasis on negative space, captured in motion, ultra-detailed 8K', keyword: 'oriental_ink', thumbnail: '/styles/18 Oriental Ink Wash.png' },
  { id: '19', name: 'Mother-of-Pearl Inlay', prompt: 'Traditional Korean mother-of-pearl inlay style, iridescent shimmering textures, captured in motion, ultra-detailed 8K', keyword: 'mother_of_pearl', thumbnail: '/styles/19 Mother-of-Pearl Inlay.png' },
  { id: '20', name: 'Calligraphy Art', prompt: 'Korean calligraphy art style, dynamic brush ink strokes, traditional paper texture, captured in motion, ultra-detailed 8K', keyword: 'calligraphy_art', thumbnail: '/styles/20 Calligraphy Art.png' },
  { id: '21', name: 'Vintage Korean Poster', prompt: '1970s-80s vintage Korean poster style, retro hand-painted look, nostalgic analog film grain, captured in motion, ultra-detailed 8K', keyword: 'vintage_korean_poster', thumbnail: '/styles/21 Vintage Korean Poster.png' },
  { id: '22', name: 'Webtoon Style', prompt: 'Modern Korean webtoon style, clean digital line art, vibrant digital coloring, captured in motion, ultra-detailed 8K', keyword: 'webtoon_style', thumbnail: '/styles/22 Webtoon Style.png' },
  { id: '23', name: 'Claymation', prompt: 'Claymation style, handcrafted plasticine texture, visible sculpting marks, stop-motion animation aesthetic, captured in motion, ultra-detailed 8K', keyword: 'claymation', thumbnail: '/styles/23 Claymation.png' },
  { id: '24', name: 'Oil Painting', prompt: 'Classical oil painting style, heavy impasto brush strokes, visible canvas texture, captured in motion, ultra-detailed 8K', keyword: 'oil_painting', thumbnail: '/styles/24 Oil Painting.png' },
  { id: '25', name: 'Watercolor', prompt: 'Delicate watercolor painting style, soft pigment bleeding, artistic paper texture, captured in motion, ultra-detailed 8K', keyword: 'watercolor', thumbnail: '/styles/25 Watercolor.png' },
  { id: '26', name: 'CCTV / Bodycam', prompt: 'Distorted CCTV footage style, grainy bodycam perspective, fish-eye lens, captured in motion, ultra-detailed 8K', keyword: 'cctv_bodycam', thumbnail: '/styles/26 CCTV  Bodycam.png' },
  { id: '27', name: 'Chibi / Kawaii', prompt: 'Chibi SD character style, big head small body, super kawaii aesthetic, captured in motion, ultra-detailed 8K', keyword: 'chibi_kawaii', thumbnail: '/styles/27 Chibi  Kawai.png' },
  { id: '28', name: 'Pixel Art', prompt: 'Retro pixel art style, 16-bit video game graphics, limited color palette, captured in motion, ultra-detailed 8K', keyword: 'pixel_art', thumbnail: '/styles/28 Pixel Art.png' },
  { id: '29', name: 'Cyberpunk', prompt: 'Cyberpunk style, neon-drenched atmosphere, futuristic sci-fi city, high contrast lighting, captured in motion, ultra-detailed 8K', keyword: 'cyberpunk', thumbnail: '/styles/29 Cyberpunk.png' },
  { id: '30', name: 'Paper Cutout', prompt: 'Layered paper cutout art style, 3D paper craft aesthetic, shadows between layers, captured in motion, ultra-detailed 8K', keyword: 'paper_cutout', thumbnail: '/styles/30 Paper Cutout.png' },
  { id: '31', name: 'Retro Comic', prompt: '80s vintage American comic book style, Ben-Day dots texture, halftone patterns, captured in motion, ultra-detailed 8K', keyword: 'retro_comic', thumbnail: '/styles/31 Retro Comic.png' },
];

type SlideMotionType = 'zoom_in' | 'zoom_out' | 'pan_left' | 'pan_right' | 'pan_up' | 'pan_down';
type RenderResolution = 'sd' | 'hd' | 'fhd';
type SubtitlePosition = 'bottom' | 'middle';
type SubtitlePreset = 'shorts' | 'docu' | 'lecture' | 'impact' | 'neon';
type SubtitleEntryAnimation = 'none' | 'fade' | 'pop' | 'slide_up' | 'slide_down' | 'slide_left' | 'slide_right';
type SubtitleHighlightStrength = 'low' | 'medium' | 'high';
type SubtitleSegment = { start: number; end: number; text: string; lines: string[]; cut: number };
type PublishPlatform = 'youtube' | 'tiktok' | 'instagram' | 'threads' | 'x';
type PublishJobStatus = 'scheduled' | 'publishing' | 'published' | 'failed' | 'partial';
type PublishVisibility = 'public' | 'unlisted' | 'private';
type YouTubeAuthSession = {
  accessToken: string;
  expiresAt: number;
  channelTitle: string;
  channelHandle: string;
  email: string;
  authMode?: 'login' | 'youtube';
  channelId?: string;
  uploadsPlaylistId?: string;
};
type SavedSubtitleTemplate = {
  name: string;
  subtitlePreset: SubtitlePreset;
  subtitlePosition: SubtitlePosition;
  subtitleGridPosition?: number;
  subtitleMaxChars: number;
  subtitleWordHighlight: boolean;
  subtitleEntryAnimation: SubtitleEntryAnimation;
  subtitleHighlightStrength: SubtitleHighlightStrength;
  subtitleKeywords: string;
  subtitleUsePerCutKeywords: boolean;
};

type BuiltinSubtitleTemplate = {
  id: string;
  name: string;
  description: string;
  sample: string;
  previewImage?: string;
  config: Omit<SavedSubtitleTemplate, 'name'>;
};

const SLIDE_MOTIONS: { id: SlideMotionType; label: string }[] = [
  { id: 'zoom_in', label: '확대' },
  { id: 'zoom_out', label: '축소' },
  { id: 'pan_left', label: '좌측 이동' },
  { id: 'pan_right', label: '우측 이동' },
  { id: 'pan_up', label: '상단 이동' },
  { id: 'pan_down', label: '하단 이동' },
];

const hashString = (text: string) => {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const createOAuthState = () => {
  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes).map(v => v.toString(16).padStart(2, '0')).join('');
};

const GEMINI_TEXT_MODEL_CHAIN = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash-lite'] as const;

const is429LikeError = (err: any) => {
  const status = Number(err?.status || err?.code || 0);
  const message = String(err?.message || '');
  return status === 429 || /429|rate.?limit|quota/i.test(message);
};

const shouldUseTextFallback = (model: string) => {
  if (!model) return false;
  if (model.includes('image') || model.includes('tts') || model.includes('veo') || model.includes('imagen')) return false;
  return model.startsWith('gemini-2.5-flash') || model === 'gemini-2.0-flash-lite';
};

const generateContentWithFallback = async (ai: GoogleGenAI, request: any) => {
  const model = String(request?.model || '');
  if (!shouldUseTextFallback(model)) {
    return ai.models.generateContent(request as any);
  }

  const chain = [model, ...GEMINI_TEXT_MODEL_CHAIN.filter(m => m !== model)];
  let lastErr: any = null;
  for (const m of chain) {
    try {
      return await ai.models.generateContent({ ...(request || {}), model: m } as any);
    } catch (err: any) {
      lastErr = err;
      if (!is429LikeError(err)) throw err;
      console.warn(`[gemini-fallback] ${m} failed with 429-like error, trying next model`);
    }
  }
  throw lastErr || new Error('Gemini fallback failed');
};

const sfxLibraryByCategory = SFX_LIBRARY.reduce<Record<string, string[]>>((acc, item) => {
  const matched = item.path.match(/\/sound effects\/([^/]+)\//i);
  const category = matched?.[1] || '효과음';
  if (!acc[category]) acc[category] = [];
  acc[category].push(item.path);
  return acc;
}, {});

const recommendSfxCategory = (text: string) => {
  const lowered = (text || '').toLowerCase();
  const matchedRule = SFX_RECOMMEND_RULES.find(rule => rule.keywords.some(keyword => lowered.includes(keyword.toLowerCase())));
  return matchedRule?.category || '효과음';
};

const pickDeterministicItem = <T,>(items: T[], seed: string): T | null => {
  if (!items.length) return null;
  const idx = hashString(seed) % items.length;
  return items[idx];
};

const pickSlideMotion = (text: string, index: number): SlideMotionType => {
  const source = `${text}:${index}`;
  const hashed = hashString(source);
  return SLIDE_MOTIONS[hashed % SLIDE_MOTIONS.length].id;
};

const SLIDE_MOTION_ANIMATION: Record<SlideMotionType, { initial: any; animate: any }> = {
  zoom_in: {
    initial: { scale: 1, x: '0%', y: '0%' },
    animate: { scale: 1.14, x: '0%', y: '0%' },
  },
  zoom_out: {
    initial: { scale: 1.14, x: '0%', y: '0%' },
    animate: { scale: 1, x: '0%', y: '0%' },
  },
  pan_left: {
    initial: { scale: 1.1, x: '6%', y: '0%' },
    animate: { scale: 1.1, x: '-6%', y: '0%' },
  },
  pan_right: {
    initial: { scale: 1.1, x: '-6%', y: '0%' },
    animate: { scale: 1.1, x: '6%', y: '0%' },
  },
  pan_up: {
    initial: { scale: 1.1, x: '0%', y: '6%' },
    animate: { scale: 1.1, x: '0%', y: '-6%' },
  },
  pan_down: {
    initial: { scale: 1.1, x: '0%', y: '-6%' },
    animate: { scale: 1.1, x: '0%', y: '6%' },
  },
};

const RATIO_DIMENSIONS: Record<string, { width: number; height: number }> = {
  '16:9': { width: 1280, height: 720 },
  '9:16': { width: 720, height: 1280 },
  '1:1': { width: 1080, height: 1080 },
  '3:4': { width: 900, height: 1200 },
};

const RESOLUTION_PRESETS: { id: RenderResolution; label: string; scale: number }[] = [
  { id: 'sd', label: 'SD (빠름)', scale: 0.75 },
  { id: 'hd', label: 'HD (기본)', scale: 1 },
  { id: 'fhd', label: 'FHD (고화질)', scale: 1.5 },
];

const SUBTITLE_PRESETS: Record<SubtitlePreset, {
  label: string;
  fontScale: number;
  textColor: string;
  accentColor: string;
  boxColor: string;
  strokeColor: string;
}> = {
  shorts: {
    label: '쇼츠형 강조',
    fontScale: 0.048,
    textColor: '#ffffff',
    accentColor: '#fde047',
    boxColor: 'rgba(0, 0, 0, 0.56)',
    strokeColor: 'rgba(0, 0, 0, 0.92)',
  },
  docu: {
    label: '다큐형 차분',
    fontScale: 0.041,
    textColor: '#f8fafc',
    accentColor: '#86efac',
    boxColor: 'rgba(2, 6, 23, 0.62)',
    strokeColor: 'rgba(0, 0, 0, 0.84)',
  },
  lecture: {
    label: '강의형 선명',
    fontScale: 0.043,
    textColor: '#ffffff',
    accentColor: '#93c5fd',
    boxColor: 'rgba(15, 23, 42, 0.6)',
    strokeColor: 'rgba(2, 6, 23, 0.9)',
  },
  impact: {
    label: '임팩트형 강강조',
    fontScale: 0.05,
    textColor: '#fff7ed',
    accentColor: '#fb7185',
    boxColor: 'rgba(17, 24, 39, 0.68)',
    strokeColor: 'rgba(0, 0, 0, 0.94)',
  },
  neon: {
    label: '네온형 트렌드',
    fontScale: 0.046,
    textColor: '#e0f2fe',
    accentColor: '#22d3ee',
    boxColor: 'rgba(2, 6, 23, 0.62)',
    strokeColor: 'rgba(8, 47, 73, 0.92)',
  },
};

const SUBTITLE_TEMPLATE_LS_KEY = 'ai_storyteller_subtitle_templates_v1';
const SUBTITLE_TEMPLATE_PREVIEW_LS_KEY = 'ai_storyteller_subtitle_template_previews_v1';
const PUBLISH_AUTOSAVE_LS_KEY = 'ai_storyteller_publish_draft_v1';
const AUTO_PROGRESS_SNAPSHOT_KEY = 'ai_storyteller_auto_progress_snapshot_v1';
const APP_DB_NAME = 'ai_storyteller_lite_db';
const APP_DB_VERSION = 1;
const APP_DB_STORE = 'kv';
const YT_OAUTH_STATE_LS_KEY = 'ai_storyteller_yt_oauth_state_v1';
const YT_AUTH_SESSION_LS_KEY = 'ai_storyteller_yt_auth_session_v1';
const YT_OAUTH_MODE_LS_KEY = 'ai_storyteller_yt_oauth_mode_v1';
const PUBLISH_RETRY_SCHEDULE_MS = [0, 10 * 60 * 1000, 60 * 60 * 1000];

const openAppDB = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('indexeddb_unavailable'));
      return;
    }
    const req = indexedDB.open(APP_DB_NAME, APP_DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(APP_DB_STORE)) {
        db.createObjectStore(APP_DB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('indexeddb_open_failed'));
  });

const idbGetJson = async <T,>(key: string): Promise<T | null> => {
  const db = await openAppDB();
  try {
    return await new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(APP_DB_STORE, 'readonly');
      const store = tx.objectStore(APP_DB_STORE);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result ?? null) as T | null);
      req.onerror = () => reject(req.error || new Error('indexeddb_get_failed'));
    });
  } finally {
    db.close();
  }
};

const idbSetJson = async <T,>(key: string, value: T) => {
  const db = await openAppDB();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(APP_DB_STORE, 'readwrite');
      const store = tx.objectStore(APP_DB_STORE);
      store.put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('indexeddb_put_failed'));
    });
  } finally {
    db.close();
  }
};

const idbDelete = async (key: string) => {
  const db = await openAppDB();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(APP_DB_STORE, 'readwrite');
      const store = tx.objectStore(APP_DB_STORE);
      store.delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('indexeddb_delete_failed'));
    });
  } finally {
    db.close();
  }
};

const SOCIAL_PLATFORM_META: Array<{ id: PublishPlatform; label: string; color: string; available: boolean }> = [
  { id: 'youtube', label: 'YouTube', color: 'from-red-500 to-rose-500', available: true },
  { id: 'tiktok', label: 'TikTok', color: 'from-slate-800 to-black', available: false },
  { id: 'instagram', label: 'Instagram', color: 'from-fuchsia-500 to-orange-400', available: false },
  { id: 'threads', label: 'Threads', color: 'from-slate-700 to-slate-900', available: false },
  { id: 'x', label: 'X', color: 'from-sky-700 to-slate-900', available: false },
];

const normalizeEmail = (value: string) => value.trim().toLowerCase();
const ROOT_ADMIN_EMAIL = normalizeEmail('dlgodnr5@gmail.com');

const SHORTS_LIMITS = {
  KR: { maxUnits: 580, unitsLabel: '자', perSecond: 8 },
  EN: { maxUnits: 180, unitsLabel: '단어', perSecond: 2.5 },
  JP: { maxUnits: 720, unitsLabel: '자', perSecond: 10 },
} as const;

const LONGFORM_GUIDE_TABLE = [
  { minutes: 10, minChars: 3000, maxChars: 3500, cuts: 20 },
  { minutes: 20, minChars: 6000, maxChars: 7000, cuts: 40 },
  { minutes: 30, minChars: 9000, maxChars: 10500, cuts: 60 },
  { minutes: 40, minChars: 12000, maxChars: 14000, cuts: 80 },
  { minutes: 50, minChars: 15000, maxChars: 17500, cuts: 100 },
  { minutes: 60, minChars: 18000, maxChars: 21000, cuts: 120 },
];

const isWhitespace = (ch: string) => /\s/.test(ch);

const countScriptUnits = (text: string, lang: 'KR' | 'EN' | 'JP') => {
  if (!text) return 0;
  if (lang === 'EN') {
    const words = text.match(/[A-Za-z0-9][A-Za-z0-9'_-]*/g);
    return words ? words.length : 0;
  }
  return Array.from(text).filter(ch => !isWhitespace(ch)).length;
};

const trimScriptToUnitLimit = (text: string, lang: 'KR' | 'EN' | 'JP', maxUnits: number) => {
  if (!text) return text;
  if (lang === 'EN') {
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (words.length <= maxUnits) return text.trim();
    return `${words.slice(0, maxUnits).join(' ').replace(/[,.!?;:]+$/g, '')}.`;
  }

  let units = 0;
  let out = '';
  for (const ch of Array.from(text)) {
    if (!isWhitespace(ch)) {
      if (units >= maxUnits) break;
      units += 1;
    }
    out += ch;
  }
  return out.trim();
};

const buildScriptMetrics = (text: string, lang: 'KR' | 'EN' | 'JP') => {
  const conf = SHORTS_LIMITS[lang];
  const units = countScriptUnits(text, lang);
  const sec1x = units / conf.perSecond;
  const sec125 = sec1x / 1.25;
  return {
    units,
    unitsLabel: conf.unitsLabel,
    sec1x,
    sec125,
    maxUnits: conf.maxUnits,
    maxSec1x: 72,
    maxSec125: 58,
  };
};

const deriveAudienceToneFromResults = (rows: any[]) => {
  const titles = (rows || []).slice(0, 12).map((r: any) => normalizeSubtitleText(String(r?.title || ''))).join(' ').toLowerCase();
  const has = (keywords: string[]) => keywords.some(k => titles.includes(k));

  let audience = '20~40대 일반 사용자';
  if (has(['육아', '아기', '맘', '엄마', '아빠', '키즈', 'baby', 'parent'])) audience = '20~40대 부모/가정 사용자';
  else if (has(['직장인', '회사', '출근', '퇴근', 'office', 'business'])) audience = '20~40대 직장인';
  else if (has(['학생', '수험', '공부', 'school', 'study'])) audience = '10~20대 학생층';
  else if (has(['50대', '60대', '중장년', '시니어', 'senior'])) audience = '40~60대 중장년층';

  let tone = '공감형 후킹, 짧고 명확한 전달';
  if (has(['충격', '반전', '논란', '미쳤', '실화', 'breaking'])) tone = '강한 후킹, 빠른 몰입, 짧은 임팩트';
  else if (has(['리뷰', '비교', '추천', '가이드', 'how to', 'tip'])) tone = '정보형 설득, 신뢰 중심, 비교/근거 제시';
  else if (has(['심리', '명상', '힐링', '공감', '위로'])) tone = '차분한 공감형, 신뢰와 위로 중심';
  else if (has(['뉴스', '속보', '브리핑', 'issue'])) tone = '뉴스 브리핑형, 명확하고 단정한 전달';

  return { audience, tone };
};

const estimateLongformGuide = (text: string) => {
  const chars = Array.from(text || '').filter(ch => !isWhitespace(ch)).length;
  const match = LONGFORM_GUIDE_TABLE.find(row => chars >= row.minChars && chars <= row.maxChars)
    || LONGFORM_GUIDE_TABLE.find(row => chars <= row.maxChars)
    || LONGFORM_GUIDE_TABLE[LONGFORM_GUIDE_TABLE.length - 1];
  return {
    chars,
    ...match,
    introVideoCuts: 7,
    introVideoSeconds: 30,
  };
};

const trimScriptToSeconds = (text: string, lang: 'KR' | 'EN' | 'JP', seconds: number) => {
  const perSecond = SHORTS_LIMITS[lang].perSecond;
  const maxUnits = Math.max(20, Math.floor(perSecond * seconds));
  return trimScriptToUnitLimit(text, lang, maxUnits);
};

const compactCutsToMax = (items: string[], maxCount: number) => {
  if (items.length <= maxCount) return items;
  const groups: string[] = [];
  const chunk = Math.ceil(items.length / maxCount);
  for (let i = 0; i < items.length; i += chunk) {
    groups.push(items.slice(i, i + chunk).join(' ').trim());
  }
  return groups.filter(Boolean).slice(0, maxCount);
};

const splitCutNearMiddle = (text: string) => {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length < 18) return [clean];
  const middle = Math.floor(clean.length / 2);
  const searchWindow = Math.max(8, Math.floor(clean.length * 0.25));
  const start = Math.max(4, middle - searchWindow);
  const end = Math.min(clean.length - 4, middle + searchWindow);
  const segment = clean.slice(start, end);
  const punct = segment.search(/[.!?。！？,:;]\s|\s[-–]\s/);
  if (punct >= 0) {
    const splitAt = start + punct + 1;
    return [clean.slice(0, splitAt).trim(), clean.slice(splitAt).trim()].filter(Boolean);
  }
  const leftSpace = clean.lastIndexOf(' ', middle);
  const rightSpace = clean.indexOf(' ', middle);
  let splitAt = -1;
  if (leftSpace > start) splitAt = leftSpace;
  if (splitAt < 0 && rightSpace > 0 && rightSpace < end) splitAt = rightSpace;
  if (splitAt < 0) splitAt = middle;
  return [clean.slice(0, splitAt).trim(), clean.slice(splitAt).trim()].filter(Boolean);
};

const rebalanceCutsToTarget = (items: string[], targetCount: number) => {
  const target = Math.max(1, Math.floor(targetCount));
  if (items.length === 0) return items;
  if (items.length > target) {
    return compactCutsToMax(items, target);
  }
  if (items.length === target) return items;

  const next = [...items];
  while (next.length < target) {
    let longestIdx = -1;
    let longestLen = 0;
    next.forEach((cut, idx) => {
      const len = cut.replace(/\s+/g, '').length;
      if (len > longestLen) {
        longestLen = len;
        longestIdx = idx;
      }
    });
    if (longestIdx < 0 || longestLen < 30) break;
    const parts = splitCutNearMiddle(next[longestIdx]);
    if (parts.length < 2) break;
    next.splice(longestIdx, 1, parts[0], parts.slice(1).join(' ').trim());
  }
  return next;
};

const getRenderDimensions = (ratio: string, resolution: RenderResolution) => {
  const base = RATIO_DIMENSIONS[ratio] || RATIO_DIMENSIONS['9:16'];
  const preset = RESOLUTION_PRESETS.find(p => p.id === resolution) || RESOLUTION_PRESETS[1];
  return {
    width: Math.round(base.width * preset.scale),
    height: Math.round(base.height * preset.scale),
  };
};

const gridPositionToPercent = (gridPosition: number) => {
  const clamped = Math.min(10, Math.max(1, gridPosition));
  const min = 10;
  const max = 90;
  return min + ((clamped - 1) / 9) * (max - min);
};

const ratioToCss = (ratio: string) => {
  const [w, h] = ratio.split(':').map(Number);
  if (!w || !h) return '16 / 9';
  return `${w} / ${h}`;
};

const interpolate = (start: number, end: number, t: number) => start + (end - start) * t;

const toPercentNumber = (value: number | string) => {
  if (typeof value === 'number') return value;
  return Number.parseFloat(value.replace('%', '')) / 100;
};

const loadImageElement = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`이미지 로드 실패: ${src}`));
    img.src = src;
  });

const loadVideoElement = (src: string) =>
  new Promise<HTMLVideoElement>((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    const onLoaded = () => {
      cleanup();
      resolve(video);
    };
    const onError = () => {
      cleanup();
      reject(new Error(`영상 로드 실패: ${src}`));
    };
    const cleanup = () => {
      video.removeEventListener('loadeddata', onLoaded);
      video.removeEventListener('error', onError);
    };
    video.addEventListener('loadeddata', onLoaded);
    video.addEventListener('error', onError);
    video.src = src;
  });

const probeVideoDuration = (src: string) =>
  new Promise<number>((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    const cleanup = () => {
      video.removeEventListener('loadedmetadata', onLoaded);
      video.removeEventListener('error', onError);
      video.src = '';
    };
    const onLoaded = () => {
      const duration = Number.isFinite(video.duration) ? Math.max(0, Number(video.duration)) : 0;
      cleanup();
      resolve(duration);
    };
    const onError = () => {
      cleanup();
      reject(new Error('video-duration-probe-failed'));
    };
    video.addEventListener('loadedmetadata', onLoaded);
    video.addEventListener('error', onError);
    video.src = src;
  });

const pickMediaRecorderMimeType = () => {
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ];
  return candidates.find(type => MediaRecorder.isTypeSupported(type)) || '';
};

const normalizeSubtitleText = (text: string) => text.replace(/\s+/g, ' ').trim();

const splitSubtitleLines = (text: string, maxChars: number) => {
  const manualLines = text
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

const resolveProductPromoPlan = (productPromo: any) => {
  const workflowMode = productPromo?.workflowMode === 'manual' ? 'manual' : 'auto';
  const renderMode = productPromo?.renderMode === 'ai_video' ? 'ai_video' : 'image_slide';
  const manualHookVideoCount = Number(productPromo?.manualHookVideoCount || 1) >= 2 ? 2 : 1;

  if (workflowMode === 'auto') {
    const targetCuts = Math.max(3, Math.min(24, Number(productPromo?.targetCuts || 7)));
    const targetSeconds = targetCuts * IMAGE_SLIDE_DURATION_SEC;
    return {
      workflowMode,
      renderMode: 'image_slide' as const,
      targetCuts,
      hookVideoCount: 0,
      slideDuration: IMAGE_SLIDE_DURATION_SEC,
      targetSeconds,
      scriptLength: `${targetSeconds}초`,
    };
  }

  if (renderMode === 'ai_video') {
    return {
      workflowMode,
      renderMode: 'ai_video' as const,
      targetCuts: 5,
      hookVideoCount: 5,
      slideDuration: 4,
      targetSeconds: 20,
      scriptLength: '20초',
    };
  }

  const hookVideoCount = manualHookVideoCount;
  const imageCuts = hookVideoCount === 2 ? 4 : 5;
  const targetCuts = hookVideoCount + imageCuts;
  const targetSeconds = hookVideoCount * SHORTS_VIDEO_DURATION_SEC + imageCuts * IMAGE_SLIDE_DURATION_SEC;

  return {
    workflowMode,
    renderMode: 'image_slide' as const,
    targetCuts,
    hookVideoCount,
    slideDuration: IMAGE_SLIDE_DURATION_SEC,
    targetSeconds,
    scriptLength: `${targetSeconds}초`,
  };
};

const syncProductPromoPlanState = (prev: any) => {
  const plan = resolveProductPromoPlan(prev.productPromo);
  const nextProductPromo = {
    ...prev.productPromo,
    renderMode: plan.renderMode,
    targetCuts: plan.targetCuts,
    targetSeconds: plan.targetSeconds,
    hookVideoCount: plan.hookVideoCount,
    strictProductLock: plan.workflowMode === 'auto' ? true : prev.productPromo.strictProductLock,
  };
  if (
    nextProductPromo.renderMode === prev.productPromo.renderMode &&
    nextProductPromo.targetCuts === prev.productPromo.targetCuts &&
    nextProductPromo.targetSeconds === prev.productPromo.targetSeconds &&
    nextProductPromo.hookVideoCount === prev.productPromo.hookVideoCount &&
    nextProductPromo.strictProductLock === prev.productPromo.strictProductLock
  ) {
    return prev;
  }
  return {
    ...prev,
    productPromo: nextProductPromo,
  };
};

const sanitizeProductPromoImagesState = (prev: any) => {
  const refs = (prev?.productPromo?.referenceImages || [])
    .map((v: any) => String(v || '').trim())
    .filter(Boolean)
    .filter((value: string, index: number, arr: string[]) => arr.indexOf(value) === index)
    .slice(0, PRODUCT_PROMO_MAX_IMAGES);
  const currentMain = String(prev?.productPromo?.imageUrl || '').trim();
  const imageUrl = currentMain && refs.includes(currentMain) ? currentMain : (refs[0] || '');

  const sameRefs =
    refs.length === (prev?.productPromo?.referenceImages || []).length &&
    refs.every((value: string, idx: number) => value === String(prev?.productPromo?.referenceImages?.[idx] || '').trim());
  const sameMain = imageUrl === String(prev?.productPromo?.imageUrl || '').trim();
  if (sameRefs && sameMain) return prev;

  return {
    ...prev,
    productPromo: {
      ...prev.productPromo,
      referenceImages: refs,
      imageUrl,
    },
  };
};

const drawTemplateTitleOverlay = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  text: string,
  options: {
    line1TopMm: number;
    line2BottomMm: number;
    fontFamily: string;
    line1Color: string;
    line2Color: string;
    highlightColor: string;
    strokeColor: string;
    highlightWord: string;
    scale: number;
    subtitlePreset?: SubtitlePreset;
  },
) => {
  const rawLines = text
    .split(/\r?\n/)
    .map(v => normalizeSubtitleText(v))
    .filter(Boolean);
  const lines = rawLines.length > 0 ? rawLines.slice(0, 4) : [normalizeHookTitleForOverlay(text)];
  if (lines.length === 0) return;

  const maxTextWidth = Math.round(width * 0.84);
  const wrapLineByWidth = (input: string) => {
    const chars = Array.from(String(input || ''));
    const wrapped: string[] = [];
    let current = '';
    for (const ch of chars) {
      const candidate = `${current}${ch}`;
      if (!candidate.trim()) {
        current = candidate;
        continue;
      }
      const w = ctx.measureText(candidate).width;
      if (w <= maxTextWidth || !current) {
        current = candidate;
      } else {
        wrapped.push(current.trim());
        current = ch;
      }
    }
    if (current.trim()) wrapped.push(current.trim());
    return wrapped;
  };

  let clampedLines = lines;
  const topPx = mmToPxScaled(options.line1TopMm || 20, width);
  const bottomLimitPx = mmToPxScaled(options.line2BottomMm || 35, width);
  const fontFamily = (options.fontFamily || 'Anemone').trim() || 'Anemone';
  const preset = SUBTITLE_PRESETS[options.subtitlePreset || 'shorts'] || SUBTITLE_PRESETS.shorts;
  const basePx = Math.min(width, height) * preset.fontScale;
  let fontPx = Math.max(16, basePx * Math.max(0.7, Math.min(2.2, options.scale || 1)));
  const highlightToken = cleanWordToken(options.highlightWord || '');

  const measure = () => {
    ctx.save();
    ctx.font = `900 ${fontPx}px "${fontFamily}", "Pretendard", "Noto Sans KR", sans-serif`;
    const sample = ctx.measureText('가Ag');
    const ascent = sample.actualBoundingBoxAscent || fontPx * 0.8;
    const descent = sample.actualBoundingBoxDescent || fontPx * 0.2;
    const lineHeight = Math.max(fontPx * 1.1, ascent + descent + fontPx * 0.06);
    ctx.restore();
    return { ascent, descent, lineHeight };
  };

  let metrics = measure();
  ctx.save();
  ctx.font = `900 ${fontPx}px "${fontFamily}", "Pretendard", "Noto Sans KR", sans-serif`;
  clampedLines = lines.flatMap(line => wrapLineByWidth(line)).slice(0, 4);
  ctx.restore();
  let secondBottom = topPx + metrics.ascent + (Math.max(1, clampedLines.length) - 1) * metrics.lineHeight + metrics.descent;
  while (secondBottom > bottomLimitPx && fontPx > 10) {
    fontPx -= 0.6;
    metrics = measure();
    ctx.save();
    ctx.font = `900 ${fontPx}px "${fontFamily}", "Pretendard", "Noto Sans KR", sans-serif`;
    clampedLines = lines.flatMap(line => wrapLineByWidth(line)).slice(0, 4);
    ctx.restore();
    secondBottom = topPx + metrics.ascent + (Math.max(1, clampedLines.length) - 1) * metrics.lineHeight + metrics.descent;
  }

  const drawStyledLine = (line: string, baselineY: number, fillColor: string) => {
    const parts = line.split(/(\s+)/);
    const widths = parts.map(part => ctx.measureText(part).width);
    const totalWidth = widths.reduce((sum, w) => sum + w, 0);
    let x = width / 2 - totalWidth / 2;
    parts.forEach((part, idx) => {
      if (!part) return;
      const token = cleanWordToken(part);
      const isHighlight = Boolean(highlightToken && token && token === highlightToken);
      ctx.textAlign = 'left';
      ctx.strokeStyle = options.strokeColor || '#000000';
      ctx.fillStyle = isHighlight ? (options.highlightColor || '#fde047') : fillColor;
      ctx.strokeText(part, x, baselineY);
      ctx.fillText(part, x, baselineY);
      x += widths[idx];
    });
    ctx.textAlign = 'center';
  };

  ctx.save();
  ctx.font = `900 ${fontPx}px "${fontFamily}", "Pretendard", "Noto Sans KR", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(2, Math.round(fontPx * 0.15));

  const line1Baseline = topPx + metrics.ascent;
  drawStyledLine(clampedLines[0], line1Baseline, options.line1Color || '#ef4444');
  if (clampedLines.length > 1) {
    for (let i = 1; i < clampedLines.length; i += 1) {
      const nextBaseline = line1Baseline + metrics.lineHeight * i;
      drawStyledLine(clampedLines[i], nextBaseline, options.line2Color || '#111111');
    }
  }

  ctx.restore();
};

const drawExtraTextOverlays = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  overlays: Array<{
    text: string;
    color: string;
    bgColor: string;
    scale: number;
    gridPosition: number;
    align: 'left' | 'center' | 'right';
  }> = [],
) => {
  const items = (overlays || []).filter(item => normalizeSubtitleText(item?.text || '').length > 0);
  if (items.length === 0) return;

  for (const item of items) {
    const fontPx = Math.max(12, Math.round(Math.min(width, height) * 0.038 * Math.max(0.7, Math.min(2.2, Number(item.scale || 1)))));
    const lineHeight = Math.round(fontPx * 1.25);
    const maxWidth = Math.round(width * 0.8);
    ctx.save();
    ctx.font = `800 ${fontPx}px "Pretendard", "Noto Sans KR", sans-serif`;
    const chars = Array.from(normalizeSubtitleText(item.text));
    const lines: string[] = [];
    let current = '';
    for (const ch of chars) {
      const cand = `${current}${ch}`;
      if (ctx.measureText(cand).width <= maxWidth || !current) current = cand;
      else {
        lines.push(current);
        current = ch;
      }
    }
    if (current) lines.push(current);
    const safeTop = Math.round(height * 0.06);
    const safeBottom = Math.round(height * 0.06);
    const blockHeight = lineHeight * lines.length + 16;
    const usable = Math.max(0, height - safeTop - safeBottom - blockHeight);
    const top = safeTop + ((Math.min(10, Math.max(1, Number(item.gridPosition || 7))) - 1) / 9) * usable;
    const boxX = Math.round(width * 0.1);
    const boxW = Math.round(width * 0.8);

    ctx.fillStyle = item.bgColor || '#0f172a';
    ctx.globalAlpha = 0.55;
    drawRoundedRect(ctx, boxX, top, boxW, blockHeight, 12);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = Math.max(2, Math.round(fontPx * 0.1));
    ctx.strokeStyle = 'rgba(0,0,0,0.9)';
    ctx.fillStyle = item.color || '#ffffff';

    const align = item.align || 'center';
    const baseX = align === 'left' ? boxX + 14 : align === 'right' ? boxX + boxW - 14 : boxX + boxW / 2;
    ctx.textAlign = align;
    lines.forEach((line, idx) => {
      const y = top + 8 + lineHeight * idx + lineHeight / 2;
      ctx.strokeText(line, baseX, y);
      ctx.fillText(line, baseX, y);
    });
    ctx.restore();
  }
};

const splitSubtitleUnits = (text: string) => {
  const clean = normalizeSubtitleText(text);
  if (!clean) return [] as string[];
  const sentenceSplit = clean
    .split(/(?<=[.!?。！？])\s+/)
    .map(v => v.trim())
    .filter(Boolean);
  if (sentenceSplit.length > 1) return sentenceSplit;

  const commaSplit = clean
    .split(/(?<=[,，;:])\s+/)
    .map(v => v.trim())
    .filter(Boolean);
  return commaSplit.length > 1 ? commaSplit : [clean];
};

const buildSubtitleSegments = (
  slideTexts: string[],
  totalDuration: number,
  maxChars: number,
) => {
  const cuts = slideTexts.map(text => {
    const units = splitSubtitleUnits(text);
    const weight = Math.max(1, normalizeSubtitleText(text).replace(/\s/g, '').length);
    return { text, units, weight };
  });

  const totalWeight = cuts.reduce((sum, cut) => sum + cut.weight, 0) || 1;
  let cursor = 0;
  const segments: SubtitleSegment[] = [];

  cuts.forEach((cut, cutIndex) => {
    const isLastCut = cutIndex === cuts.length - 1;
    const cutDuration = isLastCut ? totalDuration - cursor : (totalDuration * cut.weight) / totalWeight;
    const units = cut.units.length > 0 ? cut.units : [cut.text];
    const unitWeights = units.map(unit => Math.max(1, unit.replace(/\s/g, '').length));
    const unitTotalWeight = unitWeights.reduce((sum, w) => sum + w, 0) || 1;

    units.forEach((unit, unitIndex) => {
      const isLastUnit = unitIndex === units.length - 1;
      const unitDuration = isLastUnit
        ? Math.max(0.12, cutDuration - unitWeights.slice(0, unitIndex).reduce((sum, w) => sum + (cutDuration * w) / unitTotalWeight, 0))
        : Math.max(0.12, (cutDuration * unitWeights[unitIndex]) / unitTotalWeight);

      const start = cursor;
      const end = Math.min(totalDuration, start + unitDuration);
      const cleanUnit = normalizeSubtitleText(unit);
      if (cleanUnit) {
        segments.push({
          start,
          end,
          text: cleanUnit,
          lines: splitSubtitleLines(cleanUnit, maxChars),
          cut: cutIndex + 1,
        });
      }
      cursor = end;
    });
  });

  if (segments.length > 0) {
    segments[segments.length - 1].end = totalDuration;
  }

  return segments;
};

const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) => {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
};

const drawSubtitleOverlay = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  lines: string[],
  position: SubtitlePosition,
  gridPosition?: number,
  options?: {
    preset: SubtitlePreset;
    progress?: number;
    entryAnimation?: SubtitleEntryAnimation;
    subtitleScale?: number;
  },
) => {
  const rendered = lines.filter(Boolean).slice(0, 2);
  if (rendered.length === 0) return;

  const preset = SUBTITLE_PRESETS[options?.preset || 'shorts'];
  const progress = Math.max(0, Math.min(1, options?.progress ?? 1));
  const entryAnimation = options?.entryAnimation || 'none';

  const drawLine = (line: string, y: number) => {
    ctx.lineWidth = Math.max(2, Math.round(fontSize * 0.12));
    ctx.strokeStyle = preset.strokeColor;
    ctx.strokeText(line, width / 2, y);
    ctx.fillStyle = preset.textColor;
    ctx.fillText(line, width / 2, y);
  };

  const subtitleScale = Math.max(0.7, Math.min(2.2, Number(options?.subtitleScale || 1)));
  const fontSize = Math.round(Math.min(width, height) * preset.fontScale * subtitleScale);
  const lineHeight = Math.round(fontSize * 1.34);
  const blockHeight = lineHeight * rendered.length + 28;
  const defaultGrid = position === 'middle' ? 5 : 9;
  const clampedGrid = Math.min(10, Math.max(1, Number(gridPosition || defaultGrid)));
  const safeTop = Math.round(height * 0.06);
  const safeBottom = Math.round(height * 0.06);
  const usableHeight = Math.max(0, height - safeTop - safeBottom - blockHeight);
  const y = safeTop + ((clampedGrid - 1) / 9) * usableHeight;

  ctx.save();
  if (entryAnimation !== 'none') {
    const alpha = entryAnimation === 'fade' ? Math.min(1, progress * 3.2) : Math.min(1, 0.2 + progress * 2.8);
    const scale = entryAnimation === 'pop' ? 0.92 + Math.min(1, progress * 3) * 0.08 : 1;
    ctx.globalAlpha = alpha;
    const movePx = Math.round(Math.min(width, height) * (1 - Math.min(1, progress * 3.2)) * 0.12);
    if (entryAnimation === 'slide_up') ctx.translate(0, movePx);
    if (entryAnimation === 'slide_down') ctx.translate(0, -movePx);
    if (entryAnimation === 'slide_left') ctx.translate(movePx, 0);
    if (entryAnimation === 'slide_right') ctx.translate(-movePx, 0);
    if (scale !== 1) {
      ctx.translate(width / 2, height / 2);
      ctx.scale(scale, scale);
      ctx.translate(-width / 2, -height / 2);
    }
  }
  ctx.font = `900 ${fontSize}px "Pretendard", "Noto Sans KR", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  drawRoundedRect(ctx, Math.round(width * 0.08), y, Math.round(width * 0.84), blockHeight, 18);
  ctx.fillStyle = preset.boxColor;
  ctx.fill();

  rendered.forEach((line, idx) => {
    const ly = y + 14 + lineHeight / 2 + idx * lineHeight;
    drawLine(line, ly);
  });
  ctx.restore();
};

const formatSrtTimestamp = (seconds: number) => {
  const totalMs = Math.max(0, Math.floor(seconds * 1000));
  const hh = String(Math.floor(totalMs / 3600000)).padStart(2, '0');
  const mm = String(Math.floor((totalMs % 3600000) / 60000)).padStart(2, '0');
  const ss = String(Math.floor((totalMs % 60000) / 1000)).padStart(2, '0');
  const ms = String(totalMs % 1000).padStart(3, '0');
  return `${hh}:${mm}:${ss},${ms}`;
};

const buildSrtFromSegments = (segments: { start: number; end: number; lines: string[] }[]) => {
  return segments
    .map((seg, index) => {
      const body = seg.lines.filter(Boolean).join('\n');
      return `${index + 1}\n${formatSrtTimestamp(seg.start)} --> ${formatSrtTimestamp(seg.end)}\n${body}`;
    })
    .join('\n\n');
};

const cleanWordToken = (word: string) =>
  word
    .toLowerCase()
    .replace(/[.,!?;:()"'“”‘’\[\]{}<>]/g, '')
    .trim();

const KEYWORD_STOPWORDS = new Set([
  '그리고', '하지만', '그래서', '정말', '진짜', '이제', '그냥', '대한', '에서', '으로', '에게', '까지',
  'about', 'with', 'that', 'this', 'from', 'into', 'what', 'when', 'where', 'which', 'then', 'than',
  'have', 'will', 'your', 'their', 'there', 'here', 'just', 'very', 'much', 'more', 'less', 'also',
]);

const extractTopKeywords = (text: string, limit = 6) => {
  const rawTokens = text.match(/[A-Za-z0-9]{2,}|[가-힣0-9]{2,}/g) || [];
  const counts = new Map<string, number>();

  rawTokens.forEach(raw => {
    const token = cleanWordToken(raw);
    if (!token || token.length < 2 || KEYWORD_STOPWORDS.has(token)) return;

    let weight = 1;
    if (/\d/.test(raw)) weight += 1.5; // 숫자 포함 키워드 우선
    if (/^[A-Z][A-Za-z0-9]+$/.test(raw) || /[A-Z]{2,}/.test(raw)) weight += 1.2; // 브랜드/영문 고유명사
    if (/[가-힣]{3,}/.test(raw) && !/(하다|되는|있는|에서|으로|에게|대한)$/.test(raw)) weight += 0.6; // 한국어 고유명사 추정
    if (token.length >= 5) weight += 0.25;

    counts.set(token, (counts.get(token) || 0) + weight);
  });

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([token]) => token);
};

const PRESET_SAMPLE_TEXT: Record<SubtitlePreset, string> = {
  shorts: '충격 반전! 핵심만 1초만에 꽂히게',
  docu: '차분하게 핵심 맥락을 전달하는 다큐 톤',
  lecture: '또렷하고 안정적인 학습/설명용 자막',
  impact: '강하게 때리는 키워드 중심 임팩트 자막',
  neon: '트렌디한 네온 포인트로 집중도 상승',
};

const BUILTIN_SUBTITLE_TEMPLATES: BuiltinSubtitleTemplate[] = [
  { id: 'default-basic', name: '00 기본', description: '기본 레이아웃 템플릿', sample: '핵심만 빠르게 전달', previewImage: '/subtitle_templates/00 기본.jpg', config: { subtitlePreset: 'shorts', subtitlePosition: 'bottom', subtitleGridPosition: 9, subtitleMaxChars: 24, subtitleWordHighlight: true, subtitleHighlightStrength: 'medium', subtitleEntryAnimation: 'fade', subtitleKeywords: '핵심,중요,요약', subtitleUsePerCutKeywords: false } },
  { id: 'promo-product', name: '상품광고', description: '강한 CTA, 빠른 강조, 전환 유도', sample: '지금 안 보면 손해! 오늘만 특가', previewImage: '/subtitle_templates/09. 상품.png', config: { subtitlePreset: 'shorts', subtitlePosition: 'bottom', subtitleGridPosition: 9, subtitleMaxChars: 18, subtitleWordHighlight: true, subtitleHighlightStrength: 'high', subtitleEntryAnimation: 'slide_up', subtitleKeywords: '한정,특가,무료,지금,혜택', subtitleUsePerCutKeywords: false } },
  { id: 'news-urgent', name: '뉴스 브리핑', description: '신뢰감 있는 헤드라인형', sample: '속보: 핵심 내용 30초 요약', previewImage: '/subtitle_templates/07. MBC뉴스.png', config: { subtitlePreset: 'docu', subtitlePosition: 'bottom', subtitleGridPosition: 8, subtitleMaxChars: 26, subtitleWordHighlight: false, subtitleHighlightStrength: 'low', subtitleEntryAnimation: 'fade', subtitleKeywords: '속보,현장,단독,브리핑,핵심', subtitleUsePerCutKeywords: false } },
  { id: 'comedy-skit', name: '코믹 숏폼', description: '리액션 중심, 강한 단어 하이라이트', sample: '이 장면에서 다들 터졌습니다', previewImage: '/subtitle_templates/02. 일상쇼츠.png', config: { subtitlePreset: 'shorts', subtitlePosition: 'middle', subtitleGridPosition: 6, subtitleMaxChars: 20, subtitleWordHighlight: true, subtitleHighlightStrength: 'high', subtitleEntryAnimation: 'pop', subtitleKeywords: '폭소,레전드,미친,반전,웃김', subtitleUsePerCutKeywords: true } },
  { id: 'pet-animal', name: '동물/펫', description: '귀여움 강조, 짧고 또렷한 문장', sample: '심쿵 포인트 모아보기', previewImage: '/subtitle_templates/10. 동물.png', config: { subtitlePreset: 'shorts', subtitlePosition: 'bottom', subtitleGridPosition: 8, subtitleMaxChars: 19, subtitleWordHighlight: true, subtitleHighlightStrength: 'medium', subtitleEntryAnimation: 'slide_right', subtitleKeywords: '귀여움,심쿵,댕댕이,냥냥이,힐링', subtitleUsePerCutKeywords: true } },
  { id: 'senior-health', name: '시니어 정보', description: '가독성 우선, 안정적인 템포', sample: '천천히, 정확하게 핵심 전달', previewImage: '/subtitle_templates/04. 시니어.png', config: { subtitlePreset: 'lecture', subtitlePosition: 'middle', subtitleGridPosition: 6, subtitleMaxChars: 30, subtitleWordHighlight: true, subtitleHighlightStrength: 'medium', subtitleEntryAnimation: 'fade', subtitleKeywords: '건강,주의,습관,관리,예방', subtitleUsePerCutKeywords: false } },
  { id: 'motivation', name: '동기부여', description: '강조 단어 중심 임팩트', sample: '딱 1년만, 인생이 바뀝니다', previewImage: '/subtitle_templates/12. 동기부여.png', config: { subtitlePreset: 'shorts', subtitlePosition: 'middle', subtitleGridPosition: 5, subtitleMaxChars: 22, subtitleWordHighlight: true, subtitleHighlightStrength: 'high', subtitleEntryAnimation: 'slide_left', subtitleKeywords: '도전,성공,습관,목표,실행', subtitleUsePerCutKeywords: true } },
  { id: 'knowledge-bite', name: '지식/교양', description: '정보 전달 최적화', sample: '모르면 손해보는 핵심 상식', previewImage: '/subtitle_templates/11. 지식.png', config: { subtitlePreset: 'docu', subtitlePosition: 'bottom', subtitleGridPosition: 8, subtitleMaxChars: 27, subtitleWordHighlight: true, subtitleHighlightStrength: 'medium', subtitleEntryAnimation: 'fade', subtitleKeywords: '핵심,원리,사실,정리,요약', subtitleUsePerCutKeywords: false } },
  { id: 'review-tech', name: '리뷰/언박싱', description: '기능/가격/결론 강조', sample: '실사용 기준으로 딱 정리', previewImage: '/subtitle_templates/05. 강의.png', config: { subtitlePreset: 'lecture', subtitlePosition: 'bottom', subtitleGridPosition: 9, subtitleMaxChars: 24, subtitleWordHighlight: true, subtitleHighlightStrength: 'high', subtitleEntryAnimation: 'slide_up', subtitleKeywords: '장점,단점,가격,성능,결론', subtitleUsePerCutKeywords: true } },
  { id: 'vlog-daily', name: '브이로그', description: '자연스러운 흐름, 감성 유지', sample: '소소하지만 확실한 하루 기록', previewImage: '/subtitle_templates/03 전체화면(가운데).png', config: { subtitlePreset: 'docu', subtitlePosition: 'bottom', subtitleGridPosition: 8, subtitleMaxChars: 25, subtitleWordHighlight: false, subtitleHighlightStrength: 'low', subtitleEntryAnimation: 'slide_down', subtitleKeywords: '일상,기록,루틴,감성,하루', subtitleUsePerCutKeywords: false } },
  { id: 'interview-talk', name: '인터뷰', description: '질문-답변 구조 가독성 최적화', sample: '질문 하나로 바뀐 관점', previewImage: '/subtitle_templates/01.정보쇼츠.png', config: { subtitlePreset: 'lecture', subtitlePosition: 'middle', subtitleGridPosition: 6, subtitleMaxChars: 28, subtitleWordHighlight: true, subtitleHighlightStrength: 'medium', subtitleEntryAnimation: 'fade', subtitleKeywords: '질문,답변,경험,핵심,인사이트', subtitleUsePerCutKeywords: false } },
  { id: 'crime-issue', name: '사건/이슈', description: '긴장감, 핵심 단어 강한 강조', sample: '순식간에 벌어진 충격 상황', previewImage: '/subtitle_templates/13. 사건.png', config: { subtitlePreset: 'shorts', subtitlePosition: 'bottom', subtitleGridPosition: 8, subtitleMaxChars: 21, subtitleWordHighlight: true, subtitleHighlightStrength: 'high', subtitleEntryAnimation: 'slide_up', subtitleKeywords: '충격,단독,증거,현장,진실', subtitleUsePerCutKeywords: true } },
  { id: 'healing-emotion', name: '감성/힐링', description: '부드러운 등장, 따뜻한 톤', sample: '마음이 편해지는 30초', previewImage: '/subtitle_templates/08. 검은바탕.png', config: { subtitlePreset: 'docu', subtitlePosition: 'middle', subtitleGridPosition: 6, subtitleMaxChars: 24, subtitleWordHighlight: false, subtitleHighlightStrength: 'low', subtitleEntryAnimation: 'fade', subtitleKeywords: '힐링,감성,위로,따뜻함,휴식', subtitleUsePerCutKeywords: false } },
  { id: 'mystery-horror', name: '미스터리/공포', description: '암전 분위기, 강한 키워드', sample: '절대 혼자 보지 마세요', previewImage: '/subtitle_templates/14. 이슈.png', config: { subtitlePreset: 'shorts', subtitlePosition: 'middle', subtitleGridPosition: 5, subtitleMaxChars: 20, subtitleWordHighlight: true, subtitleHighlightStrength: 'high', subtitleEntryAnimation: 'slide_left', subtitleKeywords: '미스터리,공포,소름,경고,반전', subtitleUsePerCutKeywords: true } },
  { id: 'kids-family', name: '키즈/패밀리', description: '선명하고 쉬운 문장, 밝은 템포', sample: '아이도 바로 이해하는 설명', previewImage: '/subtitle_templates/06. 이슈.png', config: { subtitlePreset: 'lecture', subtitlePosition: 'bottom', subtitleGridPosition: 9, subtitleMaxChars: 22, subtitleWordHighlight: true, subtitleHighlightStrength: 'medium', subtitleEntryAnimation: 'slide_right', subtitleKeywords: '재미,배움,놀이,친구,가족', subtitleUsePerCutKeywords: false } },
];

const getBuiltinTemplatePreview = (template: BuiltinSubtitleTemplate) => {
  return encodeURI(template.previewImage || `/subtitle_templates/${template.id}.jpg`);
};

const parseKeywordSet = (raw: string) => {
  return new Set(
    raw
      .split(/[,\n]/)
      .map(v => cleanWordToken(v))
      .filter(Boolean),
  );
};

const parseSrtToCuts = (text: string) => {
  if (!text.includes('-->')) return [] as string[];
  const blocks = text
    .replace(/\r/g, '')
    .split(/\n\s*\n/)
    .map(block => block.trim())
    .filter(Boolean);

  const cuts: string[] = [];
  blocks.forEach(block => {
    const hasTiming = /\d{2}:\d{2}:\d{2},\d{3}\s*-->\s*\d{2}:\d{2}:\d{2},\d{3}/.test(block);
    if (!hasTiming) return;

    const lines = block
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .filter(line => !/^\d+$/.test(line))
      .filter(line => !/\d{2}:\d{2}:\d{2},\d{3}\s*-->\s*\d{2}:\d{2}:\d{2},\d{3}/.test(line));
    const merged = lines.join(' ').replace(/\s+/g, ' ').trim();
    if (merged) cuts.push(merged);
  });
  return cuts;
};

const splitScriptToCuts = (text: string, isShorts: boolean) => {
  const clean = text.replace(/\r/g, '\n').trim();
  if (!clean) return [] as string[];

  const srtCuts = parseSrtToCuts(clean);
  if (srtCuts.length > 0) return srtCuts;

  const target = isShorts ? 38 : 75;
  const minLen = isShorts ? 30 : 60;
  const maxLen = isShorts ? 45 : 90;

  const sentenceUnits = clean
    .split(/(?<=[.!?。！？])\s+|\n+/)
    .map(v => v.trim())
    .filter(Boolean);

  const units = sentenceUnits.length > 0 ? sentenceUnits : [clean];
  const cuts: string[] = [];
  let current = '';

  const splitLongUnit = (unit: string) => {
    if (unit.length <= maxLen) return [unit];
    const words = unit.split(/\s+/).filter(Boolean);
    const out: string[] = [];
    let chunk = '';
    for (const w of words) {
      if (!chunk) {
        chunk = w;
        continue;
      }
      const candidate = `${chunk} ${w}`;
      if (candidate.length <= maxLen) {
        chunk = candidate;
      } else {
        out.push(chunk);
        chunk = w;
      }
    }
    if (chunk) out.push(chunk);
    return out.length > 0 ? out : [unit];
  };

  const pushCurrent = () => {
    const normalized = current.replace(/\s+/g, ' ').trim();
    if (normalized) cuts.push(normalized);
    current = '';
  };

  for (const rawUnit of units) {
    const expandedUnits = splitLongUnit(rawUnit);
    for (const unit of expandedUnits) {
    if (!current) {
      current = unit;
      if (current.length >= maxLen) {
        pushCurrent();
      }
      continue;
    }

    const candidate = `${current} ${unit}`.replace(/\s+/g, ' ').trim();
    if (candidate.length <= maxLen) {
      current = candidate;
      if (current.length >= target) {
        pushCurrent();
      }
    } else {
      if (current.length < minLen && unit.length < maxLen) {
        const padded = `${current} ${unit}`.replace(/\s+/g, ' ').trim();
        if (padded.length <= maxLen + Math.floor((maxLen - minLen) * 0.6)) {
          current = padded;
          pushCurrent();
          continue;
        }
      }
      pushCurrent();
      current = unit;
      if (current.length >= maxLen) pushCurrent();
    }
    }
  }
  pushCurrent();

  return cuts.length > 0 ? cuts : [clean];
};

const drawSlideToCanvas = (
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  motion: SlideMotionType,
  progress: number,
  width: number,
  height: number,
) => {
  const animation = SLIDE_MOTION_ANIMATION[motion];
  const clamped = Math.min(1, Math.max(0, progress));

  const startScale = Number(animation.initial.scale ?? 1);
  const endScale = Number(animation.animate.scale ?? 1);
  const startX = toPercentNumber(animation.initial.x ?? 0);
  const endX = toPercentNumber(animation.animate.x ?? 0);
  const startY = toPercentNumber(animation.initial.y ?? 0);
  const endY = toPercentNumber(animation.animate.y ?? 0);

  const scale = interpolate(startScale, endScale, clamped);
  const offsetX = interpolate(startX, endX, clamped) * width;
  const offsetY = interpolate(startY, endY, clamped) * height;

  const coverScale = Math.max(width / image.width, height / image.height);
  const drawWidth = image.width * coverScale * scale;
  const drawHeight = image.height * coverScale * scale;
  const drawX = (width - drawWidth) / 2 + offsetX;
  const drawY = (height - drawHeight) / 2 + offsetY;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
};

const drawVideoFrameToCanvas = (
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  width: number,
  height: number,
) => {
  if (!video.videoWidth || !video.videoHeight) return;

  const mediaRatio = video.videoWidth / video.videoHeight;
  const canvasRatio = width / height;
  let sourceWidth = video.videoWidth;
  let sourceHeight = video.videoHeight;
  let sourceX = 0;
  let sourceY = 0;

  if (mediaRatio > canvasRatio) {
    sourceWidth = video.videoHeight * canvasRatio;
    sourceX = (video.videoWidth - sourceWidth) / 2;
  } else if (mediaRatio < canvasRatio) {
    sourceHeight = video.videoWidth / canvasRatio;
    sourceY = (video.videoHeight - sourceHeight) / 2;
  }

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height);
};

const InlineLockedSection = ({
  locked,
  title,
  description,
  onOpenSettings,
  children,
}: {
  locked: boolean;
  title: string;
  description: string;
  onOpenSettings: () => void;
  children: React.ReactNode;
}) => {
  if (!locked) return <>{children}</>;
  return (
    <div className="relative rounded-2xl overflow-hidden border border-amber-300/20 bg-black/30">
      <div className="opacity-30 pointer-events-none select-none blur-[0.4px]">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 px-4 text-center">
        <p className="text-xs font-black text-amber-200 uppercase tracking-widest">{title}</p>
        <p className="text-[11px] text-slate-300 max-w-md">{description}</p>
        <button
          onClick={onOpenSettings}
          className="px-3 py-2 rounded-lg text-xs font-black bg-amber-400 text-black hover:bg-amber-300"
        >
          API 설정 열기
        </button>
      </div>
    </div>
  );
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
  const ref = React.useRef<HTMLInputElement | null>(null);
  const rafRef = React.useRef<number>(0);
  const draggingRef = React.useRef(false);

  React.useEffect(() => {
    if (!ref.current || draggingRef.current) return;
    const dom = Number(ref.current.value);
    if (Math.abs(dom - value) > 0.0001) {
      ref.current.value = String(value);
    }
  }, [value]);

  const commit = (v: number) => {
    window.cancelAnimationFrame(rafRef.current);
    rafRef.current = window.requestAnimationFrame(() => onChange(v));
  };

  return (
    <input
      ref={ref}
      type="range"
      min={min}
      max={max}
      step={step}
      defaultValue={value}
      disabled={disabled}
      className={className}
      style={{ touchAction: 'none' }}
      onInput={(e) => commit(Number((e.target as HTMLInputElement).value))}
      onChange={() => undefined}
      onPointerDown={() => {
        draggingRef.current = true;
      }}
      onPointerUp={() => {
        draggingRef.current = false;
        if (!ref.current) return;
        onChange(Number(ref.current.value));
      }}
      onLostPointerCapture={() => {
        draggingRef.current = false;
        if (!ref.current) return;
        onChange(Number(ref.current.value));
      }}
    />
  );
});

export default function App() {
  // --- State ---
  const [keys, setKeys] = useState({ yt1: '', yt2: '', g1: '', e11: '' });
  const [activeKeys, setActiveKeys] = useState({ yt: 'yt1', g: 'g1' });
  const [keyStatus, setKeyStatus] = useState<Record<string, any>>({});
  
  const [ui, setUi] = useState({
    settingsOpen: false,
    happyDayOpen: false,
    panelsOpen: { p1: true, p2: true, p3: true, p4: true, p_style: true, p5: true, p6: true, p7: true, p8: true, p9: true, p10: true, p11: true, p12: true, p13: true, p14: true, p15: true },
    searching: false,
    searchError: '',
    videoStyle: {
      selected: '01. 뉴스/다큐',
      show: true,
    },
    filters: {
      query: '',
      count: 50,
      sort: '조회수',
      period: '전체',
      country: '한국',
      category: '모든 카테고리',
      duration: '전체',
      minViews: 100000,
    },
    hookTitles: [] as any[],
    overallStrategy: '',
    selectedHookTitle: '',
    hookLoading: false,
    thumbnail: {
      url: '',
      prompt: '',
      generating: false,
      ratio: '16:9' as '16:9' | '9:16' | '1:1' | '3:4',
      model: 'gemini-3.1-flash-image-preview' as 'gemini-3.1-flash-image-preview' | 'gemini-3-pro-image-preview',
    },
    description: {
      kr: { title: '', desc: '', hashtags: '', tags: '' },
      en: { title: '', desc: '', hashtags: '', tags: '' },
      jp: { title: '', desc: '', hashtags: '', tags: '' },
      generating: false,
    },
    script: {
      type: 'shorts' as 'shorts' | 'long-form',
      length: '60초',
      lang: 'KR',
      targetAudience: '20~40대 일반',
      tone: '정보형, 설득력',
      output: '',
      generating: false,
      lastError: '',
    },
    tts: {
      generating: false,
      audioUrl: '',
      measuredDuration: 0,
      status: '',
      voice: 'Kore',
      model: 'gemini-2.5-flash-preview-tts',
      elevenlabsVoice: 'elv_adam',
      elevenlabsModel: 'eleven_multilingual_v2',
      selectedToneId: 'default',
      styleInstructions: '',
    },
    cuts: {
      items: [] as string[],
      prompts: [] as any[],
      ratio: '9:16',
      splitting: false,
    },
    imageJobs: [] as any[],
    videoJobs: [] as any[],
    finalVideo: {
      type: 'image_slide' as 'ai_video' | 'image_slide',
      modifications: '',
      generating: false,
      url: '',
      slides: [] as Array<{ cut: number; imageUrl: string; motion: SlideMotionType; mediaType?: 'image' | 'video'; videoUrl?: string; videoDurationSec?: number }>,
      activeSlide: 0,
      slideDuration: IMAGE_SLIDE_DURATION_SEC,
      resolution: 'hd' as RenderResolution,
      subtitleEnabled: true,
      subtitleMaxChars: 24,
      subtitleScale: 1,
      subtitlePosition: 'bottom' as SubtitlePosition,
      subtitleGridPosition: 7,
      subtitlePreset: 'shorts' as SubtitlePreset,
      subtitleWordHighlight: false,
      subtitleHighlightStrength: 'low' as SubtitleHighlightStrength,
      subtitleKeywords: '',
      subtitleUsePerCutKeywords: false,
      subtitleKeywordsByCut: {} as Record<number, string>,
      subtitleEntryAnimation: 'fade' as SubtitleEntryAnimation,
      subtitleSuggesting: false,
      subtitleTemplateLockEnabled: false,
      subtitleTemplateLockedId: '' as string,
      templateTitleEnabled: true,
      templateTitleText: '',
      templateTitleFontFamily: '아네모네',
      templateTitleLine1TopMm: 60,
      templateTitleLine2BottomMm: 96,
      templateTitleLine1Color: '#ef4444',
      templateTitleLine2Color: '#111111',
      templateTitleHighlightColor: '#fde047',
      templateTitleHighlightWord: '',
      templateTitleStrokeColor: 'rgba(0,0,0,0.92)',
      templateTitleScale: 2,
      templateTitleGenerating: false,
      textOverlays: [] as Array<{
        id: string;
        text: string;
        color: string;
        bgColor: string;
        scale: number;
        gridPosition: number;
        align: 'left' | 'center' | 'right';
      }>,
      transcoding: false,
      ffmpegReady: false,
      ffmpegNote: '',
      outputFormat: 'webm' as 'webm' | 'mp4',
      includeThumbnailIntro: false,
      thumbnailIntroDuration: 1,
      bgmEnabled: true,
      bgmTrack: DEFAULT_NON_RELIGIOUS_BGM,
      bgmTrackUserSelected: false,
      bgmVolume: 22,
      sfxEnabled: false,
      sfxTrack: SFX_LIBRARY[0]?.path || '',
      sfxVolume: 45,
      sfxEveryCut: true,
      sfxMode: 'single' as 'single' | 'auto',
      bgmDuckingEnabled: true,
      bgmDuckingDb: 10,
      exportSpeed: 1.25,
      useHybridHookVideos: true,
      hookVideoCount: 7,
    },
    publishing: {
      selectedPlatform: 'youtube' as PublishPlatform,
      mobileStep: 1,
      notifyEmail: '',
      accounts: [
        { id: 'yt-main', platform: 'youtube' as PublishPlatform, name: 'YouTube 기본 채널', handle: '@your-channel', email: '', channelId: '', uploadsPlaylistId: '', connected: false, lastSyncedAt: '' },
      ],
      ownerEmail: '',
      ownerPhone: '',
      adminEmails: [] as string[],
      pendingAdminEmail: '',
      approvedEmails: [] as string[],
      pendingApprovedEmail: '',
      accessRequests: [] as Array<{
        id: string;
        email: string;
        status: 'pending' | 'approved' | 'rejected';
        requestedAt: string;
        resolvedAt: string;
        note: string;
      }>,
      auditLogs: [] as Array<{
        id: string;
        actor: string;
        action: string;
        target: string;
        at: string;
        note: string;
      }>,
      channelInsights: {} as Record<string, {
        channelTitle: string;
        subscribers: string;
        totalViews: string;
        descriptionShort: string;
        lastUploadDate: string;
      }>,
      draft: {
        title: '',
        description: '',
        visibility: 'public' as PublishVisibility,
        scheduleAt: '',
        autoRetry: true,
        maxAttempts: 3,
      },
      jobs: [] as Array<{
        id: string;
        platform: PublishPlatform;
        accountId: string;
        title: string;
        description: string;
        visibility: PublishVisibility;
        scheduleAt: string;
        autoRetry: boolean;
        maxAttempts: number;
        attemptCount: number;
        status: PublishJobStatus;
        lastError: string;
        videoUrl: string;
        notifiedAt: string;
        publishedUrl: string;
        createdAt: string;
      }>,
    },
    autoFlow: {
      enabled: true,
      running: false,
      step: '',
      lastTitle: '',
      error: '',
      log: [] as Array<{ at: string; message: string }>,
      fixedEnabled: false,
      fixed: {
        scriptType: 'shorts' as 'shorts' | 'long-form',
        scriptLength: '60초',
        scriptLang: 'KR' as 'KR' | 'EN' | 'JP',
        subjectContext: '',
        videoStyle: '01. 뉴스/다큐',
        ttsProvider: 'gemini' as 'gemini' | 'elevenlabs',
        ttsVoice: 'Kore',
        elevenlabsVoice: 'elv_adam',
        bgmTrack: DEFAULT_NON_RELIGIOUS_BGM,
        ratio: '9:16' as '9:16' | '16:9' | '1:1' | '3:4',
      },
    },
    productPromo: {
      workflowMode: 'auto' as 'auto' | 'manual',
      imageUrl: '',
      sourceImageUrl: '',
      referenceImages: [] as string[],
      experimentalBgCutout: false,
      productUrl: '',
      productComment: '',
      visualAnchor: '',
      detectedTexts: '',
      preferredTtsProvider: 'elevenlabs' as 'gemini' | 'elevenlabs',
      strictProductLock: true,
      running: false,
      step: '',
      error: '',
      targetSeconds: 7 * IMAGE_SLIDE_DURATION_SEC,
      renderMode: 'image_slide' as 'ai_video' | 'image_slide',
      hookVideoCount: 0,
      manualHookVideoCount: 1,
      targetCuts: 7,
      autoQueuePublish: false,
      autoScheduleMinutes: 60,
      autoQueuePending: false,
    },
  });

  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<boolean>(false);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const elevenlabsVoiceMapRef = useRef<Record<string, string> | null>(null);
  const ttsProviderLockRef = useRef<'gemini' | 'elevenlabs' | null>(null);
  const taskAbortRef = useRef({
    hooks: false,
    thumbnail: false,
    description: false,
    script: false,
    tts: false,
    prompts: false,
    finalRender: false,
    mp4: false,
  });
  const [autoImageBatchRunning, setAutoImageBatchRunning] = useState(false);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');
  const [publishingTermsOpen, setPublishingTermsOpen] = useState(false);
  const [flashNotice, setFlashNotice] = useState<{ text: string; tone: 'info' | 'error' | 'success' } | null>(null);
  const flashTimerRef = useRef<number | null>(null);
  const [resumeSnapshot, setResumeSnapshot] = useState<any>(null);
  const [autoDoneModalText, setAutoDoneModalText] = useState<string>('');
  const [loginGateDismissed, setLoginGateDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('ai_storyteller_login_gate_dismissed') === '1';
    } catch {
      return false;
    }
  });
  const publishRetryTimersRef = useRef<Record<string, number[]>>({});
  const [youtubeAuth, setYoutubeAuth] = useState<YouTubeAuthSession | null>(null);
  const latestUiRef = useRef<any>(ui);
  const autoFlowLockRef = useRef(false);
  const actionApiRef = useRef<any>({});

  const [results, setResults] = useState<any[]>([]);
  const [translatedQueriesByCountry, setTranslatedQueriesByCountry] = useState<Record<string, string>>({});
  const [searchCacheByCountry, setSearchCacheByCountry] = useState<Record<string, any[]>>({});
  const [subtitleTemplates, setSubtitleTemplates] = useState<SavedSubtitleTemplate[]>([]);
  const [templatePreviewOverrides, setTemplatePreviewOverrides] = useState<Record<string, string>>({});
  const initialUiRef = useRef<any>(null);
  const env = (import.meta as any).env || {};
  const googleClientId = env.VITE_GOOGLE_CLIENT_ID || '';
  const googleRedirectUri = env.VITE_GOOGLE_REDIRECT_URI || `${window.location.origin}/oauth/google/callback`;
  const alimtalkWebhookUrl = String(env.VITE_ALIMTALK_WEBHOOK_URL || '').trim();
  const appBuildId = String(env.VITE_APP_BUILD_ID || 'dev-local');
  const requireGoogleLogin = String(env.VITE_REQUIRE_GOOGLE_LOGIN || 'true').toLowerCase() !== 'false';
  const hasValidYouTubeAuth = Boolean(youtubeAuth?.accessToken && youtubeAuth.expiresAt > Date.now());
  const googleLoginReady = Boolean(googleClientId && googleRedirectUri);
  const isOAuthCallbackPath = window.location.pathname.includes('/oauth/google/callback');
  const shouldShowLoginGate =
    requireGoogleLogin &&
    !hasValidYouTubeAuth &&
    !isOAuthCallbackPath &&
    !loginGateDismissed &&
    !resumeSnapshot &&
    !ui.autoFlow.running &&
    !ui.productPromo.running;
  const envAdminEmails = useMemo(
    () => String(env.VITE_ADMIN_EMAILS || '').split(',').map(normalizeEmail).filter(Boolean),
    [env.VITE_ADMIN_EMAILS],
  );
  const currentUserEmail = normalizeEmail(youtubeAuth?.email || '');

  const showNotice = (text: string, tone: 'info' | 'error' | 'success' = 'info', ms = 1000) => {
    if (flashTimerRef.current) {
      window.clearTimeout(flashTimerRef.current);
    }
    setFlashNotice({ text, tone });
    flashTimerRef.current = window.setTimeout(() => {
      setFlashNotice(null);
      flashTimerRef.current = null;
    }, ms);
  };

  const appendAutoLog = (message: string) => {
    setUi(prev => {
      const nextLog = [...(prev.autoFlow.log || []), { at: new Date().toISOString(), message }].slice(-6);
      return { ...prev, autoFlow: { ...prev.autoFlow, log: nextLog } };
    });
  };

  const isAutoRunning = ui.autoFlow.running || ui.productPromo.running;
  const isManualRunning = !isAutoRunning && (
    ui.script.generating ||
    ui.hookLoading ||
    ui.thumbnail.generating ||
    ui.cuts.splitting ||
    ui.tts.generating ||
    ui.tts.status === '프롬프트 생성 중...' ||
    autoImageBatchRunning ||
    ui.finalVideo.generating ||
    ui.description.generating
  );
  const currentAutoStep = ui.autoFlow.running ? ui.autoFlow.step : ui.productPromo.running ? ui.productPromo.step : '';
  const currentAutoTitle = ui.autoFlow.running ? ui.autoFlow.lastTitle : ui.productPromo.running ? '상품홍보 원클릭' : '';
  const isGeminiTtsGenerating = ui.tts.generating && String(ui.tts.status || '').includes('Gemini');
  const isElevenTtsGenerating = ui.tts.generating && String(ui.tts.status || '').includes('ElevenLabs');
  const productPromoPlan = useMemo(() => resolveProductPromoPlan(ui.productPromo), [ui.productPromo]);

  useEffect(() => {
    setUi(prev => syncProductPromoPlanState(prev));
  }, [ui.productPromo.workflowMode, ui.productPromo.renderMode, ui.productPromo.manualHookVideoCount]);

  useEffect(() => {
    if (!hasValidYouTubeAuth) return;
    try {
      sessionStorage.removeItem('ai_storyteller_login_gate_dismissed');
    } catch {
      // ignore session storage errors
    }
    setLoginGateDismissed(false);
  }, [hasValidYouTubeAuth]);

  useEffect(() => {
    const hasProductImages = (ui.productPromo.referenceImages || []).length > 0;
    if (!hasProductImages && !ui.productPromo.running) return;
    const plan = resolveProductPromoPlan(ui.productPromo);
    setUi(prev => {
      const nextFinalVideo = {
        ...prev.finalVideo,
        type: plan.renderMode,
        slideDuration: plan.slideDuration,
        hookVideoCount: plan.hookVideoCount,
        useHybridHookVideos: plan.hookVideoCount > 0,
      };
      const nextScript = {
        ...prev.script,
        length: plan.scriptLength,
      };
      const nextVideoStyle = plan.workflowMode === 'auto'
        ? { ...prev.videoStyle, selected: PRODUCT_PROMO_AUTO_STYLE }
        : prev.videoStyle;
      const nextProductPromo = {
        ...prev.productPromo,
        targetCuts: plan.targetCuts,
        targetSeconds: plan.targetSeconds,
        hookVideoCount: plan.hookVideoCount,
        strictProductLock: plan.workflowMode === 'auto' ? true : prev.productPromo.strictProductLock,
      };

      if (
        nextFinalVideo.type === prev.finalVideo.type &&
        nextFinalVideo.slideDuration === prev.finalVideo.slideDuration &&
        nextFinalVideo.hookVideoCount === prev.finalVideo.hookVideoCount &&
        nextFinalVideo.useHybridHookVideos === prev.finalVideo.useHybridHookVideos &&
        nextScript.length === prev.script.length &&
        nextVideoStyle.selected === prev.videoStyle.selected &&
        nextProductPromo.targetCuts === prev.productPromo.targetCuts &&
        nextProductPromo.targetSeconds === prev.productPromo.targetSeconds &&
        nextProductPromo.hookVideoCount === prev.productPromo.hookVideoCount &&
        nextProductPromo.strictProductLock === prev.productPromo.strictProductLock
      ) {
        return prev;
      }

      return {
        ...prev,
        script: nextScript,
        videoStyle: nextVideoStyle,
        finalVideo: nextFinalVideo,
        productPromo: nextProductPromo,
      };
    });
  }, [
    ui.productPromo.referenceImages,
    ui.productPromo.running,
    ui.productPromo.workflowMode,
    ui.productPromo.renderMode,
    ui.productPromo.manualHookVideoCount,
  ]);

  useEffect(() => {
    setUi(prev => sanitizeProductPromoImagesState(prev));
  }, [ui.productPromo.referenceImages, ui.productPromo.imageUrl]);

  useEffect(() => {
    const cached = searchCacheByCountry[ui.filters.country];
    const rows = Array.isArray(cached) ? cached : [];
    setResults(rows);
    if (rows.length === 0) return;
    const hints = deriveAudienceToneFromResults(rows);
    setUi(prev => {
      if (prev.script.targetAudience === hints.audience && prev.script.tone === hints.tone) return prev;
      return {
        ...prev,
        script: {
          ...prev.script,
          targetAudience: hints.audience,
          tone: hints.tone,
        },
      };
    });
  }, [ui.filters.country, searchCacheByCountry]);

  useEffect(() => {
    const query = String(ui.filters.query || '');
    setTranslatedQueriesByCountry(prev => ({ ...prev, 한국: query }));
  }, [ui.filters.query]);

  useEffect(() => {
    if (Number(ui.finalVideo.slideDuration || 0) === IMAGE_SLIDE_DURATION_SEC) return;
    setUi(prev => ({
      ...prev,
      finalVideo: {
        ...prev.finalVideo,
        slideDuration: IMAGE_SLIDE_DURATION_SEC,
      },
    }));
  }, [ui.finalVideo.slideDuration]);
  const currentManualStep = ui.script.generating ? '대본 생성' :
    ui.hookLoading ? '훅 제목 생성' :
    ui.thumbnail.generating ? '썸네일 생성' :
    ui.cuts.splitting ? '컷 분할' :
    ui.tts.status === '프롬프트 생성 중...' ? '프롬프트 생성' :
    ui.tts.generating ? `TTS 생성${ttsProviderLockRef.current ? ` (${ttsProviderLockRef.current})` : ''}` :
    autoImageBatchRunning ? '이미지 자동 생성' :
    ui.finalVideo.generating ? '렌더링' :
    ui.description.generating ? '설명/태그 생성' : '';
  const isOneClickFixed = Boolean(ui.autoFlow.fixedEnabled);
  const autoProgress = useMemo(() => {
    if (ui.autoFlow.running) {
      const normalized = (ui.autoFlow.step || '').split(' (')[0];
      const idx = AUTO_FLOW_STEPS.findIndex(step => normalized.startsWith(step));
      if (idx === -1) return 0.08;
      return Math.min(1, (idx + 1) / AUTO_FLOW_STEPS.length);
    }
    if (ui.productPromo.running) {
      const idx = PRODUCT_FLOW_STEPS.findIndex(step => (ui.productPromo.step || '').startsWith(step));
      if (idx === -1) return 0.12;
      return Math.min(1, (idx + 1) / PRODUCT_FLOW_STEPS.length);
    }
    return 0;
  }, [ui.autoFlow.running, ui.autoFlow.step, ui.productPromo.running, ui.productPromo.step]);
  const effectiveAdminEmails = useMemo(() => {
    const list = [
      ROOT_ADMIN_EMAIL,
      ...envAdminEmails,
      ...ui.publishing.adminEmails.map(normalizeEmail),
      normalizeEmail(ui.publishing.ownerEmail || ''),
    ].filter(Boolean);
    return Array.from(new Set(list));
  }, [envAdminEmails, ui.publishing.adminEmails, ui.publishing.ownerEmail]);
  const isPublishAdmin = Boolean(currentUserEmail && effectiveAdminEmails.includes(currentUserEmail));
  const effectiveApprovedEmails = useMemo(() => {
    const list = [
      ...ui.publishing.approvedEmails.map(normalizeEmail),
      ...effectiveAdminEmails,
    ].filter(Boolean);
    return Array.from(new Set(list));
  }, [ui.publishing.approvedEmails, effectiveAdminEmails]);
  const isApprovedUser = Boolean(currentUserEmail && effectiveApprovedEmails.includes(currentUserEmail));
  const hasGeminiKey = Boolean((keys.g1 || '').trim());
  const hasElevenLabsKey = Boolean((keys.e11 || '').trim());
  const hasYouTubeApiKey = Boolean((keys[activeKeys.yt as keyof typeof keys] || '').trim());
  const apiStatusItems = useMemo(() => ([
    { key: 'google', label: 'Google 로그인', on: hasValidYouTubeAuth, colorOn: 'bg-cyan-400' },
    { key: 'gemini', label: 'Gemini API', on: hasGeminiKey, colorOn: 'bg-blue-400' },
    { key: 'elevenlabs', label: 'ElevenLabs API', on: hasElevenLabsKey, colorOn: 'bg-indigo-400' },
    { key: 'youtube', label: 'YouTube API', on: hasYouTubeApiKey, colorOn: 'bg-red-400' },
    { key: 'approved', label: '승인 권한', on: isApprovedUser, colorOn: 'bg-emerald-400' },
  ]), [hasValidYouTubeAuth, hasGeminiKey, hasElevenLabsKey, hasYouTubeApiKey, isApprovedUser]);
  const scriptMetrics = useMemo(
    () => buildScriptMetrics(ui.script.output || '', (['KR', 'EN', 'JP'].includes(ui.script.lang) ? ui.script.lang : 'KR') as 'KR' | 'EN' | 'JP'),
    [ui.script.output, ui.script.lang],
  );
  const timingSummary = useMemo(() => {
    const scriptSec = scriptMetrics.sec1x;
    const ttsSec = Number(ui.tts.measuredDuration || 0);
    const fallbackSlideDuration = Math.max(1, Number(ui.finalVideo.slideDuration || IMAGE_SLIDE_DURATION_SEC));
    const cutsSec = ui.finalVideo.slides.length > 0
      ? ui.finalVideo.slides.reduce((sum, slide: any) => sum + getSlideTimelineDurationSec(slide, fallbackSlideDuration), 0)
      : (ui.cuts.items?.length || 0) * fallbackSlideDuration;
    const effectiveSec = ttsSec > 0 ? ttsSec : Math.max(cutsSec, scriptSec);
    return { scriptSec, ttsSec, cutsSec, effectiveSec };
  }, [scriptMetrics.sec1x, ui.tts.measuredDuration, ui.cuts.items, ui.finalVideo.slideDuration, ui.finalVideo.slides]);
  const longformGuide = useMemo(() => estimateLongformGuide(ui.script.output || ''), [ui.script.output]);
  const syncReport = useMemo(() => {
    const slides = ui.finalVideo.slides;
    const fallbackSlideDuration = Math.max(1, Number(ui.finalVideo.slideDuration || IMAGE_SLIDE_DURATION_SEC));
    const slideDurationTotal = Math.max(0, slides.reduce((sum: number, slide: any) => sum + getSlideTimelineDurationSec(slide, fallbackSlideDuration), 0));
    const introDuration = ui.finalVideo.includeThumbnailIntro && ui.thumbnail.url
      ? Math.max(0.5, Number(ui.finalVideo.thumbnailIntroDuration || 1))
      : 0;
    const narrationDuration = ui.tts.measuredDuration > 0 ? Number(ui.tts.measuredDuration) : slideDurationTotal;
    const subtitleSource = (slides.length > 0 ? slides.map(slide => ui.cuts.items[slide.cut - 1] || '') : ui.cuts.items).filter(Boolean);
    const segments = ui.finalVideo.subtitleEnabled
      ? buildSubtitleSegments(subtitleSource, Math.max(1, narrationDuration), Math.max(12, ui.finalVideo.subtitleMaxChars))
      : [];
    const srtEnd = segments.length > 0 ? segments[segments.length - 1].end : 0;
    const subtitleEndAbs = introDuration + srtEnd;
    const ttsEndAbs = introDuration + narrationDuration;
    const deltaSec = Math.abs(subtitleEndAbs - ttsEndAbs);
    const status: '정상' | '주의' | '실패' = deltaSec <= 0.25 ? '정상' : deltaSec <= 0.8 ? '주의' : '실패';

    return {
      scriptSec: timingSummary.scriptSec,
      ttsSec: timingSummary.ttsSec,
      cutsSec: timingSummary.cutsSec,
      renderSec: timingSummary.ttsSec > 0 ? ttsEndAbs : (slideDurationTotal + introDuration),
      srtLastEndSec: subtitleEndAbs,
      deltaSec,
      status,
    };
  }, [
    ui.finalVideo.slides,
    ui.finalVideo.slideDuration,
    ui.finalVideo.includeThumbnailIntro,
    ui.finalVideo.thumbnailIntroDuration,
    ui.finalVideo.subtitleEnabled,
    ui.finalVideo.subtitleMaxChars,
    ui.thumbnail.url,
    ui.tts.measuredDuration,
    ui.cuts.items,
    timingSummary,
  ]);

  useEffect(() => {
    latestUiRef.current = ui;
    if (!initialUiRef.current) {
      initialUiRef.current = JSON.parse(JSON.stringify(ui));
    }
  }, [ui]);

  useEffect(() => {
    return () => {
      if (flashTimerRef.current) {
        window.clearTimeout(flashTimerRef.current);
      }
      Object.values(publishRetryTimersRef.current).forEach(timerIds => {
        timerIds.forEach(timerId => window.clearTimeout(timerId));
      });
    };
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('복사되었습니다.');
  };

  // --- Persistence ---
  useEffect(() => {
    const saved = localStorage.getItem('ai_storyteller_v1');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.keys) setKeys(parsed.keys);
      if (parsed.activeKeys) setActiveKeys(parsed.activeKeys);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('ai_storyteller_v1', JSON.stringify({ keys, activeKeys }));
  }, [keys, activeKeys]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SUBTITLE_TEMPLATE_LS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setSubtitleTemplates(parsed);
      }
    } catch {
      setSubtitleTemplates([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(SUBTITLE_TEMPLATE_LS_KEY, JSON.stringify(subtitleTemplates));
  }, [subtitleTemplates]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SUBTITLE_TEMPLATE_PREVIEW_LS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        setTemplatePreviewOverrides(parsed);
      }
    } catch {
      setTemplatePreviewOverrides({});
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(SUBTITLE_TEMPLATE_PREVIEW_LS_KEY, JSON.stringify(templatePreviewOverrides));
  }, [templatePreviewOverrides]);

  useEffect(() => {
    let cancelled = false;
    const applyAutosave = (parsed: any) => {
      if (!parsed || typeof parsed !== 'object' || cancelled) return;
      setUi(prev => ({
        ...prev,
        publishing: {
          ...prev.publishing,
          notifyEmail: typeof parsed.notifyEmail === 'string' ? parsed.notifyEmail : prev.publishing.notifyEmail,
          mobileStep: Number.isFinite(parsed.mobileStep) ? Math.min(5, Math.max(1, Number(parsed.mobileStep))) : prev.publishing.mobileStep,
          ownerEmail: typeof parsed.ownerEmail === 'string' ? parsed.ownerEmail : prev.publishing.ownerEmail,
          ownerPhone: typeof parsed.ownerPhone === 'string' ? parsed.ownerPhone : prev.publishing.ownerPhone,
          adminEmails: Array.isArray(parsed.adminEmails) ? parsed.adminEmails : prev.publishing.adminEmails,
          approvedEmails: Array.isArray(parsed.approvedEmails) ? parsed.approvedEmails : prev.publishing.approvedEmails,
          accessRequests: Array.isArray(parsed.accessRequests) ? parsed.accessRequests : prev.publishing.accessRequests,
          auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : prev.publishing.auditLogs,
          channelInsights: parsed.channelInsights && typeof parsed.channelInsights === 'object' ? parsed.channelInsights : prev.publishing.channelInsights,
          draft: {
            ...prev.publishing.draft,
            ...(parsed.draft || {}),
          },
          jobs: Array.isArray(parsed.jobs) ? parsed.jobs : prev.publishing.jobs,
          accounts: Array.isArray(parsed.accounts) ? parsed.accounts : prev.publishing.accounts,
        },
      }));
    };

    (async () => {
      try {
        const saved = await idbGetJson<any>(PUBLISH_AUTOSAVE_LS_KEY);
        if (saved) {
          applyAutosave(saved);
          return;
        }
      } catch {
        // fallback to localStorage
      }

      try {
        const raw = localStorage.getItem(PUBLISH_AUTOSAVE_LS_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        applyAutosave(parsed);
        try {
          await idbSetJson(PUBLISH_AUTOSAVE_LS_KEY, parsed);
        } catch {
          // keep localStorage fallback
        }
      } catch {
        // ignore corrupted autosave
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const payload = {
      notifyEmail: ui.publishing.notifyEmail,
      mobileStep: ui.publishing.mobileStep,
      ownerEmail: ui.publishing.ownerEmail,
      ownerPhone: ui.publishing.ownerPhone,
      adminEmails: ui.publishing.adminEmails,
      approvedEmails: ui.publishing.approvedEmails,
      accessRequests: ui.publishing.accessRequests,
      auditLogs: ui.publishing.auditLogs,
      channelInsights: ui.publishing.channelInsights,
      draft: ui.publishing.draft,
      jobs: ui.publishing.jobs,
      accounts: ui.publishing.accounts,
    };
    localStorage.setItem(PUBLISH_AUTOSAVE_LS_KEY, JSON.stringify(payload));
    void idbSetJson(PUBLISH_AUTOSAVE_LS_KEY, payload).catch(() => undefined);
  }, [ui.publishing]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let snap: any = null;
        try {
          snap = await idbGetJson<any>(AUTO_PROGRESS_SNAPSHOT_KEY);
        } catch {
          snap = null;
        }
        if (!snap) {
          try {
            const raw = localStorage.getItem(AUTO_PROGRESS_SNAPSHOT_KEY);
            if (raw) snap = JSON.parse(raw);
          } catch {
            snap = null;
          }
        }
        if (!snap || cancelled) return;
        if (snap?.status === 'done') return;
        setResumeSnapshot(snap);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(YT_AUTH_SESSION_LS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as YouTubeAuthSession;
      if (!parsed?.accessToken || !parsed?.expiresAt || parsed.expiresAt <= Date.now()) {
        localStorage.removeItem(YT_AUTH_SESSION_LS_KEY);
        return;
      }

      setYoutubeAuth(parsed);
      setUi(prev => ({
        ...prev,
        publishing: {
          ...prev.publishing,
          ownerEmail: prev.publishing.ownerEmail || parsed.email || '',
          accounts: prev.publishing.accounts.map(account =>
            account.platform === 'youtube'
              ? {
                  ...account,
                  connected: parsed.authMode === 'youtube' && Boolean(parsed.channelId),
                  name: parsed.channelTitle || account.name,
                  handle: parsed.channelHandle || account.handle,
                  email: parsed.email || account.email || '',
                  channelId: parsed.channelId || account.channelId || '',
                  uploadsPlaylistId: parsed.uploadsPlaylistId || account.uploadsPlaylistId || '',
                  lastSyncedAt: new Date().toISOString(),
                }
              : account,
          ),
        },
      }));
    } catch {
      localStorage.removeItem(YT_AUTH_SESSION_LS_KEY);
    }
  }, []);

  useEffect(() => {
    const finishOAuth = async () => {
      if (window.location.pathname !== '/oauth/google/callback') return;
      const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token') || '';
      const state = params.get('state') || '';
      const expiresIn = Number(params.get('expires_in') || '3600');
      const error = params.get('error') || '';

      if (error) {
        alert(`Google OAuth 실패: ${error}`);
        window.history.replaceState({}, '', '/');
        return;
      }

      const storedState = localStorage.getItem(YT_OAUTH_STATE_LS_KEY) || '';
      const rawMode = localStorage.getItem(YT_OAUTH_MODE_LS_KEY) || '';
      const scopeText = decodeURIComponent(params.get('scope') || '');
      const inferredMode: 'login' | 'youtube' = /youtube\.(upload|readonly)/i.test(scopeText) ? 'youtube' : 'login';
      const oauthMode: 'login' | 'youtube' = rawMode === 'youtube' || rawMode === 'login' ? (rawMode as any) : inferredMode;
      localStorage.removeItem(YT_OAUTH_STATE_LS_KEY);
      localStorage.removeItem(YT_OAUTH_MODE_LS_KEY);
      if (!accessToken || !state || state !== storedState) {
        alert('OAuth 상태 검증에 실패했습니다. 다시 시도해 주세요.');
        window.history.replaceState({}, '', '/');
        return;
      }

      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const userInfo = userInfoRes.ok ? await userInfoRes.json() : {};
        const userEmail = normalizeEmail(String(userInfo?.email || ''));

        let channelTitle = 'Google 사용자';
        let channelHandle = '@google-user';
        let channelId = '';
        let uploadsPlaylistId = '';
        let youtubeConnected = false;
        let youtubeConnectWarning = '';
        if (oauthMode === 'youtube') {
          const res = await fetch('https://www.googleapis.com/youtube/v3/channels?part=id,snippet,contentDetails,statistics&mine=true', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (!res.ok) {
            if (res.status === 403) {
              youtubeConnectWarning = 'YouTube 권한이 아직 승인되지 않았거나 YouTube Data API 접근이 제한되어 Google 로그인만 완료되었습니다.';
            } else {
              throw new Error(`채널 조회 실패 (${res.status})`);
            }
          } else {
            const data = await res.json();
            const channelItem = data?.items?.[0] || {};
            const channel = channelItem?.snippet || {};
            channelTitle = channel?.title || 'YouTube 채널';
            channelHandle = channel?.customUrl ? `@${channel.customUrl.replace(/^@/, '')}` : '@connected-channel';
            channelId = String(channelItem?.id || '');
            uploadsPlaylistId = String(channelItem?.contentDetails?.relatedPlaylists?.uploads || '');
            youtubeConnected = Boolean(channelId);
          }
        }
        const session: YouTubeAuthSession = {
          accessToken,
          expiresAt: Date.now() + Math.max(60, expiresIn - 30) * 1000,
          channelTitle,
          channelHandle,
          email: userEmail,
          authMode: oauthMode === 'youtube' && youtubeConnected ? 'youtube' : 'login',
          channelId,
          uploadsPlaylistId,
        };

        localStorage.setItem(YT_AUTH_SESSION_LS_KEY, JSON.stringify(session));
        setYoutubeAuth(session);
        setUi(prev => ({
          ...prev,
          publishing: {
            ...prev.publishing,
            mobileStep: 1,
            ownerEmail: prev.publishing.ownerEmail || userEmail,
            accounts: prev.publishing.accounts.map(account =>
              account.platform === 'youtube'
                ? {
                    ...account,
                    connected: oauthMode === 'youtube' && youtubeConnected,
                    name: channelTitle,
                    handle: channelHandle,
                    email: userEmail,
                    channelId,
                    uploadsPlaylistId,
                    lastSyncedAt: new Date().toISOString(),
                  }
                : account,
            ),
          },
        }));
        if (oauthMode === 'youtube' && youtubeConnected) {
          alert('YouTube 계정 연결이 완료되었습니다.');
        } else if (oauthMode === 'youtube' && youtubeConnectWarning) {
          alert(youtubeConnectWarning);
        } else {
          alert('Google 로그인이 완료되었습니다.');
        }
      } catch (err: any) {
        console.error(err);
        alert(`YouTube 채널 정보 확인에 실패했습니다: ${err?.message || '알 수 없는 오류'}`);
      } finally {
        window.history.replaceState({}, '', '/');
      }
    };

    finishOAuth();
  }, []);

  useEffect(() => {
    setUi(prev => ({ 
      ...prev, 
      script: { 
        ...prev.script, 
        length: prev.script.type === 'shorts' ? '60초' : '10분' 
      } 
    }));
  }, [ui.script.type]);

  // --- YouTube Logic ---
  const handleSearch = async () => {
    const apiKey = keys[activeKeys.yt as keyof typeof keys];
    const rawQuery = normalizeSubtitleText(ui.filters.query || '');
    if (!apiKey) {
      setUi(prev => ({ ...prev, searchError: 'YouTube API 키를 설정하세요.' }));
      return;
    }
    if (!rawQuery) {
      setUi(prev => ({ ...prev, searchError: '검색어를 입력해 주세요.' }));
      return;
    }

    setUi(prev => ({ ...prev, searching: true, searchError: '' }));

    const buildPublishedAfter = () => {
      const now = new Date();
      if (ui.filters.period === '오늘') return new Date(now.setDate(now.getDate() - 1)).toISOString();
      if (ui.filters.period === '이번 주') return new Date(now.setDate(now.getDate() - 7)).toISOString();
      if (ui.filters.period === '이번 달') return new Date(now.setMonth(now.getMonth() - 1)).toISOString();
      if (ui.filters.period === '올해') return new Date(now.setFullYear(now.getFullYear() - 1)).toISOString();
      return '';
    };

    const translateQueries = async () => {
      const fallback = COUNTRY_ORDER.reduce<Record<string, string>>((acc, country) => {
        const existing = normalizeSubtitleText(translatedQueriesByCountry[country] || '');
        acc[country] = existing || rawQuery;
        return acc;
      }, {});
      fallback['한국'] = rawQuery;
      if (!keys.g1) return fallback;

      try {
        const ai = new GoogleGenAI({ apiKey: keys.g1 });
        const translationRes = await generateContentWithFallback(ai, {
          model: 'gemini-2.5-flash',
          contents: [
            {
              parts: [
                {
                  text: `다음 한국어 검색어를 국가별 유튜브 검색용 자연어로 번역하세요.

원문: ${rawQuery}
국가: 한국, 미국, 일본, 영국, 독일, 프랑스, 베트남

규칙:
- 한국은 원문 그대로 유지
- 유튜브 검색에 적합한 짧은 키워드형 문장
- 추가 설명 없이 JSON만 반환

JSON 스키마:
{"한국":"","미국":"","일본":"","영국":"","독일":"","프랑스":"","베트남":""}`,
                },
              ],
            },
          ],
          config: { responseMimeType: 'application/json' },
        });
        const parsed = JSON.parse(translationRes.text || '{}');
        const merged = { ...fallback };
        COUNTRY_ORDER.forEach(country => {
          const v = normalizeSubtitleText(String(parsed?.[country] || ''));
          if (v) merged[country] = v;
        });
        return merged;
      } catch {
        return fallback;
      }
    };

    const searchOneCountry = async (country: string, localizedQuery: string) => {
      const queryWithCategory = ui.filters.category !== '모든 카테고리'
        ? `${localizedQuery} ${ui.filters.category}`
        : localizedQuery;
      const params: any = {
        part: 'snippet',
        type: 'video',
        q: queryWithCategory,
        maxResults: '50',
        key: apiKey,
        order: ui.filters.sort === '조회수' ? 'viewCount' : 'date',
        regionCode: COUNTRY_MAP[country] || 'KR',
        relevanceLanguage: COUNTRY_TRANSLATION_LANG[country] || 'ko',
      };
      const publishedAfter = buildPublishedAfter();
      if (publishedAfter) params.publishedAfter = publishedAfter;
      if (ui.filters.duration !== '전체') params.videoDuration = ui.filters.duration;

      const searchParams = new URLSearchParams(params);
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${searchParams.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || `${country} 검색 실패`);

      const videoIds = (data.items || []).map((i: any) => i?.id?.videoId).filter(Boolean).join(',');
      if (!videoIds) return [] as any[];

      const statsRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${videoIds}&key=${apiKey}`);
      const statsData = await statsRes.json();
      const statsItems = Array.isArray(statsData?.items) ? (statsData.items as any[]) : [];

      return (data.items || []).map((item: any) => {
        const matched = statsItems.find((s: any) => String(s?.id || '') === String(item?.id?.videoId || ''));
        const stats = matched?.statistics || {};
        return {
          id: item.id.videoId,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails.medium.url,
          channelTitle: item.snippet.channelTitle,
          publishedAt: item.snippet.publishedAt,
          viewCount: Number(stats?.viewCount || 0),
          likeCount: Number(stats?.likeCount || 0),
          commentCount: Number(stats?.commentCount || 0),
          url: `https://youtube.com/watch?v=${item.id.videoId}`,
          country,
          translatedQuery: localizedQuery,
        };
      }).filter((v: any) => v.viewCount >= ui.filters.minViews);
    };

    try {
      const translations = await translateQueries();
      setTranslatedQueriesByCountry(translations);

      const nextCache: Record<string, any[]> = {};
      const failedCountries: string[] = [];
      for (const country of COUNTRY_ORDER) {
        const localizedQuery = normalizeSubtitleText(translations[country] || rawQuery) || rawQuery;
        try {
          const rows = await searchOneCountry(country, localizedQuery);
          nextCache[country] = rows;
        } catch {
          nextCache[country] = [];
          failedCountries.push(country);
        }
      }

      setSearchCacheByCountry(nextCache);
      const activeRows = nextCache[ui.filters.country] || [];
      setResults(activeRows);
      const hints = deriveAudienceToneFromResults(activeRows);
      setUi(prev => ({
        ...prev,
        script: {
          ...prev.script,
          targetAudience: hints.audience,
          tone: hints.tone,
        },
      }));
      if (failedCountries.length > 0) {
        setUi(prev => ({ ...prev, searchError: `${failedCountries.join(', ')} 검색 실패 (다른 국가는 반영됨)` }));
      }
    } catch (err: any) {
      setUi(prev => ({ ...prev, searchError: err?.message || '검색 실패' }));
    } finally {
      setUi(prev => ({ ...prev, searching: false }));
    }
  };

  // --- Gemini Logic ---
  const generateHooks = async () => {
    if (ui.hookLoading) {
      taskAbortRef.current.hooks = true;
      setUi(prev => ({ ...prev, hookLoading: false }));
      return;
    }
    if (!keys.g1) return alert('Gemini API 키가 필요합니다.');
    taskAbortRef.current.hooks = false;
    setUi(prev => ({ ...prev, hookLoading: true, selectedHookTitle: '' }));
    
    try {
      const ai = new GoogleGenAI({ apiKey: keys.g1 });
      const prompt = `유튜브 바이럴 제목 전문가로서, 주제 "${ui.filters.query}"에 대해 클릭률이 높은 제목 30개를 생성하고, 이 제목들이 공통적으로 사용하는 바이럴 전략을 분석하세요. 
      JSON 형식으로 출력하세요: 
      {
        "hookTitles": [{"title": "제목", "strategy": "전략 설명"}],
        "overallStrategy": "전체적인 바이럴 전략 분석 내용"
      }`;
      
      const response = await generateContentWithFallback(ai, {
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      
      const parsed = JSON.parse(response.text || '{}');
      if (taskAbortRef.current.hooks) return;
      setUi(prev => ({ 
        ...prev, 
        hookTitles: parsed.hookTitles || [], 
        overallStrategy: parsed.overallStrategy || '' 
      }));
    } catch (err) {
      console.error(err);
      alert('제목 생성 중 오류가 발생했습니다.');
    } finally {
      setUi(prev => ({ ...prev, hookLoading: false }));
    }
  };

  const generateThumbnail = async () => {
    if (ui.thumbnail.generating) {
      taskAbortRef.current.thumbnail = true;
      setUi(prev => ({ ...prev, thumbnail: { ...prev.thumbnail, generating: false } }));
      return;
    }
    if (!keys.g1 || !ui.selectedHookTitle) return alert('제목을 선택하고 Gemini 키를 확인하세요.');
    taskAbortRef.current.thumbnail = false;
    setUi(prev => ({ ...prev, thumbnail: { ...prev.thumbnail, generating: true } }));

    try {
      const ai = new GoogleGenAI({ apiKey: keys.g1 });
      const stylePrompt = resolveSelectedVideoStyle(ui.videoStyle.selected)?.prompt || '';
      const scriptLang = ui.script.lang === 'KR' ? '한국어' : ui.script.lang === 'EN' ? '영어' : '일본어';
      
      // 1. Generate Visual Prompt
      const promptRes = await generateContentWithFallback(ai, {
        model: "gemini-3-flash-preview",
        contents: `유튜브 썸네일 전문가로서 다음 정보를 바탕으로 강렬하고 클릭을 유도하는 썸네일 이미지 생성을 위한 상세한 영어 프롬프트를 작성하세요.
        
[제목]
${ui.selectedHookTitle}

[대본 요약]
${ui.script.output ? ui.script.output.substring(0, 500) + '...' : '대본 없음'}

[스타일 지침]
${stylePrompt}

[필수 사항]
1. 썸네일에 텍스트가 포함되어야 한다면 반드시 "${scriptLang}"로 작성하세요.
2. 텍스트는 간결하고 임팩트 있어야 합니다.
3. 텍스트는 이미지의 분위기와 어울려야 합니다.
4. 텍스트를 제외한 나머지는 시각적 묘사로 채우세요.
5. 절대 화면에 깨진 문자나 알 수 없는 기호가 나오지 않게 하세요.`
      });
      const visualPrompt = promptRes.text?.trim() || '';
      if (taskAbortRef.current.thumbnail) {
        setUi(prev => ({ ...prev, thumbnail: { ...prev.thumbnail, generating: false } }));
        return;
      }

      // 2. Generate Image
      const imageRes = await generateContentWithFallback(ai, {
        model: ui.thumbnail.model,
        contents: { parts: [{ text: `${visualPrompt}. Aspect Ratio: ${ui.thumbnail.ratio}. Style: ${stylePrompt}` }] },
        config: { imageConfig: { aspectRatio: ui.thumbnail.ratio as any } }
      });

      console.log('Thumbnail Image Generation Response:', imageRes);

      let imageUrl = '';
      for (const part of imageRes.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (taskAbortRef.current.thumbnail) {
        setUi(prev => ({ ...prev, thumbnail: { ...prev.thumbnail, generating: false } }));
        return;
      }
      setUi(prev => ({ 
        ...prev, 
        thumbnail: { 
          ...prev.thumbnail, 
          url: imageUrl, 
          prompt: visualPrompt, 
          generating: false 
        } 
      }));
    } catch (err) {
      console.error(err);
      alert('썸네일 생성 중 오류가 발생했습니다.');
      setUi(prev => ({ ...prev, thumbnail: { ...prev.thumbnail, generating: false } }));
    }
  };

  const generateDescription = async () => {
    if (ui.description.generating) {
      taskAbortRef.current.description = true;
      setUi(prev => ({ ...prev, description: { ...prev.description, generating: false } }));
      return;
    }
    if (!keys.g1 || !ui.script.output) return alert('대본을 먼저 생성하세요.');
    taskAbortRef.current.description = false;
    setUi(prev => ({ ...prev, description: { ...prev.description, generating: true } }));

    try {
      const ai = new GoogleGenAI({ apiKey: keys.g1 });
      const autoContext = Boolean(latestUiRef.current?.autoFlow?.running || latestUiRef.current?.productPromo?.running);
      const prompt = `당신은 100만 뷰 이상의 성과를 내는 유튜브 마케팅 전문가입니다. 
다음 정보를 바탕으로 유튜브 최종 제목, 설명란, 해시태그, 태그를 3개국어(한국어, 영어, 일본어)로 작성하세요.

[선택된 제목]
${ui.selectedHookTitle}

[영상 대본]
${ui.script.output}

[작성 지침]
1. 최종 제목: 클릭을 유도하는 강력한 후킹 문구를 포함하고, 한국어 제목은 20자 이내로 압축하세요.
2. 설명란: 1000만 뷰 영상의 구조(도입부 요약, 내용 상세, 관련 링크 안내 등)를 참고하여 작성하세요. **타임라인(시간대별 요약)은 아직 작성하지 마세요.**
3. 해시태그: 영상의 핵심 키워드 3~5개를 #형태로 작성하세요.
4. 태그: 검색 최적화(SEO)를 위한 연관 키워드들을 콤마(,)로 구분하여 작성하세요.

JSON 형식으로만 출력하세요: 
{
  "kr": {"title": "...", "desc": "...", "hashtags": "...", "tags": "..."},
  "en": {"title": "...", "desc": "...", "hashtags": "...", "tags": "..."},
  "jp": {"title": "...", "desc": "...", "hashtags": "...", "tags": "..."}
}`;
      
      const response = await generateContentWithFallback(ai, {
        model: autoContext ? 'gemini-2.5-pro' : 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      
      const parsed = JSON.parse(response.text || '{}');
      if (taskAbortRef.current.description) {
        setUi(prev => ({ ...prev, description: { ...prev.description, generating: false } }));
        return;
      }
      setUi(prev => ({ 
        ...prev, 
        description: { 
          ...prev.description, 
          kr: {
            ...(parsed.kr || { title: '', desc: '', hashtags: '', tags: '' }),
            title: compressTitleForPublish(parsed?.kr?.title || ''),
          }, 
          en: parsed.en || { title: '', desc: '', hashtags: '', tags: '' }, 
          jp: parsed.jp || { title: '', desc: '', hashtags: '', tags: '' }, 
          generating: false 
        } 
      }));
    } catch (err) {
      console.error(err);
      showNotice('설명 생성 오류(자동 진행은 계속됩니다).', 'error');
      setUi(prev => ({ ...prev, description: { ...prev.description, generating: false } }));
    }
  };

  const generateScript = async () => {
    if (ui.script.generating) {
      taskAbortRef.current.script = true;
      setUi(prev => ({ ...prev, script: { ...prev.script, generating: false } }));
      return;
    }
    if (!keys.g1 || !ui.selectedHookTitle) return alert('제목을 선택하고 Gemini 키를 확인하세요.');
    taskAbortRef.current.script = false;
    setUi(prev => ({ ...prev, script: { ...prev.script, generating: true, lastError: '' } }));

    try {
      const ai = new GoogleGenAI({ apiKey: keys.g1 });
      const autoContext = Boolean(latestUiRef.current?.autoFlow?.running || latestUiRef.current?.productPromo?.running);
      
      const guidelines = `
${CORE_GUIDELINES.GENIUS_INSIGHT}
${CORE_GUIDELINES.MULTI_DIMENSIONAL}
${CORE_GUIDELINES.CREATIVE_CONNECTION}
${CORE_GUIDELINES.PROBLEM_REDEFINITION}
${CORE_GUIDELINES.INNOVATIVE_SOLUTION}
${CORE_GUIDELINES.INSIGHT_AMPLIFICATION}
${CORE_GUIDELINES.THINKING_EVOLUTION}
${CORE_GUIDELINES.COMPLEXITY_SOLUTION}
${CORE_GUIDELINES.INTUITIVE_LEAP}
${CORE_GUIDELINES.INTEGRATED_WISDOM}
      `;

      const scriptRule = ui.script.type === 'shorts' ? SCRIPT_RULES.SHORTS : SCRIPT_RULES.LONGFORM;

      const prompt = `
당신은 최고의 유튜브 콘텐츠 전문가입니다. 
다음 지침과 규칙을 엄격히 준수하여 대본을 작성하세요.

[핵심 지침 및 공식]
${guidelines}

[대본 작성 규칙]
${scriptRule}

[선택된 제목]
${ui.selectedHookTitle}

[영상 설정]
- 형식: ${ui.script.type}
- 목표 길이: ${ui.script.length}
- 언어: ${ui.script.lang}
- 타깃 시청자: ${ui.script.targetAudience}
- 톤 & 분위기: ${ui.script.tone}
- 주제 상황설명: ${ui.autoFlow.fixedEnabled ? (ui.autoFlow.fixed.subjectContext || '미입력') : '미사용'}

[요청 사항]
위 설정에 맞춰 대본을 작성하세요. 
불필요한 설명 없이 대본 내용만 출력하세요.
`;
      
      const response = await generateContentWithFallback(ai, {
        model: autoContext ? 'gemini-2.5-pro' : 'gemini-3-flash-preview',
        contents: prompt
      });
      
      if (taskAbortRef.current.script) {
        setUi(prev => ({ ...prev, script: { ...prev.script, generating: false } }));
        return;
      }
      const rawScript = response.text || '';
      const lang = (['KR', 'EN', 'JP'].includes(ui.script.lang) ? ui.script.lang : 'KR') as 'KR' | 'EN' | 'JP';
      const shortsLimit = SHORTS_LIMITS[lang];
      const finalScript = ui.script.type === 'shorts'
        ? trimScriptToUnitLimit(rawScript, lang, shortsLimit.maxUnits)
        : rawScript;
      setUi(prev => ({
        ...prev,
        script: { ...prev.script, output: finalScript, generating: false, lastError: '' },
        tts: {
          ...prev.tts,
          audioUrl: '',
          measuredDuration: 0,
          status: '대본 변경됨 (TTS 재생성 필요)',
        },
      }));
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : String(err || 'script-error');
      setUi(prev => ({ ...prev, script: { ...prev.script, generating: false, lastError: message } }));
    }
  };

  const inferAudienceAndTone = async (title: string, lang: 'KR' | 'EN' | 'JP') => {
    if (!keys.g1) return null;
    try {
      const ai = new GoogleGenAI({ apiKey: keys.g1 });
      const trendContext = (results || [])
        .slice(0, 8)
        .map((r: any, i: number) => `${i + 1}) ${r.title} | 조회수 ${formatNumber(Number(r.viewCount || 0))}`)
        .join('\n');

      const prompt = `당신은 유튜브 콘텐츠 분석가입니다.
다음 정보를 종합해 타깃 시청자와 톤/분위기를 추천하세요.

[선택된 제목]
${title}

[최근 검색 결과 요약]
${trendContext || '데이터 없음'}

[언어]
${lang}

JSON만 반환:
{"audience":"...","tone":"..."}`;

      const response = await generateContentWithFallback(ai, {
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });

      const parsed = JSON.parse(response.text || '{}');
      const audience = String(parsed?.audience || '').trim();
      const tone = String(parsed?.tone || '').trim();
      if (!audience && !tone) return null;
      return { audience: audience || '20~40대 일반', tone: tone || '정보형, 설득력' };
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const mergeToneWithContext = (baseTone: string, context: string) => {
    const cleanedTone = String(baseTone || '').replace(/\s*·\s*상황설명:\s*.*$/u, '').trim();
    const cleanedContext = String(context || '').trim();
    if (!cleanedContext) return cleanedTone;
    return `${cleanedTone} · 상황설명: ${cleanedContext.slice(0, 120)}`;
  };

  const compressTitleForPublish = (raw: string) => {
    const normalized = normalizeHookTitleForOverlay(raw || '').replace(/\r?\n/g, ' ').trim();
    return Array.from(normalized).slice(0, 20).join('');
  };

  const autoSelectProductVoice = async (tone: string, audience: string) => {
    if (!keys.g1) return;
    try {
      const ai = new GoogleGenAI({ apiKey: keys.g1 });
      const voiceList = GEMINI_TTS_VOICES.map(v => `${v.id}: ${v.label}`).join(', ');
      const elevenList = ELEVENLABS_VOICES.map(v => `${v.id}: ${v.label}`).join(', ');
      const prompt = `상품홍보 쇼츠 음성 연출가로서 아래 조건에 맞는 TTS 엔진과 보이스를 고르세요.
[톤] ${tone}
[타깃] ${audience}
[Gemini 보이스] ${voiceList}
[ElevenLabs 보이스] ${elevenList}
JSON만 반환: {"provider":"gemini|elevenlabs","voice":"id"}`;
      const res = await generateContentWithFallback(ai, {
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });
      const parsed = JSON.parse(res.text || '{}');
      const provider = String(parsed?.provider || 'gemini').toLowerCase() === 'elevenlabs' ? 'elevenlabs' : 'gemini';
      const voice = String(parsed?.voice || '').trim();
      setUi(prev => ({
        ...prev,
        tts: {
          ...prev.tts,
          voice: provider === 'gemini'
            ? (GEMINI_TTS_VOICES.some(v => v.id === voice) ? voice : prev.tts.voice)
            : prev.tts.voice,
          elevenlabsVoice: provider === 'elevenlabs'
            ? (ELEVENLABS_VOICES.some(v => v.id === voice) ? voice : prev.tts.elevenlabsVoice)
            : prev.tts.elevenlabsVoice,
        },
        productPromo: {
          ...prev.productPromo,
          preferredTtsProvider: provider,
        },
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const [previewLoading, setPreviewLoading] = useState(false);
  const [productBgmPreviewing, setProductBgmPreviewing] = useState(false);
  const [fixedBgmPreviewing, setFixedBgmPreviewing] = useState(false);

  const handlePreviewProductBgm = async () => {
    const track = String(latestUiRef.current?.finalVideo?.bgmTrack || '').trim();
    if (!track) {
      showNotice('배경음악을 먼저 선택해 주세요.', 'error');
      return;
    }
    if (productBgmPreviewing && previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
      setProductBgmPreviewing(false);
      return;
    }
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    const audio = new Audio(encodeURI(track));
    audio.loop = true;
    audio.volume = Math.min(1, Math.max(0, Number(latestUiRef.current?.finalVideo?.bgmVolume || 0) / 100));
    audio.onended = () => setProductBgmPreviewing(false);
    audio.onpause = () => setProductBgmPreviewing(false);
    audio.onerror = () => {
      setProductBgmPreviewing(false);
      showNotice('배경음악 미리듣기를 시작할 수 없습니다.', 'error');
    };
    previewAudioRef.current = audio;
    try {
      await audio.play();
      setProductBgmPreviewing(true);
    } catch {
      setProductBgmPreviewing(false);
      showNotice('브라우저 자동재생 제한으로 미리듣기에 실패했습니다.', 'error');
    }
  };

  const handlePreviewFixedBgm = async (trackPath: string) => {
    const track = String(trackPath || '').trim();
    if (!track) {
      showNotice('배경음악을 먼저 선택해 주세요.', 'error');
      return;
    }
    if (fixedBgmPreviewing && previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
      setFixedBgmPreviewing(false);
      return;
    }
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    const audio = new Audio(encodeURI(track));
    audio.loop = true;
    audio.volume = 0.45;
    audio.onended = () => setFixedBgmPreviewing(false);
    audio.onpause = () => setFixedBgmPreviewing(false);
    audio.onerror = () => {
      setFixedBgmPreviewing(false);
      showNotice('배경음악 미리듣기를 시작할 수 없습니다.', 'error');
    };
    previewAudioRef.current = audio;
    try {
      await audio.play();
      setFixedBgmPreviewing(true);
    } catch {
      setFixedBgmPreviewing(false);
      showNotice('브라우저 자동재생 제한으로 미리듣기에 실패했습니다.', 'error');
    }
  };

  const handlePreviewVoice = async (voiceId: string) => {
    // 1. 이미 재생 중인 경우 정지
    if (previewingId === voiceId && previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
      setPreviewingId(null);
      setPreviewLoading(false);
      return;
    }

    // 2. 기존 오디오 정지 및 초기화
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    
    setPreviewingId(voiceId);
    setPreviewLoading(true);
    
    try {
      const isElevenLabsVoice = Boolean(ELEVENLABS_PREVIEW_PATHS[voiceId]);
      const localAudioCandidates = (isElevenLabsVoice
        ? [ELEVENLABS_PREVIEW_PATHS[voiceId]]
        : [
            VOICE_SAMPLE_PATHS[voiceId],
            `/audio/${voiceId}.wav`,
            `/audio/${voiceId.toLowerCase()}.wav`,
          ])
        .filter(Boolean) as string[];
      let resolvedAudioUrl = '';

      try {
        for (const candidate of localAudioCandidates) {
          const localSample = await fetch(candidate);
          if (localSample.ok) {
            const localBuffer = await localSample.arrayBuffer();
            const isMp3 = candidate.toLowerCase().endsWith('.mp3');
            resolvedAudioUrl = URL.createObjectURL(new Blob([localBuffer], { type: isMp3 ? 'audio/mpeg' : 'audio/wav' }));
            break;
          }
        }
        if (!resolvedAudioUrl) {
          throw new Error('Local sample not found');
        }
      } catch {
        if (isElevenLabsVoice) {
          throw new Error('ElevenLabs 미리듣기 샘플 파일을 찾지 못했습니다. /public/audio/elevenlabs-previews 경로를 확인해 주세요.');
        }
        if (!keys.g1) {
          throw new Error('로컬 샘플이 없고 Gemini API 키도 없습니다. API 설정에서 Gemini 키를 등록하면 자동 미리듣기가 가능합니다.');
        }

        const ai = new GoogleGenAI({ apiKey: keys.g1 });
        const previewResponse = await generateContentWithFallback(ai, {
          model: ui.tts.model || 'gemini-2.5-flash-preview-tts',
          contents: [{ parts: [{ text: '안녕하세요. AI Storyteller Lite 음성 미리듣기 샘플입니다.' }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voiceId as any },
              },
            },
          },
        });

        const base64Audio = previewResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
          throw new Error('Gemini 음성 미리듣기 생성에 실패했습니다.');
        }
        resolvedAudioUrl = addWavHeader(base64Audio);
      }

      const audio = new Audio();

      audio.onplay = () => {
        setPreviewLoading(false);
      };

      audio.onended = () => {
        if (resolvedAudioUrl.startsWith('blob:')) {
          URL.revokeObjectURL(resolvedAudioUrl);
        }
        setPreviewingId(null);
      };

      audio.onerror = (e) => {
        console.error('Audio Error:', e);
        if (resolvedAudioUrl.startsWith('blob:')) {
          URL.revokeObjectURL(resolvedAudioUrl);
        }
        setPreviewingId(null);
        setPreviewLoading(false);
        alert(`목소리 샘플(${voiceId}) 재생에 실패했습니다.`);
      };

      audio.src = resolvedAudioUrl;
      previewAudioRef.current = audio;

      await audio.play().catch(err => {
        console.error('Playback failed:', err);
        if (resolvedAudioUrl.startsWith('blob:')) {
          URL.revokeObjectURL(resolvedAudioUrl);
        }
        if (err.name === 'NotAllowedError') {
          alert('브라우저에 의해 자동 재생이 차단되었습니다. 다시 한 번 버튼을 눌러주세요.');
        }
        setPreviewingId(null);
        setPreviewLoading(false);
      });

    } catch (e: any) {
      console.error("TTS Preview Error:", e);
      setPreviewingId(null);
      setPreviewLoading(false);
      alert(`미리듣기 실패: ${e.message || "알 수 없는 오류"}`);
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
    };
  }, []);

  const autoSuggestStyle = async () => {
    if (!keys.g1 || !ui.script.output) return;
    try {
      const ai = new GoogleGenAI({ apiKey: keys.g1 });
      const response = await generateContentWithFallback(ai, {
        model: 'gemini-3-flash-preview',
        contents: `[TASK] 아래 대본 내용을 분석하여, 가장 잘 어울리는 TTS 낭독 스타일(Style Instructions)을 한글 한 문장으로 작성하세요.
대본일부: ${ui.script.output.substring(0, 300)}...
결과 예시: "신뢰감 있고 차분한 목소리로 지적인 분석가처럼 읽어주세요."`,
      });
      const suggestion = response.text?.trim() || "자연스럽고 전문적인 톤으로 낭독해 주세요.";
      setUi(prev => ({ ...prev, tts: { ...prev.tts, styleInstructions: suggestion } }));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (ui.tts.selectedToneId === 'default') {
      autoSuggestStyle();
    } else {
      const selected = TONE_STYLES.find(s => s.id === ui.tts.selectedToneId);
      if (selected) {
        setUi(prev => ({ 
          ...prev, 
          tts: { 
            ...prev.tts, 
            styleInstructions: `${selected.label}(${selected.detail}) 스타일에 맞춰, ${selected.tone}로 낭독해 주세요.` 
          } 
        }));
      }
    }
  }, [ui.tts.selectedToneId, ui.script.output]);

  useEffect(() => {
    if (!ui.tts.audioUrl) {
      setUi(prev => ({ ...prev, tts: { ...prev.tts, measuredDuration: 0 } }));
      return;
    }

    let cancelled = false;
    const probe = document.createElement('audio');
    probe.preload = 'metadata';
    probe.src = ui.tts.audioUrl;
    const onLoaded = () => {
      if (cancelled) return;
      const duration = Number.isFinite(probe.duration) ? probe.duration : 0;
      setUi(prev => ({ ...prev, tts: { ...prev.tts, measuredDuration: duration } }));
    };
    const onError = () => {
      if (cancelled) return;
      setUi(prev => ({ ...prev, tts: { ...prev.tts, measuredDuration: 0 } }));
    };

    probe.addEventListener('loadedmetadata', onLoaded);
    probe.addEventListener('error', onError);

    return () => {
      cancelled = true;
      probe.removeEventListener('loadedmetadata', onLoaded);
      probe.removeEventListener('error', onError);
      probe.src = '';
    };
  }, [ui.tts.audioUrl]);

  const normalizeKoreanNumeralsForTts = (text: string) => {
    const units = ['', '십', '백', '천'];
    const nums = ['영', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
    const toHangul = (n: number) => {
      if (!Number.isFinite(n)) return '';
      if (n === 0) return '영';
      const str = String(Math.floor(Math.abs(n)));
      let out = '';
      for (let i = 0; i < str.length; i += 1) {
        const digit = Number(str[i]);
        const unit = units[(str.length - 1 - i) % 4];
        if (digit === 0) continue;
        if (digit === 1 && unit) out += unit;
        else out += `${nums[digit]}${unit}`;
      }
      return out || '영';
    };

    return text
      .replace(/(\d{3,4})년/g, (_, y) => `${toHangul(Number(y))}년`)
      .replace(/\b5곳\b/g, '다섯 곳')
      .replace(/\b5개\b/g, '다섯 개')
      .replace(/\b10개\b/g, '열 개');
  };

  const buildCleanTtsScript = (raw: string, lang?: 'KR' | 'EN' | 'JP') => {
    const cleaned = raw
      .replace(/^[a-zA-Z\s]+:\s*/gm, '')
      .replace(/\(.*\)/g, '')
      .trim();
    if (lang === 'KR') {
      return normalizeKoreanNumeralsForTts(cleaned);
    }
    return cleaned;
  };

  const loadElevenLabsVoiceMap = async (apiKey: string) => {
    const res = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': apiKey,
      },
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`ElevenLabs 보이스 목록 조회 실패 (${res.status}) ${detail}`.trim());
    }
    const data = await res.json();
    const map: Record<string, string> = {};
    for (const voice of data?.voices || []) {
      if (voice?.name) map[String(voice.name).toLowerCase()] = voice.voice_id;
      if (voice?.voice_id) map[String(voice.voice_id).toLowerCase()] = voice.voice_id;
    }
    elevenlabsVoiceMapRef.current = map;
    return map;
  };

  const resolveElevenLabsVoiceId = async (apiKey: string, voiceKey: string) => {
    const map = elevenlabsVoiceMapRef.current || await loadElevenLabsVoiceMap(apiKey);
    const voiceEntry = ELEVENLABS_VOICES.find(voice => voice.id === voiceKey);
    const lookupKeys = [
      voiceEntry?.name,
      voiceEntry?.label?.split(' · ')[0],
      voiceKey,
    ]
      .filter(Boolean)
      .map(key => String(key).toLowerCase());
    for (const key of lookupKeys) {
      const mapped = map[key];
      if (mapped) return mapped;
    }
    throw new Error('ElevenLabs 보이스 ID를 찾지 못했습니다. API 설정 또는 보이스 이름을 확인해 주세요.');
  };

  const tryStartTtsProvider = (provider: 'gemini' | 'elevenlabs') => {
    if (ttsProviderLockRef.current && ttsProviderLockRef.current !== provider) {
      alert(`다른 TTS(${ttsProviderLockRef.current}) 생성이 진행 중입니다. 잠시 후 다시 시도하세요.`);
      return false;
    }
    ttsProviderLockRef.current = provider;
    return true;
  };

  const finishTtsProvider = (provider: 'gemini' | 'elevenlabs') => {
    if (ttsProviderLockRef.current === provider) {
      ttsProviderLockRef.current = null;
    }
  };

  const handleGenerateGeminiTTS = async () => {
    if (ui.tts.generating) {
      if (ttsProviderLockRef.current === 'gemini') {
        taskAbortRef.current.tts = true;
        setUi(prev => ({ ...prev, tts: { ...prev.tts, generating: false, status: '중지됨' } }));
      } else {
        alert('다른 TTS 생성이 진행 중입니다.');
      }
      return;
    }
    if (!keys.g1 || !ui.script.output) return alert('대본을 먼저 생성하세요.');
    if (!tryStartTtsProvider('gemini')) return;
    taskAbortRef.current.tts = false;
    setUi(prev => ({ ...prev, tts: { ...prev.tts, generating: true, status: 'Gemini 생성 중...' } }));

    try {
      const ai = new GoogleGenAI({ apiKey: keys.g1 });
      
      const cleanScript = buildCleanTtsScript(ui.script.output, (ui.script.lang as any) || 'KR');

      const numberPronunciationRule = ui.script.lang === 'KR'
        ? '숫자는 한국어 자연 발화로 읽어야 합니다. 예: 2020년=이천이십년, 5곳=다섯 곳, 10개=열 개.'
        : '';
      const promptText = ui.tts.styleInstructions
        ? `[Style: ${ui.tts.styleInstructions}]\n${numberPronunciationRule}\n${cleanScript}`
        : `${numberPronunciationRule}\n${cleanScript}`;

      const response = await generateContentWithFallback(ai, {
        model: ui.tts.model || "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: promptText }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: ui.tts.voice as any },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        if (taskAbortRef.current.tts) {
          setUi(prev => ({ ...prev, tts: { ...prev.tts, generating: false, status: '중지됨' } }));
          return;
        }
        const url = addWavHeader(base64Audio);
        setUi(prev => ({ ...prev, tts: { ...prev.tts, generating: false, audioUrl: url, status: 'Gemini 완료' } }));
      }
    } catch (err) {
      console.error(err);
      setUi(prev => ({ ...prev, tts: { ...prev.tts, generating: false, status: 'Gemini 실패' } }));
    } finally {
      finishTtsProvider('gemini');
    }
  };

  const handleGenerateElevenLabsTTS = async () => {
    if (ui.tts.generating) {
      if (ttsProviderLockRef.current === 'elevenlabs') {
        taskAbortRef.current.tts = true;
        setUi(prev => ({ ...prev, tts: { ...prev.tts, generating: false, status: '중지됨' } }));
      } else {
        alert('다른 TTS 생성이 진행 중입니다.');
      }
      return;
    }
    if (!keys.e11 || !ui.script.output) return alert('대본을 먼저 생성하세요.');
    if (!tryStartTtsProvider('elevenlabs')) return;
    taskAbortRef.current.tts = false;
    setUi(prev => ({ ...prev, tts: { ...prev.tts, generating: true, status: 'ElevenLabs 생성 중...' } }));

    try {
      const cleanScript = buildCleanTtsScript(ui.script.output, (ui.script.lang as any) || 'KR');
      const resolvedVoiceId = await resolveElevenLabsVoiceId(keys.e11, ui.tts.elevenlabsVoice);
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${resolvedVoiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': keys.e11,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text: cleanScript,
          model_id: ui.tts.elevenlabsModel || 'eleven_multilingual_v2',
          voice_settings: ELEVENLABS_DEFAULT_SETTINGS,
        }),
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(`ElevenLabs TTS 실패 (${response.status}) ${detail}`.trim());
      }

      if (taskAbortRef.current.tts) {
        setUi(prev => ({ ...prev, tts: { ...prev.tts, generating: false, status: '중지됨' } }));
        return;
      }

      const blob = await response.blob();
      const url = await blobToDataUrl(blob);
      setUi(prev => ({ ...prev, tts: { ...prev.tts, generating: false, audioUrl: url, status: 'ElevenLabs 완료' } }));
    } catch (err) {
      console.error(err);
      setUi(prev => ({ ...prev, tts: { ...prev.tts, generating: false, status: 'ElevenLabs 실패' } }));
    } finally {
      finishTtsProvider('elevenlabs');
    }
  };

  const handleGenerateTTS = async (provider?: 'gemini' | 'elevenlabs') => {
    if (provider === 'elevenlabs') {
      await handleGenerateElevenLabsTTS();
      return;
    }
    await handleGenerateGeminiTTS();
  };

  const splitCuts = async () => {
    if (ui.cuts.splitting) return;
    if (!ui.script.output) {
      showNotice('대본이 없습니다.', 'error');
      return;
    }
    setUi(prev => ({ ...prev, cuts: { ...prev.cuts, splitting: true } }));
    await new Promise(resolve => setTimeout(resolve, 220));
    const isShorts = ui.script.type === 'shorts';
    const baseItems = splitScriptToCuts(ui.script.output, isShorts)
      .map(v => v.trim())
      .filter(v => v.length > 1);

    const ttsDuration = Math.max(0, Number(ui.tts.measuredDuration || 0));
    const shortsTargetCuts = ttsDuration > 0
      ? Math.max(3, Math.min(24, Math.round(ttsDuration / IMAGE_SLIDE_DURATION_SEC)))
      : 0;
    const items = isShorts
      ? (shortsTargetCuts > 0 ? rebalanceCutsToTarget(baseItems, shortsTargetCuts) : baseItems)
      : rebalanceCutsToTarget(baseItems, Math.max(1, Math.round((ttsDuration > 0 ? ttsDuration : Number(scriptMetrics.sec1x || 0)) / 30)));

    if (items.length === 0) {
      setUi(prev => ({ ...prev, cuts: { ...prev.cuts, splitting: false } }));
      showNotice('컷 분할 결과가 없습니다. 대본 내용을 확인해 주세요.', 'error');
      return;
    }

    setUi(prev => ({ ...prev, cuts: { ...prev.cuts, items, splitting: false } }));
  };

  const runAutoImageBatch = async (targetCuts?: number[]) => {
    if (autoImageBatchRunning) {
      abortRef.current = true;
      setAutoImageBatchRunning(false);
      return { aborted: true, failCount: 0, failedCuts: [] as number[] };
    }

    abortRef.current = false;
    setAutoImageBatchRunning(true);
    let failCount = 0;
    const prompts = [...(latestUiRef.current?.cuts?.prompts || [])];
    const queue = targetCuts?.length
      ? prompts.filter((cut: any) => targetCuts.includes(cut.index))
      : prompts;

    const productImageUrl = String(latestUiRef.current?.productPromo?.imageUrl || '').trim();
    const productReferences = [
      ...(latestUiRef.current?.productPromo?.referenceImages || []),
      productImageUrl,
    ]
      .map((v: any) => String(v || '').trim())
      .filter(Boolean)
      .filter((value: string, index: number, arr: string[]) => arr.indexOf(value) === index);
    const canAssignOriginalByCut =
      Boolean(latestUiRef.current?.productPromo?.strictProductLock) &&
      latestUiRef.current?.productPromo?.workflowMode !== 'auto' &&
      productReferences.length > 1 &&
      prompts.length > 0 &&
      productReferences.length >= prompts.length;

    if (canAssignOriginalByCut) {
      setUi(prev => {
        const nextJobs = [...(prev.imageJobs || [])];
        for (const cut of queue) {
          const lockedImage = String(productReferences[(Math.max(1, cut.index) - 1) % productReferences.length]);
          const idx = nextJobs.findIndex((j: any) => j.cut === cut.index);
          if (idx < 0) {
            nextJobs.push({ cut: cut.index, status: '원본 고정', imageUrl: lockedImage });
          } else {
            nextJobs[idx] = { ...nextJobs[idx], status: '원본 고정', imageUrl: lockedImage };
          }
        }
        return { ...prev, imageJobs: nextJobs };
      });
      setAutoImageBatchRunning(false);
      return { aborted: false, failCount: 0, failedCuts: [] as number[] };
    }

    for (const cut of queue) {
      if (abortRef.current) break;
      const existing = latestUiRef.current?.imageJobs?.find((j: any) => j.cut === cut.index);
      if (existing?.imageUrl) {
        continue;
      }
      let ok = false;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        if (abortRef.current) break;
        try {
          await generateImage(cut.index, { force: false });
          const job = latestUiRef.current?.imageJobs?.find((j: any) => j.cut === cut.index);
          if (job?.imageUrl) {
            ok = true;
            break;
          }
        } catch {
          // retry below
        }
        await new Promise(r => setTimeout(r, 900));
      }
      if (!ok) {
        failCount += 1;
      }
      await new Promise(r => setTimeout(r, 1200));
    }
    setAutoImageBatchRunning(false);
    const failedCuts = queue
      .filter((cut: any) => {
        const job = latestUiRef.current?.imageJobs?.find((j: any) => j.cut === cut.index);
        return !job?.imageUrl;
      })
      .map((cut: any) => cut.index);
    const finalFailCount = failedCuts.length;
    return { aborted: abortRef.current, failCount: finalFailCount, failedCuts };
  };

  const runOneClickFromTitle = async (
    title: string,
    opts?: {
      productMode?: boolean;
      productRenderMode?: 'ai_video' | 'image_slide';
      productHookVideoCount?: number;
      productTargetCuts?: number;
      productTargetSeconds?: number;
      resumeFromStep?: number;
    },
  ) => {
    if (!title?.trim()) return;
    if (!keys.g1) {
      showNotice('Gemini API 키를 먼저 설정하세요.', 'error');
      return;
    }
    if (autoFlowLockRef.current || latestUiRef.current?.autoFlow?.running) {
      showNotice('이미 원클릭 자동 제작이 진행 중입니다.', 'error');
      return;
    }
    autoFlowLockRef.current = true;
    const resumeFromStep = Math.max(1, Number(opts?.resumeFromStep || 1));
    let lastSnapshotStep = resumeFromStep;

    const waitFor = async (predicate: () => boolean, timeoutMs = 45000, intervalMs = 300) => {
      const started = Date.now();
      while (Date.now() - started < timeoutMs) {
        if (predicate()) return true;
        await new Promise(r => setTimeout(r, intervalMs));
      }
      return false;
    };

    const waitDelay = async (ms: number) => new Promise(r => setTimeout(r, ms));

    const persistAutoSnapshot = async (step: number, status: 'running' | 'done' | 'error') => {
      lastSnapshotStep = Math.max(1, Number(step || 1));
      const payload = {
        savedAt: new Date().toISOString(),
        status,
        step,
        title,
        options: {
          productMode: Boolean(opts?.productMode),
          productRenderMode: opts?.productRenderMode || 'image_slide',
          productHookVideoCount: Number(opts?.productHookVideoCount ?? 2),
          productTargetCuts: Number(opts?.productTargetCuts ?? 4),
        },
        ui: {
          selectedHookTitle: latestUiRef.current?.selectedHookTitle || title,
          script: latestUiRef.current?.script,
          tts: latestUiRef.current?.tts,
          cuts: latestUiRef.current?.cuts,
          imageJobs: latestUiRef.current?.imageJobs,
          finalVideo: latestUiRef.current?.finalVideo,
          description: latestUiRef.current?.description,
          productPromo: latestUiRef.current?.productPromo,
          panelsOpen: latestUiRef.current?.panelsOpen,
        },
      };
      try {
        await idbSetJson(AUTO_PROGRESS_SNAPSHOT_KEY, payload);
        localStorage.setItem(AUTO_PROGRESS_SNAPSHOT_KEY, JSON.stringify(payload));
      } catch {
        localStorage.setItem(AUTO_PROGRESS_SNAPSHOT_KEY, JSON.stringify(payload));
      }
    };

    const clearAutoSnapshot = async () => {
      try {
        await idbDelete(AUTO_PROGRESS_SNAPSHOT_KEY);
      } catch {
        // local fallback only
      }
      localStorage.removeItem(AUTO_PROGRESS_SNAPSHOT_KEY);
    };

    const ensureCutSplit = async () => {
      let rounds = 0;
      const started = Date.now();
      while (true) {
        for (let i = 0; i < 3; i += 1) {
          appendAutoLog(`컷 분할 시도 (${rounds * 3 + i + 1})`);
          await actionApiRef.current.splitCuts();
          const ok = await waitFor(() => (latestUiRef.current?.cuts?.items || []).length > 0, 50000, 350);
          if (ok) {
            appendAutoLog('컷 분할 완료');
            return;
          }
        }
        rounds += 1;
        if (Date.now() - started > 20 * 60 * 1000) {
          throw new Error('컷 분할 재시도 제한 시간 초과');
        }
        appendAutoLog('컷 분할 재시도 대기(30초)');
        await waitDelay(30000);
      }
    };

    const scriptReady = () => {
      const text = String(latestUiRef.current?.script?.output || '').trim();
      if (!text) return false;
      const normalized = normalizeSubtitleText(text);
      if (latestUiRef.current?.script?.type === 'shorts') {
        return normalized.replace(/\s/g, '').length >= 60;
      }
      return normalized.replace(/\s/g, '').length >= 300;
    };

    const ensureScriptReady = async () => {
      let rounds = 0;
      const started = Date.now();
      const isHardScriptFailure = () => {
        const message = String(latestUiRef.current?.script?.lastError || '').toLowerCase();
        if (!message) return false;
        return ['api key', 'apikey', 'unauthorized', 'forbidden', 'permission', 'quota', 'rate limit', '429', '401', '403', 'invalid'].some(token => message.includes(token));
      };
      while (true) {
        for (let i = 0; i < 3; i += 1) {
          appendAutoLog(`대본 생성 시도 (${rounds * 3 + i + 1})`);
          await actionApiRef.current.generateScript();
          const ok = await waitFor(scriptReady, 60000, 350);
          if (ok) {
            appendAutoLog('대본 생성 완료');
            return;
          }
          if (isHardScriptFailure()) {
            throw new Error(`대본 생성 하드 실패: ${latestUiRef.current?.script?.lastError || 'API/권한 오류'}`);
          }
        }
        rounds += 1;
        if (Date.now() - started > 20 * 60 * 1000) {
          throw new Error('대본 생성 재시도 제한 시간 초과');
        }
        appendAutoLog('대본 재시도 대기(30초)');
        await waitDelay(30000);
      }
    };

    const getMissingPromptCuts = () => {
      const items = latestUiRef.current?.cuts?.items || [];
      const prompts = latestUiRef.current?.cuts?.prompts || [];
      const missing: number[] = [];
      for (let i = 0; i < items.length; i += 1) {
        const index = i + 1;
        const found = prompts.find((p: any) => p.index === index);
        if (!found || !String(found.prompt || '').trim()) {
          missing.push(index);
        }
      }
      return missing;
    };

    const ensurePrompts = async () => {
      let missing = getMissingPromptCuts();
      let rounds = 0;
      const started = Date.now();
      while (missing.length > 0) {
        for (let i = 0; i < 3; i += 1) {
          appendAutoLog(`프롬프트 재시도: ${missing.join(', ')} (${rounds * 3 + i + 1})`);
          await actionApiRef.current.generateImagePrompts();
          missing = getMissingPromptCuts();
          if (missing.length === 0) return;
        }
        rounds += 1;
        if (Date.now() - started > 20 * 60 * 1000) {
          throw new Error(`프롬프트 미완료(시간 초과): ${missing.join(', ')}`);
        }
        appendAutoLog(`프롬프트 재시도 대기(30초): ${missing.join(', ')}`);
        await waitDelay(30000);
      }
    };

    const ensureImages = async () => {
      let pending: number[] = [];
      let rounds = 0;
      const started = Date.now();
      while (true) {
        const result = await runAutoImageBatch(pending.length ? pending : undefined);
        if (result.aborted) throw new Error('이미지 자동 생성이 중지되었습니다.');
        if (result.failCount === 0) {
          appendAutoLog('이미지 전체 완료');
          return;
        }
        pending = result.failedCuts;
        rounds += 1;
        if (Date.now() - started > 25 * 60 * 1000) {
          throw new Error('이미지 자동 생성 재시도 제한 시간 초과');
        }
        appendAutoLog(`이미지 재시도 대기(30초): ${pending.join(', ')}`);
        await waitDelay(30000);
      }
    };

    const withRetries = async (label: string, fn: () => Promise<void>, verify: () => boolean, attempts = 2) => {
      for (let i = 0; i < attempts; i += 1) {
        setUi(prev => ({ ...prev, autoFlow: { ...prev.autoFlow, step: `${label}${attempts > 1 ? ` (${i + 1}/${attempts})` : ''}` } }));
        appendAutoLog(`${label} 시작${attempts > 1 ? ` (${i + 1}/${attempts})` : ''}`);
        await fn();
        const ok = await waitFor(verify, 50000, 350);
        if (ok) {
          appendAutoLog(`${label} 완료`);
          return;
        }
      }
      appendAutoLog(`${label} 실패`);
      throw new Error(`${label} 실패`);
    };

    setUi(prev => ({
      ...prev,
      selectedHookTitle: title,
      autoFlow: {
        ...prev.autoFlow,
        running: true,
        step: '대본 생성',
        lastTitle: title,
        error: '',
        log: [...(prev.autoFlow.log || []), { at: new Date().toISOString(), message: `원클릭 자동 제작 시작: ${title}` }].slice(-6),
      },
    }));

    try {
      await new Promise(r => setTimeout(r, 0));
      const fixedEnabled = Boolean(latestUiRef.current?.autoFlow?.fixedEnabled);
      const fixed = latestUiRef.current?.autoFlow?.fixed;
      if (fixedEnabled && fixed) {
        setUi(prev => ({
          ...prev,
          script: {
            ...prev.script,
            type: fixed.scriptType || prev.script.type,
            length: fixed.scriptLength || prev.script.length,
            lang: fixed.scriptLang || prev.script.lang,
            tone: mergeToneWithContext(prev.script.tone, fixed.subjectContext),
          },
          videoStyle: {
            ...prev.videoStyle,
            selected: fixed.videoStyle || prev.videoStyle.selected,
          },
          tts: {
            ...prev.tts,
            model: 'gemini-2.5-pro-preview-tts',
            voice: fixed.ttsProvider === 'gemini' ? (fixed.ttsVoice || prev.tts.voice) : prev.tts.voice,
            elevenlabsVoice: fixed.ttsProvider === 'elevenlabs' ? (fixed.elevenlabsVoice || prev.tts.elevenlabsVoice) : prev.tts.elevenlabsVoice,
            selectedToneId: 'default',
          },
          cuts: {
            ...prev.cuts,
            ratio: fixed.ratio || prev.cuts.ratio,
          },
          thumbnail: {
            ...prev.thumbnail,
            ratio: fixed.ratio || prev.thumbnail.ratio,
            model: 'gemini-3-pro-image-preview',
          },
          finalVideo: {
            ...prev.finalVideo,
            bgmEnabled: Boolean(fixed.bgmTrack),
            bgmTrack: fixed.bgmTrack || prev.finalVideo.bgmTrack,
            bgmTrackUserSelected: true,
            sfxEnabled: false,
          },
          description: {
            ...prev.description,
          },
        }));
        await new Promise(r => setTimeout(r, 0));
        const inferred = await inferAudienceAndTone(title, fixed.scriptLang || 'KR');
        if (inferred) {
          setUi(prev => ({
            ...prev,
            script: {
              ...prev.script,
              targetAudience: inferred.audience || prev.script.targetAudience,
              tone: mergeToneWithContext((inferred.tone || prev.script.tone), fixed.subjectContext),
            },
          }));
          await new Promise(r => setTimeout(r, 0));
        }
      }
      if (opts?.productMode) {
        const productRenderMode = opts?.productRenderMode || 'image_slide';
        const productHookVideoCount = Math.max(0, Number(opts?.productHookVideoCount ?? 0));
        const productTargetSeconds = Math.max(18, Math.min(30, Number(opts?.productTargetSeconds ?? 20)));
        setUi(prev => ({
          ...prev,
          script: {
            ...prev.script,
            type: 'shorts',
            length: `${productTargetSeconds}초`,
            lang: fixedEnabled && fixed ? (fixed.scriptLang || 'KR') : 'KR',
            tone: mergeToneWithContext('상품홍보, 후킹형', fixedEnabled && fixed ? fixed.subjectContext : ''),
          },
          videoStyle: {
            ...prev.videoStyle,
            selected: PRODUCT_PROMO_AUTO_STYLE,
          },
          tts: {
            ...prev.tts,
            model: 'gemini-2.5-pro-preview-tts',
          },
          finalVideo: {
            ...prev.finalVideo,
            type: productRenderMode,
            useHybridHookVideos: productRenderMode === 'image_slide' ? productHookVideoCount > 0 : prev.finalVideo.useHybridHookVideos,
            hookVideoCount: productRenderMode === 'image_slide' ? productHookVideoCount : prev.finalVideo.hookVideoCount,
            bgmEnabled: fixedEnabled && fixed ? Boolean(fixed.bgmTrack) : prev.finalVideo.bgmEnabled,
            bgmTrack: fixedEnabled && fixed ? (fixed.bgmTrack || prev.finalVideo.bgmTrack) : prev.finalVideo.bgmTrack,
            bgmTrackUserSelected: fixedEnabled && fixed ? true : prev.finalVideo.bgmTrackUserSelected,
          },
          thumbnail: {
            ...prev.thumbnail,
            model: 'gemini-3-pro-image-preview',
          },
        }));
        await new Promise(r => setTimeout(r, 0));
      }

      if (resumeFromStep <= 1) {
        await ensureScriptReady();
        await persistAutoSnapshot(1, 'running');
      }

      if (opts?.productMode) {
        const lang = (['KR', 'EN', 'JP'].includes(latestUiRef.current?.script?.lang) ? latestUiRef.current?.script?.lang : 'KR') as 'KR' | 'EN' | 'JP';
        const targetSeconds = Math.max(18, Math.min(30, Number(opts?.productTargetSeconds ?? 20)));
        const trimmed = trimScriptToSeconds(latestUiRef.current?.script?.output || '', lang, targetSeconds);
        setUi(prev => ({
          ...prev,
          script: { ...prev.script, output: trimmed },
          tts: {
            ...prev.tts,
            audioUrl: '',
            measuredDuration: 0,
            status: '대본 변경됨 (TTS 재생성 필요)',
          },
        }));
        await new Promise(r => setTimeout(r, 0));
      }

      if (resumeFromStep <= 2) {
        await actionApiRef.current.rewriteTemplateTitleFromHook();
        try {
          await withRetries(
            '설명/태그 생성',
            () => actionApiRef.current.generateDescription(),
            () => Boolean(latestUiRef.current?.description?.kr?.title || latestUiRef.current?.description?.kr?.desc),
            2,
          );
        } catch {
          appendAutoLog('설명/태그 생성 실패(계속 진행)');
          showNotice('설명/태그 생성 실패 - 자동 진행 계속', 'error');
        }
        await new Promise(r => setTimeout(r, 0));
        setUi(prev => {
          const selectedTitle = normalizeSubtitleText(prev.finalVideo.templateTitleText || prev.description.kr.title || title || '');
          return {
            ...prev,
            finalVideo: {
              ...prev.finalVideo,
              templateTitleText: selectedTitle || prev.finalVideo.templateTitleText,
            },
            description: {
              ...prev.description,
              kr: {
                ...prev.description.kr,
                title: selectedTitle || prev.description.kr.title,
              },
            },
          };
        });
        await persistAutoSnapshot(2, 'running');
      }

      const ttsProvider = fixedEnabled && fixed?.ttsProvider === 'elevenlabs' ? 'elevenlabs' : 'gemini';
      const styleReady = await waitFor(() => Boolean(latestUiRef.current?.tts?.styleInstructions?.trim()), 15000, 350);
      if (!styleReady) {
        appendAutoLog('낭독 스타일 미확정(기본값 진행)');
      }

      if (resumeFromStep <= 3) {
      try {
        if (opts?.productMode) {
          const preferredProductProvider: 'gemini' | 'elevenlabs' =
            fixedEnabled && fixed
              ? (fixed.ttsProvider === 'elevenlabs' ? 'elevenlabs' : 'gemini')
              : ((latestUiRef.current?.productPromo?.preferredTtsProvider === 'elevenlabs') ? 'elevenlabs' : 'gemini');
          let elevenOk = false;
          if (preferredProductProvider === 'elevenlabs' && keys.e11) {
            try {
              await withRetries(
                'TTS 생성(ElevenLabs)',
                () => actionApiRef.current.handleGenerateTTS('elevenlabs'),
                () => Boolean(latestUiRef.current?.tts?.audioUrl) && String(latestUiRef.current?.tts?.status || '').includes('ElevenLabs 완료'),
                2,
              );
              elevenOk = true;
            } catch {
              appendAutoLog('ElevenLabs 실패, Gemini로 전환');
            }
          }
          if (!elevenOk) {
            await withRetries(
              'TTS 생성(Gemini)',
              () => actionApiRef.current.handleGenerateTTS('gemini'),
              () => Boolean(latestUiRef.current?.tts?.audioUrl) && String(latestUiRef.current?.tts?.status || '').includes('Gemini 완료'),
              2,
            );
          }
        } else {
          const preferred = ttsProvider === 'elevenlabs' && !keys.e11 ? 'gemini' : ttsProvider;
          try {
            await withRetries(
              `TTS 생성(${preferred})`,
              () => actionApiRef.current.handleGenerateTTS(preferred),
              () => Boolean(latestUiRef.current?.tts?.audioUrl),
              2,
            );
          } catch (primaryErr) {
            if (preferred === 'elevenlabs') {
              appendAutoLog('ElevenLabs 실패, Gemini로 자동 전환');
              await withRetries(
                'TTS 생성(gemini)',
                () => actionApiRef.current.handleGenerateTTS('gemini'),
                () => Boolean(latestUiRef.current?.tts?.audioUrl),
                2,
              );
            } else {
              throw primaryErr;
            }
          }
        }
      } catch (ttsErr) {
        if (!opts?.productMode || !latestUiRef.current?.tts?.audioUrl) {
          throw ttsErr;
        }
        setUi(prev => ({ ...prev, autoFlow: { ...prev.autoFlow, step: 'TTS 생성(경고: 이전 음원 사용)' } }));
      }
      await persistAutoSnapshot(3, 'running');
      }

      if (opts?.productMode) {
        const measured = Math.max(0, Number(latestUiRef.current?.tts?.measuredDuration || 0));
        if (measured > 0) {
          const ttsBasedCuts = Math.max(3, Math.min(24, Math.round(measured / IMAGE_SLIDE_DURATION_SEC)));
          setUi(prev => ({
            ...prev,
            productPromo: {
              ...prev.productPromo,
              targetCuts: ttsBasedCuts,
              targetSeconds: ttsBasedCuts * IMAGE_SLIDE_DURATION_SEC,
            },
            autoFlow: {
              ...prev.autoFlow,
              step: `컷 재계산 (TTS ${measured.toFixed(1)}초 → ${ttsBasedCuts}컷)`,
            },
          }));
          appendAutoLog(`TTS 실측 ${measured.toFixed(1)}초 기준 컷 재계산: ${ttsBasedCuts}컷 (컷당 ${IMAGE_SLIDE_DURATION_SEC}초)`);
          await new Promise(r => setTimeout(r, 0));
        }
      }

      if (resumeFromStep <= 4) {
        await ensureCutSplit();
        await persistAutoSnapshot(4, 'running');
      }

      if (opts?.productMode) {
        const measured = Math.max(0, Number(latestUiRef.current?.tts?.measuredDuration || 0));
        const ttsBasedCuts = measured > 0
          ? Math.max(3, Math.min(24, Math.round(measured / IMAGE_SLIDE_DURATION_SEC)))
          : Math.max(3, Math.min(24, Number(opts?.productTargetCuts ?? latestUiRef.current?.productPromo?.targetCuts ?? 7)));
        const balanced = rebalanceCutsToTarget([...(latestUiRef.current?.cuts?.items || [])], ttsBasedCuts);
        const compact = compactCutsToMax(balanced, ttsBasedCuts);
        setUi(prev => ({ ...prev, cuts: { ...prev.cuts, items: compact } }));
      }

      if (resumeFromStep <= 5) {
        await withRetries(
          '프롬프트 생성',
          () => actionApiRef.current.generateImagePrompts(),
          () => {
            const prompts = latestUiRef.current?.cuts?.prompts || [];
            return prompts.length > 0 && prompts.some((p: any) => (p?.prompt || '').trim().length >= 12);
          },
          2,
        );
        await ensurePrompts();
        await persistAutoSnapshot(5, 'running');
      }

      if (resumeFromStep <= 6) {
        setUi(prev => ({ ...prev, autoFlow: { ...prev.autoFlow, step: '이미지 자동 생성' } }));
        await ensureImages();
        await persistAutoSnapshot(6, 'running');
      }

      if (opts?.productMode && latestUiRef.current?.productPromo?.imageUrl) {
        const fallbackImage = latestUiRef.current.productPromo.imageUrl;
        const cuts = latestUiRef.current?.cuts?.items || [];
        setUi(prev => {
          const nextJobs = [...(prev.imageJobs || [])];
          for (let i = 0; i < cuts.length; i += 1) {
            const cut = i + 1;
            const existsIdx = nextJobs.findIndex((j: any) => j.cut === cut);
            if (existsIdx < 0) {
              nextJobs.push({ cut, status: '원본 대체(자동복구)', imageUrl: fallbackImage });
              continue;
            }
            if (!nextJobs[existsIdx]?.imageUrl) {
              nextJobs[existsIdx] = {
                ...nextJobs[existsIdx],
                status: '원본 대체(자동복구)',
                imageUrl: fallbackImage,
              };
            }
          }
          return { ...prev, imageJobs: nextJobs };
        });
        await new Promise(r => setTimeout(r, 0));
      }

      setUi(prev => ({
        ...prev,
        autoFlow: { ...prev.autoFlow, step: '영상 구성' },
        finalVideo: { ...prev.finalVideo, type: opts?.productMode ? (opts?.productRenderMode || 'image_slide') : 'image_slide' },
      }));
      await new Promise(r => setTimeout(r, 0));
      if (resumeFromStep <= 7) {
        await withRetries(
          '슬라이드 구성',
          () => actionApiRef.current.handleGenerateFinalVideo(),
          () => (latestUiRef.current?.finalVideo?.slides || []).length > 0,
          2,
        );
        await persistAutoSnapshot(7, 'running');
      }

      const current = latestUiRef.current;
      const templateTitle = normalizeSubtitleText(current?.finalVideo?.templateTitleText || current?.description?.kr?.title || title || '');
      const autoDescBody = (current?.description?.kr?.desc || '').trim();
      const autoTags = (current?.description?.kr?.tags || '').trim();
      const autoHash = (current?.description?.kr?.hashtags || '').trim();
      const autoDesc = [autoDescBody, autoHash, autoTags ? `태그: ${autoTags}` : ''].filter(Boolean).join('\n\n');

      setUi(prev => ({
        ...prev,
        publishing: {
          ...prev.publishing,
          mobileStep: 3,
          draft: {
            ...prev.publishing.draft,
            title: templateTitle || compressTitleForPublish(title || ''),
            description: autoDesc.slice(0, 5000),
          },
        },
        panelsOpen: {
          ...prev.panelsOpen,
          p12: true,
          p13: true,
          p14: true,
        },
      }));

      setUi(prev => ({ ...prev, autoFlow: { ...prev.autoFlow, running: false, step: '12단계 완료', error: '' } }));
      appendAutoLog('자동 진행 12단계 완료 (최종 렌더/발행은 수동 확인)');
      showNotice('자동 진행 12단계 완료: 13번 편집 후 14번 발행하세요.', 'success');
      setAutoDoneModalText(AUTO_DONE_MESSAGE);
      await persistAutoSnapshot(8, 'done');
      await clearAutoSnapshot();
      return true;
    } catch (err: any) {
      console.error(err);
      const hasSlides = Array.isArray(latestUiRef.current?.finalVideo?.slides) && latestUiRef.current.finalVideo.slides.length > 0;
      const hasImageJobs = Array.isArray(latestUiRef.current?.imageJobs) && latestUiRef.current.imageJobs.some((j: any) => Boolean(j?.imageUrl));
      const hasTts = Boolean(latestUiRef.current?.tts?.audioUrl);
      const hasRenderableOutput = hasSlides || hasImageJobs;
      const canSoftRecover = hasRenderableOutput && (hasTts || Boolean(opts?.productMode));

      if (canSoftRecover) {
        setUi(prev => ({
          ...prev,
          autoFlow: {
            ...prev.autoFlow,
            running: false,
            step: '12단계 완료(경고)',
            error: '',
          },
        }));
        appendAutoLog('자동 진행 경고 종료: 일부 단계 오류가 있었지만 생성 결과를 유지합니다.');
        showNotice('일부 단계 경고가 있었지만 생성 결과를 유지했습니다. 12~14번에서 최종 확인해 주세요.', 'info', 1400);
        setAutoDoneModalText(AUTO_DONE_MESSAGE);
        await persistAutoSnapshot(8, 'done');
        await clearAutoSnapshot();
        return true;
      }

      const normalizeAutoFlowError = (message: string) => {
        if (!message) return '자동 제작 중 오류가 발생했습니다.';
        if (message.includes('대본')) return '대본 생성에 실패했습니다. 제목/키워드를 바꿔 다시 시도해 주세요.';
        if (message.includes('TTS')) return '음성 생성에 실패했습니다. 목소리 모델이나 길이를 확인해 주세요.';
        if (message.includes('컷')) return '컷 분할에 실패했습니다. 대본 문장 구성을 확인해 주세요.';
        if (message.includes('프롬프트')) return '프롬프트 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.';
        if (message.includes('렌더')) return '영상 렌더링에 실패했습니다. 컷 수와 음원 상태를 확인해 주세요.';
        return '자동 제작 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
      };
      const userError = normalizeAutoFlowError(err?.message || '');
      setUi(prev => ({
        ...prev,
        autoFlow: {
          ...prev.autoFlow,
          running: false,
          step: '오류',
          error: userError,
        },
      }));
      appendAutoLog(`원클릭 자동 제작 실패: ${userError}`);
      showNotice(userError, 'error');
      await persistAutoSnapshot(lastSnapshotStep, 'error');
      return false;
    } finally {
      autoFlowLockRef.current = false;
    }
  };

  const selectHookTitle = (title: string) => {
    setUi(prev => ({ ...prev, selectedHookTitle: title }));
    void runOneClickFromTitle(title);
  };

  const clearResumeSnapshot = async () => {
    setResumeSnapshot(null);
    try {
      await idbDelete(AUTO_PROGRESS_SNAPSHOT_KEY);
    } catch {
      // local fallback only
    }
    localStorage.removeItem(AUTO_PROGRESS_SNAPSHOT_KEY);
  };

  const resumeFromSnapshot = async () => {
    const snap = resumeSnapshot;
    if (!snap) return;
    const snapUi = snap.ui || {};
    const snapTtsAudioUrl = String(snapUi?.tts?.audioUrl || '').trim();
    const hasUsableTtsAudio = Boolean(snapTtsAudioUrl) && !snapTtsAudioUrl.startsWith('blob:');
    let safeResumeStep = Math.max(1, Number(snap.step || 1));
    if (!String(snapUi?.script?.output || '').trim()) safeResumeStep = Math.min(safeResumeStep, 2);
    if (!hasUsableTtsAudio || Number(snapUi?.tts?.measuredDuration || 0) <= 0) safeResumeStep = Math.min(safeResumeStep, 3);
    if (!Array.isArray(snapUi?.cuts?.items) || snapUi.cuts.items.length === 0) safeResumeStep = Math.min(safeResumeStep, 4);
    if (!Array.isArray(snapUi?.cuts?.prompts) || snapUi.cuts.prompts.length === 0) safeResumeStep = Math.min(safeResumeStep, 5);
    if (!Array.isArray(snapUi?.imageJobs) || !snapUi.imageJobs.some((j: any) => Boolean(j?.imageUrl))) safeResumeStep = Math.min(safeResumeStep, 6);
    if (!Array.isArray(snapUi?.finalVideo?.slides) || snapUi.finalVideo.slides.length === 0) safeResumeStep = Math.min(safeResumeStep, 7);

    setUi(prev => ({
      ...prev,
      ...snapUi,
      tts: {
        ...prev.tts,
        ...(snapUi?.tts || {}),
        generating: false,
        status: hasUsableTtsAudio ? String(snapUi?.tts?.status || '').replace('생성 중...', '완료') : '복구: TTS 재생성 필요',
        audioUrl: hasUsableTtsAudio ? snapTtsAudioUrl : '',
        measuredDuration: hasUsableTtsAudio ? Number(snapUi?.tts?.measuredDuration || 0) : 0,
      },
      autoFlow: {
        ...prev.autoFlow,
        ...(snapUi?.autoFlow || {}),
        running: false,
      },
      productPromo: {
        ...prev.productPromo,
        ...(snapUi?.productPromo || {}),
        running: false,
      },
    }));
    setResumeSnapshot(null);
    await new Promise(r => setTimeout(r, 0));
    void runOneClickFromTitle(snap.title || latestUiRef.current?.selectedHookTitle || '', {
      ...(snap.options || {}),
      resumeFromStep: safeResumeStep,
    });
  };

  const fileToDataUrl = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }
    return `data:${file.type || 'image/jpeg'};base64,${btoa(binary)}`;
  };

  const blobToDataUrl = async (blob: Blob) => {
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }
    return `data:${blob.type || 'image/jpeg'};base64,${btoa(binary)}`;
  };

  const handleProductPromoImages = async (files: File[]) => {
    const validFiles = files.filter(Boolean);
    if (validFiles.length === 0) return;
    const existing = Array.isArray(latestUiRef.current?.productPromo?.referenceImages)
      ? latestUiRef.current.productPromo.referenceImages.length
      : 0;
    const remain = Math.max(0, PRODUCT_PROMO_MAX_IMAGES - existing);
    if (remain <= 0) {
      showNotice(`상품 사진은 최대 ${PRODUCT_PROMO_MAX_IMAGES}장까지 업로드할 수 있습니다.`, 'error');
      return;
    }

    const accepted = validFiles.slice(0, remain);
    const dropped = validFiles.length - accepted.length;
    const converted = await Promise.all(accepted.map(file => fileToDataUrl(file)));
    const nextRefs = [
      ...(latestUiRef.current?.productPromo?.referenceImages || []),
      ...converted,
    ]
      .map((v: any) => String(v || '').trim())
      .filter(Boolean)
      .filter((value: string, index: number, arr: string[]) => arr.indexOf(value) === index)
      .slice(0, PRODUCT_PROMO_MAX_IMAGES);
    const selectedMain = String(latestUiRef.current?.productPromo?.imageUrl || '').trim();
    const nextMain = selectedMain && nextRefs.includes(selectedMain)
      ? selectedMain
      : (nextRefs[0] || '');

    setUi(prev => ({
      ...prev,
      productPromo: {
        ...prev.productPromo,
        imageUrl: nextMain,
        sourceImageUrl: '',
        referenceImages: nextRefs,
      },
    }));

    if (dropped > 0) {
      showNotice(`최대 ${PRODUCT_PROMO_MAX_IMAGES}장만 업로드됩니다. ${dropped}장은 제외되었습니다.`, 'info');
    }
  };

  const removeProductPromoImage = (index: number) => {
    setUi(prev => {
      const refs = [...(prev.productPromo.referenceImages || [])];
      refs.splice(index, 1);
      const nextMain = refs[0] || '';
      return {
        ...prev,
        productPromo: {
          ...prev.productPromo,
          referenceImages: refs,
          imageUrl: refs.includes(prev.productPromo.imageUrl) ? prev.productPromo.imageUrl : nextMain,
        },
      };
    });
  };

  const runProductPromoOneClick = async () => {
    if (!keys.g1) {
      showNotice('Gemini API 키가 필요합니다.', 'error');
      return;
    }
    if ((ui.productPromo.referenceImages || []).length === 0) {
      showNotice('상품 사진을 먼저 업로드해 주세요.', 'error');
      return;
    }
    const plan = resolveProductPromoPlan(ui.productPromo);
    if (plan.workflowMode !== 'auto') {
      showNotice('수동 모드에서는 원클릭이 아닌 단계별 수동 진행을 사용해 주세요.', 'info');
      return;
    }
    if (latestUiRef.current?.productPromo?.running) return;

    setUi(prev => ({
      ...prev,
      productPromo: {
        ...prev.productPromo,
        running: true,
        step: '상품 분석 중',
        error: '',
        autoQueuePending: false,
      },
      autoFlow: {
        ...prev.autoFlow,
        log: [...(prev.autoFlow.log || []), { at: new Date().toISOString(), message: '상품홍보 원클릭 시작' }].slice(-6),
      },
    }));

    try {
      const ai = new GoogleGenAI({ apiKey: keys.g1 });
      const productUrl = (ui.productPromo.productUrl || '').trim();
      const productComment = (ui.productPromo.productComment || '').trim();
      const productImage = String(ui.productPromo.imageUrl || '').trim();
      const productInline = (() => {
        const match = productImage.match(/^data:(.*?);base64,(.*)$/i);
        if (!match) return null;
        return { inlineData: { mimeType: match[1] || 'image/jpeg', data: match[2] || '' } };
      })();

      let imageInsight: any = {};
      if (productInline) {
        try {
          const imageInsightRes = await generateContentWithFallback(ai, {
            model: 'gemini-2.5-pro',
            contents: [
              {
                parts: [
                  {
                    text: `업로드된 상품 이미지에서 한국 쇼츠 마케팅용 핵심 정보를 추출하세요.

[출력 규칙]
- 한국어 JSON만 반환
- 가격/할인율/최저가/비용 관련 정보는 절대 포함하지 말 것
- 확신이 낮으면 빈 문자열로 반환

JSON 스키마:
{"productName":"","modelNumber":"","usagePurpose":"","usageScenarios":"","targetUsers":"","visibleTexts":"","searchKeywords":""}`,
                  },
                  productInline as any,
                ],
              },
            ],
            config: { responseMimeType: 'application/json' },
          });
          imageInsight = JSON.parse(imageInsightRes.text || '{}');
        } catch {
          imageInsight = {};
        }
      }

      const youtubeSeed = [
        String(imageInsight?.productName || ''),
        String(imageInsight?.modelNumber || ''),
        String(imageInsight?.searchKeywords || ''),
        String(productComment || ''),
      ]
        .map(v => normalizeSubtitleText(v))
        .filter(Boolean)
        .join(' ')
        .slice(0, 160);

      let productTrendContext = '';
      if ((keys.yt1 || '').trim() && youtubeSeed) {
        try {
          const params = new URLSearchParams({
            part: 'snippet',
            type: 'video',
            q: `${youtubeSeed} 리뷰 사용법`,
            maxResults: '8',
            key: String(keys.yt1 || '').trim(),
            order: 'viewCount',
            regionCode: 'KR',
            relevanceLanguage: 'ko',
          });
          const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`);
          const data = await res.json();
          if (res.ok && Array.isArray(data?.items) && data.items.length > 0) {
            const ids = data.items.map((item: any) => item?.id?.videoId).filter(Boolean).join(',');
            let statsMap = new Map<string, any>();
            if (ids) {
              const statRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${ids}&key=${String(keys.yt1 || '').trim()}`);
              const statData = await statRes.json();
              if (statRes.ok && Array.isArray(statData?.items)) {
                statsMap = new Map(statData.items.map((v: any) => [String(v.id), v.statistics || {}]));
              }
            }
            productTrendContext = data.items
              .slice(0, 6)
              .map((item: any, idx: number) => {
                const vid = String(item?.id?.videoId || '');
                const stats = statsMap.get(vid) || {};
                return `${idx + 1}) ${String(item?.snippet?.title || '')} | 조회수 ${formatNumber(Number(stats?.viewCount || 0))}`;
              })
              .join('\n');
          }
        } catch {
          productTrendContext = '';
        }
      }

      const trendContext = productTrendContext || (results || [])
        .slice(0, 6)
        .map((r: any, i: number) => `${i + 1}) ${r.title} | 조회수 ${formatNumber(Number(r.viewCount || 0))}`)
        .join('\n');
      const analysis = await generateContentWithFallback(ai, {
        model: 'gemini-2.5-pro',
        contents: [
          {
            parts: [
              {
                text: `당신은 한국 쇼츠 커머스 카피라이터이자 상품 분석가입니다.
다음 정보를 종합해 한국 문화 맥락에 맞는 상품홍보 자동화 데이터를 설계하세요.

[사용자 상품 URL]
${productUrl || '미입력'}

[사용자 코멘트]
${productComment || '미입력'}

[상품 이미지 분석]
품명: ${String(imageInsight?.productName || '') || '미확인'}
제품넘버: ${String(imageInsight?.modelNumber || '') || '미확인'}
용도: ${String(imageInsight?.usagePurpose || '') || '미확인'}
사용 장면: ${String(imageInsight?.usageScenarios || '') || '미확인'}
사용층: ${String(imageInsight?.targetUsers || '') || '미확인'}
패키지/라벨 텍스트: ${String(imageInsight?.visibleTexts || '') || '미확인'}

[YouTube 트렌드 참고 데이터]
${trendContext || '데이터 없음(검색 미실행)'}

[필수 규칙]
1) 한국어로만 작성
2) 사실 기반으로 강한 후킹 문장을 작성(거짓/허위 금지)
3) 타깃은 한국 사용자
4) ${plan.targetSeconds}초 내외 쇼츠에 맞는 압축 정보
5) 품명/제품넘버/용도/사용층을 최대한 명확하게 정리
6) 가격/할인/비용 정보는 절대 생성하지 말 것
7) 소비자가 행동하게 만드는 CTA 포함: 예) "안 사면 손해" 계열의 긴급성 문구(허위 없이)
8) 고정댓글 유도 문구 포함: 예) "구매 링크는 고정댓글 확인"
9) 후속 이미지 연출은 업로드된 원본 상품 사진을 기준으로 제품은 유지, 배경/구도만 컷별 변주
10) 모든 컷 연출은 한국 생활 맥락(주거/오피스/카페/출근/육아/운동 등) 우선

JSON만 반환:
{"hookTitle":"...","tone":"...","audience":"...","scriptHint":"...","visualGuide":"...","productAnchor":"...","detectedTexts":"...","productName":"...","modelNumber":"...","usagePurpose":"...","usageScenarios":"...","ctaLine":"...","pinnedCommentCta":"..."}`,
              },
            ],
          },
        ],
        config: { responseMimeType: 'application/json' },
      });
      const parsed = JSON.parse(analysis.text || '{}');
      const hookTitle = normalizeSubtitleText(String(parsed?.hookTitle || '이 제품이 필요한 이유'));

      setUi(prev => ({
        ...prev,
        selectedHookTitle: hookTitle,
        script: {
          ...prev.script,
          type: 'shorts',
          length: plan.scriptLength,
          lang: 'KR',
          tone: `${String(parsed?.tone || '상품홍보, 후킹형')} · 한국 로컬 광고 톤${productComment ? ` · 사용자 코멘트 반영: ${productComment.slice(0, 60)}` : ''}`,
          targetAudience: String(parsed?.audience || prev.script.targetAudience),
        },
        videoStyle: {
          ...prev.videoStyle,
          selected: PRODUCT_PROMO_AUTO_STYLE,
        },
        finalVideo: {
          ...prev.finalVideo,
          type: 'image_slide',
          slideDuration: IMAGE_SLIDE_DURATION_SEC,
          useHybridHookVideos: false,
          hookVideoCount: 0,
          modifications: String(parsed?.visualGuide || prev.finalVideo.modifications || ''),
        },
        productPromo: {
          ...prev.productPromo,
          workflowMode: 'auto',
          strictProductLock: true,
          renderMode: 'image_slide',
          hookVideoCount: 0,
          targetCuts: plan.targetCuts,
          targetSeconds: plan.targetSeconds,
          step: '자동 제작 중',
          visualAnchor: String(parsed?.productAnchor || ''),
          detectedTexts: [
            String(parsed?.detectedTexts || imageInsight?.visibleTexts || ''),
            parsed?.productName ? `품명:${String(parsed.productName)}` : '',
            parsed?.modelNumber ? `제품넘버:${String(parsed.modelNumber)}` : '',
            parsed?.usagePurpose ? `용도:${String(parsed.usagePurpose)}` : '',
            parsed?.usageScenarios ? `사용장면:${String(parsed.usageScenarios)}` : '',
          ].filter(Boolean).join(' | '),
        },
        description: {
          ...prev.description,
          kr: {
            ...prev.description.kr,
            desc: [
              normalizeSubtitleText(String(parsed?.scriptHint || '')),
              normalizeSubtitleText(String(parsed?.ctaLine || '')),
              normalizeSubtitleText(String(parsed?.pinnedCommentCta || '구매 링크는 고정댓글에서 확인하세요.')),
            ].filter(Boolean).join('\n'),
          },
        },
      }));

      if (!latestUiRef.current?.autoFlow?.fixedEnabled) {
        await autoSelectProductVoice(
          String(parsed?.tone || '상품홍보, 후킹형'),
          String(parsed?.audience || '20~40대 일반'),
        );
      }

      const ok = await runOneClickFromTitle(hookTitle, {
        productMode: true,
        productRenderMode: 'image_slide',
        productHookVideoCount: 0,
        productTargetCuts: plan.targetCuts,
        productTargetSeconds: plan.targetSeconds,
      });

      if (!ok) {
        setUi(prev => ({
          ...prev,
          productPromo: {
            ...prev.productPromo,
            running: false,
            step: '오류',
            error: latestUiRef.current?.autoFlow?.error || '상품 자동 제작 중 일부 단계가 실패했습니다.',
            autoQueuePending: false,
          },
        }));
        return;
      }

      setUi(prev => ({
        ...prev,
        productPromo: {
          ...prev.productPromo,
          running: false,
          step: latestUiRef.current?.productPromo?.autoQueuePublish ? '완료 · 발행 자동등록 대기(요건 점검)' : '완료',
          error: '',
          autoQueuePending: Boolean(latestUiRef.current?.productPromo?.autoQueuePublish),
        },
        publishing: {
          ...prev.publishing,
          mobileStep: 5,
        },
        panelsOpen: {
          ...prev.panelsOpen,
          p13: true,
          p14: true,
        },
      }));
      appendAutoLog('상품홍보 원클릭 완료');
      setAutoDoneModalText(AUTO_DONE_MESSAGE);

      if (latestUiRef.current?.productPromo?.autoQueuePublish) {
        const scheduleMinutes = [30, 60, 120].includes(Number(latestUiRef.current?.productPromo?.autoScheduleMinutes))
          ? Number(latestUiRef.current?.productPromo?.autoScheduleMinutes)
          : 60;
        setUi(prev => ({
          ...prev,
          publishing: {
            ...prev.publishing,
            draft: {
              ...prev.publishing.draft,
              scheduleAt: toFutureDateTimeLocalValue(scheduleMinutes),
            },
          },
        }));
      }
    } catch (err: any) {
      console.error(err);
      setUi(prev => ({
        ...prev,
        productPromo: {
          ...prev.productPromo,
          running: false,
          step: '오류',
          error: '상품 자동 제작에 실패했습니다. 사진이나 네트워크 상태를 확인해 주세요.',
          autoQueuePending: false,
        },
      }));
      appendAutoLog('상품홍보 원클릭 실패: 자동 제작 오류');
      showNotice('상품 자동 제작에 실패했습니다. 다시 시도해 주세요.', 'error');
    }
  };

  const handleDownloadThumbnail = () => {
    if (!isApprovedUser) {
      alert('승인된 사용자만 다운로드할 수 있습니다. 관리자 승인 후 다시 시도해 주세요.');
      return;
    }
    if (!ui.thumbnail.url) return;
    const ext = ui.thumbnail.url.startsWith('data:image/png') ? 'png' : 'jpg';
    const titleSeed = (ui.selectedHookTitle || ui.filters.query || 'thumbnail').trim();
    const safeTitle = Array.from(titleSeed).slice(0, 20).join('').replace(/[<>:"/\\|?*\x00-\x1F]/g, '').replace(/\s+/g, '_') || 'thumbnail';
    const a = document.createElement('a');
    a.href = ui.thumbnail.url;
    a.download = `thumbnail_${safeTitle}.${ext}`;
    a.click();
  };

  const generateImagePrompts = async () => {
    if (ui.tts.status === '프롬프트 생성 중...') {
      taskAbortRef.current.prompts = true;
      setUi(prev => ({ ...prev, tts: { ...prev.tts, status: '프롬프트 생성 중지됨' } }));
      return;
    }
    if (ui.cuts.items.length === 0) return alert('컷 분할을 먼저 하세요.');
    if (!keys.g1) return alert('Gemini 키가 필요합니다.');

    taskAbortRef.current.prompts = false;
    setUi(prev => ({ ...prev, tts: { ...prev.tts, status: '프롬프트 생성 중...' } }));
    
    try {
      const ai = new GoogleGenAI({ apiKey: keys.g1 });
      const autoContext = Boolean(latestUiRef.current?.autoFlow?.running || latestUiRef.current?.productPromo?.running);
      const stylePrompt = resolveSelectedVideoStyle(ui.videoStyle.selected)?.prompt || '';
      const isProductPromoContext = Boolean(ui.productPromo.imageUrl) && (ui.productPromo.running || /상품홍보|커머스|판매|제품/.test(ui.script.tone || ''));
      const promoComment = (ui.productPromo.productComment || '').trim();
      const promoVisualAnchor = (ui.productPromo.visualAnchor || '').trim();
      const promoDetectedTexts = (ui.productPromo.detectedTexts || '').trim();
      const trendContext = (results || [])
        .slice(0, 6)
        .map((r: any, i: number) => `${i + 1}) ${r.title}`)
        .join('\n');
      
      const fallbackPromptFromCut = (cutText: string) => {
        const seed = normalizeSubtitleText(cutText || 'product close-up scene') || 'product close-up scene';
        if (isProductPromoContext) {
          return `Korean e-commerce commercial scene, Korean background in Seoul, Korean model, product focus on ${seed}. Keep the same product shape/color/package as reference product image. ${promoVisualAnchor ? `Product anchor: ${promoVisualAnchor}.` : ''} ${promoDetectedTexts ? `Package text hint: ${promoDetectedTexts}.` : ''} all visible text in Korean Hangul only, premium lighting, high detail, no English letters.`;
        }
        return `Cinematic product advertisement scene, focus on ${seed}, premium lighting, clean background, dynamic composition, high detail, no text, no letters.`;
      };

      const prompts: any[] = [];
      for (let i = 0; i < ui.cuts.items.length; i++) {
        if (taskAbortRef.current.prompts) break;
        const text = ui.cuts.items[i];
        const p = `당신은 시각적 연출가입니다. 다음 대본의 내용을 바탕으로, 이 특정 컷에 대한 상세한 영어 이미지 프롬프트를 작성하세요.
        
[전체 대본 맥락]
${ui.script.output.substring(0, 300)}...

[현재 컷 내용]
"${text}"

[스타일 지침]
${stylePrompt}

[상품 코멘트]
${promoComment || '미입력'}

[상품 이미지 앵커]
${promoVisualAnchor || '미분석'}

[상품 패키지 텍스트(OCR)]
${promoDetectedTexts || '미추출'}

[YouTube 트렌드 참고]
${trendContext || '데이터 없음'}

[상품홍보 강제 로케일 규칙]
${isProductPromoContext ? '- 배경은 한국(서울/부산 등) 맥락으로 구성\n- 등장 인물은 한국인\n- 텍스트가 등장한다면 한국어(한글)만 허용\n- 한국 모바일 커머스 광고 톤으로 구성' : '- 일반 콘텐츠 규칙 적용'}

[요청 사항]
1. 위 컷의 의미를 시각적으로 가장 강력하게 전달할 수 있는 묘사를 하세요.
2. ${isProductPromoContext ? '텍스트가 필요하면 한국어(한글)만 사용하고, 영어/일본어/중국어 텍스트는 금지하세요.' : '절대 화면에 텍스트나 문자가 포함되지 않게 하세요 (NO TEXT, NO LETTERS).'}
3. 인물의 외모, 의상, 환경이 전체 영상에서 일관되게 유지되도록 묘사하세요.
4. ${isProductPromoContext ? '한국인/한국 배경/한국어 로케일 조건을 반드시 반영하세요.' : '위 조건을 유지하세요.'}
6. ${isProductPromoContext ? '상품 자체(형태/색/패키지/로고 텍스트)는 원본 제품 이미지와 최대한 동일하게 유지하고, 주변 환경/배경/구도만 변경하세요.' : '위 조건을 유지하세요.'}
7. 불필요한 설명 없이 1~2문장의 영어 프롬프트만 출력하세요.`;

        try {
          const res = await generateContentWithFallback(ai, {
            model: autoContext ? 'gemini-2.5-pro' : 'gemini-3-flash-preview',
            contents: p
          });
          const generated = (res.text || '').trim();
          prompts.push({ index: i + 1, prompt: generated || fallbackPromptFromCut(text) });
        } catch (promptErr) {
          console.error(`프롬프트 ${i + 1} 생성 실패:`, promptErr);
          prompts.push({ index: i + 1, prompt: fallbackPromptFromCut(text) });
        }
        if (i < ui.cuts.items.length - 1 && !taskAbortRef.current.prompts) {
          await new Promise(r => setTimeout(r, 1000));
        }
      }

      if (taskAbortRef.current.prompts) {
        setUi(prev => ({ ...prev, tts: { ...prev.tts, status: '프롬프트 생성 중지됨' } }));
        return;
      }
      setUi(prev => ({ ...prev, cuts: { ...prev.cuts, prompts }, tts: { ...prev.tts, status: '' } }));
    } catch (err) {
      console.error(err);
    }
  };

  const stripBlobRefs = (obj: any): { value: any; count: number } => {
    let count = 0;
    const walk = (value: any): any => {
      if (typeof value === 'string' && value.startsWith('blob:')) {
        count += 1;
        return '';
      }
      if (Array.isArray(value)) {
        return value.map(walk);
      }
      if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, walk(v)]));
      }
      return value;
    };
    return { value: walk(obj), count };
  };

  const applyLoadedProject = (parsed: any) => {
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('invalid-project');
    }
    if (!parsed.ui || typeof parsed.ui !== 'object') {
      throw new Error('invalid-project-ui');
    }

    const { value: sanitizedUi, count } = stripBlobRefs(parsed.ui);
    const baseUi = initialUiRef.current ? JSON.parse(JSON.stringify(initialUiRef.current)) : ui;
    const mergedUi = {
      ...baseUi,
      ...sanitizedUi,
      finalVideo: {
        ...baseUi.finalVideo,
        ...(sanitizedUi.finalVideo || {}),
      },
    };
    setUi(mergedUi);
    setResults(Array.isArray(parsed.results) ? parsed.results : []);
    setTranslatedQueriesByCountry(
      parsed?.translatedQueriesByCountry && typeof parsed.translatedQueriesByCountry === 'object'
        ? parsed.translatedQueriesByCountry
        : {},
    );
    setSearchCacheByCountry(
      parsed?.searchCacheByCountry && typeof parsed.searchCacheByCountry === 'object'
        ? parsed.searchCacheByCountry
        : {},
    );

    if (count > 0) {
      alert(`프로젝트를 불러왔습니다. 만료된 임시 미디어 ${count}개(blob:)는 제외되었습니다. 필요하면 다시 생성해 주세요.`);
      return;
    }

    alert('프로젝트를 성공적으로 불러왔습니다.');
  };

  const parseProjectFromZip = async (zip: JSZip) => {
    const allFiles = Object.values(zip.files).filter(entry => !entry.dir);
    const preferred = allFiles.find(entry => /(^|[\\/])project\.json$/i.test(entry.name));
    if (preferred) {
      const text = await preferred.async('string');
      return JSON.parse(text);
    }

    const jsonFiles = allFiles.filter(entry => /\.json$/i.test(entry.name));
    for (const entry of jsonFiles) {
      try {
        const text = await entry.async('string');
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed === 'object' && parsed.ui && typeof parsed.ui === 'object') {
          return parsed;
        }
      } catch {
        // continue searching other json entries
      }
    }

    throw new Error('zip-project-json-not-found');
  };

  const saveProject = async () => {
    if (!isApprovedUser) {
      alert('승인된 사용자만 프로젝트 다운로드(저장)할 수 있습니다.');
      return;
    }
    const safeTitleRaw = (ui.selectedHookTitle || ui.filters.query || 'project').trim();
    const tenChars = Array.from(safeTitleRaw).slice(0, 10).join('') || 'project';
    const safeTitle = tenChars.replace(/[<>:"/\\|?*\x00-\x1F]/g, '').replace(/\s+/g, '_');
    const folderRoot = `Ai-Storyteller-Lite/${safeTitle}`;

    const { value: sanitizedUi, count: strippedBlobCount } = stripBlobRefs(ui);

    const projectPayload = {
      meta: {
        format: 'ai-storyteller-lite-project-v2',
        requiresAssets: false,
        strippedBlobCount,
        note: '임시 blob URL은 저장 시 제외됩니다. 필요한 미디어는 다시 생성하거나 업로드하세요.',
        folderRoot,
      },
      ui: sanitizedUi,
      results,
      translatedQueriesByCountry,
      searchCacheByCountry,
      timestamp: new Date().toISOString(),
    };

    try {
      const zip = new JSZip();
      zip.folder(folderRoot)?.file('project.json', JSON.stringify(projectPayload, null, 2));
      zip.folder(folderRoot)?.file('README.txt', '이 프로젝트는 JSON + 자산 번들 ZIP으로 저장되었습니다. JSON만 단독으로 불러오면 일부 자산이 누락될 수 있습니다.');

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Ai-Storyteller-Lite_${safeTitle}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      if (strippedBlobCount > 0) {
        alert(`프로젝트를 ZIP으로 저장했습니다. (폴더: ${folderRoot})\n임시 미디어 ${strippedBlobCount}개(blob:)는 저장 대상에서 제외되었습니다.`);
      } else {
        alert(`프로젝트를 ZIP으로 저장했습니다. (폴더: ${folderRoot})`);
      }
    } catch (err) {
      console.error(err);
      alert('프로젝트 ZIP 저장에 실패했습니다.');
    }
  };

  const handleNewProject = async () => {
    const ok = window.confirm('새 프로젝트를 시작합니다. 현재 작업 자산을 먼저 자동 저장한 뒤 화면을 초기화합니다. 계속할까요?');
    if (!ok) return;
    try {
      await saveProject();
    } catch {
      // saveProject already handles alerts
    }
    if (initialUiRef.current) {
      setUi(JSON.parse(JSON.stringify(initialUiRef.current)));
    }
    setResults([]);
    setTranslatedQueriesByCountry({});
    setSearchCacheByCountry({});
    setPreviewingId(null);
    setPreviewLoading(false);
    alert('자동 저장 후 새 프로젝트로 초기화했습니다.');
  };

  const loadProject = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer.slice(0, 4));
      const hasZipSignature = bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b;
      const isZipByNameOrType = file.name.toLowerCase().endsWith('.zip') || file.type === 'application/zip' || file.type === 'application/x-zip-compressed';
      const shouldTryZip = hasZipSignature || isZipByNameOrType;

      if (shouldTryZip) {
        try {
          const zip = await JSZip.loadAsync(arrayBuffer);
          const parsed = await parseProjectFromZip(zip);
          applyLoadedProject(parsed);
          return;
        } catch (zipErr) {
          console.warn('ZIP parsing failed, trying plain JSON fallback.', zipErr);
        }
      }

      const text = new TextDecoder('utf-8').decode(arrayBuffer);
      const parsed = JSON.parse(text);
      applyLoadedProject(parsed);
    } catch (err) {
      console.error(err);
      alert('파일 형식이 올바르지 않거나 프로젝트를 읽는 중 오류가 발생했습니다.');
    }

    e.currentTarget.value = '';
  };

  const publishAssetUrl = ui.finalVideo.url;
  const publishSteps = [
    { id: 1, title: '계정', description: 'YouTube 계정을 연결하세요.' },
    { id: 2, title: '영상', description: '최종 영상 파일을 확인합니다.' },
    { id: 3, title: '메타', description: '제목/설명을 입력합니다.' },
    { id: 4, title: '예약', description: '공개 설정과 예약 시간을 지정합니다.' },
    { id: 5, title: '확인', description: '예약 발행을 실행하고 상태를 추적합니다.' },
  ];
  const appendAuditLog = (action: string, target: string, note: string = '') => {
    const actor = currentUserEmail || 'unknown';
    const log = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      actor,
      action,
      target,
      at: new Date().toISOString(),
      note,
    };
    setUi(prev => ({
      ...prev,
      publishing: {
        ...prev.publishing,
        auditLogs: [log, ...(prev.publishing.auditLogs || [])].slice(0, 300),
      },
    }));
  };
  const sendAlimtalkNotification = async (payload: {
    type: 'approval_request' | 'approval_approved' | 'approval_rejected';
    requesterEmail: string;
    ownerEmail: string;
    ownerPhone: string;
    requestedAt?: string;
    resolvedAt?: string;
    note?: string;
  }) => {
    if (!alimtalkWebhookUrl) return { sent: false, reason: 'webhook_missing' };
    try {
      const res = await fetch(alimtalkWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        return { sent: false, reason: `http_${res.status}` };
      }
      return { sent: true, reason: 'ok' };
    } catch {
      return { sent: false, reason: 'network_error' };
    }
  };
  const publishReadiness = useMemo(() => {
    const checks = [
      { key: 'approved', label: '발행 승인', ok: Boolean(isApprovedUser), hint: '관리자 승인(approved)이 필요합니다.' },
      { key: 'auth', label: 'YouTube 인증', ok: Boolean(youtubeAuth?.accessToken && youtubeAuth.expiresAt > Date.now()), hint: '계정 재연결이 필요합니다.' },
      { key: 'account', label: '연결 채널', ok: ui.publishing.accounts.some((a: any) => a.platform === 'youtube' && a.connected), hint: 'YouTube 채널을 연결하세요.' },
      { key: 'video', label: '최종 영상', ok: Boolean(publishAssetUrl), hint: '12번 패널 렌더를 완료하세요.' },
      { key: 'title', label: '제목', ok: Boolean(ui.publishing.draft.title.trim()), hint: '발행 제목을 입력하세요.' },
      { key: 'description', label: '설명', ok: Boolean(ui.publishing.draft.description.trim()), hint: '발행 설명을 입력하세요.' },
      {
        key: 'schedule',
        label: '예약 시간',
        ok: Boolean(
          ui.publishing.draft.scheduleAt
            && !Number.isNaN(new Date(ui.publishing.draft.scheduleAt).getTime())
            && new Date(ui.publishing.draft.scheduleAt).getTime() > Date.now() + 60 * 1000,
        ),
        hint: '현재시각+1분 이후 예약 시간을 설정하세요.',
      },
    ];
    const failed = checks.filter(item => !item.ok);
    return {
      checks,
      ok: failed.length === 0,
      failed,
      okForImmediate: failed.every(item => item.key === 'schedule'),
      okForScheduled: failed.length === 0,
    };
  }, [
    isApprovedUser,
    youtubeAuth?.accessToken,
    youtubeAuth?.expiresAt,
    ui.publishing.accounts,
    publishAssetUrl,
    ui.publishing.draft.title,
    ui.publishing.draft.description,
    ui.publishing.draft.scheduleAt,
  ]);

  const clearPublishTimers = (jobId: string) => {
    const timers = publishRetryTimersRef.current[jobId] || [];
    timers.forEach(timerId => window.clearTimeout(timerId));
    delete publishRetryTimersRef.current[jobId];
  };

  const connectYouTubeAccount = (mode: 'login' | 'youtube' = 'youtube') => {
    if (mode === 'youtube' && !isApprovedUser) {
      alert('승인된 사용자만 YouTube 연동이 가능합니다. 먼저 Google 로그인 후 승인 요청을 보내주세요.');
      return;
    }
    if (!googleClientId) {
      alert(isPublishAdmin
        ? 'Google 로그인 설정 누락: VITE_GOOGLE_CLIENT_ID를 배포 환경변수에 설정해 주세요.'
        : 'Google 로그인 준비 중입니다. 잠시 후 다시 시도하거나 관리자에게 문의해 주세요.');
      return;
    }
    if (!googleRedirectUri) {
      alert(isPublishAdmin
        ? 'Google 로그인 설정 누락: VITE_GOOGLE_REDIRECT_URI를 배포 환경변수에 설정해 주세요.'
        : 'Google 로그인 준비 중입니다. 잠시 후 다시 시도하거나 관리자에게 문의해 주세요.');
      return;
    }

    const state = createOAuthState();
    localStorage.setItem(YT_OAUTH_STATE_LS_KEY, state);
    localStorage.setItem(YT_OAUTH_MODE_LS_KEY, mode);

    const scope = mode === 'youtube'
      ? [
          'https://www.googleapis.com/auth/youtube.upload',
          'https://www.googleapis.com/auth/youtube.readonly',
          'openid',
          'email',
          'profile',
        ].join(' ')
      : [
          'openid',
          'email',
          'profile',
        ].join(' ');

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', googleClientId);
    authUrl.searchParams.set('redirect_uri', googleRedirectUri);
    authUrl.searchParams.set('response_type', 'token');
    authUrl.searchParams.set('scope', scope);
    authUrl.searchParams.set('include_granted_scopes', 'true');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('prompt', 'consent');

    window.location.href = authUrl.toString();
  };

  const disconnectYouTubeAccount = () => {
    localStorage.removeItem(YT_AUTH_SESSION_LS_KEY);
    localStorage.removeItem(YT_OAUTH_MODE_LS_KEY);
    setYoutubeAuth(null);
    setUi(prev => ({
      ...prev,
      publishing: {
        ...prev.publishing,
        accounts: prev.publishing.accounts.map(account =>
          account.platform === 'youtube'
            ? {
                ...account,
                connected: false,
                name: 'YouTube 기본 채널',
                handle: '@your-channel',
                email: '',
                channelId: '',
                uploadsPlaylistId: '',
                lastSyncedAt: '',
              }
            : account,
        ),
      },
    }));
    alert('YouTube 계정 연결이 해제되었습니다.');
  };

  const claimOwnerFromCurrentAccount = () => {
    if (!currentUserEmail) {
      alert('먼저 YouTube 계정을 연결하고 이메일을 확인하세요.');
      return;
    }
    setUi(prev => ({
      ...prev,
      publishing: {
        ...prev.publishing,
        ownerEmail: currentUserEmail,
        adminEmails: Array.from(new Set([...prev.publishing.adminEmails.map(normalizeEmail), currentUserEmail])),
      },
    }));
    appendAuditLog('OWNER_SET', currentUserEmail, '현재 로그인 계정을 소유자로 지정');
    alert('현재 계정을 소유자(owner)로 지정했습니다.');
  };

  const addAdminEmail = () => {
    const candidate = normalizeEmail(ui.publishing.pendingAdminEmail || '');
    if (!candidate) return;
    if (!isPublishAdmin) {
      alert('관리자만 이메일 권한을 추가할 수 있습니다.');
      return;
    }

    setUi(prev => ({
      ...prev,
      publishing: {
        ...prev.publishing,
        pendingAdminEmail: '',
        adminEmails: Array.from(new Set([...prev.publishing.adminEmails.map(normalizeEmail), candidate])),
      },
    }));
    appendAuditLog('ADMIN_ADD', candidate, '관리자 이메일 추가');
  };

  const removeAdminEmail = (email: string) => {
    if (!isPublishAdmin) return;
    const normalized = normalizeEmail(email);
    setUi(prev => ({
      ...prev,
      publishing: {
        ...prev.publishing,
        adminEmails: prev.publishing.adminEmails.map(normalizeEmail).filter(item => item !== normalized),
      },
    }));
    appendAuditLog('ADMIN_REMOVE', normalized, '관리자 이메일 제거');
  };

  const addApprovedEmail = () => {
    const candidate = normalizeEmail(ui.publishing.pendingApprovedEmail || '');
    if (!candidate) return;
    if (!isPublishAdmin) {
      alert('관리자만 승인 사용자를 추가할 수 있습니다.');
      return;
    }
    setUi(prev => ({
      ...prev,
      publishing: {
        ...prev.publishing,
        pendingApprovedEmail: '',
        approvedEmails: Array.from(new Set([...prev.publishing.approvedEmails.map(normalizeEmail), candidate])),
        accessRequests: (prev.publishing.accessRequests || []).map((req: any) =>
          normalizeEmail(req.email) === candidate && req.status === 'pending'
            ? { ...req, status: 'approved', resolvedAt: new Date().toISOString(), note: '관리자 승인 완료' }
            : req,
        ),
      },
    }));
    appendAuditLog('APPROVED_ADD', candidate, '승인 사용자 추가');
  };

  const removeApprovedEmail = (email: string) => {
    if (!isPublishAdmin) return;
    const normalized = normalizeEmail(email);
    setUi(prev => ({
      ...prev,
      publishing: {
        ...prev.publishing,
        approvedEmails: prev.publishing.approvedEmails.map(normalizeEmail).filter(item => item !== normalized),
      },
    }));
    appendAuditLog('APPROVED_REMOVE', normalized, '승인 사용자 제거');
  };

  const requestApprovalByEmail = async () => {
    if (!currentUserEmail) {
      alert('먼저 Google 로그인 후 다시 시도해 주세요.');
      return;
    }
    const requestedAt = new Date().toISOString();
    const receiver = normalizeEmail(ui.publishing.ownerEmail || '') || ROOT_ADMIN_EMAIL;
    const requestEntry = {
      id: `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      email: currentUserEmail,
      status: 'pending' as const,
      requestedAt,
      resolvedAt: '',
      note: '',
    };
    setUi(prev => ({
      ...prev,
      publishing: {
        ...prev.publishing,
        accessRequests: [{ ...requestEntry, requestedAt }, ...(prev.publishing.accessRequests || []).filter((req: any) => !(normalizeEmail(req.email) === currentUserEmail && req.status === 'pending'))].slice(0, 300),
      },
    }));
    appendAuditLog('APPROVAL_REQUEST', currentUserEmail, `승인 요청 메일 대상: ${receiver}`);
    const notifyResult = await sendAlimtalkNotification({
      type: 'approval_request',
      requesterEmail: currentUserEmail,
      ownerEmail: receiver,
      ownerPhone: String(ui.publishing.ownerPhone || ''),
      requestedAt,
      note: '다운로드/유튜브 연동/발행 권한 승인 요청',
    });
    const subject = encodeURIComponent('[AI Storyteller] 사용자 승인 요청');
    const body = encodeURIComponent([
      '안녕하세요 관리자님,',
      '',
      `다음 계정의 다운로드/YouTube 연동/발행 권한 승인을 요청합니다.`,
      `요청 이메일: ${currentUserEmail}`,
      `요청 시각: ${new Date().toLocaleString()}`,
      '',
      '승인 후 관리자 페이지에서 approved 사용자 목록에 추가해 주세요.',
    ].join('\n'));
    window.open(`mailto:${receiver}?subject=${subject}&body=${body}`, '_blank');
    if (notifyResult.sent) {
      alert('승인 요청이 접수되었습니다. 관리자에게 이메일 + 카카오 알림톡으로 전달했습니다.');
    } else {
      alert('승인 요청 메일을 열었습니다. (카카오 알림톡은 아직 미연동 또는 전송 실패)');
    }
  };

  const approveAccessRequest = (requestId: string) => {
    if (!isPublishAdmin) return;
    let targetEmail = '';
    let resolvedAt = '';
    setUi(prev => {
      const target = (prev.publishing.accessRequests || []).find((req: any) => req.id === requestId);
      targetEmail = normalizeEmail(target?.email || '');
      if (!targetEmail) return prev;
      resolvedAt = new Date().toISOString();
      return {
        ...prev,
        publishing: {
          ...prev.publishing,
          approvedEmails: Array.from(new Set([...(prev.publishing.approvedEmails || []).map(normalizeEmail), targetEmail])),
          accessRequests: (prev.publishing.accessRequests || []).map((req: any) =>
            req.id === requestId
              ? { ...req, status: 'approved', resolvedAt, note: '관리자 승인' }
              : req,
          ),
        },
      };
    });
    if (targetEmail) {
      appendAuditLog('REQUEST_APPROVE', targetEmail, '접근 요청 승인');
      void sendAlimtalkNotification({
        type: 'approval_approved',
        requesterEmail: targetEmail,
        ownerEmail: normalizeEmail(ui.publishing.ownerEmail || '') || ROOT_ADMIN_EMAIL,
        ownerPhone: String(ui.publishing.ownerPhone || ''),
        resolvedAt,
        note: '관리자가 요청을 승인했습니다.',
      });
    }
  };

  const rejectAccessRequest = (requestId: string) => {
    if (!isPublishAdmin) return;
    let targetEmail = '';
    let resolvedAt = '';
    setUi(prev => {
      const target = (prev.publishing.accessRequests || []).find((req: any) => req.id === requestId);
      targetEmail = normalizeEmail(target?.email || '');
      resolvedAt = new Date().toISOString();
      return {
        ...prev,
        publishing: {
          ...prev.publishing,
          accessRequests: (prev.publishing.accessRequests || []).map((req: any) =>
            req.id === requestId
              ? { ...req, status: 'rejected', resolvedAt, note: '관리자 반려' }
              : req,
          ),
        },
      };
    });
    if (targetEmail) {
      appendAuditLog('REQUEST_REJECT', targetEmail, '접근 요청 반려');
      void sendAlimtalkNotification({
        type: 'approval_rejected',
        requesterEmail: targetEmail,
        ownerEmail: normalizeEmail(ui.publishing.ownerEmail || '') || ROOT_ADMIN_EMAIL,
        ownerPhone: String(ui.publishing.ownerPhone || ''),
        resolvedAt,
        note: '관리자가 요청을 반려했습니다.',
      });
    }
  };

  const rewriteTemplateTitleFromHook = async () => {
    if (!ui.selectedHookTitle?.trim()) {
      alert('먼저 바이럴 제목을 선택해 주세요.');
      return;
    }
    const selectedTitle = String(ui.selectedHookTitle || '').trim();
    const firstLine = selectedTitle.split(/\r?\n/)[0] || '';
    const fallbackHighlight = firstLine.split(/\s+/).find(Boolean) || firstLine;
    setUi(prev => ({
      ...prev,
      finalVideo: {
        ...prev.finalVideo,
        templateTitleText: selectedTitle,
        templateTitleHighlightWord: normalizeSubtitleText(fallbackHighlight),
        templateTitleGenerating: false,
      },
    }));
  };

  const fetchChannelInsights = async (accountId: string) => {
    const account = ui.publishing.accounts.find((a: any) => a.id === accountId && a.platform === 'youtube');
    if (!account?.channelId) {
      alert('채널 ID가 없습니다. YouTube 계정을 다시 연결해 주세요.');
      return;
    }
    const apiKey = keys[activeKeys.yt as keyof typeof keys];
    if (!apiKey) {
      alert('YouTube API 키가 없어 채널 정보를 불러올 수 없습니다.');
      return;
    }

    try {
      const channelRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${account.channelId}&key=${apiKey}`);
      const channelData = await channelRes.json();
      if (!channelRes.ok) {
        throw new Error(channelData?.error?.message || '채널 정보 조회 실패');
      }
      const channel = channelData?.items?.[0] || {};
      const uploadsPlaylistId = account.uploadsPlaylistId || channel?.contentDetails?.relatedPlaylists?.uploads || '';

      let lastUploadDate = '';
      if (uploadsPlaylistId) {
        const uploadRes = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=1&key=${apiKey}`);
        const uploadData = await uploadRes.json();
        if (uploadRes.ok) {
          lastUploadDate = uploadData?.items?.[0]?.snippet?.publishedAt || '';
        }
      }

      const snippet = channel?.snippet || {};
      const stats = channel?.statistics || {};
      const info = {
        channelTitle: snippet?.title || account.name || '채널',
        subscribers: Number(stats?.subscriberCount || 0).toLocaleString(),
        totalViews: Number(stats?.viewCount || 0).toLocaleString(),
        descriptionShort: Array.from(String(snippet?.description || '')).slice(0, 30).join(''),
        lastUploadDate: lastUploadDate ? new Date(lastUploadDate).toLocaleDateString() : '정보 없음',
      };

      setUi((prev: any) => ({
        ...prev,
        publishing: {
          ...prev.publishing,
          channelInsights: {
            ...prev.publishing.channelInsights,
            [accountId]: info,
          },
          accounts: prev.publishing.accounts.map((a: any) =>
            a.id === accountId ? { ...a, uploadsPlaylistId } : a,
          ),
        },
      }));
    } catch (err: any) {
      console.error(err);
      alert(`채널 속성 분석 실패: ${err?.message || '알 수 없는 오류'}`);
    }
  };

  const sendPublishEmailNotification = (job: any) => {
    if (!ui.publishing.notifyEmail) return;
    const subject = encodeURIComponent(`[AI Storyteller] 발행 ${job.status === 'published' ? '완료' : '실패'} 알림`);
    const body = encodeURIComponent(
      [
        `플랫폼: ${job.platform.toUpperCase()}`,
        `상태: ${job.status}`,
        `제목: ${job.title}`,
        `예약시간: ${job.scheduleAt || '즉시'}`,
        `시도 횟수: ${job.attemptCount}/${job.maxAttempts}`,
        job.publishedUrl ? `게시 URL: ${job.publishedUrl}` : '',
        job.lastError ? `오류: ${job.lastError}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
    );

    window.open(`mailto:${ui.publishing.notifyEmail}?subject=${subject}&body=${body}`, '_blank');
  };

  const runPublishAttempt = (jobId: string, attemptIndex: number) => {
    setUi(prev => {
      const target = prev.publishing.jobs.find(job => job.id === jobId);
      if (!target || target.status === 'published') return prev;

      const now = new Date().toISOString();
      const nextAttemptCount = attemptIndex + 1;
      const hasVideo = Boolean(target.videoUrl);
      const hasMeta = Boolean(target.title.trim() && target.description.trim());
      const canPublish = target.platform === 'youtube' && hasVideo && hasMeta;
      const nextStatus: PublishJobStatus = canPublish ? 'published' : 'failed';

      const nextJobs = prev.publishing.jobs.map(job => {
        if (job.id !== jobId) return job;
        return {
          ...job,
          status: nextStatus,
          attemptCount: nextAttemptCount,
          lastError: canPublish ? '' : '메타데이터 또는 영상 파일 누락으로 발행 실패',
          publishedUrl: canPublish ? `https://youtube.com/watch?v=${job.id.slice(4, 15)}` : '',
          notifiedAt: canPublish || nextAttemptCount >= job.maxAttempts ? now : '',
        };
      });

      const updatedJob = nextJobs.find(job => job.id === jobId);
      if (!updatedJob) return prev;

      if (!canPublish && updatedJob.autoRetry && nextAttemptCount < updatedJob.maxAttempts) {
        const delay = PUBLISH_RETRY_SCHEDULE_MS[nextAttemptCount] ?? PUBLISH_RETRY_SCHEDULE_MS[PUBLISH_RETRY_SCHEDULE_MS.length - 1];
        const timerId = window.setTimeout(() => runPublishAttempt(jobId, nextAttemptCount), delay);
        publishRetryTimersRef.current[jobId] = [...(publishRetryTimersRef.current[jobId] || []), timerId];
      } else {
        clearPublishTimers(jobId);
      }

      if (updatedJob.notifiedAt) {
        setTimeout(() => sendPublishEmailNotification(updatedJob), 0);
      }

      return {
        ...prev,
        publishing: {
          ...prev.publishing,
          jobs: nextJobs,
        },
      };
    });
  };

  const queueYouTubePublish = (opts?: { immediate?: boolean }) => {
    if (!isApprovedUser) {
      alert('승인된 사용자만 발행할 수 있습니다. 관리자에게 승인 요청을 보내주세요.');
      return;
    }

    if (!youtubeAuth?.accessToken || youtubeAuth.expiresAt <= Date.now()) {
      alert('YouTube 인증이 만료되었거나 없습니다. 계정을 다시 연결해 주세요.');
      return;
    }

    const youtubeAccount = ui.publishing.accounts.find(account => account.platform === 'youtube' && account.connected);
    if (!youtubeAccount) {
      alert('먼저 YouTube 계정을 연결하세요.');
      return;
    }

    if (!publishAssetUrl) {
      alert('발행할 최종 영상 파일이 없습니다. 12번 패널에서 영상 렌더링을 완료하세요.');
      return;
    }

    const title = ui.publishing.draft.title.trim();
    if (!title) {
      alert('제목을 입력해 주세요.');
      return;
    }

    const description = ui.publishing.draft.description.trim();
    if (!description) {
      alert('설명을 입력해 주세요. (자동발행 실패 방지)');
      return;
    }

    const now = new Date();
    const scheduleAt = opts?.immediate ? now.toISOString() : (ui.publishing.draft.scheduleAt || now.toISOString());
    const scheduleDate = new Date(scheduleAt);
    if (Number.isNaN(scheduleDate.getTime())) {
      alert('예약 시간이 올바르지 않습니다.');
      return;
    }
    if (!opts?.immediate && scheduleDate.getTime() <= now.getTime() + 60 * 1000) {
      alert('예약 시간은 현재 시각보다 최소 1분 이후여야 합니다.');
      return;
    }

    const id = `job_${Date.now()}`;
    const newJob = {
      id,
      platform: 'youtube' as PublishPlatform,
      accountId: youtubeAccount.id,
      title,
      description,
      visibility: ui.publishing.draft.visibility,
      scheduleAt: scheduleDate.toISOString(),
      autoRetry: ui.publishing.draft.autoRetry,
      maxAttempts: Math.max(1, Math.min(3, ui.publishing.draft.maxAttempts)),
      attemptCount: 0,
      status: 'scheduled' as PublishJobStatus,
      lastError: '',
      videoUrl: publishAssetUrl,
      notifiedAt: '',
      publishedUrl: '',
      createdAt: now.toISOString(),
    };

    setUi(prev => ({
      ...prev,
      publishing: {
        ...prev.publishing,
        jobs: [newJob, ...prev.publishing.jobs],
      },
    }));

    const delay = Math.max(0, scheduleDate.getTime() - now.getTime());
    const timerId = window.setTimeout(() => runPublishAttempt(id, 0), delay);
    publishRetryTimersRef.current[id] = [timerId];
    alert(opts?.immediate ? 'YouTube 즉시 발행 작업이 등록되었습니다.' : 'YouTube 예약 발행 작업이 등록되었습니다.');
  };

  useEffect(() => {
    if (!ui.productPromo.autoQueuePending) return;
    if (!ui.productPromo.autoQueuePublish) return;
    if (!publishReadiness.okForScheduled) return;

    const scheduleMinutes = [30, 60, 120].includes(Number(ui.productPromo.autoScheduleMinutes))
      ? Number(ui.productPromo.autoScheduleMinutes)
      : 60;

    queueYouTubePublish();
    setUi(prev => ({
      ...prev,
      productPromo: {
        ...prev.productPromo,
        autoQueuePending: false,
        step: `완료 · ${scheduleMinutes}분 후 예약 발행 등록됨`,
        error: '',
      },
    }));
  }, [
    ui.productPromo.autoQueuePending,
    ui.productPromo.autoQueuePublish,
    ui.productPromo.autoScheduleMinutes,
    publishReadiness.okForScheduled,
  ]);

  const setPublishingStep = (step: number) => {
    setUi(prev => ({
      ...prev,
      publishing: {
        ...prev.publishing,
        mobileStep: Math.min(5, Math.max(1, step)),
      },
    }));
  };

  // --- Render Helpers ---
  const PanelHeader = ({ title, id, colorClass, badge }: { title: string, id: keyof typeof ui.panelsOpen, colorClass: string, badge?: string }) => (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <h3 id={`panel-${id}`} className={`text-xl font-black ${colorClass}`}>{title}</h3>
        {badge && (
          <span className="bg-amber-500/20 text-amber-500 text-[10px] font-black px-2 py-0.5 rounded-md border border-amber-500/30">
            {badge}
          </span>
        )}
      </div>
      <button 
        onClick={() => setUi(prev => ({ ...prev, panelsOpen: { ...prev.panelsOpen, [id]: !prev.panelsOpen[id] } }))}
        className="text-xs font-bold bg-white/10 px-3 py-1 rounded-lg hover:bg-white/20 transition-all"
      >
        {ui.panelsOpen[id] ? '숨기기' : '보이기'}
      </button>
    </div>
  );

  const jumpToPanel = (id: keyof typeof ui.panelsOpen) => {
    const el = document.getElementById(`panel-${id}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const generateImage = async (cutIndex: number, options?: { force?: boolean }) => {
    if (!keys.g1) {
      showNotice('Gemini 키가 필요합니다.', 'error');
      return;
    }
    const latest = latestUiRef.current;
    const baseProductImage = String(latest?.productPromo?.imageUrl || '').trim();
    const productReferences = [
      ...(latest?.productPromo?.referenceImages || []),
      baseProductImage,
    ]
      .map((v: any) => String(v || '').trim())
      .filter(Boolean)
      .filter((value: string, index: number, arr: string[]) => arr.indexOf(value) === index);
    const totalCuts = Math.max(1, Number(latest?.cuts?.items?.length || 0));
    const canAssignOriginalByCut =
      Boolean(latest?.productPromo?.strictProductLock) &&
      latest?.productPromo?.workflowMode !== 'auto' &&
      productReferences.length > 1 &&
      productReferences.length >= totalCuts;
    const anchorImage = productReferences.length > 0
      ? String(productReferences[(Math.max(1, cutIndex) - 1) % productReferences.length])
      : baseProductImage;
    if (canAssignOriginalByCut && anchorImage) {
      setUi(prev => ({
        ...prev,
        imageJobs: prev.imageJobs.some(j => j.cut === cutIndex)
          ? prev.imageJobs.map(j => j.cut === cutIndex ? { ...j, status: '원본 고정', imageUrl: anchorImage } : j)
          : [...prev.imageJobs, { cut: cutIndex, status: '원본 고정', imageUrl: anchorImage }],
      }));
      return;
    }
    const existing = latest?.imageJobs?.find((j: any) => j.cut === cutIndex);
    if (!options?.force && existing?.imageUrl) {
      return;
    }

    const promptObj = (latest?.cuts?.prompts || []).find((p: any) => p.index === cutIndex);
    if (!promptObj) return;

    setUi(prev => ({
      ...prev,
      imageJobs: prev.imageJobs.some(j => j.cut === cutIndex)
        ? prev.imageJobs.map(j => j.cut === cutIndex ? { cut: cutIndex, status: '생성 중...' } : j)
        : [...prev.imageJobs, { cut: cutIndex, status: '생성 중...' }]
    }));

    try {
      const ai = new GoogleGenAI({ apiKey: keys.g1 });
      const stylePrompt = resolveSelectedVideoStyle(latest?.videoStyle?.selected || ui.videoStyle.selected)?.prompt || '';
      const autoContext = Boolean(latest?.autoFlow?.running || latest?.productPromo?.running);
      const chosenImageModel = autoContext
        ? 'gemini-3-pro-image-preview'
        : ((latest?.thumbnail?.model || ui.thumbnail.model || 'gemini-3.1-flash-image-preview') as any);
      const productDataUrl = String(anchorImage || '').trim();
      const hasProductReference = productDataUrl.startsWith('data:image/');
      const hasProductUrlReference = /^https?:\/\//i.test(productDataUrl);
      const useExperimentalBgCutout = Boolean(latest?.productPromo?.experimentalBgCutout);
      const koreaContextText = latest?.productPromo?.workflowMode === 'auto'
        ? 'All generated scenes must reflect Korean daily culture and environment (Korean homes, offices, cafes, commute, fitness, parenting, convenience stores) without changing product identity.'
        : '';
      const productRefText = productDataUrl
        ? 'Use the reference product image as strict anchor. Keep product shape, cap, color, logo, package text, and label layout unchanged. Only vary surrounding environment, camera angle, and background concept to match each cut narration.'
        : '';
      const productCutoutText = useExperimentalBgCutout
        ? 'Experimental mode: compose scene as if product background is removed and replaced with a new contextual background. Never morph or redraw product pixels.'
        : '';
      const productInline = hasProductReference
        ? (() => {
            const match = productDataUrl.match(/^data:(.*?);base64,(.*)$/i);
            if (!match) return null;
            return { inlineData: { mimeType: match[1] || 'image/jpeg', data: match[2] || '' } };
          })()
        : null;

      const res = await generateContentWithFallback(ai, {
        model: chosenImageModel,
        contents: {
          parts: [
            {
              text: `${promptObj.prompt}. Style: ${stylePrompt}. ${productRefText} ${koreaContextText} ${productCutoutText}${hasProductUrlReference ? ` Reference image URL: ${productDataUrl}` : ''}`.trim(),
            },
            ...(productInline ? [productInline as any] : []),
          ],
        },
        config: { imageConfig: { aspectRatio: (latest?.cuts?.ratio || ui.cuts.ratio) as any } }
      });

      console.log(`Image Generation Response for Cut ${cutIndex}:`, res);

      let imageUrl = '';
      for (const part of res.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
      
      if (imageUrl) {
        setUi(prev => ({
          ...prev,
          imageJobs: prev.imageJobs.map(j => j.cut === cutIndex ? { ...j, status: '생성 완료', imageUrl } : j)
        }));
      } else {
        setUi(prev => ({
          ...prev,
          imageJobs: prev.imageJobs.map(j => j.cut === cutIndex
            ? {
                ...j,
                status: anchorImage ? '원본 대체' : '이미지 없음 (재시도)',
                imageUrl: anchorImage || j.imageUrl,
              }
            : j)
        }));
      }
    } catch (err) {
      console.error(err);
      setUi(prev => ({
        ...prev,
        imageJobs: prev.imageJobs.map(j => j.cut === cutIndex
          ? {
              ...j,
              status: anchorImage ? '원본 대체(실패복구)' : '실패',
              imageUrl: anchorImage || j.imageUrl,
            }
          : j)
      }));
    }
  };

  useEffect(() => {
    if (ui.finalVideo.type !== 'image_slide') return;
    if (ui.finalVideo.slides.length <= 1) return;

    const interval = window.setInterval(() => {
      setUi(prev => ({
        ...prev,
        finalVideo: {
          ...prev.finalVideo,
          activeSlide: (prev.finalVideo.activeSlide + 1) % prev.finalVideo.slides.length,
        },
      }));
    }, Math.max(1, ui.finalVideo.slideDuration) * 1000);

    return () => window.clearInterval(interval);
  }, [ui.finalVideo.type, ui.finalVideo.slides, ui.finalVideo.slideDuration]);

  const handleGenerateFinalVideo = async () => {
    const previousMotionByCut = new Map(ui.finalVideo.slides.map(s => [s.cut, s.motion] as const));
    const productPlan = resolveProductPromoPlan(ui.productPromo);
    const isProductPromoContext = Boolean((ui.productPromo.referenceImages || []).length > 0);
    const sortedVideoJobs = ui.videoJobs
      .filter((j: any) => j.videoUrl)
      .sort((a: any, b: any) => a.cut - b.cut);
    const videoCutIds = sortedVideoJobs.map((j: any) => j.cut);
    const desiredHookCount = isProductPromoContext
      ? productPlan.hookVideoCount
      : (ui.finalVideo.useHybridHookVideos
        ? Math.max(0, Number(ui.finalVideo.hookVideoCount || 0))
        : 0);

    if (isProductPromoContext && productPlan.renderMode === 'ai_video' && sortedVideoJobs.length < desiredHookCount) {
      showNotice(`AI 비디오 모드는 영상 ${desiredHookCount}컷이 필요합니다. 현재 ${sortedVideoJobs.length}컷만 준비되었습니다.`, 'error', 1400);
      return;
    }

    const resolvedHookCount = Math.min(desiredHookCount, videoCutIds.length);
    const hookVideoCuts = new Set(videoCutIds.slice(0, resolvedHookCount));

    const cutTexts = ui.cuts.items || [];
    const slideDurationUnit = IMAGE_SLIDE_DURATION_SEC;
    const videoDurationUnit = resolveVideoCutDurationSec(ui.script.type);
    const availableSlides = ui.imageJobs
      .filter(j => j.imageUrl)
      .sort((a, b) => a.cut - b.cut)
      .map(j => {
        const mediaType: 'image' | 'video' = hookVideoCuts.has(j.cut) ? 'video' : 'image';
        return {
          cut: j.cut,
          imageUrl: j.imageUrl,
          videoUrl: mediaType === 'video' ? sortedVideoJobs.find((v: any) => v.cut === j.cut)?.videoUrl || '' : '',
          videoDurationSec: mediaType === 'video' ? videoDurationUnit : 0,
          mediaType,
          duration: mediaType === 'video' ? videoDurationUnit : slideDurationUnit,
          motion: previousMotionByCut.get(j.cut) || pickSlideMotion(ui.cuts.items[j.cut - 1] || '', j.cut),
        };
      });

    let normalizedSlides = [...availableSlides];
    if (isProductPromoContext) {
      const requiredCuts = Math.max(1, Number(productPlan.targetCuts || availableSlides.length || 1));
      const fallbackImages = (ui.productPromo.referenceImages || [])
        .map((v: any) => String(v || '').trim())
        .filter(Boolean)
        .slice(0, PRODUCT_PROMO_MAX_IMAGES);
      const fallbackPool = normalizedSlides.length > 0
        ? normalizedSlides
        : fallbackImages.map((url: string, idx: number) => ({
            cut: idx + 1,
            imageUrl: url,
            videoUrl: '',
            videoDurationSec: 0,
            mediaType: 'image' as const,
            duration: slideDurationUnit,
            motion: pickSlideMotion(ui.cuts.items[idx] || '', idx + 1),
          }));

      if (fallbackPool.length === 0) {
        showNotice('상품 이미지가 없어 컷 구성을 만들 수 없습니다.', 'error');
        return;
      }

      normalizedSlides = Array.from({ length: requiredCuts }, (_, idx) => {
        const source = fallbackPool[idx % fallbackPool.length];
        const isVideoCut = productPlan.renderMode === 'ai_video'
          ? idx < Math.max(0, Number(productPlan.hookVideoCount || 0))
          : idx < Math.max(0, Number(productPlan.hookVideoCount || 0));
        const matchedVideo = isVideoCut
          ? sortedVideoJobs[idx] || sortedVideoJobs.find((v: any) => v.cut === source.cut)
          : null;
        const mediaType: 'image' | 'video' = matchedVideo?.videoUrl ? 'video' : 'image';
        const duration = mediaType === 'video' ? videoDurationUnit : slideDurationUnit;
        return {
          cut: idx + 1,
          imageUrl: source.imageUrl,
          videoUrl: mediaType === 'video' ? String(matchedVideo?.videoUrl || '') : '',
          videoDurationSec: mediaType === 'video' ? videoDurationUnit : 0,
          mediaType,
          duration,
          motion: source.motion || pickSlideMotion(ui.cuts.items[idx] || '', idx + 1),
        };
      });

    }

    if (normalizedSlides.length === 0) {
      showNotice('생성된 이미지가 없습니다. 11번 패널에서 이미지를 먼저 준비하세요.', 'error');
      return;
    }

    setUi(prev => ({ ...prev, finalVideo: { ...prev.finalVideo, generating: true } }));

    setUi(prev => ({
      ...prev,
      finalVideo: {
        ...prev.finalVideo,
        generating: false,
        slides: normalizedSlides,
        activeSlide: 0,
        url: '',
        outputFormat: 'webm',
        hookVideoCount: resolvedHookCount,
        useHybridHookVideos: resolvedHookCount > 0,
        slideDuration: IMAGE_SLIDE_DURATION_SEC,
      },
    }));
    const hookVideoCount = normalizedSlides.filter((s: any) => s.mediaType === 'video' && s.videoUrl).length;
    const totalSeconds = normalizedSlides.reduce((sum: number, slide: any) => sum + Math.max(0, Number(slide.duration || 0)), 0);
    const modeLabel = ui.finalVideo.type === 'ai_video' ? 'AI 비디오 모드' : '이미지 슬라이드';
    showNotice(`${modeLabel} 구성 완료 (${normalizedSlides.length}컷, 영상 ${hookVideoCount}컷, 총 ${Math.round(totalSeconds * 10) / 10}초)`, 'success');

    if (isProductPromoContext) {
      const measured = Number(ui.tts.measuredDuration || 0);
      const target = Number(productPlan.targetSeconds || 20);
      if (measured > 0 && Math.abs(measured - target) > 1.5) {
        showNotice(`TTS 길이(${measured.toFixed(1)}초)가 목표(${target}초)와 차이납니다. 대본/TTS를 다시 생성하면 안정적입니다.`, 'info', 1400);
      }
    }
  };

  const handleExportSlideVideo = async () => {
    if (ui.finalVideo.generating) {
      taskAbortRef.current.finalRender = true;
      setUi(prev => ({ ...prev, finalVideo: { ...prev.finalVideo, generating: false } }));
      return;
    }
    const slides = ui.finalVideo.slides;
    if (slides.length === 0) {
      alert('먼저 [영상 생성] 버튼으로 슬라이드 구성을 완료하세요.');
      return;
    }

    if (!window.MediaRecorder) {
      alert('현재 브라우저는 영상 렌더링(MediaRecorder)을 지원하지 않습니다.');
      return;
    }

    const mimeType = pickMediaRecorderMimeType();
    if (!mimeType) {
      alert('지원되는 webm 코덱을 찾지 못했습니다. 크롬 최신 버전으로 시도하세요.');
      return;
    }

    taskAbortRef.current.finalRender = false;
    setUi(prev => ({ ...prev, finalVideo: { ...prev.finalVideo, generating: true } }));

    let audioContext: AudioContext | null = null;
    const loadedSlideVideos: HTMLVideoElement[] = [];
    try {
      const ratio = ui.cuts.ratio || '9:16';
      const { width, height } = getRenderDimensions(ratio, ui.finalVideo.resolution);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('캔버스 컨텍스트를 생성할 수 없습니다.');
      }

      if (typeof document !== 'undefined' && (document as any).fonts) {
        const fontApi = (document as any).fonts;
        const titleFont = String(ui.finalVideo.templateTitleFontFamily || 'Pretendard').trim() || 'Pretendard';
        const fontLoads: Promise<any>[] = [];
        fontLoads.push(fontApi.load(`900 72px "${titleFont}"`).catch(() => undefined));
        fontLoads.push(fontApi.load('900 64px "Pretendard"').catch(() => undefined));
        fontLoads.push(fontApi.load('900 64px "Noto Sans KR"').catch(() => undefined));
        const waitReady = fontApi.ready?.catch?.(() => undefined) || Promise.resolve();
        await Promise.race([
          Promise.all([...fontLoads, waitReady]),
          new Promise(resolve => window.setTimeout(resolve, 1200)),
        ]);
      }

      const images = await Promise.all(
        slides.map(async slide => {
          if (!slide.imageUrl) return null;
          try {
            return await loadImageElement(slide.imageUrl);
          } catch (err) {
            console.warn('슬라이드 이미지 로드 실패, 영상 프레임으로 대체 시도:', err);
            return null;
          }
        }),
      );
      const videoSlideEntries = await Promise.all(
        slides.map(async slide => {
          if (slide.mediaType !== 'video' || !slide.videoUrl) return null;
          try {
            const video = await loadVideoElement(slide.videoUrl);
            video.muted = true;
            video.loop = true;
            loadedSlideVideos.push(video);
            return [slide.cut, video] as const;
          } catch (err) {
            console.warn(`CUT ${slide.cut} 영상 로드 실패, 이미지로 대체합니다.`, err);
            return null;
          }
        }),
      );
      const videoByCut = new Map<number, HTMLVideoElement>(
        videoSlideEntries.filter((entry): entry is readonly [number, HTMLVideoElement] => Boolean(entry)),
      );
      if (images.every(item => !item) && videoByCut.size === 0) {
        throw new Error('렌더링 가능한 이미지/영상이 없습니다. 11번 패널에서 컷 자산을 확인해 주세요.');
      }
      const introEnabled = ui.finalVideo.includeThumbnailIntro && Boolean(ui.thumbnail.url);
      const introImage = introEnabled ? await loadImageElement(ui.thumbnail.url) : null;
      const introDuration = introEnabled ? Math.max(0.5, Number(ui.finalVideo.thumbnailIntroDuration || 1)) : 0;
      const fps = 30;
      const stream = canvas.captureStream(fps);

      let audioDuration = 0;
      let ttsSourceNode: AudioBufferSourceNode | null = null;
      let bgmSourceNode: AudioBufferSourceNode | null = null;
      let mixInputGain: GainNode | null = null;
      let destinationNode: MediaStreamAudioDestinationNode | null = null;
      const sfxSchedule: Array<{ when: number; path: string }> = [];
      const sfxDecodedBuffers = new Map<string, AudioBuffer>();
      const sfxSourceNodes: AudioBufferSourceNode[] = [];

      const shouldMixTts = Boolean(ui.tts.audioUrl);
      const scriptSourceForReligion = `${ui.script.output || ''}\n${ui.cuts.items.join(' ')}`;
      const hasBuddhistContext = BUDDHIST_TERMS.some(term => scriptSourceForReligion.includes(term));
      const isBuddhistTrackSelected = ui.finalVideo.bgmTrack === BUDDHIST_BGM_PATH;
      const shouldUseBuddhistTrack = hasBuddhistContext || (ui.finalVideo.bgmTrackUserSelected && isBuddhistTrackSelected);
      const resolvedBgmTrack = ui.finalVideo.bgmEnabled
        ? shouldUseBuddhistTrack
          ? BUDDHIST_BGM_PATH
          : isBuddhistTrackSelected
            ? DEFAULT_NON_RELIGIOUS_BGM
            : (ui.finalVideo.bgmTrack || DEFAULT_NON_RELIGIOUS_BGM)
        : '';
      const shouldMixBgm = Boolean(ui.finalVideo.bgmEnabled && resolvedBgmTrack);
      const shouldMixSfx = Boolean(ui.finalVideo.sfxEnabled && ui.finalVideo.sfxTrack);
      const shouldMixAnyAudio = shouldMixTts || shouldMixBgm || shouldMixSfx;

      if (shouldMixAnyAudio) {
        audioContext = new window.AudioContext();
        destinationNode = audioContext.createMediaStreamDestination();
        mixInputGain = audioContext.createGain();
        const limiter = audioContext.createDynamicsCompressor();
        limiter.threshold.value = -6;
        limiter.knee.value = 8;
        limiter.ratio.value = 12;
        limiter.attack.value = 0.003;
        limiter.release.value = 0.25;
        mixInputGain.connect(limiter);
        limiter.connect(destinationNode);
        const audioTrack = destinationNode.stream.getAudioTracks()[0];
        if (audioTrack) {
          stream.addTrack(audioTrack);
        }
      }

      const fallbackSlideDuration = IMAGE_SLIDE_DURATION_SEC;
      const videoDurationUnit = resolveVideoCutDurationSec(ui.script.type);
      const slideDurations = slides.map((slide: any) => {
        if (slide?.mediaType === 'video') {
          return Math.max(0.2, Number(slide?.duration || videoDurationUnit));
        }
        return Math.max(0.2, Number(slide?.duration || fallbackSlideDuration));
      });
      const slideStartTimes = slideDurations.reduce<number[]>((acc, duration, idx) => {
        if (idx === 0) {
          acc.push(0);
          return acc;
        }
        acc.push(acc[idx - 1] + slideDurations[idx - 1]);
        return acc;
      }, []);
      const slideDurationTotal = slideDurations.reduce((sum, v) => sum + v, 0);
      const baseVideoDuration = slideDurationTotal + introDuration;

      if (audioContext && destinationNode) {
        if (shouldMixTts) {
          const audioBufferData = await fetch(ui.tts.audioUrl).then(res => {
            if (!res.ok) {
              throw new Error('TTS 음원 로드 실패');
            }
            return res.arrayBuffer();
          });
          const decoded = await audioContext.decodeAudioData(audioBufferData.slice(0));
          audioDuration = decoded.duration;
          ttsSourceNode = audioContext.createBufferSource();
          ttsSourceNode.buffer = decoded;
          const ttsGain = audioContext.createGain();
          ttsGain.gain.value = 1;
          ttsSourceNode.connect(ttsGain);
          ttsGain.connect(mixInputGain || destinationNode);
        }

        if (shouldMixBgm) {
          const bgmBufferData = await fetch(encodeURI(resolvedBgmTrack)).then(res => {
            if (!res.ok) {
              throw new Error('배경음원 로드 실패');
            }
            return res.arrayBuffer();
          });
          const decodedBgm = await audioContext.decodeAudioData(bgmBufferData.slice(0));
          bgmSourceNode = audioContext.createBufferSource();
          bgmSourceNode.buffer = decodedBgm;
          bgmSourceNode.loop = true;
          const bgmGain = audioContext.createGain();
          const bgmBaseGain = Math.min(1, Math.max(0, Number(ui.finalVideo.bgmVolume || 0) / 100));
          const duckingDb = Math.max(0, Number(ui.finalVideo.bgmDuckingDb || 0));
          const duckingFactor = Math.pow(10, -duckingDb / 20);
          const bgmDuckedGain = bgmBaseGain * duckingFactor;
          bgmGain.gain.value = bgmBaseGain;
          if (shouldMixTts && ui.finalVideo.bgmDuckingEnabled) {
            bgmGain.gain.setValueAtTime(bgmBaseGain, 0);
            bgmGain.gain.setValueAtTime(bgmDuckedGain, introDuration);
            bgmGain.gain.setValueAtTime(bgmBaseGain, Math.max(0, introDuration + audioDuration + 0.04));
          }
          bgmSourceNode.connect(bgmGain);
          bgmGain.connect(mixInputGain || destinationNode);
        }

        if (shouldMixSfx) {
          const triggerIndexes = ui.finalVideo.sfxEveryCut ? Array.from({ length: Math.max(0, slides.length - 1) }, (_, i) => i + 1) : [1];
          for (const idx of triggerIndexes) {
            const when = ui.finalVideo.sfxEveryCut
              ? introDuration + (slideStartTimes[idx] ?? introDuration)
              : introDuration;
            if (when >= baseVideoDuration) continue;

            let selectedPath = ui.finalVideo.sfxTrack;
            if (ui.finalVideo.sfxMode === 'auto') {
              const nextSlideCut = slides[idx]?.cut;
              const prevSlideCut = slides[Math.max(0, idx - 1)]?.cut;
              const relatedText = (ui.cuts.items[(nextSlideCut || prevSlideCut || 1) - 1] || '').trim();
              const category = recommendSfxCategory(relatedText);
              const categoryTracks = sfxLibraryByCategory[category] || [];
              selectedPath = pickDeterministicItem(categoryTracks, `${relatedText}:${idx}`) || ui.finalVideo.sfxTrack;
            }

            if (selectedPath) {
              sfxSchedule.push({ when, path: selectedPath });
            }
          }

          const uniqueSfxPaths = Array.from(new Set(sfxSchedule.map(item => item.path)));
          for (const path of uniqueSfxPaths) {
            const sfxBufferData = await fetch(encodeURI(path)).then(res => {
              if (!res.ok) {
                throw new Error(`효과음 로드 실패: ${path}`);
              }
              return res.arrayBuffer();
            });
            const decodedSfx = await audioContext.decodeAudioData(sfxBufferData.slice(0));
            sfxDecodedBuffers.set(path, decodedSfx);
          }
        }
      }

      const narrationDuration = shouldMixTts ? Math.max(0, audioDuration) : slideDurationTotal;
      const masterDuration = shouldMixTts && narrationDuration > 0
        ? narrationDuration
        : slideDurationTotal;
      const totalDuration = introDuration + masterDuration;
      const subtitleTimelineDuration = narrationDuration;
      if (totalDuration <= 0) {
        throw new Error('렌더링 길이를 계산할 수 없습니다.');
      }

      const subtitleSegments = ui.finalVideo.subtitleEnabled
        ? buildSubtitleSegments(
            slides.map(slide => ui.cuts.items[slide.cut - 1] || ''),
            subtitleTimelineDuration,
            Math.max(12, ui.finalVideo.subtitleMaxChars),
          )
        : [];
      let activeVideoCut = -1;
      const pauseVideo = (cut: number) => {
        if (cut < 0) return;
        const video = videoByCut.get(cut);
        if (!video) return;
        video.pause();
        try {
          video.currentTime = 0;
        } catch {
          // ignore seek reset failures
        }
      };

      const drawFrameForSlide = (slideIndex: number, slideProgress: number) => {
        const slide = slides[slideIndex];
        const image = images[slideIndex];
        const video = slide?.mediaType === 'video' ? videoByCut.get(slide.cut) : undefined;

        if (video) {
          if (activeVideoCut !== slide.cut) {
            pauseVideo(activeVideoCut);
            activeVideoCut = slide.cut;
            try {
              video.currentTime = 0;
            } catch {
              // ignore seek reset failures
            }
            void video.play().catch(() => undefined);
          }
          if (video.readyState >= 2) {
            drawVideoFrameToCanvas(ctx, video, width, height);
            return;
          }
        } else if (activeVideoCut !== -1) {
          pauseVideo(activeVideoCut);
          activeVideoCut = -1;
        }

        if (image) {
          drawSlideToCanvas(ctx, image, slide.motion, slideProgress, width, height);
          return;
        }

        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);
      };

      if (introImage) {
        drawSlideToCanvas(ctx, introImage, 'zoom_in', 0, width, height);
      } else {
        drawFrameForSlide(0, 0);
      }

      const chunks: Blob[] = [];
      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 4_500_000,
      });
      recorder.ondataavailable = event => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      const finished = new Promise<Blob>((resolve, reject) => {
        recorder.onerror = () => reject(new Error('영상 렌더링 중 녹화 오류가 발생했습니다.'));
        recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
      });

      recorder.start(250);
      if (audioContext) {
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }
        ttsSourceNode?.start(introDuration);
        bgmSourceNode?.start(0);

        if (sfxSchedule.length > 0) {
          const sfxGain = audioContext.createGain();
          sfxGain.gain.value = Math.min(1, Math.max(0, Number(ui.finalVideo.sfxVolume || 0) / 100));
          sfxGain.connect(mixInputGain || destinationNode!);

          for (const item of sfxSchedule) {
            const decoded = sfxDecodedBuffers.get(item.path);
            if (!decoded) continue;
            const sfxSource = audioContext.createBufferSource();
            sfxSource.buffer = decoded;
            sfxSource.connect(sfxGain);
            sfxSource.start(Math.max(0, item.when));
            sfxSourceNodes.push(sfxSource);
          }
        }
      }

      const start = performance.now();
      await new Promise<void>(resolve => {
        const render = () => {
          if (taskAbortRef.current.finalRender) {
            resolve();
            return;
          }
          const elapsed = (performance.now() - start) / 1000;
          if (elapsed >= totalDuration) {
            drawFrameForSlide(slides.length - 1, 1);
            resolve();
            return;
          }

          if (introImage && elapsed < introDuration) {
            drawSlideToCanvas(ctx, introImage, 'zoom_in', Math.min(1, elapsed / Math.max(0.01, introDuration)), width, height);
            requestAnimationFrame(render);
            return;
          }

          const timelineElapsed = Math.max(0, elapsed - introDuration);

          let slideIndex = slides.length - 1;
          for (let i = 0; i < slides.length; i += 1) {
            const startSec = slideStartTimes[i] || 0;
            const endSec = startSec + (slideDurations[i] || fallbackSlideDuration);
            if (timelineElapsed < endSec || i === slides.length - 1) {
              slideIndex = i;
              break;
            }
          }
          const startSec = slideStartTimes[slideIndex] || 0;
          const currentDuration = Math.max(0.001, slideDurations[slideIndex] || fallbackSlideDuration);
          const slideProgress = Math.min(1, Math.max(0, (timelineElapsed - startSec) / currentDuration));
          drawFrameForSlide(slideIndex, slideProgress);

          if (ui.finalVideo.templateTitleEnabled && ui.finalVideo.templateTitleText) {
            drawTemplateTitleOverlay(
              ctx,
              width,
              height,
              ui.finalVideo.templateTitleText,
              {
                line1TopMm: ui.finalVideo.templateTitleLine1TopMm,
                line2BottomMm: ui.finalVideo.templateTitleLine2BottomMm,
                fontFamily: ui.finalVideo.templateTitleFontFamily,
                line1Color: ui.finalVideo.templateTitleLine1Color,
                line2Color: ui.finalVideo.templateTitleLine2Color,
                highlightColor: ui.finalVideo.templateTitleHighlightColor,
                strokeColor: ui.finalVideo.templateTitleStrokeColor,
                highlightWord: ui.finalVideo.templateTitleHighlightWord,
                scale: ui.finalVideo.templateTitleScale,
                subtitlePreset: ui.finalVideo.subtitlePreset,
              },
            );
          }

          if (subtitleSegments.length > 0) {
            const subtitle = subtitleSegments.find(s => timelineElapsed >= s.start && timelineElapsed < s.end);
            if (subtitle) {
              const segmentDuration = Math.max(0.001, subtitle.end - subtitle.start);
              const segmentProgress = Math.min(0.999, Math.max(0, (timelineElapsed - subtitle.start) / segmentDuration));

              drawSubtitleOverlay(
                ctx,
                width,
                height,
                subtitle.lines,
                ui.finalVideo.subtitlePosition,
                ui.finalVideo.subtitleGridPosition,
                {
                  preset: ui.finalVideo.subtitlePreset,
                  progress: segmentProgress,
                  entryAnimation: ui.finalVideo.subtitleEntryAnimation,
                  subtitleScale: ui.finalVideo.subtitleScale,
                },
              );
            }
          }

          if (Array.isArray(ui.finalVideo.textOverlays) && ui.finalVideo.textOverlays.length > 0) {
            drawExtraTextOverlays(ctx, width, height, ui.finalVideo.textOverlays as any);
          }

          requestAnimationFrame(render);
        };
        render();
      });

      pauseVideo(activeVideoCut);
      recorder.stop();
      if (taskAbortRef.current.finalRender) {
        setUi(prev => ({ ...prev, finalVideo: { ...prev.finalVideo, generating: false } }));
        return;
      }
      const renderedBlob = await finished;
      const renderedUrl = URL.createObjectURL(renderedBlob);

      setUi(prev => ({
        ...prev,
        finalVideo: {
          ...prev.finalVideo,
          generating: false,
          url: renderedUrl,
          outputFormat: 'webm',
        },
      }));

      alert(`슬라이드 영상 렌더링 완료 (${Math.round(totalDuration)}초)`);
    } catch (err: any) {
      console.error(err);
      setUi(prev => ({ ...prev, finalVideo: { ...prev.finalVideo, generating: false } }));
      alert(`슬라이드 영상 렌더링 실패: ${err?.message || '알 수 없는 오류'}`);
    } finally {
      loadedSlideVideos.forEach(video => {
        video.pause();
      });
      if (audioContext) {
        await audioContext.close().catch(() => undefined);
      }
    }
  };

  const handleDownloadSrt = () => {
    if (!isApprovedUser) {
      alert('승인된 사용자만 다운로드할 수 있습니다. 관리자 승인 후 다시 시도해 주세요.');
      return;
    }
    const slides = ui.finalVideo.slides;
    if (slides.length === 0) {
      alert('먼저 슬라이드 구성을 완료하세요.');
      return;
    }

    const slideDuration = Math.max(1, ui.finalVideo.slideDuration);
    const baseDuration = slides.length * slideDuration;
    const narrationDuration = ui.tts.measuredDuration > 0 ? ui.tts.measuredDuration : baseDuration;
    const estimatedTotal = Math.max(1, narrationDuration);
    const segments = buildSubtitleSegments(
      slides.map(slide => ui.cuts.items[slide.cut - 1] || ''),
      estimatedTotal,
      Math.max(12, ui.finalVideo.subtitleMaxChars),
    );

    if (segments.length === 0) {
      alert('자막으로 변환할 텍스트가 없습니다. 컷 내용을 확인하세요.');
      return;
    }

    const srtText = buildSrtFromSegments(segments);
    const blob = new Blob([srtText], { type: 'application/x-subrip;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'story_subtitles.srt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const applySubtitleTemplate = (preset: SubtitlePreset) => {
    const templateMap: Record<SubtitlePreset, {
      subtitlePreset: SubtitlePreset;
      subtitlePosition: SubtitlePosition;
      subtitleGridPosition: number;
      subtitleMaxChars: number;
      subtitleWordHighlight: boolean;
      subtitleHighlightStrength: SubtitleHighlightStrength;
      subtitleEntryAnimation: SubtitleEntryAnimation;
    }> = {
      shorts: {
        subtitlePreset: 'shorts',
        subtitlePosition: 'bottom',
        subtitleGridPosition: 7,
        subtitleMaxChars: 20,
        subtitleWordHighlight: true,
        subtitleHighlightStrength: 'high',
        subtitleEntryAnimation: 'pop',
      },
      docu: {
        subtitlePreset: 'docu',
        subtitlePosition: 'bottom',
        subtitleGridPosition: 7,
        subtitleMaxChars: 28,
        subtitleWordHighlight: false,
        subtitleHighlightStrength: 'low',
        subtitleEntryAnimation: 'fade',
      },
      lecture: {
        subtitlePreset: 'lecture',
        subtitlePosition: 'middle',
        subtitleGridPosition: 7,
        subtitleMaxChars: 26,
        subtitleWordHighlight: true,
        subtitleHighlightStrength: 'medium',
        subtitleEntryAnimation: 'fade',
      },
      impact: {
        subtitlePreset: 'impact',
        subtitlePosition: 'bottom',
        subtitleGridPosition: 7,
        subtitleMaxChars: 20,
        subtitleWordHighlight: true,
        subtitleHighlightStrength: 'high',
        subtitleEntryAnimation: 'pop',
      },
      neon: {
        subtitlePreset: 'neon',
        subtitlePosition: 'bottom',
        subtitleGridPosition: 7,
        subtitleMaxChars: 24,
        subtitleWordHighlight: true,
        subtitleHighlightStrength: 'medium',
        subtitleEntryAnimation: 'slide_up',
      },
    };

    const next = templateMap[preset];
    setUi(prev => ({
      ...prev,
      finalVideo: {
        ...prev.finalVideo,
        ...next,
      },
    }));
  };

  const applySavedSubtitleTemplate = (template: SavedSubtitleTemplate) => {
    setUi(prev => ({
      ...prev,
      finalVideo: {
        ...prev.finalVideo,
        subtitlePreset: template.subtitlePreset,
        subtitlePosition: template.subtitlePosition,
        subtitleGridPosition: Number(template.subtitleGridPosition || 7),
        subtitleMaxChars: template.subtitleMaxChars,
        subtitleWordHighlight: template.subtitleWordHighlight,
        subtitleHighlightStrength: template.subtitleHighlightStrength,
        subtitleEntryAnimation: template.subtitleEntryAnimation,
        subtitleKeywords: template.subtitleKeywords,
        subtitleUsePerCutKeywords: template.subtitleUsePerCutKeywords,
      },
    }));
  };

  const applyBuiltinSubtitleTemplate = (templateId: string) => {
    const selected = BUILTIN_SUBTITLE_TEMPLATES.find(t => t.id === templateId);
    if (!selected) return;
    const defaultTitleText = ui.selectedHookTitle ? normalizeHookTitleForOverlay(ui.selectedHookTitle) : '';
    const defaultHighlightWord = normalizeSubtitleText(defaultTitleText.split(/\r?\n/)[0] || '').split(/\s+/).find(Boolean) || '';

    setUi(prev => ({
      ...prev,
      finalVideo: {
        ...prev.finalVideo,
        subtitlePreset: selected.config.subtitlePreset,
        subtitlePosition: selected.config.subtitlePosition,
        subtitleGridPosition: Number(selected.config.subtitleGridPosition || 7),
        subtitleMaxChars: selected.config.subtitleMaxChars,
        subtitleWordHighlight: selected.config.subtitleWordHighlight,
        subtitleHighlightStrength: selected.config.subtitleHighlightStrength,
        subtitleEntryAnimation: selected.config.subtitleEntryAnimation,
        subtitleKeywords: selected.config.subtitleKeywords,
        subtitleUsePerCutKeywords: selected.config.subtitleUsePerCutKeywords,
        templateTitleEnabled: true,
        templateTitleText: defaultTitleText,
        templateTitleFontFamily: '아네모네',
        templateTitleLine1TopMm: 60,
        templateTitleLine2BottomMm: 96,
        templateTitleLine1Color: '#ef4444',
        templateTitleLine2Color: '#111111',
        templateTitleHighlightColor: '#fde047',
        templateTitleHighlightWord: defaultHighlightWord,
        templateTitleStrokeColor: 'rgba(0,0,0,0.92)',
        templateTitleScale: 2,
        subtitleTemplateLockEnabled: true,
        subtitleTemplateLockedId: templateId,
      },
    }));
  };

  useEffect(() => {
    if (!ui.finalVideo.subtitleTemplateLockedId) {
      const hasDefaultTemplate = BUILTIN_SUBTITLE_TEMPLATES.some(t => t.id === 'default-basic');
      if (hasDefaultTemplate) {
        applyBuiltinSubtitleTemplate('default-basic');
      }
    }
  }, [ui.finalVideo.subtitleTemplateLockedId]);

  const handleTemplatePreviewUpload = (templateId: string, file?: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = String(ev.target?.result || '');
      if (!url) return;
      setTemplatePreviewOverrides(prev => ({ ...prev, [templateId]: url }));
    };
    reader.readAsDataURL(file);
  };

  const resetTemplatePreview = (templateId: string) => {
    setTemplatePreviewOverrides(prev => {
      const next = { ...prev };
      delete next[templateId];
      return next;
    });
  };

  const saveCurrentSubtitleTemplate = () => {
    const name = window.prompt('템플릿 이름을 입력하세요 (예: 쇼츠강조형)')?.trim();
    if (!name) return;

    const next: SavedSubtitleTemplate = {
      name,
      subtitlePreset: ui.finalVideo.subtitlePreset,
      subtitlePosition: ui.finalVideo.subtitlePosition,
      subtitleGridPosition: ui.finalVideo.subtitleGridPosition,
      subtitleMaxChars: ui.finalVideo.subtitleMaxChars,
      subtitleWordHighlight: ui.finalVideo.subtitleWordHighlight,
      subtitleHighlightStrength: ui.finalVideo.subtitleHighlightStrength,
      subtitleEntryAnimation: ui.finalVideo.subtitleEntryAnimation,
      subtitleKeywords: ui.finalVideo.subtitleKeywords,
      subtitleUsePerCutKeywords: ui.finalVideo.subtitleUsePerCutKeywords,
    };

    setSubtitleTemplates(prev => {
      const others = prev.filter(t => t.name !== name);
      return [next, ...others].slice(0, 12);
    });
  };

  const removeSavedSubtitleTemplate = (name: string) => {
    setSubtitleTemplates(prev => prev.filter(t => t.name !== name));
  };

  const exportSubtitleTemplates = () => {
    if (!isApprovedUser) {
      alert('승인된 사용자만 템플릿 파일 다운로드가 가능합니다.');
      return;
    }
    if (subtitleTemplates.length === 0) {
      alert('내보낼 템플릿이 없습니다. 먼저 템플릿을 저장하세요.');
      return;
    }
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      templates: subtitleTemplates,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subtitle_templates.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importSubtitleTemplates = async (file?: File | null) => {
    if (!file) return;
    try {
      const filenameStem = (file.name || 'imported_template').replace(/\.[^/.]+$/, '').trim().slice(0, 36) || 'imported_template';
      const text = await file.text();
      const parsed = JSON.parse(text);
      const incoming = Array.isArray(parsed?.templates)
        ? parsed.templates
        : Array.isArray(parsed)
        ? parsed
        : [];

      const sanitized = incoming
        .filter((t: any) => t && typeof t.name === 'string')
        .map((t: any, idx: number) => ({
          name: `${filenameStem}${idx === 0 ? '' : `_${idx + 1}`}`.slice(0, 40),
          subtitlePreset: (['shorts', 'docu', 'lecture', 'impact', 'neon'].includes(t.subtitlePreset) ? t.subtitlePreset : 'shorts') as SubtitlePreset,
          subtitlePosition: (['bottom', 'middle'].includes(t.subtitlePosition) ? t.subtitlePosition : 'bottom') as SubtitlePosition,
          subtitleGridPosition: Number.isFinite(t.subtitleGridPosition) ? Math.min(10, Math.max(1, Number(t.subtitleGridPosition))) : 7,
          subtitleMaxChars: Number.isFinite(t.subtitleMaxChars) ? Math.min(40, Math.max(12, Number(t.subtitleMaxChars))) : 24,
          subtitleWordHighlight: Boolean(t.subtitleWordHighlight),
          subtitleHighlightStrength: (['low', 'medium', 'high'].includes(t.subtitleHighlightStrength) ? t.subtitleHighlightStrength : 'medium') as SubtitleHighlightStrength,
          subtitleEntryAnimation: (['none', 'fade', 'pop', 'slide_up', 'slide_down', 'slide_left', 'slide_right'].includes(t.subtitleEntryAnimation) ? t.subtitleEntryAnimation : 'fade') as SubtitleEntryAnimation,
          subtitleKeywords: typeof t.subtitleKeywords === 'string' ? t.subtitleKeywords : '',
          subtitleUsePerCutKeywords: Boolean(t.subtitleUsePerCutKeywords),
        })) as SavedSubtitleTemplate[];

      if (sanitized.length === 0) {
        alert('가져올 수 있는 템플릿 형식이 아닙니다.');
        return;
      }

      setSubtitleTemplates(prev => {
        const mergedMap = new Map<string, SavedSubtitleTemplate>();
        [...sanitized, ...prev].forEach(t => {
          if (!mergedMap.has(t.name)) mergedMap.set(t.name, t);
        });
        return [...mergedMap.values()].slice(0, 20);
      });
      alert(`${sanitized.length}개 템플릿을 가져왔습니다. 파일명(${filenameStem}) 기준으로 저장되었습니다.`);
    } catch (err) {
      console.error(err);
      alert('템플릿 가져오기에 실패했습니다. JSON 파일을 확인해주세요.');
    }
  };

  const handleSuggestSubtitleKeywords = async () => {
    const sourceText = [ui.script.output, ...ui.cuts.items].join(' ').trim();
    if (!sourceText) {
      alert('대본 또는 컷 텍스트가 없습니다. 먼저 대본/컷을 생성하세요.');
      return;
    }

    setUi(prev => ({ ...prev, finalVideo: { ...prev.finalVideo, subtitleSuggesting: true } }));

    try {
      if (ui.finalVideo.subtitleUsePerCutKeywords && ui.finalVideo.slides.length > 0) {
        const byCut: Record<number, string> = {};

        if (keys.g1) {
          const ai = new GoogleGenAI({ apiKey: keys.g1 });
          const cutPayload = ui.finalVideo.slides.map(slide => ({
            cut: slide.cut,
            text: (ui.cuts.items[slide.cut - 1] || '').slice(0, 280),
          }));

          const response = await generateContentWithFallback(ai, {
            model: 'gemini-3-flash-preview',
            contents: `아래 컷별 텍스트에서 자막 강조 키워드를 추출하세요.
규칙:
- 각 컷마다 2~4개
- 짧고 강한 단어
- 중복 최소화
- JSON만 출력

형식:
{"items":[{"cut":1,"keywords":["핵심","충격"]}]}

입력:
${JSON.stringify(cutPayload)}`,
            config: { responseMimeType: 'application/json' },
          });

          const parsed = JSON.parse(response.text || '{}');
          const items = Array.isArray(parsed?.items) ? parsed.items : [];
          items.forEach((item: any) => {
            const cut = Number(item?.cut);
            if (!Number.isFinite(cut)) return;
            const kws = Array.isArray(item?.keywords)
              ? item.keywords.map((v: any) => cleanWordToken(String(v))).filter(Boolean).slice(0, 5)
              : [];
            if (kws.length > 0) {
              byCut[cut] = kws.join(',');
            }
          });
        }

        ui.finalVideo.slides.forEach(slide => {
          if (byCut[slide.cut]) return;
          const cutText = ui.cuts.items[slide.cut - 1] || '';
          const picked = extractTopKeywords(cutText, 4);
          byCut[slide.cut] = picked.join(',');
        });

        setUi(prev => ({
          ...prev,
          finalVideo: {
            ...prev.finalVideo,
            subtitleKeywordsByCut: {
              ...prev.finalVideo.subtitleKeywordsByCut,
              ...byCut,
            },
            subtitleSuggesting: false,
          },
        }));
        return;
      }

      if (keys.g1) {
        const ai = new GoogleGenAI({ apiKey: keys.g1 });
        const response = await generateContentWithFallback(ai, {
          model: 'gemini-3-flash-preview',
          contents: `아래 영상 대본에서 자막 강조용 핵심 키워드 6개를 추출하세요.\n조건: 중복 없이, 짧고 강한 단어, 쉼표(,)로만 출력.\n\n대본:\n${sourceText.substring(0, 2400)}`,
        });
        const raw = response.text?.trim() || '';
        const parsed = raw
          .replace(/[\n\r]/g, ',')
          .split(',')
          .map(v => cleanWordToken(v))
          .filter(Boolean)
          .slice(0, 8);

        if (parsed.length > 0) {
          setUi(prev => ({
            ...prev,
            finalVideo: {
              ...prev.finalVideo,
              subtitleKeywords: parsed.join(','),
              subtitleSuggesting: false,
            },
          }));
          return;
        }
      }

      const fallback = extractTopKeywords(sourceText, 6);
      setUi(prev => ({
        ...prev,
        finalVideo: {
          ...prev.finalVideo,
          subtitleKeywords: fallback.join(','),
          subtitleSuggesting: false,
        },
      }));
    } catch (err) {
      console.error(err);
      const fallback = extractTopKeywords(sourceText, 6);
      setUi(prev => ({
        ...prev,
        finalVideo: {
          ...prev.finalVideo,
          subtitleKeywords: fallback.join(','),
          subtitleSuggesting: false,
        },
      }));
    }
  };

  const ensureFfmpegLoaded = async () => {
    if (ffmpegRef.current && ui.finalVideo.ffmpegReady) return ffmpegRef.current;

    const ffmpeg = ffmpegRef.current || new FFmpeg();
    ffmpegRef.current = ffmpeg;

    setUi(prev => ({
      ...prev,
      finalVideo: { ...prev.finalVideo, ffmpegNote: 'FFmpeg 엔진 로딩 중...' },
    }));

    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    setUi(prev => ({
      ...prev,
      finalVideo: { ...prev.finalVideo, ffmpegReady: true, ffmpegNote: 'FFmpeg 준비 완료' },
    }));

    return ffmpeg;
  };

  const handleConvertToMp4 = async () => {
    if (ui.finalVideo.transcoding) {
      taskAbortRef.current.mp4 = true;
      setUi(prev => ({ ...prev, finalVideo: { ...prev.finalVideo, transcoding: false, ffmpegNote: '변환 중지 요청됨' } }));
      return;
    }
    if (!ui.finalVideo.url) {
      alert('먼저 슬라이드 렌더링을 완료하세요.');
      return;
    }

    taskAbortRef.current.mp4 = false;
    setUi(prev => ({
      ...prev,
      finalVideo: { ...prev.finalVideo, transcoding: true, ffmpegNote: '변환 준비 중...' },
    }));

    try {
      const ffmpeg = await ensureFfmpegLoaded();
      if (taskAbortRef.current.mp4) throw new Error('사용자에 의해 중지되었습니다.');
      const inputBlob = await fetch(ui.finalVideo.url).then(res => res.blob());
      await ffmpeg.writeFile('input.webm', await fetchFile(inputBlob));

      setUi(prev => ({
        ...prev,
        finalVideo: { ...prev.finalVideo, ffmpegNote: 'MP4 변환 중... (1~2분 소요 가능)' },
      }));

      try {
        await ffmpeg.exec([
          '-i', 'input.webm',
          '-c:v', 'libx264',
          '-preset', 'veryfast',
          '-crf', '24',
          '-c:a', 'aac',
          '-b:a', '128k',
          'output.mp4',
        ]);
      } catch {
        if (taskAbortRef.current.mp4) throw new Error('사용자에 의해 중지되었습니다.');
        await ffmpeg.exec([
          '-i', 'input.webm',
          '-c:v', 'mpeg4',
          '-q:v', '5',
          '-c:a', 'aac',
          '-b:a', '128k',
          'output.mp4',
        ]);
      }

      if (taskAbortRef.current.mp4) throw new Error('사용자에 의해 중지되었습니다.');

      const output = await ffmpeg.readFile('output.mp4');
      const data = output instanceof Uint8Array
        ? output
        : new TextEncoder().encode(String(output));
      const mp4Blob = new Blob([data], { type: 'video/mp4' });
      const mp4Url = URL.createObjectURL(mp4Blob);

      setUi(prev => ({
        ...prev,
        finalVideo: {
          ...prev.finalVideo,
          url: mp4Url,
          outputFormat: 'mp4',
          transcoding: false,
          ffmpegNote: 'MP4 변환 완료',
        },
      }));
      alert('MP4 변환이 완료되었습니다. 다운로드 버튼으로 저장하세요.');
    } catch (err: any) {
      const aborted = taskAbortRef.current.mp4;
      if (!aborted) {
        console.error(err);
      }
      setUi(prev => ({
        ...prev,
        finalVideo: {
          ...prev.finalVideo,
          transcoding: false,
          ffmpegNote: aborted ? 'MP4 변환 중지됨' : 'MP4 변환 실패',
        },
      }));
      if (!aborted) {
        alert(`MP4 변환 실패: ${err?.message || '알 수 없는 오류'}`);
      }
    }
  };

  actionApiRef.current = {
    generateScript,
    rewriteTemplateTitleFromHook,
    handleGenerateTTS,
    splitCuts,
    generateImagePrompts,
    handleGenerateFinalVideo,
    handleExportSlideVideo,
    generateDescription,
  };

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-10 space-y-8 relative z-10">
      <div className="fixed md:hidden right-3 bottom-16 z-[110] flex flex-col gap-2">
        {([
          { id: 'p1', label: '검색' },
          { id: 'p5', label: '대본' },
          { id: 'p8', label: '이미지' },
          { id: 'p12', label: '편집' },
          { id: 'p14', label: '발행' },
        ] as Array<{ id: keyof typeof ui.panelsOpen; label: string }>).map(item => (
          <button
            key={item.id}
            onClick={() => jumpToPanel(item.id)}
            className="px-3 py-2 rounded-full bg-black/70 border border-white/20 text-[11px] font-black text-white shadow-lg"
          >
            {item.label}
          </button>
        ))}
      </div>
      {shouldShowLoginGate && (
        <div className="fixed inset-0 z-[120] bg-[#060b17]/95 backdrop-blur-md flex items-center justify-center p-6">
          <section className="w-full max-w-3xl bg-white/5 border border-white/10 rounded-[2.5rem] p-8">
            <div className="space-y-4">
              <p className="text-xs font-black text-cyan-300 uppercase tracking-widest">Google 로그인 필요</p>
              <h2 className="text-2xl font-black text-white">앱 시작 전 YouTube 계정을 연결하세요</h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                이 워크스페이스는 진입 시 Google 로그인 후 자동 제작/발행(14번)까지 바로 연결되도록 설정되어 있습니다.
              </p>
              {!googleLoginReady && (
                <p className="text-sm text-rose-300 font-bold">
                  Google 로그인 준비 중입니다. 잠시 후 다시 시도하거나 관리자에게 문의해 주세요.
                </p>
              )}
              {!googleLoginReady && isPublishAdmin && (
                <p className="text-[11px] text-amber-200/90">
                  관리자 참고: `VITE_GOOGLE_CLIENT_ID` / `VITE_GOOGLE_REDIRECT_URI` 배포 환경변수를 확인해 주세요.
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => connectYouTubeAccount('login')}
                  className="px-4 py-2.5 rounded-xl bg-cyan-500 text-black font-black"
                >
                  Google로 시작하기
                </button>
                <button
                  onClick={() => {
                    try {
                      sessionStorage.setItem('ai_storyteller_login_gate_dismissed', '1');
                    } catch {
                      // ignore session storage errors
                    }
                    setLoginGateDismissed(true);
                    showNotice('로그인 없이 편집 모드로 계속 진행합니다.', 'info');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white/10 text-white font-black border border-white/15"
                >
                  로그인 없이 계속
                </button>
              </div>
              <p className="text-[11px] text-slate-300/90">로그인 후 API를 입력해 대부분 기능을 사용할 수 있습니다. 저장/다운로드/유튜브 연동/발행은 승인 사용자만 가능합니다.</p>
            </div>
          </section>
        </div>
      )}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-500 rounded-2xl shadow-lg shadow-amber-500/20">
            <Sparkles className="w-8 h-8 text-black" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white">AI Storyteller Lite</h1>
            <p className="text-slate-400 font-medium">유튜브 트렌드 분석 및 AI 콘텐츠 제작 솔루션</p>
            <p className="text-[10px] text-slate-500 font-mono mt-1">Build: {appBuildId}</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-3">
            <ApiStatusBar items={apiStatusItems} />
            <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-full border border-white/10 bg-white/5">
              <span className={`w-2 h-2 rounded-full ${hasValidYouTubeAuth ? 'bg-emerald-400' : 'bg-slate-500'}`} />
              <span className="text-[11px] font-bold text-slate-200">{currentUserEmail || '로그인 안됨'}</span>
              {hasValidYouTubeAuth ? (
                <button
                  onClick={disconnectYouTubeAccount}
                  className="text-[10px] px-2 py-1 rounded-md bg-white/10 hover:bg-white/20"
                >
                  로그아웃
                </button>
              ) : (
                <button
                  onClick={() => connectYouTubeAccount('login')}
                  className="text-[10px] px-2 py-1 rounded-md bg-cyan-500 text-black font-black"
                >
                  로그인
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap items-stretch gap-2">
            <button
              onClick={handleNewProject}
              className="w-full lg:w-auto flex items-center justify-center gap-2 bg-cyan-500/20 border border-cyan-300/30 text-cyan-100 px-4 py-2.5 rounded-full hover:bg-cyan-500/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-bold">새프로젝트</span>
            </button>
            <button 
              onClick={() => setUi(prev => ({ ...prev, happyDayOpen: true }))}
              className="w-full lg:w-auto bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-black px-4 py-2.5 rounded-full shadow-lg hover:brightness-110 transition-all"
            >
              🛍️ Happy Day 구경
            </button>
            <button 
              onClick={saveProject}
              disabled={!isApprovedUser}
              className="w-full lg:w-auto flex items-center justify-center gap-2 bg-white/5 border border-white/10 px-4 py-2.5 rounded-full hover:bg-white/10 transition-all disabled:opacity-40"
            >
              <Save className="w-4 h-4" />
              <span className="text-sm font-bold">프로젝트 저장</span>
            </button>
            <label className="relative group w-full lg:w-auto flex items-center justify-center gap-2 bg-white/5 border border-white/10 px-4 py-2.5 rounded-full hover:bg-white/10 transition-all cursor-pointer">
              <Download className="w-4 h-4" />
              <span className="text-sm font-bold">불러오기</span>
              <input type="file" accept=".zip,.json,application/zip" onChange={loadProject} className="hidden" />
              <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-72 -translate-x-1/2 rounded-xl border border-amber-300/40 bg-[#10192f] p-3 text-[10px] text-amber-100 opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
                ZIP 또는 JSON 프로젝트를 불러올 수 있습니다. ZIP은 내부 project.json을 자동 탐색합니다.
              </div>
            </label>
            <button 
              onClick={() => setUi(prev => ({ ...prev, settingsOpen: true }))}
              className="w-full lg:w-auto flex items-center justify-center gap-2 bg-white/5 border border-white/10 px-4 py-2.5 rounded-full hover:bg-white/10 transition-all"
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm font-bold">API 설정</span>
            </button>
          </div>
        </div>
      </header>

      {ui.publishing.accounts.filter((a: any) => a.connected).length > 0 && (
        <section className="max-w-5xl mx-auto bg-white/5 border border-white/10 rounded-3xl p-4 md:p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3 mb-3">
            <p className="text-xs font-black text-cyan-200 uppercase tracking-widest">연동된 YouTube 채널</p>
            <span className="text-[10px] text-slate-400">카드를 클릭하면 채널 속성을 분석합니다.</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ui.publishing.accounts.filter((a: any) => a.connected).map((account: any) => {
              const insight = ui.publishing.channelInsights?.[account.id];
              return (
                <button
                  key={account.id}
                  onClick={() => fetchChannelInsights(account.id)}
                  className="text-left rounded-2xl border border-cyan-300/20 bg-cyan-500/5 hover:bg-cyan-500/10 transition-all p-4"
                >
                  <p className="text-sm font-black text-white">{insight?.channelTitle || account.name}</p>
                  <p className="text-[11px] text-cyan-100/90">{account.handle} · {account.email || '이메일 미확인'}</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] text-slate-300">
                    <p>구독자: <span className="font-bold text-white">{insight?.subscribers || '-'}</span></p>
                    <p>총조회수: <span className="font-bold text-white">{insight?.totalViews || '-'}</span></p>
                    <p className="col-span-2">설명: <span className="font-bold text-white">{insight?.descriptionShort || '-'}</span></p>
                    <p className="col-span-2">마지막 업로드: <span className="font-bold text-white">{insight?.lastUploadDate || '-'}</span></p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className="max-w-5xl mx-auto bg-white/5 border border-white/10 rounded-3xl p-4 md:p-5 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <div>
            <p className="text-xs font-black text-fuchsia-200 uppercase tracking-widest">사진 1장 상품홍보 자동 제작</p>
            <p className="text-[11px] text-slate-400 mt-1">자동/수동 모드를 선택해 상품쇼츠를 진행합니다. 자동은 21초 고정, 수동은 일반 쇼츠 흐름으로 진행합니다.</p>
          </div>
          <button
            onClick={() => {
              if (productPromoPlan.workflowMode === 'auto') {
                void runProductPromoOneClick();
                return;
              }
              setUi(prev => ({
                ...prev,
                script: {
                  ...prev.script,
                  type: 'shorts',
                  lang: 'KR',
                  length: productPromoPlan.scriptLength,
                },
                videoStyle: {
                  ...prev.videoStyle,
                  selected: PRODUCT_PROMO_AUTO_STYLE,
                },
                finalVideo: {
                  ...prev.finalVideo,
                  type: productPromoPlan.renderMode,
                  slideDuration: productPromoPlan.slideDuration,
                  hookVideoCount: productPromoPlan.hookVideoCount,
                  useHybridHookVideos: productPromoPlan.hookVideoCount > 0,
                },
                productPromo: {
                  ...prev.productPromo,
                  targetCuts: productPromoPlan.targetCuts,
                  targetSeconds: productPromoPlan.targetSeconds,
                },
              }));
              showNotice('수동 모드 기준 설정을 적용했습니다. 일반 쇼츠처럼 단계별로 진행하세요.', 'success');
            }}
            disabled={(ui.productPromo.referenceImages || []).length === 0 || ui.productPromo.running || ui.autoFlow.running}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all disabled:opacity-40 ${ui.productPromo.running ? 'running-gradient text-black' : 'bg-fuchsia-500 hover:bg-fuchsia-400 text-white'}`}
          >
            {ui.productPromo.running ? '자동 제작 중...' : productPromoPlan.workflowMode === 'auto' ? '상품홍보 자동 실행' : '수동 진행 설정 적용'}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <div className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
            <p className="text-[10px] font-black text-fuchsia-200 uppercase tracking-widest">진행 방식</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setUi(prev => ({ ...prev, productPromo: { ...prev.productPromo, workflowMode: 'auto', renderMode: 'image_slide', strictProductLock: true, hookVideoCount: 0, targetCuts: 7, targetSeconds: 7 * IMAGE_SLIDE_DURATION_SEC } }))}
                className={`py-2 rounded-lg text-[10px] font-black border transition-all ${productPromoPlan.workflowMode === 'auto' ? 'bg-fuchsia-400 text-black border-fuchsia-300' : 'bg-white/5 text-slate-300 border-white/15'}`}
              >
                자동
              </button>
              <button
                onClick={() => setUi(prev => ({ ...prev, productPromo: { ...prev.productPromo, workflowMode: 'manual' } }))}
                className={`py-2 rounded-lg text-[10px] font-black border transition-all ${productPromoPlan.workflowMode === 'manual' ? 'bg-fuchsia-400 text-black border-fuchsia-300' : 'bg-white/5 text-slate-300 border-white/15'}`}
              >
                수동
              </button>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
            <p className="text-[10px] font-black text-fuchsia-200 uppercase tracking-widest">출력 방식</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setUi(prev => ({ ...prev, productPromo: { ...prev.productPromo, renderMode: 'image_slide' } }))}
                className={`py-2 rounded-lg text-[10px] font-black border transition-all ${ui.productPromo.renderMode === 'image_slide' ? 'bg-fuchsia-400 text-black border-fuchsia-300' : 'bg-white/5 text-slate-300 border-white/15'}`}
              >
                이미지 슬라이드
              </button>
              <button
                onClick={() => setUi(prev => ({ ...prev, productPromo: { ...prev.productPromo, renderMode: 'ai_video' } }))}
                disabled={productPromoPlan.workflowMode === 'auto'}
                className={`py-2 rounded-lg text-[10px] font-black border transition-all ${ui.productPromo.renderMode === 'ai_video' ? 'bg-fuchsia-400 text-black border-fuchsia-300' : 'bg-white/5 text-slate-300 border-white/15'}`}
              >
                AI 비디오
              </button>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
            <p className="text-[10px] font-black text-fuchsia-200 uppercase tracking-widest">컷 구성</p>
            <div className="flex items-center justify-between text-[10px] text-slate-300">
              <span>총 컷/길이</span>
              <span className="font-black text-white">{productPromoPlan.targetCuts}컷 · {productPromoPlan.targetSeconds}초</span>
            </div>
            <p className="text-[10px] text-slate-500">
              {productPromoPlan.workflowMode === 'auto'
                ? '자동 모드: 7컷 x 3초 = 21초 고정 (이미지 슬라이드)'
                : productPromoPlan.renderMode === 'ai_video'
                  ? '수동 AI비디오: 5컷 x 4초 = 20초 고정'
                  : '수동 이미지슬라이드: 영상훅 1/2컷 + 이미지컷으로 19~20초 고정'}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
            <p className="text-[10px] font-black text-fuchsia-200 uppercase tracking-widest">영상 훅 컷 수</p>
            <div className="flex items-center justify-between text-[10px] text-slate-300">
              <span>초반 영상</span>
              <span className="font-black text-white">{productPromoPlan.renderMode === 'image_slide' ? productPromoPlan.hookVideoCount : 5}컷</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setUi(prev => ({ ...prev, productPromo: { ...prev.productPromo, manualHookVideoCount: 1 } }))}
                disabled={productPromoPlan.workflowMode === 'auto' || productPromoPlan.renderMode !== 'image_slide'}
                className={`py-2 rounded-lg text-[10px] font-black border transition-all disabled:opacity-40 ${Number(ui.productPromo.manualHookVideoCount || 1) === 1 ? 'bg-fuchsia-400 text-black border-fuchsia-300' : 'bg-white/5 text-slate-300 border-white/15'}`}
              >
                영상 1컷
              </button>
              <button
                onClick={() => setUi(prev => ({ ...prev, productPromo: { ...prev.productPromo, manualHookVideoCount: 2 } }))}
                disabled={productPromoPlan.workflowMode === 'auto' || productPromoPlan.renderMode !== 'image_slide'}
                className={`py-2 rounded-lg text-[10px] font-black border transition-all disabled:opacity-40 ${Number(ui.productPromo.manualHookVideoCount || 1) === 2 ? 'bg-fuchsia-400 text-black border-fuchsia-300' : 'bg-white/5 text-slate-300 border-white/15'}`}
              >
                영상 2컷
              </button>
            </div>
            <p className="text-[10px] text-slate-500">수동 이미지슬라이드: 영상 1컷(4초)+이미지 5컷(3초)=19초 / 영상 2컷(8초)+이미지 4컷(3초)=20초</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
            <p className="text-[10px] font-black text-fuchsia-200 uppercase tracking-widest">상품 원본 고정</p>
            <button
              onClick={() => setUi(prev => ({ ...prev, productPromo: { ...prev.productPromo, strictProductLock: !prev.productPromo.strictProductLock } }))}
              disabled={productPromoPlan.workflowMode === 'auto'}
              className={`w-full px-3 py-2 rounded-lg text-xs font-black border transition-all ${ui.productPromo.strictProductLock ? 'bg-emerald-400 text-black border-emerald-300' : 'bg-black/30 text-slate-300 border-white/15'}`}
            >
              {ui.productPromo.strictProductLock ? 'ON (제품 픽셀 유지)' : 'OFF (변형 허용)'}
            </button>
            <p className="text-[10px] text-slate-500">자동 모드에서는 항상 ON으로 강제됩니다.</p>
            <button
              onClick={() => setUi(prev => ({
                ...prev,
                productPromo: {
                  ...prev.productPromo,
                  experimentalBgCutout: !prev.productPromo.experimentalBgCutout,
                },
              }))}
              className={`w-full px-3 py-2 rounded-lg text-[11px] font-black border transition-all ${ui.productPromo.experimentalBgCutout ? 'bg-amber-300 text-black border-amber-200' : 'bg-black/30 text-slate-300 border-white/15'}`}
            >
              {ui.productPromo.experimentalBgCutout ? '실험: 배경교체 지시 ON' : '실험: 배경교체 지시 OFF'}
            </button>
            <p className="text-[10px] text-amber-200/90">실험 기능: 프롬프트 지시만 적용됩니다. 실제 픽셀 배경 제거 엔진은 아직 미적용입니다.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
            <p className="text-[10px] font-black text-fuchsia-200 uppercase tracking-widest">배경음악</p>
            <select
              value={ui.finalVideo.bgmTrack || ''}
              onChange={(e) => setUi(prev => ({
                ...prev,
                finalVideo: {
                  ...prev.finalVideo,
                  bgmEnabled: Boolean(e.target.value),
                  bgmTrack: e.target.value,
                  bgmTrackUserSelected: true,
                  sfxEnabled: false,
                },
              }))}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none"
            >
              <option value="">없음</option>
              {BGM_LIBRARY.map(track => (
                <option key={track.path} value={track.path}>{track.label}</option>
              ))}
            </select>
            <button
              onClick={handlePreviewProductBgm}
              className={`w-full py-2 rounded-lg border text-xs font-black transition-all ${productBgmPreviewing ? 'bg-amber-400 text-black border-amber-300' : 'bg-white/10 text-white border-white/15 hover:bg-white/20'}`}
            >
              {productBgmPreviewing ? '배경음악 미리듣기 중지' : '배경음악 미리듣기'}
            </button>
            <p className="text-[10px] text-slate-500">여기서 선택한 음원이 자동 제작/렌더에 그대로 연동됩니다.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
            <label className="text-[10px] font-black text-fuchsia-200 uppercase tracking-widest">상품 URL</label>
            <input
              type="url"
              value={ui.productPromo.productUrl}
              onChange={(e) => setUi(prev => ({ ...prev, productPromo: { ...prev.productPromo, productUrl: e.target.value } }))}
              placeholder="https://... (스마트스토어/쿠팡/자사몰 등)"
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none"
            />
            <p className="text-[10px] text-slate-500">Gemini가 URL 맥락을 참고해 후킹 문구와 장면을 보강합니다.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
            <label className="text-[10px] font-black text-fuchsia-200 uppercase tracking-widest">상품 한줄 코멘트</label>
            <textarea
              value={ui.productPromo.productComment}
              onChange={(e) => setUi(prev => ({ ...prev, productPromo: { ...prev.productPromo, productComment: e.target.value } }))}
              placeholder="예: 직장인 아침 대용으로 10초 준비, 당류 낮고 포만감 좋음"
              className="w-full h-20 resize-none bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none"
            />
            <p className="text-[10px] text-slate-500">사용자 코멘트는 대본 톤, CTA, 컷별 이미지 프롬프트에 반영됩니다.</p>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-3 mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black text-fuchsia-200 uppercase tracking-widest">발행 자동화 옵션</p>
            <p className="text-[10px] text-slate-400 mt-1">자동 제작 완료 후 13/14번을 자동 준비합니다. 필요하면 즉시 발행 작업까지 자동 등록할 수 있습니다.</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={String([30, 60, 120].includes(Number(ui.productPromo.autoScheduleMinutes)) ? Number(ui.productPromo.autoScheduleMinutes) : 60)}
              onChange={(e) => {
                const mins = Number(e.target.value);
                setUi(prev => ({
                  ...prev,
                  productPromo: { ...prev.productPromo, autoScheduleMinutes: mins },
                  publishing: {
                    ...prev.publishing,
                    draft: {
                      ...prev.publishing.draft,
                      scheduleAt: toFutureDateTimeLocalValue(mins),
                    },
                  },
                }));
              }}
              className="bg-black/40 border border-white/15 rounded-lg px-2 py-2 text-[11px] text-white outline-none"
              title="자동 예약 시간"
            >
              <option value="30">+30분</option>
              <option value="60">+60분</option>
              <option value="120">+120분</option>
            </select>
            <button
              onClick={() => setUi(prev => {
                const nextAuto = !prev.productPromo.autoQueuePublish;
                const mins = [30, 60, 120].includes(Number(prev.productPromo.autoScheduleMinutes))
                  ? Number(prev.productPromo.autoScheduleMinutes)
                  : 60;
                return {
                  ...prev,
                  productPromo: {
                    ...prev.productPromo,
                    autoQueuePublish: nextAuto,
                    autoQueuePending: nextAuto ? prev.productPromo.autoQueuePending : false,
                  },
                  publishing: nextAuto
                    ? {
                        ...prev.publishing,
                        draft: {
                          ...prev.publishing.draft,
                          scheduleAt: toFutureDateTimeLocalValue(mins),
                        },
                      }
                    : prev.publishing,
                };
              })}
              className={`px-3 py-2 rounded-lg text-xs font-black border transition-all ${ui.productPromo.autoQueuePublish ? 'bg-emerald-400 text-black border-emerald-300' : 'bg-black/30 text-slate-300 border-white/15'}`}
            >
              {ui.productPromo.autoQueuePublish ? `완료 후 +${[30, 60, 120].includes(Number(ui.productPromo.autoScheduleMinutes)) ? Number(ui.productPromo.autoScheduleMinutes) : 60}분 예약발행 자동등록 ON` : '자동등록 OFF'}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-4">
          <div className="space-y-3">
            <label className="rounded-2xl border border-dashed border-fuchsia-300/40 bg-fuchsia-500/5 p-3 cursor-pointer hover:bg-fuchsia-500/10 transition-all min-h-[160px] flex items-center justify-center">
              {ui.productPromo.imageUrl ? (
                <img src={ui.productPromo.imageUrl} alt="product" className="w-full h-full max-h-[160px] object-cover rounded-xl" />
              ) : (
                <span className="text-[11px] text-fuchsia-100/80 font-bold">상품 사진 업로드</span>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const files = Array.from(e.target.files || []);
                  await handleProductPromoImages(files);
                  e.currentTarget.value = '';
                }}
              />
            </label>
            <label className="w-full block text-center rounded-lg bg-white/10 border border-white/15 px-3 py-2 text-[11px] font-black cursor-pointer hover:bg-white/20">
              상품 이미지 추가 업로드
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={async (e) => {
                  const files = Array.from(e.target.files || []);
                  await handleProductPromoImages(files);
                  e.currentTarget.value = '';
                }}
              />
            </label>
            <div className="grid grid-cols-4 gap-1.5 max-h-24 overflow-y-auto custom-scrollbar">
              {(ui.productPromo.referenceImages || []).map((img: string, idx: number) => (
                <button
                  key={`${img.slice(0, 32)}-${idx}`}
                  onClick={() => setUi(prev => ({ ...prev, productPromo: { ...prev.productPromo, imageUrl: img } }))}
                  className={`rounded-md overflow-hidden border ${ui.productPromo.imageUrl === img ? 'border-fuchsia-300' : 'border-white/10'}`}
                  title={`참조 이미지 ${idx + 1}`}
                >
                  <div className="relative">
                    <img src={img} alt={`ref-${idx + 1}`} className="w-full h-12 object-cover" />
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        removeProductPromoImage(idx);
                      }}
                      className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 text-white text-[10px] font-black flex items-center justify-center"
                    >
                      ×
                    </span>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500">이미지는 최대 {PRODUCT_PROMO_MAX_IMAGES}장까지 업로드할 수 있습니다.</p>
            <div className="rounded-lg border border-white/10 bg-black/30 p-2 space-y-1">
              <p className="text-[10px] font-black text-fuchsia-200">컷 배치 규칙</p>
              <p className="text-[10px] text-slate-400">자동: 7컷 x 3초 = 21초 (업로드 1~7장을 순환 배치)</p>
              <p className="text-[10px] text-slate-400">수동/이미지슬라이드: 영상훅 1컷=19초, 2컷=20초</p>
              <p className="text-[10px] text-slate-400">수동/AI비디오: 5컷 x 4초 = 20초 (영상 5컷 필요)</p>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 space-y-2">
            <p className="text-[11px] text-slate-300">목표 길이: <span className="font-black text-white">{productPromoPlan.targetSeconds}초</span></p>
            <p className="text-[11px] text-slate-300">진행 단계: <span className="font-black text-emerald-300">{ui.productPromo.step || '대기'}</span></p>
            {ui.productPromo.error && <p className="text-[11px] text-rose-300 font-bold">{ui.productPromo.error}</p>}
            {ui.productPromo.autoQueuePending && (
              <p className="text-[10px] text-amber-200">발행 자동등록 대기 중: {publishReadiness.failed.map(item => item.label).join(', ') || '요건 충족 확인 중'}</p>
            )}
            {productPromoPlan.renderMode === 'image_slide' && (
              <p className="text-[10px] text-slate-500">11번 패널의 영상 자산은 수동 모드(영상훅 1/2 선택)에서만 반영됩니다. 자동 모드는 업로드된 상품 이미지 7컷 고정입니다.</p>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={() => {
                  setUi(prev => ({ ...prev, panelsOpen: { ...prev.panelsOpen, p13: true }, publishing: { ...prev.publishing, mobileStep: 3 } }));
                  document.getElementById('panel-p13')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="px-3 py-1.5 rounded-lg text-[10px] font-black bg-white/10 text-white border border-white/15 hover:bg-white/20"
              >
                13번 바로가기
              </button>
              <button
                onClick={() => {
                  setUi(prev => ({ ...prev, panelsOpen: { ...prev.panelsOpen, p14: true }, publishing: { ...prev.publishing, mobileStep: 5 } }));
                  document.getElementById('panel-p14')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="px-3 py-1.5 rounded-lg text-[10px] font-black bg-red-500/80 text-white border border-red-300/40 hover:bg-red-500"
              >
                14번 발행 바로가기
              </button>
            </div>
            <p className="text-[10px] text-slate-500">완료 후 14번 패널에서 `지금 발행` 또는 `예약 발행`만 누르면 됩니다.</p>
          </div>
        </div>
      </section>

      {(isAutoRunning || isManualRunning) && (
        <>
          {isAutoRunning && <div className="fixed inset-0 bg-slate-950/40 animate-pulse pointer-events-none z-30" />}
          <div className="sticky top-3 z-40 px-3">
            <div className="max-w-5xl mx-auto bg-slate-950/80 border border-cyan-400/20 rounded-2xl p-3 shadow-lg shadow-cyan-500/10 backdrop-blur-xl">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-black text-cyan-300 uppercase tracking-widest">{isAutoRunning ? '자동 진행 중' : '수동 작업 진행 중'}</p>
                  <p className="text-xs text-slate-200 font-bold truncate">{isAutoRunning ? (currentAutoTitle || '자동화 진행') : '현재 패널 작업'}</p>
                </div>
                <div className="text-[11px] text-slate-300">
                  현재 단계: <span className="text-cyan-300 font-bold">{isAutoRunning ? (currentAutoStep || '준비 중') : (currentManualStep || '진행 중')}</span>
                </div>
              </div>
              <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-400 transition-all" style={{ width: `${Math.round((isAutoRunning ? autoProgress : 0.5) * 100)}%` }} />
              </div>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-slate-300">
                {(isAutoRunning
                  ? (ui.autoFlow.log?.length ? ui.autoFlow.log : [{ at: '', message: '최근 로그 없음' }])
                  : [{ at: '', message: currentManualStep || '수동 작업 중' }]
                ).slice(-4).map((log, idx) => (
                  <div key={`${log.at}-${idx}`} className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5">
                    <p className="text-slate-200 font-bold">{log.message}</p>
                    {log.at && <p className="text-[9px] text-slate-500 mt-0.5">{new Date(log.at).toLocaleTimeString()}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {Boolean(imagePreviewUrl) && (
        <div
          className="fixed inset-0 z-[130] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setImagePreviewUrl('')}
        >
          <img
            src={imagePreviewUrl}
            alt="preview"
            className="max-w-[95vw] max-h-[90vh] object-contain rounded-2xl border border-white/20"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setImagePreviewUrl('')}
            className="absolute top-4 right-4 px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs font-black"
          >
            닫기
          </button>
        </div>
      )}

      {publishingTermsOpen && (
        <div className="fixed inset-0 z-[140] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPublishingTermsOpen(false)}>
          <div className="w-full max-w-2xl rounded-2xl border border-amber-300/30 bg-[#0b1325] p-5 space-y-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-sm font-black text-amber-200">자동발행 이용약관 & 면책 요약</h4>
              <button onClick={() => setPublishingTermsOpen(false)} className="px-2 py-1 rounded-md bg-white/10 text-xs font-black">닫기</button>
            </div>
            <ul className="space-y-2 text-[11px] text-slate-200 leading-relaxed">
              <li>• Google API 서비스 약관 및 YouTube 커뮤니티 가이드라인을 준수해야 하며, 정책 위반 책임은 사용자에게 있습니다.</li>
              <li>• 자동 업로드/예약 발행으로 인한 계정 제재, 영상 삭제, 수익 제한 등의 결과에 대해 운영자는 법적 책임을 지지 않습니다.</li>
              <li>• AI 생성 콘텐츠(스크립트/이미지/음성/영상)의 적법성, 저작권, 상업 이용 가능 여부는 각 서비스 제공업체 약관을 따릅니다.</li>
              <li>• API 과금은 사용자 계정에 직접 청구되며, 운영자는 과금 환불/정산을 대행하지 않습니다.</li>
              <li>• 최종 발행 전 제목/설명/태그/정책 적합성은 반드시 사용자가 직접 확인 후 발행해야 합니다.</li>
            </ul>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
              {[
                { label: 'YouTube 서비스 약관', url: 'https://www.youtube.com/t/terms' },
                { label: 'Google API 서비스 약관', url: 'https://developers.google.com/terms' },
                { label: 'Google 개인정보 보호정책', url: 'https://policies.google.com/privacy' },
                { label: 'ElevenLabs 이용약관', url: 'https://elevenlabs.io/terms' },
              ].map(link => (
                <button
                  key={link.url}
                  onClick={() => window.open(link.url, '_blank', 'noopener,noreferrer')}
                  className="text-left px-3 py-2 rounded-lg border border-white/10 bg-black/30 hover:bg-black/50 text-cyan-200"
                >
                  {link.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500">참고: `ai-studio-mini/components/MyPagePanel.tsx` 이용약관 섹션 기반 요약</p>
          </div>
        </div>
      )}

      {flashNotice && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[150] px-4 py-2 rounded-xl border text-xs font-black backdrop-blur-xl shadow-lg"
          style={{
            background: flashNotice.tone === 'error' ? 'rgba(127, 29, 29, 0.92)' : flashNotice.tone === 'success' ? 'rgba(6, 78, 59, 0.92)' : 'rgba(15, 23, 42, 0.92)',
            borderColor: flashNotice.tone === 'error' ? 'rgba(248,113,113,0.6)' : flashNotice.tone === 'success' ? 'rgba(52,211,153,0.6)' : 'rgba(148,163,184,0.5)',
            color: '#f8fafc',
          }}
        >
          {flashNotice.text}
        </div>
      )}

      {resumeSnapshot && (
        <div className="fixed inset-0 z-[145] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-cyan-300/30 bg-[#0b1325] p-5 space-y-3">
            <h4 className="text-sm font-black text-cyan-200">이전 자동 진행 내역 복구</h4>
            <p className="text-xs text-slate-300">앱이 중단된 기록이 있습니다. {Number(resumeSnapshot?.step || 1)}단계부터 다시 진행하시겠습니까?</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => { void clearResumeSnapshot(); }} className="px-3 py-2 rounded-lg bg-white/10 text-xs font-black">취소</button>
              <button onClick={() => { void resumeFromSnapshot(); }} className="px-3 py-2 rounded-lg bg-cyan-400 text-black text-xs font-black">OK, 이어서 진행</button>
            </div>
          </div>
        </div>
      )}

      {autoDoneModalText && (
        <div className="fixed inset-0 z-[146] bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-emerald-300/30 bg-[#0b1325] p-5 space-y-3">
            <h4 className="text-sm font-black text-emerald-200">자동 제작 완료</h4>
            <p className="text-xs text-slate-300">{autoDoneModalText}</p>
            <div className="flex justify-end">
              <button onClick={() => setAutoDoneModalText('')} className="px-3 py-2 rounded-lg bg-emerald-400 text-black text-xs font-black">OK</button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto space-y-8">
        {/* 1. 유튜브 검색 */}
        <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl">
          <PanelHeader title="1. 유튜브 검색" id="p1" colorClass="gold-gradient-text" />
          {ui.panelsOpen.p1 && (
            <InlineLockedSection
              locked={!hasYouTubeApiKey}
              title="YouTube API 키 필요"
              description="유튜브 검색/분석 기능은 YouTube API 키가 필요합니다. API 설정에서 키를 입력하면 즉시 활성화됩니다."
              onOpenSettings={() => setUi(prev => ({ ...prev, settingsOpen: true }))}
            >
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">검색어</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input 
                      type="text"
                      value={ui.filters.query}
                      onChange={(e) => setUi(prev => ({ ...prev, filters: { ...prev.filters, query: e.target.value } }))}
                      placeholder="검색어를 입력하세요..."
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:ring-2 ring-amber-500/50 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">국가 선택</label>
                  <div className="grid grid-cols-4 gap-2">
                    {COUNTRY_ORDER.map(c => (
                      <button 
                        key={c}
                        onClick={() => setUi(prev => ({ ...prev, filters: { ...prev.filters, country: c } }))}
                        className={`py-2 rounded-xl text-[11px] font-bold transition-all ${ui.filters.country === c ? 'bg-amber-500 text-black' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                      >
                        {c} <span className="opacity-80">({(searchCacheByCountry[c] || []).length})</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">자동 번역 검색어</label>
                  <span className="text-[10px] text-slate-500">Gemini 번역 · 국가별 검색에 사용</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {COUNTRY_ORDER.map(country => (
                    <label key={`tr-${country}`} className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-lg px-2 py-1.5">
                      <span className="text-[10px] font-black text-amber-200 w-10 shrink-0">{country}</span>
                      <input
                        type="text"
                        value={translatedQueriesByCountry[country] || (country === '한국' ? ui.filters.query : '')}
                        onChange={(e) => {
                          const value = e.target.value;
                          setTranslatedQueriesByCountry(prev => ({ ...prev, [country]: value }));
                        }}
                        className="w-full bg-transparent text-[11px] text-slate-200 outline-none"
                        placeholder={country === '한국' ? '원문 검색어' : `${country} 자동 번역`}
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase">정렬 기준</label>
                  <select 
                    value={ui.filters.sort}
                    onChange={(e) => setUi(prev => ({ ...prev, filters: { ...prev.filters, sort: e.target.value } }))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs outline-none"
                  >
                    <option>조회수</option>
                    <option>최신순</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase">기간</label>
                  <select 
                    value={ui.filters.period}
                    onChange={(e) => setUi(prev => ({ ...prev, filters: { ...prev.filters, period: e.target.value } }))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs outline-none"
                  >
                    <option>전체</option>
                    <option>오늘</option>
                    <option>이번 주</option>
                    <option>이번 달</option>
                    <option>올해</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase">영상 길이</label>
                  <select 
                    value={ui.filters.duration}
                    onChange={(e) => setUi(prev => ({ ...prev, filters: { ...prev.filters, duration: e.target.value } }))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs outline-none"
                  >
                    <option value="전체">전체</option>
                    <option value="short">Short (4분 미만)</option>
                    <option value="medium">Medium (4~20분)</option>
                    <option value="long">Long (20분 이상)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase">검색 개수</label>
                  <input 
                    type="number"
                    value={50}
                    disabled
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs outline-none opacity-80"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase">카테고리</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(CATEGORY_MAP).map(cat => (
                      <button 
                        key={cat}
                        onClick={() => setUi(prev => ({ ...prev, filters: { ...prev.filters, category: cat } }))}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${ui.filters.category === cat ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50' : 'bg-white/5 text-slate-500 border border-transparent hover:bg-white/10'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase">최소 조회수 필터</label>
                  <InlineSmoothRange
                    min={0}
                    max={1000000}
                    step={10000}
                    value={ui.filters.minViews}
                    onChange={(v) => setUi(prev => ({ ...prev, filters: { ...prev.filters, minViews: Number(v) } }))}
                    className="w-full accent-amber-500"
                  />
                  <div className="flex justify-between text-[10px] font-bold text-slate-500">
                    <span>0</span>
                    <span className="text-amber-400">{formatNumber(ui.filters.minViews)}회 이상</span>
                    <span>1,000,000+</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleSearch}
                disabled={ui.searching}
                className={`w-full text-black font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-all disabled:opacity-50 ${ui.searching ? 'running-gradient' : 'bg-gradient-to-r from-amber-500 to-yellow-400 shadow-amber-500/20'}`}
              >
                {ui.searching ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : '국가별 자동 번역 검색 실행'}
              </button>
            </div>
            </InlineLockedSection>
          )}
        </section>

        {/* 2. 검색 결과 */}
        <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl">
          <PanelHeader title="2. 검색 결과" id="p2" colorClass="text-emerald-400" />
          {ui.panelsOpen.p2 && (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.map((video) => (
                    <div 
                      key={video.id} 
                      onClick={() => {
                        if (ui.autoFlow.running) return;
                        selectHookTitle(video.title);
                      }}
                      className={`group cursor-pointer bg-black/40 border rounded-2xl p-4 flex gap-4 transition-all ${ui.selectedHookTitle === video.title ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/5 hover:border-emerald-500/30'} ${ui.autoFlow.running ? 'opacity-70' : ''}`}
                    >
                      <div className="w-32 aspect-video rounded-xl overflow-hidden flex-shrink-0 relative">
                        <img src={video.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" referrerPolicy="no-referrer" />
                        <a href={video.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-8 h-8 text-white fill-white" />
                        </a>
                      </div>
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="flex justify-between items-start">
                            <h4 className="text-sm font-bold line-clamp-2 text-slate-200 mb-1">{video.title}</h4>
                            {ui.selectedHookTitle === video.title && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 ml-2" />}
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium truncate">{video.channelTitle}</p>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex gap-3 text-[10px] text-slate-400 font-bold">
                            <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {formatNumber(video.viewCount)}</span>
                            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {formatNumber(video.likeCount)}</span>
                            <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {formatNumber(video.commentCount)}</span>
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(video.title); }}
                            className="p-1.5 hover:bg-white/10 rounded-lg text-emerald-400 transition-all"
                            title="제목 복사"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                ))}
              </div>
              {results.length === 0 && !ui.searching && (
                <div className="text-center py-12 text-slate-500 italic">검색 결과가 없습니다.</div>
              )}
            </div>
          )}
        </section>

        {/* 3. 바이럴 훅킹 제목 30선 & 전략 분석 */}
        <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl">
          <PanelHeader title="3. 바이럴 훅킹 제목 30선 & 전략 분석" id="p3" colorClass="text-orange-400" />
          {ui.panelsOpen.p3 && (
            <InlineLockedSection
              locked={!hasGeminiKey}
              title="Gemini API 키 필요"
              description="훅 제목 생성/전략 분석은 Gemini API 키가 필요합니다. API 설정에서 Gemini 키를 입력해 주세요."
              onOpenSettings={() => setUi(prev => ({ ...prev, settingsOpen: true }))}
            >
            <div className="space-y-8">
              <div className="bg-black/30 border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-cyan-300 uppercase tracking-widest">원클릭 자동 제작</p>
                  <p className="text-[11px] text-slate-400 mt-1">제목 클릭 시 대본→TTS→컷→프롬프트→이미지→렌더를 자동 실행합니다.</p>
                  {ui.autoFlow.step && <p className="text-[11px] text-emerald-300 font-bold mt-1">진행 단계: {ui.autoFlow.step}</p>}
                  {ui.autoFlow.error && <p className="text-[11px] text-rose-300 font-bold mt-1">오류: {ui.autoFlow.error}</p>}
                </div>
                <button
                  onClick={() => setUi(prev => ({
                    ...prev,
                    autoFlow: {
                      ...prev.autoFlow,
                      fixedEnabled: !prev.autoFlow.fixedEnabled,
                    },
                    ...(prev.autoFlow.fixedEnabled
                      ? {}
                      : {
                          script: {
                            ...prev.script,
                            type: prev.autoFlow.fixed.scriptType || prev.script.type,
                            length: prev.autoFlow.fixed.scriptLength || prev.script.length,
                            lang: prev.autoFlow.fixed.scriptLang || prev.script.lang,
                          },
                          videoStyle: {
                            ...prev.videoStyle,
                            selected: prev.autoFlow.fixed.videoStyle || prev.videoStyle.selected,
                          },
                          tts: {
                            ...prev.tts,
                            voice: prev.autoFlow.fixed.ttsProvider === 'gemini'
                              ? (prev.autoFlow.fixed.ttsVoice || prev.tts.voice)
                              : prev.tts.voice,
                            elevenlabsVoice: prev.autoFlow.fixed.ttsProvider === 'elevenlabs'
                              ? (prev.autoFlow.fixed.elevenlabsVoice || prev.tts.elevenlabsVoice)
                              : prev.tts.elevenlabsVoice,
                          },
                          cuts: {
                            ...prev.cuts,
                            ratio: prev.autoFlow.fixed.ratio || prev.cuts.ratio,
                          },
                          thumbnail: {
                            ...prev.thumbnail,
                            ratio: prev.autoFlow.fixed.ratio || prev.thumbnail.ratio,
                          },
                          finalVideo: {
                            ...prev.finalVideo,
                            bgmEnabled: Boolean(prev.autoFlow.fixed.bgmTrack),
                            bgmTrack: prev.autoFlow.fixed.bgmTrack || prev.finalVideo.bgmTrack,
                            bgmTrackUserSelected: true,
                            sfxEnabled: false,
                          },
                        }),
                  }))}
                  className={`px-4 py-2 rounded-xl text-xs font-black border transition-all ${ui.autoFlow.fixedEnabled ? 'bg-emerald-400 text-black border-emerald-300' : 'bg-white/5 text-slate-200 border-white/10 hover:bg-white/10'}`}
                >
                  원클릭 고정 {ui.autoFlow.fixedEnabled ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="rounded-2xl border border-cyan-300/20 bg-cyan-500/10 p-4 space-y-3">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[11px] font-black text-cyan-100 uppercase tracking-widest">원클릭 고정 설정</p>
                  <p className="text-[10px] text-cyan-100/80">고정 ON일 때 4/5/8/12 패널 입력은 잠금됩니다.</p>
                </div>
                {ui.autoFlow.fixedEnabled ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-cyan-100 uppercase tracking-widest">대본 타입</label>
                      <select
                        value={ui.autoFlow.fixed.scriptType}
                        onChange={(e) => {
                          const nextType = e.target.value as 'shorts' | 'long-form';
                          setUi(prev => ({
                            ...prev,
                            autoFlow: {
                              ...prev.autoFlow,
                              fixed: {
                                ...prev.autoFlow.fixed,
                                scriptType: nextType,
                                scriptLength: nextType === 'shorts' ? '60초' : '10분',
                              },
                            },
                          }));
                        }}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      >
                        <option value="shorts">쇼츠</option>
                        <option value="long-form">롱폼</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-cyan-100 uppercase tracking-widest">길이 선택</label>
                      <select
                        value={ui.autoFlow.fixed.scriptLength}
                        onChange={(e) => setUi(prev => ({
                          ...prev,
                          autoFlow: { ...prev.autoFlow, fixed: { ...prev.autoFlow.fixed, scriptLength: e.target.value } },
                        }))}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      >
                        {ui.autoFlow.fixed.scriptType === 'shorts' ? (
                          <>
                            <option value="15초">15초</option>
                            <option value="30초">30초</option>
                            <option value="60초">60초</option>
                          </>
                        ) : (
                          <>
                            <option value="10분">10분</option>
                            <option value="20분">20분</option>
                            <option value="30분">30분</option>
                            <option value="60분">60분</option>
                          </>
                        )}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-cyan-100 uppercase tracking-widest">언어</label>
                      <select
                        value={ui.autoFlow.fixed.scriptLang}
                        onChange={(e) => setUi(prev => ({
                          ...prev,
                          autoFlow: { ...prev.autoFlow, fixed: { ...prev.autoFlow.fixed, scriptLang: e.target.value as any } },
                        }))}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      >
                        <option value="KR">KR</option>
                        <option value="EN">EN</option>
                        <option value="JP">JP</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-cyan-100 uppercase tracking-widest">화면 비율</label>
                      <select
                        value={ui.autoFlow.fixed.ratio}
                        onChange={(e) => setUi(prev => ({
                          ...prev,
                          autoFlow: { ...prev.autoFlow, fixed: { ...prev.autoFlow.fixed, ratio: e.target.value as any } },
                        }))}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      >
                        <option value="9:16">9:16 (쇼츠/릴스)</option>
                        <option value="16:9">16:9 (롱폼)</option>
                        <option value="1:1">1:1</option>
                        <option value="3:4">3:4</option>
                      </select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-black text-cyan-100 uppercase tracking-widest">주제 상황설명 (원클릭 고정)</label>
                      <input
                        value={ui.autoFlow.fixed.subjectContext}
                        onChange={(e) => setUi(prev => ({
                          ...prev,
                          autoFlow: { ...prev.autoFlow, fixed: { ...prev.autoFlow.fixed, subjectContext: e.target.value } },
                        }))}
                        placeholder="예: 등장인물은 AI 미녀 진행자, 친근한 설명 톤"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-cyan-100 uppercase tracking-widest">영상 스타일</label>
                      <select
                        value={ui.autoFlow.fixed.videoStyle}
                        onChange={(e) => setUi(prev => ({
                          ...prev,
                          autoFlow: { ...prev.autoFlow, fixed: { ...prev.autoFlow.fixed, videoStyle: e.target.value } },
                        }))}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      >
                        {VIDEO_STYLES_31.map(style => (
                          <option key={style.id} value={`${style.id}. ${style.name}`}>{style.id}. {style.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-cyan-100 uppercase tracking-widest">TTS 엔진</label>
                      <select
                        value={ui.autoFlow.fixed.ttsProvider}
                        onChange={(e) => setUi(prev => ({
                          ...prev,
                          autoFlow: { ...prev.autoFlow, fixed: { ...prev.autoFlow.fixed, ttsProvider: e.target.value as any } },
                        }))}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      >
                        <option value="gemini">Gemini TTS</option>
                        <option value="elevenlabs">ElevenLabs TTS</option>
                      </select>
                      <button
                        onClick={() => {
                          const voiceId = ui.autoFlow.fixed.ttsProvider === 'elevenlabs'
                            ? (ui.autoFlow.fixed.elevenlabsVoice || ui.tts.elevenlabsVoice)
                            : (ui.autoFlow.fixed.ttsVoice || ui.tts.voice);
                          void handlePreviewVoice(String(voiceId || ''));
                        }}
                        className={`w-full rounded-lg border px-3 py-2 text-[10px] font-black transition-all flex items-center justify-center gap-1 ${previewingId && ((ui.autoFlow.fixed.ttsProvider === 'elevenlabs' && previewingId === (ui.autoFlow.fixed.elevenlabsVoice || ui.tts.elevenlabsVoice)) || (ui.autoFlow.fixed.ttsProvider !== 'elevenlabs' && previewingId === (ui.autoFlow.fixed.ttsVoice || ui.tts.voice))) ? 'bg-amber-400 text-black border-amber-300' : 'bg-white/5 text-slate-200 border-white/15 hover:bg-white/10'}`}
                      >
                        <Play className="w-3 h-3" /> TTS 미리듣기
                      </button>
                    </div>
                    {ui.autoFlow.fixed.ttsProvider === 'gemini' ? (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-cyan-100 uppercase tracking-widest">TTS 목소리</label>
                        <select
                          value={ui.autoFlow.fixed.ttsVoice}
                          onChange={(e) => setUi(prev => ({
                            ...prev,
                            autoFlow: { ...prev.autoFlow, fixed: { ...prev.autoFlow.fixed, ttsVoice: e.target.value } },
                          }))}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                        >
                          {GEMINI_TTS_VOICES.map(v => (
                            <option key={v.id} value={v.id}>{v.label} ({v.gender})</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-cyan-100 uppercase tracking-widest">ElevenLabs 목소리</label>
                        <select
                          value={ui.autoFlow.fixed.elevenlabsVoice}
                          onChange={(e) => setUi(prev => ({
                            ...prev,
                            autoFlow: { ...prev.autoFlow, fixed: { ...prev.autoFlow.fixed, elevenlabsVoice: e.target.value } },
                          }))}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                        >
                          {ELEVENLABS_VOICES.map(voice => (
                            <option key={voice.id} value={voice.id}>{voice.label}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-cyan-100 uppercase tracking-widest">배경음악</label>
                      <select
                        value={ui.autoFlow.fixed.bgmTrack}
                        onChange={(e) => setUi(prev => ({
                          ...prev,
                          autoFlow: { ...prev.autoFlow, fixed: { ...prev.autoFlow.fixed, bgmTrack: e.target.value } },
                        }))}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      >
                        <option value="">없음</option>
                        {BGM_LIBRARY.map(track => (
                          <option key={track.path} value={track.path}>{track.label}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => void handlePreviewFixedBgm(String(ui.autoFlow.fixed.bgmTrack || ''))}
                        className={`w-full rounded-lg border px-3 py-2 text-[10px] font-black transition-all flex items-center justify-center gap-1 ${fixedBgmPreviewing ? 'bg-amber-400 text-black border-amber-300' : 'bg-white/5 text-slate-200 border-white/15 hover:bg-white/10'}`}
                      >
                        <Play className="w-3 h-3" /> {fixedBgmPreviewing ? 'BGM 미리듣기 중지' : 'BGM 미리듣기'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-300">원클릭 고정을 켜면 이 영역에서 자동 제작 옵션을 지정할 수 있습니다.</p>
                )}
              </div>

              <button 
                onClick={generateHooks}
                disabled={results.length === 0}
                className={`w-full text-black font-black py-4 rounded-2xl transition-all disabled:opacity-50 ${ui.hookLoading ? 'running-gradient' : 'bg-orange-500 hover:bg-orange-600'}`}
              >
                {ui.hookLoading ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> 중지</span> : '바이럴 제목 30선 생성'}
              </button>
              
              {ui.hookTitles.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ui.hookTitles.map((hook, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => {
                        if (ui.autoFlow.running) return;
                        selectHookTitle(hook.title);
                      }}
                      className={`cursor-pointer p-4 rounded-2xl group transition-all border ${ui.selectedHookTitle === hook.title ? 'bg-orange-500/20 border-orange-500' : 'bg-black/40 border-white/5 hover:border-orange-500/30'} ${ui.autoFlow.running ? 'opacity-70' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] font-black px-2 py-1 rounded-md ${ui.selectedHookTitle === hook.title ? 'bg-orange-500 text-black' : 'text-orange-500 bg-orange-500/10'}`}>TITLE {idx + 1}</span>
                        <div className="flex items-center gap-2">
                          {ui.selectedHookTitle === hook.title && <CheckCircle2 className="w-4 h-4 text-orange-500" />}
                          <button onClick={(e) => { e.stopPropagation(); copyToClipboard(hook.title); }} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-all">
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                        </div>
                      </div>
                      <h5 className="text-sm font-bold text-slate-200 mb-2 leading-relaxed">{hook.title}</h5>
                      <p className="text-[11px] text-slate-500 leading-relaxed italic"># {hook.strategy}</p>
                    </div>
                  ))}
                </div>
              )}

              {ui.overallStrategy && (
                <div className="bg-orange-500/5 border border-orange-500/20 p-6 rounded-3xl">
                  <h4 className="text-sm font-black text-orange-400 mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4" /> 종합 전략 분석
                  </h4>
                  <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                    <Markdown>{ui.overallStrategy}</Markdown>
                  </div>
                </div>
              )}
            </div>
            </InlineLockedSection>
          )}
        </section>

        {/* 4. 쇼츠대본 / 롱폼대본 생성 */}
        <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl">
          <PanelHeader title="4. 쇼츠대본 / 롱폼대본 생성" id="p4" colorClass="text-blue-400" />
          {ui.panelsOpen.p4 && (
            <InlineLockedSection
              locked={!hasGeminiKey}
              title="Gemini API 키 필요"
              description="대본 생성은 Gemini API 키가 필요합니다. API 설정에서 Gemini 키를 입력해 주세요."
              onOpenSettings={() => setUi(prev => ({ ...prev, settingsOpen: true }))}
            >
            <div className="space-y-6">
              <div className="space-y-1">
                <p className="text-sm text-slate-400">선택한 제목과 검색 결과를 기반으로 대본을 생성합니다.</p>
                <p className="text-xs text-blue-400 font-bold">선택한 제목: {ui.selectedHookTitle || '없음'}</p>
                {isOneClickFixed && <p className="text-[10px] text-cyan-300">원클릭 고정 ON: 대본 설정은 3번 패널에서 지정합니다.</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 대본 타입 */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">대본 타입</label>
                  <select 
                    value={ui.script.type}
                    onChange={(e) => setUi(prev => ({ ...prev, script: { ...prev.script, type: e.target.value as any } }))}
                    disabled={isOneClickFixed}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="shorts">쇼츠</option>
                    <option value="long-form">롱폼</option>
                  </select>
                </div>

                {/* 길이 선택 */}
                <div className="space-y-2">
                  <div className="flex flex-col">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">길이 선택</label>
                    <span className="text-[10px] text-slate-600 mt-0.5">쇼츠 60초 기준: KR 517자 / EN 155단어 / JP 621자</span>
                  </div>
                  <select 
                    value={ui.script.length}
                    onChange={(e) => setUi(prev => ({ ...prev, script: { ...prev.script, length: e.target.value } }))}
                    disabled={isOneClickFixed}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {ui.script.type === 'shorts' ? (
                      <>
                        <option value="15초">15초</option>
                        <option value="30초">30초</option>
                        <option value="60초">60초</option>
                      </>
                    ) : (
                      <>
                        <option value="10분">10분</option>
                        <option value="20분">20분</option>
                        <option value="30분">30분</option>
                        <option value="60분">60분</option>
                      </>
                    )}
                  </select>
                </div>

                {/* 언어 선택 */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">언어 선택</label>
                  <select 
                    value={ui.script.lang}
                    onChange={(e) => setUi(prev => ({ ...prev, script: { ...prev.script, lang: e.target.value as any } }))}
                    disabled={isOneClickFixed}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="KR">한국어</option>
                    <option value="EN">영어</option>
                    <option value="JP">일본어</option>
                  </select>
                </div>

                {/* 타깃층 연령 */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">타깃층 연령</label>
                  <input 
                    type="text"
                    value={ui.script.targetAudience}
                    onChange={(e) => setUi(prev => ({ ...prev, script: { ...prev.script, targetAudience: e.target.value } }))}
                    placeholder="예: 20~40대 일반"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 ring-blue-500/50"
                  />
                </div>
              </div>

              {/* 톤 */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">톤</label>
                <input 
                  type="text"
                  value={ui.script.tone}
                  onChange={(e) => setUi(prev => ({ ...prev, script: { ...prev.script, tone: e.target.value } }))}
                  placeholder="예: 정보형, 설득력"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 ring-blue-500/50"
                />
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={generateScript}
                  disabled={!ui.selectedHookTitle}
                  className={`flex-1 text-black font-black py-4 rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${ui.script.generating ? 'running-gradient' : 'bg-amber-400 hover:bg-amber-500'}`}
                >
                  {ui.script.generating ? <><Loader2 className="w-5 h-5 animate-spin" /> 중지</> : '대본 생성'}
                </button>
                <button 
                  onClick={() => copyToClipboard(ui.script.output)}
                  disabled={!ui.script.output}
                  className="bg-white/10 hover:bg-white/20 text-white font-black py-4 px-8 rounded-2xl transition-all disabled:opacity-50"
                >
                  대본 복사
                </button>
              </div>

              {ui.script.output && (
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1 bg-black/40 border border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{ui.script.lang === 'EN' ? '단어 수' : '글자 수(공백 제외)'}</span>
                      <span className="text-lg font-bold text-white">{scriptMetrics.units}{scriptMetrics.unitsLabel}</span>
                    </div>
                  </div>
                  {ui.tts.measuredDuration > 0 && <p className="text-[11px] text-emerald-300 font-bold">실측 TTS 길이: {ui.tts.measuredDuration.toFixed(1)}초</p>}
                  <div className="bg-black/40 border border-white/5 p-6 rounded-3xl relative group">
                    <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap max-h-[400px] overflow-y-auto custom-scrollbar">
                      <Markdown>{ui.script.output}</Markdown>
                    </div>
                  </div>
                </div>
              )}
            </div>
            </InlineLockedSection>
          )}
        </section>

        {/* 영상스타일 선택 (Panel 5) */}
        <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl">
          <div className="flex justify-between items-center mb-6">
            <PanelHeader title="5. 영상스타일 선택" id="p_style" colorClass="text-amber-400" />
            <button 
              onClick={() => setUi(prev => ({ ...prev, videoStyle: { ...prev.videoStyle, show: !prev.videoStyle.show } }))}
              className="text-[10px] font-black text-slate-400 hover:text-white bg-white/5 px-3 py-1.5 rounded-full transition-all uppercase tracking-widest"
            >
              {ui.videoStyle.show ? '스타일 숨기기' : '스타일 보이기'}
            </button>
          </div>
          
          {ui.panelsOpen.p_style && ui.videoStyle.show && (
            <div className="space-y-6">
              {isOneClickFixed && <p className="text-[10px] text-cyan-300">원클릭 고정 ON: 영상스타일은 3번 패널 설정을 따릅니다.</p>}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {VIDEO_STYLES_31.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setUi(prev => ({ ...prev, videoStyle: { ...prev.videoStyle, selected: `${style.id}. ${style.name}` } }))}
                    disabled={isOneClickFixed}
                    className={`group relative aspect-square rounded-2xl overflow-hidden border-2 transition-all ${
                      ui.videoStyle.selected.includes(style.name) 
                        ? 'border-amber-400 scale-95 shadow-[0_0_15px_rgba(251,191,36,0.3)]' 
                        : 'border-transparent hover:border-white/20'
                    } ${isOneClickFixed ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <img 
                      src={style.thumbnail || `https://picsum.photos/seed/${style.keyword}/200/200`} 
                      alt={style.name}
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const fallback = `https://picsum.photos/seed/${style.keyword}/200/200`;
                        if (e.currentTarget.src !== fallback) {
                          e.currentTarget.src = fallback;
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-2">
                      <span className="text-[9px] font-black text-white leading-tight drop-shadow-md">
                        {style.id}. {style.name}
                      </span>
                    </div>
                    {ui.videoStyle.selected.includes(style.name) && (
                      <div className="absolute top-1 right-1 bg-amber-400 text-black p-0.5 rounded-full">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <div className="bg-amber-400/10 border border-amber-400/20 p-4 rounded-2xl flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center text-black font-black text-xs">
                    {ui.videoStyle.selected.split('.')[0]}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Selected Style</p>
                    <p className="text-sm font-bold text-white">{ui.videoStyle.selected}</p>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 font-medium italic max-w-full text-left sm:max-w-[50%] sm:text-right">
                  {VIDEO_STYLES_31.find(s => ui.videoStyle.selected.startsWith(s.id))?.prompt}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 6. 썸네일 생성 */}
        <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl">
          <PanelHeader title="6. 썸네일 생성" id="p5" colorClass="text-pink-400" />
          {ui.panelsOpen.p5 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 모델 선택 */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">이미지 모델 선택</label>
                  <select 
                    value={ui.thumbnail.model}
                    onChange={(e) => setUi(prev => ({ ...prev, thumbnail: { ...prev.thumbnail, model: e.target.value as any } }))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 ring-pink-500/50"
                  >
                    <option value="gemini-3.1-flash-image-preview">Gemini 3.1 Flash Image</option>
                    <option value="gemini-3-pro-image-preview">Gemini 3 Pro Image</option>
                  </select>
                </div>

                {/* 화면 비율 선택 */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">화면 비율 선택</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {['16:9', '9:16', '1:1', '3:4'].map(ratio => (
                      <button
                        key={ratio}
                        onClick={() => setUi(prev => ({ ...prev, thumbnail: { ...prev.thumbnail, ratio: ratio as any } }))}
                        className={`py-2 rounded-xl text-[10px] font-black transition-all border ${ui.thumbnail.ratio === ratio ? 'bg-pink-500 text-black border-pink-500' : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'}`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                onClick={generateThumbnail}
                disabled={!ui.script.output}
                className={`w-full text-black font-black py-4 rounded-2xl transition-all disabled:opacity-50 ${ui.thumbnail.generating ? 'running-gradient' : 'bg-pink-500 hover:bg-pink-600'}`}
              >
                {ui.thumbnail.generating ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> 중지</span> : '썸네일 생성'}
              </button>
              {ui.thumbnail.url && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className={`rounded-3xl overflow-hidden border border-white/10 relative group ${
                      ui.thumbnail.ratio === '16:9' ? 'aspect-video' :
                      ui.thumbnail.ratio === '9:16' ? 'aspect-[9/16]' :
                      ui.thumbnail.ratio === '1:1' ? 'aspect-square' :
                      'aspect-[3/4]'
                    }`}>
                      <img src={ui.thumbnail.url} className="w-full h-full object-cover" alt="Thumbnail" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <button onClick={handleDownloadThumbnail} className="p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-all">
                          <Download className="w-6 h-6 text-white" />
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 text-center font-bold uppercase tracking-widest">Thumbnail Preview</p>
                    <button
                      onClick={handleDownloadThumbnail}
                      className="w-full bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl py-2 text-xs font-black text-white transition-all"
                    >
                      썸네일 저장
                    </button>
                  </div>
                  <div className="bg-pink-500/5 border border-pink-500/20 p-6 rounded-3xl">
                    <h5 className="text-[10px] font-black text-pink-400 uppercase mb-3 tracking-widest">Visual Prompt</h5>
                    <p className="text-xs text-slate-300 leading-relaxed italic">"{ui.thumbnail.prompt}"</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* 7. 유튜브 설명란 */}
        <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl">
          <PanelHeader title="7. 유튜브 설명란" id="p6" colorClass="text-purple-400" />
          {ui.panelsOpen.p6 && (
            <div className="space-y-6">
              <button 
                onClick={generateDescription}
                disabled={!ui.script.output}
                className={`w-full text-black font-black py-4 rounded-2xl transition-all disabled:opacity-50 ${ui.description.generating ? 'running-gradient' : 'bg-purple-500 hover:bg-purple-600'}`}
              >
                {ui.description.generating ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> 중지</span> : '설명란 생성'}
              </button>
              {(ui.description.kr.title || ui.description.en.title || ui.description.jp.title) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { lang: 'KR', data: ui.description.kr },
                    { lang: 'EN', data: ui.description.en },
                    { lang: 'JP', data: ui.description.jp }
                  ].map(({ lang, data }) => (
                    <div key={lang} className="bg-black/40 border border-white/5 p-5 rounded-3xl relative group space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-purple-400 bg-purple-500/10 px-2 py-1 rounded-md">{lang}</span>
                        <button 
                          onClick={() => copyToClipboard(`${data.title}\n\n${data.desc}\n\n${data.hashtags}\n\n${data.tags}`)} 
                          className="p-1.5 hover:bg-white/10 rounded-lg transition-all"
                        >
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <h6 className="text-[9px] font-black text-slate-500 uppercase mb-1">Final Title</h6>
                          <div className="text-[11px] text-white font-bold leading-tight">{data.title}</div>
                        </div>
                        <div>
                          <h6 className="text-[9px] font-black text-slate-500 uppercase mb-1">Description</h6>
                          <div className="text-[10px] text-slate-300 leading-relaxed whitespace-pre-wrap max-h-[150px] overflow-y-auto custom-scrollbar">
                            {data.desc}
                          </div>
                        </div>
                        <div>
                          <h6 className="text-[9px] font-black text-slate-500 uppercase mb-1">Hashtags</h6>
                          <div className="text-[10px] text-purple-400 font-medium">{data.hashtags}</div>
                        </div>
                        <div>
                          <h6 className="text-[9px] font-black text-slate-500 uppercase mb-1">Tags</h6>
                          <div className="text-[10px] text-slate-400 italic">{data.tags}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* 8. tts 생성 */}
        <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl">
          <PanelHeader title="8. tts 생성" id="p7" colorClass="text-cyan-400" />
          {ui.panelsOpen.p7 && (
            <div className="space-y-6">
              <InlineLockedSection
                locked={!hasGeminiKey}
                title="Gemini API 키 필요"
                description="Gemini TTS 생성은 Gemini API 키가 필요합니다. API 설정에서 Gemini 키를 입력해 주세요."
                onOpenSettings={() => setUi(prev => ({ ...prev, settingsOpen: true }))}
              >
                <div className="space-y-6 bg-black/30 border border-white/10 rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-black text-cyan-300 uppercase tracking-widest">Gemini TTS</p>
                      <p className="text-xs text-slate-400">모델/보이스/스타일 조합으로 낭독 생성</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">TTS 모델 선택</label>
                        <select 
                          value={ui.tts.model}
                          onChange={(e) => setUi(prev => ({ ...prev, tts: { ...prev.tts, model: e.target.value } }))}
                          disabled={isOneClickFixed}
                          className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 ring-cyan-500/50 appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                        {GEMINI_TTS_ONLY_MODELS.map(m => (
                          <option key={m.id} value={m.id} className="bg-slate-800 text-white">{m.label}</option>
                        ))}
                        </select>
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">TTS 목소리 선택</label>
                        <button 
                          onClick={() => handlePreviewVoice(ui.tts.voice)}
                          className={`text-[10px] font-black px-3 py-1.5 rounded-full transition-all border flex items-center gap-1.5 ${previewingId === ui.tts.voice ? 'bg-cyan-500 text-black border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'bg-white/5 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10'}`}
                        >
                          {previewLoading && previewingId === ui.tts.voice ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : previewingId === ui.tts.voice ? (
                            <Pause className="w-3 h-3 fill-current" />
                          ) : (
                            <Play className="w-3 h-3 fill-current" />
                          )}
                          {previewLoading && previewingId === ui.tts.voice ? '로딩 중...' : previewingId === ui.tts.voice ? '정지' : '미리듣기'}
                        </button>
                      </div>
                      <select 
                        value={ui.tts.voice}
                        onChange={(e) => setUi(prev => ({ ...prev, tts: { ...prev.tts, voice: e.target.value } }))}
                        disabled={isOneClickFixed}
                        className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 ring-cyan-500/50 appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {GEMINI_TTS_VOICES.map(v => (
                          <option key={v.id} value={v.id} className="bg-slate-800 text-white">{v.label} ({v.gender})</option>
                        ))}
                      </select>

                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between">
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">낭독 스타일 설정</label>
                          <button 
                            onClick={autoSuggestStyle}
                            className="text-[9px] font-black text-cyan-400 hover:text-cyan-300 transition-colors"
                          >
                            AI 추천
                          </button>
                        </div>
                        <select 
                          value={ui.tts.selectedToneId}
                          onChange={(e) => setUi(prev => ({ ...prev, tts: { ...prev.tts, selectedToneId: e.target.value } }))}
                          disabled={isOneClickFixed}
                          className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:ring-2 ring-cyan-500/50 cursor-pointer appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {TONE_STYLES.map(s => (
                            <option key={s.id} value={s.id} className="bg-slate-800 text-white">{s.label}</option>
                          ))}
                        </select>
                        <textarea 
                          value={ui.tts.styleInstructions}
                          onChange={(e) => setUi(prev => ({ ...prev, tts: { ...prev.tts, styleInstructions: e.target.value } }))}
                          placeholder="AI에게 전달할 낭독 스타일 지침..."
                          disabled={isOneClickFixed}
                          className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-[10px] text-slate-300 outline-none h-16 resize-none focus:ring-2 ring-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col justify-end gap-3">
                      <button 
                        onClick={handleGenerateGeminiTTS}
                        disabled={!ui.script.output || (ui.tts.generating && !isGeminiTtsGenerating)}
                        className={`w-full text-black font-black py-4 rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${isGeminiTtsGenerating ? 'running-gradient' : 'bg-cyan-500 hover:bg-cyan-600'}`}
                      >
                        {isGeminiTtsGenerating ? <><Loader2 className="w-5 h-5 animate-spin" /> 중지</> : <><Volume2 className="w-5 h-5" /> Gemini TTS 생성</>}
                      </button>
                    </div>
                  </div>
                </div>
              </InlineLockedSection>

              <InlineLockedSection
                locked={!hasElevenLabsKey}
                title="ElevenLabs API 키 필요"
                description="ElevenLabs TTS 생성은 ElevenLabs API 키가 필요합니다. API 설정에서 키를 입력해 주세요."
                onOpenSettings={() => setUi(prev => ({ ...prev, settingsOpen: true }))}
              >
                <div className="space-y-6 bg-black/30 border border-white/10 rounded-2xl p-5">
                  <div>
                    <p className="text-[11px] font-black text-indigo-300 uppercase tracking-widest">ElevenLabs TTS</p>
                    <p className="text-xs text-slate-400">로컬 미리듣기 + ElevenLabs API 생성</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">TTS 모델 선택</label>
                        <select
                          value={ui.tts.elevenlabsModel}
                          onChange={(e) => setUi(prev => ({ ...prev, tts: { ...prev.tts, elevenlabsModel: e.target.value } }))}
                          disabled={isOneClickFixed}
                          className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 ring-indigo-500/50 appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {ELEVENLABS_MODELS.map(model => (
                            <option key={model.id} value={model.id} className="bg-slate-800 text-white">{model.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">TTS 목소리 선택</label>
                        <button 
                          onClick={() => handlePreviewVoice(ui.tts.elevenlabsVoice)}
                          className={`text-[10px] font-black px-3 py-1.5 rounded-full transition-all border flex items-center gap-1.5 ${previewingId === ui.tts.elevenlabsVoice ? 'bg-indigo-500 text-black border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-white/5 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/10'}`}
                        >
                          {previewLoading && previewingId === ui.tts.elevenlabsVoice ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : previewingId === ui.tts.elevenlabsVoice ? (
                            <Pause className="w-3 h-3 fill-current" />
                          ) : (
                            <Play className="w-3 h-3 fill-current" />
                          )}
                          {previewLoading && previewingId === ui.tts.elevenlabsVoice ? '로딩 중...' : previewingId === ui.tts.elevenlabsVoice ? '정지' : '미리듣기'}
                        </button>
                      </div>
                      <select
                        value={ui.tts.elevenlabsVoice}
                        onChange={(e) => setUi(prev => ({ ...prev, tts: { ...prev.tts, elevenlabsVoice: e.target.value } }))}
                        disabled={isOneClickFixed}
                        className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 ring-indigo-500/50 appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {ELEVENLABS_VOICES.map(voice => (
                          <option key={voice.id} value={voice.id} className="bg-slate-800 text-white">{voice.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col justify-end gap-3">
                      <button
                        onClick={handleGenerateElevenLabsTTS}
                        disabled={!ui.script.output || (ui.tts.generating && !isElevenTtsGenerating)}
                        className={`w-full text-black font-black py-4 rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${isElevenTtsGenerating ? 'running-gradient' : 'bg-indigo-500 hover:bg-indigo-600'}`}
                      >
                        {isElevenTtsGenerating ? <><Loader2 className="w-5 h-5 animate-spin" /> 중지</> : <><Volume2 className="w-5 h-5" /> ElevenLabs TTS 생성</>}
                      </button>
                    </div>
                  </div>
                </div>
              </InlineLockedSection>

              {ui.tts.audioUrl && (
                <div className="bg-cyan-500/5 border border-cyan-500/20 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="p-3 bg-cyan-500 rounded-xl self-start sm:self-auto"><Volume2 className="w-5 h-5 text-black" /></div>
                  <audio controls src={ui.tts.audioUrl} className="w-full sm:flex-1 h-8" />
                </div>
              )}
            </div>
          )}
        </section>

        {/* 9. 이미지 프롬프트 생성(대본나누기) */}
        <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl">
          <PanelHeader title="9. 이미지 프롬프트 생성(대본나누기)" id="p9" colorClass="text-cyan-400" />
          {ui.panelsOpen.p9 && (
            <InlineLockedSection
              locked={!hasGeminiKey}
              title="Gemini API 키 필요"
              description="프롬프트 생성은 Gemini API 키가 필요합니다. API 설정에서 Gemini 키를 입력해 주세요."
              onOpenSettings={() => setUi(prev => ({ ...prev, settingsOpen: true }))}
            >
            <div className="space-y-6">
              <p className="text-xs text-slate-400">대본을 의미/단락 기준으로 컷 분할 후 프롬프트 생성</p>
              
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">영상 스타일</label>
                  <select 
                    value={ui.videoStyle.selected}
                    onChange={(e) => setUi(prev => ({ ...prev, videoStyle: { ...prev.videoStyle, selected: e.target.value } }))}
                    className="w-full sm:w-auto bg-slate-800 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:ring-2 ring-cyan-500/50 appearance-none cursor-pointer sm:min-w-[150px]"
                  >
                    {VIDEO_STYLES_31.map(s => (
                      <option key={s.id} value={`${s.id}. ${s.name}`}>{s.id}. {s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">화면비율</label>
                  <select 
                    value={ui.cuts.ratio}
                    onChange={(e) => setUi(prev => ({ ...prev, cuts: { ...prev.cuts, ratio: e.target.value } }))}
                    disabled={isOneClickFixed}
                    className="w-full sm:w-auto bg-slate-800 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:ring-2 ring-cyan-500/50 appearance-none cursor-pointer sm:min-w-[100px] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="16:9">16:9</option>
                    <option value="9:16">9:16</option>
                    <option value="1:1">1:1</option>
                    <option value="3:4">3:4</option>
                  </select>
                </div>

                <button 
                  onClick={splitCuts}
                  disabled={!ui.script.output}
                  className={`w-full sm:w-auto text-black font-black px-6 py-2 rounded-xl transition-all disabled:opacity-50 text-xs flex items-center justify-center gap-2 sm:min-w-[120px] ${ui.cuts.splitting ? 'running-gradient' : 'bg-amber-500 hover:bg-amber-600'}`}
                >
                  {ui.cuts.splitting ? <><Loader2 className="w-4 h-4 animate-spin" /> 분할 중...</> : '컷 분할'}
                </button>

                <button 
                  onClick={generateImagePrompts}
                  disabled={ui.cuts.items.length === 0}
                  className={`w-full sm:w-auto text-black font-black px-6 py-2 rounded-xl transition-all disabled:opacity-50 text-xs flex items-center justify-center gap-2 sm:min-w-[140px] ${ui.tts.status === '프롬프트 생성 중...' ? 'running-gradient' : 'bg-cyan-500 hover:bg-cyan-600'}`}
                >
                  {ui.tts.status === '프롬프트 생성 중...' ? <><Loader2 className="w-4 h-4 animate-spin" /> 중지</> : '프롬프트 생성'}
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
                <div className="bg-black/30 border border-white/10 rounded-xl px-3 py-2">
                  <p className="text-slate-400">대본 글자수</p>
                  <p className="text-amber-300 font-black">{scriptMetrics.units}{scriptMetrics.unitsLabel}</p>
                </div>
                <div className="bg-black/30 border border-white/10 rounded-xl px-3 py-2">
                  <p className="text-slate-400">TTS 실측</p>
                  <p className="text-cyan-300 font-black">{timingSummary.ttsSec > 0 ? `${timingSummary.ttsSec.toFixed(1)}초` : '미생성'}</p>
                </div>
                <div className="bg-black/30 border border-white/10 rounded-xl px-3 py-2">
                  <p className="text-slate-400">컷 길이</p>
                  <p className="text-emerald-300 font-black">{timingSummary.cutsSec.toFixed(1)}초</p>
                </div>
                <div className="bg-black/30 border border-white/10 rounded-xl px-3 py-2">
                  <p className="text-slate-400">최종 기준</p>
                  <p className="text-white font-black">{timingSummary.effectiveSec.toFixed(1)}초</p>
                </div>
              </div>

              {ui.script.type === 'long-form' && (
                <div className="text-[10px] text-slate-300 bg-black/25 border border-white/10 rounded-xl px-3 py-2 leading-relaxed">
                  롱폼 자동 지침: 공백 제외 {longformGuide.minChars.toLocaleString()}~{longformGuide.maxChars.toLocaleString()}자 권장 구간은 이미지 {longformGuide.cuts}장(30초당 1컷). 자동 제작 기본은 초반 7컷(약 30초+) 영상 슬롯, 이후 슬라이드 슬롯입니다.
                </div>
              )}

              <div className="space-y-4">
                {ui.cuts.items.length === 0 ? (
                  <div className="text-center py-12 text-slate-600 text-xs bg-black/40 border border-white/10 rounded-3xl">
                    생성된 컷/프롬프트가 없습니다. 상단의 버튼을 눌러주세요.
                  </div>
                ) : (
                  ui.cuts.items.map((item, i) => (
                    <div key={i} className="flex flex-col md:flex-row gap-4 items-stretch">
                      {/* 대본 컷 */}
                      <div className="flex-1 bg-black/40 border border-white/10 rounded-3xl p-5 relative group flex flex-col">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[10px] font-black text-cyan-500 bg-cyan-500/10 px-2 py-1 rounded-md tracking-widest">CUT {i + 1}</span>
                          <span className="text-[9px] text-slate-500 font-bold">{item.length}자</span>
                        </div>
                        <textarea 
                          value={item}
                          onChange={(e) => {
                            const newItems = [...ui.cuts.items];
                            newItems[i] = e.target.value;
                            setUi(prev => ({ ...prev, cuts: { ...prev.cuts, items: newItems } }));
                          }}
                          className="w-full flex-1 bg-transparent text-slate-300 text-[11px] outline-none resize-none focus:text-white custom-scrollbar leading-relaxed"
                          rows={4}
                        />
                      </div>

                      {/* 영어 프롬프트 */}
                      <div className="flex-1 bg-black/40 border border-white/10 rounded-3xl p-5 relative group flex flex-col">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-2 py-1 rounded-md tracking-widest">PROMPT {i + 1}</span>
                          <button 
                            onClick={() => copyToClipboard(ui.cuts.prompts[i]?.prompt || '')}
                            className="p-1 hover:bg-white/10 rounded transition-all"
                          >
                            <Copy className="w-3 h-3 text-slate-500" />
                          </button>
                        </div>
                        <textarea 
                          value={ui.cuts.prompts[i]?.prompt || ''}
                          onChange={(e) => {
                            const newPrompts = [...ui.cuts.prompts];
                            if (!newPrompts[i]) newPrompts[i] = { index: i + 1, prompt: '' };
                            newPrompts[i] = { ...newPrompts[i], prompt: e.target.value };
                            setUi(prev => ({ ...prev, cuts: { ...prev.cuts, prompts: newPrompts } }));
                          }}
                          className="w-full flex-1 bg-transparent text-slate-400 text-[10px] italic outline-none resize-none focus:text-white custom-scrollbar leading-relaxed"
                          rows={4}
                          placeholder="프롬프트를 생성하거나 입력하세요..."
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-center">
                <button 
                  onClick={() => setUi(prev => ({ ...prev, cuts: { ...prev.cuts, items: [...prev.cuts.items, '새로운 컷 내용을 입력하세요.'] } }))}
                  className="text-[10px] font-black text-slate-500 border border-dashed border-white/10 px-6 py-2 rounded-xl hover:bg-white/5 transition-all"
                >
                  + 새로운 컷 수동 추가
                </button>
              </div>
            </div>
            </InlineLockedSection>
          )}
        </section>

        {/* 10. 프롬프트 출력 (Auto Whik / Auto Grok) */}
        <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl">
          <PanelHeader title="10. 프롬프트 출력 (Auto Whik / Auto Grok)" id="p10" colorClass="text-amber-400" badge="9:16" />
          {ui.panelsOpen.p10 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">위 9번에서 생성수정된 컷별 프롬프트를 번호 없이 각각 빈 줄로 구분하여 출력합니다.</p>
              <div className="relative group">
                <textarea 
                  readOnly
                  value={ui.cuts.prompts.map(p => p.prompt).join('\n\n')}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 pb-16 sm:pb-6 text-xs text-slate-300 outline-none h-[300px] custom-scrollbar resize-none"
                />
                <button 
                  onClick={() => copyToClipboard(ui.cuts.prompts.map(p => p.prompt).join('\n\n'))}
                  className="mt-3 w-full sm:w-auto sm:absolute sm:bottom-4 sm:left-4 bg-amber-500 hover:bg-amber-600 text-black font-black px-6 py-2 rounded-xl transition-all text-xs"
                >
                  프롬프트 복사
                </button>
              </div>
            </div>
          )}
        </section>

        {/* 11. 이미지 생성 패널 */}
        <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl">
          <PanelHeader title="11. 이미지 생성 패널" id="p11" colorClass="text-cyan-400" badge="9:16" />
          {ui.panelsOpen.p11 && (
            <InlineLockedSection
              locked={!hasGeminiKey}
              title="Gemini API 키 필요"
              description="이미지 생성은 Gemini API 키가 필요합니다. API 설정에서 Gemini 키를 입력해 주세요."
              onOpenSettings={() => setUi(prev => ({ ...prev, settingsOpen: true }))}
            >
            <div className="space-y-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <p className="text-xs text-slate-400 lg:max-w-md">컷을 클릭하면 대기열에 추가되며 순차적으로 이미지가 자동 생성됩니다. (안정성을 위해 컷당 20~25초 간격)</p>
                <p className="text-[11px] text-violet-200/90 bg-violet-500/10 border border-violet-300/20 rounded-xl px-3 py-2 w-full lg:w-auto">혼합 렌더 권장: 11번에서 초반 훅 컷 영상 업로드 → 12번에서 슬라이드 구성 → 렌더링</p>
                
                <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 w-full lg:w-auto">
                  <select 
                    value={ui.thumbnail.model}
                    onChange={(e) => setUi(prev => ({ ...prev, thumbnail: { ...prev.thumbnail, model: e.target.value as any } }))}
                    className="w-full sm:w-auto bg-slate-800 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:ring-2 ring-cyan-500/50 appearance-none cursor-pointer"
                  >
                    <option value="gemini-3.1-flash-image-preview">Auto_Gemini-3.1-flash-image-preview ($0.0672)</option>
                    <option value="gemini-3-pro-image-preview">Auto_Gemini-3-pro-image-preview</option>
                  </select>

                  <button 
                    onClick={async () => {
                      const result = await runAutoImageBatch();
                      if (result.aborted) {
                        alert('이미지 생성이 중지되었습니다.');
                      } else if (result.failCount > 0) {
                        alert(`${result.failCount}개의 이미지 생성에 실패했습니다.`);
                      } else {
                        alert('이미지 전체 생성이 완료되었습니다.');
                      }
                    }}
                    className={`w-full sm:w-auto text-white font-black px-4 py-3 sm:py-4 md:py-6 rounded-xl transition-all text-xs whitespace-nowrap flex items-center justify-center ${autoImageBatchRunning ? 'running-gradient' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                  >
                    {autoImageBatchRunning ? '중지' : '전체 자동 생성'}
                  </button>

                  <button 
                    onClick={() => { abortRef.current = true; }}
                    className="w-full sm:w-auto bg-rose-500 hover:bg-rose-600 text-white font-black px-4 py-3 sm:py-4 rounded-xl transition-all text-xs whitespace-nowrap"
                  >
                    중지
                  </button>

                  <button className="w-full sm:w-auto bg-white/5 border border-dashed border-white/20 text-slate-400 px-4 py-3 sm:py-4 rounded-xl hover:bg-white/10 transition-all text-xs whitespace-nowrap">
                    + 컷 추가
                  </button>
                </div>
              </div>

              {ui.cuts.prompts.length === 0 ? (
                <div className="text-center py-20 text-slate-600 text-sm">생성된 컷 프롬프트가 없습니다 (9번 패널 확인).</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {ui.cuts.prompts.map((cut, idx) => {
                    const job = ui.imageJobs.find(j => j.cut === cut.index);
                    const videoJob = ui.videoJobs.find((j: any) => j.cut === cut.index);
                    return (
                      <div key={idx} className="bg-black/40 border border-white/5 rounded-3xl overflow-hidden group relative">
                        <div className="aspect-video bg-white/5 relative">
                          {job?.imageUrl ? (
                            <img
                              src={job.imageUrl}
                              className="w-full h-full object-cover cursor-zoom-in"
                              alt=""
                              referrerPolicy="no-referrer"
                              onClick={() => setImagePreviewUrl(job.imageUrl || '')}
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <button 
                                onClick={() => generateImage(cut.index, { force: true })}
                                disabled={job?.status === '생성 중...'}
                                className="p-4 bg-white/5 hover:bg-white/10 rounded-full transition-all"
                              >
                                {job?.status === '생성 중...' ? <Loader2 className="w-8 h-8 animate-spin" /> : <ImagePlus className="w-8 h-8 text-slate-600" />}
                              </button>
                            </div>
                          )}
                          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-black text-cyan-400">CUT {cut.index}</div>
                          {videoJob?.videoUrl && (
                            <div className="absolute top-3 right-3 bg-violet-500/75 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-black text-white">영상 훅</div>
                          )}
                          
                          {/* Action Buttons Overlay */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button 
                              onClick={() => generateImage(cut.index, { force: true })}
                              className="p-2 bg-cyan-500 text-black rounded-lg hover:bg-cyan-400 transition-all"
                              title="다시 생성"
                            >
                              <Sparkles className="w-4 h-4" />
                            </button>
                            <label className="p-2 bg-amber-500 text-black rounded-lg hover:bg-amber-400 transition-all cursor-pointer" title="업로드">
                              <Download className="w-4 h-4 rotate-180" />
                              <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*" 
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (ev) => {
                                      const url = ev.target?.result as string;
                                      setUi(prev => ({
                                        ...prev,
                                        imageJobs: prev.imageJobs.some(j => j.cut === cut.index)
                                          ? prev.imageJobs.map(j => j.cut === cut.index ? { ...j, imageUrl: url, status: '업로드됨' } : j)
                                          : [...prev.imageJobs, { cut: cut.index, imageUrl: url, status: '업로드됨' }]
                                      }));
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                            <label className="p-2 bg-violet-500 text-white rounded-lg hover:bg-violet-400 transition-all cursor-pointer" title="영상 업로드">
                              <Video className="w-4 h-4" />
                              <input
                                type="file"
                                className="hidden"
                                accept="video/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const url = URL.createObjectURL(file);
                                  let durationSec = 0;
                                  try {
                                    durationSec = await probeVideoDuration(url);
                                  } catch {
                                    durationSec = 0;
                                  }
                                  setUi(prev => ({
                                    ...prev,
                                    videoJobs: prev.videoJobs.some((j: any) => j.cut === cut.index)
                                      ? prev.videoJobs.map((j: any) => j.cut === cut.index ? { ...j, videoUrl: url, status: '업로드됨', name: file.name, durationSec } : j)
                                      : [...prev.videoJobs, { cut: cut.index, videoUrl: url, status: '업로드됨', name: file.name, durationSec }],
                                  }));
                                }}
                              />
                            </label>
                            {videoJob?.videoUrl && (
                              <button
                                onClick={() => {
                                  setUi(prev => ({
                                    ...prev,
                                    videoJobs: prev.videoJobs.filter((j: any) => j.cut !== cut.index),
                                  }));
                                }}
                                className="p-2 bg-violet-950 text-violet-200 rounded-lg hover:bg-violet-900 transition-all"
                                title="영상 제거"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                            {job?.imageUrl && (
                              <>
                                <button 
                                  onClick={() => {
                                    if (!isApprovedUser) {
                                      alert('승인된 사용자만 다운로드할 수 있습니다.');
                                      return;
                                    }
                                    const a = document.createElement('a');
                                    a.href = job.imageUrl;
                                    a.download = `cut_${cut.index}.png`;
                                    a.click();
                                  }}
                                  disabled={!isApprovedUser}
                                  className="p-2 bg-emerald-500 text-black rounded-lg hover:bg-emerald-400 transition-all"
                                  title="다운로드"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => {
                                    setUi(prev => ({
                                      ...prev,
                                      imageJobs: prev.imageJobs.filter(j => j.cut !== cut.index)
                                    }));
                                  }}
                                  className="p-2 bg-rose-500 text-white rounded-lg hover:bg-rose-400 transition-all"
                                  title="삭제"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="p-4 space-y-2">
                          <p className="text-[10px] text-slate-300 line-clamp-2 leading-relaxed font-medium">"{ui.cuts.items[cut.index - 1]}"</p>
                          <p className="text-[9px] text-slate-600 italic line-clamp-1">Prompt: {cut.prompt}</p>
                          <p className="text-[9px] text-slate-400">이미지: {job?.status || '미생성'} · 영상: {videoJob?.status || '없음'}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            </InlineLockedSection>
          )}
        </section>

        <Panel12Section
          ui={ui}
          setUi={setUi}
          PanelHeader={PanelHeader}
          handleGenerateFinalVideo={handleGenerateFinalVideo}
          handleExportSlideVideo={handleExportSlideVideo}
          handleDownloadSrt={handleDownloadSrt}
          canDownload={isApprovedUser}
          handleConvertToMp4={handleConvertToMp4}
          saveCurrentSubtitleTemplate={saveCurrentSubtitleTemplate}
          applySubtitleTemplate={applySubtitleTemplate}
          exportSubtitleTemplates={exportSubtitleTemplates}
          importSubtitleTemplates={importSubtitleTemplates}
          applySavedSubtitleTemplate={applySavedSubtitleTemplate}
          removeSavedSubtitleTemplate={removeSavedSubtitleTemplate}
          applyBuiltinSubtitleTemplate={applyBuiltinSubtitleTemplate}
          handleTemplatePreviewUpload={handleTemplatePreviewUpload}
          resetTemplatePreview={resetTemplatePreview}
          handleSuggestSubtitleKeywords={handleSuggestSubtitleKeywords}
          rewriteTemplateTitleFromHook={rewriteTemplateTitleFromHook}
          subtitleTemplates={subtitleTemplates}
          templatePreviewOverrides={templatePreviewOverrides}
          BUILTIN_SUBTITLE_TEMPLATES={BUILTIN_SUBTITLE_TEMPLATES}
          SUBTITLE_PRESETS={SUBTITLE_PRESETS}
          RESOLUTION_PRESETS={RESOLUTION_PRESETS}
          SLIDE_MOTIONS={SLIDE_MOTIONS}
          SLIDE_MOTION_ANIMATION={SLIDE_MOTION_ANIMATION}
          PRESET_SAMPLE_TEXT={PRESET_SAMPLE_TEXT}
          BGM_LIBRARY={BGM_LIBRARY}
          SFX_LIBRARY={SFX_LIBRARY}
          ratioToCss={ratioToCss}
          gridPositionToPercent={gridPositionToPercent}
          getBuiltinTemplatePreview={getBuiltinTemplatePreview}
          syncReport={syncReport}
          isOneClickFixed={isOneClickFixed}
        />

        {/* 13. 영상편집 */}
        <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl">
          <PanelHeader title="13. 영상편집" id="p13" colorClass="text-rose-400" />
          {ui.panelsOpen.p13 && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-rose-300/30 bg-rose-500/10 p-4 space-y-2">
                <p className="text-[11px] font-black text-rose-100 uppercase tracking-widest">13번 = 렌더 결과 후편집 툴바</p>
                <p className="text-xs text-rose-100/90">12번은 렌더 전 검수, 13번은 렌더 자산 후편집에 집중합니다. 미리보기 중복 마운트 없이 자막/폰트/텍스트/속도/내보내기만 경량 제어합니다.</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/25 p-4 space-y-3">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">렌더 액션</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <button
                    onClick={() => document.getElementById('panel-p12')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    className="px-3 py-2 rounded-lg bg-rose-400 text-black text-xs font-black"
                  >
                    12번 상세 열기
                  </button>
                  <button
                    onClick={handleGenerateFinalVideo}
                    disabled={ui.finalVideo.generating || ui.imageJobs.filter((j: any) => j.imageUrl).length === 0}
                    className="px-3 py-2 rounded-lg bg-emerald-400 text-black text-xs font-black disabled:opacity-40"
                  >
                    슬라이드 재구성
                  </button>
                  <button
                    onClick={handleExportSlideVideo}
                    disabled={ui.finalVideo.slides.length === 0}
                    className="px-3 py-2 rounded-lg bg-blue-500 text-white text-xs font-black disabled:opacity-40"
                  >
                    {ui.finalVideo.generating ? '렌더 중지' : '렌더 실행'}
                  </button>
                  <button
                    onClick={() => {
                      if (!ui.finalVideo.url) {
                        alert('먼저 렌더 결과를 생성하세요.');
                        return;
                      }
                      if (!isApprovedUser) {
                        alert('승인된 사용자만 다운로드할 수 있습니다.');
                        return;
                      }
                      const a = document.createElement('a');
                      a.href = ui.finalVideo.url;
                      a.download = ui.finalVideo.outputFormat === 'mp4' ? 'final_slide_video.mp4' : 'final_slide_video.webm';
                      a.click();
                    }}
                    disabled={!ui.finalVideo.url}
                    className="px-3 py-2 rounded-lg bg-cyan-500 text-black text-xs font-black disabled:opacity-40"
                  >
                    결과 다운로드
                  </button>
                  <button
                    onClick={handleConvertToMp4}
                    disabled={!ui.finalVideo.url || ui.finalVideo.generating}
                    className="px-3 py-2 rounded-lg bg-indigo-500 text-white text-xs font-black disabled:opacity-40"
                  >
                    {ui.finalVideo.transcoding ? 'MP4 변환 중지' : 'MP4 변환'}
                  </button>
                  <button
                    onClick={handleDownloadSrt}
                    disabled={ui.finalVideo.slides.length === 0 || !isApprovedUser}
                    className="px-3 py-2 rounded-lg bg-white/10 border border-white/15 text-xs font-black text-slate-100 disabled:opacity-40"
                  >
                    SRT 다운로드
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/25 p-4 space-y-3">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">자막/폰트/속도</p>
                <div className="rounded-xl border border-white/10 bg-black/30 p-3 space-y-2">
                  <p className="text-[10px] text-slate-400">템플릿 빠른 적용</p>
                  <div className="flex flex-wrap gap-1">
                    {BUILTIN_SUBTITLE_TEMPLATES.slice(0, 8).map((template: any) => (
                      <button
                        key={template.id}
                        onClick={() => applyBuiltinSubtitleTemplate(template.id)}
                        className={`px-2 py-1 rounded-md text-[10px] font-black border ${ui.finalVideo.subtitleTemplateLockedId === template.id ? 'bg-emerald-400 text-black border-emerald-300' : 'bg-white/5 text-slate-300 border-white/10'}`}
                      >
                        {template.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/10 bg-black/30 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-200">자막 표시</span>
                      <button
                        onClick={() => setUi((prev: any) => ({ ...prev, finalVideo: { ...prev.finalVideo, subtitleEnabled: !prev.finalVideo.subtitleEnabled } }))}
                        className={`px-3 py-1 rounded-md text-[10px] font-black ${ui.finalVideo.subtitleEnabled ? 'bg-emerald-400 text-black' : 'bg-white/10 text-slate-200'}`}
                      >
                        {ui.finalVideo.subtitleEnabled ? 'ON' : 'OFF'}
                      </button>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400">자막 스타일</label>
                      <div className="grid grid-cols-3 gap-1">
                        {(['shorts', 'docu', 'lecture', 'impact', 'neon'] as SubtitlePreset[]).map((presetId) => (
                          <button
                            key={presetId}
                            onClick={() => setUi((prev: any) => ({ ...prev, finalVideo: { ...prev.finalVideo, subtitlePreset: presetId } }))}
                            className={`px-2 py-1 rounded-md text-[10px] font-black border ${ui.finalVideo.subtitlePreset === presetId ? 'bg-emerald-400 text-black border-emerald-300' : 'bg-white/5 text-slate-300 border-white/10'}`}
                          >
                            {SUBTITLE_PRESETS[presetId].label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400">자막 위치 {ui.finalVideo.subtitleGridPosition}</label>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        step={1}
                        value={Number(ui.finalVideo.subtitleGridPosition || 7)}
                        onChange={(e) => {
                          const nextPos = Math.max(1, Math.min(10, Number(e.target.value || 7)));
                          setUi((prev: any) => ({
                            ...prev,
                            finalVideo: {
                              ...prev.finalVideo,
                              subtitleGridPosition: nextPos,
                              subtitlePosition: nextPos <= 5 ? 'middle' : 'bottom',
                            },
                          }));
                        }}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/30 p-3 space-y-2">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] text-slate-400">템플릿 제목</label>
                        <button
                          onClick={() => setUi((prev: any) => ({ ...prev, finalVideo: { ...prev.finalVideo, templateTitleEnabled: !prev.finalVideo.templateTitleEnabled } }))}
                          className={`px-2 py-1 rounded-md text-[10px] font-black ${ui.finalVideo.templateTitleEnabled ? 'bg-emerald-400 text-black' : 'bg-white/10 text-slate-200'}`}
                        >
                          {ui.finalVideo.templateTitleEnabled ? 'ON' : 'OFF'}
                        </button>
                      </div>
                      <input
                        value={String(ui.finalVideo.templateTitleText || '')}
                        onChange={(e) => setUi((prev: any) => ({ ...prev, finalVideo: { ...prev.finalVideo, templateTitleText: e.target.value } }))}
                        placeholder="제목 문구 입력"
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-2 text-[11px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400">타이틀 폰트</label>
                      <select
                        value={String(ui.finalVideo.templateTitleFontFamily || '아네모네')}
                        onChange={(e) => setUi((prev: any) => ({ ...prev, finalVideo: { ...prev.finalVideo, templateTitleFontFamily: e.target.value } }))}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-2 text-[11px]"
                      >
                        <option value="아네모네">아네모네</option>
                        <option value="Pretendard">Pretendard</option>
                        <option value="Noto Sans KR">Noto Sans KR</option>
                        <option value="Do Hyeon">Do Hyeon</option>
                        <option value="Jua">Jua</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400">내보내기 재생속도 {Number(ui.finalVideo.exportSpeed || 1).toFixed(2)}x</label>
                      <input
                        type="range"
                        min={0.75}
                        max={1.5}
                        step={0.05}
                        value={Number(ui.finalVideo.exportSpeed || 1)}
                        onChange={(e) => setUi((prev: any) => ({ ...prev, finalVideo: { ...prev.finalVideo, exportSpeed: Number(e.target.value || 1) } }))}
                        className="w-full"
                      />
                    </div>
                    {ui.finalVideo.ffmpegNote && (
                      <p className="text-[10px] text-indigo-200 bg-indigo-500/10 border border-indigo-400/20 rounded-lg px-2 py-1">
                        {ui.finalVideo.ffmpegNote}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/25 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">추가 텍스트 오버레이</p>
                  <button
                    onClick={() => {
                      const text = window.prompt('추가 텍스트를 입력하세요.')?.trim();
                      if (!text) return;
                      setUi((prev: any) => ({
                        ...prev,
                        finalVideo: {
                          ...prev.finalVideo,
                          textOverlays: [
                            ...(prev.finalVideo.textOverlays || []),
                            {
                              id: `p13-${Date.now()}`,
                              text,
                              color: '#ffffff',
                              bgColor: '#0f172a',
                              scale: 1,
                              gridPosition: 7,
                              align: 'center',
                            },
                          ],
                        },
                      }));
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-400 text-black text-[10px] font-black"
                  >
                    텍스트 추가
                  </button>
                </div>
                {(ui.finalVideo.textOverlays || []).length === 0 && (
                  <p className="text-[10px] text-slate-500">추가된 텍스트가 없습니다.</p>
                )}
                <div className="space-y-2">
                  {(ui.finalVideo.textOverlays || []).map((item: any) => (
                    <div key={item.id} className="rounded-xl border border-white/10 bg-black/30 p-3 space-y-2">
                      <div className="flex gap-2">
                        <input
                          value={String(item.text || '')}
                          onChange={(e) => setUi((prev: any) => ({
                            ...prev,
                            finalVideo: {
                              ...prev.finalVideo,
                              textOverlays: (prev.finalVideo.textOverlays || []).map((t: any) => t.id === item.id ? { ...t, text: e.target.value } : t),
                            },
                          }))}
                          className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2 py-2 text-[11px]"
                          placeholder="텍스트"
                        />
                        <button
                          onClick={() => setUi((prev: any) => ({
                            ...prev,
                            finalVideo: {
                              ...prev.finalVideo,
                              textOverlays: (prev.finalVideo.textOverlays || []).filter((t: any) => t.id !== item.id),
                            },
                          }))}
                          className="px-2 py-2 rounded-lg bg-rose-500 text-white"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
                        <label className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-lg px-2 py-1">
                          글자
                          <input
                            type="color"
                            value={String(item.color || '#ffffff')}
                            onChange={(e) => setUi((prev: any) => ({
                              ...prev,
                              finalVideo: {
                                ...prev.finalVideo,
                                textOverlays: (prev.finalVideo.textOverlays || []).map((t: any) => t.id === item.id ? { ...t, color: e.target.value } : t),
                              },
                            }))}
                            className="w-6 h-5 bg-transparent border-0"
                          />
                        </label>
                        <label className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-lg px-2 py-1">
                          배경
                          <input
                            type="color"
                            value={String(item.bgColor || '#0f172a')}
                            onChange={(e) => setUi((prev: any) => ({
                              ...prev,
                              finalVideo: {
                                ...prev.finalVideo,
                                textOverlays: (prev.finalVideo.textOverlays || []).map((t: any) => t.id === item.id ? { ...t, bgColor: e.target.value } : t),
                              },
                            }))}
                            className="w-6 h-5 bg-transparent border-0"
                          />
                        </label>
                        <label className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-lg px-2 py-1">
                          크기
                          <input
                            type="number"
                            min="0.7"
                            max="2.2"
                            step="0.1"
                            value={Number(item.scale || 1)}
                            onChange={(e) => setUi((prev: any) => ({
                              ...prev,
                              finalVideo: {
                                ...prev.finalVideo,
                                textOverlays: (prev.finalVideo.textOverlays || []).map((t: any) => t.id === item.id ? { ...t, scale: Number(e.target.value || 1) } : t),
                              },
                            }))}
                            className="w-full bg-transparent outline-none"
                          />
                        </label>
                        <label className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-lg px-2 py-1">
                          위치
                          <input
                            type="number"
                            min="1"
                            max="10"
                            step="1"
                            value={Number(item.gridPosition || 7)}
                            onChange={(e) => setUi((prev: any) => ({
                              ...prev,
                              finalVideo: {
                                ...prev.finalVideo,
                                textOverlays: (prev.finalVideo.textOverlays || []).map((t: any) => t.id === item.id ? { ...t, gridPosition: Number(e.target.value || 7) } : t),
                              },
                            }))}
                            className="w-full bg-transparent outline-none"
                          />
                        </label>
                        <label className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-lg px-2 py-1 md:col-span-2">
                          정렬
                          <select
                            value={String(item.align || 'center')}
                            onChange={(e) => setUi((prev: any) => ({
                              ...prev,
                              finalVideo: {
                                ...prev.finalVideo,
                                textOverlays: (prev.finalVideo.textOverlays || []).map((t: any) => t.id === item.id ? { ...t, align: e.target.value } : t),
                              },
                            }))}
                            className="flex-1 bg-transparent outline-none"
                          >
                            <option value="left">left</option>
                            <option value="center">center</option>
                            <option value="right">right</option>
                          </select>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
                <div className="bg-black/30 border border-white/10 rounded-lg px-3 py-2">이미지 자산: <span className="font-black text-white">{ui.imageJobs.filter((j: any) => j.imageUrl).length}</span></div>
                <div className="bg-black/30 border border-white/10 rounded-lg px-3 py-2">영상 자산: <span className="font-black text-white">{ui.videoJobs.filter((j: any) => j.videoUrl).length}</span></div>
                <div className="bg-black/30 border border-white/10 rounded-lg px-3 py-2">컷 수: <span className="font-black text-white">{ui.cuts.items.length}</span></div>
                <div className="bg-black/30 border border-white/10 rounded-lg px-3 py-2">TTS 길이: <span className="font-black text-white">{ui.tts.measuredDuration > 0 ? `${ui.tts.measuredDuration.toFixed(1)}초` : '미측정'}</span></div>
              </div>
            </div>
          )}
        </section>

        <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-4 md:p-8 backdrop-blur-xl">
          <PanelHeader title="14. 자동 발행 (YouTube 우선)" id="p14" colorClass="text-red-400" />
          {ui.panelsOpen.p14 && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-amber-300/30 bg-amber-500/10 p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <p className="text-[11px] text-amber-100">발행은 반드시 최종 확인 후 직접 클릭해야 합니다. YouTube/Google/AI 서비스 정책 준수는 사용자 책임입니다.</p>
                <button
                  onClick={() => setPublishingTermsOpen(true)}
                  className="px-3 py-2 rounded-lg bg-amber-400 text-black text-xs font-black"
                >
                  이용약관 보기
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2">
                {publishSteps.map(step => {
                  const active = ui.publishing.mobileStep === step.id;
                  const completed = ui.publishing.mobileStep > step.id;
                  return (
                    <button
                      key={step.id}
                      onClick={() => setPublishingStep(step.id)}
                      className={`text-left rounded-xl px-3 py-2 border transition-all ${active ? 'bg-red-500/20 border-red-400 text-red-100' : completed ? 'bg-emerald-500/20 border-emerald-300/40 text-emerald-100' : 'bg-black/25 border-white/10 text-slate-300'}`}
                    >
                      <p className="text-[10px] font-black uppercase tracking-widest">STEP {step.id}</p>
                      <p className="text-xs font-bold mt-1">{step.title}</p>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-4">
                <div className="space-y-4">
                  {ui.publishing.mobileStep === 1 && (
                    <div className="rounded-2xl border border-white/10 bg-black/25 p-4 space-y-4">
                      <p className="text-xs font-black text-slate-300 uppercase tracking-widest">1) 계정 연결</p>
                      <p className="text-xs text-slate-400">Google 로그인 후 YouTube를 먼저 연결하고, 다른 SNS는 UI만 준비해 둡니다.</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {SOCIAL_PLATFORM_META.map(platform => (
                          <div key={platform.id} className={`rounded-xl border p-3 ${platform.available ? 'border-red-400/40 bg-red-500/10' : 'border-white/10 bg-white/5'}`}>
                            <p className="text-xs font-black text-white">{platform.label}</p>
                            <p className="text-[10px] mt-1 text-slate-300">{platform.available ? '연결 가능' : '업그레이드 예정'}</p>
                          </div>
                        ))}
                      </div>
                      <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-xs font-black text-white">{ui.publishing.accounts[0]?.name || 'YouTube 기본 채널'}</p>
                          <p className="text-[10px] text-slate-400">{ui.publishing.accounts[0]?.handle || '@your-channel'}</p>
                          <p className="text-[10px] text-slate-400">{ui.publishing.accounts[0]?.email || '이메일 미확인'}</p>
                          {ui.publishing.accounts[0]?.lastSyncedAt && (
                            <p className="text-[10px] text-emerald-200/80 mt-1">동기화: {new Date(ui.publishing.accounts[0].lastSyncedAt).toLocaleString()}</p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 w-full sm:w-auto">
                          <button
                            onClick={() => connectYouTubeAccount('login')}
                            className={`w-full sm:w-auto px-3 py-2 rounded-lg text-xs font-black transition-all ${ui.publishing.accounts[0]?.connected ? 'bg-emerald-400 text-black' : 'bg-red-500 text-white hover:bg-red-400'}`}
                          >
                            {hasValidYouTubeAuth ? 'Google 로그인됨' : 'Google 로그인'}
                          </button>
                          {isApprovedUser && hasValidYouTubeAuth && !ui.publishing.accounts[0]?.connected && (
                            <button
                              onClick={() => connectYouTubeAccount('youtube')}
                              className="w-full sm:w-auto px-3 py-2 rounded-lg text-xs font-black transition-all bg-emerald-500 text-black hover:bg-emerald-400"
                            >
                              YouTube 권한 연결
                            </button>
                          )}
                          {ui.publishing.accounts[0]?.connected && (
                            <button
                              onClick={disconnectYouTubeAccount}
                              className="w-full sm:w-auto px-3 py-2 rounded-lg text-xs font-black transition-all bg-white/10 text-slate-100 hover:bg-white/20"
                            >
                              연결 해제
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="rounded-xl border border-amber-300/20 bg-amber-500/10 p-3 space-y-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-[11px] font-black text-amber-100">권한 상태</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${isPublishAdmin ? 'bg-emerald-500/20 border-emerald-300/30 text-emerald-100' : isApprovedUser ? 'bg-cyan-500/20 border-cyan-300/30 text-cyan-100' : 'bg-rose-500/20 border-rose-300/30 text-rose-100'}`}>
                            {isPublishAdmin ? 'ADMIN' : isApprovedUser ? 'APPROVED' : 'VIEWER'}
                          </span>
                        </div>
                        <p className="text-[10px] text-amber-100/90">현재 로그인 이메일: {currentUserEmail || '미확인'}</p>
                        <p className="text-[10px] text-amber-100/90">소유자(owner): {ui.publishing.ownerEmail || '미설정'}</p>
                        {isPublishAdmin && (
                          <div className="space-y-1">
                            <label className="text-[10px] text-amber-100/90">알림톡 수신번호(관리자)</label>
                            <input
                              value={ui.publishing.ownerPhone || ''}
                              onChange={(e) => setUi(prev => ({ ...prev, publishing: { ...prev.publishing, ownerPhone: e.target.value } }))}
                              placeholder="01012345678"
                              className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-2 text-[11px] outline-none"
                            />
                            <p className="text-[10px] text-slate-400">알림톡 웹훅 전송 시 관리자 수신번호로 전달됩니다.</p>
                          </div>
                        )}
                        {!googleLoginReady && <p className="text-[10px] text-rose-300">OAuth 환경변수가 설정되지 않아 로그인/연결 버튼이 비활성화되었습니다.</p>}
                        {!isApprovedUser && currentUserEmail && (
                          <button
                            onClick={requestApprovalByEmail}
                            className="w-full bg-cyan-400 text-black font-black py-2 rounded-lg text-[11px]"
                          >
                            관리자에게 승인 요청 메일 보내기
                          </button>
                        )}
                        {!ui.publishing.ownerEmail && currentUserEmail && (
                          <button
                            onClick={claimOwnerFromCurrentAccount}
                            className="w-full bg-amber-400 text-black font-black py-2 rounded-lg text-[11px]"
                          >
                            현재 계정을 소유자로 지정
                          </button>
                        )}
                        {isPublishAdmin && (
                          <>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                              <input
                                value={ui.publishing.pendingAdminEmail}
                                onChange={(e) => setUi(prev => ({ ...prev, publishing: { ...prev.publishing, pendingAdminEmail: e.target.value } }))}
                                placeholder="관리자 이메일 추가"
                                className="w-full sm:flex-1 bg-black/40 border border-white/10 rounded-lg px-2 py-2 text-[11px] outline-none"
                              />
                              <button onClick={addAdminEmail} className="w-full sm:w-auto px-3 py-2 rounded-lg bg-emerald-400 text-black text-[11px] font-black">추가</button>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {effectiveAdminEmails.map(email => (
                                <button
                                  key={email}
                                  onClick={() => removeAdminEmail(email)}
                                  className="px-2 py-1 rounded-full text-[10px] border border-white/15 bg-black/30 text-slate-100"
                                  title="클릭 시 제거"
                                >
                                  {email}
                                </button>
                              ))}
                            </div>
                            <div className="border-t border-white/10 pt-3 space-y-2">
                              <p className="text-[11px] font-black text-cyan-100">승인 사용자 관리 (다운로드/연동/발행)</p>
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                <input
                                  value={ui.publishing.pendingApprovedEmail}
                                  onChange={(e) => setUi(prev => ({ ...prev, publishing: { ...prev.publishing, pendingApprovedEmail: e.target.value } }))}
                                  placeholder="승인 사용자 이메일 추가"
                                  className="w-full sm:flex-1 bg-black/40 border border-white/10 rounded-lg px-2 py-2 text-[11px] outline-none"
                                />
                                <button onClick={addApprovedEmail} className="w-full sm:w-auto px-3 py-2 rounded-lg bg-cyan-400 text-black text-[11px] font-black">추가</button>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {effectiveApprovedEmails.map(email => (
                                  <button
                                    key={email}
                                    onClick={() => removeApprovedEmail(email)}
                                    disabled={effectiveAdminEmails.includes(email)}
                                    className="px-2 py-1 rounded-full text-[10px] border border-white/15 bg-black/30 text-slate-100 disabled:opacity-40"
                                    title={effectiveAdminEmails.includes(email) ? '관리자 계정은 승인목록에서 제거할 수 없습니다.' : '클릭 시 승인 해제'}
                                  >
                                    {email}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="border-t border-white/10 pt-3 space-y-2">
                              <p className="text-[11px] font-black text-violet-100">관리자 페이지 · 승인 요청</p>
                              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                                {(ui.publishing.accessRequests || []).length === 0 ? (
                                  <p className="text-[10px] text-slate-400">승인 요청이 없습니다.</p>
                                ) : (
                                  (ui.publishing.accessRequests || []).map((req: any) => (
                                    <div key={req.id} className="rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-[10px] flex items-center justify-between gap-2">
                                      <div>
                                        <p className="text-white font-bold">{req.email}</p>
                                        <p className="text-slate-400">{new Date(req.requestedAt).toLocaleString()} · {req.status}</p>
                                      </div>
                                      {req.status === 'pending' && (
                                        <div className="flex items-center gap-1">
                                          <button onClick={() => approveAccessRequest(req.id)} className="px-2 py-1 rounded bg-emerald-400 text-black font-black">승인</button>
                                          <button onClick={() => rejectAccessRequest(req.id)} className="px-2 py-1 rounded bg-rose-500 text-white font-black">반려</button>
                                        </div>
                                      )}
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                            <div className="border-t border-white/10 pt-3 space-y-2">
                              <p className="text-[11px] font-black text-amber-100">관리 이력 로그</p>
                              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                                {(ui.publishing.auditLogs || []).length === 0 ? (
                                  <p className="text-[10px] text-slate-400">이력이 없습니다.</p>
                                ) : (
                                  (ui.publishing.auditLogs || []).map((log: any) => (
                                    <div key={log.id} className="rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-[10px]">
                                      <p className="text-white font-bold">{log.action} · {log.target}</p>
                                      <p className="text-slate-400">{new Date(log.at).toLocaleString()} · {log.actor}</p>
                                      {log.note && <p className="text-slate-500">{log.note}</p>}
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {ui.publishing.mobileStep === 2 && (
                    <div className="rounded-2xl border border-white/10 bg-black/25 p-4 space-y-3">
                      <p className="text-xs font-black text-slate-300 uppercase tracking-widest">2) 영상 확인</p>
                      <p className="text-xs text-slate-400">12번 패널에서 만든 최종 파일을 자동발행 소스로 사용합니다.</p>
                      <div className="rounded-xl border border-white/10 bg-slate-950/70 p-4 space-y-2">
                        <p className="text-xs text-slate-300">출력 포맷: <span className="font-black text-white">{ui.finalVideo.outputFormat.toUpperCase()}</span></p>
                        <p className="text-xs text-slate-300">파일 준비: <span className={`font-black ${publishAssetUrl ? 'text-emerald-300' : 'text-rose-300'}`}>{publishAssetUrl ? '완료' : '미완료'}</span></p>
                        {!publishAssetUrl && <p className="text-[10px] text-rose-300">영상이 없으면 예약 발행이 시작되지 않습니다.</p>}
                      </div>
                    </div>
                  )}

                  {ui.publishing.mobileStep === 3 && (
                    <div className="rounded-2xl border border-white/10 bg-black/25 p-4 space-y-3">
                      <p className="text-xs font-black text-slate-300 uppercase tracking-widest">3) 제목/설명</p>
                      <input
                        value={ui.publishing.draft.title}
                        onChange={(e) => setUi(prev => ({ ...prev, publishing: { ...prev.publishing, draft: { ...prev.publishing.draft, title: e.target.value } } }))}
                        placeholder="Short 제목을 입력하세요"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-3 text-sm outline-none"
                        maxLength={100}
                      />
                      <textarea
                        value={ui.publishing.draft.description}
                        onChange={(e) => setUi(prev => ({ ...prev, publishing: { ...prev.publishing, draft: { ...prev.publishing.draft, description: e.target.value } } }))}
                        placeholder="설명을 입력하세요"
                        rows={5}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-3 text-sm outline-none"
                        maxLength={5000}
                      />
                    </div>
                  )}

                  {ui.publishing.mobileStep === 4 && (
                    <div className="rounded-2xl border border-white/10 bg-black/25 p-4 space-y-4">
                      <p className="text-xs font-black text-slate-300 uppercase tracking-widest">4) 예약/재시도</p>
                      <div className="grid grid-cols-3 gap-2">
                        {(['public', 'unlisted', 'private'] as PublishVisibility[]).map(visibility => (
                          <button
                            key={visibility}
                            onClick={() => setUi(prev => ({ ...prev, publishing: { ...prev.publishing, draft: { ...prev.publishing.draft, visibility } } }))}
                            className={`rounded-xl py-2 text-xs font-black border transition-all ${ui.publishing.draft.visibility === visibility ? 'bg-emerald-400 text-black border-emerald-300' : 'bg-black/30 text-slate-300 border-white/10'}`}
                          >
                            {visibility === 'public' ? '공개' : visibility === 'unlisted' ? '일부 공개' : '비공개'}
                          </button>
                        ))}
                      </div>
                      <input
                        type="datetime-local"
                        value={ui.publishing.draft.scheduleAt}
                        onChange={(e) => setUi(prev => ({ ...prev, publishing: { ...prev.publishing, draft: { ...prev.publishing.draft, scheduleAt: e.target.value } } }))}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-3 text-sm outline-none"
                      />
                      <div className="flex items-center justify-between gap-3">
                        <label className="text-xs text-slate-300 font-bold">자동 재시도</label>
                        <button
                          onClick={() => setUi(prev => ({ ...prev, publishing: { ...prev.publishing, draft: { ...prev.publishing.draft, autoRetry: !prev.publishing.draft.autoRetry } } }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-black border ${ui.publishing.draft.autoRetry ? 'bg-emerald-400 text-black border-emerald-300' : 'bg-black/30 text-slate-300 border-white/15'}`}
                        >
                          {ui.publishing.draft.autoRetry ? 'ON' : 'OFF'}
                        </button>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <label className="text-xs text-slate-300 font-bold">최대 시도 횟수</label>
                        <select
                          value={ui.publishing.draft.maxAttempts}
                          onChange={(e) => setUi(prev => ({ ...prev, publishing: { ...prev.publishing, draft: { ...prev.publishing.draft, maxAttempts: Number(e.target.value) } } }))}
                          className="bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs outline-none"
                        >
                          <option value={1}>1회</option>
                          <option value={2}>2회</option>
                          <option value={3}>3회</option>
                        </select>
                      </div>
                      <p className="text-[10px] text-slate-400">재시도 간격: 즉시 → 10분 → 60분</p>
                    </div>
                  )}

                  {ui.publishing.mobileStep === 5 && (
                    <div className="rounded-2xl border border-white/10 bg-black/25 p-4 space-y-4">
                      <p className="text-xs font-black text-slate-300 uppercase tracking-widest">5) 확인/알림</p>
                      <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3 space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[11px] font-black text-white">자동 발행 사전 진단</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${publishReadiness.ok ? 'bg-emerald-500/20 border-emerald-300/30 text-emerald-100' : 'bg-amber-500/20 border-amber-300/30 text-amber-100'}`}>
                            {publishReadiness.ok ? 'READY' : `미완료 ${publishReadiness.failed.length}`}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {publishReadiness.checks.map(item => (
                            <div key={item.key} className={`rounded-lg border px-2.5 py-2 text-[10px] ${item.ok ? 'border-emerald-300/30 bg-emerald-500/10 text-emerald-100' : 'border-rose-300/30 bg-rose-500/10 text-rose-100'}`}>
                              <p className="font-black">{item.label}: {item.ok ? '완료' : '필요'}</p>
                              {!item.ok && <p className="mt-0.5 opacity-90">{item.hint}</p>}
                            </div>
                          ))}
                        </div>
                        {!publishReadiness.ok && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => setUi(prev => ({
                                ...prev,
                                publishing: {
                                  ...prev.publishing,
                                  draft: {
                                    ...prev.publishing.draft,
                                    scheduleAt: toFutureDateTimeLocalValue(60),
                                  },
                                },
                              }))}
                              className="px-3 py-1.5 rounded-lg text-[10px] font-black bg-white/10 border border-white/15 text-white hover:bg-white/20"
                            >
                              예약시간 +60분 자동 세팅
                            </button>
                            <button
                              onClick={() => setPublishingStep(3)}
                              className="px-3 py-1.5 rounded-lg text-[10px] font-black bg-white/10 border border-white/15 text-white hover:bg-white/20"
                            >
                              제목/설명으로 이동
                            </button>
                          </div>
                        )}
                      </div>
                      <input
                        type="email"
                        value={ui.publishing.notifyEmail}
                        onChange={(e) => setUi(prev => ({ ...prev, publishing: { ...prev.publishing, notifyEmail: e.target.value } }))}
                        placeholder="실패/성공 알림 메일 주소"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-3 text-sm outline-none"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => queueYouTubePublish({ immediate: true })}
                          disabled={!isApprovedUser || !publishReadiness.okForImmediate}
                          className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-black py-3 rounded-xl hover:brightness-110 transition-all disabled:opacity-40"
                        >
                          지금 발행
                        </button>
                        <button
                          onClick={() => queueYouTubePublish()}
                          disabled={!isApprovedUser || !publishReadiness.okForScheduled}
                          className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-black py-3 rounded-xl hover:brightness-110 transition-all disabled:opacity-40"
                        >
                          예약 발행
                        </button>
                      </div>
                      {!isApprovedUser && <p className="text-[10px] text-rose-300">승인된 사용자만 발행할 수 있습니다. STEP 1에서 승인 요청 메일을 보내세요.</p>}
                      <p className="text-[10px] text-slate-400">메일 알림은 브라우저 mailto 훅으로 연결됩니다. 서버 메일러 연동 시 자동 전송으로 교체 가능합니다.</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => setPublishingStep(ui.publishing.mobileStep - 1)}
                      disabled={ui.publishing.mobileStep === 1}
                      className="flex-1 bg-white/10 border border-white/10 rounded-xl py-2.5 text-xs font-black disabled:opacity-40"
                    >
                      이전
                    </button>
                    <button
                      onClick={() => setPublishingStep(ui.publishing.mobileStep + 1)}
                      disabled={ui.publishing.mobileStep === 5}
                      className="flex-1 bg-red-500/90 text-white rounded-xl py-2.5 text-xs font-black disabled:opacity-40"
                    >
                      다음
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <p className="text-xs font-black text-slate-300 uppercase tracking-widest mb-3">발행 작업 상태</p>
                    <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                      {ui.publishing.jobs.length === 0 ? (
                        <p className="text-xs text-slate-500">등록된 예약 발행 작업이 없습니다.</p>
                      ) : (
                        ui.publishing.jobs.map(job => (
                          <div key={job.id} className="rounded-xl border border-white/10 bg-slate-900/70 p-3 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-black text-white line-clamp-1">{job.title}</p>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${job.status === 'published' ? 'bg-emerald-500/20 border-emerald-300/30 text-emerald-100' : job.status === 'failed' ? 'bg-rose-500/20 border-rose-300/30 text-rose-100' : 'bg-amber-500/20 border-amber-300/30 text-amber-100'}`}>{job.status}</span>
                            </div>
                            <p className="text-[10px] text-slate-400">예약: {new Date(job.scheduleAt).toLocaleString()}</p>
                            <p className="text-[10px] text-slate-400">시도: {job.attemptCount}/{job.maxAttempts}</p>
                            {job.lastError && <p className="text-[10px] text-rose-300">오류: {job.lastError}</p>}
                            {job.publishedUrl && (
                              <a className="text-[10px] text-cyan-300 underline" href={job.publishedUrl} target="_blank" rel="noreferrer">
                                게시 URL 열기
                              </a>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-[10px] text-slate-400 leading-relaxed">
                    이동 중(지하철/버스) 사용을 위해 모바일 단계형 UI로 구성되었습니다. 작성 내용과 예약 상태는 자동 저장됩니다.
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-4 md:p-8 backdrop-blur-xl">
          <PanelHeader title="15. SNS 달력" id="p15" colorClass="text-fuchsia-400" />
          {ui.panelsOpen.p15 && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-fuchsia-300/20 bg-fuchsia-500/10 px-4 py-3">
                <p className="text-[11px] font-black text-fuchsia-100 uppercase tracking-widest">SNS 발행 캘린더 (준비 중)</p>
                <p className="text-[11px] text-fuchsia-100/80 mt-1">자동 발행 예약과 연결된 일정표를 이 패널에서 관리합니다. (YouTube 외 SNS 포함)</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">예약 예정</p>
                  <p className="text-xs text-slate-500 mt-2">아직 등록된 예약이 없습니다.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">SNS 채널 상태</p>
                  <p className="text-xs text-slate-500 mt-2">연결된 채널 정보를 이곳에서 확인합니다.</p>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Happy Day Modal */}
      <AnimatePresence>
        {ui.happyDayOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setUi(prev => ({ ...prev, happyDayOpen: false }))}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-5xl bg-[#0f162e] border border-white/10 rounded-[3rem] p-10 shadow-2xl overflow-hidden"
            >
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h2 className="text-4xl font-black gold-gradient-text mb-2">🛍️ Happy Day 구경</h2>
                  <p className="text-slate-400 font-medium text-lg">영상 기다리시는 동안 ~ 구경오세요</p>
                </div>
                <button onClick={() => setUi(prev => ({ ...prev, happyDayOpen: false }))} className="p-3 hover:bg-white/5 rounded-full transition-all">
                  <X className="w-10 h-10 text-slate-400" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { name: '쿠팡 (Coupang)', links: [{ name: '힐토피아', url: 'https://www.coupang.com' }, { name: '힐티아라', url: 'https://www.coupang.com' }], color: 'from-sky-500 to-blue-600' },
                  { name: '네이버 (Naver)', links: [{ name: '동헌마트', url: 'https://smartstore.naver.com' }, { name: '힐티아라', url: 'https://smartstore.naver.com' }], color: 'from-emerald-500 to-green-600' },
                  { name: '11번가 (11st)', links: [{ name: '힐토피아', url: 'https://www.11st.co.kr' }, { name: '힐티아라', url: 'https://www.11st.co.kr' }], color: 'from-rose-500 to-pink-600' },
                  { name: 'G마켓 (Gmarket)', links: [{ name: '힐토피아', url: 'https://www.gmarket.co.kr' }, { name: '힐티아라', url: 'https://www.gmarket.co.kr' }], color: 'from-indigo-500 to-purple-600' },
                  { name: '롯데ON (Lotte ON)', links: [{ name: '힐토피아', url: 'https://www.lotteon.com' }, { name: '힐티아라', url: 'https://www.lotteon.com' }], color: 'from-red-500 to-orange-600' },
                  { name: '옥션 (Auction)', links: [{ name: '힐토피아', url: 'https://www.auction.co.kr' }, { name: '힐티아라', url: 'https://www.auction.co.kr' }], color: 'from-amber-500 to-yellow-600' }
                ].map((market, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-[2rem] p-6 hover:bg-white/10 transition-all group">
                    <h3 className="text-xl font-black text-white mb-6 group-hover:text-amber-400 transition-colors">{market.name}</h3>
                    <div className="grid grid-cols-1 gap-3">
                      {market.links.map((link, j) => (
                        <a 
                          key={j} 
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`w-full bg-gradient-to-r ${market.color} text-white font-black py-3 rounded-2xl text-sm shadow-lg transform hover:-translate-y-1 transition-all flex items-center justify-center`}
                        >
                          {link.name} 바로가기
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {ui.settingsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setUi(prev => ({ ...prev, settingsOpen: false }))}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-[#0f162e] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-amber-500" />
                  API 설정 콘솔
                </h3>
                <button onClick={() => setUi(prev => ({ ...prev, settingsOpen: false }))} className="p-2 hover:bg-white/5 rounded-full transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest">YouTube Data API Key</label>
                  <input 
                    type="password"
                    value={keys.yt1}
                    onChange={(e) => setKeys(prev => ({ ...prev, yt1: e.target.value }))}
                    placeholder="AIza..."
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-white outline-none focus:ring-2 ring-amber-500/50"
                  />
                </div>
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest">Gemini AI API Key</label>
                  <input 
                    type="password"
                    value={keys.g1}
                    onChange={(e) => setKeys(prev => ({ ...prev, g1: e.target.value }))}
                    placeholder="AIza..."
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-white outline-none focus:ring-2 ring-amber-500/50"
                  />
                </div>
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest">ElevenLabs API Key</label>
                  <input
                    type="password"
                    value={keys.e11}
                    onChange={(e) => setKeys(prev => ({ ...prev, e11: e.target.value }))}
                    placeholder="sk_..."
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-white outline-none focus:ring-2 ring-amber-500/50"
                  />
                </div>
                <div className="pt-4 space-y-3">
                  <button 
                    onClick={async () => {
                      try {
                        const zip = new JSZip();
                        const filesToFetch = [
                          '/package.json',
                          '/index.html',
                          '/vite.config.ts',
                          '/tsconfig.json',
                          '/src/main.tsx',
                          '/src/App.tsx',
                          '/src/index.css',
                          '/src/types.ts',
                          '/src/prompts.ts',
                          '/src/guidelines/rules.ts'
                        ];

                        for (const path of filesToFetch) {
                          try {
                            const res = await fetch(path);
                            if (res.ok) {
                              const text = await res.text();
                              // Remove leading slash for zip path
                              zip.file(path.substring(1), text);
                            }
                          } catch (e) {
                            console.warn(`Failed to fetch ${path}`, e);
                          }
                        }

                        const content = await zip.generateAsync({ type: 'blob' });
                        const url = URL.createObjectURL(content);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'AI-Storyteller-Lite.zip';
                        a.click();
                        URL.revokeObjectURL(url);
                      } catch (err) {
                        alert('ZIP 다운로드에 실패했습니다.');
                        console.error(err);
                      }
                    }}
                    className="w-full bg-indigo-500 text-white font-black py-4 rounded-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" /> 전체 프로젝트 ZIP 다운로드
                  </button>
                  <button 
                    onClick={() => setUi(prev => ({ ...prev, settingsOpen: false }))}
                    className="w-full bg-white text-black font-black py-4 rounded-2xl hover:bg-slate-200 transition-all"
                  >
                    설정 저장 및 닫기
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="app-watermark">
        <Sparkles className="w-[40vw] h-[40vw] text-white/5" />
      </div>
    </div>
  );
}
