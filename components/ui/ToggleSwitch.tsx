import React from 'react'

type ToggleSwitchProps = {
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
  label?: string;
};

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  disabled,
  onChange,
  label,
}) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition
        ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
        ${checked ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700"}
      `}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition
          ${checked ? "translate-x-6" : "translate-x-1"}
        `}
      />
      {label ? (
        <span className="sr-only">{label}</span>
      ) : null}
    </button>
  );
};

export default ToggleSwitch