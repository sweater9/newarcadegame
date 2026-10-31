import React,{useState} from "react";
const C=[["Ruby","#d84d4d"],["Sapphire","#3678cc"],["Emerald","#229b70"],["Saffron","#c78b1d"]];
const O=[[4,2],[4,3],[4,4],[3,4],[2,4],[1,4],[0,4],[0,3],[0,2],[0,1],[0,0],[1,0],[2,0],[3,0],[4,0],[4,1]];
const I=[[3,2],[3,1],[2,1],[1,1],[1,2],[1,3],[2,3],[3,3]];
const E=[[4,2],[2,4],[0,2],[2,0]],H=[2,2],k=p=>p.join(",");
const safe=new Set([...E,H].map(k));
const paths=E.map((e,p)=>{let n=O.findIndex(x=>k(x)===k(e));return [...Array.from({length:16},(_,i)=>O[(n+i)%16]),...Array.from({length:8},(_,i)=>I[(i+[0,6,4,2][p])%8]),H]});
const start=()=>({pieces:Array.from({length:16},(_,id)=>({id,owner:Math.floor(id/4),step:-1})),player:0,kills:[0,0,0,0],queue:[],idx:0,rolled:false,bonus:false,streak:0,touched:[],shells:[],winner:null,msg:"Ruby begins. Roll six cowrie shells."});
const position=p=>p.step<0?null:paths[p.owner][p.step];
const at=(g,cell)=>g.pieces.filter(p=>position(p)&&k(position(p))===k(cell));
const unit=(g,p)=>p.step<0||p.step===24?[p]:g.pieces.filter(q=>q.owner===p.owner&&q.step===p.step);
const choices=g=>{const ids=new Set();return g.pieces.filter(p=>p.owner===g.player&&p.step!==24).flatMap(p=>{if(ids.has(p.id))return[];const u=unit(g,p);u.forEach(x=>ids.add(x.id));return[u]})};
const pass=(g,message)=>({...g,player:(g.player+1)%4,queue:[],idx:0,rolled:false,bonus:false,streak:0,touched:[],shells:[],msg:message||C[(g.player+1)%4][0]+" to roll."});
function check(g,u,v){
 if(!u?.length||v==null)return {err:"Choose a roll."};
 if(u.some(x=>x.owner!==g.player||x.step===24))return {err:"Not a movable pawn."};
 const ids=u.map(x=>x.id),used=g.touched;
 if(used.length>=2&&!used.some(set=>set.some(id=>ids.includes(id))))return {err:"Muppolu: two pawn units maximum per turn."};
 const double=u.length>1;if(double&&v%2)return {err:"Gatte cannot use odd rolls."};
 const from=u[0].step;if(from<0&&v!==6&&v!==12)return {err:"Entry requires 6 or 12."};
 if(from<0&&double)return {err:"Yard units enter separately."};
 const distance=from<0?0:double?v/2:v;
 let end=from<0?0:from+distance;
 if(from>=0&&from<16&&!g.kills[g.player]&&end>=16)end%=16;
 if(end>24)return {err:"Exact roll required for Home."};
 const travel=from<0?[paths[g.player][0]]:Array.from({length:distance},(_,i)=>{let s=from+i+1;if(from<16&&!g.kills[g.player]&&s>=16)s%=16;return paths[g.player][s]});
 if(travel.some(x=>!x))return {err:"Invalid route."};
 for(let n=0;n<travel.length;n++){
  const enemy=at(g,travel[n]).filter(x=>x.owner!==g.player&&x.step!==24);
  const counts=[0,0,0,0];enemy.forEach(x=>counts[x.owner]++);
  if(counts.some(x=>x>=2)&&(!double||n<travel.length-1))return {err:"Enemy Gatte blocks this route."};
 }
 const enemy=at(g,paths[g.player][end]).filter(x=>x.owner!==g.player&&x.step!==24);
 return {end,capture:end===24||safe.has(k(paths[g.player][end]))?[]:enemy.map(x=>x.id)};
}
export default function App(){
 const [g,setG]=useState(start),[rules,setRules]=useState(false);
 const canRoll=g.winner===null&&(!g.rolled||g.bonus),canMove=g.winner===null&&g.rolled&&!g.bonus&&g.queue.length>0;
 const val=g.queue[g.idx],valid=canMove?choices(g).filter(u=>!check(g,u,val).err):[];
 function roll(){if(!canRoll)return;const shells=Array.from({length:6},()=>Math.random()<.5?0:1),n=shells.reduce((a,b)=>a+b,0),v=n||12,bonus=v===6||v===12;
 setG(old=>{const s=bonus?old.streak+1:0;if(s>=3)return {...pass(old,C[old.player][0]+" busted! Three bonus rolls; turn forfeited."),shells};const queue=[...old.queue,v];const hasActivePawn=old.pieces.some(p=>p.owner===old.player&&p.step>=0&&p.step<24);const canEnter=queue.some(value=>value===6||value===12);if(!hasActivePawn&&!canEnter&&!bonus)return {...pass(old,C[old.player][0]+" rolled "+v+" with all pawns in the yard. Automatic forfeit; "+C[(old.player+1)%4][0]+" plays next."),shells};return {...old,shells,rolled:true,streak:s,bonus,queue,idx:old.queue.length,msg:bonus?v+"! Bonus roll — roll again.":"Rolled "+v+". Choose a roll and pawn."}})}
 function move(u){if(!canMove)return;const result=check(g,u,val);if(result.err){setG(x=>({...x,msg:result.err}));return}
 setG(old=>{const ids=u.map(p=>p.id),cap=new Set(result.capture),pieces=old.pieces.map(p=>cap.has(p.id)?{...p,step:-1}:ids.includes(p.id)?{...p,step:result.end}:p),kills=[...old.kills];kills[old.player]+=cap.size;
 const q=old.queue.filter((_,i)=>i!==old.idx),winner=pieces.filter(p=>p.owner===old.player).every(p=>p.step===24)?old.player:null;
 let touched=old.touched.filter(t=>!t.some(id=>ids.includes(id))),merged=[...ids,...old.touched.filter(t=>t.some(id=>ids.includes(id))).flat()];touched.push([...new Set(merged)]);
 const next={...old,pieces,kills,queue:q,idx:Math.min(old.idx,Math.max(0,q.length-1)),touched,winner,bonus:cap.size>0,streak:cap.size?0:old.streak,msg:winner!==null?C[winner][0]+" wins!":cap.size?"Capture! Bonus cowrie roll.":"Pawn moved."};
 return winner===null&&q.length===0&&!cap.size?pass(next):next})}
 function forfeit(){setG(old=>{if(!canMove)return old;const q=old.queue.filter((_,i)=>i!==old.idx);return q.length?{...old,queue:q,idx:0,msg:"Roll forfeited."}:pass(old)})}
 const cellClass=(r,c)=>safe.has(k([r,c]))?"bg-amber-100 border-amber-500":r===0||r===4||c===0||c===4?"bg-orange-100 border-orange-200":"bg-stone-100 border-stone-200";
 return <div className="min-h-screen p-3 sm:p-7 text-stone-800"><main className="max-w-6xl mx-auto">
 <header className="flex flex-wrap items-center justify-between gap-3 mb-5"><div><p className="text-xs uppercase tracking-[.22em] text-amber-800 font-bold">Traditional Indian Cowrie Game</p><h1 className="text-4xl font-black">Ghata Bara ✦</h1><p className="text-sm text-stone-500">Four-player local pass-and-play prototype</p></div><div className="flex gap-2"><button className="bg-white border rounded-xl px-4 py-2" onClick={()=>setRules(!rules)}>Rules</button><button className="bg-stone-800 text-white rounded-xl px-4 py-2" onClick={()=>setG(start())}>↻ Reset</button></div></header>
 {rules&&<section className="bg-white border border-amber-200 rounded-xl p-4 mb-4 text-sm">Roll 6 cowries: 0 up means 12. Six or twelve gives a bonus roll; three consecutive bonus rolls bust the turn. Enter with 6 or 12. Move counter-clockwise around the outer ring, then inward clockwise after your first capture. Land on unsafe enemy pawns to capture; captures grant a roll. Gatte stacks move half the even roll, and block single enemies. Only two units may move per turn. Reach center on exact count to win.</section>}
 <div className="grid lg:grid-cols-[minmax(0,1fr)_315px] gap-5"><div className="space-y-4"><div className="bg-white rounded-3xl shadow-sm border p-3 sm:p-6"><div className="grid grid-cols-5 gap-1.5 sm:gap-2 max-w-[590px] aspect-square mx-auto">{Array.from({length:25},(_,i)=>{const r=Math.floor(i/5),c=i%5,cell=[r,c],pawns=at(g,cell),mine=pawns.find(x=>x.owner===g.player&&x.step!==24),u=mine?unit(g,mine):null,highlight=mine&&valid.some(v=>v.some(q=>q.id===mine.id));return <button key={i} disabled={!canMove||!mine} onClick={()=>mine&&move(u)} className={`relative border-2 rounded-lg sm:rounded-xl flex items-center justify-center ${cellClass(r,c)} ${highlight?"ring-2 ring-emerald-500":""}`} aria-label={`Row ${r+1}, column ${c+1}`}>
 {safe.has(k(cell))&&<span className="absolute text-4xl sm:text-6xl text-amber-400/40">✕</span>}{r===2&&c===2&&<span className="absolute top-1 text-[9px] font-bold">HOME</span>}{E.findIndex(x=>k(x)===k(cell))>=0&&<span className="absolute top-1 left-1 text-[9px] font-bold">P{E.findIndex(x=>k(x)===k(cell))+1}</span>}
 <span className="flex flex-wrap justify-center relative">{C.map(([name,color],owner)=>{const n=pawns.filter(x=>x.owner===owner).length;return n?<span key={owner} className="w-6 h-6 sm:w-9 sm:h-9 rounded-full border-2 border-white text-white shadow flex items-center justify-center font-black text-xs" style={{background:color}}>{n>1?"×"+n:"●"}</span>:null})}</span></button>})}</div><p className="text-center mt-4 text-xs text-stone-500">✕ Safe zone · ● Pawn · ×2 Gatte · Center = Home</p></div>
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{C.map(([name,color],owner)=>{const yard=g.pieces.filter(p=>p.owner===owner&&p.step<0),home=g.pieces.filter(p=>p.owner===owner&&p.step===24).length;return <section key={owner} className={`bg-white border-2 rounded-2xl p-3 ${g.player===owner?"border-stone-800":"border-stone-200"}`}><p className="font-bold text-sm"><span style={{color}}>●</span> {name} {g.player===owner?"★":""}</p><p className="text-xs text-stone-500 my-2">Yard {yard.length} · Home {home}</p><div className="flex flex-wrap gap-1 min-h-8">{yard.map(p=><button key={p.id} disabled={!canMove||g.player!==owner} onClick={()=>move([p])} className={`rounded-full w-7 h-7 text-white border-2 border-white ${valid.some(u=>u.some(x=>x.id===p.id))?"ring-2 ring-emerald-500":""}`} style={{background:color}} aria-label={`Enter ${name} pawn ${p.id%4+1}`}>●</button>)}</div><p className={`text-xs font-semibold mt-2 ${g.kills[owner]?"text-emerald-700":"text-rose-600"}`}>{g.kills[owner]?"✓ Gate open · "+g.kills[owner]+" captures":"🔒 Gate locked"}</p></section>})}</div></div>
 <aside className="space-y-4"><section className="bg-white border rounded-3xl shadow-sm p-5"><p className="uppercase tracking-widest text-xs text-stone-400 font-bold">Current Turn</p><h2 className="text-2xl font-black mt-2" style={{color:C[g.player][1]}}>{C[g.player][0]} · Player {g.player+1}</h2><div className="bg-amber-50 rounded-xl p-4 my-4"><p className="text-xs text-center font-bold mb-3">SIX COWRIE SHELLS</p><div className="flex justify-center gap-1.5">{Array.from({length:6},(_,i)=><span key={i} className={`w-8 h-11 rounded-full border-2 rotate-[-12deg] flex items-center justify-center font-bold ${g.shells[i]?"bg-amber-800 text-white":"bg-amber-100 text-amber-800 border-amber-300"}`}>{g.shells[i]?"•":"│"}</span>)}</div><p className="text-center text-xs mt-3 text-stone-500">{g.shells.length?g.shells.filter(Boolean).length+" face up":"Ready to roll"}</p></div><button disabled={!canRoll} onClick={roll} className="w-full py-3 rounded-xl text-white bg-amber-600 hover:bg-amber-700 disabled:bg-stone-300 font-black">{g.bonus?"✦ Roll Bonus Cowries":"🎲 Roll 6 Cowrie Shells"}</button><div className="flex justify-between mt-5 mb-2 text-sm"><strong>Roll Queue</strong><span>{g.queue.length} left</span></div><div className="flex flex-wrap gap-2 min-h-12">{g.queue.map((v,i)=><button key={i} disabled={g.bonus} onClick={()=>setG(old=>({...old,idx:i}))} className={`w-12 h-12 rounded-xl border-2 font-black text-lg ${g.idx===i?"bg-stone-800 text-white":"bg-amber-50 text-amber-800 border-amber-300"}`}>{v}</button>)}</div><div className="flex justify-between text-xs text-stone-500 mt-3"><span>Bonus streak {g.streak}/3</span><span>Units used {g.touched.length}/2</span></div></section>
 <section className="bg-stone-800 text-white rounded-2xl p-4" role="status"><p className="text-xs tracking-widest font-bold text-amber-300 mb-2">GAME STATUS</p><p>{g.msg}</p>{g.winner!==null&&<p className="text-2xl font-black mt-3">🏆 Winner!</p>}</section>
 {canMove&&<section className="bg-white border rounded-2xl p-4"><h3 className="font-bold">Legal moves · Roll {val}</h3><p className="text-xs text-stone-500 mb-3">Click an available pawn or board square</p><div className="flex gap-2 flex-wrap">{valid.map(u=><button key={u[0].id} onClick={()=>move(u)} className="rounded-lg px-3 py-2 text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">{u.length>1?"Gatte ×"+u.length:"Pawn "+(u[0].id%4+1)}{u[0].step<0?" · Enter":""}</button>)}{!valid.length&&<p className="text-xs text-rose-600">No legal moves</p>}</div><button onClick={forfeit} className="text-xs underline text-stone-500 mt-3">Forfeit selected roll</button></section>}
 </aside></div><footer className="text-center text-xs text-stone-400 mt-8">Ghata Bara · Initial local multiplayer prototype</footer></main></div>
}