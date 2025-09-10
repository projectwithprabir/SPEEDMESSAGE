import { useState } from "react";
import { Search, MessageCircle, MoreVertical, LogOut, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useChats } from "@/hooks/useChats";
import UserSearch from "./UserSearch";

interface ChatListProps {
  onChatSelect: (chatId: string) => void;
  selectedChatId?: string;
  onProfileClick: () => void;
}

const ChatList = ({ onChatSelect, selectedChatId, onProfileClick }: ChatListProps) => {
  const { signOut } = useAuth();
  const { profile } = useProfile();
  const { chats, loading } = useChats();
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserSearch, setShowUserSearch] = useState(false);

  const filteredChats = chats.filter(chat =>
    chat.other_user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleChatCreated = (chatId: string) => {
    setShowUserSearch(false);
    onChatSelect(chatId);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);

    if (hours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (hours < 168) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (showUserSearch) {
    return (
      <UserSearch 
        onChatCreated={handleChatCreated}
        onClose={() => setShowUserSearch(false)}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-whatsapp-sidebar">
      {/* User Profile Header */}
      <div className="flex items-center justify-between p-4 bg-whatsapp-header">
        <div 
          className="flex items-center gap-3 cursor-pointer hover:bg-black/10 rounded-lg p-2 -m-2 transition-colors"
          onClick={onProfileClick}
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} />
            <AvatarFallback className="bg-whatsapp-accent text-white">
              {profile?.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="text-white">
            <p className="font-medium">{profile?.name || "User"}</p>
            <p className="text-xs opacity-80">{profile?.about || "Hey there! I am using FastMessage."}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white hover:bg-white/10" 
            onClick={() => setShowUserSearch(true)}
            title="Start new chat"
          >
            <UserPlus className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={signOut}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-3 bg-whatsapp-sidebar border-b border-border/20">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-input border-border/30 focus:ring-whatsapp-accent"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-muted-foreground">
            Loading chats...
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            {searchQuery ? "No chats found" : "No chats yet. Start a conversation!"}
          </div>
        ) : (
          filteredChats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => onChatSelect(chat.id)}
              className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors border-b border-border/20 ${
                selectedChatId === chat.id ? "bg-muted/70" : ""
              }`}
            >
              <Avatar className="h-12 w-12">
                <AvatarImage src={chat.other_user.avatar_url || "/placeholder.svg"} />
                <AvatarFallback className="bg-whatsapp-accent text-white">
                  {chat.other_user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-medium text-foreground truncate">
                    {chat.other_user.name}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {chat.last_message ? formatTimestamp(chat.last_message.created_at) : ""}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground truncate">
                    {chat.last_message ? 
                      chat.last_message.message_type === 'text' 
                        ? chat.last_message.content 
                        : chat.last_message.message_type === 'image' 
                        ? "📷 Photo" 
                        : chat.last_message.message_type === 'video'
                        ? "🎥 Video"
                        : "📎 File"
                      : "Start a conversation"
                    }
                  </p>
                  {chat.unread_count && chat.unread_count > 0 && (
                    <span className="bg-whatsapp-accent text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                      {chat.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatList;