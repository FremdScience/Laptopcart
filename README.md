# Science Dept Laptop Cart Signup

A small static website for the science department to sign up for **Cart #1**
(behind Room 245) and **Cart #2** (behind Room 150), period by period,
Monday&ndash;Friday. Data is stored in Firebase (Firestore). Access is
gated by **Google Sign-In restricted to @d211.org accounts** — no shared
password to hand out or leak.

No build step, no server — it's just static HTML/CSS/JS files. You can host
it for free on GitHub Pages.

## What's in this folder

| File | What it's for |
|---|---|
| `index.html` | Page structure |
| `style.css` | Styling |
| `auth.js` | The sign-in gate (Google Sign-In, domain check) |
| `firebase-init.js` | One shared Firebase app/auth/db instance |
| `app.js` | Everything after sign-in: calendar, booking, cancel |
| `calendar-data.js` | Carts, periods, and the school calendar (edit this every year) |
| `firebase-config.js` | Your Firebase project config |

## 1. Firebase setup

Reuse the **same Firebase project** you already use for the science supply
inventory tracker / supply pickup site. This app stores its own data in a
separate Firestore collection called `cartBookings`, so it won't touch or
overwrite your existing inventory/pickup data.

Steps in the [Firebase console](https://console.firebase.google.com/):

1. **Open your existing project** (the one the supply tracker uses).
2. **Get the config** you already used for that site: Project settings (gear
   icon) → General → scroll to "Your apps" → click the existing web app →
   copy the `firebaseConfig` object. Paste those exact values into
   `firebase-config.js` in this folder, replacing the `PASTE_...` placeholders.
3. **Enable the Google sign-in provider**: Build → Authentication → Sign-in
   method → Google → Enable → set a support email → Save. Firebase sets up
   the OAuth client for you; nothing else to configure for basic use.
4. **Add your Firestore security rules.** Go to Build → Firestore Database →
   Rules, and add this block. If you already have rules for your other
   collections, merge this `match` block in alongside them — don't delete
   your existing rules.

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {

       // ...your existing match blocks for the supply tracker stay here...

       function isD211Teacher() {
         return request.auth != null
           && request.auth.token.email != null
           && request.auth.token.email_verified == true
           && request.auth.token.email.lower().matches('^[^@]+@d211\\.org$');
       }

       match /cartBookings/{bookingId} {

         // Only signed-in @d211.org accounts can read the schedule at all.
         allow read: if isD211Teacher();

         // A new booking must: come from a verified @d211.org account, be
         // tagged with that account's own uid/email (so only they can
         // delete it later), and match the exact shape the app writes — no
         // extra/missing fields, right types, sane lengths, only real
         // carts/periods. This blocks anyone from writing garbage or
         // oversized documents directly to the database, even with the
         // public config keys.
         allow create: if isD211Teacher()
           && request.resource.data.keys().hasOnly(
                ['date','period','cart','teacher','room','seriesId','ownerUid','ownerEmail','createdAt'])
           && request.resource.data.ownerUid == request.auth.uid
           && request.resource.data.ownerEmail == request.auth.token.email
           && request.resource.data.date is string
           && request.resource.data.date.matches('^[0-9]{4}-[0-9]{2}-[0-9]{2}$')
           && request.resource.data.period is int
           && request.resource.data.period >= 1
           && request.resource.data.period <= 8
           && request.resource.data.cart in ['cart1', 'cart2']
           && request.resource.data.teacher is string
           && request.resource.data.teacher.size() > 0
           && request.resource.data.teacher.size() <= 60
           && request.resource.data.room is string
           && request.resource.data.room.size() > 0
           && request.resource.data.room.size() <= 30
           && (request.resource.data.seriesId == null || request.resource.data.seriesId is string);

         // Only the account that created a booking can delete it — enforced
         // by Firestore itself, not just hidden in the app's interface.
         allow delete: if isD211Teacher()
           && resource.data.ownerUid == request.auth.uid;

         // No "update" rule is granted — the app never edits an existing
         // booking, only creates or deletes, so that path stays closed.
       }
     }
   }
   ```

5. **Add your GitHub Pages URL to authorized domains**: Authentication →
   Settings → Authorized domains → Add domain → paste your
   `yourusername.github.io` domain (see step 3 below for what that URL is).

   > **One thing to check with district IT:** if your Google Workspace admin
   > has "API access control" locked down (Admin console → Security → API
   > controls → App access control), they may need to allow this app's OAuth
   > client, or teachers could see a "this app is blocked" screen when they
   > try to sign in — this is a district-level setting, not something fixable
   > in the code. Most schools leave this open for common sign-in flows, but
   > worth a heads-up to IT before you roll this out widely.

   > **What this setup does and doesn't protect against:** only verified
   > @d211.org Google accounts can read or write anything — this is real,
   > server-enforced identity, not a password anyone could share around.
   > Only the account that made a booking can cancel it, enforced by
   > Firestore itself. What it can't stop: any signed-in @d211.org teacher
   > can still see and create bookings for any period/cart (there's no
   > separate "science dept only" role — anyone in your Google Workspace
   > domain who reaches the URL and signs in gets full access). If you ever
   > want to restrict it to specific staff rather than the whole domain, the
   > easiest way is a Google Group + a Cloud Function that checks group
   > membership, or maintaining an allow-list of emails in Firestore — let me
   > know if you want that added.

## 2. Editing the carts, periods, or calendar

Open `calendar-data.js`:
- `CARTS` — cart names/locations, if a cart ever moves or gets renamed.
- `PERIODS` — currently `1` through `8`.
- `SCHOOL_CALENDAR` — every non-school day (holidays, breaks, teacher
  institute days) and modified-schedule day (Late Start, Early Dismissal)
  for the 2026–2027 year, pulled from the FHS Professional Learning
  Calendar you sent me. **Update this file every summer** with next year's
  calendar — everything else in the site stays the same. Also bump
  `SCHOOL_YEAR_START` / `SCHOOL_YEAR_END` to the new year's range (these
  control how far back/forward "Previous/Next Week" and the recurring
  booking's "repeat through" date picker will go).

Open `auth.js` if you ever need to change the allowed sign-in domain (the
`ALLOWED_DOMAIN` constant near the top, currently `"d211.org"`).

## 3. Putting it on GitHub Pages

1. Create a new **private** GitHub repo (Settings → keep it private if you'd
   rather not have the source publicly browsable — Pages can still serve a
   private repo's content publicly at its URL, but the code/history won't be).
2. Push these files to the repo (root of the `main` branch, or a `/docs`
   folder — either works).
3. In the repo, go to Settings → Pages → Source → pick the branch/folder you
   used, and save. GitHub will give you a URL like
   `https://yourusername.github.io/repo-name/`.
4. Add that exact URL's domain to Firebase's authorized domains (step 5
   above) or sign-in will fail with an "unauthorized domain" error.
5. Share the URL with the department — no password needed, they just sign
   in with their normal school Google account.

## 4. How it works

- On first visit, click **Sign in with Google** and pick your @d211.org
  account. Firebase remembers the session in the browser, so you won't need
  to sign in again on that device unless you sign out or clear browser data.
- Signing in with a non-@d211.org account is rejected client-side (with a
  clear message) and, as a backstop, rejected by the Firestore rules too if
  anyone tried to bypass the page entirely.
- Click any **OPEN** slot to book Cart #1 or Cart #2 for that day/period.
  Your display name is pre-filled from your Google account (editable) and
  you'll be asked for the room you're using the cart in (required) — so the
  next teacher knows exactly where to find it.
- **Recurring signups**: check "Repeat every week on this same day &
  period" and pick an end date to lock in the same slot every week (e.g. a
  teacher who wants Cart #1, period 8, every week for the rest of the
  year). It skips any days that are already no-school days, and skips (and
  tells you about) any individual dates someone else already grabbed.
- Only the Google account that made a booking can cancel it — enforced by
  the Firestore rules above, not just the page's interface, and it now
  follows you across devices (since it's tied to your real sign-in, not a
  browser-specific anonymous ID). For a recurring signup, you can cancel
  just one date, or the rest of the series from that date forward.
- Days grayed out with a "NO SCHOOL" banner come straight from
  `calendar-data.js` and can't be booked. Days with a "Late Start" or
  "Early Dismissal" badge are still bookable — it's just an FYI.

## 5. Optional extra hardening

- **Set a billing budget alert.** Firebase's free (Spark) tier is generous
  and this app's traffic is tiny, but if you're on the pay-as-you-go
  (Blaze) plan for any reason, go to Google Cloud Console → Billing →
  Budgets & alerts → create a budget (e.g. $5/month) with an email alert.
  Costs nothing to set up, catches runaway usage before it becomes a
  surprise bill.
- **Enable Firebase App Check.** Even with Google Sign-In, the app's config
  keys are still public (that's normal for any client-side Firebase app).
  App Check adds a second layer that verifies requests are actually coming
  from your registered website (via reCAPTCHA v3), rejecting anything that
  hits the Firestore API directly from outside your page. Setup: Firebase
  console → Build → App Check → register your web app → get a reCAPTCHA v3
  site key → in `firebase-init.js` add:
  ```js
  import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app-check.js";
  initializeAppCheck(app, { provider: new ReCaptchaV3Provider("YOUR_SITE_KEY"), isTokenAutoRefreshEnabled: true });
  ```
  then turn on **Enforcement** for Firestore under App Check in the console.
  More setup than the rules above and not strictly necessary for a small
  internal tool.

## Migrating from the earlier password-gated version

If you already deployed the previous version of this site (shared
"GoVikes" password + anonymous sign-in), note that any bookings made under
that version have an `ownerUid` tied to an anonymous session, not a Google
account — so nobody will be able to cancel those specific old bookings
through the app once you switch (they'll still show up fine, just not be
cancelable by anyone other than you deleting them manually in the Firebase
console). New bookings made after switching to Google Sign-In won't have
this issue.

## Notes / limitations

- Access is a real, server-enforced identity check (verified @d211.org
  Google account) rather than a shared secret — a meaningful step up from
  the password version. It's still domain-wide, not role-based: any
  @d211.org account that reaches the site can book/cancel any cart/period,
  not just science teachers. See the note in step 1 if you want to narrow
  that further.
- Booking conflicts are checked at write time (a slot can't be double
  booked), but if two people click "Book It" on the exact same slot within
  the same second, one of them will just see a "slot was just booked" retry
  message rather than a crash.
