/**
 * SimulatedMap — static, non-interactive map background.
 * Pure white base, thin gray streets (irregular blocks), soft blue open areas,
 * subtle neighborhood labels, and a floating header with menu + "On Trip".
 */
export function SimulatedMap({ title = "On Trip" }: { title?: string }) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-white">
      <svg
        viewBox="0 0 400 700"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        {/* Soft blue open areas (park / river) */}
        <path
          d="M -20 120 C 40 100, 90 160, 150 130 C 210 100, 250 170, 220 220 C 190 270, 110 260, 60 240 C 20 225, -10 200, -20 170 Z"
          fill="#EFF6FF"
        />
        <path
          d="M 260 460 C 310 430, 360 470, 400 450 L 420 720 L 220 720 C 230 640, 240 540, 260 460 Z"
          fill="#EFF6FF"
        />
        <path
          d="M 0 560 C 60 540, 130 590, 180 570 L 200 720 L -20 720 Z"
          fill="#EFF6FF"
        />

        {/* Arterial roads — thicker mid-gray */}
        <g stroke="#CBD5E1" strokeWidth="2.6" fill="none" strokeLinecap="round">
          <path d="M -20 300 C 80 290, 170 320, 260 300 C 330 285, 380 305, 420 295" />
          <path d="M 180 -20 C 190 120, 160 230, 200 360 C 235 470, 210 600, 220 740" />
          <path d="M -20 480 C 90 470, 200 500, 300 470 C 360 452, 400 470, 420 465" />
          <path d="M 60 -20 C 70 100, 110 180, 90 300 C 70 430, 100 560, 80 740" />
        </g>

        {/* Minor streets — thin light gray, irregular */}
        <g stroke="#E2E8F0" strokeWidth="1.4" fill="none" strokeLinecap="round">
          <path d="M 0 60 C 60 55, 130 75, 200 62 C 270 50, 330 70, 400 60" />
          <path d="M 0 170 C 70 160, 140 185, 210 172 C 280 160, 340 180, 400 170" />
          <path d="M 0 230 L 400 235" />
          <path d="M 0 380 C 80 375, 160 395, 240 380 C 310 368, 360 385, 400 380" />
          <path d="M 0 420 L 400 425" />
          <path d="M 0 540 C 70 535, 150 555, 230 540 C 300 528, 360 545, 400 540" />
          <path d="M 0 620 L 400 618" />
          <path d="M 0 680 C 80 672, 170 690, 260 678 C 330 668, 370 682, 400 678" />

          <path d="M 30 -20 L 40 740" />
          <path d="M 110 -20 C 118 200, 100 380, 120 740" />
          <path d="M 140 -20 L 155 740" />
          <path d="M 220 -20 C 230 180, 210 380, 240 740" />
          <path d="M 280 -20 C 290 200, 270 420, 300 740" />
          <path d="M 340 -20 L 355 740" />
          <path d="M 380 -20 L 388 740" />

          {/* Diagonals for irregular blocks */}
          <path d="M 20 100 L 200 260" />
          <path d="M 240 40 L 90 220" />
          <path d="M 260 340 L 400 420" />
          <path d="M 40 500 L 260 640" />
          <path d="M 300 520 L 400 660" />
        </g>

        {/* Neighborhood labels — very subtle */}
        <g
          fill="#94A3B8"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          fontSize="10"
          letterSpacing="1.4"
          fontWeight={600}
        >
          <text x="70" y="90">PARK WEST</text>
          <text x="240" y="200">NORTH HILL</text>
          <text x="70" y="360">MIDTOWN</text>
          <text x="260" y="410">EAST END</text>
          <text x="60" y="520">RIVERSIDE</text>
          <text x="240" y="600">SOUTH BAY</text>
        </g>
      </svg>

      {/* Floating header */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center px-4 pt-5">
        <button
          type="button"
          aria-label="Menu"
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.08)]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2.2" strokeLinecap="round">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        <div className="flex-1 text-center text-[15px] font-bold text-[#111827]">
          {title}
        </div>
        <div className="h-10 w-10" aria-hidden />
      </div>
    </div>
  );
}
