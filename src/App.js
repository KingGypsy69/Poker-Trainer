import { useState, useCallback } from "react";

const RANKS = ["A","K","Q","J","T","9","8","7","6","5","4","3","2"];
const SUITS = ["s","h","d","c"];
const SUIT_SYMS = { s:"♠", h:"♥", d:"♦", c:"♣" };
const SUIT_COLORS = { s:"#cbd5e1", h:"#f87171", d:"#f87171", c:"#4ade80" };
const POSITIONS = ["UTG","UTG+1","MP","HJ","CO","BTN","SB","BB"];

const MODULES = [
  { id:"preflop", label:"Preflop", icon:"🃏", desc:"Open ranges, 3bets, fold decisions" },
  { id:"cbet", label:"C-Bet", icon:"🎯", desc:"When to cbet, sizing, board texture" },
  { id:"range", label:"Range Read", icon:"🔍", desc:"Put villain on a range by their actions" },
  { id:"callfold", label:"Call/Fold", icon:"⚖️", desc:"Pot odds, equity, implied odds" },
  { id:"bluff", label:"Bluff Spot", icon:"🎭", desc:"When to bluff, sizing, range perception" },
  { id:"scenario", label:"Full Hand", icon:"🏆", desc:"Play a full hand street by street" },
];

function randFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randCard(exclude=[]) {
  let card;
  do { card = randFrom(RANKS) + randFrom(SUITS); } while (exclude.includes(card));
  return card;
}
function randHand(exclude=[]) {
  const c1 = randCard(exclude);
  const c2 = randCard([...exclude, c1]);
  return [c1, c2];
}
function randBoard(n=3, exclude=[]) {
  const board = [];
  for(let i=0;i<n;i++) board.push(randCard([...exclude,...board]));
  return board;
}
function handStr([c1,c2]) {
  const r1=c1[0],r2=c2[0],s1=c1[1],s2=c2[1];
  const order="AKQJT98765432";
  const suited=s1===s2, pair=r1===r2;
  if(pair) return `${r1}${r2}`;
  const [hi,lo]=order.indexOf(r1)<order.indexOf(r2)?[r1,r2]:[r2,r1];
  return `${hi}${lo}${suited?"s":"o"}`;
}
function Card({card, size=24}) {
  const rank=card[0], suit=card[1];
  return (
    <span style={{
      display:"inline-flex",alignItems:"center",justifyContent:"center",
      background:"#1e293b",border:"1.5px solid #334155",borderRadius:5,
      padding:"2px 5px",margin:"0 2px",fontSize:size===24?12:10,
      fontWeight:700,color:SUIT_COLORS[suit],
    }}>{rank}{SUIT_SYMS[suit]}</span>
  );
}

// ─── API Call ─────────────────────────────────────────────────────────────────
async function askClaude(prompt, apiKey) {
  if(!apiKey) return "⚠️ No API key set — enter your key in settings.";
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method:"POST",
      headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
      body: JSON.stringify({
        model:"claude-sonnet-4-6",
        max_tokens:300,
        system:`You are a poker coach for kingygpsy, a tournament NLH player.
Known leaks: calling too much preflop (VPIP/PFR gap too wide), missing BTN/CO steal spots, SB not raising enough, trash hand shoves when short stacked, going too far with top pair weak kicker.
Known strengths: live reads, range reading, bluffing with range advantage, postflop in deep stack spots.
Give concise direct feedback. Max 120 words. Be specific with numbers. Call out leaks when relevant.`,
        messages:[{role:"user",content:prompt}]
      })
    });
    const data = await response.json();
    if(data.error) return `Error: ${data.error.message}`;
    return data.content?.[0]?.text || "No response";
  } catch(e) {
    return `Connection error: ${e.message}`;
  }
}

// ─── Settings Panel ───────────────────────────────────────────────────────────
function Settings({ apiKey, setApiKey, onClose }) {
  const [input, setInput] = useState(apiKey);
  const [visible, setVisible] = useState(false);
  return (
    <div style={{background:"#0f172a",minHeight:"100vh",padding:16}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
        <button onClick={onClose} style={{background:"#1e293b",border:"1px solid #334155",color:"#94a3b8",borderRadius:6,padding:"5px 10px",fontSize:11,cursor:"pointer"}}>← Back</button>
        <div style={{fontSize:14,fontWeight:700,color:"#f8fafc"}}>⚙️ Settings</div>
      </div>
      <div style={{background:"#1e293b",borderRadius:10,padding:14,marginBottom:12}}>
        <div style={{fontSize:11,color:"#16a34a",fontWeight:700,marginBottom:4,textTransform:"uppercase",letterSpacing:1}}>Anthropic API Key</div>
        <div style={{fontSize:11,color:"#64748b",marginBottom:10,lineHeight:1.5}}>
          Get your key from <span style={{color:"#60a5fa"}}>console.anthropic.com</span> → API Keys → Create new key.
          Your key is stored only in this session and never sent anywhere except Anthropic's API.
        </div>
        <div style={{display:"flex",gap:6,marginBottom:8}}>
          <input
            type={visible?"text":"password"}
            value={input}
            onChange={e=>setInput(e.target.value)}
            placeholder="sk-ant-..."
            style={{
              flex:1,background:"#0f172a",border:"1px solid #334155",borderRadius:7,
              padding:"8px 10px",color:"#e2e8f0",fontSize:11,outline:"none",
            }}
          />
          <button onClick={()=>setVisible(v=>!v)} style={{
            background:"#1e293b",border:"1px solid #334155",color:"#94a3b8",
            borderRadius:7,padding:"8px 10px",fontSize:11,cursor:"pointer",
          }}>{visible?"Hide":"Show"}</button>
        </div>
        <button onClick={()=>{setApiKey(input);onClose();}} style={{
          width:"100%",background:"#16a34a",color:"#fff",border:"none",
          borderRadius:7,padding:"9px 0",fontSize:12,fontWeight:700,cursor:"pointer",
        }}>Save Key</button>
      </div>
      <div style={{background:"#1e293b",borderRadius:10,padding:12}}>
        <div style={{fontSize:10,color:"#64748b",marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>Cost Estimate</div>
        <div style={{fontSize:11,color:"#94a3b8",lineHeight:1.7}}>
          Each feedback call: ~$0.003–0.005<br/>
          20 drills per session: ~$0.06–0.10<br/>
          Full month of daily drilling: ~$1–3<br/>
          <span style={{color:"#16a34a"}}>Very cheap — $5 credit lasts months</span>
        </div>
      </div>
    </div>
  );
}

// ─── Preflop Module ───────────────────────────────────────────────────────────
function PreflopModule({ apiKey }) {
  const [pos, setPos] = useState("BTN");
  const [raiserPos, setRaiserPos] = useState(null);
  const [hand, setHand] = useState(null);
  const [choice, setChoice] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);

  const deal = () => {
    setHand(randHand());
    setChoice(null);
    setFeedback(null);
    const hasPrior = Math.random() > 0.5;
    const priorPositions = POSITIONS.slice(0, POSITIONS.indexOf(pos));
    setRaiserPos(hasPrior && priorPositions.length > 0 ? randFrom(priorPositions) : null);
  };

  const decide = async (action) => {
    setChoice(action);
    setLoading(true);
    const context = raiserPos
      ? `${pos} facing raise from ${raiserPos}. Hand: ${handStr(hand)} (${hand.join(" ")}). Action: ${action}.`
      : `${pos} first in. Hand: ${handStr(hand)} (${hand.join(" ")}). Action: ${action}.`;
    const fb = await askClaude(`Evaluate preflop: ${context}. Correct? What should they do and why?`, apiKey);
    setFeedback(fb);
    setLoading(false);
  };

  const actions = raiserPos
    ? [["Fold","#7f1d1d"],["Call","#d97706"],["3-Bet","#2563eb"]]
    : [["Fold","#7f1d1d"],["Raise","#16a34a"],["Limp","#7c3aed"]];

  return (
    <div>
      <div style={{marginBottom:10}}>
        <div style={{fontSize:10,color:"#64748b",marginBottom:4,textTransform:"uppercase",letterSpacing:1}}>Position</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
          {POSITIONS.map(p=>(
            <button key={p} onClick={()=>{setPos(p);setHand(null);setFeedback(null);setRaiserPos(null);}} style={{
              padding:"4px 8px",borderRadius:5,border:"none",cursor:"pointer",fontSize:11,fontWeight:600,
              background:pos===p?"#16a34a":"#1e293b",color:pos===p?"#fff":"#94a3b8"
            }}>{p}</button>
          ))}
        </div>
      </div>
      <button onClick={deal} style={{width:"100%",background:"linear-gradient(135deg,#16a34a,#15803d)",color:"#fff",border:"none",borderRadius:8,padding:"10px 0",fontSize:13,fontWeight:700,cursor:"pointer",marginBottom:10}}>Deal Hand</button>
      {hand && (
        <div>
          <div style={{background:"#1e293b",borderRadius:10,padding:12,marginBottom:10,textAlign:"center"}}>
            <div style={{fontSize:10,color:"#64748b",marginBottom:6}}>{raiserPos?`${raiserPos} raised — your action at ${pos}`:`Folded to you at ${pos}`}</div>
            <div style={{fontSize:26,marginBottom:4}}>{hand.map((c,i)=><Card key={i} card={c} size={26}/>)}</div>
            <div style={{fontSize:13,fontWeight:700,color:"#e2e8f0"}}>{handStr(hand)}</div>
          </div>
          {!choice && <div style={{display:"grid",gridTemplateColumns:`repeat(${actions.length},1fr)`,gap:6}}>{actions.map(([label,color])=><button key={label} onClick={()=>decide(label)} style={{background:color,color:"#fff",border:"none",borderRadius:8,padding:"10px 0",fontSize:12,fontWeight:700,cursor:"pointer"}}>{label}</button>)}</div>}
          {loading && <div style={{textAlign:"center",padding:12,color:"#64748b",fontSize:11}}>Analysing...</div>}
          {feedback && <div style={{background:"#1e293b",borderRadius:10,padding:12,marginTop:8,borderLeft:"3px solid #16a34a"}}>
            <div style={{fontSize:10,color:"#16a34a",fontWeight:700,marginBottom:5,textTransform:"uppercase",letterSpacing:1}}>Coach</div>
            <div style={{fontSize:12,color:"#e2e8f0",lineHeight:1.5}}>{feedback}</div>
            <button onClick={deal} style={{marginTop:8,background:"#16a34a",color:"#fff",border:"none",borderRadius:6,padding:"5px 14px",fontSize:11,fontWeight:700,cursor:"pointer"}}>Next →</button>
          </div>}
        </div>
      )}
    </div>
  );
}

// ─── Cbet Module ──────────────────────────────────────────────────────────────
function CbetModule({ apiKey }) {
  const [state, setState] = useState(null);
  const [choice, setChoice] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);

  const deal = () => {
    const heroPos = randFrom(["BTN","CO","HJ","SB","BB"]);
    const hand = randHand();
    const board = randBoard(3, hand);
    const pot = Math.floor(Math.random()*15)+5;
    setState({ heroPos, hand, board, pot, villainPos: randFrom(POSITIONS.filter(p=>p!==heroPos)), villainChecked: Math.random()>0.4 });
    setChoice(null); setFeedback(null);
  };

  const decide = async (action) => {
    setChoice(action);
    setLoading(true);
    const fb = await askClaude(`Cbet spot: ${state.heroPos} with ${handStr(state.hand)} (${state.hand.join(" ")}). Board: ${state.board.join(" ")}. Pot: ${state.pot}BB. Villain ${state.villainChecked?"checked":"in hand"}. Chose: ${action}. Evaluate sizing and board texture.`, apiKey);
    setFeedback(fb);
    setLoading(false);
  };

  return (
    <div>
      <button onClick={deal} style={{width:"100%",background:"linear-gradient(135deg,#2563eb,#1d4ed8)",color:"#fff",border:"none",borderRadius:8,padding:"10px 0",fontSize:13,fontWeight:700,cursor:"pointer",marginBottom:10}}>Generate Spot</button>
      {state && (
        <div>
          <div style={{background:"#1e293b",borderRadius:10,padding:12,marginBottom:10}}>
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
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:10,color:"#64748b",marginBottom:4}}>Flop</div>
              <div>{state.board.map((c,i)=><Card key={i} card={c} size={22}/>)}</div>
              <div style={{fontSize:11,color:"#64748b",marginTop:6}}>Villain ({state.villainPos}) {state.villainChecked?"checked":"in hand"}</div>
            </div>
          </div>
          {!choice && <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:5}}>
            {["Check","1/3 Pot","1/2 Pot","2/3 Pot","Pot","All-in"].map(s=>(
              <button key={s} onClick={()=>decide(s)} style={{background:s==="Check"?"#1e293b":s==="All-in"?"#7f1d1d":"#16a34a",color:s==="Check"?"#94a3b8":"#fff",border:"1px solid #334155",borderRadius:7,padding:"8px 4px",fontSize:11,fontWeight:700,cursor:"pointer"}}>{s}</button>
            ))}
          </div>}
          {loading && <div style={{textAlign:"center",padding:12,color:"#64748b",fontSize:11}}>Analysing...</div>}
          {feedback && <div style={{background:"#1e293b",borderRadius:10,padding:12,marginTop:8,borderLeft:"3px solid #2563eb"}}>
            <div style={{fontSize:10,color:"#2563eb",fontWeight:700,marginBottom:5,textTransform:"uppercase",letterSpacing:1}}>Coach</div>
            <div style={{fontSize:12,color:"#e2e8f0",lineHeight:1.5}}>{feedback}</div>
            <button onClick={deal} style={{marginTop:8,background:"#2563eb",color:"#fff",border:"none",borderRadius:6,padding:"5px 14px",fontSize:11,fontWeight:700,cursor:"pointer"}}>Next →</button>
          </div>}
        </div>
      )}
    </div>
  );
}

// ─── Range Read Module ────────────────────────────────────────────────────────
function RangeModule({ apiKey }) {
  const [state, setState] = useState(null);
  const [guess, setGuess] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);

  const deal = () => {
    setState({
      pos: randFrom(POSITIONS),
      action: randFrom(["raises preflop then cbets flop","3bets preflop","limps then raises flop","raises, checks flop, bets turn","open shoves 10BB","min-raises twice","calls 3bet then check-raises flop"]),
      board: randBoard(3),
      stack: randFrom(["8BB","15BB","25BB","40BB","80BB"]),
    });
    setGuess(""); setSubmitted(false); setFeedback(null);
  };

  const submit = async () => {
    setSubmitted(true); setLoading(true);
    const fb = await askClaude(`Range read: ${state.pos} (${state.stack}) ${state.action}. Board: ${state.board.join(" ")}. Student read: "${guess}". Evaluate accuracy, give correct range, explain why hands are in/out, how to exploit.`, apiKey);
    setFeedback(fb); setLoading(false);
  };

  return (
    <div>
      <button onClick={deal} style={{width:"100%",background:"linear-gradient(135deg,#7c3aed,#6d28d9)",color:"#fff",border:"none",borderRadius:8,padding:"10px 0",fontSize:13,fontWeight:700,cursor:"pointer",marginBottom:10}}>Generate Spot</button>
      {state && (
        <div>
          <div style={{background:"#1e293b",borderRadius:10,padding:12,marginBottom:10}}>
            <div style={{fontSize:10,color:"#7c3aed",textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Read This Player</div>
            <div style={{fontSize:13,color:"#e2e8f0",marginBottom:8,lineHeight:1.6}}>
              <span style={{color:"#a78bfa",fontWeight:700}}>{state.pos}</span> ({state.stack}) <span style={{color:"#94a3b8"}}>{state.action}</span>
            </div>
            <div style={{fontSize:11,color:"#64748b",marginBottom:4}}>Board:</div>
            <div>{state.board.map((c,i)=><Card key={i} card={c} size={22}/>)}</div>
          </div>
          {!submitted && <>
            <textarea value={guess} onChange={e=>setGuess(e.target.value)}
              placeholder="e.g. AK, QQ+, maybe AQs bluff... excludes small pairs..."
              style={{width:"100%",background:"#1e293b",border:"1px solid #334155",borderRadius:8,padding:10,color:"#e2e8f0",fontSize:12,minHeight:70,resize:"vertical",boxSizing:"border-box",outline:"none",lineHeight:1.5}}/>
            <button onClick={submit} disabled={!guess.trim()} style={{width:"100%",marginTop:6,background:guess.trim()?"#7c3aed":"#334155",color:"#fff",border:"none",borderRadius:8,padding:"9px 0",fontSize:12,fontWeight:700,cursor:guess.trim()?"pointer":"not-allowed"}}>Submit Read</button>
          </>}
          {loading && <div style={{textAlign:"center",padding:12,color:"#64748b",fontSize:11}}>Evaluating...</div>}
          {feedback && <div style={{background:"#1e293b",borderRadius:10,padding:12,marginTop:8,borderLeft:"3px solid #7c3aed"}}>
            <div style={{fontSize:10,color:"#7c3aed",fontWeight:700,marginBottom:5,textTransform:"uppercase",letterSpacing:1}}>Coach</div>
            <div style={{fontSize:12,color:"#e2e8f0",lineHeight:1.5}}>{feedback}</div>
            <button onClick={deal} style={{marginTop:8,background:"#7c3aed",color:"#fff",border:"none",borderRadius:6,padding:"5px 14px",fontSize:11,fontWeight:700,cursor:"pointer"}}>Next →</button>
          </div>}
        </div>
      )}
    </div>
  );
}

// ─── Call/Fold Module ─────────────────────────────────────────────────────────
function CallFoldModule({ apiKey }) {
  const [state, setState] = useState(null);
  const [choice, setChoice] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);

  const deal = () => {
    const hand = randHand();
    const nCards = randFrom([3,4,5]);
    const board = randBoard(nCards, hand);
    const pot = Math.floor(Math.random()*30)+8;
    const bet = Math.floor(pot*(Math.random()*0.8+0.2));
    const stack = Math.floor(Math.random()*40)+5;
    const needed = Math.round(bet/(pot+bet*2)*100);
    setState({ hand, board, pot, bet, stack, needed, villainPos: randFrom(POSITIONS), street: nCards===3?"Flop":nCards===4?"Turn":"River" });
    setChoice(null); setFeedback(null);
  };

  const decide = async (action) => {
    setChoice(action);
    setLoading(true);
    const fb = await askClaude(`Call/Fold on ${state.street}: ${handStr(state.hand)} (${state.hand.join(" ")}). Board: ${state.board.join(" ")}. Pot: ${state.pot}BB. Villain bets ${state.bet}BB. Stack behind: ${state.stack}BB. Pot odds needed: ${state.needed}%. Chose: ${action}. Was this correct?`, apiKey);
    setFeedback(fb);
    setLoading(false);
  };

  return (
    <div>
      <button onClick={deal} style={{width:"100%",background:"linear-gradient(135deg,#d97706,#b45309)",color:"#fff",border:"none",borderRadius:8,padding:"10px 0",fontSize:13,fontWeight:700,cursor:"pointer",marginBottom:10}}>Generate Decision</button>
      {state && (
        <div>
          <div style={{background:"#1e293b",borderRadius:10,padding:12,marginBottom:10}}>
            <div style={{fontSize:10,color:"#d97706",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>{state.street}</div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
              <div>
                <div style={{fontSize:10,color:"#64748b",marginBottom:3}}>Hand</div>
                <div>{state.hand.map((c,i)=><Card key={i} card={c}/>)}</div>
                <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>{handStr(state.hand)}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:10,color:"#64748b",marginBottom:3}}>Stack Behind</div>
                <div style={{fontSize:16,fontWeight:700,color:"#e2e8f0"}}>{state.stack}BB</div>
              </div>
            </div>
            <div style={{textAlign:"center",marginBottom:8}}>
              <div>{state.board.map((c,i)=><Card key={i} card={c} size={22}/>)}</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5}}>
              {[{l:"Pot",v:`${state.pot}BB`},{l:`${state.villainPos} Bets`,v:`${state.bet}BB`},{l:"Need",v:`${state.needed}%`}].map(({l,v})=>(
                <div key={l} style={{background:"#0f172a",borderRadius:6,padding:6,textAlign:"center"}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#fbbf24"}}>{v}</div>
                  <div style={{fontSize:9,color:"#64748b"}}>{l}</div>
                </div>
              ))}
            </div>
          </div>
          {!choice && <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
            {[["Fold","#7f1d1d"],["Call","#d97706"],["Raise","#16a34a"]].map(([label,color])=>(
              <button key={label} onClick={()=>decide(label)} style={{background:color,color:"#fff",border:"none",borderRadius:8,padding:"10px 0",fontSize:12,fontWeight:700,cursor:"pointer"}}>{label}</button>
            ))}
          </div>}
          {loading && <div style={{textAlign:"center",padding:12,color:"#64748b",fontSize:11}}>Calculating...</div>}
          {feedback && <div style={{background:"#1e293b",borderRadius:10,padding:12,marginTop:8,borderLeft:"3px solid #d97706"}}>
            <div style={{fontSize:10,color:"#d97706",fontWeight:700,marginBottom:5,textTransform:"uppercase",letterSpacing:1}}>Coach</div>
            <div style={{fontSize:12,color:"#e2e8f0",lineHeight:1.5}}>{feedback}</div>
            <button onClick={deal} style={{marginTop:8,background:"#d97706",color:"#fff",border:"none",borderRadius:6,padding:"5px 14px",fontSize:11,fontWeight:700,cursor:"pointer"}}>Next →</button>
          </div>}
        </div>
      )}
    </div>
  );
}

// ─── Bluff Module ─────────────────────────────────────────────────────────────
function BluffModule({ apiKey }) {
  const [state, setState] = useState(null);
  const [choice, setChoice] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);

  const deal = () => {
    const heroPos = randFrom(["BTN","CO","SB","BB"]);
    const hand = randHand();
    const nCards = randFrom([3,4,5]);
    setState({
      heroPos, hand,
      board: randBoard(nCards, hand),
      pot: Math.floor(Math.random()*25)+8,
      stack: Math.floor(Math.random()*35)+10,
      villainPos: randFrom(POSITIONS.filter(p=>p!==heroPos)),
      villainAction: randFrom(["checked","bet small then checked turn","checked twice","showed weakness all streets"]),
    });
    setChoice(null); setFeedback(null);
  };

  const decide = async (action) => {
    setChoice(action);
    setLoading(true);
    const fb = await askClaude(`Bluff spot: ${state.heroPos} with ${handStr(state.hand)} (${state.hand.join(" ")}). Board: ${state.board.join(" ")}. Pot: ${state.pot}BB, stack: ${state.stack}BB. Villain (${state.villainPos}) ${state.villainAction}. Chose: ${action}. Good bluff spot? Range perception? Correct sizing?`, apiKey);
    setFeedback(fb);
    setLoading(false);
  };

  return (
    <div>
      <button onClick={deal} style={{width:"100%",background:"linear-gradient(135deg,#dc2626,#b91c1c)",color:"#fff",border:"none",borderRadius:8,padding:"10px 0",fontSize:13,fontWeight:700,cursor:"pointer",marginBottom:10}}>Generate Bluff Spot</button>
      {state && (
        <div>
          <div style={{background:"#1e293b",borderRadius:10,padding:12,marginBottom:10}}>
            <div style={{fontSize:10,color:"#dc2626",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Bluff Opportunity?</div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
              <div>
                <div style={{fontSize:10,color:"#64748b",marginBottom:3}}>Hand at {state.heroPos}</div>
                <div>{state.hand.map((c,i)=><Card key={i} card={c}/>)}</div>
                <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>{handStr(state.hand)}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:10,color:"#64748b",marginBottom:3}}>Pot / Stack</div>
                <div style={{fontSize:14,fontWeight:700,color:"#e2e8f0"}}>{state.pot}BB / {state.stack}BB</div>
              </div>
            </div>
            <div style={{textAlign:"center",marginBottom:8}}>
              <div>{state.board.map((c,i)=><Card key={i} card={c} size={22}/>)}</div>
            </div>
            <div style={{background:"#0f172a",borderRadius:6,padding:8,fontSize:11,color:"#94a3b8",textAlign:"center"}}>
              Villain ({state.villainPos}) <span style={{color:"#fbbf24",fontWeight:600}}>{state.villainAction}</span>
            </div>
          </div>
          {!choice && <div style={{display:"flex",flexDirection:"column",gap:5}}>
            {["Check/Give Up","Small (1/3)","Half Pot","Pot Bet","Jam"].map(a=>(
              <button key={a} onClick={()=>decide(a)} style={{background:a==="Check/Give Up"?"#1e293b":"#dc2626",color:a==="Check/Give Up"?"#94a3b8":"#fff",border:"1px solid #334155",borderRadius:7,padding:"8px 0",fontSize:12,fontWeight:700,cursor:"pointer"}}>{a}</button>
            ))}
          </div>}
          {loading && <div style={{textAlign:"center",padding:12,color:"#64748b",fontSize:11}}>Evaluating...</div>}
          {feedback && <div style={{background:"#1e293b",borderRadius:10,padding:12,marginTop:8,borderLeft:"3px solid #dc2626"}}>
            <div style={{fontSize:10,color:"#dc2626",fontWeight:700,marginBottom:5,textTransform:"uppercase",letterSpacing:1}}>Coach</div>
            <div style={{fontSize:12,color:"#e2e8f0",lineHeight:1.5}}>{feedback}</div>
            <button onClick={deal} style={{marginTop:8,background:"#dc2626",color:"#fff",border:"none",borderRadius:6,padding:"5px 14px",fontSize:11,fontWeight:700,cursor:"pointer"}}>Next →</button>
          </div>}
        </div>
      )}
    </div>
  );
}

// ─── Full Hand Module ─────────────────────────────────────────────────────────
function ScenarioModule({ apiKey }) {
  const [hand, setHand] = useState(null);
  const [board, setBoard] = useState([]);
  const [street, setStreet] = useState("preflop");
  const [pot, setPot] = useState(1.5);
  const [heroPos, setHeroPos] = useState("");
  const [villainPos, setVillainPos] = useState("");
  const [heroStack, setHeroStack] = useState(0);
  const [history, setHistory] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const startHand = () => {
    const hp = randFrom(POSITIONS);
    const vp = randFrom(POSITIONS.filter(p=>p!==hp));
    const stack = Math.floor(Math.random()*60)+15;
    setHand(randHand()); setHeroPos(hp); setVillainPos(vp);
    setHeroStack(stack); setPot(1.5); setBoard([]);
    setStreet("preflop"); setHistory([]); setFeedback(null); setDone(false);
  };

  const makeChoice = async (action) => {
    setLoading(true);
    const newHistory = [...history, { street, action }];
    setHistory(newHistory);
    let nextStreet = street, newBoard = [...board], newPot = pot;
    if(street==="preflop") { nextStreet="flop"; newBoard=randBoard(3,hand); newPot=action.includes("Raise")||action.includes("3")?pot*3:action==="Call"?pot*2:pot; }
    else if(street==="flop") { nextStreet="turn"; newBoard=[...board,...randBoard(1,[...hand,...board])]; newPot=action.includes("Bet")||action.includes("Raise")?pot*1.8:pot; }
    else if(street==="turn") { nextStreet="river"; newBoard=[...board,...randBoard(1,[...hand,...board])]; newPot=action.includes("Bet")||action.includes("Raise")?pot*1.8:pot; }
    else { nextStreet="done"; setDone(true); }
    setBoard(newBoard); setStreet(nextStreet); setPot(Math.round(newPot*10)/10);
    const histStr = newHistory.map(h=>`${h.street}:${h.action}`).join(", ");
    const fb = await askClaude(`Full hand feedback. Hero: ${heroPos}, ${hand?handStr(hand):""} (${hand?.join(" ")}), ${heroStack}BB. Villain: ${villainPos}. History: ${histStr}. Board: ${newBoard.join(" ")}. Pot: ${newPot.toFixed(1)}BB. Evaluate the ${street} action "${action}" and give one key tip for ${nextStreet}.`, apiKey);
    setFeedback(fb); setLoading(false);
  };

  const streets = ["preflop","flop","turn","river","done"];
  const getActions = () => {
    if(street==="preflop") return ["Fold","Call","Raise 2.5BB","3-Bet","Jam"];
    if(street==="done") return [];
    return ["Check","Fold","Bet 1/3","Bet 1/2","Bet 2/3","Jam"];
  };

  return (
    <div>
      <button onClick={startHand} style={{width:"100%",background:"linear-gradient(135deg,#0891b2,#0e7490)",color:"#fff",border:"none",borderRadius:8,padding:"10px 0",fontSize:13,fontWeight:700,cursor:"pointer",marginBottom:10}}>{hand?"New Hand":"Deal Hand"}</button>
      {hand && (
        <div>
          <div style={{background:"#1e293b",borderRadius:10,padding:12,marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
              <div>
                <div style={{fontSize:10,color:"#64748b",marginBottom:3}}>{heroPos} vs {villainPos}</div>
                <div>{hand.map((c,i)=><Card key={i} card={c}/>)}</div>
                <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>{handStr(hand)}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:10,color:"#64748b",marginBottom:3}}>Stack / Pot</div>
                <div style={{fontSize:14,fontWeight:700,color:"#16a34a"}}>{heroStack}BB</div>
                <div style={{fontSize:12,color:"#fbbf24"}}>{pot}BB</div>
              </div>
            </div>
            {board.length>0 && <div style={{textAlign:"center",marginBottom:8}}><div>{board.map((c,i)=><Card key={i} card={c} size={22}/>)}</div></div>}
            <div style={{display:"flex",justifyContent:"center",gap:5}}>
              {streets.slice(0,-1).map(s=>(
                <div key={s} style={{width:7,height:7,borderRadius:"50%",background:street===s?"#16a34a":streets.indexOf(s)<streets.indexOf(street)?"#334155":"#1e293b",border:`1px solid ${street===s?"#16a34a":"#334155"}`}}/>
              ))}
            </div>
          </div>
          {history.length>0 && (
            <div style={{background:"#0f172a",borderRadius:8,padding:8,marginBottom:8}}>
              {history.map((h,i)=>(
                <div key={i} style={{fontSize:11,color:"#94a3b8",marginBottom:2}}>
                  <span style={{color:"#64748b"}}>{h.street}:</span> <span style={{color:"#e2e8f0",fontWeight:600}}>{h.action}</span>
                </div>
              ))}
            </div>
          )}
          {feedback && <div style={{background:"#1e293b",borderRadius:10,padding:12,marginBottom:8,borderLeft:"3px solid #0891b2"}}>
            <div style={{fontSize:10,color:"#0891b2",fontWeight:700,marginBottom:5,textTransform:"uppercase",letterSpacing:1}}>Coach</div>
            <div style={{fontSize:12,color:"#e2e8f0",lineHeight:1.5}}>{feedback}</div>
          </div>}
          {loading && <div style={{textAlign:"center",padding:12,color:"#64748b",fontSize:11}}>Analysing...</div>}
          {!done && !loading && (
            <div>
              <div style={{fontSize:10,color:"#64748b",marginBottom:5,textTransform:"uppercase",letterSpacing:1}}>{street.charAt(0).toUpperCase()+street.slice(1)} Action</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:5}}>
                {getActions().map(a=>(
                  <button key={a} onClick={()=>makeChoice(a)} style={{background:a==="Fold"?"#7f1d1d":a==="Check"?"#1e293b":a.includes("Jam")?"#7c3aed":"#16a34a",color:a==="Check"?"#94a3b8":"#fff",border:"1px solid #334155",borderRadius:7,padding:"8px 4px",fontSize:11,fontWeight:700,cursor:"pointer"}}>{a}</button>
                ))}
              </div>
            </div>
          )}
          {done && <button onClick={startHand} style={{width:"100%",marginTop:8,background:"#0891b2",color:"#fff",border:"none",borderRadius:8,padding:"10px 0",fontSize:13,fontWeight:700,cursor:"pointer"}}>New Hand →</button>}
        </div>
      )}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function PokerTrainer() {
  const [activeModule, setActiveModule] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState("");

  if(showSettings) return <Settings apiKey={apiKey} setApiKey={setApiKey} onClose={()=>setShowSettings(false)}/>;

  return (
    <div style={{background:"#0f172a",minHeight:"100vh",color:"#e2e8f0",fontFamily:"'Inter','Helvetica Neue',sans-serif",padding:16,maxWidth:480,margin:"0 auto"}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
            <div style={{background:"linear-gradient(135deg,#16a34a,#15803d)",borderRadius:5,padding:"3px 8px",fontSize:9,fontWeight:700,letterSpacing:2,color:"#fff",textTransform:"uppercase"}}>kingygpsy</div>
            <div style={{fontSize:15,fontWeight:700,color:"#f8fafc"}}>Poker Trainer</div>
          </div>
          <div style={{fontSize:10,color:"#475569"}}>AI-powered drills tailored to your leaks</div>
        </div>
        <button onClick={()=>setShowSettings(true)} style={{background:"#1e293b",border:`1px solid ${apiKey?"#16a34a":"#ef4444"}`,color:apiKey?"#16a34a":"#ef4444",borderRadius:7,padding:"6px 10px",fontSize:11,cursor:"pointer",fontWeight:600}}>
          {apiKey?"✓ API":"⚙️ Setup"}
        </button>
      </div>

      {/* API warning */}
      {!apiKey && (
        <div style={{background:"#7f1d1d",borderRadius:8,padding:10,marginBottom:12,fontSize:11,color:"#fca5a5",lineHeight:1.5}}>
          ⚠️ No API key set — tap <strong>Setup</strong> to add your Anthropic API key. Without it, feedback won't work.
        </div>
      )}

      {!activeModule ? (
        <div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
            {MODULES.map(m=>(
              <button key={m.id} onClick={()=>setActiveModule(m.id)} style={{background:"#1e293b",border:"1px solid #334155",borderRadius:10,padding:14,textAlign:"left",cursor:"pointer"}}
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
      ) : (
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
            <button onClick={()=>setActiveModule(null)} style={{background:"#1e293b",border:"1px solid #334155",color:"#94a3b8",borderRadius:6,padding:"5px 10px",fontSize:11,cursor:"pointer"}}>← Back</button>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:"#f8fafc"}}>{MODULES.find(m=>m.id===activeModule)?.icon} {MODULES.find(m=>m.id===activeModule)?.label}</div>
              <div style={{fontSize:10,color:"#64748b"}}>{MODULES.find(m=>m.id===activeModule)?.desc}</div>
            </div>
          </div>
          {activeModule==="preflop" && <PreflopModule apiKey={apiKey}/>}
          {activeModule==="cbet" && <CbetModule apiKey={apiKey}/>}
          {activeModule==="range" && <RangeModule apiKey={apiKey}/>}
          {activeModule==="callfold" && <CallFoldModule apiKey={apiKey}/>}
          {activeModule==="bluff" && <BluffModule apiKey={apiKey}/>}
          {activeModule==="scenario" && <ScenarioModule apiKey={apiKey}/>}
        </div>
      )}
    </div>
  );
}
