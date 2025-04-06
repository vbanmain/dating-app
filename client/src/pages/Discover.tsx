import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useProfiles } from "@/hooks/useProfiles";
import { User } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import ProfileCard from "@/components/profile/ProfileCard";
import FilterSection from "@/components/profile/FilterSection";
import { RefreshCw } from "lucide-react";

const Discover = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { profiles, isLoading, error, fetchMoreProfiles } = useProfiles();

  // Filter states
  const [ageRange, setAgeRange] = useState<[number, number]>([18, 50]);
  const [distance, setDistance] = useState<number>(25);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  // List of all possible interests for filtering
  const allInterests = [
    "Travel", "Photography", "Music", "Art", "Reading", "Writing", "Gaming", 
    "Cooking", "Fitness", "Yoga", "Hiking", "Dancing", "Movies", "Fashion", 
    "Technology", "Sports", "Animals", "Nature", "Food", "Coffee", "Wine", 
    "Beer", "Meditation", "Volunteering", "Languages", "Science", "History"
  ];

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load profiles. Please try again later.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Filter the profiles based on selected criteria
  const filteredProfiles = profiles.filter((profile: Omit<User, "password">) => {
    // Filter by age range
    if (profile.age < ageRange[0] || profile.age > ageRange[1]) return false;
    
    // Filter by interests (if any are selected)
    if (selectedInterests.length > 0) {
      const profileInterests = profile.interests as string[];
      if (!selectedInterests.some(interest => profileInterests.includes(interest))) {
        return false;
      }
    }
    
    // In a real app, we would filter by distance, but for now we'll assume
    // the backend is already returning profiles within the user's max distance
    return true;
  });

  return (
    <>
      <FilterSection 
        ageRange={ageRange}
        setAgeRange={setAgeRange}
        distance={distance}
        setDistance={setDistance}
        interests={allInterests}
        selectedInterests={selectedInterests}
        setSelectedInterests={setSelectedInterests}
      />
      
      <div className="container mx-auto px-4">
        {isLoading && profiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-neutral-600 dark:text-neutral-400">Loading profiles...</p>
          </div>
        ) : filteredProfiles.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProfiles.map((profile: Omit<User, "password">) => (
                <ProfileCard key={profile.id} profile={profile} />
              ))}
            </div>
            
            <div className="mt-8 mb-4 flex justify-center">
              <Button 
                variant="outline"
                size="lg"
                className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full shadow-sm hover:shadow-md transition-shadow flex items-center"
                onClick={fetchMoreProfiles}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-primary border-t-transparent rounded-full"></div>
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Load More Profiles
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="inline-block p-3 bg-neutral-100 dark:bg-neutral-800 rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-1">No profiles found</h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              We couldn't find any profiles matching your criteria. Try adjusting your filters.
            </p>
            <Button 
              variant="default"
              onClick={() => {
                setAgeRange([18, 50]);
                setDistance(25);
                setSelectedInterests([]);
              }}
            >
              Reset Filters
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default Discover;
