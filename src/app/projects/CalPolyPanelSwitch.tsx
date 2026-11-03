"use client";

import Image from "next/image";
import { useState } from "react";
import { useHomeText } from "../HomeLanguage";
import frames from "./calPolyPanelFrames.json";

export default function CalPolyPanelSwitch({ perspective = false }: { perspective?: boolean }) {
  const t = useHomeText();
  const [showTypes, setShowTypes] = useState(true);
  const modelFile = perspective ? "02" : "04";
  const typeFile = perspective ? "01" : "03";
  const reference = frames.find((item) => item.file === modelFile)!;
  const modelCaption = perspective ? "Perspective / facade model" : "Northwest elevation / facade model";
  const typeCaption = perspective ? "Perspective / panel classification" : "Northwest elevation / panel classification";
  const src = (file: string) => `/work/facade/kit-of-parts/${encodeURIComponent(`26-0914_CalPoly Bldg C Facade Design_Kit of Parts_${file}.png`)}`;
  function layer(file: string) {
    const frame = frames.find((item) => item.file === file)!;
    const [x, y, w, h] = frame.crop;
    return <Image src={src(file)} alt={t(file === modelFile ? modelCaption : typeCaption)} width={frame.width} height={frame.height} sizes={perspective ? "(max-width: 900px) 90vw, 40vw" : "90vw"} draggable={false} style={{ position: "absolute", width: `${frame.width / w * 100}%`, height: `${frame.height / h * 100}%`, maxWidth: "none", left: `${-x / w * 100}%`, top: `${-y / h * 100}%` }} />;
  }
  return <div className="cp-panel-switch">
    <div className="cp-panel-switch-controls" role="group" aria-label={t("Elevation display")}>
      <button type="button" aria-pressed={!showTypes} onClick={() => setShowTypes(false)}>{t("Facade model")}</button>
      <button type="button" aria-pressed={showTypes} onClick={() => setShowTypes(true)}>{t("Panel types")}</button>
    </div>
    <figure className="cp-figure">
      <div className="cp-panel-compare" style={{ aspectRatio: `${reference.crop[2]} / ${reference.crop[3]}` }}>
        <div className="cp-compare-layer" style={{ visibility: showTypes ? "hidden" : "visible" }} aria-hidden={showTypes}>{layer(modelFile)}</div>
        <div className="cp-compare-layer" style={{ visibility: showTypes ? "visible" : "hidden" }} aria-hidden={!showTypes}>{layer(typeFile)}</div>
      </div>
      <figcaption><span aria-live="polite">{t(showTypes ? typeCaption : modelCaption)}</span><a href={src(showTypes ? typeFile : modelFile)} target="_blank" rel="noreferrer">{t("Open full image ↗")}</a></figcaption>
    </figure>
  </div>;
}
