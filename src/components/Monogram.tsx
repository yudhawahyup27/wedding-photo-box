export default function Monogram({ text = 'Y & I', className = '' }: { text?: string; className?: string }) {
  return <div className={`monogram-mark ${className}`}>{text}</div>;
}
