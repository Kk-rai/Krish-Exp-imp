import { useState, useRef, useEffect } from "react";
import { sendToKrishiAI, QUICK_REPLIES } from "../services/claude";

const QUICK_CHIPS = ["Documents needed?", "Current garlic price?", "How does CETA help me?"];

const WheatIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="1.8">
    <path d="M12 22V12M12 12C12 12 8 10 6 6M12 12C12 12 16 10 18 6" strokeLinecap="round"/>
    <path d="M12 12C12 12 9 8 9 4M12 12C12 12 15 8 15 4" strokeLinecap="round"/>
    <path d="M12 12C12 12 10 9 7 9M12 12C12 12 14 9 17 9" strokeLinecap="round"/>
    <circle cx="12" cy="3.5" r="1.5" fill="currentColor" stroke="none"/>
    <circle cx="9" cy="3.5" r="1.2" fill="currentColor" stroke="none" opacity="0.7"/>
    <circle cx="15" cy="3.5" r="1.2" fill="currentColor" stroke="none" opacity="0.7"/>
    <circle cx="6.5" cy="5.5" r="1.2" fill="currentColor" stroke="none" opacity="0.6"/>
    <circle cx="17.5" cy="5.5" r="1.2" fill="currentColor" stroke="none" opacity="0.6"/>
  </svg>
);

const TypingDots = () => (
  <div className="flex items-center gap-1 px-4 py-3">
    {[0,1,2].map(i => (
      <span key={i} className="w-2 h-2 rounded-full bg-green-500 inline-block"
        style={{ animation: "bounce 1.2s infinite", animationDelay: `${i*0.2}s` }}/>
    ))}
  </div>
);

export default function KrishiAI() {
  const [isOpen, setIsOpen]     = useState(false);
  const [lang, setLang]         = useState("EN");
  const [messages, setMessages] = useState([{
    role: "assistant",
    content: "Namaste! 🌾 I'm KrishiAI, your India-UK trade assistant. Ask me about export documents, CETA benefits, UK buyer connections, or current market prices. How can I help you today?",
  }]);
  const [input, setInput]   = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError]   = useState(null);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);
  useEffect(() => { if (isOpen) setTimeout(() => inputRef.current?.focus(), 100); }, [isOpen]);

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText) return;
    setInput("");
    setError(null);

    // Use quick reply cache if available
    if (QUICK_REPLIES[userText]) {
      const newMsgs = [...messages, { role: "user", content: userText }];
      setMessages(newMsgs);
      setIsTyping(true);
      await new Promise(r => setTimeout(r, 600));
      setMessages(prev => [...prev, { role: "assistant", content: QUICK_REPLIES[userText] }]);
      setIsTyping(false);
      return;
    }

    const newMessages = [...messages, { role: "user", content: userText }].slice(-10);
    setMessages(newMessages);
    setIsTyping(true);

    try {
      const aiText = await sendToKrishiAI(newMessages);
      setMessages(prev => [...prev, { role: "assistant", content: aiText }]);
    } catch {
      setError("Sorry, I'm having trouble connecting. Please try again.");
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <>
      <style>{`
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-7px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px) scale(.97)} to{opacity:1;transform:none} }
        @keyframes popIn  { from{opacity:0;transform:scale(.7)} to{opacity:1;transform:scale(1)} }
        .k-panel{animation:fadeUp .28s cubic-bezier(.22,.68,0,1.2) both}
        .k-fab{animation:popIn .4s cubic-bezier(.22,.68,0,1.2) both}
        .k-msg{animation:fadeUp .2s ease both}
        .k-chip:hover{transform:translateY(-1px);box-shadow:0 4px 14px rgba(74,124,89,.18)}
        .k-chip,.k-send{transition:all .15s}
        .k-send:hover{transform:scale(1.08)}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:#c6dbc9;border-radius:99px}
      `}</style>

      {/* FAB */}
      {!isOpen && (
        <button className="k-fab fixed bottom-6 right-6 z-50 flex flex-col items-center gap-1" onClick={() => setIsOpen(true)}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-white"
            style={{ background: "linear-gradient(135deg,#2d7a3a 0%,#4a9c5a 60%,#f5a623 100%)", boxShadow: "0 8px 32px rgba(45,122,58,.4)" }}>
            <WheatIcon />
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full text-white shadow-md"
            style={{ background: "linear-gradient(90deg,#2d7a3a,#4a9c5a)", fontFamily: "'DM Sans',sans-serif", letterSpacing: ".03em" }}>
            Ask KrishiAI
          </span>
        </button>
      )}

      {/* Panel */}
      {isOpen && (
        <div className="k-panel fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl overflow-hidden"
          style={{ width:350, height:520, boxShadow:"0 24px 64px rgba(0,0,0,.22)", background:"#f7fbf8", fontFamily:"'DM Sans',sans-serif", border:"1.5px solid #d1e8d5" }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
            style={{ background:"linear-gradient(135deg,#1e5c2a 0%,#2d7a3a 60%,#3a8a4a 100%)" }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0"
                style={{ background:"rgba(255,255,255,.15)" }}>
                <WheatIcon />
              </div>
              <div>
                <div className="text-white font-semibold text-sm">KrishiAI 🌾</div>
                <div className="text-green-200 text-xs">India-UK Trade Assistant</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-full overflow-hidden text-xs font-semibold"
                style={{ border:"1px solid rgba(255,255,255,.3)" }}>
                {["EN","HI"].map(l => (
                  <button key={l} onClick={() => setLang(l)} className="px-3 py-1 transition-all"
                    style={{ background:lang===l?"rgba(255,255,255,.9)":"transparent", color:lang===l?"#1e5c2a":"rgba(255,255,255,.8)" }}>
                    {l}
                  </button>
                ))}
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white ml-1 text-lg leading-none">✕</button>
            </div>
          </div>

          {/* CETA banner */}
          <div className="flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium flex-shrink-0"
            style={{ background:"linear-gradient(90deg,#fff8e7,#fffbf0)", borderBottom:"1px solid #f0dfa0", color:"#b07a00" }}>
            🇮🇳 India-UK CETA 2025 · Zero duty on 99% agri exports 🇬🇧
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2.5">
            {messages.map((msg, i) => (
              <div key={i} className={`k-msg flex ${msg.role==="user"?"justify-end":"justify-start"}`}>
                {msg.role==="assistant" && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center mr-1.5 flex-shrink-0 mt-1 text-white"
                    style={{ background:"linear-gradient(135deg,#2d7a3a,#4a9c5a)", fontSize:10 }}>🌾</div>
                )}
                <div className="max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-snug"
                  style={msg.role==="user"
                    ? { background:"linear-gradient(135deg,#e8650a,#f5821f)", color:"white", borderBottomRightRadius:4, boxShadow:"0 2px 8px rgba(232,101,10,.2)" }
                    : { background:"white", color:"#1a3a22", borderBottomLeftRadius:4, boxShadow:"0 2px 10px rgba(45,122,58,.08)", border:"1px solid #d8eedd" }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="w-6 h-6 rounded-full flex items-center justify-center mr-1.5 flex-shrink-0 mt-1 text-white"
                  style={{ background:"linear-gradient(135deg,#2d7a3a,#4a9c5a)", fontSize:10 }}>🌾</div>
                <div className="rounded-2xl" style={{ background:"white", border:"1px solid #d8eedd", boxShadow:"0 2px 10px rgba(45,122,58,.08)", borderBottomLeftRadius:4 }}>
                  <TypingDots />
                </div>
              </div>
            )}
            {error && (
              <div className="text-xs text-center rounded-xl px-3 py-2"
                style={{ background:"#fff0f0", color:"#c0392b", border:"1px solid #fcc" }}>{error}</div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Quick chips */}
          <div className="flex gap-1.5 px-3 pb-2 flex-shrink-0 flex-wrap">
            {QUICK_CHIPS.map(chip => (
              <button key={chip} className="k-chip text-xs px-2.5 py-1.5 rounded-full font-medium cursor-pointer"
                style={{ background:"white", color:"#2d7a3a", border:"1.5px solid #a8d5b0" }}
                onClick={() => sendMessage(chip)}>{chip}</button>
            ))}
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 px-3 pb-3 flex-shrink-0">
            <textarea ref={inputRef} rows={1}
              className="flex-1 rounded-xl px-3 py-2 text-sm resize-none outline-none"
              style={{ background:"white", border:"1.5px solid #c6dbc9", color:"#1a3a22", fontFamily:"'DM Sans',sans-serif", lineHeight:1.4, maxHeight:80, overflowY:"auto", transition:"border-color .2s" }}
              placeholder={lang==="HI"?"अपना सवाल यहाँ लिखें...":"Ask about exports, CETA, prices..."}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={e => e.target.style.borderColor="#2d7a3a"}
              onBlur={e => e.target.style.borderColor="#c6dbc9"}/>
            <button className="k-send w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background:input.trim()?"linear-gradient(135deg,#2d7a3a,#4a9c5a)":"#d1e8d5", color:input.trim()?"white":"#8ab898", boxShadow:input.trim()?"0 4px 14px rgba(45,122,58,.3)":"none", cursor:input.trim()?"pointer":"default" }}
              onClick={() => sendMessage()} disabled={!input.trim()||isTyping}>
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2" fill="currentColor" stroke="none"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
