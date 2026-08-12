// ---------------------------------------------------------------------------
// FIREBASE CONFIG — Science Dept Laptop Cart Signup
// ---------------------------------------------------------------------------
// Karl: reuse the SAME Firebase project you already have for the science
// supply inventory tracker / supply pickup site. Just copy that project's
// config object below (Firebase console -> Project settings -> General ->
// "Your apps" -> the web app -> Config). This tool stores its bookings in a
// separate collection ("cartBookings") so it will not touch your existing
// inventory/pickup data.
//
// See README.md, section "Firebase setup", for the exact steps (enabling
// Google sign-in, adding the security rules block, adding your GitHub Pages
// domain to the authorized domains list).
export const firebaseConfig = {
  apiKey: "AIzaSyBhoJc6ZOML7JZKEWb5QqiIldjK79gDAlI",
  authDomain: "officesupplies-17fe1.firebaseapp.com",
  projectId: "officesupplies-17fe1",
  storageBucket: "officesupplies-17fe1.firebasestorage.app",
  messagingSenderId: "442305206053",
  appId: "1:442305206053:web:d2aaff4fe98949fa4a2ccc",
};

// Access is controlled by Google Sign-In restricted to @d211.org accounts
// (see auth.js) — there's no shared password anymore.

// Name of the Firestore collection this app reads/writes. Keep this unique
// so it never collides with your other Firebase apps' collections.
export const COLLECTION_NAME = "cartBookings";
