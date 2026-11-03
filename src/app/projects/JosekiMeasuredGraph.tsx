import graph from "./josekiGraph.json";
export default function JosekiMeasuredGraph({moveIndex,pulsing}:{moveIndex:number;pulsing:boolean}) {
 const move=graph.moves[moveIndex];
 const nodes=Object.entries(move.geometry.nodes) as [string,{bounds:number[];ports:number[][]}][];
 const names=new Map(graph.nodes.map(n=>[n.id,n]));
 const left=Math.min(...nodes.map(([,n])=>n.bounds[0]))-35, top=Math.min(...nodes.map(([,n])=>n.bounds[1]))-35;
 const width=Math.max(...nodes.map(([,n])=>n.bounds[0]+n.bounds[2]))-left+35,height=Math.max(...nodes.map(([,n])=>n.bounds[1]+n.bounds[3]))-top+35;
 return <svg className={`measured-joseki ${pulsing?"measured-pulsing":""}`} viewBox={`${left} ${top} ${width} ${height}`} role="img" aria-label={`${move.name}: saved Joseki layout with measured node dimensions and ports`}>
 <rect x={left} y={top} width={width} height={height} fill="#14291e"/>
 {move.geometry.wires.map((w,i)=>{const [a,b]=w.points,reach=Math.max(14,Math.abs(b[0]-a[0])*.5);return <path key={i} className="measured-wire" d={Math.abs(a[1]-b[1])<.5?`M${a[0]} ${a[1]} H${b[0]}`:`M${a[0]} ${a[1]} C${a[0]+reach} ${a[1]} ${b[0]-reach} ${b[1]} ${b[0]} ${b[1]}`} fill="none" stroke="#9abd9b" strokeWidth="1.3"/>;})}
 {nodes.map(([id,n])=>{const name=names.get(id)!;const [x,y,w,h]=n.bounds;return <g key={id}><title>{name.fullName+" / "+id}</title><rect rx="6" x={x} y={y} width={w} height={h} fill="#617f65" stroke="#9abd9b" strokeWidth="1"/>{h>60?<text transform={`translate(${x+w/2},${y+h/2}) rotate(-90)`} textAnchor="middle" fontSize="11" fill="#e3efda">{name.name}</text>:<text x={x+w/2} y={y+h/2+3} textAnchor="middle" fontSize="8" fill="#e3efda">{name.name.slice(0,Math.max(3,Math.floor(w/5)))}</text>}{n.ports.map((p,i)=><circle key={i} cx={p[0]} cy={p[1]} r="1.8" fill="#14291e" stroke="#9abd9b" strokeWidth=".8"/>)}</g>})}
 </svg>;
}
