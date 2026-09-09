// GET /functions/v1/sitemap-products?domain=https://yourdomain.com
// Génère un sitemap XML dynamique pour tous les produits approuvés/actifs
// et toutes les boutiques approuvées — impossible à maintenir en fichier
// statique vu que le catalogue change en continu. Référencé depuis
// public/robots.txt via une ligne "Sitemap:". Cache CDN léger (10 min)
// pour éviter de re-scanner toute la table à chaque hit de robot.
import { corsHeaders } from '../_shared/cors.ts';
import { getAdminClient } from '../_shared/supabase-admin.ts';

function xmlEscape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const url = new URL(req.url);
  // Best-effort: derive the storefront domain from a query param
  // (?domain=https://zando.com), otherwise a placeholder the operator
  // must replace — e.g. by setting the "Sitemap:" line in robots.txt to
  // .../sitemap-products?domain=https://yourrealdomain.com
  const domain = url.searchParams.get('domain') || 'https://YOUR_DOMAIN';

  try {
    const admin = getAdminClient();

    const { data: products } = await admin
      .from('products')
      .select('id, updated_at, created_at')
      .eq('is_active', true)
      .eq('approval_status', 'approved')
      .limit(50000);

    const { data: sellers } = await admin
      .from('sellers')
      .select('store_slug, id')
      .eq('status', 'approved')
      .limit(50000);

    const urls: string[] = [];
    for (const p of products || []) {
      const lastmod = (p.updated_at || p.created_at || '').slice(0, 10);
      urls.push(`  <url><loc>${xmlEscape(`${domain}/?p=product&id=${p.id}`)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}<changefreq>weekly</changefreq><priority>0.7</priority></url>`);
    }
    for (const s of sellers || []) {
      const idOrSlug = s.store_slug || s.id;
      urls.push(`  <url><loc>${xmlEscape(`${domain}/?p=seller&id=${idOrSlug}`)}</loc><changefreq>weekly</changefreq><priority>0.6</priority></url>`);
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=600',
      },
    });
  } catch (e) {
    console.error('sitemap-products error:', e);
    return new Response('<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
      headers: { ...corsHeaders, 'Content-Type': 'application/xml; charset=utf-8' },
      status: 200,
    });
  }
});
