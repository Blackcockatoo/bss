/**
 * EyeFilters - SVG filter definitions for emotion-based eye color effects
 * Provides color transformations and visual effects for different eye emotions
 */

export function EyeEmotionFilters() {
  return (
    <defs>
      {/* Normal glow filter (existing) */}
      <filter id="strongGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Surprised - Brightened with extra glow */}
      <filter id="eyeFilter-surprised" x="-50%" y="-50%" width="200%" height="200%">
        <feComponentTransfer>
          <feFuncR type="linear" slope="1.2" intercept="0.05" />
          <feFuncG type="linear" slope="1.2" intercept="0.05" />
          <feFuncB type="linear" slope="1.2" intercept="0.05" />
        </feComponentTransfer>
        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Curious - Cyan highlights */}
      <filter id="eyeFilter-curious" x="-50%" y="-50%" width="200%" height="200%">
        <feColorMatrix type="matrix" values="
          1 0 0 0 0
          0 1 0.1 0 0
          0 0.1 1.1 0 0
          0 0 0 1 0
        " />
        <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Sleepy - Dimmed with blue shift */}
      <filter id="eyeFilter-sleepy" x="-50%" y="-50%" width="200%" height="200%">
        <feColorMatrix type="matrix" values="
          0.7 0 0 0 0
          0 0.7 0 0 0
          0 0 0.85 0 0.15
          0 0 0 1 0
        " />
        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Content - Warm golden glow */}
      <filter id="eyeFilter-content" x="-50%" y="-50%" width="200%" height="200%">
        <feColorMatrix type="matrix" values="
          1.1 0 0 0 0.05
          0 1 0 0 0.02
          0 0 0.9 0 0
          0 0 0 1 0
        " />
        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Scared - Desaturated and pale */}
      <filter id="eyeFilter-scared" x="-50%" y="-50%" width="200%" height="200%">
        <feColorMatrix type="saturate" values="0.5" />
        <feComponentTransfer>
          <feFuncR type="linear" slope="1" intercept="0.1" />
          <feFuncG type="linear" slope="1" intercept="0.1" />
          <feFuncB type="linear" slope="1" intercept="0.1" />
        </feComponentTransfer>
        <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Playful - Saturated with shimmer */}
      <filter id="eyeFilter-playful" x="-50%" y="-50%" width="200%" height="200%">
        <feColorMatrix type="saturate" values="1.3" />
        <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Focused - High saturation and brightness */}
      <filter id="eyeFilter-focused" x="-50%" y="-50%" width="200%" height="200%">
        <feColorMatrix type="saturate" values="1.5" />
        <feComponentTransfer>
          <feFuncR type="linear" slope="1.1" />
          <feFuncG type="linear" slope="1.1" />
          <feFuncB type="linear" slope="1.1" />
        </feComponentTransfer>
        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Confused - Hue rotation */}
      <filter id="eyeFilter-confused" x="-50%" y="-50%" width="200%" height="200%">
        <feColorMatrix type="hueRotate" values="15">
          <animate attributeName="values" values="15;-15;15" dur="2s" repeatCount="indefinite" />
        </feColorMatrix>
        <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Grumpy - Red tint (enhanced version) */}
      <filter id="eyeFilter-grumpy" x="-50%" y="-50%" width="200%" height="200%">
        <feColorMatrix type="matrix" values="
          1.2 0 0 0 0.1
          0 0.8 0 0 0
          0 0 0.8 0 0
          0 0 0 1 0
        " />
        <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Rainbow gradient for playful emotion */}
      <linearGradient id="rainbowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF6B6B">
          <animate attributeName="stop-color" values="#FF6B6B;#FFD93D;#6BCB77;#4D96FF;#FF6B6B" dur="3s" repeatCount="indefinite" />
        </stop>
        <stop offset="50%" stopColor="#FFD93D">
          <animate attributeName="stop-color" values="#FFD93D;#6BCB77;#4D96FF;#FF6B6B;#FFD93D" dur="3s" repeatCount="indefinite" />
        </stop>
        <stop offset="100%" stopColor="#4D96FF">
          <animate attributeName="stop-color" values="#4D96FF;#FF6B6B;#FFD93D;#6BCB77;#4D96FF" dur="3s" repeatCount="indefinite" />
        </stop>
      </linearGradient>

      {/* Sparkle pattern for curious/playful */}
      <pattern id="sparklePattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="5" cy="5" r="1" fill="white" opacity="0.8">
          <animate attributeName="opacity" values="0.3;0.9;0.3" dur="1.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="15" cy="10" r="0.5" fill="white" opacity="0.6">
          <animate attributeName="opacity" values="0.2;0.8;0.2" dur="2s" repeatCount="indefinite" begin="0.5s" />
        </circle>
        <circle cx="10" cy="15" r="0.75" fill="white" opacity="0.7">
          <animate attributeName="opacity" values="0.2;0.9;0.2" dur="1.8s" repeatCount="indefinite" begin="1s" />
        </circle>
      </pattern>
    </defs>
  );
}
