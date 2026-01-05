import {
  integer,
  pgTable,
  varchar,
  timestamp,
  text,
  jsonb,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: integer()
    .primaryKey()
    .generatedAlwaysAsIdentity(),

  name: varchar({ length: 255 }).notNull(),
  age: integer(),
  email: varchar({ length: 255 }).notNull().unique(),
  credits: integer().default(10),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const sessionsTable = pgTable("sessions", {
  id: integer()
    .primaryKey()
    .generatedAlwaysAsIdentity(),

  userId: integer("user_id"),
  symptoms: text().notNull(),
  selectedDoctorId: integer("selected_doctor_id"),
  matchedDoctors: jsonb("matched_doctors"), // Array of matched doctor objects with scores
  status: varchar({ length: 50 }).default("pending"), // pending, active, completed
  transcript: jsonb("transcript"), // Store chat messages
  summary: text("summary"), // AI generated report/summary

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});
