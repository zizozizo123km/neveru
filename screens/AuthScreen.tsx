import React, { useState } from 'react';
import { UserRole, LocationCoords, User } from '../types';
import { storage, BIR_EL_ATER_CENTER, BIR_EL_ATER_DISTRICTS } from '../services/storage';
import {
  Store,
  User as UserIcon,
  Bike,
  Navigation,
  CheckCircle,
  MapPin,
  Sparkles,
  Phone,
  ShieldCheck,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface AuthScreenProps {
  onLogin: (user: User) => void;
  onOpenGpsModal?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.STORE);

  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeCategory, setStoreCategory] = useState('وجبات سريعة');
  const [vehicleType, setVehicleType] = useState('دراجة نارية (Moto)');

  // GPS Location state for registration
  const [location, setLocation] = useState<LocationCoords>(BIR_EL_ATER_CENTER);
  const [isGpsDetected, setIsGpsDetected] = useState(false);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const requestGps = () => {
    if (!('geolocation' in navigator)) {
      setGpsError('متصفحك لا يدعم خاصية GPS.');
      return;
    }

    setIsDetectingGps(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(5));
        const lng = Number(pos.coords.longitude.toFixed(5));
        const accuracy = Math.round(pos.coords.accuracy);

        const newLoc: LocationCoords = {
          lat,
          lng,
          district: 'بئر العاتر (تحديد GPS)',
          address: `بئر العاتر - إحداثيات GPS (${lat}, ${lng}) دقة ±${accuracy}م`
        };

        setLocation(newLoc);
        setIsGpsDetected(true);
        setIsDetectingGps(false);
      },
      (err) => {
        setIsDetectingGps(false);
        setIsGpsDetected(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError('يرجى تفعيل صلاحية الوصول للموقع (GPS) في المتصفح أو اختيار الحي يدوياً.');
        } else {
          setGpsError('تعذر جلب موقع GPS، يمكنك اختيار الحي من القائمة أدناه.');
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('يرجى كتابة الاسم الكامل');
      return;
    }
    if (!phone.trim()) {
      alert('يرجى كتابة رقم الهاتف للتواصل');
      return;
    }

    const newUser = storage.register({
      name: name.trim(),
      phone: phone.trim(),
      role: selectedRole,
      storeName: selectedRole === UserRole.STORE ? storeName || name : undefined,
      storeCategory: selectedRole === UserRole.STORE ? storeCategory : undefined,
      vehicleType: selectedRole === UserRole.DRIVER ? vehicleType : undefined,
      location: location
    });

    onLogin(newUser);
  };

  const handleDemoLogin = (role: UserRole) => {
    const user = storage.loginDemo(role);
    onLogin(user);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-orange-950 font-cairo flex flex-col justify-center items-center p-4 py-12">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-8 border border-slate-100">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center font-black text-3xl mx-auto shadow-xl shadow-orange-500/30 mb-3">
            ك
          </div>
          <h1 className="text-2xl font-black text-slate-900">تطبيق كيمو | Kimo App</h1>
          <p className="text-xs text-slate-500 font-bold mt-1">
            منصة التوصيل المتكاملة في بئر العاتر
          </p>
        </div>

        {/* Quick Demo Access Bar (Instant entry for product upload test) */}
        <div className="bg-orange-50/80 border border-orange-200/80 rounded-2xl p-3.5 mb-6">
          <p className="text-[11px] font-black text-orange-900 mb-2.5 flex items-center gap-1.5 justify-center">
            <Sparkles className="w-3.5 h-3.5 text-orange-600" />
            الدخول التجريبي الفوري بنقرة واحدة:
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleDemoLogin(UserRole.STORE)}
              className="py-2.5 px-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-95 text-white rounded-xl text-[11px] font-black shadow-sm flex flex-col items-center gap-1 transition-all active:scale-95"
            >
              <Store className="w-4 h-4" />
              <span>صاحب متجر (رفع المنتجات)</span>
            </button>

            <button
              onClick={() => handleDemoLogin(UserRole.CUSTOMER)}
              className="py-2.5 px-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-[11px] font-bold shadow-sm flex flex-col items-center gap-1 transition-all active:scale-95"
            >
              <UserIcon className="w-4 h-4 text-orange-500" />
              <span>زبون (تصفح وطلب)</span>
            </button>

            <button
              onClick={() => handleDemoLogin(UserRole.DRIVER)}
              className="py-2.5 px-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-[11px] font-bold shadow-sm flex flex-col items-center gap-1 transition-all active:scale-95"
            >
              <Bike className="w-4 h-4 text-orange-500" />
              <span>سائق دراجة</span>
            </button>
          </div>
        </div>

        {/* Toggle Login vs Register */}
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
              mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            تسجيل الدخول
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
              mode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            إنشاء حساب جديد مع GPS
          </button>
        </div>

        {/* REGISTRATION FORM */}
        {mode === 'register' ? (
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Role Select */}
            <div>
              <label className="block text-xs font-black text-slate-700 mb-2">نوع الحساب</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { role: UserRole.STORE, label: 'متجر / مطعم', icon: Store },
                  { role: UserRole.CUSTOMER, label: 'زبون', icon: UserIcon },
                  { role: UserRole.DRIVER, label: 'سائق دراجة', icon: Bike }
                ].map((item) => (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => setSelectedRole(item.role)}
                    className={`py-2.5 px-2 rounded-xl text-xs font-black flex flex-col items-center gap-1 border transition-all ${
                      selectedRole === item.role
                        ? 'border-orange-500 bg-orange-50 text-orange-700 ring-2 ring-orange-200'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Name & Phone */}
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">الاسم الكامل</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: محمد البشير"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 px-4 text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">رقم الهاتف</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="06 / 05 / 07..."
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 px-4 text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Store specifics */}
            {selectedRole === UserRole.STORE && (
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">اسم المحل أو المطعم</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="مثال: مطعم الأندلس، بيتزا كوين..."
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 px-4 text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500"
                />
              </div>
            )}

            {/* GPS LOCATION BUTTON (Specifically requested in user prompt) */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-black text-slate-700 mb-1.5 flex items-center justify-between">
                <span>تحديد موقعك في بئر العاتر (GPS)</span>
                <span className="text-[10px] text-orange-600 font-bold">مطلوب للتسجيل</span>
              </label>

              <button
                type="button"
                onClick={requestGps}
                disabled={isDetectingGps}
                className={`w-full py-3 px-4 rounded-2xl text-xs font-black flex items-center justify-center gap-2 border transition-all ${
                  isGpsDetected
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200'
                }`}
              >
                {isDetectingGps ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري تفعيل الـ GPS والتحديد...</span>
                  </>
                ) : isGpsDetected ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>تم تحديد موقعك بدقة عبر GPS بنجاح!</span>
                  </>
                ) : (
                  <>
                    <Navigation className="w-4 h-4" />
                    <span>يرجى تفعيل صلاحية الوصول للموقع (GPS) للتسجيل</span>
                  </>
                )}
              </button>

              {gpsError && (
                <div className="mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-[11px] font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                  <span>{gpsError}</span>
                </div>
              )}

              {/* District manual select */}
              <div className="mt-2.5">
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  أو اختر الحي في بئر العاتر يدوياً:
                </label>
                <select
                  value={location.district}
                  onChange={(e) =>
                    setLocation({
                      ...location,
                      district: e.target.value,
                      address: `${e.target.value}، بئر العاتر`
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-800"
                >
                  {BIR_EL_ATER_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      📍 {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-4 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-orange-500/25 active:scale-95 transition-all"
            >
              إنشاء الحساب والبدء الآن
            </button>
          </form>
        ) : (
          /* QUICK LOGIN FORM */
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">رقم الهاتف المسجل</label>
              <input
                type="tel"
                placeholder="0661234567"
                defaultValue="0661234567"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-xs font-bold text-slate-800"
              />
            </div>

            <button
              type="button"
              onClick={() => handleDemoLogin(UserRole.STORE)}
              className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-orange-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Store className="w-5 h-5" />
              <span>دخول كصاحب متجر (رفع المنتجات)</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin(UserRole.CUSTOMER)}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2"
            >
              <UserIcon className="w-4 h-4 text-orange-500" />
              <span>دخول كزبون (تصفح وطلب)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
