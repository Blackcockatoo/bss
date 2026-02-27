import React, { useRef, useState, useEffect } from 'react';

interface ClockwiseNodePatternProps {
  color: 'red' | 'blue' | 'black';
}

// These number strings were provided in the requirements
const NUMBER_STRINGS = {
  blue: "012776329785893036118967145479098334781325217074992143965631",
  red: "113031491493585389543778774590997079619617525721567332336510",
  black: "011235831459437077415617853819099875279651673033695493257291"
};

const ClockwiseNodePattern: React.FC<ClockwiseNodePatternProps> = ({ color }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [rotation, setRotation] = useState(0);
  const [nodes, setNodes] = useState<{ x: number; y: number }[]>([]);
  const [animationActive, setAnimationActive] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  // Colors based on the selected color prop
  const colorVariants = {
    red: {
      stroke: '#FF5555',
      nodeColor: '#FF9999',
      textColor: 'text-red-500'
    },
    blue: {
      stroke: '#5555FF',
      nodeColor: '#9999FF',
      textColor: 'text-blue-500'
    },
    black: {
      stroke: '#AAAAAA',
      nodeColor: '#666666',
      textColor: 'text-gray-300'
    }
  };

  const selectedColor = colorVariants[color];
  const numberString = NUMBER_STRINGS[color];

  // Generate nodes based on the number string
  useEffect(() => {
    const newNodes: { x: number; y: number }[] = [];
    const centerNode = { x: 0, y: 0 };
    newNodes.push(centerNode);

    // Convert the number string to positions
    for (let i = 0; i < numberString.length - 1; i += 2) {
      const num1 = parseInt(numberString[i], 10);
      const num2 = parseInt(numberString[i + 1] || '0', 10);

      // Use the numbers to determine positions with some trigonometry
      const angle = ((num1 * 36) % 360) * (Math.PI / 180);
      const distance = 30 + (num2 * 15);

      const x = Math.sin(angle) * distance;
      const y = Math.cos(angle) * distance;

      newNodes.push({ x, y });
    }

    setNodes(newNodes);
  }, [numberString]);

  // Handle animation
  useEffect(() => {
    let animationFrame: number;

    if (animationActive) {
      const animate = () => {
        setRotation(prev => (prev + 0.5) % 360);
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
    const key = `${color}-node-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    setApiKey(key);
    setShowApiKey(true);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[500px] h-[500px] max-w-full">
        <svg
          ref={svgRef}
          className="w-full h-full"
          viewBox="-250 -250 500 500"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {/* Node connections - connect all nodes to the center node */}
          {nodes.slice(1).map((node, i) => (
            <line
              key={i}
              x1={0}
              y1={0}
              x2={node.x}
              y2={node.y}
              stroke={selectedColor.stroke}
              strokeWidth="1"
            />
          ))}

          {/* Secondary connections - connect adjacent nodes */}
          {nodes.slice(1).map((node, i, arr) => {
            if (i < arr.length - 1) {
              const nextNode = arr[i + 1];
              return (
                <line
                  key={`s-${i}`}
                  x1={node.x}
                  y1={node.y}
                  x2={nextNode.x}
                  y2={nextNode.y}
                  stroke={selectedColor.stroke}
                  strokeWidth="0.5"
                  strokeOpacity="0.7"
                />
              );
            }
            return null;
          })}

          {/* Draw nodes */}
          {nodes.map((node, i) => (
            <circle
              key={`n-${i}`}
              cx={node.x}
              cy={node.y}
              r={i === 0 ? 5 : 3}
              fill={selectedColor.nodeColor}
            />
          ))}
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
            <p className="text-xs mt-1">Use this key to access the node pattern API</p>
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

export default ClockwiseNodePattern;
