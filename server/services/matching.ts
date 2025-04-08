import { User } from "@shared/schema";
import { db } from "../db";
import { eq, and, gte, lte, arrayOverlaps, sql } from "drizzle-orm";
import { users } from "@shared/schema";

/**
 * Advanced matching service for finding compatible users
 */
export class MatchingService {
  
  /**
   * Calculate the compatibility score between two users
   * @param user1 The first user
   * @param user2 The second user
   * @returns A score between 0 and 100 indicating compatibility
   */
  static calculateCompatibilityScore(user1: User, user2: User): number {
    let score = 0;
    const maxScore = 100;
    
    // 1. Interest overlap (max 40 points)
    const user1Interests = Array.isArray(user1.interests) ? user1.interests : [];
    const user2Interests = Array.isArray(user2.interests) ? user2.interests : [];
    
    const sharedInterests = user1Interests.filter(interest => 
      user2Interests.includes(interest as string)
    );
    
    const totalUniqueInterests = new Set([
      ...user1Interests,
      ...user2Interests
    ]).size;
    
    const interestScore = totalUniqueInterests > 0
      ? Math.round((sharedInterests.length / totalUniqueInterests) * 40)
      : 0;
    
    score += interestScore;
    
    // 2. Age compatibility (max 20 points)
    // The closer they are in age, the higher the score
    const ageDifference = Math.abs(user1.age - user2.age);
    const maxAgeDifference = 20; // Consider higher differences less relevant
    const ageScore = Math.max(0, 20 - Math.round((ageDifference / maxAgeDifference) * 20));
    score += ageScore;
    
    // 3. Location proximity - if available (max 20 points)
    // This uses user-defined maxDistance preferences
    let distanceScore = 20; // Default to max if we can't calculate
    
    // If both users have latitude/longitude, calculate actual distance
    if (
      user1.locationLatitude && user1.locationLongitude &&
      user2.locationLatitude && user2.locationLongitude
    ) {
      const distance = this.calculateDistance(
        parseFloat(user1.locationLatitude),
        parseFloat(user1.locationLongitude),
        parseFloat(user2.locationLatitude),
        parseFloat(user2.locationLongitude)
      );
      
      const userMaxDistance = Math.min(user1.maxDistance || 50, user2.maxDistance || 50);
      
      // Score based on how close they are relative to maxDistance
      distanceScore = distance <= userMaxDistance 
        ? Math.round(20 * (1 - distance / userMaxDistance))
        : 0;
    } else if (user1.location && user2.location) {
      // If they have the same location name, give full points
      // This is a simplified approach
      distanceScore = user1.location === user2.location ? 20 : 0;
    }
    
    score += distanceScore;
    
    // 4. Activity pattern compatibility (max 20 points)
    let activityScore = 20; // Default to max for now
    
    // If both users have activity patterns, we could calculate similarity
    if (
      user1.activityPattern && 
      user2.activityPattern && 
      typeof user1.activityPattern === 'object' && 
      typeof user2.activityPattern === 'object'
    ) {
      // This would be a more sophisticated algorithm in a real app
      // For now, we'll use the default score
    }
    
    score += activityScore;
    
    return Math.min(maxScore, Math.max(0, score));
  }
  
  /**
   * Calculate distance between two points using the Haversine formula
   * @returns Distance in kilometers
   */
  private static calculateDistance(
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number {
    const R = 6371; // Radius of the Earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in km
    return distance;
  }
  
  private static deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }
  
  /**
   * Find potential matches for a user based on advanced matching criteria
   * @param userId ID of the user seeking matches
   * @param limit Maximum number of results to return
   * @returns Array of potential matches with compatibility scores
   */
  static async findPotentialMatches(
    userId: number,
    limit: number = 20
  ): Promise<{ user: User; compatibilityScore: number }[]> {
    // 1. Get the user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    // 2. Query for basic compatibility (gender preference, age range)
    const potentialMatches = await db
      .select()
      .from(users)
      .where(
        and(
          // Not the same user
          sql`${users.id} != ${userId}`,
          
          // Gender preference match
          sql`${users.gender} = ${user.genderPreference}`,
          
          // User is within their gender preference
          sql`${user.gender} = ${users.genderPreference}`,
          
          // Age within user's preferences
          gte(users.age, Number(user.ageRangeMin) || 18),
          lte(users.age, Number(user.ageRangeMax) || 100),
          
          // User's age within match's preferences
          sql`${user.age} >= COALESCE(${users.ageRangeMin}, 18)`,
          sql`${user.age} <= COALESCE(${users.ageRangeMax}, 100)`
        )
      )
      .limit(limit * 2); // Fetch more than needed to allow for scoring and sorting
    
    // 3. Calculate compatibility scores and sort
    const scoredMatches = potentialMatches.map(match => ({
      user: match,
      compatibilityScore: this.calculateCompatibilityScore(user, match)
    }));
    
    // 4. Sort by compatibility score (highest first)
    scoredMatches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    
    // Return the top matches
    return scoredMatches.slice(0, limit);
  }
  
  /**
   * Calculate and save interest keywords to improve matching
   * This could be called when a user updates their profile
   * @param userId User ID to update keywords for
   */
  static async calculateInterestKeywords(userId: number): Promise<void> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    
    if (!user) return;
    
    // Process interests to extract keywords
    // This is a simplified version - in a real app you might use NLP
    const interests = Array.isArray(user.interests) ? user.interests : [];
    const keywords = interests
      .map((interest: string) => interest.toLowerCase())
      .filter(Boolean);
    
    // Save keywords to user profile
    await db
      .update(users)
      .set({ 
        interestKeywords: keywords 
      })
      .where(eq(users.id, userId));
  }
  
  /**
   * Find matches based primarily on shared interests
   * @param userId ID of the user seeking matches
   * @param limit Maximum number of results to return
   */
  static async findInterestBasedMatches(
    userId: number,
    limit: number = 10
  ): Promise<User[]> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    
    if (!user) {
      return [];
    }
    
    const interests = Array.isArray(user.interests) ? user.interests : [];
    if (interests.length === 0) {
      return [];
    }
    
    // Find users with overlapping interests
    return db
      .select()
      .from(users)
      .where(
        and(
          sql`${users.id} != ${userId}`,
          arrayOverlaps(users.interests, interests)
        )
      )
      .limit(limit);
  }
  
  /**
   * Find matches based on location proximity
   * @param userId ID of the user seeking matches
   * @param limit Maximum number of results to return
   */
  static async findLocationBasedMatches(
    userId: number,
    limit: number = 10
  ): Promise<User[]> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    
    if (!user) {
      return [];
    }
    
    if (user.locationLatitude && user.locationLongitude) {
      // If we have coordinates, we would ideally use a geographic query
      // For PostgreSQL this would use the PostGIS extension
      // As a simplified version, we'll match on location name for now
      return db
        .select()
        .from(users)
        .where(
          and(
            sql`${users.id} != ${userId}`,
            sql`${users.location} = ${user.location}`
          )
        )
        .limit(limit);
    } else if (user.location) {
      // Match by location name
      return db
        .select()
        .from(users)
        .where(
          and(
            sql`${users.id} != ${userId}`,
            sql`${users.location} = ${user.location}`
          )
        )
        .limit(limit);
    }
    
    return [];
  }
  
  /**
   * Find matches based on activity patterns
   * This helps match users who tend to be online at similar times
   * @param userId ID of the user seeking matches
   * @param limit Maximum number of results to return
   */
  static async findActivityBasedMatches(
    userId: number,
    limit: number = 10
  ): Promise<User[]> {
    // This would require tracking user activity patterns
    // For now, we'll return an empty array as we don't have this data yet
    return [];
  }
  
  /**
   * Track user activity to build activity pattern profile
   * Call this periodically when users are active
   * @param userId The ID of the active user
   */
  static async trackUserActivity(userId: number): Promise<void> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    
    if (!user) return;
    
    // Get current day of week and hour
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0-6 (Sunday-Saturday)
    const hourOfDay = now.getHours(); // 0-23
    
    // Create a simplified activity pattern
    const activityPattern = typeof user.activityPattern === 'object' && user.activityPattern
      ? { ...user.activityPattern as Record<string, any> }
      : {};
    
    // Initialize day structure if it doesn't exist
    if (!activityPattern[dayOfWeek]) {
      activityPattern[dayOfWeek] = {};
    }
    
    // Increment activity count for this hour
    activityPattern[dayOfWeek][hourOfDay] = 
      (activityPattern[dayOfWeek][hourOfDay] || 0) + 1;
    
    // Update the user's activity pattern
    await db
      .update(users)
      .set({ 
        activityPattern: activityPattern,
        lastActive: now 
      })
      .where(eq(users.id, userId));
  }
}