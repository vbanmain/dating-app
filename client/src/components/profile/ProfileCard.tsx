import { useState } from "react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Heart } from "lucide-react";
import { User } from "@shared/schema";
import MatchNotification from "./MatchNotification";
import { useMatches } from "@/hooks/useMatches";

interface ProfileCardProps {
  profile: Omit<User, "password">;
}

const ProfileCard = ({ profile }: ProfileCardProps) => {
  const [location, setLocation] = useLocation();
  const { likeProfile, isLiking } = useMatches();
  const [photoIndex, setPhotoIndex] = useState(0);
  const [showMatch, setShowMatch] = useState(false);
  const [matchData, setMatchData] = useState<Omit<User, "password"> | null>(null);

  const handleLike = async () => {
    try {
      const result = await likeProfile(profile.id);
      if (result?.isMatch) {
        setMatchData(result.matchedUser);
        setShowMatch(true);
      }
    } catch (error) {
      console.error("Error liking profile:", error);
    }
  };

  const handleDislike = () => {
    // We're just skipping this profile by not doing anything
    // In a real app, you might want to store this information
  };

  const handleViewProfile = () => {
    setLocation(`/profile/${profile.id}`);
  };

  // Calculate match percentage (simplistic version for demo)
  const calculateMatchPercentage = () => {
    // This is a simplified example, a real app would use more sophisticated matching
    const userInterests = profile.interests as string[];
    // Base match percentage
    const baseMatch = 70;
    // Add 2% for each interest, up to 20% max
    const interestBonus = Math.min(userInterests.length * 2, 20);
    // Add 5% if distance is close
    return baseMatch + interestBonus;
  };

  const matchPercentage = calculateMatchPercentage();

  // Handle photo carousel
  const nextPhoto = () => {
    const photos = profile.photoUrls as string[];
    if (photos.length > 1) {
      setPhotoIndex((photoIndex + 1) % photos.length);
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-neutral-800 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
        <div className="relative">
          <div className="aspect-[3/4] bg-neutral-100 dark:bg-neutral-700 relative overflow-hidden">
            <img 
              src={profile.photoUrls.length > 0 ? profile.photoUrls[photoIndex] : "https://via.placeholder.com/500x667?text=No+Photo"} 
              alt={`${profile.name}, ${profile.age}`} 
              className="w-full h-full object-cover"
              onClick={nextPhoto}
            />
            
            {/* Carousel Dots */}
            {profile.photoUrls.length > 1 && (
              <div className="absolute top-3 left-0 right-0 flex justify-center gap-1">
                {(profile.photoUrls as string[]).map((_, index) => (
                  <span 
                    key={index}
                    className={`h-1 w-8 bg-white rounded-full ${index === photoIndex ? 'opacity-100' : 'opacity-40'}`}
                  ></span>
                ))}
              </div>
            )}
            
            {/* Online status - consider a user online if they were active in the last 10 minutes */}
            {new Date().getTime() - new Date(profile.lastActive).getTime() < 10 * 60 * 1000 && (
              <div className="absolute top-3 right-3">
                <span className="flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
                </span>
              </div>
            )}
            
            {/* Profile Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="text-xl font-bold font-heading">{profile.name}, {profile.age}</h3>
                  <p className="text-sm flex items-center opacity-90">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    {profile.location ? `${profile.location}` : 'Location unknown'}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-primary to-secondary text-xs font-medium rounded-full px-2 py-0.5">
                  {matchPercentage}% Match
                </div>
              </div>
            </div>
          </div>
          
          {/* Quick Action Buttons */}
          <div className="absolute -bottom-5 right-5 flex gap-2">
            <Button 
              size="icon" 
              variant="outline" 
              className="h-10 w-10 rounded-full bg-white text-destructive shadow-md hover:bg-destructive hover:text-white transition-colors"
              onClick={handleDislike}
              aria-label="Dislike"
            >
              <X className="h-5 w-5" />
            </Button>
            <Button 
              size="icon" 
              variant="default" 
              className="h-12 w-12 rounded-full bg-primary text-white shadow-md hover:bg-primary/90 transition-colors"
              onClick={handleLike}
              disabled={isLiking}
              aria-label="Like"
            >
              <Heart className="h-6 w-6" />
            </Button>
          </div>
        </div>
        
        {/* Profile Preview */}
        <div className="p-4 pt-6">
          {/* Interests Tags */}
          <div className="flex flex-wrap gap-2 mt-2 mb-3">
            {(profile.interests as string[]).slice(0, 3).map((interest, index) => (
              <Badge key={index} variant="outline" className="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 rounded-full text-xs text-neutral-700 dark:text-neutral-300">
                {interest}
              </Badge>
            ))}
          </div>
          
          {/* Profile Bio Preview */}
          <p className="text-neutral-600 dark:text-neutral-400 text-sm line-clamp-2">
            {profile.bio || "No bio provided"}
          </p>
          
          {/* View Profile Button */}
          <Button 
            variant="outline" 
            className="w-full mt-4"
            onClick={handleViewProfile}
          >
            View Full Profile
          </Button>
        </div>
      </div>

      {showMatch && matchData && (
        <MatchNotification 
          matchedUser={matchData} 
          onClose={() => setShowMatch(false)} 
        />
      )}
    </>
  );
};

export default ProfileCard;
