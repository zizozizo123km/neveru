import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { Order, OrderStatus, User } from '../types';
import {
  Bike,
  Navigation,
  Phone,
  CheckCircle,
  Clock,
  MapPin,
  TrendingUp,
  DollarSign,
  AlertCircle
} from 'lucide-react';

interface DriverScreenProps {
  user: User;
  onOpenGpsModal: () => void;
}

export const DriverScreen: React.FC<DriverScreenProps> = ({ user, onOpenGpsModal }) => {
  const driverId = user.id || 'driver-1';
  const driverName = user.name || 'سائق كيمو';
  const driverPhone = user.phone || '0772334455';

  const [orders, setOrders] = useState<Order[]>([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  const loadData = () => {
    const all = storage.getOrders();
    setOrders(all);
  };

  useEffect(() => {
    loadData();
    const unsub = storage.subscribe('all', () => {
      loadData();
    });
    return () => unsub();
  }, []);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAcceptOrder = (orderId: string) => {
    storage.updateOrderStatus(orderId, OrderStatus.READY, {
      id: driverId,
      name: driverName,
      phone: driverPhone
    });
    showToast('تم قبول مهمة التوصيل! توجه إلى المتجر لاستلام الطلب.');
  };

  const handlePickUpOrder = (orderId: string) => {
    storage.updateOrderStatus(orderId, OrderStatus.PICKED_UP, {
      id: driverId,
      name: driverName,
      phone: driverPhone
    });
    showToast('تم تأكيد استلام الطلب من المحل! أنت الآن في الطريق للزبون.');
  };

  const handleDeliverOrder = (orderId: string) => {
    storage.updateOrderStatus(orderId, OrderStatus.DELIVERED, {
      id: driverId,
      name: driverName,
      phone: driverPhone
    });
    showToast('مبروك! تم تسليم الطلب للزبون بنجاح وتمت إضافة أرباح التوصيل.');
  };

  // Orders assigned to this driver
  const myDeliveries = orders.filter((o) => o.driverId === driverId);
  const myCompletedDeliveries = myDeliveries.filter((o) => o.status === OrderStatus.DELIVERED);
  const myActiveDeliveries = myDeliveries.filter((o) => o.status === OrderStatus.READY || o.status === OrderStatus.PICKED_UP);

  // Available orders for any driver to pick up (READY or ACCEPTED without assigned driver)
  const availableOrders = orders.filter(
    (o) =>
      !o.driverId &&
      (o.status === OrderStatus.READY || o.status === OrderStatus.ACCEPTED || o.status === OrderStatus.PREPARING)
  );

  const totalEarnings = myCompletedDeliveries.length * 150; // 150 DZD per delivery in Bir El Ater

  return (
    <div className="min-h-screen bg-slate-50 font-cairo pb-16">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-in fade-in duration-200">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-bold">{notification}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Bike className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900">{driverName}</h1>
                <p className="text-xs text-slate-500 font-bold mt-0.5 flex items-center gap-2">
                  <span>دراجة نارية (بئر العاتر)</span>
                  <span>•</span>
                  <span>📞 {driverPhone}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsAvailable(!isAvailable)}
                className={`py-2 px-4 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                  isAvailable
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                <span>{isAvailable ? 'جاهز للتوصيل' : 'غير متصل'}</span>
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
              <p className="text-[11px] font-black text-orange-700">الطلبات المكتملة</p>
              <h3 className="text-2xl font-black text-orange-950 mt-1">{myCompletedDeliveries.length}</h3>
              <p className="text-[10px] text-orange-600 font-bold">توصيلة ناجحة</p>
            </div>

            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
              <p className="text-[11px] font-black text-emerald-700">أرباح التوصيل</p>
              <h3 className="text-2xl font-black text-emerald-950 mt-1">
                {totalEarnings.toLocaleString()} <span className="text-xs font-bold">د.ج</span>
              </h3>
              <p className="text-[10px] text-emerald-600 font-bold">150 د.ج لكل توصيلة</p>
            </div>

            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
              <p className="text-[11px] font-black text-blue-700">توصيلات جارية</p>
              <h3 className="text-2xl font-black text-blue-950 mt-1">{myActiveDeliveries.length}</h3>
              <p className="text-[10px] text-blue-600 font-bold">قيد التنفيذ الآن</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Active Deliveries */}
        {myActiveDeliveries.length > 0 && (
          <div>
            <h2 className="text-lg font-black text-slate-900 mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              <span>مهماتك الحالية قيد التوصيل ({myActiveDeliveries.length})</span>
            </h2>

            <div className="space-y-4">
              {myActiveDeliveries.map((order) => {
                const isPickedUp = order.status === OrderStatus.PICKED_UP;

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-3xl border-2 border-orange-400 p-6 shadow-md space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-xs font-mono bg-orange-100 text-orange-700 px-2 py-0.5 rounded-md font-bold">
                          طلب #{order.id}
                        </span>
                        <h3 className="text-base font-black text-slate-900 mt-1">
                          استلام من: {order.storeName}
                        </h3>
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                          +150 د.ج أرباحك
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl">
                      <div>
                        <p className="text-slate-400 font-bold mb-1">المتجر / الاستلام:</p>
                        <p className="font-black text-slate-800">{order.storeName}</p>
                        <p className="text-slate-500">{order.storeLocation?.address || 'بئر العاتر'}</p>
                      </div>

                      <div>
                        <p className="text-slate-400 font-bold mb-1">الزبون / التسليم:</p>
                        <p className="font-black text-slate-800">{order.customerName}</p>
                        <p className="text-slate-500">{order.customerLocation?.address}</p>
                        <a
                          href={`tel:${order.customerPhone}`}
                          className="inline-flex items-center gap-1 text-orange-600 font-black mt-1"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>اتصل بالزبون ({order.customerPhone})</span>
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <p className="text-xs font-bold text-slate-500">
                        محتوى الطلب: {order.itemsSummary}
                      </p>

                      {!isPickedUp ? (
                        <button
                          onClick={() => handlePickUpOrder(order.id)}
                          className="py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs shadow-md"
                        >
                          تأكيد الاستلام من المحل
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDeliverOrder(order.id)}
                          className="py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs shadow-md"
                        >
                          تأكيد التسليم للزبون بنجاح
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Available Orders for Pickup */}
        <div>
          <h2 className="text-lg font-black text-slate-900 mb-3 flex items-center gap-2">
            <Bike className="w-5 h-5 text-orange-500" />
            <span>طلبات متاحة للاستلام في بئر العاتر ({availableOrders.length})</span>
          </h2>

          {availableOrders.length === 0 ? (
            <div className="bg-white p-12 rounded-[2.5rem] text-center border border-slate-100">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-base font-black text-slate-800">لا توجد طلبات معلقة حالياً</h3>
              <p className="text-xs text-slate-400 mt-1">
                عندما يطلب أي زبون من المتاجر، ستظهر المهمات هنا فوراً لتقوم بقبولها وتوصيلها!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {availableOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-400">#{order.id}</span>
                      <h4 className="font-black text-slate-900 text-sm">{order.storeName}</h4>
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                        جاهز للتوصيل
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1 font-bold">
                      <MapPin className="w-3.5 h-3.5 text-orange-500" />
                      <span>إلى الزبون: {order.customerLocation?.address}</span>
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium">
                      المحتويات: {order.itemsSummary}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-left">
                      <span className="text-xs font-black text-emerald-600 block">+150 د.ج</span>
                      <span className="text-[10px] text-slate-400">أجرة التوصيل</span>
                    </div>

                    <button
                      onClick={() => handleAcceptOrder(order.id)}
                      className="py-2.5 px-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-95 text-white font-black text-xs rounded-2xl shadow-md active:scale-95 transition-all"
                    >
                      قبول مهمة التوصيل
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
