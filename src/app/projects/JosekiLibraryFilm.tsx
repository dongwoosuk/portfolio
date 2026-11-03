"use client";
import {useJosekiText} from "./JosekiLanguage";
import {useEffect,useLayoutEffect,useState,useRef,type CSSProperties} from "react";
import catalog from "./josekiMoves.json";
import library from "./josekiConstellation.json";

const moves=[catalog[0],catalog[1],catalog[2],catalog[5],catalog[6],catalog[8]];
const featuredIds=new Set(moves.map(m=>m.id));
const definitions=[...library.filter(s=>s.moves.some(id=>featuredIds.has(id))),...library.filter(s=>!s.moves.some(id=>featuredIds.has(id)))];
const featuredDefinitionCount=library.filter(s=>s.moves.some(id=>featuredIds.has(id))).length;
const rawReferences=definitions.flatMap((source,sourceIndex)=>source.moves.map((id,index)=>({id,sourceIndex,key:`${source.id}-${index}`})));
const featuredReferences=moves.map(m=>rawReferences.find(r=>r.id===m.id)!);
const featuredKeys=new Set(featuredReferences.map(r=>r.key));
const references=[...featuredReferences,...rawReferences.filter(r=>!featuredKeys.has(r.key)).sort((a,b)=>Math.abs(sourceY(a.sourceIndex)+32-300)-Math.abs(sourceY(b.sourceIndex)+32-300)||a.sourceIndex-b.sourceIndex)];
function stackedY(i:number,featured:number,step:number,height:number){
 if(i<featured)return 52+i*step;
 const offset=i-featured,below=640+Math.floor(offset/2)*step;
 return offset%2===0?600-below-height:below;
};
function sourceY(i:number){return stackedY(i,5,108,64);}
const moveY=(i:number)=>stackedY(i,6,84,76);
const optionY=(i:number)=>i===0?52:52+(i%2?-1:1)*Math.ceil(i/2)*650;
const extents=[...definitions.flatMap((_,i)=>[sourceY(i),sourceY(i)+64]),...references.flatMap((_,i)=>[moveY(i),moveY(i)+76]),...Array.from({length:128},(_,i)=>[optionY(i),optionY(i)+496]).flat()];
const worldRadius=Math.max(...extents.map(y=>Math.abs(y-300)))+50;
const overviewScale=280/worldRadius;
const cameraTransform=(scale:number)=>`translate(${(600*(1-scale)).toFixed(5)}px, ${(300*(1-scale)).toFixed(5)}px) scale(${scale.toFixed(8)})`;
const options=Array.from({length:128},(_,i)=>{
 if(i===0)return [0,1,5];
 const anchor=Math.floor(i/127*(references.length-3));
 const result=[anchor];
 const pool=Math.min(references.length,anchor+6);
 for(let candidate of [(anchor+i*17)%pool,(anchor+i*29)%pool]){
  while(result.some(index=>references[index].id===references[candidate].id))candidate=(candidate+1)%pool;
  result.push(candidate);
 }
 return result;
});
// Stable pseudo-random timing keeps server/client output identical.
const jitter=(seed:number)=>((Math.imul(seed+17,1664525)+1013904223)>>>0)%1000/1000;
// Follow the shared center-out window, with small variations among nearby connections.
const revealTime=(radius:number)=>{
 const scale=Math.max(1,radius/248);
 const stops=[[0,1],[1.8,1.9],[4.2,5],[6.6,16],[9,50],[12,worldRadius/248]];
 for(let k=1;k<stops.length;k++)if(scale<=stops[k][1]){
  const [t0,s0]=stops[k-1],[t1,s1]=stops[k];return t0+(scale-s0)/(s1-s0)*(t1-t0);
 }
 return 12;
};
const branchDuration=(i:number)=>.65+jitter(i*79)*.4;
const branchDelay=(i:number,total:number)=>{
 if(total===references.length){
  if(i<6)return i*.18;
  const sourceRadius=Math.abs(sourceY(references[i].sourceIndex)+32-300);
  const moveRadius=Math.abs(moveY(i)+38-300)+38;
  const nearbyTime=revealTime(Math.max(sourceRadius,moveRadius));
  return Math.round(Math.max(0,nearbyTime-.35+(jitter(i*31)-.5)*.5)*10000)/10000;
 }
 return Math.round((.6+8.5*Math.log1p(i)/Math.log(total))*10000)/10000;
};
const moveArrival=(i:number)=>i<6?0:branchDelay(i,references.length)+branchDuration(i);
const optionStart=(i:number)=>Math.max(branchDelay(i,options.length),...options[i].map(moveArrival))+.12;
const optionArrival=(i:number)=>optionStart(i)+1.6;
const stages=["Extract the useful logic.","One library. Different possibilities.","Every option keeps its origins."];
const descriptions=["Follow each Move back to its source definition.","The same Moves can participate in different proposed assemblies.","Zoom out through the same graph: the centered definition and Move stacks branch upward and downward into possible workspaces."];
function MiniGraph({move}:{move:typeof catalog[number]}){
 const nodes=Object.values(move.geometry.nodes) as unknown as Array<{bounds:number[];ports:number[][]}>;
 const left=Math.min(...nodes.map(n=>n.bounds[0]))-8,top=Math.min(...nodes.map(n=>n.bounds[1]))-8;
 const width=Math.max(...nodes.map(n=>n.bounds[0]+n.bounds[2]))-left+8,height=Math.max(...nodes.map(n=>n.bounds[1]+n.bounds[3]))-top+8;
 return <svg x="12" y="23" width="164" height="47" viewBox={`${left} ${top} ${width} ${height}`}>
  {move.geometry.wires.map((w,i)=>{const [a,b]=w.points;return <path key={i} d={`M${a[0]} ${a[1]} C${a[0]+25} ${a[1]} ${b[0]-25} ${b[1]} ${b[0]} ${b[1]}`} fill="none" stroke="#b9d69f" strokeWidth="2"/>;})}
  {nodes.map((n,i)=><g key={i}><rect x={n.bounds[0]} y={n.bounds[1]} width={n.bounds[2]} height={n.bounds[3]} rx="6" fill="#668760" stroke="#d3e8bb"/>{n.ports.map((p,j)=><circle key={j} cx={p[0]} cy={p[1]} r="2" fill="#e3f1ce"/>)}</g>)}
 </svg>;
}

export default function JosekiLibraryFilm(){
 const t=useJosekiText();
 const [stage,setStage]=useState(0),[playing,setPlaying]=useState(false),[inspectionScale,setInspectionScale]=useState<number|null>(null);
 const filmRef=useRef<HTMLDivElement>(null),elapsedRef=useRef(0);
 const [finished,setFinished]=useState(false);
 useLayoutEffect(()=>{
  const film=filmRef.current;if(!film)return;
  const clip=film.querySelector<SVGRectElement>(".jl-stack-window")!;
  const camera=film.querySelector<SVGGElement>(".jl-world-camera")!;
  const endCard=film.querySelector<HTMLDivElement>(".jl-end-card")!;
  const legend=film.querySelector<SVGTextElement>(".jl-legend")!;
  const focusItems=Array.from(film.querySelectorAll<SVGElement>("[data-focus]"));
  const backgroundLabels=Array.from(film.querySelectorAll<SVGElement>(".jl-world-label,.jl-first-compose"));
  const workspace=film.querySelector<SVGGElement>(".jl-workspace-option")!;
  const panel=workspace.querySelector<SVGRectElement>(".jl-option-body>rect")!;
  const heading=workspace.querySelector<SVGTextElement>(".jl-option-body>text")!;
  const copies=Array.from(workspace.querySelectorAll<SVGGElement>(".jl-compose-node"));
  const wires=Array.from(workspace.querySelectorAll<SVGPathElement>(".jl-workspace-wire"));
  const incoming=Array.from(workspace.querySelectorAll<SVGPathElement>(".jl-first-compose"));
  if(stage!==1)incoming.forEach((path,i)=>{const sy=moveY(options[0][i])+40,ey=152+i*164;path.setAttribute("d",`M650 ${sy} C730 ${sy} 780 ${ey} 910 ${ey}`);path.style.visibility=stage===0?"hidden":"visible";path.style.strokeDashoffset="0";path.style.strokeDasharray=".018 .012";});
  const setBox=(x:number,y:number,w:number,h:number)=>{panel.setAttribute("x",String(x));panel.setAttribute("y",String(y));panel.setAttribute("width",String(w));panel.setAttribute("height",String(h));};
  const cullEntries:{node:SVGElement;top:number;bottom:number;shown:boolean}[]=[];
  const addCull=(node:SVGElement,top:number,bottom:number)=>cullEntries.push({node,top,bottom,shown:true});
  film.querySelectorAll<SVGElement>(".jl-source-row").forEach((node,i)=>addCull(node,sourceY(i),sourceY(i)+64));
  film.querySelectorAll<SVGElement>(".jl-reference-row").forEach((node,i)=>addCull(node,moveY(i),moveY(i)+76));
  film.querySelectorAll<SVGElement>(".jl-catalog-link").forEach((node,i)=>addCull(node,Math.min(sourceY(references[i].sourceIndex)+32,moveY(i)+40),Math.max(sourceY(references[i].sourceIndex)+32,moveY(i)+40)));
  film.querySelectorAll<SVGElement>(".jl-workspace-option").forEach((group,i)=>{
   if(i>0)addCull(group.querySelector<SVGElement>(".jl-option-body")!,optionY(i),optionY(i)+496);
   group.querySelectorAll<SVGElement>(".jl-compose-link").forEach((node,j)=>addCull(node,Math.min(moveY(options[i][j])+40,optionY(i)+100+j*164),Math.max(moveY(options[i][j])+40,optionY(i)+100+j*164)));
  });
  const extra=Array.from(film.querySelectorAll<SVGElement>(".jl-branch-link,.jl-option-branch,.jl-growing-option"));
  if(stage!==2){
   camera.style.transform="translate(0px, 0px) scale(1)";camera.style.opacity="1";legend.style.opacity="1";endCard.style.opacity="0";endCard.inert=true;endCard.setAttribute("aria-hidden","true");film.dataset.elapsed="0";
   cullEntries.forEach(item=>item.node.style.removeProperty("display"));film.removeAttribute("data-detail");
   elapsedRef.current=0;setFinished(false);focusItems.forEach(n=>n.style.removeProperty("opacity"));backgroundLabels.forEach(n=>n.style.removeProperty("opacity"));
   setBox(870,52,285,496);heading.setAttribute("x","892");heading.setAttribute("y","85");heading.textContent="OPTION 01 / PROPOSED ASSEMBLY";
   copies.forEach((node,i)=>node.style.transform=`translate(${stage===0?460:910}px,${stage===0?moveY(options[0][i]):112+i*164}px)`);
   wires.forEach((node,i)=>node.setAttribute("d",`M1005 ${188+i*164} V${276+i*164}`));
   clip.setAttribute("y","52");clip.setAttribute("height","496");
   extra.forEach(n=>{n.style.removeProperty("visibility");n.style.removeProperty("stroke-dashoffset");n.style.removeProperty("stroke-dasharray");});
   if(stage===1){
    const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
    const started=performance.now();let frame=0;
    const draw=()=>{
     const seconds=reduced?3:(performance.now()-started)/1000;
     copies.forEach((node,i)=>{
      const progress=Math.max(0,Math.min(1,(seconds-i*.2)/1));
      const eased=progress*progress*(3-2*progress),sy=moveY(options[0][i]);
      const x=460+450*eased,y=sy+(112+i*164-sy)*eased;
      node.style.transform=`translate(${x}px,${y}px)`;
      const path=incoming[i],startY=sy+40,endY=y+40;
      const bend=Math.max(0,(x-650)*.45);
      path.setAttribute("d",`M650 ${startY} C${650+bend} ${startY} ${x-bend} ${endY} ${x} ${endY}`);
      const connection=Math.max(0,Math.min(1,(seconds-(1+i*.2))/.3));
      path.style.visibility=progress===1&&connection>0?"visible":"hidden";
      path.style.strokeDashoffset=String(1-connection);
      path.style.strokeDasharray=connection===1?".018 .012":"1";
     });
     film.dataset.composeTime=seconds.toFixed(3);
     if(seconds<1.75)frame=requestAnimationFrame(draw);
    };
    draw();return()=>cancelAnimationFrame(frame);
   }
   return;
  }
  const tracks=extra.map(node=>({node,start:parseFloat(node.style.animationDelay)||0,duration:node.classList.contains("jl-growing-option")?0:parseFloat(node.style.animationDuration)||1,body:node.classList.contains("jl-growing-option"),proposal:node.classList.contains("jl-option-branch"),last:-1}));
  const interpolate=(time:number,stops:number[][])=>{
   for(let i=1;i<stops.length;i++)if(time<=stops[i][0]){const [t0,v0]=stops[i-1],[t1,v1]=stops[i];return v0+(v1-v0)*Math.max(0,(time-t0)/(t1-t0));}
   return stops[stops.length-1][1];
  };
  let previousRadius=-1;
  const paint=(time:number)=>{
   // Preserve the readable opening, then smoothly accelerate the late pullback.
   const ramp=Math.min(5,Math.max(0,time-8));
   // Reach 3x at 13s, then keep shrinking at 3x throughout the fade.
   const zoomTime=time+.2*ramp*ramp+2*Math.max(0,time-13);
   const scale=Math.exp(Math.log(overviewScale)*zoomTime/16);
   const smooth=(value:number)=>{const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t);};
   const fade=smooth(time-13.5),message=smooth((time-15.5)/1.5),zoom=scale;
   camera.style.transform=cameraTransform(zoom);camera.style.opacity=String(1-fade);legend.style.opacity=String(1-fade);
   endCard.style.opacity=String(message);endCard.style.transform=`translateY(${8*(1-message)}px)`;
   endCard.inert=time<17;endCard.setAttribute("aria-hidden",time<15.5?"true":"false");
   const top=300-340/zoom,bottom=300+360/zoom;
   for(const item of cullEntries){const shown=item.bottom>=top&&item.top<=bottom;if(shown!==item.shown){item.node.style.display=shown?"":"none";item.shown=shown;}}
   const detail=zoom<.55?"compact":"full";if(film.dataset.detail!==detail)film.dataset.detail=detail;
   const radius=248*interpolate(time,[[0,1],[1.8,1.9],[4.2,5],[6.6,16],[9,50],[12,worldRadius/248]]);
   if(radius!==previousRadius){clip.setAttribute("y",String(300-radius));clip.setAttribute("height",String(radius*2));previousRadius=radius;}
   for(const track of tracks){
    if(track.node.style.display==="none")continue;
    const progress=time<track.start?-1:track.body?1:Math.min(1,(time-track.start)/track.duration);
    if(progress===track.last)continue;track.last=progress;
    const visibility=progress<0?"hidden":"visible";if(track.node.style.visibility!==visibility)track.node.style.visibility=visibility;
    if(!track.body){track.node.style.strokeDashoffset=String(progress<0?1:1-progress);const dash=track.proposal&&progress===1?".018 .012":"1";if(track.node.style.strokeDasharray!==dash)track.node.style.strokeDasharray=dash;}
   }
   film.dataset.elapsed=time.toFixed(2);
  };
  if(matchMedia("(prefers-reduced-motion: reduce)").matches){paint(19);setFinished(true);return;}
  if(!playing)return;
  const offset=elapsedRef.current;let frame=0,lastTick=performance.now(),visible=true;
  const observer=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting??false;},{rootMargin:"100px"});observer.observe(film);
  paint(offset);
  const advance=()=>{
   const now=performance.now(),delta=(now-lastTick)/1000;lastTick=now;
   if(visible&&!document.hidden){const time=Math.min(19,elapsedRef.current+delta);elapsedRef.current=time;paint(time);if(time>=19){observer.disconnect();setPlaying(false);setFinished(true);return;}}
   frame=requestAnimationFrame(advance);
  };
  frame=requestAnimationFrame(advance);return()=>{cancelAnimationFrame(frame);observer.disconnect();};

 },[stage,playing]);

 useEffect(()=>{
  const query=matchMedia("(prefers-reduced-motion: reduce)");let started=false;
  const observer=new IntersectionObserver(entries=>{if(!started&&!query.matches&&entries.some(entry=>entry.isIntersecting&&entry.intersectionRatio>=.25)){started=true;setPlaying(true);observer.disconnect();}},{threshold:[.25]});
  if(filmRef.current)observer.observe(filmRef.current);
  const stop=()=>{if(query.matches)setPlaying(false);};query.addEventListener("change",stop);
  return()=>{observer.disconnect();query.removeEventListener("change",stop);};
 },[]);
 useEffect(()=>{if(!playing||stage===2)return;const timer=setTimeout(()=>setStage(s=>s+1),stage===0?2800:2700);return()=>clearTimeout(timer);},[playing,stage]);
 return <section className="jl-section" aria-label="Library to composition motion">
  <div className="jm-heading"><div><span className="jp-eyebrow">{t("FROM PROJECTS TO POSSIBILITIES")}</span><h2>{t("Experience becomes")}<br/><em>{t("a starting point.")}</em></h2></div><p>{t("Keep the lineage in sight. From source definitions, through reusable Moves, into different possible workspaces.")}</p></div>
  <div ref={filmRef} className="jl-film" data-stage={stage} data-playing={playing} data-finished={finished}>
   <div className="jp-film-top"><span><strong className="joseki-logo joseki-logo-inline">joseki</strong> / CONNECTED LIBRARY</span><span>{definitions.length} DEFINITIONS &middot; {references.length} MOVE REFERENCES</span></div>
   <div className="jl-visual"><svg viewBox="0 0 1200 620" role="img" aria-label={stages[stage]}>
    <defs><pattern id="jl-grid" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".8" fill="#34583e"/></pattern><clipPath id="jl-center-reveal" clipPathUnits="userSpaceOnUse"><rect className="jl-stack-window" x="300" y="52" width="370" height="496" style={{"--stack-full":worldRadius/248} as CSSProperties}/></clipPath></defs><rect width="1200" height="620" fill="url(#jl-grid)"/>
    <g onAnimationEnd={e=>{if(e.target===e.currentTarget&&e.animationName==="jl-camera-out")setPlaying(false);}} className={`jl-world-camera ${stage===2&&inspectionScale===null?"jl-expanding":""}`} style={{transform:inspectionScale!==null?cameraTransform(inspectionScale):"translate(0px, 0px) scale(1)","--camera25":cameraTransform(.65),"--camera50":cameraTransform(.18),"--camera75":cameraTransform(.04),"--camera100":cameraTransform(overviewScale)} as CSSProperties}>
     <text className="jl-world-label" x="45" y="38">01 / SOURCE DEFINITIONS</text><text className="jl-world-label" x="460" y="38">02 / REGISTERED MOVES</text><text className="jl-world-label" x="870" y="38">03 / NEXT WORKSPACE OPTIONS</text>
     <g clipPath="url(#jl-center-reveal)">{references.map((ref,i)=>{const sy=sourceY(ref.sourceIndex)+32,my=moveY(i)+40;return <path data-focus={options[0].includes(i)?"true":"false"} className={`jl-catalog-link jl-draw-link ${i<6?"jl-initial-link":"jl-branch-link"}`} pathLength="1" style={{animationDelay:`${i<6?.5+i*.18:branchDelay(i,references.length)}s`,animationDuration:i<6?".75s":`${branchDuration(i)}s, 1ms`}} key={ref.key} d={`M305 ${sy} C375 ${sy} 390 ${my} 460 ${my}`} fill="none" stroke={i<6?"#c6dfa8":"#87aa71"} strokeWidth={i<6?1.5:.65}/>;})}</g>
     {definitions.map((source,i)=>{const featured=i<featuredDefinitionCount;const example=moves.find(m=>source.moves.includes(m.id));return <g data-focus={options[0].some(index=>references[index].sourceIndex===i)?"true":"false"} className="jl-source-row" key={source.id} transform={`translate(45 ${sourceY(i)})`}>
      <rect width="260" height="64" rx="17" fill={featured?"#294b32":"#6f925d"} stroke="#9dbf80" strokeWidth="1"/>
      {<><circle cx="0" cy="32" r="3" fill="#d3e8b8"/><circle cx="260" cy="32" r="3" fill="#d3e8b8"/><text x="15" y="22" className="jl-small">DEFINITION {String(i+1).padStart(2,"0")}</text><text x="15" y="44" className="jl-name">{example?.sources[0].replace(/^\d{2}-\d{4}_/,"").replace(/\.gh$/,"").replace(/_/g," ").slice(0,32)}</text></>}
     </g>;})}
     <g className="jl-centered-moves" clipPath="url(#jl-center-reveal)">{references.map((ref,i)=><g data-focus={options[0].includes(i)?"true":"false"} className="jl-reference-row" key={ref.key} transform={`translate(460 ${moveY(i)})`}>
      <rect width="190" height="76" rx="13" fill={i<6?"#34583a":"#8cae72"} stroke="#b4cf94" strokeWidth=".8"/>
      {<><circle cx="0" cy="40" r="3" fill="#d9edbc"/><circle cx="190" cy="40" r="3" fill="#d9edbc"/><text x="12" y="16" className="jl-small">MOVE {String(i+1).padStart(2,"0")}</text>{i<6?<MiniGraph move={moves[i]}/>:<text x="12" y="46" className="jl-small">REGISTERED MOVE</text>}<title>{i<6?moves[i].title:ref.id}</title></>}
     </g>)}</g>
     
     {options.map((combination,option)=>{const x=870,y=optionY(option);return <g data-focus={option===0?"true":"false"} className="jl-workspace-option" key={option}>
      {combination.map((moveIndex,slot)=><path className={`jl-compose-link jl-draw-link ${option===0?"jl-first-compose":"jl-option-branch"}`} pathLength="1" style={{animationDelay:`${option===0?slot*.2:optionStart(option)+slot*.16}s` ,animationDuration:option===0?"1.6s, 1ms":`${.65+jitter(option*13+slot)*.55}s, 1ms`}} key={moveIndex} d={`M650 ${moveY(moveIndex)+40} C${730+(option%7)*6} ${moveY(moveIndex)+40} ${x-90} ${y+100+slot*164} ${x+40} ${y+100+slot*164}`} fill="none" stroke="#b6d194" strokeWidth="1.2" strokeDasharray="5 8"/>)}
      <g className={`jl-option-body ${option>0?"jl-growing-option":""}`} style={{animationDelay:`${optionArrival(option)}s`}}><rect x={x} y={y} width="285" height="496" rx="24" fill="#213d29" stroke="#84965f" strokeDasharray="4 6"/><text x={x+22} y={y+33} className="jl-small">OPTION {String(option+1).padStart(2,"0")} / PROPOSED ASSEMBLY</text>
      {combination.map((moveIndex,slot)=><g key={moveIndex}>
       <g className="jl-compose-node" style={{transitionDelay:option===0?`${slot*.2}s`:"0s",transform:`translate(${stage===0&&option===0?460:x+40}px,${stage===0&&option===0?52+moveIndex*84:y+60+slot*164}px)`}}><rect width="190" height="76" rx="13" fill="#35583a" stroke="#c1db9d"/><text x="12" y="16" className="jl-small">MOVE {String(moveIndex+1).padStart(2,"0")}</text>{moveIndex<6?<MiniGraph move={moves[moveIndex]}/>:<text x="12" y="46" className="jl-small">REGISTERED MOVE</text>}</g>
       {slot<2&&<path className="jl-workspace-wire" d={`M${x+135} ${y+136+slot*164} V${y+224+slot*164}`} fill="none" stroke="#cee2a0" strokeDasharray="3 4"/>}
      </g>)}
      </g>
     </g>;})}
    </g>
    <text className="jl-legend jl-small" x="35" y="605">SOLID: REGISTERED LINEAGE / DASHED: POSSIBLE COMBINATIONS</text>
   </svg><div className="jl-end-card" inert={true} aria-hidden="true"><span className="joseki-logo joseki-logo-end">joseki</span><h3>Every definition holds<br/><em>your next move.</em></h3><a href="#moves">Explore the Moves &rarr;</a><button onClick={()=>{setStage(0);setInspectionScale(null);setPlaying(true);}} aria-label="Replay library motion">Replay</button></div></div>
   <div className="jp-film-caption"><div><h3>{finished?"Start your next definition with experience.":stages[stage]}</h3><p>{finished?"One possible assembly, with its source definitions and reusable Moves still in view.":descriptions[stage]}</p></div><button onClick={()=>{if(!playing&&stage===2){setStage(0);setInspectionScale(null);}setPlaying(p=>!p);}} aria-label={playing?"Pause library motion":"Play library motion"}>{playing?"Pause":stage===2?"Replay":"Play"}</button></div>
   {stage===2&&!finished&&<label className="jl-zoom-control">INSPECT THE SAME GRAPH <input aria-label="Library camera zoom" type="range" min="0" max="100" value={Math.round(Math.log((inspectionScale??overviewScale)/overviewScale)/Math.log(1/overviewScale)*100)} onChange={e=>{setPlaying(false);setInspectionScale(overviewScale*Math.pow(1/overviewScale,Number(e.target.value)/100));}}/><span>Full library / Close up</span></label>}
   <div className="jp-scenes" role="group" aria-label="Library motion stage">{["Extract","Compose","Zoom out"].map((label,i)=><button key={label} aria-pressed={stage===i} onClick={()=>{setStage(i);setInspectionScale(null);setPlaying(i===2&&!matchMedia("(prefers-reduced-motion: reduce)").matches);}}>{label}</button>)}</div>
  </div>
  <p className="jm-note">{t("Source connections come from the library. Workspace combinations illustrate possible reuse, not validated assemblies.")}</p>
 </section>;
}





