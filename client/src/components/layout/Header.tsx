import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/hooks/useAuth";
import { Moon, Sun, ChevronDown, Compass, MessageCircle, Heart, User } from "lucide-react";

const Header = () => {
  const [location] = useLocation();
  const { setTheme, theme } = useTheme();
  const { user, logout } = useAuth();

  return (
    <header className="bg-white dark:bg-neutral-800 shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-primary font-bold text-2xl font-heading">Heart<span className="text-accent">Link</span></span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link href="/discover" className={`flex items-center font-medium ${location === '/discover' || location === '/' ? 'text-primary border-b-2 border-primary' : 'text-neutral-600 hover:text-primary dark:text-neutral-300'}`}>
              <Compass className="mr-1 h-5 w-5" />
              Discover
            </Link>
            <Link href="/messages" className={`flex items-center font-medium ${location.startsWith('/messages') ? 'text-primary border-b-2 border-primary' : 'text-neutral-600 hover:text-primary dark:text-neutral-300'}`}>
              <MessageCircle className="mr-1 h-5 w-5" />
              Messages
            </Link>
            <Link href="/matches" className={`flex items-center font-medium ${location === '/matches' ? 'text-primary border-b-2 border-primary' : 'text-neutral-600 hover:text-primary dark:text-neutral-300'}`}>
              <Heart className="mr-1 h-5 w-5" />
              Matches
            </Link>
            <Link href="/profile" className={`flex items-center font-medium ${location === '/profile' || location.startsWith('/profile/') ? 'text-primary border-b-2 border-primary' : 'text-neutral-600 hover:text-primary dark:text-neutral-300'}`}>
              <User className="mr-1 h-5 w-5" />
              Profile
            </Link>
          </nav>
          
          {/* User menu */}
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="text-neutral-600 hover:text-primary dark:text-neutral-300"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage 
                      src={user?.photoUrls?.length ? user.photoUrls[0] : undefined} 
                      alt={user?.name || "User"} 
                    />
                    <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <ChevronDown className="ml-1 h-4 w-4 text-neutral-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48" align="end">
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile/edit" className="cursor-pointer">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>Help Center</DropdownMenuItem>
                <DropdownMenuItem>Premium Features</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive cursor-pointer">
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
