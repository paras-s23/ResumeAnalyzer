import { useState, useRef, useEffect } from 'react'

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'

interface Analysis {
  overallScore: number
  atsScore: number
  strengths: string[]
  improvements: string[]
  quickWins: string[]
  bestFitRoles: string[]
}

function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  const r = 36
  const circ = 2 * Math.PI * r
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setProgress(score), 200)
    return () => clearTimeout(t)
  }, [score])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ position: 'relative', width: 90, height: 90 }}>
        <svg width="90" height="90" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="45" cy="45" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
          <circle
            cx="45" cy="45" r={r} fill="none"
            stroke={color} strokeWidth="6"
            strokeDasharray={circ}
            strokeDashoffset={circ - (progress / 100) * circ}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontWeight: 700, color: '#fff', fontFamily: '"DM Mono", monospace'
        }}>
          {score}
        </div>
      </div>
      <span style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
    </div>
  )
}

function BulletItem({ text, accent }: { text: string; accent: string }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ color: accent, marginTop: 2, flexShrink: 0, fontSize: 16 }}>›</span>
      <span style={{ fontSize: 13.5, color: '#c9d1d9', lineHeight: 1.6 }}>{text}</span>
    </div>
  )
}

export default function App() {
  const [resume, setResume] = useState('')
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const analyze = async () => {
    if (!resume.trim() || loading) return
    setLoading(true)
    setError('')
    setAnalysis(null)

    try {
      const res = await fetch(ANTHROPIC_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `Analyze this resume. Respond ONLY with raw JSON, no markdown, no backticks:\n\n${resume}\n\nReturn exactly this shape:\n{"overallScore":85,"atsScore":78,"strengths":["...","...","..."],"improvements":["...","...","..."],"quickWins":["...","..."],"bestFitRoles":["Role A","Role B","Role C"]}`
          }]
        })
      })
      const data = await res.json()
      const text = data.content?.find((b: { type: string }) => b.type === 'text')?.text || '{}'
      const parsed: Analysis = JSON.parse(text.replace(/```[a-z]*|```/g, '').trim())
      setAnalysis(parsed)
    } catch (e) {
      setError('Something went wrong. Check your API key and try again.')
      console.error(e)
    }

    setLoading(false)
  }

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      background: '#0a0a0f',
      padding: '48px 24px',
      fontFamily: '"Geist", "Inter", sans-serif',
      color: '#fff',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@700;800&display=swap');

        * { box-sizing: border-box; }

        .glow-btn {
          position: relative;
          padding: 13px 32px;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          letter-spacing: 0.04em;
          color: #fff;
          background: linear-gradient(135deg, #7c3aed 0%, #2563eb 100%);
          transition: opacity 0.2s, transform 0.15s;
          overflow: hidden;
        }
        .glow-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #a78bfa, #60a5fa);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .glow-btn:hover::before { opacity: 0.25; }
        .glow-btn:hover { transform: translateY(-1px); }
        .glow-btn:active { transform: scale(0.98); }
        .glow-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

        .glass-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
          padding: 24px;
        }

        textarea.resume-input {
          width: 100%;
          height: 200px;
          background: rgba(0,0,0,0.4);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          padding: 16px;
          font-size: 13.5px;
          font-family: "DM Mono", monospace;
          color: #c9d1d9;
          resize: vertical;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          line-height: 1.65;
        }
        textarea.resume-input:focus {
          border-color: rgba(124,58,237,0.5);
          box-shadow: 0 0 0 3px rgba(124,58,237,0.1);
        }
        textarea.resume-input::placeholder { color: #2d3748; }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.25);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
          vertical-align: middle;
          margin-right: 8px;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.5s ease forwards; }

        .role-pill {
          padding: 5px 14px;
          border-radius: 99px;
          background: rgba(96,165,250,0.1);
          border: 1px solid rgba(96,165,250,0.2);
          color: #60a5fa;
          font-size: 12px;
          font-weight: 500;
        }

        .section-header {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #4b5563;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .section-header::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.05);
        }
      `}</style>

      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18
            }}>✦</div>
            <h1 style={{
              fontFamily: '"Syne", sans-serif',
              fontSize: 30, fontWeight: 800,
              background: 'linear-gradient(90deg, #a78bfa 0%, #60a5fa 50%, #34d399 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text', margin: 0
            }}>Resume Analyzer</h1>
          </div>
          <p style={{ color: '#4b5563', fontSize: 13, marginLeft: 50 }}>
            AI-powered feedback · Scores · Role matching
          </p>
        </div>

        {/* Input card */}
        <div className="glass-card" style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7c3aed', marginBottom: 12 }}>
            ◆ Paste Your Resume
          </div>
          <textarea
            ref={textareaRef}
            className="resume-input"
            value={resume}
            onChange={e => setResume(e.target.value)}
            placeholder="Paste your resume text here — work experience, skills, education, projects..."
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
            <span style={{ fontSize: 11, color: '#374151', fontFamily: '"DM Mono", monospace' }}>
              {resume.length.toLocaleString()} chars
            </span>
            <button className="glow-btn" onClick={analyze} disabled={loading || !resume.trim()}>
              {loading ? <><span className="spinner" />Analyzing...</> : '✦ Analyze Resume'}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', fontSize: 13, marginBottom: 20 }}>
            {error}
          </div>
        )}

        {/* Results */}
        {analysis && (
          <div className="fade-up">
            {/* Score row */}
            <div className="glass-card" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
              <ScoreRing score={analysis.overallScore} label="Overall" color="#a78bfa" />
              <div style={{ width: 1, height: 60, background: 'rgba(255,255,255,0.06)' }} />
              <ScoreRing score={analysis.atsScore} label="ATS Score" color="#34d399" />
              <div style={{ width: 1, height: 60, background: 'rgba(255,255,255,0.06)' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>
                  {analysis.overallScore >= 80 ? '🚀' : analysis.overallScore >= 60 ? '⚡' : '🔧'}
                </div>
                <span style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {analysis.overallScore >= 80 ? 'Strong' : analysis.overallScore >= 60 ? 'Good' : 'Needs Work'}
                </span>
              </div>
            </div>

            {/* Details card */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

              <div>
                <div className="section-header">✓ Strengths</div>
                {analysis.strengths.map((s, i) => <BulletItem key={i} text={s} accent="#34d399" />)}
              </div>

              <div>
                <div className="section-header">△ Improve</div>
                {analysis.improvements.map((s, i) => <BulletItem key={i} text={s} accent="#fbbf24" />)}
              </div>

              <div>
                <div className="section-header">⚡ Quick Wins</div>
                {analysis.quickWins.map((s, i) => <BulletItem key={i} text={s} accent="#60a5fa" />)}
              </div>

              <div>
                <div className="section-header">◎ Best Fit Roles</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {analysis.bestFitRoles.map((r, i) => (
                    <span key={i} className="role-pill">{r}</span>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  )
}