import { useState } from 'react';
import { useApp } from '@/lib/store';
import { Logo } from '@/components/Logo';
import { UploadCloud, FileText, Check, ChevronRight, ChevronLeft, ShieldCheck, Building2, MapPin, FileCheck, Clock, Store, Banknote, CreditCard, Truck, User, Phone, Mail, Lock, Globe } from 'lucide-react';

export function OnboardingPage() {
  const { t, navigate, locale, countries, setUser, loadingReference, referenceError } = useApp();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    email: '', password: '', phone: '', otp: '',
    countryId: '', businessType: 'individual',
    businessName: '', registrationNumber: '', vatNumber: '', businessCategory: '', businessAddress: '',
    idType: 'passport', idFront: null as string | null, idBack: null as string | null, selfie: null as string | null,
    bankName: '', iban: '', swift: '', mobileMoney: '',
    storeName: '', storeSlug: '', storeLogo: null as string | null, storeBanner: null as string | null, storeDesc: '', socialFacebook: '', socialInstagram: '',
    warehouseAddress: '', shippingZone: '',
    shipNational: true, shipInternational: false, shipExpress: true, shipLocal: true, shipPickup: false,
    payStripe: false, payFlutterwave: true, payPaystack: true, payPaypal: false, payMobileMoney: true, payBank: false,
  });
  const [submitted, setSubmitted] = useState(false);

  const steps = [
    { num: 1, label: locale === 'fr' ? 'Compte' : 'Account', icon: User },
    { num: 2, label: t.onboarding.country, icon: MapPin },
    { num: 3, label: locale === 'fr' ? 'Type' : 'Type', icon: Building2 },
    { num: 4, label: locale === 'fr' ? 'Entreprise' : 'Business', icon: FileText },
    { num: 5, label: locale === 'fr' ? 'Identité' : 'Identity', icon: ShieldCheck },
    { num: 6, label: locale === 'fr' ? 'Banque' : 'Bank', icon: Banknote },
    { num: 7, label: locale === 'fr' ? 'Boutique' : 'Store', icon: Store },
    { num: 8, label: locale === 'fr' ? 'Entrepôt' : 'Warehouse', icon: Building2 },
    { num: 9, label: locale === 'fr' ? 'Livraison' : 'Shipping', icon: Truck },
    { num: 10, label: locale === 'fr' ? 'Paiement' : 'Payment', icon: CreditCard },
    { num: 11, label: locale === 'fr' ? 'Révision' : 'Review', icon: FileCheck },
    { num: 12, label: locale === 'fr' ? 'Approbation' : 'Approval', icon: ShieldCheck },
  ];

  const canProceed = () => {
    if (step === 1) return form.email && form.password && form.phone;
    if (step === 2) return !!form.countryId;
    if (step === 3) return !!form.businessType;
    if (step === 4) return form.businessName && form.registrationNumber;
    if (step === 5) return form.idFront && form.idBack && form.selfie;
    if (step === 6) return form.bankName || form.mobileMoney;
    if (step === 7) return form.storeName && form.storeSlug;
    if (step === 8) return form.warehouseAddress;
    return true;
  };

  const submit = () => {
    setSubmitted(true);
    setUser({
      id: 'demo-seller-' + Date.now(),
      email: form.email,
      fullName: form.storeName || form.businessName,
      role: 'seller',
      sellerPlan: 'starter',
      sellerStatus: 'pending',
    });
  };

  if (submitted) {
    return (
      <div className="motif-bg min-h-screen flex items-center justify-center px-4">
        <div className="card p-8 max-w-md text-center animate-fade-up">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#0e9f6e]/15 flex items-center justify-center pulse-gold">
            <Clock className="w-8 h-8 text-[#0e9f6e]" />
          </div>
          <h2 className="font-display text-2xl font-bold text-[#0f172a] mb-2">{t.onboarding.pending}</h2>
          <p className="text-sm text-[#64748b] mb-6">{t.onboarding.submitSuccess}</p>
          <button onClick={() => navigate('seller-center')} className="w-full btn-gold py-3 rounded-xl font-semibold">{t.nav.sellerCenter}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="motif-bg min-h-screen">
      <header className="sticky top-0 z-50 bg-[#0f172a] safe-top">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => navigate('sell')}><Logo size={40} /></button>
          <button onClick={() => navigate('home')} className="text-sm text-[#f7f8fa]/60 hover:text-[#0e9f6e]">{locale === 'fr' ? 'Retour à la boutique' : 'Back to store'}</button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center mb-6">
          <h1 className="font-display text-2xl font-bold text-[#0f172a]">{t.onboarding.title}</h1>
          <p className="text-sm text-[#64748b] mt-1">{t.onboarding.step} {step} {t.onboarding.of} 12</p>
        </div>

        {/* Progress bar */}
        <div className="flex items-center justify-between mb-8 overflow-x-auto no-scrollbar">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center flex-1 last:flex-none min-w-[40px]">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${step >= s.num ? 'bg-[#0e9f6e] text-[#0f172a]' : 'bg-white border border-[#0f172a]/15 text-[#64748b]/40'}`}>
                  {step > s.num ? <Check className="w-4 h-4" /> : <s.icon className="w-3.5 h-3.5" />}
                </div>
              </div>
              {i < steps.length - 1 && <div className={`h-0.5 flex-1 mx-1 rounded ${step > s.num ? 'bg-[#0e9f6e]' : 'bg-[#0f172a]/10'}`} />}
            </div>
          ))}
        </div>

        <div className="card p-6 sm:p-8 animate-fade-up">
          {/* Step 1: Account */}
          {step === 1 && (
            <div>
              <h2 className="font-display text-xl font-bold text-[#0f172a] mb-1">{locale === 'fr' ? 'Créer votre compte' : 'Create your account'}</h2>
              <p className="text-sm text-[#64748b] mb-5">{locale === 'fr' ? 'Vos informations de connexion' : 'Your login information'}</p>
              <div className="space-y-4">
                <Input icon={Mail} label={t.auth.email} value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" placeholder="you@example.com" />
                <Input icon={Lock} label={t.auth.password} value={form.password} onChange={(v) => setForm({ ...form, password: v })} type="password" placeholder="••••••••" />
                <Input icon={Phone} label={t.account.phone} value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="+225 07 00 00 00" />
                <div className="p-3 rounded-xl bg-[#0e9f6e]/10 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#0e9f6e]" />
                  <span className="text-xs text-[#64748b]">{locale === 'fr' ? 'Un code OTP sera envoyé par SMS' : 'An OTP code will be sent via SMS'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Country */}
          {step === 2 && (
            <div>
              <h2 className="font-display text-xl font-bold text-[#0f172a] mb-1">{t.onboarding.selectCountry}</h2>
              <p className="text-sm text-[#64748b] mb-5">{locale === 'fr' ? 'Tous les pays africains disponibles' : 'All African countries available'}</p>

              {loadingReference && (
                <p className="text-sm text-[#64748b]">{locale === 'fr' ? 'Chargement des pays...' : 'Loading countries...'}</p>
              )}

              {!loadingReference && referenceError && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                  {locale === 'fr' ? 'Impossible de charger la liste des pays.' : 'Could not load the country list.'}
                  <br />
                  <span className="text-xs opacity-70">{referenceError}</span>
                </div>
              )}

              {!loadingReference && !referenceError && countries.length === 0 && (
                <p className="text-sm text-[#64748b]">{locale === 'fr' ? 'Aucun pays disponible pour le moment.' : 'No countries available right now.'}</p>
              )}

              {!loadingReference && countries.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[400px] overflow-y-auto">
                  {countries.map((c) => (
                    <button key={c.id} onClick={() => setForm({ ...form, countryId: c.id })}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${form.countryId === c.id ? 'border-[#0e9f6e] bg-[#0e9f6e]/5' : 'border-[#0f172a]/10 hover:border-[#0e9f6e]/50'}`}>
                      <span className="text-2xl mr-1">{c.flag}</span>
                      <span className="text-sm font-medium text-[#0f172a]">{c.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Business Type */}
          {step === 3 && (
            <div>
              <h2 className="font-display text-xl font-bold text-[#0f172a] mb-1">{locale === 'fr' ? 'Type d\'entreprise' : 'Business type'}</h2>
              <p className="text-sm text-[#64748b] mb-5">{locale === 'fr' ? 'Sélectionnez votre type' : 'Select your type'}</p>
              <div className="space-y-2">
                {[
                  { id: 'individual', label: locale === 'fr' ? 'Individuel' : 'Individual', desc: locale === 'fr' ? 'Vendeur particulier' : 'Individual seller' },
                  { id: 'company', label: locale === 'fr' ? 'Entreprise' : 'Company', desc: locale === 'fr' ? 'Société enregistrée' : 'Registered company' },
                  { id: 'government', label: locale === 'fr' ? 'Gouvernement' : 'Government', desc: locale === 'fr' ? 'Entité gouvernementale' : 'Government entity' },
                  { id: 'ngo', label: 'NGO', desc: locale === 'fr' ? 'Organisation non gouvernementale' : 'Non-governmental organization' },
                  { id: 'cooperative', label: locale === 'fr' ? 'Coopérative' : 'Cooperative', desc: locale === 'fr' ? 'Coopérative' : 'Cooperative' },
                ].map((b) => (
                  <button key={b.id} onClick={() => setForm({ ...form, businessType: b.id })}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${form.businessType === b.id ? 'border-[#0e9f6e] bg-[#0e9f6e]/5' : 'border-[#0f172a]/10 hover:border-[#0e9f6e]/50'}`}>
                    <p className="font-semibold text-[#0f172a]">{b.label}</p>
                    <p className="text-xs text-[#64748b]">{b.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Business Info */}
          {step === 4 && (
            <div>
              <h2 className="font-display text-xl font-bold text-[#0f172a] mb-1">{locale === 'fr' ? 'Informations entreprise' : 'Business information'}</h2>
              <p className="text-sm text-[#64748b] mb-5">{locale === 'fr' ? 'Détails légaux de votre entreprise' : 'Legal details of your business'}</p>
              <div className="space-y-4">
                <Input label={t.onboarding.companyName} value={form.businessName} onChange={(v) => setForm({ ...form, businessName: v })} placeholder="Maison Baoulé SARL" />
                <Input label={t.onboarding.companyNumber} value={form.registrationNumber} onChange={(v) => setForm({ ...form, registrationNumber: v })} placeholder="CI-ABJ-2024-B-12345" />
                <Input label={t.onboarding.vatNumber} value={form.vatNumber} onChange={(v) => setForm({ ...form, vatNumber: v })} placeholder="1234567" />
                <Input label={locale === 'fr' ? 'Adresse de l\'entreprise' : 'Business address'} value={form.businessAddress} onChange={(v) => setForm({ ...form, businessAddress: v })} placeholder="Cocody, Abidjan" />
              </div>
            </div>
          )}

          {/* Step 5: Identity */}
          {step === 5 && (
            <div>
              <h2 className="font-display text-xl font-bold text-[#0f172a] mb-1">{locale === 'fr' ? 'Vérification d\'identité' : 'Identity verification'}</h2>
              <p className="text-sm text-[#64748b] mb-5">{locale === 'fr' ? 'Téléversez vos documents' : 'Upload your documents'} — JPG, PNG, PDF</p>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{locale === 'fr' ? 'Type de pièce' : 'ID type'}</label>
                <div className="flex gap-2">
                  {['passport', 'national_id', 'driving_license'].map((id) => (
                    <button key={id} onClick={() => setForm({ ...form, idType: id })}
                      className={`px-3 py-2 text-xs rounded-lg border-2 transition-all ${form.idType === id ? 'border-[#0e9f6e] bg-[#0e9f6e]/5 text-[#0f172a] font-semibold' : 'border-[#0f172a]/15 text-[#0f172a]'}`}>
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

          {/* Step 6: Bank */}
          {step === 6 && (
            <div>
              <h2 className="font-display text-xl font-bold text-[#0f172a] mb-1">{locale === 'fr' ? 'Informations bancaires' : 'Bank information'}</h2>
              <p className="text-sm text-[#64748b] mb-5">{locale === 'fr' ? 'Où recevoir vos paiements' : 'Where to receive your payments'}</p>
              <div className="space-y-4">
                <Input label={locale === 'fr' ? 'Banque' : 'Bank'} value={form.bankName} onChange={(v) => setForm({ ...form, bankName: v })} placeholder="Ecobank" />
                <Input label="IBAN" value={form.iban} onChange={(v) => setForm({ ...form, iban: v })} placeholder="CI..." />
                <Input label="SWIFT" value={form.swift} onChange={(v) => setForm({ ...form, swift: v })} placeholder="ECOCCIAB" />
                <Input label={locale === 'fr' ? 'Numéro Mobile Money' : 'Mobile Money number'} value={form.mobileMoney} onChange={(v) => setForm({ ...form, mobileMoney: v })} placeholder="+225 07 00 00 00" />
              </div>
            </div>
          )}

          {/* Step 7: Store */}
          {step === 7 && (
            <div>
              <h2 className="font-display text-xl font-bold text-[#0f172a] mb-1">{locale === 'fr' ? 'Informations boutique' : 'Store information'}</h2>
              <p className="text-sm text-[#64748b] mb-5">{locale === 'fr' ? 'L\u2019apparence de votre boutique' : 'Your store appearance'}</p>
              <div className="space-y-4">
                <Input label={locale === 'fr' ? 'Nom de la boutique' : 'Store name'} value={form.storeName} onChange={(v) => setForm({ ...form, storeName: v })} placeholder="Maison Baoulé" />
                <Input label="URL" value={form.storeSlug} onChange={(v) => setForm({ ...form, storeSlug: v })} placeholder="maison-baoule" />
                <div>
                  <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{locale === 'fr' ? 'Description' : 'Description'}</label>
                  <textarea value={form.storeDesc} onChange={(e) => setForm({ ...form, storeDesc: e.target.value })} className="input-field" rows={3} placeholder={locale === 'fr' ? 'Décrivez votre boutique...' : 'Describe your store...'} />
                </div>
                <UploadField label={locale === 'fr' ? 'Logo (512×512)' : 'Logo (512×512)'} value={form.storeLogo} onChange={(v) => setForm({ ...form, storeLogo: v })} />
                <UploadField label={locale === 'fr' ? 'Bannière (1920×600)' : 'Banner (1920×600)'} value={form.storeBanner} onChange={(v) => setForm({ ...form, storeBanner: v })} />
                <Input label="Facebook" value={form.socialFacebook} onChange={(v) => setForm({ ...form, socialFacebook: v })} placeholder="https://facebook.com/..." />
                <Input label="Instagram" value={form.socialInstagram} onChange={(v) => setForm({ ...form, socialInstagram: v })} placeholder="https://instagram.com/..." />
              </div>
            </div>
          )}

          {/* Step 8: Warehouse */}
          {step === 8 && (
            <div>
              <h2 className="font-display text-xl font-bold text-[#0f172a] mb-1">{locale === 'fr' ? 'Entrepôt' : 'Warehouse'}</h2>
              <p className="text-sm text-[#64748b] mb-5">{locale === 'fr' ? 'Votre adresse de stockage' : 'Your storage address'}</p>
              <div className="space-y-4">
                <Input label={locale === 'fr' ? 'Adresse de l\'entrepôt' : 'Warehouse address'} value={form.warehouseAddress} onChange={(v) => setForm({ ...form, warehouseAddress: v })} placeholder="Zone industrielle, Abidjan" />
                <Input label={locale === 'fr' ? 'Zone de livraison' : 'Shipping zone'} value={form.shippingZone} onChange={(v) => setForm({ ...form, shippingZone: v })} placeholder="Abidjan, Côte d'Ivoire" />
              </div>
            </div>
          )}

          {/* Step 9: Shipping */}
          {step === 9 && (
            <div>
              <h2 className="font-display text-xl font-bold text-[#0f172a] mb-1">{locale === 'fr' ? 'Configuration livraison' : 'Shipping configuration'}</h2>
              <p className="text-sm text-[#64748b] mb-5">{locale === 'fr' ? 'Vos modes de livraison' : 'Your delivery methods'}</p>
              <div className="space-y-2">
                {[
                  { key: 'shipNational', label: locale === 'fr' ? 'Livraison nationale' : 'National shipping' },
                  { key: 'shipInternational', label: locale === 'fr' ? 'Livraison internationale' : 'International shipping' },
                  { key: 'shipExpress', label: locale === 'fr' ? 'Livraison express' : 'Express shipping' },
                  { key: 'shipLocal', label: locale === 'fr' ? 'Livraison locale' : 'Local delivery' },
                  { key: 'shipPickup', label: locale === 'fr' ? 'Point de retrait' : 'Pickup point' },
                ].map((s) => (
                  <label key={s.key} className="flex items-center gap-3 p-3 rounded-xl border border-[#0f172a]/10 cursor-pointer hover:bg-[#0f172a]/5">
                    <input type="checkbox" checked={(form as any)[s.key]} onChange={(e) => setForm({ ...form, [s.key]: e.target.checked })} className="w-5 h-5 accent-[#0e9f6e]" />
                    <span className="text-sm text-[#0f172a]">{s.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 10: Payment */}
          {step === 10 && (
            <div>
              <h2 className="font-display text-xl font-bold text-[#0f172a] mb-1">{locale === 'fr' ? 'Configuration paiement' : 'Payment configuration'}</h2>
              <p className="text-sm text-[#64748b] mb-5">{locale === 'fr' ? 'Vos méthodes de paiement' : 'Your payment methods'}</p>
              <div className="space-y-2">
                {[
                  { key: 'payMobileMoney', label: 'Mobile Money' },
                  { key: 'payPaystack', label: 'Paystack' },
                  { key: 'payFlutterwave', label: 'Flutterwave' },
                  { key: 'payStripe', label: 'Stripe' },
                  { key: 'payPaypal', label: 'PayPal' },
                  { key: 'payBank', label: locale === 'fr' ? 'Virement bancaire' : 'Bank transfer' },
                ].map((p) => (
                  <label key={p.key} className="flex items-center gap-3 p-3 rounded-xl border border-[#0f172a]/10 cursor-pointer hover:bg-[#0f172a]/5">
                    <input type="checkbox" checked={(form as any)[p.key]} onChange={(e) => setForm({ ...form, [p.key]: e.target.checked })} className="w-5 h-5 accent-[#0e9f6e]" />
                    <span className="text-sm text-[#0f172a]">{p.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 11: Review */}
          {step === 11 && (
            <div>
              <h2 className="font-display text-xl font-bold text-[#0f172a] mb-1">{t.onboarding.validation}</h2>
              <p className="text-sm text-[#64748b] mb-5">{locale === 'fr' ? 'Vérifiez vos informations' : 'Review your information'}</p>
              <div className="space-y-2 text-sm">
                <SummaryRow label={t.auth.email} value={form.email} />
                <SummaryRow label={t.onboarding.country} value={countries.find((c) => c.id === form.countryId)?.name || '—'} />
                <SummaryRow label={locale === 'fr' ? 'Type' : 'Type'} value={form.businessType} />
                <SummaryRow label={t.onboarding.companyName} value={form.businessName} />
                <SummaryRow label={locale === 'fr' ? 'Boutique' : 'Store'} value={form.storeName} />
                <SummaryRow label={locale === 'fr' ? 'Banque' : 'Bank'} value={form.bankName || form.mobileMoney} />
              </div>
            </div>
          )}

          {/* Step 12: Approval */}
          {step === 12 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#0e9f6e]/15 flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-[#0e9f6e]" />
              </div>
              <h2 className="font-display text-xl font-bold text-[#0f172a] mb-2">{locale === 'fr' ? 'Prêt pour approbation' : 'Ready for approval'}</h2>
              <p className="text-sm text-[#64748b] mb-6">{locale === 'fr' ? 'Soumettez votre demande. Notre équipe l\'examinera sous 48h.' : 'Submit your application. Our team will review it within 48h.'}</p>
              <button onClick={submit} className="btn-gold px-8 py-3.5 rounded-xl font-semibold flex items-center gap-2 mx-auto">
                <ShieldCheck className="w-5 h-5" /> {t.onboarding.submit}
              </button>
            </div>
          )}

          {/* Navigation */}
          {step < 12 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#0e9f6e]/20">
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
          className={`input-field ${Icon ? 'pl-10' : ''}`} />
      </div>
    </div>
  );
}

function UploadField({ label, value, onChange }: { label: string; value: string | null; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{label}</label>
      <label className={`w-full p-4 rounded-xl border-2 border-dashed transition-all flex items-center gap-3 cursor-pointer ${value ? 'border-[#0e9f6e] bg-[#0e9f6e]/5' : 'border-[#0f172a]/15 hover:border-[#0e9f6e]/50'}`}>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${value ? 'bg-[#0e9f6e]/15' : 'bg-[#0f172a]/5'}`}>
          {value ? <Check className="w-5 h-5 text-[#0e9f6e]" /> : <UploadCloud className="w-5 h-5 text-[#64748b]" />}
        </div>
        <div className="text-left">
          <p className="text-sm text-[#0f172a]">{value ? 'File uploaded' : label}</p>
          <p className="text-xs text-[#64748b]/60">JPG, PNG, PDF</p>
        </div>
        <input type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden" onChange={(e) => { if (e.target.files?.[0]) onChange(e.target.files[0].name); }} />
      </label>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#0e9f6e]/10">
      <span className="text-[#64748b]">{label}</span>
      <span className="font-semibold text-[#0f172a]">{value || '—'}</span>
    </div>
  );
}
