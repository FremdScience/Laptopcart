# FHS Science Laptop Cart Reservations

This site reserves Cart #1 (stored behind Room 245) and Cart #2 (stored between Rooms 150 and 152) for periods 1–8. A teacher can select multiple periods and apply them to one date or a repeating weekly pattern. The teacher-name field is pre-filled from the Google account display name and remains editable. School closures are skipped automatically, while late-start, early-dismissal, and final-exam dates remain reservable with periods 1–8.

## Firebase setup and security

1. Create or select a Firebase project.
2. Add a Web App in Project settings and copy its configuration values into a local `.env` file using `.env.example`.
3. In Firebase Authentication, enable Google as a sign-in provider.
4. Create a Cloud Firestore database.
5. Do not leave Firestore in test mode. Deploy `firestore.rules` with `firebase deploy --only firestore:rules`. The included `firebase.json` points the Firebase CLI to the correct file.
6. Add the GitHub Pages hostname (`YOUR-GITHUB-NAME.github.io`) to Firebase Authentication's authorized domains.
7. Before launch, use the Firebase Rules Playground or Firestore emulator to verify that an unauthenticated visitor and a non-`@d211.org` user are denied.

The Google provider is given a `d211.org` domain hint for a smoother sign-in flow. That hint is not a security boundary. The Firestore rules provide the actual protection by requiring a verified `@d211.org` email, validating every reservation field and its unique date/cart/period document ID, allowing only the original owner to change the room or delete a reservation, and denying every other database path.

Firebase Web App configuration values are embedded in the published JavaScript and should not be treated as secrets. The database rules are what protect reservation data. Restrict the Firebase API key to the APIs this site uses and to the GitHub Pages website in Google Cloud Console when practical.

For additional abuse protection, register the GitHub Pages domain with Firebase App Check using reCAPTCHA v3, add its site key as `VITE_FIREBASE_APPCHECK_SITE_KEY`, verify normal sign-in and reservation use, and then enable enforcement for Firestore.

## Local review

Install dependencies, copy `.env.example` to `.env`, add the Firebase Web App values, and run the development script. Without Firebase values, the site intentionally opens in preview mode with sample reservations so its interface can still be reviewed.

## GitHub Pages publication

The repository includes a GitHub Actions workflow that builds the static website and publishes it through GitHub Pages after a push to `main`. It does not deploy automatically until the project is placed in a GitHub repository and Pages is enabled.

1. Create a GitHub repository and add this project.
2. In the repository, open **Settings > Pages** and select **GitHub Actions** as the source.
3. Under **Settings > Secrets and variables > Actions**, add each `VITE_FIREBASE_...` value listed in `.env.example` as a repository secret. These values will still be present in the browser bundle; using secrets only keeps them out of the source files and workflow logs.
4. Push to `main` or manually run **Deploy FHS Cart Reservations** from the Actions tab.
5. Add the resulting `YOUR-GITHUB-NAME.github.io` hostname to Firebase Authentication's authorized domains.
6. Deploy and test `firestore.rules` before sharing the link with teachers.

GitHub Pages serves the website publicly, even though the schedule and reservation data are sign-in gated. Do not place private school information, credentials, service-account files, or student data in the repository or static website.
