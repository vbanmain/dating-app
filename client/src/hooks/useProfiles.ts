import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";

export const useProfiles = () => {
  const [page, setPage] = useState(1);
  const [allProfiles, setAllProfiles] = useState<Omit<User, "password">[]>([]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/discover'],
  });

  // Add profiles to state when data changes
  if (data && (!allProfiles.length || data.length > allProfiles.length)) {
    setAllProfiles(data);
  }

  // Function to load more profiles (in a real app, this would use pagination)
  const fetchMoreProfiles = useCallback(async () => {
    setPage(prev => prev + 1);
    // In a real implementation, we would pass page as a query param
    // For this demo, we'll just refetch all profiles
    await refetch();
  }, [refetch]);

  return {
    profiles: allProfiles,
    isLoading,
    error,
    fetchMoreProfiles,
    page
  };
};
