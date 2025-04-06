import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { useMatches } from "@/hooks/useMatches";
import { useLocation } from "wouter";
import { Heart, MapPin, Calendar, MessageCircle, X, ArrowLeft } from "lucide-react";
import MatchNotification from "./MatchNotification";

interface ProfileViewProps {
  profile: Omit<User, "password">;
  isOwnProfile?: boolean;
}

const ProfileView = ({ profile, isOwnProfile = false }: ProfileViewProps) => {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
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

  const handleMessage = () => {
    setLocation(`/messages/${profile.id}`);
  };

  const handleEditProfile = () => {
    setLocation("/profile/edit");
  };

  const handleBack = () => {
    window.history.back();
  };

  // Handle photo carousel
  const nextPhoto = () => {
    const photos = profile.photoUrls as string[];
    if (photos.length > 1) {
      setPhotoIndex((photoIndex + 1) % photos.length);
    }
  };

  // Calculate match percentage (simplistic version for demo)
  const calculateMatchPercentage = () => {
    if (isOwnProfile) return null;
    
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

  return (
    <>
      <div className="max-w-4xl mx-auto p-4">
        <Button 
          variant="ghost" 
          className="mb-4" 
          onClick={handleBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Photos */}
          <div className="md:col-span-1">
            <Card>
              <CardContent className="p-0 overflow-hidden rounded-lg">
                <div className="relative aspect-[3/4] bg-neutral-100 dark:bg-neutral-700">
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
                  
                  {/* Profile Info Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
                    <h2 className="text-2xl font-bold">{profile.name}, {profile.age}</h2>
                    {profile.location && (
                      <p className="flex items-center text-sm mt-1">
                        <MapPin className="h-4 w-4 mr-1" />
                        {profile.location}
                      </p>
                    )}
                    
                    {matchPercentage && (
                      <div className="mt-2 bg-gradient-to-r from-primary to-secondary text-sm inline-block font-medium rounded-full px-3 py-1">
                        {matchPercentage}% Match
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Action Buttons */}
            {!isOwnProfile ? (
              <div className="flex mt-4 gap-3">
                <Button 
                  variant="outline"
                  size="lg"
                  className="flex-1 border-destructive text-destructive hover:bg-destructive hover:text-white"
                >
                  <X className="mr-2 h-5 w-5" />
                  Dislike
                </Button>
                <Button 
                  variant="default"
                  size="lg"
                  className="flex-1 bg-primary hover:bg-primary/90"
                  onClick={handleLike}
                  disabled={isLiking}
                >
                  <Heart className="mr-2 h-5 w-5" />
                  Like
                </Button>
              </div>
            ) : (
              <Button 
                variant="outline"
                size="lg"
                className="w-full mt-4"
                onClick={handleEditProfile}
              >
                Edit Profile
              </Button>
            )}
            
            {!isOwnProfile && (
              <Button 
                variant="outline"
                size="lg"
                className="w-full mt-3"
                onClick={handleMessage}
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Send Message
              </Button>
            )}
          </div>
          
          {/* Right Column - Profile Details */}
          <div className="md:col-span-2">
            <Card>
              <CardContent className="p-6">
                <Tabs defaultValue="about">
                  <TabsList className="mb-4">
                    <TabsTrigger value="about">About</TabsTrigger>
                    <TabsTrigger value="interests">Interests</TabsTrigger>
                    <TabsTrigger value="photos">Photos</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="about">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Bio</h3>
                        <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                          {profile.bio || "No bio provided"}
                        </p>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Basic Info</h3>
                        <dl className="grid grid-cols-2 gap-4">
                          <div>
                            <dt className="text-sm text-neutral-500 dark:text-neutral-400">Age</dt>
                            <dd className="text-neutral-900 dark:text-neutral-100 font-medium flex items-center">
                              <Calendar className="h-4 w-4 mr-1 text-neutral-400" />
                              {profile.age} years
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm text-neutral-500 dark:text-neutral-400">Gender</dt>
                            <dd className="text-neutral-900 dark:text-neutral-100 font-medium">
                              {profile.gender}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm text-neutral-500 dark:text-neutral-400">Location</dt>
                            <dd className="text-neutral-900 dark:text-neutral-100 font-medium">
                              {profile.location || "Not specified"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm text-neutral-500 dark:text-neutral-400">Looking for</dt>
                            <dd className="text-neutral-900 dark:text-neutral-100 font-medium">
                              {profile.genderPreference}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="interests">
                    <h3 className="text-lg font-semibold mb-4">Interests & Hobbies</h3>
                    <div className="flex flex-wrap gap-2">
                      {(profile.interests as string[]).map((interest, index) => (
                        <Badge key={index} variant="secondary" className="px-3 py-1 text-sm">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="photos">
                    <h3 className="text-lg font-semibold mb-4">Photo Gallery</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {(profile.photoUrls as string[]).map((photo, index) => (
                        <div key={index} className="aspect-square overflow-hidden rounded-md bg-neutral-100 dark:bg-neutral-800">
                          <img 
                            src={photo} 
                            alt={`${profile.name} photo ${index + 1}`} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
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

export default ProfileView;
