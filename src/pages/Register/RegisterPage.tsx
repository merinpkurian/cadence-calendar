import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User as UserIcon, Mail, Lock, Camera, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { AuthSplitLayout } from '../../components/layout/AuthSplitLayout/AuthSplitLayout';
import { Input } from '../../components/common/Input/Input';
import { Button } from '../../components/common/Button/Button';
import { validateEmail, evaluatePasswordStrength, validateAvatarFile } from '../../utils/validation';
import { ApiError } from '../../services/api';
import './RegisterPage.css';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Field errors
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [avatarError, setAvatarError] = useState('');
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const passwordStrength = evaluatePasswordStrength(password);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarError('');
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateAvatarFile(file);
    if (!validation.valid) {
      setAvatarError(validation.error || 'Invalid file');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setAvatarFile(file);
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');

    let hasError = false;

    if (!name.trim()) {
      setNameError('Full name is required');
      hasError = true;
    }

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
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      hasError = true;
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      hasError = true;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      hasError = true;
    }

    if (hasError) return;

    setIsLoading(true);
    try {
      await register({
        name,
        email,
        password,
        avatar: avatarFile,
      });
      navigate('/calendar', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setFormError('An account with this email already exists. Please log in.');
        } else {
          setFormError(err.message || 'Registration failed. Please check your information.');
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
      headline="Set up in under a minute. No credit card."
      supportingText="One calendar for your whole week — day, week, or month, whichever fits what you're planning."
    >
      <div className="register-card">
        <div className="register-header">
          <h2 className="register-title">Create your account</h2>
          <p className="register-subtitle">
            Already have one?{' '}
            <Link to="/login" className="register-login-link">
              Log in
            </Link>
          </p>
        </div>

        {formError && (
          <div className="auth-alert auth-alert--error" role="alert">
            <AlertCircle size={18} className="auth-alert__icon" />
            <span className="auth-alert__text">{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="register-form" noValidate>
          {/* Avatar Upload */}
          <div className="avatar-upload-group">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleAvatarChange}
              className="visually-hidden"
              id="avatar-upload-input"
            />
            <button
              type="button"
              className="avatar-upload-trigger"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Upload profile picture (optional)"
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar preview" className="avatar-upload-preview" />
              ) : (
                <div className="avatar-upload-placeholder">
                  <UserIcon size={30} className="avatar-upload-user-icon" />
                </div>
              )}
              <span className="avatar-upload-badge">
                <Camera size={13} className="avatar-upload-camera-icon" />
              </span>
            </button>
            <div className="avatar-upload-info">
              <p className="avatar-upload-text">
                Add a photo so teammates recognize you (optional).
              </p>
              {avatarError && <p className="avatar-upload-error">{avatarError}</p>}
            </div>
          </div>

          <Input
            label="Full name"
            placeholder="Jordan Alvarez"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError('');
            }}
            error={nameError}
            leftIcon={<UserIcon size={18} />}
            autoComplete="name"
          />

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

          {/* Password & Confirm side-by-side */}
          <div className="password-dual-row">
            <div className="password-dual-col">
              <div className="input-field">
                <label className="input-field__label" htmlFor="register-password">
                  Password
                </label>
                <div className="input-field__wrapper">
                  <span className="input-field__icon input-field__icon--left">
                    <Lock size={18} />
                  </span>
                  <input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="input-field__control input-field__control--has-left input-field__control--has-right"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError('');
                    }}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="input-field__toggle-pw"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {passwordError && <p className="input-field__error">{passwordError}</p>}
              </div>
            </div>

            <div className="password-dual-col">
              <div className="input-field">
                <label className="input-field__label" htmlFor="register-confirm">
                  Confirm
                </label>
                <div className="input-field__wrapper">
                  <input
                    id="register-confirm"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="input-field__control input-field__control--has-right"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (confirmPasswordError) setConfirmPasswordError('');
                    }}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="input-field__toggle-pw"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {confirmPasswordError && <p className="input-field__error">{confirmPasswordError}</p>}
              </div>
            </div>
          </div>

          {/* Password Strength Meter */}
          {password && (
            <div className="password-strength-indicator">
              <div className="strength-bars" aria-hidden="true">
                <span className={`strength-bar ${passwordStrength.score >= 1 ? 'strength-bar--active' : ''}`} />
                <span className={`strength-bar ${passwordStrength.score >= 2 ? 'strength-bar--active' : ''}`} />
                <span className={`strength-bar ${passwordStrength.score >= 3 ? 'strength-bar--active' : ''}`} />
                <span className={`strength-bar ${passwordStrength.score >= 4 ? 'strength-bar--active' : ''}`} />
              </div>
              <span className="strength-text">{passwordStrength.hint}</span>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="register-submit-btn"
          >
            Create account
          </Button>
        </form>

        <p className="register-terms">
          By continuing you agree to Cadence's Terms and Privacy Policy.
        </p>
      </div>
    </AuthSplitLayout>
  );
};
