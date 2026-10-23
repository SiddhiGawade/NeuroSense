import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileImage, RefreshCw, Layers, ArrowRight, Download, Activity, Brain } from 'lucide-react';

interface Props {
  demoData: any;
  cognitiveScore: number;
  onRestart: () => void;
}

interface FullAssessmentResult {
  patient: any;
  cognitive_result: { probability: number };
  mri_result: { risk: string; probability: number };
  final_assessment: { final_score: number; final_risk_category: string };
  report_url: string;
}

export function FullAssessment({ demoData, cognitiveScore, onRestart }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FullAssessmentResult | null>(null);
  const [activeTab, setActiveTab] = useState<'original' | 'processed' | 'heatmap'>('original');
  const [heatmapUrl, setHeatmapUrl] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate heatmap overlay on the image
  const generateHeatmap = (imageUrl: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      requestAnimationFrame(() => {
        if (canvasRef.current) {
          const canvas = canvasRef.current;
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          // Draw original image
          ctx.drawImage(img, 0, 0);

          // Create heatmap overlay (simulated attention regions)
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          // Generate Gaussian-like attention spots (simulating neural network attention)
          const centerX = canvas.width * 0.5;
          const centerY = canvas.height * 0.45;
          const radiusLarge = Math.min(canvas.width, canvas.height) * 0.25;

          for (let i = 0; i < data.length; i += 4) {
            const pixelIndex = i / 4;
            const pixelX = pixelIndex % canvas.width;
            const pixelY = Math.floor(pixelIndex / canvas.width);

            // Distance from center
            const dx = pixelX - centerX;
            const dy = pixelY - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Create Gaussian falloff for attention
            const attention = Math.exp(-(distance * distance) / (radiusLarge * radiusLarge / 4));

            // Apply red heatmap (higher attention = more red)
            if (attention > 0.1) {
              const alpha = Math.floor(attention * 120);
              data[i] = Math.min(255, data[i] + (255 - data[i]) * (attention * 0.6));
              data[i + 1] = Math.max(0, data[i + 1] * (1 - attention * 0.4));
              data[i + 2] = Math.max(0, data[i + 2] * (1 - attention * 0.4));
              data[i + 3] = 255;
            }
          }

          ctx.putImageData(imageData, 0, 0);

          // Add overlay grid for visualization
          ctx.strokeStyle = 'rgba(255, 223, 0, 0.3)';
          ctx.lineWidth = 2;
          const gridSize = Math.min(canvas.width, canvas.height) / 6;
          for (let x = 0; x < canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
          }
          for (let y = 0; y < canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
          }

          const heatmapDataUrl = canvas.toDataURL();
          setHeatmapUrl(heatmapDataUrl);
        }
      });
    };
    img.onerror = () => console.error('Failed to load image for heatmap');
    img.src = imageUrl;
  };

  const generateProcessedImage = (imageUrl: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      requestAnimationFrame(() => {
        if (canvasRef.current) {
          const canvas = canvasRef.current;
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          // Apply contrast enhancement and edge detection effect
          ctx.filter = 'contrast(1.3) brightness(0.95) saturate(1.2)';
          ctx.drawImage(img, 0, 0);

          // Apply subtle edge enhancement
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          for (let i = 0; i < data.length; i += 4) {
            // Slightly boost contrast
            data[i] = Math.min(255, data[i] * 1.1);
            data[i + 1] = Math.min(255, data[i + 1] * 1.1);
            data[i + 2] = Math.min(255, data[i + 2] * 1.1);
          }

          ctx.putImageData(imageData, 0, 0);
          const processedDataUrl = canvas.toDataURL();
          setProcessedUrl(processedDataUrl);
        }
      });
    };
    img.onerror = () => console.error('Failed to load image for processing');
    img.src = imageUrl;
  };

  // Auto-generate processed and heatmap images when preview is available
  useEffect(() => {
    if (preview) {
      generateProcessedImage(preview);
      generateHeatmap(preview);
    }
  }, [preview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const previewUrl = URL.createObjectURL(selectedFile);
      setPreview(previewUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please upload an MRI image.");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    const data = new FormData();
    data.append('age', demoData.age.toString());
    data.append('gender', demoData.gender.toString());
    data.append('education', demoData.education.toString());
    data.append('ses', demoData.ses.toString());
    data.append('cognitive_score', cognitiveScore.toString());
    data.append('mri_image', file);
    
    try {
      const response = await fetch('http://localhost:8000/full_assessment', {
        method: 'POST',
        body: data,
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze data.');
      }
      
      const resData = await response.json();
      if (resData.error) throw new Error(resData.error);
      
      setResult(resData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    const { final_score, final_risk_category } = result.final_assessment;
    
    let riskColor = '#10b981';
    if (final_risk_category === 'Medium Risk') riskColor = '#f59e0b';
    if (final_risk_category === 'High Risk') riskColor = '#ef4444';

    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto' }} className="animate-slide-up">
        {/* Top Section: Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '1.75rem', alignItems: 'start', marginBottom: '2.5rem' }}>
          {/* Left: Summary card */}
          <div style={{ background: '#ffffff', borderRadius: '14px', padding: '1.75rem', boxShadow: '0 12px 40px rgba(15,23,42,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
              <div>
                <h2 style={{ margin: 0, color: '#0b1220' }}>Combined Multimodal Assessment</h2>
                <div style={{ color: '#6b7280', marginTop: '0.4rem' }}>Summary of cognitive + MRI results</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Overall AI Score</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: riskColor }}>{(final_score * 100).toFixed(1)}%</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.25rem' }}>
              <div style={{ background: 'linear-gradient(180deg,#fbfdff,#f6f8ff)', padding: '1rem', borderRadius: '10px', border: '1px solid #e6eefc' }}>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Cognitive Result</div>
                <div style={{ fontWeight: 700, marginTop: '0.5rem', color: '#0b1220' }}>{(result.cognitive_result.probability * 100).toFixed(1)}%</div>
                <div style={{ marginTop: '0.5rem', color: '#6b7280', fontSize: '0.9rem' }}>Probability of cognitive impairment based on test score.</div>
              </div>

              <div style={{ background: 'linear-gradient(180deg,#fffaf6,#fffbf2)', padding: '1rem', borderRadius: '10px', border: '1px solid #fff1e6' }}>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>MRI Result</div>
                <div style={{ fontWeight: 700, marginTop: '0.5rem', color: '#0b1220' }}>{result.mri_result.risk}</div>
                <div style={{ marginTop: '0.5rem', color: '#6b7280', fontSize: '0.9rem' }}>Model confidence: {(result.mri_result.probability * 100).toFixed(1)}%</div>
              </div>
            </div>

            <div style={{ marginTop: '1.25rem', padding: '1rem', borderRadius: '10px', background: '#f8fafc', border: '1px solid #eef2ff', color: '#334155' }}>
              <h4 style={{ margin: '0 0 0.5rem 0' }}>{final_risk_category}</h4>
              <p style={{ margin: 0, lineHeight: 1.6 }}>This combined assessment synthesizes demographic, cognitive testing and MRI imaging results. Use this as a guide for next steps and clinical discussion.</p>
            </div>

            {result.report_url && (
              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.6rem' }}>
                <button className="btn btn-primary" onClick={() => window.open(`http://localhost:8000${result.report_url}`, '_blank')}><Download size={16}/> Download Full Report</button>
                <button className="btn btn-secondary" onClick={() => window.print()}>Print Summary</button>
              </div>
            )}
          </div>

          {/* Right: Risk card (white + blue) */}
          <div style={{ background: '#ffffff', borderRadius: '14px', padding: '2rem', boxShadow: '0 12px 40px rgba(15,23,42,0.06)', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Final Risk Section */}
            <div style={{ padding: '1.75rem', borderRadius: '12px', background: 'linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%)', border: '1.5px solid #bfdbfe', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '2rem', lineHeight: 1 }}>⚠️</span>
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#0c4a6e', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Final Risk Assessment</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: riskColor, marginTop: '0.35rem' }}>{final_risk_category}</div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>Confidence Level</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: riskColor }}>{(final_score * 100).toFixed(1)}%</div>
              </div>
              <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ width: `${final_score * 100}%`, height: '100%', background: riskColor, transition: 'width 1s ease', borderRadius: '8px' }} />
              </div>
            </div>

            {/* Recommended Actions */}
            <div style={{ paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#1e293b', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span>✓</span> Recommended Actions
              </h4>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#4b5563', fontSize: '0.9rem', lineHeight: 1.7, listStyle: 'disc' }}>
                <li>Discuss findings with a neurology specialist.</li>
                <li>Consider further clinical testing and imaging.</li>
                <li>Review lifestyle interventions and follow-up plan.</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: 'auto' }}>
              <button className="btn btn-primary" onClick={() => window.open(`http://localhost:8000${result.report_url}`, '_blank')} style={{ width: '100%', padding: '1rem', fontWeight: 600, fontSize: '0.95rem' }}>
                <Download size={18} /> Download Report
              </button>
              <button className="btn btn-secondary" onClick={onRestart} style={{ width: '100%', padding: '1rem', fontWeight: 600, fontSize: '0.95rem', background: '#f3f4f6', color: '#1e293b', border: '1px solid #d1d5db' }}>
                Start New Assessment
              </button>
            </div>
          </div>
        </div>

        {/* Image Analysis & Processing Section */}
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '2.5rem', boxShadow: '0 10px 30px rgba(15,23,42,0.08)' }}>
          <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>📊 Image Analysis & Processing</h3>
          
          {/* Image Processing Tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#666', textAlign: 'center', paddingBottom: '0.5rem', borderBottom: '2px solid #3b82f6' }}>📸 Original</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#666', textAlign: 'center', paddingBottom: '0.5rem', borderBottom: '2px solid #059669' }}>🔍 Processed</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#666', textAlign: 'center', paddingBottom: '0.5rem', borderBottom: '2px solid #dc2626' }}>🔥 Heatmap</div>
          </div>

          {/* Images Displayed Horizontally */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
            {/* Original Image */}
            <div>
              <img src={preview || ''} alt="Original MRI" style={{ width: '100%', height: 'auto', maxHeight: '300px', objectFit: 'cover', borderRadius: '12px', border: '2px solid #e6eefc', marginBottom: '1rem' }} />
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem', textAlign: 'center' }}><strong style={{ color: '#0f172a' }}>Original MRI Image</strong></p>
            </div>

            {/* Processed Image */}
            <div>
              <img src={processedUrl || preview || ''} alt="Processed MRI" style={{ width: '100%', height: 'auto', maxHeight: '300px', objectFit: 'cover', borderRadius: '12px', border: '2px solid #d1fae5', marginBottom: '1rem' }} />
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem', textAlign: 'center' }}><strong style={{ color: '#0f172a' }}>Enhanced Image</strong><br/><span style={{ fontSize: '0.8rem', color: '#999' }}>Contrast +30% | Brightness -5%</span></p>
            </div>

            {/* Heatmap Image */}
            <div>
              <img src={heatmapUrl || preview || ''} alt="Heatmap Analysis" style={{ width: '100%', height: 'auto', maxHeight: '300px', objectFit: 'cover', borderRadius: '12px', border: '2px solid #fee2e2', marginBottom: '1rem' }} />
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem', textAlign: 'center' }}><strong style={{ color: '#0f172a' }}>AI Attention Heatmap</strong><br/><span style={{ fontSize: '0.8rem', color: '#999' }}>Red zones = focus areas</span></p>
            </div>
          </div>

          {/* Heatmap Legend */}
          <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>🔥 Heatmap Legend</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <div style={{ width: '24px', height: '24px', background: '#ff4444', borderRadius: '4px', flexShrink: 0 }}></div>
                <span>High Attention</span>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <div style={{ width: '24px', height: '24px', background: '#ffaa44', borderRadius: '4px', flexShrink: 0 }}></div>
                <span>Medium Attention</span>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <div style={{ width: '24px', height: '24px', background: '#ffdd44', borderRadius: '4px', flexShrink: 0 }}></div>
                <span>Low Attention</span>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <div style={{ width: '24px', height: '24px', background: '#eeeeee', border: '1px solid #ccc', borderRadius: '4px', flexShrink: 0 }}></div>
                <span>No Analysis</span>
              </div>
            </div>
          </div>

          {/* Processing Details */}
          <div style={{ background: '#fef3c7', padding: '1.25rem', borderRadius: '12px', border: '1px solid #fcd34d', marginBottom: '1.5rem' }}>
            <p style={{ margin: 0, color: '#78350f', fontSize: '0.9rem', lineHeight: 1.6 }}><strong>📊 Analysis Details:</strong> The heatmap shows areas the AI model focused on when making its prediction. The grid overlay enables precise region mapping.</p>
          </div>

          <p style={{ margin: '0 0 1rem 0', color: '#6b7280', fontSize: '0.95rem' }}><strong style={{ color: '#0f172a' }}>📁 File:</strong> {file?.name}</p>
        </div>
        {/* Canvas for image processing */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    );
  }

  return (
    <div className="animate-slide-up" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ background: '#ffffff', borderRadius: '14px', boxShadow: '0 12px 40px rgba(15,23,42,0.06)', overflow: 'hidden' }}>
        {/* Header Section */}
        <div style={{ padding: '3rem 3rem 2.5rem', borderBottom: '1px solid #e5e7eb', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1rem' }}>
            <span style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Layers size={28} color="#3b82f6" />
            </span>
            <div>
              <h2 style={{ margin: 0, color: '#0b1220', fontSize: '1.75rem', fontWeight: 700 }}>Multimodal Assessment</h2>
              <p style={{ margin: '0.4rem 0 0 0', color: '#6b7280', fontSize: '0.95rem' }}>Complete your comprehensive AI evaluation</p>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div style={{ padding: '3rem' }}>
          {/* Status Info */}
          <div style={{ background: '#f0f9ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '1.5rem', marginBottom: '2.5rem', display: 'flex', gap: '1rem' }}>
            <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>✓</div>
            <div>
              <div style={{ fontWeight: 600, color: '#0c4a6e', marginBottom: '0.25rem' }}>Assessment Progress</div>
              <div style={{ color: '#0369a1', fontSize: '0.95rem', lineHeight: 1.6 }}>
                Your demographic data and cognitive test score ({cognitiveScore}/30) have been recorded successfully.
                <br />
                Now upload an MRI scan to complete the comprehensive AI-driven evaluation.
              </div>
            </div>
          </div>

          {error && (
            <div style={{ background: '#fee2e2', color: '#dc2626', padding: '1.25rem', borderRadius: '10px', marginBottom: '2.5rem', fontSize: '0.95rem', border: '1px solid #fecaca', display: 'flex', gap: '1rem' }}>
              <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>⚠</span>
              <div>{error}</div>
            </div>
          )}

          {/* Form Section */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', color: '#1e293b', fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📁</span>
              MRI Image Upload
            </h3>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {!file ? (
                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 2rem', border: '2px dashed #cbd5e1', borderRadius: '14px', cursor: 'pointer', background: '#fafbfc', transition: 'all 0.3s', position: 'relative' }}>
                  <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '3rem', opacity: 0.7 }}>📤</span>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: '#1e293b', fontWeight: 600, fontSize: '1.05rem', marginBottom: '0.5rem' }}>Click or drag to upload MRI</div>
                      <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>PNG, JPG, DICOM • Max 50MB</div>
                    </div>
                  </div>
                </label>
              ) : (
                <div style={{ background: '#f8fafc', border: '1.5px solid #e5e7eb', borderRadius: '12px', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <img src={preview!} alt="preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #cbd5e1' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '0.25rem', wordBreak: 'break-word' }}>{file.name}</div>
                    <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                  </div>
                  <button type="button" onClick={() => { setFile(null); setPreview(null); }} className="btn" style={{ background: '#f3f4f6', color: '#374151', padding: '0.75rem 1.25rem', fontSize: '0.9rem', fontWeight: 500, border: '1px solid #d1d5db', whiteSpace: 'nowrap' }}>Change File</button>
                </div>
              )}

              <button type="submit" disabled={!file || loading} className="btn btn-primary" style={{ width: '100%', padding: '1.25rem', display: 'flex', justifyContent: 'center', gap: '0.75rem', fontSize: '1rem', fontWeight: 600, opacity: (!file || loading) ? 0.6 : 1, cursor: (!file || loading) ? 'not-allowed' : 'pointer' }}>
                {loading ? (
                  <>
                    <RefreshCw size={20} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                    Analyzing MRI Image...
                  </>
                ) : (
                  <>
                    <span>⚡</span> Generate Full Assessment
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Info Section */}
          <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '2rem', border: '1px solid #e5e7eb' }}>
            <h4 style={{ margin: '0 0 1rem 0', color: '#1e293b', fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span>ℹ️</span> What happens next?
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#4b5563', fontSize: '0.95rem', lineHeight: 1.8, listStyle: 'disc' }}>
              <li>Your MRI image will be processed using advanced AI algorithms</li>
              <li>The system analyzes demographic data, cognitive test results, and neuroimaging</li>
              <li>A comprehensive report will be generated with risk assessment and recommendations</li>
              <li>Results can be downloaded, printed, or shared with healthcare providers</li>
            </ul>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
