"use client";

import { useHomeText } from "../HomeLanguage";
import { useEffect, useRef } from "react";

export default function CalPolyKitFilm() {
  const t = useHomeText();
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    const syncPlayback = () => {
      if (visible && !document.hidden && !preference.matches) {
        void video.play().catch(() => {});
      } else video.pause();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && entry.intersectionRatio >= 0.25;
      syncPlayback();
    }, { threshold: [0, 0.25] });
    observer.observe(video);
    preference.addEventListener("change", syncPlayback);
    document.addEventListener("visibilitychange", syncPlayback);
    return () => {
      observer.disconnect();
      preference.removeEventListener("change", syncPlayback);
      document.removeEventListener("visibilitychange", syncPlayback);
      video.pause();
    };
  }, []);
  return <figure className="cp-kit-film">
    <video ref={videoRef} src="/work/facade/kit-of-parts/CalPoly_Panel_Kit_Animation_v3_Panel_Stagger.mp4" poster="/work/facade/kit-of-parts/26-0914_CalPoly%20Bldg%20C%20Facade%20Design_Kit%20of%20Parts_01.png" controls muted loop playsInline preload="metadata" aria-label={t("Panel kit animation / staggered assembly")} />
  </figure>;
}
