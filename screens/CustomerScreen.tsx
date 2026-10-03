import React, { useState, useEffect } from 'react';
import { storage, PRODUCT_CATEGORIES, BIR_EL_ATER_DISTRICTS } from '../services/storage';
import { StoreProfile, Product, Order, OrderStatus, User, LocationCoords } from '../types';
import {
  Search,
  ShoppingBag,
  Star,
  Clock,
  MapPin,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  Navigation,
  ArrowRight,
  Sparkles,
  Phone
} from 'lucide-react';

interface CustomerScreenProps {
  user: User;
  onOpenGpsModal: () => void;
}

export const CustomerScreen: React.FC<CustomerScreenProps> = ({ user, onOpenGpsModal }) => {
  const [stores, setStores] = useState<StoreProfile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStore, setSelectedStore] = useState<StoreProfile | null>(null);

  // Cart State
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  const [customerAddress, setCustomerAddress] = useState(
    user.location?.address || `${BIR_EL_ATER_DISTRICTS[0]}، بئر العاتر`
  );
  const [customerPhone, setCustomerPhone] = useState(user.phone || '0665123456');

  // Customer Active Orders
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'browse' | 'orders'>('browse');
  const [notification, setNotification] = useState<string | null>(null);

  const loadData = () => {
    setStores(storage.getStores());
    setProducts(storage.getProducts());
    setMyOrders(storage.getOrders().filter(o => o.customerId === user.id || o.customerPhone === user.phone));
  };

  useEffect(() => {
    loadData();
    const unsub = storage.subscribe('all', () => {
      loadData();
    });
    return () => unsub();
  }, [user]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const addToCart = (product: Product) => {
    if (!product.isAvailable) {
      showToast('عذراً، هذا المنتج غير متوفر حالياً');
      return;
    }

    setCart((prev) => {
      // Check if item from another store
      if (prev.length > 0 && prev[0].product.storeId !== product.storeId) {
        if (!window.confirm('سلتك تحتوي على منتجات من متجر آخر. هل تريد إفراغ السلة وبدء طلب من هذا المتجر؟')) {
          return prev;
        }
        return [{ product, quantity: 1 }];
      }

      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });

    showToast(`تمت إضافة "${product.name}" إلى السلة`);
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQ = item.quantity + delta;
            return newQ > 0 ? { ...item, quantity: newQ } : null;
          }
          return item;
        })
        .filter(Boolean) as { product: Product; quantity: number }[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const cartTotalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const deliveryFee = cart.length > 0 ? 150 : 0;
  const cartTotalPrice = cartSubtotal + deliveryFee;

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const firstProduct = cart[0].product;
    const store = stores.find((s) => s.id === firstProduct.storeId);

    const newOrder = storage.createOrder({
      customerId: user.id || 'cust-' + Date.now(),
      customerName: user.name || 'زبون كيمو',
      customerPhone: customerPhone,
      customerLocation: {
        lat: user.location?.lat || 34.7505,
        lng: user.location?.lng || 7.8920,
        address: customerAddress,
        district: user.location?.district || 'بئر العاتر'
      },
      storeId: firstProduct.storeId,
      storeName: store?.name || firstProduct.storeName,
      items: cart.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        image: item.product.image
      })),
      itemsTotal: cartSubtotal,
      deliveryFee: deliveryFee,
      notes: orderNotes
    });

    setCart([]);
    setIsCartOpen(false);
    setActiveTab('orders');
    showToast(`تم إرسال طلبك بنجاح! رقم الطلب: #${newOrder.id}`);
  };

  // Products to display: if a store is selected, show that store's products; otherwise filter all products
  const displayedProducts = (selectedStore
    ? products.filter((p) => p.storeId === selectedStore.id)
    : products
  ).filter((p) => {
    const matchesCat = selectedCategory === 'الكل' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.storeName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 font-cairo pb-24">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-in fade-in duration-200">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-bold">{notification}</span>
        </div>
      )}

      {/* Main Top Banner */}
      <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 text-white py-8 px-6 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-white/20 backdrop-blur-md text-white text-xs font-black px-3 py-1 rounded-full">
                🚀 توصيل سريع وموثوق
              </span>
              <span className="bg-amber-400 text-slate-950 text-xs font-black px-3 py-1 rounded-full">
                بئر العاتر
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black leading-tight">
              أفضل مطاعم ومتاجر بئر العاتر تصلك أينما كنت
            </h1>
            <p className="text-orange-100 text-xs md:text-sm font-bold mt-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-200" />
              <span>موقع التوصيل: {user.location?.address || 'وسط المدينة، بئر العاتر'}</span>
              <button
                onClick={onOpenGpsModal}
                className="underline text-amber-300 hover:text-white font-black text-xs mr-2"
              >
                (تغيير أو تحديد عبر GPS)
              </button>
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex bg-white/20 backdrop-blur-md p-1.5 rounded-2xl gap-2 self-stretch md:self-auto">
            <button
              onClick={() => setActiveTab('browse')}
              className={`flex-1 md:flex-initial py-2.5 px-6 rounded-xl font-black text-xs transition-all ${
                activeTab === 'browse' ? 'bg-white text-orange-600 shadow-md' : 'text-white hover:bg-white/10'
              }`}
            >
              تصفح والطلب
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-1 md:flex-initial py-2.5 px-6 rounded-xl font-black text-xs transition-all relative ${
                activeTab === 'orders' ? 'bg-white text-orange-600 shadow-md' : 'text-white hover:bg-white/10'
              }`}
            >
              طلباتي النشطة
              {myOrders.length > 0 && (
                <span className="mr-1.5 bg-amber-400 text-slate-900 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                  {myOrders.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        {/* ================= BROWSE TAB ================= */}
        {activeTab === 'browse' && (
          <>
            {/* Search and Categories */}
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن وجبة، بيتزا، شاورما، حليب، أو اسم المتجر..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 pr-11 text-sm font-bold text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white"
                />
                <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-3.5" />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setSelectedCategory('الكل')}
                  className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                    selectedCategory === 'الكل'
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  الكل
                </button>
                {PRODUCT_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Stores Showcase Carousel */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <span>متاجر ومطاعم بئر العاتر</span>
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                    {stores.length}
                  </span>
                </h2>
                {selectedStore && (
                  <button
                    onClick={() => setSelectedStore(null)}
                    className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1"
                  >
                    عرض كل المتاجر
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {stores.map((store) => {
                  const isSelected = selectedStore?.id === store.id;
                  const storeProductsCount = products.filter((p) => p.storeId === store.id).length;

                  return (
                    <div
                      key={store.id}
                      onClick={() => setSelectedStore(isSelected ? null : store)}
                      className={`cursor-pointer rounded-3xl overflow-hidden border transition-all duration-200 bg-white ${
                        isSelected
                          ? 'border-orange-500 ring-2 ring-orange-400/40 shadow-lg'
                          : 'border-slate-100 hover:border-slate-200 hover:shadow-md'
                      }`}
                    >
                      <div className="relative h-32 bg-slate-100">
                        <img
                          src={store.banner}
                          alt={store.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent" />
                        <div className="absolute bottom-3 right-3 text-white">
                          <h3 className="font-black text-base drop-shadow-sm">{store.name}</h3>
                          <p className="text-[11px] text-slate-200 font-bold drop-shadow-sm">
                            {store.category} • {store.address}
                          </p>
                        </div>
                        <div className="absolute top-3 left-3 bg-white/95 text-slate-900 text-[10px] font-black px-2 py-1 rounded-xl flex items-center gap-1 shadow-sm">
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          <span>{store.rating}</span>
                        </div>
                      </div>

                      <div className="p-3.5 flex items-center justify-between text-xs font-bold text-slate-500 bg-slate-50/50">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-orange-500" />
                          {store.deliveryTime}
                        </span>
                        <span className="text-orange-600 font-black">
                          {storeProductsCount} منتج معروض
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Products Grid (Newly uploaded products appear here immediately!) */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    {selectedStore ? `قائمة منتجات: ${selectedStore.name}` : 'جميع المنتجات المتوفرة'}
                  </h2>
                  <p className="text-xs text-slate-400 font-bold">
                    انقر على "أضف للسلة" لطلب أي وجبة أو منتج مباشرة
                  </p>
                </div>
                <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                  {displayedProducts.length} منتج
                </span>
              </div>

              {displayedProducts.length === 0 ? (
                <div className="bg-white p-12 rounded-[2.5rem] text-center border border-slate-100">
                  <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-black text-slate-700">لا توجد منتجات متطابقة</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    جرب البحث بكلمة أخرى أو اختيار متجر وتصنيف مختلف.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {displayedProducts.map((prod) => (
                    <div
                      key={prod.id}
                      className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col justify-between"
                    >
                      <div className="relative aspect-video bg-slate-100 overflow-hidden">
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
                          }}
                        />
                        <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-black px-2.5 py-1 rounded-xl">
                          {prod.category}
                        </div>
                        <div className="absolute bottom-3 right-3 bg-orange-500/90 backdrop-blur-sm text-white text-[10px] font-black px-2.5 py-0.5 rounded-lg">
                          {prod.storeName}
                        </div>
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-black text-slate-900 text-sm mb-1">{prod.name}</h3>
                          <p className="text-xs text-slate-500 font-medium line-clamp-2 mb-3">
                            {prod.description}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-base font-black text-slate-900">
                              {prod.price} <span className="text-xs font-bold text-orange-600">د.ج</span>
                            </span>
                            {prod.originalPrice && (
                              <span className="text-xs text-slate-400 line-through">
                                {prod.originalPrice} د.ج
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => addToCart(prod)}
                            disabled={!prod.isAvailable}
                            className={`py-2 px-4 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all active:scale-95 shadow-md ${
                              prod.isAvailable
                                ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                            }`}
                          >
                            <Plus className="w-4 h-4 stroke-[3]" />
                            <span>{prod.isAvailable ? 'أضف للسلة' : 'غير متوفر'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ================= ORDERS TAB ================= */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <h2 className="text-xl font-black text-slate-900">طلباتك في كيمو</h2>
            {myOrders.length === 0 ? (
              <div className="bg-white p-12 rounded-[2.5rem] text-center border border-slate-100">
                <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-black text-slate-700">لا توجد طلبات سابقة</h3>
                <p className="text-xs text-slate-400 mt-1 mb-4">
                  تصفح المنتجات وأرسل أول طلب ليصلك إلى باب منزلك في بئر العاتر!
                </p>
                <button
                  onClick={() => setActiveTab('browse')}
                  className="py-3 px-6 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black text-xs"
                >
                  تصفح المنتجات الآن
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myOrders
                  .sort((a, b) => b.createdAt - a.createdAt)
                  .map((order) => {
                    const isDelivered = order.status === OrderStatus.DELIVERED;
                    const isCancelled = order.status === OrderStatus.CANCELLED;

                    return (
                      <div
                        key={order.id}
                        className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4"
                      >
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-black text-slate-900 text-base">
                                {order.storeName}
                              </h3>
                              <span className="text-xs font-mono text-slate-400">#{order.id}</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {new Date(order.createdAt).toLocaleString('ar-DZ')}
                            </p>
                          </div>

                          <div className="text-left">
                            <p className="text-base font-black text-slate-900">
                              {order.totalPrice} <span className="text-xs font-bold">د.ج</span>
                            </p>
                            <span
                              className={`text-[10px] font-black px-2.5 py-0.5 rounded-full inline-block mt-0.5 ${
                                isDelivered
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : isCancelled
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-orange-100 text-orange-700 animate-pulse'
                              }`}
                            >
                              {order.status === OrderStatus.PENDING && 'بانتظار قبول المتجر'}
                              {order.status === OrderStatus.PREPARING && 'المتجر يجهز طلبك'}
                              {order.status === OrderStatus.READY && 'الطلب جاهز، بانتظار السائق'}
                              {order.status === OrderStatus.PICKED_UP && 'السائق في الطريق إليك'}
                              {isDelivered && 'تم التوصيل بنجاح'}
                              {isCancelled && 'تم إلغاء الطلب'}
                            </span>
                          </div>
                        </div>

                        {/* Order Timeline Steps */}
                        {!isCancelled && (
                          <div className="grid grid-cols-4 gap-2 pt-1 pb-2">
                            {[
                              { label: 'تم الطلب', active: true },
                              {
                                label: 'قيد التحضير',
                                active:
                                  order.status === OrderStatus.PREPARING ||
                                  order.status === OrderStatus.READY ||
                                  order.status === OrderStatus.PICKED_UP ||
                                  isDelivered
                              },
                              {
                                label: 'في الطريق',
                                active:
                                  order.status === OrderStatus.PICKED_UP || isDelivered
                              },
                              { label: 'تم التسليم', active: isDelivered }
                            ].map((step, idx) => (
                              <div key={idx} className="text-center">
                                <div
                                  className={`h-1.5 rounded-full mb-1 transition-colors ${
                                    step.active ? 'bg-orange-500' : 'bg-slate-200'
                                  }`}
                                />
                                <span
                                  className={`text-[10px] font-black ${
                                    step.active ? 'text-orange-600' : 'text-slate-400'
                                  }`}
                                >
                                  {step.label}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="bg-slate-50 p-3 rounded-2xl text-xs space-y-1">
                          <p className="font-black text-slate-500">المحتويات:</p>
                          <p className="font-bold text-slate-800">{order.itemsSummary}</p>
                          <p className="text-[11px] text-slate-400 pt-1">
                            عنوان التسليم: {order.customerLocation?.address}
                          </p>
                          {order.driverName && (
                            <p className="text-[11px] text-orange-600 font-bold">
                              السائق المخصص: {order.driverName} ({order.driverPhone})
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-5 inset-x-4 max-w-lg mx-auto z-40">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-95 text-white py-4 px-6 rounded-3xl shadow-2xl shadow-orange-500/30 flex items-center justify-between font-black text-sm active:scale-95 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <span>عرض السلة ({cartTotalItems} وجبة)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base">{cartTotalPrice} د.ج</span>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-lg">إتمام الطلب</span>
            </div>
          </button>
        </div>
      )}

      {/* Cart & Checkout Modal / Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-orange-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-lg">سلة الطلبات</h3>
                  <p className="text-xs text-slate-500 font-bold">بئر العاتر للتوصيل السريع</p>
                </div>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-black text-sm p-1"
              >
                إغلاق
              </button>
            </div>

            <form onSubmit={handleCheckout} className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Items List */}
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between gap-3 border border-slate-100"
                  >
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-black text-slate-900 text-xs">{item.product.name}</h4>
                      <p className="text-xs font-bold text-orange-600">
                        {item.product.price} د.ج
                      </p>
                    </div>

                    <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.product.id, -1)}
                        className="text-slate-500 hover:text-slate-900 p-0.5"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-black text-xs w-4 text-center">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.product.id, 1)}
                        className="text-orange-600 hover:text-orange-700 p-0.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-slate-300 hover:text-rose-500 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Delivery Details */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    رقم الهاتف لتأكيد التوصيل
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 px-4 text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-black text-slate-700">
                      عنوان التوصيل في بئر العاتر
                    </label>
                    <button
                      type="button"
                      onClick={onOpenGpsModal}
                      className="text-[11px] font-black text-orange-600 hover:underline flex items-center gap-1"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>تحديد بـ GPS</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    required
                    placeholder="الحي، الشارع، المعلم القريب..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 px-4 text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    ملاحظات للطلب أو السائق (اختياري)
                  </label>
                  <input
                    type="text"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="مثال: زيادة صلصة، بدون بصل، الطابق الأول..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 px-4 text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Price Calculation */}
              <div className="bg-orange-50/70 p-4 rounded-2xl space-y-2 text-xs font-bold text-slate-700">
                <div className="flex justify-between">
                  <span>قيمة المنتجات:</span>
                  <span>{cartSubtotal} د.ج</span>
                </div>
                <div className="flex justify-between">
                  <span>سعر التوصيل (داخل بئر العاتر):</span>
                  <span>{deliveryFee} د.ج</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-orange-200 text-sm font-black text-slate-900">
                  <span>الإجمالي عند الاستلام:</span>
                  <span className="text-orange-600">{cartTotalPrice} د.ج</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-orange-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                <span>إرسال وتأكيد الطلب الآن</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
