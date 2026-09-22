import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { AuthSplitLayout } from '../../components/layout/AuthSplitLayout/AuthSplitLayout';
import { Input } from '../../components/common/Input/Input';
import { Button } from '../../components/common/Button/Button';
import { validateEmail } from '../../utils/validation';
import { ApiError } from '../../services/api';
import './LoginPage.css';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [stayLoggedIn, setStayLoggedIn] = useState(true);

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setEmailError('');
    setPasswordError('');

    let hasError = false;

    if (!email.trim()) {
      setEmailError('Email is required');
      hasError = true;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      hasError = true;
    }

    if (!password) {
      setPasswordError('Password is required');
      hasError = true;
    }

    if (hasError) return;

    setIsLoading(true);
    try {
      await login({ email, password }, stayLoggedIn);
      navigate('/calendar', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setFormError('Invalid email or password. Please try again.');
        } else {
          setFormError(err.message || 'Unable to log in. Please try again later.');
        }
      } else {
        setFormError('Network error. Please check your connection.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthSplitLayout
      headline="A schedule that moves as fast as your day does."
      supportingText="Drag to reschedule, resize to adjust — every change syncs the moment you let go."
    >
      <div className="login-card">
        <div className="login-header">
          <h2 className="login-title">Welcome back</h2>
          <p className="login-subtitle">Log in to see what's on today.</p>
        </div>

        {/* Visual Google Login Button */}
        <button
          type="button"
          className="google-btn"
          onClick={() => {
            /* Out of scope: visual only */
          }}
          aria-label="Continue with Google (visual demo)"
        >
          <svg className="google-icon" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="auth-divider">
          <span className="auth-divider__line" />
          <span className="auth-divider__text">OR</span>
          <span className="auth-divider__line" />
        </div>

        {formError && (
          <div className="auth-alert auth-alert--error" role="alert">
            <AlertCircle size={18} className="auth-alert__icon" />
            <span className="auth-alert__text">{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          <Input
            label="Email"
            type="email"
            placeholder="you@planetmedia.in"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError('');
            }}
            error={emailError}
            leftIcon={<Mail size={18} />}
            autoComplete="email"
          />

          <div className="password-input-group">
            <div className="password-input-header">
              <span className="password-input-header__label">Password</span>
              <button
                type="button"
                className="forgot-password-link"
                onClick={() => {
                  /* Out of scope: visual only */
                }}
              >
                Forgot?
              </button>
            </div>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError('');
              }}
              error={passwordError}
              leftIcon={<Lock size={18} />}
              autoComplete="current-password"
            />
          </div>

          <div className="login-options">
            <label className="checkbox-control">
              <input
                type="checkbox"
                checked={stayLoggedIn}
                onChange={(e) => setStayLoggedIn(e.target.checked)}
                className="checkbox-control__input"
              />
              <span className="checkbox-control__indicator" />
              <span className="checkbox-control__label">Stay logged in for 30 days</span>
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="login-submit-btn"
          >
            Log in
          </Button>
        </form>

        <p className="auth-switch">
          New to Cadence?{' '}
          <Link to="/register" className="auth-switch__link">
            Create an account
          </Link>
        </p>
      </div>
    </AuthSplitLayout>
  );
};
