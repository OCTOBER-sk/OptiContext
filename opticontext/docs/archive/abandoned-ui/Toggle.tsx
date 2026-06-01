import React from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  id?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, id, disabled = false }: ToggleProps) {
  const toggleId = id ?? `toggle-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <div className="flex items-center gap-3">
      <button
        id={toggleId}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={['toggle-track', checked ? 'checked' : '', disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'].join(' ')}
      >
        <span className="toggle-thumb" />
      </button>
      {label && (
        <label
          htmlFor={toggleId}
          className="font-body text-body-sm text-text-primary cursor-pointer select-none"
        >
          {label}
        </label>
      )}
    </div>
  );
}
