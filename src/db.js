import Database from "better-sqlite3";


export const db = new Database("database.db");


db.exec(`
  CREATE TABLE IF NOT EXISTS time_slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    is_booked INTEGER NOT NULL DEFAULT 0,
    UNIQUE(date, start_time)
  );
`);


db.exec(`
  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    time_slot_id INTEGER NOT NULL,
    order_number TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (time_slot_id) REFERENCES time_slots(id)
  );
`);
