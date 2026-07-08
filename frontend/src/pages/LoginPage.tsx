// Login page — MInT IMS Design System (improved)
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService, getAuthErrorMessage, statisticsService, SystemStatistics } from '../services';
import { useAuthStore } from '../store/auth.store';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [stats, setStats] = useState<SystemStatistics | null>(null);

  useEffect(() => {
    // Fetch system statistics on component mount
    const fetchStats = async () => {
      try {
        const data = await statisticsService.getSystemStatistics();
        setStats(data);
      } catch (error) {
        console.error('Failed to load statistics:', error);
      }
    };
    fetchStats();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    setIsLoading(true);
    try {
      const response = await authService.login({ email, password });
      setUser(response.user);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Format numbers for display
  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  // Calculate uptime percentage (placeholder - should come from backend)
  // const uptimePercentage = 99.8; // removed — stats now come from real API

  return (
    <div className="lp-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');

        * { box-sizing: border-box; }

        .lp-root {
          min-height: 100vh;
          display: flex;
          font-family: 'Sora', system-ui, sans-serif;
          background: #f0f2f7;
        }

        /* ─── LEFT BRAND PANEL ─── */
        .lp-brand {
          display: none;
          position: relative;
          background: #0B1F42;
          overflow: hidden;
          flex-direction: column;
          justify-content: space-between;
          padding: 3.5rem 2.5rem;
        }
        @media (min-width: 1024px) {
          .lp-brand {
            display: flex;
            width: 440px;
            min-width: 440px;
            flex: 0 0 440px;
          }
        }
        @media (min-width: 1280px) {
          .lp-brand {
            width: 480px;
            min-width: 480px;
            flex: 0 0 480px;
            padding: 4rem 3rem;
          }
        }

        /* Subtle dot-matrix texture */
        .lp-brand::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px);
          background-size: 28px 28px;
        }

        /* Diagonal accent stripe */
        .lp-brand-stripe {
          position: absolute;
          top: 0; right: 0;
          width: 40%;
          height: 100%;
          background: linear-gradient(180deg, rgba(7,137,48,0.06) 0%, rgba(252,221,9,0.04) 50%, rgba(218,18,26,0.05) 100%);
          clip-path: polygon(30% 0, 100% 0, 100% 100%, 0% 100%);
        }

        /* Horizontal accent line */
        .lp-brand-line {
          position: absolute;
          left: 3.5rem;
          right: 3.5rem;
          top: 50%;
          height: 1px;
          background: linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.12) 40%, transparent);
        }

        .lp-brand-top {
          position: relative;
          z-index: 2;
        }

        .lp-logo-wrap {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 4rem;
        }
        .lp-logo-box {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .lp-logo-box img {
          width: 32px;
          height: 32px;
          object-fit: contain;
        }
        .lp-logo-label {
          display: flex;
          flex-direction: column;
        }
        .lp-logo-label span:first-child {
          font-size: 0.8125rem;
          font-weight: 600;
          color: rgba(255,255,255,0.9);
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .lp-logo-label span:last-child {
          font-size: 0.6875rem;
          color: rgba(255,255,255,0.4);
          letter-spacing: 0.02em;
        }

        .lp-brand-heading {
          font-size: 2.5rem;
          font-weight: 700;
          color: #ffffff;
          line-height: 1.15;
          letter-spacing: -0.02em;
          margin: 0 0 1.25rem;
        }
        .lp-brand-heading em {
          font-style: normal;
          color: #FCDD09;
        }

        .lp-brand-desc {
          font-size: 0.9375rem;
          color: rgba(255,255,255,0.45);
          line-height: 1.7;
          max-width: 340px;
          margin: 0;
          font-weight: 300;
        }

        /* Stats row */
        .lp-stats {
          position: relative;
          z-index: 2;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: rgba(255,255,255,0.06);
          border-radius: 16px;
          overflow: hidden;
          margin: 3rem 0;
        }
        .lp-stat {
          background: rgba(255,255,255,0.03);
          padding: 1.25rem 1rem;
          text-align: center;
        }
        .lp-stat-num {
          font-size: 1.5rem;
          font-weight: 700;
          color: #FCDD09;
          line-height: 1;
          margin-bottom: 0.375rem;
        }
        .lp-stat-label {
          font-size: 0.625rem;
          color: rgba(255,255,255,0.35);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-weight: 500;
        }

        /* Feature list */
        .lp-features {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
        }
        .lp-feature {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .lp-feature-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #078930;
          flex-shrink: 0;
        }
        .lp-feature-text {
          font-size: 0.8125rem;
          color: rgba(255,255,255,0.5);
          font-weight: 400;
        }

        /* Brand bottom */
        .lp-brand-bottom {
          position: relative;
          z-index: 2;
        }
        .lp-brand-footer {
          font-size: 0.6875rem;
          color: rgba(255,255,255,0.2);
          letter-spacing: 0.02em;
        }

        /* Ethiopian flag bar */
        .lp-flag {
          display: flex;
          height: 3px;
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 1.25rem;
          width: 48px;
        }
        .lp-flag > div { flex: 1; }
        .lp-flag > div:nth-child(1) { background: #078930; }
        .lp-flag > div:nth-child(2) { background: #FCDD09; }
        .lp-flag > div:nth-child(3) { background: #DA121A; }

        /* ─── RIGHT FORM PANEL ─── */
        .lp-form-panel {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1.5rem;
          background: #f0f2f7;
        }
        @media (min-width: 1024px) {
          .lp-form-panel {
            flex: 1;
            min-width: 0;
            padding: 3rem;
            background: #ffffff;
          }
        }

        .lp-form-inner {
          width: 100%;
          max-width: 400px;
        }

        /* Mobile brand */
        .lp-mobile-brand {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          margin-bottom: 2.5rem;
        }
        @media (min-width: 1024px) { .lp-mobile-brand { display: none; } }
        .lp-mobile-logo {
          width: 44px;
          height: 44px;
          background: #0B1F42;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .lp-mobile-logo img {
          width: 28px;
          height: 28px;
          object-fit: contain;
        }
        .lp-mobile-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #0B1F42;
        }
        .lp-mobile-sub {
          font-size: 0.6875rem;
          color: #8898b3;
          margin-top: 1px;
        }

        /* Form header */
        .lp-header {
          margin-bottom: 2.5rem;
        }
        .lp-header-eyebrow {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.875rem;
        }
        .lp-header-eyebrow span {
          font-size: 0.6875rem;
          font-weight: 600;
          color: #078930;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .lp-header-eyebrow-line {
          flex: 1;
          height: 1px;
          background: #e4e8f0;
        }
        .lp-header h1 {
          font-size: 1.625rem;
          font-weight: 700;
          color: #0B1F42;
          margin: 0 0 0.5rem;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }
        .lp-header p {
          font-size: 0.875rem;
          color: #8898b3;
          margin: 0;
          font-weight: 400;
        }

        /* Field group */
        .lp-fields {
          display: flex;
          flex-direction: column;
          gap: 1.125rem;
          margin-bottom: 1.75rem;
        }

        /* Error */
        .lp-error {
          display: flex;
          align-items: flex-start;
          gap: 0.625rem;
          padding: 0.875rem 1rem;
          background: #fff5f5;
          border: 1px solid #fecdcd;
          border-left: 3px solid #DA121A;
          border-radius: 10px;
          margin-bottom: 1.25rem;
        }
        .lp-error svg {
          width: 16px;
          height: 16px;
          color: #DA121A;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .lp-error p {
          font-size: 0.8125rem;
          color: #8B0000;
          margin: 0;
          font-weight: 500;
        }

        /* Sign in button — premium & modern MInT brand style */
        .lp-submit {
          width: 100%;
          height: 50px;
          background: #0F2040; /* MInT Navy */
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          color: #ffffff;
          font-family: 'Sora', system-ui, sans-serif;
          font-size: 0.9375rem;
          font-weight: 600;
          letter-spacing: 0.01em;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 12px -2px rgba(15, 32, 64, 0.12), 0 2px 4px -1px rgba(15, 32, 64, 0.08);
        }
        .lp-submit:hover:not(:disabled) {
          background: #1A3D6B; /* MInT Blue */
          box-shadow: 0 6px 20px -4px rgba(26, 61, 107, 0.24), 0 4px 8px -2px rgba(26, 61, 107, 0.16);
          transform: translateY(-1px);
        }
        .lp-submit:active:not(:disabled) {
          transform: translateY(0) scale(0.985);
          box-shadow: 0 2px 6px -1px rgba(15, 32, 64, 0.1);
        }
        .lp-submit:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          box-shadow: none;
        }

        .lp-submit-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Footer */
        .lp-footer {
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e9ecf2;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .lp-footer-left {
          font-size: 0.6875rem;
          color: #b0bac9;
        }
        .lp-footer-badge {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.6875rem;
          color: #b0bac9;
        }
        .lp-footer-badge svg {
          width: 13px;
          height: 13px;
          color: #078930;
        }

        /* Full bottom flag bar on desktop only */
        @media (min-width: 1024px) {
          .lp-root {
            position: relative;
          }
        }

        /* Custom label / input style override to match design */
        .lp-field-wrap {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .lp-field-label {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #374055;
          letter-spacing: 0.01em;
        }
        .lp-field-label span {
          color: #DA121A;
          margin-left: 2px;
        }
        .lp-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .lp-input-icon {
          position: absolute;
          left: 14px;
          color: #b0bac9;
          width: 17px;
          height: 17px;
          pointer-events: none;
        }
        .lp-input {
          width: 100%;
          height: 48px;
          padding: 0 3rem 0 2.75rem;
          background: #f7f8fc;
          border: 1.5px solid #e4e8f0;
          border-radius: 11px;
          font-family: 'Sora', system-ui, sans-serif;
          font-size: 0.875rem;
          color: #0B1F42;
          transition: border-color 0.2s, background 0.2s;
          outline: none;
        }
        .lp-input::placeholder { color: #c1c9d9; }
        .lp-input:focus {
          background: #ffffff;
          border-color: #1F3864;
          box-shadow: 0 0 0 3px rgba(31,56,100,0.08);
        }
        .lp-input-right {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          padding: 4px;
          cursor: pointer;
          color: #b0bac9;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: color 0.2s;
        }
        .lp-input-right:hover { color: #0B1F42; }
        .lp-input-right svg { width: 17px; height: 17px; }
      `}</style>

      {/* ── LEFT BRAND PANEL ── */}
      <div className="lp-brand">
        <div className="lp-brand-stripe" />
        <div className="lp-brand-line" />

        <div className="lp-brand-top">
          <div className="lp-logo-wrap">
            <div className="lp-logo-box">
              <img src="/assets/images/mint_logo.png" alt="MInT" />
            </div>
            <div className="lp-logo-label">
              <span>Ministry of Innovation</span>
              <span>&amp; Technology · Ethiopia</span>
            </div>
          </div>

          <h2 className="lp-brand-heading">
            Internship<br />Management<br /><em>System</em>
          </h2>
          <p className="lp-brand-desc">
            A unified platform for managing, tracking, and evaluating internship programmes across Ethiopian universities and government institutions.
          </p>

          <div className="lp-stats">
            <div className="lp-stat">
              <div className="lp-stat-num">{stats ? stats.universities : '—'}</div>
              <div className="lp-stat-label">Universities</div>
            </div>
            <div className="lp-stat">
              <div className="lp-stat-num">{stats ? formatNumber(stats.students) : '—'}</div>
              <div className="lp-stat-label">Students</div>
            </div>
            <div className="lp-stat">
              <div className="lp-stat-num">{stats ? formatNumber(stats.users) : '—'}</div>
              <div className="lp-stat-label">Users</div>
            </div>
          </div>

          <div className="lp-features">
            {[
              'Real-time internship progress tracking',
              'Automated report & evaluation generation',
              'Multi-role access control',
              'Secure, ministry-grade data handling',
            ].map((f) => (
              <div className="lp-feature" key={f}>
                <div className="lp-feature-dot" />
                <span className="lp-feature-text">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lp-brand-bottom">
          <div className="lp-flag">
            <div /><div /><div />
          </div>
          <p className="lp-brand-footer">© 2026 Ministry of Innovation &amp; Technology · Ethiopia</p>
        </div>
      </div>

      {/* ── RIGHT FORM PANEL ── */}
      <div className="lp-form-panel">
        <div className="lp-form-inner">

          {/* Mobile only branding */}
          <div className="lp-mobile-brand">
            <div className="lp-mobile-logo">
              <img src="/assets/images/mint_logo.png" alt="MInT" />
            </div>
            <div>
              <div className="lp-mobile-title">MInT IMS</div>
              <div className="lp-mobile-sub">Ministry of Innovation &amp; Technology</div>
            </div>
          </div>

          {/* Header */}
          <div className="lp-header">
            <div className="lp-header-eyebrow">
              <span>Secure Access</span>
              <div className="lp-header-eyebrow-line" />
            </div>
            <h1>Sign in to your account</h1>
            <p>Enter your credentials to access the system</p>
          </div>

          {/* Error */}
          {error && (
            <div className="lp-error">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>{error}</p>
            </div>
          )}

          {/* Fields */}
          <form onSubmit={handleSubmit}>
            <div className="lp-fields">
              {/* Email */}
              <div className="lp-field-wrap">
                <label className="lp-field-label">
                  Email Address <span>*</span>
                </label>
                <div className="lp-input-wrap">
                  <svg className="lp-input-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <input
                    type="email"
                    className="lp-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="lp-field-wrap">
                <label className="lp-field-label">
                  Password <span>*</span>
                </label>
                <div className="lp-input-wrap">
                  <svg className="lp-input-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="lp-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="lp-input-right"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="lp-submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="lp-submit-spinner" />
              ) : (
                <>
                  Sign In
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="lp-footer">
            <span className="lp-footer-left">Accounts are provisioned by administrators</span>
            <div className="lp-footer-badge">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Ministry Secured</span>
            </div>
          </div>

          {/* University Signup Section */}
          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #e9ecf2', textAlign: 'center' }}>
            <p style={{ fontSize: '0.8125rem', color: '#8898b3', marginBottom: '0.75rem' }}>
              Are you representing a university?
            </p>
            <Link
              to="/university/signup"
              style={{
                display: 'inline-block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#078930',
                textDecoration: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                transition: 'all 0.2s',
                border: '1px solid rgba(7, 137, 48, 0.2)',
                backgroundColor: 'rgba(7, 137, 48, 0.05)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(7, 137, 48, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(7, 137, 48, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(7, 137, 48, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(7, 137, 48, 0.2)';
              }}
            >
              Register Your University
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;