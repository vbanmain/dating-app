import { useMutation, useQuery, QueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Query client for global state management
export const queryClient = new QueryClient();

export const usePayments = () => {
  const { toast } = useToast();

  // Get user's active subscription
  const { 
    data: subscription, 
    isLoading: isLoadingSubscription,
    error: subscriptionError,
    refetch: refetchSubscription
  } = useQuery({
    queryKey: ['/api/my-subscription'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Get all active subscription plans
  const { 
    data: subscriptionPlans, 
    isLoading: isLoadingPlans 
  } = useQuery({
    queryKey: ['/api/subscription-plans'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    staleTime: 1000 * 60 * 60, // 1 hour 
  });

  // Get user's payment history
  const { 
    data: paymentHistory, 
    isLoading: isLoadingHistory 
  } = useQuery({
    queryKey: ['/api/payment-history'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Create a payment intent for one-time purchases
  const { mutateAsync: createPaymentIntent, isPending: isCreatingPaymentIntent } = useMutation({
    mutationFn: async ({ amount, description }: { amount: number, description?: string }) => {
      const response = await apiRequest('POST', '/api/create-payment-intent', { amount, description });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create payment intent');
      }
      return response.json();
    },
    onError: (error) => {
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to process payment",
        variant: "destructive",
      });
    }
  });

  // Create or update a subscription
  const { mutateAsync: createSubscription, isPending: isCreatingSubscription } = useMutation({
    mutationFn: async ({ priceId, tier }: { priceId: string, tier: string }) => {
      const response = await apiRequest('POST', '/api/create-subscription', { priceId, tier });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create subscription');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/my-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['/api/payment-history'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      
      toast({
        title: "Subscription Created",
        description: "Your subscription has been set up successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Subscription Error",
        description: error instanceof Error ? error.message : "Failed to create subscription",
        variant: "destructive",
      });
    }
  });

  // Cancel a subscription
  const { mutateAsync: cancelSubscription, isPending: isCancellingSubscription } = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/cancel-subscription', {});
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to cancel subscription');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/my-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      
      toast({
        title: "Subscription Canceled",
        description: "Your subscription has been canceled successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to cancel subscription",
        variant: "destructive",
      });
    }
  });

  const isPremium = subscription?.isPremium || false;
  
  return {
    // Subscription data
    subscription,
    subscriptionPlans,
    paymentHistory,
    isPremium,
    
    // Loading states
    isLoadingSubscription,
    isLoadingPlans,
    isLoadingHistory,
    isCreatingPaymentIntent,
    isCreatingSubscription,
    isCancellingSubscription,
    
    // Error states
    subscriptionError,
    
    // Actions
    createPaymentIntent,
    createSubscription,
    cancelSubscription,
    refetchSubscription,
  };
};