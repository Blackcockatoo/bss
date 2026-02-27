import React, { useRef, useState, useEffect } from 'react';

interface ColoredCirclePatternProps {
  color: 'red' | 'blue' | 'black';
}

// These number strings were provided in the requirements
const NUMBER_STRINGS = {
  blue: "012776329785893036118967145479098334781325217074992143965631",
  red: "113031491493585389543778774590997079619617525721567332336510",
  black: "011235831459437077415617853819099875279651673033695493257291"
};

// Sacred geometry patterns
const PATTERN_TYPES = ['flower', 'star', 'metatron', 'fibonacci'];

const ColoredCirclePattern: React.FC<ColoredCirclePatternProps> = ({ color }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [rotation, setRotation] = useState(0);
  const [patternType, setPatternType] = useState<string>('flower');
  const [animationActive, setAnimationActive] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  // Colors based on the selected color prop
  const colorVariants = {
    red: {
      primary: '#FF5555',
      secondary: '#FF9999',
      background: 'rgba(255, 85, 85, 0.05)',
      textColor: 'text-red-500'
    },
    blue: {
      primary: '#5555FF',
      secondary: '#9999FF',
      background: 'rgba(85, 85, 255, 0.05)',
      textColor: 'text-blue-500'
    },
    black: {
      primary: '#AAAAAA',
      secondary: '#666666',
      background: 'rgba(170, 170, 170, 0.05)',
      textColor: 'text-gray-300'
    }
  };

  const selectedColor = colorVariants[color];
  const numberString = NUMBER_STRINGS[color];

  // Handle animation
  useEffect(() => {
    let animationFrame: number;

    if (animationActive) {
      const animate = () => {
        setRotation(prev => (prev + 0.3) % 360);
        animationFrame = requestAnimationFrame(animate);
      };

      animationFrame = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [animationActive]);

  const generateAPIKey = () => {
    // Generate a simple API key based on the current time and selected pattern
    const key = `${color}-${patternType}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    setApiKey(key);
    setShowApiKey(true);
  };

  // Render different sacred geometry patterns based on the pattern type
  const renderPattern = () => {
    switch (patternType) {
      case 'flower':
        return (
          <>
            {/* Flower of Life Pattern */}
            <circle cx="0" cy="0" r="200" stroke={selectedColor.primary} strokeWidth="1" fill="none" />

            {Array.from({ length: 6 }).map((_, i) => {
              const angle = (i * 60) * (Math.PI / 180);
              const x = Math.sin(angle) * 100;
              const y = Math.cos(angle) * 100;

              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="100"
                  stroke={selectedColor.primary}
                  strokeWidth="1"
                  fill="none"
                />
              );
            })}

            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i * 30) * (Math.PI / 180);
              const x = Math.sin(angle) * 150;
              const y = Math.cos(angle) * 150;

              return (
                <circle
                  key={`outer-${i}`}
                  cx={x}
                  cy={y}
                  r="50"
                  stroke={selectedColor.primary}
                  strokeWidth="0.5"
                  fill="none"
                />
              );
            })}
          </>
        );

      case 'star':
        return (
          <>
            {/* Metatron's Cube - Star Tetrahedron */}
            <polygon
              points="0,-200 173.2,100 -173.2,100"
              stroke={selectedColor.primary}
              strokeWidth="1"
              fill="none"
            />
            <polygon
              points="0,200 173.2,-100 -173.2,-100"
              stroke={selectedColor.primary}
              strokeWidth="1"
              fill="none"
            />
            <polygon
              points="-200,0 100,173.2 100,-173.2"
              stroke={selectedColor.primary}
              strokeWidth="1"
              fill="none"
            />
            <polygon
              points="200,0 -100,173.2 -100,-173.2"
              stroke={selectedColor.primary}
              strokeWidth="1"
              fill="none"
            />

            {/* Circles at vertices */}
            {[
              { x: 0, y: -200 }, { x: 173.2, y: 100 }, { x: -173.2, y: 100 },
              { x: 0, y: 200 }, { x: 173.2, y: -100 }, { x: -173.2, y: -100 },
              { x: -200, y: 0 }, { x: 100, y: 173.2 }, { x: 100, y: -173.2 },
              { x: 200, y: 0 }, { x: -100, y: 173.2 }, { x: -100, y: -173.2 }
            ].map((point, i) => (
              <circle
                key={i}
                cx={point.x}
                cy={point.y}
                r="15"
                stroke={selectedColor.primary}
                strokeWidth="1"
                fill="none"
              />
            ))}

            {/* Center circle */}
            <circle
              cx="0"
              cy="0"
              r="30"
              stroke={selectedColor.primary}
              strokeWidth="1"
              fill="none"
            />
          </>
        );

      case 'metatron':
        return (
          <>
            {/* Metatron's Cube - Inner structure */}
            <circle cx="0" cy="0" r="180" stroke={selectedColor.primary} strokeWidth="1" fill="none" />
            <circle cx="0" cy="0" r="150" stroke={selectedColor.primary} strokeWidth="0.7" fill="none" />
            <circle cx="0" cy="0" r="120" stroke={selectedColor.primary} strokeWidth="0.7" fill="none" />
            <circle cx="0" cy="0" r="90" stroke={selectedColor.primary} strokeWidth="0.7" fill="none" />
            <circle cx="0" cy="0" r="60" stroke={selectedColor.primary} strokeWidth="0.7" fill="none" />
            <circle cx="0" cy="0" r="30" stroke={selectedColor.primary} strokeWidth="0.7" fill="none" />

            {/* Hexagon structure */}
            <polygon
              points="0,-180 155.9,-90 155.9,90 0,180 -155.9,90 -155.9,-90"
              stroke={selectedColor.primary}
              strokeWidth="1"
              fill="none"
            />

            {/* Inner hexagon */}
            <polygon
              points="0,-120 103.9,-60 103.9,60 0,120 -103.9,60 -103.9,-60"
              stroke={selectedColor.primary}
              strokeWidth="0.7"
              fill="none"
            />

            {/* Connection lines */}
            {Array.from({ length: 6 }).map((_, i) => {
              const angle = (i * 60) * (Math.PI / 180);
              const x1 = Math.sin(angle) * 180;
              const y1 = -Math.cos(angle) * 180;

              return (
                <line
                  key={i}
                  x1={0}
                  y1={0}
                  x2={x1}
                  y2={y1}
                  stroke={selectedColor.primary}
                  strokeWidth="0.7"
                />
              );
            })}
          </>
        );

      case 'fibonacci':
        return (
          <>
            {/* Fibonacci Spiral */}
            <circle cx="0" cy="0" r="200" stroke={selectedColor.primary} strokeWidth="1" fill="none" />

            {/* Golden ratio spiral approximated with arcs */}
            <path
              d={`M 0,0
                 A 20,20 0 0 1 20,20
                 A 40,40 0 0 0 60,60
                 A 100,100 0 0 1 160,160
                 A 180,180 0 0 0 -20,160`}
              stroke={selectedColor.primary}
              strokeWidth="1.5"
              fill="none"
            />

            {/* Golden rectangles */}
            <rect x="-10" y="-10" width="20" height="20" stroke={selectedColor.primary} strokeWidth="0.7" fill="none" />
            <rect x="-10" y="-10" width="40" height="40" stroke={selectedColor.primary} strokeWidth="0.7" fill="none" />
            <rect x="-10" y="-10" width="60" height="60" stroke={selectedColor.primary} strokeWidth="0.7" fill="none" />
            <rect x="-10" y="-10" width="100" height="100" stroke={selectedColor.primary} strokeWidth="0.7" fill="none" />
            <rect x="-10" y="-10" width="160" height="160" stroke={selectedColor.primary} strokeWidth="0.7" fill="none" />

            {/* Numbers from the sequence */}
            {numberString.split('').slice(0, 8).map((digit, i) => {
              const fibPos = [1, 1, 2, 3, 5, 8, 13, 21];
              const size = fibPos[i] * 10;
              const x = -10 + size / 2;
              const y = -10 + size / 2;

              return (
                <text
                  key={i}
                  x={x}
                  y={y}
                  fill={selectedColor.primary}
                  fontSize="12"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {digit}
                </text>
              );
            })}
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[500px] h-[500px] max-w-full">
        <svg
          ref={svgRef}
          className="w-full h-full"
          viewBox="-250 -250 500 500"
          style={{
            transform: `rotate(${rotation}deg)`,
            backgroundColor: selectedColor.background
          }}
        >
          {renderPattern()}
        </svg>
      </div>

      <div className="mt-4 flex flex-col gap-2 items-center">
        <div className="flex gap-2 flex-wrap justify-center">
          {PATTERN_TYPES.map(type => (
            <button
              key={type}
              className={`px-4 py-2 rounded-md ${patternType === type ? `bg-${color === 'black' ? 'gray-700' : `${color}-600`}` : 'bg-gray-800'}`}
              onClick={() => setPatternType(type)}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mt-4">
          <button
            className="px-4 py-2 bg-gray-800 rounded-md"
            onClick={() => setRotation(prev => (prev - 15) % 360)}
          >
            Rotate CCW
          </button>
          <button
            className="px-4 py-2 bg-gray-800 rounded-md"
            onClick={() => setRotation(prev => (prev + 15) % 360)}
          >
            Rotate CW
          </button>
          <button
            className={`px-4 py-2 rounded-md ${animationActive ? 'bg-red-600' : 'bg-gray-800'}`}
            onClick={() => setAnimationActive(prev => !prev)}
          >
            {animationActive ? 'Stop Animation' : 'Start Animation'}
          </button>
        </div>

        <div className="flex gap-2 mt-2">
          <button
            className="px-4 py-2 bg-gray-800 rounded-md"
            onClick={generateAPIKey}
          >
            Generate API Key
          </button>
        </div>

        {showApiKey && (
          <div className="mt-2 p-2 bg-gray-800 rounded-md text-sm">
            <p>API Key: <span className={selectedColor.textColor}>{apiKey}</span></p>
            <p className="text-xs mt-1">Use this key to access the sacred geometry pattern API</p>
          </div>
        )}

        <div className="mt-4 p-2 bg-gray-800 rounded-md max-w-lg">
          <p className="text-center text-sm">
            {numberString.substring(0, 30)}...
          </p>
          <p className="text-xs mt-1 text-gray-400">
            Number sequence used: {color} SRG - North Node Clockwise
          </p>
        </div>
      </div>
    </div>
  );
};

export default ColoredCirclePattern;
