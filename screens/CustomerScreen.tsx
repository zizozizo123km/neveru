
import React, { useState, useEffect, useRef } from 'react';
import { Category, Product, StoreProfile, OrderStatus, Order, Coordinates } from '../types';
import { formatCurrency } from '../utils/helpers';
import { db, auth } from '../services/firebase';
import { ref, onValue, push, set, update, off } from 'firebase/database';
import { 
  Search, Plus, Minus, ShoppingCart, MapPin, Loader2, Home, User, 
  Camera, LogOut, ClipboardList, Trash2, Star, ShieldCheck, 
  LayoutGrid, Save, RefreshCw, Phone, Sparkles, Navigation, X, Bot, Send,
  ChevronLeft, ShoppingBag, Heart, Filter, CheckCircle2, Layout, Bike, PhoneCall,
  Clock, Map as MapIcon, Timer, Truck, ArrowRight, CheckCircle, Edit3, ShoppingBasket,
  Utensils, Shirt, Smartphone, Briefcase, BabyIcon, MessageSquareQuote, FileText
} from 'lucide-react';
import { MapVisualizer } from '../components/MapVisualizer';
import { RatingModal } from '../components/RatingModal';

const uploadImage = async (file: File): Promise<string | null> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "makemm");
  const cloudName = 'dkqxgwjnr';
  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    return data.secure_url || null;
  } catch (error) { 
    console.error("Cloudinary Error:", error);
    return null; 
  }
};

export const CustomerScreen: React.FC<{onLogout: () => void, userName: string}> = ({ onLogout, userName }) => {
  const [activeTab, setActiveTab] = useState<'HOME' | 'CATEGORIES' | 'ORDERS' | 'PROFILE'>('HOME');
  const [cart, setCart] = useState<{product: Product; quantity: number}[]>([]);
  const [isOrdering, setIsOrdering] = useState(false);
  const [stores, setStores] = useState<StoreProfile[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [ratingOrder, setRatingOrder] = useState<Order | null>(null);
  const [driverLiveCoords, setDriverLiveCoords] = useState<Coordinates | null>(null);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({ name: '', phone: '', avatar: '', coordinates: null as any, wilaya: '' });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  
  const isUpdatingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    
    const userProfileRef = ref(db, `customers/${user.uid}`);
    onValue(userProfileRef, (snap) => {
      if (snap.exists() && !isUpdatingRef.current) {
        const data = snap.val();
        setProfileData({ 
          name: data.name || '', 
          phone: data.phone || '',
          avatar: data.avatar || '',
          coordinates: data.coordinates || null,
          wilaya: data.wilaya || ''
        });
      }
    });

    onValue(ref(db, 'stores'), (snap) => {
      const data = snap.val();
      if (data) setStores(Object.keys(data).map(k => ({ id: k, ...data[k] })));
    });

    onValue(ref(db, 'products'), (snap) => {
      const data = snap.val();
      if (data) {
        const list = Object.keys(data).map(k => ({ id: k, ...data[k] })).filter(p => p.storeId && p.name && p.price !== undefined);
        setAllProducts(list);
      }
      setLoading(false);
    });

    onValue(ref(db, 'orders'), (snap) => {
      const data = snap.val();
      const list: Order[] = [];
      if (data) Object.keys(data).forEach(k => { if (data[k].customerId === user.uid) list.push({ id: k, ...data[k] }); });
      setMyOrders(list.sort((a, b) => b.timestamp - a.timestamp));
      if (trackingOrder) {
        const updated = list.find(o => o.id === trackingOrder.id);
        if (updated) setTrackingOrder(updated);
      }
    });
  }, [user, trackingOrder]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user) {
      isUpdatingRef.current = true;
      const localPreviewUrl = URL.createObjectURL(file);
      setProfileData(prev => ({ ...prev, avatar: localPreviewUrl }));
      setIsUploadingAvatar(true);
      
      try {
        const remoteUrl = await uploadImage(file);
        if (remoteUrl) {
          await update(ref(db, `customers/${user.uid}`), { avatar: remoteUrl });
          setProfileData(prev => ({ ...prev, avatar: remoteUrl }));
          setTimeout(() => { isUpdatingRef.current = false; }, 4000);
        } else {
          isUpdatingRef.current = false;
        }
      } catch (err) {
        isUpdatingRef.current = false;
      } finally {
        setIsUploadingAvatar(false);
      }
    }
  };

  const handleUpdateProfile = async () => {
    if (!user || !profileData.name) return;
    setIsUpdating(true);
    isUpdatingRef.current = true;
    try {
      await update(ref(db, `customers/${user.uid}`), { 
        name: profileData.name, 
        phone: profileData.phone,
        avatar: profileData.avatar
      });
      setIsEditingProfile(false);
      alert("تم حفظ البيانات بنجاح ✓");
      setTimeout(() => { isUpdatingRef.current = false; }, 3000);
    } catch (e) {
      isUpdatingRef.current = false;
      alert("فشل تحديث البيانات");
    } finally {
      setIsUpdating(false);
    }
  };

  const addToCart = (p: Product) => {
    setCart(prev => {
      const ex = prev.find(i => i.product.id === p.id);
      if (ex) return prev.map(i => i.product.id === p.id ? {...i, quantity: i.quantity + 1} : i);
      return [...prev, { product: p, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.map(i => i.product.id === id ? {...i, quantity: i.quantity - 1} : i).filter(i => i.quantity > 0));
  };

  const filteredProducts = allProducts
    .filter(p => {
        const store = stores.find(s => s.id === p.storeId);
        return store && store.wilaya === profileData.wilaya;
    })
    .filter(p => !selectedCategory || p.category === selectedCategory)
    .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white space-y-4">
      <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center animate-bounce">
        <ShoppingBasket className="text-orange-500 w-8 h-8" />
      </div>
      <p className="font-black text-slate-400 text-sm animate-pulse">جاري جلب أفضل العروض في ولايتك...</p>
    </div>
  );

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-40 font-cairo text-right" dir="rtl">
      <header className="bg-white sticky top-0 z-[100] px-4 pt-4 pb-2 shadow-sm border-b border-slate-100">
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
                <MapPin className="text-orange-500 w-4 h-4" />
                <span className="text-[11px] font-black text-slate-800">توصيل إلى: {profileData.wilaya || 'جاري التحديد...'}</span>
            </div>
            <div className="relative cursor-pointer" onClick={() => { if(cart.length > 0) setShowCheckout(true); }}>
                <ShoppingCart className="w-5 h-5 text-slate-700" />
                {cart.length > 0 && <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white">{cart.length}</span>}
            </div>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <input 
              type="text" 
              placeholder={`ابحث عن منتج في ${profileData.wilaya}...`} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F3F4F6] border-none rounded-full py-2.5 pr-10 pl-4 text-xs font-bold outline-none"
            />
            <Search className="absolute right-3.5 top-2.5 w-4 h-4 text-slate-400" />
          </div>
        </div>
        <div className="flex gap-5 overflow-x-auto no-scrollbar py-1 px-1">
          {['الكل', ...Object.values(Category)].map((cat) => (
            <button key={cat} onClick={() => { setSelectedCategory(cat === 'الكل' ? null : cat); setActiveTab('HOME'); }} className={`whitespace-nowrap text-xs font-black pb-2 transition-all relative ${(!selectedCategory && cat === 'الكل') || selectedCategory === cat ? 'text-[#FF6000]' : 'text-slate-400'}`}>
              {cat}
              {((!selectedCategory && cat === 'الكل') || selectedCategory === cat) && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#FF6000] rounded-full"></div>}
            </button>
          ))}
        </div>
      </header>

      <main className="p-3 max-w-lg mx-auto">
        {activeTab === 'HOME' && (
          <div className="animate-fade-in-up">
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {filteredProducts.map((p) => {
                    const cartItem = cart.find(i => i.product.id === p.id);
                    return (
                      <div key={p.id} className="bg-white rounded-2xl overflow-hidden shadow-sm flex flex-col relative group border border-slate-50 transition-all hover:shadow-md">
                        <div className="relative h-40 overflow-hidden bg-slate-50">
                          {p.image ? (
                            <img src={p.image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300"><ShoppingBag /></div>
                          )}
                        </div>
                        <div className="p-3 flex-1 flex flex-col">
                          <h4 className="text-[11px] font-bold text-slate-800 line-clamp-1 mb-1 leading-tight">{p.name}</h4>
                          <div className="mt-auto flex justify-between items-center">
                              <span className="text-orange-600 font-black text-sm">{formatCurrency(p.price)}</span>
                              <button onClick={() => addToCart(p)} className="w-8 h-8 rounded-full border border-slate-100 bg-white flex items-center justify-center text-orange-500 shadow-sm active:scale-90 transition-all"><Plus size={16} /></button>
                          </div>
                        </div>
                        {cartItem && <div className="absolute top-2 right-2 bg-orange-500 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-lg animate-scale-up">{cartItem.quantity}</div>}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                   <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <Search className="text-slate-300 w-10 h-10" />
                   </div>
                   <h3 className="font-black text-slate-800 text-lg mb-1">لا توجد متاجر في {profileData.wilaya} حالياً</h3>
                   <p className="text-slate-400 text-xs font-bold px-10">كيمو يتوسع باستمرار في كافة الولايات!</p>
                </div>
              )}
          </div>
        )}

        {activeTab === 'PROFILE' && (
            <div className="animate-fade-in-up">
              <div className="bg-white p-10 rounded-[3rem] shadow-sm text-center border border-slate-50 relative overflow-hidden">
                <div 
                  className="w-28 h-28 rounded-[2.2rem] border-4 border-white shadow-xl mx-auto mb-6 bg-slate-50 relative overflow-hidden group cursor-pointer"
                  onClick={() => !isUploadingAvatar && fileInputRef.current?.click()}
                >
                  {profileData.avatar ? (
                    <img src={profileData.avatar} className="w-full h-full object-cover" alt="Profile" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                      <User size={40} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="text-white w-6 h-6" />
                  </div>
                  {isUploadingAvatar && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                      <Loader2 className="animate-spin text-orange-500 w-6 h-6" />
                    </div>
                  )}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" />
                
                {!isEditingProfile ? (
                  <>
                    <h3 className="text-2xl font-black text-slate-800 mb-1">{profileData.name || userName}</h3>
                    <p className="text-xs text-orange-500 font-bold mb-8">ولاية: {profileData.wilaya}</p>
                    <div className="space-y-3">
                      <button onClick={() => setIsEditingProfile(true)} className="w-full bg-slate-100 py-4 rounded-2xl font-black text-slate-700 text-sm flex items-center justify-center gap-2 active:scale-95 transition-all">
                        <Edit3 size={18} /> تعديل الملف
                      </button>
                      <button onClick={onLogout} className="w-full bg-pink-50 py-4 rounded-2xl font-black text-pink-500 text-sm flex items-center justify-center gap-2 mt-6 active:scale-95 transition-all">
                        <LogOut size={18} /> خروج من كيمو
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4 text-right">
                    <input type="text" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-orange-500 transition-all" placeholder="الاسم" />
                    <input type="tel" value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-orange-500 transition-all" placeholder="الهاتف" />
                    <div className="flex gap-3">
                      <button onClick={handleUpdateProfile} disabled={isUpdating} className="flex-1 bg-black text-white py-4 rounded-2xl font-black text-sm active:scale-95 transition-all">
                        {isUpdating ? <Loader2 className="animate-spin mx-auto" /> : 'حفظ'}
                      </button>
                      <button onClick={() => setIsEditingProfile(false)} className="px-6 bg-slate-100 text-slate-400 py-4 rounded-2xl font-black">إلغاء</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 h-20 flex justify-around items-center px-4 z-[500] shadow-[0_-5px_20px_rgba(0,0,0,0.03)]">
        <NavBtn act={activeTab === 'HOME'} onClick={() => { setActiveTab('HOME'); setSelectedCategory(null); }} icon={<Home />} label="الرئيسية" />
        <NavBtn act={activeTab === 'CATEGORIES'} onClick={() => setActiveTab('CATEGORIES')} icon={<LayoutGrid />} label="الأقسام" />
        <NavBtn act={activeTab === 'ORDERS'} onClick={() => setActiveTab('ORDERS')} icon={<ClipboardList />} label="طلباتي" />
        <NavBtn act={activeTab === 'PROFILE'} onClick={() => setActiveTab('PROFILE')} icon={<User />} label="حسابي" />
      </nav>
    </div>
  );
};

const NavBtn = ({ act, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1.5 transition-all ${act ? 'text-[#FF6000]' : 'text-slate-400'}`}>
    <div className={`p-1 ${act ? 'scale-110' : 'scale-100'} transition-transform`}>{React.cloneElement(icon, { size: 22, strokeWidth: act ? 3 : 2 })}</div>
    <span className="text-[9px] font-black tracking-tighter">{label}</span>
  </button>
);
