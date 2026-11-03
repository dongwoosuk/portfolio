"use client";
import Image from "next/image";
import { useRef, useState } from "react";
import { useHomeText } from "../HomeLanguage";

const components = [
  ["floor-slabs.png", "Floor slabs"], ["structural-columns.png", "Structural columns"],
  ["core.png", "Core"], ["corridor-walls.png", "Corridor walls"],
  ["interior-walls.png", "Interior walls"], ["facade.png", "Facade"], ["mullion-curves.png", "Mullion curves"],
];
const floors = [["l3.jpg", "Level 3"], ["l6.jpg", "Level 6"], ["l10.jpg", "Level 10"]];

export default function FiveModelExplorer({ mode = "components", all = false }: { mode?: "components" | "floors"; all?: boolean }) {
  const [index, setIndex] = useState(0);
  const t = useHomeText();
  const dialog = useRef<HTMLDialogElement>(null);
  const go = (delta: number) => setIndex((current) => (current + delta + components.length) % components.length);
  const items = mode === "components" ? components : floors;
  const [file, label] = items[index];
  if (all) return <>
    <div className="five-components-grid">{components.map(([itemFile, itemLabel], i) => <figure key={itemFile}><button type="button" className={`five-component-image five-component-open${itemFile === "mullion-curves.png" ? " five-component-image--mullions" : ""}`} onClick={() => { setIndex(i); dialog.current?.showModal(); }} aria-label={t(itemLabel)}><Image src={`/work/five-by-five/${itemFile}`} alt={t(itemLabel)} fill sizes="(max-width: 600px) 42vw, (max-width: 1050px) 27vw, 12vw" /></button><figcaption>{t(itemLabel)}</figcaption></figure>)}</div>
    <dialog ref={dialog} className="followon-dialog" aria-label={t("Model components")} onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }} onKeyDown={(event) => {
      if (event.key === "ArrowLeft") { event.preventDefault(); go(-1); }
      if (event.key === "ArrowRight") { event.preventDefault(); go(1); }
    }}>
      <div className="followon-dialog-header"><span>{index + 1} / {components.length} / {t(label)}</span><button type="button" onClick={() => dialog.current?.close()}>{t("Close")}</button></div>
      <div className="followon-dialog-image"><Image src={`/work/five-by-five/${file}`} alt={t(label)} fill sizes="90vw" /></div>
      <div className="followon-dialog-controls"><button type="button" onClick={() => go(-1)} aria-label={t("Previous image")}>&larr;</button><span>{t(label)}</span><button type="button" onClick={() => go(1)} aria-label={t("Next image")}>&rarr;</button></div>
    </dialog>
  </>;

  return <div className={`five-explorer five-explorer--${mode}`}>
    <div className="five-explorer-tabs" role="group" aria-label={t(mode === "components" ? "Model components" : "Floor plans")}>
      {items.map((item, i) => <button key={item[0]} type="button" aria-pressed={index === i} onClick={() => setIndex(i)}>{t(item[1])}</button>)}
    </div>
    <a className={`five-explorer-image${file === "mullion-curves.png" ? " five-explorer-image--mullions" : ""}`} href={`/work/five-by-five/${file}`} target="_blank" rel="noreferrer"><Image src={`/work/five-by-five/${file}`} alt={t(label)} fill sizes="(max-width: 760px) 90vw, 70vw" /></a>
  </div>;
}
