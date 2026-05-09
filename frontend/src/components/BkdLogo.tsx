export default function BkdLogo({ className = "w-10 h-10 text-brand-600" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Outer Hexagon */}
      <polygon 
        points="50,4 90,27 90,73 50,96 10,73 10,27" 
        stroke="currentColor" 
        strokeWidth="8" 
        strokeLinejoin="round"
      />
      {/* Inner Y lines */}
      <line x1="50" y1="50" x2="50" y2="96" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
      <line x1="50" y1="50" x2="10" y2="27" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
      <line x1="50" y1="50" x2="90" y2="27" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
      
      {/* Letters */}
      <text x="50" y="31" fontSize="28" fontWeight="800" fontFamily="sans-serif" fill="currentColor" textAnchor="middle" dominantBaseline="middle">B</text>
      <text x="30" y="66" fontSize="28" fontWeight="800" fontFamily="sans-serif" fill="currentColor" textAnchor="middle" dominantBaseline="middle">K</text>
      <text x="70" y="66" fontSize="28" fontWeight="800" fontFamily="sans-serif" fill="currentColor" textAnchor="middle" dominantBaseline="middle">D</text>
    </svg>
  );
}
