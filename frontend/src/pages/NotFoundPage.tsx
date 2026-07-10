import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="shell hero">
      <div className="container">
        <div className="panel" style={{ padding: 32 }}>
          <h1>Page not found</h1>
          <p className="muted">The page you were looking for does not exist.</p>
          <Link to="/app" className="btn btn-primary">
            Return to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

