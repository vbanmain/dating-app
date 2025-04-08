import { pgTable, text, serial, integer, boolean, jsonb, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

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
  isPremium: boolean("is_premium").default(false).notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status").default("inactive").notNull(),
  subscriptionTier: text("subscription_tier").default("free").notNull(),
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
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

// Subscription plans schema
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(), // in cents
  stripePriceId: text("stripe_price_id").notNull(),
  features: jsonb("features").default([]).notNull(),
  durationDays: integer("duration_days").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Payment transactions schema
export const paymentTransactions = pgTable("payment_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(), // in cents
  currency: text("currency").default("usd").notNull(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeCustomerId: text("stripe_customer_id"),
  status: text("status").notNull(), // 'pending', 'succeeded', 'failed'
  description: text("description"),
  metadata: jsonb("metadata").default({}),
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

// Create insert schemas for new tables
export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentTransactionSchema = createInsertSchema(paymentTransactions).omit({
  id: true,
  createdAt: true,
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

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;

export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type InsertPaymentTransaction = z.infer<typeof insertPaymentTransactionSchema>;

// Payment method schema for client-side validation
export const paymentMethodSchema = z.object({
  cardNumber: z.string().min(13).max(19),
  expiryMonth: z.string().min(1).max(2),
  expiryYear: z.string().min(2).max(4),
  cvc: z.string().min(3).max(4),
});

export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

// Define relations between tables
export const usersRelations = relations(users, ({ many }) => ({
  sentLikes: many(likes, { relationName: "userLikes" }),
  receivedLikes: many(likes, { relationName: "userLikedBy" }),
  sentMessages: many(messages, { relationName: "userSentMessages" }),
  receivedMessages: many(messages, { relationName: "userReceivedMessages" }),
  paymentTransactions: many(paymentTransactions, { relationName: "userPaymentTransactions" }),
}));

export const likesRelations = relations(likes, ({ one }) => ({
  liker: one(users, { relationName: "userLikes", fields: [likes.likerId], references: [users.id] }),
  liked: one(users, { relationName: "userLikedBy", fields: [likes.likedId], references: [users.id] }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, { relationName: "userSentMessages", fields: [messages.senderId], references: [users.id] }),
  receiver: one(users, { relationName: "userReceivedMessages", fields: [messages.receiverId], references: [users.id] }),
}));

export const paymentTransactionsRelations = relations(paymentTransactions, ({ one }) => ({
  user: one(users, { relationName: "userPaymentTransactions", fields: [paymentTransactions.userId], references: [users.id] }),
}));
