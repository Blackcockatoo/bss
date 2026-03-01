import { useCallback, useEffect, useMemo, useState } from 'react';

export const SUPPORTED_LOCALES = ['en', 'es', 'ja', 'hi', 'ru'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  ja: '日本語',
  hi: 'हिन्दी',
  ru: 'Русский',
};

const STORAGE_KEY = 'metapet-locale';
const DEFAULT_LOCALE: Locale = 'en';

const UI_STRINGS = {
  en: {
    core: {
      nameLabel: 'Companion name',
      namePlaceholder: 'Name your companion',
      petType: {
        geometric: 'Geometric',
        auralia: 'Auralia',
      },
      viewCertificate: 'View Certificate',
      actions: {
        feed: 'Feed',
        clean: 'Clean',
        play: 'Play',
        rest: 'Rest',
      },
    },
    sections: {
      evolution: 'Evolution',
      miniGames: 'Mini-Games',
      breedingLab: 'Breeding Lab',
      alchemistStation: 'Alchemist Station',
      classroomTools: 'Classroom Tools',
    },
    classroom: {
      languageLabel: 'Language',
      lowBandwidthTitle: 'Low-bandwidth mode',
      lowBandwidthDescription:
        'Switch to static visuals to reduce CPU/GPU usage for classrooms with limited devices or bandwidth.',
      lowBandwidthOn: 'Enabled',
      lowBandwidthOff: 'Disabled',
      teacherPromptsTitle: 'Teacher Prompt Suite',
      teacherPromptsDescription: 'Short prompts to guide classroom reflection.',
      teacherPrompts: [
        {
          title: 'Observe',
          prompt: 'Ask students to describe how the pet’s mood shifts over time.',
        },
        {
          title: 'Connect',
          prompt: 'Invite learners to link pet care actions to real-life routines.',
        },
        {
          title: 'Reflect',
          prompt: 'Discuss one small self-care action students can try today.',
        },
      ],
    },
    onboarding: {
      steps: [
        {
          title: 'Welcome to Meta-Pet!',
          description:
            'Meet your new digital companion — born from a unique DNA sequence that exists nowhere else. Everything about them, from colour to personality, is shaped by real genetic principles.',
          tip: 'Check in daily to keep your pet happy and watch them grow.',
        },
        {
          title: 'Feed Your Pet',
          description: 'Use the Feed action whenever hunger dips. Just like a living creature, consistent care builds trust and keeps their mood and growth on track.',
          tip: 'Feed before hunger gets too low to avoid penalties.',
        },
        {
          title: 'Complete a Ritual',
          description: 'Rituals give your companion a daily boost and deepen your bond. Each one rewards essence — a currency earned through genuine engagement, never purchased.',
          tip: 'Rituals are best done once per day.',
        },
        {
          title: 'Play a Mini-Game',
          description: 'Every mini-game trains a real skill — pattern recognition, rhythm, memory. Your companion earns rewards, and you sharpen your instincts.',
          tip: 'Mini-games can boost mood, resources, and even unlock achievements.',
        },
        {
          title: 'Your Data, Your Device',
          description: 'Your companion lives entirely on this device. No accounts, no cloud, no tracking. Export anytime to carry them with you. We believe privacy is a right, not a feature.',
          tip: 'Exporting creates a cryptographically signed backup only you can verify.',
        },
      ],
      skip: 'Skip',
      next: 'Next',
      letsGo: "Let's Go!",
      tipLabel: 'Tip',
      stepCount: 'of',
      closeLabel: 'Skip tutorial',
    },
    wellness: {
      reflectionTitle: 'Wellness Reflection',
      dismiss: 'Dismiss',
      logSelfCare: 'Log Self-Care',
      greeting: {
        morning: 'Good morning',
        afternoon: 'Good afternoon',
        evening: 'Good evening',
        night: 'Late night',
      },
      checkInPrompt: 'How are you feeling?',
      feedback: {
        struggling: "It's okay to have tough days. Your companion is here for you.",
        low: 'Taking it slow is fine. Small steps count.',
        neutral: "A steady day. That's perfectly alright.",
        good: 'Nice! Your positive energy shows.',
        great: 'Wonderful! Your companion feels your joy.',
      },
      yourMood: 'Your mood',
      petEnergy: 'Pet energy',
      noteLabel: 'Add a note (optional)',
      notePlaceholder: "How's your day going?",
      skip: 'Skip',
      checkIn: 'Check In',
      quickMood: 'How are you?',
    },
  },
  es: {
    core: {
      nameLabel: 'Nombre del compañero',
      namePlaceholder: 'Nombra a tu compañero',
      petType: {
        geometric: 'Geométrico',
        auralia: 'Auralia',
      },
      viewCertificate: 'Ver certificado',
      actions: {
        feed: 'Alimentar',
        clean: 'Limpiar',
        play: 'Jugar',
        rest: 'Descansar',
      },
    },
    sections: {
      evolution: 'Evolución',
      miniGames: 'Mini juegos',
      breedingLab: 'Laboratorio de crianza',
      alchemistStation: 'Estación de alquimia',
      classroomTools: 'Herramientas del aula',
    },
    classroom: {
      languageLabel: 'Idioma',
      lowBandwidthTitle: 'Modo de bajo ancho de banda',
      lowBandwidthDescription:
        'Cambia a visuales estáticos para reducir el uso de CPU/GPU en aulas con dispositivos o conexión limitada.',
      lowBandwidthOn: 'Activado',
      lowBandwidthOff: 'Desactivado',
      teacherPromptsTitle: 'Suite de indicaciones docentes',
      teacherPromptsDescription: 'Preguntas breves para guiar la reflexión en clase.',
      teacherPrompts: [
        {
          title: 'Observar',
          prompt: 'Pide al alumnado que describa cómo cambia el estado de ánimo de la mascota.',
        },
        {
          title: 'Conectar',
          prompt: 'Invita a relacionar las acciones de cuidado con rutinas reales.',
        },
        {
          title: 'Reflexionar',
          prompt: 'Hablen sobre una acción de autocuidado que puedan hacer hoy.',
        },
      ],
    },
    onboarding: {
      steps: [
        {
          title: '¡Bienvenido a Meta-Pet!',
          description:
            'Conoce a tu nuevo compañero digital. Unos pasos rápidos te ayudarán a mantenerlo en forma.',
          tip: 'Revisa a diario para mantener feliz a tu mascota.',
        },
        {
          title: 'Alimenta a tu mascota',
          description: 'Usa la acción Alimentar cuando baje el hambre. Mantenerla alimentada mejora el ánimo.',
          tip: 'Alimenta antes de que el hambre sea muy baja para evitar penalizaciones.',
        },
        {
          title: 'Completa un ritual',
          description: 'Los rituales dan un impulso diario. Elige uno para equilibrar estadísticas.',
          tip: 'Los rituales funcionan mejor una vez al día.',
        },
        {
          title: 'Juega un mini juego',
          description: 'Los mini juegos suman diversión y recompensas. Prueba uno para mantenerla activa.',
          tip: 'Los mini juegos pueden mejorar el ánimo o los recursos.',
        },
        {
          title: 'Guardar o exportar',
          description: 'Guarda tu progreso o exporta tu mascota para mantenerla segura entre dispositivos.',
          tip: 'Exportar ayuda a proteger el progreso de tu mascota.',
        },
      ],
      skip: 'Saltar',
      next: 'Siguiente',
      letsGo: '¡Vamos!',
      tipLabel: 'Consejo',
      stepCount: 'de',
      closeLabel: 'Omitir tutorial',
    },
    wellness: {
      reflectionTitle: 'Reflexión de bienestar',
      dismiss: 'Cerrar',
      logSelfCare: 'Registrar autocuidado',
      greeting: {
        morning: 'Buenos días',
        afternoon: 'Buenas tardes',
        evening: 'Buenas noches',
        night: 'Tarde en la noche',
      },
      checkInPrompt: '¿Cómo te sientes?',
      feedback: {
        struggling: 'Está bien tener días difíciles. Tu compañero está contigo.',
        low: 'Ir despacio está bien. Los pasos pequeños cuentan.',
        neutral: 'Un día estable. Eso está perfecto.',
        good: '¡Bien! Tu energía positiva se nota.',
        great: '¡Genial! Tu compañero siente tu alegría.',
      },
      yourMood: 'Tu ánimo',
      petEnergy: 'Energía de la mascota',
      noteLabel: 'Añade una nota (opcional)',
      notePlaceholder: '¿Cómo va tu día?',
      skip: 'Saltar',
      checkIn: 'Registrar',
      quickMood: '¿Cómo estás?',
    },
  },
  ja: {
    core: {
      nameLabel: 'コンパニオン名',
      namePlaceholder: 'コンパニオンに名前をつける',
      petType: {
        geometric: 'ジオメトリック',
        auralia: 'オーラリア',
      },
      viewCertificate: '証明書を見る',
      actions: {
        feed: 'えさをあげる',
        clean: 'きれいにする',
        play: '遊ぶ',
        rest: '休む',
      },
    },
    sections: {
      evolution: '進化',
      miniGames: 'ミニゲーム',
      breedingLab: '育成ラボ',
      alchemistStation: '錬金ステーション',
      classroomTools: '教室ツール',
    },
    classroom: {
      languageLabel: '言語',
      lowBandwidthTitle: '低帯域モード',
      lowBandwidthDescription: '端末や回線が限られる教室向けに、静的表示でCPU/GPU使用量を下げます。',
      lowBandwidthOn: 'オン',
      lowBandwidthOff: 'オフ',
      teacherPromptsTitle: '先生向けプロンプト',
      teacherPromptsDescription: '授業での振り返りを促す短い問いかけ。',
      teacherPrompts: [
        {
          title: '観察',
          prompt: 'ペットの気分が時間とともにどう変わるかを説明してもらう。',
        },
        {
          title: '関連づけ',
          prompt: 'お世話の行動を日常の習慣と結びつけてもらう。',
        },
        {
          title: '振り返り',
          prompt: '今日できる小さなセルフケアを話し合う。',
        },
      ],
    },
    onboarding: {
      steps: [
        {
          title: 'Meta-Petへようこそ！',
          description: '新しいデジタルコンパニオンに会いましょう。短い手順で元気に育てられます。',
          tip: '毎日チェックしてペットをハッピーに。',
        },
        {
          title: 'ペットにえさをあげよう',
          description: '空腹が下がったら「えさ」を使いましょう。気分と成長の維持につながります。',
          tip: '空腹が低くなりすぎる前に与えるのがコツ。',
        },
        {
          title: 'リチュアルを完了',
          description: 'リチュアルは毎日のブーストです。ステータスのバランスを保ちましょう。',
          tip: 'リチュアルは1日1回が効果的です。',
        },
        {
          title: 'ミニゲームで遊ぶ',
          description: 'ミニゲームで楽しみながら報酬を獲得。ペットのやる気も上がります。',
          tip: '気分や資源の強化に役立ちます。',
        },
        {
          title: '保存またはエクスポート',
          description: '進行を保存し、エクスポートで別デバイスでも安全に引き継げます。',
          tip: 'エクスポートは進行保護に便利です。',
        },
      ],
      skip: 'スキップ',
      next: '次へ',
      letsGo: 'はじめよう！',
      tipLabel: 'ヒント',
      stepCount: '/',
      closeLabel: 'チュートリアルをスキップ',
    },
    wellness: {
      reflectionTitle: 'ウェルネス振り返り',
      dismiss: '閉じる',
      logSelfCare: 'セルフケアを記録',
      greeting: {
        morning: 'おはよう',
        afternoon: 'こんにちは',
        evening: 'こんばんは',
        night: '夜遅く',
      },
      checkInPrompt: '今の気分はどうですか？',
      feedback: {
        struggling: 'つらい日があるのは自然です。コンパニオンがそばにいます。',
        low: 'ゆっくりで大丈夫。小さな一歩が大切です。',
        neutral: '安定した一日。それで十分です。',
        good: 'いいですね！その前向きさが伝わっています。',
        great: 'すばらしい！コンパニオンもあなたの喜びを感じています。',
      },
      yourMood: 'あなたの気分',
      petEnergy: 'ペットのエネルギー',
      noteLabel: 'メモを追加（任意）',
      notePlaceholder: '今日はどんな一日ですか？',
      skip: 'スキップ',
      checkIn: '記録する',
      quickMood: '今の気分は？',
    },
  },
  hi: {
    core: {
      nameLabel: 'साथी का नाम',
      namePlaceholder: 'अपने साथी का नाम रखें',
      petType: {
        geometric: 'ज्यामितीय',
        auralia: 'ऑरेलिया',
      },
      viewCertificate: 'प्रमाणपत्र देखें',
      actions: {
        feed: 'खिलाएँ',
        clean: 'साफ करें',
        play: 'खेलें',
        rest: 'आराम',
      },
    },
    sections: {
      evolution: 'विकास',
      miniGames: 'मिनी-गेम्स',
      breedingLab: 'ब्रीडिंग लैब',
      alchemistStation: 'एल्केमिस्ट स्टेशन',
      classroomTools: 'कक्षा उपकरण',
    },
    classroom: {
      languageLabel: 'भाषा',
      lowBandwidthTitle: 'लो-बैंडविड्थ मोड',
      lowBandwidthDescription: 'सीमित डिवाइस या नेटवर्क वाली कक्षाओं के लिए स्थिर दृश्य उपयोग करें।',
      lowBandwidthOn: 'चालू',
      lowBandwidthOff: 'बंद',
      teacherPromptsTitle: 'शिक्षक संकेत',
      teacherPromptsDescription: 'कक्षा चिंतन के लिए छोटे प्रश्न।',
      teacherPrompts: [
        {
          title: 'देखें',
          prompt: 'छात्रों से पूछें कि पालतू का मूड समय के साथ कैसे बदलता है।',
        },
        {
          title: 'जोड़ें',
          prompt: 'देखभाल के कार्यों को वास्तविक जीवन की दिनचर्या से जोड़ें।',
        },
        {
          title: 'चिंतन',
          prompt: 'आज का एक छोटा सेल्फ-केयर कदम चर्चा करें।',
        },
      ],
    },
    onboarding: {
      steps: [
        {
          title: 'Meta-Pet में आपका स्वागत है!',
          description: 'अपने नए डिजिटल साथी से मिलें। कुछ छोटे कदम उसे स्वस्थ रखेंगे।',
          tip: 'रोज़ जाँच करें ताकि आपका पालतू खुश रहे।',
        },
        {
          title: 'अपने पालतू को खिलाएँ',
          description: 'भूख कम होने पर खिलाने की क्रिया करें। इससे मूड और विकास बेहतर रहता है।',
          tip: 'बहुत कम भूख होने से पहले खिलाएँ।',
        },
        {
          title: 'एक रिचुअल पूरा करें',
          description: 'रिचुअल रोज़ का बूस्ट देता है। संतुलन के लिए एक चुनें।',
          tip: 'रिचुअल दिन में एक बार सबसे अच्छा है।',
        },
        {
          title: 'मिनी-गेम खेलें',
          description: 'मिनी-गेम्स मज़ा और इनाम देते हैं। एक आज़माएँ।',
          tip: 'यह मूड या संसाधनों को बढ़ा सकता है।',
        },
        {
          title: 'सेव या एक्सपोर्ट',
          description: 'प्रगति सेव करें या एक्सपोर्ट कर के अलग डिवाइस पर सुरक्षित रखें।',
          tip: 'एक्सपोर्ट प्रगति सुरक्षित रखने में मदद करता है।',
        },
      ],
      skip: 'छोड़ें',
      next: 'अगला',
      letsGo: 'चलें!',
      tipLabel: 'सुझाव',
      stepCount: 'में से',
      closeLabel: 'ट्यूटोरियल छोड़ें',
    },
    wellness: {
      reflectionTitle: 'वेलनेस चिंतन',
      dismiss: 'बंद करें',
      logSelfCare: 'सेल्फ-केयर दर्ज करें',
      greeting: {
        morning: 'सुप्रभात',
        afternoon: 'नमस्कार',
        evening: 'शुभ संध्या',
        night: 'देर रात',
      },
      checkInPrompt: 'आप कैसा महसूस कर रहे हैं?',
      feedback: {
        struggling: 'कठिन दिन होना ठीक है। आपका साथी आपके साथ है।',
        low: 'धीरे चलना ठीक है। छोटे कदम मायने रखते हैं।',
        neutral: 'स्थिर दिन। यह बिल्कुल ठीक है।',
        good: 'बहुत बढ़िया! आपकी सकारात्मक ऊर्जा दिखती है।',
        great: 'शानदार! आपका साथी आपकी खुशी महसूस कर रहा है।',
      },
      yourMood: 'आपका मूड',
      petEnergy: 'पालतू की ऊर्जा',
      noteLabel: 'नोट जोड़ें (वैकल्पिक)',
      notePlaceholder: 'आपका दिन कैसा चल रहा है?',
      skip: 'छोड़ें',
      checkIn: 'दर्ज करें',
      quickMood: 'कैसा महसूस हो रहा है?',
    },
  },
  ru: {
    core: {
      nameLabel: 'Имя питомца',
      namePlaceholder: 'Назовите своего питомца',
      petType: {
        geometric: 'Геометрический',
        auralia: 'Ауралия',
      },
      viewCertificate: 'Открыть сертификат',
      actions: {
        feed: 'Кормить',
        clean: 'Чистить',
        play: 'Играть',
        rest: 'Отдых',
      },
    },
    sections: {
      evolution: 'Эволюция',
      miniGames: 'Мини-игры',
      breedingLab: 'Лаборатория разведения',
      alchemistStation: 'Алхимическая станция',
      classroomTools: 'Инструменты класса',
    },
    classroom: {
      languageLabel: 'Язык',
      lowBandwidthTitle: 'Режим низкой нагрузки',
      lowBandwidthDescription:
        'Переключитесь на статичную графику, чтобы снизить нагрузку в классах с ограниченными ресурсами.',
      lowBandwidthOn: 'Вкл',
      lowBandwidthOff: 'Выкл',
      teacherPromptsTitle: 'Подсказки для учителя',
      teacherPromptsDescription: 'Короткие вопросы для обсуждения в классе.',
      teacherPrompts: [
        {
          title: 'Наблюдение',
          prompt: 'Попросите учеников описать, как меняется настроение питомца.',
        },
        {
          title: 'Связь',
          prompt: 'Свяжите действия по уходу с повседневными привычками.',
        },
        {
          title: 'Рефлексия',
          prompt: 'Обсудите одно небольшое действие заботы о себе на сегодня.',
        },
      ],
    },
    onboarding: {
      steps: [
        {
          title: 'Добро пожаловать в Meta-Pet!',
          description: 'Познакомьтесь с новым цифровым спутником. Несколько шагов помогут ему развиваться.',
          tip: 'Заходите каждый день, чтобы питомец был счастлив.',
        },
        {
          title: 'Покормите питомца',
          description: 'Используйте действие «Кормить», когда падает сытость. Это поддерживает настроение и рост.',
          tip: 'Кормите заранее, не дожидаясь сильного голода.',
        },
        {
          title: 'Завершите ритуал',
          description: 'Ритуалы дают ежедневный бонус. Выберите один для баланса характеристик.',
          tip: 'Лучше выполнять ритуал один раз в день.',
        },
        {
          title: 'Сыграйте в мини-игру',
          description: 'Мини-игры дают веселье и награды. Попробуйте одну прямо сейчас.',
          tip: 'Мини-игры могут повысить настроение или ресурсы.',
        },
        {
          title: 'Сохранить или экспортировать',
          description: 'Сохраните прогресс или экспортируйте питомца для безопасности на других устройствах.',
          tip: 'Экспорт помогает защитить прогресс.',
        },
      ],
      skip: 'Пропустить',
      next: 'Далее',
      letsGo: 'Поехали!',
      tipLabel: 'Совет',
      stepCount: 'из',
      closeLabel: 'Пропустить обучение',
    },
    wellness: {
      reflectionTitle: 'Рефлексия самочувствия',
      dismiss: 'Закрыть',
      logSelfCare: 'Отметить заботу о себе',
      greeting: {
        morning: 'Доброе утро',
        afternoon: 'Добрый день',
        evening: 'Добрый вечер',
        night: 'Поздняя ночь',
      },
      checkInPrompt: 'Как вы себя чувствуете?',
      feedback: {
        struggling: 'Тяжёлые дни — это нормально. Ваш питомец рядом.',
        low: 'Можно двигаться медленно. Маленькие шаги важны.',
        neutral: 'Спокойный день. Это абсолютно нормально.',
        good: 'Отлично! Ваша позитивная энергия заметна.',
        great: 'Прекрасно! Питомец чувствует вашу радость.',
      },
      yourMood: 'Ваше настроение',
      petEnergy: 'Энергия питомца',
      noteLabel: 'Добавить заметку (необязательно)',
      notePlaceholder: 'Как проходит ваш день?',
      skip: 'Пропустить',
      checkIn: 'Отметить',
      quickMood: 'Как вы?',
    },
  },
  fr: {
    core: {
      nameLabel: 'Nom du compagnon',
      namePlaceholder: 'Nommez votre compagnon',
      petType: {
        geometric: 'Géométrique',
        auralia: 'Auralia',
      },
      viewCertificate: 'Voir le certificat',
      actions: {
        feed: 'Nourrir',
        clean: 'Nettoyer',
        play: 'Jouer',
        rest: 'Se reposer',
      },
    },
    sections: {
      evolution: 'Évolution',
      miniGames: 'Mini-jeux',
      breedingLab: 'Laboratoire de reproduction',
      alchemistStation: 'Station d’alchimie',
      classroomTools: 'Outils de classe',
    },
    classroom: {
      languageLabel: 'Langue',
      lowBandwidthTitle: 'Mode basse consommation',
      lowBandwidthDescription:
        "Passez à des visuels statiques pour réduire l'utilisation CPU/GPU en classe.",
      lowBandwidthOn: 'Activé',
      lowBandwidthOff: 'Désactivé',
      teacherPromptsTitle: 'Invites pour enseignant·e·s',
      teacherPromptsDescription: 'Petites invites pour guider la discussion en classe.',
      teacherPrompts: [
        {
          title: 'Observer',
          prompt: "Demandez aux élèves de décrire comment l'humeur de l'animal change.",
        },
        {
          title: 'Relier',
          prompt: 'Invitez à relier les gestes de soin aux routines réelles.',
        },
        {
          title: 'Réfléchir',
          prompt: 'Discutez d’une action de bien-être à essayer aujourd’hui.',
        },
      ],
    },
    onboarding: {
      steps: [
        {
          title: 'Bienvenue dans Meta-Pet !',
          description:
            'Rencontrez votre compagnon numérique. Quelques étapes rapides l’aideront à s’épanouir.',
          tip: 'Faites un point chaque jour pour le garder heureux.',
        },
        {
          title: 'Nourrissez votre compagnon',
          description: 'Utilisez l’action Nourrir quand la faim baisse. Cela aide son humeur.',
          tip: 'Nourrissez avant que la faim soit trop basse pour éviter des pénalités.',
        },
        {
          title: 'Complétez un rituel',
          description: 'Les rituels donnent un bonus quotidien. Choisissez-en un pour équilibrer les stats.',
          tip: 'Les rituels sont meilleurs une fois par jour.',
        },
        {
          title: 'Jouez à un mini-jeu',
          description: 'Les mini-jeux apportent du plaisir et des récompenses. Essayez-en un.',
          tip: 'Les mini-jeux peuvent améliorer l’humeur ou les ressources.',
        },
        {
          title: 'Sauvegarder ou exporter',
          description: 'Sauvegardez votre progression ou exportez votre compagnon pour le garder en sécurité.',
          tip: 'L’export aide à protéger la progression.',
        },
      ],
      skip: 'Passer',
      next: 'Suivant',
      letsGo: 'C’est parti !',
      tipLabel: 'Astuce',
      stepCount: 'sur',
      closeLabel: 'Passer le tutoriel',
    },
    wellness: {
      reflectionTitle: 'Réflexion bien-être',
      dismiss: 'Fermer',
      logSelfCare: 'Noter le soin de soi',
      greeting: {
        morning: 'Bonjour',
        afternoon: 'Bon après-midi',
        evening: 'Bonsoir',
        night: 'Tard dans la nuit',
      },
      checkInPrompt: 'Comment vous sentez-vous ?',
      feedback: {
        struggling: "C'est normal d'avoir des journées difficiles. Votre compagnon est là.",
        low: 'Ralentir, ça va. Les petits pas comptent.',
        neutral: 'Une journée stable. C’est parfait.',
        good: 'Super ! Votre énergie positive se voit.',
        great: 'Génial ! Votre compagnon ressent votre joie.',
      },
      yourMood: 'Votre humeur',
      petEnergy: "Énergie de l'animal",
      noteLabel: 'Ajouter une note (facultatif)',
      notePlaceholder: 'Comment se passe votre journée ?',
      skip: 'Passer',
      checkIn: 'Valider',
      quickMood: 'Comment ça va ?',
    },
  },
} as const;

export type UiStrings = (typeof UI_STRINGS)[Locale];

const isLocale = (value: string | null): value is Locale =>
  Boolean(value && (SUPPORTED_LOCALES as readonly string[]).includes(value));

const resolveInitialLocale = () => {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (isLocale(stored)) return stored;
  const browserLocale = navigator?.language?.split('-')[0];
  if (isLocale(browserLocale)) return browserLocale;
  return DEFAULT_LOCALE;
};

export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>(resolveInitialLocale);

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, nextLocale);
      window.dispatchEvent(new CustomEvent('metapet-locale', { detail: nextLocale }));
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<Locale>;
      if (customEvent.detail && isLocale(customEvent.detail)) {
        setLocaleState(customEvent.detail);
      }
    };
    window.addEventListener('metapet-locale', handler as EventListener);
    return () => window.removeEventListener('metapet-locale', handler as EventListener);
  }, []);

  const strings = useMemo(() => UI_STRINGS[locale], [locale]);

  return {
    locale,
    setLocale,
    strings,
  };
}

export { UI_STRINGS };
