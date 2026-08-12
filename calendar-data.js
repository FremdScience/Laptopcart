// ---------------------------------------------------------------------------
// SCHOOL CALENDAR DATA — Science Dept Laptop Cart Signup
// ---------------------------------------------------------------------------
// Pulled from "FHS Professional Learning Calendar 2026-2027.pdf".
// Edit this file each year to update the calendar — nothing else needs to change.
//
// CARTS: edit name/location here if a cart is renamed or moved.
export const CARTS = [
  { id: "cart1", name: "Cart #1", location: "Behind Room 245" },
  { id: "cart2", name: "Cart #2", location: "Behind Room 150" },
];

// Periods available for signup each day.
export const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

// The Monday of the first week shown, and the last week the nav will go to.
// Update these each year when you refresh the calendar below.
export const SCHOOL_YEAR_START = "2026-08-03"; // week containing Opening Day (Aug 10, 2026)
export const SCHOOL_YEAR_END = "2027-05-31"; // week containing the last day of exams

// SCHOOL_CALENDAR maps an ISO date string ("YYYY-MM-DD") to info about that day.
//
//   status: "closed"  -> whole day is grayed out, no signups allowed (holiday,
//                         break, teacher institute day, etc.)
//   label:  shown on the "no school" banner for a closed day
//   schedule: shown as a small badge on a normal school day that has a
//             modified schedule (Late Start / Early Dismissal). Signups are
//             still allowed on these days.
export const SCHOOL_CALENDAR = {
  // ---- August 2026 ----
  "2026-08-06": { status: "closed", label: "Teacher Institute Day" },
  "2026-08-07": { status: "closed", label: "Teacher Institute Day" },
  "2026-08-18": { schedule: "Late Start" },
  "2026-08-27": { schedule: "Early Dismissal" },

  // ---- September 2026 ----
  "2026-09-01": { schedule: "Late Start" },
  "2026-09-07": { status: "closed", label: "Labor Day" },
  "2026-09-15": { schedule: "Late Start" },
  "2026-09-29": { schedule: "Late Start" },

  // ---- October 2026 ----
  "2026-10-12": { status: "closed", label: "Holiday - No School" },
  "2026-10-13": { status: "closed", label: "Teacher Institute Day" },
  "2026-10-20": { schedule: "Late Start" },

  // ---- November 2026 ----
  "2026-11-03": { schedule: "Late Start" },
  "2026-11-17": { schedule: "Late Start" },
  "2026-11-25": { status: "closed", label: "Fall Break" },
  "2026-11-26": { status: "closed", label: "Fall Break (Thanksgiving)" },
  "2026-11-27": { status: "closed", label: "Fall Break" },

  // ---- December 2026 ----
  "2026-12-01": { schedule: "Late Start" },
  "2026-12-21": { status: "closed", label: "Winter Break" },
  "2026-12-22": { status: "closed", label: "Winter Break" },
  "2026-12-23": { status: "closed", label: "Winter Break" },
  "2026-12-24": { status: "closed", label: "Winter Break" },
  "2026-12-25": { status: "closed", label: "Winter Break (Christmas)" },
  "2026-12-28": { status: "closed", label: "Winter Break" },
  "2026-12-29": { status: "closed", label: "Winter Break" },
  "2026-12-30": { status: "closed", label: "Winter Break" },
  "2026-12-31": { status: "closed", label: "Winter Break" },

  // ---- January 2027 ----
  "2027-01-01": { status: "closed", label: "Winter Break (New Year's Day)" },
  "2027-01-04": { status: "closed", label: "Teacher Institute Day" },
  "2027-01-12": { schedule: "Late Start" },
  "2027-01-18": { status: "closed", label: "Holiday - No School (MLK Day)" },
  "2027-01-26": { schedule: "Late Start" },

  // ---- February 2027 ----
  "2027-02-02": { schedule: "Late Start" },
  "2027-02-15": { status: "closed", label: "Holiday - No School (Presidents Day)" },
  "2027-02-16": { schedule: "Late Start" },
  "2027-02-18": { schedule: "Early Dismissal" },

  // ---- March 2027 ----
  "2027-03-02": { schedule: "Late Start" },
  "2027-03-04": { schedule: "Early Dismissal" },
  "2027-03-16": { schedule: "Late Start" },
  "2027-03-23": { status: "closed", label: "Spring Break" },
  "2027-03-24": { status: "closed", label: "Spring Break" },
  "2027-03-25": { status: "closed", label: "Spring Break" },
  "2027-03-26": { status: "closed", label: "Spring Break" },

  // ---- April 2027 ----
  "2027-04-06": { schedule: "Late Start" },
  "2027-04-20": { schedule: "Late Start" },

  // ---- May 2027 ----
  "2027-05-07": { schedule: "Early Dismissal" },
  "2027-05-31": { status: "closed", label: "Holiday - No School (Memorial Day)" },
};
