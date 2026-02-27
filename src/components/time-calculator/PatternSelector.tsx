interface PatternSelectorProps {
  currentPattern: 'timeCompass' | 'nodePattern' | 'circlePattern';
  onPatternChange: (pattern: 'timeCompass' | 'nodePattern' | 'circlePattern') => void;
  currentColor: 'red' | 'blue' | 'black';
  onColorChange: (color: 'red' | 'blue' | 'black') => void;
}

const PATTERN_LABELS = {
  timeCompass: 'Time Compass',
  nodePattern: 'Node Pattern',
  circlePattern: 'Circle Pattern'
} as const;

const COLOR_LABELS = {
  red: 'Red',
  blue: 'Blue',
  black: 'Black'
} as const;

export default function PatternSelector({
  currentPattern,
  onPatternChange,
  currentColor,
  onColorChange
}: PatternSelectorProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-zinc-700 bg-zinc-950/70 p-4 sm:flex-row sm:items-center sm:justify-between">
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-zinc-200">Pattern Type</legend>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PATTERN_LABELS) as Array<keyof typeof PATTERN_LABELS>).map(pattern => (
            <button
              key={pattern}
              type="button"
              className={`rounded-md px-3 py-2 text-sm transition ${
                currentPattern === pattern ? 'bg-cyan-600 text-white' : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
              }`}
              onClick={() => onPatternChange(pattern)}
            >
              {PATTERN_LABELS[pattern]}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-zinc-200">Color Palette</legend>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(COLOR_LABELS) as Array<keyof typeof COLOR_LABELS>).map(color => (
            <button
              key={color}
              type="button"
              className={`rounded-md border px-3 py-2 text-sm transition ${
                currentColor === color
                  ? color === 'red'
                    ? 'border-red-400 bg-red-600 text-white'
                    : color === 'blue'
                      ? 'border-blue-400 bg-blue-600 text-white'
                      : 'border-zinc-500 bg-zinc-950 text-white'
                  : 'border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
              }`}
              onClick={() => onColorChange(color)}
            >
              {COLOR_LABELS[color]}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
