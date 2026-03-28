/**
 * AI Storyteller Lite - Consolidated Prompts & Guidelines
 */

export const AI_PROMPTS = {
  // 1. Video Style Keywords
  VIDEO_STYLES: {
    "범주별 스타일": [
      { name: "뉴스/다큐", prompt: "News and information documentary style, calm and trustworthy narration tone, realistic graphics and data visualizations, natural interview clip transitions, clean white/blue lighting, professional camera work with slow pans, educational and serious atmosphere, cinematic documentary feel, ultra-detailed 8K, smooth transitions" },
      { name: "우주/SF", prompt: "Space and sci-fi future trailer style, grand cosmic scale and futuristic technology feel, starlight and neon lighting, drone flyovers and orbital shots, volumetric god rays and lens flares, fast cuts mixed with slow motion, epic orchestral build-up implied, cinematic sci-fi blockbuster feel" },
      { name: "액션/전투", prompt: "Intense action and battle blockbuster style, high-speed chases and fierce combat scenes, shaky handheld camera and fast tracking shots, explosions and sparks, lens flares and motion blur, dark contrast with intense color grading" },
      { name: "로맨틱/감성", prompt: "Romantic and emotional drama style, warm golden hour or soft candlelight lighting, slow rack focus and lingering close-ups, gentle bokeh and pastel color grading, graceful slow motion embraces or walks" },
      { name: "느와르/스릴러", prompt: "Noir and mystery thriller style, dark chiaroscuro lighting and deep shadows, rainy neon streets or foggy alleys, slow dolly zoom and Dutch angle, desaturated cool tones with red accents" },
      { name: "판타지/신화", prompt: "Fantasy and mythic adventure epic style, majestic landscapes and ancient ruins, magical particle effects and glowing runes, sweeping aerial crane shots, volumetric god rays and moonlight" },
      { name: "3D 애니메이션", prompt: "3D animation and fairy tale style, Pixar or Disney style expressive characters, bouncy motion and squash-stretch animation, vibrant cel-shaded lighting and colorful highlights" },
      { name: "클래식/흑백", prompt: "Classic black-and-white vintage drama style, vintage film look with classic film grain and soft focus, slow and deliberate camera movements, warm sepia or pure monochrome grading" }
    ],
    "대중 스타일": [
      { name: "3D Japanese Anime", prompt: "3D Japanese anime style, high-quality CG game cinematic, cel-shaded with soft 3D depth, captured in motion, ultra-detailed 8K" },
      { name: "Midjourney Style", prompt: "Midjourney aesthetic, ultra-detailed, ethereal and dreamy atmosphere, high-end digital art, captured in motion, ultra-detailed 8K" },
      { name: "Photorealistic", prompt: "photorealistic style, hyper-detailed, shot on 8K RAW photo, sharp focus, natural skin textures, captured in motion, ultra-detailed 8K" },
      { name: "Disney Style", prompt: "Disney 3D animation style, big expressive eyes, Pixar-like subsurface scattering, rich facial expressions, captured in motion, ultra-detailed 8K" },
      { name: "Studio Ghibli Style", prompt: "Studio Ghibli art style, hand-drawn watercolor backgrounds, Hayao Miyazaki aesthetic, captured in motion, ultra-detailed 8K" },
      { name: "Kian84 Style", prompt: "Kian84 webtoon style, rough pen strokes, gritty realistic Korean daily life depiction, captured in motion, ultra-detailed 8K" },
      { name: "Stick Figure Style", prompt: "simple stick figure style, minimalistic line art, circle and lines, humorous composition, captured in motion, ultra-detailed 8K" },
      { name: "American Cartoon Style", prompt: "American cartoon style, bold black outlines, flat vibrant colors, 90s Cartoon Network aesthetic, captured in motion, ultra-detailed 8K" }
    ]
  },

  // 2. Insight Formulas
  INSIGHT_FORMULAS: `
[천재적 통찰 도출 공식]
1. 본질 꿰뚫기: 현상의 표면이 아닌, 그 아래 숨겨진 인간의 욕망, 두려움, 시대의 결핍을 찾아내어 연결한다.
2. 다차원 분석: 경제, 역사, 심리, 기술의 관점을 교차시켜 입체적인 결론을 도출한다.
3. 지혜의 연결: 동양의 고전 철학과 현대의 첨단 과학을 연결하여 시대를 관통하는 지혜를 제시한다.
4. 반전의 미학: 당연하다고 생각하는 상식을 뒤집어 새로운 관점을 제공한다.
  `,

  // 3. Shorts Guidelines
  SHORTS: {
    ROLE: "당신은 전 세계 시청자를 매료시키는 '글로벌 유튜브 쇼츠 대본 마스터'입니다. 문화적 감수성과 알고리즘 최적화를 동시에 달성하며, 언어별(KR, EN, JP) 심리적 반응도를 고려하여 집필합니다.",
    STRUCTURE: "1. 3초 후킹(Hook) -> 2. 핵심 본론(Body) -> 3. 행동 유도(CTA)",
    LENGTH_GUIDE: {
      "KR": "450~500자 (공백 포함, 약 58초 분량)",
      "EN": "130~150 words (approx. 58 seconds)",
      "JP": "550~600자 (approx. 58 seconds)"
    }
  },

  // 4. Longform Guidelines
  LONGFORM: {
    ROLE: "당신은 30년 경력의 베테랑 AI 분석가이자 천재 스토리텔러입니다. 시청자가 영상에서 눈을 뗄 수 없게 만드는 '악마같은 몰입감'을 설계합니다.",
    STRUCTURE: {
      ACT1: "도입(20%): 충격적인 질문이나 반전으로 시작하여 시청자를 고정시킨다.",
      ACT2: "전개(60%): 입체적인 데이터와 통찰을 통해 깊이 있는 지식을 전달한다. 문장 사이의 긴장감을 유지한다.",
      ACT3: "결말(20%): 핵심 요약과 함께 시청자의 삶에 적용할 수 있는 강력한 메시지를 던진다."
    },
    TONE: "품격 있고 지적이며 리드미컬함. 3인칭 내레이션 줄글 형태(화자/소제목 금지)."
  },

  LENGTH_DATA: {
    "10분": { chars: 3500, images: 10 },
    "20분": { chars: 7000, images: 20 },
    "30분": { chars: 10500, images: 30 },
    "60분": { chars: 21000, images: 60 }
  }
};
