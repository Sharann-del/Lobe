import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg-0)] p-4 font-sans"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        backgroundColor: "#0a0a0a",
        padding: "1rem",
      }}
    >
      <Link
        href="/"
        className="mb-8 text-sm text-[var(--text-tertiary)] transition-colors duration-fast hover:text-[var(--text-primary)]"
        style={{
          marginBottom: "2rem",
          fontSize: "0.875rem",
          color: "#555555",
          textDecoration: "none",
        }}
      >
        Lobe
      </Link>
      {children}
    </div>
  );
}
