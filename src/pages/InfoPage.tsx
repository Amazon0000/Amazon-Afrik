import { useApp } from '@/lib/store';
import {
  Info, HelpCircle, Truck, RotateCcw, CreditCard, FileText, ShieldCheck,
  Briefcase, Mail, Headphones, ArrowRight, ChevronRight, MapPin, Clock, Globe,
} from 'lucide-react';
import { useState } from 'react';

export type InfoKey =
  | 'about' | 'sell-guide' | 'help' | 'shipping' | 'returns' | 'payment-methods'
  | 'terms' | 'privacy' | 'cookies' | 'legal-notice' | 'careers' | 'contact'
  | 'buyer-protection' | 'seller-protection';

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
  'buyer-protection': { icon: ShieldCheck, frTitle: 'Protection Acheteur', enTitle: 'Buyer Protection' },
  'seller-protection': { icon: ShieldCheck, frTitle: 'Protection Vendeur', enTitle: 'Seller Protection' },
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
            <button onClick={() => navigate('home')} className="hover:text-[#ff7a00]">Zando</button>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[#0f172a] font-medium">{title}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#ff7a00]/10 flex items-center justify-center">
            <Icon className="w-7 h-7 text-[#ff7a00]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0f172a]">{title}</h1>
            <p className="text-sm text-[#64748b]">Zando — {locale === 'fr' ? 'La marketplace premium mondiale' : 'The world\'s premium marketplace'}</p>
          </div>
        </div>

        <div className="card p-6 sm:p-8">
          {pageKey === 'about' && (locale === 'fr' ? (
            <>
              <Section title="Notre mission">
                <p>Zando est la marketplace premium mondiale de nouvelle génération. Notre mission est de connecter des vendeurs professionnels vérifiés, partout dans le monde, à des millions d'acheteurs, avec un système de paiement direct et une livraison assurée par le vendeur lui-même.</p>
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
                <p><strong>Inclusion :</strong> Nous soutenons les artisans, PME et entrepreneurs en leur donnant accès à un marché mondial.</p>
                <p><strong>Qualité :</strong> Nous privilégions des produits authentiques et un service client de premier ordre.</p>
              </Section>
              <Section title="Contact">
                <p>Pour toute question, contactez-nous à <a href="mailto:cs@liafrik.com" className="text-[#ff7a00] font-semibold hover:underline">cs@liafrik.com</a> ou <a href="mailto:zando@liafrik.com" className="text-[#ff7a00] font-semibold hover:underline">zando@liafrik.com</a>.</p>
              </Section>
            </>
          ) : (
            <>
              <Section title="Our Mission">
                <p>Zando is the premium global marketplace of the next generation. Our mission is to connect verified professional sellers with millions of buyers worldwide, with a direct payment system and delivery handled by the seller themselves.</p>
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
                <p><strong>Inclusion:</strong> We support artisans, SMEs, and entrepreneurs by giving them access to a global market.</p>
                <p><strong>Quality:</strong> We prioritize authentic products and top-tier customer service.</p>
              </Section>
              <Section title="Contact">
                <p>For any questions, contact us at <a href="mailto:cs@liafrik.com" className="text-[#ff7a00] font-semibold hover:underline">cs@liafrik.com</a> or <a href="mailto:zando@liafrik.com" className="text-[#ff7a00] font-semibold hover:underline">zando@liafrik.com</a>.</p>
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
                <p>1. <strong>Pays :</strong> Sélectionnez votre pays d'activité parmi tous les pays disponibles sur Zando.</p>
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
                <p>1. <strong>Country:</strong> Select your country of operation from every country available on Zando.</p>
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
                  { q: 'Quels pays sont couverts ?', a: 'Zando couvre le monde entier. Vous pouvez filtrer les produits par pays et par ville dans le catalogue.' },
                  { q: 'Comment fonctionnent les publicités Zando Ads ?', a: 'Les vendeurs peuvent créer des campagnes sponsorisées avec un budget et une durée. Le coût est calculé automatiquement en USD selon la durée et les paramètres choisis.' },
                ] : [
                  { q: 'How do I track my order?', a: 'Go to My Account > My Orders and click Track to see real-time status. You can also use the tracking page with your order number.' },
                  { q: 'How do I contact a seller?', a: 'On the product page, click "Visit Store" to access the seller\'s profile. You can also use the Messages icon in the header.' },
                  { q: 'Is payment secure?', a: 'Yes. Zando uses certified payment providers (Mobile Money, Paystack, Flutterwave, Stripe, PayPal). Your payment goes directly to the seller.' },
                  { q: 'Can I return a product?', a: 'Yes, within 7 days of receipt if the product is defective or not as described. See our returns policy for details.' },
                  { q: 'How do I become a seller?', a: 'Sign up with a seller account, complete the 5-step KYC onboarding, and start selling after approval (within 48h).' },
                  { q: 'Which currencies can I sell in?', a: 'Zando supports USD, XOF (CFA Franc), NGN (Naira), GHS (Cedi), KES (Kenyan Shilling), ZAR (Rand) and more. The seller chooses their currency.' },
                  { q: 'Which countries are covered?', a: 'Zando covers the whole world. You can filter products by country and city in the catalog.' },
                  { q: 'How do Zando Ads work?', a: 'Sellers can create sponsored campaigns with a budget and duration. Cost is automatically calculated in USD based on duration and chosen parameters.' },
                ]} />
              </Section>
              <Section title={locale === 'fr' ? 'Contactez-nous' : 'Contact Us'}>
                <p>{locale === 'fr' ? 'Vous ne trouvez pas votre réponse ? Notre équipe support est disponible 24/7.' : 'Can\'t find your answer? Our support team is available 24/7.'}</p>
                <div className="flex flex-col gap-2 mt-3">
                  <a href="mailto:support@liafrik.com" className="text-[#ff7a00] font-semibold hover:underline flex items-center gap-2"><Mail className="w-4 h-4" /> support@liafrik.com</a>
                  <a href="mailto:cs@liafrik.com" className="text-[#ff7a00] font-semibold hover:underline flex items-center gap-2"><Mail className="w-4 h-4" /> cs@liafrik.com</a>
                </div>
              </Section>
            </>
          )}

          {pageKey === 'buyer-protection' && (locale === 'fr' ? (
            <>
              <Section title="Ce que couvre la Protection Acheteur Zando">
                <p>Zando est une place de marché : chaque vendeur connecte son propre moyen de paiement (Stripe, Paddle, PayUnit, Paystack, mobile money, etc.) et reçoit votre paiement directement. Zando ne conserve jamais les fonds de votre commande — nous n'avons donc pas de « séquestre » à débloquer. Ce que nous offrons, c'est un cadre pour signaler un problème, faire intervenir un vendeur, et escalader vers l'équipe Zando si nécessaire.</p>
              </Section>
              <Section title="Vendeurs vérifiés">
                <p>Les boutiques portant le badge bleu « Vendeur Vérifié » ont été examinées manuellement par notre équipe (documents d'identité et pièces justificatives). Les boutiques sans ce badge sont marquées « en attente de validation » — elles peuvent vendre, mais n'ont pas encore été vérifiées. Vérifiez toujours ce badge avant d'acheter.</p>
              </Section>
              <Section title="Si votre article n'arrive jamais">
                <p>1. Suivez votre commande depuis « Mon compte {'>'} Mes commandes » — le statut réel (confirmée, en préparation, en transit, livrée) est visible à tout moment.</p>
                <p>2. Contactez le vendeur directement via la messagerie intégrée à la commande.</p>
                <p>3. Si le vendeur ne répond pas, ou si le délai de livraison annoncé est largement dépassé, utilisez le bouton « Signaler à Zando » sur la commande concernée. Notre équipe examine chaque signalement manuellement.</p>
              </Section>
              <Section title="Article très différent de sa description, endommagé ou défectueux">
                <p>Une fois la commande marquée « Livrée », vous disposez de 7 jours pour demander un retour depuis « Mes commandes ». Le vendeur examine la demande et décide de l'approuver ou de la refuser. Si vous jugez le refus injustifié, ou si le vendeur ne répond pas, signalez le cas à Zando via le même bouton — un examen manuel sera effectué.</p>
              </Section>
              <Section title="Comportement suspect ou frauduleux d'un vendeur">
                <p>Signalez immédiatement toute demande de paiement en dehors de Zando, tout comportement trompeur ou toute suspicion de fraude via le bouton de signalement sur la commande, ou depuis la page de la boutique. Les cas confirmés entraînent des sanctions pouvant aller jusqu'à la suspension définitive du vendeur.</p>
              </Section>
              <Section title="Comment fonctionne un signalement">
                <p><strong>Soumission :</strong> vous décrivez le problème depuis votre commande. <strong>Réponse du vendeur :</strong> le vendeur est invité à répondre — un délai de réponse raisonnable est attendu, mais n'est pas appliqué automatiquement par le système à ce jour. <strong>Examen :</strong> un membre de l'équipe Zando examine le signalement, les échanges de messagerie et les informations de commande disponibles. <strong>Décision :</strong> la décision (résolution, avertissement au vendeur, remboursement recommandé, suspension) est prise manuellement, au cas par cas.</p>
              </Section>
              <Section title="Ce que Zando ne garantit PAS">
                <p>Zando ne détenant pas les fonds de la transaction, nous ne pouvons pas déclencher un remboursement automatique depuis notre plateforme — un remboursement se fait via le vendeur (sur son propre moyen de paiement) ou, en dernier recours et en cas de fraude avérée, via une décision administrative avec le vendeur. Zando ne garantit pas de remboursement systématique ni de couverture de type « chargeback ». Une contestation de paiement (chargeback) auprès de votre banque ou de votre fournisseur de paiement est un processus distinct, entre vous et cet établissement, indépendant du processus de signalement Zando.</p>
              </Section>
              <Section title="Délais">
                <p>Demande de retour : dans les 7 jours suivant la livraison. Signalement à Zando : recommandé dès que le problème est constaté, et idéalement dans les 30 jours suivant la commande.</p>
              </Section>
            </>
          ) : (
            <>
              <Section title="What Zando Buyer Protection Covers">
                <p>Zando is a marketplace: every seller connects their own payment method (Stripe, Paddle, PayUnit, Paystack, mobile money, etc.) and receives your payment directly. Zando never holds your order's funds — so there is no "escrow" for us to release. What we provide is a framework to report a problem, involve the seller, and escalate to the Zando team when needed.</p>
              </Section>
              <Section title="Verified Sellers">
                <p>Stores carrying the blue "Verified Merchant" badge have been manually reviewed by our team (identity documents and supporting evidence). Stores without this badge are marked "pending validation" — they can sell, but haven't been verified yet. Always check this badge before buying.</p>
              </Section>
              <Section title="If Your Item Never Arrives">
                <p>1. Track your order from "My Account {'>'} My Orders" — the real status (confirmed, preparing, in transit, delivered) is visible at all times.</p>
                <p>2. Contact the seller directly via the order's built-in messaging.</p>
                <p>3. If the seller doesn't respond, or the stated delivery window has clearly passed, use the "Report to Zando" button on that order. Our team reviews every report manually.</p>
              </Section>
              <Section title="Item Significantly Different, Damaged, or Defective">
                <p>Once an order is marked "Delivered", you have 7 days to request a return from "My Orders". The seller reviews the request and decides to approve or reject it. If you believe the rejection was unfair, or the seller doesn't respond, report the case to Zando via the same button — a manual review will follow.</p>
              </Section>
              <Section title="Suspicious or Fraudulent Seller Behavior">
                <p>Report immediately any request to pay outside of Zando, misleading behavior, or suspected fraud using the report button on the order, or from the store page. Confirmed cases can result in penalties up to permanent seller suspension.</p>
              </Section>
              <Section title="How a Report Works">
                <p><strong>Submission:</strong> you describe the issue from your order. <strong>Seller response:</strong> the seller is invited to respond — a reasonable response window is expected, but is not currently enforced automatically by the system. <strong>Review:</strong> a Zando team member reviews the report, available messaging history, and order information. <strong>Decision:</strong> the outcome (resolution, seller warning, recommended refund, suspension) is decided manually, case by case.</p>
              </Section>
              <Section title="What Zando Does NOT Guarantee">
                <p>Because Zando doesn't hold transaction funds, we cannot trigger an automatic refund from our platform — a refund happens via the seller (on their own payment method) or, as a last resort in confirmed fraud cases, via an administrative decision involving the seller. Zando does not guarantee automatic refunds or chargeback-style coverage. A payment dispute (chargeback) with your bank or payment provider is a separate process between you and that institution, independent of Zando's report process.</p>
              </Section>
              <Section title="Deadlines">
                <p>Return request: within 7 days of delivery. Report to Zando: recommended as soon as the issue is noticed, ideally within 30 days of the order.</p>
              </Section>
            </>
          ))}

          {pageKey === 'seller-protection' && (locale === 'fr' ? (
            <>
              <Section title="Ce que couvre la Protection Vendeur Zando">
                <p>Zando protège les vendeurs de bonne foi contre les réclamations abusives ou frauduleuses. Comme votre paiement passe directement par votre propre moyen de paiement (et non par Zando), vous gardez le contrôle sur vos transactions — mais Zando intervient en cas de comportement acheteur abusif signalé.</p>
              </Section>
              <Section title="Réclamations « article non reçu » infondées">
                <p>Si un acheteur affirme ne pas avoir reçu un article que vous avez expédié, répondez à sa demande de retour avec vos preuves (numéro de suivi, capture d'écran de statut de livraison, confirmation du transporteur). Ces éléments sont examinés en priorité en cas d'escalade vers l'équipe Zando.</p>
              </Section>
              <Section title="Demandes de remboursement abusives">
                <p>Vous pouvez refuser une demande de retour directement depuis votre Espace Vendeur, avec une explication. Si l'acheteur signale ensuite le cas à Zando, votre réponse et vos preuves font partie de l'examen manuel.</p>
              </Section>
              <Section title="Preuves à fournir en cas de litige">
                <p>Numéro et lien de suivi, capture d'écran de la description produit au moment de la vente, photos du produit avant expédition si disponibles, historique de messagerie avec l'acheteur. Plus vous documentez tôt, plus l'examen est rapide.</p>
              </Section>
              <Section title="Délai de réponse">
                <p>Nous recommandons de répondre à toute demande de retour ou tout message acheteur sous 48 heures. Un temps de réponse constamment long peut affecter la visibilité de votre boutique et, en l'absence de réponse répétée, peut peser dans une décision d'escalade en votre défaveur.</p>
              </Section>
              <Section title="Résolution des litiges">
                <p>La majorité des retours se règlent directement entre vous et l'acheteur via l'Espace Vendeur. Si l'acheteur signale le cas à Zando, un membre de l'équipe examine manuellement : votre réponse, vos preuves, l'historique de messagerie et les informations de commande. Vous serez informé de toute décision vous concernant.</p>
              </Section>
              <Section title="Ce que la Protection Vendeur ne couvre pas">
                <p>Zando ne peut pas intervenir sur les décisions de votre propre fournisseur de paiement (contestations/chargebacks initiés directement auprès de Stripe, PayUnit, Paddle, Paystack, etc.) — ces processus sont gérés par le PSP concerné, indépendamment de Zando. Consultez la politique de votre PSP pour ces cas.</p>
              </Section>
            </>
          ) : (
            <>
              <Section title="What Zando Seller Protection Covers">
                <p>Zando protects good-faith sellers against abusive or fraudulent claims. Since your payment goes directly through your own payment method (not through Zando), you retain control over your transactions — but Zando steps in when abusive buyer behavior is reported.</p>
              </Section>
              <Section title="Unfounded 'Item Not Received' Claims">
                <p>If a buyer claims they never received an item you shipped, respond to their return request with your evidence (tracking number, delivery status screenshot, carrier confirmation). This evidence is reviewed first if the case escalates to the Zando team.</p>
              </Section>
              <Section title="Abusive Refund Requests">
                <p>You can reject a return request directly from your Seller Center, with an explanation. If the buyer then reports the case to Zando, your response and evidence are part of the manual review.</p>
              </Section>
              <Section title="Evidence to Provide in a Dispute">
                <p>Tracking number and link, screenshot of the product description at time of sale, product photos before shipping if available, message history with the buyer. The earlier you document, the faster the review.</p>
              </Section>
              <Section title="Response Time">
                <p>We recommend responding to any return request or buyer message within 48 hours. Consistently slow response times can affect your store's visibility, and repeated non-response can weigh against you in an escalation decision.</p>
              </Section>
              <Section title="Dispute Resolution">
                <p>Most returns are settled directly between you and the buyer via Seller Center. If the buyer reports the case to Zando, a team member manually reviews: your response, your evidence, the message history, and order information. You'll be informed of any decision concerning you.</p>
              </Section>
              <Section title="What Seller Protection Does Not Cover">
                <p>Zando cannot intervene in your own payment provider's decisions (disputes/chargebacks filed directly with Stripe, PayUnit, Paddle, Paystack, etc.) — those processes are handled by that PSP, independently of Zando. Check your PSP's policy for those cases.</p>
              </Section>
            </>
          ))}

          {pageKey === 'shipping' && (locale === 'fr' ? (
            <>
              <Section title="Livraison & délais">
                <p>Sur Zando, la livraison est assurée directement par le vendeur. Cela signifie que chaque vendeur est responsable de l'expédition et du suivi de ses produits vers vous.</p>
              </Section>
              <Section title="Délais estimés">
                <p><strong>Livraison locale (même ville) :</strong> 1 à 3 jours ouvrés.</p>
                <p><strong>Livraison nationale (même pays) :</strong> 2 à 5 jours ouvrés.</p>
                <p><strong>Livraison internationale :</strong> 5 à 14 jours ouvrés selon la destination.</p>
                <p><strong>Paiement à la livraison (COD) :</strong> Disponible dans certains pays. Vérifiez lors du checkout.</p>
              </Section>
              <Section title="Suivi de commande">
                <p>Chaque commande reçoit un numéro de suivi. Vous pouvez suivre votre colis en temps réel depuis « Mon compte {'>'} Mes commandes » ou via la page de suivi avec votre numéro de commande.</p>
              </Section>
              <Section title="Frais de livraison">
                <p>Les frais de livraison sont fixés par le vendeur et affichés clairement lors du checkout. Zando ne prend aucune commission sur les frais de livraison.</p>
              </Section>
              <Section title="Zones de livraison">
                <p>Zando couvre le monde entier. Cependant, la disponibilité de la livraison dépend du vendeur et de sa capacité à livrer dans votre région. Utilisez les filtres « Pays » et « Ville » dans le catalogue pour voir les produits disponibles près de chez vous.</p>
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
                <p><strong>International delivery:</strong> 5 to 14 business days depending on destination.</p>
                <p><strong>Cash on Delivery (COD):</strong> Available in select countries. Check at checkout.</p>
              </Section>
              <Section title="Order Tracking">
                <p>Every order receives a tracking number. You can track your package in real time from "My Account {'>'} My Orders" or via the tracking page with your order number.</p>
              </Section>
              <Section title="Shipping Costs">
                <p>Shipping costs are set by the seller and clearly displayed at checkout. Zando takes no commission on shipping costs.</p>
              </Section>
              <Section title="Delivery Zones">
                <p>Zando covers the whole world. However, delivery availability depends on the seller and their ability to deliver to your region. Use the "Country" and "City" filters in the catalog to see products available near you.</p>
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
              <Section title="Produits digitaux">
                <p>Les produits digitaux (ebooks, fichiers audio, logiciels, ZIP...) sont livrés instantanément après paiement et ne sont pas éligibles au retour ou remboursement une fois le téléchargement effectué, sauf si le fichier est corrompu, illisible ou ne correspond manifestement pas à sa description — signalez ce cas au vendeur via la messagerie dans les 48 heures suivant l'achat.</p>
              </Section>
              <Section title="Livraison internationale et douanes">
                <p>Pour les commandes livrées vers un autre pays que celui du vendeur, des droits de douane, taxes à l'importation ou frais de dédouanement peuvent s'appliquer à l'arrivée et sont à la charge de l'acheteur, sauf mention contraire du vendeur. Les délais de livraison affichés au moment de la commande sont des estimations et peuvent varier selon les formalités douanières locales.</p>
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
              <Section title="Digital Products">
                <p>Digital products (ebooks, audio files, software, ZIP archives...) are delivered instantly after payment and are not eligible for return or refund once downloaded, unless the file is corrupted, unreadable, or clearly does not match its description — report this to the seller via messaging within 48 hours of purchase.</p>
              </Section>
              <Section title="International Shipping & Customs">
                <p>For orders shipped to a country other than the seller's, import duties, taxes, or customs clearance fees may apply on arrival and are the buyer's responsibility unless the seller states otherwise. Delivery timelines shown at checkout are estimates and may vary depending on local customs processing.</p>
              </Section>
            </>
          ))}

          {pageKey === 'payment-methods' && (locale === 'fr' ? (
            <>
              <Section title="Modes de paiement acceptés">
                <p>Zando supporte une large gamme de moyens de paiement adaptés à chaque marché :</p>
              </Section>
              <Section title="Mobile Money">
                <p>Cartes bancaires, virements, et solutions mobiles locales (Orange Money, MTN MoMo, M-Pesa, Wave...) selon les pays. Le paiement est instantané et sécurisé.</p>
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
                <p>Pour les achats auprès de vendeurs situés dans un autre pays, Zando facilite le paiement transfrontalier via des solutions comme Flutterwave et Stripe.</p>
              </Section>
              <Section title="Devises supportées">
                <p>USD, XOF (Franc CFA), NGN (Naira), GHS (Cedi), KES (Shilling kényan), ZAR (Rand), EGP (Livre égyptienne), et plus. Le vendeur choisit la devise dans laquelle il vend.</p>
              </Section>
            </>
          ) : (
            <>
              <Section title="Accepted Payment Methods">
                <p>Zando supports a wide range of payment methods adapted to every market:</p>
              </Section>
              <Section title="Mobile Money">
                <p>Cards, bank transfers, and local mobile solutions (Orange Money, MTN MoMo, M-Pesa, Wave...) depending on the country. Payment is instant and secure.</p>
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
                <p>For purchases from sellers in another country, Zando facilitates cross-border payment via solutions like Flutterwave and Stripe.</p>
              </Section>
              <Section title="Supported Currencies">
                <p>USD, XOF (CFA Franc), NGN (Naira), GHS (Cedi), KES (Kenyan Shilling), ZAR (Rand), EGP (Egyptian Pound), and more. The seller chooses the currency they sell in.</p>
              </Section>
            </>
          ))}

          {pageKey === 'terms' && (locale === 'fr' ? (
            <>
              <Section title="Conditions générales d'utilisation">
                <p>En utilisant Zando, vous acceptez les présentes conditions générales. Zando est une marketplace qui met en relation des vendeurs vérifiés et des acheteurs partout dans le monde.</p>
              </Section>
              <Section title="1. Comptes utilisateurs">
                <p>Vous devez créer un compte pour acheter ou vendre. Les vendeurs doivent compléter le processus KYC. Vous êtes responsable de la confidentialité de vos identifiants.</p>
              </Section>
              <Section title="2. Transactions">
                <p>Les transactions se font directement entre l'acheteur et le vendeur. Zando agit comme intermédiaire technique — infrastructure de place de marché, outils vendeurs, messagerie, résolution de litiges — et ne participe pas à la transaction financière : le paiement est envoyé directement au vendeur via son propre moyen de paiement. <em>[Si Zando vend directement des produits en tant que vendeur, cette activité sera identifiée comme telle sur les fiches concernées — non implémenté à ce jour dans l'application.]</em> Les vendeurs tiers sont seuls responsables de la qualité, l'authenticité, la conformité réglementaire et l'exécution de leurs propres produits.</p>
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
              <Section title="7. Éligibilité">
                <p>Vous devez avoir au moins 18 ans, ou l'âge légal de majorité dans votre pays de résidence, pour créer un compte acheteur ou vendeur sur Zando.</p>
              </Section>
              <Section title="8. Articles interdits">
                <p>Il est interdit de vendre sur Zando : des biens contrefaits, des armes, des substances illégales ou réglementées, des animaux vivants protégés, des biens volés, ainsi que tout produit dont la vente enfreint les lois locales ou internationales applicables. Zando se réserve le droit de retirer toute annonce non conforme et de suspendre le compte du vendeur concerné.</p>
              </Section>
              <Section title="9. Licence des produits digitaux">
                <p>L'achat d'un produit digital (ebook, fichier audio, logiciel...) vous accorde une licence d'usage personnel telle que définie par le vendeur, et non un transfert de propriété intellectuelle. La revente, redistribution ou reproduction non autorisée d'un produit digital acheté sur Zando est interdite.</p>
              </Section>
              <Section title="10. Limitation de responsabilité">
                <p>Dans la mesure permise par la loi, la responsabilité de Zando envers un utilisateur, pour toute réclamation liée à l'utilisation de la plateforme, est limitée au montant des frais de plateforme effectivement perçus par Zando pour la transaction concernée. Zando n'est pas responsable des dommages indirects, pertes de profits ou pertes de données.</p>
              </Section>
              <Section title="11. Droit applicable et résolution des litiges">
                <p>Zando opère via des entités enregistrées aux Émirats arabes unis (SPC FZC) et au Cameroun. Le droit applicable et la juridiction compétente exacts dépendent de l'entité contractante et de votre pays de résidence. <em>[Clause à finaliser avec un conseil juridique qualifié dans chaque juridiction concernée — LEGAL REVIEW REQUIRED avant publication définitive.]</em> Tout litige non résolu via le centre de confiance et de sécurité de Zando sera d'abord soumis à une tentative de résolution amiable, puis à la juridiction compétente ou à un mode alternatif de résolution des litiges convenu entre les parties.</p>
              </Section>
              <Section title="12. Résiliation de compte">
                <p>Zando peut suspendre ou résilier un compte en cas de violation des présentes conditions, de fraude avérée, ou de non-respect répété des engagements vendeur. L'utilisateur peut demander la suppression de son compte à tout moment via le support.</p>
              </Section>
            </>
          ) : (
            <>
              <Section title="Terms of Use">
                <p>By using Zando, you agree to these terms and conditions. Zando is a marketplace that connects verified sellers with buyers worldwide.</p>
              </Section>
              <Section title="1. User Accounts">
                <p>You must create an account to buy or sell. Sellers must complete the KYC process. You are responsible for keeping your credentials confidential.</p>
              </Section>
              <Section title="2. Transactions">
                <p>Transactions occur directly between buyer and seller. Zando acts as a technical intermediary — marketplace infrastructure, seller tools, messaging, dispute resolution — and does not participate in the financial transaction: payment is sent directly to the seller via their own payment method. <em>[If Zando sells products directly as a seller, that activity will be clearly identified as such on the relevant listings — not currently implemented in the application.]</em> Third-party sellers are solely responsible for the quality, authenticity, regulatory compliance, and fulfillment of their own products.</p>
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
              <Section title="7. Eligibility">
                <p>You must be at least 18 years old, or the legal age of majority in your country of residence, to create a buyer or seller account on Zando.</p>
              </Section>
              <Section title="8. Prohibited Items">
                <p>It is prohibited to sell on Zando: counterfeit goods, weapons, illegal or regulated substances, protected live animals, stolen goods, or any product whose sale violates applicable local or international law. Zando reserves the right to remove any non-compliant listing and suspend the seller's account.</p>
              </Section>
              <Section title="9. Digital Product Licensing">
                <p>Purchasing a digital product (ebook, audio file, software...) grants you a personal-use license as defined by the seller, not a transfer of intellectual property. Reselling, redistributing, or reproducing a digital product purchased on Zando without authorization is prohibited.</p>
              </Section>
              <Section title="10. Limitation of Liability">
                <p>To the extent permitted by law, Zando's liability to any user, for any claim related to use of the platform, is limited to the amount of platform fees actually collected by Zando for the transaction in question. Zando is not liable for indirect damages, lost profits, or data loss.</p>
              </Section>
              <Section title="11. Governing Law & Dispute Resolution">
                <p>Zando operates through entities registered in the United Arab Emirates (SPC FZC) and in Cameroon. The exact governing law and competent jurisdiction depend on the contracting entity and your country of residence. <em>[Clause to be finalized with qualified legal counsel in each relevant jurisdiction — LEGAL REVIEW REQUIRED before final publication.]</em> Any dispute not resolved through Zando's Trust & Safety center will first be subject to a good-faith attempt at amicable resolution, then to the competent jurisdiction or an alternative dispute resolution method agreed between the parties.</p>
              </Section>
              <Section title="12. Account Termination">
                <p>Zando may suspend or terminate an account in case of violation of these terms, proven fraud, or repeated failure to meet seller obligations. Users may request account deletion at any time via support.</p>
              </Section>
            </>
          ))}

          {pageKey === 'privacy' && (locale === 'fr' ? (
            <>
              <Section title="Politique de confidentialité">
                <p>Zando s'engage à protéger vos données personnelles. Cette politique explique quelles données nous collectons réellement et comment nous les utilisons — elle reflète le fonctionnement effectif de la plateforme, pas une liste générique.</p>
              </Section>
              <Section title="Données collectées">
                <p><strong>Comptes acheteurs :</strong> nom, e-mail, téléphone, adresses de livraison.</p>
                <p><strong>Comptes vendeurs :</strong> informations d'entreprise, documents KYC (pièce d'identité, selfie de vérification), coordonnées bancaires ou identifiants de moyen de paiement que vous configurez vous-même.</p>
                <p><strong>Commandes :</strong> articles achetés, montant, adresse de livraison, statut de livraison, échanges de messagerie avec le vendeur.</p>
                <p><strong>Abonnement vendeur :</strong> plan choisi, statut d'essai, historique de paiement d'abonnement (traité par le fournisseur de paiement central de Zando — Stripe, Paddle, PayUnit ou Flutterwave selon le mode de paiement choisi).</p>
                <p><strong>Données techniques :</strong> Cloudflare (hébergement) et Supabase (base de données) journalisent certaines données techniques standard (adresse IP, horodatages de requête) à des fins de sécurité et de fonctionnement de l'infrastructure — Zando n'exploite pas ces journaux à des fins de suivi marketing.</p>
              </Section>
              <Section title="Ce que Zando NE collecte PAS">
                <p>Zando n'utilise actuellement aucun outil d'analyse comportementale ou de suivi publicitaire tiers (type Google Analytics, Meta Pixel, etc.). Nous ne suivons pas votre navigation à des fins publicitaires.</p>
              </Section>
              <Section title="Utilisation des données">
                <p>Vos données sont utilisées pour : traiter les commandes, vérifier les vendeurs (KYC), faciliter la livraison, gérer les abonnements vendeur, traiter les signalements et litiges, et assurer la sécurité de la plateforme.</p>
              </Section>
              <Section title="Partage des données">
                <p>Vos données de commande (nom, adresse, téléphone) sont partagées avec le vendeur concerné pour la livraison — jamais avec les autres vendeurs. Nous ne vendons jamais vos données à des tiers. Chaque vendeur reçoit uniquement les données nécessaires à ses propres commandes, via son propre fournisseur de paiement (que Zando ne contrôle pas).</p>
              </Section>
              <Section title="Vos droits">
                <p>Vous pouvez accéder à vos données, les modifier ou demander leur suppression à tout moment depuis « Mon compte », ou en nous contactant à <a href="mailto:cs@liafrik.com" className="text-[#ff7a00] font-semibold hover:underline">cs@liafrik.com</a>. Selon votre pays de résidence, des droits supplémentaires peuvent s'appliquer (RGPD dans l'UE, par exemple) — LEGAL REVIEW REQUIRED pour la formulation exacte applicable à votre juridiction.</p>
              </Section>
              <Section title="Sécurité">
                <p>Les documents KYC sont stockés dans un espace privé, accessible uniquement au vendeur concerné et au personnel Zando autorisé. Les mots de passe et sessions sont gérés par notre fournisseur d'infrastructure (Supabase), avec chiffrement en transit (HTTPS).</p>
              </Section>
            </>
          ) : (
            <>
              <Section title="Privacy Policy">
                <p>Zando is committed to protecting your personal data. This policy explains what data we actually collect and how we use it — it reflects how the platform really works, not a generic template.</p>
              </Section>
              <Section title="Data Collected">
                <p><strong>Buyer accounts:</strong> name, email, phone, shipping addresses.</p>
                <p><strong>Seller accounts:</strong> business information, KYC documents (ID, verification selfie), bank details or payment method identifiers you configure yourself.</p>
                <p><strong>Orders:</strong> items purchased, amount, delivery address, delivery status, messaging exchanges with the seller.</p>
                <p><strong>Seller subscription:</strong> chosen plan, trial status, subscription payment history (processed by Zando's central payment provider — Stripe, Paddle, PayUnit, or Flutterwave depending on the payment method chosen).</p>
                <p><strong>Technical data:</strong> Cloudflare (hosting) and Supabase (database) log certain standard technical data (IP address, request timestamps) for security and infrastructure purposes — Zando does not use these logs for marketing tracking.</p>
              </Section>
              <Section title="What Zando Does NOT Collect">
                <p>Zando currently uses no third-party behavioral analytics or advertising tracking tool (e.g. Google Analytics, Meta Pixel). We do not track your browsing for advertising purposes.</p>
              </Section>
              <Section title="Data Usage">
                <p>Your data is used to: process orders, verify sellers (KYC), facilitate delivery, manage seller subscriptions, process reports and disputes, and ensure platform security.</p>
              </Section>
              <Section title="Data Sharing">
                <p>Your order data (name, address, phone) is shared with the relevant seller for delivery — never with other sellers. We never sell your data to third parties. Each seller only receives the data necessary for their own orders, via their own payment provider (which Zando does not control).</p>
              </Section>
              <Section title="Your Rights">
                <p>You can access, modify, or request deletion of your data at any time from "My Account", or by contacting us at <a href="mailto:cs@liafrik.com" className="text-[#ff7a00] font-semibold hover:underline">cs@liafrik.com</a>. Depending on your country of residence, additional rights may apply (e.g. GDPR in the EU) — LEGAL REVIEW REQUIRED for the exact wording applicable to your jurisdiction.</p>
              </Section>
              <Section title="Security">
                <p>KYC documents are stored in a private space, accessible only to the relevant seller and authorized Zando staff. Passwords and sessions are managed by our infrastructure provider (Supabase), with encryption in transit (HTTPS).</p>
              </Section>
            </>
          ))}

          {pageKey === 'cookies' && (locale === 'fr' ? (
            <>
              <Section title="Politique de cookies">
                <p>Cette page décrit précisément ce que Zando stocke sur votre appareil aujourd'hui — pas une liste générique. Techniquement, Zando utilise le stockage local du navigateur (localStorage), pas des cookies traditionnels, à l'exception du cookie de session géré par notre fournisseur d'authentification.</p>
              </Section>
              <Section title="Ce que nous stockons réellement">
                <p><strong>Essentiel :</strong> jeton de session d'authentification (pour rester connecté), contenu du panier, liste de souhaits.</p>
                <p><strong>Préférences :</strong> langue choisie, devise d'affichage, pays/ville sélectionnés pour le filtrage.</p>
                <p><strong>Programme d'affiliation :</strong> si vous arrivez via un lien d'affilié, le code de parrainage est mémorisé temporairement pour attribuer la conversion.</p>
              </Section>
              <Section title="Ce que nous n'utilisons PAS">
                <p>Zando n'utilise actuellement aucun cookie ou outil d'analyse tiers (Google Analytics, Meta Pixel, ou équivalent) et aucun cookie publicitaire de suivi inter-sites. Si cela évolue, cette page sera mise à jour en conséquence.</p>
              </Section>
              <Section title="Gestion">
                <p>Vous pouvez effacer ces données à tout moment via les paramètres de votre navigateur (« Effacer les données de navigation »). Cela vous déconnectera et réinitialisera votre panier et vos préférences.</p>
              </Section>
            </>
          ) : (
            <>
              <Section title="Cookies Policy">
                <p>This page describes precisely what Zando actually stores on your device today — not a generic list. Technically, Zando uses browser local storage (localStorage), not traditional cookies, apart from the session cookie managed by our authentication provider.</p>
              </Section>
              <Section title="What We Actually Store">
                <p><strong>Essential:</strong> authentication session token (to keep you logged in), cart contents, wishlist.</p>
                <p><strong>Preferences:</strong> chosen language, display currency, selected country/city for filtering.</p>
                <p><strong>Affiliate program:</strong> if you arrive via an affiliate link, the referral code is temporarily remembered to attribute the conversion.</p>
              </Section>
              <Section title="What We Do NOT Use">
                <p>Zando currently uses no third-party cookies or analytics tools (Google Analytics, Meta Pixel, or equivalent) and no cross-site advertising tracking cookies. If this changes, this page will be updated accordingly.</p>
              </Section>
              <Section title="Management">
                <p>You can clear this data at any time via your browser settings ("Clear browsing data"). This will log you out and reset your cart and preferences.</p>
              </Section>
            </>
          ))}

          {pageKey === 'legal-notice' && (locale === 'fr' ? (
            <>
              <Section title="Mentions légales">
                <p>Zando est une marketplace opérée par Liafrik, spécialisée dans le commerce électronique mondial.</p>
              </Section>
              <Section title="Éditeur">
                <p><strong><a href="https://liafrik.com" target="_blank" rel="noopener noreferrer" className="text-[#ff7a00] font-semibold hover:underline">Liafrik</a></strong></p>
                <p>E-mail : <a href="mailto:zando@liafrik.com" className="text-[#ff7a00] font-semibold hover:underline">zando@liafrik.com</a></p>
                <p>Service client : <a href="mailto:cs@liafrik.com" className="text-[#ff7a00] font-semibold hover:underline">cs@liafrik.com</a></p>
                <p>Support technique : <a href="mailto:support@liafrik.com" className="text-[#ff7a00] font-semibold hover:underline">support@liafrik.com</a></p>
              </Section>
              <Section title="Entités juridiques">
                <p>Zando opère via les structures suivantes : une entité enregistrée aux Émirats arabes unis (SPC FZC) et une entité enregistrée au Cameroun. <em>[Numéro d'enregistrement, adresse de siège social et licence commerciale précise : NON VÉRIFIÉ — à confirmer et compléter avec les documents d'immatriculation officiels avant publication finale.]</em></p>
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
                <p>Zando is a marketplace operated by Liafrik, specializing in global e-commerce.</p>
              </Section>
              <Section title="Publisher">
                <p><strong><a href="https://liafrik.com" target="_blank" rel="noopener noreferrer" className="text-[#ff7a00] font-semibold hover:underline">Liafrik</a></strong></p>
                <p>Email: <a href="mailto:zando@liafrik.com" className="text-[#ff7a00] font-semibold hover:underline">zando@liafrik.com</a></p>
                <p>Customer service: <a href="mailto:cs@liafrik.com" className="text-[#ff7a00] font-semibold hover:underline">cs@liafrik.com</a></p>
                <p>Technical support: <a href="mailto:support@liafrik.com" className="text-[#ff7a00] font-semibold hover:underline">support@liafrik.com</a></p>
              </Section>
              <Section title="Registered Entities">
                <p>Zando operates through the following structures: an entity registered in the United Arab Emirates (SPC FZC) and an entity registered in Cameroon. <em>[Precise registration number, registered office address, and commercial license: NOT VERIFIED — to be confirmed and completed with official incorporation documents before final publication.]</em></p>
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
                <p>Zando est une marketplace mondiale en pleine croissance. Nous recherchons des talents passionnés par le commerce international et l'innovation technologique.</p>
              </Section>
              <Section title="Pourquoi rejoindre Zando ?">
                <p><strong>Impact mondial :</strong> Notre travail affecte des millions d'acheteurs et de vendeurs à travers le monde.</p>
                <p><strong>Innovation :</strong> Nous construisons des solutions adaptées à chaque marché local (Mobile Money, livraison par le vendeur, paiements transfrontaliers).</p>
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
                <p>Envoyez votre CV et lettre de motivation à <a href="mailto:zando@liafrik.com" className="text-[#ff7a00] font-semibold hover:underline">zando@liafrik.com</a> avec l'objet « Candidature ».</p>
              </Section>
            </>
          ) : (
            <>
              <Section title="Careers at Zando">
                <p>Zando is a fast-growing global marketplace. We're looking for talent passionate about global commerce and technological innovation.</p>
              </Section>
              <Section title="Why Join Zando?">
                <p><strong>Global Impact:</strong> Our work affects millions of buyers and sellers worldwide.</p>
                <p><strong>Innovation:</strong> We build solutions adapted to every local market (Mobile Money, seller delivery, cross-border payments).</p>
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
                <p>Send your CV and cover letter to <a href="mailto:zando@liafrik.com" className="text-[#ff7a00] font-semibold hover:underline">zando@liafrik.com</a> with the subject "Application".</p>
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
                  <Headphones className="w-8 h-8 text-[#ff7a00] mb-3" />
                  <h3 className="text-sm font-bold text-[#0f172a] mb-1">{locale === 'fr' ? 'Service Client' : 'Customer Service'}</h3>
                  <a href="mailto:cs@liafrik.com" className="text-sm text-[#ff7a00] font-semibold hover:underline flex items-center gap-2"><Mail className="w-4 h-4" /> cs@liafrik.com</a>
                </div>
                <div className="card p-5">
                  <Briefcase className="w-8 h-8 text-[#ff7a00] mb-3" />
                  <h3 className="text-sm font-bold text-[#0f172a] mb-1">{locale === 'fr' ? 'Partenariats' : 'Partnerships'}</h3>
                  <a href="mailto:zando@liafrik.com" className="text-sm text-[#ff7a00] font-semibold hover:underline flex items-center gap-2"><Mail className="w-4 h-4" /> zando@liafrik.com</a>
                </div>
                <div className="card p-5">
                  <ShieldCheck className="w-8 h-8 text-[#ff7a00] mb-3" />
                  <h3 className="text-sm font-bold text-[#0f172a] mb-1">{locale === 'fr' ? 'Support Technique' : 'Technical Support'}</h3>
                  <a href="mailto:support@liafrik.com" className="text-sm text-[#ff7a00] font-semibold hover:underline flex items-center gap-2"><Mail className="w-4 h-4" /> support@liafrik.com</a>
                </div>
                <div className="card p-5">
                  <Clock className="w-8 h-8 text-[#ff7a00] mb-3" />
                  <h3 className="text-sm font-bold text-[#0f172a] mb-1">{locale === 'fr' ? 'Disponibilité' : 'Availability'}</h3>
                  <p className="text-sm text-[#64748b]">{locale === 'fr' ? '24h/24, 7j/7' : '24/7, 365 days a year'}</p>
                </div>
              </div>
              <Section title={locale === 'fr' ? 'Siège social' : 'Headquarters'}>
                <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#ff7a00]" /> {locale === 'fr' ? 'Abidjan, Côte d\'Ivoire' : 'Abidjan, Côte d\'Ivoire'}</p>
                <p className="flex items-center gap-2"><Globe className="w-4 h-4 text-[#ff7a00]" /> {locale === 'fr' ? 'Desserte : couverture mondiale' : 'Coverage: worldwide'}</p>
              </Section>
            </>
          )}
        </div>

        {/* Back to home */}
        <div className="mt-6 flex items-center justify-center">
          <button onClick={() => navigate('home')} className="text-sm text-[#64748b] hover:text-[#ff7a00] flex items-center gap-2">
            <ArrowRight className="w-4 h-4 rotate-180" /> {locale === 'fr' ? 'Retour à l\'accueil' : 'Back to home'}
          </button>
        </div>
      </div>
    </div>
  );
}
