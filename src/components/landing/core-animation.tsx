export function CoreAnimation() {
  return (
    <svg
      className="w-full h-full overflow-visible"
      viewBox="0 0 800 400"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="core-glow" height="140%" width="140%" x="-20%" y="-20%">
          <feGaussianBlur result="blur" stdDeviation="3" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        {/* Horizontal fade: lines dissolve toward the left/right screen edges */}
        <linearGradient id="edge-fade-grad" gradientUnits="userSpaceOnUse" x1="-200" y1="0" x2="1000" y2="0">
          <stop offset="0" stopColor="black" />
          <stop offset="0.2" stopColor="white" />
          <stop offset="0.8" stopColor="white" />
          <stop offset="1" stopColor="black" />
        </linearGradient>
        <mask id="edge-fade" maskUnits="userSpaceOnUse" x="-200" y="0" width="1200" height="400">
          <rect x="-200" y="0" width="1200" height="400" fill="url(#edge-fade-grad)" />
        </mask>
      </defs>

      {/* Input paths */}
      <g mask="url(#edge-fade)">
        <path id="in-1" d="M-200 80 Q200 80 380 200" fill="none" stroke="color-mix(in srgb, var(--brand) 15%, transparent)" strokeWidth="1.5" />
        <path id="in-2" d="M-200 200 H380" fill="none" stroke="color-mix(in srgb, var(--brand) 15%, transparent)" strokeWidth="1.5" />
        <path id="in-3" d="M-200 320 Q200 320 380 200" fill="none" stroke="color-mix(in srgb, var(--brand) 15%, transparent)" strokeWidth="1.5" />
      </g>

      {/* Input particles */}
      <circle fill="var(--brand)" r="2.5">
        <animateMotion dur="2.5s" repeatCount="indefinite">
          <mpath href="#in-1" />
        </animateMotion>
      </circle>
      <circle fill="var(--brand)" r="2">
        <animateMotion begin="0.8s" dur="3s" repeatCount="indefinite">
          <mpath href="#in-2" />
        </animateMotion>
      </circle>
      <circle fill="var(--brand)" r="2.5">
        <animateMotion begin="1.2s" dur="2.8s" repeatCount="indefinite">
          <mpath href="#in-3" />
        </animateMotion>
      </circle>

      {/* Core */}
      <g transform="translate(400,200)">
        <circle fill="none" r="50" stroke="var(--brand)" strokeWidth="0.5">
          <animate attributeName="r" dur="4s" repeatCount="indefinite" values="48;55;48" />
          <animate attributeName="opacity" dur="4s" repeatCount="indefinite" values="0.08;0.22;0.08" />
        </circle>
        <circle fill="none" r="30" stroke="var(--brand)" strokeDasharray="4 4" strokeWidth="1" opacity="0.3">
          <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="10s" repeatCount="indefinite" />
        </circle>
        <g opacity="0.24">
          <animateTransform attributeName="transform" type="rotate" from="360" to="0" dur="14s" repeatCount="indefinite" />
          {/* Segmented arc ring: three rounded arcs */}
          <circle r="38" fill="none" stroke="var(--brand)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="60 19.6" />
          {/* Radial ticks between the segments */}
          <circle r="44" fill="none" stroke="var(--brand)" strokeWidth="4" strokeDasharray="1.5 21.54" />
        </g>
        <circle fill="var(--brand)" filter="url(#core-glow)" r="18">
          <animate attributeName="r" dur="2s" repeatCount="indefinite" values="16;20;16" />
        </circle>
      </g>

      {/* Output paths */}
      <g mask="url(#edge-fade)">
        <path id="out-1" d="M420 200 Q600 80 1000 80" fill="none" stroke="color-mix(in srgb, var(--brand) 10%, transparent)" strokeWidth="1.5" />
        <path id="out-2" d="M420 200 H1000" fill="none" stroke="color-mix(in srgb, var(--brand) 10%, transparent)" strokeWidth="1.5" />
        <path id="out-3" d="M420 200 Q600 320 1000 320" fill="none" stroke="color-mix(in srgb, var(--brand) 10%, transparent)" strokeWidth="1.5" />
      </g>

      {/* Output particles */}
      <circle fill="var(--brand)" r="2.5">
        <animateMotion dur="2.2s" repeatCount="indefinite">
          <mpath href="#out-1" />
        </animateMotion>
      </circle>
      <circle fill="var(--brand)" r="2.5">
        <animateMotion begin="0.4s" dur="1.8s" repeatCount="indefinite">
          <mpath href="#out-2" />
        </animateMotion>
      </circle>
      <circle fill="var(--brand)" r="2.5">
        <animateMotion begin="0.8s" dur="2.5s" repeatCount="indefinite">
          <mpath href="#out-3" />
        </animateMotion>
      </circle>
    </svg>
  );
}
