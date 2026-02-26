/**
 * EyeSystem - Advanced eye emotion and rendering system for AuraliaMetaPet
 * Provides intelligent eye state calculation based on stats, events, and context
 */

export type EyeShape = 'round' | 'slit' | 'star' | 'half-lidded' | 'wide' | 'squinted' | 'heart' | 'spiral';
export type EyeEmotion = 'normal' | 'surprised' | 'curious' | 'sleepy' | 'content' | 'scared' | 'playful' | 'focused' | 'confused' | 'grumpy' | 'blinking';

export interface EyeState {
  emotion: EyeEmotion;
  shape: EyeShape;
  pupilSize: number;        // 4-12
  irisSize: number;         // 12-18
  irisColor: string;
  glowIntensity: number;    // 0-1
  blinkSpeed: number;       // ms - interval between blinks
  trackingSpeed: number;    // 0-1, how fast eyes follow targets
  verticalScale: number;    // 0.6-1.2, squish/stretch
  sparkles: boolean;
  secondaryColor?: string;  // for gradients/effects
  jitter: boolean;          // for scared emotion
  wink: boolean;            // for playful emotion
  offset: { x: number; y: number }; // for confused emotion
}

export interface EyeStats {
  energy: number;
  curiosity: number;
  bond: number;
  health: number;
}

export interface EyeContext {
  activeForm: string;
  annoyanceLevel: number;
  transformationMode: 'normal' | 'squished' | 'stretched' | 'bouncy' | 'grumpy';
  aiState: { mode: string };
  currentGame: any | null;
  isBlinking: boolean;
  recentEvents?: Array<{ type: string; timestamp: number }>;
}

/**
 * Calculate eye state based on current stats and context
 * Priority: Blinking > Grumpy > Recent Events > Active Game > Form-based > Stat-based > Default
 */
export function calculateEyeState(
  stats: EyeStats,
  context: EyeContext,
  formEyeColor: string
): EyeState {
  const { energy, curiosity, bond, health } = stats;
  const { activeForm, annoyanceLevel, transformationMode, aiState, currentGame, isBlinking, recentEvents = [] } = context;

  // Default state
  const state: EyeState = {
    emotion: 'normal',
    shape: 'round',
    pupilSize: 8,
    irisSize: 14,
    irisColor: formEyeColor,
    glowIntensity: 0.9,
    blinkSpeed: 3000 + Math.random() * 5000,
    trackingSpeed: 0.3,
    verticalScale: 1.0,
    sparkles: false,
    jitter: false,
    wink: false,
    offset: { x: 0, y: 0 },
  };

  // PRIORITY 1: Blinking (overrides everything)
  if (isBlinking) {
    return {
      ...state,
      emotion: 'blinking',
      shape: 'round',
      verticalScale: 0.1,
    };
  }

  // PRIORITY 2: Grumpy (annoyanceLevel > 80)
  if (annoyanceLevel > 80) {
    return {
      ...state,
      emotion: 'grumpy',
      shape: 'squinted',
      pupilSize: 6,
      irisSize: 12,
      irisColor: '#FF4444',
      glowIntensity: 0.8,
      trackingSpeed: 0.2,
      verticalScale: 0.85,
      secondaryColor: '#FF0000',
    };
  }

  // PRIORITY 3: Recent Events (check for events in last 3 seconds)
  const now = Date.now();
  const recentEvent = recentEvents.find(e => now - e.timestamp < 3000);

  if (recentEvent) {
    if (recentEvent.type === 'sigil_activated' || recentEvent.type === 'stat_spike') {
      // Surprised
      return {
        ...state,
        emotion: 'surprised',
        shape: 'wide',
        pupilSize: 10,
        irisSize: 18,
        irisColor: brightenColor(formEyeColor, 0.2),
        glowIntensity: 1.0,
        trackingSpeed: 0.1,
        verticalScale: 1.1,
      };
    } else if (recentEvent.type === 'health_drop') {
      // Scared
      return {
        ...state,
        emotion: 'scared',
        shape: 'wide',
        pupilSize: 4,
        irisSize: 17,
        irisColor: desaturateColor(formEyeColor, 0.2),
        glowIntensity: 0.7,
        trackingSpeed: 0.05,
        verticalScale: 1.05,
        jitter: true,
      };
    }
  }

  // PRIORITY 4: Active Mini-Game
  if (currentGame) {
    return {
      ...state,
      emotion: 'focused',
      shape: 'slit',
      pupilSize: 6,
      irisSize: 15,
      irisColor: saturateColor(formEyeColor, 0.3),
      glowIntensity: 1.0,
      trackingSpeed: 0.2,
      verticalScale: 0.85,
    };
  }

  // PRIORITY 5: Form-based defaults
  if (activeForm === 'meditation') {
    return {
      ...state,
      emotion: 'sleepy',
      shape: 'half-lidded',
      pupilSize: 7,
      irisSize: 13,
      irisColor: addBlueShift(formEyeColor, 0.15),
      glowIntensity: 0.5,
      blinkSpeed: 2000 + Math.random() * 3000,
      trackingSpeed: 0.8,
      verticalScale: 0.6,
    };
  }

  if (activeForm === 'vigilant' || aiState.mode === 'focusing') {
    return {
      ...state,
      emotion: 'focused',
      shape: 'slit',
      pupilSize: 6,
      irisSize: 15,
      irisColor: saturateColor(formEyeColor, 0.3),
      glowIntensity: 1.0,
      trackingSpeed: 0.2,
      verticalScale: 0.85,
    };
  }

  // PRIORITY 6: Stat-based emotions

  // Sleepy (low energy + low health)
  if (energy < 25 && health < 40) {
    return {
      ...state,
      emotion: 'sleepy',
      shape: 'half-lidded',
      pupilSize: 7,
      irisSize: 13,
      irisColor: addBlueShift(formEyeColor, 0.15),
      glowIntensity: 0.5,
      blinkSpeed: 2000 + Math.random() * 3000,
      trackingSpeed: 0.8,
      verticalScale: 0.6,
    };
  }

  // Scared (low health alone)
  if (health < 30) {
    return {
      ...state,
      emotion: 'scared',
      shape: 'wide',
      pupilSize: 4,
      irisSize: 17,
      irisColor: desaturateColor(formEyeColor, 0.2),
      glowIntensity: 0.7,
      trackingSpeed: 0.05,
      verticalScale: 1.05,
      jitter: true,
    };
  }

  // Content (high bond, no annoyance)
  if (bond > 70 && annoyanceLevel === 0) {
    return {
      ...state,
      emotion: 'content',
      shape: 'squinted',
      pupilSize: 9,
      irisSize: 14,
      irisColor: formEyeColor,
      glowIntensity: 0.85,
      trackingSpeed: 0.4,
      verticalScale: 0.9,
      secondaryColor: '#FFD700',
    };
  }

  // Playful (high energy + high curiosity)
  if (energy > 60 && curiosity > 60) {
    const useWink = Math.random() > 0.95; // 5% chance to wink
    return {
      ...state,
      emotion: 'playful',
      shape: bond > 85 ? 'heart' : 'star',
      pupilSize: 9,
      irisSize: 15,
      irisColor: formEyeColor,
      glowIntensity: 0.95,
      trackingSpeed: 0.1,
      verticalScale: 1.0,
      sparkles: true,
      wink: useWink,
      secondaryColor: 'rainbow',
    };
  }

  // Curious (high curiosity or observing mode)
  if (curiosity > 70 || aiState.mode === 'observing') {
    return {
      ...state,
      emotion: 'curious',
      shape: 'star',
      pupilSize: 9,
      irisSize: 15,
      irisColor: formEyeColor,
      glowIntensity: 0.95,
      trackingSpeed: 0.25,
      verticalScale: 1.0,
      sparkles: true,
      secondaryColor: '#00FFFF',
    };
  }

  // Confused (conflicting stats)
  if ((curiosity > 70 && energy < 30) || annoyanceLevel > 30 && annoyanceLevel < 80) {
    return {
      ...state,
      emotion: 'confused',
      shape: 'spiral',
      pupilSize: 7,
      irisSize: 14,
      irisColor: formEyeColor,
      glowIntensity: 0.75,
      trackingSpeed: 0.35,
      verticalScale: 1.0,
      offset: { x: Math.sin(now / 500) * 2, y: Math.cos(now / 700) * 1.5 },
    };
  }

  // Squinted grumpy (moderate annoyance)
  if (annoyanceLevel > 30) {
    return {
      ...state,
      emotion: 'grumpy',
      shape: 'squinted',
      pupilSize: 6,
      irisSize: 13,
      irisColor: addRedTint(formEyeColor, 0.15),
      glowIntensity: 0.75,
      trackingSpeed: 0.25,
      verticalScale: 0.9,
    };
  }

  // PRIORITY 7: Default - return normal state
  return state;
}

// Color manipulation helpers

function brightenColor(color: string, amount: number): string {
  // Simple brightness increase by adding to RGB values
  const hex = color.replace('#', '');
  const r = Math.min(255, parseInt(hex.slice(0, 2), 16) + amount * 255);
  const g = Math.min(255, parseInt(hex.slice(2, 4), 16) + amount * 255);
  const b = Math.min(255, parseInt(hex.slice(4, 6), 16) + amount * 255);
  return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
}

function desaturateColor(color: string, amount: number): string {
  // Convert to grayscale partially
  const hex = color.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const gray = (r + g + b) / 3;
  const newR = r + (gray - r) * amount;
  const newG = g + (gray - g) * amount;
  const newB = b + (gray - b) * amount;
  return `#${Math.round(newR).toString(16).padStart(2, '0')}${Math.round(newG).toString(16).padStart(2, '0')}${Math.round(newB).toString(16).padStart(2, '0')}`;
}

function saturateColor(color: string, amount: number): string {
  // Increase saturation (move away from gray)
  const hex = color.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const gray = (r + g + b) / 3;
  const newR = Math.max(0, Math.min(255, r + (r - gray) * amount));
  const newG = Math.max(0, Math.min(255, g + (g - gray) * amount));
  const newB = Math.max(0, Math.min(255, b + (b - gray) * amount));
  return `#${Math.round(newR).toString(16).padStart(2, '0')}${Math.round(newG).toString(16).padStart(2, '0')}${Math.round(newB).toString(16).padStart(2, '0')}`;
}

function addBlueShift(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const r = Math.max(0, parseInt(hex.slice(0, 2), 16) - amount * 255 * 0.3);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = Math.min(255, parseInt(hex.slice(4, 6), 16) + amount * 255 * 0.15);
  return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
}

function addRedTint(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const r = Math.min(255, parseInt(hex.slice(0, 2), 16) + amount * 255);
  const g = Math.max(0, parseInt(hex.slice(2, 4), 16) - amount * 100);
  const b = Math.max(0, parseInt(hex.slice(4, 6), 16) - amount * 100);
  return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
}

// ============================================
// EyeRenderer Component
// ============================================

export interface EyeRendererProps {
  eyeState: EyeState;
  eyePos: { x: number; y: number };
  leftEyeCenter: { x: number; y: number };
  rightEyeCenter: { x: number; y: number };
  annoyanceLevel?: number;
}

/**
 * Renders expressive eyes based on calculated eye state
 */
export function EyeRenderer({
  eyeState,
  eyePos,
  leftEyeCenter,
  rightEyeCenter,
  annoyanceLevel = 0,
}: EyeRendererProps) {
  const {
    emotion,
    shape,
    pupilSize,
    irisSize,
    irisColor,
    glowIntensity,
    verticalScale,
    sparkles,
    secondaryColor,
    jitter,
    wink,
    offset,
  } = eyeState;

  // Calculate jitter offset for scared emotion
  const jitterOffset = jitter
    ? {
        x: (Math.random() - 0.5) * 1.5,
        y: (Math.random() - 0.5) * 1.5,
      }
    : { x: 0, y: 0 };

  // Determine filter to use based on emotion
  const filterUrl = emotion !== 'normal' && emotion !== 'blinking'
    ? `url(#eyeFilter-${emotion})`
    : `url(#strongGlow)`;

  // Blinking state - simple horizontal lines
  if (emotion === 'blinking') {
    return (
      <g transform={`translate(${eyePos.x + offset.x}, ${eyePos.y + offset.y})`}>
        <path
          d={`M ${leftEyeCenter.x - 8} ${leftEyeCenter.y} h 16`}
          stroke={irisColor}
          strokeWidth="2"
        />
        <path
          d={`M ${rightEyeCenter.x - 8} ${rightEyeCenter.y} h 16`}
          stroke={irisColor}
          strokeWidth="2"
        />
      </g>
    );
  }

  // Grumpy state with angry eyebrows - keep original styling
  if (emotion === 'grumpy' && annoyanceLevel > 80) {
    return (
      <g transform={`translate(${eyePos.x + offset.x}, ${eyePos.y + offset.y})`}>
        {/* Angry narrowed eyes */}
        <path
          d={`M ${leftEyeCenter.x - 8} ${leftEyeCenter.y} Q ${leftEyeCenter.x} ${leftEyeCenter.y - 5}, ${leftEyeCenter.x + 8} ${leftEyeCenter.y}`}
          stroke="#FF4444"
          strokeWidth="3"
          fill="none"
          opacity="0.9"
        />
        <path
          d={`M ${rightEyeCenter.x - 8} ${rightEyeCenter.y} Q ${rightEyeCenter.x} ${rightEyeCenter.y - 5}, ${rightEyeCenter.x + 8} ${rightEyeCenter.y}`}
          stroke="#FF4444"
          strokeWidth="3"
          fill="none"
          opacity="0.9"
        />
        {/* Angry eyebrows */}
        <path
          d={`M ${leftEyeCenter.x - 10} ${leftEyeCenter.y - 10} L ${leftEyeCenter.x + 10} ${leftEyeCenter.y - 5}`}
          stroke={irisColor}
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.8"
        />
        <path
          d={`M ${rightEyeCenter.x + 10} ${rightEyeCenter.y - 10} L ${rightEyeCenter.x - 10} ${rightEyeCenter.y - 5}`}
          stroke={irisColor}
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.8"
        />
        {/* Pulsing red glow */}
        <circle cx={leftEyeCenter.x} cy={leftEyeCenter.y - 3} r="12" fill="#FF0000" opacity="0.2">
          <animate attributeName="opacity" values="0.1;0.3;0.1" dur="0.8s" repeatCount="indefinite" />
        </circle>
        <circle cx={rightEyeCenter.x} cy={rightEyeCenter.y - 3} r="12" fill="#FF0000" opacity="0.2">
          <animate attributeName="opacity" values="0.1;0.3;0.1" dur="0.8s" repeatCount="indefinite" />
        </circle>
      </g>
    );
  }

  // Helper function to render a single eye
  const renderEye = (center: { x: number; y: number }, isLeft: boolean) => {
    const finalX = center.x + jitterOffset.x;
    const finalY = center.y + jitterOffset.y;

    // Handle winking - close right eye for wink animation
    if (wink && !isLeft) {
      return (
        <path
          d={`M ${finalX - 8} ${finalY} Q ${finalX} ${finalY + 3}, ${finalX + 8} ${finalY}`}
          stroke={irisColor}
          strokeWidth="2"
          fill="none"
          opacity="0.9"
        />
      );
    }

    return (
      <g
        transform={`scale(1, ${verticalScale})`}
        style={{ transformOrigin: `${finalX} ${finalY}` }}
      >
        {/* Sclera (dark background) */}
        <circle cx={finalX} cy={finalY} r={irisSize + 2} fill="#0d1321" opacity="0.8" />

        {/* Iris */}
        <circle
          cx={finalX}
          cy={finalY}
          r={irisSize}
          fill={secondaryColor === 'rainbow' ? 'url(#rainbowGradient)' : irisColor}
          filter={filterUrl}
          opacity={glowIntensity}
        >
          {shape === 'round' && (
            <animate attributeName="r" values={`${irisSize};${irisSize + 1};${irisSize}`} dur="5s" repeatCount="indefinite" />
          )}
        </circle>

        {/* Pupil - shape varies by eye shape */}
        {shape === 'slit' ? (
          // Slit pupil for focused/vigilant
          <ellipse
            cx={finalX}
            cy={finalY}
            rx={pupilSize * 0.3}
            ry={pupilSize * 1.5}
            fill="black"
            opacity="0.9"
          />
        ) : shape === 'star' ? (
          // Star pupil for curious/playful
          <g>
            <circle cx={finalX} cy={finalY} r={pupilSize} fill="#FFD700" opacity="0.7" />
            <path
              d={`M ${finalX} ${finalY - pupilSize * 1.2} L ${finalX + pupilSize * 0.4} ${finalY - pupilSize * 0.4} L ${finalX + pupilSize * 1.2} ${finalY} L ${finalX + pupilSize * 0.4} ${finalY + pupilSize * 0.4} L ${finalX} ${finalY + pupilSize * 1.2} L ${finalX - pupilSize * 0.4} ${finalY + pupilSize * 0.4} L ${finalX - pupilSize * 1.2} ${finalY} L ${finalX - pupilSize * 0.4} ${finalY - pupilSize * 0.4} Z`}
              fill="white"
              opacity="0.6"
            />
          </g>
        ) : shape === 'heart' ? (
          // Heart pupil for very high bond + playful
          <path
            d={`M ${finalX} ${finalY + pupilSize * 0.5} Q ${finalX - pupilSize} ${finalY - pupilSize * 0.7} ${finalX} ${finalY - pupilSize * 0.2} Q ${finalX + pupilSize} ${finalY - pupilSize * 0.7} ${finalX} ${finalY + pupilSize * 0.5} Z`}
            fill="#FF69B4"
            opacity="0.8"
          />
        ) : shape === 'spiral' ? (
          // Spiral pupil for confused
          <g>
            <circle cx={finalX} cy={finalY} r={pupilSize} fill="black" opacity="0.7" />
            <path
              d={`M ${finalX} ${finalY} Q ${finalX + pupilSize * 0.5} ${finalY - pupilSize * 0.5} ${finalX + pupilSize} ${finalY} Q ${finalX + pupilSize * 0.5} ${finalY + pupilSize * 0.5} ${finalX} ${finalY + pupilSize}`}
              stroke="white"
              strokeWidth="1"
              fill="none"
              opacity="0.5"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from={`0 ${finalX} ${finalY}`}
                to={`360 ${finalX} ${finalY}`}
                dur="3s"
                repeatCount="indefinite"
              />
            </path>
          </g>
        ) : (
          // Round pupil (default)
          <circle cx={finalX} cy={finalY} r={pupilSize} fill="#FFD700" opacity="0.6" />
        )}

        {/* Highlight (glint) */}
        <circle cx={finalX - 3} cy={finalY - 3} r="3" fill="white" opacity="0.8" />

        {/* Secondary color glow for special emotions */}
        {secondaryColor && secondaryColor !== 'rainbow' && (
          <circle
            cx={finalX}
            cy={finalY}
            r={irisSize + 6}
            fill={secondaryColor}
            opacity="0.15"
          >
            <animate attributeName="opacity" values="0.1;0.2;0.1" dur="2s" repeatCount="indefinite" />
          </circle>
        )}

        {/* Sparkles for curious/playful */}
        {sparkles && (
          <g opacity="0.7">
            <circle cx={finalX - 6} cy={finalY - 6} r="1.5" fill={secondaryColor || 'white'}>
              <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" />
            </circle>
            <circle cx={finalX + 7} cy={finalY - 4} r="1" fill={secondaryColor || 'white'}>
              <animate attributeName="opacity" values="0.2;0.9;0.2" dur="2s" repeatCount="indefinite" begin="0.5s" />
            </circle>
            <circle cx={finalX + 3} cy={finalY + 8} r="1.2" fill={secondaryColor || 'white'}>
              <animate attributeName="opacity" values="0.3;1;0.3" dur="1.8s" repeatCount="indefinite" begin="1s" />
            </circle>
          </g>
        )}
      </g>
    );
  };

  return (
    <g transform={`translate(${eyePos.x + offset.x}, ${eyePos.y + offset.y})`}>
      {renderEye(leftEyeCenter, true)}
      {renderEye(rightEyeCenter, false)}
    </g>
  );
}
