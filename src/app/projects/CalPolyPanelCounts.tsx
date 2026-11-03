"use client";

import { useHomeText } from "../HomeLanguage";

const counts = [240, 70, 41, 40, 31, 30, 26, 23, 20, 19, 18, 15, 9, 3, 3, 1, 1];
const colors = ["#d46b6b", "#bd8874", "#e4a478", "#aa8d5e", "#dfcb70", "#48c9cf", "#cd46a3", "#93c962", "#b5c963", "#61bd58", "#9a70c4", "#62a66b", "#7bdd9d", "#74b89e", "#72d3bc", "#7871af", "#5899dc"];

export default function CalPolyPanelCounts() {
  const t = useHomeText();
  const left = 46, baseline = 286, plotHeight = 240, step = 57, barWidth = 32;
  return <figure className="cp-panel-counts">
    <figcaption>{t("Panel quantities by type")}</figcaption>
    <svg viewBox="0 0 1040 330" role="img" aria-label={t("Panel quantities by type")}>
      <title>{t("Panel quantities by type")}</title>
      <desc>{counts.map((count, i) => `T${i + 1}: ${count}`).join(", ")}</desc>
      {[0, 50, 100, 150, 200, 250].map((tick) => {
        const y = baseline - tick / 250 * plotHeight;
        return <g key={tick}><line x1={left} x2="1026" y1={y} y2={y} stroke="#bcc6ba" strokeWidth="1" opacity=".55" /><text x={left - 12} y={y + 4} textAnchor="end" fill="#69766a" fontSize="11">{tick}</text></g>;
      })}
      {counts.map((count, i) => {
        const x = left + i * step + 12, height = count / 250 * plotHeight;
        return <g key={i}><title>{`T${i + 1}: ${count}`}</title><rect x={x} y={baseline - height} width={barWidth} height={height} fill={colors[i]} rx="2" /><text x={x + barWidth / 2} y={baseline - height - 9} textAnchor="middle" fill="#283c32" fontSize="12" fontWeight="600">{count}</text><text x={x + barWidth / 2} y={baseline + 24} textAnchor="middle" fill="#526158" fontSize="11">T{i + 1}</text></g>;
      })}
    </svg>
  </figure>;
}
