const PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#eef0f6"/>' +
    '<g fill="none" stroke="#a5abc4" stroke-width="6" stroke-linejoin="round"><rect x="140" y="95" width="120" height="110" rx="10"/>' +
    '<path d="M140 190l35-35 30 28 20-18 35 30"/></g><circle cx="230" cy="125" r="9" fill="#a5abc4"/></svg>'
  );

export default function ProductImage({ src, alt, className = '' }) {
  return (
    <img
      className={className}
      src={src || PLACEHOLDER}
      alt={alt || ''}
      loading="lazy"
      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = PLACEHOLDER; }}
    />
  );
}
