import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type ShellButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "ghost";
  }
>;

export function ShellButton({
  children,
  className = "",
  variant = "primary",
  ...props
}: ShellButtonProps) {
  return (
    <button
      className={`shell-button shell-button--${variant} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
