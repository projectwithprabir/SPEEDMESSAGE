-- Create calls table for WebRTC signaling
CREATE TABLE public.calls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID NOT NULL,
  caller_id UUID NOT NULL,
  callee_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('audio', 'video')),
  offer JSONB,
  answer JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'ended')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;

-- Create policies for calls
CREATE POLICY "Users can view calls they participate in" 
ON public.calls 
FOR SELECT 
USING ((auth.uid() = caller_id) OR (auth.uid() = callee_id));

CREATE POLICY "Users can create calls" 
ON public.calls 
FOR INSERT 
WITH CHECK (auth.uid() = caller_id);

CREATE POLICY "Users can update calls they participate in" 
ON public.calls 
FOR UPDATE 
USING ((auth.uid() = caller_id) OR (auth.uid() = callee_id));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_calls_updated_at
BEFORE UPDATE ON public.calls
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for calls table
ALTER PUBLICATION supabase_realtime ADD TABLE public.calls;