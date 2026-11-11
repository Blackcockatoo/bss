/**
 * In-app copy for the core MetaPet screens (bottom navigation, vitals HUD and
 * the /pet bond screen), plus the hydration-safe locale hook they read.
 *
 * `useLocale()` in `@/lib/i18n` reads localStorage during the first render,
 * which is fine for client-only overlays but would mismatch server HTML on
 * pages that are server rendered. `useAppLocale()` reports "en" during
 * hydration and switches to the stored/browser locale right after, using the
 * same storage key and change event so both hooks stay in sync.
 *
 * Japanese and Hindi are complete; other locales fall back to English here.
 */
import { useSyncExternalStore } from "react";

import { type Locale, SUPPORTED_LOCALES } from "@/lib/i18n";

const STORAGE_KEY = "metapet-locale";
const CHANGE_EVENT = "metapet-locale";

const isLocale = (value: unknown): value is Locale =>
  typeof value === "string" &&
  (SUPPORTED_LOCALES as readonly string[]).includes(value);

export function readStoredLocale(): Locale {
  if (typeof window === "undefined") return "en";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isLocale(stored)) return stored;
  } catch {
    // Storage unavailable (private mode): fall through to the browser language.
  }
  const browser = window.navigator?.language?.split("-")[0];
  return isLocale(browser) ? browser : "en";
}

/** Persist a locale and notify every mounted `useLocale` / `useAppLocale`. */
export function storeLocale(locale: Locale) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // Non-fatal: the choice simply is not remembered.
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: locale }));
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useAppLocale(): Locale {
  return useSyncExternalStore(subscribe, readStoredLocale, () => "en");
}

export interface AppCopy {
  nav: {
    label: string;
    back: string;
    install: string;
    items: Record<"/pet" | "/app/activities?tab=games" | "/app/activities" | "/body-forge" | "/app/passport", string>;
  };
  hud: {
    hunger: string;
    hygiene: string;
    mood: string;
    energy: string;
    thriving: string;
    steady: string;
    needsCare: string;
    critical: string;
    feed: string;
    clean: string;
    play: string;
    sleep: string;
    feedHint: string;
    cleanHint: string;
    playHint: string;
    sleepHint: string;
  };
  shell: {
    privacy: string;
    journey: string;
    steps: Record<"pet" | "identity" | "dna", string>;
  };
  pet: {
    bondLayer: string;
    summary: string;
    replayTutorial: string;
    forms: Record<"auralia" | "evolved" | "geometry", string>;
    awakening: string;
    dnaLatest: string;
    dnaFrom: string;
    dnaStrand: string;
    dnaMode: string;
    dnaReopen: string;
    dnaNone: string;
    wardrobe: string;
    adventures: string;
    playGame: string;
    exploreTogether: string;
    makeSomething: string;
    family: string;
    lab: string;
    labHint: string;
    labSections: string;
    tabs: Record<"form" | "systems" | "stats" | "links", { label: string; hint: string }>;
    activeEngine: string;
    buildBody: string;
    projectForge: string;
  };
}

const EN: AppCopy = {
  nav: {
    label: "Meta-Pet navigation",
    back: "Go back",
    install: "Install app",
    items: {
      "/pet": "Pet",
      "/app/activities?tab=games": "Play",
      "/app/activities": "Discover",
      "/body-forge": "Create",
      "/app/passport": "Passport",
    },
  },
  hud: {
    hunger: "Hunger",
    hygiene: "Hygiene",
    mood: "Mood",
    energy: "Energy",
    thriving: "Thriving",
    steady: "Steady",
    needsCare: "Needs care",
    critical: "Critical!",
    feed: "Feed",
    clean: "Clean",
    play: "Play",
    sleep: "Sleep",
    feedHint: "Nourish your companion — consistent feeding builds trust and supports growth",
    cleanHint: "Keep things tidy — hygiene affects mood and overall wellbeing",
    playHint: "Play lifts mood and strengthens your bond — happy companions evolve faster",
    sleepHint: "Rest restores energy — every living thing needs downtime to grow",
  },
  shell: {
    privacy: "Privacy & local saves",
    journey: "Journey Progress",
    steps: { pet: "Pet", identity: "Privacy", dna: "DNA Play Lab" },
  },
  pet: {
    bondLayer: "Bond Layer",
    summary: "Care, play and explore with your companion. Your progress stays on this device.",
    replayTutorial: "Replay tutorial",
    forms: {
      auralia: "Auralia Companion",
      evolved: "Evolved / Body Forge",
      geometry: "Geometry / Sri Yantra",
    },
    awakening: "Awakening Meta-Pet",
    dnaLatest: "Latest DNA imprint:",
    dnaFrom: "from the",
    dnaStrand: "strand, last explored in",
    dnaMode: "mode.",
    dnaReopen: "Re-open DNA Hub",
    dnaNone: "No DNA imprint yet. Visit the DNA route after bonding here to unlock a genome readback.",
    wardrobe: "Open Wardrobe",
    adventures: "Companion adventures",
    playGame: "Play a game",
    exploreTogether: "Explore together",
    makeSomething: "Make something",
    family: "Companion family",
    lab: "Advanced / Mechanics Lab",
    labHint: "— peek under the hood to see identity, addons, and the crypto systems that keep your companion secure",
    labSections: "Mechanics Lab sections",
    tabs: {
      form: { label: "Form", hint: "Pick which body renders your companion" },
      systems: { label: "Systems", hint: "Profile, addons, evolution, breeding" },
      stats: { label: "Stats", hint: "Raw vitals and runtime numbers" },
      links: { label: "Links", hint: "Other routes that read this companion" },
    },
    activeEngine: "Active body engine",
    buildBody: "Build a new body",
    projectForge: "Explore Project Forge · Learn and create",
  },
};

const JA: AppCopy = {
  nav: {
    label: "Meta-Pet ナビゲーション",
    back: "戻る",
    install: "アプリをインストール",
    items: {
      "/pet": "ペット",
      "/app/activities?tab=games": "遊ぶ",
      "/app/activities": "見つける",
      "/body-forge": "つくる",
      "/app/passport": "パスポート",
    },
  },
  hud: {
    hunger: "おなか",
    hygiene: "清潔さ",
    mood: "きもち",
    energy: "元気",
    thriving: "絶好調",
    steady: "安定",
    needsCare: "お世話が必要",
    critical: "ピンチ！",
    feed: "ごはん",
    clean: "きれいに",
    play: "遊ぶ",
    sleep: "ねる",
    feedHint: "ごはんをあげよう。毎日のお世話が信頼と成長につながります",
    cleanHint: "きれいにしよう。清潔さはきもちと健康に影響します",
    playHint: "いっしょに遊ぶと、きもちが上がって絆が深まります。ごきげんな相棒ほど早く進化します",
    sleepHint: "休むと元気が回復します。育つためには、どんな生きものにも休息が必要です",
  },
  shell: {
    privacy: "プライバシーとローカル保存",
    journey: "これまでの歩み",
    steps: { pet: "ペット", identity: "プライバシー", dna: "DNA プレイラボ" },
  },
  pet: {
    bondLayer: "絆のレイヤー",
    summary: "相棒のお世話をして、遊んで、いっしょに探検しよう。進み具合はこの端末に保存されます。",
    replayTutorial: "チュートリアルをもう一度",
    forms: {
      auralia: "Auralia の相棒",
      evolved: "進化形 / Body Forge",
      geometry: "幾何形 / シュリー・ヤントラ",
    },
    awakening: "目覚めかけの Meta-Pet",
    dnaLatest: "最新の DNA インプリント：",
    dnaFrom: "（",
    dnaStrand: "の鎖、最後の探検は",
    dnaMode: "モード）",
    dnaReopen: "DNA Hub をもう一度開く",
    dnaNone: "DNA インプリントはまだありません。ここで絆を結んでから DNA のページへ行くと、ゲノムの読み取りが解放されます。",
    wardrobe: "ワードローブを開く",
    adventures: "相棒との冒険",
    playGame: "ゲームで遊ぶ",
    exploreTogether: "いっしょに探検",
    makeSomething: "なにかをつくる",
    family: "相棒のファミリー",
    lab: "上級者向け / メカニクス・ラボ",
    labHint: "— 中身をのぞいて、アイデンティティ、アドオン、相棒を守る暗号のしくみを見てみよう",
    labSections: "メカニクス・ラボのセクション",
    tabs: {
      form: { label: "すがた", hint: "相棒を描くボディを選びます" },
      systems: { label: "システム", hint: "プロフィール、アドオン、進化、ブリーディング" },
      stats: { label: "ステータス", hint: "バイタルと実行中の数値" },
      links: { label: "リンク", hint: "この相棒を読み込むほかのページ" },
    },
    activeEngine: "使用中のボディエンジン",
    buildBody: "新しいからだをつくる",
    projectForge: "Project Forge へ · 学んで、つくる",
  },
};

const HI: AppCopy = {
  nav: {
    label: "Meta-Pet नेविगेशन",
    back: "पीछे जाएँ",
    install: "ऐप इंस्टॉल करें",
    items: {
      "/pet": "पेट",
      "/app/activities?tab=games": "खेलें",
      "/app/activities": "खोजें",
      "/body-forge": "बनाएँ",
      "/app/passport": "पासपोर्ट",
    },
  },
  hud: {
    hunger: "भूख",
    hygiene: "सफ़ाई",
    mood: "मूड",
    energy: "ऊर्जा",
    thriving: "बढ़िया",
    steady: "ठीक-ठाक",
    needsCare: "देखभाल चाहिए",
    critical: "ख़तरा!",
    feed: "खिलाएँ",
    clean: "साफ़ करें",
    play: "खेलें",
    sleep: "सुलाएँ",
    feedHint: "अपने साथी को खिलाइए — नियमित देखभाल से भरोसा और विकास बढ़ता है",
    cleanHint: "सफ़ाई रखिए — सफ़ाई से मूड और सेहत दोनों अच्छे रहते हैं",
    playHint: "खेलने से मूड अच्छा होता है और रिश्ता गहरा — ख़ुश साथी जल्दी विकसित होते हैं",
    sleepHint: "आराम से ऊर्जा लौटती है — बढ़ने के लिए हर जीव को आराम चाहिए",
  },
  shell: {
    privacy: "प्राइवेसी और लोकल सेव",
    journey: "आपकी यात्रा",
    steps: { pet: "पेट", identity: "प्राइवेसी", dna: "DNA प्ले लैब" },
  },
  pet: {
    bondLayer: "रिश्ते की परत",
    summary: "अपने साथी की देखभाल कीजिए, खेलिए और साथ में खोजिए। आपकी प्रगति इसी डिवाइस पर रहती है।",
    replayTutorial: "ट्यूटोरियल फिर से देखें",
    forms: {
      auralia: "Auralia साथी",
      evolved: "विकसित / Body Forge",
      geometry: "ज्यामिति / श्री यंत्र",
    },
    awakening: "जागता हुआ Meta-Pet",
    dnaLatest: "ताज़ा DNA छाप:",
    dnaFrom: "—",
    dnaStrand: "स्ट्रैंड से, आख़िरी बार",
    dnaMode: "मोड में देखा गया।",
    dnaReopen: "DNA Hub फिर से खोलें",
    dnaNone: "अभी कोई DNA छाप नहीं। यहाँ रिश्ता बनाने के बाद DNA पेज पर जाइए, जीनोम की रीडिंग खुल जाएगी।",
    wardrobe: "वार्डरोब खोलें",
    adventures: "साथी के रोमांच",
    playGame: "गेम खेलें",
    exploreTogether: "साथ में खोजें",
    makeSomething: "कुछ बनाएँ",
    family: "साथी का परिवार",
    lab: "एडवांस्ड / मैकेनिक्स लैब",
    labHint: "— अंदर झाँककर पहचान, ऐड-ऑन और आपके साथी को सुरक्षित रखने वाले क्रिप्टो सिस्टम देखिए",
    labSections: "मैकेनिक्स लैब के हिस्से",
    tabs: {
      form: { label: "रूप", hint: "चुनिए कि आपका साथी किस शरीर में दिखे" },
      systems: { label: "सिस्टम", hint: "प्रोफ़ाइल, ऐड-ऑन, विकास, ब्रीडिंग" },
      stats: { label: "आँकड़े", hint: "सीधे वाइटल्स और रनटाइम संख्याएँ" },
      links: { label: "लिंक", hint: "दूसरे पेज जो इस साथी को पढ़ते हैं" },
    },
    activeEngine: "सक्रिय बॉडी इंजन",
    buildBody: "नया शरीर बनाएँ",
    projectForge: "Project Forge देखें · सीखें और बनाएँ",
  },
};

export const APP_COPY: Partial<Record<Locale, AppCopy>> = { en: EN, ja: JA, hi: HI };

export function appCopyFor(locale: Locale): AppCopy {
  return APP_COPY[locale] ?? EN;
}

export function useAppCopy(): AppCopy {
  return appCopyFor(useAppLocale());
}
