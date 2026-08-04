import { useState } from 'react';
import { useApp } from '@/lib/store';
import { Logo } from '@/components/Logo';
import { supabase, isOfflineMode } from '@/lib/supabase';
import { Mail, Lock, User as UserIcon, Store, ShoppingBag, Crown } from 'lucide-react';

export function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const { t, navigate, setUser, locale, params } = useApp();
  const [isSeller, setIsSeller] = useState(mode === 'signup' && !!params.plan);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password || (mode === 'signup' && !fullName)) {
      setError(locale === 'fr' ? 'Veuillez remplir tous les champs' : 'Please fill all fields');
      return;
    }
    setSubmitting(true);
    const role = isSeller ? 'seller' : 'customer';

    if (isOfflineMode) {
      setTimeout(() => {
        const mockUser = {
          id: 'mock-user-' + Math.random().toString(36).slice(2, 6),
          email,
          fullName: mode === 'signup' ? fullName : (email.split('@')[0].toUpperCase()),
          role: role as 'customer' | 'seller',
          sellerId: role === 'seller' ? 's1' : undefined,
          sellerPlan: role === 'seller' ? ('starter' as const) : undefined,
          sellerStatus: role === 'seller' ? ('approved' as const) : undefined,
        };
        setUser(mockUser);
        setSubmitting(false);
        if (role === 'seller') {
          if (mode === 'signup') {
            navigate('onboarding');
          } else {
            navigate('seller-center');
          }
        } else {
          navigate('home');
        }
      }, 600);
      return;
    }

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
          // Email confirmation required by the Supabase project settings — no session yet.
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
        } else {
          navigate('home');
        }
      }
    } catch (err: unknown) {
      const isFetchError = err instanceof Error && (err.message.includes('fetch') || err.message.includes('Network'));
      if (isFetchError) {
        const mockUser = {
          id: 'mock-user-' + Math.random().toString(36).slice(2, 6),
          email,
          fullName: mode === 'signup' ? fullName : (email.split('@')[0].toUpperCase()),
          role: role as 'customer' | 'seller',
          sellerId: role === 'seller' ? 's1' : undefined,
          sellerPlan: role === 'seller' ? ('starter' as const) : undefined,
          sellerStatus: role === 'seller' ? ('approved' as const) : undefined,
        };
        setUser(mockUser);
        if (role === 'seller') {
          if (mode === 'signup') navigate('onboarding');
          else navigate('seller-center');
        } else {
          navigate('home');
        }
      } else {
        setError(locale === 'fr' ? 'Une erreur est survenue' : 'Something went wrong');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const loginAsAdmin = () => {
    setUser({ id: 'admin-1', email: 'admin@zando.africa', fullName: 'Admin Zando', role: 'superadmin' });
    navigate('admin');
  };

  if (checkEmail) {
    return (
      <div className="motif-bg min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <button onClick={() => navigate('home')} className="inline-block"><Logo size={56} /></button>
          </div>
          <div className="card p-7 text-center animate-fade-up">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#0e9f6e]/15 flex items-center justify-center">
              <Mail className="w-6 h-6 text-[#0e9f6e]" />
            </div>
            <h1 className="font-display text-xl font-bold text-[#0f172a] mb-2">
              {locale === 'fr' ? 'Vérifiez votre email' : 'Check your email'}
            </h1>
            <p className="text-sm text-[#64748b] mb-6">
              {locale === 'fr'
                ? `Un lien de confirmation a été envoyé à ${email}. Cliquez dessus pour activer votre compte, puis connectez-vous.`
                : `A confirmation link was sent to ${email}. Click it to activate your account, then log in.`}
            </p>
            <button onClick={() => navigate('login')} className="w-full btn-gold py-3 rounded-xl font-semibold">
              {t.auth.loginBtn}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="motif-bg min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <button onClick={() => navigate('home')} className="inline-block"><Logo size={56} /></button>
        </div>

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
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${!isSeller ? 'bg-white text-[#0f172a] shadow-sm' : 'text-[#64748b]'}`}
              >
                <ShoppingBag className="w-4 h-4" /> {t.auth.customerAccount}
              </button>
              <button
                onClick={() => setIsSeller(true)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${isSeller ? 'bg-white text-[#0f172a] shadow-sm' : 'text-[#64748b]'}`}
              >
                <Store className="w-4 h-4" /> {t.auth.sellerAccount}
              </button>
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{t.auth.fullName}</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-field pl-10" placeholder="Awa Koné" />
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{t.auth.email}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field pl-10" placeholder="awa@example.com" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{t.auth.password}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field pl-10" placeholder="••••••••" />
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button type="submit" disabled={submitting} className="w-full btn-gold py-3.5 rounded-xl font-semibold disabled:opacity-50">
              {submitting
                ? (locale === 'fr' ? 'Veuillez patienter...' : 'Please wait...')
                : (mode === 'login' ? t.auth.loginBtn : t.auth.signupBtn)}
            </button>
          </form>

          {mode === 'login' && (
            <div className="mt-4 pt-4 border-t border-[#0e9f6e]/20">
              <button onClick={loginAsAdmin} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium border border-[#0f172a]/15 text-[#0f172a] hover:bg-[#0f172a]/5 transition-colors">
                <Crown className="w-4 h-4 text-[#0e9f6e]" /> {locale === 'fr' ? 'Connexion Super Admin' : 'Super Admin login'}
              </button>
            </div>
          )}

          <p className="text-center text-sm text-[#64748b] mt-5">
            {mode === 'login' ? t.auth.noAccount : t.auth.haveAccount}{' '}
            <button onClick={() => navigate(mode === 'login' ? 'signup' : 'login')} className="font-semibold text-[#0e9f6e] hover:underline">
              {mode === 'login' ? t.auth.signupBtn : t.auth.loginBtn}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
