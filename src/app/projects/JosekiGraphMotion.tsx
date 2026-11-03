"use client";
import { useEffect, useState } from "react";
import graph from "./josekiGraph.json";
import JosekiMeasuredGraph from "./JosekiMeasuredGraph";
import JosekiFullGraph from "./JosekiFullGraph";
const stages = ["Original definition", "Find the Move", "Extract the logic"];
export default function JosekiGraphMotion() {
 const [moveIndex,setMoveIndex]=useState(0); const [stage,setStage]=useState(2); const [playing,setPlaying]=useState(false); const [mode,setMode]=useState<"extract"|"network">("extract");
 useEffect(()=>{if(!window.matchMedia("(prefers-reduced-motion: reduce)").matches)setPlaying(true);},[]);
 useEffect(()=>{if(!playing)return;const t=setInterval(()=>setStage(s=>(s+1)%3),3800);return()=>clearInterval(t);},[playing]);
 const move=graph.moves[moveIndex], members=new Set(move.members);
 const selected=graph.nodes.filter(n=>members.has(n.id));
 const minX=Math.min(...graph.nodes.map(n=>n.x)),minY=Math.min(...graph.nodes.map(n=>n.y));
 const fullScale=Math.min(1050/(Math.max(...graph.nodes.map(n=>n.x))-minX+150),440/(Math.max(...graph.nodes.map(n=>n.y))-minY+100));
 const sx=Math.min(...selected.map(n=>n.x)),sy=Math.min(...selected.map(n=>n.y));
 const zoom=Math.min(850/(Math.max(...selected.map(n=>n.x))-sx+180),360/(Math.max(...selected.map(n=>n.y))-sy+100));
 const extracting=mode==="extract"&&stage===2;
 const position=(n:typeof graph.nodes[number])=> extracting&&members.has(n.id)?{x:150+(n.x-sx)*zoom,y:110+(n.y-sy)*zoom}:{x:55+(n.x-minX)*fullScale,y:65+(n.y-minY)*fullScale};
 const byId=new Map(graph.nodes.map(n=>[n.id,n]));
 const points=graph.frontageLines.flat(); const px=Math.min(...points.map(p=>p[0])),py=Math.min(...points.map(p=>p[1]));const ps= Math.min(600/(Math.max(...points.map(p=>p[0]))-px+10),210/(Math.max(...points.map(p=>p[1]))-py+10));
 return <section className="real-graph-story section-shell" aria-labelledby="real-graph-title"><span className="section-kicker">MOTION STUDY 02 / AN ACTUAL DEFINITION</span><h2 id="real-graph-title">One project.<br/><em>More than one useful Move.</em></h2><p className="real-graph-lede">ADG Pilot Project / Unit Division. Select a recorded Move and watch its actual nodes emerge from the source graph.</p>
 <div className="graph-mode-controls" role="group" aria-label="Visualization style"><button aria-pressed={mode==="extract"} onClick={()=>setMode("extract")}>Extraction film</button><button aria-pressed={mode==="network"} onClick={()=>setMode("network")}>Network pulse</button></div>
 <div className={`real-graph-screen ${mode} ${playing?'is-playing':''}`}><div className="graph-screen-top"><span>{graph.nodes.length} OBJECTS / {graph.wires.length} CONNECTIONS</span><span>{mode==="network"?"CONNECTIONS IN MOTION":stages[stage]}</span></div>{(stage===2 || mode==="network") ? <JosekiMeasuredGraph moveIndex={moveIndex} pulsing={playing && mode==="network"} /> : <JosekiFullGraph moveIndex={moveIndex} highlight={stage===1} />}<div className="graph-screen-bottom"><strong>{move.name}</strong><span>{move.members.length} original node identities / saved joseki layout / measured bounds and ports</span></div></div>
 <div className="graph-pick-controls" role="group" aria-label="Select a recorded Move">{graph.moves.map((m,i)=><button key={m.id} aria-pressed={i===moveIndex} onClick={()=>{setMoveIndex(i);setStage(2);}}><span>MOVE 0{i+1}</span><strong>{m.name}</strong><small>{m.members.length} source objects</small></button>)}</div><div className="graph-play-controls"><button onClick={()=>setPlaying(p=>!p)}>{playing?"Pause":"Play"}</button>{stages.map((s,i)=><button key={s} aria-pressed={stage===i} onClick={()=>{setStage(i);setPlaying(false);}}>{i+1} / {s}</button>)}</div>
 <div className="graph-proof-row"><div><span className="section-kicker">RECORDED REUSE / ALLOCATE UNIT FRONTAGES</span><h3>Same logic.<br/>Verified against the source.</h3><p>The recorded project test compared the extracted function with the reference output, checked fresh insertion, and confirmed that the source stayed unchanged.</p></div><figure><svg viewBox="0 0 660 270" role="img" aria-label="Plan projection of frontage curves from the recorded project test">{graph.frontageLines.map((line,i)=><polyline key={i} points={line.map(p=>`${30+(p[0]-px)*ps},${235-(p[1]-py)*ps}`).join(" ")} fill="none" stroke={i%2?"#719762":"#203c2b"} strokeWidth="3"/>)}</svg><figcaption>Actual recorded frontage-curve coordinates, shown in plan. This is test output, not a new live solve.</figcaption></figure></div>
 <details className="graph-provenance"><summary>Source and visualization details</summary><p>{graph.title}</p><p>Snapshot SHA-256: <code>{graph.sha256}</code></p><p>Original node identities, positions, and wire endpoints come from the archived graph. The extracted view reproduces joseki diagram colors, measured component bounds, port coordinates, wire endpoints, and saved layout. The full overview uses actual component port lists with a nonoverlapping left-to-right presentation layout; it does not modify the original definition. Extraction motion and traveling pulses are explanatory effects, not a recording of solver execution. Only the frontage test output shown here is represented by the reuse verification above.</p></details></section>;
}
