
import React, { useState, useRef, useEffect } from 'react';
import { Category, Product, Order, OrderStatus, StoreProfile } from '../types';
import { db, auth } from '../services/firebase';
import { ref, push, set, onValue, remove, update } from 'firebase/database';
import { 
  Package, Plus, Upload, Loader2, Trash2, ArrowLeft, 
  ClipboardList, CheckCircle, Camera, LogOut, User, 
  RefreshCw, Phone, Tag, Sparkles, Wand2, Save, MapPin, Navigation,
  ChevronLeft, ShoppingBag, Star, LayoutGrid, Home, Edit3, Store, FileText, X
} from 'lucide-react';
import { formatCurrency } from '../utils/helpers';
import { generateProductDescription } from '../services/geminiService';

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
  } catch (error) { return null; }
};

export const StoreScreen: React.FC<{onLogout: () => void, userName: string}> = ({ onLogout, userName }) => {
  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'ORDERS' | 'PROFILE'>('PRODUCTS');
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [storeProfile, setStoreProfile] = useState<StoreProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfileData, setEditProfileData] = useState({ name: '', phone: '', image: '' });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false);
  const [isUploadingProductImage, setIsUploadingProductImage] = useState(false);
  
  const [newProduct, setNewProduct] = useState({ name: '', description: '', price: '', category: Category.FOOD, image: '' });
  
  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const productImgInputRef = useRef<HTMLInputElement>(null);
  const currentStoreId = auth.currentUser?.uid;

  useEffect(() => {
    if (!currentStoreId) return;
    onValue(ref(db, `stores/${currentStoreId}`), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setStoreProfile(data);
        if (!isEditingProfile) setEditProfileData({ name: data.name || '', phone: data.phone || '', image: data.image || '' });
      }
    });
    onValue(ref(db, 'products'), (snapshot) => {
      const data = snapshot.val();
      const list: Product[] = [];
      if (data) Object.keys(data).forEach(key => { if (data[key].storeId === currentStoreId) list.push({ ...data[key], id: key }); });
      setMyProducts(list.reverse());
    });
    onValue(ref(db, 'orders'), (snapshot) => {
      const data = snapshot.val();
      const list: Order[] = [];
      if (data) Object.keys(data).forEach(key => { if (data[key].storeId === currentStoreId) list.push({ ...data[key], id: key }); });
      setOrders(list.sort((a, b) => b.timestamp - a.timestamp));
      setLoading(false);
    });
  }, [currentStoreId]);

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditProfileData(prev => ({ ...prev, image: URL.createObjectURL(file) }));
      setIsUploadingProfileImage(true);
      const url = await uploadImage(file);
      if (url) {
        setEditProfileData(prev => ({ ...prev, image: url }));
        if (currentStoreId) await update(ref(db, `stores/${currentStoreId}`), { image: url });
      }
      setIsUploadingProfileImage(false);
    }
  };

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingProductImage(true);
      const url = await uploadImage(file);
      if (url) setNewProduct(prev => ({ ...prev, image: url }));
      setIsUploadingProductImage(false);
    }
  };

  const handleSaveProduct = async () => {
    if (!currentStoreId || !newProduct.name.trim() || !newProduct.price) {
      alert("يرجى إدخال اسم المنتج والسعر على الأقل.");
      return;
    }
    setIsSaving(true);
    try {
      await push(ref(db, 'products'), {
        storeId: currentStoreId,
        name: newProduct.name.trim(),
        description: newProduct.description.trim(),
        price: Number(newProduct.price),
        category: newProduct.category,
        image: newProduct.image || `https://picsum.photos/400/300?random=${Date.now()}`
      });
      setNewProduct({ name: '', description: '', price: '', category: Category.FOOD, image: '' });
      setIsAddingProduct(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAiGenerateDesc = async () => {
    if (!newProduct.name) return;
    setIsAiGenerating(true);
    const desc = await generateProductDescription(newProduct.name);
    if (desc) setNewProduct(prev => ({ ...prev, description: desc }));
    setIsAiGenerating(false);
  };

  const handleUpdateProfile = async () => {
    if (!currentStoreId || !editProfileData.name) return;
    setIsUpdatingProfile(true);
    await update(ref(db, `stores/${currentStoreId}`), { name: editProfileData.name, phone: editProfileData.phone, image: editProfileData.image });
    setIsEditingProfile(false);
    setIsUpdatingProfile(false);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-orange-500 w-12 h-12" /></div>;

  return (
    <div className="bg-[#F4F4F4] min-h-screen pb-32 font-cairo text-right" dir="rtl">
      <header className="bg-white sticky top-0 z-[100] px-6 pt-8 pb-4 shadow-sm flex items-center justify-between">
        <div>
           <h1 className="text-2xl font-black text-slate-800">كيمو متاجر</h1>
           <p className="text-[10px] text-orange-500 font-bold uppercase tracking-widest">{storeProfile?.name || userName} • ولاية {storeProfile?.wilaya}</p>
        </div>
        {activeTab === 'PRODUCTS' && !isAddingProduct && (
          <button onClick={() => setIsAddingProduct(true)} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-2xl shadow-lg font-black text-xs flex items-center gap-1.5 active:scale-95 transition-all">
            <Plus size={18} /> إضافة منتج
          </button>
        )}
      </header>

      <main className="p-4 max-w-lg mx-auto">
        {activeTab === 'PRODUCTS' && isAddingProduct && (
          <div className="bg-white p-6 rounded-[3rem] shadow-sm border border-slate-100 animate-fade-in-up mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-slate-800">خانة رفع منتج جديد</h3>
              <button onClick={() => setIsAddingProduct(false)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200"><X size={20}/></button>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col items-center">
                <div 
                  onClick={() => productImgInputRef.current?.click()}
                  className="w-32 h-32 rounded-[2rem] bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer overflow-hidden relative group hover:border-orange-500 transition-all shadow-sm"
                >
                  {newProduct.image ? <img src={newProduct.image} className="w-full h-full object-cover" /> : <div className="text-center p-2"><Camera className="w-8 h-8 text-slate-300 mx-auto mb-1 group-hover:text-orange-500 transition-colors" /><span className="text-[10px] font-black text-slate-400">صورة المنتج</span></div>}
                  {isUploadingProductImage && <div className="absolute inset-0 bg-white/70 flex items-center justify-center"><Loader2 className="animate-spin text-orange-500 w-6 h-6" /></div>}
                </div>
                <input type="file" ref={productImgInputRef} onChange={handleProductImageUpload} className="hidden" accept="image/*" />
                <p className="text-[10px] text-slate-400 mt-2 font-black uppercase tracking-widest">اضغط لرفع صورة المنتج</p>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">اسم المنتج <span className="text-orange-500">*</span></label>
                <input type="text" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-orange-500 font-bold transition-all text-sm" placeholder="مثال: بيتزا مارغريتا / قميص رجالي" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">السعر (دج) <span className="text-orange-500">*</span></label>
                  <input type="number" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-orange-500 font-bold transition-all text-sm" placeholder="1200" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">القسم</label>
                  <select value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value as Category})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-orange-500 font-bold transition-all text-sm cursor-pointer appearance-none">
                    {Object.values(Category).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-black text-slate-700">وصف المنتج</label>
                  <button type="button" onClick={handleAiGenerateDesc} disabled={!newProduct.name || isAiGenerating} className="text-xs text-orange-600 font-black flex items-center gap-1 hover:text-orange-700 disabled:opacity-40 cursor-pointer">
                    {isAiGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                    توليد وصف بالذكاء الاصطناعي
                  </button>
                </div>
                <textarea rows={3} value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-orange-500 font-bold transition-all text-sm resize-none" placeholder="اكتب وصفاً جذاباً للمنتج..." />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={handleSaveProduct} disabled={isSaving || isUploadingProductImage} className="flex-1 bg-black text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-black/10 active:scale-95 transition-all disabled:opacity-50 cursor-pointer">
                  {isSaving ? <Loader2 className="animate-spin mx-auto" /> : 'حفظ ونشر المنتج ✓'}
                </button>
                <button type="button" onClick={() => setIsAddingProduct(false)} className="px-6 bg-slate-100 text-slate-600 py-4 rounded-2xl font-black text-sm cursor-pointer">إلغاء</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'PRODUCTS' && !isAddingProduct && (
            <div className="space-y-4 animate-fade-in-up">
              {myProducts.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] p-16 text-center text-slate-300 border border-dashed border-slate-200 shadow-sm">
                  <Package className="w-16 h-16 mx-auto mb-4 opacity-10" />
                  <p className="font-black text-sm text-slate-400 mb-4">لا توجد منتجات معروضة حالياً</p>
                  <button onClick={() => setIsAddingProduct(true)} className="bg-orange-500 text-white px-6 py-3 rounded-2xl font-black text-xs shadow-lg">إضافة أول منتج</button>
                </div>
              ) : (
                myProducts.map(p => (
                  <div key={p.id} className="bg-white p-4 rounded-[2.5rem] shadow-sm border border-slate-50 flex gap-4 items-center group relative overflow-hidden">
                    <div className="w-24 h-24 rounded-[1.8rem] overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0"><img src={p.image} className="w-full h-full object-cover" /></div>
                    <div className="flex-1 text-right">
                      <h4 className="font-black text-slate-800 text-base mb-1">{p.name}</h4>
                      <div className="flex items-center justify-between"><span className="text-lg font-black text-orange-600">{formatCurrency(p.price)}</span><button onClick={() => remove(ref(db, `products/${p.id}`))} className="w-9 h-9 bg-red-50 text-red-400 rounded-xl flex items-center justify-center active:scale-90 transition-all"><Trash2 size={16}/></button></div>
                    </div>
                  </div>
                ))
              )}
            </div>
        )}

        {activeTab === 'PROFILE' && (
          <div className="animate-fade-in-up">
             <div className="bg-white p-10 rounded-[3rem] shadow-sm text-center border border-slate-50 relative overflow-hidden">
                <div 
                  className="w-28 h-28 rounded-[2.2rem] border-4 border-white shadow-xl mx-auto mb-6 bg-slate-50 relative overflow-hidden group cursor-pointer"
                  onClick={() => !isUploadingProfileImage && profileImageInputRef.current?.click()}
                >
                   {editProfileData.image ? <img src={editProfileData.image} className="w-full h-full object-cover" alt="Logo" /> : <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300"><Store size={40} /></div>}
                   <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="text-white w-6 h-6" /></div>
                   {isUploadingProfileImage && <div className="absolute inset-0 bg-white/60 flex items-center justify-center"><Loader2 className="animate-spin text-orange-500 w-6 h-6" /></div>}
                </div>
                <input type="file" ref={profileImageInputRef} onChange={handleProfileImageUpload} className="hidden" accept="image/*" />
                
                {!isEditingProfile ? (
                  <>
                    <h3 className="text-2xl font-black mb-1 text-slate-800">{storeProfile?.name || userName}</h3>
                    <p className="text-xs text-orange-500 font-bold mb-8">ولاية: {storeProfile?.wilaya}</p>
                    <div className="space-y-3">
                       <button onClick={() => setIsEditingProfile(true)} className="w-full bg-slate-100 py-4 rounded-2xl font-black text-slate-700 text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"><Edit3 size={18} /> تعديل المتجر</button>
                       <button onClick={onLogout} className="w-full bg-pink-50 py-4 rounded-2xl font-black text-pink-500 text-sm mt-6 active:scale-95 transition-all">خروج من كيمو</button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4 text-right">
                    <input type="text" value={editProfileData.name} onChange={e => setEditProfileData({...editProfileData, name: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-orange-500 transition-all" placeholder="اسم المتجر" />
                    <input type="tel" value={editProfileData.phone} onChange={e => setEditProfileData({...editProfileData, phone: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-orange-500 transition-all" placeholder="الهاتف" />
                    <div className="flex gap-3">
                       <button onClick={handleUpdateProfile} disabled={isUpdatingProfile} className="flex-1 bg-black text-white py-4 rounded-2xl font-black text-sm active:scale-95 transition-all">{isUpdatingProfile ? <Loader2 className="animate-spin mx-auto" /> : 'حفظ'}</button>
                       <button onClick={() => setIsEditingProfile(false)} className="px-6 bg-slate-100 text-slate-400 py-4 rounded-2xl font-black">إلغاء</button>
                    </div>
                  </div>
                )}
             </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 h-20 flex justify-around items-center px-4 z-[500]">
        <NavBtn act={activeTab === 'PRODUCTS'} onClick={() => setActiveTab('PRODUCTS')} icon={<LayoutGrid />} label="منتجاتي" />
        <NavBtn act={activeTab === 'ORDERS'} onClick={() => setActiveTab('ORDERS')} icon={<ClipboardList />} label="الطلبيات" />
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
