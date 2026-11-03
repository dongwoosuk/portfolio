"use client";

import Image from "next/image";
import ViewportVideo from "./ViewportVideo";
import { useState } from "react";
import { useHomeText } from "../HomeLanguage";
import FiveModelExplorer from "./FiveModelExplorer";
import FivePresentation from "./FivePresentation";
import assets from "./fiveAssets.json";

export default function FiveByFiveEvidence() {
  const t = useHomeText();
  const [numbered, setNumbered] = useState(true);
  function source(file: keyof typeof assets, caption: string) {
    const size = assets[file];
    return <figure className={`five-figure${file === "rir-definition.png" ? " five-figure--rir-cropped" : ""}`}><a href={`/work/five-by-five/${file}`} target="_blank" rel="noreferrer"><Image src={`/work/five-by-five/${file}`} alt={t(caption)} width={size.width} height={size.height} sizes="(max-width: 760px) 90vw, 44vw" unoptimized={file === "elevation-original.png"} /></a><figcaption>{t(caption)}</figcaption></figure>;
  }
  function figure(file: string, caption: string, width: number, height: number) {
    return <figure className={`five-figure five-figure--${file}`}><a href={`/work/five-by-five/${file}.jpg`} target="_blank" rel="noreferrer"><Image src={`/work/five-by-five/${file}.jpg`} alt={t(caption)} width={width} height={height} sizes="(max-width: 760px) 90vw, 44vw" /></a><figcaption>{t(caption)}</figcaption></figure>;
  }
  return <>
    <section className="five-evidence section-shell" id="gallery" aria-labelledby="five-model-title">
      <div className="case-section-heading"><div><span className="section-kicker">{t("03 / MODEL HANDOFF")}</span><h2 id="five-model-title">{t("One system.")}<br /><em>{t("Two modeling environments.")}</em></h2></div><p>{t("Follow the Rhino geometry through three Revit model stages, then inspect the component organization and handoff definition.")}</p></div>
      <div className="five-substudy"><span className="section-kicker">{t("DATA PREPARATION")}</span><h3>{t("Organize module data before handoff.")}</h3><p>{t("In Rhino, color and numbering expose the module organization managed in Grasshopper. This data structure prepares the modules for the Revit handoff.")}</p><div className="five-numbering-pair"><figure className="five-figure five-system-reference"><div className="five-system-reference-image"><Image src={numbered ? "/work/five-by-five/numbered-model.jpg" : "/work/five-by-five/full-building-reference.jpg"} alt={t(numbered ? "Grasshopper module data / color and numbering" : "Rhino / module geometry")} fill sizes="(max-width: 760px) 90vw, 44vw" /></div><div className="five-explorer-tabs" role="group" aria-label={t("Image display")}><button type="button" aria-pressed={!numbered} onClick={() => setNumbered(false)}>{t("Module geometry")}</button><button type="button" aria-pressed={numbered} onClick={() => setNumbered(true)}>{t("Color & numbering")}</button></div></figure>{source("numbering-detail.jpg", "Module numbering / detail")}</div></div>
      <div className="five-handoff-stage"><span className="section-kicker">{t("REVIT HANDOFF")}</span><FivePresentation recap modelsOnly /></div>
      <div className="five-definition"><div><span className="section-kicker">{t("GRASSHOPPER / RHINO.INSIDE.REVIT")}</span><h3>{t("The Revit handoff definition.")}</h3><p>{t("The Rhino.Inside.Revit definition connects the organized geometry to the Revit workflow.")}</p></div></div>
      <div className="five-rir-definition">{source("rir-definition.png", "Rhino.Inside.Revit / handoff definition")}</div>
      <div className="five-assembly-inline"><div><h3>{t("See the model assembled.")}</h3><p>{t("The assembly sequence connects the handoff definition with the building systems shown below.")}</p></div><ViewportVideo src="/work/five-by-five/diagram.mp4" poster="/work/revit-study.jpg" label={t("Assembly sequence")} /></div>
      <div className="five-substudy"><span className="section-kicker">{t("BUILDING SYSTEMS")}</span><h3>{t("Separate the building into systems.")}</h3><p>{t("Inspect slabs, columns, core, walls, facade, and mullion curves as distinct model streams.")}</p><FiveModelExplorer all /></div>

    </section>
    <section className="five-documents section-shell" aria-labelledby="five-documents-title"><div className="case-section-heading"><div><span className="section-kicker">{t("04 / REVIT VIEWS")}</span><h2 id="five-documents-title">{t("Read the model")}<br /><em>{t("in plan and elevation.")}</em></h2></div><p>{t("The plan shows rooms and tags; the elevation shows levels and element marks. These views document the study beyond its exterior form.")}</p></div><div className="five-document-pair five-document-pair--combined"><div className="five-plan-switch"><FiveModelExplorer mode="floors" /></div>{source("elevation-original.png", "Revit elevation / levels and marks")}</div>
      <div className="five-substudy"><h3>{t("Read the panel divisions.")}</h3><div className="five-detail-pair"><div className="five-panel-library"><div className="five-panel-types">{["b", "a"].map((type) => <figure className="five-figure" key={type}><a href={`/work/five-by-five/panel-type-${type}.png`} target="_blank" rel="noreferrer"><Image src={`/work/five-by-five/panel-type-${type}.png`} alt={type === "b" ? "Panel Type A" : "Panel Type B"} width={type === "a" ? 1152 : 1134} height={type === "a" ? 988 : 969} sizes="(max-width: 760px) 42vw, 21vw" /></a><figcaption>{t(type === "b" ? "Panel Type A" : "Panel Type B")}</figcaption></figure>)}</div>{source("panel-division.png", "Panel A & B / mullion spacing")}</div>{source("elevation-detail.png", "Revit / elevation detail")}</div></div>
      <p className="five-workflow-result">{t("Modules generated and organized in Grasshopper were transferred through Rhino.Inside.Revit, then reviewed in Revit plans and elevations with their identification data.")}</p>
    </section>
  </>;
}
