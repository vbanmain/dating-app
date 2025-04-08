import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CheckoutFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  isSubscription?: boolean;
}

export function CheckoutForm({ 
  onSuccess, 
  onCancel, 
  isSubscription = false 
}: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();

  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      //`Elements` instance that was used to create the Payment Element
      elements,
      confirmParams: {
        return_url: window.location.origin,
      },
      redirect: "if_required",
    });

    if (error) {
      // Show error to your customer (for example, payment details incomplete)
      setMessage(error.message || "An unexpected error occurred.");
      toast({
        title: "Payment Failed",
        description: error.message || "Your payment was not completed.",
        variant: "destructive",
      });
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      // Payment succeeded!
      setMessage("Payment successful!");
      setIsComplete(true);
      toast({
        title: "Payment Successful",
        description: isSubscription 
          ? "Your subscription is now active!" 
          : "Thank you for your payment!",
      });
      
      // Call onSuccess callback
      if (onSuccess) {
        onSuccess();
      }
    } else {
      setMessage("An unexpected error occurred.");
      toast({
        title: "Payment Status Unknown",
        description: "Please contact support if you were charged.",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <Alert variant={isComplete ? "default" : "destructive"}>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
      
      <PaymentElement />
      
      <div className="flex justify-between gap-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel} 
          disabled={isLoading || isComplete}
          className="w-full"
        >
          Cancel
        </Button>
        
        <Button 
          type="submit" 
          disabled={!stripe || isLoading || isComplete} 
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : isComplete ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Complete
            </>
          ) : (
            `Pay ${isSubscription ? 'and Subscribe' : 'Now'}`
          )}
        </Button>
      </div>
    </form>
  );
}