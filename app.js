import { COLLECTION_NAME } from "./firebase-config.js";
import { CARTS, PERIODS, SCHOOL_YEAR_START, SCHOOL_YEAR_END, SCHOOL_CALENDAR } from "./calendar-data.js";
import { db } from "./firebase-init.js";

import {
  collection, doc, getDoc, setDoc, deleteDoc,
  onSnapshot, query, where, writeBatch, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// ---------------------------------------------------------------------------
// Constants & small date helpers
// ---------------------------------------------------------------------------
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MS_DAY = 24 * 60 * 60 * 1000;

function toISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function fromISO(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function addDays(d, n) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}
function getMonday(d) {
  const day = d.getDay(); // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(d, diff);
}
function displayDate(d) {
  return `${DAY_NAMES[d.getDay()]} ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
}
function isSameDate(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function docId(dateISO, period, cartId) {
  return `${dateISO}_p${period}_${cartId}`;
}
function calInfo(dateISO) {
  return SCHOOL_CALENDAR[dateISO] || null;
}

// ---------------------------------------------------------------------------
// NOTE: sign-in itself lives in auth.js (which has no external dependencies
// until a sign-in is attempted) and dynamically imports this module, calling
// startApp(user), only after a valid @d211.org Google sign-in. See auth.js.
// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------
let toastTimer = null;
function showToast(msg, ms = 3800) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add("hidden"), ms);
}

// ---------------------------------------------------------------------------
// App state
// ---------------------------------------------------------------------------
let currentUid = null; // signed-in teacher's Firebase UID — used to prove booking ownership to Firestore
let currentEmail = null; // signed-in teacher's @d211.org email
let currentWeekMonday = getMonday(new Date());
let unsubscribeWeek = null;
let weekBookings = {}; // docId -> booking data (for the currently displayed week)

const weekContainer = document.getElementById("weekContainer");
const myNameInput = document.getElementById("myNameInput");

function myName() {
  return (myNameInput.value || "").trim();
}

export function startApp(user) {
  currentUid = user.uid;
  currentEmail = user.email;
  myNameInput.value = localStorage.getItem("cartSignupMyName") || user.displayName || "";
  myNameInput.addEventListener("change", () => {
    localStorage.setItem("cartSignupMyName", myName());
  });

  const signedInAsEl = document.getElementById("signedInAs");
  if (signedInAsEl) signedInAsEl.textContent = `Signed in as ${user.email}`;

  renderWeek();

  document.getElementById("prevWeekBtn").addEventListener("click", () => {
    currentWeekMonday = addDays(currentWeekMonday, -7);
    renderWeek();
  });
  document.getElementById("thisWeekBtn").addEventListener("click", () => {
    currentWeekMonday = getMonday(new Date());
    renderWeek();
  });
  document.getElementById("nextWeekBtn").addEventListener("click", () => {
    currentWeekMonday = addDays(currentWeekMonday, 7);
    renderWeek();
  });

  document.getElementById("modalCloseBtn").addEventListener("click", closeModal);
  document.getElementById("modalOverlay").addEventListener("click", (e) => {
    if (e.target.id === "modalOverlay") closeModal();
  });
}

// ---------------------------------------------------------------------------
// Rendering the week
// ---------------------------------------------------------------------------
function weekDates() {
  return [0, 1, 2, 3, 4].map((i) => addDays(currentWeekMonday, i));
}

function renderWeek() {
  const dates = weekDates();
  const isoList = dates.map(toISO);

  if (unsubscribeWeek) unsubscribeWeek();

  const q = query(collection(db, COLLECTION_NAME), where("date", "in", isoList));
  unsubscribeWeek = onSnapshot(q, (snap) => {
    weekBookings = {};
    snap.forEach((d) => { weekBookings[d.id] = { id: d.id, ...d.data() }; });
    paintWeek(dates);
  }, (err) => {
    console.error(err);
    weekContainer.innerHTML = `<div class="closed-banner">Error loading bookings: ${err.message}</div>`;
  });
}

function paintWeek(dates) {
  const today = new Date();
  weekContainer.innerHTML = "";

  dates.forEach((date) => {
    const iso = toISO(date);
    const info = calInfo(iso);
    const card = document.createElement("div");
    card.className = "day-card" + (isSameDate(date, today) ? " today" : "");

    const header = document.createElement("div");
    header.className = "day-card-header";
    const title = document.createElement("div");
    title.className = "day-title";
    title.innerHTML = `${displayDate(date)} <small>${date.getFullYear()}</small>`;
    header.appendChild(title);

    if (info && info.schedule) {
      const badge = document.createElement("span");
      badge.className = "badge";
      badge.textContent = info.schedule;
      header.appendChild(badge);
    }
    card.appendChild(header);

    if (info && info.status === "closed") {
      const banner = document.createElement("div");
      banner.className = "closed-banner";
      banner.textContent = `NO SCHOOL — ${info.label}`;
      card.appendChild(banner);
    } else {
      card.appendChild(buildDayTable(iso));
    }

    weekContainer.appendChild(card);
  });
}

function buildDayTable(iso) {
  const table = document.createElement("table");
  table.className = "cart-table";

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  headRow.innerHTML = `<th class="period-col">Per.</th>` + CARTS.map((c) => `<th>${c.name}</th>`).join("");
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  PERIODS.forEach((period) => {
    const row = document.createElement("tr");
    const periodCell = document.createElement("td");
    periodCell.className = "period-cell";
    periodCell.textContent = period;
    row.appendChild(periodCell);

    CARTS.forEach((cart) => {
      const id = docId(iso, period, cart.id);
      const booking = weekBookings[id];
      const td = document.createElement("td");
      td.className = "slot";
      const btn = document.createElement("button");
      btn.className = "slot-btn";

      if (booking) {
        const mine = booking.ownerUid === currentUid;
        btn.classList.add(mine ? "mine" : "booked");
        btn.innerHTML = `<span class="who">${escapeHtml(booking.teacher)}</span><span class="room">Rm ${escapeHtml(booking.room)}</span>`;
        btn.addEventListener("click", () => openViewModal(booking, iso, period, cart));
      } else {
        btn.textContent = "OPEN";
        btn.addEventListener("click", () => openBookModal(iso, period, cart));
      }
      td.appendChild(btn);
      row.appendChild(td);
    });
    tbody.appendChild(row);
  });
  table.appendChild(tbody);
  return table;
}

function escapeHtml(s) {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

// ---------------------------------------------------------------------------
// Modal: new booking
// ---------------------------------------------------------------------------
const modalOverlay = document.getElementById("modalOverlay");
const modalContent = document.getElementById("modalContent");

function closeModal() {
  modalOverlay.classList.add("hidden");
  modalContent.innerHTML = "";
}

function openBookModal(iso, period, cart) {
  const date = fromISO(iso);
  const defaultUntil = SCHOOL_YEAR_END;
  modalContent.innerHTML = `
    <h2>Book ${cart.name}</h2>
    <p class="sub">${displayDate(date)}, ${date.getFullYear()} &mdash; Period ${period}</p>

    <label for="bookName">Your name</label>
    <input type="text" id="bookName" placeholder="e.g. Mr. Craddock" value="${escapeHtml(myName())}" />

    <label for="bookRoom">Room you'll use the cart in</label>
    <input type="text" id="bookRoom" placeholder="e.g. 210" />
    <p class="field-error" id="bookError"></p>

    <div class="checkbox-row">
      <input type="checkbox" id="bookRecurring" />
      <label for="bookRecurring">Repeat every week on this same day &amp; period</label>
    </div>
    <div class="recur-until hidden" id="recurUntilRow">
      <label for="bookUntil">Repeat through (last date)</label>
      <input type="date" id="bookUntil" value="${defaultUntil}" min="${iso}" max="${SCHOOL_YEAR_END}" />
    </div>

    <div class="modal-actions">
      <button class="btn-secondary" id="cancelBookBtn">Cancel</button>
      <button class="btn-primary" id="confirmBookBtn">Book It</button>
    </div>
  `;
  modalOverlay.classList.remove("hidden");

  document.getElementById("bookRecurring").addEventListener("change", (e) => {
    document.getElementById("recurUntilRow").classList.toggle("hidden", !e.target.checked);
  });
  document.getElementById("cancelBookBtn").addEventListener("click", closeModal);
  document.getElementById("confirmBookBtn").addEventListener("click", () => {
    submitBooking(iso, period, cart);
  });
}

async function submitBooking(iso, period, cart) {
  const nameEl = document.getElementById("bookName");
  const roomEl = document.getElementById("bookRoom");
  const recurring = document.getElementById("bookRecurring").checked;
  const until = document.getElementById("bookUntil").value;
  const errorEl = document.getElementById("bookError");

  const teacher = nameEl.value.trim();
  const room = roomEl.value.trim();

  if (!teacher || !room) {
    errorEl.textContent = "Please fill in your name and the room.";
    return;
  }

  localStorage.setItem("cartSignupMyName", teacher);
  myNameInput.value = teacher;

  const confirmBtn = document.getElementById("confirmBookBtn");
  confirmBtn.disabled = true;
  confirmBtn.textContent = "Booking...";

  try {
    if (recurring) {
      await bookRecurring(iso, period, cart, teacher, room, until);
    } else {
      await bookSingle(iso, period, cart, teacher, room, null);
      showToast(`Booked ${cart.name}, period ${period}, ${iso}.`);
    }
    closeModal();
  } catch (err) {
    console.error(err);
    errorEl.textContent = "That slot was just booked by someone else, or a connection error occurred. Please try again.";
    confirmBtn.disabled = false;
    confirmBtn.textContent = "Book It";
  }
}

async function bookSingle(iso, period, cart, teacher, room, seriesId) {
  const id = docId(iso, period, cart.id);
  const ref = doc(db, COLLECTION_NAME, id);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    throw new Error("slot-taken");
  }
  await setDoc(ref, {
    date: iso,
    period,
    cart: cart.id,
    teacher,
    room,
    seriesId: seriesId || null,
    ownerUid: currentUid,
    ownerEmail: currentEmail,
    createdAt: serverTimestamp(),
  });
}

async function bookRecurring(startIso, period, cart, teacher, room, untilIso) {
  const seriesId = `series_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const targetDates = [];
  let d = fromISO(startIso);
  const until = fromISO(untilIso);
  while (d <= until) {
    const iso = toISO(d);
    const info = calInfo(iso);
    if (!info || info.status !== "closed") {
      targetDates.push(iso);
    }
    d = addDays(d, 7);
  }

  // Check which slots are already taken.
  const refs = targetDates.map((iso) => doc(db, COLLECTION_NAME, docId(iso, period, cart.id)));
  const snaps = await Promise.all(refs.map((r) => getDoc(r)));
  const freeDates = [];
  const conflictDates = [];
  snaps.forEach((snap, i) => {
    if (snap.exists()) conflictDates.push(targetDates[i]);
    else freeDates.push(targetDates[i]);
  });

  if (freeDates.length === 0) {
    throw new Error("no-open-dates");
  }

  // Firestore batches max out at 500 writes; a school year of weekly slots
  // is well under that, but chunk just in case.
  for (let i = 0; i < freeDates.length; i += 400) {
    const chunk = freeDates.slice(i, i + 400);
    const batch = writeBatch(db);
    chunk.forEach((iso) => {
      const ref = doc(db, COLLECTION_NAME, docId(iso, period, cart.id));
      batch.set(ref, {
        date: iso,
        period,
        cart: cart.id,
        teacher,
        room,
        seriesId,
        ownerUid: currentUid,
        ownerEmail: currentEmail,
        createdAt: serverTimestamp(),
      });
    });
    await batch.commit();
  }

  let msg = `Booked ${cart.name}, period ${period}, on ${freeDates.length} date(s) through ${untilIso}.`;
  if (conflictDates.length) {
    msg += ` Skipped ${conflictDates.length} date(s) already booked by someone else.`;
  }
  showToast(msg, 6000);
}

// ---------------------------------------------------------------------------
// Modal: view / cancel existing booking
// ---------------------------------------------------------------------------
function openViewModal(booking, iso, period, cart) {
  const date = fromISO(iso);
  const isMine = booking.ownerUid === currentUid;

  modalContent.innerHTML = `
    <h2>${cart.name}</h2>
    <p class="sub">${displayDate(date)}, ${date.getFullYear()} &mdash; Period ${period}</p>
    <p class="info-row"><strong>Booked by:</strong> ${escapeHtml(booking.teacher)}${booking.ownerEmail ? ` <span style="color:#888;font-size:0.8em;">(${escapeHtml(booking.ownerEmail)})</span>` : ""}</p>
    <p class="info-row"><strong>Room:</strong> ${escapeHtml(booking.room)}</p>
    ${booking.seriesId ? `<p class="info-row"><em>Part of a recurring weekly signup.</em></p>` : ""}
    <p class="field-error" id="viewError"></p>
    <div class="modal-actions">
      ${isMine ? `<button class="btn-danger" id="cancelOneBtn">Cancel this date</button>` : `<button class="btn-secondary" id="closeViewBtn">Close</button>`}
      ${isMine && booking.seriesId ? `<button class="btn-danger" id="cancelSeriesBtn">Cancel this &amp; future dates</button>` : ""}
    </div>
  `;
  modalOverlay.classList.remove("hidden");

  const closeBtn = document.getElementById("closeViewBtn");
  if (closeBtn) closeBtn.addEventListener("click", closeModal);

  const cancelOneBtn = document.getElementById("cancelOneBtn");
  if (cancelOneBtn) {
    cancelOneBtn.addEventListener("click", async () => {
      if (!confirm(`Cancel ${cart.name}, period ${period}, on ${iso}?`)) return;
      try {
        await deleteDoc(doc(db, COLLECTION_NAME, booking.id));
        showToast("Booking canceled.");
        closeModal();
      } catch (err) {
        document.getElementById("viewError").textContent = "Could not cancel: " + err.message;
      }
    });
  }

  const cancelSeriesBtn = document.getElementById("cancelSeriesBtn");
  if (cancelSeriesBtn) {
    cancelSeriesBtn.addEventListener("click", async () => {
      if (!confirm(`Cancel this and all FUTURE dates in this recurring signup (from ${iso} onward)?`)) return;
      try {
        await cancelSeriesFrom(booking.seriesId, iso);
        showToast("Recurring signup canceled from this date forward.");
        closeModal();
      } catch (err) {
        document.getElementById("viewError").textContent = "Could not cancel series: " + err.message;
      }
    });
  }
}

async function cancelSeriesFrom(seriesId, fromIso) {
  const q = query(collection(db, COLLECTION_NAME), where("seriesId", "==", seriesId));
  const snap = await new Promise((resolve, reject) => {
    // one-shot read via onSnapshot's first callback, then unsubscribe
    const unsub = onSnapshot(q, (s) => { unsub(); resolve(s); }, reject);
  });
  const toDelete = [];
  snap.forEach((d) => {
    if (d.data().date >= fromIso) toDelete.push(d.ref);
  });
  for (let i = 0; i < toDelete.length; i += 400) {
    const chunk = toDelete.slice(i, i + 400);
    const batch = writeBatch(db);
    chunk.forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
}
