import { useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMatches } from "@/hooks/useMatches";
import { User } from "@shared/schema";
import { MessageCircle, Heart } from "lucide-react";

const Matches = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { matches, isLoading, error } = useMatches();

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load matches. Please try again later.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleViewProfile = (id: number) => {
    setLocation(`/profile/${id}`);
  };

  const handleSendMessage = (id: number) => {
    setLocation(`/messages/${id}`);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Your Matches</h1>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-neutral-600 dark:text-neutral-400">Loading matches...</p>
          </div>
        ) : matches.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {matches.map((match: Omit<User, "password">) => (
              <Card key={match.id} className="overflow-hidden">
                <div className="aspect-square relative overflow-hidden">
                  <img 
                    src={match.photoUrls.length > 0 ? match.photoUrls[0] : "https://via.placeholder.com/300x300?text=No+Photo"}
                    alt={match.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end">
                    <div className="p-4 text-white">
                      <h3 className="text-xl font-bold">{match.name}, {match.age}</h3>
                      <p className="text-sm flex items-center opacity-90">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        {match.location ? `${match.location}` : 'Location unknown'}
                      </p>
                    </div>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-2 mt-2 mb-3">
                    {(match.interests as string[]).slice(0, 3).map((interest, index) => (
                      <span key={index} className="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 rounded-full text-xs text-neutral-700 dark:text-neutral-300">
                        {interest}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex mt-4 gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleViewProfile(match.id)}
                    >
                      View Profile
                    </Button>
                    <Button 
                      variant="default"
                      className="flex-1"
                      onClick={() => handleSendMessage(match.id)}
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Message
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">No matches yet</h3>
              <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                Keep liking profiles to make connections. When someone likes you back, they'll appear here.
              </p>
              <Button 
                variant="default" 
                onClick={() => setLocation("/discover")}
              >
                Discover More Profiles
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Matches;
