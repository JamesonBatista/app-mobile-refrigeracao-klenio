// js/services/firebase.js
// ============================================================
// firebase.js — inicialização do Firebase (SDK via CDN)
// O index.html deve carregar antes deste arquivo:
//   <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
//   <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"></script>
//   <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
//   <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js"></script>
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyBFvVTdHEZ2yKoO0htHfdBjLP1I32veewg",
  authDomain: "klenio-refrigeracao.firebaseapp.com",
  projectId: "klenio-refrigeracao",
  storageBucket: "klenio-refrigeracao.firebasestorage.app",
  messagingSenderId: "177014471183",
  appId: "1:177014471183:web:18a27f37159b69270a017a",
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db   = firebase.firestore();
const auth = firebase.auth();
