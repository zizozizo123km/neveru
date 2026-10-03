
import React, { useState, useRef } from 'react';
import { Category, UserRole } from '../types';
import { auth, db } from '../services/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { 
  ShoppingBag, Store, Bike, MapPin, ArrowRight, Loader2, Phone, Lock, 
  User, Mail, ChevronLeft, ChevronDown, AlertCircle, CheckCircle2, 
  Upload, Camera, X, Navigation, Info 
} from 'lucide-react';
import { getWilayaFromCoordinates, ALGERIA_WILAYAS, BIR_EL_ATER_CENTER } from '../utils/helpers';

interface AuthScreenProps {
  onLogin: (role: UserRole, name?: string) => void;
}

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

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationNotice, setLocationNotice] = useState('');
  const [isGpsDetected, setIsGpsDetected] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    password: '', 
    storeImage: '',
    coords: null as {lat: number, lng: number} | null,
    wilaya: ''
  });
  const [error, setError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setAuthMode('LOGIN');
    setError('');
    setLocationNotice('');
  };

  const handleBack = () => {
    setSelectedRole(null);
    setFormData({ name: '', email: '', phone: '', password: '', storeImage: '', coords: null, wilaya: '' });
    setError('');
    setLocationNotice('');
    setIsGpsDetected(false);
  };

  const handleSelectWilaya = (wilayaName: string) => {
    const found = ALGERIA_WILAYAS.find(w => w.name === wilayaName);
    if (found) {
      setFormData(prev => ({ 
        ...prev, 
        wilaya: found.name, 
        coords: { lat: found.lat, lng: found.lng } 
      }));
      setError('');
      setLocationNotice('');
      setIsGpsDetected(false);
    } else {
      setFormData(prev => ({ ...prev, wilaya: '', coords: null }));
    }
  };

  const handleGetLocation = () => {
    setIsLocating(true);
    setError('');
    setLocationNotice('');
    
    if (!("geolocation" in navigator)) {
      setIsLocating(false);
      setLocationNotice("متصفحك لا يدعم نظام GPS. يمكنك اختيار ولايتك مباشرة من القائمة أدناه.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const detectedCoords = { lat: position.coords.latitude, lng: position.coords.longitude };
        const detectedWilaya = getWilayaFromCoordinates(detectedCoords);
        setFormData(prev => ({ 
          ...prev, 
          coords: detectedCoords,
          wilaya: detectedWilaya
        }));
        setIsGpsDetected(true);
        setIsLocating(false);
        setLocationNotice(`تم تحديد موقعك بدقة عبر GPS (ولاية: ${detectedWilaya}) ✓`);
      },
      (geoError) => {
        setIsLocating(false);
        setIsGpsDetected(false);
        // Note specifically about Android overlay / floating bubble issue
        setLocationNotice(
          "تعذر الوصول لـ GPS تلقائياً. لا مشكلة! يمكنك اختيار ولايتك مباشرة وبكل سهولة من القائمة أدناه. (ملاحظة: إذا ظهر لك تنبيه إغلاق الفقاعات في شاشة هاتفك، أغلق فقاعات ماسنجر أو الأشرطة العائمة إذا أردت استخدام GPS)."
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const url = await uploadImage(file);
      if (url) setFormData(prev => ({ ...prev, storeImage: url }));
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (authMode === 'REGISTER') {
      if (!formData.wilaya) {
        setError('يرجى اختيار ولايتك من القائمة لتحديد نطاق التوصيل.');
        return;
      }
      if (!formData.name.trim() || !formData.phone.trim() || !formData.email.trim() || !formData.password.trim()) {
        setError('يرجى ملء كافة البيانات المطلوبة.');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (authMode === 'REGISTER') {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email.trim(), formData.password);
        const user = userCredential.user;

        const dbPath = selectedRole === UserRole.CUSTOMER ? 'customers' : selectedRole === UserRole.STORE ? 'stores' : 'drivers';
        
        let finalCoords = formData.coords;
        if (!finalCoords && formData.wilaya) {
          const found = ALGERIA_WILAYAS.find(w => w.name === formData.wilaya);
          finalCoords = found ? { lat: found.lat, lng: found.lng } : BIR_EL_ATER_CENTER;
        }

        const profileData: any = {
            id: user.uid,
            name: formData.name.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            role: selectedRole,
            createdAt: Date.now(),
            coordinates: finalCoords || BIR_EL_ATER_CENTER,
            wilaya: formData.wilaya
        };

        if (selectedRole === UserRole.STORE) {
            profileData.category = Category.FOOD;
            profileData.image = formData.storeImage || `https://picsum.photos/400/300?random=${user.uid.slice(0,5)}`;
            profileData.rating = 0;
            profileData.reviewCount = 0;
            profileData.isVerified = false;
        }

        await set(ref(db, `${dbPath}/${user.uid}`), profileData);
        onLogin(selectedRole!, formData.name.trim());
      } else {
        await signInWithEmailAndPassword(auth, formData.email.trim(), formData.password);
        onLogin(selectedRole || UserRole.CUSTOMER);
      }
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') setError('هذا البريد الإلكتروني مسجل مسبقاً.');
      else if (err.code === 'auth/weak-password') setError('كلمة المرور ضعيفة (يجب أن تتكون من 6 أحرف على الأقل).');
      else if (err.code === 'auth/invalid-email') setError('صيغة البريد الإلكتروني غير صحيحة.');
      else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') setError('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
      else setError('حدث خطأ أثناء المعالجة: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedRole) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-4 relative overflow-hidden font-cairo text-right" dir="rtl">
        <div className="z-10 text-center mb-12 animate-fade-in-up">
          <div className="bg-gradient-to-br from-orange-400 to-orange-600 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-2xl rotate-3">
            <span className="text-white text-5xl font-black">K</span>
          </div>
          <h1 className="text-6xl font-black text-white mb-2 tracking-tighter">كيمو</h1>
          <p className="text-slate-400 font-bold">خدمة توصيل تغطي 58 ولاية جزائرية</p>
        </div>
        <div className="grid grid-cols-1 gap-4 w-full max-w-sm z-10">
          <RoleCard icon={<ShoppingBag/>} title="أنا زبون" desc="اطلب من متاجر ولايتك" onClick={() => handleRoleSelect(UserRole.CUSTOMER)} />
          <RoleCard icon={<Store/>} title="أنا متجر" desc="اعرض منتجاتك لزبائن مدينتك" onClick={() => handleRoleSelect(UserRole.STORE)} />
          <RoleCard icon={<Bike/>} title="أنا موصل" desc="خدم في منطقتك بكل حرية" onClick={() => handleRoleSelect(UserRole.DRIVER)} />
        </div>
      </div>
    );
  }

  const isRegisterDisabled = authMode === 'REGISTER' && (!formData.wilaya || !formData.name || !formData.phone || !formData.email || !formData.password);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 font-cairo text-right" dir="rtl">
      <div className="w-full max-w-md animate-scale-up">
        <button onClick={handleBack} className="flex items-center gap-2 text-slate-400 font-bold mb-6 text-sm hover:text-slate-600 transition-colors"><ChevronLeft className="w-4 h-4 rotate-180" /> رجوع للخلف</button>
        <h2 className="text-4xl font-black text-slate-800 mb-2">{authMode === 'LOGIN' ? 'تسجيل دخول' : 'إنشاء حساب'}</h2>
        <p className="text-slate-500 mb-8 font-bold">أهلاً بك في كيمو - قسم {selectedRole === UserRole.STORE ? 'المتاجر' : selectedRole === UserRole.DRIVER ? 'الموصلين' : 'الزبائن'}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-xs font-black border border-red-100 flex items-center gap-2 animate-pulse"><AlertCircle size={16}/> {error}</div>}

          {authMode === 'REGISTER' && (
            <>
              {selectedRole === UserRole.STORE && (
                <div className="flex flex-col items-center mb-6">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 rounded-[2rem] bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer overflow-hidden relative group hover:border-orange-500 transition-all"
                  >
                    {formData.storeImage ? <img src={formData.storeImage} className="w-full h-full object-cover" /> : <Camera className="text-slate-300 group-hover:text-orange-500 transition-colors" />}
                    {isUploading && <div className="absolute inset-0 bg-white/60 flex items-center justify-center"><Loader2 className="animate-spin text-orange-500" /></div>}
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                  <p className="text-[10px] text-slate-400 mt-2 font-black uppercase tracking-widest">تحميل شعار المتجر</p>
                </div>
              )}

              {/* اختيار الولاية يدوياً مع إمكانية GPS */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-700">
                  الولاية التابع لها <span className="text-orange-500">*</span>
                </label>

                <div className="relative">
                  <select
                    value={formData.wilaya}
                    onChange={(e) => handleSelectWilaya(e.target.value)}
                    className="w-full p-4 pr-12 pl-10 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-orange-500 font-bold transition-all shadow-sm appearance-none text-slate-800 text-sm cursor-pointer"
                  >
                    <option value="">-- اختر ولايتك من القائمة (58 ولاية) --</option>
                    {ALGERIA_WILAYAS.map((w) => (
                      <option key={w.id} value={w.name}>
                        {w.id} - ولاية {w.name}
                      </option>
                    ))}
                  </select>
                  <MapPin className="absolute right-4 top-4 text-orange-500 w-5 h-5 pointer-events-none" />
                  <ChevronDown className="absolute left-4 top-4 text-slate-400 w-5 h-5 pointer-events-none" />
                </div>

                {/* زر GPS التلقائي الاختياري */}
                <button 
                  type="button" 
                  onClick={handleGetLocation} 
                  disabled={isLocating}
                  className="w-full py-2.5 px-4 rounded-xl border border-dashed border-orange-200 bg-orange-50/70 hover:bg-orange-100 text-orange-600 text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  {isLocating ? <Loader2 className="animate-spin w-4 h-4 text-orange-600" /> : <Navigation className="w-4 h-4 text-orange-600" />}
                  <span>{isLocating ? 'جاري تحديد موقعك عبر GPS...' : 'أو تحديد الولاية تلقائياً عبر GPS'}</span>
                </button>

                {locationNotice && (
                  <div className={`p-3 rounded-xl text-xs font-bold flex items-start gap-2 ${isGpsDetected ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
                    {isGpsDetected ? <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600 mt-0.5" /> : <Info className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />}
                    <span>{locationNotice}</span>
                  </div>
                )}
              </div>

              <div className="relative">
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-4 pr-12 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-orange-500 font-bold transition-all shadow-sm" placeholder="الاسم الكامل" />
                <User className="absolute right-4 top-4 text-slate-300 w-5 h-5" />
              </div>

              <div className="relative">
                <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-4 pr-12 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-orange-500 font-bold transition-all shadow-sm" placeholder="رقم الهاتف" />
                <Phone className="absolute right-4 top-4 text-slate-300 w-5 h-5" />
              </div>
            </>
          )}

          <div className="relative">
            <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-4 pr-12 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-orange-500 font-bold transition-all shadow-sm" placeholder="البريد الإلكتروني" />
            <Mail className="absolute right-4 top-4 text-slate-300 w-5 h-5" />
          </div>

          <div className="relative">
            <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full p-4 pr-12 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-orange-500 font-bold transition-all shadow-sm" placeholder="كلمة المرور" />
            <Lock className="absolute right-4 top-4 text-slate-300 w-5 h-5" />
          </div>

          <button 
            type="submit" 
            disabled={isLoading || isUploading || isRegisterDisabled} 
            className="w-full bg-[#2B2F3B] text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-slate-900/10 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-900"
          >
            {isLoading ? <Loader2 className="animate-spin mx-auto" /> : (authMode === 'LOGIN' ? 'دخول' : 'بدء الاستخدام في كيمو')}
          </button>

          <button type="button" onClick={() => { setAuthMode(authMode === 'LOGIN' ? 'REGISTER' : 'LOGIN'); setError(''); setLocationNotice(''); }} className="w-full text-center text-slate-400 text-sm font-bold pt-4 hover:text-orange-500 transition-colors">
            {authMode === 'LOGIN' ? 'جديد في كيمو؟ سجل حسابك الحقيقي هنا' : 'لديك حساب؟ سجل دخولك'}
          </button>
        </form>
      </div>
    </div>
  );
};

const RoleCard = ({ icon, title, desc, onClick }: any) => (
  <button onClick={onClick} className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-[2.5rem] text-right flex items-center gap-5 hover:bg-slate-800/80 transition-all active:scale-95 group">
    <div className="w-16 h-16 bg-orange-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/20 group-hover:rotate-6 transition-transform">
      {React.cloneElement(icon, { size: 32 })}
    </div>
    <div>
      <h3 className="text-xl font-black text-white leading-none mb-1.5">{title}</h3>
      <p className="text-slate-400 text-[11px] font-bold">{desc}</p>
    </div>
  </button>
);
