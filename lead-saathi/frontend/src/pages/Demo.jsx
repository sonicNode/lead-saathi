import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';

// ─── Constants ────────────────────────────────────────────────────────────────
const API_BASE = 'http://localhost:5000/api';
const STEPS = ['need', 'budget', 'timeline', 'authority'];

const STEP_META = {
  need:      { icon: '💼', label: 'Requirement',   color: '#6366f1' },
  budget:    { icon: '💰', label: 'Budget',         color: '#f59e0b' },
  timeline:  { icon: '📅', label: 'Timeline',       color: '#10b981' },
  authority: { icon: '👤', label: 'Decision Maker', color: '#ec4899' },
  done:      { icon: '✅', label: 'Complete',        color: '#4ade80' },
};

const CATEGORY_META = {
  Hot:  { color: '#ef4444', glow: 'rgba(239,68,68,0.4)',  emoji: '🔥', bg: 'rgba(239,68,68,0.12)'  },
  Warm: { color: '#f59e0b', glow: 'rgba(245,158,11,0.4)', emoji: '✅', bg: 'rgba(245,158,11,0.12)' },
  Cold: { color: '#60a5fa', glow: 'rgba(96,165,250,0.4)', emoji: '🧊', bg: 'rgba(96,165,250,0.12)' },
};

function makeSessionId() {
  return 'sess_' + Math.random().toString(36).slice(2, 11) + '_' + Date.now();
}

// ─── Score Ring SVG ───────────────────────────────────────────────────────────
function ScoreRing({ score, category }) {
  const meta = CATEGORY_META[category] || CATEGORY_META.Cold;
  const r = 42, circ = 2 * Math.PI * r;
  const dash = ((score / 10) * circ).toFixed(2);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <svg width="108" height="108" viewBox="0 0 108 108">
        <circle cx="54" cy="54" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="9" />
        <circle
          cx="54" cy="54" r={r} fill="none"
          stroke={meta.color} strokeWidth="9"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 54 54)"
          style={{ transition: 'stroke-dasharray 1.2s ease', filter: `drop-shadow(0 0 10px ${meta.glow})` }}
        />
        <text x="54" y="49" textAnchor="middle" fill="white" fontSize="20" fontWeight="900" fontFamily="Inter,sans-serif">{score}</text>
        <text x="54" y="65" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="11" fontFamily="Inter,sans-serif">/10</text>
      </svg>
      <span style={{
        fontSize: 12, fontWeight: 800, letterSpacing: 2,
        color: meta.color, textShadow: `0 0 14px ${meta.glow}`,
        textTransform: 'uppercase',
      }}>
        {meta.emoji} {category} Lead
      </span>
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ stepIndex, totalSteps }) {
  const pct = Math.min(100, Math.round((stepIndex / totalSteps) * 100));
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
          {stepIndex < totalSteps ? `Step ${stepIndex + 1} of ${totalSteps}` : 'Completed'}
        </span>
        <span style={{ fontSize: 12, color: '#e6c9a8', fontWeight: 700 }}>{pct}%</span>
      </div>
      <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, borderRadius: 10,
          background: 'linear-gradient(90deg, #6366f1, #e6c9a8)',
          transition: 'width 0.6s ease',
          boxShadow: '0 0 12px rgba(230,201,168,0.4)',
        }} />
      </div>
      {/* Step dots */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
        {STEPS.map((s, i) => {
          const done = i < stepIndex;
          const active = i === stepIndex;
          const meta = STEP_META[s];
          return (
            <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: done ? meta.color : active ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)',
                border: `2px solid ${done || active ? meta.color : 'rgba(255,255,255,0.1)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, transition: 'all 0.4s ease',
                boxShadow: (done || active) ? `0 0 12px ${meta.color}55` : 'none',
              }}>
                {done ? '✓' : meta.icon}
              </div>
              <span style={{ fontSize: 10, color: done || active ? meta.color : 'rgba(255,255,255,0.25)', fontWeight: 600, textAlign: 'center' }}>
                {meta.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Collected Data Card ──────────────────────────────────────────────────────
function CollectedCard({ data }) {
  const items = [
    { key: 'need',      label: 'Requirement',   icon: '💼', step: STEP_META.need      },
    { key: 'budget',    label: 'Budget',         icon: '💰', step: STEP_META.budget    },
    { key: 'timeline',  label: 'Timeline',       icon: '📅', step: STEP_META.timeline  },
    { key: 'authority', label: 'Decision Maker', icon: '👤', step: STEP_META.authority },
  ];
  const anyFilled = items.some(i => data[i.key]);
  if (!anyFilled) return null;

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16, padding: '16px 18px',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, fontWeight: 700, margin: 0, textTransform: 'uppercase' }}>
        Collected Data
      </p>
      {items.map(({ key, label, icon, step }) => {
        const val = data[key];
        if (!val) return null;
        return (
          <div key={key} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8, flexShrink: 0,
              background: `${step.color}22`, border: `1px solid ${step.color}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
            }}>{icon}</div>
            <div>
              <p style={{ margin: 0, fontSize: 10, color: step.color, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>{label}</p>
              <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.4 }}>{val}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Chat Bubble ──────────────────────────────────────────────────────────────
function ChatBubble({ msg }) {
  if (msg.role === 'user') {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(99,102,241,0.1))',
          border: '1px solid rgba(99,102,241,0.35)',
          borderRadius: '18px 4px 18px 18px', padding: '11px 16px',
          maxWidth: '75%', color: 'white', fontSize: 14, lineHeight: 1.5,
        }}>{msg.text}</div>
      </div>
    );
  }

  if (msg.role === 'typing') {
    return (
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12 }}>
        <AgentAvatar />
        <div style={{
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '4px 18px 18px 18px', padding: '12px 16px',
        }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>{msg.stage || 'Thinking...'}</div>
          <div style={{ display: 'flex', gap: 5 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 7, height: 7, borderRadius: '50%', background: '#e6c9a8',
                animation: `lsBounce 1.2s ease-in-out ${i * 0.18}s infinite`,
              }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // agent message
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12 }}>
      <AgentAvatar />
      <div style={{
        background: msg.redirected
          ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${msg.redirected ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '4px 18px 18px 18px', padding: '12px 16px',
        maxWidth: '80%', color: msg.redirected ? '#fcd34d' : 'rgba(255,255,255,0.88)',
        fontSize: 14, lineHeight: 1.6,
      }}>
        {msg.redirected && (
          <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', display: 'block', marginBottom: 4, letterSpacing: 0.5 }}>
            ↩ REDIRECTING
          </span>
        )}
        {msg.text}
      </div>
    </div>
  );
}

function AgentAvatar() {
  return (
    <div style={{
      width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 15, boxShadow: '0 0 12px rgba(99,102,241,0.5)',
    }}>🤖</div>
  );
}

// ─── Final Result Panel ───────────────────────────────────────────────────────
function ResultPanel({ score, category, collectedData, onRestart }) {
  const meta = CATEGORY_META[category] || CATEGORY_META.Cold;
  return (
    <div style={{
      background: meta.bg, border: `1px solid ${meta.color}44`,
      borderRadius: 20, padding: '24px 22px', textAlign: 'center',
      boxShadow: `0 0 40px ${meta.glow}`,
      animation: 'lsFadeIn 0.6s ease',
    }}>
      <ScoreRing score={score} category={category} />
      <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '20px 0' }} />
      <CollectedCard data={collectedData} />
      <button
        onClick={onRestart}
        style={{
          marginTop: 20, width: '100%', padding: '12px',
          background: 'linear-gradient(135deg,#e6c9a8,#c9a87a)',
          border: 'none', borderRadius: 12, color: '#1a0a2e',
          fontSize: 14, fontWeight: 800, cursor: 'pointer',
          letterSpacing: 0.5,
        }}
      >
        🔄 Qualify Another Lead
      </button>
    </div>
  );
}

// ─── Voice input hook ─────────────────────────────────────────────────────────
// onAutoSend(transcript) is called immediately when speech ends — no button needed.
function useVoice(onAutoSend, onError) {
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);

  const toggle = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { onError('Speech recognition not supported. Please use Chrome.'); return; }

    // If already listening, stop manually
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }

    const rec = new SR();
    recRef.current = rec;
    rec.lang            = 'en-IN';
    rec.continuous      = false;
    rec.interimResults  = false;

    rec.onstart = () => setListening(true);
    rec.onend   = () => setListening(false);
    rec.onerror = (e) => {
      setListening(false);
      if (e.error !== 'no-speech') onError(`Voice error: ${e.error}. Try again.`);
    };

    // ── KEY: auto-send transcript immediately on result ──────────────────────
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript.trim();
      if (transcript) {
        setListening(false);
        onAutoSend(transcript); // fires handleSend(transcript) directly
      }
    };

    rec.start();
  }, [listening, onAutoSend, onError]);

  return { listening, toggle };
}

// ─── Main Demo Component ──────────────────────────────────────────────────────
const Demo = () => {
  const [sessionId,     setSessionId]     = useState(() => makeSessionId());
  const [messages,      setMessages]      = useState([]);
  const [input,         setInput]         = useState('');
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');
  const [stepIndex,     setStepIndex]     = useState(0);
  const [currentStep,   setCurrentStep]   = useState('need');
  const [collectedData, setCollectedData] = useState({ need: null, budget: null, timeline: null, authority: null });
  const [result,        setResult]        = useState(null); // { score, category }
  const [started,       setStarted]       = useState(false);
  // 'idle' | 'listening' | 'processing'
  const [voiceStatus,   setVoiceStatus]   = useState('idle');

  const bottomRef = useRef(null);
  const speakingRef = useRef(false); // prevent double-speak

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── speak() – select best available English voice ──────────────────────────
  const speak = useCallback((text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    speakingRef.current = true;

    const utt   = new SpeechSynthesisUtterance(text);
    utt.rate    = 1;
    utt.pitch   = 1;
    utt.volume  = 1;

    // Pick best natural voice (prefer en-IN, fallback to any English)
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang === 'en-IN')
      || voices.find(v => v.lang.startsWith('en') && v.localService)
      || voices.find(v => v.lang.startsWith('en'))
      || null;
    if (preferred) utt.voice = preferred;
    else utt.lang = 'en-IN';

    utt.onend = () => { speakingRef.current = false; };
    window.speechSynthesis.speak(utt);
  }, []);

  // Push a message into the chat list
  const pushMsg = useCallback((role, text, extras = {}) => {
    setMessages(prev => [...prev, { role, text, id: Date.now() + Math.random(), ...extras }]);
  }, []);

  // Show typing indicator with stage label
  const showTyping = useCallback((stage) => {
    setMessages(prev => {
      const filtered = prev.filter(m => m.role !== 'typing');
      return [...filtered, { role: 'typing', stage, id: 'typing' }];
    });
  }, []);

  const hideTyping = useCallback(() => {
    setMessages(prev => prev.filter(m => m.role !== 'typing'));
  }, []);

  // ── Call /api/chat ──────────────────────────────────────────────────────────
  const callChat = useCallback(async (userMessage, currentSessionId) => {
    showTyping('Analyzing response...');
    await new Promise(r => setTimeout(r, 500));
    showTyping('Applying BANT framework...');

    const { data } = await axios.post(`${API_BASE}/chat`, {
      sessionId: currentSessionId,
      userMessage,
    });

    hideTyping();
    return data;
  }, [showTyping, hideTyping]);

  // ── Start session ───────────────────────────────────────────────────────────
  const handleStart = useCallback(async () => {
    setStarted(true);
    setLoading(true);
    setError('');
    const sid = makeSessionId();
    setSessionId(sid);
    setMessages([]);
    setCollectedData({ need: null, budget: null, timeline: null, authority: null });
    setResult(null);
    setStepIndex(0);

    try {
      // Call with empty userMessage to get first question
      const { data } = await axios.post(`${API_BASE}/chat`, { sessionId: sid, userMessage: '' });
      setCurrentStep(data.currentStep);
      pushMsg('agent', data.message);
      speak(data.message);
    } catch (err) {
      setError('Cannot connect to backend on port 5000. Run: node server.js');
      setStarted(false);
    } finally {
      setLoading(false);
    }
  }, [pushMsg, speak]);

  // ── Send user message ───────────────────────────────────────────────────────
  const handleSend = useCallback(async (textOverride) => {
    const text = (textOverride ?? input).trim();
    if (!text || loading) return;

    setInput('');
    setLoading(true);
    setError('');
    pushMsg('user', text);

    try {
      const data = await callChat(text, sessionId);

      setCollectedData(data.collectedData || {});
      setStepIndex(data.stepIndex ?? stepIndex);

      if (data.done) {
        setCurrentStep('done');
        pushMsg('agent', data.message);
        speak(data.message);
        setResult({ score: data.score, category: data.category });
      } else {
        setCurrentStep(data.currentStep);
        pushMsg('agent', data.message, { redirected: data.redirected });
        speak(data.message);
      }
    } catch (err) {
      hideTyping();
      setError(err.response?.data?.error || 'Server error. Check that backend is running on port 5000.');
    } finally {
      setLoading(false);
    }
  }, [input, loading, sessionId, stepIndex, callChat, pushMsg, speak, hideTyping]);

  // ── Voice — auto-send on speech result ─────────────────────────────────────
  const handleVoiceResult = useCallback((transcript) => {
    setVoiceStatus('processing');
    setInput(transcript); // show transcript in box briefly
    handleSend(transcript); // auto-send immediately
  }, [handleSend]);

  const { listening, toggle: toggleMic } = useVoice(
    handleVoiceResult,
    (msg) => { setError(msg); setVoiceStatus('idle'); },
  );

  // Track listening state → update voiceStatus
  useEffect(() => {
    if (listening) setVoiceStatus('listening');
    else if (voiceStatus === 'listening') setVoiceStatus('idle');
  }, [listening]); // eslint-disable-line

  // Reset voiceStatus when loading ends
  useEffect(() => {
    if (!loading && voiceStatus === 'processing') setVoiceStatus('idle');
  }, [loading]); // eslint-disable-line

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // ── Restart ─────────────────────────────────────────────────────────────────
  const handleRestart = useCallback(() => {
    setStarted(false);
    setMessages([]);
    setResult(null);
    setStepIndex(0);
    setCurrentStep('need');
    setCollectedData({ need: null, budget: null, timeline: null, authority: null });
    setInput('');
    setError('');
  }, []);

  const stepMeta = STEP_META[currentStep] || STEP_META.need;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes lsBounce {
          0%,80%,100% { transform:translateY(0);opacity:0.4; }
          40%          { transform:translateY(-7px);opacity:1; }
        }
        @keyframes lsFadeIn {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes lsMicPulse {
          0%   { box-shadow:0 0 0 0 rgba(239,68,68,0.7); }
          70%  { box-shadow:0 0 0 22px rgba(239,68,68,0); }
          100% { box-shadow:0 0 0 0 rgba(239,68,68,0); }
        }
        @keyframes lsMicRing {
          0%   { transform:scale(1);   opacity:1; }
          100% { transform:scale(1.8); opacity:0; }
        }
        @keyframes lsGlow {
          0%,100% { opacity:0.6; } 50% { opacity:1; }
        }
        @keyframes lsSpin {
          from { transform:rotate(0deg); }
          to   { transform:rotate(360deg); }
        }
        @keyframes lsListenWave {
          0%,100% { transform:scaleY(0.4); }
          50%      { transform:scaleY(1.0); }
        }
        .ls-mic-pulse { animation: lsMicPulse 1.1s ease-out infinite; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at 20% 0%, #1e0a3c 0%, #0d0d1f 45%, #060610 100%)',
        fontFamily: "'Inter', sans-serif",
        display: 'flex',
        flexDirection: 'column',
        paddingTop: 70,
      }}>

        {/* ── Page Header ── */}
        <div style={{
          textAlign: 'center', padding: '28px 24px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: 100, padding: '5px 16px', marginBottom: 12,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', display: 'inline-block', boxShadow: '0 0 8px #4ade80', animation: 'lsGlow 2s ease infinite' }} />
            <span style={{ fontSize: 11, color: '#a5b4fc', letterSpacing: 1.2, fontWeight: 700 }}>GUIDED SALES AI — SDR MODE</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: 'white', margin: '0 0 4px' }}>
            Lead Saarthi <span style={{ color: '#e6c9a8', fontStyle: 'italic' }}>Qualifier</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: 0 }}>
            AI-guided BANT qualification · 4-step conversation · Smart scoring
          </p>
        </div>

        {/* ── Main Layout ── */}
        <div style={{
          flex: 1, display: 'flex', gap: 0,
          maxWidth: 1100, width: '100%', margin: '0 auto',
          padding: '20px 20px 0',
        }}>

          {/* ── Left Column: Chat ── */}
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            minHeight: 0, paddingRight: 20,
          }}>

            {/* Landing / Not started */}
            {!started ? (
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                textAlign: 'center', padding: '40px 20px',
                animation: 'lsFadeIn 0.5s ease',
              }}>
                <div style={{
                  fontSize: 64, marginBottom: 20,
                  filter: 'drop-shadow(0 0 30px rgba(99,102,241,0.6))',
                }}>🤖</div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: 'white', marginBottom: 10 }}>
                  Meet Your AI Sales Agent
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, maxWidth: 380, lineHeight: 1.7, marginBottom: 32 }}>
                  This AI will ask you 4 structured questions using the BANT framework, then instantly score your lead as Hot, Warm, or Cold.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 32 }}>
                  {[
                    { icon: '💼', label: 'Need' },
                    { icon: '💰', label: 'Budget' },
                    { icon: '📅', label: 'Timeline' },
                    { icon: '👤', label: 'Authority' },
                  ].map(({ icon, label }) => (
                    <div key={label} style={{
                      padding: '8px 16px', borderRadius: 20,
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600,
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <span>{icon}</span>{label}
                    </div>
                  ))}
                </div>
                <button
                  id="start-btn"
                  onClick={handleStart}
                  disabled={loading}
                  style={{
                    padding: '14px 40px',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    border: 'none', borderRadius: 50,
                    color: 'white', fontSize: 16, fontWeight: 800,
                    cursor: 'pointer', letterSpacing: 0.5,
                    boxShadow: '0 0 30px rgba(99,102,241,0.5)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  🚀 Start Qualification
                </button>
              </div>
            ) : (
              <>
                {/* Progress bar */}
                {!result && (
                  <div style={{
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 16, padding: '16px 18px', marginBottom: 16,
                    animation: 'lsFadeIn 0.4s ease',
                  }}>
                    <ProgressBar stepIndex={stepIndex} totalSteps={4} />
                  </div>
                )}

                {/* Current step label */}
                {!result && currentStep !== 'done' && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: `${stepMeta.color}18`,
                    border: `1px solid ${stepMeta.color}44`,
                    borderRadius: 12, padding: '10px 16px', marginBottom: 16,
                    animation: 'lsFadeIn 0.4s ease',
                  }}>
                    <span style={{ fontSize: 18 }}>{stepMeta.icon}</span>
                    <span style={{ color: stepMeta.color, fontSize: 13, fontWeight: 700, letterSpacing: 0.5 }}>
                      {stepMeta.label}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginLeft: 'auto' }}>
                      Step {stepIndex + 1} / 4
                    </span>
                  </div>
                )}

                {/* Chat messages */}
                <div style={{
                  flex: 1, overflowY: 'auto', paddingRight: 4,
                  display: 'flex', flexDirection: 'column',
                  marginBottom: 16,
                }}>
                  {messages.map((msg, i) => <ChatBubble key={msg.id ?? i} msg={msg} />)}
                  <div ref={bottomRef} />
                </div>

                {/* Error */}
                {error && (
                  <div style={{
                    background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)',
                    borderRadius: 10, padding: '10px 14px', marginBottom: 12,
                    color: '#fca5a5', fontSize: 13,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <span>⚠️ {error}</span>
                    <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: 18 }}>×</button>
                  </div>
                )}

                {/* ── Voice status banner ── */}
                {voiceStatus === 'listening' && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)',
                    borderRadius: 12, padding: '10px 16px', marginBottom: 12,
                    animation: 'lsFadeIn 0.3s ease',
                  }}>
                    {/* Sound-wave bars */}
                    <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                      {[0,1,2,3,4].map(i => (
                        <div key={i} style={{
                          width: 3, height: 20, borderRadius: 3,
                          background: '#ef4444',
                          animation: `lsListenWave 0.8s ease-in-out ${i * 0.12}s infinite`,
                          transformOrigin: 'bottom',
                        }} />
                      ))}
                    </div>
                    <span style={{ color: '#fca5a5', fontSize: 13, fontWeight: 700 }}>🎙️ Listening… speak now</span>
                    <button
                      onClick={toggleMic}
                      style={{ marginLeft: 'auto', background: 'none', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 8, color: '#fca5a5', fontSize: 12, padding: '4px 10px', cursor: 'pointer' }}
                    >Stop</button>
                  </div>
                )}

                {voiceStatus === 'processing' && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: 'rgba(99,102,241,0.10)', border: '1px solid rgba(99,102,241,0.3)',
                    borderRadius: 12, padding: '10px 16px', marginBottom: 12,
                    animation: 'lsFadeIn 0.3s ease',
                  }}>
                    <div style={{ width: 16, height: 16, border: '2px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'lsSpin 0.7s linear infinite' }} />
                    <span style={{ color: '#a5b4fc', fontSize: 13, fontWeight: 600 }}>Processing voice input…</span>
                  </div>
                )}

                {/* Input box — hide when done */}
                {!result && (
                  <div style={{
                    background: listening
                      ? 'rgba(239,68,68,0.06)'
                      : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${listening ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 16, padding: '10px 10px 10px 16px',
                    display: 'flex', gap: 8, alignItems: 'flex-end',
                    boxShadow: listening ? '0 0 20px rgba(239,68,68,0.2)' : '0 8px 32px rgba(0,0,0,0.3)',
                    marginBottom: 20,
                    transition: 'all 0.3s ease',
                  }}>
                    <textarea
                      id="lead-input"
                      rows={1}
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={handleKey}
                      placeholder={
                        voiceStatus === 'listening'   ? '🎙️ Listening…' :
                        voiceStatus === 'processing'  ? '⚙️ Processing…' :
                        loading                        ? '🤖 AI is thinking…' :
                        'Type your answer or click 🎤 to speak…'
                      }
                      disabled={loading || listening}
                      style={{
                        flex: 1, background: 'none', border: 'none', outline: 'none',
                        color: voiceStatus === 'listening' ? '#fca5a5' : 'white',
                        fontSize: 14, resize: 'none', lineHeight: 1.5,
                        fontFamily: 'inherit', maxHeight: 100, overflowY: 'hidden',
                        fontStyle: voiceStatus !== 'idle' ? 'italic' : 'normal',
                      }}
                      onInput={e => {
                        e.target.style.height = 'auto';
                        e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
                      }}
                    />

                    {/* ── Mic button with ripple ring ── */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      {listening && (
                        <div style={{
                          position: 'absolute', inset: -6,
                          borderRadius: '50%', border: '2px solid rgba(239,68,68,0.6)',
                          animation: 'lsMicRing 1.1s ease-out infinite',
                          pointerEvents: 'none',
                        }} />
                      )}
                      <button
                        id="mic-btn"
                        onClick={toggleMic}
                        disabled={loading && !listening}
                        className={listening ? 'ls-mic-pulse' : ''}
                        title={listening ? 'Stop listening' : 'Click to speak'}
                        style={{
                          width: 42, height: 42, borderRadius: '50%', border: 'none',
                          background: listening
                            ? 'linear-gradient(135deg,#ef4444,#dc2626)'
                            : 'rgba(255,255,255,0.1)',
                          color: 'white', fontSize: 18, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.2s',
                          boxShadow: listening ? '0 0 20px rgba(239,68,68,0.6)' : 'none',
                        }}
                      >
                        {listening ? '⏹' : '🎤'}
                      </button>
                    </div>

                    {/* ── Send button (fallback for typing) ── */}
                    <button
                      id="send-btn"
                      onClick={() => handleSend()}
                      disabled={!input.trim() || loading || listening}
                      title="Send"
                      style={{
                        width: 42, height: 42, borderRadius: '50%', border: 'none',
                        background: input.trim() && !loading && !listening
                          ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                          : 'rgba(255,255,255,0.06)',
                        color: 'white', fontSize: 16,
                        cursor: input.trim() && !loading && !listening ? 'pointer' : 'default',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, transition: 'all 0.2s',
                        boxShadow: input.trim() && !loading && !listening
                          ? '0 0 14px rgba(99,102,241,0.5)' : 'none',
                      }}
                    >➤</button>
                  </div>

                  /* Hint text */
                )}
                {!result && (
                  <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 11, marginBottom: 16 }}>
                    {listening
                      ? '🎙️ Speak clearly — message auto-sends when you stop'
                      : '🎤 Click mic to speak · Enter to send typed answer'}
                  </p>
                )}
              </>
            )}
          </div>

          {/* ── Right Sidebar ── */}
          <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 24 }}>

            {/* Result panel */}
            {result ? (
              <ResultPanel
                score={result.score}
                category={result.category}
                collectedData={collectedData}
                onRestart={handleRestart}
              />
            ) : started ? (
              <>
                {/* Collected data so far */}
                <CollectedCard data={collectedData} />

                {/* How it works card */}
                <div style={{
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 16, padding: '16px 18px',
                }}>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5, fontWeight: 700, margin: '0 0 12px', textTransform: 'uppercase' }}>How Scoring Works</p>
                  {[
                    { label: 'Need',      pts: '+3', color: '#6366f1' },
                    { label: 'Budget',    pts: '+3', color: '#f59e0b' },
                    { label: 'Timeline',  pts: '+2', color: '#10b981' },
                    { label: 'Authority', pts: '+2', color: '#ec4899' },
                  ].map(({ label, pts, color }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{label}</span>
                      <span style={{ fontSize: 13, color, fontWeight: 700 }}>{pts}</span>
                    </div>
                  ))}
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '10px 0' }} />
                  {[
                    { label: '≥8 → Hot',  color: '#ef4444' },
                    { label: '≥5 → Warm', color: '#f59e0b' },
                    { label: '<5 → Cold', color: '#60a5fa' },
                  ].map(({ label, color }) => (
                    <div key={label} style={{ fontSize: 12, color, fontWeight: 600, marginBottom: 4 }}>{label}</div>
                  ))}
                </div>
              </>
            ) : (
              /* Pre-start: show BANT info */
              <div style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 16, padding: '18px',
              }}>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5, fontWeight: 700, margin: '0 0 14px', textTransform: 'uppercase' }}>BANT Framework</p>
                {[
                  { icon: '💼', label: 'Budget',    desc: 'Financial capacity & allocation' },
                  { icon: '👤', label: 'Authority',  desc: 'Decision-making power' },
                  { icon: '🎯', label: 'Need',       desc: 'Real business requirement' },
                  { icon: '📅', label: 'Timeline',   desc: 'Urgency & implementation plan' },
                ].map(({ icon, label, desc }) => (
                  <div key={label} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 16 }}>{icon}</span>
                      <span style={{ color: '#e6c9a8', fontWeight: 700, fontSize: 13 }}>{label}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.4)', paddingLeft: 24 }}>{desc}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Demo;
