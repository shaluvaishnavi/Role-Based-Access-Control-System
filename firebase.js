const firebaseConfig = {
  apiKey: "AIzaSyDCPIwClDUrSf1GSaS0UBxJvvSuWUaNXe8",
  authDomain: "securitybased.firebaseapp.com",
  databaseURL: "https://securitybased-default-rtdb.firebaseio.com",
  projectId: "securitybased",
  storageBucket: "securitybased.appspot.com",
  messagingSenderId: "153881595969",
  appId: "1:153881595969:web:659d84810bb190aa69b6c0"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();