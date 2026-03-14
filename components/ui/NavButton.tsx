import Link from "next/link";

interface NavButtonProps {
  href: string;
  variant?: "primary" | "secondary";
  children: React.ReactNode;
}

export default function NavButton({
  href,
  variant = "secondary",
  children
}: NavButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium no-underline transition-colors";

  const variants = {
    primary:
      "bg-accent text-white hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page",
    secondary:
      "text-fg-secondary hover:bg-surface-card hover:text-fg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg-muted focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page"
  };

  return (
    <Link href={href} className={`${base} ${variants[variant]}`}>
      {children}
    </Link>
  );
}
