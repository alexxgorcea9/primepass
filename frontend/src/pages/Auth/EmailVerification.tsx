// src/pages/Auth/EmailVerification.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@components/Auth/Button';

const POLL_MS = 6000;

const EmailVerification: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, getVerificationStatus, resendVerificationEmail, verifyEmailToken, refreshUserProfile, markEmailVerified } = useAuth();

  const qs = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const mode = qs.get('token') && qs.get('email') ? 'link' : 'await';
  const token = qs.get('token') || '';
  const emailFromQS = qs.get('email') || '';

  const [status, setStatus] = useState<{ email_verified: boolean; resend_available_in: number } | null>(null);
  const [loading, setLoading] = useState<boolean>(mode === 'link');
  const [msg, setMsg] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState<number>(0);
  const [linkResult, setLinkResult] = useState<'idle' | 'ok' | 'error'>('idle');

  // Gradient animation like Welcome.tsx
  const gradientRef = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (!gradientRef.current) return;
    const svg = gradientRef.current;
    const radius = 20;
    const duration = 30; // seconds
    let start = Date.now();
    let raf: number;
    const tick = () => {
      const elapsed = (Date.now() - start) / 1000;
      const angle = (elapsed % duration) * ((2 * Math.PI) / duration);
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const scale = 1.5 + 0.08 * Math.sin(angle * 2);
      svg.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Seed pending email for resend convenience
  const pendingEmail = useMemo(() => {
    const fromState = (location.state as any)?.email as string | undefined;
    return fromState || emailFromQS || user?.email || sessionStorage.getItem('pending_email') || '';
  }, [location.state, emailFromQS, user?.email]);

  useEffect(() => {
    if (pendingEmail) sessionStorage.setItem('pending_email', pendingEmail);
  }, [pendingEmail]);

  // ----- LINK MODE: verify immediately -----
  useEffect(() => {
  if (mode !== 'link') return;
  (async () => {
    try {
      setLoading(true);
      const res = await verifyEmailToken(token, emailFromQS);
      if (res.email_verified) {
        // ✅ LATCH: let the guard know we JUST verified in this tab
        sessionStorage.setItem('pp_just_verified', '1');

        // flip local state immediately to avoid stale-flag redirects
        markEmailVerified();

        // hydrate if cookies are present
        try { await refreshUserProfile(); } catch {}

        // go to setup
        navigate('/profile-setup', { replace: true });
        return;
      } else {
        setLinkResult('error');
        setMsg(res.message || 'Verification failed. The link may be invalid or expired.');
      }
    } catch (e: any) {
      setLinkResult('error');
      const detail = e?.response?.data?.message || e?.response?.data?.detail || e?.message || 'Verification error';
      setMsg(detail);
    } finally {
      setLoading(false);
    }
  })();
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [mode, token, emailFromQS]);

  // ----- AWAIT MODE: poll status until verified -----
  useEffect(() => {
    if (mode !== 'await') return;
    let ticker: number | undefined;
    (async () => {
      try {
        const s = await getVerificationStatus();
        setStatus({ email_verified: s.email_verified, resend_available_in: s.resend_available_in ?? 0 });
        setCooldown(s.resend_available_in ?? 0);
      } catch {}
      ticker = window.setInterval(async () => {
        try {
          const s = await getVerificationStatus();
          setStatus({ email_verified: s.email_verified, resend_available_in: s.resend_available_in ?? 0 });
          if (s.email_verified) {
            navigate('/profile-setup', { replace: true });
          }
        } catch {}
      }, POLL_MS);
    })();
    return () => { if (ticker) clearInterval(ticker); };
  }, [mode, getVerificationStatus, navigate]);

  // Local cooldown timer for resend button
  useEffect(() => {
    if (!cooldown) return;
    const t = setInterval(() => setCooldown(v => Math.max(0, v - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const handleResend = useCallback(async () => {
    try {
      setMsg(null);
      if (!pendingEmail) {
        setMsg('No email available to resend to.');
        return;
      }
      await resendVerificationEmail(pendingEmail);
      setMsg('Verification email sent. Check your inbox.');
      setCooldown(60);
    } catch (e: any) {
      const detail = e?.response?.data?.message || e?.response?.data?.detail || 'Failed to resend. Please try later.';
      setMsg(detail);
    }
  }, [pendingEmail, resendVerificationEmail]);

  // ----- Rendering -----
  const Title = () => {
    if (mode === 'link') {
      if (loading) return <>Verifying your email…</>;
      if (linkResult === 'ok') return <>Email verified!</>;
      if (linkResult === 'error') return <>Verification problem</>;
      return <>Email verification</>;
    }
    return <>Check your inbox</>;
  };

  const Subtitle = () => {
    if (mode === 'link') {
      if (loading) return <>Please wait while we complete verification.</>;
      if (linkResult === 'ok') return <>You can continue to set up your profile.</>;
      if (linkResult === 'error') return <>{msg || 'The link may be invalid or expired.'}</>;
      return <>{msg}</>;
    }
    return <>We emailed a verification link to {obscureEmail(pendingEmail)}. Open it on this device.</>;
  };

  return (
    <div className="fixed inset-0 flex h-[100dvh] w-screen flex-col justify-between overflow-visible bg-[#0A0A0A]">
      {/* Animated gradient (matches Welcome.tsx style) */}
      <div className="pointer-events-none fixed inset-0 w-screen overflow-visible">
        <div className="absolute bottom-[-200px] left-[calc(50%-300px)] z-0 overflow-visible">
          <svg
            ref={gradientRef}
            width="600"
            height="500"
            viewBox="-100 -100 1000 623"
            fill="none"
            overflow="visible"
            xmlns="http://www.w3.org/2000/svg"
            style={{ transition: 'transform 0.1s linear', transformOrigin: 'center center' }}
          >
            <g filter="url(#filter1_f)">
              <path
                d="M277.668 100.434C364.502 98.5488 666.676 115.794 667.983 175.979C669.289 236.164 213.045 320.188 126.211 322.073C39.3777 323.959 202.254 313.742 200.947 253.557C199.641 193.372 190.834 102.319 277.668 100.434Z"
                fill="url(#paint1_linear)"
                fillOpacity="0.85"
              />
            </g>
            <defs>
              <filter id="filter1_f" x="0.710938" y="0.297363" width="767.273" height="421.981" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                <feGaussianBlur stdDeviation="50" result="effect1_foregroundBlur" />
              </filter>
              <linearGradient id="paint1_linear" x1="132.666" y1="213.107" x2="668.536" y2="201.474" gradientUnits="userSpaceOnUse">
                <stop stopColor="#D9B3E2" />
                <stop offset="1" stopColor="#F4C05F" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Center copy */}
      <div className="z-10 mx-auto flex w-[286px] flex-1 flex-col items-center justify-center gap-5">
        <div className="w-full text-center font-['Pacifico'] text-[40px] leading-[58px] font-normal text-white">
          <Title />
        </div>
        <div className="w-full text-center font-lufga text-base leading-6 font-normal text-[rgba(247,247,247,0.6)]">
          <Subtitle />
        </div>
        {msg && mode !== 'link' && (
          <div className="mt-2 text-center font-lufga text-sm text-[rgba(247,247,247,0.7)]">{msg}</div>
        )}
      </div>

      {/* Bottom actions */}
      <div className="z-10 mx-auto mb-6 flex w-full max-w-[440px] flex-col items-center justify-start gap-2.5 px-5 pb-[env(safe-area-inset-bottom)]">
        <div className="relative z-10 flex w-full flex-col gap-[15px]">
          {mode === 'await' && (
            <>
              <Button
                text={cooldown > 0 ? `Resend email in ${cooldown}s` : 'Resend verification email'}
                variant="primary"
                disabled={cooldown > 0}
                onClick={handleResend}
              />
              <Button
                text="Back to Login"
                variant="secondary"
                onClick={() => navigate('/login')}
              />
            </>
          )}
          {mode === 'link' && (
            <>
              {linkResult === 'ok' ? (
                user ? (
                  <Button text="Continue" variant="primary" onClick={() => navigate('/profile-setup', { replace: true })} />
                ) : (
                  <Button text="Login" variant="primary" onClick={() => navigate('/login', { replace: true })} />
                )
              ) : (
                <>
                  <Button text={loading ? 'Verifying…' : 'Try Again'} variant="primary" disabled={loading} onClick={() => navigate('/verify-email', { replace: true, state: { email: pendingEmail } })} />
                  <Button text="Back to Login" variant="secondary" onClick={() => navigate('/login')} />
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;

// Helpers
function obscureEmail(email: string) {
  if (!email) return 'your email';
  const [name, domain] = email.split('@');
  if (!name || !domain) return email;
  const shown = name.length <= 2 ? name[0] : name.slice(0, 2);
  return `${shown}${'*'.repeat(Math.max(1, name.length - shown.length))}@${domain}`;
}
