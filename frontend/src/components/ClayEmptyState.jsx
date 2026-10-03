
const ClayEmptyState = ({ title, description, icon, action }) => {
  return (
    <div className="clay-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
      {icon && (
        <div style={{ fontSize: '4rem', marginBottom: '1.5rem', opacity: 0.8 }}>
          {icon}
        </div>
      )}
      <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem' }}>
        {title}
      </h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '2rem', maxWidth: '500px', margin: '0 auto 2rem' }}>
        {description}
      </p>
      {action && (
        <div>
          {action}
        </div>
      )}
    </div>
  );
};

export default ClayEmptyState;
