import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, User as UserIcon, Lock, Bell, Camera } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { profileService } from '../../services/profileService';
import { getAvatarUrl, ApiError } from '../../services/api';
import { validateEmail, validateAvatarFile, evaluatePasswordStrength } from '../../utils/validation';
import { Button } from '../../components/common/Button/Button';
import { Input } from '../../components/common/Input/Input';
import './SettingsPage.css';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const { showToast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active navigation tab ('account' is implemented; 'security' & 'notifications' are out of scope)
  const [activeTab, setActiveTab] = useState<'account' | 'security' | 'notifications'>('account');

  // Profile Details Form State
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string>('');
  const [nameError, setNameError] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);

  // Synchronize initial form state when user loads without cascading effect renders
  const [prevUser, setPrevUser] = useState(user);
  if (user && user !== prevUser) {
    setPrevUser(user);
    setName(user.name);
    setEmail(user.email);
  }

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPasswordError, setCurrentPasswordError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [signOutOtherSessions, setSignOutOtherSessions] = useState(true);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const passwordStrength = evaluatePasswordStrength(newPassword);

  // Compute initials from user name
  const getInitials = (fullName?: string) => {
    if (!fullName) return 'U';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return fullName.slice(0, 2).toUpperCase();
  };

  // Format member since info
  const formatMemberSince = (iso?: string) => {
    if (!iso) return 'Member since Sep 2026';
    try {
      const d = new Date(iso);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `Member since ${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch {
      return 'Member since Sep 2026';
    }
  };

  // Handle avatar file selection
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarError('');
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateAvatarFile(file);
    if (!validation.valid) {
      setAvatarError(validation.error || 'Invalid image file.');
      return;
    }

    setAvatarFile(file);
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
  };

  // Handle Save Profile Changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError('');
    setEmailError('');
    setAvatarError('');

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

    if (hasError) return;

    setIsSavingProfile(true);
    try {
      const updatedUser = await profileService.updateProfile({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        avatar: avatarFile,
      });

      setUser(updatedUser);
      setAvatarFile(null);
      showToast('Profile updated successfully.', 'success');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setEmailError('This email is already in use by another account.');
          showToast('Email already in use.', 'error');
        } else if (err.status === 400) {
          showToast(err.message || 'Invalid profile information.', 'error');
        } else {
          showToast(err.message || 'Failed to update profile.', 'error');
        }
      } else {
        showToast('Failed to update profile. Please try again.', 'error');
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Change Password Submit
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPasswordError('');
    setNewPasswordError('');
    setConfirmPasswordError('');

    let hasError = false;
    if (!currentPassword) {
      setCurrentPasswordError('Current password is required');
      hasError = true;
    }

    if (!newPassword) {
      setNewPasswordError('New password is required');
      hasError = true;
    } else if (newPassword.length < 8) {
      setNewPasswordError('Password must be at least 8 characters');
      hasError = true;
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your new password');
      hasError = true;
    } else if (newPassword !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      hasError = true;
    }

    if (hasError) return;

    setIsUpdatingPassword(true);
    try {
      await profileService.changePassword({
        currentPassword,
        newPassword,
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Password changed successfully.', 'success');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setCurrentPasswordError('Current password is incorrect.');
          showToast('Current password is incorrect.', 'error');
        } else if (err.status === 400) {
          setNewPasswordError(err.message || 'Password must be at least 8 characters.');
          showToast(err.message || 'Invalid password.', 'error');
        } else {
          showToast(err.message || 'Failed to change password.', 'error');
        }
      } else {
        showToast('Failed to change password. Please try again.', 'error');
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const currentAvatarUrl = avatarPreview || getAvatarUrl(user?.avatarUrl);
  const initials = getInitials(user?.name || name);

  return (
    <div className="settings-layout">
      {/* Top White Header */}
      <header className="settings-header">
        <div className="settings-header__inner">
          <button
            type="button"
            className="settings-header__back-btn"
            onClick={() => navigate('/calendar')}
            aria-label="Back to calendar"
          >
            <ChevronLeft size={18} />
          </button>
          <h1 className="settings-header__title">Settings</h1>
        </div>
      </header>

      {/* Main Settings Body */}
      <main className="settings-main">
        <div className="settings-container">
          {/* Left Navigation Tabs */}
          <nav className="settings-nav" aria-label="Settings navigation">
            <button
              type="button"
              className={`settings-nav__item ${activeTab === 'account' ? 'settings-nav__item--active' : ''}`}
              onClick={() => setActiveTab('account')}
            >
              <UserIcon size={16} />
              <span>Account</span>
            </button>

            <button
              type="button"
              className="settings-nav__item settings-nav__item--disabled"
              onClick={() => showToast('Security settings are currently out of scope.', 'info')}
              title="Security settings are currently out of scope"
            >
              <Lock size={16} />
              <span>Security</span>
            </button>

            <button
              type="button"
              className="settings-nav__item settings-nav__item--disabled"
              onClick={() => showToast('Notification settings are currently out of scope.', 'info')}
              title="Notification settings are currently out of scope"
            >
              <Bell size={16} />
              <span>Notifications</span>
            </button>
          </nav>

          {/* Right Content Area */}
          <div className="settings-content">
            {/* Card 1: Profile Details */}
            <section className="settings-card" aria-labelledby="profile-details-title">
              <div className="settings-card__header">
                <h2 id="profile-details-title" className="settings-card__title">
                  Profile details
                </h2>
                <p className="settings-card__subtitle">How you appear to your team.</p>
              </div>

              {/* Avatar + Name Preview */}
              <div className="profile-user-row">
                <div className="profile-avatar-wrap">
                  {currentAvatarUrl ? (
                    <img
                      src={currentAvatarUrl}
                      alt={user?.name || 'User avatar'}
                      className="profile-avatar"
                    />
                  ) : (
                    <div className="profile-avatar" aria-label={user?.name || 'User'}>
                      {initials}
                    </div>
                  )}

                  <button
                    type="button"
                    className="profile-camera-btn"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Upload new profile photo"
                    title="Upload new profile photo"
                  >
                    <Camera size={12} />
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    style={{ display: 'none' }}
                    onChange={handleAvatarSelect}
                  />
                </div>

                <div className="profile-meta">
                  <span className="profile-name">{user?.name || name || 'User'}</span>
                  <span className="profile-member-since">{formatMemberSince(user?.createdAt)}</span>
                </div>
              </div>

              {avatarError && <p className="profile-avatar-error">{avatarError}</p>}

              {/* Profile Details Form */}
              <form onSubmit={handleSaveProfile} noValidate>
                <div className="settings-fields-grid">
                  <Input
                    label="Full name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (nameError) setNameError('');
                    }}
                    error={nameError}
                    placeholder="e.g. Jordan Alvarez"
                    autoComplete="name"
                  />

                  <Input
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError('');
                    }}
                    error={emailError}
                    placeholder="e.g. jordan@planetmedia.in"
                    autoComplete="email"
                  />
                </div>

                <div className="settings-card__actions">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={isSavingProfile}
                  >
                    Save changes
                  </Button>
                </div>
              </form>
            </section>

            {/* Card 2: Change Password */}
            <section className="settings-card" aria-labelledby="change-password-title">
              <div className="settings-card__header">
                <h2 id="change-password-title" className="settings-card__title">
                  Change password
                </h2>
                <p className="settings-card__subtitle">You'll stay logged in on this device.</p>
              </div>

              <form onSubmit={handleChangePassword} noValidate>
                {/* Current Password Field */}
                <div className="settings-fields-grid">
                  <div className="settings-field-full">
                    <Input
                      label="Current password"
                      type="password"
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => {
                        setCurrentPassword(e.target.value);
                        if (currentPasswordError) setCurrentPasswordError('');
                      }}
                      error={currentPasswordError}
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                {/* New Password & Confirm New Password */}
                <div className="settings-fields-grid">
                  <Input
                    label="New password"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (newPasswordError) setNewPasswordError('');
                    }}
                    error={newPasswordError}
                    autoComplete="new-password"
                  />

                  <Input
                    label="Confirm new password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (confirmPasswordError) setConfirmPasswordError('');
                    }}
                    error={confirmPasswordError}
                    autoComplete="new-password"
                  />
                </div>

                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="password-strength-box">
                    <div className="password-strength-bars" aria-hidden="true">
                      <span className={`password-strength-bar ${passwordStrength.score >= 1 ? 'password-strength-bar--active' : ''}`} />
                      <span className={`password-strength-bar ${passwordStrength.score >= 2 ? 'password-strength-bar--active' : ''}`} />
                      <span className={`password-strength-bar ${passwordStrength.score >= 3 ? 'password-strength-bar--active' : ''}`} />
                      <span className={`password-strength-bar ${passwordStrength.score >= 4 ? 'password-strength-bar--active' : ''}`} />
                    </div>
                    <span className="password-strength-label">{passwordStrength.hint}</span>
                  </div>
                )}

                {/* Sign Out Other Sessions Toggle */}
                <div className="settings-toggle-row">
                  <div className="settings-toggle-info">
                    <span className="settings-toggle-title">Sign out other sessions</span>
                    <span className="settings-toggle-desc">
                      Log out everywhere else after this change
                    </span>
                  </div>

                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={signOutOtherSessions}
                      onChange={(e) => setSignOutOtherSessions(e.target.checked)}
                      aria-label="Sign out other sessions"
                    />
                    <span className="settings-slider" />
                  </label>
                </div>

                <div className="settings-card__actions">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={isUpdatingPassword}
                  >
                    Update password
                  </Button>
                </div>
              </form>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};
