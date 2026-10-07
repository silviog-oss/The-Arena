/**
 * The Arena logo: an "A" chevron rising inside an arena ring.
 * Original mark — ring = the arena, chevron = rank ascent.
 */
export function LogoMark({ size = 40, glow = false, className = '' }) {
  const id = `lg-${size}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`logo-mark ${glow ? 'logo-glow' : ''} ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6ea8ff" />
          <stop offset="1" stopColor="#a66bff" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="38" fill="none" stroke={`url(#${id})`} strokeWidth="4.5" />
      <circle cx="50" cy="50" r="30" fill="none" stroke={`url(#${id})`} strokeWidth="1.2" opacity=".45" />
      <path
        d="M33 68 L50 32 L67 68"
        fill="none"
        stroke={`url(#${id})`}
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M42 56 H58" stroke={`url(#${id})`} strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

export function Wordmark({ size = 28 }) {
  return (
    <div className="wordmark">
      <LogoMark size={size} />
      <span>
        THE <b>ARENA</b>
      </span>
    </div>
  );
}
