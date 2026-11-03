"use client";

import { useEffect, useRef, useState } from "react";
import { HomeText, useHomeText } from "./HomeLanguage";

export default function HeroReel() {
  const t = useHomeText();
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      if (preference.matches) element.pause();
      else void element.play().catch(() => {});
    };
    apply();
    preference.addEventListener("change", apply);
    return () => preference.removeEventListener("change", apply);
  }, []);
  return <div className="hero-visual hero-reel">
    <video ref={video} src="/work/hero/computational-reel-v4.mp4" poster="/work/hero/computational-reel-v4.jpg" muted loop playsInline preload="metadata" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} aria-label="Computational design reel: modular buildings, adaptive facades, unit planning, AI workflows, parking data, and BIM studies" />
    <div className="hero-visual-top"><span><HomeText>{"COMPUTATIONAL DESIGN / SELECTED EXPLORATIONS"}</HomeText></span><span>2026</span></div>
    <div className="hero-visual-caption"><span><HomeText>{"DESIGN IN MOTION"}</HomeText></span><span><HomeText>{"Forms. Systems."}</HomeText><br /><HomeText>{"Possibilities."}</HomeText></span><button type="button" onClick={() => { const element = video.current; if (element) { if (element.paused) void element.play().catch(() => {}); else element.pause(); } }} aria-label={t(playing ? "Pause Ⅱ" : "Play ▷")}>{t(playing ? "Pause Ⅱ" : "Play ▷")}</button></div>
  </div>;
}
