/** The soft five-lobed "done" badge from the Claim submitted / Payment set up screens. */
export function SuccessBlob({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 420 420" className={`animate-pop ${className}`} aria-hidden>
      <path
        fill="#4CF52A"
        d="M195 30.6C164.5 35.2 142.9 45.6 120 66.5 109.1 76.6 101.9 81.9 90 88.5 71.1 99.1 57.4 110.8 46 126.1 29.3 148.5 19.9 179.3 21.3 206.6c1 19 4.3 31.9 13.2 51.5 6.4 14 8.5 20.6 11.9 37.3 5.8 28.4 16.7 49 36 68.1 18.6 18.5 41.5 30.3 67.9 35 8.3 1.5 12.5 1.6 26.5 1 21-1 44-1 65.1 0 18.4.8 28.7-.4 43.5-5.1 38.6-12.4 69.7-43.1 82.3-81.4 1.2-3.6 3.3-12.1 4.7-18.9 2.8-14 5.9-23.4 13.4-40.2 14.7-33.3 15.5-67.8 2.2-100.3-11.5-28.3-30.8-49.3-60.1-65.5-12.1-6.7-17.1-10.4-29.6-21.6-12.8-11.5-20.5-17-31.9-22.7-18.1-9.1-38-13.8-58.1-13.5-6 .1-12 .3-13.4.5Z"
      />
      <path
        d="m110 210 76 76 124-126"
        fill="none"
        stroke="#000"
        strokeWidth="24"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
