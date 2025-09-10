import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "@/hooks/use-toast";

export interface Call {
  id: string;
  chat_id: string;
  caller_id: string;
  callee_id: string;
  type: 'audio' | 'video';
  offer?: any;
  answer?: any;
  status: 'pending' | 'accepted' | 'rejected' | 'ended';
  created_at: string;
  caller?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

export const useCalls = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [incomingCall, setIncomingCall] = useState<Call | null>(null);
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    if (!user) return;

    // Subscribe to incoming calls
    const channel = supabase
      .channel('calls')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'calls',
          filter: `callee_id=eq.${user.id}`
        },
        async (payload) => {
          const call = payload.new as any;
          
          // Fetch caller profile
          const { data: callerProfile } = await supabase
            .from('profiles')
            .select('id, name, avatar_url')
            .eq('id', call.caller_id)
            .single();

          setIncomingCall({
            ...call,
            caller: callerProfile
          });
          setIsCallModalOpen(true);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'calls'
        },
        (payload) => {
          const updatedCall = payload.new as any;
          
          if (activeCall && updatedCall.id === activeCall.id) {
            if (updatedCall.status === 'accepted' && updatedCall.answer && !remoteStream) {
              handleAnswerReceived(updatedCall.answer);
            } else if (updatedCall.status === 'rejected' || updatedCall.status === 'ended') {
              endCall();
            }
            setActiveCall(updatedCall);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activeCall, remoteStream]);

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('ICE candidate:', event.candidate);
      }
    };

    pc.ontrack = (event) => {
      console.log('Remote stream received');
      setRemoteStream(event.streams[0]);
    };

    peerConnection.current = pc;
    return pc;
  };

  const startCall = async (chatId: string, calleeId: string, type: 'audio' | 'video') => {
    if (!user) return;

    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video'
      });
      setLocalStream(stream);

      // Create peer connection
      const pc = createPeerConnection();
      
      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Save call to database
      const { data: call, error } = await supabase
        .from('calls')
        .insert({
          chat_id: chatId,
          caller_id: user.id,
          callee_id: calleeId,
          type,
          offer: offer as any,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      setActiveCall(call as Call);
      setIsCallModalOpen(true);

      toast({
        title: "Calling...",
        description: `Starting ${type} call`,
      });

    } catch (error) {
      console.error('Error starting call:', error);
      toast({
        title: "Call Failed",
        description: "Could not start the call",
        variant: "destructive",
      });
    }
  };

  const acceptCall = async () => {
    if (!incomingCall || !user) return;

    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: incomingCall.type === 'video'
      });
      setLocalStream(stream);

      // Create peer connection
      const pc = createPeerConnection();
      
      // Add local stream
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Set remote offer
      await pc.setRemoteDescription(incomingCall.offer);

      // Create answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Update call with answer
      const { error } = await supabase
        .from('calls')
        .update({
          answer: answer as any,
          status: 'accepted'
        })
        .eq('id', incomingCall.id);

      if (error) throw error;

      setActiveCall(incomingCall);
      setIncomingCall(null);

    } catch (error) {
      console.error('Error accepting call:', error);
      toast({
        title: "Error",
        description: "Could not accept the call",
        variant: "destructive",
      });
    }
  };

  const rejectCall = async () => {
    if (!incomingCall) return;

    try {
      await supabase
        .from('calls')
        .update({ status: 'rejected' })
        .eq('id', incomingCall.id);

      setIncomingCall(null);
      setIsCallModalOpen(false);

    } catch (error) {
      console.error('Error rejecting call:', error);
    }
  };

  const endCall = async () => {
    if (activeCall) {
      try {
        await supabase
          .from('calls')
          .update({ status: 'ended' })
          .eq('id', activeCall.id);
      } catch (error) {
        console.error('Error ending call:', error);
      }
    }

    // Clean up streams and peer connection
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    if (remoteStream) {
      setRemoteStream(null);
    }

    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    setActiveCall(null);
    setIncomingCall(null);
    setIsCallModalOpen(false);
  };

  const handleAnswerReceived = async (answer: any) => {
    if (peerConnection.current) {
      await peerConnection.current.setRemoteDescription(answer);
    }
  };

  return {
    incomingCall,
    activeCall,
    isCallModalOpen,
    localStream,
    remoteStream,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    setIsCallModalOpen
  };
};