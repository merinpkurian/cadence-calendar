import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Plus, ChevronRight, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { getAvatarUrl } from '../../../services/api';
import { MiniCalendar } from '../MiniCalendar/MiniCalendar';
import './CalendarSidebar.css';

interface CalendarSidebarProps {
  currentDate: Date;
  onSelectDate: (date: Date) => void;
  onCreateEventClick: () => void;
}

const STATIC_CALENDARS = [
  { id: 'work', name: 'Work', color: '#3366FF' },
  { id: 'personal', name: 'Personal', color: '#8B5CF6' },
  { id: 'team', name: 'Team', color: '#0EA5A5' },
  { id: 'reminders', name: 'Reminders', color: '#F59E0B' },
];

export const CalendarSidebar: React.FC<CalendarSidebarProps> = ({
  currentDate,
  onSelectDate,
  onCreateEventClick,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const avatarSrc = getAvatarUrl(user?.avatarUrl);
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  // Close profile menu popover when clicking outside or pressing Escape
  useEffect(() => {
    if (!isProfileMenuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
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
    <aside className="calendar-sidebar">
      <div className="calendar-sidebar__top">
        {/* Cadence Logo */}
        <div className="calendar-sidebar__logo">
          <div className="calendar-sidebar__logo-badge">
            <Calendar size={18} className="calendar-sidebar__logo-icon" />
          </div>
          <span className="calendar-sidebar__logo-name">Cadence</span>
        </div>

        {/* Primary Create Button */}
        <button
          type="button"
          className="calendar-sidebar__create-btn"
          onClick={onCreateEventClick}
        >
          <Plus size={18} />
          <span>Create</span>
        </button>

        {/* Interactive Mini Calendar */}
        <MiniCalendar currentDate={currentDate} onSelectDate={onSelectDate} />

        {/* My Calendars Section (Static Visual) */}
        <div className="calendar-sidebar__calendars">
          <span className="calendar-sidebar__section-title">MY CALENDARS</span>
          <ul className="calendar-sidebar__list">
            {STATIC_CALENDARS.map((cal) => (
              <li key={cal.id} className="calendar-sidebar__item">
                <span
                  className="calendar-sidebar__dot"
                  style={{ backgroundColor: cal.color }}
                  aria-hidden="true"
                />
                <span className="calendar-sidebar__item-name">{cal.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* User Profile Card & Popover Menu at Bottom */}
      <div className="calendar-sidebar__user-container" ref={userMenuRef}>
        <div
          className={`calendar-sidebar__user ${isProfileMenuOpen ? 'calendar-sidebar__user--open' : ''}`}
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
          aria-label="User Profile and Account Menu"
        >
          <div className="calendar-sidebar__avatar">
            {avatarSrc ? (
              <img src={avatarSrc} alt={user?.name || 'User'} className="calendar-sidebar__avatar-img" />
            ) : (
              <span className="calendar-sidebar__avatar-initials">{initials}</span>
            )}
          </div>
          <div className="calendar-sidebar__user-meta">
            <span className="calendar-sidebar__user-name">{user?.name || 'User'}</span>
            <span className="calendar-sidebar__user-email">{user?.email || ''}</span>
          </div>
          <ChevronRight
            size={16}
            className={`calendar-sidebar__user-arrow ${isProfileMenuOpen ? 'calendar-sidebar__user-arrow--rotated' : ''}`}
          />
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
    </aside>
  );
};
