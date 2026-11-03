"use client";

import Image from "next/image";
import { useHomeText } from "../HomeLanguage";
import evidence from "./calPolyEvidence.json";
import CalPolyPanelSwitch from "./CalPolyPanelSwitch";

// Presentation crops use the original files; opening an image shows its complete board.
const crops: Record<string, [number, number, number, number]> = {
  summer: [.025, .31, .955, .40], winter: [.025, .31, .955, .40],
  rose: [.02, 0, .96, .89], dome: [.02, 0, .96, .89], temperature: [.02, 0, .96, .89],
  jun21: [.015, .12, .97, .60], dec21: [.015, .12, .97, .60],
  jambsw: [.02, .185, .785, .405], jambnw: [.005, .08, .99, .92],
};

export default function CalPolyEvidence() {
  const t = useHomeText();
  function figure(key: string) {
    const asset = evidence.assets.find((item) => item.key === key)!;
    const crop = crops[key];
    return <figure key={key} className={`cp-figure cp-figure--${key}`}>
      <a href={asset.src} target="_blank" rel="noreferrer" aria-label={`${t("Open full image ↗")}: ${t(asset.caption)}`}>
        {crop ? <div className="cp-crop-frame" style={key === "jambsw" || key === "jambnw" ? { aspectRatio: "2450.77 / 648" } : undefined}><div className="cp-crop" style={{ aspectRatio: `${asset.width * crop[2]} / ${asset.height * crop[3]}` }}><Image src={asset.src} alt={t(asset.caption)} width={asset.width} height={asset.height} sizes="(max-width: 760px) 95vw, 90vw" style={{ position: "absolute", width: `${100 / crop[2]}%`, height: `${100 / crop[3]}%`, maxWidth: "none", maxHeight: "none", objectFit: "fill", left: `${-100 * crop[0] / crop[2]}%`, top: `${-100 * crop[1] / crop[3]}%` }} /></div></div> : <Image src={asset.src} alt={t(asset.caption)} width={asset.width} height={asset.height} sizes="(max-width: 760px) 90vw, 88vw" />}
      </a>
      <figcaption>{t(asset.caption)} <span aria-hidden="true">↗</span></figcaption>
    </figure>;
  }
  return <section className="cp-evidence section-shell" id="evidence" aria-labelledby="cp-evidence-title">
    <header className="case-section-heading"><div><span className="section-kicker">{t("03 / SOLAR & FACADE STUDIES")}</span><h2 id="cp-evidence-title">{t("Read the sun.")}<br /><em>{t("Shape the facade.")}</em></h2></div><p>{t("From seasonal exposure to a window detail, then back to the whole building.")}</p></header>
    <div className="cp-annual"><div className="cp-study-heading"><h3>{t("Start with direction and altitude.")}</h3><p>{t("Compare sun paths, directional exposure, and radiation by altitude.")}</p></div><div className="cp-annual-grid">{figure("temperature")}{figure("rose")}{figure("dome")}</div></div>
    <article className="cp-study"><div className="cp-study-heading"><span>{t("SUMMER EXPOSURE")}</span><h3>{t("Account for low afternoon sun.")}</h3><p>{t("Low-angle sun makes facade depth and side shading important alongside horizontal shading.")}</p></div>
      <div className="cp-metrics"><div><strong>63%</strong><span>{t("Summer / upper glazing / sun below 50°")}</span></div></div>
      <div className="cp-summer-board">
      <div className="cp-pair">{figure("summerhigh")}{figure("summerlow")}</div>
      <div className="cp-summer-legend" role="img" aria-label={t("Incident radiation / 0–800 kWh/m²")}>
        <div className="cp-crop" style={{ aspectRatio: "3010 / 80" }}>
          <Image src="/work/facade/solar/26-0812_Incident_Summer_AltitudeSplit.png" alt="" width={3122} height={1600} sizes="90vw" style={{ position: "absolute", width: "103.73%", height: "2000%", maxWidth: "none", maxHeight: "none", objectFit: "fill", left: "-1.86%", top: "-1770%" }} />
        </div>
      </div>
      </div>
    </article>
    <article className="cp-study"><div className="cp-study-heading"><span>{t("ASYMMETRIC JAMBS")}</span><h3>{t("Give each edge a different role.")}</h3><p>{t("Deep and flared jambs balance shading and solar access. Their arrangement reverses between southwest and northwest facades.")}</p></div>
      <div className="cp-jamb-comparison">{figure("closeup")}<div className="cp-jamb-plans">{figure("jambsw")}{figure("jambnw")}</div></div>
    </article>
    <article className="cp-study"><div className="cp-study-heading"><span>{t("BUILDING COMPOSITION")}</span><h3>{t("Carry the detail across the elevation.")}</h3><p>{t("Review panel depth, asymmetric faces, and window rhythm across the whole building.")}</p></div>
      <CalPolyPanelSwitch /><div className="cp-pair">{figure("renderb")}{figure("renderc")}</div>
    </article>
  </section>;
}
