/*
# Near-complete worldwide country coverage

Zando had 95 countries (all 54 African + ~40 major non-African markets),
but was still missing most of Europe, Central Asia, the Caribbean, the
Pacific, and South America — a real gap for a platform explicitly not
limited to Africa. Adds ~95 more sovereign states/territories so "Shop
by Location" and seller onboarding cover nearly the entire world.

A handful of jurisdictions under comprehensive international sanctions
(North Korea, Syria, Iran, Cuba is included as commerce with it is not
uniformly prohibited) are omitted, consistent with standard practice for
a payments-adjacent commerce platform — sellers/buyers there would be
unable to use virtually any of the PSPs already listed in this app
regardless.
*/

INSERT INTO currencies (code, name, symbol, exchange_rate, is_active) VALUES
('RUB', 'Russian Ruble', '\u20bd', 0.0104, true),
('UAH', 'Ukrainian Hryvnia', '\u20b4', 0.024, true),
('PLN', 'Polish Zloty', 'z\u0142', 0.25, true),
('CZK', 'Czech Koruna', 'K\u010d', 0.0426, true),
('HUF', 'Hungarian Forint', 'Ft', 0.0027, true),
('RON', 'Romanian Leu', 'lei', 0.219, true),
('BGN', 'Bulgarian Lev', '\u043b\u0432', 0.556, true),
('HRK', 'Croatian Kuna', 'kn', 0.144, true),
('RSD', 'Serbian Dinar', '\u0434\u0438\u043d.', 0.0093, true),
('ISK', 'Icelandic Krona', 'kr', 0.0073, true),
('DKK', 'Danish Krone', 'kr', 0.146, true),
('SEK', 'Swedish Krona', 'kr', 0.096, true),
('NOK', 'Norwegian Krone', 'kr', 0.095, true),
('CHF', 'Swiss Franc', 'CHF', 1.13, true),
('BAM', 'Bosnia-Herzegovina Mark', 'KM', 0.559, true),
('MKD', 'Macedonian Denar', '\u0434\u0435\u043d', 0.0177, true),
('ALL', 'Albanian Lek', 'L', 0.0108, true),
('MDL', 'Moldovan Leu', 'L', 0.056, true),
('GEL', 'Georgian Lari', '\u20be', 0.365, true),
('AMD', 'Armenian Dram', '\u058f', 0.0026, true),
('AZN', 'Azerbaijani Manat', '\u20bc', 0.588, true),
('KZT', 'Kazakhstani Tenge', '\u20b8', 0.0021, true),
('UZS', 'Uzbekistani Som', 'so\u2018m', 0.000078, true),
('KGS', 'Kyrgyzstani Som', '\u0441\u043e\u043c', 0.0114, true),
('TJS', 'Tajikistani Somoni', 'SM', 0.0917, true),
('TMT', 'Turkmenistani Manat', 'm', 0.286, true),
('MNT', 'Mongolian Tugrik', '\u20ae', 0.00029, true),
('KHR', 'Cambodian Riel', '\u17db', 0.00024, true),
('LAK', 'Lao Kip', '\u20ad', 0.000046, true),
('MMK', 'Myanmar Kyat', 'K', 0.00048, true),
('NPR', 'Nepalese Rupee', '\u0930\u0942', 0.0075, true),
('LKR', 'Sri Lankan Rupee', 'Rs', 0.00336, true),
('BTN', 'Bhutanese Ngultrum', 'Nu.', 0.0120, true),
('MVR', 'Maldivian Rufiyaa', 'Rf', 0.0648, true),
('BND', 'Brunei Dollar', 'B$', 0.7435, true),
('BHD', 'Bahraini Dinar', 'BD', 2.6525, true),
('KWD', 'Kuwaiti Dinar', 'KD', 3.2513, true),
('OMR', 'Omani Rial', 'OMR', 2.5974, true),
('LBP', 'Lebanese Pound', 'L\u00a3', 0.0000112, true),
('IQD', 'Iraqi Dinar', 'IQD', 0.000763, true),
('YER', 'Yemeni Rial', '\ufdfc', 0.0040, true),
('XCD', 'East Caribbean Dollar', 'EC$', 0.3704, true),
('BSD', 'Bahamian Dollar', 'B$', 1.0, true),
('BBD', 'Barbadian Dollar', 'Bds$', 0.50, true),
('BZD', 'Belize Dollar', 'BZ$', 0.4963, true),
('CRC', 'Costa Rican Colon', '\u20a1', 0.00196, true),
('CUP', 'Cuban Peso', '$', 0.0417, true),
('DOP', 'Dominican Peso', 'RD$', 0.0166, true),
('GTQ', 'Guatemalan Quetzal', 'Q', 0.1299, true),
('HTG', 'Haitian Gourde', 'G', 0.0076, true),
('HNL', 'Honduran Lempira', 'L', 0.0405, true),
('JMD', 'Jamaican Dollar', 'J$', 0.0065, true),
('NIO', 'Nicaraguan Cordoba', 'C$', 0.0272, true),
('PAB', 'Panamanian Balboa', 'B/.', 1.0, true),
('TTD', 'Trinidad Dollar', 'TT$', 0.1473, true),
('BOB', 'Bolivian Boliviano', 'Bs.', 0.1450, true),
('GYD', 'Guyanese Dollar', 'G$', 0.0048, true),
('PYG', 'Paraguayan Guarani', '\u20b2', 0.000135, true),
('SRD', 'Surinamese Dollar', '$', 0.0270, true),
('UYU', 'Uruguayan Peso', '$U', 0.0245, true),
('VES', 'Venezuelan Bolivar', 'Bs.', 0.0270, true),
('FJD', 'Fijian Dollar', 'FJ$', 0.4425, true),
('PGK', 'Papua New Guinea Kina', 'K', 0.2513, true),
('WST', 'Samoan Tala', 'WS$', 0.3676, true),
('TOP', 'Tongan Pa''anga', 'T$', 0.4184, true),
('SBD', 'Solomon Islands Dollar', 'SI$', 0.1183, true),
('VUV', 'Vanuatu Vatu', 'VT', 0.0083, true)
ON CONFLICT (code) DO NOTHING;

-- ============ EUROPE (remaining) ============
INSERT INTO countries (id, name, flag, phone_code, currency_code, is_active, is_african, region) VALUES
('AT', 'Austria', '\ud83c\udde6\ud83c\uddf9', '+43', 'EUR', true, false, 'Europe'),
('AL', 'Albania', '\ud83c\udde6\ud83c\uddf1', '+355', 'ALL', true, false, 'Europe'),
('AD', 'Andorra', '\ud83c\udde6\ud83c\udde9', '+376', 'EUR', true, false, 'Europe'),
('BY', 'Belarus', '\ud83c\udde7\ud83c\uddfe', '+375', 'RUB', true, false, 'Europe'),
('BA', 'Bosnia and Herzegovina', '\ud83c\udde7\ud83c\udde6', '+387', 'BAM', true, false, 'Europe'),
('BG', 'Bulgaria', '\ud83c\udde7\ud83c\uddec', '+359', 'BGN', true, false, 'Europe'),
('HR', 'Croatia', '\ud83c\udded\ud83c\uddf7', '+385', 'EUR', true, false, 'Europe'),
('CY', 'Cyprus', '\ud83c\udde8\ud83c\uddfe', '+357', 'EUR', true, false, 'Europe'),
('CZ', 'Czechia', '\ud83c\udde8\ud83c\uddff', '+420', 'CZK', true, false, 'Europe'),
('DK', 'Denmark', '\ud83c\udde9\ud83c\uddf0', '+45', 'DKK', true, false, 'Europe'),
('EE', 'Estonia', '\ud83c\uddea\ud83c\uddea', '+372', 'EUR', true, false, 'Europe'),
('FI', 'Finland', '\ud83c\uddeb\ud83c\uddee', '+358', 'EUR', true, false, 'Europe'),
('GR', 'Greece', '\ud83c\uddec\ud83c\uddf7', '+30', 'EUR', true, false, 'Europe'),
('HU', 'Hungary', '\ud83c\udded\ud83c\uddfa', '+36', 'HUF', true, false, 'Europe'),
('IS', 'Iceland', '\ud83c\uddee\ud83c\uddf8', '+354', 'ISK', true, false, 'Europe'),
('LV', 'Latvia', '\ud83c\uddf1\ud83c\uddfb', '+371', 'EUR', true, false, 'Europe'),
('LI', 'Liechtenstein', '\ud83c\uddf1\ud83c\uddee', '+423', 'CHF', true, false, 'Europe'),
('LT', 'Lithuania', '\ud83c\uddf1\ud83c\uddf9', '+370', 'EUR', true, false, 'Europe'),
('LU', 'Luxembourg', '\ud83c\uddf1\ud83c\uddfa', '+352', 'EUR', true, false, 'Europe'),
('MT', 'Malta', '\ud83c\uddf2\ud83c\uddf9', '+356', 'EUR', true, false, 'Europe'),
('MD', 'Moldova', '\ud83c\uddf2\ud83c\udde9', '+373', 'MDL', true, false, 'Europe'),
('MC', 'Monaco', '\ud83c\uddf2\ud83c\udde8', '+377', 'EUR', true, false, 'Europe'),
('ME', 'Montenegro', '\ud83c\uddf2\ud83c\uddea', '+382', 'EUR', true, false, 'Europe'),
('MK', 'North Macedonia', '\ud83c\uddf2\ud83c\uddf0', '+389', 'MKD', true, false, 'Europe'),
('RO', 'Romania', '\ud83c\uddf7\ud83c\uddf4', '+40', 'RON', true, false, 'Europe'),
('RU', 'Russia', '\ud83c\uddf7\ud83c\uddfa', '+7', 'RUB', true, false, 'Europe'),
('SM', 'San Marino', '\ud83c\uddf8\ud83c\uddf2', '+378', 'EUR', true, false, 'Europe'),
('RS', 'Serbia', '\ud83c\uddf7\ud83c\uddf8', '+381', 'RSD', true, false, 'Europe'),
('SK', 'Slovakia', '\ud83c\uddf8\ud83c\uddf0', '+421', 'EUR', true, false, 'Europe'),
('SI', 'Slovenia', '\ud83c\uddf8\ud83c\uddee', '+386', 'EUR', true, false, 'Europe'),
('UA', 'Ukraine', '\ud83c\uddfa\ud83c\udde6', '+380', 'UAH', true, false, 'Europe'),
('VA', 'Vatican City', '\ud83c\uddfb\ud83c\udde6', '+379', 'EUR', true, false, 'Europe')
ON CONFLICT (id) DO NOTHING;

-- Sweden and Norway were seeded with currency_code = 'EUR' in the earlier
-- global-countries migration, which is wrong — neither uses the Euro.
UPDATE countries SET currency_code = 'SEK' WHERE id = 'SE';
UPDATE countries SET currency_code = 'NOK' WHERE id = 'NO';

-- ============ ASIA (remaining) ============
INSERT INTO countries (id, name, flag, phone_code, currency_code, is_active, is_african, region) VALUES
('AF', 'Afghanistan', '\ud83c\udde6\ud83c\uddeb', '+93', 'USD', true, false, 'Asia'),
('AM', 'Armenia', '\ud83c\udde6\ud83c\uddf2', '+374', 'AMD', true, false, 'Asia'),
('AZ', 'Azerbaijan', '\ud83c\udde6\ud83c\uddff', '+994', 'AZN', true, false, 'Asia'),
('BH', 'Bahrain', '\ud83c\udde7\ud83c\udded', '+973', 'BHD', true, false, 'Asia'),
('BT', 'Bhutan', '\ud83c\udde7\ud83c\uddf9', '+975', 'BTN', true, false, 'Asia'),
('BN', 'Brunei', '\ud83c\udde7\ud83c\uddf3', '+673', 'BND', true, false, 'Asia'),
('KH', 'Cambodia', '\ud83c\uddf0\ud83c\udded', '+855', 'KHR', true, false, 'Asia'),
('GE', 'Georgia', '\ud83c\uddec\ud83c\uddea', '+995', 'GEL', true, false, 'Asia'),
('IQ', 'Iraq', '\ud83c\uddee\ud83c\uddf6', '+964', 'IQD', true, false, 'Asia'),
('KZ', 'Kazakhstan', '\ud83c\uddf0\ud83c\uddff', '+7', 'KZT', true, false, 'Asia'),
('KW', 'Kuwait', '\ud83c\uddf0\ud83c\uddfc', '+965', 'KWD', true, false, 'Asia'),
('KG', 'Kyrgyzstan', '\ud83c\uddf0\ud83c\uddec', '+996', 'KGS', true, false, 'Asia'),
('LA', 'Laos', '\ud83c\uddf1\ud83c\udde6', '+856', 'LAK', true, false, 'Asia'),
('LB', 'Lebanon', '\ud83c\uddf1\ud83c\udde7', '+961', 'LBP', true, false, 'Asia'),
('MV', 'Maldives', '\ud83c\uddf2\ud83c\uddfb', '+960', 'MVR', true, false, 'Asia'),
('MN', 'Mongolia', '\ud83c\uddf2\ud83c\uddf3', '+976', 'MNT', true, false, 'Asia'),
('MM', 'Myanmar', '\ud83c\uddf2\ud83c\uddf2', '+95', 'MMK', true, false, 'Asia'),
('NP', 'Nepal', '\ud83c\uddf3\ud83c\uddf5', '+977', 'NPR', true, false, 'Asia'),
('OM', 'Oman', '\ud83c\uddf4\ud83c\uddf2', '+968', 'OMR', true, false, 'Asia'),
('TJ', 'Tajikistan', '\ud83c\uddf9\ud83c\uddef', '+992', 'TJS', true, false, 'Asia'),
('TL', 'Timor-Leste', '\ud83c\uddf9\ud83c\uddf1', '+670', 'USD', true, false, 'Asia'),
('TM', 'Turkmenistan', '\ud83c\uddf9\ud83c\uddf2', '+993', 'TMT', true, false, 'Asia'),
('UZ', 'Uzbekistan', '\ud83c\uddfa\ud83c\uddff', '+998', 'UZS', true, false, 'Asia'),
('YE', 'Yemen', '\ud83c\uddfe\ud83c\uddea', '+967', 'YER', true, false, 'Asia'),
('LK', 'Sri Lanka', '\ud83c\uddf1\ud83c\uddf0', '+94', 'LKR', true, false, 'Asia'),
('PS', 'Palestine', '\ud83c\uddf5\ud83c\uddf8', '+970', 'ILS', true, false, 'Asia')
ON CONFLICT (id) DO NOTHING;

-- ============ NORTH AMERICA / CARIBBEAN (remaining) ============
INSERT INTO countries (id, name, flag, phone_code, currency_code, is_active, is_african, region) VALUES
('AG', 'Antigua and Barbuda', '\ud83c\udde6\ud83c\uddec', '+1268', 'XCD', true, false, 'North America'),
('BS', 'Bahamas', '\ud83c\udde7\ud83c\uddf8', '+1242', 'BSD', true, false, 'North America'),
('BB', 'Barbados', '\ud83c\udde7\ud83c\udde7', '+1246', 'BBD', true, false, 'North America'),
('BZ', 'Belize', '\ud83c\udde7\ud83c\uddff', '+501', 'BZD', true, false, 'North America'),
('CR', 'Costa Rica', '\ud83c\udde8\ud83c\uddf7', '+506', 'CRC', true, false, 'North America'),
('CU', 'Cuba', '\ud83c\udde8\ud83c\uddfa', '+53', 'CUP', true, false, 'North America'),
('DM', 'Dominica', '\ud83c\udde9\ud83c\uddf2', '+1767', 'XCD', true, false, 'North America'),
('DO', 'Dominican Republic', '\ud83c\udde9\ud83c\uddf4', '+1809', 'DOP', true, false, 'North America'),
('SV', 'El Salvador', '\ud83c\uddf8\ud83c\uddfb', '+503', 'USD', true, false, 'North America'),
('GD', 'Grenada', '\ud83c\uddec\ud83c\udde9', '+1473', 'XCD', true, false, 'North America'),
('GT', 'Guatemala', '\ud83c\uddec\ud83c\uddf9', '+502', 'GTQ', true, false, 'North America'),
('HT', 'Haiti', '\ud83c\udded\ud83c\uddf9', '+509', 'HTG', true, false, 'North America'),
('HN', 'Honduras', '\ud83c\udded\ud83c\uddf3', '+504', 'HNL', true, false, 'North America'),
('JM', 'Jamaica', '\ud83c\uddef\ud83c\uddf2', '+1876', 'JMD', true, false, 'North America'),
('NI', 'Nicaragua', '\ud83c\uddf3\ud83c\uddee', '+505', 'NIO', true, false, 'North America'),
('PA', 'Panama', '\ud83c\uddf5\ud83c\udde6', '+507', 'PAB', true, false, 'North America'),
('KN', 'Saint Kitts and Nevis', '\ud83c\uddf0\ud83c\uddf3', '+1869', 'XCD', true, false, 'North America'),
('LC', 'Saint Lucia', '\ud83c\uddf1\ud83c\udde8', '+1758', 'XCD', true, false, 'North America'),
('VC', 'Saint Vincent and the Grenadines', '\ud83c\uddfb\ud83c\udde8', '+1784', 'XCD', true, false, 'North America'),
('TT', 'Trinidad and Tobago', '\ud83c\uddf9\ud83c\uddf9', '+1868', 'TTD', true, false, 'North America')
ON CONFLICT (id) DO NOTHING;

-- ============ SOUTH AMERICA (remaining) ============
INSERT INTO countries (id, name, flag, phone_code, currency_code, is_active, is_african, region) VALUES
('BO', 'Bolivia', '\ud83c\udde7\ud83c\uddf4', '+591', 'BOB', true, false, 'South America'),
('EC', 'Ecuador', '\ud83c\uddea\ud83c\udde8', '+593', 'USD', true, false, 'South America'),
('GY', 'Guyana', '\ud83c\uddec\ud83c\uddfe', '+592', 'GYD', true, false, 'South America'),
('PY', 'Paraguay', '\ud83c\uddf5\ud83c\uddfe', '+595', 'PYG', true, false, 'South America'),
('SR', 'Suriname', '\ud83c\uddf8\ud83c\uddf7', '+597', 'SRD', true, false, 'South America'),
('UY', 'Uruguay', '\ud83c\uddfa\ud83c\uddfe', '+598', 'UYU', true, false, 'South America'),
('VE', 'Venezuela', '\ud83c\uddfb\ud83c\uddea', '+58', 'VES', true, false, 'South America')
ON CONFLICT (id) DO NOTHING;

-- ============ OCEANIA (remaining) ============
INSERT INTO countries (id, name, flag, phone_code, currency_code, is_active, is_african, region) VALUES
('FJ', 'Fiji', '\ud83c\uddeb\ud83c\uddef', '+679', 'FJD', true, false, 'Oceania'),
('KI', 'Kiribati', '\ud83c\uddf0\ud83c\uddee', '+686', 'AUD', true, false, 'Oceania'),
('MH', 'Marshall Islands', '\ud83c\uddf2\ud83c\udded', '+692', 'USD', true, false, 'Oceania'),
('FM', 'Micronesia', '\ud83c\uddeb\ud83c\uddf2', '+691', 'USD', true, false, 'Oceania'),
('NR', 'Nauru', '\ud83c\uddf3\ud83c\uddf7', '+674', 'AUD', true, false, 'Oceania'),
('PW', 'Palau', '\ud83c\uddf5\ud83c\uddfc', '+680', 'USD', true, false, 'Oceania'),
('PG', 'Papua New Guinea', '\ud83c\uddf5\ud83c\uddec', '+675', 'PGK', true, false, 'Oceania'),
('WS', 'Samoa', '\ud83c\uddfc\ud83c\uddf8', '+685', 'WST', true, false, 'Oceania'),
('SB', 'Solomon Islands', '\ud83c\uddf8\ud83c\udde7', '+677', 'SBD', true, false, 'Oceania'),
('TO', 'Tonga', '\ud83c\uddf9\ud83c\uddf4', '+676', 'TOP', true, false, 'Oceania'),
('TV', 'Tuvalu', '\ud83c\uddf9\ud83c\uddfb', '+688', 'AUD', true, false, 'Oceania'),
('VU', 'Vanuatu', '\ud83c\uddfb\ud83c\uddfa', '+678', 'VUV', true, false, 'Oceania')
ON CONFLICT (id) DO NOTHING;
