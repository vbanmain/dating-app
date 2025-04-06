import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import ProfileView from "@/components/profile/ProfileView";
import { User } from "@shared/schema";

interface ProfileProps {
  userId?: number;
}

const Profile = ({ userId }: ProfileProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const isOwnProfile = !userId;

  // If viewing own profile, use the user data from auth context
  // Otherwise, fetch the user data for the specified userId
  const { data: profileData, isLoading, error } = useQuery({
    queryKey: isOwnProfile ? ['/api/auth/me'] : [`/api/users/${userId}`],
    enabled: !isOwnProfile && !!userId,
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load profile. Please try again later.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Determine the profile to display
  const profileToShow = isOwnProfile ? user : profileData;

  return (
    <div>
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading profile...</p>
        </div>
      ) : profileToShow ? (
        <ProfileView profile={profileToShow as Omit<User, "password">} isOwnProfile={isOwnProfile} />
      ) : (
        <div className="container mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-bold mb-2">Profile not found</h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            The profile you're looking for doesn't exist or you don't have permission to view it.
          </p>
        </div>
      )}
    </div>
  );
};

export default Profile;
