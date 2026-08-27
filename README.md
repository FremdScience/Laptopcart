# FHS Science Laptop Cart Reservations

A GitHub Pages-ready reservation site for the two FHS Science laptop carts:

- Cart #1: stored behind Room 245
- Cart #2: stored between Rooms 150 and 152

Teachers authenticate with a verified `@d211.org` Google account. They can reserve one or several periods, use a single date or weekly pattern, and specify the room where the cart will be used. School closures are skipped automatically. Reservation ownership is enforced by Firebase Authentication and Firestore Security Rules.

## Start here

Read `SETUP.md` for the complete Firebase and GitHub Pages setup directions.

## Important security note

The GitHub Pages interface is public. Reservation data is not public: the included Firestore rules require a verified `@d211.org` account, validate reservation records, enforce owner-only changes and deletion, and deny all unrelated database paths. Deploy and test `firestore.rules` before sharing the website.
