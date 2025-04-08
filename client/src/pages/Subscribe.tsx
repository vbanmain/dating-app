import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { CheckoutForm } from "@/components/payments/CheckoutForm";
import { usePayments } from "@/hooks/usePayments";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

// Make sure to call loadStripe outside of a component's render to avoid
// recreating the Stripe object on every render.
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// These would ideally come from the API, hardcoded for demo
const SUBSCRIPTION_PRICES = {
  BASIC: "price_1MwQJgAqYLrYuDEXu7n1tjFJ",
  PREMIUM: "price_1MwQJgAqYLrYuDEXu7n1tjFJ",
  PLATINUM: "price_1MwQJgAqYLrYuDEXu7n1tjFJ"
};

export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<"BASIC" | "PREMIUM" | "PLATINUM">("PREMIUM");
  const [isSelectingPlan, setIsSelectingPlan] = useState(true);
  
  const { createSubscription, isCreatingSubscription, subscription, isLoadingSubscription } = usePayments();
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, isLoading, setLocation]);
  
  const handlePlanSelect = (plan: "BASIC" | "PREMIUM" | "PLATINUM") => {
    setSelectedPlan(plan);
  };
  
  const handleContinueToPayment = async () => {
    setIsSelectingPlan(false);
    
    try {
      const priceId = SUBSCRIPTION_PRICES[selectedPlan];
      const result = await createSubscription({ 
        priceId, 
        tier: selectedPlan 
      });
      
      setClientSecret(result.clientSecret);
    } catch (error) {
      console.error("Error creating subscription:", error);
      // Return to plan selection on error
      setIsSelectingPlan(true);
    }
  };
  
  const handleSuccess = () => {
    // Redirect to profile after successful subscription
    setTimeout(() => setLocation("/profile"), 1500);
  };
  
  const handleCancel = () => {
    if (isSelectingPlan) {
      // Go back when canceled from plan selection
      setLocation("/profile");
    } else {
      // Return to plan selection when canceled from payment
      setIsSelectingPlan(true);
    }
  };
  
  if (isLoading || isLoadingSubscription) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p className="text-center">Loading subscription details...</p>
      </div>
    );
  }
  
  // If already subscribed, show subscription details
  if (subscription?.isPremium) {
    return (
      <div className="container max-w-md mx-auto py-10 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Current Subscription</CardTitle>
            <CardDescription>
              You're already subscribed to our service.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <span className="font-semibold">Plan:</span> {subscription.subscriptionTier}
              </div>
              <div>
                <span className="font-semibold">Status:</span> {subscription.subscriptionStatus}
              </div>
              {subscription.subscriptionExpiresAt && (
                <div>
                  <span className="font-semibold">Expires:</span> {new Date(subscription.subscriptionExpiresAt).toLocaleDateString()}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={() => setLocation("/profile")} className="w-full">
              Return to Profile
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container max-w-2xl mx-auto py-10 px-4">
      {isSelectingPlan ? (
        <Card>
          <CardHeader>
            <CardTitle>Choose a Subscription Plan</CardTitle>
            <CardDescription>
              Upgrade your experience with a premium subscription
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup 
              value={selectedPlan} 
              onValueChange={(value) => handlePlanSelect(value as "BASIC" | "PREMIUM" | "PLATINUM")}
              className="space-y-4"
            >
              <div className={`border rounded-lg p-4 ${selectedPlan === "BASIC" ? "border-primary" : "border-gray-200"}`}>
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="BASIC" id="basic" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="basic" className="text-lg font-semibold">Basic</Label>
                    <div className="text-2xl font-bold mt-1">$9.99<span className="text-sm font-normal text-gray-500">/month</span></div>
                    <div className="text-gray-500 mt-1">Perfect for casual users</div>
                    <Separator className="my-4" />
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                        <span>Unlimited likes</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                        <span>See who liked you</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className={`border rounded-lg p-4 ${selectedPlan === "PREMIUM" ? "border-primary" : "border-gray-200"}`}>
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="PREMIUM" id="premium" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center">
                      <Label htmlFor="premium" className="text-lg font-semibold">Premium</Label>
                      <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">Popular</span>
                    </div>
                    <div className="text-2xl font-bold mt-1">$19.99<span className="text-sm font-normal text-gray-500">/month</span></div>
                    <div className="text-gray-500 mt-1">Our most popular plan</div>
                    <Separator className="my-4" />
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                        <span>Unlimited likes</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                        <span>See who liked you</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                        <span>Priority in discovery</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                        <span>Read receipts</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className={`border rounded-lg p-4 ${selectedPlan === "PLATINUM" ? "border-primary" : "border-gray-200"}`}>
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="PLATINUM" id="platinum" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="platinum" className="text-lg font-semibold">Platinum</Label>
                    <div className="text-2xl font-bold mt-1">$29.99<span className="text-sm font-normal text-gray-500">/month</span></div>
                    <div className="text-gray-500 mt-1">For serious daters</div>
                    <Separator className="my-4" />
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                        <span>Unlimited likes</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                        <span>See who liked you</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                        <span>Priority in discovery</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                        <span>Read receipts</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                        <span>Profile boosts</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </RadioGroup>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleContinueToPayment} disabled={isCreatingSubscription}>
              {isCreatingSubscription ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Continue to Payment'
              )}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Complete Your Subscription</CardTitle>
            <CardDescription>
              Subscribe to {selectedPlan.charAt(0) + selectedPlan.slice(1).toLowerCase()} Plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            {clientSecret ? (
              <Elements 
                stripe={stripePromise} 
                options={{ 
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                    variables: {
                      colorPrimary: '#7c3aed',
                    }
                  }
                }}
              >
                <CheckoutForm 
                  onSuccess={handleSuccess} 
                  onCancel={handleCancel}
                  isSubscription={true}
                />
              </Elements>
            ) : (
              <div className="flex flex-col items-center py-6">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p>Preparing payment form...</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}