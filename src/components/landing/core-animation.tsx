export function CoreAnimation() {
  return (
    <svg
      className="w-full h-full"
      viewBox="0 0 800 400"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="core-glow" height="140%" width="140%" x="-20%" y="-20%">
          <feGaussianBlur result="blur" stdDeviation="3" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Input paths */}
      <path d="M50 120 Q200 120 380 200" fill="none" stroke="color-mix(in srgb, var(--brand) 15%, transparent)" strokeWidth="1.5" />
      <path d="M50 200 H380" fill="none" stroke="color-mix(in srgb, var(--brand) 15%, transparent)" strokeWidth="1.5" />
      <path d="M50 280 Q200 280 380 200" fill="none" stroke="color-mix(in srgb, var(--brand) 15%, transparent)" strokeWidth="1.5" />

      {/* Input labels */}
      <text fill="color-mix(in srgb, var(--brand) 45%, transparent)" fontFamily="sans-serif" fontSize="10" fontWeight="600" letterSpacing="1" x="20" y="116">DATOS</text>
      <text fill="color-mix(in srgb, var(--brand) 45%, transparent)" fontFamily="sans-serif" fontSize="10" fontWeight="600" letterSpacing="1" x="20" y="196">WORKFLOWS</text>
      <text fill="color-mix(in srgb, var(--brand) 45%, transparent)" fontFamily="sans-serif" fontSize="10" fontWeight="600" letterSpacing="1" x="20" y="276">CANALES</text>

      {/* Input particles */}
      <circle fill="var(--brand)" r="2.5">
        <animateMotion dur="2.5s" path="M50 120 Q200 120 380 200" repeatCount="indefinite" />
        <animate attributeName="opacity" dur="2.5s" repeatCount="indefinite" values="0;1;0" />
      </circle>
      <circle fill="var(--brand)" r="2">
        <animateMotion begin="0.8s" dur="3s" path="M50 200 H380" repeatCount="indefinite" />
        <animate attributeName="opacity" dur="3s" repeatCount="indefinite" values="0;1;0" />
      </circle>
      <circle fill="var(--brand)" r="2.5">
        <animateMotion begin="1.2s" dur="2.8s" path="M50 280 Q200 280 380 200" repeatCount="indefinite" />
        <animate attributeName="opacity" dur="2.8s" repeatCount="indefinite" values="0;1;0" />
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
        <circle fill="var(--brand)" filter="url(#core-glow)" r="18">
          <animate attributeName="r" dur="2s" repeatCount="indefinite" values="16;20;16" />
        </circle>
        <text fill="var(--brand)" fontFamily="sans-serif" fontSize="11" fontWeight="700" letterSpacing="4" textAnchor="middle" y="80">MEDIA<tspan fontStyle="italic">Lab</tspan> OS</text>
      </g>

      {/* Refining loop */}
      <path d="M400 150 A50 50 0 1 1 399.9 150" fill="none" id="ml-loop-path" stroke="color-mix(in srgb, var(--brand) 8%, transparent)" strokeWidth="2" />
      <circle fill="var(--brand)" r="2.5">
        <animateMotion dur="2s" repeatCount="indefinite">
          <mpath href="#ml-loop-path" />
        </animateMotion>
        <animate attributeName="opacity" dur="2s" repeatCount="indefinite" values="0.2;0.9;0.2" />
      </circle>
      {/* Output paths */}
      <path d="M420 190 Q550 140 700 80" fill="none" stroke="color-mix(in srgb, var(--brand) 10%, transparent)" strokeWidth="1.5" />
      <path d="M420 200 H700" fill="none" stroke="color-mix(in srgb, var(--brand) 10%, transparent)" strokeWidth="1.5" />
      <path d="M420 210 Q550 260 700 320" fill="none" stroke="color-mix(in srgb, var(--brand) 10%, transparent)" strokeWidth="1.5" />

      {/* Output particles */}
      <circle fill="var(--brand)" r="2.5">
        <animateMotion dur="2.2s" path="M420 190 Q550 140 700 80" repeatCount="indefinite" />
        <animate attributeName="opacity" dur="2.2s" repeatCount="indefinite" values="0;1;0" />
      </circle>
      <circle fill="var(--brand)" r="2.5">
        <animateMotion begin="0.4s" dur="1.8s" path="M420 200 H700" repeatCount="indefinite" />
        <animate attributeName="opacity" dur="1.8s" repeatCount="indefinite" values="0;1;0" />
      </circle>
      <circle fill="var(--brand)" r="2.5">
        <animateMotion begin="0.8s" dur="2.5s" path="M420 210 Q550 260 700 320" repeatCount="indefinite" />
        <animate attributeName="opacity" dur="2.5s" repeatCount="indefinite" values="0;1;0" />
      </circle>

      {/* Output labels */}
      <text fill="var(--brand)" fontFamily="sans-serif" fontSize="11" fontWeight="700" x="710" y="85">REPORTING</text>
      <text fill="var(--brand)" fontFamily="sans-serif" fontSize="11" fontWeight="700" x="710" y="205">CAMPAIGNS</text>
      <text fill="var(--brand)" fontFamily="sans-serif" fontSize="11" fontWeight="700" x="710" y="325">AUTOMATION</text>
    </svg>
  );
}
