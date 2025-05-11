
import { useState } from "react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area"; // Added
import ConversationForm from "../conversations/ConversationForm";
import { useAuth } from "@/contexts/AuthContext";
import { type ConversationType } from "../conversations/ConversationType"; // Assuming path

interface ReminderActionsProps {
  reminderId: string;
  contactId: string; // Added
  contactName?: string; // Added for ConversationForm's toast
  hasConversationForContact: boolean;
}

export const ReminderActions = ({ 
  reminderId, 
  contactId,
  contactName,
  hasConversationForContact 
}: ReminderActionsProps) => {
  console.log("ReminderActions props:", { reminderId, contactId, contactName, hasConversationForContact });
  const [isCompleting, setIsCompleting] = useState(false);
  const [isSavingConversation, setIsSavingConversation] = useState(false);
  const [isConversationModalOpen, setIsConversationModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();

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
      // Toast for reminder completion will be handled after conversation save if applicable
    },
    onError: (error) => {
      console.error("Error completing reminder:", error);
      toast.error("Failed to complete reminder");
    },
    onSettled: () => {
      setIsCompleting(false);
    }
  });

  const handleSaveConversationAndComplete = async (conversationData: ConversationType) => {
    console.log("handleSaveConversationAndComplete called. User:", user, "Data:", conversationData);
    if (!user) {
      toast.error("User not authenticated.");
      console.error("User not authenticated in handleSaveConversationAndComplete");
      return;
    }
    setIsSavingConversation(true);
    try {
      // Destructure to separate notes and ensure correct property names for DB
      const { notes, contactId: formContactId, ...coreConversationData } = conversationData;
      
      const conversationRecord = {
        ...coreConversationData, // id, date, medium, duration, summary
        user_id: user.id,
        contact_id: contactId, // This is the correct contact_id from the reminder's context
      };

      const { data: savedConversation, error: insertError } = await supabase
        .from("conversations")
        .insert(conversationRecord)
        .select()
        .single();

      if (insertError) throw insertError;

      let notesSavedSuccessfully = true;
      if (notes && notes.length > 0) {
        const noteRecords = notes.map(note => ({
          id: note.id, // Assuming NoteType from form provides a UUID
          content: note.content,
          timestamp: note.timestamp,
          conversation_id: savedConversation.id,
          // user_id is not in conversation_notes schema, RLS will handle user access via conversation_id
        }));

        const { error: notesError } = await supabase
          .from("conversation_notes")
          .insert(noteRecords);

        if (notesError) {
          notesSavedSuccessfully = false;
          console.error("Error saving notes:", notesError);
          toast.error("Conversation saved, but failed to save notes.");
          // We will still proceed to complete the reminder
        }
      }

      if (notesSavedSuccessfully) {
        toast.success(`Conversation with ${contactName || 'contact'} saved (with notes if any).`);
      }
      // else, the specific error for notes has already been toasted

      queryClient.invalidateQueries({ queryKey: ["all-conversations", user.id] });
      // Potentially invalidate queries for conversation notes if they are fetched separately
      // queryClient.invalidateQueries({ queryKey: ["conversation-notes", savedConversation.id] });
      queryClient.invalidateQueries({ queryKey: ["conversation-stats", user.id] });
      
      // Now complete the reminder
      completeReminderMutation.mutate(reminderId, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["upcoming-reminders"] });
          queryClient.invalidateQueries({ queryKey: ["reminder-stats"] });
          toast.success("Reminder marked as completed");
          setIsConversationModalOpen(false);
        }
      });

    } catch (error) {
      console.error("Error saving conversation:", error);
      toast.error("Failed to save conversation.");
    } finally {
      setIsSavingConversation(false);
    }
  };

  const handleCompleteClick = () => {
    console.log("handleCompleteClick called. hasConversationForContact:", hasConversationForContact);
    if (hasConversationForContact) {
      console.log("Calling completeReminderMutation directly for reminderId:", reminderId);
      completeReminderMutation.mutate(reminderId);
    } else {
      console.log("Opening conversation modal for contactId:", contactId);
      setIsConversationModalOpen(true);
    }
  };

  // Minimal contact prop for ConversationForm
  const formContacts = contactId && contactName ? [{ id: contactId, name: contactName, email: null, user_id: user?.id || "", created_at: "", updated_at: "" }] : [];


  return (
    <>
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-green-600 hover:text-green-700 hover:bg-green-50"
        onClick={handleCompleteClick}
        disabled={isCompleting || isSavingConversation}
      >
        <CheckCircle className="h-4 w-4 mr-1" />
        {isCompleting || isSavingConversation ? "Processing..." : "Complete"}
      </Button>

      <Dialog open={isConversationModalOpen} onOpenChange={setIsConversationModalOpen}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Add Conversation</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-grow overflow-y-auto pr-6"> {/* pr-6 for scrollbar space */}
            <ConversationForm
              contacts={formContacts} 
              initialContactId={contactId}
              onSave={handleSaveConversationAndComplete}
            />
          </ScrollArea>
          {/* ConversationForm has its own submit button, so DialogFooter might not be needed */}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReminderActions;
