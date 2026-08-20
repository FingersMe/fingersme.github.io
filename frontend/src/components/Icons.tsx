// Brand icon set — custom inline SVGs (no emoji), themed via currentColor so each picks up
// its tab/accent color. Playful Fingers vibe: crown, drumstick, dice, vault, gift, coin, swap.
type P = { size?: number; className?: string };
const base = (size: number, className?: string) => ({
  width: size, height: size, viewBox: "0 0 24 24", fill: "none",
  xmlns: "http://www.w3.org/2000/svg", className,
  stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
});

export const IconHow = ({ size = 20, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z" />
    <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5A1.5 1.5 0 0 0 20 18.5z" />
    <path d="M7 8h1.5M7 11h1.5M15.5 8H17M15.5 11H17" />
  </svg>
);

// Crown — the Winner
export const IconPlay = ({ size = 20, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M3 8l3.5 3L12 5l5.5 6L21 8l-1.6 9.2a1 1 0 0 1-1 .8H5.6a1 1 0 0 1-1-.8z" fill="currentColor" fillOpacity="0.14" />
    <circle cx="3" cy="8" r="1.3" fill="currentColor" /><circle cx="21" cy="8" r="1.3" fill="currentColor" /><circle cx="12" cy="4.4" r="1.3" fill="currentColor" />
  </svg>
);

// Swap — two curved arrows
export const IconSwap = ({ size = 20, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M4 8h13l-3-3M20 16H7l3 3" />
  </svg>
);

// Gallery — framed picture
export const IconGallery = ({ size = 20, className }: P) => (
  <svg {...base(size, className)}>
    <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
    <circle cx="8.5" cy="9.5" r="1.6" fill="currentColor" />
    <path d="M4 17l4.5-4.5L13 16l3-2.5L20 17" />
  </svg>
);

// Vault / lock — staking
export const IconStake = ({ size = 20, className }: P) => (
  <svg {...base(size, className)}>
    <rect x="4" y="10" width="16" height="10" rx="2.5" fill="currentColor" fillOpacity="0.12" />
    <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
    <circle cx="12" cy="15" r="1.5" fill="currentColor" /><path d="M12 16.5V18" />
  </svg>
);

// Gift — claim
export const IconClaim = ({ size = 20, className }: P) => (
  <svg {...base(size, className)}>
    <rect x="4" y="10" width="16" height="9" rx="1.6" fill="currentColor" fillOpacity="0.12" />
    <path d="M3.5 7.5h17V10h-17zM12 7.5V19" />
    <path d="M12 7.5S10.5 4 8.6 4.6 8 7.5 12 7.5zM12 7.5S13.5 4 15.4 4.6 16 7.5 12 7.5z" />
  </svg>
);

// Coin — $FINGERS
export const IconCoin = ({ size = 20, className }: P) => (
  <svg {...base(size, className)}>
    <ellipse cx="12" cy="12" rx="8" ry="8" fill="currentColor" fillOpacity="0.12" />
    <path d="M14.5 9.2c-.6-.9-1.6-1.4-2.7-1.4-1.7 0-2.8 1-2.8 2.2 0 3 5.8 1.4 5.8 4.3 0 1.3-1.2 2.3-3 2.3-1.3 0-2.4-.5-3-1.5M12 6.2v1.6M12 16.3v1.6" />
  </svg>
);

// Wrench+shield — owner console
export const IconAdmin = ({ size = 20, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M12 3l7 2.2v5.3c0 4.2-2.9 7.4-7 8.5-4.1-1.1-7-4.3-7-8.5V5.2z" fill="currentColor" fillOpacity="0.12" />
    <path d="M14.3 8.6a2.4 2.4 0 0 1-3 3l-2.1 2.1 1.1 1.1 2.1-2.1a2.4 2.4 0 0 1 3-3z" />
  </svg>
);

// Drumstick — logo/brand flourish
export const IconDrumstick = ({ size = 20, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M14.5 4.5a4.8 4.8 0 0 1 1.2 7.8c-1.7 1.7-3.3 1.5-4.6 2.2s-1.9 2.8-3.7 3.1a2.6 2.6 0 0 1-3-3c.3-1.8 2.4-2.4 3.1-3.7s.5-2.9 2.2-4.6a4.8 4.8 0 0 1 4.8-1.8z" fill="currentColor" fillOpacity="0.16" />
    <path d="M7.2 14.6l-2.1 2.1M5.7 16.1l1.6 1.6" />
  </svg>
);
