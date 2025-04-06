import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "./useAuth";
import { InsertMessage, Message, User } from "@shared/schema";
import { useToast } from "./use-toast";

interface Conversation {
  user: Omit<User, "password">;
  lastMessage: Message;
}

export const useMessages = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeConversation, setActiveConversation] = useState<number | null>(null);

  // Fetch all conversations
  const { data: conversations = [], isLoading: isLoadingConversations } = useQuery({
    queryKey: ['/api/conversations'],
  });

  // Fetch messages for the active conversation
  const { data: messages = [], isLoading: isLoadingMessages, refetch: refetchMessages } = useQuery({
    queryKey: [activeConversation ? `/api/messages/${activeConversation}` : null],
    enabled: !!activeConversation,
  });

  // Load conversations
  const loadConversations = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
  }, [queryClient]);

  // Load messages for a specific conversation
  const loadMessages = useCallback(async (userId: number) => {
    setActiveConversation(userId);
    await queryClient.invalidateQueries({ queryKey: [`/api/messages/${userId}`] });
  }, [queryClient]);

  // Send a message
  const { mutate: sendMessageMutation, isPending: isSending } = useMutation({
    mutationFn: async (message: InsertMessage) => {
      if (!user) throw new Error("You must be logged in to send messages");
      
      const response = await apiRequest("POST", "/api/messages", message);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate the queries to refetch the updated data
      if (activeConversation) {
        queryClient.invalidateQueries({ queryKey: [`/api/messages/${activeConversation}`] });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      console.error("Error sending message:", error);
    }
  });

  const sendMessage = useCallback(async (message: InsertMessage) => {
    try {
      await sendMessageMutation(message);
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }, [sendMessageMutation]);

  return {
    conversations: conversations as Conversation[],
    messages: messages as Message[],
    activeConversation,
    setActiveConversation,
    loadConversations,
    loadMessages,
    sendMessage,
    isLoadingConversations,
    isLoadingMessages,
    isSending,
    refetchMessages
  };
};
