"use client";

import Image from "next/image";
import { HomeText, useHomeText } from "../HomeLanguage";
import { useRef, useState, type CSSProperties } from "react";
import type { ProjectGalleryGroup, ProjectSlide } from "./data";

export default function ProjectGallery({ slides, groups }: { slides: ProjectSlide[]; groups?: ProjectGalleryGroup[] }) {
  const t = useHomeText();
  const [index, setIndex] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const slide = slides[index];
  const go = (delta: number) => setIndex((current) => (current + delta + slides.length) % slides.length);
  const selectFromOverview = (itemIndex: number) => {
    setIndex(itemIndex);
    dialogRef.current?.showModal();
  };

  return (
    <div className="case-gallery" aria-label="Project image slideshow" tabIndex={groups ? undefined : 0} onKeyDown={(event) => {
      if (groups) return;
      if (event.key === "ArrowLeft") { event.preventDefault(); go(-1); }
      if (event.key === "ArrowRight") { event.preventDefault(); go(1); }
    }}>
      {groups && <div className="gallery-process" aria-label="Project process overview">
        {groups.map((group, groupIndex) => <div className="gallery-process-row" key={group.label}>
          <div className={`gallery-process-phase${group.startColumn ? " gallery-process-phase--inline" : ""}`} style={group.startColumn ? { "--phase-column": `${group.startColumn - 1} / ${group.startColumn + 1}` } as CSSProperties : undefined}><span>{String(groupIndex + 1).padStart(2, "0")} / {String(groups.length).padStart(2, "0")}</span><h3><HomeText>{group.label}</HomeText></h3><p><HomeText>{group.detail}</HomeText></p></div>
          <div className="gallery-process-frames">{slides.slice(group.from, group.to).map((item, offset) => {
            const itemIndex = group.from + offset;
            const position = { "--row-column": String((group.startColumn ?? 1) + offset + 1) } as CSSProperties;
            return <button key={item.src} type="button" className={`gallery-process-card${itemIndex === index ? " active" : ""}`} style={position} onClick={() => selectFromOverview(itemIndex)} aria-label={`Show frame ${itemIndex + 1}: ${item.title}`} aria-current={itemIndex === index ? "true" : undefined}>
              <span className="gallery-process-image"><Image src={item.src} alt="" fill sizes="(max-width: 760px) 45vw, 16vw" /></span>
              <span className="gallery-process-number">{String(itemIndex + 1).padStart(2, "0")}</span>
              <span className="gallery-process-title"><HomeText>{item.title}</HomeText></span>
            </button>;
          })}</div>
        </div>)}
      </div>}
      {groups ? <>
        <p className="gallery-hint"><HomeText>{"Select a frame to enlarge it. Use the arrows to move between frames; close to return to the process overview."}</HomeText></p>
        <dialog className="gallery-lightbox" ref={dialogRef} aria-label="Project frame viewer" onKeyDown={(event) => {
          if (event.key === "ArrowLeft") { event.preventDefault(); go(-1); }
          if (event.key === "ArrowRight") { event.preventDefault(); go(1); }
        }} onClick={(event) => { if (event.target === event.currentTarget) dialogRef.current?.close(); }}>
          <div className="gallery-lightbox-header"><span><HomeText>{"FRAME"}</HomeText> {String(index + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}</span><button type="button" onClick={() => dialogRef.current?.close()} aria-label="Close image viewer"><HomeText>{"Close ×"}</HomeText></button></div>
          <div className="gallery-lightbox-image"><Image key={slide.src} src={slide.src} alt={t(slide.alt)} fill sizes="100vw" /></div>
          <div className="gallery-lightbox-footer"><div aria-live="polite"><h3><HomeText>{slide.title}</HomeText></h3><p><HomeText>{slide.detail}</HomeText></p><a href={slide.src} target="_blank" rel="noreferrer"><HomeText>{"Open full image ↗"}</HomeText></a></div><div className="gallery-lightbox-controls"><button type="button" onClick={() => go(-1)} aria-label="Previous frame">←</button><button type="button" onClick={() => go(1)} aria-label="Next frame">→</button></div></div>
        </dialog>
      </> : <>
      <div className="gallery-stage">
        <Image key={slide.src} src={slide.src} alt={t(slide.alt)} fill sizes="(max-width: 800px) 100vw, 85vw" />
        <span className="gallery-counter">{String(index + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}</span>
        <div className="gallery-arrows">
          <button type="button" onClick={() => go(-1)} aria-label="Previous image">←</button>
          <button type="button" onClick={() => go(1)} aria-label="Next image">→</button>
        </div>
      </div>
      <div className="gallery-info" aria-live="polite">
        <div><span className="tiny-label"><HomeText>{"FRAME"}</HomeText> {String(index + 1).padStart(2, "0")}</span><h3><HomeText>{slide.title}</HomeText></h3><p><HomeText>{slide.detail}</HomeText></p></div>
        <a href={slide.src} target="_blank" rel="noreferrer"><HomeText>{"Open full image ↗"}</HomeText></a>
      </div>
      {!groups && <div className="gallery-thumbs" aria-label="Choose an image">
        {slides.map((item, itemIndex) => <button key={item.src} type="button" className={itemIndex === index ? "active" : ""} onClick={() => setIndex(itemIndex)} aria-label={`Show ${item.title}`} aria-current={itemIndex === index ? "true" : undefined}>
          <Image src={item.src} alt="" fill sizes="110px" />
          <span>{String(itemIndex + 1).padStart(2, "0")}</span>
        </button>)}
      </div>}
      <p className="gallery-hint"><HomeText>{"Use the arrows or select a thumbnail. Click “Open full image” to inspect details."}</HomeText></p>
      </>}
    </div>
  );
}
