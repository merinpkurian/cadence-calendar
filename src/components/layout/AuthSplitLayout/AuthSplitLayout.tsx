import React from 'react';
import { Calendar } from 'lucide-react';
import './AuthSplitLayout.css';

interface AuthSplitLayoutProps {
  headline: string;
  supportingText: string;
  children: React.ReactNode;
}

export const AuthSplitLayout: React.FC<AuthSplitLayoutProps> = ({
  headline,
  supportingText,
  children,
}) => {
  return (
    <div className="auth-layout">
      {/* Left Branded Panel */}
      <div className="auth-panel-left">
        {/* Decorative Concentric Rings */}
        <div className="auth-rings auth-rings--top" aria-hidden="true">
          <div className="auth-ring auth-ring--1" />
          <div className="auth-ring auth-ring--2" />
          <div className="auth-ring auth-ring--3" />
        </div>

        <div className="auth-rings auth-rings--bottom" aria-hidden="true">
          <div className="auth-ring auth-ring--1" />
          <div className="auth-ring auth-ring--2" />
          <div className="auth-ring auth-ring--3" />
        </div>

        {/* Top Logo */}
        <div className="auth-logo">
          <div className="auth-logo__badge">
            <Calendar size={18} className="auth-logo__icon" />
          </div>
          <span className="auth-logo__name">Cadence</span>
        </div>

        {/* Headline & Copy */}
        <div className="auth-hero-copy">
          <h1 className="auth-hero-headline">{headline}</h1>
          <p className="auth-hero-support">{supportingText}</p>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="auth-panel-right">
        <div className="auth-form-container">
          {children}
        </div>
      </div>
    </div>
  );
};
