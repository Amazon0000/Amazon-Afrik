/*
# Global country expansion

Zando was seeded with all 54 African countries but nothing else, even
though the platform is not Africa-only. Adds major markets across every
other region (North America, South America, Europe, Middle East, Asia,
Oceania) with their real currencies and exchange rates, so country/
region pickers, seller onboarding, and delivery destinations reflect a
genuinely global marketplace rather than an Africa-only one.
*/

-- ============ NON-AFRICAN CURRENCIES ============
INSERT INTO currencies (code, name, symbol, exchange_rate, is_active) VALUES
('EUR', 'Euro', '€', 0.92, true),
('GBP', 'British Pound', '£', 0.79, true),
('CAD', 'Canadian Dollar', 'C$', 1.36, true),
('BRL', 'Brazilian Real', 'R$', 5.15, true),
('MXN', 'Mexican Peso', '$', 17.80, true),
('ARS', 'Argentine Peso', '$', 890.0, true),
('CLP', 'Chilean Peso', '$', 940.0, true),
('COP', 'Colombian Peso', '$', 3900.0, true),
('CNY', 'Chinese Yuan', '¥', 7.10, true),
('JPY', 'Japanese Yen', '¥', 149.0, true),
('KRW', 'South Korean Won', '₩', 1330.0, true),
('INR', 'Indian Rupee', '₹', 83.20, true),
('IDR', 'Indonesian Rupiah', 'Rp', 15600.0, true),
('PHP', 'Philippine Peso', '₱', 56.30, true),
('VND', 'Vietnamese Dong', '₫', 24500.0, true),
('THB', 'Thai Baht', '฿', 35.60, true),
('SAR', 'Saudi Riyal', 'SR', 3.75, true),
('AED', 'UAE Dirham', 'AED', 3.67, true),
('QAR', 'Qatari Riyal', 'QR', 3.64, true),
('TRY', 'Turkish Lira', '₺', 32.10, true),
('ILS', 'Israeli Shekel', '₪', 3.68, true),
('AUD', 'Australian Dollar', 'A$', 1.53, true),
('NZD', 'New Zealand Dollar', 'NZ$', 1.65, true),
('PKR', 'Pakistani Rupee', '₨', 278.0, true),
('BDT', 'Bangladeshi Taka', '৳', 110.0, true)
ON CONFLICT (code) DO NOTHING;

-- ============ NORTH AMERICA ============
INSERT INTO countries (id, name, flag, phone_code, currency_code, is_active, is_african, region) VALUES
('US', 'United States', '🇺🇸', '+1', 'USD', true, false, 'North America'),
('CA', 'Canada', '🇨🇦', '+1', 'CAD', true, false, 'North America'),
('MX', 'Mexico', '🇲🇽', '+52', 'MXN', true, false, 'North America')
ON CONFLICT (id) DO NOTHING;

-- ============ SOUTH AMERICA ============
INSERT INTO countries (id, name, flag, phone_code, currency_code, is_active, is_african, region) VALUES
('BR', 'Brazil', '🇧🇷', '+55', 'BRL', true, false, 'South America'),
('AR', 'Argentina', '🇦🇷', '+54', 'ARS', true, false, 'South America'),
('CL', 'Chile', '🇨🇱', '+56', 'CLP', true, false, 'South America'),
('CO', 'Colombia', '🇨🇴', '+57', 'COP', true, false, 'South America'),
('PE', 'Peru', '🇵🇪', '+51', 'USD', true, false, 'South America')
ON CONFLICT (id) DO NOTHING;

-- ============ EUROPE ============
INSERT INTO countries (id, name, flag, phone_code, currency_code, is_active, is_african, region) VALUES
('GB', 'United Kingdom', '🇬🇧', '+44', 'GBP', true, false, 'Europe'),
('FR', 'France', '🇫🇷', '+33', 'EUR', true, false, 'Europe'),
('DE', 'Germany', '🇩🇪', '+49', 'EUR', true, false, 'Europe'),
('ES', 'Spain', '🇪🇸', '+34', 'EUR', true, false, 'Europe'),
('IT', 'Italy', '🇮🇹', '+39', 'EUR', true, false, 'Europe'),
('PT', 'Portugal', '🇵🇹', '+351', 'EUR', true, false, 'Europe'),
('NL', 'Netherlands', '🇳🇱', '+31', 'EUR', true, false, 'Europe'),
('BE', 'Belgium', '🇧🇪', '+32', 'EUR', true, false, 'Europe'),
('CH', 'Switzerland', '🇨🇭', '+41', 'EUR', true, false, 'Europe'),
('SE', 'Sweden', '🇸🇪', '+46', 'EUR', true, false, 'Europe'),
('NO', 'Norway', '🇳🇴', '+47', 'EUR', true, false, 'Europe'),
('IE', 'Ireland', '🇮🇪', '+353', 'EUR', true, false, 'Europe'),
('PL', 'Poland', '🇵🇱', '+48', 'EUR', true, false, 'Europe')
ON CONFLICT (id) DO NOTHING;

-- ============ MIDDLE EAST ============
INSERT INTO countries (id, name, flag, phone_code, currency_code, is_active, is_african, region) VALUES
('AE', 'United Arab Emirates', '🇦🇪', '+971', 'AED', true, false, 'Middle East'),
('SA', 'Saudi Arabia', '🇸🇦', '+966', 'SAR', true, false, 'Middle East'),
('QA', 'Qatar', '🇶🇦', '+974', 'QAR', true, false, 'Middle East'),
('TR', 'Turkey', '🇹🇷', '+90', 'TRY', true, false, 'Middle East'),
('IL', 'Israel', '🇮🇱', '+972', 'ILS', true, false, 'Middle East'),
('JO', 'Jordan', '🇯🇴', '+962', 'USD', true, false, 'Middle East')
ON CONFLICT (id) DO NOTHING;

-- ============ ASIA ============
INSERT INTO countries (id, name, flag, phone_code, currency_code, is_active, is_african, region) VALUES
('CN', 'China', '🇨🇳', '+86', 'CNY', true, false, 'Asia'),
('JP', 'Japan', '🇯🇵', '+81', 'JPY', true, false, 'Asia'),
('KR', 'South Korea', '🇰🇷', '+82', 'KRW', true, false, 'Asia'),
('IN', 'India', '🇮🇳', '+91', 'INR', true, false, 'Asia'),
('ID', 'Indonesia', '🇮🇩', '+62', 'IDR', true, false, 'Asia'),
('PH', 'Philippines', '🇵🇭', '+63', 'PHP', true, false, 'Asia'),
('VN', 'Vietnam', '🇻🇳', '+84', 'VND', true, false, 'Asia'),
('TH', 'Thailand', '🇹🇭', '+66', 'THB', true, false, 'Asia'),
('MY', 'Malaysia', '🇲🇾', '+60', 'USD', true, false, 'Asia'),
('SG', 'Singapore', '🇸🇬', '+65', 'USD', true, false, 'Asia'),
('PK', 'Pakistan', '🇵🇰', '+92', 'PKR', true, false, 'Asia'),
('BD', 'Bangladesh', '🇧🇩', '+880', 'BDT', true, false, 'Asia')
ON CONFLICT (id) DO NOTHING;

-- ============ OCEANIA ============
INSERT INTO countries (id, name, flag, phone_code, currency_code, is_active, is_african, region) VALUES
('AU', 'Australia', '🇦🇺', '+61', 'AUD', true, false, 'Oceania'),
('NZ', 'New Zealand', '🇳🇿', '+64', 'NZD', true, false, 'Oceania')
ON CONFLICT (id) DO NOTHING;
