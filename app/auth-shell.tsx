'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Check, Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react';
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
      const result = await response.json();
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

  if (checking) return <div className="auth-loading"><span className="brand-mark">a</span><strong>artweb<span>.so</span></strong></div>;
  if (user) return <Workspace user={user} />;

  return <main className="auth-page">
    <section className="auth-showcase">
      <div className="auth-brand"><span className="brand-mark">a</span><strong>artweb<span>.so</span></strong></div>
      <div className="auth-copy"><span>SEU ESPAÇO CRIATIVO</span><h1>Ideias ganham forma quando tudo está no lugar.</h1><p>Projetos, tarefas e arquivos reunidos em um workspace simples, privado e feito para você.</p></div>
      <div className="auth-benefits"><span><Check />Workspace pessoal e vazio</span><span><Check />Dados salvos na sua conta</span><span><Check />Acesso protegido por senha</span></div>
      <img src="/assets/A2-cubo.png" alt="" className="auth-art" />
    </section>
    <section className="auth-form-side">
      <div className="auth-card">
        <div className="auth-mobile-brand"><span className="brand-mark">a</span><strong>artweb<span>.so</span></strong></div>
        <span className="auth-eyebrow">{mode === 'login' ? 'BEM-VINDO DE VOLTA' : 'PRIMEIRO ACESSO'}</span>
        <h2>{mode === 'login' ? 'Entre na sua conta' : 'Crie seu workspace'}</h2>
        <p>{mode === 'login' ? 'Use os dados cadastrados para continuar.' : 'Comece do zero. Você poderá entrar logo depois.'}</p>
        {notice && <div className="auth-notice"><Check />{notice}</div>}
        {error && <div className="auth-error">{error}</div>}
        <form action={submit} className="auth-form">
          {mode === 'register' && <label>Nome completo<div><UserRound /><input name="name" autoComplete="name" placeholder="Como você quer ser chamado?" required minLength={2} /></div></label>}
          <label>E-mail<div><Mail /><input name="email" type="email" autoComplete="email" placeholder="voce@exemplo.com" required /></div></label>
          <label>Senha<div><LockKeyhole /><input name="password" type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="Mínimo de 8 caracteres" required minLength={8} /><button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>{showPassword ? <EyeOff /> : <Eye />}</button></div></label>
          <button className="auth-submit" disabled={busy}>{busy ? 'Aguarde…' : mode === 'login' ? 'Entrar no workspace' : 'Criar minha conta'}<ArrowRight /></button>
        </form>
        <div className="auth-switch">{mode === 'login' ? 'Ainda não tem uma conta?' : 'Já criou sua conta?'} <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setNotice(''); }}>{mode === 'login' ? 'Cadastre-se' : 'Fazer login'}</button></div>
      </div>
    </section>
  </main>;
}
