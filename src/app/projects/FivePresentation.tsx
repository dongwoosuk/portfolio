"use client";
import Image from "next/image";
import { useHomeText } from "../HomeLanguage";

export default function FivePresentation({ recap = false, modelsOnly = false }: { recap?: boolean; modelsOnly?: boolean }) {
  const t = useHomeText();
  const stages = recap
    ? [["rhino.jpg", "Rhino geometry"], ["revit-stage-01.jpg", "Revit / stage 1"], ["revit-stage-02.jpg", "Revit / stage 2"], ["revit-stage-03.jpg", "Revit / stage 3"]]
    : [["reference-array-2x2.png", "Module array"], ["massing-3x3-rotation.png", "Massing variation"], ["form-4x4-rotation.png", "Articulated form"]];
  return <div className={`five-presentation${modelsOnly ? " five-presentation--inline" : " section-shell"}${recap ? " five-presentation--recap" : " five-presentation--concept"}`}>
    {recap && !modelsOnly && <span className="section-kicker">{t("06 / RECAP")}</span>}
    <div className={`five-presentation-stages${recap ? " five-presentation-stages--four" : ""}`}>
      {stages.map(([file, caption]) => <figure key={file}><div className="five-presentation-model">
        {recap ? <Image src={`/work/five-by-five/${file}`} alt={t(caption)} fill sizes="(max-width: 760px) 44vw, 22vw" /> : <div className="five-concept-frame-crop"><Image src={`/work/five-by-five/${file}`} alt={t(caption)} width={1920} height={1080} sizes="(max-width: 760px) 80vw, 30vw" /></div>}
      </div><figcaption>{t(caption)}</figcaption></figure>)}
    </div>
    {!modelsOnly && <figure className={`five-presentation-graph${!recap ? " five-presentation-graph--cropped" : ""}`}><div className="five-presentation-graph-frame"><Image src={`/work/five-by-five/${recap ? "rir-definition.png" : "concept-definition.png"}`} alt={t(recap ? "Rhino.Inside.Revit / handoff definition" : "Grasshopper / working definition")} width={2000} height={recap ? 736 : 928} sizes="90vw" /></div><figcaption>{t(recap ? "Rhino.Inside.Revit / handoff definition" : "Grasshopper / working definition")}</figcaption></figure>}
  </div>;
}
