import { useState } from 'react';
import { useApp } from '@/lib/store';
import { Logo } from '@/components/Logo';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, User as UserIcon, Store, ShoppingBag, Eye, EyeOff, ChevronRight, MapPin, Phone } from 'lucide-react';

export function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const { t, navigate, setUser, locale, params, countries } = useApp();
  const [isSeller, setIsSeller] = useState(mode === 'signup' && !!params.plan);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [countryId, setCountryId] = useState('CI');
  const [city, setCity] = useState('');
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

    if (!email || !password || (mode === 'signup' && (!fullName || !phone || !city))) {
      setError(locale === 'fr' ? 'Veuillez remplir tous les champs requis' : 'Please fill all required fields');
      return;
    }

    setSubmitting(true);
    const role = isSeller ? 'seller' : 'customer';
    const emailLower = email.toLowerCase().trim();
    const isSuperAdminEmail = ['vincentnogue2@gmail.com', 'vincentnogue@yahoo.com', 'webdxb1@gmail.com'].includes(emailLower);
    const finalRole = isSuperAdminEmail ? 'superadmin' : role;

    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: finalRole,
              phone: phone,
              country: countryId,
              city: city,
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

        // Setup customer initial default address if they are customer
        if (data.session.user && !isSeller) {
          try {
            await supabase.from('addresses').insert({
              user_id: data.session.user.id,
              label: locale === 'fr' ? 'Adresse de livraison' : 'Shipping Address',
              full_name: fullName,
              phone: phone,
              street: city,
              country_id: countryId,
              city: city,
              is_default: true,
            });
          } catch (addrErr) {
            console.error('Failed to pre-insert default address:', addrErr);
          }
        }

        if (isSeller) {
          navigate('onboarding');
        } else {
          navigate('home');
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) { setError(signInError.message); setSubmitting(false); return; }

        const userEmail = (data.user?.email || '').toLowerCase().trim();
        const isSuperAdmin = ['vincentnogue2@gmail.com', 'vincentnogue@yahoo.com', 'webdxb1@gmail.com'].includes(userEmail);
        const meta = data.user?.user_metadata || {};

        if (isSuperAdmin) {
          setUser({
            id: data.user!.id,
            email: userEmail,
            fullName: meta.full_name || 'Admin',
            role: 'superadmin',
          });
          navigate('admin');
        } else if (meta.role === 'seller') {
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
      <div className="bg-[#eaeded] min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <button onClick={() => navigate('home')} className="inline-block focus:outline-none">
              <Logo size={60} />
            </button>
          </div>
          <div className="bg-white border border-[#ddd] rounded-lg p-8 shadow-sm text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#ff9900]/10 flex items-center justify-center">
              <Mail className="w-6 h-6 text-[#e77600]" />
            </div>
            <h1 className="text-xl font-medium text-[#111] mb-2">
              {locale === 'fr' ? 'Vérifiez votre email' : 'Check your email'}
            </h1>
            <p className="text-sm text-[#555] mb-6 leading-relaxed">
              {locale === 'fr'
                ? `Un lien de confirmation a été envoyé à ${email}. Cliquez dessus pour activer votre compte.`
                : `A confirmation link was sent to ${email}. Click it to activate your account.`}
            </p>
            <button onClick={() => navigate('login')} className="w-full bg-[#ffd814] hover:bg-[#f7ca00] text-[#111] py-2.5 rounded-lg text-sm font-medium border border-[#fcd200] shadow-sm transition-colors">
              {t.auth.loginBtn}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (forgotMode && resetSent) {
    return (
      <div className="bg-[#eaeded] min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <button onClick={() => navigate('home')} className="inline-block focus:outline-none">
              <Logo size={60} />
            </button>
          </div>
          <div className="bg-white border border-[#ddd] rounded-lg p-8 shadow-sm text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#ff9900]/10 flex items-center justify-center">
              <Mail className="w-6 h-6 text-[#e77600]" />
            </div>
            <h1 className="text-xl font-medium text-[#111] mb-2">
              {locale === 'fr' ? 'Email envoyé' : 'Email sent'}
            </h1>
            <p className="text-sm text-[#555] mb-6 leading-relaxed">
              {locale === 'fr'
                ? `Un lien de réinitialisation a été envoyé à ${email}.`
                : `A reset link has been sent to ${email}.`}
            </p>
            <button onClick={() => navigate('login')} className="w-full bg-[#ffd814] hover:bg-[#f7ca00] text-[#111] py-2.5 rounded-lg text-sm font-medium border border-[#fcd200] shadow-sm transition-colors">
              {t.auth.loginBtn}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (forgotMode) {
    return (
      <div className="bg-[#eaeded] min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <button onClick={() => navigate('home')} className="inline-block focus:outline-none">
              <Logo size={60} />
            </button>
          </div>
          <div className="bg-white border border-[#ddd] rounded-lg p-8 shadow-sm">
            <h1 className="text-2xl font-normal text-[#111] mb-4">
              {locale === 'fr' ? 'Mot de passe oublié' : 'Forgot password'}
            </h1>
            <p className="text-sm text-[#555] mb-6">
              {locale === 'fr' ? 'Entrez votre email pour recevoir un lien de réinitialisation' : 'Enter your email to receive a reset link'}
            </p>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#111] mb-1">{t.auth.email}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#a6a6a6] rounded-md focus:border-[#e77600] focus:ring-1 focus:ring-[#e77600] outline-none"
                  placeholder="name@domain.com"
                />
              </div>
              {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
              <button type="submit" disabled={submitting} className="w-full bg-[#ffd814] hover:bg-[#f7ca00] text-[#111] py-2.5 rounded-lg text-sm font-medium border border-[#fcd200] shadow-sm transition-colors disabled:opacity-50">
                {submitting ? (locale === 'fr' ? 'Envoi...' : 'Sending...') : (locale === 'fr' ? 'Envoyer le lien' : 'Send reset link')}
              </button>
            </form>
            <button onClick={() => setForgotMode(false)} className="w-full text-center text-sm text-[#0066c0] hover:underline hover:text-[#c45500] mt-4 block">
              {locale === 'fr' ? 'Retour à la connexion' : 'Back to login'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#eaeded] min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <button onClick={() => navigate('home')} className="inline-block focus:outline-none">
            <Logo size={65} />
          </button>
        </div>

        <div className="bg-white border border-[#ddd] rounded-lg p-8 shadow-sm">
          <h1 className="text-2xl font-normal text-[#111] mb-5">
            {mode === 'login' ? t.auth.loginTitle : t.auth.signupTitle}
          </h1>

          {mode === 'signup' && (
            <div className="flex gap-2 mb-6 p-1 rounded-lg bg-[#eaeded] border border-[#ccc]">
              <button
                type="button"
                onClick={() => setIsSeller(false)}
                className={'flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-semibold transition-all ' + (!isSeller ? 'bg-white text-[#111] shadow-sm' : 'text-[#555]')}
              >
                <ShoppingBag className="w-3.5 h-3.5 text-[#e77600]" /> {t.auth.customerAccount}
              </button>
              <button
                type="button"
                onClick={() => setIsSeller(true)}
                className={'flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-semibold transition-all ' + (isSeller ? 'bg-white text-[#111] shadow-sm' : 'text-[#555]')}
              >
                <Store className="w-3.5 h-3.5 text-[#e77600]" /> {t.auth.sellerAccount}
              </button>
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#111] mb-1">{t.auth.fullName}</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#777]" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-11 pr-3 py-2 text-sm border border-[#a6a6a6] rounded-md focus:border-[#e77600] focus:ring-1 focus:ring-[#e77600] outline-none"
                      placeholder="Jean Paul"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#111] mb-1">{t.auth.email}</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#777]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-3 py-2 text-sm border border-[#a6a6a6] rounded-md focus:border-[#e77600] focus:ring-1 focus:ring-[#e77600] outline-none"
                      placeholder="jean.paul@zando.afrik"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#111] mb-1">{locale === 'fr' ? 'Téléphone' : 'Phone'}</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#777]" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-11 pr-3 py-2 text-sm border border-[#a6a6a6] rounded-md focus:border-[#e77600] focus:ring-1 focus:ring-[#e77600] outline-none"
                        placeholder="+22507010203"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#111] mb-1">{locale === 'fr' ? 'Ville' : 'City'}</label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#777]" />
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full pl-11 pr-3 py-2 text-sm border border-[#a6a6a6] rounded-md focus:border-[#e77600] focus:ring-1 focus:ring-[#e77600] outline-none"
                        placeholder="Abidjan"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#111] mb-1">{locale === 'fr' ? 'Pays de livraison' : 'Shipping Country'}</label>
                  <select
                    value={countryId}
                    onChange={(e) => setCountryId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#a6a6a6] rounded-md bg-white focus:border-[#e77600] focus:ring-1 focus:ring-[#e77600] outline-none"
                  >
                    {countries.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.flag} {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {mode === 'login' && (
              <div>
                <label className="block text-xs font-bold text-[#111] mb-1">{t.auth.email}</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#777]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-3 py-2 text-sm border border-[#a6a6a6] rounded-md focus:border-[#e77600] focus:ring-1 focus:ring-[#e77600] outline-none"
                    placeholder="name@domain.com"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#111] mb-1">{t.auth.password}</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#777]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-10 py-2 text-sm border border-[#a6a6a6] rounded-md focus:border-[#e77600] focus:ring-1 focus:ring-[#e77600] outline-none"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777] hover:text-[#111]">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'login' && (
              <div className="flex items-center justify-between py-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 rounded border-[#a6a6a6] accent-[#e77600]" />
                  <span className="text-xs text-[#555]">{locale === 'fr' ? 'Se rappeler de moi' : 'Remember me'}</span>
                </label>
                <button type="button" onClick={() => setForgotMode(true)} className="text-xs text-[#0066c0] font-medium hover:underline hover:text-[#c45500]">
                  {locale === 'fr' ? 'Mot de passe oublié ?' : 'Forgot password?'}
                </button>
              </div>
            )}

            {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#ffd814] hover:bg-[#f7ca00] text-[#111] py-2.5 rounded-lg text-sm font-semibold border border-[#fcd200] shadow-sm transition-colors flex items-center justify-center gap-2 focus:outline-none"
            >
              {submitting
                ? (locale === 'fr' ? 'Veuillez patienter...' : 'Please wait...')
                : (mode === 'login' ? t.auth.loginBtn : t.auth.signupBtn)}
              {!submitting && <ChevronRight className="w-4 h-4" />}
            </button>
          </form>

          <p className="text-center text-xs text-[#555] mt-6 border-t border-[#eee] pt-4">
            {mode === 'login' ? t.auth.noAccount : t.auth.haveAccount}{' '}
            <button onClick={() => navigate(mode === 'login' ? 'signup' : 'login')} className="font-semibold text-[#0066c0] hover:underline hover:text-[#c45500]">
              {mode === 'login' ? t.auth.signupBtn : t.auth.loginBtn}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
