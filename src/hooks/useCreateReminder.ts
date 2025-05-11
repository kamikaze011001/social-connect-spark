import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Interface for the data structure expected by the 'reminders' table
export interface NewReminderData {
  user_id: string;
  contact_id: string | null;
  date: string; // YYYY-MM-DD
  time: string | null; // HH:MM
  purpose: string;
  is_recurring: boolean;
  frequency: string | null;
  is_completed: boolean;
  send_email_notification: boolean;
}

// Props for the hook, if any are needed in the future (e.g., callbacks)
// interface UseCreateReminderProps {
//   onSuccessCallback?: () => void;
// }

export const useCreateReminder = (/* props?: UseCreateReminderProps */) => {
  const { user } = useAuth(); // Still needed if user_id is not part of reminderData passed to mutate
  const queryClient = useQueryClient();

  const createReminderMutation = useMutation({
    mutationFn: async (reminderData: Omit<NewReminderData, "user_id" | "is_completed">) => {
      if (!user) {
        toast.error("User not authenticated for mutation."); // Should ideally be caught before calling mutate
        throw new Error("User not authenticated");
      }
      
      const fullReminderData: NewReminderData = {
        ...reminderData,
        user_id: user.id,
        is_completed: false, // Default to false on creation
      };
      
      const { error } = await supabase
        .from("reminders")
        .insert(fullReminderData);
        
      if (error) {
        console.error("Supabase error creating reminder:", error);
        throw error; // Rethrow to be caught by onError
      }
      return fullReminderData; // Return the data that was inserted
    },
    onSuccess: (data, variables) => { // data is what mutationFn returns, variables is what mutate was called with
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      toast.success("Reminder created successfully!");
      
      // Note: Form reset logic is typically handled by the component calling the hook,
      // or by passing reset functions as props to the hook, or via onSuccess callback at mutate call site.
      // For this refactor, we'll assume the component handles its own form reset if needed after success.
      // The original ReminderForm had reset logic in its mutation's onSuccess.
      // If the hook needs to trigger a reset, it should be passed a reset function.
      // props?.onSuccessCallback?.();

      if (variables.send_email_notification) {
         toast.info("Email notification is scheduled.");
      }
    },
    onError: (error: Error) => {
      console.error("Error in createReminderMutation:", error);
      toast.error(error.message || "Failed to create reminder. Please try again.");
    },
  });

  return {
    createReminder: createReminderMutation.mutate,
    isCreatingReminder: createReminderMutation.isPending,
    // Optionally expose other mutation states: error, isSuccess, etc.
  };
};
