import * as React from 'react';

// Browser motion over Ada's approved still; no generated video or paid service.
const STARS = [
  [16, 19, 0], [29, 33, 1.7], [41, 12, 3.2], [56, 27, 0.9],
  [72, 16, 2.4], [85, 38, 4.1], [34, 45, 2.8], [65, 43, 1.2],
];
const FIREFLIES = [
  [19, 82, 0, 9], [31, 72, 3, 12], [44, 91, 6, 10],
  [59, 78, 2, 11], [71, 88, 5, 13], [83, 68, 7, 10],
];

export function QuietScene() {
  const [paused, setPaused] = React.useState(false);
  const [motionReady, setMotionReady] = React.useState(false);

  React.useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setPaused(preference.matches);
    updatePreference();
    setMotionReady(true);
    preference.addEventListener('change', updatePreference);
    return () => preference.removeEventListener('change', updatePreference);
  }, []);

  return (
    <div className="quiet-scene" data-paused={paused} data-motion-ready={motionReady}>
      <div className="quiet-scene__frame">
        <img
          className="quiet-scene__image"
          src="/media/my-safety-woman.png"
          alt="A woman with long, straight black hair sits at her laptop among flowers and books beneath a starry sky."
          width={1576}
          height={998}
          loading="lazy"
          decoding="async"
        />
        <div className="quiet-scene__stars" aria-hidden="true">
          {STARS.map(([x, y, delay], index) => (
            <span
              key={index}
              className="quiet-scene__star"
              style={{ left: `${x}%`, top: `${y}%`, animationDelay: `-${delay}s` }}
            />
          ))}
        </div>
        <div className="quiet-scene__fireflies" aria-hidden="true">
          {FIREFLIES.map(([x, y, delay, duration], index) => (
            <span
              key={index}
              className="quiet-scene__firefly"
              style={{
                left: `${x}%`, top: `${y}%`,
                animationDelay: `-${delay}s`, animationDuration: `${duration}s`,
              }}
            />
          ))}
        </div>
      </div>
      <button
        type="button"
        className="quiet-scene__control"
        aria-label={paused ? 'Play scene animation' : 'Pause scene animation'}
        onClick={() => setPaused(value => !value)}
      >
        <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" aria-hidden="true">
          {paused
            ? <path d="M6 4.5v11l9-5.5z" />
            : <path d="M5 4h3v12H5zm7 0h3v12h-3z" />}
        </svg>
      </button>
    </div>
  );
}
