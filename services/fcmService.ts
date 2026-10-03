import { getToken } from "firebase/messaging";
import { messaging, db, auth } from "./firebase";
import { ref, update } from "firebase/database";
import { UserRole } from "../types";

export const requestFCMTokenWithPermission = async (role?: UserRole) => {
  try {
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      await fetchAndSaveToken(role);
    }
  } catch (error) {
    console.warn("Notification permission request error:", error);
  }
};

const fetchAndSaveToken = async (role?: UserRole) => {
  try {
    if (!messaging) return;
    const token = await getToken(messaging, {
      vapidKey: "BLg6yzknUBqznW8Y0kMulCwz1a-u8pelTCDIqvUaS7wB0Ia3rzHfNC1B_NJzXkqM_D7DumkhUicYojiHGsMsTIY"
    });

    if (token) {
      console.log("✅ FCM TOKEN:", token);
      const user = auth.currentUser;
      if (user && role) {
        const dbPath = role === UserRole.CUSTOMER ? 'customers' : role === UserRole.STORE ? 'stores' : 'drivers';
        await update(ref(db, `${dbPath}/${user.uid}`), {
          fcmToken: token,
          lastTokenUpdate: Date.now()
        });
      }
    }
  } catch (error) {
    console.warn("FCM Token Error:", error);
  }
};

const getFCMToken = async (role?: UserRole) => {
  try {
    if (!('Notification' in window)) return;
    // Only fetch if already granted, never trigger popup on load
    if (Notification.permission === "granted") {
      await fetchAndSaveToken(role);
    }
  } catch (error) {
    console.warn("FCM Error:", error);
  }
};

export default getFCMToken;