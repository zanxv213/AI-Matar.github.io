import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration provided by the user.
const firebaseConfig = {
  apiKey: "AIzaSyBj6PKD95IkS5cyLZBe1aYMJg-PP3z4FSg",
  authDomain: "aiedit-d046c.firebaseapp.com",
  databaseURL: "https://aiedit-d046c-default-rtdb.firebaseio.com",
  projectId: "aiedit-d046c",
  storageBucket: "aiedit-d046c.firebasestorage.app",
  messagingSenderId: "708158775566",
  appId: "1:708158775566:web:d3bb9dc9771ce99464b75f",
  measurementId: "G-QLSWDZER5H"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);