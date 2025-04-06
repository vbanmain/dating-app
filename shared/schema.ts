import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  bio: text("bio"),
  location: text("location"),
  photoUrls: jsonb("photo_urls").default([]).notNull(),
  interests: jsonb("interests").default([]).notNull(),
  gender: text("gender").notNull(),
  genderPreference: text("gender_preference").notNull(),
  ageRangeMin: integer("age_range_min").default(18).notNull(),
  ageRangeMax: integer("age_range_max").default(100).notNull(),
  maxDistance: integer("max_distance").default(50).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastActive: timestamp("last_active").defaultNow().notNull(),
});

// Profile like schema
export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  likerId: integer("liker_id").notNull().references(() => users.id),
  likedId: integer("liked_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Message schema
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastActive: true,
});

export const loginUserSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(100),
});

export const registerUserSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(6).max(100),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const updateUserSchema = insertUserSchema.partial();

export const insertLikeSchema = createInsertSchema(likes).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  read: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;

export type Like = typeof likes.$inferSelect;
export type InsertLike = z.infer<typeof insertLikeSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
