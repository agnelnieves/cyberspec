// The same tapered mark and angular lettering used in the social artwork.
// The parent link or heading provides the accessible name.
const letters = {
  C: "M40 7L33 0H7L0 7V53L7 60H33L40 53",
  Y: "M0 0V10L20 30L40 10V0M20 30V60",
  B: "M0 0H29L38 9V21L25 30L40 43V52L32 60H0ZM0 30H25",
  E: "M40 0H0V60H40M0 30H31",
  R: "M0 60V0H30L40 10V20L30 30H0M25 30L40 60",
  S: "M40 7L33 0H7L0 7V23L7 30H33L40 37V53L33 60H7L0 53",
  P: "M0 60V0H30L40 10V20L30 30H0",
} as const

export function Brand({ markOnly = false }: { markOnly?: boolean }) {
  return (
    <svg data-site-logo viewBox={markOnly ? "0 0 93 84" : "0 0 660 100"} width={markOnly ? 93 : 660} height={markOnly ? 84 : 100} aria-hidden="true" focusable="false">
      <path transform={markOnly ? undefined : "translate(0 8)"} d="M24 0H45L0 84ZM48 0H69L24 84ZM72 0H93L48 84Z" fill="currentColor" />
      {!markOnly && <g data-site-wordmark transform="translate(130 18.5) scale(1.05)" fill="none" stroke="currentColor" strokeWidth="5.6" strokeLinecap="square" strokeLinejoin="miter">
        {Array.from("CYBERSPEC", (letter, index) => (
          <path key={index} transform={`translate(${index * 57} 0)`} d={letters[letter as keyof typeof letters]} />
        ))}
      </g>}
    </svg>
  )
}
