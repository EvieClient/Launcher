import * as firebase from "@firebase/app";
import * as firebaseAuth from "@firebase/auth";
import * as firestore from "@firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBhuKD8tE5i5YGl7icg0DWrdBRGeHb4Ir4",
  authDomain: "teamevieclient.firebaseapp.com",
  projectId: "teamevieclient",
  storageBucket: "teamevieclient.appspot.com",
  messagingSenderId: "901181403173",
  appId: "1:901181403173:web:55a814cfa6a88cd938cfcc",
  measurementId: "G-GJJ8JJ9TXE",
};
if (!firebase.getApps().length) {
  firebase.initializeApp(firebaseConfig);
}

function fetchFirebase() {
  if (!firebase.getApps().length) {
    firebase.initializeApp(firebaseConfig);
  }
}

export { firebase, firestore, firebaseAuth, fetchFirebase };
