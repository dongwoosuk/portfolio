"use client";

import Image from "next/image";
import snippets from "./calPolyCode.json";
import { useHomeText } from "../HomeLanguage";

const parts = [
  { id: "01", title: "Facade panels", detail: "Control panel depth and jamb direction by facade.", tags: "Depth / Flare / Orientation", kind: "panels" },
  { id: "02", title: "Windows & bands", detail: "Place windows on the shared grid and align bands with adjacent panels.", tags: "Prototype / Grid / Datums", kind: "windows" },
  { id: "03", title: "Panel variations", detail: "Vary panel edges while keeping neighboring levels connected.", tags: "Edge states / Continuity", kind: "variants" },
];

const annotations = {
  panels: [
    { text: "Folded face", x: 25, y: 240, tx: 565, ty: 270 },
    { text: "Panel joint", x: 25, y: 650, tx: 600, ty: 665 },
  ],
  windows: [
    { text: "Window frame", x: 25, y: 205, tx: 415, ty: 220 },
    { text: "Horizontal band", x: 25, y: 650, tx: 745, ty: 680 },
  ],
  variants: [
    { text: "Depth transition", x: 25, y: 240, tx: 755, ty: 420 },
    { text: "Shared edge", x: 25, y: 650, tx: 750, ty: 700 },
  ],
};

function highlightPython(line: string) {
  const pattern = /(#.*$)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|\b(\d+(?:\.\d+)?)\b|\b(and|as|break|class|continue|def|elif|else|except|False|for|from|if|import|in|is|lambda|None|not|or|pass|return|True|try|while|with|yield)\b|\b([A-Za-z_]\w*)(?=\s*\()/g;
  const pieces = [];
  let cursor = 0;
  for (const match of line.matchAll(pattern)) {
    const offset = match.index!;
    if (offset > cursor) pieces.push(line.slice(cursor, offset));
    const kind = match[1] ? "comment" : match[2] ? "string" : match[3] ? "number" : match[4] ? "keyword" : "function";
    pieces.push(<span key={offset} className={`cp-code-${kind}`}>{match[0]}</span>);
    cursor = offset + match[0].length;
  }
  if (cursor < line.length) pieces.push(line.slice(cursor));
  return pieces;
}

export default function CalPolySystem() {
  const t = useHomeText();
  function modelView(kind: string, title: string) {
    return <a className="cp-system-capture cp-system-capture--annotated" href={`/work/facade/system/${kind}-detail.png`} target="_blank" rel="noreferrer">
      <Image src={`/work/facade/system/${kind}-detail.png`} alt={t(title)} width={1500} height={1100} sizes="(max-width: 760px) 90vw, 30vw" />
      <svg className="cp-system-annotations" viewBox="0 0 1500 1100" role="img" aria-label={t("Geometry notes")}>
        {annotations[kind as keyof typeof annotations].map((a) => <g key={a.text}>
          <path d={`M${a.x + 15} ${a.ty} H${a.tx}`} fill="none" stroke="var(--accent)" strokeWidth="2.5" />
          <circle cx={a.tx} cy={a.ty} r="7" fill="var(--accent)" />
          <text x={a.x} y={a.ty - 16} fill="var(--ink)" fontSize="28" fontWeight="500">{t(a.text)}</text>
        </g>)}
      </svg>
    </a>;
  }
  function codeFrame(kind: string) {
    const snippet = snippets[kind as keyof typeof snippets];
    return <div className="cp-system-code"><div className="cp-system-code-title"><span aria-hidden="true">● ● ●</span><span>{snippet.file}</span></div><pre aria-label={t("Source excerpt")}><code>{snippet.code.split("\n").map((line, i) => <span className="cp-system-code-line" key={i}><span className="cp-system-code-number" aria-hidden="true">{snippet.line + i}</span><span>{highlightPython(line)}</span></span>)}</code></pre></div>;
  }
  return <section className="cp-system section-shell" id="process" aria-labelledby="cp-system-title">
    <div className="case-section-heading"><div><span className="section-kicker">{t("02 / SCRIPTED FACADE SYSTEM")}</span><h2 id="cp-system-title">{t("Build the parts.")}<br /><em>{t("Connect the system.")}</em></h2></div><p>{t("Separate scripts build coordinated parts from shared geometry and design rules.")}</p></div>
    <div className="cp-system-input"><span>{t("SHARED INPUT")}</span><strong>{t("Massing + facade grid + floor datums")}</strong><p>{t("A common reference keeps the parts aligned.")}</p></div>
    <div className="cp-system-parts">{parts.map((part) => <article key={part.id}>{modelView(part.kind, part.title)}<h3>{t(part.title)}</h3><p>{t(part.detail)}</p><small>{t(part.tags)}</small>{codeFrame(part.kind)}</article>)}</div>
    <div className="cp-system-output"><div><span>{t("ASSEMBLE")}</span><h3>{t("Coordinated facade model")}</h3><p>{t("Review local details together at building scale.")}</p></div><div><span>{t("CLASSIFY")}</span><h3>{t("Panel types & profiles")}</h3><p>{t("Group geometric matches and retain type labels for review.")}</p></div></div>
    <p className="cp-system-note">{t("Isolated parts captured from the project model: west facade panels and windows, and east facade variations.")}</p>
  </section>;
}
