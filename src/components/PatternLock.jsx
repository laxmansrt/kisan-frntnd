import { useState, useRef, useEffect, useCallback } from 'react';

const DOTS = [
  { id: 1, x: 45, y: 45 },
  { id: 2, x: 140, y: 45 },
  { id: 3, x: 235, y: 45 },
  { id: 4, x: 45, y: 140 },
  { id: 5, x: 140, y: 140 },
  { id: 6, x: 235, y: 140 },
  { id: 7, x: 45, y: 235 },
  { id: 8, x: 140, y: 235 },
  { id: 9, x: 235, y: 235 },
];

export default function PatternLock({ onComplete, value, disabled = false }) {
  const [selected, setSelected] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [cursorPos, setCursorPos] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const svgRef = useRef(null);

  // If value is provided externally as preset
  useEffect(() => {
    if (value) {
      const parts = String(value).split('-').map(Number).filter(n => n >= 1 && n <= 9);
      setSelected(parts);
    }
  }, [value]);

  const getSvgCoordinates = useCallback((clientX, clientY) => {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = 280 / rect.width;
    const scaleY = 280 / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  const checkCollision = useCallback((pos) => {
    if (!pos) return null;
    const HIT_RADIUS = 30;
    for (const dot of DOTS) {
      const dist = Math.hypot(dot.x - pos.x, dot.y - pos.y);
      if (dist <= HIT_RADIUS) {
        return dot.id;
      }
    }
    return null;
  }, []);

  const addDot = useCallback((dotId) => {
    if (!dotId) return;
    setSelected((prev) => {
      if (prev.includes(dotId)) return prev;
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(20); } catch { /* ignore */ }
      }
      return [...prev, dotId];
    });
  }, []);

  // Pointer & Touch Handlers
  const handleStart = (clientX, clientY) => {
    if (disabled) return;
    setErrorMsg('');
    setIsDrawing(true);
    const pos = getSvgCoordinates(clientX, clientY);
    if (!pos) return;
    setCursorPos(pos);
    const hit = checkCollision(pos);
    if (hit) {
      setSelected([hit]);
    } else {
      setSelected([]);
    }
  };

  const handleMove = (clientX, clientY) => {
    if (!isDrawing || disabled) return;
    const pos = getSvgCoordinates(clientX, clientY);
    if (!pos) return;
    setCursorPos(pos);
    const hit = checkCollision(pos);
    if (hit) {
      addDot(hit);
    }
  };

  const handleEnd = () => {
    if (!isDrawing || disabled) return;
    setIsDrawing(false);
    setCursorPos(null);

    if (selected.length < 3) {
      if (selected.length > 0) {
        setErrorMsg('Connect at least 3 dots');
        setTimeout(() => setErrorMsg(''), 2000);
      }
      return;
    }

    const patternString = selected.join('-');
    if (onComplete) {
      onComplete(patternString);
    }
  };

  // Touch event listeners attached directly with passive: false to prevent mobile pull-down refresh
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;

    const onTouchStart = (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      handleStart(touch.clientX, touch.clientY);
    };

    const onTouchMove = (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    };

    const onTouchEnd = (e) => {
      e.preventDefault();
      handleEnd();
    };

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: false });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDrawing, selected, disabled, handleStart, handleMove, handleEnd]);

  // Global mouseup in case user releases cursor outside SVG
  useEffect(() => {
    const onGlobalMouseUp = () => {
      if (isDrawing) handleEnd();
    };
    window.addEventListener('mouseup', onGlobalMouseUp);
    return () => window.removeEventListener('mouseup', onGlobalMouseUp);
  }, [isDrawing, selected]);

  const handleDotClick = (dotId) => {
    if (disabled || isDrawing) return;
    setErrorMsg('');
    setSelected((prev) => {
      if (prev.includes(dotId)) return prev;
      const next = [...prev, dotId];
      if (next.length >= 3 && onComplete) {
        onComplete(next.join('-'));
      }
      return next;
    });
  };

  const resetPattern = () => {
    setSelected([]);
    setCursorPos(null);
    setErrorMsg('');
    if (onComplete) onComplete('');
  };

  const setPreset = (preset) => {
    setSelected(preset);
    setErrorMsg('');
    if (onComplete) onComplete(preset.join('-'));
  };

  const lastDot = selected.length > 0 ? DOTS.find(d => d.id === selected[selected.length - 1]) : null;

  return (
    <div className="pattern-lock-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div
        style={{
          position: 'relative',
          width: 280,
          height: 280,
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          borderRadius: 24,
          boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.06), 0 8px 20px rgba(27,94,63,0.08)',
          border: '2px solid #e2e8f0',
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      >
        <svg
          ref={svgRef}
          viewBox="0 0 280 280"
          style={{ width: '100%', height: '100%', cursor: disabled ? 'not-allowed' : 'pointer' }}
          onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
          onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
        >
          {/* Connecting Lines between Selected Dots */}
          {selected.map((dotId, idx) => {
            if (idx === 0) return null;
            const prevDot = DOTS.find(d => d.id === selected[idx - 1]);
            const currDot = DOTS.find(d => d.id === dotId);
            if (!prevDot || !currDot) return null;
            return (
              <line
                key={`line-${prevDot.id}-${currDot.id}`}
                x1={prevDot.x}
                y1={prevDot.y}
                x2={currDot.x}
                y2={currDot.y}
                stroke="#1B5E3F"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}

          {/* Dynamic Tracking Line to Finger/Pointer */}
          {isDrawing && lastDot && cursorPos && (
            <line
              x1={lastDot.x}
              y1={lastDot.y}
              x2={cursorPos.x}
              y2={cursorPos.y}
              stroke="#22c55e"
              strokeWidth="4"
              strokeDasharray="6,6"
              strokeLinecap="round"
            />
          )}

          {/* Dots Grid */}
          {DOTS.map((dot) => {
            const isSelected = selected.includes(dot.id);
            const isLatest = selected.length > 0 && selected[selected.length - 1] === dot.id;

            return (
              <g
                key={`dot-${dot.id}`}
                onClick={() => handleDotClick(dot.id)}
                style={{ cursor: 'pointer' }}
              >
                {/* Outer Ring for Selected Dots */}
                {isSelected && (
                  <circle
                    cx={dot.x}
                    cy={dot.y}
                    r={22}
                    fill="rgba(34, 197, 94, 0.18)"
                    stroke="#1B5E3F"
                    strokeWidth="2"
                  />
                )}

                {/* Pulsing Aura on the newest active dot */}
                {isLatest && isDrawing && (
                  <circle
                    cx={dot.x}
                    cy={dot.y}
                    r={28}
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="2"
                    opacity="0.6"
                  />
                )}

                {/* Touch Hit Area */}
                <circle
                  cx={dot.x}
                  cy={dot.y}
                  r={30}
                  fill="transparent"
                />

                {/* Core Dot */}
                <circle
                  cx={dot.x}
                  cy={dot.y}
                  r={isSelected ? 10 : 8}
                  fill={isSelected ? '#1B5E3F' : '#94a3b8'}
                  transition="all 0.15s ease"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Pattern Status & Action Row */}
      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 280 }}>
        <span style={{ fontSize: '0.82rem', color: selected.length >= 3 ? '#166534' : '#64748b', fontWeight: 600 }}>
          {selected.length > 0 ? (
            <>✓ Dots connected: {selected.length}</>
          ) : (
            <>Draw shape or tap dots</>
          )}
        </span>
        {selected.length > 0 && (
          <button
            type="button"
            className="btn btn--sm btn--ghost"
            style={{ fontSize: '0.75rem', padding: '2px 8px', color: '#dc2626' }}
            onClick={resetPattern}
          >
            ✕ Reset
          </button>
        )}
      </div>

      {errorMsg && (
        <p style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: 4, fontWeight: 500 }}>
          ⚠ {errorMsg}
        </p>
      )}

      {/* Quick Demo Preset Shortcuts */}
      <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          type="button"
          className="btn btn--sm btn--secondary"
          style={{ fontSize: '0.75rem', padding: '3px 8px' }}
          onClick={() => setPreset([1, 2, 3, 5])}
        >
          ⚡ Demo Pattern (1-2-3-5)
        </button>
        <button
          type="button"
          className="btn btn--sm btn--secondary"
          style={{ fontSize: '0.75rem', padding: '3px 8px' }}
          onClick={() => setPreset([1, 4, 7, 8, 9])}
        >
          ⚡ L-Pattern
        </button>
      </div>
    </div>
  );
}
