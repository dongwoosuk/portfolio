"use client";

import { useEffect, useRef } from "react";

export default function ViewportVideo({ src, poster, label }: { src: string; poster: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    let visible = false;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      if (visible && !document.hidden && !preference.matches) void video.play().catch(() => {});
      else video.pause();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && entry.intersectionRatio >= .4;
      sync();
    }, { threshold: [0, .4] });
    observer.observe(video);
    document.addEventListener("visibilitychange", sync);
    preference.addEventListener("change", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      preference.removeEventListener("change", sync);
      video.pause();
    };
  }, []);
  return <video ref={ref} src={src} poster={poster} controls muted loop playsInline preload="metadata" aria-label={label} />;
}
