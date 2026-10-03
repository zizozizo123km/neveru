
export enum UserRole {
  GUEST = 'GUEST',
  CUSTOMER = 'CUSTOMER',
  STORE = 'STORE',
  DRIVER = 'DRIVER'
}

export enum OrderStatus {
  PENDING = 'PENDING',
  ACCEPTED_BY_STORE = 'ACCEPTED_BY_STORE',
  ACCEPTED_BY_DRIVER = 'ACCEPTED_BY_DRIVER',
  PICKED_UP = 'PICKED_UP',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export enum Category {
  FOOD = 'مطاعم',
  CLOTHES = 'ملابس',
  PHONES = 'هواتف وفليكسي',
  SERVICES = 'خدمات',
  KIDS = 'أطفال'
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: Category;
  storeId: string;
}

export interface StoreProfile {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  category: Category;
  location: string;
  coordinates: Coordinates;
  image: string;
  phone?: string; 
  wilaya?: string; // الولاية التابع لها المتجر
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone?: string; 
  storeId: string;
  storeName: string;
  storePhone?: string; 
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  products: {product: Product, quantity: number}[];
  totalPrice: number;
  deliveryFee: number;
  status: OrderStatus;
  timestamp: number;
  address: string;
  notes?: string;
  coordinates?: Coordinates;
  storeCoordinates?: Coordinates;
  wilaya?: string; // الولاية التي تم فيها الطلب
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
  wilaya?: string; // ولاية المستخدم
}
