import { useLocation, Link } from "wouter";
import { Compass, Search, Heart, MessageCircle, User } from "lucide-react";

const MobileNavigation = () => {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 py-1 md:hidden z-30">
      <div className="grid grid-cols-5 gap-1">
        <Link href="/discover" className={`flex flex-col items-center justify-center py-2 ${location === '/discover' || location === '/' ? 'text-primary' : 'text-neutral-600 dark:text-neutral-400'}`}>
          <Compass className="h-6 w-6" />
          <span className="text-xs mt-1">Discover</span>
        </Link>
        <Link href="/matches" className={`flex flex-col items-center justify-center py-2 ${location === '/matches' ? 'text-primary' : 'text-neutral-600 dark:text-neutral-400'}`}>
          <Search className="h-6 w-6" />
          <span className="text-xs mt-1">Search</span>
        </Link>
        <Link href="/matches" className="flex flex-col items-center justify-center">
          <span className="flex items-center justify-center h-12 w-12 bg-primary rounded-full text-white shadow-lg mb-1">
            <Heart className="h-6 w-6" />
          </span>
        </Link>
        <Link href="/messages" className={`flex flex-col items-center justify-center py-2 ${location.startsWith('/messages') ? 'text-primary' : 'text-neutral-600 dark:text-neutral-400'}`}>
          <MessageCircle className="h-6 w-6" />
          <span className="text-xs mt-1">Messages</span>
        </Link>
        <Link href="/profile" className={`flex flex-col items-center justify-center py-2 ${location === '/profile' || location.startsWith('/profile/') ? 'text-primary' : 'text-neutral-600 dark:text-neutral-400'}`}>
          <User className="h-6 w-6" />
          <span className="text-xs mt-1">Profile</span>
        </Link>
      </div>
    </nav>
  );
};

export default MobileNavigation;
