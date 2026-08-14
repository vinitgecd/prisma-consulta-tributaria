import React from 'react'

export const PrismaLogo: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Faceted Prism / Triangle Shape */}
      <polygon
        points="12,2 21,19 3,19"
        fill="#4E7A54"
        fillOpacity="0.25"
        stroke="#4E7A54"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <line x1="12" y1="2" x2="12" y2="19" stroke="#4E7A54" strokeWidth="1.5" />
      <line
        x1="12"
        y1="2"
        x2="7.5"
        y2="19"
        stroke="#4E7A54"
        strokeWidth="1.2"
        strokeDasharray="2 1"
      />
      <line
        x1="12"
        y1="2"
        x2="16.5"
        y2="19"
        stroke="#4E7A54"
        strokeWidth="1.2"
        strokeDasharray="2 1"
      />
      <polygon points="12,7 16,15 8,15" fill="#4E7A54" fillOpacity="0.4" />
    </svg>
  )
}
