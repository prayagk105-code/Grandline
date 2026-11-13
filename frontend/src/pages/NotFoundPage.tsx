import React from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';

export const NotFoundPage: React.FC = () => {
  return (
    <AuthLayout>
      <h1>Page not found.</h1>
      <p className="mut" style={{ margin: '0 0 18px' }}>
        The view you are looking for does not exist or has moved.
      </p>
      <Link to="/" className="btn pri f">
        Return to Home
      </Link>
    </AuthLayout>
  );
};

