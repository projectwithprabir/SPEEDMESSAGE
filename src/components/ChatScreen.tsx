import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Phone, Video, MoreVertical, Paperclip, Camera, Smile, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MessageBubble from "./MessageBubble";
import { useMessages } from "@/hooks/useMessages";
import { useChats } from "@/hooks/useChats";
import { useCalls } from "@/hooks/useCalls";
import { useToast } from "@/hooks/use-toast";
import CallModal from "./CallModal";


interface ChatScreenProps {
  chatId: string;
  onBack: () => void;
  isMobile?: boolean;
}

const ChatScreen = ({ chatId, onBack, isMobile = false }: ChatScreenProps) => {
  const { messages, loading, sendMessage, uploadMedia } = useMessages(chatId);
  const { chats } = useChats();
  const { startCall, isCallModalOpen, setIsCallModalOpen } = useCalls();
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentChat = chats.find(chat => chat.id === chatId);
  const contact = currentChat?.other_user;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const messageContent = newMessage;
    setNewMessage("");

    const result = await sendMessage(messageContent);
    if (!result.success) {
      toast({
        title: "Failed to send message",
        description: "Please try again",
        variant: "destructive"
      });
      setNewMessage(messageContent); // Restore message on failure
    }
    setSending(false);
  };

  const handleAudioCall = () => {
    if (contact?.id) {
      startCall(chatId, contact.id, 'audio');
    }
  };

  const handleVideoCall = () => {
    if (contact?.id) {
      startCall(chatId, contact.id, 'video');
    }
  };

  const handleMediaUpload = async (file: File, type: 'image' | 'video') => {
    setSending(true);
    
    const uploadResult = await uploadMedia(file, type);
    if (uploadResult.success && uploadResult.url) {
      const messageResult = await sendMessage('', type, uploadResult.url);
      if (!messageResult.success) {
        toast({
          title: "Failed to send media",
          description: "Please try again",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "Failed to upload media",
        description: "Please try again",
        variant: "destructive"
      });
    }
    
    setSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-whatsapp-chat-bg">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-whatsapp-header shadow-sm">
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
        
        <Avatar className="h-10 w-10">
          <AvatarImage src={contact?.avatar_url || "/placeholder.svg"} />
          <AvatarFallback className="bg-whatsapp-accent text-white">
            {contact?.name?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <h2 className="font-medium text-white">{contact?.name || "Unknown User"}</h2>
          <p className="text-xs text-white/80">online</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white hover:bg-white/10"
            onClick={handleAudioCall}
          >
            <Phone className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white hover:bg-white/10"
            onClick={handleVideoCall}
          >
            <Video className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="text-center text-muted-foreground">
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted-foreground">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-whatsapp-sidebar border-t border-border/20">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:bg-muted/50">
            <Smile className="h-5 w-5" />
          </Button>
          
          <div className="flex-1 flex items-center gap-2 bg-input rounded-full px-4 py-2">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="border-0 bg-transparent focus-visible:ring-0 p-0"
            />
            <label className="cursor-pointer">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:bg-muted/50">
                <Paperclip className="h-4 w-4" />
              </Button>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const isVideo = file.type.startsWith('video/');
                    handleMediaUpload(file, isVideo ? 'video' : 'image');
                  }
                }}
                className="hidden"
                disabled={sending}
              />
            </label>
            <label className="cursor-pointer">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:bg-muted/50">
                <Camera className="h-4 w-4" />
              </Button>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleMediaUpload(file, 'image');
                  }
                }}
                className="hidden"
                disabled={sending}
              />
            </label>
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            className="bg-whatsapp-accent hover:bg-whatsapp-accent/90 text-white rounded-full h-10 w-10 p-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Call Modal */}
      <CallModal 
        isOpen={isCallModalOpen} 
        onClose={() => setIsCallModalOpen(false)} 
      />
    </div>
  );
};

export default ChatScreen;