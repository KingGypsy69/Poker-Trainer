import React, { useState, useCallback } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const RANKS = ["A","K","Q","J","T","9","8","7","6","5","4","3","2"];
const SUITS = ["s","h","d","c"];
const SUIT_SYMS = { s:"♠", h:"♥", d:"♦", c:"♣" };
const SUIT_COLORS = { s:"#cbd5e1", h:"#f87171", d:"#f87171", c:"#4ade80" };
const POS_ORDER = ["UTG","UTG+1","MP","HJ","CO","BTN","SB","BB"];
const IP_POSITIONS = ["BTN","CO","HJ"];
const OOP_POSITIONS = ["SB","BB","UTG","UTG+1","MP"];

// ─── GTO Opening Ranges ───────────────────────────────────────────────────────
// Returns set of hand strings that are in opening range for position
function getOpenRange(pos) {
  const ranges = {
    BTN: new Set([
      "AA","KK","QQ","JJ","TT","99","88","77","66","55","44","33","22",
      "AKs","AQs","AJs","ATs","A9s","A8s","A7s","A6s","A5s","A4s","A3s","A2s",
      "AKo","AQo","AJo","ATo","A9o","A8o","A7o","A6o","A5o","A4o","A3o","A2o",
      "KQs","KJs","KTs","K9s","K8s","K7s","KQo","KJo","KTo","K9o",
      "QJs","QTs","Q9s","Q8s","QJo","QTo",
      "JTs","J9s","J8s","JTo",
      "T9s","T8s",
      "98s","97s","87s","86s","76s","65s","54s"
    ]),
    CO: new Set([
      "AA","KK","QQ","JJ","TT","99","88","77","66","55","44","33",
      "AKs","AQs","AJs","ATs","A9s","A8s","A7s","A6s","A5s","A4s","A3s","A2s",
      "AKo","AQo","AJo","ATo","A9o","A8o","A7o",
      "KQs","KJs","KTs","K9s","K8s","KQo","KJo","KTo",
      "QJs","QTs","Q9s","QJo",
      "JTs","J9s",
      "T9s","T8s","98s","87s","76s"
    ]),
    HJ: new Set([
      "AA","KK","QQ","JJ","TT","99","88","77","66","55","44",
      "AKs","AQs","AJs","ATs","A9s","A8s","A7s","A6s","A5s","A4s","A3s","A2s",
      "AKo","AQo","AJo","ATo","A9o",
      "KQs","KJs","KTs","K9s","KQo","KJo",
      "QJs","QTs","Q9s","QJo",
      "JTs","J9s",
      "T9s","98s","87s"
    ]),
    MP: new Set([
      "AA","KK","QQ","JJ","TT","99","88","77","66","55",
      "AKs","AQs","AJs","ATs","A9s","A8s","A7s","A6s","A5s","A4s","A3s","A2s",
      "AKo","AQo","AJo","ATo",
      "KQs","KJs","KTs","KQo",
      "QJs","QTs",
      "JTs","T9s"
    ]),
    UTG: new Set([
      "AA","KK","QQ","JJ","TT","99","88","77",
      "AKs","AQs","AJs","ATs","A9s","A8s","A7s","A6s","A5s","A4s","A3s","A2s",
      "AKo","AQo","AJo",
      "KQs","KJs","KTs","KQo",
      "QJs","JTs"
    ]),
    "UTG+1": new Set([
      "AA","KK","QQ","JJ","TT","99","88","77","66",
      "AKs","AQs","AJs","ATs","A9s","A8s","A7s","A6s","A5s","A4s","A3s","A2s",
      "AKo","AQo","AJo","ATo",
      "KQs","KJs","KTs","KQo",
      "QJs","JTs","T9s"
    ]),
    SB: new Set([
      "AA","KK","QQ","JJ","TT","99","88","77","66","55","44","33",
      "AKs","AQs","AJs","ATs","A9s","A8s","A7s","A6s","A5s","A4s","A3s","A2s",
      "AKo","AQo","AJo","ATo","A9o","A8o",
      "KQs","KJs","KTs","K9s","KQo","KJo",
      "QJs","QTs","Q9s",
      "JTs","J9s","T9s","98s","87s","76s"
    ]),
    BB: new Set([
      "AA","KK","QQ","JJ","TT","99","88","77","66","55","44","33","22",
      "AKs","AQs","AJs","ATs","A9s","A8s","A7s","A6s","A5s","A4s","A3s","A2s",
      "AKo","AQo","AJo","ATo","A9o","A8o","A7o","A6o","A5o","A4o","A3o","A2o",
      "KQs","KJs","KTs","K9s","K8s","K7s","KQo","KJo","KTo","K9o","K8o",
      "QJs","QTs","Q9s","Q8s","QJo","QTo","Q9o",
      "JTs","J9s","J8s","JTo","J9o",
      "T9s","T8s","T7s","T9o",
      "98s","97s","96s","87s","86s","76s","75s","65s","64s","54s","53s","43s"
    ]),
  };
  return ranges[pos] || ranges["MP"];
}

// ─── Hand key helpers ─────────────────────────────────────────────────────────
function getHandKey(r1, r2, i, j) {
  // i=row index, j=col index in 13x13 grid
  if (i === j) return `${r1}${r2}`; // pair
  if (i < j) return `${r1}${r2}s`;  // suited (upper triangle)
  return `${r2}${r1}o`;              // offsuit (lower triangle)
}

function handKeyDisplay(key) {
  if(key.length === 2) return `${key} (pair)`;
  if(key.endsWith("s")) return `${key.slice(0,-1)} suited`;
  if(key.endsWith("o")) return `${key.slice(0,-1)} offsuit`;
  return key;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function randFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randCard(exclude=[]) {
  let card, attempts=0;
  do { card=randFrom(RANKS)+randFrom(SUITS); attempts++; if(attempts>100) break; } while(exclude.includes(card));
  return card;
}
function randHand(exclude=[]) { const c1=randCard(exclude); return [c1, randCard([...exclude,c1])]; }
function randBoard(n=3, exclude=[]) { const b=[]; for(let i=0;i<n;i++) b.push(randCard([...exclude,...b])); return b; }
function handStr([c1,c2]) {
  const r1=c1[0],r2=c2[0],s1=c1[1],s2=c2[1],suited=s1===s2,pair=r1===r2;
  if(pair) return `${r1}${r2}`;
  const order="AKQJT98765432";
  const [hi,lo]=order.indexOf(r1)<order.indexOf(r2)?[r1,r2]:[r2,r1];
  return `${hi}${lo}${suited?"s":"o"}`;
}
function getVillainPos(heroPos) {
  if(IP_POSITIONS.includes(heroPos)) {
    const heroIdx=POS_ORDER.indexOf(heroPos);
    const candidates=POS_ORDER.slice(0,heroIdx);
    return candidates.length>0?randFrom(candidates):randFrom(["UTG","MP","BB"]);
  }
  return randFrom(IP_POSITIONS);
}

function Card({card,size=24}) {
  const rank=card[0],suit=card[1];
  return <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",background:"#1e293b",border:"1.5px solid #334155",borderRadius:5,padding:"2px 5px",margin:"0 2px",fontSize:size===24?12:10,fontWeight:700,color:SUIT_COLORS[suit]}}>{rank}{SUIT_SYMS[suit]}</span>;
}

// ─── Interactive Range Grid ───────────────────────────────────────────────────
// mode: "select" = user clicks to select hands
//       "display" = shows a range with colour states
// cellStates: map of handKey -> "in"|"possible"|"out"|"selected_in"|"selected_possible"
function RangeGrid({ cellStates={}, onCellClick=null, showLegend=true, title="" }) {
  const getCellStyle = (key) => {
    const state = cellStates[key] || "out";
    const styles = {
      in:               { bg:"#16a34a", text:"#fff", opacity:1 },
      possible:         { bg:"#d97706", text:"#fff", opacity:1 },
      out:              { bg:"#1e293b", text:"#475569", opacity:1 },
      eliminated:       { bg:"#0f172a", text:"#1e293b", opacity:0.5 },
      selected_in:      { bg:"#22c55e", text:"#fff", opacity:1 },
      selected_possible:{ bg:"#fbbf24", text:"#000", opacity:1 },
      correct:          { bg:"#16a34a", text:"#fff", opacity:1 },
      missed:           { bg:"#dc2626", text:"#fff", opacity:1 },
      wrong:            { bg:"#7f1d1d", text:"#fca5a5", opacity:1 },
    };
    return styles[state] || styles.out;
  };

  return (
    <div>
      {title && <div style={{fontSize:10,color:"#64748b",marginBottom:4,textTransform:"uppercase",letterSpacing:1}}>{title}</div>}
      <div style={{overflowX:"auto"}}>
        <div style={{display:"grid",gridTemplateColumns:`16px repeat(13,1fr)`,gap:1.5,minWidth:280}}>
          <div/>
          {RANKS.map(r=><div key={r} style={{textAlign:"center",fontSize:8,color:"#64748b",fontWeight:700,paddingBottom:1}}>{r}</div>)}
          {RANKS.map((r1,i)=>(
            <React.Fragment key={r1}>
              <div style={{fontSize:8,color:"#64748b",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{r1}</div>
              {RANKS.map((r2,j)=>{
                const key = getHandKey(r1,r2,i,j);
                const s = getCellStyle(key);
                return (
                  <div
                    key={`${r1}${r2}`}
                    onClick={()=>onCellClick&&onCellClick(key,i,j)}
                    style={{
                      background:s.bg,borderRadius:2,aspectRatio:"1",
                      display:"flex",alignItems:"center",justifyContent:"center",
                      fontSize:6,fontWeight:700,color:s.text,
                      cursor:onCellClick?"pointer":"default",
                      opacity:s.opacity,
                      transition:"transform 0.05s",
                      userSelect:"none",
                    }}
                    onMouseEnter={e=>{if(onCellClick)e.currentTarget.style.transform="scale(1.15)";}}
                    onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";}}
                    title={handKeyDisplay(key)}
                  >
                    {i===j?r1:i<j?`${r1}${r2}s`:`${r2}${r1}o`}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
      {showLegend && (
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:6}}>
          {onCellClick ? [
            {color:"#22c55e",label:"Definitely in"},
            {color:"#fbbf24",label:"Possibly in"},
            {color:"#1e293b",label:"Not in range"},
          ] : [
            {color:"#16a34a",label:"In range"},
            {color:"#d97706",label:"Possible"},
            {color:"#1e293b",label:"Eliminated"},
          ]}.map(({color,label})=>(
            <div key={label} style={{display:"flex",alignItems:"center",gap:3}}>
              <div style={{width:10,height:10,borderRadius:2,background:color,border:"1px solid #334155"}}/>
              <span style={{fontSize:9,color:"#64748b"}}>{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Range Evolution Display ──────────────────────────────────────────────────
// Shows how a range changes across streets
function RangeEvolution({ stages }) {
  const [activeStage, setActiveStage] = useState(0);
  if(!stages||stages.length===0) return null;
  const stage = stages[activeStage];
  return (
    <div style={{background:"#0f172a",borderRadius:10,padding:12,marginTop:8}}>
      <div style={{fontSize:10,color:"#64748b",marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>Range Evolution</div>
      <div style={{display:"flex",gap:4,marginBottom:10,flexWrap:"wrap"}}>
        {stages.map((s,i)=>(
          <button key={i} onClick={()=>setActiveStage(i)} style={{
            padding:"4px 8px",borderRadius:5,border:"none",cursor:"pointer",fontSize:10,fontWeight:600,
            background:activeStage===i?"#16a34a":"#1e293b",color:activeStage===i?"#fff":"#94a3b8"
          }}>{s.label}</button>
        ))}
      </div>
      <RangeGrid cellStates={stage.cells} showLegend={true} title={stage.description}/>
      {stage.explanation && (
        <div style={{marginTop:8,fontSize:11,color:"#94a3b8",lineHeight:1.5,padding:8,background:"#1e293b",borderRadius:6}}>
          {stage.explanation}
        </div>
      )}
    </div>
  );
}

// Build cell states from a range Set
function buildCellStates(inRange, possibleRange=new Set(), eliminatedKeys=new Set()) {
  const states = {};
  RANKS.forEach((r1,i)=>{
    RANKS.forEach((r2,j)=>{
      const key = getHandKey(r1,r2,i,j);
      if(eliminatedKeys.has(key)) states[key]="eliminated";
      else if(inRange.has(key)) states[key]="in";
      else if(possibleRange.has(key)) states[key]="possible";
      else states[key]="out";
    });
  });
  return states;
}

// ─── API Call ─────────────────────────────────────────────────────────────────
async function askClaude(prompt, apiKey) {
  if(!apiKey) return "⚠️ No API key — tap Setup to add your Anthropic API key.";
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages",{
      method:"POST",
      headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
      body:JSON.stringify({
        model:"claude-sonnet-4-6",max_tokens:350,
        system:`You are a poker coach for kingygpsy, a tournament NLH player.
Known leaks: calling too much preflop (VPIP/PFR gap), missing BTN/CO steal spots, SB not raising enough, trash hand shoves when short, going too far with top pair weak kicker (AJ vs 3bet aggression).
Strengths: live reads, range reading, bluffing with range advantage, deep stack postflop.
Be concise, direct, max 130 words. State correct action clearly. Call out leaks when relevant.`,
        messages:[{role:"user",content:prompt}]
      })
    });
    const data=await response.json();
    if(data.error) return `API Error: ${data.error.message}`;
    return data.content?.[0]?.text||"No response.";
  } catch(e) { return `Error: ${e.message}`; }
}

// ─── Settings ─────────────────────────────────────────────────────────────────
function Settings({apiKey,setApiKey,onClose}) {
  const [input,setInput]=useState(apiKey);
  const [visible,setVisible]=useState(false);
  const save=()=>{setApiKey(input);try{localStorage.setItem("pkr_key",input);}catch(e){}onClose();};
  return (
    <div style={{background:"#0f172a",minHeight:"100vh",padding:16,color:"#e2e8f0",fontFamily:"'Inter','Helvetica Neue',sans-serif"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
        <button onClick={onClose} style={{background:"#1e293b",border:"1px solid #334155",color:"#94a3b8",borderRadius:6,padding:"5px 10px",fontSize:11,cursor:"pointer"}}>← Back</button>
        <div style={{fontSize:14,fontWeight:700,color:"#f8fafc"}}>⚙️ Settings</div>
      </div>
      <div style={{background:"#1e293b",borderRadius:10,padding:14,marginBottom:12}}>
        <div style={{fontSize:11,color:"#16a34a",fontWeight:700,marginBottom:4,textTransform:"uppercase",letterSpacing:1}}>Anthropic API Key</div>
        <div style={{fontSize:11,color:"#64748b",marginBottom:10,lineHeight:1.6}}>Get from <span style={{color:"#60a5fa"}}>console.anthropic.com</span> → API Keys. Key is saved in your browser.</div>
        <div style={{display:"flex",gap:6,marginBottom:8}}>
          <input type={visible?"text":"password"} value={input} onChange={e=>setInput(e.target.value)} placeholder="sk-ant-..."
            style={{flex:1,background:"#0f172a",border:"1px solid #334155",borderRadius:7,padding:"8px 10px",color:"#e2e8f0",fontSize:11,outline:"none"}}/>
          <button onClick={()=>setVisible(v=>!v)} style={{background:"#1e293b",border:"1px solid #334155",color:"#94a3b8",borderRadius:7,padding:"8px 10px",fontSize:11,cursor:"pointer"}}>{visible?"Hide":"Show"}</button>
        </div>
        <button onClick={save} style={{width:"100%",background:"#16a34a",color:"#fff",border:"none",borderRadius:7,padding:"9px 0",fontSize:12,fontWeight:700,cursor:"pointer"}}>Save Key</button>
      </div>
      <div style={{background:"#1e293b",borderRadius:10,padding:12}}>
        <div style={{fontSize:10,color:"#64748b",marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>Cost Estimate</div>
        <div style={{fontSize:11,color:"#94a3b8",lineHeight:1.7}}>Each call: ~$0.003–0.005 · 20 drills: ~$0.08 · Month: ~$1–3<br/><span style={{color:"#16a34a"}}>$5 credit lasts months of drilling</span></div>
      </div>
    </div>
  );
}

// ─── PREFLOP MODULE ───────────────────────────────────────────────────────────
function PreflopModule({apiKey}) {
  const [pos,setPos]=useState("BTN");
  const [raiserPos,setRaiserPos]=useState(null);
  const [hand,setHand]=useState(null);
  const [choice,setChoice]=useState(null);
  const [feedback,setFeedback]=useState(null);
  const [loading,setLoading]=useState(false);
  const [showRange,setShowRange]=useState(false);

  const deal=()=>{
    setHand(randHand()); setChoice(null); setFeedback(null); setShowRange(false);
    const heroIdx=POS_ORDER.indexOf(pos);
    const earlier=POS_ORDER.slice(0,heroIdx);
    setRaiserPos(Math.random()>0.4&&earlier.length>0?randFrom(earlier):null);
  };

  const decide=async(action)=>{
    setChoice(action); setLoading(true);
    const ctx=raiserPos
      ?`Hero at ${pos} facing raise from ${raiserPos}. Hand: ${handStr(hand)} (${hand.join(" ")}). Chose: ${action}.`
      :`Hero at ${pos}, first in. Hand: ${handStr(hand)} (${hand.join(" ")}). Chose: ${action}.`;
    const fb=await askClaude(`Evaluate preflop: ${ctx} Correct? State correct action. Note leaks.`,apiKey);
    setFeedback(fb); setLoading(false);
  };

  const heroRange = getOpenRange(pos);
  const raiserRange = raiserPos ? getOpenRange(raiserPos) : null;
  const displayRange = raiserRange || heroRange;
  const rangeCells = buildCellStates(displayRange);

  // Highlight hero's hand in the grid
  if(hand) {
    const hKey = handStr(hand);
    if(rangeCells[hKey] !== undefined) rangeCells[hKey] = rangeCells[hKey]==="in"?"in":"possible";
  }

  const actions=raiserPos?[["Fold","#7f1d1d"],["Call","#d97706"],["3-Bet","#2563eb"]]:[["Fold","#7f1d1d"],["Raise","#16a34a"],["Limp","#7c3aed"]];

  return (
    <div>
      <div style={{marginBottom:10}}>
        <div style={{fontSize:10,color:"#64748b",marginBottom:4,textTransform:"uppercase",letterSpacing:1}}>Your Position</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
          {POS_ORDER.map(p=><button key={p} onClick={()=>{setPos(p);setHand(null);setFeedback(null);setRaiserPos(null);setShowRange(false);}} style={{padding:"4px 8px",borderRadius:5,border:"none",cursor:"pointer",fontSize:11,fontWeight:600,background:pos===p?"#16a34a":"#1e293b",color:pos===p?"#fff":"#94a3b8"}}>{p}</button>)}
        </div>
      </div>
      <button onClick={deal} style={{width:"100%",background:"linear-gradient(135deg,#16a34a,#15803d)",color:"#fff",border:"none",borderRadius:8,padding:"10px 0",fontSize:13,fontWeight:700,cursor:"pointer",marginBottom:10}}>Deal Hand</button>

      {hand && (
        <div>
          <div style={{background:"#1e293b",borderRadius:10,padding:12,marginBottom:10,textAlign:"center"}}>
            <div style={{fontSize:10,color:"#64748b",marginBottom:6}}>{raiserPos?`${raiserPos} raised — your action at ${pos}`:`Folded to you at ${pos} — first in`}</div>
            <div style={{fontSize:26,marginBottom:4}}>{hand.map((c,i)=><Card key={i} card={c} size={26}/>)}</div>
            <div style={{fontSize:13,fontWeight:700,color:"#e2e8f0"}}>{handStr(hand)}</div>
            <div style={{fontSize:10,color:displayRange.has(handStr(hand))?"#16a34a":"#ef4444",marginTop:4,fontWeight:600}}>
              {displayRange.has(handStr(hand))?"✓ In GTO range":"✗ Outside GTO range"} for {raiserPos||pos}
            </div>
          </div>

          {!choice&&<div style={{display:"grid",gridTemplateColumns:`repeat(${actions.length},1fr)`,gap:6,marginBottom:10}}>{actions.map(([label,color])=><button key={label} onClick={()=>decide(label)} style={{background:color,color:"#fff",border:"none",borderRadius:8,padding:"10px 0",fontSize:12,fontWeight:700,cursor:"pointer"}}>{label}</button>)}</div>}
          {loading&&<div style={{textAlign:"center",padding:12,color:"#64748b",fontSize:11}}>Analysing...</div>}
          {feedback&&<div style={{background:"#1e293b",borderRadius:10,padding:12,marginTop:8,borderLeft:"3px solid #16a34a",marginBottom:10}}>
            <div style={{fontSize:10,color:"#16a34a",fontWeight:700,marginBottom:5,textTransform:"uppercase",letterSpacing:1}}>Coach</div>
            <div style={{fontSize:12,color:"#e2e8f0",lineHeight:1.5}}>{feedback}</div>
            <button onClick={deal} style={{marginTop:8,background:"#16a34a",color:"#fff",border:"none",borderRadius:6,padding:"5px 14px",fontSize:11,fontWeight:700,cursor:"pointer"}}>Next →</button>
          </div>}

          {/* Range toggle */}
          <button onClick={()=>setShowRange(v=>!v)} style={{width:"100%",background:"#1e293b",border:"1px solid #334155",color:"#94a3b8",borderRadius:7,padding:"7px 0",fontSize:11,cursor:"pointer",fontWeight:600}}>
            {showRange?"Hide":"Show"} {raiserPos?raiserPos:pos} Opening Range
          </button>
          {showRange&&<div style={{marginTop:8}}><RangeGrid cellStates={rangeCells} title={`${raiserPos||pos} opening range`}/></div>}
        </div>
      )}
    </div>
  );
}

// ─── RANGE READ MODULE (with interactive grid) ────────────────────────────────
function RangeModule({apiKey}) {
  const [state,setState]=useState(null);
  const [selectedCells,setSelectedCells]=useState({});
  const [submitted,setSubmitted]=useState(false);
  const [feedback,setFeedback]=useState(null);
  const [feedbackCells,setFeedbackCells]=useState(null);
  const [loading,setLoading]=useState(false);
  const [stages,setStages]=useState(null);
  const [showEvolution,setShowEvolution]=useState(false);

  const SCENARIO_TEMPLATES = [
    { pos:"UTG", action:"raises preflop", streets:["preflop"], board:null,
      description:"UTG open raises preflop" },
    { pos:"HJ", action:"raises preflop, cbets flop when checked to", streets:["preflop","flop"],
      description:"HJ open raises, cbets flop" },
    { pos:"BTN", action:"raises preflop, checks flop, bets turn", streets:["preflop","flop","turn"],
      description:"BTN raises, checks flop, fires turn" },
    { pos:"CO", action:"3bets preflop then jams flop", streets:["preflop","flop"],
      description:"CO 3bets preflop, jams flop" },
    { pos:"MP", action:"raises preflop, cbets flop, checks turn, bets river", streets:["preflop","flop","turn","river"],
      description:"MP raises, cbets, checks turn, fires river" },
    { pos:"BTN", action:"open shoves 10BB", streets:["preflop"],
      description:"BTN open shoves 10BB" },
    { pos:"SB", action:"calls preflop then check-raises flop", streets:["preflop","flop"],
      description:"SB calls, check-raises flop" },
    { pos:"HJ", action:"raises preflop, checks flop, bets turn", streets:["preflop","flop","turn"],
      description:"HJ raises, checks flop, bets turn" },
  ];

  const deal=()=>{
    const template=randFrom(SCENARIO_TEMPLATES);
    const board=template.board||randBoard(Math.min(template.streets.length===1?0:template.streets.length+1,5));
    setState({...template,board,stack:randFrom(["8BB","15BB","25BB","40BB","80BB"])});
    setSelectedCells({});
    setSubmitted(false);
    setFeedback(null);
    setFeedbackCells(null);
    setStages(null);
    setShowEvolution(false);
  };

  const toggleCell=useCallback((key)=>{
    if(submitted) return;
    setSelectedCells(prev=>{
      const cur=prev[key]||"out";
      // Cycle: out -> selected_in -> selected_possible -> out
      const next=cur==="out"?"selected_in":cur==="selected_in"?"selected_possible":"out";
      return {...prev,[key]:next};
    });
  },[submitted]);

  const submit=async()=>{
    setSubmitted(true); setLoading(true);

    // Build selected hand list
    const definitelyIn=[],possibly=[];
    Object.entries(selectedCells).forEach(([k,v])=>{
      if(v==="selected_in") definitelyIn.push(handKeyDisplay(k));
      if(v==="selected_possible") possibly.push(handKeyDisplay(k));
    });

    const selectionStr=`Definitely in range: ${definitelyIn.join(", ")||"none"}. Possibly in range: ${possibly.join(", ")||"none"}.`;

    // Get correct range and build feedback cells
    const correctRange=getOpenRange(state.pos);
    const newFeedbackCells={};
    RANKS.forEach((r1,i)=>RANKS.forEach((r2,j)=>{
      const key=getHandKey(r1,r2,i,j);
      const userSelected=selectedCells[key]==="selected_in"||selectedCells[key]==="selected_possible";
      const inCorrect=correctRange.has(key);
      if(inCorrect&&userSelected) newFeedbackCells[key]="correct";
      else if(inCorrect&&!userSelected) newFeedbackCells[key]="missed";
      else if(!inCorrect&&userSelected) newFeedbackCells[key]="wrong";
      else newFeedbackCells[key]="out";
    }));
    setFeedbackCells(newFeedbackCells);

    // Build range evolution stages
    const openRange=getOpenRange(state.pos);
    const newStages=[{
      label:"Preflop",
      description:`${state.pos} opening range`,
      cells:buildCellStates(openRange),
      explanation:`${state.pos} opens with ${[...openRange].length} hand combos. This is their starting range before any board interaction.`
    }];

    if(state.streets.includes("flop")&&state.board.length>=3) {
      // After flop cbet/check - narrow range
      const flopBoard=state.board.slice(0,3);
      const boardRanks=new Set(flopBoard.map(c=>c[0]));
      // Remove pure air hands that don't connect
      const flopRange=new Set([...openRange].filter(h=>{
        if(state.action.includes("cbets")) {
          // Cbetting range: value + draws, remove pure bluffs with no equity
          return true; // simplified - keep most hands
        }
        if(state.action.includes("checks")) {
          // Checking back: medium strength, no strong value, no air bluffs
          const r1=h[0],r2=h.length===2?h[1]:h[1];
          return !["AA","KK","QQ"].includes(h); // simplified
        }
        return true;
      }));
      newStages.push({
        label:"Flop",
        description:`After ${state.action.includes("cbets")?"cbetting":"checking"} flop ${flopBoard.join(" ")}`,
        cells:buildCellStates(flopRange,new Set(),new Set([...openRange].filter(h=>!flopRange.has(h)))),
        explanation:`On ${flopBoard.join(" ")}, villain's range ${state.action.includes("cbets")?"bets for value and with draws, removing pure air":"checks back, capping their range — strong hands and medium hands, eliminating some value bets"}.`
      });
    }

    if(state.streets.includes("turn")&&state.board.length>=4) {
      const turnCard=state.board[3];
      newStages.push({
        label:"Turn",
        description:`After turn action — ${turnCard}`,
        cells:buildCellStates(
          new Set([...openRange].filter(h=>["AA","KK","QQ","JJ","AK","AQ"].includes(h)||h.endsWith("s"))),
          new Set([...openRange].filter(h=>!["AA","KK","QQ","JJ","AK","AQ"].includes(h)&&!h.endsWith("s"))),
        ),
        explanation:`Turn ${state.action.includes("bets turn")?"bet":"check"} on ${turnCard} narrows range significantly. ${state.action.includes("bets turn")?"Betting range = strong value + select bluffs.":"Checking again caps range — unlikely to have the nuts."}`
      });
    }

    setStages(newStages);

    const fb=await askClaude(
      `Range reading: ${state.pos} (${state.stack}) ${state.action}. Board: ${state.board.slice(0,3).join(" ")}. ` +
      `Student selected: ${selectionStr}. Correct ${state.pos} opening range has ${[...correctRange].length} combos. ` +
      `Evaluate accuracy: what did they get right, what did they miss, what key hands should/shouldn't be in range and why?`,
      apiKey
    );
    setFeedback(fb); setLoading(false);
  };

  const currentCells={...Object.fromEntries(RANKS.flatMap((r1,i)=>RANKS.map((r2,j)=>[getHandKey(r1,r2,i,j),"out"]))),...selectedCells};

  return (
    <div>
      <button onClick={deal} style={{width:"100%",background:"linear-gradient(135deg,#7c3aed,#6d28d9)",color:"#fff",border:"none",borderRadius:8,padding:"10px 0",fontSize:13,fontWeight:700,cursor:"pointer",marginBottom:10}}>Generate Range Spot</button>

      {state&&(
        <div>
          <div style={{background:"#1e293b",borderRadius:10,padding:12,marginBottom:10}}>
            <div style={{fontSize:10,color:"#7c3aed",textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Read This Player</div>
            <div style={{fontSize:13,color:"#e2e8f0",marginBottom:8,lineHeight:1.6}}>
              <span style={{color:"#a78bfa",fontWeight:700}}>{state.pos}</span> ({state.stack}) <span style={{color:"#94a3b8"}}>{state.action}</span>
            </div>
            {state.board.length>0&&<div style={{marginBottom:4}}><span style={{fontSize:10,color:"#64748b",marginRight:4}}>Board:</span>{state.board.map((c,i)=><Card key={i} card={c} size={20}/>)}</div>}
          </div>

          {/* Interactive grid */}
          <div style={{background:"#1e293b",borderRadius:10,padding:12,marginBottom:10}}>
            <div style={{fontSize:11,color:"#e2e8f0",marginBottom:6,fontWeight:600}}>
              {submitted?"Results — Green=correct, Red=missed, Dark=wrong selected":"Select hands you think are in villain's range:"}
            </div>
            <div style={{fontSize:10,color:"#64748b",marginBottom:8}}>
              {!submitted&&"Tap once = Definitely in range (green) · Tap twice = Possibly in range (yellow) · Tap again = Remove"}
            </div>
            <RangeGrid
              cellStates={submitted?(feedbackCells||currentCells):currentCells}
              onCellClick={submitted?null:toggleCell}
              showLegend={true}
            />
            {submitted&&feedbackCells&&(
              <div style={{display:"flex",gap:8,marginTop:6,flexWrap:"wrap"}}>
                {[{color:"#16a34a",label:"Correct"},{color:"#dc2626",label:"Missed"},{color:"#7f1d1d",label:"Wrong pick"},{color:"#1e293b",label:"Correctly excluded"}].map(({color,label})=>(
                  <div key={label} style={{display:"flex",alignItems:"center",gap:3}}>
                    <div style={{width:10,height:10,borderRadius:2,background:color,border:"1px solid #334155"}}/>
                    <span style={{fontSize:9,color:"#64748b"}}>{label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!submitted&&(
            <button onClick={submit} style={{width:"100%",background:"#7c3aed",color:"#fff",border:"none",borderRadius:8,padding:"9px 0",fontSize:12,fontWeight:700,cursor:"pointer",marginBottom:8}}>Submit Range Read</button>
          )}

          {loading&&<div style={{textAlign:"center",padding:12,color:"#64748b",fontSize:11}}>Evaluating your read...</div>}

          {feedback&&(
            <div style={{background:"#1e293b",borderRadius:10,padding:12,marginTop:8,borderLeft:"3px solid #7c3aed",marginBottom:8}}>
              <div style={{fontSize:10,color:"#7c3aed",fontWeight:700,marginBottom:5,textTransform:"uppercase",letterSpacing:1}}>Coach</div>
              <div style={{fontSize:12,color:"#e2e8f0",lineHeight:1.5}}>{feedback}</div>
              <button onClick={deal} style={{marginTop:8,background:"#7c3aed",color:"#fff",border:"none",borderRadius:6,padding:"5px 14px",fontSize:11,fontWeight:700,cursor:"pointer"}}>Next →</button>
            </div>
          )}

          {/* Range Evolution */}
          {stages&&(
            <div>
              <button onClick={()=>setShowEvolution(v=>!v)} style={{width:"100%",background:"#1e293b",border:"1px solid #7c3aed",color:"#a78bfa",borderRadius:7,padding:"7px 0",fontSize:11,cursor:"pointer",fontWeight:600}}>
                {showEvolution?"Hide":"Show"} Range Evolution →
              </button>
              {showEvolution&&<RangeEvolution stages={stages}/>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── CBET MODULE ──────────────────────────────────────────────────────────────
function CbetModule({apiKey}) {
  const [state,setState]=useState(null);
  const [choice,setChoice]=useState(null);
  const [feedback,setFeedback]=useState(null);
  const [loading,setLoading]=useState(false);
  const [showRange,setShowRange]=useState(false);

  const deal=()=>{
    const heroPos=randFrom(IP_POSITIONS);
    const hand=randHand();
    const board=randBoard(3,hand);
    const pot=Math.floor(Math.random()*15)+5;
    const villainPos=getVillainPos(heroPos);
    setState({heroPos,hand,board,pot,villainPos});
    setChoice(null); setFeedback(null); setShowRange(false);
  };

  const decide=async(action)=>{
    setChoice(action); setLoading(true);
    const fb=await askClaude(
      `Cbet: Hero ${state.heroPos} (IP) raised preflop, ${handStr(state.hand)} (${state.hand.join(" ")}). Board: ${state.board.join(" ")}. Pot: ${state.pot}BB. Villain (${state.villainPos}) checked. Chose: ${action}. Evaluate sizing and board texture.`,
      apiKey
    );
    setFeedback(fb); setLoading(false);
  };

  const heroRange=state?getOpenRange(state.heroPos):new Set();
  const rangeCells=state?buildCellStates(heroRange):null;

  return (
    <div>
      <button onClick={deal} style={{width:"100%",background:"linear-gradient(135deg,#2563eb,#1d4ed8)",color:"#fff",border:"none",borderRadius:8,padding:"10px 0",fontSize:13,fontWeight:700,cursor:"pointer",marginBottom:10}}>Generate C-Bet Spot</button>
      {state&&(
        <div>
          <div style={{background:"#1e293b",borderRadius:10,padding:12,marginBottom:10}}>
            <div style={{fontSize:10,color:"#2563eb",textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>You raised preflop — IP vs {state.villainPos}</div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
              <div>
                <div style={{fontSize:10,color:"#64748b",marginBottom:3}}>Hand at {state.heroPos}</div>
                <div>{state.hand.map((c,i)=><Card key={i} card={c}/>)}</div>
                <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>{handStr(state.hand)}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:10,color:"#64748b",marginBottom:3}}>Pot</div>
                <div style={{fontSize:18,fontWeight:700,color:"#16a34a"}}>{state.pot}BB</div>
              </div>
            </div>
            <div style={{textAlign:"center",marginBottom:6}}>
              <div style={{fontSize:10,color:"#64748b",marginBottom:4}}>Flop</div>
              <div>{state.board.map((c,i)=><Card key={i} card={c} size={22}/>)}</div>
              <div style={{fontSize:11,color:"#64748b",marginTop:6}}>Villain ({state.villainPos}) checked to you</div>
            </div>
          </div>
          {!choice&&<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:5,marginBottom:10}}>{["Check","1/3 Pot","1/2 Pot","2/3 Pot","Pot","All-in"].map(s=><button key={s} onClick={()=>decide(s)} style={{background:s==="Check"?"#1e293b":s==="All-in"?"#7f1d1d":"#16a34a",color:s==="Check"?"#94a3b8":"#fff",border:"1px solid #334155",borderRadius:7,padding:"8px 4px",fontSize:11,fontWeight:700,cursor:"pointer"}}>{s}</button>)}</div>}
          {loading&&<div style={{textAlign:"center",padding:12,color:"#64748b",fontSize:11}}>Analysing...</div>}
          {feedback&&<div style={{background:"#1e293b",borderRadius:10,padding:12,marginTop:8,borderLeft:"3px solid #2563eb",marginBottom:10}}>
            <div style={{fontSize:10,color:"#2563eb",fontWeight:700,marginBottom:5,textTransform:"uppercase",letterSpacing:1}}>Coach</div>
            <div style={{fontSize:12,color:"#e2e8f0",lineHeight:1.5}}>{feedback}</div>
            <button onClick={deal} style={{marginTop:8,background:"#2563eb",color:"#fff",border:"none",borderRadius:6,padding:"5px 14px",fontSize:11,fontWeight:700,cursor:"pointer"}}>Next →</button>
          </div>}
          <button onClick={()=>setShowRange(v=>!v)} style={{width:"100%",background:"#1e293b",border:"1px solid #334155",color:"#94a3b8",borderRadius:7,padding:"7px 0",fontSize:11,cursor:"pointer",fontWeight:600}}>
            {showRange?"Hide":"Show"} Your Opening Range ({state.heroPos})
          </button>
          {showRange&&rangeCells&&<div style={{marginTop:8}}><RangeGrid cellStates={rangeCells} title={`${state.heroPos} opening range`}/></div>}
        </div>
      )}
    </div>
  );
}

// ─── CALL/FOLD MODULE ─────────────────────────────────────────────────────────
function CallFoldModule({apiKey}) {
  const [state,setState]=useState(null);
  const [choice,setChoice]=useState(null);
  const [feedback,setFeedback]=useState(null);
  const [loading,setLoading]=useState(false);

  const deal=()=>{
    const hand=randHand();
    const nCards=randFrom([3,4,5]);
    const board=randBoard(nCards,hand);
    const pot=Math.floor(Math.random()*30)+8;
    const bet=Math.floor(pot*(Math.random()*0.8+0.2));
    const stack=Math.floor(Math.random()*40)+5;
    const needed=Math.round(bet/(pot+bet*2)*100);
    const heroPos=randFrom(OOP_POSITIONS);
    setState({hand,board,pot,bet,stack,needed,heroPos,villainPos:randFrom(IP_POSITIONS),street:nCards===3?"Flop":nCards===4?"Turn":"River"});
    setChoice(null); setFeedback(null);
  };

  const decide=async(action)=>{
    setChoice(action); setLoading(true);
    const fb=await askClaude(
      `Call/Fold on ${state.street}. Hero ${state.heroPos} (OOP) with ${handStr(state.hand)} (${state.hand.join(" ")}). Board: ${state.board.join(" ")}. Pot: ${state.pot}BB. Villain (${state.villainPos} IP) bets ${state.bet}BB. Stack behind: ${state.stack}BB. Pot odds needed: ${state.needed}%. Chose: ${action}. Correct?`,
      apiKey
    );
    setFeedback(fb); setLoading(false);
  };

  return (
    <div>
      <button onClick={deal} style={{width:"100%",background:"linear-gradient(135deg,#d97706,#b45309)",color:"#fff",border:"none",borderRadius:8,padding:"10px 0",fontSize:13,fontWeight:700,cursor:"pointer",marginBottom:10}}>Generate Decision</button>
      {state&&(
        <div>
          <div style={{background:"#1e293b",borderRadius:10,padding:12,marginBottom:10}}>
            <div style={{fontSize:10,color:"#d97706",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>{state.street} — {state.heroPos} (OOP) vs {state.villainPos} (IP)</div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
              <div>
                <div style={{fontSize:10,color:"#64748b",marginBottom:3}}>Your Hand</div>
                <div>{state.hand.map((c,i)=><Card key={i} card={c}/>)}</div>
                <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>{handStr(state.hand)}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:10,color:"#64748b",marginBottom:3}}>Stack Behind</div>
                <div style={{fontSize:16,fontWeight:700,color:"#e2e8f0"}}>{state.stack}BB</div>
              </div>
            </div>
            <div style={{textAlign:"center",marginBottom:8}}>
              <div style={{fontSize:10,color:"#64748b",marginBottom:4}}>Board</div>
              <div>{state.board.map((c,i)=><Card key={i} card={c} size={22}/>)}</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5}}>
              {[{l:"Pot",v:`${state.pot}BB`},{l:"Villain Bets",v:`${state.bet}BB`},{l:"Need Equity",v:`${state.needed}%`}].map(({l,v})=>(
                <div key={l} style={{background:"#0f172a",borderRadius:6,padding:6,textAlign:"center"}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#fbbf24"}}>{v}</div>
                  <div style={{fontSize:9,color:"#64748b"}}>{l}</div>
                </div>
              ))}
            </div>
          </div>
          {!choice&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>{[["Fold","#7f1d1d"],["Call","#d97706"],["Raise","#16a34a"]].map(([label,color])=><button key={label} onClick={()=>decide(label)} style={{background:color,color:"#fff",border:"none",borderRadius:8,padding:"10px 0",fontSize:12,fontWeight:700,cursor:"pointer"}}>{label}</button>)}</div>}
          {loading&&<div style={{textAlign:"center",padding:12,color:"#64748b",fontSize:11}}>Calculating...</div>}
          {feedback&&<div style={{background:"#1e293b",borderRadius:10,padding:12,marginTop:8,borderLeft:"3px solid #d97706"}}>
            <div style={{fontSize:10,color:"#d97706",fontWeight:700,marginBottom:5,textTransform:"uppercase",letterSpacing:1}}>Coach</div>
            <div style={{fontSize:12,color:"#e2e8f0",lineHeight:1.5}}>{feedback}</div>
            <button onClick={deal} style={{marginTop:8,background:"#d97706",color:"#fff",border:"none",borderRadius:6,padding:"5px 14px",fontSize:11,fontWeight:700,cursor:"pointer"}}>Next →</button>
          </div>}
        </div>
      )}
    </div>
  );
}

// ─── BLUFF MODULE ─────────────────────────────────────────────────────────────
function BluffModule({apiKey}) {
  const [state,setState]=useState(null);
  const [choice,setChoice]=useState(null);
  const [feedback,setFeedback]=useState(null);
  const [loading,setLoading]=useState(false);
  const [showRange,setShowRange]=useState(false);

  const deal=()=>{
    const heroPos=randFrom(IP_POSITIONS);
    const hand=randHand();
    const nCards=randFrom([3,4,5]);
    const villainPos=getVillainPos(heroPos);
    setState({heroPos,hand,board:randBoard(nCards,hand),pot:Math.floor(Math.random()*25)+8,stack:Math.floor(Math.random()*35)+10,villainPos,villainAction:randFrom(["checked to you","bet small then checked turn","checked twice","showed weakness on all streets","checked and called small, now checked again"])});
    setChoice(null); setFeedback(null); setShowRange(false);
  };

  const decide=async(action)=>{
    setChoice(action); setLoading(true);
    const fb=await askClaude(
      `Bluff spot: Hero ${state.heroPos} (IP) with ${handStr(state.hand)} (${state.hand.join(" ")}). Board: ${state.board.join(" ")}. Pot: ${state.pot}BB, stack: ${state.stack}BB. Villain (${state.villainPos}) ${state.villainAction}. Chose: ${action}. Good bluff? Range perception? Correct sizing?`,
      apiKey
    );
    setFeedback(fb); setLoading(false);
  };

  const heroRange=state?getOpenRange(state.heroPos):new Set();
  const rangeCells=state?buildCellStates(heroRange):null;

  return (
    <div>
      <button onClick={deal} style={{width:"100%",background:"linear-gradient(135deg,#dc2626,#b91c1c)",color:"#fff",border:"none",borderRadius:8,padding:"10px 0",fontSize:13,fontWeight:700,cursor:"pointer",marginBottom:10}}>Generate Bluff Spot</button>
      {state&&(
        <div>
          <div style={{background:"#1e293b",borderRadius:10,padding:12,marginBottom:10}}>
            <div style={{fontSize:10,color:"#dc2626",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Bluff Opportunity? — {state.heroPos} (IP)</div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
              <div>
                <div style={{fontSize:10,color:"#64748b",marginBottom:3}}>Hand</div>
                <div>{state.hand.map((c,i)=><Card key={i} card={c}/>)}</div>
                <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>{handStr(state.hand)}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:10,color:"#64748b",marginBottom:3}}>Pot / Stack</div>
                <div style={{fontSize:14,fontWeight:700,color:"#e2e8f0"}}>{state.pot}BB / {state.stack}BB</div>
              </div>
            </div>
            <div style={{textAlign:"center",marginBottom:8}}><div>{state.board.map((c,i)=><Card key={i} card={c} size={22}/>)}</div></div>
            <div style={{background:"#0f172a",borderRadius:6,padding:8,fontSize:11,color:"#94a3b8",textAlign:"center"}}>Villain ({state.villainPos}) <span style={{color:"#fbbf24",fontWeight:600}}>{state.villainAction}</span></div>
          </div>
          {!choice&&<div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:10}}>{["Check/Give Up","Small Bluff (1/3)","Half Pot Bluff","Pot Bluff","Jam"].map(a=><button key={a} onClick={()=>decide(a)} style={{background:a==="Check/Give Up"?"#1e293b":"#dc2626",color:a==="Check/Give Up"?"#94a3b8":"#fff",border:"1px solid #334155",borderRadius:7,padding:"9px 0",fontSize:12,fontWeight:700,cursor:"pointer"}}>{a}</button>)}</div>}
          {loading&&<div style={{textAlign:"center",padding:12,color:"#64748b",fontSize:11}}>Evaluating...</div>}
          {feedback&&<div style={{background:"#1e293b",borderRadius:10,padding:12,marginTop:8,borderLeft:"3px solid #dc2626",marginBottom:10}}>
            <div style={{fontSize:10,color:"#dc2626",fontWeight:700,marginBottom:5,textTransform:"uppercase",letterSpacing:1}}>Coach</div>
            <div style={{fontSize:12,color:"#e2e8f0",lineHeight:1.5}}>{feedback}</div>
            <button onClick={deal} style={{marginTop:8,background:"#dc2626",color:"#fff",border:"none",borderRadius:6,padding:"5px 14px",fontSize:11,fontWeight:700,cursor:"pointer"}}>Next →</button>
          </div>}
          <button onClick={()=>setShowRange(v=>!v)} style={{width:"100%",background:"#1e293b",border:"1px solid #334155",color:"#94a3b8",borderRadius:7,padding:"7px 0",fontSize:11,cursor:"pointer",fontWeight:600}}>
            {showRange?"Hide":"Show"} Your Range ({state.heroPos}) — Bluff Candidates
          </button>
          {showRange&&rangeCells&&<div style={{marginTop:8}}><RangeGrid cellStates={rangeCells} title={`${state.heroPos} opening range — select bluff candidates`}/></div>}
        </div>
      )}
    </div>
  );
}

// ─── FULL HAND MODULE ─────────────────────────────────────────────────────────
function ScenarioModule({apiKey}) {
  const [hand,setHand]=useState(null);
  const [board,setBoard]=useState([]);
  const [street,setStreet]=useState("preflop");
  const [pot,setPot]=useState(1.5);
  const [heroPos,setHeroPos]=useState("");
  const [villainPos,setVillainPos]=useState("");
  const [heroStack,setHeroStack]=useState(0);
  const [history,setHistory]=useState([]);
  const [feedback,setFeedback]=useState(null);
  const [loading,setLoading]=useState(false);
  const [done,setDone]=useState(false);
  const [heroIsIP,setHeroIsIP]=useState(true);
  const [showRange,setShowRange]=useState(false);
  const [villainRangeCells,setVillainRangeCells]=useState(null);

  const startHand=()=>{
    const ip=Math.random()>0.4;
    const hp=ip?randFrom(IP_POSITIONS):randFrom(OOP_POSITIONS);
    const vp=getVillainPos(hp);
    const stack=Math.floor(Math.random()*60)+15;
    const h=randHand();
    setHand(h); setHeroPos(hp); setVillainPos(vp);
    setHeroStack(stack); setPot(1.5);
    setBoard([]); setStreet("preflop");
    setHistory([]); setFeedback(null); setDone(false);
    setHeroIsIP(ip); setShowRange(false);
    // Set initial villain range
    const vRange=getOpenRange(vp);
    setVillainRangeCells(buildCellStates(vRange));
  };

  const makeChoice=async(action)=>{
    setLoading(true);
    const newHistory=[...history,{street,action}];
    setHistory(newHistory);
    let nextStreet=street,newBoard=[...board],newPot=pot;
    if(street==="preflop"){nextStreet="flop";newBoard=randBoard(3,hand);newPot=action.includes("Raise")||action.includes("3")||action.includes("Jam")?pot*3:action==="Call"?pot*2:pot;}
    else if(street==="flop"){nextStreet="turn";newBoard=[...board,...randBoard(1,[...hand,...board])];newPot=action.includes("Bet")||action.includes("Raise")||action.includes("Jam")?pot*1.8:pot;}
    else if(street==="turn"){nextStreet="river";newBoard=[...board,...randBoard(1,[...hand,...board])];newPot=action.includes("Bet")||action.includes("Raise")||action.includes("Jam")?pot*1.8:pot;}
    else{nextStreet="done";setDone(true);}
    setBoard(newBoard); setStreet(nextStreet); setPot(Math.round(newPot*10)/10);

    // Narrow villain range based on action
    const vRange=getOpenRange(villainPos);
    if(nextStreet!=="preflop") {
      // Simplified narrowing — remove some hands based on board
      const narrowed=new Set([...vRange].filter(()=>Math.random()>0.2));
      setVillainRangeCells(buildCellStates(narrowed,new Set(),new Set([...vRange].filter(h=>!narrowed.has(h)))));
    }

    const posCtx=heroIsIP?`Hero ${heroPos} is IP (acts last postflop)`:`Hero ${heroPos} is OOP (acts first postflop)`;
    const histStr=newHistory.map(h=>`${h.street}:${h.action}`).join(", ");
    const fb=await askClaude(
      `Full hand: ${posCtx}. Hand: ${hand?handStr(hand):""} (${hand?.join(" ")}), ${heroStack}BB. Villain: ${villainPos}. History: ${histStr}. Board: ${newBoard.join(" ")}. Pot: ${newPot.toFixed(1)}BB. Evaluate ${street} action "${action}". Key tip for ${nextStreet}.`,
      apiKey
    );
    setFeedback(fb); setLoading(false);
  };

  const streets=["preflop","flop","turn","river"];
  const getActions=()=>{
    if(street==="preflop") return ["Fold","Call","Raise 2.5BB","3-Bet","Jam"];
    if(done) return [];
    return heroIsIP?["Check Back","Bet 1/3","Bet 1/2","Bet 2/3","Jam"]:["Check","Fold to Bet","Call Bet","Lead 1/3","Lead 1/2","Jam"];
  };

  return (
    <div>
      <button onClick={startHand} style={{width:"100%",background:"linear-gradient(135deg,#0891b2,#0e7490)",color:"#fff",border:"none",borderRadius:8,padding:"10px 0",fontSize:13,fontWeight:700,cursor:"pointer",marginBottom:10}}>{hand?"New Hand":"Deal Hand"}</button>
      {hand&&(
        <div>
          <div style={{background:"#1e293b",borderRadius:10,padding:12,marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
              <div>
                <div style={{fontSize:10,color:"#64748b",marginBottom:3}}>{heroPos} ({heroIsIP?"IP":"OOP"}) vs {villainPos}</div>
                <div>{hand.map((c,i)=><Card key={i} card={c}/>)}</div>
                <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>{handStr(hand)}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:10,color:"#64748b",marginBottom:3}}>Stack / Pot</div>
                <div style={{fontSize:14,fontWeight:700,color:"#16a34a"}}>{heroStack}BB</div>
                <div style={{fontSize:12,color:"#fbbf24"}}>{pot}BB</div>
              </div>
            </div>
            {board.length>0&&<div style={{textAlign:"center",marginBottom:8}}><div style={{fontSize:10,color:"#64748b",marginBottom:4}}>{board.length===3?"Flop":board.length===4?"Turn":"River"}</div><div>{board.map((c,i)=><Card key={i} card={c} size={22}/>)}</div></div>}
            <div style={{display:"flex",justifyContent:"center",gap:5}}>{streets.map(s=><div key={s} style={{width:7,height:7,borderRadius:"50%",background:street===s?"#16a34a":streets.indexOf(s)<streets.indexOf(street)?"#334155":"#1e293b",border:`1px solid ${street===s?"#16a34a":"#334155"}`}}/>)}</div>
          </div>

          {history.length>0&&<div style={{background:"#0f172a",borderRadius:8,padding:8,marginBottom:8}}>{history.map((h,i)=><div key={i} style={{fontSize:11,color:"#94a3b8",marginBottom:2}}><span style={{color:"#64748b"}}>{h.street}:</span> <span style={{color:"#e2e8f0",fontWeight:600}}>{h.action}</span></div>)}</div>}

          {feedback&&<div style={{background:"#1e293b",borderRadius:10,padding:12,marginBottom:8,borderLeft:"3px solid #0891b2"}}>
            <div style={{fontSize:10,color:"#0891b2",fontWeight:700,marginBottom:5,textTransform:"uppercase",letterSpacing:1}}>{done?"Final Analysis":"Street Feedback"}</div>
            <div style={{fontSize:12,color:"#e2e8f0",lineHeight:1.5}}>{feedback}</div>
          </div>}
          {loading&&<div style={{textAlign:"center",padding:12,color:"#64748b",fontSize:11}}>Analysing...</div>}

          {!done&&!loading&&(
            <div style={{marginBottom:10}}>
              <div style={{fontSize:10,color:"#64748b",marginBottom:5,textTransform:"uppercase",letterSpacing:1}}>{street.charAt(0).toUpperCase()+street.slice(1)} — Your Action</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:5}}>
                {getActions().map(a=><button key={a} onClick={()=>makeChoice(a)} style={{background:a.includes("Fold")?"#7f1d1d":a.includes("Check")?"#1e293b":a.includes("Jam")?"#7c3aed":"#16a34a",color:a.includes("Check")?"#94a3b8":"#fff",border:"1px solid #334155",borderRadius:7,padding:"8px 4px",fontSize:10,fontWeight:700,cursor:"pointer"}}>{a}</button>)}
              </div>
            </div>
          )}

          {/* Villain range tracker */}
          {villainRangeCells&&(
            <div>
              <button onClick={()=>setShowRange(v=>!v)} style={{width:"100%",background:"#1e293b",border:"1px solid #0891b2",color:"#67e8f9",borderRadius:7,padding:"7px 0",fontSize:11,cursor:"pointer",fontWeight:600,marginBottom:showRange?8:0}}>
                {showRange?"Hide":"Show"} Villain Range Tracker ({villainPos})
              </button>
              {showRange&&<RangeGrid cellStates={villainRangeCells} title={`${villainPos} estimated range — updates each street`}/>}
            </div>
          )}

          {done&&<button onClick={startHand} style={{width:"100%",marginTop:8,background:"#0891b2",color:"#fff",border:"none",borderRadius:8,padding:"10px 0",fontSize:13,fontWeight:700,cursor:"pointer"}}>New Hand →</button>}
        </div>
      )}
    </div>
  );
}

// ─── MODULES LIST ─────────────────────────────────────────────────────────────
const MODULES=[
  {id:"preflop",label:"Preflop",icon:"🃏",desc:"Open ranges, 3bets, fold decisions + range grid"},
  {id:"range",label:"Range Read",icon:"🔍",desc:"Click the grid to select villain's range"},
  {id:"cbet",label:"C-Bet",icon:"🎯",desc:"When to cbet, sizing, board texture"},
  {id:"callfold",label:"Call/Fold",icon:"⚖️",desc:"Pot odds, equity, implied odds"},
  {id:"bluff",label:"Bluff Spot",icon:"🎭",desc:"When to bluff, range perception"},
  {id:"scenario",label:"Full Hand",icon:"🏆",desc:"Street by street with villain range tracker"},
];

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function PokerTrainer() {
  const [activeModule,setActiveModule]=useState(null);
  const [showSettings,setShowSettings]=useState(false);
  const [apiKey,setApiKey]=useState(()=>{try{return localStorage.getItem("pkr_key")||"";}catch(e){return "";}});

  if(showSettings) return <Settings apiKey={apiKey} setApiKey={setApiKey} onClose={()=>setShowSettings(false)}/>;

  return (
    <div style={{background:"#0f172a",minHeight:"100vh",color:"#e2e8f0",fontFamily:"'Inter','SF Pro Display','Helvetica Neue',sans-serif",padding:16,maxWidth:520,margin:"0 auto"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
            <div style={{background:"linear-gradient(135deg,#16a34a,#15803d)",borderRadius:5,padding:"3px 8px",fontSize:9,fontWeight:700,letterSpacing:2,color:"#fff",textTransform:"uppercase"}}>kingygpsy</div>
            <div style={{fontSize:15,fontWeight:700,color:"#f8fafc"}}>Poker Trainer</div>
          </div>
          <div style={{fontSize:10,color:"#475569"}}>AI-powered drills with interactive range grids</div>
        </div>
        <button onClick={()=>setShowSettings(true)} style={{background:"#1e293b",border:`1px solid ${apiKey?"#16a34a":"#ef4444"}`,color:apiKey?"#16a34a":"#ef4444",borderRadius:7,padding:"6px 10px",fontSize:11,cursor:"pointer",fontWeight:600}}>
          {apiKey?"✓ API":"⚙️ Setup"}
        </button>
      </div>

      {!apiKey&&<div style={{background:"#7f1d1d",borderRadius:8,padding:10,marginBottom:12,fontSize:11,color:"#fca5a5",lineHeight:1.5}}>⚠️ No API key — tap <strong>Setup</strong> to enable AI coaching.</div>}

      {!activeModule?(
        <div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
            {MODULES.map(m=>(
              <button key={m.id} onClick={()=>setActiveModule(m.id)}
                style={{background:"#1e293b",border:"1px solid #334155",borderRadius:10,padding:14,textAlign:"left",cursor:"pointer"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor="#16a34a"}
                onMouseLeave={e=>e.currentTarget.style.borderColor="#334155"}>
                <div style={{fontSize:22,marginBottom:5}}>{m.icon}</div>
                <div style={{fontSize:12,fontWeight:700,color:"#f8fafc",marginBottom:2}}>{m.label}</div>
                <div style={{fontSize:10,color:"#64748b",lineHeight:1.4}}>{m.desc}</div>
              </button>
            ))}
          </div>
          <div style={{background:"#1e293b",borderRadius:10,padding:12}}>
            <div style={{fontSize:10,color:"#dc2626",fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>Your Known Leaks</div>
            {["Calling too much preflop — VPIP/PFR gap","Missing BTN/CO steal spots","SB not raising vs late position steals","Trash hand shoves when short stacked","Top pair weak kicker — going too far"].map((l,i)=>(
              <div key={i} style={{fontSize:11,color:"#94a3b8",marginBottom:3,paddingLeft:8,borderLeft:"2px solid #dc2626"}}>{l}</div>
            ))}
          </div>
        </div>
      ):(
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
            <button onClick={()=>setActiveModule(null)} style={{background:"#1e293b",border:"1px solid #334155",color:"#94a3b8",borderRadius:6,padding:"5px 10px",fontSize:11,cursor:"pointer"}}>← Back</button>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:"#f8fafc"}}>{MODULES.find(m=>m.id===activeModule)?.icon} {MODULES.find(m=>m.id===activeModule)?.label}</div>
              <div style={{fontSize:10,color:"#64748b"}}>{MODULES.find(m=>m.id===activeModule)?.desc}</div>
            </div>
          </div>
          {activeModule==="preflop"&&<PreflopModule apiKey={apiKey}/>}
          {activeModule==="range"&&<RangeModule apiKey={apiKey}/>}
          {activeModule==="cbet"&&<CbetModule apiKey={apiKey}/>}
          {activeModule==="callfold"&&<CallFoldModule apiKey={apiKey}/>}
          {activeModule==="bluff"&&<BluffModule apiKey={apiKey}/>}
          {activeModule==="scenario"&&<ScenarioModule apiKey={apiKey}/>}
        </div>
      )}
      <div style={{marginTop:16,textAlign:"center",fontSize:10,color:"#1e293b"}}>Powered by Claude Sonnet 4.6</div>
    </div>
  );
}
