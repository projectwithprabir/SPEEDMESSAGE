import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ChatList from "@/components/ChatList";
import ChatScreen from "@/components/ChatScreen";
import ProfileSection from "@/components/ProfileSection";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

type View = "chats" | "chat" | "profile";

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<View>("chats");
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    // Reset to chats view when switching to mobile
    if (isMobile && currentView === "chat" && !selectedChatId) {
      setCurrentView("chats");
    }
  }, [isMobile, currentView, selectedChatId]);

  const handleChatSelect = (chatId: string) => {
    setSelectedChatId(chatId);
    if (isMobile) {
      setCurrentView("chat");
    }
  };

  const handleBackToChats = () => {
    setCurrentView("chats");
    setSelectedChatId(null);
  };

  const handleProfileClick = () => {
    setCurrentView("profile");
  };

  if (loading) {
    return (
      <div className="h-screen bg-whatsapp-chat-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-whatsapp-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="h-8 w-8 text-white" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen bg-whatsapp-chat-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-whatsapp-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-light text-muted-foreground mb-4">
            Welcome to FastMessage
          </h2>
          <Button onClick={() => navigate('/auth')} className="bg-whatsapp-primary hover:bg-whatsapp-primary/90">
            Get Started
          </Button>
        </div>
      </div>
    );
  }

  if (isMobile) {
    // Mobile Layout - Single Screen
    return (
      <div className="h-screen bg-whatsapp-chat-bg">
        {currentView === "chats" && (
          <ChatList
            onChatSelect={handleChatSelect}
            selectedChatId={selectedChatId}
            onProfileClick={handleProfileClick}
          />
        )}
        
        {currentView === "chat" && selectedChatId && (
          <ChatScreen
            chatId={selectedChatId}
            onBack={handleBackToChats}
            isMobile={true}
          />
        )}
        
        {currentView === "profile" && (
          <ProfileSection
            onBack={handleBackToChats}
            isMobile={true}
          />
        )}
      </div>
    );
  }

  // Desktop Layout - Sidebar + Main Content
  return (
    <div className="h-screen flex bg-whatsapp-chat-bg">
      {/* Left Sidebar */}
      <div className="w-80 border-r border-border/20">
        <ChatList
          onChatSelect={handleChatSelect}
          selectedChatId={selectedChatId}
          onProfileClick={handleProfileClick}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1">
        {currentView === "profile" ? (
          <ProfileSection
            onBack={() => setCurrentView("chats")}
            isMobile={false}
          />
        ) : selectedChatId ? (
          <ChatScreen
            chatId={selectedChatId}
            onBack={handleBackToChats}
            isMobile={false}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-whatsapp-chat-bg">
            <div className="text-center">
              <div className="w-64 h-64 mx-auto mb-8 bg-whatsapp-primary/10 rounded-full flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  width="120"
                  height="120"
                  className="text-whatsapp-primary/40 fill-current"
                >
                  <path d="M12,2A10,10 0 0,0 2,12A9.89,9.89 0 0,0 2.26,14.33L2,22L9.67,21.74C11.1,21.9 11.84,22 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20C11.72,20 10.64,19.89 9.31,19.64L8.33,19.47L5.57,20.14L6.24,17.38L6.07,16.4C5.82,15.07 5.71,14 5.71,12A8,8 0 0,1 12,4M8.5,7.5A1,1 0 0,0 7.5,8.5V15.5A1,1 0 0,0 8.5,16.5H15.5A1,1 0 0,0 16.5,15.5V8.5A1,1 0 0,0 15.5,7.5H8.5Z" />
                </svg>
              </div>
              <h2 className="text-2xl font-light text-muted-foreground mb-2">
                WhatsApp Web
              </h2>
              <p className="text-muted-foreground max-w-md">
                Send and receive messages without keeping your phone online.<br />
                Use WhatsApp on up to 4 linked devices and 1 phone at the same time.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
