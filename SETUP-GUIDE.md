# FHS Laptop Cart Website Setup Guide

This guide takes the supplied website files from a ZIP archive to a live GitHub Pages website backed by Firebase.

## What you will need

- A Google account that can create a Firebase project
- A GitHub account
- GitHub Desktop, recommended for uploading the project
- Permission to use Google sign-in with District 211 accounts

The website will be publicly reachable, but teachers must sign in with a verified `@d211.org` Google account before they can see or change reservation data.

## Part 1: Unzip the project

1. Download `FHS-Laptop-Cart-Reservations-GitHub.zip`.
2. Double-click the ZIP to extract it.
3. Keep the extracted project folder intact. Do not rename or remove files beginning with a period, including `.github`, `.env.example`, and `.gitignore`.

## Part 2: Create the Firebase project

1. Open [Firebase Console](https://console.firebase.google.com/).
2. Select **Create a project**.
3. Give it a recognizable name such as `FHS Laptop Cart Reservations`.
4. Google Analytics is not required for this website.
5. After the project opens, select the **Web** icon to add a web app.
6. Give the web app a nickname such as `FHS Cart Website`.
7. Do not enable Firebase Hosting; GitHub Pages will host the website.
8. Firebase will display a configuration object containing values such as `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, and `appId`. Keep this screen available for Part 5.

## Part 3: Enable Google authentication

1. In Firebase, open **Build > Authentication**.
2. Select **Get started**.
3. Open **Sign-in method**.
4. Enable the **Google** provider.
5. Choose a support email and save.

The website suggests the `d211.org` Google domain during sign-in. The database rules provide the real protection by rejecting accounts outside the verified `@d211.org` domain.

## Part 4: Create Firestore and deploy its security rules

1. In Firebase, open **Build > Firestore Database**.
2. Select **Create database**.
3. Choose a location near your users.
4. Choose **Production mode**, not test mode.
5. Finish creating the database.

The project includes `firestore.rules`. These rules:

- Require a verified `@d211.org` account to read reservations.
- Tie every reservation to the authenticated teacher's unique account ID and email.
- Permit only the original owner to cancel a reservation.
- Permit owners to change only the destination room after creation.
- Validate the cart, date, period, room, teacher, and reservation identifier.
- Deny access to every unrelated database location.

### Recommended rules deployment

From a terminal opened inside the extracted project folder:

```bash
npx firebase-tools login
npx firebase-tools use --add
npx firebase-tools deploy --only firestore:rules
```

When prompted, select the Firebase project created above. The included `firebase.json` already points to the correct rules file.

If district restrictions prevent use of the Firebase command-line tool, open **Firestore Database > Rules**, replace the editor contents with the contents of `firestore.rules`, and publish the rules. Carefully confirm that the entire file was copied.

## Part 5: Create the GitHub repository

GitHub Desktop is the simplest method because it preserves the required folders and filenames.

1. Install and open [GitHub Desktop](https://desktop.github.com/).
2. Select **File > Add Local Repository**.
3. Choose the extracted project folder.
4. If prompted, select **Create a repository here**.
5. Use a repository name such as `fhs-laptop-cart-reservations`.
6. Commit all files with a message such as `Initial FHS cart reservation website`.
7. Select **Publish repository**.
8. A public repository works with free GitHub Pages. Do not include credentials, service-account files, student data, or private school documents in the repository.

## Part 6: Add the Firebase values to GitHub

1. Open the new repository on GitHub.com.
2. Open **Settings > Secrets and variables > Actions**.
3. Select **New repository secret** for each value below.
4. Copy the corresponding value from the Firebase web-app configuration created in Part 2.

| GitHub secret name | Firebase value |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `VITE_FIREBASE_APP_ID` | `appId` |

`VITE_FIREBASE_APPCHECK_SITE_KEY` is optional and can be added later when configuring Firebase App Check.

Firebase web configuration is visible to browsers by design. GitHub secrets keep the values out of the source files and workflow logs, while Firestore Security Rules protect the actual data.

## Part 7: Turn on GitHub Pages

1. In the GitHub repository, open **Settings > Pages**.
2. Under **Build and deployment**, select **GitHub Actions** as the source.
3. Open the repository's **Actions** tab.
4. Select **Deploy FHS Cart Reservations**.
5. Run the workflow if it has not already started.
6. When the workflow finishes, GitHub will show a URL similar to:

   `https://YOUR-GITHUB-NAME.github.io/fhs-laptop-cart-reservations/`

Every later push to the `main` branch will rebuild and republish the website automatically.

## Part 8: Authorize the GitHub Pages domain in Firebase

1. Return to **Firebase Console > Authentication > Settings > Authorized domains**.
2. Add the hostname from the GitHub Pages URL:

   `YOUR-GITHUB-NAME.github.io`

3. Enter only the hostname, without `https://` or the repository path.

Without this step, Google sign-in may report that the domain is unauthorized.

## Part 9: Test before sharing

Use two different `@d211.org` teacher accounts if possible.

1. Confirm a teacher can sign in and that the teacher-name field is pre-filled from Google.
2. Confirm the name can be corrected before reserving.
3. Reserve Cart #1 for a single date and several periods, such as 1, 2, and 7.
4. Create a weekly reservation and confirm school closures are skipped.
5. Confirm the room appears on the weekly schedule.
6. Confirm a second teacher can see the reservation but cannot cancel it.
7. Confirm the original teacher can cancel it.
8. Attempt sign-in with a non-`@d211.org` account and confirm access is rejected.
9. In the Firebase Firestore Rules Playground, verify that unauthenticated reads and writes are denied.

Do not share the website broadly until these checks pass.

## Optional: Add Firebase App Check

App Check can reduce automated abuse against the Firebase project.

1. In Firebase, open **Build > App Check**.
2. Register the web app using reCAPTCHA v3.
3. Add the GitHub Pages hostname as an allowed domain where requested.
4. Add the resulting site key to GitHub as `VITE_FIREBASE_APPCHECK_SITE_KEY`.
5. Run the GitHub deployment again.
6. Test sign-in, schedule loading, reservation creation, and cancellation.
7. After successful testing, enable App Check enforcement for Firestore.

## Updating the website later

Edit the project through GitHub Desktop or another code editor, commit the changes, and push them to `main`. The included GitHub Actions workflow will publish the update automatically.

Important project files:

- `app/page.tsx`: reservation interface and behavior
- `app/globals.css`: visual design
- `app/lib/school-calendar.ts`: school dates and altered schedules
- `firestore.rules`: Firebase database protection
- `.github/workflows/deploy-pages.yml`: automatic GitHub Pages publication
- `.env.example`: list of Firebase configuration values

## Troubleshooting

### The website says "Preview mode"

One or more Firebase GitHub secrets is missing or misspelled. Check all six required `VITE_FIREBASE_...` secrets, then rerun the deployment workflow.

### Google says the domain is unauthorized

Add `YOUR-GITHUB-NAME.github.io` to Firebase Authentication's authorized domains. Do not include the repository path.

### Teachers can sign in but reservations will not load

Confirm Firestore was created, `firestore.rules` was deployed, and the signed-in address ends in `@d211.org`.

### The GitHub deployment fails

Open the failed run under the repository's **Actions** tab and inspect the first red step. Confirm Pages uses **GitHub Actions** and all required Firebase secret names match the table exactly.

### A teacher's name is blank or outdated

The form pre-fills Google's display name but keeps it editable. The teacher can enter the correct name; ownership remains attached to the authenticated Google account.

## Final security reminder

Never place a Firebase Admin SDK service-account file, private key, password, student data, or confidential school document in this repository. The Firebase web configuration is not an administrator credential. Keep Firestore in production mode, retain the supplied rules, and test them before launch.
