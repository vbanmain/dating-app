import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { User } from "@shared/schema";
import { Heart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface MatchNotificationProps {
  matchedUser: Omit<User, "password">;
  onClose: () => void;
}

const MatchNotification = ({ matchedUser, onClose }: MatchNotificationProps) => {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const handleSendMessage = () => {
    setLocation(`/messages/${matchedUser.id}`);
    onClose();
  };

  const handleKeepBrowsing = () => {
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-neutral-800 rounded-xl p-6 max-w-md w-full mx-4 text-center shadow-lg">
        <div className="mb-4">
          <span className="inline-block p-3 bg-primary bg-opacity-10 rounded-full">
            <Heart className="h-8 w-8 text-primary" />
          </span>
        </div>
        <h2 className="text-2xl font-bold font-heading mb-2">It's a Match!</h2>
        <p className="text-neutral-600 dark:text-neutral-400 mb-6">
          You and {matchedUser.name} have liked each other!
        </p>
        
        <div className="flex -space-x-4 justify-center mb-6">
          <div className="h-20 w-20 rounded-full border-4 border-white dark:border-neutral-800 overflow-hidden">
            <img 
              src={matchedUser.photoUrls.length > 0 ? matchedUser.photoUrls[0] : "https://via.placeholder.com/120x120?text=No+Photo"} 
              alt={matchedUser.name} 
              className="h-full w-full object-cover" 
            />
          </div>
          <div className="h-20 w-20 rounded-full border-4 border-white dark:border-neutral-800 overflow-hidden">
            <img 
              src={user?.photoUrls?.length ? user.photoUrls[0] : "https://via.placeholder.com/120x120?text=No+Photo"} 
              alt="You" 
              className="h-full w-full object-cover" 
            />
          </div>
        </div>
        
        <div className="flex flex-col space-y-3">
          <Button 
            className="bg-primary hover:bg-primary/90 text-white font-medium py-3 rounded-lg transition-colors"
            onClick={handleSendMessage}
          >
            Send a Message
          </Button>
          <Button 
            variant="outline"
            className="font-medium py-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
            onClick={handleKeepBrowsing}
          >
            Keep Browsing
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MatchNotification;
