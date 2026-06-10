import React, { ForwardRefRenderFunction, forwardRef } from "react";

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  type?: string;
  label?: string;
  success?: boolean;
  error?: boolean;
  hint?: string;
  options?: { value: string | number; label: string }[];
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  selectProps?: React.SelectHTMLAttributes<HTMLSelectElement>;
}

const InputBase: ForwardRefRenderFunction<HTMLInputElement & HTMLSelectElement, InputProps> = (
  {
    type = "text",
    label,
    success = false,
    error = false,
    hint,
    options,
    className = "",
    disabled = false,
    onChange,
    id,
    selectProps,
    ...props
  },
  ref
) => {
  let inputClasses = `h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-none focus:ring-3 transition-all dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 ${className}`;

  if (disabled) {
    inputClasses += ` bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700`;
  } else if (error) {
    inputClasses += ` text-error-800 border-error-500 focus:ring-error-500/10 focus:border-error-500 dark:text-error-400 dark:border-error-500`;
  } else if (success) {
    inputClasses += ` text-success-500 border-success-400 focus:ring-success-500/10 focus:border-success-300 dark:text-success-400 dark:border-success-500`;
  } else {
    inputClasses += ` bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800`;
  }

  const selectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onChange) onChange(e);
  };

  const inputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) onChange(e);
  };

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {options ? (
          <select
            id={id}
            disabled={disabled}
            className={inputClasses}
            onChange={selectChange}
            ref={ref as any}
            {...(selectProps as any)}
            value={props.value as any}
            defaultValue={props.defaultValue as any}
          >
            {props.placeholder && (
              <option value="" disabled>
                {props.placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            ref={ref as any}
            type={type}
            id={id}
            disabled={disabled}
            className={inputClasses}
            onChange={inputChange}
            {...props}
          />
        )}
      </div>

      {hint && (
        <p
          className={`mt-1.5 text-xs ${
            error
              ? "text-error-500"
              : success
              ? "text-success-500"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {hint}
        </p>
      )}
    </div>
  );
};

const Input = forwardRef(InputBase);
Input.displayName = "Input";

export default Input;
