/**
 * Copy for the MetaPet home page in each published language.
 *
 * English is the source. Japanese and Hindi are full translations served at
 * /ja and /hi. Product and game names (MetaPet, Body Forge, DNA Lab, Monkey
 * Invaders, Bubble Hex, MetaPet.school, Blue $nake Studios) stay in English on
 * purpose so they read as names, not descriptions.
 */
export const HOME_LOCALES = ["en", "ja", "hi"] as const;
export type HomeLocale = (typeof HOME_LOCALES)[number];

export const HOME_PATHS: Record<HomeLocale, string> = {
  en: "/",
  ja: "/ja",
  hi: "/hi",
};

/** Open Graph locale codes. */
export const HOME_OG_LOCALE: Record<HomeLocale, string> = {
  en: "en_AU",
  ja: "ja_JP",
  hi: "hi_IN",
};

export interface HomeCopy {
  metaTitle: string;
  metaDescription: string;
  ogDescription: string;
  eyebrow: string;
  title: string;
  lead: string;
  body: string;
  ctaPet: string;
  ctaDna: string;
  ctaArcade: string;
  ctaTeach: string;
  mapLabel: string;
  mapLinks: Record<
    "pet" | "identity" | "dna" | "bodyForge" | "activities" | "wellness" | "arcade" | "studio",
    string
  >;
  twoProductsTitle: string;
  twoProductsBody: string;
  exploreEyebrow: string;
  exploreTitle: string;
  exploreBody: string;
  areas: Array<{ eyebrow: string; title: string; description: string; action: string }>;
  arcadeTitle: string;
  arcadeBody: string;
  arcadeAll: string;
  gameTaglines: Record<string, string>;
  play: string;
  comingSoon: string;
  teachersTitle: string;
  teachersBody: string;
  teachersPilot: string;
  teachersWorkspace: string;
  footerPortal: string;
  footerLine: string;
  languageLabel: string;
}

export const HOME_COPY: Record<HomeLocale, HomeCopy> = {
  en: {
    metaTitle: "MetaPet — by Blue $nake Studios",
    metaDescription:
      "Enter the complete MetaPet world: digital companions, DNA, Body Forge, activities, wellness and the separate MetaPet Schools classroom edition.",
    ogDescription:
      "The complete MetaPet creative system, with MetaPet Schools kept as a focused classroom product on its own domain.",
    eyebrow: "MetaPet · by Blue $nake Studios",
    title: "The whole MetaPet world lives here.",
    lead: "A living companion system built from DNA, care, play, body design, identity and strange creative experiments.",
    body: "One living MetaPet world. Play and explore here, start with the classroom lessons at MetaPet.school, or enter the teacher workspace when you want to teach with the deeper systems.",
    ctaPet: "Enter MetaPet",
    ctaDna: "Explore the DNA Lab",
    ctaArcade: "Enter the Arcade",
    ctaTeach: "Teach with MetaPet",
    mapLabel: "Full product map",
    mapLinks: {
      pet: "Pet",
      identity: "Identity",
      dna: "DNA",
      bodyForge: "Body Forge",
      activities: "Activities",
      wellness: "Wellness",
      arcade: "Arcade",
      studio: "The Studio",
    },
    twoProductsTitle: "One codebase. Two clear products.",
    twoProductsBody:
      "Shared engineering underneath, separate entry points and safety boundaries above it.",
    exploreEyebrow: "Explore the system",
    exploreTitle: "Different parts of one living product",
    exploreBody:
      "Each area changes how the same MetaPet identity looks, behaves, learns or expresses itself.",
    areas: [
      {
        eyebrow: "Living companion",
        title: "MetaPet",
        description:
          "Raise, care for and explore a persistent digital companion shaped by its own genome, state and history.",
        action: "Enter MetaPet",
      },
      {
        eyebrow: "Creature design",
        title: "Body Forge",
        description:
          "Build distinctive bodies, silhouettes, wings, surfaces and expressive systems without flattening every pet into the same template.",
        action: "Open Body Forge",
      },
      {
        eyebrow: "Generative identity",
        title: "DNA Lab",
        description:
          "Inspect the deeper genetic identity behind a pet through visual, musical and symbolic interpretations of the same seed.",
        action: "Explore DNA",
      },
      {
        eyebrow: "Play and regulation",
        title: "Activities & Wellness",
        description:
          "Move between games, experiments, care loops and calm experiences that make the companion feel alive rather than decorative.",
        action: "Explore activities",
      },
      {
        eyebrow: "Arcade",
        title: "Games",
        description:
          "Monkey Invaders, Bubble Hex and the progression-linked mini-game tracks, collected in one room instead of hidden behind the navigator.",
        action: "Open the arcade",
      },
    ],
    arcadeTitle: "And then there are the games.",
    arcadeBody: "Loud, self-contained, and built to be played rather than demonstrated.",
    arcadeAll: "See all games →",
    gameTaglines: {},
    play: "Play",
    comingSoon: "Coming to the arcade",
    teachersTitle: "For teachers and schools",
    teachersBody:
      "Seven guided classroom lessons to start. The full MetaPet toolkit when you are ready.",
    teachersPilot: "Start the classroom pilot",
    teachersWorkspace: "Teacher workspace",
    footerPortal: "Blue $nake Studios · Studio portal",
    footerLine: "MetaPet · Play, explore and teach with one living system.",
    languageLabel: "Language",
  },
  ja: {
    metaTitle: "MetaPet（メタペット）— Blue $nake Studios",
    metaDescription:
      "MetaPet の世界へ。DNA をもつデジタルの相棒、Body Forge、アクティビティ、ウェルネス、そして学校向けの MetaPet Schools。",
    ogDescription:
      "DNA から生まれる、育てて遊べるデジタルの相棒。学校向けの MetaPet Schools は専用ドメインで提供しています。",
    eyebrow: "MetaPet · Blue $nake Studios",
    title: "MetaPet の世界は、ぜんぶここに。",
    lead: "DNA、お世話、遊び、からだのデザイン、アイデンティティ、そして少しふしぎな創作実験から生まれた、生きているような相棒のシステムです。",
    body: "ひとつの MetaPet の世界。ここで遊んで探検するもよし、MetaPet.school の授業から始めるもよし。より深い仕組みで教えたいときは、先生用ワークスペースへどうぞ。",
    ctaPet: "MetaPet をはじめる",
    ctaDna: "DNA Lab を探検する",
    ctaArcade: "アーケードへ",
    ctaTeach: "MetaPet で教える",
    mapLabel: "ぜんぶの機能マップ",
    mapLinks: {
      pet: "ペット",
      identity: "アイデンティティ",
      dna: "DNA",
      bodyForge: "Body Forge",
      activities: "アクティビティ",
      wellness: "ウェルネス",
      arcade: "アーケード",
      studio: "スタジオ",
    },
    twoProductsTitle: "ひとつのコードベース、ふたつのプロダクト。",
    twoProductsBody:
      "土台の技術は共通。入口と安全の境界線は、それぞれ別に設けています。",
    exploreEyebrow: "システムを探検",
    exploreTitle: "ひとつの「生きた」プロダクトの、いろいろな顔",
    exploreBody:
      "どのエリアでも、同じ MetaPet の見た目、ふるまい、学び方、表現のしかたが変わっていきます。",
    areas: [
      {
        eyebrow: "生きている相棒",
        title: "MetaPet",
        description:
          "自分だけのゲノム、状態、歩んできた歴史によって形づくられるデジタルの相棒を、育て、お世話し、探検しましょう。",
        action: "MetaPet をはじめる",
      },
      {
        eyebrow: "クリーチャーデザイン",
        title: "Body Forge",
        description:
          "からだ、シルエット、翼、質感、表情のしくみを組み立てて、どのペットも同じ型にはまらない個性をつくります。",
        action: "Body Forge を開く",
      },
      {
        eyebrow: "ジェネラティブなアイデンティティ",
        title: "DNA Lab",
        description:
          "同じシード（種）を、映像、音楽、シンボルとして読み解き、ペットの奥にある遺伝的なアイデンティティを見てみましょう。",
        action: "DNA を探検する",
      },
      {
        eyebrow: "遊びと心のバランス",
        title: "アクティビティ & ウェルネス",
        description:
          "ゲーム、実験、お世話のループ、落ち着ける体験を行き来して、相棒を「飾り」ではなく「生きている存在」に。",
        action: "アクティビティを見る",
      },
      {
        eyebrow: "アーケード",
        title: "ゲーム",
        description:
          "Monkey Invaders、Bubble Hex、成長と連動するミニゲームを、ひとつの部屋にまとめました。",
        action: "アーケードを開く",
      },
    ],
    arcadeTitle: "そして、ゲームもあります。",
    arcadeBody: "にぎやかで、それだけで完結。見せるためではなく、遊ぶためにつくりました。",
    arcadeAll: "すべてのゲームを見る →",
    gameTaglines: {
      "monkey-invaders": "バナナで動く、宇宙のおバカ大作戦",
      bubblehex: "失われたゴシック・アーケードゲーム",
      "mini-game-tracks": "記憶、リズム、シジル、ヴィマーナ",
    },
    play: "遊ぶ",
    comingSoon: "アーケードに近日登場",
    teachersTitle: "先生と学校のみなさまへ",
    teachersBody:
      "まずは先生が進める7つの授業から。準備ができたら、MetaPet のすべてのツールをどうぞ。",
    teachersPilot: "授業での試験導入をはじめる（英語）",
    teachersWorkspace: "先生用ワークスペース（英語）",
    footerPortal: "Blue $nake Studios · スタジオポータル",
    footerLine: "MetaPet · ひとつの「生きた」システムで、遊び、探検し、教える。",
    languageLabel: "言語",
  },
  hi: {
    metaTitle: "MetaPet (मेटापेट) — Blue $nake Studios",
    metaDescription:
      "MetaPet की पूरी दुनिया: DNA वाले डिजिटल साथी, Body Forge, गतिविधियाँ, वेलनेस और स्कूलों के लिए अलग MetaPet Schools संस्करण।",
    ogDescription:
      "DNA से जन्मा डिजिटल साथी जिसे आप पालते, सँवारते और खेलते हैं। स्कूलों के लिए MetaPet Schools अपने अलग डोमेन पर है।",
    eyebrow: "MetaPet · Blue $nake Studios",
    title: "MetaPet की पूरी दुनिया यहीं है।",
    lead: "DNA, देखभाल, खेल, शरीर-डिज़ाइन, पहचान और कुछ अनोखे रचनात्मक प्रयोगों से बना एक जीवंत साथी।",
    body: "एक ही जीवंत MetaPet दुनिया। यहाँ खेलिए और खोजिए, MetaPet.school के कक्षा-पाठों से शुरुआत कीजिए, या गहरे सिस्टम से पढ़ाना हो तो शिक्षक वर्कस्पेस में आइए।",
    ctaPet: "MetaPet शुरू करें",
    ctaDna: "DNA Lab देखें",
    ctaArcade: "आर्केड में चलें",
    ctaTeach: "MetaPet से पढ़ाएँ",
    mapLabel: "पूरा प्रोडक्ट-नक्शा",
    mapLinks: {
      pet: "पेट",
      identity: "पहचान",
      dna: "DNA",
      bodyForge: "Body Forge",
      activities: "गतिविधियाँ",
      wellness: "वेलनेस",
      arcade: "आर्केड",
      studio: "स्टूडियो",
    },
    twoProductsTitle: "एक कोडबेस। दो साफ़ प्रोडक्ट।",
    twoProductsBody:
      "नीचे साझा तकनीक, ऊपर अलग-अलग प्रवेश-द्वार और सुरक्षा की सीमाएँ।",
    exploreEyebrow: "सिस्टम को जानिए",
    exploreTitle: "एक जीवंत प्रोडक्ट के अलग-अलग हिस्से",
    exploreBody:
      "हर हिस्सा बदलता है कि वही MetaPet कैसा दिखता है, कैसा बर्ताव करता है, कैसे सीखता है और ख़ुद को कैसे व्यक्त करता है।",
    areas: [
      {
        eyebrow: "जीवंत साथी",
        title: "MetaPet",
        description:
          "अपने जीनोम, हालत और इतिहास से गढ़े एक स्थायी डिजिटल साथी को पालिए, उसकी देखभाल कीजिए और उसके साथ खोज कीजिए।",
        action: "MetaPet शुरू करें",
      },
      {
        eyebrow: "जीव-डिज़ाइन",
        title: "Body Forge",
        description:
          "अनोखे शरीर, आकृतियाँ, पंख, सतहें और भाव बनाइए — ताकि हर पेट एक ही साँचे में न ढले।",
        action: "Body Forge खोलें",
      },
      {
        eyebrow: "जनरेटिव पहचान",
        title: "DNA Lab",
        description:
          "एक ही बीज (सीड) की दृश्य, संगीतमय और प्रतीकात्मक व्याख्याओं से पेट की गहरी आनुवंशिक पहचान देखिए।",
        action: "DNA देखें",
      },
      {
        eyebrow: "खेल और संतुलन",
        title: "गतिविधियाँ और वेलनेस",
        description:
          "गेम्स, प्रयोगों, देखभाल के चक्रों और शांत अनुभवों के बीच आइए-जाइए, ताकि साथी सजावट नहीं, जीवंत लगे।",
        action: "गतिविधियाँ देखें",
      },
      {
        eyebrow: "आर्केड",
        title: "गेम्स",
        description:
          "Monkey Invaders, Bubble Hex और प्रगति से जुड़े मिनी-गेम — सब एक ही कमरे में।",
        action: "आर्केड खोलें",
      },
    ],
    arcadeTitle: "और फिर हैं गेम्स।",
    arcadeBody: "धमाकेदार, अपने आप में पूरे, और दिखाने के लिए नहीं — खेलने के लिए बने।",
    arcadeAll: "सारे गेम्स देखें →",
    gameTaglines: {
      "monkey-invaders": "केले से चलने वाली अंतरिक्ष की धमाचौकड़ी",
      bubblehex: "एक खोया हुआ गॉथिक आर्केड गेम",
      "mini-game-tracks": "स्मृति, लय, सिगिल और विमान",
    },
    play: "खेलें",
    comingSoon: "जल्द ही आर्केड में",
    teachersTitle: "शिक्षकों और स्कूलों के लिए",
    teachersBody:
      "शुरुआत के लिए सात निर्देशित कक्षा-पाठ। तैयार हों तो MetaPet के सारे टूल।",
    teachersPilot: "कक्षा पायलट शुरू करें (अंग्रेज़ी)",
    teachersWorkspace: "शिक्षक वर्कस्पेस (अंग्रेज़ी)",
    footerPortal: "Blue $nake Studios · स्टूडियो पोर्टल",
    footerLine: "MetaPet · एक ही जीवंत सिस्टम से खेलिए, खोजिए और पढ़ाइए।",
    languageLabel: "भाषा",
  },
};
