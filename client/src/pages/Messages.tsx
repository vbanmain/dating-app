import { useState, useEffect, useRef } from "react";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useMessages } from "@/hooks/useMessages";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Send, ArrowLeft, MessageCircle, Sparkle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Message } from "@shared/schema";
import { IceBreakerSuggestions } from "@/components/messages/IceBreakerSuggestions";
import { generateIceBreakers } from "@/lib/iceBreakers";

const Messages = () => {
  const [match, params] = useRoute("/messages/:id");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { 
    conversations, 
    activeConversation,
    messages, 
    sendMessage, 
    isSending,
    setActiveConversation,
    loadConversations,
    loadMessages
  } = useMessages();
  const [messageText, setMessageText] = useState("");
  const [iceBreakers, setIceBreakers] = useState<ReturnType<typeof generateIceBreakers>>([]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (match && params?.id) {
      const userId = parseInt(params.id);
      setActiveConversation(userId);
      loadMessages(userId);
    }
  }, [match, params, setActiveConversation, loadMessages]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // Generate ice breakers when active conversation changes
  useEffect(() => {
    if (activeConversation && user) {
      const matchedUser = conversations.find(c => c.user.id === activeConversation)?.user;
      if (matchedUser) {
        const suggestions = generateIceBreakers(user, matchedUser);
        setIceBreakers(suggestions);
      }
    }
  }, [activeConversation, conversations, user]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeConversation) return;

    sendMessage({
      content: messageText,
      receiverId: activeConversation,
      senderId: user?.id as number
    });
    
    setMessageText("");
  };
  
  const handleIceBreakerSelect = (text: string) => {
    setMessageText(text);
    // Optionally auto-focus the input
    setTimeout(() => {
      const inputElement = document.querySelector('input[type="text"]') as HTMLInputElement;
      if (inputElement) {
        inputElement.focus();
      }
    }, 100);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid md:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
        {/* Conversation List (left sidebar) */}
        <div className="hidden md:block md:col-span-1 bg-white dark:bg-neutral-800 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
            <h2 className="text-xl font-bold">Messages</h2>
          </div>
          
          <div className="divide-y divide-neutral-200 dark:divide-neutral-700 overflow-y-auto max-h-[calc(100vh-300px)]">
            {conversations.length > 0 ? (
              conversations.map((convo) => (
                <button
                  key={convo.user.id}
                  className={`w-full p-4 flex items-center text-left hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors ${
                    activeConversation === convo.user.id ? "bg-neutral-100 dark:bg-neutral-700" : ""
                  }`}
                  onClick={() => {
                    setActiveConversation(convo.user.id);
                    loadMessages(convo.user.id);
                  }}
                >
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage 
                        src={Array.isArray(convo.user.photoUrls) && convo.user.photoUrls.length > 0 
                          ? convo.user.photoUrls[0] as string
                          : undefined
                        } 
                        alt={convo.user.name} 
                      />
                      <AvatarFallback>{convo.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {new Date().getTime() - new Date(convo.user.lastActive).getTime() < 10 * 60 * 1000 && (
                      <span className="absolute bottom-0 right-0 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
                      </span>
                    )}
                  </div>
                  <div className="ml-4 flex-1 overflow-hidden">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                        {convo.user.name}
                      </h4>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        {formatDistanceToNow(new Date(convo.lastMessage.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 truncate">
                      {convo.lastMessage.senderId === user?.id ? "You: " : ""}
                      {convo.lastMessage.content}
                    </p>
                  </div>
                  
                  {!convo.lastMessage.read && convo.lastMessage.receiverId === user?.id && (
                    <div className="ml-2 h-2 w-2 bg-primary rounded-full"></div>
                  )}
                </button>
              ))
            ) : (
              <div className="p-6 text-center text-neutral-500 dark:text-neutral-400">
                No conversations yet. Match with someone to start chatting!
              </div>
            )}
          </div>
        </div>
        
        {/* Message Area */}
        <div className="md:col-span-2 bg-white dark:bg-neutral-800 rounded-lg shadow-sm overflow-hidden flex flex-col h-full">
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="md:hidden mr-2"
                  onClick={() => setActiveConversation(null)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                
                {conversations.find(c => c.user.id === activeConversation) && (
                  <>
                    <Avatar className="h-10 w-10">
                      <AvatarImage 
                        src={(() => {
                          const activeUser = conversations.find(c => c.user.id === activeConversation)?.user;
                          if (!activeUser) return undefined;
                          return Array.isArray(activeUser.photoUrls) && activeUser.photoUrls.length > 0
                            ? activeUser.photoUrls[0] as string
                            : undefined;
                        })()}
                        alt={conversations.find(c => c.user.id === activeConversation)?.user.name} 
                      />
                      <AvatarFallback>
                        {conversations.find(c => c.user.id === activeConversation)?.user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="ml-3">
                      <h3 className="font-semibold text-lg">
                        {conversations.find(c => c.user.id === activeConversation)?.user.name}
                      </h3>
                      {new Date().getTime() - new Date(conversations.find(c => c.user.id === activeConversation)?.user.lastActive || 0).getTime() < 10 * 60 * 1000 ? (
                        <p className="text-xs text-success">Online</p>
                      ) : (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          Last active {formatDistanceToNow(
                            new Date(conversations.find(c => c.user.id === activeConversation)?.user.lastActive || 0), 
                            { addSuffix: true }
                          )}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50 dark:bg-neutral-900">
                {messages.length > 0 ? (
                  messages.map((message: Message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderId === user?.id ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] px-4 py-2 rounded-lg ${
                          message.senderId === user?.id
                            ? "bg-primary text-white"
                            : "bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                        }`}
                      >
                        <p>{message.content}</p>
                        <div 
                          className={`text-xs mt-1 ${
                            message.senderId === user?.id
                              ? "text-primary-foreground/70"
                              : "text-neutral-500 dark:text-neutral-400"
                          }`}
                        >
                          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <Card className="max-w-sm mx-auto">
                      <CardContent className="pt-6 text-center">
                        <div className="mb-4 bg-neutral-100 dark:bg-neutral-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                          <Send className="h-6 w-6 text-neutral-500" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">Start the conversation</h3>
                        <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                          Send a message to start chatting with {
                            conversations.find(c => c.user.id === activeConversation)?.user.name
                          }
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Message Input */}
              <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
                {/* Ice Breaker Suggestions - Full card for empty conversations */}
                {messages.length === 0 && iceBreakers.length > 0 && (
                  <div className="mb-4">
                    <IceBreakerSuggestions 
                      iceBreakers={iceBreakers}
                      onSelect={handleIceBreakerSelect}
                      onSendDirectly={(text) => {
                        if (activeConversation) {
                          sendMessage({
                            content: text,
                            receiverId: activeConversation,
                            senderId: user?.id as number
                          });
                        }
                      }}
                      showSendButton={true}
                    />
                  </div>
                )}
                
                <form onSubmit={handleSendMessage} className="flex items-center">
                  <div className="flex-1 flex">
                    <Input
                      type="text"
                      placeholder="Type a message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      className="flex-1 rounded-r-none"
                    />
                    
                    {/* Ice Breaker Button - Always visible in message input */}
                    {iceBreakers.length > 0 && (
                      <div className="border border-l-0 border-input px-1 flex items-center bg-background">
                        <IceBreakerSuggestions 
                          iceBreakers={iceBreakers}
                          onSelect={handleIceBreakerSelect}
                          onSendDirectly={(text) => {
                            if (activeConversation) {
                              sendMessage({
                                content: text,
                                receiverId: activeConversation,
                                senderId: user?.id as number
                              });
                            }
                          }}
                          compact={true}
                        />
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="ml-2"
                    disabled={isSending || !messageText.trim()}
                  >
                    {isSending ? (
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </div>
            </>
          ) : (
            /* No active conversation */
            <div className="h-full flex items-center justify-center p-6">
              <Card className="max-w-sm mx-auto">
                <CardContent className="pt-6 text-center">
                  <div className="mb-4 bg-neutral-100 dark:bg-neutral-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                    <MessageCircle className="h-6 w-6 text-neutral-500" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Your Messages</h3>
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-4">
                    {conversations.length > 0 
                      ? "Select a conversation to start chatting"
                      : "When you match with someone, you can start a conversation here"
                    }
                  </p>
                  {conversations.length === 0 && (
                    <Button 
                      variant="default" 
                      onClick={() => window.location.href = "/discover"}
                    >
                      Discover Matches
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
