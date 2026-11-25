// Firebase web ayarlari (Firebase konsolu > Proje ayarlari > Web uygulamasi
// "Birkese Web") ve Web Push anahtari (Cloud Messaging > Web Push
// sertifikalari). Bunlar GIZLI DEGIL: her web uygulamasinin icinde durur.
// Gizli olan hizmet hesabi anahtari yalnizca Supabase'te (FCM_SERVICE_ACCOUNT).
//
// Hem sayfa (push.js) hem bildirim calisani (firebase-messaging-sw.js) bu
// dosyayi okur. Bos kaldigi surece web'de bildirim "desteklenmiyor" gorunur.
self.BIRKESE_FIREBASE = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};
self.BIRKESE_VAPID_KEY = "";
