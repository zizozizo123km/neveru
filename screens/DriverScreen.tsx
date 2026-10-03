
import React, { useState, useEffect, useRef } from 'react';
import { MapVisualizer } from '../components/MapVisualizer';
import { RatingModal } from '../components/RatingModal';
import { 
  MapPin, Navigation, CheckCircle, Clock, Loader2, Package, Bike, 
  ArrowRight, User, LogOut, Camera, Phone, RefreshCw, Save,
  ChevronLeft, ShoppingBag, Star, LayoutGrid, Home, X, Bot, Map as MapIcon,
  Store as StoreIcon, PhoneCall, Edit3, FileText
} from 'lucide-react';
import { db, auth } from '../services/firebase';
import { ref, onValue, update, off } from 'firebase/database';
import { Order, OrderStatus, Coordinates } from '../types';
import { formatCurrency } from '../utils/helpers';

export const DriverScreen: React.FC<{onLogout: () => void, userName: string}> = ({ onLogout, userName }) => {
  const [activeTab, setActiveTab] = useState<'AVAILABLE' | 'ACTIVE' | 'PROFILE'>('AVAILABLE');
  const [showRating, setShowRating] = useState(false);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [driverProfile, setDriverProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const currentDriverId = auth.currentUser?.uid;

  useEffect(() => {
    if (!currentDriverId) return;
    onValue(ref(db, `drivers/${currentDriverId}`), (snap) => {
      if (snap.exists()) setDriverProfile(snap.val());
    });
    onValue(ref(db, 'orders'), (snapshot) => {
        const data = snapshot.val();
        const available: Order[] = [];
        let myActive: Order | null = null;
        if (data) {
            Object.keys(data).forEach(key => {
                const order = { ...data[key], id: key } as Order;
                if (order.driverId === currentDriverId && order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.CANCELLED) myActive = order;
                if (order.status === OrderStatus.ACCEPTED_BY_STORE && !order.driverId && order.wilaya === driverProfile?.wilaya) available.push(order);
            });
        }
        setAvailableOrders(available);
        setActiveOrder(myActive);
        setLoading(false);
    });
  }, [currentDriverId, driverProfile?.wilaya]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-orange-500 w-12 h-12" /></div>;

  return (
    <div className="bg-[#F4F4F4] min-h-screen pb-32 font-cairo text-right" dir="rtl">
       <header className="bg-white sticky top-0 z-[100] px-6 pt-8 pb-4 shadow-sm">
          <h1 className="text-2xl font-black text-slate-800">كيمو موصلين</h1>
          <p className="text-[10px] text-orange-500 font-bold uppercase tracking-widest">{driverProfile?.name || userName} • ولاية {driverProfile?.wilaya}</p>
       </header>

       <main className="p-4 max-w-lg mx-auto">
         {activeTab === 'PROFILE' && (
             <div className="animate-fade-in-up">
                 <div className="bg-white p-10 rounded-[3rem] shadow-sm text-center border border-slate-50 overflow-hidden">
                    <div className="w-28 h-28 rounded-[2.2rem] border-4 border-white shadow-xl mx-auto mb-6 bg-slate-50 overflow-hidden">
                        {driverProfile?.avatar ? <img src={driverProfile.avatar} className="w-full h-full object-cover" alt="Driver" /> : <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300"><User size={40} /></div>}
                    </div>
                    <h3 className="text-2xl font-black mb-1 text-slate-800">{driverProfile?.name || userName}</h3>
                    <p className="text-xs text-orange-500 font-bold mb-8">موصل معتمد في ولاية: {driverProfile?.wilaya}</p>
                    <button onClick={onLogout} className="w-full bg-pink-50 py-4 rounded-2xl font-black text-pink-500 text-sm active:scale-95 transition-all">خروج من كيمو</button>
                 </div>
             </div>
         )}
         {activeTab === 'AVAILABLE' && (
           <div className="space-y-4 px-2">
              <h2 className="text-xl font-black text-slate-800">طلبات في {driverProfile?.wilaya}</h2>
              {availableOrders.length === 0 ? (
                <div className="bg-white p-16 rounded-[2.5rem] text-center text-slate-300"><Bike size={64} className="mx-auto opacity-10 mb-4"/><p className="font-black text-sm">لا توجد طلبات حالياً</p></div>
              ) : (
                availableOrders.map(o => (
                  <div key={o.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm mb-4">
                     <div className="flex justify-between items-start mb-2"><h4 className="font-black text-slate-800">{o.storeName}</h4><span className="font-black text-orange-600">{formatCurrency(o.totalPrice)}</span></div>
                     <p className="text-[11px] text-slate-500 mb-4">التوصيل إلى: {o.address}</p>
                     <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black">قبول الطلب</button>
                  </div>
                ))
              )}
           </div>
         )}
       </main>

       <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 h-20 flex justify-around items-center px-4 z-[500]">
         <NavBtn act={activeTab === 'AVAILABLE'} onClick={() => setActiveTab('AVAILABLE')} icon={<LayoutGrid />} label="طلبات عامة" />
         <NavBtn act={activeTab === 'ACTIVE'} onClick={() => setActiveTab('ACTIVE')} icon={<MapIcon />} label="المهمة" />
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
