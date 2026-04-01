export function NoodlrIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="16" fill="#18181b" />
      <path
        d="M32 58 C32 58 10 44 10 26 C10 15 20 8 32 8 C44 8 54 15 54 26 C54 44 32 58 32 58Z"
        fill="#f97316"
      />
      <path
        d="M20 28 L28 37 L44 20"
        stroke="white"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
