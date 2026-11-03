"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useHomeText } from "../HomeLanguage";

const slides = [
  { src: "/work/facade/renderings/0922_VIEW_A%20copy.jpg", label: "Project rendering" },
  { src: "/work/facade/kit-of-parts/26-0914_CalPoly%20Bldg%20C%20Facade%20Design_Kit%20of%20Parts_07.png", label: "Facade model" },
  { src: "/work/facade/kit-of-parts/26-0914_CalPoly%20Bldg%20C%20Facade%20Design_Kit%20of%20Parts_06.png", label: "Panel types" },
];

export default function CalPolyProjectImages() {
  const t = useHomeText();
  const [index, setIndex] = useState(1);
  const modelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = modelRef.current;
    if (!element) return;
    let visible = false;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    observer.observe(element);
    const timer = window.setInterval(() => {
      if (visible && !document.hidden && !preference.matches) {
        setIndex((current) => current === 1 ? 2 : 1);
      }
    }, 4000);
    return () => { observer.disconnect(); window.clearInterval(timer); };
  }, []);
  return <div className="cp-project-two-column">
    <div className="cp-project-two-render"><Image src={slides[0].src} alt={t(slides[0].label)} fill priority sizes="(max-width: 760px) 100vw, 50vw" /></div>
    <div className="cp-project-two-model" ref={modelRef}>
      <div className="cp-project-two-model-stage">
        {slides.slice(1).map((slide, i) => <div key={slide.src} className="cp-project-two-layer" style={{ visibility: index === i + 1 ? "visible" : "hidden" }} aria-hidden={index !== i + 1}>
          <div className="cp-project-two-crop">
            <Image src={slide.src} alt={t(slide.label)} width={6316} height={3459} sizes="(max-width: 760px) 100vw, 50vw" style={{ position: "absolute", width: `${6316 / 4400 * 100}%`, height: `${3459 / 2800 * 100}%`, maxWidth: "none", maxHeight: "none", objectFit: "fill", left: `${-1750 / 4400 * 100}%`, top: `${-190 / 2800 * 100}%` }} />
          </div>
        </div>)}
      </div>
      <div className="cp-project-two-controls" role="group" aria-label={t("Project images")}>
        {slides.slice(1).map((slide, i) => <button key={slide.src} type="button" aria-pressed={index === i + 1} onClick={() => setIndex(i + 1)}>{t(slide.label)}</button>)}
      </div>
    </div>
  </div>;
}
