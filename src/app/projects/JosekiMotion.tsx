"use client";
import { useEffect, useState } from "react";
const beats = [
  ["Your best work already exists.", "Inside the definitions you have built."],
  ["Find the move inside the model.", "Reveal reusable logic within a larger workflow."],
  ["Keep the logic. Keep its context.", "A Move carries its inputs, outputs, and source."],
  ["Pick it up. Build what comes next.", "Bring a reviewed starting point into a new canvas."],
];
const colors = ["#df8e62", "#a9c99b", "#8eb9d3"];
function Network({ selected = false, compact = false }: { selected?: boolean; compact?: boolean }) {
 const count=compact?6:24,cols=compact?3:6;
 const names=["Number","Divide","Shift","Merge","Python 3","Surface"];
 const nodes=Array.from({length:count},(_,i)=>({x:18+(i%cols)*70,y:28+Math.floor(i/cols)*57,name:names[i%6],slider:i%6===0,script:i%6===4}));
 return <g>{nodes.map((n,i)=>i%cols?<path key={`w${i}`} d={`M${nodes[i-1].x+56} ${nodes[i-1].y+19} C${n.x-8} ${nodes[i-1].y+19} ${n.x-12} ${n.y+19} ${n.x} ${n.y+19}`} fill="none" stroke={selected?"#c8e5ae":"#92b393"} strokeWidth="1"/>:null)}{nodes.map((n,i)=><g key={i}><rect x={n.x} y={n.y} width="56" height={n.slider?24:38} rx="5" fill={selected?"#b6d49f":"#68846b"} stroke="#b7cbae" strokeWidth=".7"/>{n.slider?<><text x={n.x+5} y={n.y+9} fontSize="5" fill="#203b2a">Number Slider</text><path d={`M${n.x+5} ${n.y+17} h36`} stroke="#304e37" strokeWidth="2"/><circle cx={n.x+28} cy={n.y+17} r="2.5" fill="#d9edc7"/><text x={n.x+46} y={n.y+19} fontSize="5" fill="#203b2a">8</text></>:<><rect x={n.x+21} y={n.y+2} width="16" height="34" rx="2" fill={selected?"#a0c18a":"#526f57"}/><text transform={`translate(${n.x+31} ${n.y+19}) rotate(-90)`} textAnchor="middle" fontSize="6" fill="#edf3e4">{n.name}</text>{[0,1,2].map(k=><g key={k}><circle cx={n.x} cy={n.y+9+k*10} r="1.5" fill="#dbe9cd"/><text x={n.x+4} y={n.y+11+k*10} fontSize="5" fill="#183522">{["G","N","t"][k]}</text></g>)}<text x={n.x+46} y={n.y+21} fontSize="5" fill="#183522">{n.script?"out":"R"}</text></>}<circle cx={n.x+56} cy={n.y+19} r="1.5" fill="#dbe9cd"/></g>)}</g>;
}

function Building({ alternate = false, glow = false }: { alternate?: boolean; glow?: boolean }) {
 return <g transform={alternate ? "translate(18 20)" : "translate(0 0)"}>{Array.from({length:7},(_,floor) => Array.from({length:10},(_,bay) => {
 const x=40+bay*30, y=210-floor*24-bay*3+(alternate ? Math.sin(bay*.6)*25 : 0);
 return <g key={`${floor}-${bay}`}><path d={`M${x} ${y} l26 -3 v-21 l-26 3 Z`} fill={glow && bay%3===0 ? "#b4d8a5" : floor%2===0 ? "#81978b" : "#637e70"} stroke="#182c24" strokeWidth="1"/><path d={`M${x+5} ${y-4} l16 -2 v-12 l-16 2 Z`} fill="#233d34"/><path d={`M${x+26} ${y-3} l8 -7 v-21 l-8 7 Z`} fill="#405d4f"/></g>;
 }))}</g>;
}
export default function JosekiMotion() {
 const [step,setStep]=useState(0); const [playing,setPlaying]=useState(false);
 useEffect(() => { if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPlaying(true); },[]);
 useEffect(() => { if (!playing) return; const timer=setInterval(() => setStep(s => (s+1)%4),4500); return () => clearInterval(timer); },[playing]);
 return <section className="joseki-product" aria-labelledby="joseki-product-title">
 <div className="joseki-product-heading"><span className="joseki-wordmark">joseki<span> / A LIBRARY OF MOVES</span></span><span className="joseki-product-status">PRODUCT CONCEPT / WORKING MVP</span></div>
 <div className="joseki-product-copy"><h2 id="joseki-product-title">Your next project.<br /><em>Already a move ahead.</em></h2><p>Bring the useful logic from past Grasshopper projects into the work ahead.</p></div>
 <div className={`joseki-motion stage-${step}`}>
 <svg viewBox="0 0 1200 610" role="img" aria-labelledby="motion-title motion-desc"><title id="motion-title">{beats[step][0]}</title><desc id="motion-desc">Illustrated product sequence: a parametric facade and its graph, a highlighted reusable selection, a Move card, and reuse in a new graph and facade. This is a conceptual animation, not a recorded extraction.</desc><defs><pattern id="canvas-dots" width="15" height="15" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".7" fill="#54695a" /></pattern></defs>
 <g className="motion-source"><text x="40" y="35" className="motion-label">01 / A PROJECT YOU HAVE BUILT</text><g transform="translate(40 35)"><Building glow={step>0}/></g><rect x="35" y="290" width="465" height="270" rx="12" fill="#21362c" stroke="#627566"/><rect x="35" y="290" width="465" height="270" rx="12" fill="url(#canvas-dots)"/><g transform="translate(44 297)"><Network/></g><text x="53" y="542" className="motion-small">PARAMETRIC DEFINITION / SCHEMATIC</text>
 <g className="motion-groups"><rect x="124" y="370" width="211" height="113" rx="9" fill="#afd49d" fillOpacity=".12" stroke="#b5dc9f" strokeWidth="2"/><rect x="58" y="320" width="140" height="45" rx="7" fill="none" stroke="#df8e62"/><rect x="340" y="428" width="140" height="96" rx="7" fill="none" stroke="#8eb9d3"/><text x="134" y="389" fill="#c9e9b8" fontSize="10">REUSABLE SELECTION</text></g></g>
 <path className="motion-extract-wire" d="M335 420 C530 420 470 230 570 230" stroke="#b5dc9f" strokeWidth="2" strokeDasharray="6 6" fill="none"/>
 <g className="motion-move"><rect x="553" y="147" width="252" height="250" rx="16" fill="#d7e8c9"/><text x="577" y="180" fill="#34523e" fontSize="12" letterSpacing="2">joseki / MOVE</text><text x="577" y="215" fill="#183626" fontSize="24" fontWeight="700">Reusable logic</text><g transform="translate(556 224) scale(.9)"><Network selected compact/></g><text x="577" y="365" fill="#34523e" fontSize="12">INPUTS / OUTPUTS / SOURCE</text><circle cx="553" cy="270" r="5" fill="#c5e4ae"/><circle cx="805" cy="270" r="5" fill="#c5e4ae"/></g>
 <g className="motion-target"><text x="848" y="35" className="motion-label">02 / YOUR NEXT PROJECT</text><g transform="translate(813 37) scale(.93)"><Building alternate glow/></g><rect x="847" y="335" width="310" height="185" rx="12" fill="#21362c" stroke="#627566"/><rect x="847" y="335" width="310" height="185" rx="12" fill="url(#canvas-dots)"/><g transform="translate(890 360) scale(.85)"><Network selected compact/></g><text x="868" y="497" className="motion-small">NEW INPUTS. REUSED LOGIC.</text></g>
 <path className="motion-reuse-wire" d="M805 270 C855 270 822 414 895 414" fill="none" stroke="#b5dc9f" strokeWidth="3" strokeDasharray="8 5"/>
 </svg>
 <div className="motion-caption" aria-live="off"><strong>{beats[step][0]}</strong><span>{beats[step][1]}</span></div></div>
 <div className="motion-toolbar"><div className="motion-steps" role="group" aria-label="Animation scene">{["Project","Discover","Pick a Move","Reuse"].map((label,i)=><button type="button" key={label} aria-pressed={i===step} onClick={()=>{setStep(i);setPlaying(false);}}><span>0{i+1}</span>{label}</button>)}</div><button type="button" className="motion-play" onClick={()=>setPlaying(p=>!p)} aria-label={playing ? "Pause animation" : "Play animation"}>{playing ? "Pause" : "Play"}</button></div>
 <div className="joseki-product-footer"><p>Illustrated workflow. Actual source-linked preparation and reviewed reuse are shown below.</p><a href="#joseki-real-interface">See the working interface &darr;</a></div>
 </section>;
}
