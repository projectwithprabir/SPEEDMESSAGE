import { useEffect, useRef } from "react";
import { X, Phone, PhoneOff, Video, VideoOff, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useCalls } from "@/hooks/useCalls";

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CallModal = ({ isOpen, onClose }: CallModalProps) => {
  const {
    incomingCall,
    activeCall,
    localStream,
    remoteStream,
    acceptCall,
    rejectCall,
    endCall
  } = useCalls();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const handleEndCall = () => {
    endCall();
    onClose();
  };

  const isVideoCall = incomingCall?.type === 'video' || activeCall?.type === 'video';
  const displayCall = incomingCall || activeCall;

  if (!displayCall) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] p-0 overflow-hidden bg-black">
        <div className="relative w-full h-full flex flex-col">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/70 to-transparent">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={displayCall.caller?.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback className="bg-whatsapp-accent text-white">
                    {displayCall.caller?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{displayCall.caller?.name || "Unknown"}</p>
                  <p className="text-sm text-white/80">
                    {incomingCall 
                      ? `Incoming ${displayCall.type} call...` 
                      : activeCall?.status === 'accepted' 
                      ? "Connected" 
                      : "Calling..."}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEndCall}
                className="text-white hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Video Area */}
          <div className="flex-1 relative">
            {isVideoCall ? (
              <>
                {/* Remote Video */}
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                
                {/* Local Video */}
                <div className="absolute bottom-4 right-4 w-32 h-24 bg-black rounded-lg overflow-hidden border-2 border-white/20">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                </div>
              </>
            ) : (
              /* Audio Call UI */
              <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-whatsapp-primary to-whatsapp-accent">
                <div className="text-center text-white">
                  <Avatar className="h-32 w-32 mx-auto mb-4">
                    <AvatarImage src={displayCall.caller?.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback className="bg-white/20 text-white text-4xl">
                      {displayCall.caller?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-2xl font-semibold mb-2">{displayCall.caller?.name || "Unknown"}</h2>
                  <p className="text-white/80">
                    {incomingCall 
                      ? "Incoming audio call..." 
                      : activeCall?.status === 'accepted' 
                      ? "Connected" 
                      : "Calling..."}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Call Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent">
            <div className="flex justify-center gap-4">
              {incomingCall ? (
                /* Incoming Call Controls */
                <>
                  <Button
                    size="lg"
                    onClick={rejectCall}
                    className="bg-red-500 hover:bg-red-600 text-white rounded-full w-16 h-16 p-0"
                  >
                    <PhoneOff className="h-6 w-6" />
                  </Button>
                  <Button
                    size="lg"
                    onClick={acceptCall}
                    className="bg-green-500 hover:bg-green-600 text-white rounded-full w-16 h-16 p-0"
                  >
                    <Phone className="h-6 w-6" />
                  </Button>
                </>
              ) : (
                /* Active Call Controls */
                <>
                  <Button
                    variant="ghost"
                    size="lg"
                    className="text-white hover:bg-white/10 rounded-full w-12 h-12 p-0"
                  >
                    <Mic className="h-5 w-5" />
                  </Button>
                  {isVideoCall && (
                    <Button
                      variant="ghost"
                      size="lg"
                      className="text-white hover:bg-white/10 rounded-full w-12 h-12 p-0"
                    >
                      <Video className="h-5 w-5" />
                    </Button>
                  )}
                  <Button
                    size="lg"
                    onClick={handleEndCall}
                    className="bg-red-500 hover:bg-red-600 text-white rounded-full w-16 h-16 p-0"
                  >
                    <PhoneOff className="h-6 w-6" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CallModal;