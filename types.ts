export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  STORE = 'STORE',
  DRIVER = 'DRIVER',
  ADMIN = 'ADMIN'
}

export enum OrderStatus {
  PENDING = 'PENDING',        // في انتظار قبول المتجر
  ACCEPTED = 'ACCEPTED',      // تم قبول الطلب
  PREPARING = 'PREPARING',    // قيد التحضير
  READY = 'READY',            // جاهز للاستلام والتوصيل
  PICKED_UP = 'PICKED_UP',    // السائق استلم الطلب
  DELIVERED = 'DELIVERED',    // تم التسليم بنجاح
  CANCELLED = 'CANCELLED'     // ملغى
}

export interface LocationCoords {
  lat: number;
  lng: number;
  address: string;
  district?: string; // حي في بئر العاتر
}

export interface User {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  location?: LocationCoords;
  storeName?: string;
  storeCategory?: string;
  storeBanner?: string;
  vehicleType?: string; // دراجة نارية، سيارة
  createdAt: number;
}

export interface Product {
  id: string;
  storeId: string;
  storeName: string;
  name: string;
  price: number;
  originalPrice?: number;
  category: string;
  description: string;
  image: string;
  isAvailable: boolean;
  prepTimeMinutes?: number;
  createdAt: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerLocation: LocationCoords;
  storeId: string;
  storeName: string;
  storePhone?: string;
  storeLocation?: LocationCoords;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  items: OrderItem[];
  itemsSummary: string;
  itemsTotal: number;
  deliveryFee: number;
  totalPrice: number;
  status: OrderStatus;
  notes?: string;
  createdAt: number;
  deliveredAt?: number;
}

export interface StoreProfile {
  id: string;
  name: string;
  category: string;
  phone: string;
  address: string;
  location: LocationCoords;
  isOpen: boolean;
  rating: number;
  reviewsCount: number;
  banner: string;
  deliveryTime: string;
}
