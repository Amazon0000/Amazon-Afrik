import { useApp } from '@/lib/store';
import {
  Info, HelpCircle, Truck, RotateCcw, CreditCard, FileText, ShieldCheck,
  Briefcase, Mail, Headphones, ArrowRight, ChevronRight, MapPin, Clock, Globe,
} from 'lucide-react';
import { useState } from 'react';

export type InfoKey =
  | 'about' | 'sell-guide' | 'help' | 'shipping' | 'returns' | 'payment-methods'
  | 'terms' | 'privacy' | 'cookies' | 'legal-notice' | 'careers' | 'contact'
  | 'protect-brand' | 'fulfillment' | 'supply-to-zando' | 'become-affiliate' | 'recalls-safety';

const infoMeta: Record<InfoKey, { icon: typeof Info; frTitle: string; enTitle: string }> = {
  'about': { icon: Info, frTitle: 'À propos de Zando', enTitle: 'About Zando' },
  'sell-guide': { icon: Briefcase, frTitle: 'Comment vendre sur Zando', enTitle: 'How to Sell on Zando' },
  'help': { icon: HelpCircle, frTitle: "Centre d'aide & FAQ", enTitle: 'Help Center & FAQ' },
  'shipping': { icon: Truck, frTitle: 'Livraison & délais', enTitle: 'Shipping & Delivery' },
  'returns': { icon: RotateCcw, frTitle: 'Retours & remboursements', enTitle: 'Returns & Refunds' },
  'payment-methods': { icon: CreditCard, frTitle: 'Modes de paiement', enTitle: 'Payment Methods' },
  'terms': { icon: FileText, frTitle: "Conditions d'utilisation", enTitle: 'Terms of Use' },
  'privacy': { icon: ShieldCheck, frTitle: 'Confidentialité', enTitle: 'Privacy Policy' },
  'cookies': { icon: FileText, frTitle: 'Cookies', enTitle: 'Cookies Policy' },
  'legal-notice': { icon: FileText, frTitle: 'Mentions légales', enTitle: 'Legal Notice' },
  'careers': { icon: Briefcase, frTitle: 'Carrières', enTitle: 'Careers' },
  'contact': { icon: Mail, frTitle: 'Contact', enTitle: 'Contact Us' },
  'protect-brand': { icon: ShieldCheck, frTitle: 'Protéger votre marque', enTitle: 'Protect & Build Your Brand' },
  'fulfillment': { icon: Truck, frTitle: 'Fulfillment par vendeur', enTitle: 'Fulfillment by Vendor' },
  'supply-to-zando': { icon: Briefcase, frTitle: 'Approvisionner Zando', enTitle: 'Supply to Zando' },
  'become-affiliate': { icon: Info, frTitle: 'Devenir Affilié', enTitle: 'Become an Affiliate' },
  'recalls-safety': { icon: HelpCircle, frTitle: 'Rappels & Sécurité', enTitle: 'Recalls & Product Safety' },
};

type FAQItem = { q: string; a: string };

function FAQAccordion({ items }: { items: FAQItem[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="card overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between p-4 text-left"
          >
            <span className="text-sm font-semibold text-[#0f172a]">{item.q}</span>
            <ChevronRight className={`w-4 h-4 text-[#64748b] transition-transform ${open === i ? 'rotate-90' : ''}`} />
          </button>
          {open === i && (
            <div className="px-4 pb-4 text-sm text-[#64748b] leading-relaxed">{item.a}</div>
          )}
        </div>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold text-[#0f172a] mb-3">{title}</h2>
      <div className="text-sm text-[#475569] leading-relaxed space-y-3">{children}</div>
    </div>
  );
}

export function InfoPage({ pageKey }: { pageKey: InfoKey }) {
  const { locale, navigate } = useApp();
  const meta = infoMeta[pageKey];
  const Icon = meta.icon;
  const title = locale === 'fr' ? meta.frTitle : meta.enTitle;

  return (
    <div className="bg-[#f7f8fa] min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-[#e2e8f0]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3">
          <nav className="flex items-center gap-2 text-xs text-[#64748b]">
            <button onClick={() => navigate('home')} className="hover:text-[#0e9f6e]">Zando</button>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[#0f172a] font-medium">{title}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#0e9f6e]/10 flex items-center justify-center">
            <Icon className="w-7 h-7 text-[#0e9f6e]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0f172a]">{title}</h1>
            <p className="text-sm text-[#64748b]">Zando — {locale === 'fr' ? 'La marketplace premium d\'Afrique' : 'Africa\'s premium marketplace'}</p>
          </div>
        </div>

        <div className="card p-6 sm:p-8">
          {pageKey === 'about' && (locale === 'fr' ? (
            <>
              <Section title="Notre mission">
                <p>Zando est la marketplace premium dédiée au commerce africain. Notre mission est de connecter les vendeurs professionnels vérifiés à des millions d'acheteurs à travers les 54 pays d'Afrique, avec un système de paiement direct et une livraison assurée par le vendeur lui-même.</p>
                <p>Contrairement aux marketplaces traditionnelles qui prélèvent des commissions importantes, Zando permet aux vendeurs de recevoir le paiement directement, renforçant ainsi la confiance et la transparence dans chaque transaction.</p>
              </Section>
              <Section title="Pourquoi Zando ?">
                <p><strong>Vendeurs vérifiés :</strong> Chaque vendeur passe par un processus KYC strict (pièce d'identité, certificat d'entreprise, photos du magasin) avant de pouvoir vendre. Cela garantit que vous achetez auprès de professionnels de confiance.</p>
                <p><strong>Paiement direct :</strong> Votre paiement va directement au vendeur. Zando ne prend aucune commission sur la transaction, ce qui permet des prix plus justes.</p>
                <p><strong>Livraison par le vendeur :</strong> Le vendeur livre lui-même ses produits, garantissant un suivi personnalisé et une responsabilité directe.</p>
                <p><strong>Bilingue :</strong> Zando est disponible en français et en anglais pour servir l'ensemble du continent.</p>
              </Section>
              <Section title="Nos valeurs">
                <p><strong>Confiance :</strong> La vérification systématique des vendeurs et la transparence des transactions sont au cœur de notre approche.</p>
                <p><strong>Inclusion :</strong> Nous soutenons les artisans, PME et entrepreneurs africains en leur donnant accès à un marché continental.</p>
                <p><strong>Qualité :</strong> Nous privilégions des produits authentiques et un service client de premier ordre.</p>
              </Section>
              <Section title="Contact">
                <p>Pour toute question, contactez-nous à <a href="mailto:cs@liafrik.com" className="text-[#0e9f6e] font-semibold hover:underline">cs@liafrik.com</a> ou <a href="mailto:zando@liafrik.com" className="text-[#0e9f6e] font-semibold hover:underline">zando@liafrik.com</a>.</p>
              </Section>
            </>
          ) : (
            <>
              <Section title="Our Mission">
                <p>Zando is the premium marketplace dedicated to African commerce. Our mission is to connect verified professional sellers with millions of buyers across all 54 African countries, with a direct payment system and delivery handled by the seller themselves.</p>
                <p>Unlike traditional marketplaces that take significant commissions, Zando allows sellers to receive payment directly, reinforcing trust and transparency in every transaction.</p>
              </Section>
              <Section title="Why Zando?">
                <p><strong>Verified Sellers:</strong> Every seller goes through a strict KYC process (ID, business certificate, store photos) before they can sell. This ensures you buy from trusted professionals.</p>
                <p><strong>Direct Payment:</strong> Your payment goes directly to the seller. Zando takes no commission on the transaction, enabling fairer prices.</p>
                <p><strong>Seller Delivery:</strong> The seller delivers their own products, ensuring personalized tracking and direct accountability.</p>
                <p><strong>Bilingual:</strong> Zando is available in French and English to serve the entire continent.</p>
              </Section>
              <Section title="Our Values">
                <p><strong>Trust:</strong> Systematic seller verification and transaction transparency are at the core of our approach.</p>
                <p><strong>Inclusion:</strong> We support African artisans, SMEs, and entrepreneurs by giving them access to a continental market.</p>
                <p><strong>Quality:</strong> We prioritize authentic products and top-tier customer service.</p>
              </Section>
              <Section title="Contact">
                <p>For any questions, contact us at <a href="mailto:cs@liafrik.com" className="text-[#0e9f6e] font-semibold hover:underline">cs@liafrik.com</a> or <a href="mailto:zando@liafrik.com" className="text-[#0e9f6e] font-semibold hover:underline">zando@liafrik.com</a>.</p>
              </Section>
            </>
          ))}

          {pageKey === 'sell-guide' && (locale === 'fr' ? (
            <>
              <Section title="Comment devenir vendeur sur Zando">
                <p>Vendre sur Zando est simple mais nécessite une vérification rigoureuse pour garantir la confiance des acheteurs. Voici les étapes :</p>
              </Section>
              <Section title="Étape 1 : Créer un compte">
                <p>Inscrivez-vous gratuitement en choisissant le type de compte « Vendeur ». Vous devrez fournir votre adresse e-mail et créer un mot de passe.</p>
              </Section>
              <Section title="Étape 2 : Onboarding et KYC">
                <p>Après l'inscription, vous devez compléter le processus d'onboarding en 5 étapes :</p>
                <p>1. <strong>Pays :</strong> Sélectionnez votre pays d'activité parmi les 54 pays africains.</p>
                <p>2. <strong>Localisation :</strong> Indiquez votre ville, région et adresse exacte.</p>
                <p>3. <strong>Informations légales :</strong> Renseignez le nom de votre entreprise, numéro de registre de commerce, et numéro de TVA si applicable.</p>
                <p>4. <strong>Documents :</strong> Téléversez votre pièce d'identité (recto/verso), certificat d'entreprise, licence commerciale et photos du magasin/entrepôt.</p>
                <p>5. <strong>Validation :</strong> Notre équipe examine votre dossier sous 48h. Vous recevrez une notification par e-mail.</p>
              </Section>
              <Section title="Étape 3 : Choisir un abonnement">
                <p>Zando propose 3 plans d'abonnement : Starter (9$/mois, 10 produits), Premium (29$/mois, 100 produits + outils marketing) et Enterprise (79$/mois, produits illimités + publicité gratuite 7 jours à chaque renouvellement).</p>
              </Section>
              <Section title="Étape 4 : Créer votre catalogue">
                <p>Une fois validé, accédez à votre Seller Center pour créer des produits avec photos, descriptions, variantes, prix et stock. Vous définissez la devise dans laquelle vous vendez.</p>
              </Section>
              <Section title="Étape 5 : Recevoir des commandes et livrer">
                <p>Quand un client commande, vous recevez la notification. Vous gérez l'expédition et la livraison directement. Le paiement vous est versé directement.</p>
              </Section>
              <div className="mt-6">
                <button onClick={() => navigate('onboarding')} className="btn-green px-6 py-3 rounded-lg text-sm font-semibold flex items-center gap-2">
                  {locale === 'fr' ? 'Commencer l\'onboarding' : 'Start onboarding'} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <>
              <Section title="How to Become a Zando Seller">
                <p>Selling on Zando is straightforward but requires rigorous verification to ensure buyer trust. Here are the steps:</p>
              </Section>
              <Section title="Step 1: Create an Account">
                <p>Sign up for free by choosing the "Seller" account type. You'll need to provide your email address and create a password.</p>
              </Section>
              <Section title="Step 2: Onboarding & KYC">
                <p>After registration, complete the 5-step onboarding process:</p>
                <p>1. <strong>Country:</strong> Select your country of operation from 54 African countries.</p>
                <p>2. <strong>Location:</strong> Provide your city, region, and exact address.</p>
                <p>3. <strong>Legal Information:</strong> Enter your business name, trade register number, and VAT number if applicable.</p>
                <p>4. <strong>Documents:</strong> Upload your ID (front/back), business certificate, commercial license, and store/warehouse photos.</p>
                <p>5. <strong>Validation:</strong> Our team reviews your application within 48 hours. You'll receive an email notification.</p>
              </Section>
              <Section title="Step 3: Choose a Subscription">
                <p>Zando offers 3 subscription plans: Starter ($9/mo, 10 products), Premium ($29/mo, 100 products + marketing tools), and Enterprise ($79/mo, unlimited products + 7 days free ads on each renewal).</p>
              </Section>
              <Section title="Step 4: Build Your Catalog">
                <p>Once approved, access your Seller Center to create products with photos, descriptions, variants, pricing, and stock. You set the currency you sell in.</p>
              </Section>
              <Section title="Step 5: Receive Orders & Deliver">
                <p>When a customer orders, you receive a notification. You handle shipping and delivery directly. Payment is sent directly to you.</p>
              </Section>
              <div className="mt-6">
                <button onClick={() => navigate('onboarding')} className="btn-green px-6 py-3 rounded-lg text-sm font-semibold flex items-center gap-2">
                  Start onboarding <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          ))}

          {pageKey === 'help' && (
            <>
              <Section title={locale === 'fr' ? 'Questions fréquentes' : 'Frequently Asked Questions'}>
                <FAQAccordion items={locale === 'fr' ? [
                  { q: 'Comment suivre ma commande ?', a: 'Allez dans Mon compte > Mes commandes et cliquez sur Suivre pour voir le statut en temps réel. Vous pouvez aussi utiliser la page de suivi avec votre numero de commande.' },
                  { q: 'Comment contacter un vendeur ?', a: 'Sur la page du produit, cliquez sur « Visiter la boutique » pour accéder au profil du vendeur. Vous pouvez aussi utiliser l\'icône Messages dans l\'en-tête.' },
                  { q: 'Le paiement est-il sécurisé ?', a: 'Oui. Zando utilise des fournisseurs de paiement certifiés (Mobile Money, Paystack, Flutterwave, Stripe, PayPal). Votre paiement va directement au vendeur.' },
                  { q: 'Puis-je retourner un produit ?', a: 'Oui, sous 7 jours après réception si le produit est défectueux ou non conforme. Consultez notre politique de retours pour plus de détails.' },
                  { q: 'Comment devenir vendeur ?', a: 'Inscrivez-vous avec un compte vendeur, complétez l\'onboarding KYC en 5 étapes, et commencez à vendre après validation (sous 48h).' },
                  { q: 'Dans quelles devises puis-je vendre ?', a: 'Zando supporte USD, XOF (Franc CFA), NGN (Naira), GHS (Cedi), KES (Shilling kényan), ZAR (Rand) et d\'autres. Le vendeur choisit sa devise.' },
                  { q: 'Quels pays sont couverts ?', a: 'Les 54 pays d\'Afrique. Vous pouvez filtrer les produits par pays et par ville dans le catalogue.' },
                  { q: 'Comment fonctionnent les publicités Zando Ads ?', a: 'Les vendeurs peuvent créer des campagnes sponsorisées avec un budget et une durée. Le coût est calculé automatiquement en USD selon la durée et les paramètres choisis.' },
                ] : [
                  { q: 'How do I track my order?', a: 'Go to My Account > My Orders and click Track to see real-time status. You can also use the tracking page with your order number.' },
                  { q: 'How do I contact a seller?', a: 'On the product page, click "Visit Store" to access the seller\'s profile. You can also use the Messages icon in the header.' },
                  { q: 'Is payment secure?', a: 'Yes. Zando uses certified payment providers (Mobile Money, Paystack, Flutterwave, Stripe, PayPal). Your payment goes directly to the seller.' },
                  { q: 'Can I return a product?', a: 'Yes, within 7 days of receipt if the product is defective or not as described. See our returns policy for details.' },
                  { q: 'How do I become a seller?', a: 'Sign up with a seller account, complete the 5-step KYC onboarding, and start selling after approval (within 48h).' },
                  { q: 'Which currencies can I sell in?', a: 'Zando supports USD, XOF (CFA Franc), NGN (Naira), GHS (Cedi), KES (Kenyan Shilling), ZAR (Rand) and more. The seller chooses their currency.' },
                  { q: 'Which countries are covered?', a: 'All 54 African countries. You can filter products by country and city in the catalog.' },
                  { q: 'How do Zando Ads work?', a: 'Sellers can create sponsored campaigns with a budget and duration. Cost is automatically calculated in USD based on duration and chosen parameters.' },
                ]} />
              </Section>
              <Section title={locale === 'fr' ? 'Contactez-nous' : 'Contact Us'}>
                <p>{locale === 'fr' ? 'Vous ne trouvez pas votre réponse ? Notre équipe support est disponible 24/7.' : 'Can\'t find your answer? Our support team is available 24/7.'}</p>
                <div className="flex flex-col gap-2 mt-3">
                  <a href="mailto:support@liafrik.com" className="text-[#0e9f6e] font-semibold hover:underline flex items-center gap-2"><Mail className="w-4 h-4" /> support@liafrik.com</a>
                  <a href="mailto:cs@liafrik.com" className="text-[#0e9f6e] font-semibold hover:underline flex items-center gap-2"><Mail className="w-4 h-4" /> cs@liafrik.com</a>
                </div>
              </Section>
            </>
          )}

          {pageKey === 'shipping' && (locale === 'fr' ? (
            <>
              <Section title="Livraison & délais">
                <p>Sur Zando, la livraison est assurée directement par le vendeur. Cela signifie que chaque vendeur est responsable de l'expédition et du suivi de ses produits vers vous.</p>
              </Section>
              <Section title="Délais estimés">
                <p><strong>Livraison locale (même ville) :</strong> 1 à 3 jours ouvrés.</p>
                <p><strong>Livraison nationale (même pays) :</strong> 2 à 5 jours ouvrés.</p>
                <p><strong>Livraison internationale (autre pays africain) :</strong> 5 à 14 jours ouvrés selon la destination.</p>
                <p><strong>Paiement à la livraison (COD) :</strong> Disponible dans certains pays. Vérifiez lors du checkout.</p>
              </Section>
              <Section title="Suivi de commande">
                <p>Chaque commande reçoit un numéro de suivi. Vous pouvez suivre votre colis en temps réel depuis « Mon compte {'>'} Mes commandes » ou via la page de suivi avec votre numéro de commande.</p>
              </Section>
              <Section title="Frais de livraison">
                <p>Les frais de livraison sont fixés par le vendeur et affichés clairement lors du checkout. Zando ne prend aucune commission sur les frais de livraison.</p>
              </Section>
              <Section title="Zones de livraison">
                <p>Zando couvre les 54 pays d'Afrique. Cependant, la disponibilité de la livraison dépend du vendeur et de sa capacité à livrer dans votre région. Utilisez les filtres « Pays » et « Ville » dans le catalogue pour voir les produits disponibles près de chez vous.</p>
              </Section>
            </>
          ) : (
            <>
              <Section title="Shipping & Delivery">
                <p>On Zando, delivery is handled directly by the seller. This means each seller is responsible for shipping and tracking their products to you.</p>
              </Section>
              <Section title="Estimated Times">
                <p><strong>Local delivery (same city):</strong> 1 to 3 business days.</p>
                <p><strong>National delivery (same country):</strong> 2 to 5 business days.</p>
                <p><strong>International delivery (other African country):</strong> 5 to 14 business days depending on destination.</p>
                <p><strong>Cash on Delivery (COD):</strong> Available in select countries. Check at checkout.</p>
              </Section>
              <Section title="Order Tracking">
                <p>Every order receives a tracking number. You can track your package in real time from "My Account {'>'} My Orders" or via the tracking page with your order number.</p>
              </Section>
              <Section title="Shipping Costs">
                <p>Shipping costs are set by the seller and clearly displayed at checkout. Zando takes no commission on shipping costs.</p>
              </Section>
              <Section title="Delivery Zones">
                <p>Zando covers all 54 African countries. However, delivery availability depends on the seller and their ability to deliver to your region. Use the "Country" and "City" filters in the catalog to see products available near you.</p>
              </Section>
            </>
          ))}

          {pageKey === 'returns' && (locale === 'fr' ? (
            <>
              <Section title="Politique de retours">
                <p>Vous disposez de 7 jours après réception pour retourner un produit s'il est défectueux, endommagé ou non conforme à la description. Le retour doit être signalé au vendeur via la messagerie ou via « Mes commandes ».</p>
              </Section>
              <Section title="Conditions de retour">
                <p>Le produit doit être dans son état d'origine, avec tous les accessoires et emballages d'origine. Les produits personnalisés ou périssables ne sont pas éligibles au retour, sauf défaut.</p>
              </Section>
              <Section title="Remboursements">
                <p>Une fois le retour reçu et inspecté par le vendeur, le remboursement est effectué dans les 3 à 5 jours ouvrés via le même moyen de paiement utilisé lors de l'achat. Le remboursement est géré directement par le vendeur.</p>
              </Section>
              <Section title="Comment initier un retour">
                <p>1. Allez dans « Mon compte {'>'} Mes commandes ».</p>
                <p>2. Sélectionnez la commande concernée.</p>
                <p>3. Cliquez sur « Retourner » et indiquez la raison.</p>
                <p>4. Le vendeur vous contactera pour organiser la reprise du produit.</p>
              </Section>
            </>
          ) : (
            <>
              <Section title="Returns Policy">
                <p>You have 7 days after receipt to return a product if it is defective, damaged, or not as described. The return must be reported to the seller via messaging or via "My Orders".</p>
              </Section>
              <Section title="Return Conditions">
                <p>The product must be in its original condition, with all accessories and original packaging. Personalized or perishable products are not eligible for return unless defective.</p>
              </Section>
              <Section title="Refunds">
                <p>Once the return is received and inspected by the seller, the refund is processed within 3 to 5 business days via the same payment method used for purchase. The refund is handled directly by the seller.</p>
              </Section>
              <Section title="How to Initiate a Return">
                <p>1. Go to "My Account {'>'} My Orders".</p>
                <p>2. Select the relevant order.</p>
                <p>3. Click "Return" and indicate the reason.</p>
                <p>4. The seller will contact you to arrange product pickup.</p>
              </Section>
            </>
          ))}

          {pageKey === 'payment-methods' && (locale === 'fr' ? (
            <>
              <Section title="Modes de paiement acceptés">
                <p>Zando supporte une large gamme de moyens de paiement adaptés au terrain africain :</p>
              </Section>
              <Section title="Mobile Money">
                <p>Orange Money, MTN MoMo, Moov Money, M-Pesa, Wave, Airtel Money. Disponible dans la plupart des pays africains. Le paiement est instantané et sécurisé.</p>
              </Section>
              <Section title="Cartes bancaires">
                <p>Cartes Visa, Mastercard locales et internationales. Traitement via Paystack, Flutterwave ou Stripe selon votre pays.</p>
              </Section>
              <Section title="Virements bancaires">
                <p>Disponibles pour les transactions importantes. Les coordonnées bancaires du vendeur vous sont communiquées après la commande.</p>
              </Section>
              <Section title="Paiement à la livraison (COD)">
                <p>Disponible dans certains pays. Vous payez en espèces au moment de la réception. Vérifiez la disponibilité lors du checkout.</p>
              </Section>
              <Section title="Paiement transfrontalier">
                <p>Pour les achats auprès de vendeurs situés dans d'autres pays africains, Zando facilite le paiement transfrontalier via des solutions comme Flutterwave et Stripe.</p>
              </Section>
              <Section title="Devises supportées">
                <p>USD, XOF (Franc CFA), NGN (Naira), GHS (Cedi), KES (Shilling kényan), ZAR (Rand), EGP (Livre égyptienne), et plus. Le vendeur choisit la devise dans laquelle il vend.</p>
              </Section>
            </>
          ) : (
            <>
              <Section title="Accepted Payment Methods">
                <p>Zando supports a wide range of payment methods adapted to the African market:</p>
              </Section>
              <Section title="Mobile Money">
                <p>Orange Money, MTN MoMo, Moov Money, M-Pesa, Wave, Airtel Money. Available in most African countries. Payment is instant and secure.</p>
              </Section>
              <Section title="Bank Cards">
                <p>Local and international Visa, Mastercard. Processed via Paystack, Flutterwave, or Stripe depending on your country.</p>
              </Section>
              <Section title="Bank Transfers">
                <p>Available for larger transactions. The seller's bank details are provided after ordering.</p>
              </Section>
              <Section title="Cash on Delivery (COD)">
                <p>Available in select countries. You pay in cash upon receipt. Check availability at checkout.</p>
              </Section>
              <Section title="Cross-Border Payment">
                <p>For purchases from sellers in other African countries, Zando facilitates cross-border payment via solutions like Flutterwave and Stripe.</p>
              </Section>
              <Section title="Supported Currencies">
                <p>USD, XOF (CFA Franc), NGN (Naira), GHS (Cedi), KES (Kenyan Shilling), ZAR (Rand), EGP (Egyptian Pound), and more. The seller chooses the currency they sell in.</p>
              </Section>
            </>
          ))}

          {pageKey === 'terms' && (locale === 'fr' ? (
            <>
              <Section title="Conditions générales d'utilisation">
                <p>En utilisant Zando, vous acceptez les présentes conditions générales. Zando est une marketplace qui met en relation des vendeurs vérifiés et des acheteurs à travers l'Afrique.</p>
              </Section>
              <Section title="1. Comptes utilisateurs">
                <p>Vous devez créer un compte pour acheter ou vendre. Les vendeurs doivent compléter le processus KYC. Vous êtes responsable de la confidentialité de vos identifiants.</p>
              </Section>
              <Section title="2. Transactions">
                <p>Les transactions se font directement entre l'acheteur et le vendeur. Zando agit comme intermédiaire technique et ne participe pas à la transaction financière. Le paiement est envoyé directement au vendeur.</p>
              </Section>
              <Section title="3. Responsabilité">
                <p>Zando n'est pas responsable des litiges entre acheteurs et vendeurs concernant la qualité, la livraison ou le remboursement des produits. Cependant, nous offrons des outils de résolution de litiges via le centre de confiance.</p>
              </Section>
              <Section title="4. Vendeurs">
                <p>Les vendeurs doivent fournir des informations exactes, des produits conformes aux descriptions, et respecter les délais de livraison. Tout manquement peut entraîner la suspension du compte.</p>
              </Section>
              <Section title="5. Propriété intellectuelle">
                <p>Tous les contenus de Zando (logo, design, textes) sont la propriété de Zando / Liafrik. Toute reproduction est interdite sans autorisation.</p>
              </Section>
              <Section title="6. Modifications">
                <p>Zando se réserve le droit de modifier ces conditions à tout moment. Les modifications entrent en vigueur dès leur publication.</p>
              </Section>
            </>
          ) : (
            <>
              <Section title="Terms of Use">
                <p>By using Zando, you agree to these terms and conditions. Zando is a marketplace that connects verified sellers with buyers across Africa.</p>
              </Section>
              <Section title="1. User Accounts">
                <p>You must create an account to buy or sell. Sellers must complete the KYC process. You are responsible for keeping your credentials confidential.</p>
              </Section>
              <Section title="2. Transactions">
                <p>Transactions occur directly between buyer and seller. Zando acts as a technical intermediary and does not participate in the financial transaction. Payment is sent directly to the seller.</p>
              </Section>
              <Section title="3. Liability">
                <p>Zando is not liable for disputes between buyers and sellers regarding product quality, delivery, or refunds. However, we provide dispute resolution tools via the Trust & Safety center.</p>
              </Section>
              <Section title="4. Sellers">
                <p>Sellers must provide accurate information, products matching their descriptions, and respect delivery times. Any breach may result in account suspension.</p>
              </Section>
              <Section title="5. Intellectual Property">
                <p>All Zando content (logo, design, texts) is the property of Zando / Liafrik. Any reproduction is prohibited without authorization.</p>
              </Section>
              <Section title="6. Modifications">
                <p>Zando reserves the right to modify these terms at any time. Changes take effect upon publication.</p>
              </Section>
            </>
          ))}

          {pageKey === 'privacy' && (locale === 'fr' ? (
            <>
              <Section title="Politique de confidentialité">
                <p>Zando s'engage à protéger vos données personnelles. Cette politique explique quelles données nous collectons et comment nous les utilisons.</p>
              </Section>
              <Section title="Données collectées">
                <p><strong>Comptes acheteurs :</strong> Nom, e-mail, téléphone, adresses de livraison.</p>
                <p><strong>Comptes vendeurs :</strong> Informations d'entreprise, documents KYC, coordonnées bancaires.</p>
                <p><strong>Données de navigation :</strong> Adresse IP, navigateur, pages visitées (cookies).</p>
              </Section>
              <Section title="Utilisation des données">
                <p>Vos données sont utilisées pour : traiter les commandes, vérifier les vendeurs (KYC), faciliter la livraison, améliorer le service, et assurer la sécurité de la plateforme.</p>
              </Section>
              <Section title="Partage des données">
                <p>Vos données de commande (nom, adresse, téléphone) sont partagées avec le vendeur pour la livraison. Nous ne vendons jamais vos données à des tiers. Les fournisseurs de paiement reçoivent uniquement les données nécessaires à la transaction.</p>
              </Section>
              <Section title="Vos droits">
                <p>Vous pouvez accéder, modifier ou supprimer vos données à tout moment depuis « Mon compte ». Pour exercer vos droits, contactez-nous à <a href="mailto:cs@liafrik.com" className="text-[#0e9f6e] font-semibold hover:underline">cs@liafrik.com</a>.</p>
              </Section>
              <Section title="Sécurité">
                <p>Nous utilisons le chiffrement SSL et des fournisseurs certifiés pour protéger vos données. Les documents KYC sont stockés de manière sécurisée.</p>
              </Section>
            </>
          ) : (
            <>
              <Section title="Privacy Policy">
                <p>Zando is committed to protecting your personal data. This policy explains what data we collect and how we use it.</p>
              </Section>
              <Section title="Data Collected">
                <p><strong>Buyer accounts:</strong> Name, email, phone, shipping addresses.</p>
                <p><strong>Seller accounts:</strong> Business information, KYC documents, bank details.</p>
                <p><strong>Browsing data:</strong> IP address, browser, pages visited (cookies).</p>
              </Section>
              <Section title="Data Usage">
                <p>Your data is used to: process orders, verify sellers (KYC), facilitate delivery, improve service, and ensure platform security.</p>
              </Section>
              <Section title="Data Sharing">
                <p>Your order data (name, address, phone) is shared with the seller for delivery. We never sell your data to third parties. Payment providers receive only the data necessary for the transaction.</p>
              </Section>
              <Section title="Your Rights">
                <p>You can access, modify, or delete your data at any time from "My Account". To exercise your rights, contact us at <a href="mailto:cs@liafrik.com" className="text-[#0e9f6e] font-semibold hover:underline">cs@liafrik.com</a>.</p>
              </Section>
              <Section title="Security">
                <p>We use SSL encryption and certified providers to protect your data. KYC documents are stored securely.</p>
              </Section>
            </>
          ))}

          {pageKey === 'cookies' && (locale === 'fr' ? (
            <>
              <Section title="Politique de cookies">
                <p>Zando utilise des cookies pour améliorer votre expérience de navigation et assurer le bon fonctionnement de la plateforme.</p>
              </Section>
              <Section title="Types de cookies">
                <p><strong>Cookies essentiels :</strong> Nécessaires au fonctionnement du site (session, panier, authentification).</p>
                <p><strong>Cookies analytiques :</strong> Nous aident à comprendre comment vous utilisez le site pour l'améliorer.</p>
                <p><strong>Cookies de préférences :</strong> Mémorisent votre langue, devise et localisation.</p>
              </Section>
              <Section title="Gestion des cookies">
                <p>Vous pouvez gérer ou désactiver les cookies dans les paramètres de votre navigateur. Notez que la désactivation des cookies essentiels peut affecter le fonctionnement du site.</p>
              </Section>
            </>
          ) : (
            <>
              <Section title="Cookies Policy">
                <p>Zando uses cookies to improve your browsing experience and ensure the proper functioning of the platform.</p>
              </Section>
              <Section title="Types of Cookies">
                <p><strong>Essential cookies:</strong> Required for the site to function (session, cart, authentication).</p>
                <p><strong>Analytics cookies:</strong> Help us understand how you use the site to improve it.</p>
                <p><strong>Preference cookies:</strong> Remember your language, currency, and location.</p>
              </Section>
              <Section title="Cookie Management">
                <p>You can manage or disable cookies in your browser settings. Note that disabling essential cookies may affect site functionality.</p>
              </Section>
            </>
          ))}

          {pageKey === 'legal-notice' && (locale === 'fr' ? (
            <>
              <Section title="Mentions légales">
                <p>Zando est une marketplace opérée par Liafrik, spécialisée dans le commerce électronique africain.</p>
              </Section>
              <Section title="Éditeur">
                <p><strong>Liafrik</strong></p>
                <p>E-mail : <a href="mailto:zando@liafrik.com" className="text-[#0e9f6e] font-semibold hover:underline">zando@liafrik.com</a></p>
                <p>Service client : <a href="mailto:cs@liafrik.com" className="text-[#0e9f6e] font-semibold hover:underline">cs@liafrik.com</a></p>
                <p>Support technique : <a href="mailto:support@liafrik.com" className="text-[#0e9f6e] font-semibold hover:underline">support@liafrik.com</a></p>
              </Section>
              <Section title="Hébergement">
                <p>La plateforme Zando est hébergée sur des infrastructures cloud sécurisées avec chiffrement des données.</p>
              </Section>
              <Section title="Propriété intellectuelle">
                <p>La marque Zando, son logo et tous les contenus du site sont la propriété exclusive de Liafrik. Toute reproduction, totale ou partielle, est interdite sans autorisation écrite.</p>
              </Section>
            </>
          ) : (
            <>
              <Section title="Legal Notice">
                <p>Zando is a marketplace operated by Liafrik, specializing in African e-commerce.</p>
              </Section>
              <Section title="Publisher">
                <p><strong>Liafrik</strong></p>
                <p>Email: <a href="mailto:zando@liafrik.com" className="text-[#0e9f6e] font-semibold hover:underline">zando@liafrik.com</a></p>
                <p>Customer service: <a href="mailto:cs@liafrik.com" className="text-[#0e9f6e] font-semibold hover:underline">cs@liafrik.com</a></p>
                <p>Technical support: <a href="mailto:support@liafrik.com" className="text-[#0e9f6e] font-semibold hover:underline">support@liafrik.com</a></p>
              </Section>
              <Section title="Hosting">
                <p>The Zando platform is hosted on secure cloud infrastructure with data encryption.</p>
              </Section>
              <Section title="Intellectual Property">
                <p>The Zando brand, its logo, and all site content are the exclusive property of Liafrik. Any reproduction, in whole or in part, is prohibited without written authorization.</p>
              </Section>
            </>
          ))}

          {pageKey === 'careers' && (locale === 'fr' ? (
            <>
              <Section title="Carrières chez Zando">
                <p>Zando est une marketplace en pleine croissance qui sert les 54 pays d'Afrique. Nous recherchons des talents passionnés par le commerce africain et l'innovation technologique.</p>
              </Section>
              <Section title="Pourquoi rejoindre Zando ?">
                <p><strong>Impact continental :</strong> Notre travail affecte des millions d'acheteurs et de vendeurs à travers l'Afrique.</p>
                <p><strong>Innovation :</strong> Nous construisons des solutions adaptées au terrain africain (Mobile Money, livraison par le vendeur, paiements transfrontaliers).</p>
                <p><strong>Croissance :</strong> Nous sommes une startup en expansion avec des opportunités d'évolution rapide.</p>
              </Section>
              <Section title="Postes ouverts">
                <p>Nous recrutons actuellement dans les domaines suivants :</p>
                <p>• Ingénierie logicielle (Frontend, Backend, Mobile)</p>
                <p>• Gestion de marketplace et opérations vendeurs</p>
                <p>• Support client et résolution de litiges</p>
                <p>• Marketing et croissance</p>
                <p>• Finance et paiements</p>
              </Section>
              <Section title="Postuler">
                <p>Envoyez votre CV et lettre de motivation à <a href="mailto:zando@liafrik.com" className="text-[#0e9f6e] font-semibold hover:underline">zando@liafrik.com</a> avec l'objet « Candidature ».</p>
              </Section>
            </>
          ) : (
            <>
              <Section title="Careers at Zando">
                <p>Zando is a fast-growing marketplace serving all 54 African countries. We're looking for talent passionate about African commerce and technological innovation.</p>
              </Section>
              <Section title="Why Join Zando?">
                <p><strong>Continental Impact:</strong> Our work affects millions of buyers and sellers across Africa.</p>
                <p><strong>Innovation:</strong> We build solutions adapted to the African terrain (Mobile Money, seller delivery, cross-border payments).</p>
                <p><strong>Growth:</strong> We're an expanding startup with rapid advancement opportunities.</p>
              </Section>
              <Section title="Open Positions">
                <p>We're currently hiring in the following areas:</p>
                <p>• Software Engineering (Frontend, Backend, Mobile)</p>
                <p>• Marketplace Operations & Seller Management</p>
                <p>• Customer Support & Dispute Resolution</p>
                <p>• Marketing & Growth</p>
                <p>• Finance & Payments</p>
              </Section>
              <Section title="How to Apply">
                <p>Send your CV and cover letter to <a href="mailto:zando@liafrik.com" className="text-[#0e9f6e] font-semibold hover:underline">zando@liafrik.com</a> with the subject "Application".</p>
              </Section>
            </>
          ))}

          {pageKey === 'contact' && (
            <>
              <Section title={locale === 'fr' ? 'Contactez Zando' : 'Contact Zando'}>
                <p>{locale === 'fr' ? 'Notre équipe est disponible 24/7 pour répondre à vos questions. Choisissez le canal qui vous convient.' : 'Our team is available 24/7 to answer your questions. Choose the channel that suits you.'}</p>
              </Section>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="card p-5">
                  <Headphones className="w-8 h-8 text-[#0e9f6e] mb-3" />
                  <h3 className="text-sm font-bold text-[#0f172a] mb-1">{locale === 'fr' ? 'Service Client' : 'Customer Service'}</h3>
                  <a href="mailto:cs@liafrik.com" className="text-sm text-[#0e9f6e] font-semibold hover:underline flex items-center gap-2"><Mail className="w-4 h-4" /> cs@liafrik.com</a>
                </div>
                <div className="card p-5">
                  <Briefcase className="w-8 h-8 text-[#0e9f6e] mb-3" />
                  <h3 className="text-sm font-bold text-[#0f172a] mb-1">{locale === 'fr' ? 'Partenariats' : 'Partnerships'}</h3>
                  <a href="mailto:zando@liafrik.com" className="text-sm text-[#0e9f6e] font-semibold hover:underline flex items-center gap-2"><Mail className="w-4 h-4" /> zando@liafrik.com</a>
                </div>
                <div className="card p-5">
                  <ShieldCheck className="w-8 h-8 text-[#0e9f6e] mb-3" />
                  <h3 className="text-sm font-bold text-[#0f172a] mb-1">{locale === 'fr' ? 'Support Technique' : 'Technical Support'}</h3>
                  <a href="mailto:support@liafrik.com" className="text-sm text-[#0e9f6e] font-semibold hover:underline flex items-center gap-2"><Mail className="w-4 h-4" /> support@liafrik.com</a>
                </div>
                <div className="card p-5">
                  <Clock className="w-8 h-8 text-[#0e9f6e] mb-3" />
                  <h3 className="text-sm font-bold text-[#0f172a] mb-1">{locale === 'fr' ? 'Disponibilité' : 'Availability'}</h3>
                  <p className="text-sm text-[#64748b]">{locale === 'fr' ? '24h/24, 7j/7' : '24/7, 365 days a year'}</p>
                </div>
              </div>
              <Section title={locale === 'fr' ? 'Siège social' : 'Headquarters'}>
                <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#0e9f6e]" /> {locale === 'fr' ? 'Abidjan, Côte d\'Ivoire' : 'Abidjan, Côte d\'Ivoire'}</p>
                <p className="flex items-center gap-2"><Globe className="w-4 h-4 text-[#0e9f6e]" /> {locale === 'fr' ? 'Desserte : 54 pays africains' : 'Coverage: 54 African countries'}</p>
              </Section>
            </>
          )}

          {pageKey === 'protect-brand' && (locale === 'fr' ? (
            <>
              <Section title="Protéger et développer votre marque">
                <p>Zando prend la protection de la propriété intellectuelle et des marques très au sérieux. Nous offrons des outils pour aider les propriétaires de marques à protéger leurs droits et à développer leur présence sur Zando.</p>
                <p><strong>Zando Brand Registry :</strong> Enregistrez votre marque pour débloquer une suite d'outils conçus pour vous aider à protéger votre marque et à créer une expérience d'achat unique pour vos clients.</p>
                <p><strong>Protection proactive :</strong> Notre système utilise des informations sur votre marque pour détecter et bloquer de manière proactive les contrefaçons présumées et les violations de propriété intellectuelle.</p>
                <p><strong>Signaler une violation :</strong> Si vous constatez qu'un vendeur utilise vos images, votre marque déposée ou vend des contrefaçons, vous pouvez soumettre un signalement immédiat au Centre de Conformité.</p>
              </Section>
            </>
          ) : (
            <>
              <Section title="Protect and Build Your Brand">
                <p>Zando takes intellectual property and brand protection very seriously. We offer powerful tools to help brand owners safeguard their rights and expand their presence on our platform.</p>
                <p><strong>Zando Brand Registry:</strong> Register your brand to unlock a suite of tools designed to protect your trademarks and create a unique, trusted shopping experience for your customers.</p>
                <p><strong>Proactive Protection:</strong> Our compliance system utilizes your brand information to pro-actively detect and filter suspected counterfeits and intellectual property violations.</p>
                <p><strong>Report a Violation:</strong> If you believe another merchant is infringing on your registered trademark or copyright, submit an immediate claim via our Trust & Safety dashboard.</p>
              </Section>
            </>
          ))}

          {pageKey === 'fulfillment' && (locale === 'fr' ? (
            <>
              <Section title="Fulfillment par vendeur (FBM)">
                <p>Chez Zando, le stockage et la livraison sont gérés de manière autonome par le vendeur (Fulfillment by Merchant / Vendor). Cela garantit un service de proximité et supprime les frais d'entrepôt lourds de la plateforme.</p>
                <p><strong>Comment ça fonctionne :</strong></p>
                <p>1. Vous stockez vos produits dans votre propre local ou entrepôt.</p>
                <p>2. Lorsqu'un client passe commande, vous préparez le colis avec soin.</p>
                <p>3. Vous expédiez le produit via votre transporteur local préféré ou votre propre flotte de livraison.</p>
                <p>4. Vous mettez à jour le statut de la commande en temps réel sur le Seller Center.</p>
              </Section>
            </>
          ) : (
            <>
              <Section title="Fulfillment by Vendor (FBM)">
                <p>At Zando, storage and shipping are managed autonomously by the seller (Fulfillment by Merchant / Vendor). This guarantees localized service and removes heavy platform warehousing fees.</p>
                <p><strong>How it works:</strong></p>
                <p>1. You safely store your inventory in your own physical location or warehouse.</p>
                <p>2. When a buyer places an order, you carefully pack and prepare the parcel.</p>
                <p>3. You ship the product using your preferred local courier or your own delivery fleet.</p>
                <p>4. You update the shipment and tracking status in real-time inside your Seller Center dashboard.</p>
              </Section>
            </>
          ))}

          {pageKey === 'supply-to-zando' && (locale === 'fr' ? (
            <>
              <Section title="Approvisionner Zando">
                <p>Devenez un partenaire d'approvisionnement officiel de Zando ! Si vous êtes un grossiste, un fabricant ou un grand distributeur, vous pouvez approvisionner notre réseau mondial de marchands.</p>
                <p><strong>Avantages de l'approvisionnement :</strong></p>
                <p>• Connectez-vous avec des milliers de vendeurs de détail sur Zando.</p>
                <p>• Vendez en gros volumes avec des contrats d'approvisionnement sécurisés.</p>
                <p>• Bénéficiez d'un traitement logistique prioritaire et de paiements garantis.</p>
              </Section>
            </>
          ) : (
            <>
              <Section title="Supply to Zando">
                <p>Become an official Zando sourcing partner! If you are a wholesaler, manufacturer, or large distributor, you can supply our global merchant network with raw materials or bulk products.</p>
                <p><strong>Sourcing Benefits:</strong></p>
                <p>• Connect directly with thousands of retail merchants selling on Zando.</p>
                <p>• Sell in bulk volumes with secure supply contracts.</p>
                <p>• Access prioritized logistics routing and guaranteed transaction payouts.</p>
              </Section>
            </>
          ))}

          {pageKey === 'become-affiliate' && (locale === 'fr' ? (
            <>
              <Section title="Devenir un Affilié Zando">
                <p>Rejoignez le programme d'affiliation Zando et gagnez de l'argent en recommandant des produits africains authentiques à votre communauté !</p>
                <p><strong>Comment ça fonctionne :</strong></p>
                <p>1. Inscrivez-vous gratuitement au programme d'affiliation.</p>
                <p>2. Partagez vos liens d'affiliation uniques sur votre site web, blog, réseaux sociaux ou messageries.</p>
                <p>3. Gagnez jusqu'à 10% de commission sur chaque achat éligible effectué via vos liens !</p>
              </Section>
            </>
          ) : (
            <>
              <Section title="Become a Zando Affiliate">
                <p>Join the Zando Affiliate Program and earn money by recommending authentic African products to your network and community!</p>
                <p><strong>How it works:</strong></p>
                <p>1. Register for free as a Zando Affiliate partner.</p>
                <p>2. Share your custom affiliate referral links on your website, blog, social media, or chats.</p>
                <p>3. Earn up to 10% commission on every qualifying purchase completed through your links!</p>
              </Section>
            </>
          ))}

          {pageKey === 'recalls-safety' && (locale === 'fr' ? (
            <>
              <Section title="Rappels de produits et alertes de sécurité">
                <p>La sécurité de nos acheteurs est notre priorité absolue. Nous surveillons de près les alertes de sécurité et les rappels de produits pour garantir une expérience d'achat sans risque.</p>
                <p><strong>Notre politique de sécurité :</strong></p>
                <p>• Zando interdit formellement la vente de produits dangereux, contrefaits, ou faisant l'objet d'un rappel officiel.</p>
                <p>• En cas de signalement sur la sécurité d'un produit, notre équipe de conformité suspend immédiatement l'article et mène une enquête approfondie.</p>
                <p>• Les acheteurs concernés sont notifiés immédiatement avec les instructions de retour et de remboursement total gérées par le vendeur.</p>
              </Section>
            </>
          ) : (
            <>
              <Section title="Recalls and Product Safety Alerts">
                <p>Buyer safety is our absolute priority. Zando actively monitors safety notices and official recalls to maintain a secure shopping ecosystem.</p>
                <p><strong>Safety & Recalls Policy:</strong></p>
                <p>• Selling unsafe, banned, or recalled inventory is strictly prohibited on Zando.</p>
                <p>• Upon receiving a product safety report, our compliance department immediately suspends the listing for a thorough review.</p>
                <p>• Affected buyers are notified instantly with return instructions and guaranteed total refunds managed by the merchant.</p>
              </Section>
            </>
          ))}
        </div>

        {/* Back to home */}
        <div className="mt-6 flex items-center justify-center">
          <button onClick={() => navigate('home')} className="text-sm text-[#64748b] hover:text-[#0e9f6e] flex items-center gap-2">
            <ArrowRight className="w-4 h-4 rotate-180" /> {locale === 'fr' ? 'Retour à l\'accueil' : 'Back to home'}
          </button>
        </div>
      </div>
    </div>
  );
}
