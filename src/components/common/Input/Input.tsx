import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import './Input.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightElement,
      type = 'text',
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const isPassword = type === 'password';
    const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className={`input-field ${error ? 'input-field--error' : ''} ${className}`}>
        {label && (
          <label htmlFor={inputId} className="input-field__label">
            {label}
          </label>
        )}

        <div className="input-field__wrapper">
          {leftIcon && <span className="input-field__icon input-field__icon--left">{leftIcon}</span>}

          <input
            ref={ref}
            id={inputId}
            type={effectiveType}
            className={`input-field__control ${leftIcon ? 'input-field__control--has-left' : ''} ${
              isPassword || rightElement ? 'input-field__control--has-right' : ''
            }`}
            {...props}
          />

          {isPassword ? (
            <button
              type="button"
              className="input-field__toggle-pw"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          ) : (
            rightElement && <div className="input-field__right-element">{rightElement}</div>
          )}
        </div>

        {error && <p className="input-field__error">{error}</p>}
        {!error && helperText && <p className="input-field__helper">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
