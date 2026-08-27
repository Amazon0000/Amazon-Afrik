export type Locale = 'fr' | 'en';

export type Dict = {
  nav: {
    home: string; catalog: string; sellers: string; becomeSeller: string; plans: string; ads: string;
    login: string; signup: string; account: string; sellerCenter: string; admin: string; logout: string;
    orders: string; wishlist: string; addresses: string;
  };
  home: {
    heroTag: string; heroTitle: string; heroSubtitle: string; ctaBrowse: string; ctaSell: string;
    featuredSellers: string; featuredProducts: string; byCountry: string; viewOtherCountries: string;
    trustTitle: string; trust1: string; trust2: string; trust3: string; trust4: string;
    dealsTitle: string; dealsSubtitle: string; shopNow: string; sponsoredBanner: string;
    categoriesTitle: string; newArrivals: string; topRated: string;
    trendingProducts: string; recommendedForYou: string; productsNearYou: string; popularBrands: string;
    bestSellers: string; limitedTimeOffers: string; recentlyViewed: string; continueShopping: string;
  };
  catalog: {
    title: string; filters: string; country: string; city: string; region: string; district: string;
    neighborhood: string; landmark: string; category: string; priceRange: string; sortBy: string;
    sortPopular: string; sortNewest: string; sortPriceLow: string; sortPriceHigh: string; sortRating: string;
    results: string; noResults: string; clearFilters: string; sponsored: string;
    subcategory: string; rating: string; inStock: string; page: string; of: string; next: string; prev: string;
  };
  product: {
    addToCart: string; buyNow: string; seller: string; description: string; reviews: string;
    delivery: string; deliveryBySeller: string; inStock: string; outOfStock: string;
    relatedProducts: string; quantity: string; features: string; variations: string;
    writeReview: string; verifiedPurchase: string; addToWishlist: string; removeFromWishlist: string;
    shareProduct: string; brand: string; soldBy: string; visitStore: string;
  };
  cart: {
    title: string; empty: string; emptyDesc: string; continueShopping: string;
    subtotal: string; delivery: string; total: string; checkout: string; remove: string;
    qty: string; orderSummary: string; freeDelivery: string; items: string;
  };
  checkout: {
    title: string; deliveryAddress: string; selectAddress: string; addNewAddress: string;
    paymentMethod: string; mobileMoney: string; paystack: string; flutterwave: string;
    mpesa: string; card: string; cardNumber: string; expiry: string; cvv: string;
    cardName: string; placeOrder: string; orderPlaced: string; orderPlacedDesc: string;
    reviewOrder: string; directPayment: string; directPaymentDesc: string;
    phoneNumber: string; provider: string;
  };
  account: {
    title: string; profile: string; myOrders: string; myAddresses: string; wishlist: string;
    personalInfo: string; fullName: string; email: string; phone: string; save: string;
    noOrders: string; noAddresses: string; noWishlist: string; orderHistory: string;
    addAddress: string; editAddress: string; defaultAddress: string; setDefault: string;
    addressLabel: string; street: string; selectCountry: string; selectCity: string;
    selectRegion: string; selectDistrict: string; selectNeighborhood: string; selectLandmark: string;
    orderStatus: string; viewTracking: string; reorder: string;
  };
  seller: {
    dashboard: string; products: string; orders: string; deliveries: string; returns: string;
    reputation: string; subscription: string; ads: string; analytics: string;
    addProduct: string; productName: string; price: string; stock: string; category: string;
    description: string; uploadImages: string; save: string; cancel: string;
    revenue: string; conversionRate: string; visitors: string; recentOrders: string;
    productVariations: string; addVariation: string;
  };
  onboarding: {
    title: string; subtitle: string; step: string; of: string;
    country: string; location: string; legal: string; documents: string; validation: string;
    selectCountry: string; selectCity: string; selectRegion: string; selectDistrict: string;
    selectNeighborhood: string; selectLandmark: string;
    companyName: string; companyNumber: string; vatNumber: string;
    idFront: string; idBack: string; companyCert: string; license: string; storePhoto: string;
    next: string; back: string; submit: string;
    pending: string; approved: string; rejected: string; submitSuccess: string;
  };
  plans: {
    title: string; subtitle: string; perMonth: string;
    starter: string; premium: string; enterprise: string;
    starterPrice: string; premiumPrice: string; enterprisePrice: string;
    choose: string; current: string;
    starterFeatures: string[]; premiumFeatures: string[]; enterpriseFeatures: string[];
  };
  ads: {
    title: string; subtitle: string; createCampaign: string; campaignName: string;
    targetCountry: string; targetCity: string; targetCategory: string;
    duration: string; budget: string; launch: string;
    impressions: string; clicks: string; conversions: string;
    activeCampaigns: string; yourCampaigns: string;
  };
  admin: {
    title: string; overview: string; sellers: string; products: string; kyc: string; ads: string;
    disputes: string; geography: string; staff: string; plans: string; analytics: string;
    settings: string; languages: string; payments: string; documents: string;
  };
  auth: {
    loginTitle: string; signupTitle: string; email: string; password: string; fullName: string;
    loginBtn: string; signupBtn: string; noAccount: string; haveAccount: string;
    sellerAccount: string; customerAccount: string;
  };
  delivery: {
    title: string; trackingId: string; status: string;
    pending: string; preparing: string; inTransit: string; delivered: string;
    proofOfDelivery: string; estimatedArrival: string; sellerDelivers: string;
    confirmed: string; cancelled: string;
  };
  common: {
    loading: string; search: string; searchPlaceholder: string;
    save: string; cancel: string; delete: string; edit: string; confirm: string;
    yes: string; no: string; close: string; back: string; next: string; all: string; none: string;
    currency: string; showing: string; results: string; sortBy: string; filter: string; clear: string;
    addedToCart: string; removedFromCart: string; addedToWishlist: string; removedFromWishlist: string;
  };
};

const fr: Dict = {
  nav: {
    home: 'Accueil', catalog: 'Catalogue', sellers: 'Vendeurs', becomeSeller: 'Devenir vendeur',
    plans: 'Abonnements', ads: 'Publicité', login: 'Connexion', signup: 'Inscription',
    account: 'Compte', sellerCenter: 'Espace vendeur', admin: 'Administration', logout: 'Déconnexion',
    orders: 'Commandes', wishlist: 'Favoris', addresses: 'Adresses',
  },
  home: {
    heroTag: 'Marketplace Africain Premium',
    heroTitle: 'L\'élégance africaine, livrée chez vous',
    heroSubtitle: 'Des vendeurs professionnels vérifiés, un paiement direct, une livraison assurée par le vendeur lui-même. Découvrez le meilleur de l\'Afrique.',
    ctaBrowse: 'Parcourir le catalogue', ctaSell: 'Devenir vendeur',
    featuredSellers: 'Vendeurs en vedette', featuredProducts: 'Produits en vedette',
    byCountry: 'Explorer par pays', viewOtherCountries: 'Voir vendeurs d\'autres pays',
    trustTitle: 'Pourquoi Zando',
    trust1: 'Vendeurs vérifiés par KYC strict', trust2: 'Paiement direct au vendeur',
    trust3: 'Livraison par le vendeur lui-même', trust4: 'Bilingue Français & Anglais',
    dealsTitle: 'Offres du jour', dealsSubtitle: 'Profitez de prix exclusifs sur une sélection de produits',
    shopNow: 'Acheter maintenant', sponsoredBanner: 'Sponsorisé par Zando Ads',
    categoriesTitle: 'Catégories', newArrivals: 'Nouveautés', topRated: 'Les mieux notés',
    trendingProducts: 'Produits Tendance', recommendedForYou: 'Recommandé Pour Vous',
    productsNearYou: 'Produits Près de Vous', popularBrands: 'Marques Populaires',
    bestSellers: 'Meilleures Ventes', limitedTimeOffers: 'Offres à Durée Limitée',
    recentlyViewed: 'Vus Récemment', continueShopping: 'Continuer vos Achats',
  },
  catalog: {
    title: 'Catalogue', filters: 'Filtres', country: 'Pays', city: 'Ville', region: 'Région',
    district: 'District', neighborhood: 'Quartier', landmark: 'Point de repère',
    category: 'Catégorie', priceRange: 'Fourchette de prix', sortBy: 'Trier par',
    sortPopular: 'Popularité', sortNewest: 'Plus récents', sortPriceLow: 'Prix croissant',
    sortPriceHigh: 'Prix décroissant', sortRating: 'Mieux notés',
    results: 'résultats', noResults: 'Aucun résultat trouvé. Essayez d\'ajuster vos filtres.',
    clearFilters: 'Effacer les filtres', sponsored: 'Sponsorisé',
    subcategory: 'Sous-catégorie', rating: 'Note', inStock: 'En stock seulement',
    page: 'Page', of: 'sur', next: 'Suivant', prev: 'Précédent',
  },
  product: {
    addToCart: 'Ajouter au panier', buyNow: 'Acheter maintenant', seller: 'Vendeur',
    description: 'Description', reviews: 'Avis', delivery: 'Livraison',
    deliveryBySeller: 'Livré directement par le vendeur', inStock: 'En stock',
    outOfStock: 'Rupture de stock', relatedProducts: 'Produits similaires', quantity: 'Quantité',
    features: 'Caractéristiques', variations: 'Options', writeReview: 'Écrire un avis',
    verifiedPurchase: 'Achat vérifié', addToWishlist: 'Ajouter aux favoris',
    removeFromWishlist: 'Retirer des favoris', shareProduct: 'Partager', brand: 'Marque',
    soldBy: 'Vendu par', visitStore: 'Visiter la boutique',
  },
  cart: {
    title: 'Panier', empty: 'Votre panier est vide', emptyDesc: 'Parcourez notre catalogue et ajoutez vos articles préférés',
    continueShopping: 'Continuer mes achats', subtotal: 'Sous-total', delivery: 'Livraison',
    total: 'Total', checkout: 'Passer la commande', remove: 'Retirer', qty: 'Qté',
    orderSummary: 'Récapitulatif', freeDelivery: 'Livraison par le vendeur', items: 'articles',
  },
  checkout: {
    title: 'Paiement', deliveryAddress: 'Adresse de livraison', selectAddress: 'Choisir une adresse',
    addNewAddress: 'Ajouter une nouvelle adresse', paymentMethod: 'Méthode de paiement',
    mobileMoney: 'Mobile Money', paystack: 'Paystack', flutterwave: 'Flutterwave',
    mpesa: 'M-Pesa', card: 'Carte bancaire', cardNumber: 'Numéro de carte', expiry: 'Expiration',
    cvv: 'CVV', cardName: 'Nom sur la carte', placeOrder: 'Confirmer la commande',
    orderPlaced: 'Commande confirmée !', orderPlacedDesc: 'Votre commande a été placée. Le vendeur vous livrera directement.',
    reviewOrder: 'Récapitulatif de commande', directPayment: 'Paiement direct vendeur',
    directPaymentDesc: 'Votre paiement va directement au vendeur. Zando ne prend aucune commission.',
    phoneNumber: 'Numéro de téléphone', provider: 'Opérateur',
  },
  account: {
    title: 'Mon compte', profile: 'Profil', myOrders: 'Mes commandes', myAddresses: 'Mes adresses',
    wishlist: 'Mes favoris', personalInfo: 'Informations personnelles',
    fullName: 'Nom complet', email: 'Adresse e-mail', phone: 'Téléphone', save: 'Enregistrer',
    noOrders: 'Vous n\'avez pas encore de commande', noAddresses: 'Vous n\'avez pas d\'adresse enregistrée',
    noWishlist: 'Votre liste de favoris est vide', orderHistory: 'Historique des commandes',
    addAddress: 'Ajouter une adresse', editAddress: 'Modifier l\'adresse',
    defaultAddress: 'Adresse par défaut', setDefault: 'Définir par défaut',
    addressLabel: 'Libellé (Maison, Bureau...)', street: 'Rue et numéro',
    selectCountry: 'Pays', selectCity: 'Ville', selectRegion: 'Région', selectDistrict: 'District',
    selectNeighborhood: 'Quartier', selectLandmark: 'Point de repère',
    orderStatus: 'Statut', viewTracking: 'Suivre', reorder: 'Commander à nouveau',
  },
  seller: {
    dashboard: 'Tableau de bord', products: 'Produits', orders: 'Commandes', deliveries: 'Livraisons',
    returns: 'Retours', reputation: 'Réputation', subscription: 'Abonnement', ads: 'Publicités',
    analytics: 'Analytics', addProduct: 'Ajouter un produit', productName: 'Nom du produit',
    price: 'Prix', stock: 'Stock', category: 'Catégorie', description: 'Description',
    uploadImages: 'Téléverser des images', save: 'Enregistrer', cancel: 'Annuler',
    revenue: 'Revenus', conversionRate: 'Taux de conversion', visitors: 'Visiteurs',
    recentOrders: 'Commandes récentes', productVariations: 'Variations produit', addVariation: 'Ajouter une variation',
  },
  onboarding: {
    title: 'Onboarding Vendeur', subtitle: 'Un processus strict en 5 étapes pour garantir la confiance',
    step: 'Étape', of: 'sur', country: 'Pays', location: 'Localisation', legal: 'Informations légales',
    documents: 'Documents', validation: 'Validation',
    selectCountry: 'Sélectionnez votre pays', selectCity: 'Sélectionnez la ville',
    selectRegion: 'Sélectionnez la région', selectDistrict: 'Sélectionnez le district',
    selectNeighborhood: 'Sélectionnez le quartier', selectLandmark: 'Point de repère (optionnel)',
    companyName: 'Nom de l\'entreprise', companyNumber: 'Numéro de registre de commerce',
    vatNumber: 'Numéro de TVA (si applicable)',
    idFront: 'Pièce d\'identité recto', idBack: 'Pièce d\'identité verso',
    companyCert: 'Certificat d\'entreprise', license: 'Licence commerciale', storePhoto: 'Photo du magasin / entrepôt',
    next: 'Suivant', back: 'Retour', submit: 'Soumettre la demande',
    pending: 'En attente de validation', approved: 'Validé', rejected: 'Refusé',
    submitSuccess: 'Votre demande a été soumise. Notre équipe va l\'examiner sous 48h.',
  },
  plans: {
    title: 'Abonnements Vendeurs', subtitle: 'Choisissez le plan qui correspond à votre activité',
    perMonth: '/ mois', starter: 'Starter', premium: 'Premium', enterprise: 'Entreprise',
    starterPrice: '9 $', premiumPrice: '29 $', enterprisePrice: '79 $',
    choose: 'Choisir ce plan', current: 'Plan actuel',
    starterFeatures: ['Jusqu\'à 10 produits', 'Accès limité', 'Pas de publicité gratuite', 'Visibilité standard'],
    premiumFeatures: ['Jusqu\'à 100 produits', 'Outils marketing', 'Analytics avancés', 'Accès aux publicités internes', 'Visibilité améliorée'],
    enterpriseFeatures: ['Produits illimités', 'Accès complet', 'Publicité gratuite 7 jours à chaque renouvellement', 'Priorité support', 'Positionnement premium dans les listings'],
  },
  ads: {
    title: 'Zando Ads', subtitle: 'Boostez la visibilité de vos produits',
    createCampaign: 'Créer une campagne', campaignName: 'Nom de la campagne',
    targetCountry: 'Pays cible', targetCity: 'Ville cible', targetCategory: 'Catégorie cible',
    duration: 'Durée (jours)', budget: 'Budget ($)', launch: 'Lancer la campagne',
    impressions: 'Impressions', clicks: 'Clics', conversions: 'Conversions',
    activeCampaigns: 'Campagnes actives', yourCampaigns: 'Vos campagnes',
  },
  admin: {
    title: 'Administration', overview: 'Vue d\'ensemble', sellers: 'Vendeurs', products: 'Produits',
    kyc: 'Vérification KYC', ads: 'Publicités', disputes: 'Litiges', geography: 'Géographie',
    staff: 'Staff & Rôles', plans: 'Abonnements', analytics: 'Analytics', settings: 'Paramètres',
    languages: 'Langues', payments: 'Paiements', documents: 'Documents',
  },
  auth: {
    loginTitle: 'Connexion', signupTitle: 'Créer un compte', email: 'Adresse e-mail', password: 'Mot de passe',
    fullName: 'Nom complet', loginBtn: 'Se connecter', signupBtn: 'S\'inscrire',
    noAccount: 'Pas encore de compte ?', haveAccount: 'Déjà un compte ?',
    sellerAccount: 'Compte vendeur', customerAccount: 'Compte client',
  },
  delivery: {
    title: 'Suivi de livraison', trackingId: 'Numéro de suivi', status: 'Statut',
    pending: 'En attente', preparing: 'En préparation', inTransit: 'En transit', delivered: 'Livré',
    proofOfDelivery: 'Preuve de livraison', estimatedArrival: 'Arrivée estimée', sellerDelivers: 'Livré par le vendeur',
    confirmed: 'Confirmée', cancelled: 'Annulée',
  },
  common: {
    loading: 'Chargement...', search: 'Rechercher', searchPlaceholder: 'Rechercher un produit, un vendeur...',
    save: 'Enregistrer', cancel: 'Annuler', delete: 'Supprimer', edit: 'Modifier', confirm: 'Confirmer',
    yes: 'Oui', no: 'Non', close: 'Fermer', back: 'Retour', next: 'Suivant', all: 'Tous', none: 'Aucun',
    currency: '$', showing: 'Affichage de', results: 'résultats', sortBy: 'Trier par', filter: 'Filtrer', clear: 'Effacer',
    addedToCart: 'Ajouté au panier', removedFromCart: 'Retiré du panier',
    addedToWishlist: 'Ajouté aux favoris', removedFromWishlist: 'Retiré des favoris',
  },
};

const en: Dict = {
  nav: {
    home: 'Home', catalog: 'Catalog', sellers: 'Sellers', becomeSeller: 'Become a seller',
    plans: 'Subscriptions', ads: 'Advertising', login: 'Login', signup: 'Sign up',
    account: 'Account', sellerCenter: 'Seller Center', admin: 'Administration', logout: 'Log out',
    orders: 'Orders', wishlist: 'Wishlist', addresses: 'Addresses',
  },
  home: {
    heroTag: 'Premium African Marketplace',
    heroTitle: 'African elegance, delivered to your door',
    heroSubtitle: 'Verified professional sellers, direct payment, delivery handled by the seller themselves. Discover the best of Africa.',
    ctaBrowse: 'Browse the catalog', ctaSell: 'Become a seller',
    featuredSellers: 'Featured sellers', featuredProducts: 'Featured products',
    byCountry: 'Explore by country', viewOtherCountries: 'View sellers from other countries',
    trustTitle: 'Why Zando',
    trust1: 'Sellers verified by strict KYC', trust2: 'Direct payment to the seller',
    trust3: 'Delivery by the seller themselves', trust4: 'Bilingual French & English',
    dealsTitle: 'Today\'s Deals', dealsSubtitle: 'Enjoy exclusive prices on a selection of products',
    shopNow: 'Shop now', sponsoredBanner: 'Sponsored by Zando Ads',
    categoriesTitle: 'Categories', newArrivals: 'New arrivals', topRated: 'Top rated',
    trendingProducts: 'Trending Products', recommendedForYou: 'Recommended For You',
    productsNearYou: 'Products Near You', popularBrands: 'Popular Brands',
    bestSellers: 'Best Sellers', limitedTimeOffers: 'Limited Time Offers',
    recentlyViewed: 'Recently Viewed', continueShopping: 'Continue Shopping',
  },
  catalog: {
    title: 'Catalog', filters: 'Filters', country: 'Country', city: 'City', region: 'Region',
    district: 'District', neighborhood: 'Neighborhood', landmark: 'Landmark',
    category: 'Category', priceRange: 'Price range', sortBy: 'Sort by',
    sortPopular: 'Popularity', sortNewest: 'Newest', sortPriceLow: 'Price: low to high',
    sortPriceHigh: 'Price: high to low', sortRating: 'Top rated',
    results: 'results', noResults: 'No results found. Try adjusting your filters.',
    clearFilters: 'Clear filters', sponsored: 'Sponsored',
    subcategory: 'Subcategory', rating: 'Rating', inStock: 'In stock only',
    page: 'Page', of: 'of', next: 'Next', prev: 'Previous',
  },
  product: {
    addToCart: 'Add to Cart', buyNow: 'Buy Now', seller: 'Seller',
    description: 'Description', reviews: 'Reviews', delivery: 'Delivery',
    deliveryBySeller: 'Delivered directly by the seller', inStock: 'In stock',
    outOfStock: 'Out of stock', relatedProducts: 'Related products', quantity: 'Quantity',
    features: 'Features', variations: 'Options', writeReview: 'Write a review',
    verifiedPurchase: 'Verified purchase', addToWishlist: 'Add to wishlist',
    removeFromWishlist: 'Remove from wishlist', shareProduct: 'Share', brand: 'Brand',
    soldBy: 'Sold by', visitStore: 'Visit store',
  },
  cart: {
    title: 'Cart', empty: 'Your cart is empty', emptyDesc: 'Browse our catalog and add your favorite items',
    continueShopping: 'Continue shopping', subtotal: 'Subtotal', delivery: 'Delivery',
    total: 'Total', checkout: 'Checkout', remove: 'Remove', qty: 'Qty',
    orderSummary: 'Order summary', freeDelivery: 'Delivery by seller', items: 'items',
  },
  checkout: {
    title: 'Checkout', deliveryAddress: 'Delivery address', selectAddress: 'Select an address',
    addNewAddress: 'Add a new address', paymentMethod: 'Payment method',
    mobileMoney: 'Mobile Money', paystack: 'Paystack', flutterwave: 'Flutterwave',
    mpesa: 'M-Pesa', card: 'Bank card', cardNumber: 'Card number', expiry: 'Expiry',
    cvv: 'CVV', cardName: 'Name on card', placeOrder: 'Place order',
    orderPlaced: 'Order placed!', orderPlacedDesc: 'Your order has been placed. The seller will deliver to you directly.',
    reviewOrder: 'Order review', directPayment: 'Direct seller payment',
    directPaymentDesc: 'Your payment goes directly to the seller. Zando takes no commission.',
    phoneNumber: 'Phone number', provider: 'Provider',
  },
  account: {
    title: 'My account', profile: 'Profile', myOrders: 'My orders', myAddresses: 'My addresses',
    wishlist: 'My wishlist', personalInfo: 'Personal information',
    fullName: 'Full name', email: 'Email address', phone: 'Phone', save: 'Save',
    noOrders: 'You have no orders yet', noAddresses: 'You have no saved addresses',
    noWishlist: 'Your wishlist is empty', orderHistory: 'Order history',
    addAddress: 'Add address', editAddress: 'Edit address',
    defaultAddress: 'Default address', setDefault: 'Set as default',
    addressLabel: 'Label (Home, Office...)', street: 'Street and number',
    selectCountry: 'Country', selectCity: 'City', selectRegion: 'Region', selectDistrict: 'District',
    selectNeighborhood: 'Neighborhood', selectLandmark: 'Landmark',
    orderStatus: 'Status', viewTracking: 'Track', reorder: 'Buy again',
  },
  seller: {
    dashboard: 'Dashboard', products: 'Products', orders: 'Orders', deliveries: 'Deliveries',
    returns: 'Returns', reputation: 'Reputation', subscription: 'Subscription', ads: 'Ads',
    analytics: 'Analytics', addProduct: 'Add product', productName: 'Product name',
    price: 'Price', stock: 'Stock', category: 'Category', description: 'Description',
    uploadImages: 'Upload images', save: 'Save', cancel: 'Cancel',
    revenue: 'Revenue', conversionRate: 'Conversion rate', visitors: 'Visitors',
    recentOrders: 'Recent orders', productVariations: 'Product variations', addVariation: 'Add variation',
  },
  onboarding: {
    title: 'Seller Onboarding', subtitle: 'A strict 5-step process to guarantee trust',
    step: 'Step', of: 'of', country: 'Country', location: 'Location', legal: 'Legal information',
    documents: 'Documents', validation: 'Validation',
    selectCountry: 'Select your country', selectCity: 'Select city',
    selectRegion: 'Select region', selectDistrict: 'Select district',
    selectNeighborhood: 'Select neighborhood', selectLandmark: 'Landmark (optional)',
    companyName: 'Company name', companyNumber: 'Commercial registry number',
    vatNumber: 'VAT number (if applicable)',
    idFront: 'ID card front', idBack: 'ID card back',
    companyCert: 'Company certificate', license: 'Business license', storePhoto: 'Store / warehouse photo',
    next: 'Next', back: 'Back', submit: 'Submit application',
    pending: 'Pending validation', approved: 'Approved', rejected: 'Rejected',
    submitSuccess: 'Your application has been submitted. Our team will review it within 48h.',
  },
  plans: {
    title: 'Seller Subscriptions', subtitle: 'Choose the plan that fits your business',
    perMonth: '/ month', starter: 'Starter', premium: 'Premium', enterprise: 'Enterprise',
    starterPrice: '$9', premiumPrice: '$29', enterprisePrice: '$79',
    choose: 'Choose this plan', current: 'Current plan',
    starterFeatures: ['Up to 10 products', 'Limited access', 'No free ads', 'Standard visibility'],
    premiumFeatures: ['Up to 100 products', 'Marketing tools', 'Advanced analytics', 'Access to internal ads', 'Improved visibility'],
    enterpriseFeatures: ['Unlimited products', 'Full access', 'Free featured ad for 7 days on each renewal', 'Priority support', 'Premium placement in listings'],
  },
  ads: {
    title: 'Zando Ads', subtitle: 'Boost the visibility of your products',
    createCampaign: 'Create a campaign', campaignName: 'Campaign name',
    targetCountry: 'Target country', targetCity: 'Target city', targetCategory: 'Target category',
    duration: 'Duration (days)', budget: 'Budget ($)', launch: 'Launch campaign',
    impressions: 'Impressions', clicks: 'Clicks', conversions: 'Conversions',
    activeCampaigns: 'Active campaigns', yourCampaigns: 'Your campaigns',
  },
  admin: {
    title: 'Administration', overview: 'Overview', sellers: 'Sellers', products: 'Products',
    kyc: 'KYC Verification', ads: 'Ads', disputes: 'Disputes', geography: 'Geography',
    staff: 'Staff & Roles', plans: 'Subscriptions', analytics: 'Analytics', settings: 'Settings',
    languages: 'Languages', payments: 'Payments', documents: 'Documents',
  },
  auth: {
    loginTitle: 'Login', signupTitle: 'Create an account', email: 'Email address', password: 'Password',
    fullName: 'Full name', loginBtn: 'Log in', signupBtn: 'Sign up',
    noAccount: 'No account yet?', haveAccount: 'Already have an account?',
    sellerAccount: 'Seller account', customerAccount: 'Customer account',
  },
  delivery: {
    title: 'Delivery tracking', trackingId: 'Tracking number', status: 'Status',
    pending: 'Pending', preparing: 'Preparing', inTransit: 'In transit', delivered: 'Delivered',
    proofOfDelivery: 'Proof of delivery', estimatedArrival: 'Estimated arrival', sellerDelivers: 'Delivered by the seller',
    confirmed: 'Confirmed', cancelled: 'Cancelled',
  },
  common: {
    loading: 'Loading...', search: 'Search', searchPlaceholder: 'Search for a product, a seller...',
    save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit', confirm: 'Confirm',
    yes: 'Yes', no: 'No', close: 'Close', back: 'Back', next: 'Next', all: 'All', none: 'None',
    currency: '$', showing: 'Showing', results: 'results', sortBy: 'Sort by', filter: 'Filter', clear: 'Clear',
    addedToCart: 'Added to cart', removedFromCart: 'Removed from cart',
    addedToWishlist: 'Added to wishlist', removedFromWishlist: 'Removed from wishlist',
  },
};

export const dictionaries: Record<Locale, Dict> = { fr, en };
