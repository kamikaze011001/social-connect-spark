
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ContactActionsProps {
  contactId: string;
  contactName: string;
}

export const ContactActions = ({ contactId, contactName }: ContactActionsProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();

  const createReminderMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
      // Get tomorrow's date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const { error } = await supabase
        .from("reminders")
        .insert({
          user_id: user.id,
          contact_id: contactId,
          purpose: "Follow-up",
          date: tomorrow.toISOString().split('T')[0],
          is_completed: false
        });
      
      if (error) throw error;
    },
    onMutate: () => {
      setIsCreating(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["upcoming-reminders"] });
      queryClient.invalidateQueries({ queryKey: ["reminder-stats"] });
      toast.success(`Reminder created for ${contactName}`);
    },
    onError: (error) => {
      console.error("Error creating reminder:", error);
      toast.error("Failed to create reminder");
    },
    onSettled: () => {
      setIsCreating(false);
    }
  });

  const handleReachOut = () => {
    createReminderMutation.mutate();
  };

  return (
    <Button 
      size="sm" 
      variant="outline" 
      onClick={handleReachOut}
      disabled={isCreating}
    >
      {isCreating ? "Creating..." : "Reach Out"}
    </Button>
  );
};

export default ContactActions;
