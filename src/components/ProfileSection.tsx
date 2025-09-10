import { useState } from "react";
import { ArrowLeft, Camera, Edit3, Check, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface ProfileSectionProps {
  onBack: () => void;
  isMobile?: boolean;
}

const ProfileSection = ({ onBack, isMobile = false }: ProfileSectionProps) => {
  const { user } = useAuth();
  const { profile, updateProfile, uploadAvatar } = useProfile();
  const { toast } = useToast();
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [tempName, setTempName] = useState(profile?.name || "");
  const [tempAbout, setTempAbout] = useState(profile?.about || "");
  const [uploading, setUploading] = useState(false);

  const handleNameSave = async () => {
    const result = await updateProfile({ name: tempName });
    if (result?.success) {
      setIsEditingName(false);
      toast({ title: "Name updated successfully" });
    } else {
      toast({ title: "Failed to update name", variant: "destructive" });
    }
  };

  const handleAboutSave = async () => {
    const result = await updateProfile({ about: tempAbout });
    if (result?.success) {
      setIsEditingAbout(false);
      toast({ title: "About updated successfully" });
    } else {
      toast({ title: "Failed to update about", variant: "destructive" });
    }
  };

  const handleNameCancel = () => {
    setTempName(profile?.name || "");
    setIsEditingName(false);
  };

  const handleAboutCancel = () => {
    setTempAbout(profile?.about || "");
    setIsEditingAbout(false);
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploading(true);
      const result = await uploadAvatar(file);
      if (result?.success) {
        toast({ title: "Avatar updated successfully" });
      } else {
        toast({ title: "Failed to upload avatar", variant: "destructive" });
      }
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-whatsapp-sidebar">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 bg-whatsapp-header">
        {isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-white hover:bg-white/10 p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <h1 className="text-lg font-medium text-white">Profile</h1>
      </div>

      {/* Profile Content */}
      <div className="flex-1 p-6 space-y-8">
        {/* Avatar Section */}
        <div className="text-center">
          <div className="relative inline-block">
            <Avatar className="h-32 w-32 mx-auto">
              <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} />
              <AvatarFallback className="bg-whatsapp-accent text-white text-4xl">
                {profile?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            
            <label className={`absolute bottom-0 right-0 bg-whatsapp-accent hover:bg-whatsapp-accent/90 text-white rounded-full p-2 cursor-pointer transition-colors ${
              uploading ? "opacity-50" : ""
            }`}>
              <Camera className="h-4 w-4" />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>
        </div>

        {/* Name Section */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Name</label>
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="flex-1"
                autoFocus
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNameSave}
                className="text-whatsapp-accent hover:bg-whatsapp-accent/10"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNameCancel}
                className="text-destructive hover:bg-destructive/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div 
              className="flex items-center justify-between p-3 bg-input rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setIsEditingName(true)}
            >
              <span className="text-foreground">{profile?.name || "User"}</span>
              <Edit3 className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* About Section */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">About</label>
          {isEditingAbout ? (
            <div className="space-y-2">
              <Textarea
                value={tempAbout}
                onChange={(e) => setTempAbout(e.target.value)}
                className="resize-none"
                rows={3}
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAboutCancel}
                  className="text-destructive hover:bg-destructive/10"
                >
                  Cancel
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAboutSave}
                  className="text-whatsapp-accent hover:bg-whatsapp-accent/10"
                >
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <div 
              className="p-3 bg-input rounded-lg cursor-pointer hover:bg-muted/50 transition-colors min-h-[80px] flex items-center justify-between"
              onClick={() => setIsEditingAbout(true)}
            >
              <span className="text-foreground">{profile?.about || "Hey there! I am using FastMessage."}</span>
              <Edit3 className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Additional Profile Info */}
        <div className="space-y-4 pt-4 border-t border-border/20">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Email</label>
            <div className="p-3 bg-input rounded-lg">
              <span className="text-foreground">{user?.email || "No email"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSection;