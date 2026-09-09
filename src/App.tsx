import { Suspense, lazy } from 'react';
import { AppProvider, useApp } from '@/lib/store';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ToastContainer } from '@/components/Toast';
import { HomePage } from '@/pages/HomePage';
import { CookiesBanner } from '@/components/CookiesBanner';
import type { InfoKey } from '@/pages/InfoPage';

// Route-level code splitting: previously every page (including the full
// Admin dashboard and Seller Center) was bundled into one ~1.3MB file
// downloaded even by a first-time visitor to the homepage. Each page now
// loads on demand instead — HomePage stays eager since it's the most
// common entry point and this avoids a loading flash there.
const CatalogPage = lazy(() => import('@/pages/CatalogPage').then((m) => ({ default: m.CatalogPage })));
const ProductPage = lazy(() => import('@/pages/ProductPage').then((m) => ({ default: m.ProductPage })));
const SellerPage = lazy(() => import('@/pages/SellerPage').then((m) => ({ default: m.SellerPage })));
const SellersPage = lazy(() => import('@/pages/SellersPage').then((m) => ({ default: m.SellersPage })));
const CartPage = lazy(() => import('@/pages/CartPage').then((m) => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage })));
const OnboardingPage = lazy(() => import('@/pages/OnboardingPage').then((m) => ({ default: m.OnboardingPage })));
const SellerCenterPage = lazy(() => import('@/pages/SellerCenterPage').then((m) => ({ default: m.SellerCenterPage })));
const PlansPage = lazy(() => import('@/pages/PlansPage').then((m) => ({ default: m.PlansPage })));
const AdsPage = lazy(() => import('@/pages/AdsPage').then((m) => ({ default: m.AdsPage })));
const AdminPage = lazy(() => import('@/pages/AdminPage').then((m) => ({ default: m.AdminPage })));
const AuthPage = lazy(() => import('@/pages/AuthPage').then((m) => ({ default: m.AuthPage })));
const DeliveryPage = lazy(() => import('@/pages/DeliveryPage').then((m) => ({ default: m.DeliveryPage })));
const AccountPage = lazy(() => import('@/pages/AccountPage').then((m) => ({ default: m.AccountPage })));
const SellLandingPage = lazy(() => import('@/pages/SellLandingPage').then((m) => ({ default: m.SellLandingPage })));
const TrustSafetyPage = lazy(() => import('@/pages/TrustSafetyPage').then((m) => ({ default: m.TrustSafetyPage })));
const InfoPage = lazy(() => import('@/pages/InfoPage').then((m) => ({ default: m.InfoPage })));
const CustomerServicePage = lazy(() => import('@/pages/CustomerServicePage').then((m) => ({ default: m.CustomerServicePage })));
const AffiliatePage = lazy(() => import('@/pages/AffiliatePage').then((m) => ({ default: m.AffiliatePage })));

function PageLoadingFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#ff7a00] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function Router() {
  const { page, params } = useApp();

  const renderPage = () => {
    switch (page) {
      case 'home': return <HomePage />;
      case 'catalog': return <CatalogPage />;
      case 'product': return <ProductPage />;
      case 'seller': return <SellerPage />;
      case 'sellers': return <SellersPage />;
      case 'cart': return <CartPage />;
      case 'checkout': return <CheckoutPage />;
      case 'account': return <AccountPage />;
      case 'onboarding': return <OnboardingPage />;
      case 'seller-center': return <SellerCenterPage />;
      case 'plans': return <PlansPage />;
      case 'ads': return <AdsPage />;
      case 'admin': return <AdminPage />;
      case 'login': return <AuthPage mode="login" />;
      case 'signup': return <AuthPage mode="signup" />;
      case 'delivery': return <DeliveryPage />;
      case 'sell': return <SellLandingPage />;
      case 'trust-safety': return <TrustSafetyPage />;
      case 'info': return <InfoPage pageKey={(params.k as InfoKey) || 'about'} />;
      case 'customer-service': return <CustomerServicePage />;
      case 'affiliate': return <AffiliatePage />;
      default: return <HomePage />;
    }
  };

  const isAuthPage = page === 'login' || page === 'signup';
  const isSellPage = page === 'sell' || page === 'onboarding';

  return (
    <div className="min-h-screen flex flex-col">
      {!isAuthPage && !isSellPage && <Header />}
      <main className="flex-1">
        <Suspense fallback={<PageLoadingFallback />}>{renderPage()}</Suspense>
      </main>
      {!isAuthPage && !isSellPage && <Footer />}
      <ToastContainer />
      <CookiesBanner />
    </div>
  );
}

function App() {
  return (
    <AppProvider><Router /></AppProvider>
  );
}

export default App;
