import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ContactType } from "../contacts/ContactCard";
// Removed Tables import as fetchedSpecialDates is removed
import { Calendar as CalendarIcon, Clock, Bell, Info } from "lucide-react"; // Removed Gift
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns"; // Removed subDays
import { toast } from "sonner";
// Removed Tabs related imports: Tabs, TabsContent, TabsList, TabsTrigger
// import { supabase } from "@/integrations/supabase/client"; // No longer directly used
import { useAuth } from "@/contexts/AuthContext";
// import { useMutation, useQueryClient } from "@tanstack/react-query"; // No longer directly used
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useCreateReminder, NewReminderData } from "@/hooks/useCreateReminder"; // Corrected path

interface ReminderFormProps {
  contacts: ContactType[];
}

// NewReminderData interface is now imported from the hook

const ReminderForm = ({ contacts }: ReminderFormProps) => {
  // Removed activeTab state
  const [selectedContact, setSelectedContact] = useState<string>("none");
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState<string>("");
  const [purpose, setPurpose] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState("weekly");
  const [sendNotification, setSendNotification] = useState(true);
  const { user } = useAuth(); // Still needed for user check and potentially passing user_id if hook didn't handle it
  
  const { createReminder, isCreatingReminder } = useCreateReminder();
  
  // Removed special date specific fields:
  // specialDateType, notifyInAdvance, fetchedSpecialDates, selectedSpecialDateIndex
  
  // createReminderMutation is now in useCreateReminder hook
  
  // Removed getSpecialDates function
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("You must be logged in to create a reminder");
      return;
    }

    const finalDateToUse: Date = date || new Date(); // Fallback for recurring without a specific start date

    // Simplified handleSubmit logic, removed "special" tab handling
    if (!date && !isRecurring) {
      toast.error("Please select a date for a standard reminder.");
      return;
    }
    // finalDateToUse is now assigned above
    
    // Format date to YYYY-MM-DD
    const formattedDate = format(finalDateToUse, "yyyy-MM-dd");
    
    // Prepare data for the hook, omitting user_id and is_completed as the hook handles them
    const reminderDataForHook: Omit<NewReminderData, "user_id" | "is_completed"> = {
      contact_id: selectedContact !== "none" ? selectedContact : null,
      date: formattedDate,
      time: time || null,
      purpose,
      is_recurring: isRecurring,
      frequency: isRecurring ? recurringFrequency : null,
      send_email_notification: sendNotification,
    };
    
    createReminder(reminderDataForHook, {
      onSuccess: () => {
        // Reset form fields locally after successful creation by the hook
        setSelectedContact("none");
        setDate(undefined);
        setTime("");
        setPurpose("");
        setIsRecurring(false);
        setRecurringFrequency("weekly");
        setSendNotification(true);
        // The hook's onSuccess already handles toast.success("Reminder created successfully!")
        // and query invalidation.
        // The hook's onSuccess also handles the toast.info for email notification.
      },
      // onError is handled by the hook's own onError
    });
  };

  // Removed selectedContactData (was used for special dates)
    
  // Removed useEffect hook that fetched special dates

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="contact">Contact</Label>
          <Select value={selectedContact} onValueChange={setSelectedContact}>
            <SelectTrigger>
              <SelectValue placeholder="Select a contact" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No specific contact</SelectItem>
              {contacts.map(contact => (
                <SelectItem key={contact.id} value={contact.id}>
                  {contact.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Tabs removed, directly showing standard reminder fields */}
        <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Label htmlFor="recurring" className="mb-1 sm:mb-0">Recurring Reminder</Label>
                <Switch 
                  id="recurring" 
                  checked={isRecurring} 
                  onCheckedChange={setIsRecurring} 
                />
              </div>
            </div>
            
            {isRecurring ? (
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select value={recurringFrequency} onValueChange={setRecurringFrequency}>
                  <SelectTrigger id="frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : "Select a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-1">
                    <Label htmlFor="time">Time (optional)</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Setting a time helps specify when the event occurs. <br />Notifications are sent the day before the reminder's date, <br />regardless of whether a time is set.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Label htmlFor="notification" className="flex items-center gap-2 mb-1 sm:mb-0">
                  <Bell className="h-4 w-4" />
                  Send Email Notification
                </Label>
                <Switch 
                  id="notification" 
                  checked={sendNotification} 
                  onCheckedChange={setSendNotification} 
                />
              </div>
              {sendNotification && (
                <p className="text-xs text-muted-foreground">
                  An email notification will be sent the day before your reminder's date. If you set a time, it will be mentioned in the email.
                </p>
              )}
            </div>
        </div> {/* This closes the div that replaced TabsContent value="standard" */}
        
        <div className="space-y-2">
          <Label htmlFor="purpose">Purpose</Label>
          <Textarea
            id="purpose"
            placeholder="What's this reminder for?"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className="min-h-[100px]"
          />
        </div>

        <Alert className="bg-muted/50 border-brand-200">
          <Bell className="h-4 w-4" />
          <AlertTitle>About Email Notifications</AlertTitle>
          <AlertDescription>
            Email notifications will be sent the day before the reminder date. Make sure your email address is up to date in your profile. This applies whether or not a specific time is set for the reminder.
          </AlertDescription>
        </Alert>
        
        <Button type="submit" className="w-full" disabled={
          !purpose ||
          (!isRecurring && !date) || // Simplified disabled condition
          isCreatingReminder
        }>
          {isCreatingReminder ? "Setting reminder..." : "Set Reminder"}
        </Button>
      </div>
    </form>
  );
};

export default ReminderForm;
