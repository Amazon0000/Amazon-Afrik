/*
# Seed Currencies and All 54 African Countries

## Purpose
Populates the currencies and countries tables with all African nations and their currencies.

## Data
- 15+ currencies (USD, XOF, XAF, NGN, ZAR, EGP, MAD, KES, GHS, TZS, UGX, RWF, ETB, GMD, SLL, etc.)
- All 54 African countries with flag emojis, phone codes, and currency links
- is_african = true for all, is_active = true by default
- Supports worldwide expansion (non-African countries can be added later)

## Security
- No schema changes, data only
*/

-- ============ CURRENCIES ============
INSERT INTO currencies (code, name, symbol, exchange_rate, is_active) VALUES
('USD', 'US Dollar', '$', 1.0, true),
('XOF', 'West African CFA Franc', 'CFA', 0.0017, true),
('XAF', 'Central African CFA Franc', 'FCFA', 0.0017, true),
('NGN', 'Nigerian Naira', '₦', 0.00065, true),
('ZAR', 'South African Rand', 'R', 0.054, true),
('EGP', 'Egyptian Pound', '£', 0.021, true),
('MAD', 'Moroccan Dirham', 'DH', 0.10, true),
('KES', 'Kenyan Shilling', 'KSh', 0.0078, true),
('GHS', 'Ghanaian Cedi', '₵', 0.075, true),
('TZS', 'Tanzanian Shilling', 'TSh', 0.00039, true),
('UGX', 'Ugandan Shilling', 'USh', 0.00027, true),
('RWF', 'Rwandan Franc', 'FRw', 0.00078, true),
('ETB', 'Ethiopian Birr', 'Br', 0.0089, true),
('GMD', 'Gambian Dalasi', 'D', 0.015, true),
('SLL', 'Sierra Leonean Leone', 'Le', 0.00005, true),
('DZD', 'Algerian Dinar', 'DA', 0.0074, true),
('TND', 'Tunisian Dinar', 'DT', 0.32, true),
('LYD', 'Libyan Dinar', 'LD', 0.21, true),
('SDG', 'Sudanese Pound', '£S', 0.0017, true),
('MUR', 'Mauritian Rupee', '₨', 0.022, true),
('BWP', 'Botswana Pula', 'P', 0.074, true),
('ZMW', 'Zambian Kwacha', 'ZK', 0.037, true),
('ZWL', 'Zimbabwean Dollar', 'Z$', 0.0031, true),
('AOA', 'Angolan Kwanza', 'Kz', 0.0011, true),
('MZN', 'Mozambican Metical', 'MT', 0.016, true),
('CDF', 'Congolese Franc', 'FC', 0.00035, true),
('SCR', 'Seychellois Rupee', '₨', 0.074, true),
('LSL', 'Lesotho Loti', 'L', 0.054, true),
('SZL', 'Eswatini Lilangeni', 'E', 0.054, true),
('NAD', 'Namibian Dollar', 'N$', 0.054, true),
('MWK', 'Malawian Kwacha', 'MK', 0.00058, true),
('GNF', 'Guinean Franc', 'FG', 0.00012, true),
('LRD', 'Liberian Dollar', 'L$', 0.0053, true),
('SOS', 'Somali Shilling', 'Sh', 0.0017, true),
('ERN', 'Eritrean Nakfa', 'Nfk', 0.067, true),
('DJF', 'Djiboutian Franc', 'Fdj', 0.0056, true),
('KMF', 'Comorian Franc', 'CF', 0.0022, true),
('STN', 'São Tomé Dobra', 'Db', 0.000049, true),
('BIF', 'Burundian Franc', 'FBu', 0.00035, true),
('CVE', 'Cape Verdean Escudo', '$', 0.0098, true),
('MRU', 'Mauritanian Ouguiya', 'UM', 0.025, true)
ON CONFLICT (code) DO NOTHING;

-- ============ ALL 54 AFRICAN COUNTRIES ============
INSERT INTO countries (id, name, flag, phone_code, currency_code, is_african, region) VALUES
('DZ', 'Algeria', '🇩🇿', '+213', 'DZD', true, 'North Africa'),
('AO', 'Angola', '🇦🇴', '+244', 'AOA', true, 'Southern Africa'),
('BJ', 'Benin', '🇧🇯', '+229', 'XOF', true, 'West Africa'),
('BW', 'Botswana', '🇧🇼', '+267', 'BWP', true, 'Southern Africa'),
('BF', 'Burkina Faso', '🇧🇫', '+226', 'XOF', true, 'West Africa'),
('BI', 'Burundi', '🇧🇮', '+257', 'BIF', true, 'East Africa'),
('CV', 'Cape Verde', '🇨🇻', '+238', 'CVE', true, 'West Africa'),
('CM', 'Cameroon', '🇨🇲', '+237', 'XAF', true, 'Central Africa'),
('CF', 'Central African Republic', '🇨🇫', '+236', 'XAF', true, 'Central Africa'),
('TD', 'Chad', '🇹🇩', '+235', 'XAF', true, 'Central Africa'),
('KM', 'Comoros', '🇰🇲', '+269', 'KMF', true, 'East Africa'),
('CG', 'Congo', '🇨🇬', '+242', 'XAF', true, 'Central Africa'),
('CD', 'DR Congo', '🇨🇩', '+243', 'CDF', true, 'Central Africa'),
('CI', 'Ivory Coast', '🇨🇮', '+225', 'XOF', true, 'West Africa'),
('DJ', 'Djibouti', '🇩🇯', '+253', 'DJF', true, 'East Africa'),
('EG', 'Egypt', '🇪🇬', '+20', 'EGP', true, 'North Africa'),
('GQ', 'Equatorial Guinea', '🇬🇶', '+240', 'XAF', true, 'Central Africa'),
('ER', 'Eritrea', '🇪🇷', '+291', 'ERN', true, 'East Africa'),
('SZ', 'Eswatini', '🇸🇿', '+268', 'SZL', true, 'Southern Africa'),
('ET', 'Ethiopia', '🇪🇹', '+251', 'ETB', true, 'East Africa'),
('GA', 'Gabon', '🇬🇦', '+241', 'XAF', true, 'Central Africa'),
('GM', 'Gambia', '🇬🇲', '+220', 'GMD', true, 'West Africa'),
('GH', 'Ghana', '🇬🇭', '+233', 'GHS', true, 'West Africa'),
('GN', 'Guinea', '🇬🇳', '+224', 'GNF', true, 'West Africa'),
('GW', 'Guinea-Bissau', '🇬🇼', '+245', 'XOF', true, 'West Africa'),
('KE', 'Kenya', '🇰🇪', '+254', 'KES', true, 'East Africa'),
('LS', 'Lesotho', '🇱🇸', '+266', 'LSL', true, 'Southern Africa'),
('LR', 'Liberia', '🇱🇷', '+231', 'LRD', true, 'West Africa'),
('LY', 'Libya', '🇱🇾', '+218', 'LYD', true, 'North Africa'),
('MG', 'Madagascar', '🇲🇬', '+261', 'MUR', true, 'East Africa'),
('MW', 'Malawi', '🇲🇼', '+265', 'MWK', true, 'East Africa'),
('ML', 'Mali', '🇲🇱', '+223', 'XOF', true, 'West Africa'),
('MR', 'Mauritania', '🇲🇷', '+222', 'MRU', true, 'West Africa'),
('MU', 'Mauritius', '🇲🇺', '+230', 'MUR', true, 'East Africa'),
('MA', 'Morocco', '🇲🇦', '+212', 'MAD', true, 'North Africa'),
('MZ', 'Mozambique', '🇲🇿', '+258', 'MZN', true, 'Southern Africa'),
('NA', 'Namibia', '🇳🇦', '+264', 'NAD', true, 'Southern Africa'),
('NE', 'Niger', '🇳🇪', '+227', 'XOF', true, 'West Africa'),
('NG', 'Nigeria', '🇳🇬', '+234', 'NGN', true, 'West Africa'),
('RW', 'Rwanda', '🇷🇼', '+250', 'RWF', true, 'East Africa'),
('ST', 'São Tomé and Príncipe', '🇸🇹', '+239', 'STN', true, 'Central Africa'),
('SN', 'Senegal', '🇸🇳', '+221', 'XOF', true, 'West Africa'),
('SC', 'Seychelles', '🇸🇨', '+248', 'SCR', true, 'East Africa'),
('SL', 'Sierra Leone', '🇸🇱', '+232', 'SLL', true, 'West Africa'),
('SO', 'Somalia', '🇸🇴', '+252', 'SOS', true, 'East Africa'),
('ZA', 'South Africa', '🇿🇦', '+27', 'ZAR', true, 'Southern Africa'),
('SS', 'South Sudan', '🇸🇸', '+211', 'SDG', true, 'East Africa'),
('SD', 'Sudan', '🇸🇩', '+249', 'SDG', true, 'North Africa'),
('TZ', 'Tanzania', '🇹🇿', '+255', 'TZS', true, 'East Africa'),
('TG', 'Togo', '🇹🇬', '+228', 'XOF', true, 'West Africa'),
('TN', 'Tunisia', '🇹🇳', '+216', 'TND', true, 'North Africa'),
('UG', 'Uganda', '🇺🇬', '+256', 'UGX', true, 'East Africa'),
('ZM', 'Zambia', '🇿🇲', '+260', 'ZMW', true, 'Southern Africa'),
('ZW', 'Zimbabwe', '🇿🇼', '+263', 'ZWL', true, 'Southern Africa')
ON CONFLICT (id) DO NOTHING;
