/** One component for empty states and error states. */
export default function StateMessage({ type = 'empty', title, message, children }) {
  return (
    <div className={`state state-${type}`} role={type === 'error' ? 'alert' : undefined}>
      <div className="state-icon" aria-hidden="true">{type === 'error' ? '⚠️' : '🛍️'}</div>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {children && <div className="state-actions">{children}</div>}
    </div>
  );
}
