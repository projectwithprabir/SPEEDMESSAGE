import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Chat {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  updated_at: string;
  other_user: {
    id: string;
    name: string;
    avatar_url?: string;
    about?: string;
    last_seen?: string;
  };
  last_message?: {
    content?: string;
    media_url?: string;
    message_type: string;
    created_at: string;
    sender_id: string;
  };
  unread_count?: number;
}

export const useChats = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchChats();
      subscribeToChats();
    }
  }, [user]);

  const fetchChats = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chats')
        .select(`
          *,
          user1:profiles!chats_user1_id_fkey(id, name, avatar_url, about, last_seen),
          user2:profiles!chats_user2_id_fkey(id, name, avatar_url, about, last_seen),
          messages(content, media_url, message_type, created_at, sender_id, seen)
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching chats:', error);
        return;
      }

      const processedChats = data.map((chat: any) => {
        const otherUser = chat.user1_id === user.id ? chat.user2 : chat.user1;
        const lastMessage = chat.messages?.[chat.messages.length - 1];
        const unreadCount = chat.messages?.filter((msg: any) => 
          msg.sender_id !== user.id && !msg.seen
        ).length || 0;

        return {
          ...chat,
          other_user: otherUser,
          last_message: lastMessage,
          unread_count: unreadCount
        };
      });

      setChats(processedChats);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToChats = () => {
    if (!user) return;

    const channel = supabase
      .channel('chats-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats',
          filter: `user1_id=eq.${user.id}`
        },
        () => fetchChats()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats',
          filter: `user2_id=eq.${user.id}`
        },
        () => fetchChats()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        () => fetchChats()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  const createOrGetChat = async (otherUserId: string) => {
    if (!user) return null;

    try {
      // First, try to find existing chat
      const { data: existingChat, error: fetchError } = await supabase
        .from('chats')
        .select('*')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${user.id})`)
        .single();

      if (existingChat) {
        return existingChat.id;
      }

      // Create new chat if it doesn't exist
      const { data: newChat, error: createError } = await supabase
        .from('chats')
        .insert({
          user1_id: user.id,
          user2_id: otherUserId
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating chat:', createError);
        return null;
      }

      return newChat.id;
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  };

  return {
    chats,
    loading,
    createOrGetChat,
    refetch: fetchChats
  };
};