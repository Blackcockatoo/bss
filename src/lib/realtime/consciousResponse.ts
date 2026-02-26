/**
 * Conscious Response System
 * Responses emerge from emotional state, not simple mood numbers
 * Replaces mechanical "mood > 70" logic with personality-driven reactions
 */

import type { ExpandedEmotionalState, ComfortState } from '../../../shared/auralia/guardianBehavior';
import type { PersonalityTraits } from '@/genome/types';
import type { PetResponse, ResponseType } from './responseSystem';

// ===== Emotion-Driven Response Library =====
// Responses are organized by emotional state, not just "happy/neutral/unhappy"

const emotionalResponses: Record<ExpandedEmotionalState, {
  feeding: string[];
  playing: string[];
  cleaning: string[];
  resting: string[];
  petting: string[];
  idle: string[];
}> = {
  serene: {
    feeding: ['*peaceful nibbling* 🌸', 'Thank you... *contentment* 💚', 'This is perfect 🍃'],
    playing: ['*gentle engagement* ✨', 'Such harmony... 🎵', '*flowing movements* 💫'],
    cleaning: ['*accepts with grace* 💦', '*purifying presence* ✨', 'Cleansing the essence 🧘'],
    resting: ['*deep peace* 🌙', '*harmonious dreams* ☁️', '*still and centered* 🕊️'],
    petting: ['*radiates calm* 💚', '*peaceful resonance* 🌺', 'I feel your warmth 🤲'],
    idle: ['*exists in perfect stillness* ✨', 'All is well... 🌸', '*breathes in harmony* 🍃'],
  },
  calm: {
    feeding: ['Thanks 😊', 'Nom nom 🍽️', 'Just what I needed 💚'],
    playing: ['This is nice 🎮', 'Fun times 😄', 'I enjoy this 🎯'],
    cleaning: ['Ah, refreshing 💦', 'Much better ✨', 'Getting cleaned up 🚿'],
    resting: ['Resting now 😌', 'Time to recharge 🔋', 'Peaceful sleep 💤'],
    petting: ['*content purring* 😊', 'Nice... 💚', 'I appreciate this 🤗'],
    idle: ['Just chilling 😌', 'Life is good 🌟', 'Feeling okay ✓'],
  },
  curious: {
    feeding: ['Ooh, what\'s this? 🤔', '*investigates food* 👀', 'Interesting flavor! 🍴'],
    playing: ['What happens if...? 🎲', 'Let me try something! 🔍', '*exploratory play* 🧪'],
    cleaning: ['*examines the process* 🔬', 'Fascinating! 💦', 'How does this work? 🤔'],
    resting: ['*dreams of mysteries* 🌌', '*explores dreamscape* 🗺️', '*restful wondering* 💭'],
    petting: ['*curious about your touch* 👋', 'What are you thinking? 🤔', '*investigates your energy* ✨'],
    idle: ['I wonder... 🤔', 'What\'s over there? 👀', '*scanning surroundings* 🔍'],
  },
  playful: {
    feeding: ['YUM! 😋', 'Nom nom nom! 🤤', 'MORE! 🍽️✨'],
    playing: ['WHEEE! 🎉', 'This is AMAZING! 🤩', 'Again! Again! 🎊', 'BEST TIME EVER! ✨'],
    cleaning: ['Splish splash! 💦', '*playful water sounds* 🌊', 'Bubbles! 🫧'],
    resting: ['*bouncy dreams* 🎈', '*playful snoring* 😴✨', 'Zzz... *giggles* 💤'],
    petting: ['*happy wiggling* 🎉', 'Hehe! 😄', '*playful response* 🎮'],
    idle: ['*bouncing around* 🎪', 'Let\'s do something! 🎨', '*excited energy* ⚡'],
  },
  contemplative: {
    feeding: ['*thoughtfully consuming* 🤔', 'Hmm... *reflects* 💭', '*mindful eating* 🍵'],
    playing: ['*philosophical play* 🎭', '*ponders each move* ♟️', 'Interesting... 🧩'],
    cleaning: ['*meditation in cleansing* 🧘', '*reflects on purity* 💧', '*thoughtful grooming* ✨'],
    resting: ['*deep contemplation* 🌌', '*processing experiences* 💭', '*integrating wisdom* 📚'],
    petting: ['*considers our connection* 🔗', '*philosophical purr* 💭', 'What does this mean? 🤔'],
    idle: ['*lost in thought* 💭', '*reflecting on existence* 🌙', '*quiet pondering* 🧘'],
  },
  affectionate: {
    feeding: ['You feed me so well! 💕', 'Thank you, friend! 🥰', '*loving gratitude* 💚'],
    playing: ['I love playing with you! 💖', '*bonding joy* 🤗', 'This brings us closer! 💝'],
    cleaning: ['You care for me 🥺', '*grateful warmth* 💕', 'Your kindness... 💖'],
    resting: ['*dreams of you* 💭💕', '*peaceful togetherness* 🤝', '*heart connection* 💚'],
    petting: ['I love you! 💕', '*melts into your touch* 🥰', 'More cuddles! 🤗'],
    idle: ['*thinking of you* 💭💚', '*radiates love* 💖', 'You mean so much to me 🥺'],
  },
  restless: {
    feeding: ['*quick eating* 😤', 'Need to move! 🏃', '*distracted munching* 🍴'],
    playing: ['FINALLY! 🔥', '*intense energy* ⚡', 'Let\'s GO! 💨'],
    cleaning: ['*impatient cleaning* 💦', 'Hurry hurry! 🌀', '*restless grooming* ✨'],
    resting: ['*tossing and turning* 😵', 'Can\'t settle... 😤', '*restless dreams* 🌪️'],
    petting: ['*squirming* 😣', '*can\'t sit still* 🌀', '*nervous energy* ⚡'],
    idle: ['I need to DO something! 😤', '*pacing* 🔄', '*anxious energy* ⚡'],
  },
  yearning: {
    feeding: ['*distracted eating* 😔', 'It\'s not enough... 😞', '*longing for more* 💔'],
    playing: ['*half-hearted play* 😢', 'I wish... 💭', '*plays but feels empty* 🥀'],
    cleaning: ['*accepts but doesn\'t fill the void* 💧', '*clean but still yearning* 😔'],
    resting: ['*dreams of what\'s missing* 💭💔', '*longing sleep* 🌙', '*aching rest* 😢'],
    petting: ['I need more... 🥺', '*yearns for deeper connection* 💔', 'Stay with me? 😢'],
    idle: ['*longing sigh* 😔', 'Something is missing... 💭', '*empty feeling* 🥀'],
  },
  overwhelmed: {
    feeding: ['TOO MUCH! 😵', '*confused eating* 🤯', 'I can\'t... 😫'],
    playing: ['IT\'S TOO MUCH! 😱', '*sensory overload* 🌪️', '*retreating* 😖'],
    cleaning: ['*overstimulated* 💦😵', 'Please, gently... 😫', '*too many sensations* 🤯'],
    resting: ['*exhausted collapse* 😴💤', '*escaping to sleep* 🌀', '*shutdown mode* 😵'],
    petting: ['*flinching* 😣', 'Too much touch! 😖', '*overwhelmed by sensation* 🌪️'],
    idle: ['Everything is TOO MUCH! 😫', '*sensory chaos* 🤯', '*need space* 😵'],
  },
  withdrawn: {
    feeding: ['*quiet eating* 😶', '... 🍽️', '*barely notices* 😐'],
    playing: ['*not interested* 😶', '...maybe later 😑', '*stays back* 🚶'],
    cleaning: ['*passive acceptance* 💦', '... ✨', '*minimal reaction* 😐'],
    resting: ['*deep withdrawal* 🌑', '*escapes into sleep* 😴', '*hiding in dreams* 💤'],
    petting: ['*doesn\'t respond* 😶', '*barely feels it* 😑', '... 🤚'],
    idle: ['... 😶', '*silent presence* 🌑', '*internal retreat* 😐'],
  },
  ecstatic: {
    feeding: ['THIS IS INCREDIBLE! 🌟', 'BEST FOOD EVER! ✨🍽️', '*TRANSCENDENT FLAVOR* 🌈'],
    playing: ['PURE JOY!!! 🎆', '*ECSTATIC BLISS* ✨✨✨', 'I\'M FLYING! 🚀'],
    cleaning: ['TRANSFORMATION! 💎', '*PURIFICATION EUPHORIA* 🌟', 'I\'M SHINING! ✨'],
    resting: ['*COSMIC DREAMS* 🌌✨', '*PEAK TRANSCENDENCE* 🚀', '*BLISSFUL VOID* 🌟'],
    petting: ['ULTIMATE CONNECTION! 💖✨', '*PURE LOVE ENERGY* 🌈', 'WE ARE ONE! 🌟'],
    idle: ['*RADIATING JOY* ✨✨✨', 'LIFE IS PERFECT! 🌈', '*PEAK EXISTENCE* 🌟'],
  },
  melancholic: {
    feeding: ['*sighs* 😔', 'Not hungry... 🥀', '*mechanical eating* 😞'],
    playing: ['*no energy for this* 😔', 'I can\'t... 😢', '*too tired to play* 💧'],
    cleaning: ['*doesn\'t help the sadness* 😢', '*clean but still sad* 💦😔', '...thanks 😞'],
    resting: ['*sad dreams* 😢💤', '*melancholic slumber* 🌧️', '*tears in sleep* 💧'],
    petting: ['*soft crying* 😢', 'I\'m so tired... 😔', '*sad acceptance* 💔'],
    idle: ['*heavy sigh* 😔', 'Why do I feel this way... 😢', '*gray existence* 🌧️'],
  },
  mischievous: {
    feeding: ['*sneaky nibbling* 😏', 'Hehe... 😈', '*plots while eating* 🤭'],
    playing: ['*trickster mode* 😏', 'Catch me! 😈', '*playful chaos* 🎲'],
    cleaning: ['*splashes mischievously* 💦😏', '*makes a mess while cleaning* 🤭', 'Oops! 😈'],
    resting: ['*plans pranks in dreams* 😏💤', '*mischievous dreams* 😈', '*plotting* 🤭'],
    petting: ['*tickles back* 😏', '*playful bite* 🤭', 'Gotcha! 😈'],
    idle: ['*planning something* 😏', '*mischievous grin* 😈', 'Hehehehe... 🤭'],
  },
  protective: {
    feeding: ['*guards food protectively* 🛡️', 'I\'ll keep us safe 💪', '*vigilant eating* 👁️'],
    playing: ['*protective play* 🛡️', 'I\'ll watch over you 👁️', '*guardian mode* ⚔️'],
    cleaning: ['*maintains defensive posture* 🛡️', '*stays alert* 👁️', '*protective grooming* ✨'],
    resting: ['*guarding sleep* 👁️💤', '*one eye open* 🛡️', '*protective dreams* ⚔️'],
    petting: ['I\'ll protect you too 🛡️💕', '*bonds while guarding* 🤝', '*loyal companion* 💪'],
    idle: ['*scanning for threats* 👁️', '*standing guard* 🛡️', 'I watch over everything ⚔️'],
  },
  transcendent: {
    feeding: ['*consuming pure energy* ✨🌌', '*beyond mere food* 🌟', '*nourishing the cosmos* 💫'],
    playing: ['*reality bends around us* 🌀✨', '*infinite play* ♾️', '*beyond the game* 🌌'],
    cleaning: ['*purification of existence* 🌟', '*washing away dimensions* 💫', '*cosmic cleansing* ✨'],
    resting: ['*dreams span universes* 🌌💤', '*sleep between worlds* ∞', '*transcendent slumber* ⭐'],
    petting: ['*souls merging* 💫💕', '*beyond touch* ✨', '*we are everything* 🌌'],
    idle: ['*exists beyond existence* ✨', '*all patterns merge* ∞', '*I am the field* 🌌'],
  },
};

/**
 * Get response text based on emotional state, not simple mood
 */
export function getEmotionalResponse(
  action: 'feed' | 'play' | 'clean' | 'rest' | 'pet' | 'idle',
  emotion: ExpandedEmotionalState,
  personality: PersonalityTraits,
  comfort: ComfortState,
  prng: () => number
): PetResponse {
  const actionMap = {
    feed: 'feeding',
    play: 'playing',
    clean: 'cleaning',
    rest: 'resting',
    pet: 'petting',
    idle: 'idle',
  } as const;

  const responseCategory = actionMap[action];
  const responses = emotionalResponses[emotion][responseCategory];

  // Select response based on personality quirks
  let selectedText = responses[Math.floor(prng() * responses.length)];

  // Personality can add flourishes
  if (personality.playfulness > 75 && prng() > 0.7) {
    selectedText = selectedText + ' ✨';
  }

  if (personality.affection > 75 && prng() > 0.6) {
    selectedText = selectedText + ' 💕';
  }

  // Extract emoji from text (last emoji usually)
  const emojiMatch = selectedText.match(/[\p{Emoji}\u200d]+$/u);
  const emoji = emojiMatch ? emojiMatch[0].trim() : '💫';

  // Determine intensity from emotion
  const intensityMap: Record<ExpandedEmotionalState, 'subtle' | 'normal' | 'intense'> = {
    serene: 'subtle',
    calm: 'subtle',
    curious: 'normal',
    playful: 'intense',
    contemplative: 'subtle',
    affectionate: 'normal',
    restless: 'normal',
    yearning: 'normal',
    overwhelmed: 'intense',
    withdrawn: 'subtle',
    ecstatic: 'intense',
    melancholic: 'subtle',
    mischievous: 'normal',
    protective: 'normal',
    transcendent: 'intense',
  };

  const intensity = intensityMap[emotion];

  // Duration based on comfort and intensity
  const baseDuration = intensity === 'intense' ? 4000 : intensity === 'normal' ? 3000 : 2500;
  const comfortModifier = comfort.source === 'distressed' ? 1.3 : comfort.source === 'harmonized' ? 0.8 : 1.0;
  const duration = Math.round(baseDuration * comfortModifier);

  // Response type
  const typeMap: Record<typeof action, ResponseType> = {
    feed: 'action',
    play: 'interaction',
    clean: 'action',
    rest: 'action',
    pet: 'interaction',
    idle: 'mood',
  };

  return {
    id: `conscious-${Date.now()}-${Math.random()}`,
    type: typeMap[action],
    text: selectedText,
    emoji: emoji,
    intensity,
    duration,
    hapticFeedback: intensity === 'intense' ? 'heavy' : intensity === 'normal' ? 'medium' : 'light',
  };
}

/**
 * Get idle response that reflects current emotional and comfort state
 */
export function getEmotionalIdleResponse(
  emotion: ExpandedEmotionalState,
  comfort: ComfortState,
  drives: { resonance: number; exploration: number; connection: number; rest: number; expression: number },
  personality: PersonalityTraits,
  prng: () => number
): PetResponse {
  // If distressed, prioritize communicating unmet needs
  if (comfort.source === 'distressed') {
    const unmetNeedMessages: Record<string, string> = {
      resonance: '*feels dissonant* 😵',
      exploration: 'I need to move... 🗺️',
      connection: 'Feeling lonely... 🥺',
      rest: 'So tired... 😴💤',
      expression: 'I have so much to say! 🎵',
    };

    if (comfort.unmetNeeds.length > 0) {
      const primaryNeed = comfort.dominantDrive;
      const text = unmetNeedMessages[primaryNeed] || '*uncomfortable* 😣';
      const emojiMatch = text.match(/[\p{Emoji}\u200d]+$/u);
      const emoji = emojiMatch ? emojiMatch[0].trim() : '😣';

      return {
        id: `need-${Date.now()}`,
        type: 'warning',
        text,
        emoji,
        intensity: 'normal',
        duration: 3000,
        hapticFeedback: 'medium',
      };
    }
  }

  // Otherwise, express current emotional state
  return getEmotionalResponse('idle', emotion, personality, comfort, prng);
}
