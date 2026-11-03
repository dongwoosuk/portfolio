"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useHomeText } from "../HomeLanguage";

type Asset = { src: string; alt: string; label: string };

export default function FollowOnImages({ images }: { images: Asset[] }) {
  const [index, setIndex] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const t = useHomeText();
  const active = images[index];
  const go = (delta: number) => setIndex((current) => (current + delta + images.length) % images.length);
  return <>
    <div className={`case-followon-images${images.length === 1 ? " case-followon-images--single" : ""}`}>
      {images.map((asset, i) => <figure key={asset.src}>
        <button className="case-followon-image followon-open" type="button" onClick={() => { setIndex(i); dialog.current?.showModal(); }} aria-label={t(asset.label)}>
          <Image src={asset.src} alt={asset.alt} fill sizes={images.length === 1 ? "(max-width: 1050px) 85vw, 28vw" : "(max-width: 1050px) 40vw, 14vw"} />
        </button>
        <figcaption>{t(asset.label)}</figcaption>
      </figure>)}
    </div>
    <dialog className="followon-dialog" ref={dialog} aria-label={t("Image display")} onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }} onKeyDown={(event) => {
      if (event.key === "ArrowLeft") { event.preventDefault(); go(-1); }
      if (event.key === "ArrowRight") { event.preventDefault(); go(1); }
    }}>
      <div className="followon-dialog-header"><span>{t(active.label)}</span><button type="button" onClick={() => dialog.current?.close()}>{t("Close")}</button></div>
      <div className="followon-dialog-image"><Image src={active.src} alt={active.alt} fill sizes="90vw" /></div>
      {images.length > 1 && <div className="followon-dialog-controls"><button type="button" onClick={() => go(-1)} aria-label={t("Previous image")}>←</button><div role="group" aria-label={t("Image display")}>{images.map((asset, i) => <button key={asset.src} type="button" aria-pressed={index === i} onClick={() => setIndex(i)}>{t(asset.label)}</button>)}</div><button type="button" onClick={() => go(1)} aria-label={t("Next image")}>→</button></div>}
    </dialog>
  </>;
}
