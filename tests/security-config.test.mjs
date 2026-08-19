import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Firestore rules retain the required access boundaries", async () => {
  const rules = await readFile(new URL("../firestore.rules", import.meta.url), "utf8");
  assert.match(rules, /email_verified == true/);
  assert.match(rules, /email\.lower\(\)\.matches\('\.\*@d211\[\.\]org\$'\)/);
  assert.match(rules, /request\.resource\.data\.ownerUid == request\.auth\.uid/);
  assert.match(rules, /resource\.data\.ownerUid == request\.auth\.uid/);
  assert.match(rules, /affectedKeys\(\)\.hasOnly\(\['room'\]\)/);
  assert.match(rules, /bookingId == request\.resource\.data\.date \+ '_cart-1_'/);
  assert.match(rules, /bookingId == request\.resource\.data\.date \+ '_cart-2_'/);
  assert.match(rules, /date >= '2026-08-10'/);
  assert.match(rules, /date <= '2027-05-20'/);
  assert.match(rules, /match \/\{document=\*\*\}/);
  assert.match(rules, /allow read, write: if false/);
  assert.doesNotMatch(rules, /allow read, write: if true/);
});

test("GitHub Pages workflow does not contain Firebase values", async () => {
  const workflow = await readFile(new URL("../.github/workflows/deploy-pages.yml", import.meta.url), "utf8");
  assert.match(workflow, /actions\/deploy-pages@v4/);
  assert.match(workflow, /secrets\.VITE_FIREBASE_PROJECT_ID/);
  assert.doesNotMatch(workflow, /AIza[0-9A-Za-z_-]{20,}/);
});

test("reservation form supports editable names and multiple periods", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /user\?\.displayName \|\| "Preview Teacher"/);
  assert.match(page, /Teacher name/);
  assert.match(page, /selectedPeriods/);
  assert.match(page, /Periods — select all that apply/);
  assert.match(page, /dates\.flatMap\(\(date\) => selectedPeriods\.map/);
});
