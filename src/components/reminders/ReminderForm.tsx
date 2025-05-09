
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ContactType } from "../contacts/ContactCard";
import { Calendar as CalendarIcon, Clock, Gift, Bell } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ReminderFormProps {
  contacts: ContactType[];
}

const ReminderForm = ({ contacts }: ReminderFormProps) => {
  const [activeTab, setActiveTab] = useState<string>("standard");
  const [selectedContact, setSelectedContact] = useState<string>("none");
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState<string>("");
  const [purpose, setPurpose] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState("weekly");
  const [sendNotification, setSendNotification] = useState(true);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Special date specific fields
  const [specialDateType, setSpecialDateType] = useState<string>("birthday");
  const [notifyInAdvance, setNotifyInAdvance] = useState<string>("7");
  
  const createReminderMutation = useMutation({
    mutationFn: async (reminderData: any) => {
      const { error } = await supabase
        .from("reminders")
        .insert(reminderData);
        
      if (error) throw error;
      return reminderData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      toast.success("Reminder created");
      
      // Reset form
      setSelectedContact("none");
      setDate(undefined);
      setTime("");
      setPurpose("");
      setIsRecurring(false);
      setRecurringFrequency("weekly");
      setSpecialDateType("birthday");
      setNotifyInAdvance("7");
      setSendNotification(true);
    },
    onError: (error: any) => {
      console.error("Error creating reminder:", error);
      toast.error("Failed to create reminder");
    },
  });
  
  // Fetch special dates for selected contact
  const getSpecialDates = async (contactId: string) => {
    if (!contactId || contactId === "none") return [];
    
    try {
      const { data, error } = await supabase
        .from("special_dates")
        .select("*")
        .eq("contact_id", contactId);
        
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error("Error fetching special dates:", error);
      return [];
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("You must be logged in to create a reminder");
      return;
    }
    
    if (!date && !isRecurring) {
      toast.error("Please select a date");
      return;
    }
    
    // Format date to YYYY-MM-DD
    const formattedDate = date ? format(date, "yyyy-MM-dd") : new Date().toISOString().split("T")[0];
    
    const reminderData = {
      user_id: user.id,
      contact_id: selectedContact !== "none" ? selectedContact : null,
      date: formattedDate,
      time: time || null,
      purpose,
      is_recurring: isRecurring,
      frequency: isRecurring ? recurringFrequency : null,
      is_completed: false
    };
    
    createReminderMutation.mutate(reminderData);
    
    // If notification is enabled, we'll show a success message
    // The actual notification will be handled by our scheduled task
    if (sendNotification) {
      toast.success("Email notification will be sent before the reminder");
    }
  };

  // Find any special dates for the selected contact
  const selectedContactData = selectedContact && selectedContact !== "none" ? 
    contacts.find(c => c.id === selectedContact) : null;
    
  // Placeholder for special dates - in a real app, these would be fetched from the database
  const specialDates = selectedContactData?.specialDates || [];

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
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="standard">Standard Reminder</TabsTrigger>
            <TabsTrigger value="special">Special Date</TabsTrigger>
          </TabsList>
          
          <TabsContent value="standard" className="space-y-4 pt-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="recurring">Recurring Reminder</Label>
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
                  <Label htmlFor="time">Time (optional)</Label>
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
              <div className="flex items-center justify-between">
                <Label htmlFor="notification" className="flex items-center gap-2">
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
                  You'll receive an email notification the day before your reminder
                </p>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="special" className="space-y-4 pt-2">
            {selectedContact && selectedContact !== "none" && specialDates.length > 0 ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="specialDate">Existing Special Dates</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a special date" />
                    </SelectTrigger>
                    <SelectContent>
                      {specialDates.map((date, index) => (
                        <SelectItem key={index} value={`${index}`}>
                          {date.type}: {new Date(date.date).toLocaleDateString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Or set a reminder for a new special date below
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-md bg-muted p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Gift className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium">No special dates found</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Add special dates like birthdays, anniversaries, etc. when editing contacts.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="specialDateType">Type</Label>
              <Select value={specialDateType} onValueChange={setSpecialDateType}>
                <SelectTrigger id="specialDateType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="birthday">Birthday</SelectItem>
                  <SelectItem value="anniversary">Anniversary</SelectItem>
                  <SelectItem value="important_date">Important Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notifyInAdvance">Notify in advance</Label>
              <Select value={notifyInAdvance} onValueChange={setNotifyInAdvance}>
                <SelectTrigger id="notifyInAdvance">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">On the day</SelectItem>
                  <SelectItem value="1">1 day before</SelectItem>
                  <SelectItem value="3">3 days before</SelectItem>
                  <SelectItem value="7">1 week before</SelectItem>
                  <SelectItem value="14">2 weeks before</SelectItem>
                  <SelectItem value="30">1 month before</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="notification-special" className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Send Email Notification
                </Label>
                <Switch 
                  id="notification-special" 
                  checked={sendNotification} 
                  onCheckedChange={setSendNotification} 
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
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
            Email notifications will be sent the day before the reminder date. Make sure your email address is up to date in your profile.
          </AlertDescription>
        </Alert>
        
        <Button type="submit" className="w-full" disabled={
          !purpose || 
          (activeTab === "standard" && !isRecurring && !date) ||
          createReminderMutation.isPending
        }>
          {createReminderMutation.isPending ? "Setting reminder..." : "Set Reminder"}
        </Button>
      </div>
    </form>
  );
};

export default ReminderForm;
