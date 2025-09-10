import { Check, CheckCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface Message {
  id: string;
  sender_id: string;
  content?: string;
  media_url?: string;
  message_type: 'text' | 'image' | 'video';
  seen: boolean;
  created_at: string;
  sender?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble = ({ message }: MessageBubbleProps) => {
  const { user } = useAuth();
  const isSent = message.sender_id === user?.id;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderStatus = () => {
    if (!isSent) return null;
    
    if (message.seen) {
      return <CheckCheck className="h-3 w-3 text-blue-500" />;
    } else {
      return <CheckCheck className="h-3 w-3 text-gray-400" />;
    }
  };

  const renderContent = () => {
    if (message.message_type === 'text') {
      return <p className="text-sm">{message.content}</p>;
    } else if (message.message_type === 'image') {
      return (
        <div className="max-w-sm">
          <img 
            src={message.media_url} 
            alt="Shared image" 
            className="rounded-lg max-w-full h-auto"
            loading="lazy"
          />
          {message.content && <p className="text-sm mt-2">{message.content}</p>}
        </div>
      );
    } else if (message.message_type === 'video') {
      return (
        <div className="max-w-sm">
          <video 
            src={message.media_url} 
            controls 
            className="rounded-lg max-w-full h-auto"
          />
          {message.content && <p className="text-sm mt-2">{message.content}</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isSent
            ? 'bg-whatsapp-sent text-black rounded-br-none'
            : 'bg-white text-black rounded-bl-none'
        }`}
      >
        {renderContent()}
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className="text-xs text-gray-500">
            {formatTime(message.created_at)}
          </span>
          {renderStatus()}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;