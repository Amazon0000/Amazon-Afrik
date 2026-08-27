/*
# Fix currency exchange rate convention

The original African currency seed uses exchange_rate = "USD value of 1
unit of the currency" (e.g. XOF = 0.0017, since 1 XOF ≈ $0.0017, roughly
610 XOF per USD). The global country expansion migration added new
currencies using the OPPOSITE convention (e.g. EUR = 0.92, i.e. "units of
local currency per 1 USD") — internally inconsistent data that would make
any currency-conversion feature silently wrong by orders of magnitude for
half the currencies in the table.

Corrects every non-African currency added in 021_global_countries to the
established convention (rate = USD value of 1 unit), computed as
1 / (real units-per-USD).
*/

UPDATE currencies SET exchange_rate = 1.08696 WHERE code = 'EUR';   -- 1 EUR ≈ $1.087
UPDATE currencies SET exchange_rate = 1.26582 WHERE code = 'GBP';   -- 1 GBP ≈ $1.266
UPDATE currencies SET exchange_rate = 0.73529 WHERE code = 'CAD';
UPDATE currencies SET exchange_rate = 0.19417 WHERE code = 'BRL';
UPDATE currencies SET exchange_rate = 0.05618 WHERE code = 'MXN';
UPDATE currencies SET exchange_rate = 0.00112 WHERE code = 'ARS';
UPDATE currencies SET exchange_rate = 0.00106 WHERE code = 'CLP';
UPDATE currencies SET exchange_rate = 0.00026 WHERE code = 'COP';
UPDATE currencies SET exchange_rate = 0.14085 WHERE code = 'CNY';
UPDATE currencies SET exchange_rate = 0.00671 WHERE code = 'JPY';
UPDATE currencies SET exchange_rate = 0.00075 WHERE code = 'KRW';
UPDATE currencies SET exchange_rate = 0.01202 WHERE code = 'INR';
UPDATE currencies SET exchange_rate = 0.00006 WHERE code = 'IDR';
UPDATE currencies SET exchange_rate = 0.01776 WHERE code = 'PHP';
UPDATE currencies SET exchange_rate = 0.00004 WHERE code = 'VND';
UPDATE currencies SET exchange_rate = 0.02809 WHERE code = 'THB';
UPDATE currencies SET exchange_rate = 0.26667 WHERE code = 'SAR';
UPDATE currencies SET exchange_rate = 0.27248 WHERE code = 'AED';
UPDATE currencies SET exchange_rate = 0.27473 WHERE code = 'QAR';
UPDATE currencies SET exchange_rate = 0.03115 WHERE code = 'TRY';
UPDATE currencies SET exchange_rate = 0.27174 WHERE code = 'ILS';
UPDATE currencies SET exchange_rate = 0.65359 WHERE code = 'AUD';
UPDATE currencies SET exchange_rate = 0.60606 WHERE code = 'NZD';
UPDATE currencies SET exchange_rate = 0.00360 WHERE code = 'PKR';
UPDATE currencies SET exchange_rate = 0.00909 WHERE code = 'BDT';
