import { pgTable, text, serial, varchar, decimal, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session table
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 20 }).notNull().unique(),
  giftName: varchar("gift_name", { length: 255 }).notNull(),
  giftPrice: decimal("gift_price", { precision: 10, scale: 2 }).notNull(),
  giftLink: text("gift_link"),
  organizerName: varchar("organizer_name", { length: 100 }).notNull(),
  organizerSecret: varchar("organizer_secret", { length: 100 }).notNull(),
  organizerContribution: decimal("organizer_contribution", { precision: 10, scale: 2 }).notNull(),
  expectedParticipants: serial("expected_participants").notNull(),
  isComplete: boolean("is_complete").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Participants table
export const participants = pgTable("participants", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 20 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  contribution: decimal("contribution", { precision: 10, scale: 2 }).notNull(),
  isOrganizer: boolean("is_organizer").default(false).notNull(),
  refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const sessionsRelations = relations(sessions, ({ many }) => ({
  participants: many(participants)
}));

export const participantsRelations = relations(participants, ({ one }) => ({
  session: one(sessions, {
    fields: [participants.sessionId],
    references: [sessions.sessionId]
  })
}));

// Schemas
export const sessionInsertSchema = createInsertSchema(sessions, {
  giftPrice: (schema) => schema.transform(val => parseFloat(val.toString())),
  organizerContribution: (schema) => schema.transform(val => parseFloat(val.toString())),
  expectedParticipants: (schema) => schema.transform(val => parseInt(val.toString())),
});

export const sessionSelectSchema = createSelectSchema(sessions);
export type Session = z.infer<typeof sessionSelectSchema>;
export type SessionInsert = z.infer<typeof sessionInsertSchema>;

export const participantInsertSchema = createInsertSchema(participants, {
  contribution: (schema) => schema.transform(val => parseFloat(val.toString())),
  refundAmount: (schema) => schema.transform(val => parseFloat(val.toString())),
});

export const participantSelectSchema = createSelectSchema(participants);
export type Participant = z.infer<typeof participantSelectSchema>;
export type ParticipantInsert = z.infer<typeof participantInsertSchema>;

// Custom session creation schema
export const createSessionSchema = z.object({
  organizerName: z.string().min(1, "Name is required"),
  giftName: z.string().min(1, "Gift name is required"),
  giftLink: z.string().url("Please enter a valid URL").or(z.string().length(0)).optional(),
  giftPrice: z.number().positive("Price must be positive"),
  organizerContribution: z.number().min(0, "Contribution must be non-negative"),
  expectedParticipants: z.number().int().positive("Expected participants must be a positive integer"),
  organizerSecret: z.string().min(4, "Secret must be at least 4 characters")
});

// Custom participant join schema
export const joinSessionSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
  name: z.string().min(1, "Name is required"),
  isOrganizer: z.boolean().default(false),
  organizerSecret: z.string().optional()
});

// Custom participant contribution schema
export const participantContributionSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
  name: z.string().min(1, "Name is required"),
  contribution: z.number().positive("Contribution must be positive")
});

// Custom session edit schema
export const editSessionSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
  organizerSecret: z.string().min(1, "Organizer secret is required"),
  giftName: z.string().min(1, "Gift name is required"),
  giftLink: z.string().url("Please enter a valid URL").or(z.string().length(0)).optional(),
  giftPrice: z.number().positive("Price must be positive"),
  organizerContribution: z.number().min(0, "Contribution must be non-negative")
});

// Remove participant schema
export const removeParticipantSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
  organizerSecret: z.string().min(1, "Organizer secret is required"),
  participantId: z.number().int().positive("Participant ID must be a positive integer")
});
