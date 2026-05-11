// firebase-messaging-sw.js
// Service Worker para Firebase Cloud Messaging (notificações push em background)

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBFvVTdHEZ2yKoO0htHfdBjLP1I32veewg",
  authDomain: "klenio-refrigeracao.firebaseapp.com",
  projectId: "klenio-refrigeracao",
  storageBucket: "klenio-refrigeracao.firebasestorage.app",
  messagingSenderId: "177014471183",
  appId: "1:177014471183:web:18a27f37159b69270a017a",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || 'Klenio Refrigeração', {
    body: body || '',
    icon: '/assets/images/icon.png',
    data: payload.data,
  });
});
