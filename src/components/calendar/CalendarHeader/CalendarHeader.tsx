import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Info, ChevronLeft, ChevronRight, Plus, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { getAvatarUrl } from '../../../services/api';
import './CalendarHeader.css';

interface CalendarHeaderProps {
  rangeLabel: string;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  onAddEventClick: () => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  rangeLabel,
  onPrevWeek,
  onNextWeek,
  onToday,
  onAddEventClick,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const headerMenuRef = useRef<HTMLDivElement>(null);

  const avatarSrc = getAvatarUrl(user?.avatarUrl);
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  // Close profile menu on outside click or Escape
  useEffect(() => {
    if (!isProfileMenuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (headerMenuRef.current && !headerMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isProfileMenuOpen]);

  const handleSettingsClick = () => {
    setIsProfileMenuOpen(false);
    navigate('/settings');
  };

  const handleLogoutClick = () => {
    setIsProfileMenuOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="calendar-header">
      {/* Top Utility Bar */}
      <div className="calendar-header__top">
        <div className="calendar-header__search">
          <Search size={16} className="calendar-header__search-icon" />
          <input
            type="text"
            placeholder="Search events"
            className="calendar-header__search-input"
            aria-label="Search events (visual)"
            readOnly
          />
        </div>

        <div className="calendar-header__actions">
          <button
            type="button"
            className="calendar-header__icon-btn"
            aria-label="Notifications (visual)"
          >
            <Bell size={18} />
          </button>
          <button
            type="button"
            className="calendar-header__icon-btn"
            aria-label="Information (visual)"
          >
            <Info size={18} />
          </button>

          {/* User Profile Avatar & Dropdown */}
          <div className="calendar-header__avatar-container" ref={headerMenuRef}>
            <div
              className="calendar-header__avatar"
              onClick={() => setIsProfileMenuOpen((prev) => !prev)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsProfileMenuOpen((prev) => !prev);
                }
              }}
              aria-expanded={isProfileMenuOpen}
              aria-haspopup="true"
              aria-label="Account Menu"
            >
              {avatarSrc ? (
                <img src={avatarSrc} alt={user?.name || 'User'} className="calendar-header__avatar-img" />
              ) : (
                <span>{initials}</span>
              )}
            </div>

            {/* Profile Popover Menu */}
            {isProfileMenuOpen && (
              <div className="profile-menu-popover" role="menu">
                <div className="profile-menu-popover__user-info">
                  <div className="profile-menu-popover__avatar">
                    {avatarSrc ? (
                      <img src={avatarSrc} alt={user?.name || 'User'} className="profile-menu-popover__avatar-img" />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>
                  <div className="profile-menu-popover__meta">
                    <span className="profile-menu-popover__name">{user?.name || 'User'}</span>
                    <span className="profile-menu-popover__email">{user?.email || ''}</span>
                  </div>
                </div>

                <div className="profile-menu-popover__divider" />

                <button
                  type="button"
                  className="profile-menu-popover__item"
                  onClick={handleSettingsClick}
                  role="menuitem"
                >
                  <Settings size={16} />
                  <span>Settings</span>
                </button>

                <button
                  type="button"
                  className="profile-menu-popover__item profile-menu-popover__item--logout"
                  onClick={handleLogoutClick}
                  role="menuitem"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div className="calendar-header__controls">
        <div className="calendar-header__nav">
          <button
            type="button"
            className="calendar-header__today-btn"
            onClick={onToday}
          >
            Today
          </button>

          <div className="calendar-header__arrows">
            <button
              type="button"
              className="calendar-header__arrow-btn"
              onClick={onPrevWeek}
              aria-label="Previous week"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className="calendar-header__arrow-btn"
              onClick={onNextWeek}
              aria-label="Next week"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <h2 className="calendar-header__range">{rangeLabel}</h2>
        </div>

        <div className="calendar-header__view-options">
          {/* Day / Week / Month Toggle (Week active per assignment scope) */}
          <div className="calendar-header__view-toggle" role="group" aria-label="Calendar view options">
            <button type="button" className="calendar-header__view-btn">
              Day
            </button>
            <button
              type="button"
              className="calendar-header__view-btn calendar-header__view-btn--active"
              aria-current="page"
            >
              Week
            </button>
            <button type="button" className="calendar-header__view-btn">
              Month
            </button>
          </div>

          <button
            type="button"
            className="calendar-header__add-btn"
            onClick={onAddEventClick}
          >
            <Plus size={16} />
            <span>Add event</span>
          </button>
        </div>
      </div>
    </header>
  );
};
