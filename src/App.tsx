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

// --- Constants ---
const GEMINI_TTS_MODELS = [
  { id: 'gemini-2.5-flash-preview-tts', label: 'Gemini 2.5 Flash Preview TTS', price: '1M/$7.88' },
  { id: 'gemini-2.5-pro-preview-tts', label: 'Gemini 2.5 Pro Preview TTS', price: '1M/$15.75' },
];

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
  { id: "Gacrux", label: "Gacrux · 남성 · 따뜻/담백", gender: "남성", tags: ["따뜻", "담백", "친근"] },
  { id: "Iapetus", label: "Iapetus · 남성 · 깊이/차분", gender: "남성", tags: ["깊이", "차분", "안정"] },
  { id: "Laomedeia", label: "Laomedeia · 여성 · 부드럽/정돈", gender: "여성", tags: ["부드럽", "정돈", "안정"] },
  { id: "Leda", label: "Leda · 여성 · 중저음/신뢰", gender: "여성", tags: ["중저음", "신뢰", "차분"] },
  { id: "Orus", label: "Orus · 남성 · 에너지/명료", gender: "남성", tags: ["에너지", "명료", "자신감"] },
  { id: "Pulcherrima", label: "Pulcherrima · 여성 · 우아/유연", gender: "여성", tags: ["우아", "유연", "세련"] },
  { id: "Rasalgethi", label: "Rasalgethi · 남성 · 묵직/장중", gender: "남성", tags: ["묵직", "장중", "서사"] },
  { id: "Sadachbia", label: "Sadachbia · 여성 · 또렷/선명", gender: "여성", tags: ["또렷", "선명", "기본"] },
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

const CATEGORY_MAP: Record<string, string> = {
  '모든 카테고리': '', 종교: '종교', 야담: '야담', 경제: '경제', 
  뉴스: '뉴스', 드라마: '드라마', 의학: '의학', AI기술: 'AI기술', 동물: '동물'
};

// --- Helper Functions ---
const formatNumber = (num: number) => num.toLocaleString('en-US');

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
type SubtitlePreset = 'shorts' | 'docu' | 'lecture';
type SubtitleEntryAnimation = 'none' | 'fade' | 'pop' | 'slide_up' | 'slide_down' | 'slide_left' | 'slide_right';
type SubtitleHighlightStrength = 'low' | 'medium' | 'high';
type SubtitleSegment = { start: number; end: number; text: string; lines: string[]; cut: number };
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
};

const SUBTITLE_TEMPLATE_LS_KEY = 'ai_storyteller_subtitle_templates_v1';
const SUBTITLE_TEMPLATE_PREVIEW_LS_KEY = 'ai_storyteller_subtitle_template_previews_v1';

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
    highlightWord?: string;
    highlightKeywords?: Set<string>;
    progress?: number;
    entryAnimation?: SubtitleEntryAnimation;
    highlightStrength?: SubtitleHighlightStrength;
  },
) => {
  const rendered = lines.filter(Boolean).slice(0, 2);
  if (rendered.length === 0) return;

  const preset = SUBTITLE_PRESETS[options?.preset || 'shorts'];
  const highlightWord = options?.highlightWord?.trim();
  const keywordSet = options?.highlightKeywords;
  const progress = Math.max(0, Math.min(1, options?.progress ?? 1));
  const entryAnimation = options?.entryAnimation || 'none';
  const highlightStrength = options?.highlightStrength || 'medium';

  const drawLine = (line: string, y: number) => {
    if (!highlightWord) {
      ctx.lineWidth = Math.max(2, Math.round(fontSize * 0.12));
      ctx.strokeStyle = preset.strokeColor;
      ctx.strokeText(line, width / 2, y);
      ctx.fillStyle = preset.textColor;
      ctx.fillText(line, width / 2, y);
      return;
    }

    const parts = line.split(/(\s+)/);
    const widths = parts.map(part => ctx.measureText(part).width);
    const totalWidth = widths.reduce((sum, w) => sum + w, 0);
    let x = width / 2 - totalWidth / 2;

    parts.forEach((part, idx) => {
      if (!part) return;
      const isSpace = /^\s+$/.test(part);
      const token = cleanWordToken(part);
      const isHighlightByProgress = highlightStrength !== 'low' && Boolean(highlightWord) && token === cleanWordToken(highlightWord);
      const keywordMatch = Boolean(keywordSet && token && keywordSet.has(token));
      const fuzzyKeywordMatch = highlightStrength === 'high' && Boolean(keywordSet && token && [...keywordSet].some(k => token.startsWith(k) || k.startsWith(token)));
      const isHighlightByKeyword = keywordMatch || fuzzyKeywordMatch;
      const isHighlight = !isSpace && (isHighlightByProgress || isHighlightByKeyword);
      ctx.textAlign = 'left';
      ctx.lineWidth = Math.max(2, Math.round(fontSize * (highlightStrength === 'high' ? 0.14 : 0.12)));
      ctx.strokeStyle = preset.strokeColor;
      ctx.strokeText(part, x, y);
      ctx.fillStyle = isHighlight ? preset.accentColor : preset.textColor;
      ctx.fillText(part, x, y);
      x += widths[idx];
    });
    ctx.textAlign = 'center';
  };

  const fontSize = Math.round(Math.min(width, height) * preset.fontScale);
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
};

const BUILTIN_SUBTITLE_TEMPLATES: BuiltinSubtitleTemplate[] = [
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

export default function App() {
  // --- State ---
  const [keys, setKeys] = useState({ yt1: '', yt2: '', g1: '' });
  const [activeKeys, setActiveKeys] = useState({ yt: 'yt1', g: 'g1' });
  const [keyStatus, setKeyStatus] = useState<Record<string, any>>({});
  
  const [ui, setUi] = useState({
    settingsOpen: false,
    happyDayOpen: false,
    panelsOpen: { p1: true, p2: true, p3: true, p4: true, p_style: true, p5: true, p6: true, p7: true, p8: true, p9: true, p10: true, p11: true, p12: true, p13: true },
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
    },
    tts: {
      generating: false,
      audioUrl: '',
      status: '',
      voice: 'Kore',
      model: 'gemini-2.5-flash-preview-tts',
      selectedToneId: 'default',
      styleInstructions: '',
    },
    cuts: {
      items: [] as string[],
      prompts: [] as any[],
      ratio: '9:16',
    },
    imageJobs: [] as any[],
    videoJobs: [] as any[],
    finalVideo: {
      type: 'ai_video' as 'ai_video' | 'image_slide',
      modifications: '',
      generating: false,
      url: '',
      slides: [] as { cut: number; imageUrl: string; motion: SlideMotionType }[],
      activeSlide: 0,
      slideDuration: 3,
      resolution: 'hd' as RenderResolution,
      subtitleEnabled: true,
      subtitleMaxChars: 24,
      subtitlePosition: 'bottom' as SubtitlePosition,
      subtitleGridPosition: 9,
      subtitlePreset: 'shorts' as SubtitlePreset,
      subtitleWordHighlight: true,
      subtitleHighlightStrength: 'medium' as SubtitleHighlightStrength,
      subtitleKeywords: '핵심,충격,비밀,방법,중요',
      subtitleUsePerCutKeywords: false,
      subtitleKeywordsByCut: {} as Record<number, string>,
      subtitleEntryAnimation: 'fade' as SubtitleEntryAnimation,
      subtitleSuggesting: false,
      transcoding: false,
      ffmpegReady: false,
      ffmpegNote: '',
      outputFormat: 'webm' as 'webm' | 'mp4',
    }
  });

  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<boolean>(false);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  const [results, setResults] = useState<any[]>([]);
  const [subtitleTemplates, setSubtitleTemplates] = useState<SavedSubtitleTemplate[]>([]);
  const [templatePreviewOverrides, setTemplatePreviewOverrides] = useState<Record<string, string>>({});
  const initialUiRef = useRef<any>(null);

  useEffect(() => {
    if (!initialUiRef.current) {
      initialUiRef.current = JSON.parse(JSON.stringify(ui));
    }
  }, [ui]);

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
    setUi(prev => ({ 
      ...prev, 
      script: { 
        ...prev.script, 
        length: prev.script.type === 'shorts' ? '60초' : '10분' 
      } 
    }));
  }, [ui.script.type]);

  // --- YouTube Logic ---
  // --- Effects ---
  useEffect(() => {
    if (ui.filters.query) {
      handleSearch();
    }
  }, [ui.filters.sort, ui.filters.period, ui.filters.duration, ui.filters.count]);

  const handleSearch = async () => {
    const apiKey = keys[activeKeys.yt as keyof typeof keys];
    if (!apiKey) {
      setUi(prev => ({ ...prev, searchError: 'YouTube API 키를 설정하세요.' }));
      return;
    }

    setUi(prev => ({ ...prev, searching: true, searchError: '' }));
    
    try {
      const now = new Date();
      let publishedAfter = '';
      if (ui.filters.period === '오늘') {
        publishedAfter = new Date(now.setDate(now.getDate() - 1)).toISOString();
      } else if (ui.filters.period === '이번 주') {
        publishedAfter = new Date(now.setDate(now.getDate() - 7)).toISOString();
      } else if (ui.filters.period === '이번 달') {
        publishedAfter = new Date(now.setMonth(now.getMonth() - 1)).toISOString();
      } else if (ui.filters.period === '올해') {
        publishedAfter = new Date(now.setFullYear(now.getFullYear() - 1)).toISOString();
      }

      const query = ui.filters.category !== '모든 카테고리' 
        ? `${ui.filters.query} ${ui.filters.category}` 
        : ui.filters.query;

      const params: any = {
        part: 'snippet',
        type: 'video',
        q: query,
        maxResults: String(ui.filters.count),
        key: apiKey,
        order: ui.filters.sort === '조회수' ? 'viewCount' : 'date',
        regionCode: COUNTRY_MAP[ui.filters.country] || 'KR',
      };

      if (publishedAfter) params.publishedAfter = publishedAfter;
      if (ui.filters.duration !== '전체') params.videoDuration = ui.filters.duration;

      const searchParams = new URLSearchParams(params);
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${searchParams.toString()}`);
      const data = await res.json();
      
      if (!res.ok) throw new Error(data?.error?.message || '검색 실패');

      const videoIds = data.items.map((i: any) => i.id.videoId).join(',');
      if (!videoIds) {
        setResults([]);
        setUi(prev => ({ ...prev, searching: false }));
        return;
      }

      const statsRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${videoIds}&key=${apiKey}`);
      const statsData = await statsRes.json();

      const combined = data.items.map((item: any) => {
        const stats = statsData.items.find((s: any) => s.id === item.id.videoId);
        return {
          id: item.id.videoId,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails.medium.url,
          channelTitle: item.snippet.channelTitle,
          publishedAt: item.snippet.publishedAt,
          viewCount: Number(stats?.statistics?.viewCount || 0),
          likeCount: Number(stats?.statistics?.likeCount || 0),
          commentCount: Number(stats?.statistics?.commentCount || 0),
          url: `https://youtube.com/watch?v=${item.id.videoId}`,
        };
      }).filter((v: any) => v.viewCount >= ui.filters.minViews);

      setResults(combined);
    } catch (err: any) {
      setUi(prev => ({ ...prev, searchError: err.message }));
    } finally {
      setUi(prev => ({ ...prev, searching: false }));
    }
  };

  // --- Gemini Logic ---
  const generateHooks = async () => {
    if (!keys.g1) return alert('Gemini API 키가 필요합니다.');
    setUi(prev => ({ ...prev, hookLoading: true, selectedHookTitle: '' }));
    
    try {
      const ai = new GoogleGenAI({ apiKey: keys.g1 });
      const prompt = `유튜브 바이럴 제목 전문가로서, 주제 "${ui.filters.query}"에 대해 클릭률이 높은 제목 30개를 생성하고, 이 제목들이 공통적으로 사용하는 바이럴 전략을 분석하세요. 
      JSON 형식으로 출력하세요: 
      {
        "hookTitles": [{"title": "제목", "strategy": "전략 설명"}],
        "overallStrategy": "전체적인 바이럴 전략 분석 내용"
      }`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      
      const parsed = JSON.parse(response.text || '{}');
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
    if (!keys.g1 || !ui.selectedHookTitle) return alert('제목을 선택하고 Gemini 키를 확인하세요.');
    setUi(prev => ({ ...prev, thumbnail: { ...prev.thumbnail, generating: true } }));

    try {
      const ai = new GoogleGenAI({ apiKey: keys.g1 });
      const stylePrompt = VIDEO_STYLES_31.find(s => ui.videoStyle.selected.includes(s.name))?.prompt || '';
      const scriptLang = ui.script.lang === 'KR' ? '한국어' : ui.script.lang === 'EN' ? '영어' : '일본어';
      
      // 1. Generate Visual Prompt
      const promptRes = await ai.models.generateContent({
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

      // 2. Generate Image
      const imageRes = await ai.models.generateContent({
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
    if (!keys.g1 || !ui.script.output) return alert('대본을 먼저 생성하세요.');
    setUi(prev => ({ ...prev, description: { ...prev.description, generating: true } }));

    try {
      const ai = new GoogleGenAI({ apiKey: keys.g1 });
      const prompt = `당신은 100만 뷰 이상의 성과를 내는 유튜브 마케팅 전문가입니다. 
다음 정보를 바탕으로 유튜브 최종 제목, 설명란, 해시태그, 태그를 3개국어(한국어, 영어, 일본어)로 작성하세요.

[선택된 제목]
${ui.selectedHookTitle}

[영상 대본]
${ui.script.output}

[작성 지침]
1. 최종 제목: 클릭을 유도하는 강력한 후킹 문구를 포함하세요.
2. 설명란: 100만 뷰 영상의 구조(도입부 요약, 내용 상세, 관련 링크 안내 등)를 참고하여 작성하세요. **타임라인(시간대별 요약)은 아직 작성하지 마세요.**
3. 해시태그: 영상의 핵심 키워드 3~5개를 #형태로 작성하세요.
4. 태그: 검색 최적화(SEO)를 위한 연관 키워드들을 콤마(,)로 구분하여 작성하세요.

JSON 형식으로만 출력하세요: 
{
  "kr": {"title": "...", "desc": "...", "hashtags": "...", "tags": "..."},
  "en": {"title": "...", "desc": "...", "hashtags": "...", "tags": "..."},
  "jp": {"title": "...", "desc": "...", "hashtags": "...", "tags": "..."}
}`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      
      const parsed = JSON.parse(response.text || '{}');
      setUi(prev => ({ 
        ...prev, 
        description: { 
          ...prev.description, 
          kr: parsed.kr || { title: '', desc: '', hashtags: '', tags: '' }, 
          en: parsed.en || { title: '', desc: '', hashtags: '', tags: '' }, 
          jp: parsed.jp || { title: '', desc: '', hashtags: '', tags: '' }, 
          generating: false 
        } 
      }));
    } catch (err) {
      console.error(err);
      alert('설명 생성 중 오류가 발생했습니다.');
      setUi(prev => ({ ...prev, description: { ...prev.description, generating: false } }));
    }
  };

  const generateScript = async () => {
    if (!keys.g1 || !ui.selectedHookTitle) return alert('제목을 선택하고 Gemini 키를 확인하세요.');
    setUi(prev => ({ ...prev, script: { ...prev.script, generating: true } }));

    try {
      const ai = new GoogleGenAI({ apiKey: keys.g1 });
      
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

[요청 사항]
위 설정에 맞춰 대본을 작성하세요. 
불필요한 설명 없이 대본 내용만 출력하세요.
`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      
      setUi(prev => ({ ...prev, script: { ...prev.script, output: response.text || '', generating: false } }));
    } catch (err) {
      console.error(err);
      setUi(prev => ({ ...prev, script: { ...prev.script, generating: false } }));
    }
  };

  const [previewLoading, setPreviewLoading] = useState(false);

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
      const localAudioCandidates = [
        VOICE_SAMPLE_PATHS[voiceId],
        `/audio/${voiceId}.wav`,
        `/audio/${voiceId.toLowerCase()}.wav`,
      ].filter(Boolean) as string[];
      let resolvedAudioUrl = '';

      try {
        for (const candidate of localAudioCandidates) {
          const localSample = await fetch(candidate);
          if (localSample.ok) {
            const localBuffer = await localSample.arrayBuffer();
            resolvedAudioUrl = URL.createObjectURL(new Blob([localBuffer], { type: 'audio/wav' }));
            break;
          }
        }
        if (!resolvedAudioUrl) {
          throw new Error('Local sample not found');
        }
      } catch {
        if (!keys.g1) {
          throw new Error('로컬 샘플이 없고 Gemini API 키도 없습니다. API 설정에서 Gemini 키를 등록하면 자동 미리듣기가 가능합니다.');
        }

        const ai = new GoogleGenAI({ apiKey: keys.g1 });
        const previewResponse = await ai.models.generateContent({
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
      const response = await ai.models.generateContent({
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

  const handleGenerateTTS = async () => {
    if (!keys.g1 || !ui.script.output) return alert('대본을 먼저 생성하세요.');
    setUi(prev => ({ ...prev, tts: { ...prev.tts, generating: true, status: '생성 중...' } }));

    try {
      const ai = new GoogleGenAI({ apiKey: keys.g1 });
      
      // Clean script for TTS (remove labels like "Narrator:", "Speaker:", etc.)
      const cleanScript = ui.script.output
        .replace(/^[a-zA-Z\s]+:\s*/gm, '') // Remove "Label: " at start of lines
        .replace(/\(.*\)/g, '') // Remove text in parentheses (stage directions)
        .trim();

      const promptText = ui.tts.styleInstructions 
        ? `[Style: ${ui.tts.styleInstructions}]\n${cleanScript}`
        : cleanScript;

      const response = await ai.models.generateContent({
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
        const url = addWavHeader(base64Audio);
        setUi(prev => ({ ...prev, tts: { ...prev.tts, generating: false, audioUrl: url, status: '완료' } }));
      }
    } catch (err) {
      console.error(err);
      setUi(prev => ({ ...prev, tts: { ...prev.tts, generating: false, status: '실패' } }));
    }
  };

  const splitCuts = () => {
    if (!ui.script.output) return alert('대본이 없습니다.');
    const lines = ui.script.output.split('\n').filter(l => l.trim().length > 5);
    setUi(prev => ({ ...prev, cuts: { ...prev.cuts, items: lines } }));
  };

  const generateImagePrompts = async () => {
    if (ui.cuts.items.length === 0) return alert('컷 분할을 먼저 하세요.');
    if (!keys.g1) return alert('Gemini 키가 필요합니다.');

    setUi(prev => ({ ...prev, tts: { ...prev.tts, status: '프롬프트 생성 중...' } }));
    
    try {
      const ai = new GoogleGenAI({ apiKey: keys.g1 });
      const stylePrompt = VIDEO_STYLES_31.find(s => ui.videoStyle.selected.includes(s.name))?.prompt || '';
      
      const prompts: any[] = [];
      for (let i = 0; i < ui.cuts.items.length; i++) {
        const text = ui.cuts.items[i];
        const p = `당신은 시각적 연출가입니다. 다음 대본의 내용을 바탕으로, 이 특정 컷에 대한 상세한 영어 이미지 프롬프트를 작성하세요.
        
[전체 대본 맥락]
${ui.script.output.substring(0, 300)}...

[현재 컷 내용]
"${text}"

[스타일 지침]
${stylePrompt}

[요청 사항]
1. 위 컷의 의미를 시각적으로 가장 강력하게 전달할 수 있는 묘사를 하세요.
2. 절대 화면에 텍스트나 문자가 포함되지 않게 하세요 (NO TEXT, NO LETTERS).
3. 인물의 외모, 의상, 환경이 전체 영상에서 일관되게 유지되도록 묘사하세요.
4. 불필요한 설명 없이 1~2문장의 영어 프롬프트만 출력하세요.`;

        try {
          const res = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: p
          });
          prompts.push({ index: i + 1, prompt: res.text?.trim() || '' });
        } catch (promptErr) {
          console.error(`프롬프트 ${i + 1} 생성 실패:`, promptErr);
          prompts.push({ index: i + 1, prompt: '' });
        }
        if (i < ui.cuts.items.length - 1) {
          await new Promise(r => setTimeout(r, 1000));
        }
      }

      setUi(prev => ({ ...prev, cuts: { ...prev.cuts, prompts }, tts: { ...prev.tts, status: '' } }));
    } catch (err) {
      console.error(err);
    }
  };

  const saveProject = async () => {
    const safeTitleRaw = (ui.selectedHookTitle || ui.filters.query || 'project').trim();
    const tenChars = Array.from(safeTitleRaw).slice(0, 10).join('') || 'project';
    const safeTitle = tenChars.replace(/[<>:"/\\|?*\x00-\x1F]/g, '').replace(/\s+/g, '_');
    const folderRoot = `Ai-Storyteller-Lite/${safeTitle}`;

    const projectPayload = {
      meta: {
        format: 'ai-storyteller-lite-project-v2',
        requiresAssets: true,
        note: 'JSON 단독 로드는 자산 누락 시 실패할 수 있습니다. 저장한 ZIP 전체를 보관하세요.',
        folderRoot,
      },
      ui,
      results,
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
      alert(`프로젝트를 ZIP으로 저장했습니다. (폴더: ${folderRoot})`);
    } catch (err) {
      console.error(err);
      alert('프로젝트 ZIP 저장에 실패했습니다.');
    }
  };

  const handleNewProject = () => {
    const ok = window.confirm('새 프로젝트를 시작할까요? 현재 작업 내용은 저장하지 않으면 사라집니다.');
    if (!ok) return;
    if (initialUiRef.current) {
      setUi(JSON.parse(JSON.stringify(initialUiRef.current)));
    }
    setResults([]);
    setPreviewingId(null);
    setPreviewLoading(false);
    alert('새 프로젝트를 시작했습니다.');
  };

  const collectBlobRefs = (obj: any): string[] => {
    const refs: string[] = [];
    const walk = (value: any) => {
      if (typeof value === 'string' && value.startsWith('blob:')) {
        refs.push(value);
        return;
      }
      if (Array.isArray(value)) {
        value.forEach(walk);
        return;
      }
      if (value && typeof value === 'object') {
        Object.values(value).forEach(walk);
      }
    };
    walk(obj);
    return refs;
  };

  const loadProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed?.meta?.requiresAssets) {
          alert('이 프로젝트 파일은 자산 번들(ZIP)을 전제로 저장되었습니다. JSON만 단독 불러오기는 지원하지 않습니다.');
          return;
        }

        const blobRefs = collectBlobRefs(parsed?.ui || {});
        if (blobRefs.length > 0) {
          alert('이 JSON은 blob 자산 참조를 포함해 단독으로 불러올 수 없습니다. 저장 당시 ZIP 전체 파일을 사용하세요.');
          return;
        }

        if (parsed.ui) setUi(parsed.ui);
        if (parsed.results) setResults(parsed.results);
        alert('프로젝트를 성공적으로 불러왔습니다.');
      } catch (err) {
        alert('파일 형식이 올바르지 않습니다.');
      }
    };
    reader.readAsText(file);
    e.currentTarget.value = '';
  };

  // --- Render Helpers ---
  const PanelHeader = ({ title, id, colorClass, badge }: { title: string, id: keyof typeof ui.panelsOpen, colorClass: string, badge?: string }) => (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <h3 className={`text-xl font-black ${colorClass}`}>{title}</h3>
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

  const generateImage = async (cutIndex: number) => {
    if (!keys.g1) return alert('Gemini 키가 필요합니다.');
    
    const promptObj = ui.cuts.prompts.find(p => p.index === cutIndex);
    if (!promptObj) return;

    setUi(prev => ({
      ...prev,
      imageJobs: prev.imageJobs.some(j => j.cut === cutIndex)
        ? prev.imageJobs.map(j => j.cut === cutIndex ? { cut: cutIndex, status: '생성 중...' } : j)
        : [...prev.imageJobs, { cut: cutIndex, status: '생성 중...' }]
    }));

    try {
      const ai = new GoogleGenAI({ apiKey: keys.g1 });
      const stylePrompt = VIDEO_STYLES_31.find(s => ui.videoStyle.selected.includes(s.name))?.prompt || '';
      
      const res = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: { parts: [{ text: `${promptObj.prompt}. Style: ${stylePrompt}` }] },
        config: { imageConfig: { aspectRatio: ui.cuts.ratio as any } }
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
          imageJobs: prev.imageJobs.map(j => j.cut === cutIndex ? { ...j, status: '이미지 없음 (재시도)' } : j)
        }));
      }
    } catch (err) {
      console.error(err);
      setUi(prev => ({
        ...prev,
        imageJobs: prev.imageJobs.map(j => j.cut === cutIndex ? { ...j, status: '실패' } : j)
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
    const availableSlides = ui.imageJobs
      .filter(j => j.imageUrl)
      .sort((a, b) => a.cut - b.cut)
      .map(j => ({
        cut: j.cut,
        imageUrl: j.imageUrl,
        motion: previousMotionByCut.get(j.cut) || pickSlideMotion(ui.cuts.items[j.cut - 1] || '', j.cut),
      }));

    if (availableSlides.length === 0) {
      alert('생성된 이미지가 없습니다. 11번 패널에서 이미지를 먼저 준비하세요.');
      return;
    }

    setUi(prev => ({ ...prev, finalVideo: { ...prev.finalVideo, generating: true } }));

    if (ui.finalVideo.type === 'image_slide') {
      setUi(prev => ({
        ...prev,
        finalVideo: {
          ...prev.finalVideo,
          generating: false,
          slides: availableSlides,
          activeSlide: 0,
          url: '',
          outputFormat: 'webm',
        },
      }));
      alert(`이미지 슬라이드 구성이 완료되었습니다. (${availableSlides.length}컷, 6가지 모션 자동 배정)`);
      return;
    }

    setTimeout(() => {
      const firstImage = availableSlides[0]?.imageUrl || '';
      setUi(prev => ({
        ...prev,
        finalVideo: {
          ...prev.finalVideo,
          generating: false,
          url: firstImage,
          slides: availableSlides,
          activeSlide: 0,
          outputFormat: 'mp4',
        },
      }));
      alert('AI 비디오 생성은 목업 상태입니다. 현재는 이미지 슬라이드를 우선 사용하세요.');
    }, 1200);
  };

  const handleExportSlideVideo = async () => {
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

    setUi(prev => ({ ...prev, finalVideo: { ...prev.finalVideo, generating: true } }));

    let audioContext: AudioContext | null = null;
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

      const images = await Promise.all(slides.map(slide => loadImageElement(slide.imageUrl)));
      const fps = 30;
      const stream = canvas.captureStream(fps);

      let audioDuration = 0;
      let sourceNode: AudioBufferSourceNode | null = null;
      let destinationNode: MediaStreamAudioDestinationNode | null = null;

      if (ui.tts.audioUrl) {
        audioContext = new window.AudioContext();
        const audioBufferData = await fetch(ui.tts.audioUrl).then(res => {
          if (!res.ok) {
            throw new Error('TTS 음원 로드 실패');
          }
          return res.arrayBuffer();
        });
        const decoded = await audioContext.decodeAudioData(audioBufferData.slice(0));
        audioDuration = decoded.duration;
        destinationNode = audioContext.createMediaStreamDestination();
        sourceNode = audioContext.createBufferSource();
        sourceNode.buffer = decoded;
        sourceNode.connect(destinationNode);

        const audioTrack = destinationNode.stream.getAudioTracks()[0];
        if (audioTrack) {
          stream.addTrack(audioTrack);
        }
      }

      const slideDuration = Math.max(1, ui.finalVideo.slideDuration);
      const slideDurationTotal = slides.length * slideDuration;
      const totalDuration = Math.max(slideDurationTotal, audioDuration || 0);
      if (totalDuration <= 0) {
        throw new Error('렌더링 길이를 계산할 수 없습니다.');
      }

      const subtitleSegments = ui.finalVideo.subtitleEnabled
        ? buildSubtitleSegments(
            slides.map(slide => ui.cuts.items[slide.cut - 1] || ''),
            totalDuration,
            Math.max(12, ui.finalVideo.subtitleMaxChars),
          )
        : [];
      drawSlideToCanvas(ctx, images[0], slides[0].motion, 0, width, height);

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
      if (audioContext && sourceNode) {
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }
        sourceNode.start(0);
      }

      const start = performance.now();
      await new Promise<void>(resolve => {
        const render = () => {
          const elapsed = (performance.now() - start) / 1000;
          if (elapsed >= totalDuration) {
            const lastSlide = slides[slides.length - 1];
            const lastImage = images[images.length - 1];
            drawSlideToCanvas(ctx, lastImage, lastSlide.motion, 1, width, height);
            resolve();
            return;
          }

          const slideIndex = Math.min(Math.floor(elapsed / slideDuration), slides.length - 1);
          const slideProgress = Math.min(1, Math.max(0, (elapsed - slideIndex * slideDuration) / slideDuration));
          drawSlideToCanvas(ctx, images[slideIndex], slides[slideIndex].motion, slideProgress, width, height);

          if (subtitleSegments.length > 0) {
            const subtitle = subtitleSegments.find(s => elapsed >= s.start && elapsed < s.end);
            if (subtitle) {
              const words = subtitle.text.split(/\s+/).filter(Boolean);
              const segmentDuration = Math.max(0.001, subtitle.end - subtitle.start);
              const segmentProgress = Math.min(0.999, Math.max(0, (elapsed - subtitle.start) / segmentDuration));
              const highlightWord = ui.finalVideo.subtitleWordHighlight && words.length > 0
                ? words[Math.min(words.length - 1, Math.floor(segmentProgress * words.length))]
                : undefined;
              const keywordSource = ui.finalVideo.subtitleUsePerCutKeywords
                ? ui.finalVideo.subtitleKeywordsByCut[subtitle.cut] || ''
                : ui.finalVideo.subtitleKeywords;
              const subtitleKeywordSet = parseKeywordSet(keywordSource || '');

              drawSubtitleOverlay(
                ctx,
                width,
                height,
                subtitle.lines,
                ui.finalVideo.subtitlePosition,
                ui.finalVideo.subtitleGridPosition,
                {
                  preset: ui.finalVideo.subtitlePreset,
                  highlightWord,
                  highlightKeywords: subtitleKeywordSet,
                  progress: segmentProgress,
                  entryAnimation: ui.finalVideo.subtitleEntryAnimation,
                  highlightStrength: ui.finalVideo.subtitleHighlightStrength,
                },
              );
            }
          }

          requestAnimationFrame(render);
        };
        render();
      });

      recorder.stop();
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
      if (audioContext) {
        await audioContext.close().catch(() => undefined);
      }
    }
  };

  const handleDownloadSrt = () => {
    const slides = ui.finalVideo.slides;
    if (slides.length === 0) {
      alert('먼저 슬라이드 구성을 완료하세요.');
      return;
    }

    const slideDuration = Math.max(1, ui.finalVideo.slideDuration);
    const baseDuration = slides.length * slideDuration;
    const estimatedTotal = Math.max(baseDuration, slides.length);
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
        subtitleGridPosition: 9,
        subtitleMaxChars: 20,
        subtitleWordHighlight: true,
        subtitleHighlightStrength: 'high',
        subtitleEntryAnimation: 'pop',
      },
      docu: {
        subtitlePreset: 'docu',
        subtitlePosition: 'bottom',
        subtitleGridPosition: 9,
        subtitleMaxChars: 28,
        subtitleWordHighlight: false,
        subtitleHighlightStrength: 'low',
        subtitleEntryAnimation: 'fade',
      },
      lecture: {
        subtitlePreset: 'lecture',
        subtitlePosition: 'middle',
        subtitleGridPosition: 5,
        subtitleMaxChars: 26,
        subtitleWordHighlight: true,
        subtitleHighlightStrength: 'medium',
        subtitleEntryAnimation: 'fade',
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
        subtitleGridPosition: Number(template.subtitleGridPosition || (template.subtitlePosition === 'middle' ? 5 : 9)),
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
    setUi(prev => ({
      ...prev,
      finalVideo: {
        ...prev.finalVideo,
        subtitlePreset: selected.config.subtitlePreset,
        subtitlePosition: selected.config.subtitlePosition,
        subtitleGridPosition: Number(selected.config.subtitleGridPosition || (selected.config.subtitlePosition === 'middle' ? 5 : 9)),
        subtitleMaxChars: selected.config.subtitleMaxChars,
        subtitleWordHighlight: selected.config.subtitleWordHighlight,
        subtitleHighlightStrength: selected.config.subtitleHighlightStrength,
        subtitleEntryAnimation: selected.config.subtitleEntryAnimation,
        subtitleKeywords: selected.config.subtitleKeywords,
        subtitleUsePerCutKeywords: selected.config.subtitleUsePerCutKeywords,
      },
    }));
  };

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
      const text = await file.text();
      const parsed = JSON.parse(text);
      const incoming = Array.isArray(parsed?.templates)
        ? parsed.templates
        : Array.isArray(parsed)
        ? parsed
        : [];

      const sanitized = incoming
        .filter((t: any) => t && typeof t.name === 'string')
        .map((t: any) => ({
          name: String(t.name).slice(0, 40),
          subtitlePreset: (['shorts', 'docu', 'lecture'].includes(t.subtitlePreset) ? t.subtitlePreset : 'shorts') as SubtitlePreset,
          subtitlePosition: (['bottom', 'middle'].includes(t.subtitlePosition) ? t.subtitlePosition : 'bottom') as SubtitlePosition,
          subtitleGridPosition: Number.isFinite(t.subtitleGridPosition) ? Math.min(10, Math.max(1, Number(t.subtitleGridPosition))) : 9,
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
      alert(`${sanitized.length}개 템플릿을 가져왔습니다.`);
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

          const response = await ai.models.generateContent({
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
        const response = await ai.models.generateContent({
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
    if (!ui.finalVideo.url) {
      alert('먼저 슬라이드 렌더링을 완료하세요.');
      return;
    }

    setUi(prev => ({
      ...prev,
      finalVideo: { ...prev.finalVideo, transcoding: true, ffmpegNote: '변환 준비 중...' },
    }));

    try {
      const ffmpeg = await ensureFfmpegLoaded();
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
        await ffmpeg.exec([
          '-i', 'input.webm',
          '-c:v', 'mpeg4',
          '-q:v', '5',
          '-c:a', 'aac',
          '-b:a', '128k',
          'output.mp4',
        ]);
      }

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
      console.error(err);
      setUi(prev => ({
        ...prev,
        finalVideo: {
          ...prev.finalVideo,
          transcoding: false,
          ffmpegNote: 'MP4 변환 실패',
        },
      }));
      alert(`MP4 변환 실패: ${err?.message || '알 수 없는 오류'}`);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-10 space-y-8 relative z-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-500 rounded-2xl shadow-lg shadow-amber-500/20">
            <Sparkles className="w-8 h-8 text-black" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white">AI Storyteller Lite</h1>
            <p className="text-slate-400 font-medium">유튜브 트렌드 분석 및 AI 콘텐츠 제작 솔루션</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleNewProject}
            className="flex items-center gap-2 bg-cyan-500/20 border border-cyan-300/30 text-cyan-100 px-5 py-2.5 rounded-full hover:bg-cyan-500/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-bold">새프로젝트</span>
          </button>
          <button 
            onClick={() => setUi(prev => ({ ...prev, happyDayOpen: true }))}
            className="bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-black px-5 py-2.5 rounded-full shadow-lg hover:brightness-110 transition-all"
          >
            🛍️ Happy Day 구경
          </button>
          <button 
            onClick={saveProject}
            className="flex items-center gap-2 bg-white/5 border border-white/10 px-5 py-2.5 rounded-full hover:bg-white/10 transition-all"
          >
            <Save className="w-4 h-4" />
            <span className="text-sm font-bold">프로젝트 저장</span>
          </button>
          <label className="relative group flex items-center gap-2 bg-white/5 border border-white/10 px-5 py-2.5 rounded-full hover:bg-white/10 transition-all cursor-pointer">
            <Download className="w-4 h-4" />
            <span className="text-sm font-bold">불러오기</span>
            <input type="file" accept=".json" onChange={loadProject} className="hidden" />
            <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-72 -translate-x-1/2 rounded-xl border border-amber-300/40 bg-[#10192f] p-3 text-[10px] text-amber-100 opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
              JSON 파일은 저장 당시 필요한 자산이 모두 있어야 정상 복원됩니다. 자산이 없으면 불러오기에 실패할 수 있습니다. ZIP 전체 보관을 권장합니다.
            </div>
          </label>
          <button 
            onClick={() => setUi(prev => ({ ...prev, settingsOpen: true }))}
            className="flex items-center gap-2 bg-white/5 border border-white/10 px-5 py-2.5 rounded-full hover:bg-white/10 transition-all"
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm font-bold">API 설정</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto space-y-8">
        {/* 1. 유튜브 검색 */}
        <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl">
          <PanelHeader title="1. 유튜브 검색" id="p1" colorClass="gold-gradient-text" />
          {ui.panelsOpen.p1 && (
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
                    {Object.keys(COUNTRY_MAP).map(c => (
                      <button 
                        key={c}
                        onClick={() => setUi(prev => ({ ...prev, filters: { ...prev.filters, country: c } }))}
                        className={`py-2 rounded-xl text-[11px] font-bold transition-all ${ui.filters.country === c ? 'bg-amber-500 text-black' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
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
                    value={ui.filters.count}
                    onChange={(e) => setUi(prev => ({ ...prev, filters: { ...prev.filters, count: Number(e.target.value) } }))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs outline-none"
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
                  <input 
                    type="range"
                    min="0"
                    max="1000000"
                    step="10000"
                    value={ui.filters.minViews}
                    onChange={(e) => setUi(prev => ({ ...prev, filters: { ...prev.filters, minViews: Number(e.target.value) } }))}
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
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black py-4 rounded-2xl shadow-xl shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {ui.searching ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : '유튜브 검색 실행'}
              </button>
            </div>
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
                      onClick={() => setUi(prev => ({ ...prev, selectedHookTitle: video.title }))}
                      className={`group cursor-pointer bg-black/40 border rounded-2xl p-4 flex gap-4 transition-all ${ui.selectedHookTitle === video.title ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/5 hover:border-emerald-500/30'}`}
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
            <div className="space-y-8">
              <button 
                onClick={generateHooks}
                disabled={ui.hookLoading || results.length === 0}
                className="w-full bg-orange-500 hover:bg-orange-600 text-black font-black py-4 rounded-2xl transition-all disabled:opacity-50"
              >
                {ui.hookLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : '바이럴 제목 30선 생성'}
              </button>
              
              {ui.hookTitles.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ui.hookTitles.map((hook, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => setUi(prev => ({ ...prev, selectedHookTitle: hook.title }))}
                      className={`cursor-pointer p-4 rounded-2xl group transition-all border ${ui.selectedHookTitle === hook.title ? 'bg-orange-500/20 border-orange-500' : 'bg-black/40 border-white/5 hover:border-orange-500/30'}`}
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
          )}
        </section>

        {/* 4. 쇼츠대본 / 롱폼대본 생성 */}
        <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl">
          <PanelHeader title="4. 쇼츠대본 / 롱폼대본 생성" id="p4" colorClass="text-blue-400" />
          {ui.panelsOpen.p4 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <p className="text-sm text-slate-400">선택한 제목과 검색 결과를 기반으로 대본을 생성합니다.</p>
                <p className="text-xs text-blue-400 font-bold">선택한 제목: {ui.selectedHookTitle || '없음'}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 대본 타입 */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">대본 타입</label>
                  <select 
                    value={ui.script.type}
                    onChange={(e) => setUi(prev => ({ ...prev, script: { ...prev.script, type: e.target.value as any } }))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 ring-blue-500/50"
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
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 ring-blue-500/50"
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
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 ring-blue-500/50"
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
                  disabled={ui.script.generating || !ui.selectedHookTitle}
                  className="flex-1 bg-amber-400 hover:bg-amber-500 text-black font-black py-4 rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {ui.script.generating ? <Loader2 className="w-5 h-5 animate-spin" /> : '대본 생성'}
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
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">글자 수</span>
                      <span className="text-lg font-bold text-white">{ui.script.output.length}자</span>
                    </div>
                    <div className="flex-1 bg-black/40 border border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">예상 시간 (1.0x)</span>
                      <span className="text-lg font-bold text-amber-400">{Math.ceil(ui.script.output.length / 3.5)}초</span>
                    </div>
                    <div className="flex-1 bg-black/40 border border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">예상 시간 (1.25x)</span>
                      <span className="text-lg font-bold text-cyan-400">{Math.ceil((ui.script.output.length / 3.5) / 1.25)}초</span>
                    </div>
                  </div>
                  <div className="bg-black/40 border border-white/5 p-6 rounded-3xl relative group">
                    <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap max-h-[400px] overflow-y-auto custom-scrollbar">
                      <Markdown>{ui.script.output}</Markdown>
                    </div>
                  </div>
                </div>
              )}
            </div>
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
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {VIDEO_STYLES_31.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setUi(prev => ({ ...prev, videoStyle: { ...prev.videoStyle, selected: `${style.id}. ${style.name}` } }))}
                    className={`group relative aspect-square rounded-2xl overflow-hidden border-2 transition-all ${
                      ui.videoStyle.selected.includes(style.name) 
                        ? 'border-amber-400 scale-95 shadow-[0_0_15px_rgba(251,191,36,0.3)]' 
                        : 'border-transparent hover:border-white/20'
                    }`}
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
              <div className="bg-amber-400/10 border border-amber-400/20 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center text-black font-black text-xs">
                    {ui.videoStyle.selected.split('.')[0]}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Selected Style</p>
                    <p className="text-sm font-bold text-white">{ui.videoStyle.selected}</p>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 font-medium italic max-w-[50%] text-right">
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
                  <div className="grid grid-cols-4 gap-2">
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
                disabled={ui.thumbnail.generating || !ui.script.output}
                className="w-full bg-pink-500 hover:bg-pink-600 text-black font-black py-4 rounded-2xl transition-all disabled:opacity-50"
              >
                {ui.thumbnail.generating ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : '썸네일 생성'}
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
                        <button className="p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-all">
                          <Download className="w-6 h-6 text-white" />
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 text-center font-bold uppercase tracking-widest">Thumbnail Preview</p>
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
                disabled={ui.description.generating || !ui.script.output}
                className="w-full bg-purple-500 hover:bg-purple-600 text-black font-black py-4 rounded-2xl transition-all disabled:opacity-50"
              >
                {ui.description.generating ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : '설명란 생성'}
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
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">TTS 모델 선택</label>
                    <select 
                      value={ui.tts.model}
                      onChange={(e) => setUi(prev => ({ ...prev, tts: { ...prev.tts, model: e.target.value } }))}
                      className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 ring-cyan-500/50 appearance-none cursor-pointer"
                    >
                      {GEMINI_TTS_MODELS.map(m => (
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
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 ring-cyan-500/50 appearance-none cursor-pointer"
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
                      className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:ring-2 ring-cyan-500/50 cursor-pointer appearance-none"
                    >
                      {TONE_STYLES.map(s => (
                        <option key={s.id} value={s.id} className="bg-slate-800 text-white">{s.label}</option>
                      ))}
                    </select>
                    <textarea 
                      value={ui.tts.styleInstructions}
                      onChange={(e) => setUi(prev => ({ ...prev, tts: { ...prev.tts, styleInstructions: e.target.value } }))}
                      placeholder="AI에게 전달할 낭독 스타일 지침..."
                      className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-[10px] text-slate-300 outline-none h-16 resize-none focus:ring-2 ring-cyan-500/50"
                    />
                  </div>
                </div>
                <div className="flex flex-col justify-end gap-3">
                  <button 
                    onClick={handleGenerateTTS}
                    disabled={ui.tts.generating || !ui.script.output}
                    className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-black py-4 rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {ui.tts.generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Volume2 className="w-5 h-5" /> TTS 생성</>}
                  </button>
                </div>
              </div>

              {ui.tts.audioUrl && (
                <div className="bg-cyan-500/5 border border-cyan-500/20 p-4 rounded-2xl flex items-center gap-4">
                  <div className="p-3 bg-cyan-500 rounded-xl"><Volume2 className="w-5 h-5 text-black" /></div>
                  <audio controls src={ui.tts.audioUrl} className="flex-1 h-8" />
                </div>
              )}
            </div>
          )}
        </section>

        {/* 9. 이미지 프롬프트 생성(대본나누기) */}
        <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl">
          <PanelHeader title="9. 이미지 프롬프트 생성(대본나누기)" id="p9" colorClass="text-cyan-400" />
          {ui.panelsOpen.p9 && (
            <div className="space-y-6">
              <p className="text-xs text-slate-400">대본을 의미/단락 기준으로 컷 분할 후 프롬프트 생성</p>
              
              <div className="flex flex-wrap gap-4 items-end">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">영상 스타일</label>
                  <select 
                    value={ui.videoStyle.selected}
                    onChange={(e) => setUi(prev => ({ ...prev, videoStyle: { ...prev.videoStyle, selected: e.target.value } }))}
                    className="bg-slate-800 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:ring-2 ring-cyan-500/50 appearance-none cursor-pointer min-w-[150px]"
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
                    className="bg-slate-800 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:ring-2 ring-cyan-500/50 appearance-none cursor-pointer min-w-[100px]"
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
                  className="bg-amber-500 hover:bg-amber-600 text-black font-black px-6 py-2 rounded-xl transition-all disabled:opacity-50 text-xs"
                >
                  컷 분할
                </button>

                <button 
                  onClick={generateImagePrompts}
                  disabled={ui.cuts.items.length === 0}
                  className="bg-cyan-500 hover:bg-cyan-600 text-black font-black px-6 py-2 rounded-xl transition-all disabled:opacity-50 text-xs"
                >
                  프롬프트 생성
                </button>
              </div>

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
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-xs text-slate-300 outline-none h-[300px] custom-scrollbar resize-none"
                />
                <button 
                  onClick={() => copyToClipboard(ui.cuts.prompts.map(p => p.prompt).join('\n\n'))}
                  className="absolute bottom-4 left-4 bg-amber-500 hover:bg-amber-600 text-black font-black px-6 py-2 rounded-xl transition-all text-xs"
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
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-xs text-slate-400 max-w-md">컷을 클릭하면 대기열에 추가되며 순차적으로 이미지가 자동 생성됩니다. (안정성을 위해 컷당 20~25초 간격)</p>
                
                <div className="flex items-center gap-3">
                  <select 
                    value={ui.thumbnail.model}
                    onChange={(e) => setUi(prev => ({ ...prev, thumbnail: { ...prev.thumbnail, model: e.target.value as any } }))}
                    className="bg-slate-800 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:ring-2 ring-cyan-500/50 appearance-none cursor-pointer"
                  >
                    <option value="gemini-3.1-flash-image-preview">Auto_Gemini-3.1-flash-image-preview ($0.0672)</option>
                    <option value="gemini-3-pro-image-preview">Auto_Gemini-3-pro-image-preview</option>
                  </select>

                  <button 
                    onClick={async () => {
                      abortRef.current = false;
                      let failCount = 0;
                      for (const cut of ui.cuts.prompts) {
                        if (abortRef.current) { alert('이미지 생성이 중지되었습니다.'); break; }
                        try {
                          await generateImage(cut.index);
                        } catch { failCount++; }
                        await new Promise(r => setTimeout(r, 2000));
                      }
                      if (failCount > 0) alert(`${failCount}개의 이미지 생성에 실패했습니다.`);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-4 py-6 rounded-xl transition-all text-xs vertical-text flex items-center justify-center"
                  >
                    전체 자동 생성
                  </button>

                  <button 
                    onClick={() => { abortRef.current = true; }}
                    className="bg-rose-500 hover:bg-rose-600 text-white font-black px-4 py-4 rounded-xl transition-all text-xs"
                  >
                    중지
                  </button>

                  <button className="bg-white/5 border border-dashed border-white/20 text-slate-400 px-4 py-4 rounded-xl hover:bg-white/10 transition-all text-xs">
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
                    return (
                      <div key={idx} className="bg-black/40 border border-white/5 rounded-3xl overflow-hidden group relative">
                        <div className="aspect-video bg-white/5 relative">
                          {job?.imageUrl ? (
                            <img src={job.imageUrl} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <button 
                                onClick={() => generateImage(cut.index)}
                                disabled={job?.status === '생성 중...'}
                                className="p-4 bg-white/5 hover:bg-white/10 rounded-full transition-all"
                              >
                                {job?.status === '생성 중...' ? <Loader2 className="w-8 h-8 animate-spin" /> : <ImagePlus className="w-8 h-8 text-slate-600" />}
                              </button>
                            </div>
                          )}
                          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-black text-cyan-400">CUT {cut.index}</div>
                          
                          {/* Action Buttons Overlay */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button 
                              onClick={() => generateImage(cut.index)}
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
                            {job?.imageUrl && (
                              <>
                                <button 
                                  onClick={() => {
                                    const a = document.createElement('a');
                                    a.href = job.imageUrl;
                                    a.download = `cut_${cut.index}.png`;
                                    a.click();
                                  }}
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
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>

        <Panel12Section
          ui={ui}
          setUi={setUi}
          PanelHeader={PanelHeader}
          handleGenerateFinalVideo={handleGenerateFinalVideo}
          handleExportSlideVideo={handleExportSlideVideo}
          handleDownloadSrt={handleDownloadSrt}
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
          subtitleTemplates={subtitleTemplates}
          templatePreviewOverrides={templatePreviewOverrides}
          BUILTIN_SUBTITLE_TEMPLATES={BUILTIN_SUBTITLE_TEMPLATES}
          SUBTITLE_PRESETS={SUBTITLE_PRESETS}
          RESOLUTION_PRESETS={RESOLUTION_PRESETS}
          SLIDE_MOTIONS={SLIDE_MOTIONS}
          SLIDE_MOTION_ANIMATION={SLIDE_MOTION_ANIMATION}
          PRESET_SAMPLE_TEXT={PRESET_SAMPLE_TEXT}
          ratioToCss={ratioToCss}
          gridPositionToPercent={gridPositionToPercent}
          getBuiltinTemplatePreview={getBuiltinTemplatePreview}
        />

        {/* 13. 영상편집 */}
        <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl">
          <PanelHeader title="13. 영상편집" id="p13" colorClass="text-rose-400" />
          {ui.panelsOpen.p13 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">영상 배속 설정</label>
                    <div className="flex gap-2">
                      {['1.0', '1.25', '1.5', '2.0'].map(speed => (
                        <button key={speed} className="flex-1 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/10 transition-all">
                          {speed}x
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">배속 결정 후 유튜브 설명란의 타임라인을 최종 확정할 수 있습니다.</p>
                </div>
                <div className="bg-black/40 border border-white/5 rounded-2xl p-6 flex items-center justify-center italic text-slate-600 text-xs">
                  고급 타임라인 편집 기능 준비 중...
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
