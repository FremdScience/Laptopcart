"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  runTransaction,
  where,
} from "firebase/firestore";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { auth, db, firebaseReady } from "./lib/firebase";
import {
  addDays,
  formatDate,
  getDayInfo,
  getMonday,
  isBookableDate,
  toISODate,
} from "./lib/school-calendar";

type Cart = "Cart #1" | "Cart #2";

type Booking = {
  id: string;
  date: string;
  period: number;
  cart: Cart;
  room: string;
  teacherName: string;
  teacherEmail: string;
  ownerUid: string;
  createdAt: string;
  seriesId?: string;
};

const carts: { name: Cart; home: string; accent: string }[] = [
  { name: "Cart #1", home: "Behind Room 245", accent: "green" },
  { name: "Cart #2", home: "Between Rooms 150 & 152", accent: "gold" },
];

const periods = Array.from({ length: 8 }, (_, index) => index + 1);

const demoBookings: Booking[] = [
  {
    id: "2026-08-10_cart-1_8",
    date: "2026-08-10",
    period: 8,
    cart: "Cart #1",
    room: "250",
    teacherName: "Alex Morgan",
    teacherEmail: "amorgan@d211.org",
    ownerUid: "demo-user",
    createdAt: "2026-08-10T08:00:00.000Z",
  },
  {
    id: "2026-08-12_cart-2_3",
    date: "2026-08-12",
    period: 3,
    cart: "Cart #2",
    room: "214",
    teacherName: "Jordan Lee",
    teacherEmail: "jlee@d211.org",
    ownerUid: "another-user",
    createdAt: "2026-08-10T08:00:00.000Z",
  },
];

const today = new Date(2026, 7, 12);

function bookingId(date: string, cart: Cart, period: number) {
  return `${date}_${cart === "Cart #1" ? "cart-1" : "cart-2"}_${period}`;
}

export default function Home() {
  const [weekStart, setWeekStart] = useState(() => getMonday(today));
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(firebaseReady);
  const [authError, setAuthError] = useState("");
  const [bookings, setBookings] = useState<Booking[]>(firebaseReady ? [] : demoBookings);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    date: string;
    period: number;
    cart: Cart;
  } | null>(null);
  const [mineOnly, setMineOnly] = useState(false);

  const weekDates = useMemo(
    () => Array.from({ length: 5 }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  );

  useEffect(() => {
    if (!firebaseReady || !auth) return;
    return onAuthStateChanged(auth, (nextUser) => {
      if (nextUser?.email && !nextUser.email.toLowerCase().endsWith("@d211.org")) {
        setAuthError("Please sign in with your @d211.org school account.");
        void signOut(auth);
        setUser(null);
      } else {
        setUser(nextUser);
      }
      setAuthLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!firebaseReady || !db || !user) return;
    const start = toISODate(weekStart);
    const end = toISODate(addDays(weekStart, 4));
    const bookingsQuery = query(
      collection(db, "bookings"),
      where("date", ">=", start),
      where("date", "<=", end),
    );
    return onSnapshot(bookingsQuery, (snapshot) => {
      setBookings(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Booking));
    });
  }, [weekStart, user]);

  async function handleSignIn() {
    if (!auth) return;
    setAuthError("");
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ hd: "d211.org", prompt: "select_account" });
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Sign-in was not completed.");
    }
  }

  function openBooking(date: string, period: number, cart: Cart) {
    setSelectedSlot({ date, period, cart });
    setModalOpen(true);
  }

  async function removeBooking(booking: Booking) {
    if (!db || !user || booking.ownerUid !== user.uid) return;
    if (window.confirm(`Cancel ${booking.cart} for ${formatDate(booking.date)} · Period ${booking.period}?`)) {
      await deleteDoc(doc(db, "bookings", booking.id));
    }
  }

  const visibleBookings = mineOnly && user
    ? bookings.filter((booking) => booking.ownerUid === user.uid)
    : bookings;

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#schedule" aria-label="FHS cart reservations home">
          <span className="brand-mark" aria-hidden="true">F</span>
          <span>
            <strong>FHS Science</strong>
            <small>Laptop Cart Reservations</small>
          </span>
        </a>
        <div className="account-area">
          {firebaseReady && user ? (
            <>
              <span className="user-badge">
                <span className="avatar">{(user.displayName || user.email || "T").charAt(0)}</span>
                <span><strong>{user.displayName || "D211 Teacher"}</strong><small>{user.email}</small></span>
              </span>
              <button className="text-button" onClick={() => auth && signOut(auth)}>Sign out</button>
            </>
          ) : firebaseReady ? (
            <button className="google-button" onClick={handleSignIn} disabled={authLoading}>
              <span className="google-g">G</span>{authLoading ? "Checking account…" : "Sign in with Google"}
            </button>
          ) : (
            <span className="preview-pill">Preview mode</span>
          )}
        </div>
      </header>

      <section className="hero" id="schedule">
        <div>
          <p className="eyebrow">2026–2027 SCHOOL YEAR</p>
          <h1>Reserve a <em>laptop cart.</em></h1>
        </div>
        <div className="cart-locations" aria-label="Cart home locations">
          {carts.map((cart) => (
            <article key={cart.name} className={`location-card ${cart.accent}`}>
              <span className="cart-icon" aria-hidden="true">▦</span>
              <div><small>{cart.name.toUpperCase()}</small><strong>{cart.home}</strong></div>
            </article>
          ))}
        </div>
      </section>

      <section className="schedule-shell">
        <div className="schedule-toolbar">
          <div>
            <p className="eyebrow">WEEKLY AVAILABILITY</p>
            <h2>{formatDate(toISODate(weekStart), { month: "long", day: "numeric" })}–{formatDate(toISODate(addDays(weekStart, 4)), { month: "long", day: "numeric", year: "numeric" })}</h2>
          </div>
          <div className="toolbar-actions">
            {user && (
              <label className="mine-toggle">
                <input type="checkbox" checked={mineOnly} onChange={(event) => setMineOnly(event.target.checked)} />
                My reservations
              </label>
            )}
            <button className="nav-button" onClick={() => setWeekStart(addDays(weekStart, -7))} aria-label="Previous week">‹</button>
            <button className="today-button" onClick={() => setWeekStart(getMonday(today))}>This week</button>
            <button className="nav-button" onClick={() => setWeekStart(addDays(weekStart, 7))} aria-label="Next week">›</button>
            <button className="reserve-button" onClick={() => {
              setSelectedSlot({ date: toISODate(weekDates[0]), period: 1, cart: "Cart #1" });
              setModalOpen(true);
            }}>+ Reserve carts</button>
          </div>
        </div>

        {authError && <div className="notice error" role="alert">{authError}</div>}
        {!firebaseReady && (
          <div className="notice preview">Interactive preview: sample reservations are shown. Add the school Firebase settings to turn on Google sign-in and live reservations.</div>
        )}
        {firebaseReady && !user && !authLoading ? (
          <div className="sign-in-gate">
            <span className="gate-icon">▦</span>
            <h2>Sign in to view the cart schedule</h2>
            <p>Use your District 211 Google account. Only addresses ending in @d211.org are allowed.</p>
            <button className="google-button large" onClick={handleSignIn}><span className="google-g">G</span>Continue with Google</button>
          </div>
        ) : (
          <div className="week-grid" role="grid" aria-label="Laptop cart schedule">
            {weekDates.map((date) => {
              const iso = toISODate(date);
              const dayInfo = getDayInfo(iso);
              const bookable = isBookableDate(iso);
              return (
                <article className={`day-column ${!bookable ? "closed" : ""}`} key={iso}>
                  <header className="day-heading">
                    <span>{date.toLocaleDateString("en-US", { weekday: "short" })}</span>
                    <strong>{date.getDate()}</strong>
                    {dayInfo.label && <small>{dayInfo.label}</small>}
                  </header>
                  {!bookable ? (
                    <div className="closed-card"><span>×</span><strong>No school</strong><small>{dayInfo.reason}</small></div>
                  ) : periods.map((period) => (
                    <div className="period-row" key={period}>
                      <span className="period-label">P{period}</span>
                      {carts.map((cart) => {
                        const booking = visibleBookings.find(
                          (item) => item.date === iso && item.period === period && item.cart === cart.name,
                        );
                        return booking ? (
                          <button
                            key={cart.name}
                            className={`slot booked ${cart.accent}`}
                            onClick={() => booking.ownerUid === user?.uid && removeBooking(booking)}
                            title={booking.ownerUid === user?.uid ? "Click to cancel your reservation" : `${booking.teacherName} · Room ${booking.room}`}
                          >
                            <strong>{booking.teacherName.split(" ")[0]}</strong>
                            <small>Rm {booking.room}</small>
                          </button>
                        ) : (
                          <button key={cart.name} className="slot open" onClick={() => openBooking(iso, period, cart.name)}>
                            <span className={`cart-dot ${cart.accent}`} />Open
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </article>
              );
            })}
          </div>
        )}
        <div className="legend">
          <span><i className="legend-dot green" />Cart #1</span>
          <span><i className="legend-dot gold" />Cart #2</span>
          <span><i className="legend-box" />Reserved — room shows where to find it</span>
        </div>
      </section>

      <section className="reminders">
        <div className="reminders-heading">
          <p className="eyebrow">CART CARE &amp; COORDINATION</p>
          <h2>A few helpful reminders</h2>
          <p>Help the next teacher begin on time by keeping each cart charged, accounted for, and easy to locate.</p>
        </div>
        <div className="reminder-grid">
          <article>
            <span aria-hidden="true">↩</span>
            <div><strong>Return and plug in</strong><p>After use, return the cart to its assigned storage location and leave it <b>plugged in</b>. Cart #1 belongs behind Room 245; Cart #2 belongs between Rooms 150 and 152.</p></div>
          </article>
          <article>
            <span aria-hidden="true">✓</span>
            <div><strong>Check the full day</strong><p>Review the day’s reservations before taking a cart. If another teacher is using it, coordinate the handoff and where the cart will be each period.</p></div>
          </article>
          <article>
            <span aria-hidden="true">8</span>
            <div><strong>Reserve only what you need</strong><p>Please sign up only for the periods you will actually use. This keeps both carts available to as many classes as possible.</p></div>
          </article>
          <article>
            <span aria-hidden="true">!</span>
            <div><strong>Report problems promptly</strong><p>Submit a Help Desk request for laptop issues right away so they can be addressed before the cart’s next reservation.</p></div>
          </article>
        </div>
      </section>

      <section className="how-it-works">
        <div><p className="eyebrow">SIMPLE BY DESIGN</p><h2>Reserve once.<br />Stay organized all year.</h2></div>
        <ol>
          <li><span>1</span><div><strong>Pick your cart and periods</strong><p>Choose one or several periods for Cart #1 or Cart #2.</p></div></li>
          <li><span>2</span><div><strong>Add your room</strong><p>Everyone can see exactly where the cart went.</p></div></li>
          <li><span>3</span><div><strong>Repeat when you need it</strong><p>Select dates or reserve a weekly pattern through the school year.</p></div></li>
        </ol>
      </section>

      {modalOpen && selectedSlot && (
        <BookingModal
          initial={selectedSlot}
          user={user}
          existing={bookings}
          onClose={() => setModalOpen(false)}
          onPreviewSave={(created) => {
            setBookings((current) => [...current, ...created]);
            setModalOpen(false);
          }}
        />
      )}
    </main>
  );
}

function BookingModal({ initial, user, existing, onClose, onPreviewSave }: {
  initial: { date: string; period: number; cart: Cart };
  user: User | null;
  existing: Booking[];
  onClose: () => void;
  onPreviewSave: (created: Booking[]) => void;
}) {
  const [cart, setCart] = useState<Cart>(initial.cart);
  const [selectedPeriods, setSelectedPeriods] = useState<number[]>([initial.period]);
  const [teacherName, setTeacherName] = useState(user?.displayName || "Preview Teacher");
  const [room, setRoom] = useState("");
  const [startDate, setStartDate] = useState(initial.date);
  const [endDate, setEndDate] = useState(initial.date);
  const [repeat, setRepeat] = useState<"once" | "weekly">("once");
  const [weekdays, setWeekdays] = useState<number[]>([new Date(`${initial.date}T12:00:00`).getDay()]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const dates = useMemo(() => {
    if (repeat === "once") return isBookableDate(startDate) ? [startDate] : [];
    const output: string[] = [];
    let cursor = new Date(`${startDate}T12:00:00`);
    const last = new Date(`${endDate}T12:00:00`);
    while (cursor <= last && output.length < 220) {
      const iso = toISODate(cursor);
      if (weekdays.includes(cursor.getDay()) && isBookableDate(iso)) output.push(iso);
      cursor = addDays(cursor, 1);
    }
    return output;
  }, [repeat, startDate, endDate, weekdays]);

  const selectedSlots = useMemo(
    () => dates.flatMap((date) => selectedPeriods.map((period) => ({ date, period }))),
    [dates, selectedPeriods],
  );

  const conflicts = selectedSlots.filter(({ date, period }) =>
    existing.some((item) => item.id === bookingId(date, cart, period)),
  );

  function toggleWeekday(day: number) {
    setWeekdays((current) => current.includes(day) ? current.filter((item) => item !== day) : [...current, day]);
  }

  function togglePeriod(period: number) {
    setSelectedPeriods((current) =>
      current.includes(period)
        ? current.filter((item) => item !== period)
        : [...current, period].sort((a, b) => a - b),
    );
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    if (!teacherName.trim()) return setMessage("Enter the teacher name for this reservation.");
    if (!room.trim()) return setMessage("Enter the room where you will use the cart.");
    if (!selectedPeriods.length) return setMessage("Choose at least one period.");
    if (!dates.length) return setMessage("Choose at least one instructional day.");
    if (conflicts.length) return setMessage(`${conflicts.length} selected cart slot${conflicts.length === 1 ? " is" : "s are"} already reserved. Adjust the dates or periods and try again.`);
    if (firebaseReady && !user) return setMessage("Sign in with your @d211.org account before reserving.");

    setSaving(true);
    const seriesId = crypto.randomUUID();
    const ownerUid = user?.uid || "demo-user";
    const teacherEmail = user?.email || "preview@d211.org";
    const created = selectedSlots.map(({ date, period }) => ({
      id: bookingId(date, cart, period),
      date,
      cart,
      period,
      room: room.trim(),
      teacherName: teacherName.trim(),
      teacherEmail,
      ownerUid,
      seriesId,
      createdAt: new Date().toISOString(),
    }));

    try {
      if (db && user) {
        // Firestore transactions have a write limit, so very large year-long
        // multi-period series are committed in safe, conflict-checked groups.
        for (let offset = 0; offset < created.length; offset += 400) {
          const group = created.slice(offset, offset + 400);
          await runTransaction(db, async (transaction) => {
            const refs = group.map((item) => doc(db, "bookings", item.id));
            const snapshots = await Promise.all(refs.map((ref) => transaction.get(ref)));
            if (snapshots.some((snapshot) => snapshot.exists())) throw new Error("One of these slots was just reserved by another teacher. Refresh and try again.");
            refs.forEach((ref, index) => transaction.set(ref, group[index]));
          });
        }
        onClose();
      } else {
        onPreviewSave(created);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The reservation could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="booking-modal" role="dialog" aria-modal="true" aria-labelledby="booking-title">
        <button className="close-button" onClick={onClose} aria-label="Close">×</button>
        <p className="eyebrow">NEW RESERVATION</p>
        <h2 id="booking-title">Reserve a laptop cart</h2>
        <p className="modal-intro">School closures are skipped automatically. Altered schedules still show periods 1–8.</p>
        <form onSubmit={save}>
          <div className="two-fields">
            <label>Teacher name<input value={teacherName} onChange={(event) => setTeacherName(event.target.value)} placeholder="First and last name" maxLength={100} autoFocus /></label>
            <label>Cart<select value={cart} onChange={(event) => setCart(event.target.value as Cart)}>{carts.map((item) => <option key={item.name}>{item.name}</option>)}</select></label>
          </div>
          <label>Room where you’ll use the cart<input value={room} onChange={(event) => setRoom(event.target.value)} placeholder="Example: 250" maxLength={12} /></label>
          <fieldset>
            <legend>Periods — select all that apply</legend>
            <div className="period-pills">
              {periods.map((period) => <button type="button" key={period} className={selectedPeriods.includes(period) ? "active" : ""} aria-pressed={selectedPeriods.includes(period)} onClick={() => togglePeriod(period)}>P{period}</button>)}
            </div>
          </fieldset>
          <fieldset>
            <legend>Dates</legend>
            <div className="segmented">
              <button type="button" className={repeat === "once" ? "active" : ""} onClick={() => { setRepeat("once"); setEndDate(startDate); }}>One date</button>
              <button type="button" className={repeat === "weekly" ? "active" : ""} onClick={() => { setRepeat("weekly"); setEndDate("2027-05-20"); }}>Weekly pattern</button>
            </div>
          </fieldset>
          <div className="two-fields">
            <label>{repeat === "once" ? "Reservation date" : "Start date"}<input type="date" min="2026-08-10" max="2027-05-20" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
            {repeat === "weekly" && <label>End date<input type="date" min={startDate} max="2027-05-20" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label>}
          </div>
          {repeat === "weekly" && (
            <fieldset>
              <legend>Repeat on</legend>
              <div className="weekday-pills">
                {[1, 2, 3, 4, 5].map((day) => <button type="button" key={day} className={weekdays.includes(day) ? "active" : ""} onClick={() => toggleWeekday(day)}>{["", "Mon", "Tue", "Wed", "Thu", "Fri"][day]}</button>)}
              </div>
            </fieldset>
          )}
          <div className="reservation-summary">
            <span><strong>{dates.length}</strong> instructional {dates.length === 1 ? "date" : "dates"}</span>
            <span>{cart} · {selectedPeriods.length ? `Periods ${selectedPeriods.join(", ")}` : "No periods selected"}</span>
            <span><strong>{selectedSlots.length}</strong> total {selectedSlots.length === 1 ? "booking" : "bookings"}</span>
          </div>
          {message && <p className="form-error" role="alert">{message}</p>}
          <div className="modal-actions"><button type="button" className="cancel-button" onClick={onClose}>Cancel</button><button className="reserve-button" disabled={saving}>{saving ? "Reserving…" : `Reserve ${selectedSlots.length || ""} ${selectedSlots.length === 1 ? "booking" : "bookings"}`}</button></div>
        </form>
      </section>
    </div>
  );
}
