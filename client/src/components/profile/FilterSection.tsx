import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown, SlidersHorizontal } from "lucide-react";

interface FilterSectionProps {
  ageRange: [number, number];
  setAgeRange: (value: [number, number]) => void;
  distance: number;
  setDistance: (value: number) => void;
  interests: string[];
  selectedInterests: string[];
  setSelectedInterests: (interests: string[]) => void;
}

const FilterSection = ({
  ageRange,
  setAgeRange,
  distance,
  setDistance,
  interests,
  selectedInterests,
  setSelectedInterests,
}: FilterSectionProps) => {
  const [showAgeFilter, setShowAgeFilter] = useState(false);
  const [showDistanceFilter, setShowDistanceFilter] = useState(false);
  const [showInterestsFilter, setShowInterestsFilter] = useState(false);

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  return (
    <section className="bg-white dark:bg-neutral-800 shadow-sm mb-6">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between flex-wrap">
          <div className="flex items-center space-x-4 py-2 overflow-x-auto">
            <div className="font-medium text-neutral-800 dark:text-neutral-200 whitespace-nowrap">Filter by:</div>
            
            <Popover open={showAgeFilter} onOpenChange={setShowAgeFilter}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-700 rounded-full text-sm flex items-center whitespace-nowrap">
                  <span>Age: {ageRange[0]}-{ageRange[1]}</span>
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-4">
                <div className="mb-4">
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 block">Age Range</label>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">18</span>
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">60+</span>
                  </div>
                  <div className="relative pt-1">
                    <Slider
                      value={[ageRange[0], ageRange[1]]}
                      min={18}
                      max={60}
                      step={1}
                      onValueChange={(value) => setAgeRange([value[0], value[1]])}
                      className="mt-6"
                    />
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-sm font-medium text-primary">{ageRange[0]} years</span>
                    <span className="text-sm font-medium text-primary">{ageRange[1]} years</span>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button 
                    size="sm"
                    onClick={() => setShowAgeFilter(false)}
                  >
                    Apply
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            
            <Popover open={showDistanceFilter} onOpenChange={setShowDistanceFilter}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-700 rounded-full text-sm flex items-center whitespace-nowrap">
                  <span>Distance: {distance} mi</span>
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-4">
                <div className="mb-4">
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 block">Maximum Distance</label>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">1 mile</span>
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">100 miles</span>
                  </div>
                  <div className="relative pt-1">
                    <Slider
                      value={[distance]}
                      min={1}
                      max={100}
                      step={1}
                      onValueChange={(value) => setDistance(value[0])}
                      className="mt-6"
                    />
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-sm font-medium text-primary">{distance} miles</span>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button 
                    size="sm"
                    onClick={() => setShowDistanceFilter(false)}
                  >
                    Apply
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            
            <Popover open={showInterestsFilter} onOpenChange={setShowInterestsFilter}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-700 rounded-full text-sm flex items-center whitespace-nowrap">
                  <span>Interests {selectedInterests.length > 0 ? `(${selectedInterests.length})` : ''}</span>
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-4">
                <div className="mb-4">
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 block">Select Interests</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {interests.map((interest) => (
                      <Button
                        key={interest}
                        variant={selectedInterests.includes(interest) ? "default" : "outline"}
                        size="sm"
                        className="text-xs rounded-full"
                        onClick={() => toggleInterest(interest)}
                      >
                        {interest}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button 
                    size="sm"
                    onClick={() => setShowInterestsFilter(false)}
                  >
                    Apply
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="py-2">
            <Button 
              variant="outline" 
              size="sm"
              className="px-3 py-1.5 rounded-full border border-primary text-primary hover:bg-primary hover:text-white transition-colors text-sm flex items-center"
            >
              <SlidersHorizontal className="mr-1 h-4 w-4" /> More Filters
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FilterSection;
