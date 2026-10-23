import { useEffect, useState } from 'react';
import { RefreshCw, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';

interface Props {
  data: {
    age: number;
    gender: number;
    education: number;
    ses: number;
    cognitive_score: number;
  };
  onRestart: () => void;
}

interface PredictionData {
  probability: number;
  risk: string;
}

export function ResultDashboard({ data, onRestart }: Props) {
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        const response = await fetch('http://localhost:8000/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch prediction');
        }

        const result = await response.json();
        setPrediction(result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPrediction();
  }, [data]);

  if (loading) {
    return (
      <div className="glass-panel text-center" style={{ maxWidth: '600px', margin: '0 auto', padding: '4rem 2rem' }}>
        <RefreshCw size={48} color="var(--primary)" className="animate-spin" style={{ animation: 'spin 2s linear infinite' }} />
        <h2 style={{ marginTop: '1.5rem' }}>Analyzing Results...</h2>
        <p>Our AI is evaluating your cognitive tests and demographic factors securely.</p>
        <style>{`
          @keyframes spin { 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel text-center" style={{ maxWidth: '600px', margin: '0 auto', padding: '4rem 2rem' }}>
        <AlertCircle size={48} color="var(--danger)" />
        <h2 style={{ marginTop: '1.5rem', color: 'var(--danger)' }}>Analysis Failed</h2>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={onRestart}>Try Again</button>
      </div>
    );
  }

  const isHighRisk = prediction?.risk === "High Risk";
  const isMediumRisk = prediction?.risk === "Medium Risk";
  
  let riskColor = 'var(--success)';
  let Icon = CheckCircle;
  let summaryText = "Your cognitive assessment looks great! Keep up the healthy habits.";
  
  if (isHighRisk) {
    riskColor = 'var(--danger)';
    Icon = AlertCircle;
    summaryText = "We recommend consulting a healthcare professional for a comprehensive evaluation.";
  } else if (isMediumRisk) {
    riskColor = 'var(--warning)';
    Icon = HelpCircle;
    summaryText = "Your results suggest monitoring your cognitive health and discussing it with a doctor during your next visit.";
  }

  return (
    <div className="glass-panel animate-slide-up text-center" style={{ maxWidth: '1200px', margin: '0 auto', background: '#f8fafc', color: '#1e293b', border: '1px solid #e2e8f0', padding: '3.5rem 3rem' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <Icon size={72} color={riskColor} style={{ marginBottom: '1.25rem' }} />
        <h2 style={{ fontSize: '3rem', color: riskColor, margin: 0, fontWeight: '800' }}>{prediction?.risk}</h2>
      </div>

      <div style={{ background: '#ffffff', borderRadius: '16px', padding: '2.5rem', marginBottom: '2.5rem', border: '1px solid #cbd5e1', boxShadow: '0 8px 32px rgba(15,23,42,0.05)' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.3rem', color: '#475569', fontWeight: 600 }}>AI Assessment Probability</h3>
        <div style={{ fontSize: '4.2rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1 }}>
          {(prediction!.probability * 100).toFixed(1)}%
        </div>
        <p style={{ marginTop: '1.5rem', fontSize: '1.15rem', color: '#475569', lineHeight: 1.6 }}>{summaryText}</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1.5rem', background: '#0f172a', color: '#ffffff', padding: '1.75rem 2rem', borderRadius: '16px', marginBottom: '2.5rem', boxShadow: '0 10px 25px rgba(15,23,42,0.1)' }}>
        <div style={{ textAlign: 'left' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.95rem', fontWeight: 500, marginBottom: '0.4rem' }}>Estimated MMSE</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#e2e8f0' }}>{data.cognitive_score} / 30</div>
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.95rem', fontWeight: 500, marginBottom: '0.4rem' }}>Analyzed Metrics</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#e2e8f0' }}>Demographics + Cognitive</div>
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.95rem', fontWeight: 500, marginBottom: '0.4rem' }}>Accuracy</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#e2e8f0' }}>High</div>
        </div>
      </div>

      <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '2.5rem', lineHeight: 1.5, maxWidth: '600px', margin: '0 auto 2.5rem' }}>
        Disclaimer: NeuroSense is a preliminary tool and does not provide a definitive clinical diagnosis. 
        Please consult a medical professional for medical advice.
      </p>

      <button onClick={onRestart} style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
        padding: '0.9rem 2.2rem', borderRadius: '12px',
        background: '#0ea5e9', border: 'none', color: '#ffffff',
        fontSize: '1.05rem', fontWeight: 600, cursor: 'pointer',
        boxShadow: '0 6px 16px rgba(14,165,233,0.3)', transition: 'transform 0.2s, box-shadow 0.2s'
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(14,165,233,0.4)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(14,165,233,0.3)'; }}>
        <RefreshCw size={20} /> Take Assessment Again
      </button>
    </div>
  );
}
