import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ children, className = "", ...props }, ref) => (
    <button ref={ref} className={`btn ${className}`} {...props}>
      {children}
    </button>
  ),
);

Button.displayName = "Button";
