import React, { useEffect, useState, useRef } from 'react';

interface TimeCompassProps {
  color: 'red' | 'blue' | 'black';
}

// These number strings were provided in the requirements
const NUMBER_STRINGS = {
  blue: "012776329785893036118967145479098334781325217074992143965631",
  red: "113031491493585389543778774590997079619617525721567332336510",
  black: "011235831459437077415617853819099875279651673033695493257291"
};

const TimeCompass: React.FC<TimeCompassProps> = ({ color }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [rotation, setRotation] = useState(0);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [animationActive, setAnimationActive] = useState(false);

  // Colors based on the selected color prop
  const colorVariants = {
    red: {
      primary: '#FF5555',
      secondary: '#FF9999',
      tertiary: '#FFCCCC',
      textColor: 'text-red-500'
    },
    blue: {
      primary: '#5555FF',
      secondary: '#9999FF',
      tertiary: '#CCCCFF',
      textColor: 'text-blue-500'
    },
    black: {
      primary: '#AAAAAA',
      secondary: '#666666',
      tertiary: '#333333',
      textColor: 'text-gray-300'
    }
  };

  const selectedColor = colorVariants[color];
  const numberString = NUMBER_STRINGS[color];

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Handle animation
  useEffect(() => {
    let animationFrame: number;

    if (animationActive) {
      const animate = () => {
        setRotation(prev => (prev + 0.2) % 360);
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
    const key = `${color}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    setApiKey(key);
    setShowApiKey(true);
  };

  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const seconds = currentTime.getSeconds();

  // Calculate rotation angles for clock hands
  const hourAngle = (hours % 12) * 30 + minutes / 2;
  const minuteAngle = minutes * 6;
  const secondAngle = seconds * 6;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[500px] h-[500px] max-w-full">
        <svg
          ref={svgRef}
          className="w-full h-full"
          viewBox="-250 -250 500 500"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {/* Main circle */}
          <circle cx="0" cy="0" r="200" stroke={selectedColor.primary} strokeWidth="2" fill="none" />

          {/* Hour markers */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30) * (Math.PI / 180);
            const x1 = Math.sin(angle) * 180;
            const y1 = -Math.cos(angle) * 180;
            const x2 = Math.sin(angle) * 200;
            const y2 = -Math.cos(angle) * 200;

            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={selectedColor.primary}
                strokeWidth="2"
              />
            );
          })}

          {/* Minute markers */}
          {Array.from({ length: 60 }).map((_, i) => {
            if (i % 5 !== 0) {
              const angle = (i * 6) * (Math.PI / 180);
              const x1 = Math.sin(angle) * 190;
              const y1 = -Math.cos(angle) * 190;
              const x2 = Math.sin(angle) * 200;
              const y2 = -Math.cos(angle) * 200;

              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={selectedColor.secondary}
                  strokeWidth="1"
                />
              );
            }
            return null;
          })}

          {/* Numbers around the compass */}
          {Array.from({ length: 24 }).map((_, i) => {
            const angle = (i * 15) * (Math.PI / 180);
            const x = Math.sin(angle) * 170;
            const y = -Math.cos(angle) * 170;

            // Get a section of the number string to display at this position
            const startIdx = i * 2 % numberString.length;
            const digits = numberString.substring(startIdx, startIdx + 3);

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
                {digits}
              </text>
            );
          })}

          {/* Clock hands */}
          {/* Hour hand */}
          <line
            x1="0"
            y1="0"
            x2={Math.sin(hourAngle * (Math.PI / 180)) * 100}
            y2={-Math.cos(hourAngle * (Math.PI / 180)) * 100}
            stroke={selectedColor.primary}
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Minute hand */}
          <line
            x1="0"
            y1="0"
            x2={Math.sin(minuteAngle * (Math.PI / 180)) * 140}
            y2={-Math.cos(minuteAngle * (Math.PI / 180)) * 140}
            stroke={selectedColor.secondary}
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Second hand */}
          <line
            x1="0"
            y1="0"
            x2={Math.sin(secondAngle * (Math.PI / 180)) * 160}
            y2={-Math.cos(secondAngle * (Math.PI / 180)) * 160}
            stroke={selectedColor.tertiary}
            strokeWidth="1"
            strokeLinecap="round"
          />

          {/* Center dot */}
          <circle cx="0" cy="0" r="5" fill={selectedColor.primary} />
        </svg>
      </div>

      <div className="mt-4 flex flex-col gap-2 items-center">
        <div className="flex gap-2">
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
            <p className="text-xs mt-1">Use this key to access the time calculator compass API</p>
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

export default TimeCompass;
