import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { CheckoutForm } from "@/components/payments/CheckoutForm";
import { usePayments } from "@/hooks/usePayments";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Make sure to call loadStripe outside of a component's render to avoid
// recreating the Stripe object on every render.
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export default function Checkout() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const { createPaymentIntent, isCreatingPaymentIntent } = usePayments();
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  // Get amount and description from URL params
  const searchParams = new URLSearchParams(window.location.search);
  const amount = parseFloat(searchParams.get("amount") || "0");
  const description = searchParams.get("description") || "One-time payment";
  
  useEffect(() => {
    // Redirect if not authenticated
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
      return;
    }

    // Don't proceed if no amount
    if (!amount) return;
    
    // Create a PaymentIntent as soon as the page loads
    createPaymentIntent({ amount, description })
      .then((data) => {
        setClientSecret(data.clientSecret);
      })
      .catch((error) => {
        console.error("Error creating payment intent:", error);
      });
  }, [amount, description, createPaymentIntent, isAuthenticated, isLoading, setLocation]);

  const handleSuccess = () => {
    // Redirect to profile or dashboard after successful payment
    setTimeout(() => setLocation("/profile"), 1500);
  };

  const handleCancel = () => {
    // Go back when canceled
    setLocation("/profile");
  };

  if (isLoading || isCreatingPaymentIntent || !clientSecret) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p className="text-center">Preparing your payment...</p>
      </div>
    );
  }

  return (
    <div className="container max-w-md mx-auto py-10 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Checkout</CardTitle>
          <CardDescription>
            Complete your payment for {description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="text-xl font-bold">${(amount / 100).toFixed(2)}</div>
          </div>
          
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
            />
          </Elements>
        </CardContent>
      </Card>
    </div>
  );
}