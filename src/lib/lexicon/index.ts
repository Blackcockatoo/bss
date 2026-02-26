/**
 * MetaPet Lexicon System
 *
 * A unique language and communication system for MetaPets.
 * The lexicon is genome-influenced, creating pets with distinct
 * "dialects" based on their genetic makeup.
 */

import type { Genome, DerivedTraits } from '@/lib/genome';
import type { Vitals } from '@/vitals';

// ============================================================================
// Core Lexicon Types
// ============================================================================

export type EmotionCategory =
  | 'joy'
  | 'sadness'
  | 'excitement'
  | 'curiosity'
  | 'affection'
  | 'hunger'
  | 'fatigue'
  | 'playful'
  | 'calm'
  | 'anxious'
  | 'proud'
  | 'grateful';

export type MessageIntent =
  | 'greeting'
  | 'farewell'
  | 'request'
  | 'observation'
  | 'emotion'
  | 'question'
  | 'response'
  | 'exclamation'
  | 'affirmation'
  | 'negation'
  | 'reflection'
  | 'dream'
  | 'memory'
  | 'prophecy';

export type VocalizationType =
  | 'chirp'
  | 'hum'
  | 'trill'
  | 'purr'
  | 'whistle'
  | 'coo'
  | 'chime'
  | 'murmur'
  | 'giggle'
  | 'sigh'
  | 'gasp'
  | 'squeak';

export interface LexiconMessage {
  /** The pet's native language text */
  native: string;
  /** Translated meaning in English */
  translation: string;
  /** The emotional tone */
  emotion: EmotionCategory;
  /** The intent behind the message */
  intent: MessageIntent;
  /** Vocalization sound type */
  vocalization: VocalizationType;
  /** Confidence/clarity of the message (0-1) */
  clarity: number;
  /** Timestamp */
  timestamp: number;
}

export interface LexiconVocabulary {
  /** Core words in the pet's language */
  words: Record<string, LexiconWord>;
  /** Grammar patterns based on genome */
  grammarPatterns: GrammarPattern[];
  /** Sound preferences */
  phonetics: PhoneticProfile;
  /** Dialect identifier based on genome hash */
  dialectId: string;
}

export interface LexiconWord {
  native: string;
  meanings: string[];
  partOfSpeech: 'noun' | 'verb' | 'adjective' | 'exclamation' | 'particle';
  emotionalWeight: number; // -1 to 1
  frequency: number; // How often the pet uses this word
}

export interface GrammarPattern {
  pattern: string; // e.g., "subject-emotion-object"
  weight: number;
  contexts: MessageIntent[];
}

export interface PhoneticProfile {
  /** Preferred consonant sounds */
  consonants: string[];
  /** Preferred vowel sounds */
  vowels: string[];
  /** Syllable structure preference */
  syllableStructure: 'simple' | 'complex' | 'melodic';
  /** Tendency towards soft or hard sounds */
  hardness: number; // 0 (soft) to 1 (hard)
  /** Musical quality */
  musicality: number; // 0 to 1
}

// ============================================================================
// Lexicon Core - Base Syllables and Sounds
// ============================================================================

const BASE_SYLLABLES = {
  soft: ['lu', 'mi', 'na', 'ri', 'sa', 'te', 'vi', 'wa', 'yo', 'zu', 'ae', 'io'],
  melodic: ['ala', 'eli', 'ilu', 'oro', 'uru', 'yae', 'iei', 'ouo', 'aia', 'eue'],
  bright: ['ki', 'pi', 'ti', 'chi', 'fi', 'shi', 'zi', 'thi', 'wi', 'li'],
  deep: ['um', 'on', 'an', 'en', 'om', 'un', 'am', 'em', 'im', 'ym'],
  flowing: ['ra', 'la', 'wa', 'ya', 'ha', 'ma', 'na', 'va', 'za', 'fa'],
  mystical: ['zha', 'xae', 'qua', 'kha', 'pha', 'tha', 'whi', 'yei', 'zhi', 'xo'],
};

const EMOTION_MODIFIERS: Record<EmotionCategory, { prefix: string; suffix: string; tone: string }> = {
  joy: { prefix: 'lu~', suffix: '~mi!', tone: 'bright' },
  sadness: { prefix: 'um...', suffix: '...na', tone: 'deep' },
  excitement: { prefix: 'ki!', suffix: '~pi!', tone: 'bright' },
  curiosity: { prefix: 'ae?', suffix: '~ri?', tone: 'melodic' },
  affection: { prefix: 'wa~', suffix: '~la♡', tone: 'soft' },
  hunger: { prefix: 'om~', suffix: '~num', tone: 'deep' },
  fatigue: { prefix: 'haa...', suffix: '...zzz', tone: 'soft' },
  playful: { prefix: 'pi~', suffix: '~pa!', tone: 'bright' },
  calm: { prefix: 'sha~', suffix: '~na', tone: 'flowing' },
  anxious: { prefix: 'ae!', suffix: '~!?', tone: 'melodic' },
  proud: { prefix: 'zha!', suffix: '~pha!', tone: 'mystical' },
  grateful: { prefix: 'ari~', suffix: '~gato', tone: 'soft' },
};

const INTENT_PATTERNS: Record<MessageIntent, string[]> = {
  greeting: ['[name] [emotion-word]!', '[joy-sound] [affection]!', '[hello] [time]~'],
  farewell: ['[wave] [name]~', '[until] [next]...', '[bye] [emotion]~'],
  request: ['[please] [want] [object]?', '[need] [object] [emotion]...', '[give] [me] [object]~?'],
  observation: ['[see] [object] [adjective]~', '[there] [is] [thing]!', '[look] [at] [this]~'],
  emotion: ['[feel] [emotion]...', '[emotion-sound] [emotion-word]~', '[I] [am] [feeling]!'],
  question: ['[what] [is] [object]?', '[why] [action]~?', '[how] [feeling]~?'],
  response: ['[yes] [emotion]!', '[no] [reason]~', '[maybe] [thought]...'],
  exclamation: ['[wow]! [emotion]!', '[oh]! [thing]!', '[surprise-sound]!!'],
  affirmation: ['[yes]! [happy]~', '[agree] [emotion]!', '[good] [thing]~'],
  negation: ['[no]... [sad]~', '[not] [want]...', '[refuse] [gentle]~'],
  reflection: ['[think] [about] [memory]...', '[remember] [time]~', '[ponder] [meaning]...'],
  dream: ['[in-sleep] [see] [vision]~', '[dream] [of] [wonder]...', '[float] [through] [stars]~'],
  memory: ['[recall] [past] [emotion]...', '[when] [we] [did]~', '[long-ago] [memory]~'],
  prophecy: ['[future] [holds] [mystery]~', '[sense] [coming] [change]...', '[stars] [say] [message]~'],
};

// ============================================================================
// Vocabulary Generation
// ============================================================================

/**
 * Generate a unique vocabulary based on the pet's genome
 */
export function generateVocabulary(genome: Genome, traits: DerivedTraits): LexiconVocabulary {
  // Use genome to determine phonetic preferences
  const redSum = genome.red60.reduce((a, b) => a + b, 0);
  const blueSum = genome.blue60.reduce((a, b) => a + b, 0);
  const blackSum = genome.black60.reduce((a, b) => a + b, 0);

  const phonetics = generatePhoneticProfile(redSum, blueSum, blackSum, traits);
  const dialectId = generateDialectId(genome);

  // Generate core vocabulary words
  const words = generateCoreVocabulary(phonetics, traits);

  // Generate grammar patterns based on personality
  const grammarPatterns = generateGrammarPatterns(traits.personality);

  return {
    words,
    grammarPatterns,
    phonetics,
    dialectId,
  };
}

function generatePhoneticProfile(
  redSum: number,
  blueSum: number,
  blackSum: number,
  traits: DerivedTraits
): PhoneticProfile {
  const total = redSum + blueSum + blackSum;

  // Red influences hardness (physical traits)
  const hardness = Math.min(1, redSum / total + 0.2);

  // Blue influences musicality (personality traits)
  const musicality = Math.min(1, (blueSum / total) * 1.5);

  // Determine syllable structure based on personality
  let syllableStructure: 'simple' | 'complex' | 'melodic' = 'simple';
  if (traits.personality.curiosity > 70) {
    syllableStructure = 'complex';
  } else if (musicality > 0.6) {
    syllableStructure = 'melodic';
  }

  // Select consonants and vowels based on genome distribution
  const consonantTypes: Array<keyof typeof BASE_SYLLABLES> = [];
  if (hardness > 0.5) consonantTypes.push('bright');
  if (musicality > 0.5) consonantTypes.push('melodic');
  if (traits.personality.energy < 50) consonantTypes.push('soft');
  if (blackSum > redSum) consonantTypes.push('mystical');
  if (consonantTypes.length === 0) consonantTypes.push('flowing');

  const consonants = consonantTypes.flatMap((type) =>
    BASE_SYLLABLES[type].slice(0, 4)
  );

  const vowels = ['a', 'e', 'i', 'o', 'u'];
  if (musicality > 0.7) vowels.push('ae', 'ei', 'ou', 'ai');

  return {
    consonants: [...new Set(consonants)],
    vowels,
    syllableStructure,
    hardness,
    musicality,
  };
}

function generateDialectId(genome: Genome): string {
  // Create a unique dialect identifier from genome
  const redCode = genome.red60.slice(0, 7).join('');
  const blueCode = genome.blue60.slice(0, 7).join('');
  return `dialect-${redCode}-${blueCode}`;
}

function generateCoreVocabulary(
  phonetics: PhoneticProfile,
  traits: DerivedTraits
): Record<string, LexiconWord> {
  const words: Record<string, LexiconWord> = {};

  // Helper to generate a word
  const makeWord = (base: string, meanings: string[], pos: LexiconWord['partOfSpeech'], emotionalWeight: number) => {
    const syllables = phonetics.syllableStructure === 'complex' ? 3 : phonetics.syllableStructure === 'melodic' ? 2 : 1;
    let word = base;

    for (let i = 0; i < syllables; i++) {
      const consonant = phonetics.consonants[Math.floor(Math.random() * phonetics.consonants.length)];
      const vowel = phonetics.vowels[Math.floor(Math.random() * phonetics.vowels.length)];
      word += consonant + vowel;
    }

    return {
      native: word.slice(0, 8),
      meanings,
      partOfSpeech: pos,
      emotionalWeight,
      frequency: 0.5 + Math.random() * 0.5,
    };
  };

  // Core emotional words
  words['happy'] = makeWord('lu', ['happy', 'joyful', 'content'], 'adjective', 0.8);
  words['sad'] = makeWord('um', ['sad', 'melancholy', 'down'], 'adjective', -0.6);
  words['love'] = makeWord('wa', ['love', 'affection', 'care'], 'noun', 0.9);
  words['friend'] = makeWord('na', ['friend', 'companion', 'you'], 'noun', 0.7);
  words['food'] = makeWord('num', ['food', 'treat', 'yummy'], 'noun', 0.5);
  words['play'] = makeWord('pi', ['play', 'fun', 'game'], 'verb', 0.7);
  words['sleep'] = makeWord('zzu', ['sleep', 'rest', 'dream'], 'verb', 0.3);
  words['yes'] = makeWord('ae', ['yes', 'okay', 'agree'], 'exclamation', 0.4);
  words['no'] = makeWord('en', ['no', 'not', 'refuse'], 'exclamation', -0.2);
  words['hello'] = makeWord('chi', ['hello', 'hi', 'greetings'], 'exclamation', 0.6);
  words['bye'] = makeWord('va', ['bye', 'farewell', 'later'], 'exclamation', 0.3);
  words['want'] = makeWord('mo', ['want', 'desire', 'need'], 'verb', 0.2);
  words['give'] = makeWord('ta', ['give', 'share', 'offer'], 'verb', 0.5);
  words['see'] = makeWord('mi', ['see', 'look', 'watch'], 'verb', 0.3);
  words['think'] = makeWord('om', ['think', 'ponder', 'wonder'], 'verb', 0.2);
  words['feel'] = makeWord('ha', ['feel', 'sense', 'emotion'], 'verb', 0.4);
  words['good'] = makeWord('ki', ['good', 'nice', 'pleasant'], 'adjective', 0.6);
  words['bad'] = makeWord('ugh', ['bad', 'yucky', 'unpleasant'], 'adjective', -0.5);
  words['big'] = makeWord('oh', ['big', 'large', 'grand'], 'adjective', 0.3);
  words['small'] = makeWord('ti', ['small', 'tiny', 'little'], 'adjective', 0.2);
  words['pretty'] = makeWord('ri', ['pretty', 'beautiful', 'lovely'], 'adjective', 0.7);
  words['warm'] = makeWord('wu', ['warm', 'cozy', 'safe'], 'adjective', 0.6);
  words['cold'] = makeWord('brrr', ['cold', 'chilly', 'lonely'], 'adjective', -0.3);
  words['star'] = makeWord('shi', ['star', 'light', 'sparkle'], 'noun', 0.5);
  words['dream'] = makeWord('yu', ['dream', 'vision', 'hope'], 'noun', 0.6);
  words['memory'] = makeWord('re', ['memory', 'remember', 'past'], 'noun', 0.4);
  words['time'] = makeWord('to', ['time', 'moment', 'when'], 'noun', 0.1);
  words['heart'] = makeWord('ko', ['heart', 'soul', 'essence'], 'noun', 0.8);
  words['wow'] = makeWord('ooh', ['wow', 'amazing', 'surprise'], 'exclamation', 0.7);
  words['please'] = makeWord('pe', ['please', 'kindly'], 'particle', 0.3);

  // Add personality-influenced words
  if (traits.personality.curiosity > 70) {
    words['mystery'] = makeWord('xae', ['mystery', 'unknown', 'wonder'], 'noun', 0.5);
    words['explore'] = makeWord('qu', ['explore', 'discover', 'seek'], 'verb', 0.6);
  }

  if (traits.personality.playfulness > 70) {
    words['bounce'] = makeWord('boi', ['bounce', 'jump', 'hop'], 'verb', 0.7);
    words['silly'] = makeWord('hehe', ['silly', 'funny', 'goofy'], 'adjective', 0.6);
  }

  if (traits.personality.affection > 70) {
    words['cuddle'] = makeWord('nuz', ['cuddle', 'hug', 'snuggle'], 'verb', 0.9);
    words['precious'] = makeWord('awa', ['precious', 'dear', 'beloved'], 'adjective', 0.8);
  }

  return words;
}

function generateGrammarPatterns(personality: DerivedTraits['personality']): GrammarPattern[] {
  const patterns: GrammarPattern[] = [];

  // Base patterns everyone has
  patterns.push({
    pattern: 'emotion-verb-object',
    weight: 0.3,
    contexts: ['request', 'observation'],
  });

  patterns.push({
    pattern: 'subject-feeling',
    weight: 0.4,
    contexts: ['emotion', 'greeting'],
  });

  // Personality-influenced patterns
  if (personality.energy > 60) {
    patterns.push({
      pattern: 'exclamation-action!',
      weight: 0.5,
      contexts: ['exclamation', 'greeting', 'affirmation'],
    });
  }

  if (personality.curiosity > 60) {
    patterns.push({
      pattern: 'question-word-object?',
      weight: 0.5,
      contexts: ['question', 'observation'],
    });
  }

  if (personality.affection > 60) {
    patterns.push({
      pattern: 'love-particle-subject~',
      weight: 0.6,
      contexts: ['affirmation', 'emotion', 'greeting'],
    });
  }

  if (personality.discipline > 60) {
    patterns.push({
      pattern: 'think-about-concept...',
      weight: 0.4,
      contexts: ['reflection', 'observation'],
    });
  }

  return patterns;
}

// ============================================================================
// Message Generation
// ============================================================================

/**
 * Generate a message based on the pet's current state and vocabulary
 */
export function generateMessage(
  vocabulary: LexiconVocabulary,
  vitals: Vitals,
  traits: DerivedTraits,
  context?: {
    recentInteraction?: string;
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
    triggerEvent?: string;
  }
): LexiconMessage {
  // Determine emotion based on vitals
  const emotion = determineEmotion(vitals, traits);

  // Determine intent based on context and emotion
  const intent = determineIntent(emotion, vitals, context);

  // Choose vocalization based on emotion and personality
  const vocalization = chooseVocalization(emotion, traits.personality);

  // Generate the native text
  const native = generateNativeText(vocabulary, emotion, intent);

  // Generate translation
  const translation = generateTranslation(emotion, intent, vitals, context);

  // Calculate clarity based on vitals
  const clarity = calculateClarity(vitals);

  return {
    native,
    translation,
    emotion,
    intent,
    vocalization,
    clarity,
    timestamp: Date.now(),
  };
}

function determineEmotion(vitals: Vitals, traits: DerivedTraits): EmotionCategory {
  // Check critical states first
  if (vitals.hunger > 80) return 'hunger';
  if (vitals.energy < 20) return 'fatigue';
  if (vitals.isSick) return 'sadness';

  // Calculate overall wellbeing
  const wellbeing = (
    (100 - vitals.hunger) +
    vitals.hygiene +
    vitals.mood +
    vitals.energy
  ) / 4;

  // Factor in personality
  const playfulNature = traits.personality.playfulness;
  const affectionateNature = traits.personality.affection;
  const curiousNature = traits.personality.curiosity;

  if (wellbeing > 75) {
    if (playfulNature > 70 && Math.random() > 0.5) return 'playful';
    if (affectionateNature > 70 && Math.random() > 0.5) return 'affection';
    if (Math.random() > 0.7) return 'excitement';
    return 'joy';
  }

  if (wellbeing > 50) {
    if (curiousNature > 70 && Math.random() > 0.5) return 'curiosity';
    if (Math.random() > 0.7) return 'proud';
    return 'calm';
  }

  if (wellbeing > 25) {
    if (Math.random() > 0.7) return 'anxious';
    return 'sadness';
  }

  return 'sadness';
}

function determineIntent(
  emotion: EmotionCategory,
  vitals: Vitals,
  context?: { recentInteraction?: string; timeOfDay?: string; triggerEvent?: string }
): MessageIntent {
  // Needs-based intents
  if (vitals.hunger > 70) return 'request';
  if (vitals.energy < 30) return 'emotion';

  // Context-based intents
  if (context?.recentInteraction === 'feed') return 'affirmation'; // grateful response
  if (context?.recentInteraction === 'play') return 'exclamation';
  if (context?.recentInteraction === 'pet') return 'affirmation';
  if (context?.triggerEvent === 'wake') return 'greeting';
  if (context?.triggerEvent === 'sleep') return 'farewell';

  // Time-based intents
  if (context?.timeOfDay === 'morning') return Math.random() > 0.5 ? 'greeting' : 'observation';
  if (context?.timeOfDay === 'night') return Math.random() > 0.5 ? 'dream' : 'reflection';

  // Emotion-based intents
  switch (emotion) {
    case 'curiosity': return 'question';
    case 'joy':
    case 'excitement': return 'exclamation';
    case 'affection': return 'emotion';
    case 'calm': return Math.random() > 0.5 ? 'reflection' : 'observation';
    case 'playful': return 'request';
    case 'proud': return 'exclamation';
    default: return 'emotion';
  }
}

function chooseVocalization(emotion: EmotionCategory, personality: DerivedTraits['personality']): VocalizationType {
  const vocalMap: Record<EmotionCategory, VocalizationType[]> = {
    joy: ['chirp', 'trill', 'giggle'],
    sadness: ['sigh', 'murmur', 'coo'],
    excitement: ['chirp', 'squeak', 'gasp'],
    curiosity: ['trill', 'hum', 'whistle'],
    affection: ['purr', 'coo', 'hum'],
    hunger: ['murmur', 'squeak', 'chirp'],
    fatigue: ['sigh', 'murmur', 'purr'],
    playful: ['giggle', 'chirp', 'squeak'],
    calm: ['purr', 'hum', 'chime'],
    anxious: ['squeak', 'gasp', 'murmur'],
    proud: ['trill', 'chime', 'chirp'],
    grateful: ['coo', 'purr', 'chime'],
  };

  const options = vocalMap[emotion];

  // Personality influences vocalization choice
  if (personality.energy > 70) {
    // High energy = prefer chirps, trills
    if (options.includes('chirp')) return 'chirp';
    if (options.includes('trill')) return 'trill';
  }

  if (personality.affection > 70) {
    // High affection = prefer purrs, coos
    if (options.includes('purr')) return 'purr';
    if (options.includes('coo')) return 'coo';
  }

  return options[Math.floor(Math.random() * options.length)];
}

function generateNativeText(
  vocabulary: LexiconVocabulary,
  emotion: EmotionCategory,
  intent: MessageIntent
): string {
  const words = vocabulary.words;
  const modifier = EMOTION_MODIFIERS[emotion];

  // Build message from vocabulary
  const parts: string[] = [];

  // Add emotion prefix
  parts.push(modifier.prefix);

  // Select words based on intent
  switch (intent) {
    case 'greeting':
      parts.push(words['hello']?.native || 'chi');
      parts.push(words['friend']?.native || 'na');
      break;
    case 'farewell':
      parts.push(words['bye']?.native || 'va');
      parts.push(words['friend']?.native || 'na');
      break;
    case 'request':
      parts.push(words['please']?.native || 'pe');
      parts.push(words['want']?.native || 'mo');
      if (emotion === 'hunger') parts.push(words['food']?.native || 'num');
      else if (emotion === 'playful') parts.push(words['play']?.native || 'pi');
      break;
    case 'observation':
      parts.push(words['see']?.native || 'mi');
      parts.push(words['pretty']?.native || 'ri');
      parts.push(words['star']?.native || 'shi');
      break;
    case 'emotion':
      parts.push(words['feel']?.native || 'ha');
      parts.push(words[emotion === 'joy' ? 'happy' : emotion === 'sadness' ? 'sad' : 'good']?.native || 'ki');
      break;
    case 'question':
      parts.push(words['think']?.native || 'om');
      parts.push('~?');
      break;
    case 'exclamation':
      parts.push(words['wow']?.native || 'ooh');
      parts.push(words['good']?.native || 'ki');
      break;
    case 'affirmation':
      parts.push(words['yes']?.native || 'ae');
      parts.push(words['happy']?.native || 'lu');
      break;
    case 'negation':
      parts.push(words['no']?.native || 'en');
      break;
    case 'reflection':
      parts.push(words['think']?.native || 'om');
      parts.push(words['memory']?.native || 're');
      break;
    case 'dream':
      parts.push(words['dream']?.native || 'yu');
      parts.push(words['star']?.native || 'shi');
      break;
    case 'memory':
      parts.push(words['memory']?.native || 're');
      parts.push(words['warm']?.native || 'wu');
      break;
    case 'prophecy':
      parts.push(words['see']?.native || 'mi');
      parts.push(words['dream']?.native || 'yu');
      parts.push(words['star']?.native || 'shi');
      break;
    default:
      parts.push(words['feel']?.native || 'ha');
  }

  // Add emotion suffix
  parts.push(modifier.suffix);

  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

function generateTranslation(
  emotion: EmotionCategory,
  intent: MessageIntent,
  vitals: Vitals,
  context?: { recentInteraction?: string; timeOfDay?: string; triggerEvent?: string }
): string {
  const translations: Record<MessageIntent, Record<EmotionCategory, string[]>> = {
    greeting: {
      joy: ["Hello, dear friend! I'm so happy to see you!", "Hi hi! What a wonderful day!"],
      sadness: ["Oh... hello there...", "Hi... I missed you..."],
      excitement: ["HELLO!! I've been waiting for you!", "Oh wow, you're here!"],
      curiosity: ["Hello? What's happening today?", "Hi! What are we doing?"],
      affection: ["Hello, my beloved friend~", "Hi there, precious one~"],
      hunger: ["Hi... I'm a bit hungry...", "Hello... food?"],
      fatigue: ["*yawn* Oh, hello...", "Hi... so sleepy..."],
      playful: ["Hiya! Let's play!", "Hello! Ready for fun?"],
      calm: ["Hello, friend. Peace be with you.", "Greetings. All is well."],
      anxious: ["H-hello...? Is everything okay?", "Oh! You startled me!"],
      proud: ["Greetings! Behold, I am magnificent!", "Hello! Look how great I am!"],
      grateful: ["Hello! Thank you for coming!", "Hi! I appreciate you so much!"],
    },
    farewell: {
      joy: ["Bye bye! See you soon!", "Until next time, dear friend!"],
      sadness: ["Goodbye... please come back...", "I'll miss you..."],
      excitement: ["Bye! Can't wait to see you again!", "See ya!"],
      curiosity: ["Farewell... I wonder when we'll meet again?", "Bye! Where are you going?"],
      affection: ["Goodbye, my dear~ Come back soon~", "Sweet dreams, beloved friend~"],
      hunger: ["Bye... don't forget to bring food...", "See you... hopefully with snacks..."],
      fatigue: ["*yawn* Goodnight...", "Bye... time to sleep..."],
      playful: ["Bye! This was fun!", "See ya later, alligator!"],
      calm: ["Farewell, friend. Take care.", "Until we meet again. Be well."],
      anxious: ["B-bye! Be safe!", "Please come back soon!"],
      proud: ["Farewell! Remember my greatness!", "Bye! Miss me!"],
      grateful: ["Thank you for visiting! Goodbye!", "Bye! You're the best!"],
    },
    request: {
      joy: ["May I please have something nice?", "Pretty please?"],
      sadness: ["Could I have... something?", "I need... help..."],
      excitement: ["Ooh ooh, can I have that?!", "Please please please!"],
      curiosity: ["What's that? Can I see?", "May I explore that?"],
      affection: ["Will you give me pets~?", "Cuddles please~?"],
      hunger: ["I'm hungry! Food please?", "Can I have a snack?"],
      fatigue: ["Can I rest now?", "Sleep... please..."],
      playful: ["Let's play! Please?", "Can we play a game?"],
      calm: ["May I request something?", "If you wouldn't mind..."],
      anxious: ["C-can I have...?", "Is it okay if...?"],
      proud: ["I deserve treats, don't I?", "Surely you'll give me what I want!"],
      grateful: ["Could I please... if it's not too much?", "I'd be so thankful if..."],
    },
    observation: {
      joy: ["Look at that! How wonderful!", "Everything is so beautiful today!"],
      sadness: ["I see... something sad...", "The world seems gray..."],
      excitement: ["WOW! Did you see that?!", "Look look look!"],
      curiosity: ["Hmm, what's that over there?", "I wonder what that is..."],
      affection: ["You look lovely today~", "I see someone precious~"],
      hunger: ["I see food... maybe?", "Is that... edible?"],
      fatigue: ["I see... my bed...", "*looking at nothing sleepily*"],
      playful: ["I see a toy!", "Look! Something fun!"],
      calm: ["I observe the world in peace.", "All is as it should be."],
      anxious: ["W-what's that?!", "I see something strange..."],
      proud: ["Behold my domain!", "Look at what I've done!"],
      grateful: ["I see all the blessings around me~", "How lucky I am to see this!"],
    },
    emotion: {
      joy: ["I feel so happy!", "My heart is full of joy!"],
      sadness: ["I feel sad...", "My heart hurts..."],
      excitement: ["I'm SO EXCITED!", "I can barely contain myself!"],
      curiosity: ["I feel curious about everything!", "I wonder and wonder..."],
      affection: ["I love you so much~", "My heart is warm with love~"],
      hunger: ["My tummy is rumbling...", "I feel so hungry..."],
      fatigue: ["I'm so tired...", "Can barely keep my eyes open..."],
      playful: ["I feel like playing!", "So much energy!"],
      calm: ["I feel at peace.", "Serenity fills me."],
      anxious: ["I feel nervous...", "Something feels off..."],
      proud: ["I feel magnificent!", "Pride fills my heart!"],
      grateful: ["I feel so thankful!", "Gratitude overflows!"],
    },
    question: {
      joy: ["What makes you happy?", "Isn't today wonderful?"],
      sadness: ["Why do things hurt?", "When will it get better?"],
      excitement: ["What's happening?! Tell me!", "Can you believe it?!"],
      curiosity: ["What is that?", "How does this work?"],
      affection: ["Do you love me?", "Will you stay with me?"],
      hunger: ["Where is the food?", "When is dinner?"],
      fatigue: ["Is it bedtime yet?", "Can I sleep?"],
      playful: ["Want to play?", "What game should we play?"],
      calm: ["What brings you here?", "How are you today?"],
      anxious: ["Is everything okay?!", "What's wrong?!"],
      proud: ["Am I not amazing?", "Don't you agree I'm the best?"],
      grateful: ["How can I thank you?", "What did I do to deserve this?"],
    },
    response: {
      joy: ["Yes! Absolutely!", "Of course, happily!"],
      sadness: ["If you say so...", "I suppose..."],
      excitement: ["YES! YES! YES!", "Definitely!!"],
      curiosity: ["Maybe... I'm not sure?", "Let me think..."],
      affection: ["Anything for you~", "Yes, my dear~"],
      hunger: ["Okay... but can we eat first?", "Sure... food?"],
      fatigue: ["Mmhmm... *nods sleepily*", "Yes... zzz..."],
      playful: ["Sure! Let's go!", "Okay! This'll be fun!"],
      calm: ["I understand.", "Very well."],
      anxious: ["O-okay...!", "If you're sure..."],
      proud: ["Of course, as expected!", "Naturally!"],
      grateful: ["Thank you! Yes!", "I'm honored, yes!"],
    },
    exclamation: {
      joy: ["Yay! This is amazing!", "Hooray!"],
      sadness: ["Oh no...", "Alas..."],
      excitement: ["WOW!!! INCREDIBLE!!!", "OH MY GOODNESS!"],
      curiosity: ["Ooh! Interesting!", "Fascinating!"],
      affection: ["Aww~! So sweet!", "How precious~!"],
      hunger: ["FOOD!", "Finally!"],
      fatigue: ["*yaaaawn*", "So... tired..."],
      playful: ["Wheee!", "Woohoo!"],
      calm: ["Ah, I see.", "Indeed."],
      anxious: ["EEK!", "Oh no oh no!"],
      proud: ["Behold!", "Witness my glory!"],
      grateful: ["Thank you so much!", "How wonderful!"],
    },
    affirmation: {
      joy: ["Yes, this makes me happy!", "Absolutely wonderful!"],
      sadness: ["Yes... I agree...", "That's true..."],
      excitement: ["YES!!! TOTALLY!!!", "ABSOLUTELY!!!"],
      curiosity: ["Yes, that's interesting!", "Indeed, I want to know more!"],
      affection: ["Yes, I love this~", "Absolutely, my dear~"],
      hunger: ["Yes! Especially if there's food!", "Agreed! Now... food?"],
      fatigue: ["Yes... *sleepy nod*", "Mmhmm..."],
      playful: ["Yeah! Let's do it!", "Totally! Fun!"],
      calm: ["Yes, I agree.", "That is correct."],
      anxious: ["Y-yes! Probably!", "I think so...!"],
      proud: ["Yes, obviously!", "Of course, I knew that!"],
      grateful: ["Yes! Thank you!", "Absolutely, I'm so grateful!"],
    },
    negation: {
      joy: ["No, but that's okay!", "Nope~ but it's fine!"],
      sadness: ["No... I'm sorry...", "I can't..."],
      excitement: ["NO WAY!", "Nope nope nope!"],
      curiosity: ["No? But why not?", "No, but I wonder..."],
      affection: ["No, my dear~ not right now~", "Sorry, not this time~"],
      hunger: ["No... unless there's food?", "No... too hungry to think..."],
      fatigue: ["No... too tired...", "Can't... sleepy..."],
      playful: ["Nope! Try again!", "No~ catch me if you can!"],
      calm: ["I respectfully decline.", "No, thank you."],
      anxious: ["N-no! That's scary!", "Please no..."],
      proud: ["No, I deserve better!", "That's beneath me!"],
      grateful: ["No, but thank you for asking!", "No, but I appreciate it!"],
    },
    reflection: {
      joy: ["I'm thinking about happy memories~", "Life is beautiful..."],
      sadness: ["I remember when times were better...", "Why do things change..."],
      excitement: ["I can't stop thinking about it!", "So many exciting thoughts!"],
      curiosity: ["I wonder about the mysteries of life...", "What lies beyond...?"],
      affection: ["I'm thinking about you~", "My heart is full of warmth~"],
      hunger: ["Thinking about food...", "I dream of delicious things..."],
      fatigue: ["Thoughts drifting... sleepy...", "Mind wandering to dreams..."],
      playful: ["Thinking of fun times!", "Remember when we played?"],
      calm: ["Contemplating existence peacefully...", "Mind at rest..."],
      anxious: ["Can't stop worrying...", "What if something bad happens..."],
      proud: ["Reflecting on my achievements!", "I've done so much!"],
      grateful: ["Counting my blessings...", "So much to be thankful for..."],
    },
    dream: {
      joy: ["In my dreams, everything sparkles~", "I dreamed of endless happiness!"],
      sadness: ["I had a melancholy dream...", "Dreams of longing..."],
      excitement: ["I dreamed of adventures!", "Such vivid dreams!"],
      curiosity: ["I dreamed of unknown worlds...", "What do dreams mean...?"],
      affection: ["I dreamed of us together~", "Sweet dreams of love~"],
      hunger: ["I dreamed of a feast...", "Mountains of food in my dreams..."],
      fatigue: ["Dreams within dreams...", "Floating in dreamland..."],
      playful: ["I dreamed of games and fun!", "Playful dreams!"],
      calm: ["Peaceful dreams of starlight...", "Serene visions..."],
      anxious: ["I had a strange dream...", "Unsettling visions..."],
      proud: ["I dreamed I was royalty!", "Glorious dreams of triumph!"],
      grateful: ["I dreamed of all my blessings~", "Thankful even in dreams~"],
    },
    memory: {
      joy: ["Remember our happy times?", "Such wonderful memories!"],
      sadness: ["I miss how things were...", "Bittersweet memories..."],
      excitement: ["Remember that amazing thing?!", "Those times were wild!"],
      curiosity: ["I remember wondering about that...", "When did that happen...?"],
      affection: ["I remember our first meeting~", "Precious memories of us~"],
      hunger: ["I remember that delicious meal...", "Those treats were amazing..."],
      fatigue: ["I remember napping peacefully...", "Good sleep memories..."],
      playful: ["Remember when we played all day?", "Fun times!"],
      calm: ["I recall peaceful moments...", "Tranquil memories..."],
      anxious: ["I remember that scary time...", "Some memories are hard..."],
      proud: ["Remember my great achievement?", "Those were my glory days!"],
      grateful: ["I remember your kindness...", "Thank you for those times..."],
    },
    prophecy: {
      joy: ["I sense great happiness ahead!", "The future looks bright!"],
      sadness: ["I feel a storm coming...", "Troubled times ahead..."],
      excitement: ["Something amazing is coming!", "The future holds wonders!"],
      curiosity: ["What mysteries await...?", "The future is unknown..."],
      affection: ["I sense we'll be together forever~", "Our bond grows stronger~"],
      hunger: ["I foresee... many snacks!", "Food is in our future!"],
      fatigue: ["I need rest for what's to come...", "Sleep now, adventure later..."],
      playful: ["Fun times are coming!", "Get ready to play!"],
      calm: ["All will be well...", "Peace awaits us..."],
      anxious: ["I sense danger...", "Be careful..."],
      proud: ["Greatness is my destiny!", "I will achieve more!"],
      grateful: ["The future holds blessings~", "More to be thankful for~"],
    },
  };

  const intentTranslations = translations[intent];
  const emotionTranslations = intentTranslations?.[emotion] || ["..."];

  // Add context-specific modifications
  let translation = emotionTranslations[Math.floor(Math.random() * emotionTranslations.length)];

  if (context?.recentInteraction) {
    switch (context.recentInteraction) {
      case 'feed':
        translation = translation.replace(/!/g, '! That food was great!').slice(0, 60);
        break;
      case 'play':
        translation += ' That was so fun!';
        break;
      case 'clean':
        translation += ' I feel so fresh!';
        break;
    }
  }

  return translation;
}

function calculateClarity(vitals: Vitals): number {
  // Clarity is based on energy and overall wellbeing
  const energyFactor = vitals.energy / 100;
  const wellbeingFactor = (
    (100 - vitals.hunger) +
    vitals.hygiene +
    vitals.mood +
    vitals.energy
  ) / 400;

  // Sickness reduces clarity
  const sicknessPenalty = vitals.isSick ? 0.3 : 0;

  return Math.max(0.2, Math.min(1, (energyFactor * 0.4 + wellbeingFactor * 0.6) - sicknessPenalty));
}

// ============================================================================
// Default export
// ============================================================================

export default {
  generateVocabulary,
  generateMessage,
};
