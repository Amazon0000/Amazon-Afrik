import jsPDF from 'jspdf';
import type { Order } from './db';

// Génère une vraie facture PDF (pas une simulation) à partir des données
// réelles d'une commande (orders + order_items déjà chargés). Téléchargée
// directement côté client — aucun backend nécessaire pour ce document
// purement déclaratif (résumé de ce qui a déjà été payé).
export function generateInvoicePdf(order: Order, opts: { sellerName?: string; locale: 'fr' | 'en' }) {
  const { sellerName = 'Zando Seller', locale } = opts;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;
  let y = 56;

  const L = locale === 'fr'
    ? { invoice: 'FACTURE', number: 'N° facture', date: 'Date', seller: 'Vendeur', order: 'Commande',
        status: 'Statut', item: 'Article', qty: 'Qté', price: 'Prix unitaire', lineTotal: 'Total',
        subtotal: 'Sous-total', discount: 'Remise', total: 'Total à payer', paymentMethod: 'Moyen de paiement',
        deliveryAddress: 'Adresse de livraison', thanks: 'Merci pour votre commande sur Zando.' }
    : { invoice: 'INVOICE', number: 'Invoice #', date: 'Date', seller: 'Seller', order: 'Order',
        status: 'Status', item: 'Item', qty: 'Qty', price: 'Unit Price', lineTotal: 'Total',
        subtotal: 'Subtotal', discount: 'Discount', total: 'Total Due', paymentMethod: 'Payment Method',
        deliveryAddress: 'Delivery Address', thanks: 'Thank you for your order on Zando.' };

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42);
  doc.text('Zando', margin, y);
  doc.setFontSize(11);
  doc.setTextColor(255, 122, 0);
  doc.text(L.invoice, pageWidth - margin, y, { align: 'right' });
  y += 28;

  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 24;

  // Meta info
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  const metaLines: [string, string][] = [
    [L.number, order.tracking_id || order.id.slice(0, 8).toUpperCase()],
    [L.date, new Date(order.created_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')],
    [L.seller, sellerName],
    [L.status, order.status],
  ];
  if (order.payment_method) metaLines.push([L.paymentMethod, order.payment_method]);
  if (order.delivery_address) metaLines.push([L.deliveryAddress, order.delivery_address]);

  for (const [label, value] of metaLines) {
    doc.setTextColor(100, 116, 139);
    doc.text(`${label}:`, margin, y);
    doc.setTextColor(15, 23, 42);
    doc.text(value, margin + 130, y, { maxWidth: pageWidth - margin * 2 - 130 });
    y += 18;
  }
  y += 12;

  // Items table header
  doc.setFillColor(247, 248, 250);
  doc.rect(margin, y, pageWidth - margin * 2, 24, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(L.item, margin + 8, y + 16);
  doc.text(L.qty, pageWidth - margin - 180, y + 16, { align: 'right' });
  doc.text(L.price, pageWidth - margin - 100, y + 16, { align: 'right' });
  doc.text(L.lineTotal, pageWidth - margin - 8, y + 16, { align: 'right' });
  y += 24;

  // Items rows — données réelles issues de order_items
  doc.setFont('helvetica', 'normal');
  const items = order.order_items || [];
  for (const item of items) {
    if (y > 700) { doc.addPage(); y = 56; }
    doc.setTextColor(15, 23, 42);
    doc.text(item.product_name, margin + 8, y + 16, { maxWidth: pageWidth - margin * 2 - 200 });
    doc.text(String(item.qty), pageWidth - margin - 180, y + 16, { align: 'right' });
    doc.text(`${order.currency_code} ${item.price.toFixed(2)}`, pageWidth - margin - 100, y + 16, { align: 'right' });
    doc.text(`${order.currency_code} ${(item.price * item.qty).toFixed(2)}`, pageWidth - margin - 8, y + 16, { align: 'right' });
    y += 22;
    doc.setDrawColor(240, 244, 248);
    doc.line(margin, y - 6, pageWidth - margin, y - 6);
  }

  y += 16;
  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);

  // Totals block, right-aligned
  const totalsX = pageWidth - margin - 8;
  doc.setTextColor(100, 116, 139);
  doc.text(L.subtotal, totalsX - 140, y, { align: 'left' });
  doc.setTextColor(15, 23, 42);
  doc.text(`${order.currency_code} ${subtotal.toFixed(2)}`, totalsX, y, { align: 'right' });
  y += 18;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 122, 0);
  doc.text(L.total, totalsX - 140, y, { align: 'left' });
  doc.text(`${order.currency_code} ${order.total.toFixed(2)}`, totalsX, y, { align: 'right' });
  y += 40;

  // Footer
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(L.thanks, margin, y);

  doc.save(`invoice-${order.tracking_id || order.id.slice(0, 8)}.pdf`);
}
