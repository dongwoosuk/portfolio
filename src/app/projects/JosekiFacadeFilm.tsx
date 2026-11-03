"use client";
import {useJosekiText} from "./JosekiLanguage";
import {useEffect,useRef,useState} from "react";
import data from "./josekiFacade.json";
export default function JosekiFacadeFilm(){
 const translate=useJosekiText();
 const [index,setIndex]=useState(0),[phase,setPhase]=useState(0),[playing,setPlaying]=useState(false);
 const filmRef=useRef<HTMLElement>(null);
 const move=data.moves[index];
 useEffect(()=>{
  const film=filmRef.current;if(!film)return;
  const media=matchMedia("(prefers-reduced-motion: reduce)");
  const observer=new IntersectionObserver(entries=>{
   if(!media.matches&&entries.some(entry=>entry.isIntersecting&&entry.intersectionRatio>=.25)){
    setPlaying(true);observer.disconnect();
   }
  },{threshold:[.25]});
  observer.observe(film);
  const stop=()=>{if(media.matches)setPlaying(false);};
  media.addEventListener("change",stop);
  return()=>{observer.disconnect();media.removeEventListener("change",stop);};
 },[]);
 useEffect(()=>{
  if(!playing)return;
  if(phase===1){
   const started=performance.now();let frame=0;
   const advance=()=>{const elapsed=performance.now()-started;setIndex(Math.min(data.moves.length-1,Math.floor(elapsed/2500*data.moves.length)));if(elapsed>=2500)setPhase(3);else frame=requestAnimationFrame(advance);};
   frame=requestAnimationFrame(advance);return()=>cancelAnimationFrame(frame);
  }
  const timer=setTimeout(()=>{if(phase===0){setIndex(0);setPhase(1);}else if(phase===3){setPhase(4);setPlaying(false);}},600);
  return()=>clearTimeout(timer);
 },[playing,phase]);
 const choose=(i:number)=>{setIndex(i);setPhase(2);setPlaying(false);};
 const members=new Set(phase===0?[]:phase>=3?data.moves.flatMap(m=>m.members):move.members),geo=move.geometry.nodes as unknown as Record<string,{bounds:number[];ports:number[][]}>;
 const xs=data.nodes.map(n=>n.x),ys=data.nodes.map(n=>n.y),minX=Math.min(...xs),minY=Math.min(...ys),scale=Math.min((phase===2?485:1040)/(Math.max(...xs)-minX+100),440/(Math.max(...ys)-minY+100));
 const sourceTop=(620-((Math.max(...ys)-minY)*scale+12))/2-10;
 const cardsTop=(620-((Math.ceil(data.moves.length/5)-1)*102+89))/2-10;
 const boxes=Object.values(geo),l=Math.min(...boxes.map(n=>n.bounds[0])),t=Math.min(...boxes.map(n=>n.bounds[1]));const w=Math.max(...boxes.map(n=>n.bounds[0]+n.bounds[2]))-l,h=Math.max(...boxes.map(n=>n.bounds[1]+n.bounds[3]))-t;
 const s=Math.min(480/w,350/h),ox=650+(480-w*s)/2,oy=125+(350-h*s)/2;
 const lookup=new Map(data.nodes.map(n=>[n.id,n]));
 const point=(id:string)=>{const n=lookup.get(id)!;return[65+(n.x-minX)*scale,sourceTop+(n.y-minY)*scale];};
 const labels=["One definition. Many useful moves.","Find the logic worth keeping.","A Move, ready to inspect.","All the Moves. One definition.","Extracted. Ready to explore."];
 return <section ref={filmRef} data-playing={playing} className="jp-film jf-film" id="film" data-phase={phase} data-move={index} aria-label="Facade definition Move extraction"><div className="jp-film-top"><span>ADG / FACADE PANELING</span><span>{data.moves.length} REGISTERED MOVES / ONE SOURCE DEFINITION</span></div><svg viewBox="0 0 1200 620" role="group" aria-label={labels[phase]}><defs><pattern id="jf-dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".7" fill="#476650"/></pattern></defs><rect width="1200" height="620" fill="url(#jf-dots)"/>
 <g className="jf-source" opacity={phase===4?0:1}>{data.wires.map((wire,i)=>{const a=point(wire.a),b=point(wire.b);const chosen=members.has(wire.a)&&members.has(wire.b);return <path key={i} d={`M${a[0]+9} ${a[1]+5} C${a[0]+25} ${a[1]+5} ${b[0]-25} ${b[1]+5} ${b[0]} ${b[1]+5}`} fill="none" stroke={phase>0&&chosen?"#d4edb7":"#65886e"} strokeWidth={chosen&&phase>0?1.6:.55} opacity={phase>0&&!chosen?(phase===2?.06:.16):chosen&&phase>0?1:.55}/>;})}{data.nodes.filter(n=>!members.has(n.id)).map(n=>{const p=point(n.id);return <rect key={n.id} x={p[0]} y={p[1]} width="9" height="10" rx="2" fill="#54785c" opacity={phase===2?.12:phase===1?.25:.8}/>})}</g>
 {phase===2&&move.members.map(id=>{const p=point(id);return <g key={`source-${id}`}><rect x={p[0]-3} y={p[1]-3} width="17" height="18" rx="5" fill="#c6e8a5" fillOpacity=".16"/><rect x={p[0]} y={p[1]} width="11" height="12" rx="3" fill="#bfe09f" stroke="#ecf7d7" strokeWidth="1"/><title>{"Source: "+lookup.get(id)!.name}</title></g>;})}
 {phase===2&&<><text x="65" y="65" fill="#bed7a4" fontSize="11" letterSpacing="2">SOURCE / HIGHLIGHTED MOVE</text><path d="M585 80 V550" stroke="#4b6948" strokeDasharray="3 6"/></>}
 <rect className="jf-card-back" x="620" y="65" width="540" height="500" rx="20" fill="#203e2a" stroke="#638153" opacity={phase===2?.97:0}/>
 {phase===2&&<><text x="650" y="100" fill="#bed7a4" fontSize="11" letterSpacing="2">MOVE {String(index+1).padStart(2,"0")} / EXTRACTED STRUCTURE</text><text x="650" y="535" fill="#bdd2af" fontSize="12">{move.members.length} SOURCE NODES / SAVED joseki LAYOUT</text></>}
 {phase===2&&move.geometry.wires.map((wire,i)=>{const [a,b]=wire.points;const x1=ox+(a[0]-l)*s,y1=oy+(a[1]-t)*s,x2=ox+(b[0]-l)*s,y2=oy+(b[1]-t)*s;return <path key={i} d={`M${x1} ${y1} C${x1+25} ${y1} ${x2-25} ${y2} ${x2} ${y2}`} fill="none" stroke="#bddc9e" strokeWidth="1.3"/>;})}
 {phase>0&&phase<3&&move.members.map(id=>{const b=geo[id],p=point(id),ex=phase===2,x=ex?ox+(b.bounds[0]-l)*s:p[0],y=ex?oy+(b.bounds[1]-t)*s:p[1],width=ex?b.bounds[2]*s:11,height=ex?b.bounds[3]*s:12;return <g key={id} className="jf-node" style={{transform:`translate(${x}px,${y}px)`}}><title>{lookup.get(id)!.name}</title><rect width={width} height={height} rx="4" fill={phase>0?"#aaca8f":"#73966c"} stroke="#d1e8b4" strokeWidth=".8"/>{ex&&b.ports.map((p,i)=><circle key={i} cx={(p[0]-b.bounds[0])*s} cy={(p[1]-b.bounds[1])*s} r="1.4" fill="#e6f3d8"/>)}</g>;})}

 {(phase===3||phase===4)&&data.moves.map((m,i)=>{
  const nodes=Object.entries(m.geometry.nodes),bounds=nodes.map(([,n])=>n.bounds);
  const left=Math.min(...bounds.map(b=>b[0])),top=Math.min(...bounds.map(b=>b[1]));
  const width=Math.max(...bounds.map(b=>b[0]+b[2]))-left,height=Math.max(...bounds.map(b=>b[1]+b[3]))-top;
  const scale=Math.min(185/width,52/height),cx=35+(i%5)*230,cy=cardsTop+Math.floor(i/5)*102;
  const offsetX=cx+12+(185-width*scale)/2,offsetY=cy+27+(52-height*scale)/2,laid=phase===4;
  return <g key={m.id} className="jf-layout-move" role="button" tabIndex={laid?0:-1} aria-label={`Enlarge Move ${i+1}: ${m.title}`} onClick={()=>laid&&choose(i)} onKeyDown={e=>{if(laid&&(e.key==='Enter'||e.key===' ')){e.preventDefault();choose(i);}}} style={{pointerEvents:laid?'auto':'none'}}>
   <rect className="jf-tile" x={cx} y={cy} width="210" height="89" rx="12" fill="#203e2a" stroke="#638153" opacity={laid?1:0}/>
   <text x={cx+12} y={cy+17} fill="#c8dfb3" fontSize="9" opacity={laid?1:0}>{String(i+1).padStart(2,'0')} / {m.title.slice(0,27)}{m.title.length>27?'...':''}</text><title>{m.title}</title>
   {m.geometry.wires.map((wire,j)=>{const [a,b]=wire.points;const x1=offsetX+(a[0]-left)*scale,y1=offsetY+(a[1]-top)*scale,x2=offsetX+(b[0]-left)*scale,y2=offsetY+(b[1]-top)*scale;return <path key={j} className="jf-layout-wire" d={`M${x1} ${y1} C${x1+12} ${y1} ${x2-12} ${y2} ${x2} ${y2}`} fill="none" stroke="#bad99d" strokeWidth=".8" opacity={laid?1:0}/>;})}
   {nodes.map(([id,n])=>{const source=point(id);return <g key={id} className="jf-layout-node" style={{transform:`translate(${laid?offsetX+(n.bounds[0]-left)*scale:source[0]}px,${laid?offsetY+(n.bounds[1]-top)*scale:source[1]}px)`}}><rect width={laid?n.bounds[2]*scale:11} height={laid?n.bounds[3]*scale:12} rx="3" fill="#aaca8f" stroke="#d1e8b4" strokeWidth=".7"/>{laid&&n.ports.map((p:number[],j:number)=><circle key={j} cx={(p[0]-n.bounds[0])*scale} cy={(p[1]-n.bounds[1])*scale} r=".8" fill="#e6f3d8"/>)}</g>;})}
  </g>;
 })}
 <text x="65" y="585" fill="#93b184" fontSize="11">{data.nodes.length} source objects / {data.wires.length} connections / version-matched Move identities</text></svg>
 <div className="jp-film-caption"><div aria-live="off"><h2>{labels[phase]}</h2><p>{phase===0?"Original definition / no Move selected":phase>=3?`${data.moves.length} registered Moves / ${phase===4?"Click a Move to enlarge.":"Reassembling into saved layouts."}`:`${String(index+1).padStart(2,"0")} / ${data.moves.length} / ${move.title}`}</p></div><button onClick={()=>{if(playing)setPlaying(false);else{setIndex(0);setPhase(0);setPlaying(true);}}} aria-label={playing?"Pause film":"Play film"}>{playing?"Pause":"Play"}</button></div>
 <div className="jf-controls"><button onClick={()=>choose((index+data.moves.length-1)%data.moves.length)} aria-label="Previous Move">&larr;</button><label><span>EXPLORE A MOVE</span><select value={phase===0?"":index} onChange={e=>choose(Number(e.target.value))}><option value="" disabled>Select a Move</option>{data.moves.map((m,i)=><option key={m.id} value={i}>{String(i+1).padStart(2,"0")} / {m.title}</option>)}</select></label><button onClick={()=>choose(phase===0?0:(index+1)%data.moves.length)} aria-label="Next Move">&rarr;</button></div>
 <div className="jp-scenes" role="group" aria-label="Extraction stage">{[{label:"Source",value:0},{label:"Highlight",value:3},{label:"Extract",value:4}].map(({label,value})=><button key={label} aria-pressed={phase===value||(value===3&&phase===1)||(value===4&&phase===2)} onClick={()=>{if(value===0)setIndex(0);setPhase(value);setPlaying(false);}}>{label}</button>)}</div><p className="jf-note">{translate("Select a Move to inspect it beside its source. Based on an archived definition, not a live solve.")}</p></section>;
}

