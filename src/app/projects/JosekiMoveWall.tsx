"use client";
import {useJosekiText} from "./JosekiLanguage";
import {useRef,useState} from "react";
import moves from "./josekiMoves.json";
type Move=typeof moves[number];
function Diagram({move}:{move:Move}){
 const nodes=Object.values(move.geometry.nodes) as {bounds:number[];ports:number[][]}[];
 const l=Math.min(...nodes.map(n=>n.bounds[0]))-18,t=Math.min(...nodes.map(n=>n.bounds[1]))-18;
 const w=Math.max(...nodes.map(n=>n.bounds[0]+n.bounds[2]))-l+18,h=Math.max(...nodes.map(n=>n.bounds[1]+n.bounds[3]))-t+18;
 return <svg viewBox={`${l} ${t} ${w} ${h}`} role="img" aria-label={`${move.title}, ${nodes.length} source nodes`}>
 {move.geometry.wires.map((wire,i)=>{const [a,b]=wire.points,c=Math.max(14,Math.abs(b[0]-a[0])*.5);return <path key={i} d={`M${a[0]} ${a[1]} C${a[0]+c} ${a[1]} ${b[0]-c} ${b[1]} ${b[0]} ${b[1]}`} fill="none" stroke="#9abb84" strokeWidth="1.5"/>;})}
 {nodes.map((n,i)=><g key={i}><rect x={n.bounds[0]} y={n.bounds[1]} width={n.bounds[2]} height={n.bounds[3]} rx={Math.min(6,n.bounds[3]/4)} fill="#698766" stroke="#b5d49d" strokeWidth=".8"/>{n.ports.map((p,j)=><circle key={j} cx={p[0]} cy={p[1]} r="1.6" fill="#dcecc7"/>)}</g>)}
 </svg>;
}
export default function JosekiMoveWall(){
 const t=useJosekiText();
 const [query,setQuery]=useState(""),[category,setCategory]=useState("All"),[selected,setSelected]=useState<Move|null>(null);const dialog=useRef<HTMLDialogElement>(null);
 const [expanded,setExpanded]=useState(false);
 const filtered=moves.filter(m=>(category==="All"||m.category===category)&&m.title.toLowerCase().includes(query.toLowerCase()));
 const filtering=category!=="All"||query.trim().length>0;
 const shown=expanded||filtering?filtered:filtered.slice(0,6);
 function open(move:Move){setSelected(move);dialog.current?.showModal();}
 return <section className="jm-wall" id="moves"><div className="jm-heading"><div><span className="jp-eyebrow">{t("EXPLORE THE LIBRARY")}</span><h2>{t("Small moves.")}<br/><em>{t("Many possibilities.")}</em></h2></div><p>{t("A selection of registered Moves, drawn from their saved joseki layouts. Pick one to inspect the structure.")}</p></div>
 <div className="jm-tools"><div role="group" aria-label="Filter Move category">{["All","Geometry","Facade","Planning"].map(c=><button key={c} aria-pressed={category===c} onClick={()=>setCategory(c)}>{c}</button>)}</div><label><span className="jm-sr">Search Moves</span><input type="search" placeholder="Find a Move..." value={query} onChange={e=>setQuery(e.target.value)}/></label></div>
 <p className="jm-count" aria-live="polite">{shown.length} of {moves.length} Moves</p>
 <div className="jm-grid">{shown.map((m,i)=><button className="jm-card" key={m.id} onClick={()=>open(m)} aria-label={`Inspect ${m.title}`}><div className="jm-card-top"><span>{m.category}</span><span>{String(i+1).padStart(2,"0")}</span></div><div className="jm-diagram"><Diagram move={m}/></div><h3>{m.title}</h3><div className="jm-card-foot"><span>{Object.keys(m.geometry.nodes).length} nodes / {m.geometry.wires.length} wires</span><span>Inspect &#8599;</span></div></button>)}</div>
 {!shown.length&&<p className="jm-empty">No matching Moves. Try a different name or category.</p>}
 {!filtering&&<button className="jm-expand" aria-expanded={expanded} onClick={()=>setExpanded(!expanded)}>{expanded?"Show fewer Moves":`Explore all ${moves.length} selected Moves`}</button>}
 <p className="jm-note">{t("Select a card to inspect its graph and source. Execution readiness varies by Move.")}</p>
 <dialog className="jm-modal" ref={dialog} onClick={e=>{if(e.target===e.currentTarget)dialog.current?.close();}}>{selected&&<><header><div><span>{selected.category} / REGISTERED MOVE</span><h3>{selected.title}</h3></div><button onClick={()=>dialog.current?.close()} aria-label="Close Move detail">Close &times;</button></header><div className="jm-modal-graph"><Diagram move={selected}/></div><footer><p>{Object.keys(selected.geometry.nodes).length} nodes &middot; {selected.geometry.wires.length} wires &middot; {selected.sources.length} source {selected.sources.length===1?"definition":"definitions"}</p><ul>{selected.sources.map(s=><li key={s}>{s}</li>)}</ul><p>Measured bounds and port positions; saved alignment. Colors are presentation styling, not verification status.</p></footer></>}</dialog>
 </section>;
}
