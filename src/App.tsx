import { AppProvider, useApp } from '@/lib/store';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ToastContainer } from '@/components/Toast';
import { HomePage } from '@/pages/HomePage';
import { CatalogPage } from '@/pages/CatalogPage';
import { ProductPage } from '@/pages/ProductPage';
import { SellerPage } from '@/pages/SellerPage';
import { SellersPage } from '@/pages/SellersPage';
import { CartPage } from '@/pages/CartPage';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { OnboardingPage } from '@/pages/OnboardingPage';
import { SellerCenterPage } from '@/pages/SellerCenterPage';
import { PlansPage } from '@/pages/PlansPage';
import { AdsPage } from '@/pages/AdsPage';
import { AdminPage } from '@/pages/AdminPage';
import { AuthPage } from '@/pages/AuthPage';
import { DeliveryPage } from '@/pages/DeliveryPage';
import { AccountPage } from '@/pages/AccountPage';
import { SellLandingPage } from '@/pages/SellLandingPage';
import { TrustSafetyPage } from '@/pages/TrustSafetyPage';
import { InfoPage, type InfoKey } from '@/pages/InfoPage';
import { CustomerServicePage } from '@/pages/CustomerServicePage';
import { AffiliatePage } from '@/pages/AffiliatePage';
import { CookiesBanner } from '@/components/CookiesBanner';

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
      <main className="flex-1">{renderPage()}</main>
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
