import { useState } from 'react';
import { useApp } from '@/lib/store';
import { Logo } from '@/components/Logo';
import { supabase } from '@/lib/supabase';
import { UploadCloud, Check, ChevronRight, ChevronLeft, ShieldCheck, Building2, MapPin, FileCheck, Store, Banknote, CreditCard, Truck, User, Phone, Mail, Lock, Wallet, Sparkles, CheckCircle } from 'lucide-react';
import { uploadSellerAsset, uploadSellerKycDocument, createSellerDocument } from '@/lib/db';

type PaymentMethod = {
  id: string;
  label: string;
  desc: string;
  icon: typeof Wallet;
};

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'mobile_money', label: 'Mobile Money', desc: 'Orange Money, MTN MoMo, Wave, M-Pesa', icon: Wallet },
  { id: 'payunit', label: 'PayUnit', desc: 'MTN MoMo, Orange Money — Afrique centrale', icon: Wallet },
  { id: 'paystack', label: 'Paystack', desc: 'Cartes bancaires locales & internationales', icon: CreditCard },
  { id: 'flutterwave', label: 'Flutterwave', desc: 'Paiement transfrontalier Afrique', icon: CreditCard },
  { id: 'cinetpay', label: 'CinetPay', desc: 'Mobile Money & cartes — Afrique de l\'Ouest', icon: CreditCard },
  { id: 'stripe', label: 'Stripe', desc: 'Cartes Visa, Mastercard, Amex', icon: CreditCard },
  { id: 'paypal', label: 'PayPal', desc: 'Paiement international', icon: CreditCard },
  { id: 'razorpay', label: 'Razorpay', desc: 'Cartes, UPI — Inde', icon: CreditCard },
  { id: 'bank_transfer', label: 'Virement bancaire', desc: 'Virement direct sur votre compte', icon: Banknote },
];

export function OnboardingPage() {
  const { t, navigate, locale, countries, setUser, loadingReference, params } = useApp();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    email: '', password: '', phone: '',
    countryId: '', businessType: 'company',
    businessName: '', registrationNumber: '', vatNumber: '', businessCategory: '', businessAddress: '',
    idType: 'passport', idFront: null as File | null, idBack: null as File | null, selfie: null as File | null,
    bankName: '', iban: '', swift: '', mobileMoney: '',
    storeName: '', storeSlug: '', storeLogo: null as File | null, storeBanner: null as File | null, storeDesc: '', socialFacebook: '', socialInstagram: '',
    warehouseAddress: '', shippingZone: '',
    shipNational: true, shipInternational: false, shipExpress: true, shipLocal: true, shipPickup: false,
    selectedPayments: ['mobile_money', 'paystack'] as string[],
    paymentDetails: {} as Record<string, string>,
    plan: (params.plan as string) || 'starter',
  });
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const steps = [
    { num: 1, label: locale === 'fr' ? 'Compte' : 'Account', icon: User },
    { num: 2, label: t.onboarding.country, icon: MapPin },
    { num: 3, label: locale === 'fr' ? 'Entreprise' : 'Business', icon: Building2 },
    { num: 4, label: locale === 'fr' ? 'Identité' : 'Identity', icon: ShieldCheck },
    { num: 5, label: locale === 'fr' ? 'Boutique' : 'Store', icon: Store },
    { num: 6, label: locale === 'fr' ? 'Paiement' : 'Payment', icon: CreditCard },
    { num: 7, label: locale === 'fr' ? 'Livraison' : 'Shipping', icon: Truck },
    { num: 8, label: locale === 'fr' ? 'Révision' : 'Review', icon: FileCheck },
    { num: 9, label: locale === 'fr' ? 'Terminé' : 'Done', icon: CheckCircle },
  ];

  const canProceed = () => {
    if (step === 1) return form.email && form.password && form.phone;
    if (step === 2) return !!form.countryId;
    if (step === 3) return form.businessName && form.registrationNumber;
    if (step === 4) return form.idFront && form.idBack && form.selfie;
    if (step === 5) return form.storeName && form.storeSlug;
    if (step === 6) return form.selectedPayments.length > 0 && (form.bankName || form.mobileMoney || form.selectedPayments.includes('mobile_money'));
    if (step === 7) return form.warehouseAddress;
    return true;
  };

  const togglePayment = (id: string) => {
    setForm((prev) => ({
      ...prev,
      selectedPayments: prev.selectedPayments.includes(id)
        ? prev.selectedPayments.filter((p) => p !== id)
        : [...prev.selectedPayments, id],
    }));
  };

  const submit = async () => {
    setSubmitting(true);
    setError('');

    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.storeName || form.businessName,
            role: 'seller',
            seller_plan: form.plan,
            seller_status: 'pending',
            phone: form.phone,
          },
        },
      });

      if (signUpError) { setError(signUpError.message); setSubmitting(false); return; }

      const userId = signUpData.user?.id;
      if (!userId) { setError(locale === 'fr' ? 'Erreur: pas de user ID' : 'Error: no user ID'); setSubmitting(false); return; }

      const { data: sellerData, error: sellerError } = await supabase.from('sellers').insert({
        user_id: userId,
        business_name: form.businessName,
        business_type: form.businessType,
        registration_number: form.registrationNumber,
        vat_number: form.vatNumber || null,
        business_address: form.businessAddress || null,
        country_id: form.countryId || null,
        store_name: form.storeName,
        store_slug: form.storeSlug,
        store_description: form.storeDesc || null,
        warehouse_address: form.warehouseAddress || null,
        shipping_zone: form.shippingZone || null,
        bank_name: form.bankName || null,
        iban: form.iban || null,
        swift: form.swift || null,
        mobile_money: form.mobileMoney || null,
        ship_national: form.shipNational,
        ship_international: form.shipInternational,
        ship_express: form.shipExpress,
        ship_local: form.shipLocal,
        ship_pickup: form.shipPickup,
        plan: form.plan,
        plan_selected: form.plan,
        subscription_status: 'trial',
        trial_starts_at: new Date().toISOString(),
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
      }).select('id').single();

      if (sellerError) { setError(sellerError.message); setSubmitting(false); return; }

      const sellerId = sellerData.id;

      // Real uploads now that we have an authenticated user + sellerId to own the files.
      setUploadingDocs(true);
      const [idFrontPath, idBackPath, selfiePath, logoUrl, bannerUrl] = await Promise.all([
        form.idFront ? uploadSellerKycDocument(form.idFront, sellerId, 'id_front') : Promise.resolve(null),
        form.idBack ? uploadSellerKycDocument(form.idBack, sellerId, 'id_back') : Promise.resolve(null),
        form.selfie ? uploadSellerKycDocument(form.selfie, sellerId, 'selfie') : Promise.resolve(null),
        form.storeLogo ? uploadSellerAsset(form.storeLogo, sellerId, 'logo') : Promise.resolve(null),
        form.storeBanner ? uploadSellerAsset(form.storeBanner, sellerId, 'banner') : Promise.resolve(null),
      ]);
      setUploadingDocs(false);

      await Promise.all([
        idFrontPath ? createSellerDocument({ sellerId, docType: 'id_front', fileUrl: idFrontPath, fileName: form.idFront?.name }) : Promise.resolve(),
        idBackPath ? createSellerDocument({ sellerId, docType: 'id_back', fileUrl: idBackPath, fileName: form.idBack?.name }) : Promise.resolve(),
        selfiePath ? createSellerDocument({ sellerId, docType: 'selfie', fileUrl: selfiePath, fileName: form.selfie?.name }) : Promise.resolve(),
      ]);

      if (logoUrl || bannerUrl || selfiePath) {
        await supabase.from('sellers').update({
          ...(logoUrl ? { store_logo_url: logoUrl } : {}),
          ...(bannerUrl ? { store_banner_url: bannerUrl } : {}),
          ...(selfiePath ? { identity_selfie_url: selfiePath } : {}),
        }).eq('id', sellerId);
      }

      await supabase.from('seller_payment_methods').insert(
        form.selectedPayments.map((pid) => ({
          seller_id: sellerId,
          provider_name: pid,
          provider_type: pid === 'bank_transfer' ? 'bank' : pid === 'mobile_money' ? 'mobile_money' : 'card',
          is_active: true,
          is_verified: false,
        }))
      );

      setUser({
        id: userId,
        email: form.email,
        fullName: form.storeName || form.businessName,
        role: 'seller',
        sellerId,
        sellerPlan: form.plan as 'starter' | 'premium' | 'enterprise',
        sellerStatus: 'pending',
      });

      setSubmitted(true);
    } catch {
      setError(locale === 'fr' ? 'Une erreur est survenue' : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="motif-bg min-h-screen flex items-center justify-center px-4">
        <div className="card p-8 max-w-md text-center animate-fade-up">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#ff7a00]/15 flex items-center justify-center pulse-gold">
            <CheckCircle className="w-8 h-8 text-[#ff7a00]" />
          </div>
          <h2 className="font-display text-2xl font-bold text-[#0f172a] mb-2">
            {locale === 'fr' ? 'Bienvenue sur Zando !' : 'Welcome to Zando!'}
          </h2>
          <p className="text-sm text-[#64748b] mb-4">
            {locale === 'fr'
              ? 'Votre compte vendeur a été créé. Vous bénéficiez de 14 jours gratuits pour essayer la plateforme.'
              : 'Your seller account has been created. You get 14 days free to try the platform.'}
          </p>
          <div className="p-4 rounded-xl bg-[#ff7a00]/10 mb-4 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-[#ff7a00] shrink-0" />
            <p className="text-xs text-[#0f172a] text-left">
              {locale === 'fr'
                ? 'Pendant 14 jours, accédez à toutes les fonctionnalités. Après cette période, un abonnement est requis pour continuer à vendre.'
                : 'For 14 days, access all features. After this period, a subscription is required to continue selling.'}
            </p>
          </div>
          <p className="text-xs text-[#64748b] mb-6">
            {locale === 'fr' ? 'Nos équipes vérifient votre dossier sous 48h.' : 'Our team reviews your application within 48h.'}
          </p>
          <button onClick={() => navigate('seller-center')} className="w-full btn-gold py-3 rounded-xl font-semibold">
            {t.nav.sellerCenter}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="motif-bg min-h-screen">
      <header className="sticky top-0 z-50 bg-[#0f172a] safe-top">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => navigate('sell')}><Logo size={40} variant="light" /></button>
          <button onClick={() => navigate('home')} className="text-sm text-[#f7f8fa]/60 hover:text-[#ff7a00]">
            {locale === 'fr' ? 'Retour à la boutique' : 'Back to store'}
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center mb-6">
          <h1 className="font-display text-2xl font-bold text-[#0f172a]">{t.onboarding.title}</h1>
          <p className="text-sm text-[#64748b] mt-1">{t.onboarding.step} {step} {t.onboarding.of} {steps.length}</p>
        </div>

        {/* 14-day trial banner */}
        <div className="card p-4 mb-6 flex items-center gap-3 bg-gradient-to-r from-[#ff7a00]/10 to-[#ff7a00]/10 border-[#ff7a00]/20">
          <Sparkles className="w-5 h-5 text-[#ff7a00] shrink-0" />
          <div>
            <p className="text-sm font-semibold text-[#0f172a]">
              {locale === 'fr' ? '14 jours gratuits — aucune carte requise' : '14 days free — no card required'}
            </p>
            <p className="text-xs text-[#64748b]">
              {locale === 'fr' ? 'Aucun paiement pendant l\'onboarding. Payez seulement après votre essai.' : 'No payment during onboarding. Pay only after your trial.'}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center justify-between mb-8 overflow-x-auto no-scrollbar">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center flex-1 last:flex-none min-w-[40px]">
              <div className="flex flex-col items-center">
                <div className={'w-8 h-8 rounded-full flex items-center justify-center transition-all ' + (step >= s.num ? 'bg-[#ff7a00] text-[#0f172a]' : 'bg-white border border-[#0f172a]/15 text-[#64748b]/40')}>
                  {step > s.num ? <Check className="w-4 h-4" /> : <s.icon className="w-3.5 h-3.5" />}
                </div>
              </div>
              {i < steps.length - 1 && <div className={'h-0.5 flex-1 mx-1 rounded ' + (step > s.num ? 'bg-[#ff7a00]' : 'bg-[#0f172a]/10')} />}
            </div>
          ))}
        </div>

        <div className="card p-6 sm:p-8 animate-fade-up">
          {/* Step 1: Account */}
          {step === 1 && (
            <div>
              <h2 className="font-display text-xl font-bold text-[#0f172a] mb-1">
                {locale === 'fr' ? 'Créer votre compte vendeur' : 'Create your seller account'}
              </h2>
              <p className="text-sm text-[#64748b] mb-5">{locale === 'fr' ? 'Vos informations de connexion sécurisées' : 'Your secure login information'}</p>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input icon={Mail} label={t.auth.email} value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" placeholder="you@example.com" />
                  <Input icon={Phone} label={t.account.phone} value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="+225 07 00 00 00" />
                </div>
                <Input icon={Lock} label={t.auth.password} value={form.password} onChange={(v) => setForm({ ...form, password: v })} type="password" placeholder="••••••••" />
                <div className="p-3 rounded-xl bg-[#ff7a00]/10 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#ff7a00]" />
                  <span className="text-xs text-[#64748b]">{locale === 'fr' ? 'Vos données sont chiffrées et sécurisées' : 'Your data is encrypted and secure'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Country */}
          {step === 2 && (
            <div>
              <h2 className="font-display text-xl font-bold text-[#0f172a] mb-1">{t.onboarding.selectCountry}</h2>
              <p className="text-sm text-[#64748b] mb-5">{locale === 'fr' ? 'Sélectionnez votre pays d\'activité' : 'Select your country of operation'}</p>
              {loadingReference && <p className="text-sm text-[#64748b]">{locale === 'fr' ? 'Chargement...' : 'Loading...'}</p>}
              {!loadingReference && countries.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[400px] overflow-y-auto">
                  {countries.map((c) => (
                    <button key={c.id} onClick={() => setForm({ ...form, countryId: c.id })}
                      className={'p-3 rounded-xl border-2 text-left transition-all ' + (form.countryId === c.id ? 'border-[#ff7a00] bg-[#ff7a00]/5' : 'border-[#0f172a]/10 hover:border-[#ff7a00]/50')}>
                      <span className="text-2xl mr-1">{c.flag}</span>
                      <span className="text-sm font-medium text-[#0f172a]">{c.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Business Info */}
          {step === 3 && (
            <div>
              <h2 className="font-display text-xl font-bold text-[#0f172a] mb-1">{locale === 'fr' ? 'Informations entreprise' : 'Business information'}</h2>
              <p className="text-sm text-[#64748b] mb-5">{locale === 'fr' ? 'Détails légaux de votre entreprise' : 'Legal details of your business'}</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{locale === 'fr' ? 'Type d\'entreprise' : 'Business type'}</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'company', label: locale === 'fr' ? 'Entreprise' : 'Company' },
                      { id: 'individual', label: locale === 'fr' ? 'Individuel' : 'Individual' },
                      { id: 'ngo', label: 'NGO' },
                    ].map((b) => (
                      <button key={b.id} onClick={() => setForm({ ...form, businessType: b.id })}
                        className={'px-3 py-2 text-xs rounded-lg border-2 transition-all ' + (form.businessType === b.id ? 'border-[#ff7a00] bg-[#ff7a00]/5 text-[#0f172a] font-semibold' : 'border-[#0f172a]/15 text-[#0f172a]')}>
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label={t.onboarding.companyName} value={form.businessName} onChange={(v) => setForm({ ...form, businessName: v })} placeholder="Maison Baoulé SARL" />
                  <Input label={t.onboarding.companyNumber} value={form.registrationNumber} onChange={(v) => setForm({ ...form, registrationNumber: v })} placeholder="CI-ABJ-2024-B-12345" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label={t.onboarding.vatNumber} value={form.vatNumber} onChange={(v) => setForm({ ...form, vatNumber: v })} placeholder="1234567" />
                  <Input label={locale === 'fr' ? 'Adresse' : 'Address'} value={form.businessAddress} onChange={(v) => setForm({ ...form, businessAddress: v })} placeholder="Cocody, Abidjan" />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Identity */}
          {step === 4 && (
            <div>
              <h2 className="font-display text-xl font-bold text-[#0f172a] mb-1">{locale === 'fr' ? 'Vérification d\'identité (KYC)' : 'Identity verification (KYC)'}</h2>
              <p className="text-sm text-[#64748b] mb-5">{locale === 'fr' ? 'Téléversez vos documents — JPG, PNG, PDF' : 'Upload your documents — JPG, PNG, PDF'}</p>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{locale === 'fr' ? 'Type de pièce' : 'ID type'}</label>
                <div className="flex gap-2">
                  {['passport', 'national_id', 'driving_license'].map((id) => (
                    <button key={id} onClick={() => setForm({ ...form, idType: id })}
                      className={'px-3 py-2 text-xs rounded-lg border-2 transition-all ' + (form.idType === id ? 'border-[#ff7a00] bg-[#ff7a00]/5 text-[#0f172a] font-semibold' : 'border-[#0f172a]/15 text-[#0f172a]')}>
                      {id === 'passport' ? (locale === 'fr' ? 'Passeport' : 'Passport') : id === 'national_id' ? (locale === 'fr' ? 'CNI' : 'National ID') : (locale === 'fr' ? 'Permis' : 'License')}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <UploadField label={t.onboarding.idFront} value={form.idFront} onChange={(v) => setForm({ ...form, idFront: v })} />
                <UploadField label={t.onboarding.idBack} value={form.idBack} onChange={(v) => setForm({ ...form, idBack: v })} />
                <UploadField label={locale === 'fr' ? 'Selfie de vérification' : 'Selfie verification'} value={form.selfie} onChange={(v) => setForm({ ...form, selfie: v })} />
              </div>
            </div>
          )}

          {/* Step 5: Store */}
          {step === 5 && (
            <div>
              <h2 className="font-display text-xl font-bold text-[#0f172a] mb-1">{locale === 'fr' ? 'Configurez votre boutique' : 'Set up your store'}</h2>
              <p className="text-sm text-[#64748b] mb-5">{locale === 'fr' ? 'L\'apparence de votre boutique sur Zando' : 'Your store appearance on Zando'}</p>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label={locale === 'fr' ? 'Nom de la boutique' : 'Store name'} value={form.storeName} onChange={(v) => setForm({ ...form, storeName: v })} placeholder="Maison Baoulé" />
                  <Input label="URL" value={form.storeSlug} onChange={(v) => setForm({ ...form, storeSlug: v })} placeholder="maison-baoule" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{locale === 'fr' ? 'Description' : 'Description'}</label>
                  <textarea value={form.storeDesc} onChange={(e) => setForm({ ...form, storeDesc: e.target.value })} className="input-field" rows={3} placeholder={locale === 'fr' ? 'Décrivez votre boutique...' : 'Describe your store...'} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <UploadField label={locale === 'fr' ? 'Logo (512x512)' : 'Logo (512x512)'} value={form.storeLogo} onChange={(v) => setForm({ ...form, storeLogo: v })} />
                  <UploadField label={locale === 'fr' ? 'Bannière (1920x600)' : 'Banner (1920x600)'} value={form.storeBanner} onChange={(v) => setForm({ ...form, storeBanner: v })} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="Facebook" value={form.socialFacebook} onChange={(v) => setForm({ ...form, socialFacebook: v })} placeholder="https://facebook.com/..." />
                  <Input label="Instagram" value={form.socialInstagram} onChange={(v) => setForm({ ...form, socialInstagram: v })} placeholder="https://instagram.com/..." />
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Payment — seller configures how they receive money */}
          {step === 6 && (
            <div>
              <h2 className="font-display text-xl font-bold text-[#0f172a] mb-1">
                {locale === 'fr' ? 'Configurez votre moyen de paiement' : 'Configure your payment method'}
              </h2>
              <p className="text-sm text-[#64748b] mb-5">
                {locale === 'fr'
                  ? 'Configurez comment vous recevez l\'argent de vos ventes. Les acheteurs paient directement chez vous.'
                  : 'Configure how you receive money from sales. Buyers pay directly to you.'}
              </p>
              <div className="space-y-3">
                {PAYMENT_METHODS.map((pm) => {
                  const selected = form.selectedPayments.includes(pm.id);
                  return (
                    <div key={pm.id}>
                      <button onClick={() => togglePayment(pm.id)}
                        className={'w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 ' + (selected ? 'border-[#ff7a00] bg-[#ff7a00]/5' : 'border-[#0f172a]/10 hover:border-[#ff7a00]/50')}>
                        <div className={'w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ' + (selected ? 'bg-[#ff7a00]/15' : 'bg-[#0f172a]/5')}>
                          <pm.icon className={'w-5 h-5 ' + (selected ? 'text-[#ff7a00]' : 'text-[#64748b]')} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-[#0f172a]">{pm.label}</p>
                          <p className="text-xs text-[#64748b]">{pm.desc}</p>
                        </div>
                        <div className={'w-5 h-5 rounded-full border-2 flex items-center justify-center ' + (selected ? 'border-[#ff7a00] bg-[#ff7a00]' : 'border-[#0f172a]/20')}>
                          {selected && <Check className="w-3 h-3 text-[#0f172a]" />}
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="mt-5 space-y-4">
                <div className="p-4 rounded-xl bg-[#ff7a00]/5 border border-[#ff7a00]/20">
                  <p className="text-xs font-semibold text-[#0f172a] mb-3 flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-[#ff7a00]" />
                    {locale === 'fr' ? 'Coordonnées bancaires (pour recevoir vos paiements)' : 'Bank details (to receive your payments)'}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input label={locale === 'fr' ? 'Banque' : 'Bank'} value={form.bankName} onChange={(v) => setForm({ ...form, bankName: v })} placeholder="Ecobank" />
                    <Input label="IBAN" value={form.iban} onChange={(v) => setForm({ ...form, iban: v })} placeholder="CI..." />
                    <Input label="SWIFT" value={form.swift} onChange={(v) => setForm({ ...form, swift: v })} placeholder="ECOCCIAB" />
                    <Input label={locale === 'fr' ? 'Numéro Mobile Money' : 'Mobile Money number'} value={form.mobileMoney} onChange={(v) => setForm({ ...form, mobileMoney: v })} placeholder="+225 07 00 00 00" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 7: Shipping & Warehouse */}
          {step === 7 && (
            <div>
              <h2 className="font-display text-xl font-bold text-[#0f172a] mb-1">{locale === 'fr' ? 'Livraison & entrepôt' : 'Shipping & warehouse'}</h2>
              <p className="text-sm text-[#64748b] mb-5">{locale === 'fr' ? 'Vos modes de livraison et adresse de stockage' : 'Your delivery methods and storage address'}</p>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label={locale === 'fr' ? 'Adresse entrepôt' : 'Warehouse address'} value={form.warehouseAddress} onChange={(v) => setForm({ ...form, warehouseAddress: v })} placeholder="Zone industrielle, Abidjan" />
                  <Input label={locale === 'fr' ? 'Zone de livraison' : 'Shipping zone'} value={form.shippingZone} onChange={(v) => setForm({ ...form, shippingZone: v })} placeholder="Abidjan, Côte d'Ivoire" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{locale === 'fr' ? 'Modes de livraison' : 'Shipping methods'}</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { key: 'shipNational', label: locale === 'fr' ? 'Livraison nationale' : 'National shipping' },
                      { key: 'shipInternational', label: locale === 'fr' ? 'Livraison internationale' : 'International shipping' },
                      { key: 'shipExpress', label: locale === 'fr' ? 'Livraison express' : 'Express shipping' },
                      { key: 'shipLocal', label: locale === 'fr' ? 'Livraison locale' : 'Local delivery' },
                      { key: 'shipPickup', label: locale === 'fr' ? 'Point de retrait' : 'Pickup point' },
                    ].map((s) => (
                      <label key={s.key} className="flex items-center gap-3 p-3 rounded-xl border border-[#0f172a]/10 cursor-pointer hover:bg-[#0f172a]/5">
                        <input type="checkbox" checked={(form as Record<string, unknown>)[s.key] as boolean} onChange={(e) => setForm({ ...form, [s.key]: e.target.checked })} className="w-5 h-5 accent-[#ff7a00]" />
                        <span className="text-sm text-[#0f172a]">{s.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 8: Review */}
          {step === 8 && (
            <div>
              <h2 className="font-display text-xl font-bold text-[#0f172a] mb-1">{t.onboarding.validation}</h2>
              <p className="text-sm text-[#64748b] mb-5">{locale === 'fr' ? 'Vérifiez vos informations avant soumission' : 'Review your information before submission'}</p>
              <div className="space-y-2 text-sm">
                <SummaryRow label={t.auth.email} value={form.email} />
                <SummaryRow label={t.account.phone} value={form.phone} />
                <SummaryRow label={t.onboarding.country} value={countries.find((c) => c.id === form.countryId)?.name || '—'} />
                <SummaryRow label={t.onboarding.companyName} value={form.businessName} />
                <SummaryRow label={locale === 'fr' ? 'Boutique' : 'Store'} value={form.storeName} />
                <SummaryRow label={locale === 'fr' ? 'Paiements' : 'Payments'} value={form.selectedPayments.join(', ')} />
                <SummaryRow label={locale === 'fr' ? 'Banque' : 'Bank'} value={form.bankName || form.mobileMoney || '—'} />
              </div>
              <div className="mt-5 p-4 rounded-xl bg-[#ff7a00]/10 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-[#ff7a00] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-[#0f172a]">
                    {locale === 'fr' ? 'Plan choisi : ' + form.plan + ' — 14 jours gratuits' : 'Selected plan: ' + form.plan + ' — 14 days free'}
                  </p>
                  <p className="text-xs text-[#64748b] mt-1">
                    {locale === 'fr' ? 'Aucun paiement maintenant. Après 14 jours, un abonnement sera requis.' : 'No payment now. After 14 days, a subscription will be required.'}
                  </p>
                </div>
              </div>
              {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
            </div>
          )}

          {/* Step 9: Done */}
          {step === 9 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#ff7a00]/15 flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-[#ff7a00]" />
              </div>
              <h2 className="font-display text-xl font-bold text-[#0f172a] mb-2">
                {locale === 'fr' ? 'Prêt pour soumission' : 'Ready to submit'}
              </h2>
              <p className="text-sm text-[#64748b] mb-6">
                {locale === 'fr' ? 'Soumettez votre dossier. Notre équipe l\'examinera sous 48h.' : 'Submit your application. Our team will review it within 48h.'}
              </p>
              <button onClick={submit} disabled={submitting} className="btn-gold px-8 py-3.5 rounded-full font-semibold flex items-center gap-2 mx-auto disabled:opacity-50">
                <ShieldCheck className="w-5 h-5" /> {submitting ? (uploadingDocs ? (locale === 'fr' ? 'Envoi des documents...' : 'Uploading documents...') : (locale === 'fr' ? 'Soumission...' : 'Submitting...')) : t.onboarding.submit}
              </button>
              {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
            </div>
          )}

          {/* Navigation */}
          {step < 9 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#ff7a00]/20">
              <button onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-[#0f172a] disabled:opacity-30 hover:bg-[#0f172a]/5 rounded-lg transition-colors">
                <ChevronLeft className="w-4 h-4" /> {t.onboarding.back}
              </button>
              <button onClick={() => setStep(step + 1)} disabled={!canProceed()}
                className="btn-gold px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed">
                {t.onboarding.next} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Input({ icon: Icon, label, value, onChange, type = 'text', placeholder }: { icon?: React.ElementType; label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />}
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className={'input-field ' + (Icon ? 'pl-10' : '')} />
      </div>
    </div>
  );
}

function UploadField({ label, value, onChange }: { label: string; value: File | null; onChange: (v: File) => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{label}</label>
      <label className={'w-full p-4 rounded-xl border-2 border-dashed transition-all flex items-center gap-3 cursor-pointer ' + (value ? 'border-[#ff7a00] bg-[#ff7a00]/5' : 'border-[#0f172a]/15 hover:border-[#ff7a00]/50')}>
        <div className={'w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ' + (value ? 'bg-[#ff7a00]/15' : 'bg-[#0f172a]/5')}>
          {value ? <Check className="w-5 h-5 text-[#ff7a00]" /> : <UploadCloud className="w-5 h-5 text-[#64748b]" />}
        </div>
        <div className="text-left min-w-0">
          <p className="text-sm text-[#0f172a] truncate">{value ? value.name : label}</p>
          <p className="text-xs text-[#64748b]/60">JPG, PNG, PDF — 10MB max</p>
        </div>
        <input type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden" onChange={(e) => { if (e.target.files?.[0]) onChange(e.target.files[0]); }} />
      </label>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#ff7a00]/10">
      <span className="text-[#64748b]">{label}</span>
      <span className="font-semibold text-[#0f172a]">{value || '—'}</span>
    </div>
  );
}
