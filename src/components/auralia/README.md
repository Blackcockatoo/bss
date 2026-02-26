# Auralia Guardian

A fully-featured virtual companion that blends sacred mathematics, generative art, and interactive AI into an evolving digital entity.

## Features

### 🌟 Core Systems
- **MossPrimeSeed Algorithm**: Deterministic PRNG based on three 60-digit sequences (Red, Black, Blue)
- **Guardian Forms**: Six archetypal transformations (Radiant, Meditation, Sage, Vigilant, Celestial, Wild)
- **Autonomous AI**: Five behavioral modes (idle, observing, focusing, playing, dreaming)
- **Sacred Mathematics**: Real-time Fibonacci and Lucas number calculations
- **Genome System**: Trinity vault (Red-60, Blue-60, Black-60) drives visual mutations

### 🎮 Interactive Features
- **Sigil Pattern Matching**: Memory game with 3-5 point sequences
- **Fibonacci Trivia**: Mathematical quiz system with dynamic questions
- **Snake Game**: Classic 15x15 grid serpent with keyboard controls (win at 50+ points)
- **Tetris Game**: Sacred geometry stacking on 20x10 board (win at 300+ points)
- **Breeding System**: Create offspring by combining two Guardian genomes (requires bond ≥ 70)
- **Bond Chronicle**: Persistent history of all interactions
- **Attunement Sliders**: Real-time control over Energy, Curiosity, Bond, and Health

### 🎵 Audio Engine
- **Four Musical Scales**: Harmonic, Pentatonic, Dorian, Phrygian
- **Generative Soundscape**: Ambient wind texture with LFO modulation
- **Reverb System**: Algorithmic impulse response for spatial depth
- **Interactive Notes**: Click sigil points or pulse/ring digits to trigger tones

### 🌅 Environment Awareness
- **Time-of-Day Themes**: Dawn, Day, Dusk, Night color palettes
- **Dynamic Transitions**: Smooth 3-second gradient morphing
- **High Contrast Mode**: Accessibility-focused black theme

### ♿ Accessibility
- **ARIA Labels**: Full screen-reader support
- **Keyboard Navigation**: All interactive elements accessible
- **Mobile Responsive**: Touch-optimized for all screen sizes
- **High Contrast Toggle**: Enhanced visibility option

### 💾 Persistence
- **Auto-Save**: Every 30 seconds to localStorage
- **State Restoration**: Resume exactly where you left off
- **Session Tracking**: Dreams, games won, total interactions
- **Bond History**: Last 30 events with timestamps

## Guardian Forms

### Radiant Guardian (Default)
- **Unlock**: Starting form
- **Colors**: Deep blue (#2C3E77) with gold accents
- **Description**: Calm strength - balanced blue and gold

### Meditation Cocoon
- **Unlock**: Energy < 30 AND Health < 50
- **Colors**: Dark teal (#0d1321) with cyan accents
- **Description**: Quiet endurance - dusk-teal respite

### Sage Luminary
- **Unlock**: Bond > 60 AND Curiosity > 50
- **Colors**: Indigo with bright gold hepta-crown
- **Description**: Luminous focus - hepta-crown activated

### Vigilant Sentinel
- **Unlock**: Energy > 70 AND Curiosity > 60
- **Colors**: Indigo with neon orange/fire
- **Description**: Focused will - indigo with neon fire

### Celestial Voyager
- **Unlock**: Bond > 80 AND 3+ Dreams
- **Colors**: Deep void (#0A1128) with stardust purple/white
- **Geometry**: Six radial stars with orbital rings
- **Description**: Cosmic transcendence - stardust and void

### Wild Verdant
- **Unlock**: Energy > 80, Curiosity > 70, 5+ Sigils
- **Colors**: Forest green with chartreuse accents
- **Geometry**: Eight fractal tendrils with organic growth
- **Description**: Primal vitality - fractal growth unleashed

## AI Behavior Modes

### Idle
- Resting state between actions
- Eyes track mouse cursor
- Duration: 5-10 seconds

### Observing
- Eyes follow circular path
- Whisper: "The field shifts..."
- Duration: 4-8 seconds

### Focusing
- Prepares to target a sigil point
- Whisper: "A point of interest."
- Duration: 3-6 seconds

### Playing
- Highlights and focuses on specific sigil
- Whisper: "Resonance at point N."
- Duration: 2 seconds

### Dreaming
- Guardian withdraws to process patterns
- Generates cryptic insight upon completion
- Whisper: Random wisdom from pattern realm
- Duration: 8-15 seconds
- Adds entry to bond chronicle

## Mini-Games

### 🔮 Sigil Pattern Matching
1. Guardian generates 3-5 point sequence
2. Audio playback demonstrates pattern (600ms spacing)
3. Click sigil points in correct order
4. **Rewards**: +10 Bond, +5 Curiosity, +1 Games Won

### 🧮 Number Wisdom Quiz
1. Random question about Fibonacci/Lucas numbers
2. Four multiple-choice options
3. Instant feedback with correct answer
4. **Rewards**: +8 Bond, +12 Curiosity, +1 Games Won, audio celebration

## Audio System

### Scales
- **Harmonic**: Just intonation (pure ratios)
- **Pentatonic**: 5-note East Asian scale
- **Dorian**: Medieval church mode
- **Phrygian**: Spanish/Middle Eastern flavor

### Base Frequency
432 Hz (cosmic tuning)

### Audio Layers
- **Note Oscillators**: 7 voices mapped to scale ratios
- **Drone Oscillators**: 3 sub-bass voices (0.5x, 0.75x, 1x)
- **Ambient Texture**: Dual oscillators (60Hz, 90Hz) with LFO
- **Reverb**: 2-second algorithmic impulse response

## Sacred Mathematics

### MossPrimeSeed Constants
```
RED   = "113031491493585389543778774590997079619617525721567332336510"
BLACK = "011235831459437077415617853819099875279651673033695493257291"
BLUE  = "012776329785893036118967145479098334781325217074992143965631"
```

### Derived Sequences
- **Pulse**: `(red[i] XOR black[(i*7)%60] XOR blue[(i*13)%60]) % 10`
- **Ring**: `(red[i] + black[i] + blue[i]) % 10`

### PRNG Algorithm
Xorshift128+ with seed derived from interleaved RGB sequences and guardian name

### Fibonacci & Lucas
Fast doubling algorithm for efficient bigint computation

## Genome System

### Red-60 (Spine Energy)
`(pulseSum * 1.2 + energy * 0.7 + (100 - health) * 0.3) % 100`

### Blue-60 (Form Integrity)
`(ringSum * 1.1 + curiosity * 0.6 + bond * 0.5) % 100`

### Black-60 (Mystery Halo)
`((pulseSum + ringSum) * 0.8 + energy * 0.4 + bond * 0.6) % 100`

## Usage

```tsx
import AuraliaMetaPet from './components/AuraliaMetaPet';

function App() {
  return <AuraliaMetaPet />;
}
```

## Saved State

Automatically persisted to localStorage every 30 seconds:

```typescript
{
  seedName: string;           // Guardian's name
  energy: number;             // 0-100
  curiosity: number;          // 0-100
  bond: number;              // 0-100
  health: number;            // 0-100
  bondHistory: Array<{       // Last 30 events
    timestamp: number;
    bond: number;
    event: string;
  }>;
  activatedPoints: number[]; // Sigil indices
  totalInteractions: number;
  dreamCount: number;
  gamesWon: number;
  highContrast: boolean;
  createdAt: number;
  lastSaved: number;
}
```

## Development

### Dependencies
- React 18+
- TypeScript 4.5+
- Tailwind CSS 3+

### Browser Support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Web Audio API required

## Credits

**Design Philosophy**: Blend of sacred geometry, generative systems, and companion AI
**Algorithm**: MossPrimeSeed deterministic chaos engine
**Audio**: 432 Hz tuning with modal harmony
