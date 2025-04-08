import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IceBreaker } from "@/lib/iceBreakers";
import { Sparkle, ChevronLeft, ChevronRight, Check, SendHorizonal, Edit, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface IceBreakerSuggestionsProps {
  iceBreakers: IceBreaker[];
  onSelect: (text: string) => void;
  onSendDirectly?: (text: string) => void;
  className?: string;
  compact?: boolean;
  showSendButton?: boolean;
}

export function IceBreakerSuggestions({ 
  iceBreakers, 
  onSelect,
  onSendDirectly,
  className,
  compact = false,
  showSendButton = false
}: IceBreakerSuggestionsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [usedIndices, setUsedIndices] = useState<number[]>([]);
  
  // If there are no ice breakers, don't render anything
  if (!iceBreakers.length) return null;
  
  const currentIceBreaker = iceBreakers[currentIndex];
  
  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % iceBreakers.length;
    setCurrentIndex(nextIndex);
  };
  
  const handlePrevious = () => {
    const prevIndex = (currentIndex - 1 + iceBreakers.length) % iceBreakers.length;
    setCurrentIndex(prevIndex);
  };
  
  const handleSelect = () => {
    onSelect(currentIceBreaker.text);
    setUsedIndices([...usedIndices, currentIndex]);
  };

  const handleSendDirectly = () => {
    if (onSendDirectly) {
      onSendDirectly(currentIceBreaker.text);
      setUsedIndices([...usedIndices, currentIndex]);
    }
  };
  
  // Category colors
  const getCategoryColor = (category: IceBreaker['category']) => {
    switch (category) {
      case 'general':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'interests':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'profile':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'question':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };
  
  const isUsed = usedIndices.includes(currentIndex);

  // Compact dropdown version
  if (compact) {
    return (
      <DropdownMenu>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className={cn("h-9 w-9", className)}
                >
                  <Sparkle className="h-4 w-4 text-primary" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Ice Breaker Suggestions</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <DropdownMenuContent align="end" className="w-[300px]">
          {iceBreakers.map((iceBreaker, index) => (
            <DropdownMenuItem 
              key={index} 
              className="flex flex-col items-start py-2 cursor-pointer"
              onSelect={(e) => {
                e.preventDefault();
                if (onSendDirectly) {
                  onSendDirectly(iceBreaker.text);
                } else {
                  onSelect(iceBreaker.text);
                }
                setUsedIndices([...usedIndices, index]);
              }}
            >
              <div className="flex items-center w-full">
                <Badge
                  variant="outline"
                  className={cn("text-xs mr-2", getCategoryColor(iceBreaker.category))}
                >
                  {iceBreaker.category}
                </Badge>
                {usedIndices.includes(index) && (
                  <span className="text-xs text-neutral-500 ml-auto">Used</span>
                )}
              </div>
              <p className="text-sm mt-1">{iceBreaker.text}</p>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
  
  // Standard card version
  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-4">
        <div className="flex items-center mb-2">
          <Sparkle className="h-4 w-4 text-primary mr-2" />
          <h3 className="text-sm font-medium">Ice Breaker Suggestion</h3>
          <Badge
            variant="outline"
            className={cn("ml-auto text-xs", getCategoryColor(currentIceBreaker.category))}
          >
            {currentIceBreaker.category}
          </Badge>
        </div>
        
        <p className="text-sm mb-3 min-h-[50px]">{currentIceBreaker.text}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8"
              onClick={handlePrevious}
              title="Previous suggestion"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8"
              onClick={handleNext}
              title="Next suggestion"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex gap-2">
            {showSendButton && onSendDirectly && (
              <Button 
                size="sm" 
                className="gap-1"
                onClick={handleSendDirectly}
                disabled={isUsed}
                variant="default"
              >
                <SendHorizonal className="h-4 w-4 mr-1" />
                Send Now
              </Button>
            )}
            
            <Button 
              size="sm" 
              className="gap-1"
              onClick={handleSelect}
              disabled={isUsed}
              variant={showSendButton ? "outline" : "default"}
            >
              {isUsed ? (
                <>
                  <Check className="h-4 w-4" />
                  Used
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit First
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}