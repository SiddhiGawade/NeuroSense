import { useState, useRef } from 'react';

interface Props {
  onComplete: (score: number) => void;
}

export function ReactionTest({ onComplete }: Props) {
  const [phase, setPhase] = useState<'intro' | 'waiting' | 'ready' | 'result'>('intro');
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  
  const startTime = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startTest = () => {
    setPhase('waiting');
    const delay = Math.random() * 3000 + 1500; // 1.5s to 4.5s
    
    timeoutRef.current = setTimeout(() => {
      setPhase('ready');
      startTime.current = Date.now();
    }, delay);
  };

  const handleClick = () => {
    if (phase === 'waiting') {
      // Clicked too early
      clearTimeout(timeoutRef.current!);
      alert("Too early! Wait for the color to change.");
      setPhase('intro');
    } else if (phase === 'ready') {
      // Good click
      const timeTaken = Date.now() - startTime.current;
      setReactionTime(timeTaken);
      setPhase('result');
    }
  };

  const finish = () => {
    // Score based on reaction time (0 to 10 points)
    // < 300ms = 10, < 400ms = 8, < 500 = 6, < 600 = 4, else 2
    let score = 2;
    if (reactionTime! < 1000) score = 10;
    else if (reactionTime! < 1200) score = 8;
    else if (reactionTime! < 1400) score = 6;
    else if (reactionTime! < 1600) score = 4;
    
    onComplete(score);
  };

  if (phase === 'intro') {
    return (
      <div className="text-center animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
        <h2 style={{ color: '#0f172a', fontSize: '1.8rem', fontWeight: 800, marginBottom: '1rem' }}>Reaction Test</h2>
        <p style={{ color: '#475569', fontSize: '1.1rem', maxWidth: '600px', lineHeight: 1.6, marginBottom: '2rem' }}>When the red box turns <strong style={{ color: '#22c55e' }}>GREEN</strong>, click it as fast as you can.</p>
        <button onClick={startTest} style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
          padding: '0.9rem 2.5rem', borderRadius: '12px',
          background: 'linear-gradient(135deg,#3b82f6,#6366f1)',
          color: '#fff', border: 'none', fontWeight: '600',
          fontSize: '1.05rem', cursor: 'pointer',
          boxShadow: '0 6px 20px rgba(99,102,241,0.4)',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }} 
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(99,102,241,0.55)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.4)'; }}>
          Start
        </button>
      </div>
    );
  }

  if (phase === 'result') {
    return (
      <div className="text-center animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
        <h2 style={{ color: '#0f172a', fontSize: '2rem', fontWeight: 800, marginBottom: '2rem' }}>Your time: <span style={{ color: '#3b82f6' }}>{reactionTime} ms</span></h2>
        <button onClick={finish} style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
          padding: '0.9rem 2.5rem', borderRadius: '12px',
          background: 'linear-gradient(135deg,#3b82f6,#6366f1)',
          color: '#fff', border: 'none', fontWeight: '600',
          fontSize: '1.05rem', cursor: 'pointer',
          boxShadow: '0 6px 20px rgba(99,102,241,0.4)',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(99,102,241,0.55)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.4)'; }}>
          Continue
        </button>
      </div>
    );
  }

  return (
    <div className="text-center" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2 style={{ marginBottom: '2rem', color: '#0f172a', fontSize: '1.6rem', fontWeight: 800 }}>Wait for green...</h2>
      <div 
        onClick={handleClick}
        style={{
          width: '100%',
          maxWidth: '500px',
          height: '300px',
          background: phase === 'waiting' ? '#ef4444' : '#22c55e',
          borderRadius: '12px',
          cursor: 'pointer',
          transition: phase === 'waiting' ? 'none' : 'background 0.1s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 12px 24px rgba(59,130,246,0.2)',
          userSelect: 'none'
        }}
      >
        <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#ffffff' }}>
          {phase === 'waiting' ? "Wait..." : "CLICK!"}
        </span>
      </div>
    </div>
  );
}
