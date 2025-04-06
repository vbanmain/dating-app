import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { X } from "lucide-react";

const ProfileEdit = () => {
  const [, setRoute] = useLocation();
  const { toast } = useToast();
  const { user, updateUser, isUpdating } = useAuth();
  
  const [name, setName] = useState(user?.name || "");
  const [age, setAge] = useState(user?.age || 25);
  const [bio, setBio] = useState(user?.bio || "");
  const [location, setLocation] = useState(user?.location || "");
  const [gender, setGender] = useState(user?.gender || "");
  const [genderPreference, setGenderPreference] = useState(user?.genderPreference || "");
  const [ageRangeMin, setAgeRangeMin] = useState(user?.ageRangeMin || 18);
  const [ageRangeMax, setAgeRangeMax] = useState(user?.ageRangeMax || 50);
  const [maxDistance, setMaxDistance] = useState(user?.maxDistance || 25);
  const [photoUrls, setPhotoUrls] = useState<string[]>(user?.photoUrls as string[] || []);
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [interests, setInterests] = useState<string[]>(user?.interests as string[] || []);
  const [newInterest, setNewInterest] = useState("");

  // Common interests suggestions
  const interestSuggestions = [
    "Travel", "Photography", "Music", "Art", "Reading", "Writing", "Gaming", 
    "Cooking", "Fitness", "Yoga", "Hiking", "Dancing", "Movies", "Fashion"
  ];

  const handleUpdateProfile = async () => {
    try {
      await updateUser({
        name,
        age,
        bio,
        location,
        gender,
        genderPreference,
        ageRangeMin,
        ageRangeMax,
        maxDistance,
        photoUrls,
        interests
      });
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      
      setRoute("/profile");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const addPhotoUrl = () => {
    if (newPhotoUrl && !photoUrls.includes(newPhotoUrl)) {
      setPhotoUrls([...photoUrls, newPhotoUrl]);
      setNewPhotoUrl("");
    }
  };

  const removePhotoUrl = (url: string) => {
    setPhotoUrls(photoUrls.filter(photo => photo !== url));
  };

  const addInterest = () => {
    if (newInterest && !interests.includes(newInterest)) {
      setInterests([...interests, newInterest]);
      setNewInterest("");
    }
  };

  const removeInterest = (interest: string) => {
    setInterests(interests.filter(item => item !== interest));
  };

  const addSuggestedInterest = (interest: string) => {
    if (!interests.includes(interest)) {
      setInterests([...interests, interest]);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>
        
        <div className="space-y-6">
          {/* Basic Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Your full name"
                />
              </div>
              
              <div>
                <Label htmlFor="age">Age</Label>
                <Input 
                  id="age" 
                  type="number" 
                  value={age} 
                  onChange={(e) => setAge(parseInt(e.target.value))} 
                  min={18}
                  max={100}
                />
              </div>
              
              <div>
                <Label htmlFor="location">Location</Label>
                <Input 
                  id="location" 
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)} 
                  placeholder="Your city or location"
                />
              </div>
              
              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Non-binary">Non-binary</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          {/* Bio Card */}
          <Card>
            <CardHeader>
              <CardTitle>About Me</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea 
                value={bio} 
                onChange={(e) => setBio(e.target.value)} 
                placeholder="Tell others about yourself..."
                className="min-h-[150px]"
              />
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                {bio.length}/500 characters
              </p>
            </CardContent>
          </Card>
          
          {/* Photos Card */}
          <Card>
            <CardHeader>
              <CardTitle>Photos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label htmlFor="photo-url">Add Photo URL</Label>
                  <Input 
                    id="photo-url" 
                    value={newPhotoUrl} 
                    onChange={(e) => setNewPhotoUrl(e.target.value)} 
                    placeholder="https://example.com/your-photo.jpg"
                  />
                </div>
                <Button onClick={addPhotoUrl} type="button">Add Photo</Button>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                {photoUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square rounded-md overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                      <img src={url} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                    </div>
                    <Button 
                      variant="destructive" 
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removePhotoUrl(url)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              
              {photoUrls.length === 0 && (
                <div className="text-center p-4 border border-dashed rounded-md text-neutral-500 dark:text-neutral-400">
                  No photos added yet. Add some photos to increase your match chances!
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Interests Card */}
          <Card>
            <CardHeader>
              <CardTitle>Interests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label htmlFor="interest">Add Interest</Label>
                  <Input 
                    id="interest" 
                    value={newInterest} 
                    onChange={(e) => setNewInterest(e.target.value)} 
                    placeholder="Add an interest or hobby"
                  />
                </div>
                <Button onClick={addInterest} type="button">Add</Button>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-4">
                {interests.map((interest, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-1 px-3 py-1 bg-neutral-100 dark:bg-neutral-700 rounded-full"
                  >
                    <span className="text-sm">{interest}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-4 w-4 rounded-full"
                      onClick={() => removeInterest(interest)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              
              {interests.length === 0 && (
                <div className="text-center p-4 border border-dashed rounded-md text-neutral-500 dark:text-neutral-400">
                  No interests added yet. Add some interests to find better matches!
                </div>
              )}
              
              <Separator className="my-4" />
              
              <div>
                <Label className="mb-2 block">Suggested Interests</Label>
                <div className="flex flex-wrap gap-2">
                  {interestSuggestions.filter(suggestion => !interests.includes(suggestion)).map((suggestion, index) => (
                    <Button 
                      key={index} 
                      variant="outline" 
                      size="sm"
                      onClick={() => addSuggestedInterest(suggestion)}
                      className="rounded-full"
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Preferences Card */}
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="gender-preference">Looking For</Label>
                <Select value={genderPreference} onValueChange={setGenderPreference}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Men</SelectItem>
                    <SelectItem value="Female">Women</SelectItem>
                    <SelectItem value="Everyone">Everyone</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="mb-2 block">Age Range</Label>
                <div className="pt-6 px-2">
                  <Slider
                    value={[ageRangeMin, ageRangeMax]}
                    min={18}
                    max={100}
                    step={1}
                    onValueChange={(value) => {
                      setAgeRangeMin(value[0]);
                      setAgeRangeMax(value[1]);
                    }}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-sm font-medium">{ageRangeMin} years</span>
                  <span className="text-sm font-medium">{ageRangeMax} years</span>
                </div>
              </div>
              
              <div>
                <Label className="mb-2 block">Maximum Distance: {maxDistance} miles</Label>
                <div className="pt-2 px-2">
                  <Slider
                    value={[maxDistance]}
                    min={1}
                    max={100}
                    step={1}
                    onValueChange={(value) => setMaxDistance(value[0])}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Buttons */}
          <div className="flex justify-end gap-4">
            <Button 
              variant="outline" 
              onClick={() => setRoute("/profile")}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateProfile}
              disabled={isUpdating}
            >
              {isUpdating ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileEdit;
