import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Message {
  id: string;
  chat_id: string;
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

export const useMessages = (chatId: string | null) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (chatId && user) {
      fetchMessages();
      subscribeToMessages();
      markMessagesAsSeen();
    }
  }, [chatId, user]);

  const fetchMessages = async () => {
    if (!chatId) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(id, name, avatar_url)
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    if (!chatId) return;

    const channel = supabase
      .channel(`messages-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        () => {
          fetchMessages();
          markMessagesAsSeen();
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  const markMessagesAsSeen = async () => {
    if (!chatId || !user) return;

    try {
      await supabase
        .from('messages')
        .update({ seen: true })
        .eq('chat_id', chatId)
        .neq('sender_id', user.id)
        .eq('seen', false);
    } catch (error) {
      console.error('Error marking messages as seen:', error);
    }
  };

  const sendMessage = async (content: string, messageType: 'text' | 'image' | 'video' = 'text', mediaUrl?: string) => {
    if (!chatId || !user) return { success: false };

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: user.id,
          content: messageType === 'text' ? content : null,
          media_url: mediaUrl,
          message_type: messageType
        });

      if (error) {
        console.error('Error sending message:', error);
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      console.error('Error:', error);
      return { success: false, error };
    }
  };

  const uploadMedia = async (file: File, messageType: 'image' | 'video') => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('chat-media')
        .getPublicUrl(fileName);

      return { success: true, url: data.publicUrl };
    } catch (error) {
      console.error('Error uploading media:', error);
      return { success: false, error };
    }
  };

  return {
    messages,
    loading,
    sendMessage,
    uploadMedia,
    refetch: fetchMessages
  };
};