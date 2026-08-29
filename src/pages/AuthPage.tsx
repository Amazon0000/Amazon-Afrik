import { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { Logo } from '@/components/Logo';
import { AuthVisual } from '@/components/AuthVisual';
import { supabase } from '@/lib/supabase';
import { fetchPlatformStats } from '@/lib/db';
import { Mail, Lock, User as UserIcon, Store, ShoppingBag, Eye, EyeOff, ChevronRight, ShieldCheck, Globe2, Percent } from 'lucide-react';

function AuthLayout({ children, locale }: { children: React.ReactNode; locale: 'fr' | 'en' }) {
  const { navigate } = useApp();
  const [stats, setStats] = useState<{ sellers: number; products: number; countries: number } | null>(null);
  useEffect(() => { fetchPlatformStats().then(setStats); }, []);

  return (
    <div className="min-h-screen flex">
      {/* Form side */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-[#f7f3ee] overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <button onClick={() => navigate('home')} className="inline-block"><Logo size={56} /></button>
          </div>
          {children}
        </div>
      </div>

      {/* Visual side — desktop only */}
      <div className="hidden lg:block lg:w-[46%] relative overflow-hidden">
        {/* Vidéo réelle si AUTH_VISUAL_VIDEO_URL est renseignée (voir
            AuthVisual.tsx) ; repli propre sur l'illustration SVG sinon —
            jamais de lecteur vidéo cassé. */}
        <AuthVisual />
        <div className="absolute inset-0 flex flex-col justify-end p-12 text-white bg-gradient-to-t from-black/50 via-transparent to-transparent">
          <h2 className="font-display text-3xl font-bold leading-tight mb-3">
            {locale === 'fr' ? 'La marketplace premium mondiale.' : 'The world\u2019s premium marketplace.'}
          </h2>
          <p className="text-sm text-white/70 mb-8 max-w-sm">
            {locale === 'fr' ? 'Vendeurs vérifiés, paiement direct, livraison assurée par le vendeur — partout dans le monde.' : 'Verified sellers, direct payment, seller-handled delivery — worldwide.'}
          </p>
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/15">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-[#ff9633] shrink-0" />
              <div>
                <p className="text-lg font-bold leading-none">{stats ? stats.sellers.toLocaleString() : '—'}</p>
                <p className="text-[11px] text-white/60">{locale === 'fr' ? 'Vendeurs' : 'Sellers'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-[#ff9633] shrink-0" />
              <div>
                <p className="text-lg font-bold leading-none">{stats ? stats.countries : '—'}</p>
                <p className="text-[11px] text-white/60">{locale === 'fr' ? 'Pays' : 'Countries'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-[#ff9633] shrink-0" />
              <div>
                <p className="text-lg font-bold leading-none">0%</p>
                <p className="text-[11px] text-white/60">{locale === 'fr' ? 'Commission' : 'Commission'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const { t, navigate, locale, params } = useApp();
  const [isSeller, setIsSeller] = useState(mode === 'signup' && !!params.plan);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password || (mode === 'signup' && !fullName)) {
      setError(locale === 'fr' ? 'Veuillez remplir tous les champs' : 'Please fill all fields');
      return;
    }
    setSubmitting(true);
    const role = isSeller ? 'seller' : 'customer';

    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role,
              seller_plan: isSeller ? (params.plan as 'starter' | 'premium' | 'enterprise' || 'starter') : undefined,
              seller_status: isSeller ? 'pending' : undefined,
            },
          },
        });
        if (signUpError) { setError(signUpError.message); setSubmitting(false); return; }

        if (!data.session) {
          setCheckEmail(true);
          setSubmitting(false);
          return;
        }

        if (isSeller) {
          navigate('onboarding');
        } else {
          navigate('home');
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) { setError(signInError.message); setSubmitting(false); return; }

        const meta = data.user?.user_metadata || {};
        if (meta.role === 'seller') {
          navigate('seller-center');
        } else if (meta.role === 'superadmin' || meta.role === 'admin') {
          navigate('admin');
        } else {
          navigate('home');
        }
      }
    } catch {
      setError(locale === 'fr' ? 'Une erreur est survenue' : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError(locale === 'fr' ? 'Entrez votre email' : 'Enter your email'); return; }
    setSubmitting(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
    setSubmitting(false);
    if (resetError) { setError(resetError.message); return; }
    setResetSent(true);
  };

  if (checkEmail) {
    return (
      <AuthLayout locale={locale}>
        <div className="card p-7 text-center animate-fade-up">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#ff7a00]/15 flex items-center justify-center">
            <Mail className="w-6 h-6 text-[#ff7a00]" />
          </div>
          <h1 className="font-display text-xl font-bold text-[#0f172a] mb-2">
            {locale === 'fr' ? 'Vérifiez votre email' : 'Check your email'}
          </h1>
          <p className="text-sm text-[#64748b] mb-6">
            {locale === 'fr'
              ? `Un lien de confirmation a été envoyé à ${email}. Cliquez dessus pour activer votre compte, puis connectez-vous.`
              : `A confirmation link was sent to ${email}. Click it to activate your account, then log in.`}
          </p>
          <button onClick={() => navigate('login')} className="w-full btn-gold py-3 rounded-full font-semibold">
            {t.auth.loginBtn}
          </button>
        </div>
      </AuthLayout>
    );
  }

  if (forgotMode && resetSent) {
    return (
      <AuthLayout locale={locale}>
        <div className="card p-7 text-center animate-fade-up">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#ff7a00]/15 flex items-center justify-center">
            <Mail className="w-6 h-6 text-[#ff7a00]" />
          </div>
          <h1 className="font-display text-xl font-bold text-[#0f172a] mb-2">
            {locale === 'fr' ? 'Email envoyé' : 'Email sent'}
          </h1>
          <p className="text-sm text-[#64748b] mb-6">
            {locale === 'fr'
              ? `Un lien de réinitialisation a été envoyé à ${email}. Vérifiez votre boîte de réception.`
              : `A reset link has been sent to ${email}. Check your inbox.`}
          </p>
          <button onClick={() => navigate('login')} className="w-full btn-gold py-3 rounded-full font-semibold">
            {t.auth.loginBtn}
          </button>
        </div>
      </AuthLayout>
    );
  }

  if (forgotMode) {
    return (
      <AuthLayout locale={locale}>
        <div className="card p-7 animate-fade-up">
          <h1 className="font-display text-2xl font-bold text-[#0f172a] mb-1">
            {locale === 'fr' ? 'Mot de passe oublié' : 'Forgot password'}
          </h1>
          <p className="text-sm text-[#64748b] mb-6">
            {locale === 'fr' ? 'Entrez votre email pour recevoir un lien de réinitialisation' : 'Enter your email to receive a reset link'}
          </p>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{t.auth.email}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field pl-10" placeholder="awa@example.com" />
              </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button type="submit" disabled={submitting} className="w-full btn-gold py-3.5 rounded-full font-semibold disabled:opacity-50">
              {submitting ? (locale === 'fr' ? 'Envoi...' : 'Sending...') : (locale === 'fr' ? 'Envoyer le lien' : 'Send reset link')}
            </button>
          </form>
          <button onClick={() => setForgotMode(false)} className="w-full text-center text-sm text-[#64748b] hover:text-[#ff7a00] mt-4">
            {locale === 'fr' ? 'Retour à la connexion' : 'Back to login'}
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout locale={locale}>
      <div className="card p-7 animate-fade-up">
        <h1 className="font-display text-2xl font-bold text-[#0f172a] mb-1">
          {mode === 'login' ? t.auth.loginTitle : t.auth.signupTitle}
        </h1>
        <p className="text-sm text-[#64748b] mb-6">
          {mode === 'login' ? t.auth.haveAccount : t.auth.noAccount}
        </p>

        {mode === 'signup' && (
          <div className="flex gap-2 mb-5 p-1 rounded-xl bg-[#0f172a]/5">
            <button
              onClick={() => setIsSeller(false)}
              className={'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ' + (!isSeller ? 'bg-white text-[#0f172a] shadow-sm' : 'text-[#64748b]')}
            >
              <ShoppingBag className="w-4 h-4" /> {t.auth.customerAccount}
            </button>
            <button
              onClick={() => setIsSeller(true)}
              className={'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ' + (isSeller ? 'bg-white text-[#0f172a] shadow-sm' : 'text-[#64748b]')}
            >
              <Store className="w-4 h-4" /> {t.auth.sellerAccount}
            </button>
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          {mode === 'signup' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{t.auth.fullName}</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-field pl-10" placeholder="Awa Koné" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{t.auth.email}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field pl-10" placeholder="awa@example.com" />
                </div>
              </div>
            </div>
          )}
          {mode === 'login' && (
            <div>
              <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{t.auth.email}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field pl-10" placeholder="awa@example.com" />
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{t.auth.password}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="input-field pl-10 pr-10" placeholder="••••••••" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#0f172a]">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mode === 'login' && (
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 accent-[#ff7a00]" />
                <span className="text-sm text-[#0f172a]">{locale === 'fr' ? 'Se rappeler de moi' : 'Remember me'}</span>
              </label>
              <button type="button" onClick={() => setForgotMode(true)} className="text-sm text-[#ff7a00] font-semibold hover:underline">
                {locale === 'fr' ? 'Mot de passe oublié ?' : 'Forgot password?'}
              </button>
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button type="submit" disabled={submitting} className="w-full btn-gold py-3.5 rounded-full font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting
              ? (locale === 'fr' ? 'Veuillez patienter...' : 'Please wait...')
              : (mode === 'login' ? t.auth.loginBtn : t.auth.signupBtn)}
            {!submitting && <ChevronRight className="w-4 h-4" />}
          </button>
        </form>

        <p className="text-center text-sm text-[#64748b] mt-5">
          {mode === 'login' ? t.auth.noAccount : t.auth.haveAccount}{' '}
          <button onClick={() => navigate(mode === 'login' ? 'signup' : 'login')} className="font-semibold text-[#ff7a00] hover:underline">
            {mode === 'login' ? t.auth.signupBtn : t.auth.loginBtn}
          </button>
        </p>

        <div className="flex items-center justify-center gap-1.5 text-xs text-[#94a3b8] mt-5 pt-5 border-t border-[#e2e8f0]">
          <ShieldCheck className="w-3.5 h-3.5" /> {locale === 'fr' ? 'Connexion sécurisée' : 'Secure connection'}
        </div>
      </div>
    </AuthLayout>
  );
}
