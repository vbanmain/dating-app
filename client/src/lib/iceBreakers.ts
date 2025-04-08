import type { User } from "@shared/schema";

export interface IceBreaker {
  text: string;
  category: 'general' | 'interests' | 'profile' | 'question';
}

/**
 * Generates ice breaker messages based on user profiles
 */
export function generateIceBreakers(
  currentUser: Omit<User, "password">, 
  matchedUser: Omit<User, "password">
): IceBreaker[] {
  const iceBreakers: IceBreaker[] = [];
  
  // Ensure interests and photoUrls are typed correctly as string arrays
  const currentUserInterests = Array.isArray(currentUser.interests) ? currentUser.interests as string[] : [];
  const matchedUserInterests = Array.isArray(matchedUser.interests) ? matchedUser.interests as string[] : [];
  
  // Add general ice breakers that work for anyone
  iceBreakers.push(
    { 
      text: `Hey ${matchedUser.name}, nice to match with you! How's your day going?`,
      category: 'general'
    },
    { 
      text: `Hi there! I'm excited we matched. What made you swipe right?`,
      category: 'general'
    },
    { 
      text: `Hey ${matchedUser.name}! If you could travel anywhere right now, where would you go?`,
      category: 'question'
    }
  );
  
  // Add location-based ice breakers if location is available
  if (matchedUser.location) {
    iceBreakers.push({
      text: `I see you're from ${matchedUser.location}! What's your favorite local spot?`,
      category: 'profile'
    });
  }
  
  // Add interest-based ice breakers
  if (matchedUserInterests.length > 0) {
    // Find common interests
    const commonInterests = currentUserInterests.filter((interest: string) => 
      matchedUserInterests.includes(interest)
    );
    
    if (commonInterests.length > 0) {
      const randomCommonInterest = commonInterests[Math.floor(Math.random() * commonInterests.length)];
      iceBreakers.push({
        text: `I noticed we both like ${randomCommonInterest}! What's your favorite thing about it?`,
        category: 'interests'
      });
    }
    
    // Add ice breaker for any of their interests
    const randomInterest = matchedUserInterests[Math.floor(Math.random() * matchedUserInterests.length)];
    iceBreakers.push({
      text: `I see you're into ${randomInterest}! What got you interested in that?`,
      category: 'interests'
    });
  }
  
  // Add profile-based ice breakers if they have a bio
  if (matchedUser.bio) {
    iceBreakers.push({
      text: `I enjoyed reading your bio! Tell me more about yourself.`,
      category: 'profile'
    });
  }
  
  // Add some thoughtful questions
  iceBreakers.push(
    { 
      text: `What's something you're really looking forward to this year?`,
      category: 'question'
    },
    { 
      text: `If you could have dinner with anyone, dead or alive, who would it be and why?`,
      category: 'question'
    },
    { 
      text: `What's one thing most people don't know about you?`,
      category: 'question'
    }
  );
  
  return iceBreakers;
}