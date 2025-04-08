import Stripe from 'stripe';
import { storage } from '../storage';
import type { User, InsertPaymentTransaction } from '@shared/schema';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// Default subscription plans
const SUBSCRIPTION_TIERS = {
  BASIC: {
    name: 'Basic',
    price: 999, // $9.99
    features: ['Unlimited likes', 'See who liked you'],
    durationDays: 30
  },
  PREMIUM: {
    name: 'Premium',
    price: 1999, // $19.99
    features: ['Unlimited likes', 'See who liked you', 'Priority in discovery', 'Read receipts'],
    durationDays: 30
  },
  PLATINUM: {
    name: 'Platinum',
    price: 2999, // $29.99
    features: ['Unlimited likes', 'See who liked you', 'Priority in discovery', 'Read receipts', 'Profile boosts'],
    durationDays: 30
  }
};

export async function createCustomer(user: User): Promise<Stripe.Customer> {
  if (user.stripeCustomerId) {
    // If user already has a customer ID, retrieve the customer
    const customer = await stripe.customers.retrieve(user.stripeCustomerId);
    if (customer.deleted) {
      throw new Error('Customer has been deleted');
    }
    return customer as Stripe.Customer;
  }

  // Create a new customer
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name,
    metadata: {
      userId: user.id.toString()
    }
  });

  // Update user with new customer ID
  await storage.updateStripeCustomerId(user.id, customer.id);

  return customer;
}

export async function createPaymentIntent(
  userId: number, 
  amount: number, 
  currency: string = 'usd', 
  description: string = ''
): Promise<Stripe.PaymentIntent> {
  const user = await storage.getUser(userId);
  if (!user) {
    throw new Error(`User with ID ${userId} not found`);
  }

  // Create or get Stripe customer
  const customer = await createCustomer(user);

  // Create the payment intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency,
    customer: customer.id,
    description,
    metadata: {
      userId: userId.toString()
    }
  });

  // Record the transaction in our database
  const transactionData: InsertPaymentTransaction = {
    userId,
    amount,
    currency,
    stripePaymentIntentId: paymentIntent.id,
    stripeCustomerId: customer.id,
    status: paymentIntent.status,
    description,
    metadata: {
      paymentIntentId: paymentIntent.id,
      customerId: customer.id
    }
  };

  await storage.createPaymentTransaction(transactionData);

  return paymentIntent;
}

export async function createSubscription(
  userId: number,
  priceId: string,
  tier: string
): Promise<Stripe.Subscription> {
  const user = await storage.getUser(userId);
  if (!user) {
    throw new Error(`User with ID ${userId} not found`);
  }

  // Create or get Stripe customer
  const customer = await createCustomer(user);

  // Check if user already has a subscription
  if (user.stripeSubscriptionId) {
    // Retrieve the existing subscription
    try {
      const existingSubscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      
      // If active, cancel it before creating a new one
      if (existingSubscription.status === 'active') {
        await stripe.subscriptions.del(user.stripeSubscriptionId);
      }
    } catch (error) {
      console.error('Error retrieving subscription', error);
      // Continue with creating a new subscription
    }
  }

  // Create the subscription
  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent'],
    metadata: {
      userId: userId.toString(),
      tier: tier
    }
  });

  // Calculate expiration date (30 days from now by default)
  const tierConfig = SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS] || SUBSCRIPTION_TIERS.BASIC;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + tierConfig.durationDays);

  // Update user subscription info
  await storage.updateUserSubscription(
    userId, 
    subscription.id, 
    tier, 
    subscription.status, 
    expiresAt
  );

  // Record the transaction
  const invoice = subscription.latest_invoice as Stripe.Invoice;
  if (invoice && invoice.payment_intent) {
    const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;
    const transactionData: InsertPaymentTransaction = {
      userId,
      amount: invoice.amount_due,
      currency: invoice.currency,
      stripePaymentIntentId: paymentIntent.id,
      stripeCustomerId: customer.id,
      status: paymentIntent.status,
      description: `Subscription: ${tier}`,
      metadata: {
        subscriptionId: subscription.id,
        invoiceId: invoice.id,
        tier: tier
      }
    };

    await storage.createPaymentTransaction(transactionData);
  }

  return subscription;
}

export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.retrieve(subscriptionId);
}

export async function cancelSubscription(userId: number): Promise<void> {
  const user = await storage.getUser(userId);
  if (!user || !user.stripeSubscriptionId) {
    throw new Error(`No active subscription found for user ${userId}`);
  }

  await stripe.subscriptions.del(user.stripeSubscriptionId);

  // Update user's subscription status
  await storage.updateUserSubscription(
    userId,
    user.stripeSubscriptionId,
    user.subscriptionTier,
    'canceled',
    null
  );
}

export async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const userId = parseInt(paymentIntent.metadata.userId);
      
      // Update the transaction status
      const transactions = await storage.getUserPaymentTransactions(userId);
      const transaction = transactions.find(t => t.stripePaymentIntentId === paymentIntent.id);
      
      if (transaction) {
        await storage.updatePaymentTransactionStatus(transaction.id, paymentIntent.status);
      }
      break;
      
    case 'subscription.updated':
    case 'subscription.created':
      const subscription = event.data.object as Stripe.Subscription;
      const subUserId = parseInt(subscription.metadata.userId);
      const tier = subscription.metadata.tier;
      
      if (subUserId) {
        const user = await storage.getUser(subUserId);
        if (user) {
          // Calculate expiration date (30 days from now by default)
          const tierConfig = SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS] || SUBSCRIPTION_TIERS.BASIC;
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + tierConfig.durationDays);
          
          await storage.updateUserSubscription(
            subUserId,
            subscription.id,
            tier,
            subscription.status,
            expiresAt
          );
        }
      }
      break;
      
    case 'subscription.deleted':
      const deletedSubscription = event.data.object as Stripe.Subscription;
      const deletedSubUserId = parseInt(deletedSubscription.metadata.userId);
      
      if (deletedSubUserId) {
        const user = await storage.getUser(deletedSubUserId);
        if (user && user.stripeSubscriptionId === deletedSubscription.id) {
          await storage.updateUserSubscription(
            deletedSubUserId,
            deletedSubscription.id,
            user.subscriptionTier,
            'canceled',
            null
          );
        }
      }
      break;
      
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}