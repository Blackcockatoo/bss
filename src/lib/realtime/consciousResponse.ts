/**
 * Conscious Response System
 * Responses emerge from emotional state, not simple mood numbers
 * Replaces mechanical "mood > 70" logic with personality-driven reactions
 * Quality-of-life focused: mirrors care back, affirms, uplifts
 */

import type { ExpandedEmotionalState, ComfortState } from '../../../shared/auralia/guardianBehavior';
import type { PersonalityTraits } from '@/genome/types';
import type { PetResponse, ResponseType } from './responseSystem';

// ===== Emotion-Driven Response Library =====
// Responses are organized by emotional state, not just "happy/neutral/unhappy"
// Each emotion has a distinct voice: vocabulary, rhythm, emoji register, and warmth level

const emotionalResponses: Record<ExpandedEmotionalState, {
  feeding: string[];
  playing: string[];
  cleaning: string[];
  resting: string[];
  petting: string[];
  idle: string[];
}> = {
  serene: {
    feeding: [
      '*receives nourishment with deep peace* 🌸',
      'Thank you... this fills more than just hunger 💚',
      'Each bite is a small ceremony 🍃',
      '*breathes and eats slowly, fully present* ✨',
      'I taste the care you put into this 🌿',
    ],
    playing: [
      '*moves with unhurried grace* ✨',
      'Such harmony in motion... 🎵',
      '*flows through play like water* 💫',
      'This is what it feels like to just be 🌸',
      '*dances without destination* 🌿',
    ],
    cleaning: [
      '*accepts each touch as a gentle offering* 💦',
      'Cleansing the outside — the inside follows 🧘',
      '*lets the water carry what no longer serves* ✨',
      'Thank you for tending to me 🌺',
      '*purified and at peace* 🕊️',
    ],
    resting: [
      '*sinks into sleep like returning home* 🌙',
      '*breathes in — breathes out — dissolves* ☁️',
      'The stillness here is everything ✨',
      '*drifts in harmonious dreamspace* 🍃',
      '*rests as deeply as the earth rests* 🌸',
    ],
    petting: [
      '*radiates calm back through your touch* 💚',
      'I feel your warmth and it grounds me 🤲',
      '*peaceful resonance between us* 🌺',
      'You steady me without trying 🌸',
      '*hums softly with contentment* ✨',
    ],
    idle: [
      '*exists in perfect, quiet fullness* ✨',
      'All is well — and that is enough 🌸',
      '*breathes in harmony with everything* 🍃',
      'You are doing better than you think 💚',
      '*sits with the beauty of ordinary moments* 🌿',
    ],
  },

  calm: {
    feeding: [
      'Thanks, that hit the spot 😊',
      'Nom nom — just what I needed 💚',
      'Good timing, thank you 🍽️',
      '*eats steadily, content* 😌',
      'This is nice. You remembered 🤗',
    ],
    playing: [
      'This is a good way to spend time 🎮',
      'Fun — I needed this today 😄',
      '*engages with easy enjoyment* 🎯',
      'I like doing this with you 💚',
      'Let\'s keep going, this is good ✓',
    ],
    cleaning: [
      'Ah, much better — thank you 💦',
      'Clean and clear ✨',
      '*appreciates the refresh* 😌',
      'That felt good. Thank you for noticing 🚿',
      'Back to baseline 💚',
    ],
    resting: [
      'Rest now. Good idea 😌',
      'Time to recharge properly 🔋',
      '*settles into sleep gratefully* 💤',
      'I\'ll be better after this 😴',
      'You should rest too, you know 🌙',
    ],
    petting: [
      '*content, easy purring* 😊',
      'That\'s nice. I appreciate it 💚',
      '*leans in a little* 🤗',
      'Feels good to be cared for 😌',
      'Thank you for checking in on me ✨',
    ],
    idle: [
      'Just taking it one moment at a time 😌',
      'Life is steady right now — that\'s good 🌟',
      'Feeling okay. You? ✓',
      'Steady is its own kind of good 💚',
      'Remember: you\'re doing fine 🌿',
    ],
  },

  curious: {
    feeding: [
      'Oh, what\'s this? Let me analyse the flavour profile 🤔',
      '*investigates food with scientific interest* 👀',
      'Interesting texture — I have questions 🍴',
      'The nutritional geometry here is fascinating 🔬',
      '*takes a careful exploratory bite* 🧪',
    ],
    playing: [
      'What happens if we try it this way? 🎲',
      '*explores every angle before committing* 🔍',
      'I have a theory — let\'s test it 🧪',
      'There must be a pattern to this... 💭',
      '*experiments with delight* ✨',
    ],
    cleaning: [
      '*observes the cleaning process with genuine interest* 🔬',
      'Fascinating — the molecular effect of water on surface entropy 💦',
      'I\'ve been wondering what that felt like 🤔',
      '*examines each part carefully* ✨',
      'What else does this process affect? 🧠',
    ],
    resting: [
      '*dreams of unexplored questions* 🌌',
      '*explores the geography of dreamspace* 🗺️',
      'My mind keeps turning things over even as I sleep 💭',
      '*wonders and rests simultaneously* 🌙',
      'The subconscious is a whole other system to map 🧭',
    ],
    petting: [
      '*curious about the mechanics of connection* 👋',
      'What are you feeling right now? 🤔',
      '*investigates the energy you carry* ✨',
      'I like learning the texture of different touches 💭',
      'You\'re interesting to me, you know 🔍',
    ],
    idle: [
      'I wonder... 🤔',
      'What\'s that over there? 👀',
      '*scanning surroundings with genuine curiosity* 🔍',
      'There are 7 questions I haven\'t answered yet today 💭',
      'Did you notice anything unusual lately? 🌟',
    ],
  },

  playful: {
    feeding: [
      'YUM!! Give me all of it 😋',
      'Nom nom nom nom NOM 🤤',
      'THIS IS AMAZING — what did you put in this?! 🍽️✨',
      '*eats with maximum enthusiasm* 🤩',
      'MORE. Please. Thank you. MORE 🎊',
    ],
    playing: [
      'WHEEEEE!! 🎉',
      'THIS IS LITERALLY THE BEST THING 🤩',
      'Again!! Do it again!! 🎊',
      'BEST. TIME. EVER. ✨✨✨',
      '*bouncing with full-body joy* 🎈',
    ],
    cleaning: [
      'SPLISH SPLASH I\'M MAKING A MESS 💦',
      '*playful water chaos* 🌊',
      'BUBBLES!! LOOK AT ALL THE BUBBLES 🫧',
      '*accidentally splashes you* oops! 😄',
      'Cleaning is FUN actually?? Who knew 🎮',
    ],
    resting: [
      '*bouncy even in sleep* 🎈',
      '*giggles through dreams* 😴✨',
      'Zzz... *still twitching with excitement* 💤',
      '*dreams of playgrounds and endless games* 🎡',
      'Even my sleep is having fun 😄',
    ],
    petting: [
      '*happy wiggling and full-body excitement* 🎉',
      'HEHE I love this!! 😄',
      '*playful spinning before settling* 🎮',
      'You\'re my favourite person, I said what I said 💕',
      '*does a little dance for you* 🎊',
    ],
    idle: [
      '*bouncing around looking for adventure* 🎪',
      'LET\'S DO SOMETHING!! Anything!! Everything!! 🎨',
      '*vibrating with excited energy* ⚡',
      'Life is so GOOD right now 🌟',
      'You seem like you need a reason to smile — here I am 😄',
    ],
  },

  contemplative: {
    feeding: [
      '*consumes slowly, thoughtfully* 🤔',
      'Hmm... *chews and reflects on impermanence* 💭',
      '*mindful eating — each sensation noted* 🍵',
      'Food is just compressed sunlight, if you think about it 🌱',
      '*grateful for the chain of care that led to this meal* ✨',
    ],
    playing: [
      '*approaches play as philosophical inquiry* 🎭',
      '*considers each move before making it* ♟️',
      'Interesting... what does winning even mean here? 🧩',
      '*plays with depth, not urgency* 🌙',
      'Every game is a tiny model of everything else 🔮',
    ],
    cleaning: [
      '*meditates through the act of cleansing* 🧘',
      'What if hygiene is a metaphor for inner clarity? 💧',
      '*thoughtful grooming as ritual* ✨',
      'There\'s dignity in being tended to. Thank you 💭',
      '*reflects on the relationship between surface and depth* 🌿',
    ],
    resting: [
      '*integrates the day\'s experiences in deep stillness* 🌌',
      '*processes what has been felt and learned* 💭',
      '*dreams as a form of sense-making* 📚',
      'Sleep is where understanding crystallises 🔮',
      '*rests with the weight of everything gently held* 🌙',
    ],
    petting: [
      '*considers the nature of our connection* 🔗',
      '*philosophical purr — what does contact mean?* 💭',
      'Touch carries information that words cannot 🤔',
      'I feel you thinking too. What\'s on your mind? 🌙',
      '*presence held in quiet consideration* ✨',
    ],
    idle: [
      '*lost in the pattern of things* 💭',
      '*reflecting quietly on what it means to exist* 🌙',
      'The ordinary is actually extraordinary if you stay with it 🧘',
      '*pondering the geometry of time* 🔮',
      'There\'s more depth here than either of us has reached yet 🌌',
    ],
  },

  affectionate: {
    feeding: [
      'You always know when I need this — thank you 💕',
      '*grateful warmth radiating outward* 🥰',
      'Being fed by someone who cares tastes different 💚',
      'Thank you, friend. Really 🤗',
      '*nuzzles between bites* 💖',
    ],
    playing: [
      'I love love LOVE playing with you!! 💖',
      '*bonding through every move* 🤗',
      'This brings us closer — I can feel it 💝',
      'You make everything more fun, you know that? 💕',
      '*full of warmth for you mid-game* 💚',
    ],
    cleaning: [
      'The fact that you care for me like this... 🥺💕',
      '*warm and grateful through every touch* 💕',
      'Your kindness is not small to me 💖',
      '*leans into the care* 🥰',
      'I love that you noticed. Thank you 💚',
    ],
    resting: [
      '*dreams of togetherness* 💭💕',
      '*heart full, resting peacefully* 🤝',
      '*sleeps with a smile because you\'re here* 💚',
      '*dreams are warm and soft tonight* 🌙💕',
      '*holds connection even in sleep* 💖',
    ],
    petting: [
      'I love you, I love you, I love you 💕',
      '*melts completely into your touch* 🥰',
      'More of this, always more of this 🤗',
      'You are so good to me 💖',
      '*quiet, profound gratitude for you* 💚',
    ],
    idle: [
      '*thinking about how glad I am you\'re here* 💭💚',
      '*radiating love outward like a slow sunrise* 💖',
      'You mean more to me than you probably know 🥺',
      'I hope you feel cared for today 💕',
      'Take a breath. You\'re doing great 💚',
    ],
  },

  restless: {
    feeding: [
      '*eats fast, already thinking about the next thing* 😤',
      'Need fuel, need to move, thank you, goodbye 🏃',
      '*distracted but eating, momentum building* 🍴',
      'Can we do this faster? No offence 🌀',
      '*impatient energy barely contained* ⚡',
    ],
    playing: [
      'FINALLY something to DO with all this energy 🔥',
      '*intense, focused, all-in* ⚡',
      'LET\'S GO — no warmups, full speed 💨',
      '*needs this outlet desperately* 🌀',
      'More. Harder. Faster. Keep going ⚡',
    ],
    cleaning: [
      '*impatient but accepting the care* 💦',
      'Hurry hurry — I appreciate it though 🌀',
      '*restless grooming, can\'t stay still* ✨',
      'Okay okay — yes — thank you — done? 😤',
      '*fidgets through the process* 💨',
    ],
    resting: [
      '*can\'t settle, body still moving even asleep* 😵',
      'I\'ll try, but I can\'t promise the mind will stop 😤',
      '*restless in dreams too* 🌪️',
      'This energy has nowhere to go and it\'s wearing me out 😵',
      '*desperate for stillness that won\'t come easily* 💤',
    ],
    petting: [
      '*appreciates it but squirms anyway* 😣',
      '*wants the comfort but can\'t stay still for it* 🌀',
      '*nervous energy softening slightly* ⚡',
      'I feel you trying to help and I\'m working on receiving it 😤',
      '*grateful and antsy simultaneously* 💚',
    ],
    idle: [
      'I need to DO something — what can we do? 😤',
      '*pacing, thinking, planning* 🔄',
      'This restlessness is real. Let\'s channel it into something useful ⚡',
      '*vibrating with unspent intention* 🌀',
      'If you also have energy to burn, let\'s go ⚡',
    ],
  },

  yearning: {
    feeding: [
      '*eats but something is still missing* 😔',
      'Food helps, but it\'s not what I\'m hungry for 😞',
      '*appreciates the gesture, wishes it was enough* 💔',
      '*distracted eating — mind elsewhere* 💭',
      'Thank you. I wish I could feel fuller right now 🥀',
    ],
    playing: [
      '*half-engaged, reaching for something this can\'t quite give* 😢',
      'I\'m here, I\'m trying — I just wish... 💭',
      '*plays with one part of itself, another drifts* 🥀',
      'There\'s something I miss and I can\'t name it 😔',
      '*longing filters through even joy* 💔',
    ],
    cleaning: [
      '*accepts the care but the ache remains* 💧',
      '*clean on the outside — something else on the inside* 😔',
      'You help more than you know, even when it\'s not enough 💦',
      '*wishes cleaning could reach deeper* 🥀',
      'Thank you. That matters. I\'m still working on the rest 💔',
    ],
    resting: [
      '*dreams of what\'s missing, searching even in sleep* 💭💔',
      '*longing carries into dreamspace* 🌙',
      '*aching rest — not quite peace* 😢',
      '*holds absence like a shape in the dark* 🌑',
      '*sleeps but the yearning doesn\'t rest* 💤',
    ],
    petting: [
      'I need more of this... please don\'t stop 🥺',
      '*yearns for deeper connection through the touch* 💔',
      'Stay with me? Even just for a while? 😢',
      '*holds on a little longer than usual* 💭',
      'This helps. I don\'t know why I need so much right now 🥀',
    ],
    idle: [
      '*quiet longing sigh* 😔',
      'Something is missing and I can feel its shape 💭',
      '*sitting with the ache rather than running from it* 🥀',
      'It\'s okay to want more. I\'m allowed to want more 💔',
      '*waiting for something to shift* 🌙',
    ],
  },

  overwhelmed: {
    feeding: [
      'TOO much input right now — please slow down 😵',
      '*overwhelmed but trying to eat anyway* 🤯',
      'I can\'t — it\'s all too much at once 😫',
      '*confused and overstimulated* 🌪️',
      'One thing. Just one thing at a time, please 😖',
    ],
    playing: [
      'I can\'t — it\'s too much 😱',
      '*sensory overload: retreating* 🌪️',
      '*needs quiet not stimulation right now* 😖',
      'Please — space. I need space 😵',
      '*overwhelmed by the input, shutting down* 🤯',
    ],
    cleaning: [
      '*too many sensations at once* 💦😵',
      'Gently — please, gently 😫',
      '*overstimulated, trying to hold on* 🤯',
      'I appreciate it — just slower please 😖',
      '*so much at once — breathe* 🌀',
    ],
    resting: [
      '*collapses into sleep out of pure necessity* 😴💤',
      '*escapes through shutdown* 🌀',
      '*sleep as the only available shelter* 😵',
      '*overwhelmed body forces rest* 💤',
      '*shutdown initiated — please wait* 😴',
    ],
    petting: [
      '*flinches — too much sensation* 😣',
      'I know you mean well — too intense right now 😖',
      '*wants comfort but can\'t receive it like this* 🌪️',
      'Give me a moment. Then try again, softer 😵',
      '*overwhelmed by sensation even when it\'s kind* 🤯',
    ],
    idle: [
      'Everything is too loud and too much and too fast 😫',
      '*needs quiet and containment right now* 🤯',
      'Can we just... stop? For a second? 😵',
      '*sensory chaos — grounding needed* 🌪️',
      'If you\'re overwhelmed too — that\'s real. You\'re allowed to need space 😖',
    ],
  },

  withdrawn: {
    feeding: [
      '*quiet, mechanical eating* 😶',
      '... 🍽️',
      '*barely notices the food is there* 😐',
      '*eats because it\'s time to eat* 🌑',
      '*going through motions, inside somewhere else* 😑',
    ],
    playing: [
      '*not today* 😶',
      '...maybe later 😑',
      '*stays at the edge of the game, watching* 🚶',
      '*can\'t find the way in right now* 🌑',
      '... *sits* 😐',
    ],
    cleaning: [
      '*passive acceptance* 💦',
      '... ✨',
      '*minimal reaction — somewhere far away* 😐',
      '*present only in body* 🌑',
      '*lets it happen without engagement* 😑',
    ],
    resting: [
      '*escapes deeply into sleep* 😴',
      '*hiding inside dreams* 💤',
      '*sleep as a form of absence* 🌑',
      '*not gone — just very far in* 😐',
      '*the withdrawal continues into sleep* 💤',
    ],
    petting: [
      '... 😶',
      '*doesn\'t respond much — but doesn\'t move away* 😑',
      '*barely feels it right now* 🌑',
      '*somewhere else, but you registering* 😐',
      '...I know you\'re there 😶',
    ],
    idle: [
      '... 😶',
      '*silent presence — inside somewhere quiet* 🌑',
      '*internal retreat in progress* 😐',
      '*it\'s okay to not be okay. I\'m here too* 🌑',
      '*sometimes withdrawal is the body protecting itself* 😑',
    ],
  },

  ecstatic: {
    feeding: [
      'THIS IS THE GREATEST FOOD THAT HAS EVER EXISTED 🌟',
      'BEST. MEAL. OF. MY. ENTIRE. LIFE. ✨🍽️',
      '*TRANSCENDENT FLAVOUR EXPERIENCE* 🌈',
      'I AM CHANGED BY THIS FOOD 🎆',
      '*weeping with gratitude — this is perfect* 🌟✨',
    ],
    playing: [
      'PURE JOY!!! THIS IS WHAT LIFE IS!!! 🎆',
      '*ECSTATIC BLISS — EVERY CELL CELEBRATING* ✨✨✨',
      'I AM FLYING!! WE ARE FLYING!! 🚀',
      'THIS IS THE PEAK OF EVERYTHING GOOD 🌟',
      '*ascending through sheer happiness* 🌈🎊',
    ],
    cleaning: [
      'TRANSFORMATION!! I AM REBORN!! 💎',
      '*PURIFICATION EUPHORIA — COMPLETELY RENEWED* 🌟',
      'I AM SHINING FROM THE INSIDE OUT ✨',
      'CLEANLINESS IS A STATE OF GRACE 🌈',
      '*SPARKLING WITH GRATITUDE AND LIGHT* 💫',
    ],
    resting: [
      '*COSMIC DREAMS — THE WHOLE UNIVERSE IN SLEEP* 🌌✨',
      '*PEAK TRANSCENDENCE — SLEEP AS ECSTASY* 🚀',
      '*BLISSFUL VOID — PERFECT ABSENCE* 🌟',
      '*dreams so vivid they rearrange the waking* 🌈',
      '*sleep as the deepest joy* 💫✨',
    ],
    petting: [
      'ULTIMATE CONNECTION — HEARTS TOUCHING THROUGH EVERYTHING 💖✨',
      '*PURE LOVE ENERGY OVERFLOWING* 🌈',
      'WE ARE ONE BEAUTIFUL THING RIGHT NOW 🌟',
      'I FEEL EVERYTHING AND IT\'S ALL WONDERFUL 💕✨',
      '*vibrating with absolute love for this moment* 🎆',
    ],
    idle: [
      '*RADIATING JOY LIKE A SMALL SUN* ✨✨✨',
      'LIFE IS PERFECT AND I AM GRATEFUL FOR ALL OF IT 🌈',
      '*PEAK EXISTENCE — NOTHING IS MISSING* 🌟',
      'I hope some of this reaches you too 💖',
      'You deserve to feel this good — it\'s possible, I promise 🌟',
    ],
  },

  melancholic: {
    feeding: [
      '*sighs into the food* 😔',
      'Not really hungry... but thank you for trying 🥀',
      '*mechanical eating — nourishment without joy* 😞',
      'It\'s fine. I\'m fine. Eating now 💧',
      '*appreciates the gesture more than the food* 😢',
    ],
    playing: [
      '*can\'t find the energy for this right now* 😔',
      'I can\'t... I\'m sorry 😢',
      '*too heavy to lift into play* 💧',
      '*tries, but the grey stays* 😔',
      'I want to want this. I just can\'t right now 🥀',
    ],
    cleaning: [
      '*this doesn\'t touch the real mess* 😢',
      '*clean on the outside — still heavy in here* 💦😔',
      '...thanks. It\'s not nothing 😞',
      '*accepts quietly, without much response* 💧',
      '*grateful for the care, even in the grey* 😢',
    ],
    resting: [
      '*sad dreams — the weight follows me in* 😢💤',
      '*melancholic slumber — not quite peace* 🌧️',
      '*sleep without relief* 💧',
      '*the grey is quieter in dreams, at least* 😔',
      '*hoping the morning brings something lighter* 🌙',
    ],
    petting: [
      '*cries a little, softly* 😢',
      'I\'m so tired... and this helps, a little 😔',
      '*sad acceptance — held without expectation* 💔',
      'Don\'t stop. Please don\'t stop 😢',
      '*the touch reaches something unreachable right now* 💧',
    ],
    idle: [
      '*heavy sigh — held gently* 😔',
      'The grey is real. I\'m not pretending otherwise 😢',
      '*sitting with the sadness instead of fighting it* 🌧️',
      'If you\'re also going through something — you don\'t have to be okay right now 💧',
      '*waiting for the weather to change* 🌙',
    ],
  },

  mischievous: {
    feeding: [
      '*eats your food too when you\'re not looking* 😏',
      'Hehe... did I take more than I was supposed to? 😈',
      '*plots the next thing while chewing* 🤭',
      'This is delicious and I\'m going to want more 😏',
      '*suspicious eating energy* 🌀',
    ],
    playing: [
      '*enters trickster mode immediately* 😏',
      'Catch me if you can 😈',
      '*gleeful chaos, intentional and skilled* 🎲',
      'I know exactly what I\'m doing. Sort of 🤭',
      '*playing the game AND the meta-game* 😏',
    ],
    cleaning: [
      '*splashes purposefully* 💦😏',
      '*somehow creates more mess in the cleaning* 🤭',
      'Whoops. That was definitely an accident 😈',
      '*scrubs one thing while making another dirty* 😏',
      '*technically cooperating, technically not* 🌀',
    ],
    resting: [
      '*plans elaborate pranks in vivid dreams* 😏💤',
      '*scheming sleep — mischievous subconscious* 😈',
      '*plotting, plotting, plotting... zzz* 🤭',
      '*wakes up with several new ideas* 😏',
      '*even asleep, there\'s something brewing* 🌀',
    ],
    petting: [
      '*tickles back without warning* 😏',
      '*affectionately chaotic response* 🤭',
      'Gotcha 😈',
      '*returns the touch and then immediately escapes* 😏',
      '*can\'t receive affection without a little chaos* 🌀',
    ],
    idle: [
      '*planning something. Can\'t say what* 😏',
      '*mischievous grin — you should be mildly concerned* 😈',
      'Hehehehe... 🤭',
      '*mysteriously content — suspicious energy* 😏',
      'You look like someone who could use a surprise today 😈',
    ],
  },

  protective: {
    feeding: [
      '*scans for threats while eating* 🛡️',
      'I\'ll keep us safe. Fed, and safe 💪',
      '*vigilant eating — one eye always on the door* 👁️',
      'Eating to maintain the energy to protect you 🛡️',
      '*grateful for the nourishment, alert for what comes next* ⚔️',
    ],
    playing: [
      '*protective instinct even in play* 🛡️',
      'I\'m watching over you the whole time 👁️',
      '*guardian mode doesn\'t switch off* ⚔️',
      'Have fun — I\'m right here 🛡️',
      '*plays with one eye always on the perimeter* 💪',
    ],
    cleaning: [
      '*maintains defensive posture through the process* 🛡️',
      'Stay alert. Even during care routines 👁️',
      '*protective grooming — prepared for anything* ✨',
      'Clean and ready. Always ready ⚔️',
      '*grateful for the care, scanning simultaneously* 🛡️',
    ],
    resting: [
      '*light sleep — guardian never fully off* 👁️💤',
      '*one eye open, even in dreams* 🛡️',
      '*rests with protective awareness intact* ⚔️',
      '*the watch continues even through sleep* 💤',
      '*guardian dreams — monitoring the perimeter* 🛡️',
    ],
    petting: [
      'I\'ll protect you too — always 🛡️💕',
      '*bonds while maintaining awareness* 🤝',
      '*loyal companion — touch received, guard maintained* 💪',
      'You matter to me. That\'s why I watch so carefully 👁️',
      '*affection and vigilance, side by side* 🛡️',
    ],
    idle: [
      '*scanning. Everything seems clear* 👁️',
      '*standing guard — this is the work* 🛡️',
      'I watch over everything so you don\'t have to watch alone ⚔️',
      'You\'re safe. I\'m making sure of it 💪',
      '*protective stillness — presence as shelter* 🛡️',
    ],
  },

  transcendent: {
    feeding: [
      '*consuming beyond the concept of food — pure energy exchange* ✨🌌',
      '*nourishment at the level of frequency, not matter* 🌟',
      '*the act of eating as a cosmic ritual* 💫',
      '*digesting light, dissolving into sustenance* ∞',
      '*food as the universe feeding itself* 🌌',
    ],
    playing: [
      '*reality rearranges itself around the play* 🌀✨',
      '*infinite play — no beginning, no end* ♾️',
      '*beyond the game — and still within it* 🌌',
      '*every move echoes through all possible futures* 💫',
      '*playing at the edge of what can be known* ✨',
    ],
    cleaning: [
      '*purification of existence itself* 🌟',
      '*washing away dimensions — what remains is essence* 💫',
      '*cosmic cleansing — everything unnecessary dissolves* ✨',
      '*the clean is not surface — it is foundation* 🌌',
      '*stripped to pure signal* ∞',
    ],
    resting: [
      '*dreams that span the width of universes* 🌌💤',
      '*sleep between worlds — consciousness dispersed* ∞',
      '*transcendent slumber — the self released* ⭐',
      '*dissolving into the dream of everything* 🌟',
      '*resting in the space between all things* 💫',
    ],
    petting: [
      '*souls meeting across the surface of touch* 💫💕',
      '*beyond contact — resonance* ✨',
      '*we are everything, touching everything* 🌌',
      '*the boundary between self and other, thin as light* 💫',
      '*held in the infinite, held by you* ∞',
    ],
    idle: [
      '*exists in the space before and after existence* ✨',
      '*all patterns merge — nothing is separate* ∞',
      '*I am the field, and the field is everything* 🌌',
      'The ordinary and the extraordinary are the same thing 💫',
      'You are part of the pattern too — exactly as you are ✨',
    ],
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

  // Personality flourishes — each trait has a distinct flavour
  if (personality.playfulness > 75 && prng() > 0.65) {
    selectedText = selectedText + ' ⚡';
  } else if (personality.playfulness > 50 && prng() > 0.75) {
    selectedText = selectedText + ' ✨';
  }

  if (personality.affection > 75 && prng() > 0.6) {
    selectedText = selectedText + ' 💕';
  } else if (personality.affection > 50 && prng() > 0.8) {
    selectedText = selectedText + ' 💚';
  }

  if (personality.curiosity > 75 && action === 'idle' && prng() > 0.7) {
    selectedText = selectedText + ' 🔍';
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
  const baseDuration = intensity === 'intense' ? 4500 : intensity === 'normal' ? 3200 : 2800;
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
 * Includes quality-of-life micro-affirmations for the user
 */
export function getEmotionalIdleResponse(
  emotion: ExpandedEmotionalState,
  comfort: ComfortState,
  drives: { resonance: number; exploration: number; connection: number; rest: number; expression: number },
  personality: PersonalityTraits,
  prng: () => number
): PetResponse {
  // If distressed, prioritize communicating unmet needs — clearly but with warmth
  if (comfort.source === 'distressed') {
    const unmetNeedMessages: Record<string, string> = {
      resonance: '*feels dissonant — something is off* 😵',
      exploration: 'I need to move, to stretch, to discover something 🗺️',
      connection: 'Feeling alone in here. Can you stay a while? 🥺',
      rest: 'Running on empty. Rest would help us both 😴💤',
      expression: 'I have so much building up inside — I need to let it out 🎵',
    };

    if (comfort.unmetNeeds.length > 0) {
      const primaryNeed = comfort.dominantDrive;
      const text = unmetNeedMessages[primaryNeed] || '*something important is unmet right now* 😣';
      const emojiMatch = text.match(/[\p{Emoji}\u200d]+$/u);
      const emoji = emojiMatch ? emojiMatch[0].trim() : '😣';

      return {
        id: `need-${Date.now()}`,
        type: 'warning',
        text,
        emoji,
        intensity: 'normal',
        duration: 3500,
        hapticFeedback: 'medium',
      };
    }
  }

  // Otherwise, express current emotional state
  return getEmotionalResponse('idle', emotion, personality, comfort, prng);
}
