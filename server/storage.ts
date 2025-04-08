import { users, type User, type InsertUser, type UpdateUser, 
  likes, type Like, type InsertLike, 
  messages, type Message, type InsertMessage,
  subscriptionPlans, type SubscriptionPlan, type InsertSubscriptionPlan,
  paymentTransactions, type PaymentTransaction, type InsertPaymentTransaction } from "@shared/schema";

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

export const storage = new MemStorage();
