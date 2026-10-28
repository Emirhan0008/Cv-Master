/**
 * Firebase web yapılandırması.
 *
 * Bu değerler GİZLİ DEĞİLDİR — Firebase web uygulamasında her istemciye
 * dağıtılır ve tarayıcıda görünür. Güvenlik, Firestore güvenlik kuralları
 * (`firestore.rules`) ve Firebase Auth ile sağlanır.
 *
 * Ortam değişkenleri tanımlıysa (VITE_FIREBASE_*), onlar önceliklidir.
 */
export const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    'AIzaSyA3Z7KYIVEr0GW2tc-eWFNzrQBGO0O6g_s',
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    'gen-lang-client-0088232170.firebaseapp.com',
  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID ||
    'gen-lang-client-0088232170',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    'gen-lang-client-0088232170.firebasestorage.app',
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    '351445587737',
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    '1:351445587737:web:1bb1b2c0adf57c80811788',
};
