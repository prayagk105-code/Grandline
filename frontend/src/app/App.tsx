import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { FocusTimerProvider } from '../contexts/FocusTimerContext';
import { ToastProvider } from '../contexts/ToastContext';
import { AppRouter } from './router';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <FocusTimerProvider>
            <AppRouter />
          </FocusTimerProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;

