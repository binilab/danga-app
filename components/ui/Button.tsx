import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

/**
 * 버튼 스타일 변형(variant/size)을 공통 규칙으로 합성해 일관된 UI를 만듭니다.
 */
function getButtonClass({
  variant,
  size,
  fullWidth,
  className,
}: {
  variant: ButtonVariant;
  size: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}) {
  const variantClass =
    variant === "primary"
      ? "bg-[var(--brand)] text-white hover:brightness-95"
      : variant === "secondary"
        ? "border border-[var(--line)] bg-white text-slate-800 hover:bg-slate-50"
        : variant === "danger"
          ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
          : "text-slate-700 hover:bg-slate-100";
  const sizeClass = size === "sm" ? "px-3.5 py-2 text-sm" : "px-4.5 py-2.5 text-sm";

  return [
    "danga-touch inline-flex items-center justify-center rounded-full font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
    variantClass,
    sizeClass,
    fullWidth ? "w-full" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * 일반 버튼 요소를 공통 디자인 시스템 토큰으로 렌더링합니다.
 */
export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={getButtonClass({ variant, size, fullWidth, className })}
    />
  );
}

/**
 * Next.js Link를 버튼 형태로 보여줄 때 사용하는 공통 컴포넌트입니다.
 */
export function ButtonLink({
  href,
  children,
  variant = "primary",
  size = "md",
  className,
}: ButtonLinkProps) {
  return (
    <Link href={href} className={getButtonClass({ variant, size, className })}>
      {children}
    </Link>
  );
}
