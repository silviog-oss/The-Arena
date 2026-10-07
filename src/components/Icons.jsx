/** Minimal stroke icon set (inline SVG, no icon font → offline-safe). */
const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };

const paths = {
  home: <><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" /></>,
  missions: <><path d="M4 4h16v16H4z" /><path d="M8 9h8M8 13h8M8 17h5" /></>,
  stats: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
  library: <><path d="M5 4h11a3 3 0 013 3v13H8a3 3 0 01-3-3z" /><path d="M5 17a3 3 0 013-3h11" /></>,
  profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></>,
  play: <path d="M7 4l13 8-13 8z" fill="currentColor" stroke="none" />,
  pause: <><path d="M8 5v14M16 5v14" strokeWidth="3" /></>,
  next: <><path d="M5 5l10 7-10 7z" fill="currentColor" stroke="none" /><path d="M19 5v14" strokeWidth="2.4" /></>,
  prev: <><path d="M19 5L9 12l10 7z" fill="currentColor" stroke="none" /><path d="M5 5v14" strokeWidth="2.4" /></>,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  back: <path d="M15 5l-7 7 7 7" />,
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  lock: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></>,
  flame: <path d="M12 3c1 4 5 5.5 5 10a5 5 0 01-10 0c0-2 1-3.5 2-4.5.3 2 1.3 3 2.5 3-1-3 .5-6 .5-8.5z" />,
  bolt: <path d="M13 2L4 14h7l-1 8 9-12h-7z" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  bell: <><path d="M6 16V11a6 6 0 0112 0v5l2 2H4z" /><path d="M10 20a2 2 0 004 0" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  chevron: <path d="M9 6l6 6-6 6" />,
  download: <><path d="M12 4v11M7 10l5 5 5-5" /><path d="M5 20h14" /></>,
  upload: <><path d="M12 15V4M7 9l5-5 5 5" /><path d="M5 20h14" /></>,
  trophy: <><path d="M8 4h8v5a4 4 0 01-8 0z" /><path d="M8 6H5a3 3 0 003 4M16 6h3a3 3 0 01-3 4M12 13v4M8 20h8" /></>,
  share: <><path d="M12 15V3M8 7l4-4 4 4" /><path d="M5 12v8h14v-8" /></>,
  warning: <><path d="M12 3l10 18H2z" /><path d="M12 10v5M12 18v.5" /></>,
};

export function Icon({ name, size = 22, className = '', ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={`icon ${className}`} aria-hidden="true" {...rest}>
      {paths[name]}
    </svg>
  );
}
