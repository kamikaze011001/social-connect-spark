
import { useState } from "react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface ReminderActionsProps {
  reminderId: string;
}

export const ReminderActions = ({ reminderId }: ReminderActionsProps) => {
  const [isCompleting, setIsCompleting] = useState(false);
  const queryClient = useQueryClient();

  const completeReminderMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("reminders")
        .update({ is_completed: true })
        .eq("id", id);
      
      if (error) throw error;
    },
    onMutate: () => {
      setIsCompleting(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["upcoming-reminders"] });
      queryClient.invalidateQueries({ queryKey: ["reminder-stats"] });
      toast.success("Reminder marked as completed");
    },
    onError: (error) => {
      console.error("Error completing reminder:", error);
      toast.error("Failed to complete reminder");
    },
    onSettled: () => {
      setIsCompleting(false);
    }
  });

  const handleComplete = () => {
    completeReminderMutation.mutate(reminderId);
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="text-green-600 hover:text-green-700 hover:bg-green-50"
      onClick={handleComplete}
      disabled={isCompleting}
    >
      <CheckCircle className="h-4 w-4 mr-1" />
      Complete
    </Button>
  );
};

export default ReminderActions;
