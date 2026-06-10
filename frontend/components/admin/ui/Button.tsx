import React, { ReactNode } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  size?: "sm" | "md";
  variant?: "primary" | "secondary" | "outline" | "danger" | "success" | "icon";
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  size = "md",
  variant = "primary",
  startIcon,
  endIcon,
  className = "",
  disabled = false,
  isLoading = false,
  type = "button",
  ...props
}) => {
  // Size Classes
  const sizeClasses = {
    sm: "px-4 py-2 text-xs",
    md: "px-5 py-3 text-sm",
  };

  // Variant Classes
  const variantClasses = {
    primary:
      "bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300 focus:ring-3 focus:ring-brand-500/10",
    secondary:
      "bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:bg-gray-50 focus:ring-3 focus:ring-gray-500/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10",
    outline:
      "bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 focus:ring-3 focus:ring-gray-500/10 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03] dark:hover:text-gray-300",
    danger:
      "bg-error-500 text-white shadow-theme-xs hover:bg-error-600 disabled:bg-error-300 focus:ring-3 focus:ring-error-500/10",
    success:
      "bg-success-500 text-white shadow-theme-xs hover:bg-success-600 disabled:bg-success-300 focus:ring-3 focus:ring-success-500/10",
    icon: "bg-transparent text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 p-2 rounded-full",
  };

  const isDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center font-medium gap-2 rounded-lg transition-all cursor-pointer ${
        variant !== "icon" ? sizeClasses[size] : ""
      } ${variantClasses[variant]} ${
        isDisabled ? "cursor-not-allowed opacity-50" : "active:scale-98"
      } ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-1 h-4 w-4 text-current"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {!isLoading && startIcon && <span className="flex items-center shrink-0">{startIcon}</span>}
      {children}
      {!isLoading && endIcon && <span className="flex items-center shrink-0">{endIcon}</span>}
    </button>
  );
};

export default Button;
