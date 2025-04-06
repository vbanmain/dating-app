import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "./useAuth";
import { User } from "@shared/schema";
import { useToast } from "./use-toast";

export const useMatches = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch all matches
  const { data: matches = [], isLoading, error, refetch } = useQuery({
    queryKey: ['/api/matches'],
  });

  // Like a profile
  const { mutate: likeProfile, isPending: isLiking } = useMutation({
    mutationFn: async (likedId: number) => {
      if (!user) throw new Error("You must be logged in to like profiles");
      
      const response = await apiRequest("POST", "/api/likes", {
        likerId: user.id,
        likedId
      });
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/discover'] });
      queryClient.invalidateQueries({ queryKey: ['/api/matches'] });
      
      if (data.isMatch) {
        toast({
          title: "It's a match!",
          description: `You and ${data.matchedUser.name} have liked each other!`,
        });
      }
      
      return data;
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to like profile. Please try again.",
        variant: "destructive",
      });
      console.error("Error liking profile:", error);
    }
  });

  const handleLikeProfile = useCallback(async (likedId: number) => {
    try {
      return await likeProfile(likedId);
    } catch (error) {
      console.error("Error liking profile:", error);
      throw error;
    }
  }, [likeProfile]);

  return {
    matches: matches as Omit<User, "password">[],
    isLoading,
    error,
    likeProfile: handleLikeProfile,
    isLiking,
    refetchMatches: refetch
  };
};
