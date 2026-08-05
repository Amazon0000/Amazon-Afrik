import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: [
    'dist',
    'CookiesBanner.tsx',
    'TrustSafetyPage.tsx',
    'db.ts',
    'i18n.ts',
    'store.tsx',
    'vite-env.d.ts',
    'AccountPage.tsx',
    'AdsPage.tsx',
    'App.tsx',
    'AuthPage.tsx',
    'Cards.tsx',
    'CartPage.tsx',
    'CatalogPage.tsx',
    'CheckoutPage.tsx',
    'CustomerServicePage.tsx',
    'DeliveryPage.tsx',
    'Footer.tsx',
    'HomePage.tsx',
    'InfoPage.tsx',
    'Logo.tsx',
    'OnboardingPage.tsx',
    'PlansPage.tsx',
    'ProductPage.tsx',
    'SellLandingPage.tsx',
    'SellerCenterPage.tsx',
    'SellerPage.tsx',
    'SellersPage.tsx',
    'geo.ts',
    'supabase.ts',
    'ui.tsx'
  ] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  }
);
