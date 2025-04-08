import express, { type Express, Request, Response, NextFunction } from "express";
import { Server, createServer } from "http";
import { storage } from "./storage";
import { 
  loginUserSchema, 
  registerUserSchema, 
  insertLikeSchema, 
  insertMessageSchema,
  updateUserSchema
} from "../shared/schema";
import { z } from "zod";
import session from "express-session";
import MemoryStore from "memorystore";
import crypto from "crypto";
import Stripe from "stripe";
import { 
  createCustomer, 
  createPaymentIntent, 
  createSubscription, 
  cancelSubscription, 
  handleWebhookEvent 
} from "./services/stripe";
import { MatchingService } from "./services/matching";

// Define session interface
interface CustomSession {
  userId?: number;
}

// Define request interface with typed session
interface RequestWithSession extends Request {
  session: session.Session & CustomSession;
}

// Session setup
const MemoryStoreSession = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 24 * 60 * 60 * 1000 },
    store: new MemoryStoreSession({
      checkPeriod: 86400000 // prune expired entries every 24h
    })
  }));

  // Middleware to check authentication
  const isAuthenticated = (req: RequestWithSession, res: Response, next: NextFunction) => {
    if (req.session.userId) {
      return next();
    }
    return res.status(401).json({ message: "Authentication required" });
  };

  // Update last active time for logged in users
  app.use((req: RequestWithSession, _res: Response, next: NextFunction) => {
    if (req.session.userId) {
      storage.updateLastActive(req.session.userId)
        .then(() => next())
        .catch(() => next());
    } else {
      next();
    }
  });

  // Authentication Routes
  app.post("/api/auth/register", async (req: RequestWithSession, res: Response) => {
    try {
      const data = registerUserSchema.parse(req.body);
      
      // Check if username or email already exists
      const existingUsername = await storage.getUserByUsername(data.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const existingEmail = await storage.getUserByEmail(data.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      // Create user (omitting confirmPassword)
      const { confirmPassword, ...userData } = data;
      const user = await storage.createUser(userData);
      
      // Set session
      req.session.userId = user.id;
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      return res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req: RequestWithSession, res: Response) => {
    try {
      const data = loginUserSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(data.username);
      if (!user || user.password !== data.password) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Set session
      req.session.userId = user.id;
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", (req: RequestWithSession, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.clearCookie("connect.sid");
      return res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", isAuthenticated, async (req: RequestWithSession, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        req.session.destroy(() => {});
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // User Routes
  app.put("/api/users/me", isAuthenticated, async (req: RequestWithSession, res: Response) => {
    try {
      const data = updateUserSchema.parse(req.body);
      
      // Check if email is being updated and already exists
      if (data.email) {
        const existingEmail = await storage.getUserByEmail(data.email);
        if (existingEmail && existingEmail.id !== req.session.userId) {
          return res.status(400).json({ message: "Email already exists" });
        }
      }
      
      const user = await storage.updateUser(req.session.userId!, data);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Discover Routes
  app.get("/api/discover", isAuthenticated, async (req: RequestWithSession, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Track user activity for future matching
      await MatchingService.trackUserActivity(user.id);
      
      // Use advanced matching algorithm to find potential matches
      const potentialMatches = await MatchingService.findPotentialMatches(user.id, 50);
      
      // Remove password from profiles
      const profilesWithoutPassword = potentialMatches.map(match => {
        const { password, ...profileWithoutPassword } = match.user;
        return {
          ...profileWithoutPassword,
          compatibilityScore: match.compatibilityScore
        };
      });
      
      // Filter out users that current user already liked
      const userLikes = await storage.getLikesByLikerId(user.id);
      const likedIds = new Set(userLikes.map(like => like.likedId));
      
      const filteredProfiles = profilesWithoutPassword.filter(profile => 
        !likedIds.has(profile.id)
      );
      
      return res.status(200).json(filteredProfiles);
    } catch (error) {
      console.error("Error in discover:", error);
      // Fallback to traditional matching if advanced matching fails
      try {
        const user = await storage.getUser(req.session.userId!);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        
        // Get users based on preferences using traditional matching
        const profiles = await storage.getNearbyUsers(user.id, user.maxDistance);
        
        // Remove password from profiles
        const profilesWithoutPassword = profiles.map(profile => {
          const { password, ...profileWithoutPassword } = profile;
          return profileWithoutPassword;
        });
        
        // Filter out users that current user already liked
        const userLikes = await storage.getLikesByLikerId(user.id);
        const likedIds = new Set(userLikes.map(like => like.likedId));
        
        const filteredProfiles = profilesWithoutPassword.filter(profile => 
          !likedIds.has(profile.id)
        );
        
        return res.status(200).json(filteredProfiles);
      } catch (fallbackError) {
        console.error("Fallback error:", fallbackError);
        return res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Like Routes
  app.post("/api/likes", isAuthenticated, async (req: RequestWithSession, res: Response) => {
    try {
      const data = insertLikeSchema.parse(req.body);
      
      // Ensure the liker is the current user
      if (data.likerId !== req.session.userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Check if users exist
      const liker = await storage.getUser(data.likerId);
      const liked = await storage.getUser(data.likedId);
      
      if (!liker || !liked) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if already liked
      const existingLike = await storage.getLikeByUserIds(data.likerId, data.likedId);
      if (existingLike) {
        return res.status(400).json({ message: "Already liked this user" });
      }
      
      // Create like
      const like = await storage.createLike(data);
      
      // Check if it's a match
      const isMatch = await storage.getLikeByUserIds(data.likedId, data.likerId);
      
      return res.status(201).json({ 
        like, 
        isMatch: Boolean(isMatch),
        matchedUser: isMatch ? liked : null
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Specialized Matching Routes
  app.get("/api/discover/interests", isAuthenticated, async (req: RequestWithSession, res: Response) => {
    try {
      const userId = req.session.userId!;
      
      // Find matches based on shared interests
      const matches = await MatchingService.findInterestBasedMatches(userId);
      
      // Remove password from matches
      const matchesWithoutPassword = matches.map(match => {
        const { password, ...matchWithoutPassword } = match;
        return matchWithoutPassword;
      });
      
      // Filter out users that current user already liked
      const userLikes = await storage.getLikesByLikerId(userId);
      const likedIds = new Set(userLikes.map(like => like.likedId));
      
      const filteredMatches = matchesWithoutPassword.filter(match => 
        !likedIds.has(match.id)
      );
      
      return res.status(200).json(filteredMatches);
    } catch (error) {
      console.error("Error finding interest-based matches:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/discover/location", isAuthenticated, async (req: RequestWithSession, res: Response) => {
    try {
      const userId = req.session.userId!;
      
      // Find matches based on location proximity
      const matches = await MatchingService.findLocationBasedMatches(userId);
      
      // Remove password from matches
      const matchesWithoutPassword = matches.map(match => {
        const { password, ...matchWithoutPassword } = match;
        return matchWithoutPassword;
      });
      
      // Filter out users that current user already liked
      const userLikes = await storage.getLikesByLikerId(userId);
      const likedIds = new Set(userLikes.map(like => like.likedId));
      
      const filteredMatches = matchesWithoutPassword.filter(match => 
        !likedIds.has(match.id)
      );
      
      return res.status(200).json(filteredMatches);
    } catch (error) {
      console.error("Error finding location-based matches:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Match Routes
  app.get("/api/matches", isAuthenticated, async (req: RequestWithSession, res: Response) => {
    try {
      const matches = await storage.getMatches(req.session.userId!);
      
      // Remove password from matches
      const matchesWithoutPassword = matches.map(match => {
        const { password, ...matchWithoutPassword } = match;
        return matchWithoutPassword;
      });
      
      return res.status(200).json(matchesWithoutPassword);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Message Routes
  app.post("/api/messages", isAuthenticated, async (req: RequestWithSession, res: Response) => {
    try {
      const data = insertMessageSchema.parse(req.body);
      
      // Ensure the sender is the current user
      if (data.senderId !== req.session.userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Check if users exist
      const sender = await storage.getUser(data.senderId);
      const receiver = await storage.getUser(data.receiverId);
      
      if (!sender || !receiver) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Only allow messaging matches
      const matches = await storage.getMatches(req.session.userId!);
      if (!matches.some(match => match.id === data.receiverId)) {
        return res.status(403).json({ message: "Can only message matches" });
      }
      
      // Create message
      const message = await storage.createMessage(data);
      
      return res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/messages/:userId", isAuthenticated, async (req: RequestWithSession, res: Response) => {
    try {
      const otherUserId = parseInt(req.params.userId);
      
      // Check if user exists
      const otherUser = await storage.getUser(otherUserId);
      if (!otherUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get messages
      const messages = await storage.getMessagesBetweenUsers(req.session.userId!, otherUserId);
      
      // Mark messages as read
      await storage.markMessagesAsRead(req.session.userId!, otherUserId);
      
      return res.status(200).json(messages);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/conversations", isAuthenticated, async (req: RequestWithSession, res: Response) => {
    try {
      const conversations = await storage.getConversations(req.session.userId!);
      
      // Remove password from users
      const conversationsWithoutPassword = conversations.map(convo => {
        const { password, ...userWithoutPassword } = convo.user;
        return {
          user: userWithoutPassword,
          lastMessage: convo.lastMessage
        };
      });
      
      return res.status(200).json(conversationsWithoutPassword);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Payment and Subscription Routes
  
  // Get subscription plans
  app.get("/api/subscription-plans", async (_req: Request, res: Response) => {
    try {
      const plans = await storage.getActiveSubscriptionPlans();
      return res.status(200).json(plans);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Create payment intent for one-time purchase
  app.post("/api/create-payment-intent", isAuthenticated, async (req: RequestWithSession, res: Response) => {
    try {
      const { amount, description } = req.body;
      
      if (!amount || typeof amount !== 'number') {
        return res.status(400).json({ message: "Valid amount is required" });
      }
      
      const paymentIntent = await createPaymentIntent(
        req.session.userId!,
        amount,
        'usd',
        description || 'Dating App Purchase'
      );
      
      return res.status(200).json({
        clientSecret: paymentIntent.client_secret
      });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      return res.status(500).json({ 
        message: "Failed to create payment intent",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Create or update subscription
  app.post("/api/create-subscription", isAuthenticated, async (req: RequestWithSession, res: Response) => {
    try {
      const { priceId, tier } = req.body;
      
      if (!priceId || !tier) {
        return res.status(400).json({ message: "Price ID and tier are required" });
      }
      
      const subscription = await createSubscription(
        req.session.userId!,
        priceId,
        tier
      );
      
      // Get payment intent client secret for frontend
      const invoice = subscription.latest_invoice as Stripe.Invoice;
      let clientSecret = null;
      
      if (invoice && invoice.payment_intent && typeof invoice.payment_intent !== 'string') {
        clientSecret = invoice.payment_intent.client_secret;
      }
      
      return res.status(200).json({
        subscriptionId: subscription.id,
        clientSecret,
        status: subscription.status
      });
    } catch (error) {
      console.error("Error creating subscription:", error);
      return res.status(500).json({ 
        message: "Failed to create subscription",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Cancel subscription
  app.post("/api/cancel-subscription", isAuthenticated, async (req: RequestWithSession, res: Response) => {
    try {
      await cancelSubscription(req.session.userId!);
      return res.status(200).json({ message: "Subscription canceled successfully" });
    } catch (error) {
      console.error("Error canceling subscription:", error);
      return res.status(500).json({ 
        message: "Failed to cancel subscription",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Get user subscription
  app.get("/api/my-subscription", isAuthenticated, async (req: RequestWithSession, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      return res.status(200).json({
        isPremium: user.isPremium,
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionExpiresAt: user.subscriptionExpiresAt
      });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get payment history
  app.get("/api/payment-history", isAuthenticated, async (req: RequestWithSession, res: Response) => {
    try {
      const transactions = await storage.getUserPaymentTransactions(req.session.userId!);
      return res.status(200).json(transactions);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Webhook endpoint for Stripe events
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  app.post("/api/webhook", express.raw({type: 'application/json'}), async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'];
    
    if (!sig || !endpointSecret) {
      return res.status(400).send('Webhook signature or secret missing');
    }
    
    let event: Stripe.Event;
    
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2023-10-16',
      });
      
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error(`Webhook Error: ${err instanceof Error ? err.message : String(err)}`);
      return res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : String(err)}`);
    }
    
    try {
      await handleWebhookEvent(event);
      res.json({received: true});
    } catch (error) {
      console.error(`Error processing webhook: ${error instanceof Error ? error.message : String(error)}`);
      return res.status(500).send(`Error processing webhook: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
