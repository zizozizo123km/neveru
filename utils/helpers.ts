
import { Coordinates } from '../types';

export const BIR_EL_ATER_CENTER: Coordinates = {
  lat: 34.7495,
  lng: 8.0617
};

// قائمة الولايات الجزائرية الـ 58 مع إحداثيات تقريبية لمراكزها
export const ALGERIA_WILAYAS = [
  { id: "01", name: "أدرار", lat: 27.87, lng: -0.29 },
  { id: "02", name: "الشلف", lat: 36.16, lng: 1.33 },
  { id: "03", name: "الأغواط", lat: 33.80, lng: 2.86 },
  { id: "04", name: "أم البواقي", lat: 35.87, lng: 7.11 },
  { id: "05", name: "باتنة", lat: 35.55, lng: 6.17 },
  { id: "06", name: "بجاية", lat: 36.75, lng: 5.08 },
  { id: "07", name: "بسكرة", lat: 34.85, lng: 5.73 },
  { id: "08", name: "بشار", lat: 31.62, lng: -2.21 },
  { id: "09", name: "البليدة", lat: 36.47, lng: 2.83 },
  { id: "10", name: "البويرة", lat: 36.37, lng: 3.90 },
  { id: "11", name: "تمنراست", lat: 22.78, lng: 5.52 },
  { id: "12", name: "تبسة", lat: 35.40, lng: 8.12 },
  { id: "13", name: "تلمسان", lat: 34.88, lng: -1.31 },
  { id: "14", name: "تيارت", lat: 35.37, lng: 1.31 },
  { id: "15", name: "تيزي وزو", lat: 36.71, lng: 4.04 },
  { id: "16", name: "الجزائر العاصمة", lat: 36.75, lng: 3.05 },
  { id: "17", name: "الجلفة", lat: 34.67, lng: 3.25 },
  { id: "18", name: "جيجل", lat: 36.81, lng: 5.76 },
  { id: "19", name: "سطيف", lat: 36.19, lng: 5.41 },
  { id: "20", name: "سعيدة", lat: 34.83, lng: 0.15 },
  { id: "21", name: "سكيكدة", lat: 36.87, lng: 6.90 },
  { id: "22", name: "سيدي بلعباس", lat: 35.19, lng: -0.63 },
  { id: "23", name: "عنابة", lat: 36.90, lng: 7.76 },
  { id: "24", name: "قالمة", lat: 36.46, lng: 7.42 },
  { id: "25", name: "قسنطينة", lat: 36.36, lng: 6.61 },
  { id: "26", name: "المدية", lat: 36.26, lng: 2.75 },
  { id: "27", name: "مستغانم", lat: 35.93, lng: 0.08 },
  { id: "28", name: "المسيلة", lat: 35.70, lng: 4.54 },
  { id: "29", name: "معسكر", lat: 35.39, lng: 0.14 },
  { id: "30", name: "ورقلة", lat: 31.95, lng: 5.32 },
  { id: "31", name: "وهران", lat: 35.69, lng: -0.63 },
  { id: "32", name: "البيض", lat: 33.68, lng: 1.01 },
  { id: "33", name: "إيليزي", lat: 26.48, lng: 8.46 },
  { id: "34", name: "برج بوعريريج", lat: 36.07, lng: 4.76 },
  { id: "35", name: "بومرداس", lat: 36.76, lng: 3.47 },
  { id: "36", name: "الطارف", lat: 36.76, lng: 8.31 },
  { id: "37", name: "تندوف", lat: 27.67, lng: -8.12 },
  { id: "38", name: "تيسمسيلت", lat: 35.60, lng: 1.81 },
  { id: "39", name: "الوادي", lat: 33.36, lng: 6.85 },
  { id: "40", name: "خنشلة", lat: 35.43, lng: 7.14 },
  { id: "41", name: "سوق أهراس", lat: 36.28, lng: 7.95 },
  { id: "42", name: "تيبازة", lat: 36.59, lng: 2.44 },
  { id: "43", name: "ميلة", lat: 36.45, lng: 6.26 },
  { id: "44", name: "عين الدفلى", lat: 36.26, lng: 2.22 },
  { id: "45", name: "النعامة", lat: 33.26, lng: -0.31 },
  { id: "46", name: "عين تموشنت", lat: 35.29, lng: -1.14 },
  { id: "47", name: "غرداية", lat: 32.49, lng: 3.67 },
  { id: "48", name: "غليزان", lat: 35.74, lng: 0.55 },
  { id: "49", name: "تيميمون", lat: 29.26, lng: 0.23 },
  { id: "50", name: "برج باجي مختار", lat: 21.32, lng: 0.95 },
  { id: "51", name: "أولاد جلال", lat: 34.41, lng: 5.06 },
  { id: "52", name: "بني عباس", lat: 30.08, lng: -2.16 },
  { id: "53", name: "عين صالح", lat: 27.19, lng: 2.48 },
  { id: "54", name: "عين قزام", lat: 19.67, lng: 5.77 },
  { id: "55", name: "تقرت", lat: 33.10, lng: 6.06 },
  { id: "56", name: "جانت", lat: 24.55, lng: 9.48 },
  { id: "57", name: "المغير", lat: 33.95, lng: 5.92 },
  { id: "58", name: "المنيعة", lat: 30.58, lng: 2.88 }
];

// دالة لتحديد أقرب ولاية بناءً على الإحداثيات (GPS)
export const getWilayaFromCoordinates = (coords: Coordinates): string => {
  let nearest = ALGERIA_WILAYAS[0];
  let minDistance = calculateDistance(coords, { lat: ALGERIA_WILAYAS[0].lat, lng: ALGERIA_WILAYAS[0].lng });

  for (let i = 1; i < ALGERIA_WILAYAS.length; i++) {
    const dist = calculateDistance(coords, { lat: ALGERIA_WILAYAS[i].lat, lng: ALGERIA_WILAYAS[i].lng });
    if (dist < minDistance) {
      minDistance = dist;
      nearest = ALGERIA_WILAYAS[i];
    }
  }
  return nearest.name;
};

export const calculateDistance = (coord1: Coordinates, coord2: Coordinates): number => {
  if (!coord1 || !coord2 || typeof coord1.lat !== 'number' || typeof coord2.lat !== 'number') return 0;
  const R = 6371; 
  const dLat = deg2rad(coord2.lat - coord1.lat);
  const dLon = deg2rad(coord2.lng - coord1.lng);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(deg2rad(coord1.lat)) * Math.cos(deg2rad(coord2.lat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
};

function deg2rad(deg: number): number { return deg * (Math.PI / 180); }

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ar-DZ', { style: 'currency', currency: 'DZD' }).format(amount).replace('DZD', 'د.ج');
};
