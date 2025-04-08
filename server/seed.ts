import { db } from "./db";
import { 
  users, 
  subscriptionPlans, 
  likes, 
  messages,
  paymentTransactions
} from "@shared/schema";

/**
 * Seed script to populate the database with initial test data
 */
async function seed() {
  console.log("Starting database seeding process...");
  
  // First, clear any existing data (for development purposes)
  console.log("Clearing existing data...");
  await db.delete(paymentTransactions);
  await db.delete(messages);
  await db.delete(likes);
  await db.delete(users);
  await db.delete(subscriptionPlans);
  
  // 1. Create sample users
  console.log("Creating sample users...");
  const sampleUsers = [
    {
      username: "john_doe",
      password: "$2b$10$mQEWfJ5VYqfNTL5X9Vz5v.pwxPL.JUbDYSZJ4ylS1T1qrSh7e1OC2", // "password123"
      email: "john@example.com",
      name: "John Doe",
      age: 28,
      bio: "I enjoy hiking, reading, and exploring new restaurants.",
      location: "New York",
      photoUrls: ["https://randomuser.me/api/portraits/men/1.jpg"],
      interests: ["hiking", "reading", "food", "travel"],
      gender: "male",
      genderPreference: "female",
      ageRangeMin: 24,
      ageRangeMax: 35,
      maxDistance: 50,
      isPremium: false,
      subscriptionStatus: "inactive",
      subscriptionTier: "free",
    },
    {
      username: "jane_smith",
      password: "$2b$10$mQEWfJ5VYqfNTL5X9Vz5v.pwxPL.JUbDYSZJ4ylS1T1qrSh7e1OC2", // "password123"
      email: "jane@example.com",
      name: "Jane Smith",
      age: 26,
      bio: "Art lover, coffee enthusiast, and fitness addict.",
      location: "Boston",
      photoUrls: ["https://randomuser.me/api/portraits/women/1.jpg"],
      interests: ["art", "coffee", "fitness", "yoga"],
      gender: "female",
      genderPreference: "male",
      ageRangeMin: 25,
      ageRangeMax: 35,
      maxDistance: 30,
      isPremium: true,
      subscriptionStatus: "active",
      subscriptionTier: "premium",
    },
    {
      username: "mike_johnson",
      password: "$2b$10$mQEWfJ5VYqfNTL5X9Vz5v.pwxPL.JUbDYSZJ4ylS1T1qrSh7e1OC2", // "password123"
      email: "mike@example.com",
      name: "Mike Johnson",
      age: 30,
      bio: "Software engineer by day, musician by night.",
      location: "San Francisco",
      photoUrls: ["https://randomuser.me/api/portraits/men/2.jpg"],
      interests: ["music", "coding", "gaming", "hiking"],
      gender: "male",
      genderPreference: "female",
      ageRangeMin: 25,
      ageRangeMax: 35,
      maxDistance: 25,
      isPremium: false,
      subscriptionStatus: "inactive",
      subscriptionTier: "free",
    },
    {
      username: "sarah_davis",
      password: "$2b$10$mQEWfJ5VYqfNTL5X9Vz5v.pwxPL.JUbDYSZJ4ylS1T1qrSh7e1OC2", // "password123"
      email: "sarah@example.com",
      name: "Sarah Davis",
      age: 27,
      bio: "Travel enthusiast and foodie. Love exploring new cuisines.",
      location: "Chicago",
      photoUrls: ["https://randomuser.me/api/portraits/women/2.jpg"],
      interests: ["travel", "food", "photography", "cooking"],
      gender: "female",
      genderPreference: "male",
      ageRangeMin: 26,
      ageRangeMax: 38,
      maxDistance: 40,
      isPremium: true,
      subscriptionStatus: "active",
      subscriptionTier: "platinum",
    },
    {
      username: "alex_wilson",
      password: "$2b$10$mQEWfJ5VYqfNTL5X9Vz5v.pwxPL.JUbDYSZJ4ylS1T1qrSh7e1OC2", // "password123"
      email: "alex@example.com",
      name: "Alex Wilson",
      age: 32,
      bio: "Fitness instructor and nutrition coach. Live for the outdoors.",
      location: "Denver",
      photoUrls: ["https://randomuser.me/api/portraits/men/3.jpg"],
      interests: ["fitness", "nutrition", "hiking", "skiing"],
      gender: "male",
      genderPreference: "female",
      ageRangeMin: 25,
      ageRangeMax: 35,
      maxDistance: 35,
      isPremium: false,
      subscriptionStatus: "inactive",
      subscriptionTier: "free",
    },
    {
      username: "emily_brown",
      password: "$2b$10$mQEWfJ5VYqfNTL5X9Vz5v.pwxPL.JUbDYSZJ4ylS1T1qrSh7e1OC2", // "password123"
      email: "emily@example.com",
      name: "Emily Brown",
      age: 29,
      bio: "Writer and book lover. Seeking someone who can match my wit.",
      location: "Seattle",
      photoUrls: ["https://randomuser.me/api/portraits/women/3.jpg"],
      interests: ["writing", "reading", "films", "hiking"],
      gender: "female",
      genderPreference: "male",
      ageRangeMin: 28,
      ageRangeMax: 40,
      maxDistance: 30,
      isPremium: true,
      subscriptionStatus: "active",
      subscriptionTier: "premium",
    }
  ];
  
  const createdUsers = await db.insert(users).values(sampleUsers).returning();
  console.log(`Created ${createdUsers.length} sample users`);
  
  // 2. Create subscription plans
  console.log("Creating subscription plans...");
  const subscriptionPlansData = [
    {
      name: "Basic",
      description: "Basic subscription with essential features",
      price: 999, // $9.99
      stripePriceId: "price_basic123",
      features: ["5 super likes per day", "See who likes you", "Unlimited likes"],
      durationDays: 30,
      isActive: true,
    },
    {
      name: "Premium",
      description: "Premium subscription with advanced features",
      price: 1999, // $19.99
      stripePriceId: "price_premium123",
      features: ["10 super likes per day", "See who likes you", "Unlimited likes", "Priority matching"],
      durationDays: 30,
      isActive: true,
    },
    {
      name: "Platinum",
      description: "Ultimate dating experience with all features",
      price: 2999, // $29.99
      stripePriceId: "price_platinum123",
      features: ["15 super likes per day", "See who likes you", "Unlimited likes", "Priority matching", "Profile boost once a week"],
      durationDays: 30,
      isActive: true,
    }
  ];
  
  const createdPlans = await db.insert(subscriptionPlans).values(subscriptionPlansData).returning();
  console.log(`Created ${createdPlans.length} subscription plans`);
  
  // 3. Create likes (connections between users)
  console.log("Creating user likes...");
  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  
  const likesData = [
    {
      likerId: createdUsers[0].id, // John likes Jane
      likedId: createdUsers[1].id,
      createdAt: twoDaysAgo
    },
    {
      likerId: createdUsers[1].id, // Jane likes John (mutual match)
      likedId: createdUsers[0].id,
      createdAt: dayAgo
    },
    {
      likerId: createdUsers[0].id, // John likes Sarah
      likedId: createdUsers[3].id,
      createdAt: twoHoursAgo
    },
    {
      likerId: createdUsers[2].id, // Mike likes Jane
      likedId: createdUsers[1].id,
      createdAt: now
    },
    {
      likerId: createdUsers[3].id, // Sarah likes John (mutual match)
      likedId: createdUsers[0].id,
      createdAt: now
    },
    {
      likerId: createdUsers[4].id, // Alex likes Emily
      likedId: createdUsers[5].id,
      createdAt: dayAgo
    },
    {
      likerId: createdUsers[5].id, // Emily likes Alex (mutual match)
      likedId: createdUsers[4].id,
      createdAt: twoHoursAgo
    }
  ];
  
  const createdLikes = await db.insert(likes).values(likesData).returning();
  console.log(`Created ${createdLikes.length} likes`);
  
  // 4. Create messages between matched users
  console.log("Creating messages between matched users...");
  
  // John and Jane conversation
  const messagesData = [
    {
      senderId: createdUsers[0].id, // John to Jane
      receiverId: createdUsers[1].id,
      content: "Hey Jane, I noticed we both like hiking. Any favorite trails?",
      read: true,
      createdAt: dayAgo
    },
    {
      senderId: createdUsers[1].id, // Jane to John
      receiverId: createdUsers[0].id,
      content: "Hi John! I love the trails at Mount Rainier. Have you been there?",
      read: true,
      createdAt: new Date(dayAgo.getTime() + 30 * 60 * 1000)
    },
    {
      senderId: createdUsers[0].id, // John to Jane
      receiverId: createdUsers[1].id,
      content: "I haven't, but I'd love to check it out sometime! Maybe we could go together?",
      read: true,
      createdAt: new Date(dayAgo.getTime() + 60 * 60 * 1000)
    },
    {
      senderId: createdUsers[1].id, // Jane to John
      receiverId: createdUsers[0].id,
      content: "That sounds like a great idea! When are you usually free?",
      read: false,
      createdAt: new Date(now.getTime() - 30 * 60 * 1000)
    },
    
    // John and Sarah conversation
    {
      senderId: createdUsers[0].id, // John to Sarah
      receiverId: createdUsers[3].id,
      content: "Hi Sarah, I see you enjoy photography too. What kind of photos do you like to take?",
      read: true,
      createdAt: twoHoursAgo
    },
    {
      senderId: createdUsers[3].id, // Sarah to John
      receiverId: createdUsers[0].id,
      content: "Hey John! I mostly do travel and food photography. I love capturing different cultures through their cuisine. What about you?",
      read: false,
      createdAt: new Date(now.getTime() - 60 * 60 * 1000)
    },
    
    // Alex and Emily conversation
    {
      senderId: createdUsers[4].id, // Alex to Emily
      receiverId: createdUsers[5].id,
      content: "Hello Emily, I noticed you like hiking too. Have you explored any trails in the Seattle area?",
      read: true,
      createdAt: twoHoursAgo
    },
    {
      senderId: createdUsers[5].id, // Emily to Alex
      receiverId: createdUsers[4].id,
      content: "Hi Alex! Yes, I love the trails around Mount Si and Rattlesnake Ledge. Have you been to either?",
      read: true,
      createdAt: new Date(twoHoursAgo.getTime() + 15 * 60 * 1000)
    },
    {
      senderId: createdUsers[4].id, // Alex to Emily
      receiverId: createdUsers[5].id,
      content: "I've been to Rattlesnake but not Mount Si yet. Would love to check it out sometime!",
      read: false,
      createdAt: new Date(twoHoursAgo.getTime() + 35 * 60 * 1000)
    }
  ];
  
  const createdMessages = await db.insert(messages).values(messagesData).returning();
  console.log(`Created ${createdMessages.length} messages`);
  
  // 5. Create sample payment transactions
  console.log("Creating sample payment transactions...");
  const transactionsData = [
    {
      userId: createdUsers[1].id, // Jane
      amount: 1999, // $19.99
      currency: "usd",
      stripePaymentIntentId: "pi_premium_jane123",
      stripeCustomerId: "cus_jane123",
      status: "succeeded",
      description: "Premium subscription - monthly",
      metadata: { plan: "premium" },
    },
    {
      userId: createdUsers[3].id, // Sarah
      amount: 2999, // $29.99
      currency: "usd",
      stripePaymentIntentId: "pi_platinum_sarah123",
      stripeCustomerId: "cus_sarah123",
      status: "succeeded",
      description: "Platinum subscription - monthly",
      metadata: { plan: "platinum" },
    },
    {
      userId: createdUsers[5].id, // Emily
      amount: 1999, // $19.99
      currency: "usd",
      stripePaymentIntentId: "pi_premium_emily123",
      stripeCustomerId: "cus_emily123",
      status: "succeeded",
      description: "Premium subscription - monthly",
      metadata: { plan: "premium" },
    }
  ];
  
  const createdTransactions = await db.insert(paymentTransactions).values(transactionsData).returning();
  console.log(`Created ${createdTransactions.length} payment transactions`);
  
  console.log("Database seeding completed successfully!");
}

// Execute the seed function
seed()
  .catch(error => {
    console.error("Error seeding database:", error);
    process.exit(1);
  })
  .finally(() => {
    console.log("Seeding process finished.");
    process.exit(0);
  });