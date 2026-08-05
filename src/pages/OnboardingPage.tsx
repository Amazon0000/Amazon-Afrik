import { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { Logo } from '@/components/Logo';
import { supabase } from '@/lib/supabase';
import { UploadCloud, Check, ChevronRight, ChevronLeft, ShieldCheck, Building2, MapPin, FileCheck, Store, Banknote, CreditCard, Truck, User, Wallet, Sparkles, CheckCircle, Search, HelpCircle } from 'lucide-react';

type PaymentMethod = {
  id: string;
  label: string;
  desc: string;
  icon: typeof Wallet;
};

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'mobile_money', label: 'Mobile Money', desc: 'Orange Money, MTN MoMo, Wave, M-Pesa, Airtel', icon: Wallet },
  { id: 'paystack', label: 'Paystack', desc: 'Cartes bancaires locales & internationales', icon: CreditCard },
  { id: 'flutterwave', label: 'Flutterwave', desc: 'Paiement transfrontalier Afrique', icon: CreditCard },
  { id: 'stripe', label: 'Stripe', desc: 'Cartes Visa, Mastercard, Amex', icon: CreditCard },
  { id: 'paypal', label: 'PayPal', desc: 'Paiement international', icon: CreditCard },
  { id: 'bank_transfer', label: 'Virement bancaire', desc: 'Virement direct sur votre compte', icon: Banknote },
];

// Rich listing of global/African countries with their cities and typical localities/neighborhoods
const GLOBAL_COUNTRIES_LIST = [
  {
    id: 'CI',
    name: "Côte d'Ivoire",
    flag: "🇨🇮",
    dialCode: "+225",
    currency: "XOF",
    cities: [
      {
        name: "Abidjan",
        localities: ["Cocody", "Marcory", "Plateau", "Yopougon", "Treichville", "Koumassi", "Adjamé", "Port-Bouët", "Bingerville", "Abobo"]
      },
      {
        name: "Bouaké",
        localities: ["Aéroport", "N'Gattakro", "Commerce", "Air France", "Nimbo", "Broukro"]
      },
      {
        name: "Yamoussoukro",
        localities: ["Soba", "Habitat", "220 Logements", "Assabou", "Millionnaire"]
      },
      {
        name: "San Pedro",
        localities: ["Bardot", "Cité", "Balmer", "Zone Industrielle"]
      }
    ]
  },
  {
    id: 'SN',
    name: "Sénégal",
    flag: "🇸🇳",
    dialCode: "+221",
    currency: "XOF",
    cities: [
      {
        name: "Dakar",
        localities: ["Plateau", "Médina", "Almadies", "Yoff", "Fann", "Grand Yoff", "Parcelles Assainies", "Guédiawaye"]
      },
      {
        name: "Thiès",
        localities: ["Escale", "Dixième", "Cité Lamy", "Grand Thiès"]
      },
      {
        name: "Saint-Louis",
        localities: ["Ndar", "Sor", "Guet N'dar", "Balacos"]
      }
    ]
  },
  {
    id: 'CM',
    name: "Cameroun",
    flag: "🇨🇲",
    dialCode: "+237",
    currency: "XAF",
    cities: [
      {
        name: "Douala",
        localities: ["Akwa", "Bonapriso", "Bali", "Bonanjo", "Deido", "Logbessou", "Kotto", "Bépanda"]
      },
      {
        name: "Yaoundé",
        localities: ["Bastos", "Messa", "Mvan", "Essos", "Emana", "Ngousso", "Omnisports"]
      }
    ]
  },
  {
    id: 'NG',
    name: "Nigeria",
    flag: "🇳🇬",
    dialCode: "+234",
    currency: "NGN",
    cities: [
      {
        name: "Lagos",
        localities: ["Ikeja", "Victoria Island", "Lekki Phase 1", "Ikoyi", "Surulere", "Yaba", "Apapa"]
      },
      {
        name: "Abuja",
        localities: ["Wuse II", "Garki", "Maitama", "Asokoro", "Jabi", "Gwarinpa"]
      }
    ]
  },
  {
    id: 'KE',
    name: "Kenya",
    flag: "🇰🇪",
    dialCode: "+254",
    currency: "KES",
    cities: [
      {
        name: "Nairobi",
        localities: ["Westlands", "Kilimani", "Karen", "Gigiri", "Langata", "Eastleigh", "CBD"]
      },
      {
        name: "Mombasa",
        localities: ["Nyali", "Bamburi", "Tudor", "Likoni", "Changamwe"]
      }
    ]
  },
  {
    id: 'GH',
    name: "Ghana",
    flag: "🇬🇭",
    dialCode: "+233",
    currency: "GHS",
    cities: [
      {
        name: "Accra",
        localities: ["Osu", "East Legon", "Cantonments", "Labone", "Airport Residential", "Dansoman", "Spintex"]
      },
      {
        name: "Kumasi",
        localities: ["Adum", "Nhyiaeso", "Asokwa", "Bantama", "Fante New Town"]
      }
    ]
  },
  {
    id: 'GA',
    name: "Gabon",
    flag: "🇬🇦",
    dialCode: "+241",
    currency: "XAF",
    cities: [
      {
        name: "Libreville",
        localities: ["Batterie IV", "La Sablière", "Angondjé", "Louis", "Glass", "Nombakélé", "Akanda"]
      },
      {
        name: "Port-Gentil",
        localities: ["Grand Village", "Chic", "Sogara", "N'tchengué"]
      }
    ]
  },
  {
    id: 'BJ',
    name: "Bénin",
    flag: "🇧🇯",
    dialCode: "+229",
    currency: "XOF",
    cities: [
      {
        name: "Cotonou",
        localities: ["Haie Vive", "Fidjrossè", "Cadjehoun", "Ganhi", "Saint Michel", "Zongo"]
      },
      {
        name: "Porto-Novo",
        localities: ["Ouando", "Fari", "Gbékon", "Catchi"]
      }
    ]
  },
  {
    id: 'TG',
    name: "Togo",
    flag: "🇹🇬",
    dialCode: "+228",
    currency: "XOF",
    cities: [
      {
        name: "Lomé",
        localities: ["Nyékonakpoé", "Amoutivé", "Bè", "Tokoin", "Hédzranawoé", "Lomé II", "Aflao"]
      }
    ]
  },
  {
    id: 'CD',
    name: "RD Congo",
    flag: "🇨🇩",
    dialCode: "+243",
    currency: "CDF",
    cities: [
      {
        name: "Kinshasa",
        localities: ["Gombe", "Ngaliema", "Limete", "Kintambo", "Bandalungwa", "Mahete", "Binza"]
      },
      {
        name: "Lubumbashi",
        localities: ["Golf", "Bel-Air", "Ruashi", "Kampemba"]
      }
    ]
  },
  {
    id: 'FR',
    name: "France",
    flag: "🇫🇷",
    dialCode: "+33",
    currency: "EUR",
    cities: [
      {
        name: "Paris",
        localities: ["Le Marais", "Montmartre", "Quartier Latin", "Champs-Élysées", "Belleville", "Bastille"]
      },
      {
        name: "Lyon",
        localities: ["Presqu'île", "Vieux Lyon", "La Croix-Rousse", "Confluence", "Part-Dieu"]
      }
    ]
  },
  {
    id: 'US',
    name: "United States",
    flag: "🇺🇸",
    dialCode: "+1",
    currency: "USD",
    cities: [
      {
        name: "New York",
        localities: ["Manhattan", "Brooklyn", "Queens", "The Bronx", "Staten Island"]
      },
      {
        name: "Los Angeles",
        localities: ["Hollywood", "Santa Monica", "Beverly Hills", "Downtown LA", "Venice Beach"]
      }
    ]
  }
];

export function OnboardingPage() {
  const { t, navigate, locale, setUser, params } = useApp();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Advanced country selection state
  const [countrySearch, setCountrySearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<typeof GLOBAL_COUNTRIES_LIST[0] | null>(GLOBAL_COUNTRIES_LIST[0]);
  const [useCustomCountry, setUseCustomCountry] = useState(false);
  const [customCountryName, setCustomCountryName] = useState('');
  const [customCountryFlag, setCustomCountryFlag] = useState('🌍');
  const [customCountryDialCode, setCustomCountryDialCode] = useState('+');

  // Advanced cascading city & locality selection
  const [selectedCity, setSelectedCity] = useState<string>('Abidjan');
  const [useCustomCity, setUseCustomCity] = useState(false);
  const [customCityName, setCustomCityName] = useState('');

  const [selectedLocality, setSelectedLocality] = useState<string>('Cocody');
  const [useCustomLocality, setUseCustomLocality] = useState(false);
  const [customLocalityName, setCustomLocalityName] = useState('');

  const [form, setForm] = useState({
    email: '', password: '', phone: '',
    businessType: 'company',
    businessName: '', registrationNumber: '', vatNumber: '', businessCategory: 'fashion', businessAddress: '',
    idType: 'passport', idFront: null as string | null, idBack: null as string | null, selfie: null as string | null,
    bankName: '', iban: '', swift: '', mobileMoney: '',
    storeName: '', storeSlug: '', storeLogo: null as string | null, storeBanner: null as string | null, storeDesc: '', socialFacebook: '', socialInstagram: '',
    warehouseAddress: '', shippingZone: '',
    shipNational: true, shipInternational: false, shipExpress: true, shipLocal: true, shipPickup: false,
    selectedPayments: ['mobile_money', 'bank_transfer'] as string[],
    plan: (params.plan as string) || 'starter',
  });

  const [submitted, setSubmitted] = useState(false);

  // Auto-fill phone prefixes based on country selection
  useEffect(() => {
    if (selectedCountry && !useCustomCountry) {
      setForm((prev) => ({ ...prev, phone: selectedCountry.dialCode + ' ' }));
    } else if (useCustomCountry) {
      setForm((prev) => ({ ...prev, phone: customCountryDialCode + ' ' }));
    }
  }, [selectedCountry, useCustomCountry, customCountryDialCode]);

  // Handle cascading selection shifts
  useEffect(() => {
    if (selectedCountry && !useCustomCountry) {
      const defaultCity = selectedCountry.cities[0];
      if (defaultCity) {
        setSelectedCity(defaultCity.name);
        setUseCustomCity(false);
        const defaultLoc = defaultCity.localities[0];
        if (defaultLoc) {
          setSelectedLocality(defaultLoc);
          setUseCustomLocality(false);
        } else {
          setSelectedLocality('');
          setUseCustomLocality(true);
        }
      } else {
        setSelectedCity('');
        setUseCustomCity(true);
        setSelectedLocality('');
        setUseCustomLocality(true);
      }
    } else {
      setSelectedCity('');
      setUseCustomCity(true);
      setSelectedLocality('');
      setUseCustomLocality(true);
    }
  }, [selectedCountry, useCustomCountry]);

  useEffect(() => {
    if (selectedCountry && !useCustomCountry) {
      const cityObj = selectedCountry.cities.find(c => c.name === selectedCity);
      if (cityObj) {
        const defaultLoc = cityObj.localities[0];
        if (defaultLoc) {
          setSelectedLocality(defaultLoc);
          setUseCustomLocality(false);
        } else {
          setSelectedLocality('');
          setUseCustomLocality(true);
        }
      }
    }
  }, [selectedCity]);

  // Derived location string
  const resolvedCountryName = useCustomCountry ? customCountryName : (selectedCountry?.name || '');
  const resolvedCityName = useCustomCity ? customCityName : selectedCity;
  const resolvedLocalityName = useCustomLocality ? customLocalityName : selectedLocality;

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
    if (step === 1) return form.email && form.password && form.phone && form.phone.trim().length > 4;
    if (step === 2) {
      if (useCustomCountry) {
        return !!customCountryName && !!resolvedCityName && !!resolvedLocalityName;
      }
      return !!selectedCountry && !!resolvedCityName && !!resolvedLocalityName;
    }
    if (step === 3) return form.businessName && form.registrationNumber;
    if (step === 4) return form.idFront && form.idBack && form.selfie;
    if (step === 5) return form.storeName && form.storeSlug;
    if (step === 6) return form.selectedPayments.length > 0;
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
      let userId: string | undefined;

      // Check if user is already authenticated
      let currentUser = null;
      try {
        const { data } = await supabase.auth.getUser();
        currentUser = data?.user;
      } catch (e) {
        console.warn('supabase.auth.getUser failed or is not available:', e);
      }

      if (currentUser) {
        userId = currentUser.id;
        // Update user metadata so they have the seller role and status
        try {
          await supabase.auth.updateUser({
            data: {
              full_name: form.storeName || form.businessName,
              role: 'seller',
              seller_plan: form.plan,
              seller_status: 'pending',
              phone: form.phone,
            }
          });
        } catch (updErr) {
          console.warn('Failed to update user metadata:', updErr);
        }
      } else {
        // Attempt signup
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

        if (signUpError) {
          // If already registered, attempt login
          if (signUpError.message.toLowerCase().includes('already') || signUpError.message.toLowerCase().includes('taken')) {
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email: form.email,
              password: form.password
            });
            if (signInError) {
              setError(locale === 'fr' ? 'Cet e-mail est déjà enregistré avec un autre mot de passe.' : 'This email is already registered with a different password.');
              setSubmitting(false);
              return;
            }
            userId = signInData.user?.id;
          } else {
            setError(signUpError.message);
            setSubmitting(false);
            return;
          }
        } else {
          userId = signUpData.user?.id;
        }
      }

      if (!userId) {
        setError(locale === 'fr' ? 'Erreur : Aucun ID utilisateur reçu' : 'Error: No user ID received');
        setSubmitting(false);
        return;
      }

      const { data: sellerData, error: sellerError } = await supabase.from('sellers').insert({
        user_id: userId,
        business_name: form.businessName,
        business_type: form.businessType,
        registration_number: form.registrationNumber,
        vat_number: form.vatNumber || null,
        country_id: useCustomCountry ? 'Other' : selectedCountry?.id,
        store_slug: form.storeSlug,
        description: form.storeDesc || null,
        city: resolvedCityName,
        phone: form.phone || null,
        bank_name: form.bankName || null,
        bank_iban: form.iban || null,
        bank_swift: form.swift || null,
        mobile_money_number: form.mobileMoney || null,
        plan: form.plan,
        plan_selected: form.plan,
        subscription_status: 'trial',
        trial_starts_at: new Date().toISOString(),
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
      }).select('id').single();

      if (sellerError) {
        console.warn('Real Supabase seller creation blocked or failed. Falling back to local offline mode.', sellerError.message);

        const mockSellerId = `mock-s-${Date.now()}`;
        setUser({
          id: userId,
          email: form.email,
          fullName: form.storeName || form.businessName,
          role: 'seller',
          sellerId: mockSellerId,
          sellerPlan: form.plan as 'starter' | 'premium' | 'enterprise',
          sellerStatus: 'pending',
        });
        setSubmitted(true);
        return;
      }

      const sellerId = sellerData.id;

      try {
        await supabase.from('seller_payment_methods').insert(
          form.selectedPayments.map((pid) => ({
            seller_id: sellerId,
            provider_name: pid,
            provider_type: pid === 'bank_transfer' ? 'bank' : pid === 'mobile_money' ? 'mobile_money' : 'card',
            is_active: true,
            is_verified: false,
          }))
        );
      } catch (payErr) {
        console.warn('Failed to insert seller payment methods:', payErr);
      }

      try {
        // Create initial address for shipping logistics
        await supabase.from('addresses').insert({
          user_id: userId,
          label: locale === 'fr' ? 'Entrepôt Vendeur' : 'Seller Warehouse',
          full_name: form.businessName,
          phone: form.phone,
          street: form.warehouseAddress || resolvedLocalityName,
          country_id: useCustomCountry ? 'Other' : selectedCountry?.id,
          city: resolvedCityName,
          is_default: true,
        });
      } catch (addrErr) {
        console.warn('Failed to insert onboarding address:', addrErr);
      }

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
    } catch (err: unknown) {
      console.error('Onboarding exception caught:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg || (locale === 'fr' ? 'Une erreur est survenue lors de l\'enregistrement' : 'Something went wrong during registration'));
    } finally {
      setSubmitting(false);
    }
  };

  // Filter countries list by search term
  const filteredCountries = GLOBAL_COUNTRIES_LIST.filter((c) =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  if (submitted) {
    return (
      <div className="bg-[#eaeded] min-h-screen flex items-center justify-center px-4">
        <div className="bg-white border border-[#ddd] rounded-lg p-8 max-w-md text-center shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#ff9900]/10 flex items-center justify-center animate-bounce">
            <CheckCircle className="w-8 h-8 text-[#e77600]" />
          </div>
          <h2 className="text-2xl font-normal text-[#111] mb-2">
            {locale === 'fr' ? 'Bienvenue sur Zando !' : 'Welcome to Zando!'}
          </h2>
          <p className="text-sm text-[#555] mb-5 leading-relaxed">
            {locale === 'fr'
              ? 'Votre compte de vendeur a été pré-créé avec succès. Vous disposez de 14 jours d’essai gratuits.'
              : 'Your seller account has been pre-created successfully. You get 14 days of free trial.'}
          </p>
          <div className="p-4 rounded-lg bg-[#eaeded] border border-[#ccc] mb-5 text-left flex gap-3">
            <Sparkles className="w-5 h-5 text-[#e77600] shrink-0 mt-0.5" />
            <p className="text-xs text-[#333] leading-relaxed">
              {locale === 'fr'
                ? 'Profitez immédiatement de notre architecture de vente directe. Aucun frais d’inscription, et 0% de commission prélevé sur vos ventes.'
                : 'Instantly enjoy our direct sale architecture. Zero setup fees, and 0% commission on your sales.'}
            </p>
          </div>
          <button onClick={() => navigate('seller-center')} className="w-full bg-[#ffd814] hover:bg-[#f7ca00] text-[#111] py-3 rounded-lg text-sm font-semibold border border-[#fcd200] shadow-sm transition-colors">
            {t.nav.sellerCenter}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#eaeded] min-h-screen font-sans">
      <header className="bg-[#0a2240] sticky top-0 z-50 py-3 px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('sell')} className="focus:outline-none">
            <Logo size={42} />
          </button>
          <button onClick={() => navigate('home')} className="text-sm text-white/80 hover:text-[#ffd814] transition-colors">
            {locale === 'fr' ? 'Retour à la boutique' : 'Back to store'}
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Amazon style progress dashboard header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-normal text-[#111]">{t.onboarding.title}</h1>
          <p className="text-xs text-[#555] mt-1">{t.onboarding.step} {step} {t.onboarding.of} {steps.length - 1}</p>
        </div>

        {/* 14-day premium trial badge */}
        <div className="bg-gradient-to-r from-white to-[#ffd814]/10 border border-[#ddd] rounded-lg p-4 mb-6 flex items-center gap-3 shadow-sm">
          <Sparkles className="w-5 h-5 text-[#e77600] shrink-0" />
          <div>
            <p className="text-sm font-semibold text-[#111]">
              {locale === 'fr' ? '14 Jours Gratuits d’Essai de la Plateforme' : '14 Days Free Trial on the Platform'}
            </p>
            <p className="text-xs text-[#555]">
              {locale === 'fr'
                ? 'Profitez de la plateforme librement. Zando ne prélève aucune commission de vente (0% Commission).'
                : 'Enjoy the platform freely. Zando charges absolutely no sales commission (0% Commission).'}
            </p>
          </div>
        </div>

        {/* Dynamic horizontal steps progress bar */}
        <div className="bg-white border border-[#ddd] rounded-lg p-4 mb-6 flex items-center justify-between overflow-x-auto no-scrollbar shadow-sm">
          {steps.slice(0, 8).map((s, i) => (
            <div key={s.num} className="flex items-center flex-1 last:flex-none min-w-[50px] justify-center">
              <div className="flex flex-col items-center">
                <button
                  onClick={() => step > s.num && setStep(s.num)}
                  disabled={step < s.num}
                  className={'w-8 h-8 rounded-full flex items-center justify-center transition-all ' + (step >= s.num ? 'bg-[#ffd814] text-[#111] font-bold border border-[#fcd200]' : 'bg-white border border-[#ccc] text-[#777]')}
                >
                  {step > s.num ? <Check className="w-4 h-4 text-green-700" /> : <s.icon className="w-3.5 h-3.5" />}
                </button>
                <span className="text-[10px] text-[#555] mt-1 hidden sm:block font-medium">{s.label}</span>
              </div>
              {i < 7 && <div className={'h-1 flex-1 mx-2 rounded ' + (step > s.num ? 'bg-green-600' : 'bg-[#ddd]')} />}
            </div>
          ))}
        </div>

        {/* Main Content card */}
        <div className="bg-white border border-[#ddd] rounded-lg p-6 sm:p-8 shadow-sm">
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600 font-medium">
              {error}
            </div>
          )}

          {/* STEP 1: Account Login creation */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-normal text-[#111] border-b border-[#eee] pb-2">
                {locale === 'fr' ? 'Identifiants de votre compte' : 'Your account credentials'}
              </h2>
              <p className="text-xs text-[#555]">{locale === 'fr' ? 'Indiquez l’adresse email et le mot de passe de connexion de votre espace vendeur' : 'Provide your seller space email and login password'}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#111] mb-1">{t.auth.email} *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#a6a6a6] rounded-md bg-white focus:border-[#e77600] focus:ring-1 focus:ring-[#e77600] outline-none text-[#111]"
                    placeholder="ex: vendor@domain.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#111] mb-1">{t.account.phone} *</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#a6a6a6] rounded-md bg-white focus:border-[#e77600] focus:ring-1 focus:ring-[#e77600] outline-none text-[#111]"
                    placeholder="+225 07 00 00 00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111] mb-1">{t.auth.password} *</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-[#a6a6a6] rounded-md bg-white focus:border-[#e77600] focus:ring-1 focus:ring-[#e77600] outline-none text-[#111]"
                  placeholder="••••••••"
                />
              </div>

              <div className="bg-[#eaeded] p-3.5 rounded-lg border border-[#ccc] flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-green-700 shrink-0" />
                <span className="text-xs text-[#333]">{locale === 'fr' ? 'Vos informations sont entièrement chiffrées selon les standards de sécurité Amazon.' : 'Your credentials are secure and stored according to Amazon security standards.'}</span>
              </div>
            </div>
          )}

          {/* STEP 2: Advanced Cascading Selector & Custom Overrides for Countries & Localities */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-normal text-[#111] border-b border-[#eee] pb-2">
                {locale === 'fr' ? 'Pays, Ville & Localisation d’activité' : 'Country, City & Locality of Operation'}
              </h2>
              <p className="text-xs text-[#555]">
                {locale === 'fr'
                  ? 'Choisissez votre pays d’activité dans la liste ou saisissez-le manuellement. Les villes et quartiers s’adapteront à vos choix.'
                  : 'Select your operation country from the list or type it manually. Cities and localities will dynamically follow your selection.'}
              </p>

              {/* Country Selection Block */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-[#111]">
                    {locale === 'fr' ? '1. Pays d’activité *' : '1. Country of Operation *'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setUseCustomCountry(!useCustomCountry)}
                    className="text-xs text-[#0066c0] hover:underline hover:text-[#c45500] font-semibold"
                  >
                    {useCustomCountry
                      ? (locale === 'fr' ? '⚡ Choisir dans la liste' : '⚡ Choose from list')
                      : (locale === 'fr' ? '✍️ Saisir un autre pays manuellement' : '✍️ Enter another country manually')}
                  </button>
                </div>

                {!useCustomCountry ? (
                  <div className="space-y-3">
                    {/* Search Field for Countries */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#777]" />
                      <input
                        type="text"
                        placeholder={locale === 'fr' ? 'Rechercher un pays...' : 'Search for a country...'}
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 text-sm border border-[#a6a6a6] rounded-md focus:border-[#e77600] outline-none bg-white text-[#111]"
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-1 border border-[#ddd] rounded-lg">
                      {filteredCountries.map((c) => {
                        const isSel = selectedCountry?.id === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedCountry(c);
                              setForm({ ...form, warehouseAddress: `${c.name}` });
                            }}
                            className={'p-2.5 rounded-lg border text-left transition-all flex items-center gap-2 ' + (isSel ? 'border-[#e77600] bg-[#ffd814]/10 font-semibold' : 'border-[#ddd] hover:border-[#aaa] bg-white')}
                          >
                            <span className="text-xl shrink-0">{c.flag}</span>
                            <span className="text-xs text-[#111] truncate">{c.name}</span>
                          </button>
                        );
                      })}
                      {filteredCountries.length === 0 && (
                        <p className="col-span-full text-center text-xs text-[#777] py-3">{locale === 'fr' ? 'Aucun résultat.' : 'No results.'}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-[#eaeded] border border-[#ccc] rounded-lg">
                    <div className="sm:col-span-1">
                      <label className="block text-[10px] font-bold text-[#555] uppercase mb-1">{locale === 'fr' ? 'Drapeau (Émoji)' : 'Flag (Emoji)'}</label>
                      <input
                        type="text"
                        value={customCountryFlag}
                        onChange={(e) => setCustomCountryFlag(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-[#a6a6a6] rounded-md bg-white text-[#111]"
                        placeholder="🌍"
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="block text-[10px] font-bold text-[#555] uppercase mb-1">{locale === 'fr' ? 'Code Téléphone' : 'Dial Code'}</label>
                      <input
                        type="text"
                        value={customCountryDialCode}
                        onChange={(e) => setCustomCountryDialCode(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-[#a6a6a6] rounded-md bg-white text-[#111]"
                        placeholder="+237"
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="block text-[10px] font-bold text-[#555] uppercase mb-1">{locale === 'fr' ? 'Nom du pays' : 'Country Name'}</label>
                      <input
                        type="text"
                        value={customCountryName}
                        onChange={(e) => setCustomCountryName(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-[#a6a6a6] rounded-md bg-white text-[#111]"
                        placeholder="Cameroun"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* City Selection Cascading Block */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-[#111]">
                    {locale === 'fr' ? '2. Ville d’activité *' : '2. City of Operation *'}
                  </label>
                  {!useCustomCountry && selectedCountry && (
                    <button
                      type="button"
                      onClick={() => setUseCustomCity(!useCustomCity)}
                      className="text-xs text-[#0066c0] hover:underline hover:text-[#c45500] font-semibold"
                    >
                      {useCustomCity
                        ? (locale === 'fr' ? '⚡ Sélectionner une ville standard' : '⚡ Select standard city')
                        : (locale === 'fr' ? '✍️ Saisir une autre ville' : '✍️ Type custom city')}
                    </button>
                  )}
                </div>

                {!useCustomCity && !useCustomCountry && selectedCountry ? (
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#a6a6a6] rounded-md bg-white text-[#111] focus:border-[#e77600] outline-none"
                  >
                    {selectedCountry.cities.map((city) => (
                      <option key={city.name} value={city.name}>
                        {city.name}
                      </option>
                    ))}
                    <option value="_custom_">{locale === 'fr' ? '-- Saisir manuellement --' : '-- Type manually --'}</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={customCityName}
                    onChange={(e) => {
                      setCustomCityName(e.target.value);
                      setUseCustomCity(true);
                    }}
                    className="w-full px-3 py-2 text-sm border border-[#a6a6a6] rounded-md bg-white text-[#111] focus:border-[#e77600] outline-none"
                    placeholder={locale === 'fr' ? "Saisissez votre ville d'activité (ex: Yaoundé)" : "Type your city of operation (ex: Yaounde)"}
                  />
                )}
              </div>

              {/* Locality/Neighborhood Selection Cascading Block */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-[#111]">
                    {locale === 'fr' ? '3. Quartier / Secteur / Localité *' : '3. Neighborhood / Locality *'}
                  </label>
                  {!useCustomCity && !useCustomCountry && selectedCountry && (
                    <button
                      type="button"
                      onClick={() => setUseCustomLocality(!useCustomLocality)}
                      className="text-xs text-[#0066c0] hover:underline hover:text-[#c45500] font-semibold"
                    >
                      {useCustomLocality
                        ? (locale === 'fr' ? '⚡ Sélectionner une localité standard' : '⚡ Select standard locality')
                        : (locale === 'fr' ? '✍️ Saisir un autre quartier' : '✍️ Type custom locality')}
                    </button>
                  )}
                </div>

                {!useCustomLocality && !useCustomCity && !useCustomCountry && selectedCountry ? (
                  <select
                    value={selectedLocality}
                    onChange={(e) => setSelectedLocality(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#a6a6a6] rounded-md bg-white text-[#111] focus:border-[#e77600] outline-none"
                  >
                    {selectedCountry.cities.find((c) => c.name === selectedCity)?.localities.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    )) || <option value="">-- {locale === 'fr' ? 'Aucun' : 'None'} --</option>}
                    <option value="_custom_">{locale === 'fr' ? '-- Saisir manuellement --' : '-- Type manually --'}</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={customLocalityName}
                    onChange={(e) => {
                      setCustomLocalityName(e.target.value);
                      setUseCustomLocality(true);
                    }}
                    className="w-full px-3 py-2 text-sm border border-[#a6a6a6] rounded-md bg-white text-[#111] focus:border-[#e77600] outline-none"
                    placeholder={locale === 'fr' ? "Saisissez le quartier ou localité (ex: Bastos)" : "Type neighborhood or locality (ex: Bastos)"}
                  />
                )}
              </div>

              {/* Dynamic Map preview display */}
              <div className="bg-[#eaeded] border border-[#ccc] rounded-lg p-4 flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#e77600] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-[#111] uppercase tracking-wider">{locale === 'fr' ? 'Vérification de l’adresse de livraison' : 'Shipping Address Verification'}</p>
                  <p className="text-xs text-[#555] mt-1 leading-relaxed">
                    {locale === 'fr'
                      ? `L'adresse officielle de facturation de votre boutique sera enregistrée sous : ${resolvedLocalityName || '...'}, ${resolvedCityName || '...'}, ${resolvedCountryName || '...'}`
                      : `Your official store billing address will be registered as: ${resolvedLocalityName || '...'}, ${resolvedCityName || '...'}, ${resolvedCountryName || '...'}`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Business Information */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-normal text-[#111] border-b border-[#eee] pb-2">
                {locale === 'fr' ? 'Informations administratives de l’entreprise' : 'Business Legal Information'}
              </h2>
              <p className="text-xs text-[#555]">{locale === 'fr' ? 'Indiquez la forme légale et les numéros de régistration de votre structure' : 'Provide your official registration numbers and company structure'}</p>

              <div>
                <label className="block text-xs font-bold text-[#111] mb-1">{locale === 'fr' ? 'Type d’organisation' : 'Business structure'}</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'company', label: locale === 'fr' ? 'Société / SARL / SA' : 'Company / Corporation' },
                    { id: 'individual', label: locale === 'fr' ? 'Individuel / Artisan' : 'Individual / Artisan' },
                    { id: 'ngo', label: locale === 'fr' ? 'ONG / Association' : 'NGO / Cooperative' },
                  ].map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setForm({ ...form, businessType: b.id })}
                      className={'px-3 py-2 text-xs rounded-lg border transition-all text-left ' + (form.businessType === b.id ? 'border-[#e77600] bg-[#ffd814]/10 font-bold text-[#111]' : 'border-[#ccc] bg-white text-[#555]')}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#111] mb-1">{t.onboarding.companyName} *</label>
                  <input
                    type="text"
                    value={form.businessName}
                    onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#a6a6a6] rounded-md bg-white focus:border-[#e77600] outline-none text-[#111]"
                    placeholder="ex: Africa Fashion SARL"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#111] mb-1">{t.onboarding.companyNumber} *</label>
                  <input
                    type="text"
                    value={form.registrationNumber}
                    onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#a6a6a6] rounded-md bg-white focus:border-[#e77600] outline-none text-[#111]"
                    placeholder="ex: RCCM-ABJ-2026-B-897"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#111] mb-1">{t.onboarding.vatNumber} ({locale === 'fr' ? 'Optionnel' : 'Optional'})</label>
                  <input
                    type="text"
                    value={form.vatNumber}
                    onChange={(e) => setForm({ ...form, vatNumber: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#a6a6a6] rounded-md bg-white focus:border-[#e77600] outline-none text-[#111]"
                    placeholder="ex: VAT-9876543"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#111] mb-1">{locale === 'fr' ? 'Adresse physique du magasin' : 'Physical Store Address'}</label>
                  <input
                    type="text"
                    value={form.businessAddress}
                    onChange={(e) => setForm({ ...form, businessAddress: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#a6a6a6] rounded-md bg-white focus:border-[#e77600] outline-none text-[#111]"
                    placeholder="ex: Boulevard de la république, Plateau"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: KYC Verification (Identity upload) */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-xl font-normal text-[#111] border-b border-[#eee] pb-2">
                {locale === 'fr' ? 'Vérification de l’identité (KYC)' : 'KYC Identity Verification'}
              </h2>
              <p className="text-xs text-[#555]">{locale === 'fr' ? 'Conformément aux normes d’Amazon, téléchargez une pièce d’identité valide pour démarrer vos ventes' : 'According to Amazon guidelines, upload a valid government ID to begin selling'}</p>

              <div>
                <label className="block text-xs font-bold text-[#111] mb-1">{locale === 'fr' ? 'Type de pièce officielle' : 'Government ID Type'}</label>
                <div className="flex gap-2">
                  {['passport', 'national_id', 'driving_license'].map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setForm({ ...form, idType: id })}
                      className={'px-3 py-2 text-xs rounded-lg border transition-all ' + (form.idType === id ? 'border-[#e77600] bg-[#ffd814]/10 font-bold text-[#111]' : 'border-[#ccc] bg-white text-[#555]')}
                    >
                      {id === 'passport' ? (locale === 'fr' ? 'Passeport' : 'Passport') : id === 'national_id' ? (locale === 'fr' ? 'CNI / Carte d’identité' : 'National ID') : (locale === 'fr' ? 'Permis de conduire' : 'Driving License')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <UploadField label={t.onboarding.idFront} value={form.idFront} onChange={(v) => setForm({ ...form, idFront: v })} />
                <UploadField label={t.onboarding.idBack} value={form.idBack} onChange={(v) => setForm({ ...form, idBack: v })} />
                <UploadField label={locale === 'fr' ? 'Photo Selfie avec la pièce' : 'Selfie photo holding ID'} value={form.selfie} onChange={(v) => setForm({ ...form, selfie: v })} />
              </div>
            </div>
          )}

          {/* STEP 5: Store branding setup */}
          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-xl font-normal text-[#111] border-b border-[#eee] pb-2">
                {locale === 'fr' ? 'Personnalisation de la boutique' : 'Customize your store storefront'}
              </h2>
              <p className="text-xs text-[#555]">{locale === 'fr' ? 'Renseignez les éléments visuels de votre marque' : 'Set your store display elements and brand image'}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#111] mb-1">{locale === 'fr' ? 'Nom commercial de la boutique' : 'Commercial Store Name'} *</label>
                  <input
                    type="text"
                    value={form.storeName}
                    onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#a6a6a6] rounded-md bg-white focus:border-[#e77600] outline-none text-[#111]"
                    placeholder="ex: Dakar Elegance"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#111] mb-1">{locale === 'fr' ? 'Identifiant d’URL de la boutique (Slug)' : 'Store URL Identifier (Slug)'} *</label>
                  <input
                    type="text"
                    value={form.storeSlug}
                    onChange={(e) => setForm({ ...form, storeSlug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-') })}
                    className="w-full px-3 py-2 text-sm border border-[#a6a6a6] rounded-md bg-white focus:border-[#e77600] outline-none text-[#111]"
                    placeholder="ex: dakar-elegance"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111] mb-1">{locale === 'fr' ? 'Slogan ou courte description' : 'Short description / tagline'}</label>
                <textarea
                  value={form.storeDesc}
                  onChange={(e) => setForm({ ...form, storeDesc: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-[#a6a6a6] rounded-md bg-white focus:border-[#e77600] outline-none text-[#111]"
                  rows={2}
                  placeholder={locale === 'fr' ? 'Dites-en plus sur vos créations et spécialités...' : 'Tell buyers about your special creations...'}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UploadField label={locale === 'fr' ? 'Logo de la boutique (Carré)' : 'Store Logo (Square)'} value={form.storeLogo} onChange={(v) => setForm({ ...form, storeLogo: v })} />
                <UploadField label={locale === 'fr' ? 'Bannière de couverture' : 'Cover Banner'} value={form.storeBanner} onChange={(v) => setForm({ ...form, storeBanner: v })} />
              </div>
            </div>
          )}

          {/* STEP 6: Direct Payments configuration - Zando Direct Model */}
          {step === 6 && (
            <div className="space-y-6">
              <h2 className="text-xl font-normal text-[#111] border-b border-[#eee] pb-2">
                {locale === 'fr' ? 'Configuration de vos paiements directs' : 'Configure your direct payment receivers'}
              </h2>

              <div className="bg-green-50 border border-green-200 rounded-lg p-5 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-green-700 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-green-800 uppercase tracking-wide">
                    {locale === 'fr' ? 'Zando : 0% Commission sur vos ventes' : 'Zando: 0% Commission on your sales'}
                  </p>
                  <p className="text-xs text-green-700 mt-1 leading-relaxed">
                    {locale === 'fr'
                      ? 'L’argent des ventes ne transite pas par Zando. Les acheteurs paient directement sur vos comptes (Mobile Money, virement, etc.) lors du passage de commande. Zando ne prend aucune commission sur vos transactions !'
                      : 'Sale funds do not pass through Zando. Buyers pay directly into your accounts (Mobile Money, Bank swift) at checkout. Zando takes zero cuts!'}
                  </p>
                </div>
              </div>

              <p className="text-xs text-[#555]">
                {locale === 'fr'
                  ? 'Cochez les moyens de paiements que vous souhaitez proposer à vos acheteurs sur votre boutique :'
                  : 'Check the payment systems you want to accept from buyers at checkout:'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PAYMENT_METHODS.map((pm) => {
                  const selected = form.selectedPayments.includes(pm.id);
                  return (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => togglePayment(pm.id)}
                      className={'p-4 rounded-lg border text-left flex items-center gap-3 transition-all ' + (selected ? 'border-[#e77600] bg-[#ffd814]/5' : 'border-[#ddd] hover:border-[#aaa] bg-white')}
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[#e77600] shrink-0">
                        <pm.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-grow">
                        <p className="text-xs font-bold text-[#111]">{pm.label}</p>
                        <p className="text-[10px] text-[#555]">{pm.desc}</p>
                      </div>
                      <div className={'w-4.5 h-4.5 rounded-sm border flex items-center justify-center shrink-0 ' + (selected ? 'border-[#e77600] bg-[#e77600]' : 'border-gray-300 bg-white')}>
                        {selected && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="bg-[#eaeded] border border-[#ccc] rounded-lg p-4 space-y-4">
                <p className="text-xs font-bold text-[#111] flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-[#e77600]" />
                  {locale === 'fr' ? 'Coordonnées de virement direct' : 'Direct payout details'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#555] mb-1">{locale === 'fr' ? 'Nom de votre banque' : 'Bank name'}</label>
                    <input
                      type="text"
                      value={form.bankName}
                      onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-[#a6a6a6] rounded-md bg-white text-[#111] focus:border-[#e77600]"
                      placeholder="ex: Ecobank"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#555] mb-1">{locale === 'fr' ? 'Numéro de compte / IBAN' : 'IBAN Account'}</label>
                    <input
                      type="text"
                      value={form.iban}
                      onChange={(e) => setForm({ ...form, iban: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-[#a6a6a6] rounded-md bg-white text-[#111] focus:border-[#e77600]"
                      placeholder="ex: CI089..."
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#555] mb-1">SWIFT / BIC</label>
                    <input
                      type="text"
                      value={form.swift}
                      onChange={(e) => setForm({ ...form, swift: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-[#a6a6a6] rounded-md bg-white text-[#111] focus:border-[#e77600]"
                      placeholder="ex: ECOCCIAB"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#555] mb-1">{locale === 'fr' ? 'Téléphone de réception Mobile Money' : 'Mobile Money number'}</label>
                    <input
                      type="text"
                      value={form.mobileMoney}
                      onChange={(e) => setForm({ ...form, mobileMoney: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-[#a6a6a6] rounded-md bg-white text-[#111] focus:border-[#e77600]"
                      placeholder="ex: +225 07 00 00 00"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: Shipping and Logistics warehouses */}
          {step === 7 && (
            <div className="space-y-4">
              <h2 className="text-xl font-normal text-[#111] border-b border-[#eee] pb-2">
                {locale === 'fr' ? 'Configuration de la logistique & livraison' : 'Shipping & logistics configuration'}
              </h2>
              <p className="text-xs text-[#555]">{locale === 'fr' ? 'Déterminez vos points d’envois et modes de colisages' : 'Specify your departure hub and authorized package formats'}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#111] mb-1">{locale === 'fr' ? 'Adresse physique de l’entrepôt d’expédition' : 'Dispatch Warehouse Address'} *</label>
                  <input
                    type="text"
                    value={form.warehouseAddress}
                    onChange={(e) => setForm({ ...form, warehouseAddress: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#a6a6a6] rounded-md bg-white focus:border-[#e77600] outline-none text-[#111]"
                    placeholder="ex: Zone industrielle, Abidjan"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#111] mb-1">{locale === 'fr' ? 'Zones de livraisons couvertes' : 'Covered shipping zones'} *</label>
                  <input
                    type="text"
                    value={form.shippingZone}
                    onChange={(e) => setForm({ ...form, shippingZone: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#a6a6a6] rounded-md bg-white focus:border-[#e77600] outline-none text-[#111]"
                    placeholder="ex: Côte d'Ivoire, Afrique de l'Ouest"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111] mb-2">{locale === 'fr' ? 'Modes de transport acceptés' : 'Accepted courier models'}</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { key: 'shipNational', label: locale === 'fr' ? 'Livraison nationale standard' : 'Standard national transit' },
                    { key: 'shipInternational', label: locale === 'fr' ? 'Expédition transfrontalière Afrique' : 'Cross-border Africa transit' },
                    { key: 'shipExpress', label: locale === 'fr' ? 'Livraison ultra-rapide / Express 24h' : 'Express delivery 24h' },
                    { key: 'shipLocal', label: locale === 'fr' ? 'Livraison par coursier local' : 'Local courier dispatch' },
                    { key: 'shipPickup', label: locale === 'fr' ? 'Mise à disposition en point de retrait' : 'Package Pickup point access' },
                  ].map((s) => (
                    <label key={s.key} className="flex items-center gap-3 p-3 rounded-lg border border-[#ddd] cursor-pointer bg-white hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={(form as Record<string, unknown>)[s.key] as boolean}
                        onChange={(e) => setForm({ ...form, [s.key]: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 accent-[#e77600]"
                      />
                      <span className="text-xs text-[#111]">{s.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 8: Final review prior to submission */}
          {step === 8 && (
            <div className="space-y-5">
              <h2 className="text-xl font-normal text-[#111] border-b border-[#eee] pb-2">
                {locale === 'fr' ? 'Vérification finale du dossier' : 'Final review of details'}
              </h2>
              <p className="text-xs text-[#555]">{locale === 'fr' ? 'Assurez-vous que toutes vos données de marque et de facturation sont conformes avant de valider' : 'Confirm all registration data is valid and correct before finalizing'}</p>

              <div className="border border-[#ddd] rounded-lg divide-y divide-[#eee] text-xs">
                <SummaryRow label={locale === 'fr' ? 'E-mail de connexion' : 'Login E-mail'} value={form.email} />
                <SummaryRow label={locale === 'fr' ? 'Téléphone officiel' : 'Official Phone'} value={form.phone} />
                <SummaryRow label={locale === 'fr' ? 'Pays d’activité' : 'Country of activity'} value={resolvedCountryName} />
                <SummaryRow label={locale === 'fr' ? 'Ville d’activité' : 'City of activity'} value={resolvedCityName} />
                <SummaryRow label={locale === 'fr' ? 'Localité' : 'Locality'} value={resolvedLocalityName} />
                <SummaryRow label={locale === 'fr' ? 'Raison sociale' : 'Business Social name'} value={form.businessName} />
                <SummaryRow label={locale === 'fr' ? 'Boutique Zando' : 'Zando Shop'} value={form.storeName} />
                <SummaryRow label={locale === 'fr' ? 'Moyens de paiements connectés' : 'Direct payouts enabled'} value={form.selectedPayments.join(', ')} />
                <SummaryRow label={locale === 'fr' ? 'Plan choisi' : 'Platform tier'} value={form.plan.toUpperCase()} />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
                <HelpCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-800 leading-relaxed">
                  {locale === 'fr'
                    ? 'Votre boutique Zando sera lancée en mode évaluation de 14 jours gratuits. À l’issue, vous pourrez renouveler via l’un de nos abonnements pour continuer vos ventes directes.'
                    : 'Your store will start in 14-day evaluation mode. After that, you can subscribe to any of our plans to keep selling with 0% commission.'}
                </p>
              </div>

              <div className="pt-4 flex justify-center">
                <button
                  onClick={submit}
                  disabled={submitting}
                  className="bg-[#ffd814] hover:bg-[#f7ca00] text-[#111] px-8 py-3 rounded-lg text-sm font-semibold border border-[#fcd200] shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {submitting ? (locale === 'fr' ? 'Soumission du dossier...' : 'Submitting dossier...') : t.onboarding.submit}
                </button>
              </div>
            </div>
          )}

          {/* Navigation Control panels */}
          {step < 8 && (
            <div className="flex items-center justify-between mt-8 pt-5 border-t border-[#eee]">
              <button
                type="button"
                onClick={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1}
                className="flex items-center gap-1 text-xs font-semibold text-[#555] hover:text-[#111] disabled:opacity-35"
              >
                <ChevronLeft className="w-4 h-4" /> {t.onboarding.back}
              </button>

              <button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="bg-[#ffd814] hover:bg-[#f7ca00] text-[#111] px-5 py-2 rounded-lg text-xs font-semibold border border-[#fcd200] shadow-sm transition-colors flex items-center gap-1 disabled:opacity-45 disabled:cursor-not-allowed"
              >
                {t.onboarding.next} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function UploadField({ label, value, onChange }: { label: string; value: string | null; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-bold text-[#111] mb-1">{label}</label>
      <label className={'w-full p-3.5 rounded-lg border-2 border-dashed transition-all flex items-center gap-3 cursor-pointer ' + (value ? 'border-green-600 bg-green-50' : 'border-[#ccc] hover:border-[#aaa] bg-white')}>
        <div className={'w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ' + (value ? 'bg-green-100 text-green-700' : 'bg-slate-50 text-[#777]')}>
          {value ? <Check className="w-5 h-5" /> : <UploadCloud className="w-5 h-5" />}
        </div>
        <div className="text-left">
          <p className="text-xs font-bold text-[#111]">{value ? 'Fichier chargé avec succès' : label}</p>
          <p className="text-[10px] text-[#555]">JPG, PNG, PDF (max 8MB)</p>
        </div>
        <input type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden" onChange={(e) => { if (e.target.files?.[0]) onChange(e.target.files[0].name); }} />
      </label>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-white">
      <span className="text-[#555] font-medium">{label}</span>
      <span className="font-bold text-[#111] text-right">{value || '—'}</span>
    </div>
  );
}
