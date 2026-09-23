'use client';

const PETALS = [
  { left: '8%', size: 14, duration: 16, delay: 0, color: 'var(--rose)' },
  { left: '22%', size: 10, duration: 13, delay: 2.5, color: 'var(--gold)' },
  { left: '38%', size: 16, duration: 19, delay: 1, color: 'var(--sage)' },
  { left: '55%', size: 11, duration: 14, delay: 4, color: 'var(--rose)' },
  { left: '70%', size: 13, duration: 17, delay: 3, color: 'var(--bronze)' },
  { left: '85%', size: 10, duration: 15, delay: 5.5, color: 'var(--gold)' },
  { left: '92%', size: 15, duration: 20, delay: 0.5, color: 'var(--sage)' },
];

/** Very sparse, slow-drifting petal shapes. Decorative only — kept out of the DOM's tab order and hidden from screen readers. */
export default function PetalField() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {PETALS.map((p, i) => (
        <span
          key={i}
          className="petal"
          style={{
            left: p.left,
            width: p.size,
            height: p.size * 1.3,
            background: p.color,
            opacity: 0.4,
            borderRadius: '0 60% 0 60%',
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
