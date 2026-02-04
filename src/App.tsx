
import { useState } from 'react'
import { ConfigPanel } from './components/ConfigPanel'
import { ScheduleEditor } from './components/ScheduleEditor'
import { ResultsDashboard } from './components/ResultsDashboard'
import type { SimulationConfig, SimulationResult } from './types'
import { runSimulation } from './utils/simulation'

const DEFAULT_CONFIG: SimulationConfig = {
  year: 2026,
  startDate: "2026-04-01",
  endDate: "2026-07-31", // User requested end of July
  totalStudents: 100,
  requiredHoursPerStudent: 21,
  maxConcurrentStudents: 5,
  minSessionHours: 2,
  maxSessionHours: 5,
  classBufferMinutes: 10,
  clinicHours: {
    weekdays: { start: "08:30", end: "20:30" },
    saturday: { start: "09:30", end: "16:00" }
  },
  openDays: [1, 2, 3, 4, 5, 6], // Mon-Sat (0=Sun)
  closedDays: [],
  blockedClassTimes: [],
  attendanceVariance: false // Default to off
}

function App() {
  const [config, setConfig] = useState<SimulationConfig>(DEFAULT_CONFIG);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    // Add small delay to allow UI to update (render spinner)
    setTimeout(() => {
      const res = runSimulation(config);
      setResult(res);
      setIsSimulating(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <header className="px-6 py-5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 sticky top-0 z-50 shadow-sm/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20">
              S
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                Clinical Training Simulator
              </h1>
              <p className="text-xs text-gray-500 font-medium">2026 Planning Tool</p>
            </div>
          </div>

          <button
            onClick={handleRunSimulation}
            disabled={isSimulating}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-semibold shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex items-center gap-2"
          >
            {isSimulating ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                Run Simulation
              </>
            )}

          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 sm:p-8 lg:p-10 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Configuration */}
          <div className="lg:col-span-5 space-y-6">
            <ConfigPanel
              config={config}
              onChange={setConfig}
            />
            <ScheduleEditor
              blockedTimes={config.blockedClassTimes}
              onChange={(newBlocked) => setConfig({ ...config, blockedClassTimes: newBlocked })}
            />
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-7">
            <div className="sticky top-28">
              {result ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <ResultsDashboard result={result} isSimulating={isSimulating} limit={config.maxConcurrentStudents} />
                </div>
              ) : (
                <div className="h-96 flex flex-col items-center justify-center bg-white dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-gray-400">
                  <span className="text-6xl mb-4">🚀</span>
                  <p className="text-lg">Ready to simulate.</p>
                  <p className="text-sm">Configure parameters and click "Run Simulation".</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
