import { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { fetchProductById, fetchAddresses, fetchOrders, updateUserProfile, cancelOwnOrder, createReturnRequest, fetchBuyerReturnRequests, getOrCreateConversation, fetchConversationMessages, sendMessage, markConversationRead } from '@/lib/db';
import type { Product, Address, Order, ReturnRequest, Message } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { generateInvoicePdf } from '@/lib/invoice';
import { ProductCard } from '@/components/Cards';
import { User as UserIcon, Package, MapPin, Heart, Plus, Trash2, Truck, RotateCcw, Loader2, XCircle, Download, MessageSquare as MessageSquareIcon } from 'lucide-react';

export function AccountPage() {
  const { t, locale, user, navigate, wishlist, showToast, countries, params, addToCart } = useApp();
  const [tab, setTab] = useState((params.tab as string) || 'profile');
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [buyingAgain, setBuyingAgain] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);
  const [messagingOrderId, setMessagingOrderId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
  const [newMessageBody, setNewMessageBody] = useState('');
  const [returningOrderId, setReturningOrderId] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [addrForm, setAddrForm] = useState({ label: '', fullName: user?.fullName || '', phone: '', street: '', countryId: '', city: '' });
  const [profileForm, setProfileForm] = useState({ fullName: user?.fullName || '', phone: '' });

  useEffect(() => {
    if (!user) { navigate('login'); return; }
    (async () => {
      const [addr, ords, rets] = await Promise.all([fetchAddresses(user.id), fetchOrders(user.id), fetchBuyerReturnRequests(user.id)]);
      setAddresses(addr);
      setOrders(ords);
      setReturnRequests(rets);
      const prods: Product[] = [];
      for (const id of wishlist) {
        const p = await fetchProductById(id);
        if (p) prods.push(p);
      }
      setWishlistProducts(prods);
    })();
  }, [user, wishlist, navigate]);

  if (!user) return null;

  const saveAddress = async () => {
    if (!addrForm.label || !addrForm.street || !addrForm.countryId) return;
    try {
      const { data } = await supabase.from('addresses').insert({
        user_id: user.id, label: addrForm.label, full_name: addrForm.fullName, phone: addrForm.phone,
        street: addrForm.street, country_id: addrForm.countryId, city: addrForm.city,
        is_default: addresses.length === 0,
      }).select().single();
      if (data) { setAddresses([data, ...addresses]); setShowAddrForm(false); setAddrForm({ label: '', fullName: user.fullName, phone: '', street: '', countryId: '', city: '' }); showToast(locale === 'fr' ? 'Adresse ajoutée' : 'Address added'); }
    } catch { showToast('Error', 'error'); }
  };

  const removeAddress = async (id: string) => {
    await supabase.from('addresses').delete().eq('id', id);
    setAddresses(addresses.filter((a) => a.id !== id));
  };

  const setDefaultAddress = async (id: string) => {
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id);
    await supabase.from('addresses').update({ is_default: true }).eq('id', id);
    setAddresses(addresses.map((a) => ({ ...a, is_default: a.id === id })));
  };

  const tabs = [
    { id: 'profile', label: t.account.profile, icon: UserIcon },
    { id: 'orders', label: t.account.myOrders, icon: Package },
    { id: 'addresses', label: t.account.myAddresses, icon: MapPin },
    { id: 'wishlist', label: t.account.wishlist, icon: Heart },
  ];

  const statusColors: Record<string, string> = { pending: '#64748b', confirmed: '#0f172a', preparing: '#ff7a00', inTransit: '#3b82f6', delivered: '#ff7a00', cancelled: '#ef4444' };

  // Real "Buy Again": re-checks the product still exists, is active, and
  // has stock before adding to cart — never silently adds something that's
  // gone or sold out.
  const buyAgain = async (item: { product_id: string | null; qty: number; product_name: string }) => {
    if (!item.product_id) {
      showToast(locale === 'fr' ? 'Ce produit n\u2019est plus disponible' : 'This product is no longer available', 'error');
      return;
    }
    setBuyingAgain(item.product_id);
    const product = await fetchProductById(item.product_id);
    setBuyingAgain(null);
    if (!product || !product.is_active) {
      showToast(locale === 'fr' ? `"${item.product_name}" n\u2019est plus disponible` : `"${item.product_name}" is no longer available`, 'error');
      return;
    }
    if (product.stock === 0) {
      showToast(locale === 'fr' ? `"${product.name}" est en rupture de stock` : `"${product.name}" is out of stock`, 'error');
      return;
    }
    const qty = Math.min(item.qty, product.stock);
    addToCart(product.id, qty);
    showToast(locale === 'fr' ? `${product.name} ajouté au panier` : `${product.name} added to cart`);
  };

  const cancelOrder = async (orderId: string) => {
    setCancellingId(orderId);
    const ok = await cancelOwnOrder(orderId);
    setCancellingId(null);
    if (ok) {
      setOrders(orders.map((o) => o.id === orderId ? { ...o, status: 'cancelled' } : o));
      showToast(locale === 'fr' ? 'Commande annulée' : 'Order cancelled');
    } else {
      showToast(locale === 'fr' ? 'Erreur lors de l\u2019annulation' : 'Error cancelling order', 'error');
    }
  };

  const openConversationForOrder = async (order: Order) => {
    if (!user || !order.seller_id) return;
    setMessagingOrderId(order.id);
    const convId = await getOrCreateConversation({ orderId: order.id, buyerId: user.id, sellerId: order.seller_id, subject: `${locale === 'fr' ? 'Commande' : 'Order'} ${order.tracking_id || order.id.slice(0, 8)}` });
    if (convId) {
      setConversationId(convId);
      setConversationMessages(await fetchConversationMessages(convId));
      await markConversationRead(convId, 'buyer');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessageBody.trim() || !conversationId || !user) return;
    const ok = await sendMessage({ conversationId, senderId: user.id, senderRole: 'buyer', body: newMessageBody.trim() });
    if (ok) {
      setConversationMessages((prev) => [...prev, { id: 'tmp-' + Date.now(), conversation_id: conversationId, sender_id: user.id, sender_role: 'buyer', body: newMessageBody.trim(), created_at: new Date().toISOString() }]);
      setNewMessageBody('');
    }
  };

  return (
    <div className="motif-bg min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#0f172a] flex items-center justify-center text-[#ff7a00] text-2xl font-bold">{user.fullName.charAt(0).toUpperCase()}</div>
          <div><h1 className="font-display text-2xl font-bold text-[#0f172a]">{user.fullName}</h1><p className="text-sm text-[#64748b]">{user.email}</p></div>
        </div>
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="lg:w-56 shrink-0">
            <div className="card p-3 sticky top-20">
              <nav className="space-y-1">
                {tabs.map((item) => (
                  <button key={item.id} onClick={() => setTab(item.id)}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 text-sm rounded-lg transition-colors ${tab === item.id ? 'bg-[#0f172a] text-[#ff7a00] font-semibold' : 'text-[#0f172a] hover:bg-[#0f172a]/5'}`}>
                    <item.icon className="w-4 h-4" /> {item.label}
                    {item.id === 'wishlist' && wishlist.length > 0 && <span className="ml-auto text-xs bg-[#ff7a00] text-[#0f172a] px-1.5 rounded-full font-bold">{wishlist.length}</span>}
                    {item.id === 'orders' && orders.length > 0 && <span className="ml-auto text-xs bg-[#ff7a00] text-[#0f172a] px-1.5 rounded-full font-bold">{orders.length}</span>}
                  </button>
                ))}
              </nav>
            </div>
          </aside>
          <div className="flex-1 min-w-0">
            {tab === 'profile' && (
              <div className="card p-6 animate-fade-up">
                <h2 className="font-display text-lg font-bold text-[#0f172a] mb-5">{t.account.personalInfo}</h2>
                <div className="space-y-4">
                  <div><label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{t.account.fullName}</label><input value={profileForm.fullName} onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })} className="input-field" /></div>
                  <div><label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{t.account.email}</label><input defaultValue={user.email} disabled className="input-field opacity-60" /></div>
                  <div><label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{t.account.phone}</label><input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="+225 07 00 00 00" className="input-field" /></div>
                  <button onClick={async () => {
                    const ok = await updateUserProfile(user.id, { full_name: profileForm.fullName, phone: profileForm.phone });
                    showToast(ok ? (locale === 'fr' ? 'Profil enregistré' : 'Profile saved') : (locale === 'fr' ? 'Erreur' : 'Error'), ok ? 'success' : 'error');
                  }} className="btn-gold px-6 py-2.5 rounded-lg text-sm font-semibold">{t.account.save}</button>
                </div>
              </div>
            )}
            {tab === 'orders' && (
              <div className="animate-fade-up">
                <h2 className="font-display text-lg font-bold text-[#0f172a] mb-5">{t.account.orderHistory}</h2>
                {orders.length === 0 ? (
                  <div className="card p-8 text-center"><Package className="w-10 h-10 text-[#ff7a00]/30 mx-auto mb-3" /><p className="text-sm text-[#64748b] mb-4">{t.account.noOrders}</p><button onClick={() => navigate('catalog')} className="btn-gold px-5 py-2.5 rounded-lg text-sm font-semibold">{t.home.ctaBrowse}</button></div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="card p-5">
                        <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#ff7a00]/10">
                          <div><p className="font-semibold text-[#0f172a]">{order.tracking_id || order.id.slice(0, 8)}</p><p className="text-xs text-[#64748b]">{new Date(order.created_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')}</p></div>
                          <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-full" style={{ background: `${statusColors[order.status]}20`, color: statusColors[order.status] }}>{t.delivery[order.status as 'pending' | 'confirmed' | 'preparing' | 'inTransit' | 'delivered' | 'cancelled']}</span>
                        </div>
                        {order.order_items?.map((item) => (
                          <div key={item.id} className="flex items-center gap-3 mb-2">
                            {item.image_url && <img src={item.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                            <span className="text-sm text-[#0f172a] flex-1">{item.product_name} x{item.qty}</span>
                            <span className="text-sm font-bold text-[#0f172a]">${item.price * item.qty}</span>
                            <button onClick={() => buyAgain(item)} disabled={buyingAgain === item.product_id} className="flex items-center gap-1 text-xs font-semibold text-[#3d1f00] border border-[#3d1f00]/20 rounded-full px-3 py-1.5 hover:bg-[#3d1f00]/5 disabled:opacity-50 shrink-0">
                              {buyingAgain === item.product_id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                              {locale === 'fr' ? 'Racheter' : 'Buy again'}
                            </button>
                          </div>
                        ))}
                        <div className="flex items-center justify-between pt-3 border-t border-[#ff7a00]/10">
                          <span className="font-bold text-[#0f172a]">{t.cart.total}: ${order.total.toFixed(2)}</span>
                          <div className="flex items-center gap-3">
                            {['pending', 'confirmed'].includes(order.status) && (
                              <button onClick={() => cancelOrder(order.id)} disabled={cancellingId === order.id} className="flex items-center gap-1 text-sm font-semibold text-red-500 hover:underline disabled:opacity-50">
                                {cancellingId === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} {locale === 'fr' ? 'Annuler' : 'Cancel'}
                              </button>
                            )}
                            {order.status === 'delivered' && !returnRequests.some((r) => r.order_id === order.id) && (
                              <button onClick={() => setReturningOrderId(returningOrderId === order.id ? null : order.id)} className="flex items-center gap-1 text-sm font-semibold text-[#0f172a] hover:underline">
                                <RotateCcw className="w-4 h-4" /> {locale === 'fr' ? 'Demander un retour' : 'Request return'}
                              </button>
                            )}
                            {returnRequests.some((r) => r.order_id === order.id) && (
                              <span className="text-xs font-semibold text-[#64748b]">
                                {locale === 'fr' ? 'Retour' : 'Return'}: {returnRequests.find((r) => r.order_id === order.id)?.status}
                              </span>
                            )}
                            <button onClick={() => generateInvoicePdf(order, { locale })} className="flex items-center gap-1 text-sm font-semibold text-[#64748b] hover:text-[#0f172a]">
                              <Download className="w-4 h-4" /> {locale === 'fr' ? 'Facture' : 'Invoice'}
                            </button>
                            {order.seller_id && (
                              <button onClick={() => openConversationForOrder(order)} className="flex items-center gap-1 text-sm font-semibold text-[#64748b] hover:text-[#0f172a]">
                                <MessageSquareIcon className="w-4 h-4" /> {locale === 'fr' ? 'Contacter le vendeur' : 'Contact seller'}
                              </button>
                            )}
                            <button onClick={() => navigate('delivery', { id: order.tracking_id || order.id })} className="flex items-center gap-1 text-sm font-semibold text-[#ff7a00] hover:underline"><Truck className="w-4 h-4" /> {t.account.viewTracking}</button>
                          </div>
                        </div>
                        {messagingOrderId === order.id && (
                          <div className="mt-3 pt-3 border-t border-[#ff7a00]/10">
                            <div className="max-h-64 overflow-y-auto space-y-2 mb-2 p-2 bg-[#f7f8fa] rounded-lg">
                              {conversationMessages.length === 0 ? (
                                <p className="text-xs text-[#64748b] text-center py-4">{locale === 'fr' ? 'Démarrez la conversation avec le vendeur.' : 'Start the conversation with the seller.'}</p>
                              ) : conversationMessages.map((m) => (
                                <div key={m.id} className={'max-w-[80%] p-2 rounded-xl text-xs ' + (m.sender_role === 'buyer' ? 'ml-auto bg-[#ff7a00] text-white' : 'bg-white text-[#0f172a]')}>
                                  {m.body}
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <input value={newMessageBody} onChange={(e) => setNewMessageBody(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder={locale === 'fr' ? 'Écrire un message...' : 'Type a message...'} className="input-field text-sm flex-1" />
                              <button onClick={handleSendMessage} className="btn-gold px-4 py-2 rounded-lg text-xs font-semibold">{locale === 'fr' ? 'Envoyer' : 'Send'}</button>
                              <button onClick={() => setMessagingOrderId(null)} className="px-3 py-2 rounded-lg text-xs font-semibold text-[#64748b]">{locale === 'fr' ? 'Fermer' : 'Close'}</button>
                            </div>
                          </div>
                        )}
                        {returningOrderId === order.id && (
                          <div className="mt-3 pt-3 border-t border-[#ff7a00]/10 space-y-2">
                            <textarea
                              value={returnReason}
                              onChange={(e) => setReturnReason(e.target.value)}
                              placeholder={locale === 'fr' ? 'Pourquoi souhaitez-vous retourner cette commande ?' : 'Why do you want to return this order?'}
                              className="input-field text-sm w-full"
                              rows={2}
                            />
                            <button
                              onClick={async () => {
                                if (!returnReason.trim() || !user) return;
                                const ok = await createReturnRequest({ orderId: order.id, userId: user.id, sellerId: order.seller_id!, reason: returnReason });
                                if (ok) {
                                  showToast(locale === 'fr' ? 'Demande de retour envoyée' : 'Return request sent');
                                  setReturnRequests((prev) => [...prev, { id: 'tmp', order_id: order.id, user_id: user.id, seller_id: order.seller_id!, reason: returnReason, details: null, status: 'requested', seller_response: null, created_at: new Date().toISOString() }]);
                                  setReturningOrderId(null);
                                  setReturnReason('');
                                } else {
                                  showToast(locale === 'fr' ? 'Erreur lors de la demande' : 'Error requesting return', 'error');
                                }
                              }}
                              className="btn-gold px-4 py-2 rounded-lg text-xs font-semibold"
                            >
                              {locale === 'fr' ? 'Envoyer la demande' : 'Send request'}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {tab === 'addresses' && (
              <div className="animate-fade-up">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-display text-lg font-bold text-[#0f172a]">{t.account.myAddresses}</h2>
                  <button onClick={() => setShowAddrForm(!showAddrForm)} className="btn-gold px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2"><Plus className="w-4 h-4" /> {t.account.addAddress}</button>
                </div>
                {showAddrForm && (
                  <div className="card p-5 mb-4 animate-fade-up space-y-3">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <input placeholder={t.account.addressLabel} value={addrForm.label} onChange={(e) => setAddrForm({ ...addrForm, label: e.target.value })} className="input-field text-sm" />
                      <input placeholder={t.account.phone} value={addrForm.phone} onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })} className="input-field text-sm" />
                    </div>
                    <input placeholder={t.account.street} value={addrForm.street} onChange={(e) => setAddrForm({ ...addrForm, street: e.target.value })} className="input-field text-sm" />
                    <div className="grid sm:grid-cols-2 gap-3">
                      <select value={addrForm.countryId} onChange={(e) => setAddrForm({ ...addrForm, countryId: e.target.value })} className="input-field text-sm">
                        <option value="">{t.account.selectCountry}</option>
                        {/* Native <select><option> can't render an <img>, only text — emoji flag is the only option here. */}
                        {countries.map((c) => <option key={c.id} value={c.id}>{c.flag} {c.name}</option>)}
                      </select>
                      <input placeholder={t.account.selectCity} value={addrForm.city} onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })} className="input-field text-sm" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={saveAddress} className="btn-gold px-5 py-2 rounded-full text-sm font-semibold">{t.common.save}</button>
                      <button onClick={() => setShowAddrForm(false)} className="px-5 py-2 rounded-lg text-sm border border-[#0f172a]/15 text-[#0f172a]">{t.common.cancel}</button>
                    </div>
                  </div>
                )}
                {addresses.length === 0 && !showAddrForm ? (
                  <div className="card p-8 text-center"><MapPin className="w-10 h-10 text-[#ff7a00]/30 mx-auto mb-3" /><p className="text-sm text-[#64748b]">{t.account.noAddresses}</p></div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {addresses.map((a) => (
                      <div key={a.id} className="card p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-[#ff7a00]" />
                            <span className="font-semibold text-[#0f172a] text-sm">{a.label}</span>
                            {a.is_default && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#ff7a00]/15 text-[#64748b]">{t.account.defaultAddress}</span>}
                          </div>
                          <button onClick={() => removeAddress(a.id)} className="p-1 rounded hover:bg-red-50"><Trash2 className="w-4 h-4 text-red-400" /></button>
                        </div>
                        <p className="text-sm text-[#0f172a]">{a.full_name}</p>
                        <p className="text-xs text-[#64748b]">{a.phone}</p>
                        <p className="text-xs text-[#64748b] mt-1">{a.street}, {a.city}</p>
                        {!a.is_default && <button onClick={() => setDefaultAddress(a.id)} className="mt-2 text-xs font-semibold text-[#ff7a00] hover:underline">{t.account.setDefault}</button>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {tab === 'wishlist' && (
              <div className="animate-fade-up">
                <h2 className="font-display text-lg font-bold text-[#0f172a] mb-5">{t.account.wishlist}</h2>
                {wishlistProducts.length === 0 ? (
                  <div className="card p-8 text-center"><Heart className="w-10 h-10 text-[#ff7a00]/30 mx-auto mb-3" /><p className="text-sm text-[#64748b] mb-4">{t.account.noWishlist}</p><button onClick={() => navigate('catalog')} className="btn-gold px-5 py-2.5 rounded-lg text-sm font-semibold">{t.home.ctaBrowse}</button></div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {wishlistProducts.map((p) => <ProductCard key={p.id} product={p} />)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
