/**
 * Icons — inline SVG icon set for TinySenpai session UI.
 *
 * All icons are 24×24 viewBox, stroke-based, currentColor.
 * Caller controls size via width/height prop (default 18), color via parent CSS `color`.
 *
 * Replace emoji usages with these for consistent visual language.
 */

const base = (size) => ({
  width: size, height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
});

export const IconPlay = ({ size = 18 }) => (
  <svg {...base(size)}><path d="M6 4.5v15l13-7.5L6 4.5z" fill="currentColor" stroke="none"/></svg>
);

export const IconSlowPlay = ({ size = 18 }) => (
  <svg {...base(size)}>
    <path d="M6 4.5v15l9-7.5L6 4.5z" fill="currentColor" stroke="none"/>
    <path d="M17 8v8M20 9v6" />
  </svg>
);

export const IconEar = ({ size = 18 }) => (
  <svg {...base(size)}>
    <path d="M7 14a5 5 0 1110 0c0 2-1 3-2 4s-2 2-2 3a2 2 0 11-4 0"/>
    <path d="M11 10a2 2 0 114 0c0 1-1 1.5-1.5 2"/>
  </svg>
);

export const IconBulb = ({ size = 18 }) => (
  <svg {...base(size)}>
    <path d="M9 18h6M10 21h4"/>
    <path d="M12 3a6 6 0 00-4 10.5c.8.8 1.2 1.5 1.3 2.5h5.4c.1-1 .5-1.7 1.3-2.5A6 6 0 0012 3z"/>
  </svg>
);

export const IconBlock = ({ size = 18 }) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="9"/>
    <path d="M5.5 5.5l13 13"/>
  </svg>
);

export const IconEye = ({ size = 18 }) => (
  <svg {...base(size)}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

export const IconSkip = ({ size = 18 }) => (
  <svg {...base(size)}>
    <path d="M5 5l7 7-7 7V5zM13 5l7 7-7 7V5z" fill="currentColor" stroke="none"/>
  </svg>
);

export const IconBackspace = ({ size = 18 }) => (
  <svg {...base(size)}>
    <path d="M8 5h12a2 2 0 012 2v10a2 2 0 01-2 2H8l-6-7 6-7z"/>
    <path d="M12 10l5 5M17 10l-5 5"/>
  </svg>
);

export const IconCheck = ({ size = 18 }) => (
  <svg {...base(size)}><path d="M4 12l5 5L20 6"/></svg>
);

export const IconArrowRight = ({ size = 18 }) => (
  <svg {...base(size)}>
    <path d="M5 12h14M13 6l6 6-6 6"/>
  </svg>
);

export const IconMic = ({ size = 18 }) => (
  <svg {...base(size)}>
    <rect x="9" y="3" width="6" height="11" rx="3"/>
    <path d="M5 11a7 7 0 0014 0M12 18v3"/>
  </svg>
);

export const IconSparkle = ({ size = 18 }) => (
  <svg {...base(size)}>
    <path d="M12 3l1.8 4.8L18 9.6l-4.2 1.8L12 16l-1.8-4.6L6 9.6l4.2-1.8L12 3z"/>
  </svg>
);

export const IconRefresh = ({ size = 18 }) => (
  <svg {...base(size)}>
    <path d="M20 8a8 8 0 00-14-4M4 6v4h4M4 16a8 8 0 0014 4M20 18v-4h-4"/>
  </svg>
);

export const IconX = ({ size = 18 }) => (
  <svg {...base(size)}><path d="M6 6l12 12M18 6L6 18"/></svg>
);

export const IconVolume = ({ size = 18 }) => (
  <svg {...base(size)}>
    <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none"/>
    <path d="M16 8a5 5 0 010 8M19 5a9 9 0 010 14"/>
  </svg>
);
