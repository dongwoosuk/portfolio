"use client";
import Image from "next/image";
import { useState } from "react";
import { useHomeText } from "../HomeLanguage";
import ViewportVideo from "./ViewportVideo";
import skillSource from "./mcpSkillSource.json";

function pythonLine(line: string) {
  const pattern = /(#.*$)|("[^"\n]*"|'[^'\n]*')|\b(\d+)\b|\b(def|for|in|if|else|return|None|True|False)\b|\b([A-Za-z_]\w*)(?=\s*\()/g;
  const parts = []; let cursor = 0;
  for (const match of line.matchAll(pattern)) {
    const pos = match.index!;
    if (pos > cursor) parts.push(line.slice(cursor, pos));
    const kind = match[1] ? "comment" : match[2] ? "string" : match[3] ? "number" : match[4] ? "keyword" : "function";
    parts.push(<span key={pos} className={`cp-code-${kind}`}>{match[0]}</span>);
    cursor = pos + match[0].length;
  }
  if (cursor < line.length) parts.push(line.slice(cursor));
  return parts;
}

export function McpBridge() {
  const t = useHomeText();
  return <div className="mcp-bridge-flow" aria-label={t("AI to design tool connection")}>
    <div><span className="section-kicker">AI ASSISTANT</span><h3>{t("Modeling request")}</h3><p>{t("Instructions, constraints, and revisions")}</p></div>
    <span className="mcp-bridge-arrow" aria-hidden="true">&harr;</span>
    <div className="mcp-bridge-server"><span className="section-kicker">MCP SERVER</span><h3>Rhino / Grasshopper MCP</h3><p>{t("Tool calls, scripts, and returned results")}</p></div>
    <span className="mcp-bridge-arrow" aria-hidden="true">&harr;</span>
    <div><span className="section-kicker">RHINO + GRASSHOPPER</span><h3>{t("Working model")}</h3><p>{t("Geometry, parameters, and editable definitions")}</p></div>
  </div>;
}

export default function McpEvidence() {
  const t = useHomeText();
  const [layoutReveal, setLayoutReveal] = useState(0);
  const [animateReveal, setAnimateReveal] = useState(false);
  const [tenjinResult, setTenjinResult] = useState(false);
  const [transamericaVersion, setTransamericaVersion] = useState("opus");
  const photo = (file: string, caption: string) => <figure><a className="mcp-evidence-image" href={`/work/mcp/${file}`} target="_blank" rel="noreferrer"><Image src={`/work/mcp/${file}`} alt={t(caption)} width={1920} height={1080} sizes="(max-width: 760px) 90vw, 44vw" /></a><figcaption>{t(caption)}</figcaption></figure>;
  return <>
    <section className="mcp-evidence section-shell" id="gallery">
      <div className="case-section-heading"><div><span className="section-kicker">{t("03 / APPLICATIONS")}</span><h2>{t("From requests to")}<br /><em>{t("organized models.")}</em></h2></div><p>{t("Tenjin connects a Rhino model with an editable Grasshopper definition. Transamerica compares modeling results produced with different AI models.")}</p></div>
      <div className="mcp-application-subhead"><span className="section-kicker">{t("03A / BUILDING MODELING")}</span></div><div className="mcp-study-pair"><article><span className="section-kicker">GRASSHOPPER + RHINO</span><h3>Tenjin Business Center</h3><div className="mcp-study-model"><Image src={tenjinResult ? "/work/mcp/tenjin-gh-result.png" : "/work/mcp/tenjin.png"} alt={t(tenjinResult ? "Tenjin / computed Grasshopper result" : "Tenjin / Rhino reference model")} width={1800} height={1500} sizes="(max-width: 760px) 88vw, 43vw" /></div><div className="mcp-model-tabs"><button type="button" aria-pressed={!tenjinResult} onClick={() => setTenjinResult(false)}>{t("Rhino model")}</button><button type="button" aria-pressed={tenjinResult} onClick={() => setTenjinResult(true)}>{t("GH result")}</button></div><p>{t("Compare the Rhino model with geometry computed from its Grasshopper definition in the same view. Floor count, module size, corner cuts, and facade dimensions remain adjustable.")}</p><details className="mcp-tenjin-references"><summary>{t("Reference photographs")}</summary><div className="mcp-reference-photos">{["10", "12", "24"].map(n => <a key={n} href={`/work/mcp/references/tenjin-${n}.jpg`} target="_blank" rel="noreferrer"><Image src={`/work/mcp/references/tenjin-${n}.jpg`} alt={t("Tenjin Business Center / reference photograph")} width={n === "12" ? 1499 : 667} height={1000} sizes="(max-width: 760px) 28vw, 14vw" /></a>)}</div><p className="mcp-reference-credit">{t("Architecture: OMA / Photography: Tomoyuki Kusunose")}</p></details><details className="mcp-tenjin-definition"><summary>{t("View Tenjin Grasshopper definition")}</summary>{photo("tenjin-definition-native-active.png", "Tenjin / Grasshopper definition")}</details></article><article><span className="section-kicker">RHINO</span><h3>Transamerica</h3><div className="mcp-study-model"><Image src={`/work/mcp/transamerica-${transamericaVersion}.png`} alt={`Transamerica / ${transamericaVersion}`} width={1800} height={1500} sizes="(max-width: 760px) 88vw, 43vw" /></div><div className="mcp-model-tabs"><button type="button" aria-pressed={transamericaVersion === "opus"} onClick={() => setTransamericaVersion("opus")}>Opus</button><button type="button" aria-pressed={transamericaVersion === "fable"} onClick={() => setTransamericaVersion("fable")}>Fable / v2</button></div><p>{t("Switch between the Opus and Fable studies to compare the tower silhouette, spire, facade, and base structure. These are modeling examples from separate runs, rather than a controlled benchmark.")}</p></article></div>

    </section>
    <section className="mcp-evidence mcp-application section-shell">
      <div className="case-section-heading"><div><span className="section-kicker">{t("03B / REPEATABLE MASSING")}</span><h2>{t("A repeatable procedure.")}<br /><em>{t("Many massing options.")}</em></h2></div><p>{t("The tower study uses a saved Claude Skill to describe the modeling procedure and MCP to execute operations in Rhino. The Skill supplies the recipe; MCP provides access to the design tool.")}</p></div>
      <div className="mcp-evidence-pair mcp-demo-pair"><ViewportVideo src="/work/mcp/tower-demo.mp4" poster="/work/mcp/tower-options.jpg" label={t("Claude Skill and MCP / tower massing demonstration")} />{photo("tower-options.jpg", "Tower massing / generated option set")}</div>
      <div className="mcp-skill-heading"><h3>{t("The saved Skill and its modeling engine.")}</h3><p>{t("Claude Code reads the Skill commands and calls the Python engine through MCP. Selecting an option retains its typology and lineage color while the next generation varies its parameters.")}</p></div>
      <div className="mcp-skill-sources">{(["skill", "script"] as const).map(kind => {
        const source = skillSource[kind];
        return <article key={kind}><span className="section-kicker">{t(kind === "skill" ? "CLAUDE CODE / SAVED SKILL" : "RHINO PYTHON / MODELING ENGINE")}</span><div className={`mcp-source-window${kind === "skill" ? " mcp-source-window--skill" : ""}`}><div className="mcp-source-title"><span aria-hidden="true">● ● ●</span>{source.file}</div><pre><code>{source.code.split("\n").map((line, i) => <span className="mcp-source-line" key={i}><span className="mcp-source-number">{kind === "script" ? skillSource.script.lineNumbers[i] : source.start + i}</span><span>{kind === "script" ? pythonLine(line) : <><span className="mcp-skill-command">{line.split("|")[1]?.trim()}</span><span className="mcp-skill-action">{line.split("|")[2]?.trim()}</span></>}</span></span>)}</code></pre></div></article>;
      })}</div>
      <details className="mcp-spec"><summary>{t("View the modeling specification")}</summary>{photo("skill-spec.png", "Tower grid / modeling specification")}</details>
    </section>
    <section className="mcp-evidence section-shell" id="mcp-extensions">
      <div className="case-section-heading"><div><span className="section-kicker">{t("04 / CUSTOM EXTENSIONS")}</span><h2>{t("A definition carries")}<br /><em>{t("more than geometry.")}</em></h2></div><p>{t("Components, wires, and positions describe both the logic of a definition and the way its author organizes the canvas.")}</p></div>
      <div className="mcp-layout-comparison">
        <div className="mcp-skill-heading"><h3>{t("Same graph. Different arrangement.")}</h3><p>{t("A branching Grasshopper test graph with deliberately shuffled positions, captured before and after layout at the same zoom. All 53 objects, 60 wires, slider values, and the final Python 3 result remain unchanged.")}</p></div>
        <div className={`mcp-layout-wipe${animateReveal ? " mcp-layout-wipe--animate" : ""}`}>
          <Image src="/work/mcp/layout/branching-before.png" alt={t("Grasshopper graph before layout")} width={3200} height={1200} sizes="88vw" unoptimized />
          <div className="mcp-layout-wipe-after" style={{ clipPath: `inset(0 ${100 - layoutReveal}% 0 0)` }}><Image src="/work/mcp/layout/branching-after.png" alt={t("The same Grasshopper graph after layout")} width={3200} height={1200} sizes="88vw" unoptimized /></div>
          <div className="mcp-layout-wipe-handle" style={{ left: `${layoutReveal}%` }} aria-hidden="true"><span>&harr;</span></div>
          <input type="range" min="0" max="100" value={layoutReveal} onChange={event => { setAnimateReveal(false); setLayoutReveal(Number(event.target.value)); }} aria-label={t("Drag to compare before and after")} />
        </div>
        <div className="mcp-layout-endpoints"><button type="button" aria-pressed={layoutReveal === 0} onClick={() => { setAnimateReveal(true); setLayoutReveal(0); }}>{t("Before")}</button><button type="button" aria-pressed={layoutReveal === 100} onClick={() => { setAnimateReveal(true); setLayoutReveal(100); }}>{t("After")}</button></div>
      </div>
      <div className="mcp-learning-flow">{[
        ["READ", "Components / connections / positions", "Inspect the structure of an existing definition."],
        ["LEARN", "Spacing / flow / arrangement", "Store layout patterns as reusable preferences."],
        ["ARRANGE", "Measured ports / bounds / wires", "Apply spacing preferences within the actual geometry of the canvas."],
      ].map(([label, title, body]) => <article key={label}><span className="section-kicker">{t(label)}</span><h3>{t(title)}</h3><p>{t(body)}</p></article>)}</div>
      <div className="mcp-code-pair"><article><span className="section-kicker">{t("LAYOUT LEARNING / SOURCE EXCERPT")}</span><pre><code>{'samples["x"].append(patterns["avg_spacing_x"])\nsamples["x"] = samples["x"][-50:]\nprefs["spacing_x"] = sum(samples["x"]) / len(samples["x"])\nself.save_preferences()'.split("\n").map((line, i) => <span className="mcp-python-line" key={i}>{pythonLine(line)}</span>)}</code></pre><p>{t("Spacing samples accumulate into saved preferences. Learning here refers to layout patterns, rather than training a model to understand architectural design.")}</p></article><article><span className="section-kicker">{t("LAYOUT APPLICATION / SOURCE EXCERPT")}</span><pre><code>{'layout_result = calculate_layout(\n    components=components,\n    wires=wires,\n    spacing_x=max(40, learner.spacing_pattern.avg_x),\n    spacing_y=max(20, learner.spacing_pattern.avg_y)\n)'.split("\n").map((line, i) => <span className="mcp-python-line" key={i}>{pythonLine(line)}</span>)}</code></pre><p>{t("The current layout operation combines learned spacing with measured port alignment. It supports a preview before moving components.")}</p></article></div>
    </section>
      <section className="mcp-evidence section-shell mcp-development-section">
        <div className="case-section-heading"><div><span className="section-kicker">{t("05 / DEVELOPMENT")}</span><h2>{t("Early exploration.")}<br /><em>{t("Continued development.")}</em></h2></div><p>{t("Development began in December 2025, before McNeel publicly announced its official Rhino MCP in May 2026.")}</p></div>
        <ol className="mcp-development-timeline">

          <li><time dateTime="2025-12">2025.12</time><h3>{t("Initial implementation")}</h3><p>{t("The initial Rhino / Grasshopper MCP implementation was recorded in the repository.")}</p><a href="https://github.com/dongwoosuk/rhino-grasshopper-mcp/commit/2451280515b4cc8451b27f94e88ad58ec733f216" target="_blank" rel="noreferrer">{t("Initial commit")} &rarr;</a></li>
          <li><time dateTime="2026-05">2026.05</time><h3>{t("McNeel public announcement")}</h3><p>{t("McNeel announced its official MCP on the Rhino forum.")}</p><a href="https://discourse.mcneel.com/t/rhino-mcp-server/216568/2" target="_blank" rel="noreferrer">{t("Announcement")} &rarr;</a></li>
        </ol>
        <div className="mcp-contribution-summary"><div><span className="section-kicker">{t("FOUNDATION")}</span><p>{t("An open-source MCP bridge connecting AI assistants with Rhino and Grasshopper.")}</p></div><div><span className="section-kicker">{t("MY EXTENSIONS")}</span><p>{t("Definition analysis, saved layout patterns, live graph editing, and measured-port canvas organization.")}</p></div></div>
        <a href="https://github.com/dongwoosuk/rhino-grasshopper-mcp" target="_blank" rel="noreferrer">{t("View source on GitHub")} &rarr;</a>
      </section>
  </>;
}
