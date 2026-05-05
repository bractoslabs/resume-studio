import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ children, className = "", style, ...props }, ref) => {
    const variantClass = className.split(/\s+/);
    const themedStyle =
      variantClass.includes("primary") || variantClass.includes("danger")
        ? style
        : {
            backgroundColor: "var(--panel)",
            color: "var(--ink)",
            ...style,
          };

    return (
      <button ref={ref} className={`btn ${className}`} style={themedStyle} {...props}>
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
