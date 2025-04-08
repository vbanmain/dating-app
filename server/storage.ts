import { users, type User, type InsertUser, type UpdateUser, 
  likes, type Like, type InsertLike, 
  messages, type Message, type InsertMessage,
  subscriptionPlans, type SubscriptionPlan, type InsertSubscriptionPlan,
  paymentTransactions, type PaymentTransaction, type InsertPaymentTransaction } from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, asc, sql, count } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: UpdateUser): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getNearbyUsers(userId: number, maxDistance: number): Promise<User[]>;
  updateLastActive(userId: number): Promise<void>;
  updateStripeCustomerId(userId: number, customerId: string): Promise<User>;
  updateUserSubscription(userId: number, subscriptionId: string, tier: string, status: string, expiresAt: Date | null): Promise<User>;
  
  // Like methods
  createLike(like: InsertLike): Promise<Like>;
  getLikeByUserIds(likerId: number, likedId: number): Promise<Like | undefined>;
  getLikesByLikerId(likerId: number): Promise<Like[]>;
  getLikesForUser(likedId: number): Promise<Like[]>;
  
  // Match methods
  getMatches(userId: number): Promise<User[]>;
  
  // Message methods
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesBetweenUsers(user1Id: number, user2Id: number): Promise<Message[]>;
  getConversations(userId: number): Promise<{user: User, lastMessage: Message}[]>;
  markMessagesAsRead(receiverId: number, senderId: number): Promise<void>;
  
  // Subscription plan methods
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined>;
  getAllSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getActiveSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  
  // Payment transaction methods
  createPaymentTransaction(transaction: InsertPaymentTransaction): Promise<PaymentTransaction>;
  getPaymentTransaction(id: number): Promise<PaymentTransaction | undefined>;
  getUserPaymentTransactions(userId: number): Promise<PaymentTransaction[]>;
  updatePaymentTransactionStatus(id: number, status: string): Promise<PaymentTransaction | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private likes: Map<number, Like>;
  private messages: Map<number, Message>;
  private subscriptionPlans: Map<number, SubscriptionPlan>;
  private paymentTransactions: Map<number, PaymentTransaction>;
  private userIdCounter: number;
  private likeIdCounter: number;
  private messageIdCounter: number;
  private subscriptionPlanIdCounter: number;
  private paymentTransactionIdCounter: number;

  constructor() {
    this.users = new Map();
    this.likes = new Map();
    this.messages = new Map();
    this.subscriptionPlans = new Map();
    this.paymentTransactions = new Map();
    this.userIdCounter = 1;
    this.likeIdCounter = 1;
    this.messageIdCounter = 1;
    this.subscriptionPlanIdCounter = 1;
    this.paymentTransactionIdCounter = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    
    // Create user with all required fields explicitly defined
    const user: User = { 
      id,
      username: userData.username,
      password: userData.password,
      email: userData.email,
      name: userData.name,
      age: userData.age,
      gender: userData.gender,
      genderPreference: userData.genderPreference,
      bio: userData.bio ?? null,
      location: userData.location ?? null,
      photoUrls: userData.photoUrls ?? [],
      interests: userData.interests ?? [],
      ageRangeMin: userData.ageRangeMin ?? 18,
      ageRangeMax: userData.ageRangeMax ?? 100,
      maxDistance: userData.maxDistance ?? 50,
      isPremium: userData.isPremium ?? false,
      stripeCustomerId: userData.stripeCustomerId ?? null,
      stripeSubscriptionId: userData.stripeSubscriptionId ?? null,
      subscriptionStatus: userData.subscriptionStatus ?? "inactive",
      subscriptionTier: userData.subscriptionTier ?? "free",
      subscriptionExpiresAt: userData.subscriptionExpiresAt ?? null,
      createdAt: now,
      lastActive: now,
    };
    
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: UpdateUser): Promise<User | undefined> {
    const existingUser = await this.getUser(id);
    if (!existingUser) return undefined;
    
    // Copy existing user data
    const updatedUser: User = {
      ...existingUser,
      ...userData,
      // Ensure optional fields maintain their proper types
      bio: userData.bio !== undefined ? userData.bio : existingUser.bio,
      location: userData.location !== undefined ? userData.location : existingUser.location,
      photoUrls: userData.photoUrls || existingUser.photoUrls,
      interests: userData.interests || existingUser.interests,
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getNearbyUsers(userId: number, maxDistance: number): Promise<User[]> {
    const currentUser = await this.getUser(userId);
    if (!currentUser) return [];
    
    // In a real app, we would calculate distance based on geolocation
    // For simplicity in this demo, return all users that match gender preference
    // and aren't the current user
    return Array.from(this.users.values()).filter(user => 
      user.id !== userId && 
      user.gender === currentUser.genderPreference &&
      user.genderPreference === currentUser.gender &&
      user.age >= currentUser.ageRangeMin &&
      user.age <= currentUser.ageRangeMax &&
      currentUser.age >= user.ageRangeMin &&
      currentUser.age <= user.ageRangeMax
    );
  }

  async updateLastActive(userId: number): Promise<void> {
    const user = await this.getUser(userId);
    if (user) {
      user.lastActive = new Date();
      this.users.set(userId, user);
    }
  }
  
  // Like methods
  async createLike(likeData: InsertLike): Promise<Like> {
    const id = this.likeIdCounter++;
    const like: Like = {
      ...likeData,
      id,
      createdAt: new Date(),
    };
    this.likes.set(id, like);
    return like;
  }

  async getLikeByUserIds(likerId: number, likedId: number): Promise<Like | undefined> {
    return Array.from(this.likes.values()).find(
      (like) => like.likerId === likerId && like.likedId === likedId,
    );
  }

  async getLikesByLikerId(likerId: number): Promise<Like[]> {
    return Array.from(this.likes.values()).filter(
      (like) => like.likerId === likerId,
    );
  }

  async getLikesForUser(likedId: number): Promise<Like[]> {
    return Array.from(this.likes.values()).filter(
      (like) => like.likedId === likedId,
    );
  }
  
  // Match methods
  async getMatches(userId: number): Promise<User[]> {
    // A match is when two users have liked each other
    const userLikes = await this.getLikesByLikerId(userId);
    const likedUserIds = userLikes.map(like => like.likedId);
    
    const matches: User[] = [];
    for (const likedId of likedUserIds) {
      const reverseMatch = await this.getLikeByUserIds(likedId, userId);
      if (reverseMatch) {
        const matchedUser = await this.getUser(likedId);
        if (matchedUser) {
          matches.push(matchedUser);
        }
      }
    }
    
    return matches;
  }
  
  // Message methods
  async createMessage(messageData: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++;
    const message: Message = {
      ...messageData,
      id,
      read: false,
      createdAt: new Date(),
    };
    this.messages.set(id, message);
    return message;
  }

  async getMessagesBetweenUsers(user1Id: number, user2Id: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => 
        (message.senderId === user1Id && message.receiverId === user2Id) ||
        (message.senderId === user2Id && message.receiverId === user1Id)
      )
      .sort((a: Message, b: Message) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async getConversations(userId: number): Promise<{user: User, lastMessage: Message}[]> {
    // Get all messages where the user is either sender or receiver
    const allMessages = Array.from(this.messages.values())
      .filter(message => 
        message.senderId === userId || message.receiverId === userId
      );
    
    // Group by conversation partner
    const conversations = new Map<number, Message[]>();
    for (const message of allMessages) {
      const partnerId = message.senderId === userId ? message.receiverId : message.senderId;
      if (!conversations.has(partnerId)) {
        conversations.set(partnerId, []);
      }
      conversations.get(partnerId)!.push(message);
    }
    
    // Get the last message in each conversation
    const result: {user: User, lastMessage: Message}[] = [];
    for (const [partnerId, messages] of conversations.entries()) {
      const partner = await this.getUser(partnerId);
      if (partner) {
        // Sort messages by date (newest first)
        messages.sort((a: Message, b: Message) => b.createdAt.getTime() - a.createdAt.getTime());
        result.push({
          user: partner,
          lastMessage: messages[0],
        });
      }
    }
    
    // Sort conversations by the most recent message
    return result.sort((a: {user: User, lastMessage: Message}, b: {user: User, lastMessage: Message}) => 
      b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime()
    );
  }

  async markMessagesAsRead(receiverId: number, senderId: number): Promise<void> {
    const allMessages = Array.from(this.messages.values());
    
    for (const message of allMessages) {
      if (message.senderId === senderId && message.receiverId === receiverId && !message.read) {
        message.read = true;
        this.messages.set(message.id, message);
      }
    }
  }
  
  // Stripe and subscription methods
  async updateStripeCustomerId(userId: number, customerId: string): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    user.stripeCustomerId = customerId;
    this.users.set(userId, user);
    return user;
  }
  
  async updateUserSubscription(
    userId: number, 
    subscriptionId: string, 
    tier: string, 
    status: string, 
    expiresAt: Date | null
  ): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    user.stripeSubscriptionId = subscriptionId;
    user.subscriptionTier = tier;
    user.subscriptionStatus = status;
    user.subscriptionExpiresAt = expiresAt;
    user.isPremium = status === "active";
    
    this.users.set(userId, user);
    return user;
  }
  
  // Subscription plan methods
  async createSubscriptionPlan(planData: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const id = this.subscriptionPlanIdCounter++;
    const plan: SubscriptionPlan = {
      ...planData,
      id,
      createdAt: new Date(),
    };
    this.subscriptionPlans.set(id, plan);
    return plan;
  }
  
  async getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined> {
    return this.subscriptionPlans.get(id);
  }
  
  async getAllSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return Array.from(this.subscriptionPlans.values());
  }
  
  async getActiveSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return Array.from(this.subscriptionPlans.values())
      .filter(plan => plan.isActive);
  }
  
  // Payment transaction methods
  async createPaymentTransaction(transactionData: InsertPaymentTransaction): Promise<PaymentTransaction> {
    const id = this.paymentTransactionIdCounter++;
    const transaction: PaymentTransaction = {
      ...transactionData,
      id,
      createdAt: new Date(),
    };
    this.paymentTransactions.set(id, transaction);
    return transaction;
  }
  
  async getPaymentTransaction(id: number): Promise<PaymentTransaction | undefined> {
    return this.paymentTransactions.get(id);
  }
  
  async getUserPaymentTransactions(userId: number): Promise<PaymentTransaction[]> {
    return Array.from(this.paymentTransactions.values())
      .filter(transaction => transaction.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async updatePaymentTransactionStatus(id: number, status: string): Promise<PaymentTransaction | undefined> {
    const transaction = await this.getPaymentTransaction(id);
    if (transaction) {
      transaction.status = status;
      this.paymentTransactions.set(id, transaction);
      return transaction;
    }
    return undefined;
  }
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUser(id: number, userData: UpdateUser): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async getNearbyUsers(userId: number, maxDistance: number): Promise<User[]> {
    const currentUser = await this.getUser(userId);
    if (!currentUser) return [];

    // In a real app, we would calculate distance based on geolocation
    // For simplicity in this demo, return all users that match gender preference
    // and aren't the current user
    return db
      .select()
      .from(users)
      .where(
        and(
          eq(users.gender, currentUser.genderPreference),
          eq(users.genderPreference, currentUser.gender),
          sql`${users.age} >= ${currentUser.ageRangeMin}`,
          sql`${users.age} <= ${currentUser.ageRangeMax}`,
          sql`${currentUser.age} >= ${users.ageRangeMin}`,
          sql`${currentUser.age} <= ${users.ageRangeMax}`,
          sql`${users.id} != ${userId}`
        )
      );
  }

  async updateLastActive(userId: number): Promise<void> {
    await db
      .update(users)
      .set({ lastActive: new Date() })
      .where(eq(users.id, userId));
  }

  // Like methods
  async createLike(likeData: InsertLike): Promise<Like> {
    const [like] = await db
      .insert(likes)
      .values(likeData)
      .returning();
    return like;
  }

  async getLikeByUserIds(likerId: number, likedId: number): Promise<Like | undefined> {
    const [like] = await db
      .select()
      .from(likes)
      .where(
        and(
          eq(likes.likerId, likerId),
          eq(likes.likedId, likedId)
        )
      );
    return like;
  }

  async getLikesByLikerId(likerId: number): Promise<Like[]> {
    return db
      .select()
      .from(likes)
      .where(eq(likes.likerId, likerId));
  }

  async getLikesForUser(likedId: number): Promise<Like[]> {
    return db
      .select()
      .from(likes)
      .where(eq(likes.likedId, likedId));
  }

  // Match methods
  async getMatches(userId: number): Promise<User[]> {
    // A match is when two users have liked each other
    // This query finds all users where there is a mutual like
    const matchedUsers = await db
      .select({
        user: users
      })
      .from(users)
      .innerJoin(
        likes,
        and(
          eq(likes.likedId, users.id),
          eq(likes.likerId, userId)
        )
      )
      .innerJoin(
        // Subquery to find reverse matches
        db
          .select()
          .from(likes)
          .where(eq(likes.likedId, userId))
          .as("reverse_likes"),
        eq(likes.likedId, sql`reverse_likes.liker_id`)
      );

    return matchedUsers.map(match => match.user);
  }

  // Message methods
  async createMessage(messageData: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(messageData)
      .returning();
    return message;
  }

  async getMessagesBetweenUsers(user1Id: number, user2Id: number): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(
        or(
          and(
            eq(messages.senderId, user1Id),
            eq(messages.receiverId, user2Id)
          ),
          and(
            eq(messages.senderId, user2Id),
            eq(messages.receiverId, user1Id)
          )
        )
      )
      .orderBy(messages.createdAt);
  }

  async getConversations(userId: number): Promise<{user: User, lastMessage: Message}[]> {
    // Find all users that the current user has exchanged messages with
    const partners = await db
      .select({
        partnerId: sql<number>`
          CASE 
            WHEN ${messages.senderId} = ${userId} THEN ${messages.receiverId}
            ELSE ${messages.senderId}
          END
        `
      })
      .from(messages)
      .where(
        or(
          eq(messages.senderId, userId),
          eq(messages.receiverId, userId)
        )
      )
      .groupBy(sql`partnerId`);

    const result: {user: User, lastMessage: Message}[] = [];

    // For each partner, get their user profile and the most recent message
    for (const { partnerId } of partners) {
      const partner = await this.getUser(partnerId);
      if (partner) {
        const [lastMessage] = await db
          .select()
          .from(messages)
          .where(
            or(
              and(
                eq(messages.senderId, userId),
                eq(messages.receiverId, partnerId)
              ),
              and(
                eq(messages.senderId, partnerId),
                eq(messages.receiverId, userId)
              )
            )
          )
          .orderBy(desc(messages.createdAt))
          .limit(1);
        
        if (lastMessage) {
          result.push({
            user: partner,
            lastMessage,
          });
        }
      }
    }

    // Sort conversations by most recent message
    return result.sort((a, b) => 
      b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime()
    );
  }

  async markMessagesAsRead(receiverId: number, senderId: number): Promise<void> {
    await db
      .update(messages)
      .set({ read: true })
      .where(
        and(
          eq(messages.receiverId, receiverId),
          eq(messages.senderId, senderId),
          eq(messages.read, false)
        )
      );
  }

  // Stripe and subscription methods
  async updateStripeCustomerId(userId: number, customerId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ stripeCustomerId: customerId })
      .where(eq(users.id, userId))
      .returning();
    
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    return user;
  }

  async updateUserSubscription(
    userId: number, 
    subscriptionId: string, 
    tier: string, 
    status: string, 
    expiresAt: Date | null
  ): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        stripeSubscriptionId: subscriptionId,
        subscriptionTier: tier,
        subscriptionStatus: status,
        subscriptionExpiresAt: expiresAt,
        isPremium: status === "active"
      })
      .where(eq(users.id, userId))
      .returning();
    
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    return user;
  }

  // Subscription plan methods
  async createSubscriptionPlan(planData: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const [plan] = await db
      .insert(subscriptionPlans)
      .values(planData)
      .returning();
    return plan;
  }

  async getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, id));
    return plan;
  }

  async getAllSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return db.select().from(subscriptionPlans);
  }

  async getActiveSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, true));
  }

  // Payment transaction methods
  async createPaymentTransaction(transactionData: InsertPaymentTransaction): Promise<PaymentTransaction> {
    const [transaction] = await db
      .insert(paymentTransactions)
      .values(transactionData)
      .returning();
    return transaction;
  }

  async getPaymentTransaction(id: number): Promise<PaymentTransaction | undefined> {
    const [transaction] = await db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.id, id));
    return transaction;
  }

  async getUserPaymentTransactions(userId: number): Promise<PaymentTransaction[]> {
    return db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.userId, userId))
      .orderBy(desc(paymentTransactions.createdAt));
  }

  async updatePaymentTransactionStatus(id: number, status: string): Promise<PaymentTransaction | undefined> {
    const [transaction] = await db
      .update(paymentTransactions)
      .set({ status })
      .where(eq(paymentTransactions.id, id))
      .returning();
    return transaction;
  }
}

// Use the database storage implementation
export const storage = new DatabaseStorage();
