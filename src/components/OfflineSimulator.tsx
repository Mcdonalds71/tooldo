import {
  AirplaneTiltIcon,
  ArrowsClockwiseIcon,
  CheckCircleIcon,
  CpuIcon,
  LightningIcon,
  ShieldCheckIcon,
  WifiHighIcon,
  WifiSlashIcon,
} from '@phosphor-icons/react/dist/ssr';
import { useState } from 'react';
import './OfflineSimulator.css';

export default function OfflineSimulator() {
  const [isAirplaneMode, setIsAirplaneMode] = useState<boolean>(true);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(100);
  const [resultText, setResultText] = useState<string | null>(
    'Executed locally in 32ms • Zero server requests',
  );

  const toggleAirplaneMode = () => {
    setIsAirplaneMode((prev) => !prev);
  };

  const runSample = () => {
    if (isRunning) return;
    setIsRunning(true);
    setProgress(0);
    setResultText(null);

    const startTime = Date.now();
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          const duration = Math.max(18, Date.now() - startTime);
          setResultText(`Executed locally in ${duration}ms • Zero server requests`);
          setIsRunning(false);
          return 100;
        }
        return p + 25;
      });
    }, 60);
  };

  return (
    <div className="offline-sim">
      {/* Header bar */}
      <div className="offline-sim__header">
        <button
          type="button"
          onClick={toggleAirplaneMode}
          className={`offline-sim__toggle-btn ${
            isAirplaneMode ? 'offline-sim__toggle-btn--active' : ''
          }`}
          aria-pressed={isAirplaneMode}
        >
          {isAirplaneMode ? (
            <>
              <AirplaneTiltIcon size={15} weight="bold" />
              <span>Airplane Mode: ON</span>
            </>
          ) : (
            <>
              <WifiHighIcon size={15} weight="bold" />
              <span>Airplane Mode: OFF</span>
            </>
          )}
        </button>

        <div
          className={`offline-sim__status-badge ${
            isAirplaneMode
              ? 'offline-sim__status-badge--offline'
              : 'offline-sim__status-badge--online'
          }`}
        >
          <span className="offline-sim__dot" />
          {isAirplaneMode ? (
            <>
              <WifiSlashIcon size={13} weight="bold" />
              <span>Disconnected</span>
            </>
          ) : (
            <>
              <WifiHighIcon size={13} weight="bold" />
              <span>Connected</span>
            </>
          )}
        </div>
      </div>

      {/* Telemetry Stats Grid */}
      <div className="offline-sim__telemetry">
        <div className="offline-sim__stat">
          <span className="offline-sim__stat-label">01 / Network I/O</span>
          <span
            className={`offline-sim__stat-value ${
              isAirplaneMode ? 'offline-sim__stat-value--highlight' : ''
            }`}
          >
            {isAirplaneMode ? '0 KB/s' : '24 KB/s'}
          </span>
        </div>

        <div className="offline-sim__stat">
          <span className="offline-sim__stat-label">02 / Cloud Requests</span>
          <span className="offline-sim__stat-value">
            <ShieldCheckIcon size={14} weight="bold" />0
          </span>
        </div>

        <div className="offline-sim__stat">
          <span className="offline-sim__stat-label">03 / Engine</span>
          <span className="offline-sim__stat-value">
            <CpuIcon size={14} weight="bold" />
            Local WASM
          </span>
        </div>
      </div>

      {/* Sandbox Demo Box */}
      <div className="offline-sim__sandbox">
        <div className="offline-sim__sandbox-header">
          <span className="offline-sim__sandbox-title">
            <LightningIcon size={14} weight="fill" color="#ff3b14" />
            In-Browser PDF & Image Engine
          </span>
          <span className="offline-sim__sandbox-meta">100% In-Memory</span>
        </div>

        <div className="offline-sim__sandbox-action">
          <button
            type="button"
            className="offline-sim__action-btn"
            onClick={runSample}
            disabled={isRunning}
          >
            {isRunning ? (
              <>
                <ArrowsClockwiseIcon size={15} weight="bold" className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <LightningIcon size={15} weight="bold" />
                Run In-Memory Test
              </>
            )}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="offline-sim__progress-track">
          <div className="offline-sim__progress-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* Result Message */}
        {resultText && (
          <div className="offline-sim__result">
            <CheckCircleIcon size={14} weight="bold" />
            <span>{resultText}</span>
          </div>
        )}
      </div>
    </div>
  );
}
