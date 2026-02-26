import { useCallback, useEffect, useMemo, useState } from 'react';

export const SUPPORTED_LOCALES = ['en', 'es', 'fr'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
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
            'Meet your new digital companion. A few quick steps will help you keep them thriving.',
          tip: 'Check in daily to keep your pet happy.',
        },
        {
          title: 'Feed Your Pet',
          description: 'Use the Feed action whenever hunger dips. Keeping them fed maintains mood and growth.',
          tip: 'Feed before hunger gets too low to avoid penalties.',
        },
        {
          title: 'Complete a Ritual',
          description: 'Rituals give your pet a daily boost. Pick one to keep their stats balanced.',
          tip: 'Rituals are best done once per day.',
        },
        {
          title: 'Play a Mini-Game',
          description: 'Mini-games add fun and rewards. Try one to keep your pet engaged.',
          tip: 'Mini-games can boost mood or resources.',
        },
        {
          title: 'Save or Export',
          description: 'Save your progress or export your pet to keep them safe across devices.',
          tip: 'Exporting helps protect your pet’s progress.',
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
