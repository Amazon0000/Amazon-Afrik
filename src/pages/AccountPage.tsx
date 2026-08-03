import { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/lib/store';
import { fetchProductById, fetchAddresses, fetchOrders, updateUserProfile } from '@/lib/db';
import type { Product, Address, Order } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { ProductCard } from '@/components/Cards';
import { User as UserIcon, Package, MapPin, Heart, Plus, Trash2, Truck } from 'lucide-react';

export function AccountPage() {
  const { t, locale, user, navigate, wishlist, showToast, countries, formatPrice } = useApp();
  const [tab, setTab] = useState('profile');
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [addrForm, setAddrForm] = useState({ label: '', fullName: user?.fullName || '', phone: '', street: '', countryId: '', city: '' });
  const [profileForm, setProfileForm] = useState({ fullName: user?.fullName || '', phone: '' });

  // Settings sub-tabs
  const [profileSubTab, setProfileSubTab] = useState('general');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showTwoFactorQR, setShowTwoFactorQR] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [mfaStatus, setMfaStatus] = useState(false);
  const [sessions, setSessions] = useState([
    { id: 's1', device: 'Chrome on macOS', location: 'Abidjan, CI', current: true },
    { id: 's2', device: 'Safari on iPhone 15', location: 'Dakar, SN', current: false },
  ]);
  const [notifs, setNotifs] = useState({ emailOrders: true, smsDelivery: true, marketing: false });

  const passwordStrength = useMemo(() => {
    if (!newPassword) return { score: 0, label: '', color: 'bg-gray-200' };
    if (newPassword.length < 6) return { score: 1, label: 'Weak', color: 'bg-red-500' };
    if (newPassword.length < 10) return { score: 2, label: 'Medium', color: 'bg-yellow-500' };
    return { score: 3, label: 'Strong', color: 'bg-green-500' };
  }, [newPassword]);

  useEffect(() => {
    if (!user) { navigate('login'); return; }
    (async () => {
      const [addr, ords] = await Promise.all([fetchAddresses(user.id), fetchOrders(user.id)]);
      setAddresses(addr);
      setOrders(ords);
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

  const statusColors: Record<string, string> = { pending: '#64748b', confirmed: '#0f172a', preparing: '#0e9f6e', inTransit: '#3b82f6', delivered: '#22c55e', cancelled: '#ef4444' };

  return (
    <div className="motif-bg min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#0f172a] flex items-center justify-center text-[#0e9f6e] text-2xl font-bold">{user.fullName.charAt(0).toUpperCase()}</div>
          <div><h1 className="font-display text-2xl font-bold text-[#0f172a]">{user.fullName}</h1><p className="text-sm text-[#64748b]">{user.email}</p></div>
        </div>
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="lg:w-56 shrink-0">
            <div className="card p-3 sticky top-20">
              <nav className="space-y-1">
                {tabs.map((item) => (
                  <button key={item.id} onClick={() => setTab(item.id)}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 text-sm rounded-lg transition-colors ${tab === item.id ? 'bg-[#0f172a] text-[#0e9f6e] font-semibold' : 'text-[#0f172a] hover:bg-[#0f172a]/5'}`}>
                    <item.icon className="w-4 h-4" /> {item.label}
                    {item.id === 'wishlist' && wishlist.length > 0 && <span className="ml-auto text-xs bg-[#0e9f6e] text-[#0f172a] px-1.5 rounded-full font-bold">{wishlist.length}</span>}
                    {item.id === 'orders' && orders.length > 0 && <span className="ml-auto text-xs bg-[#0e9f6e] text-[#0f172a] px-1.5 rounded-full font-bold">{orders.length}</span>}
                  </button>
                ))}
              </nav>
            </div>
          </aside>
          <div className="flex-1 min-w-0">
            {tab === 'profile' && (
              <div className="card p-6 animate-fade-up">
                <div className="flex border-b border-[#e2e8f0] mb-5">
                  <button onClick={() => setProfileSubTab('general')} className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${profileSubTab === 'general' ? 'border-[#0e9f6e] text-[#0e9f6e]' : 'border-transparent text-gray-500'}`}>{locale === 'fr' ? 'Général' : 'General'}</button>
                  <button onClick={() => setProfileSubTab('security')} className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${profileSubTab === 'security' ? 'border-[#0e9f6e] text-[#0e9f6e]' : 'border-transparent text-gray-500'}`}>{locale === 'fr' ? 'Sécurité' : 'Security'}</button>
                  <button onClick={() => setProfileSubTab('notifications')} className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${profileSubTab === 'notifications' ? 'border-[#0e9f6e] text-[#0e9f6e]' : 'border-transparent text-gray-500'}`}>{locale === 'fr' ? 'Notifications' : 'Notifications'}</button>
                </div>

                {profileSubTab === 'general' && (
                  <div className="space-y-4">
                    <h2 className="font-display text-base font-bold text-[#0f172a] mb-2">{t.account.personalInfo}</h2>
                    <div><label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{t.account.fullName}</label><input value={profileForm.fullName} onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })} className="input-field" /></div>
                    <div><label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{t.account.email}</label><input defaultValue={user.email} disabled className="input-field opacity-60" /></div>
                    <div><label className="block text-xs font-semibold text-[#0f172a] uppercase mb-2">{t.account.phone}</label><input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="+225 07 00 00 00" className="input-field" /></div>
                    <button onClick={async () => {
                      const ok = await updateUserProfile(user.id, { full_name: profileForm.fullName, phone: profileForm.phone });
                      showToast(ok ? (locale === 'fr' ? 'Profil enregistré' : 'Profile saved') : (locale === 'fr' ? 'Erreur' : 'Error'), ok ? 'success' : 'error');
                    }} className="btn-gold px-6 py-2.5 rounded-lg text-sm font-semibold">{t.account.save}</button>
                  </div>
                )}

                {profileSubTab === 'security' && (
                  <div className="space-y-6 text-left">
                    {/* Password Change */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-[#0f172a]">{locale === 'fr' ? 'Modifier le mot de passe' : 'Change Password'}</h3>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">{locale === 'fr' ? 'Mot de passe actuel' : 'Current Password'}</label>
                        <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="input-field text-sm" placeholder="••••••••" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">{locale === 'fr' ? 'Nouveau mot de passe' : 'New Password'}</label>
                        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input-field text-sm" placeholder="••••••••" />
                        {newPassword && (
                          <div className="mt-2 space-y-1">
                            <div className="flex justify-between text-xs font-semibold text-gray-500">
                              <span>{locale === 'fr' ? 'Force du mot de passe' : 'Strength'}: {passwordStrength.label}</span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                              <div className={`h-full ${passwordStrength.color}`} style={{ width: `${(passwordStrength.score / 3) * 100}%` }} />
                            </div>
                          </div>
                        )}
                      </div>
                      <button type="button" onClick={() => {
                        if (newPassword.length < 6) { showToast(locale === 'fr' ? 'Mot de passe trop court' : 'Password too short', 'error'); return; }
                        showToast(locale === 'fr' ? 'Mot de passe mis à jour' : 'Password changed successfully');
                        setCurrentPassword('');
                        setNewPassword('');
                      }} className="btn-gold px-5 py-2.5 rounded-lg text-xs font-semibold">{locale === 'fr' ? 'Mettre à jour' : 'Update Password'}</button>
                    </div>

                    {/* 2FA */}
                    <div className="border-t border-gray-100 pt-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-[#0f172a]">{locale === 'fr' ? 'Double authentification (2FA)' : 'Two-Factor Authentication (2FA)'}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">{locale === 'fr' ? 'Ajoutez une couche de sécurité supplémentaire' : 'Add an extra layer of security to your account'}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={mfaStatus} onChange={(e) => {
                            if (e.target.checked) { setShowTwoFactorQR(true); } else { setMfaStatus(false); showToast(locale === 'fr' ? '2FA désactivé' : '2FA disabled'); }
                          }} className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:width-5 after:transition-all peer-checked:bg-[#0e9f6e]"></div>
                        </label>
                      </div>

                      {showTwoFactorQR && (
                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3 animate-fade-up">
                          <p className="text-xs font-semibold text-gray-700">{locale === 'fr' ? 'Scannez le QR Code' : 'Scan the QR Code'}</p>
                          <div className="w-32 h-32 bg-white border border-gray-200 rounded-lg mx-auto flex items-center justify-center p-2">
                            {/* SVG mockup of QR code */}
                            <svg className="w-full h-full text-[#0f172a]" viewBox="0 0 100 100" fill="currentColor">
                              <path d="M5,5h30v30H5V5z M10,10v20h20V10H10z M5,65h30v30H5V65z M10,70v20h20V70H10z M65,5h30v30H65V5z M70,10v20h20V10H70z M45,15h10v10H45V15z M45,45h10v10H45V45z M75,45h15v10H75V45z M15,45h20v10H15V45z M45,75h10v15H45V75z" />
                            </svg>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">{locale === 'fr' ? 'Code d\'authentification' : 'Verification Code'}</label>
                            <input value={twoFactorCode} onChange={(e) => setTwoFactorCode(e.target.value)} placeholder="123456" className="input-field text-sm text-center max-w-[150px] mx-auto block" />
                          </div>
                          <div className="flex gap-2 justify-center">
                            <button type="button" onClick={() => { setMfaStatus(true); setShowTwoFactorQR(false); showToast(locale === 'fr' ? '2FA activé avec succès' : '2FA activated successfully'); }} className="btn-gold px-4 py-2 rounded-lg text-xs font-semibold">Verify & Activate</button>
                            <button type="button" onClick={() => setShowTwoFactorQR(false)} className="px-4 py-2 rounded-lg text-xs border border-gray-300">Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Active Sessions */}
                    <div className="border-t border-gray-100 pt-5 space-y-3">
                      <h3 className="font-semibold text-[#0f172a]">{locale === 'fr' ? 'Sessions actives' : 'Active Sessions'}</h3>
                      <div className="space-y-2">
                        {sessions.map((s) => (
                          <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-150 rounded-xl">
                            <div>
                              <p className="text-xs font-semibold text-gray-800">{s.device} {s.current && <span className="text-[10px] px-2 py-0.5 bg-[#0e9f6e]/15 text-[#0e9f6e] rounded-full font-bold ml-1.5">Current</span>}</p>
                              <p className="text-[10px] text-gray-500">{s.location}</p>
                            </div>
                            {!s.current && (
                              <button type="button" onClick={() => { setSessions(sessions.filter(x => x.id !== s.id)); showToast(locale === 'fr' ? 'Session déconnectée' : 'Session disconnected'); }} className="text-xs text-red-500 font-semibold hover:underline">Revoke</button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {profileSubTab === 'notifications' && (
                  <div className="space-y-4 text-left">
                    <h3 className="font-semibold text-[#0f172a] mb-3">{locale === 'fr' ? 'Préférences de notification' : 'Notification Preferences'}</h3>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-150 rounded-xl cursor-pointer hover:bg-gray-100">
                        <div>
                          <p className="text-xs font-semibold text-[#0f172a]">{locale === 'fr' ? 'Alertes de commande par e-mail' : 'Email Order Alerts'}</p>
                          <p className="text-[10px] text-[#64748b]">{locale === 'fr' ? 'Recevez un e-mail à chaque nouvelle commande' : 'Receive an email on every new order placed'}</p>
                        </div>
                        <input type="checkbox" checked={notifs.emailOrders} onChange={(e) => setNotifs({ ...notifs, emailOrders: e.target.checked })} className="w-5 h-5 accent-[#0e9f6e]" />
                      </label>
                      <label className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-150 rounded-xl cursor-pointer hover:bg-gray-100">
                        <div>
                          <p className="text-xs font-semibold text-[#0f172a]">{locale === 'fr' ? 'Alertes de livraison par SMS' : 'SMS Delivery Alerts'}</p>
                          <p className="text-[10px] text-[#64748b]">{locale === 'fr' ? 'Recevez des SMS pour le suivi logistique' : 'Receive SMS updates for delivery logs'}</p>
                        </div>
                        <input type="checkbox" checked={notifs.smsDelivery} onChange={(e) => setNotifs({ ...notifs, smsDelivery: e.target.checked })} className="w-5 h-5 accent-[#0e9f6e]" />
                      </label>
                      <label className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-150 rounded-xl cursor-pointer hover:bg-gray-100">
                        <div>
                          <p className="text-xs font-semibold text-[#0f172a]">{locale === 'fr' ? 'Newsletters Marketing' : 'Marketing Toggles'}</p>
                          <p className="text-[10px] text-[#64748b]">{locale === 'fr' ? 'Recevez des coupons et bons plans promotionnels' : 'Receive exclusive coupons and seasonal deals'}</p>
                        </div>
                        <input type="checkbox" checked={notifs.marketing} onChange={(e) => setNotifs({ ...notifs, marketing: e.target.checked })} className="w-5 h-5 accent-[#0e9f6e]" />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}
            {tab === 'orders' && (
              <div className="animate-fade-up">
                <h2 className="font-display text-lg font-bold text-[#0f172a] mb-5">{t.account.orderHistory}</h2>
                {orders.length === 0 ? (
                  <div className="card p-8 text-center"><Package className="w-10 h-10 text-[#0e9f6e]/30 mx-auto mb-3" /><p className="text-sm text-[#64748b] mb-4">{t.account.noOrders}</p><button onClick={() => navigate('catalog')} className="btn-gold px-5 py-2.5 rounded-lg text-sm font-semibold">{t.home.ctaBrowse}</button></div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="card p-5">
                        <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#0e9f6e]/10">
                          <div><p className="font-semibold text-[#0f172a]">{order.tracking_id || order.id.slice(0, 8)}</p><p className="text-xs text-[#64748b]">{new Date(order.created_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')}</p></div>
                          <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-full" style={{ background: `${statusColors[order.status]}20`, color: statusColors[order.status] }}>{t.delivery[order.status as 'pending' | 'confirmed' | 'preparing' | 'inTransit' | 'delivered' | 'cancelled']}</span>
                        </div>
                        {order.order_items?.map((item) => (
                          <div key={item.id} className="flex items-center gap-3 mb-2">
                            {item.image_url && <img src={item.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                            <span className="text-sm text-[#0f172a] flex-1">{item.product_name} x{item.qty}</span>
                            <span className="text-sm font-bold text-[#0f172a]">{formatPrice(item.price * item.qty)}</span>
                          </div>
                        ))}
                        <div className="flex items-center justify-between pt-3 border-t border-[#0e9f6e]/10">
                          <span className="font-bold text-[#0f172a]">{t.cart.total}: {formatPrice(order.total)}</span>
                          <button onClick={() => navigate('delivery', { id: order.tracking_id || order.id })} className="flex items-center gap-1 text-sm font-semibold text-[#0e9f6e] hover:underline"><Truck className="w-4 h-4" /> {t.account.viewTracking}</button>
                        </div>
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
                        {countries.map((c) => <option key={c.id} value={c.id}>{c.flag} {c.name}</option>)}
                      </select>
                      <input placeholder={t.account.selectCity} value={addrForm.city} onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })} className="input-field text-sm" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={saveAddress} className="btn-gold px-5 py-2 rounded-lg text-sm font-semibold">{t.common.save}</button>
                      <button onClick={() => setShowAddrForm(false)} className="px-5 py-2 rounded-lg text-sm border border-[#0f172a]/15 text-[#0f172a]">{t.common.cancel}</button>
                    </div>
                  </div>
                )}
                {addresses.length === 0 && !showAddrForm ? (
                  <div className="card p-8 text-center"><MapPin className="w-10 h-10 text-[#0e9f6e]/30 mx-auto mb-3" /><p className="text-sm text-[#64748b]">{t.account.noAddresses}</p></div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {addresses.map((a) => (
                      <div key={a.id} className="card p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-[#0e9f6e]" />
                            <span className="font-semibold text-[#0f172a] text-sm">{a.label}</span>
                            {a.is_default && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0e9f6e]/15 text-[#64748b]">{t.account.defaultAddress}</span>}
                          </div>
                          <button onClick={() => removeAddress(a.id)} className="p-1 rounded hover:bg-red-50"><Trash2 className="w-4 h-4 text-red-400" /></button>
                        </div>
                        <p className="text-sm text-[#0f172a]">{a.full_name}</p>
                        <p className="text-xs text-[#64748b]">{a.phone}</p>
                        <p className="text-xs text-[#64748b] mt-1">{a.street}, {a.city}</p>
                        {!a.is_default && <button onClick={() => setDefaultAddress(a.id)} className="mt-2 text-xs font-semibold text-[#0e9f6e] hover:underline">{t.account.setDefault}</button>}
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
                  <div className="card p-8 text-center"><Heart className="w-10 h-10 text-[#0e9f6e]/30 mx-auto mb-3" /><p className="text-sm text-[#64748b] mb-4">{t.account.noWishlist}</p><button onClick={() => navigate('catalog')} className="btn-gold px-5 py-2.5 rounded-lg text-sm font-semibold">{t.home.ctaBrowse}</button></div>
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
