import { useState } from 'react'
import PatternSelector from './components/PatternSelector'
import TimeCompass from './components/TimeCompass'
import ClockwiseNodePattern from './components/ClockwiseNodePattern'
import ColoredCirclePattern from './components/ColoredCirclePattern'

function App() {
  const [patternType, setPatternType] = useState<'timeCompass' | 'nodePattern' | 'circlePattern'>('timeCompass')
  const [color, setColor] = useState<'red' | 'blue' | 'black'>('red')

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="p-4 bg-gray-800 shadow-lg">
        <h1 className="text-2xl font-bold text-center">Sacred Geometry Time Calculator Compass</h1>
      </header>

      <main className="container mx-auto p-4">
        <PatternSelector
          currentPattern={patternType}
          onPatternChange={setPatternType}
          currentColor={color}
          onColorChange={setColor}
        />

        <div className="mt-8 flex justify-center">
          {patternType === 'timeCompass' && <TimeCompass color={color} />}
          {patternType === 'nodePattern' && <ClockwiseNodePattern color={color} />}
          {patternType === 'circlePattern' && <ColoredCirclePattern color={color} />}
        </div>
      </main>

      <footer className="mt-8 p-4 bg-gray-800 text-center text-sm text-gray-400">
        Sacred Geometry Time Calculator Compass &copy; {new Date().getFullYear()}
      </footer>
    </div>
  )
}

export default App
