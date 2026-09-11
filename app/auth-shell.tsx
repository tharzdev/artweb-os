'use client';

import { useEffect, useState } from 'react';
import { Check, Eye, EyeOff, KeyRound, Mail, UserRound } from 'lucide-react';
import Workspace from './workspace';
import type { AuthUser } from '@/lib/auth';

type Mode = 'login' | 'register';

export default function AuthShell() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [mode, setMode] = useState<Mode>('login');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    fetch('/api/auth/me').then(async response => {
      if (response.ok) setUser((await response.json()).user);
    }).finally(() => setChecking(false));
  }, []);

  async function submit(form: FormData) {
    setBusy(true); setError(''); setNotice('');
    const payload = mode === 'register'
      ? { name: String(form.get('name') || ''), email: String(form.get('email') || ''), password: String(form.get('password') || '') }
      : { email: String(form.get('email') || ''), password: String(form.get('password') || '') };
    try {
      const response = await fetch(`/api/auth/${mode}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json().catch(() => ({ error: 'O servidor não conseguiu concluir esta solicitação.' }));
      if (!response.ok) { setError(result.error || 'Não foi possível continuar.'); return; }
      if (mode === 'register') {
        setMode('login');
        setNotice('Conta criada. Agora entre com seu e-mail e senha.');
      } else {
        setUser(result.user);
      }
    } catch {
      setError('Não foi possível conectar. Tente novamente.');
    } finally { setBusy(false); }
  }

  if (checking) return <div className="auth-loading"><span className="brand-logo brand-logo-loading"><img src="/assets/artweb-logo.png" alt="ArtWeb OS" /></span></div>;
  if (user) return <Workspace user={user} />;

  return <main className="auth-page">
    <div className="auth-frame" data-mode={mode}>
      <section className="auth-form-side">
        <span className="brand-logo auth-brand-logo"><img src="/assets/artweb-logo.png" alt="ArtWeb OS" /></span>
        <div className="auth-card">
          {mode === 'register' && <div className="auth-mode-heading"><span>PRIMEIRO ACESSO</span><h2>Crie sua conta</h2><p>Seu workspace começa vazio e fica ligado ao seu e-mail.</p></div>}
          {notice && <div className="auth-notice"><Check />{notice}</div>}
          {error && <div className="auth-error">{error}</div>}
          <form action={submit} className="auth-form">
            {mode === 'register' && <label>Nome completo<div><UserRound /><input name="name" autoComplete="name" placeholder="Como você quer ser chamado?" required minLength={2} /></div></label>}
            <label>E-mail<div><Mail /><input name="email" type="email" autoComplete="email" placeholder="voce@exemplo.com" required /></div></label>
            <label>Senha<div><KeyRound /><input name="password" type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="Sua senha" required minLength={8} /><button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>{showPassword ? <EyeOff /> : <Eye />}</button></div></label>
            <button className="auth-submit" disabled={busy}>{busy ? 'Aguarde…' : mode === 'login' ? 'Entrar' : 'Criar conta'}</button>
          </form>
          <div className="auth-switch">{mode === 'login' ? 'Ainda não tem uma conta?' : 'Já criou sua conta?'} <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setNotice(''); }}>{mode === 'login' ? 'Cadastre-se' : 'Fazer login'}</button></div>
          <div className="auth-trust"><span />acesso seguro<span /></div>
          <div className="auth-system-label"><span className="brand-logo brand-logo-system"><img src="/assets/artweb-logo.png" alt="" /></span>ArtWeb OS</div>
        </div>
      </section>
      <aside className="auth-showcase" aria-hidden="true">
        <div className="auth-cube-orbit auth-cube-orbit-large" />
        <div className="auth-cube-orbit auth-cube-orbit-small" />
        <div className="auth-cube-stage">
          <span className="auth-cube-glow" />
          <img src="/assets/pixel-cube.png" alt="" className="auth-pixel-cube" />
        </div>
      </aside>
    </div>
  </main>;
}
