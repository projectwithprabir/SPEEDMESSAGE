import { useState, useEffect } from "react";
import { Search, UserPlus, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useChats } from "@/hooks/useChats";

interface UserSearchProps {
  onChatCreated: (chatId: string) => void;
  onClose: () => void;
}

interface SearchUser {
  id: string;
  name: string;
  avatar_url?: string;
  about?: string;
}

const UserSearch = ({ onChatCreated, onClose }: UserSearchProps) => {
  const { user } = useAuth();
  const { createOrGetChat } = useChats();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState<string | null>(null);

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const searchUsers = async () => {
    if (!user || searchQuery.trim().length < 2) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, avatar_url, about')
        .neq('id', user.id) // Exclude current user
        .or(`name.ilike.%${searchQuery}%`)
        .limit(10);

      if (error) {
        console.error('Error searching users:', error);
        return;
      }

      setSearchResults(data || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async (selectedUser: SearchUser) => {
    if (!user || creating) return;

    setCreating(selectedUser.id);
    try {
      const chatId = await createOrGetChat(selectedUser.id);
      if (chatId) {
        onChatCreated(chatId);
        onClose();
      }
    } catch (error) {
      console.error('Error creating chat:', error);
    } finally {
      setCreating(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-whatsapp-sidebar">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-whatsapp-header">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-white hover:bg-white/10 p-2"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
        <h2 className="text-white font-medium flex-1">Start New Chat</h2>
      </div>

      {/* Search Input */}
      <div className="p-3 bg-whatsapp-sidebar border-b border-border/20">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by name to start chatting..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-input border-border/30 focus:ring-whatsapp-accent"
            autoFocus
          />
        </div>
      </div>

      {/* Search Results */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-muted-foreground">
            Searching users...
          </div>
        ) : searchQuery.trim().length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <UserPlus className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Type a name to search for users</p>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            No users found matching "{searchQuery}"
          </div>
        ) : (
          <div className="space-y-1">
            {searchResults.map((searchUser) => (
              <div
                key={searchUser.id}
                onClick={() => handleStartChat(searchUser)}
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors border-b border-border/20"
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={searchUser.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback className="bg-whatsapp-accent text-white">
                    {searchUser.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground truncate">
                    {searchUser.name}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {searchUser.about || "Hey there! I am using FastMessage."}
                  </p>
                </div>

                {creating === searchUser.id && (
                  <div className="w-5 h-5 border-2 border-whatsapp-accent border-t-transparent rounded-full animate-spin" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSearch;