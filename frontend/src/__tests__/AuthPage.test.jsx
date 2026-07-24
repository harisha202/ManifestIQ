import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AuthPage from '../AuthPage';
import { ToastProvider } from '../ToastContext';

describe('AuthPage', () => {
  it('renders login form by default', () => {
    render(
      <BrowserRouter>
        <ToastProvider>
          <AuthPage />
        </ToastProvider>
      </BrowserRouter>
    );
    
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email or Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  it('switches to signup form', () => {
    render(
      <BrowserRouter>
        <ToastProvider>
          <AuthPage />
        </ToastProvider>
      </BrowserRouter>
    );
    
    const toggleButton = screen.getByRole('button', { name: 'Sign Up' });
    fireEvent.click(toggleButton);
    
    expect(screen.getByPlaceholderText('you@company.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('johndoe')).toBeInTheDocument();
  });
});
