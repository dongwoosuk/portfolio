"use client";

import { type ReactNode } from "react";

// The published portfolio is English-only; existing call sites stay reusable.
export function useHomeText() { return (text: string) => text; }
export function HomeText({ children }: { children: string }) { return <>{children}</>; }
export function HomeLanguageSwitch() { return null; }
export default function HomeLanguage({ children }: { children: ReactNode }) {
  return <div className="home-localized" lang="en">{children}</div>;
}
