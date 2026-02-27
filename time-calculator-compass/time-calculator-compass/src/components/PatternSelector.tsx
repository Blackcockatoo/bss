import React from 'react';

interface PatternSelectorProps {
  currentPattern: 'timeCompass' | 'nodePattern' | 'circlePattern';
  onPatternChange: (pattern: 'timeCompass' | 'nodePattern' | 'circlePattern') => void;
  currentColor: 'red' | 'blue' | 'black';
  onColorChange: (color: 'red' | 'blue' | 'black') => void;
}

const PatternSelector: React.FC<PatternSelectorProps> = ({
  currentPattern,
  onPatternChange,
  currentColor,
  onColorChange
}) => {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-center">
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Pattern Type</h3>
        <div className="flex flex-wrap gap-2">
          <button
            className={`px-4 py-2 rounded-md ${currentPattern === 'timeCompass' ? 'bg-blue-600' : 'bg-gray-700'}`}
            onClick={() => onPatternChange('timeCompass')}
          >
            Time Compass
          </button>
          <button
            className={`px-4 py-2 rounded-md ${currentPattern === 'nodePattern' ? 'bg-blue-600' : 'bg-gray-700'}`}
            onClick={() => onPatternChange('nodePattern')}
          >
            Node Pattern
          </button>
          <button
            className={`px-4 py-2 rounded-md ${currentPattern === 'circlePattern' ? 'bg-blue-600' : 'bg-gray-700'}`}
            onClick={() => onPatternChange('circlePattern')}
          >
            Circle Pattern
          </button>
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Color</h3>
        <div className="flex flex-wrap gap-2">
          <button
            className={`px-4 py-2 rounded-md ${currentColor === 'red' ? 'bg-red-600' : 'bg-gray-700'}`}
            onClick={() => onColorChange('red')}
          >
            Red
          </button>
          <button
            className={`px-4 py-2 rounded-md ${currentColor === 'blue' ? 'bg-blue-600' : 'bg-gray-700'}`}
            onClick={() => onColorChange('blue')}
          >
            Blue
          </button>
          <button
            className={`px-4 py-2 rounded-md ${currentColor === 'black' ? 'bg-gray-950 border border-gray-700' : 'bg-gray-700'}`}
            onClick={() => onColorChange('black')}
          >
            Black
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatternSelector;
