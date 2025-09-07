import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
};

export const Button = React.forwardRef<HTMLButtonElement, Props>(
  ({ variant = "primary", className = "", children, ...props }, ref) => {
    const base =
      "px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed";
    const styles =
      variant === "primary"
        ? "bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-400"
        : variant === "danger"
        ? "bg-red-500 text-white hover:bg-red-600 focus:ring-red-400"
        : "bg-transparent text-gray-900 hover:bg-gray-100 focus:ring-gray-300";

    return (
      <button ref={ref} className={`${base} ${styles} ${className}`} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
