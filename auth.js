// ---------------------------------------------------------------------------
// Sign-in gate — Google Sign-In restricted to @d211.org accounts.
//
// This file has no top-level imports of the Firebase SDK itself (only a
// local, dependency-free config file), so the sign-in screen always renders
// even if the network/Firebase CDN is briefly unreachable. The actual
// Firebase modules are loaded on demand inside loadFirebase(), wrapped in
// try/catch, so a load failure shows a clear message instead of a blank page.
// ---------------------------------------------------------------------------
const ALLOWED_DOMAIN = "d211.org";

const gateOverlay = document.getElementById("gateOverlay");
const appRoot = document.getElementById("app");
const signInBtn = document.getElementById("googleSignInBtn");
const gateError = document.getElementById("gateError");
const signOutBtn = document.getElementById("signOutBtn");

let cached = null;

async function loadFirebase() {
  if (cached) return cached;
  const [{ auth }, authSdk] = await Promise.all([
    import("./firebase-init.js"),
    import("https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js"),
  ]);
  cached = { auth, ...authSdk };
  return cached;
}

function showError(msg) {
  gateError.textContent = msg;
}

function isAllowedEmail(email) {
  return !!email && email.toLowerCase().endsWith("@" + ALLOWED_DOMAIN);
}

async function enterApp(user) {
  gateOverlay.classList.add("hidden");
  appRoot.classList.remove("hidden");
  try {
    const mod = await import("./app.js");
    mod.startApp(user);
  } catch (err) {
    console.error(err);
    document.getElementById("weekContainer").innerHTML =
      `<div class="closed-banner">Could not load the app: ${err.message}</div>`;
  }
}

async function handleSignIn() {
  showError("");
  signInBtn.disabled = true;
  const originalLabel = signInBtn.querySelector("span").textContent;
  signInBtn.querySelector("span").textContent = "Signing in…";

  try {
    const { auth, GoogleAuthProvider, signInWithPopup, signOut } = await loadFirebase();
    const provider = new GoogleAuthProvider();
    // Hints Google's account picker to show d211.org accounts, but this is
    // just a UX hint — the real enforcement is the email check below AND
    // the Firestore security rules (see README), so it can't be bypassed
    // by picking a different account in the popup.
    provider.setCustomParameters({ hd: ALLOWED_DOMAIN });

    const result = await signInWithPopup(auth, provider);

    if (!isAllowedEmail(result.user.email)) {
      await signOut(auth);
      showError(`Please sign in with your @${ALLOWED_DOMAIN} account (you signed in as ${result.user.email}).`);
      return;
    }
    await enterApp(result.user);
  } catch (err) {
    console.error(err);
    if (err.code === "auth/popup-blocked") {
      showError("Your browser blocked the sign-in popup. Allow popups for this site and try again.");
    } else if (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") {
      // User just closed the popup — not a real error, no message needed.
    } else if (err.code === "auth/unauthorized-domain") {
      showError("This website's domain isn't yet authorized in Firebase. See README.md — Authentication → Settings → Authorized domains.");
    } else {
      showError(`Could not sign in right now (${err.code || err.message}). Check your connection and try again.`);
    }
  } finally {
    signInBtn.disabled = false;
    signInBtn.querySelector("span").textContent = originalLabel;
  }
}

signInBtn.addEventListener("click", handleSignIn);

signOutBtn.addEventListener("click", async () => {
  try {
    const { auth, signOut } = await loadFirebase();
    await signOut(auth);
  } catch (err) {
    console.error(err);
  }
  location.reload();
});

// Firebase persists a signed-in session in the browser, so returning
// teachers shouldn't have to click "Sign in" every single time. Check for
// an existing session in the background; if it's a valid @d211.org account,
// skip straight into the app.
(async () => {
  try {
    const { auth, onAuthStateChanged } = await loadFirebase();
    onAuthStateChanged(auth, (user) => {
      if (user && isAllowedEmail(user.email) && appRoot.classList.contains("hidden")) {
        enterApp(user);
      }
    });
  } catch (err) {
    // Offline or the CDN is blocked on first load — not fatal, the person
    // can still click "Sign in with Google" and we'll retry loading then.
    console.warn("Could not check for an existing sign-in session:", err);
  }
})();
