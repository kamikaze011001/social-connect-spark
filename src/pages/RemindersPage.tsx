
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import ReminderForm from "@/components/reminders/ReminderForm";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Clock, Trash, Edit, CheckCircle, Bell, RefreshCw } from "lucide-react";
import { ContactType } from "@/components/contacts/ContactCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Define Reminder type
interface Reminder {
  id: string;
  contact_id: string | null;
  date: string;
  time: string | null;
  purpose: string;
  is_recurring: boolean | null;
  frequency: string | null;
  is_completed: boolean | null;
}

const RemindersPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("upcoming");
  const { user, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [checkingReminders, setCheckingReminders] = useState(false);

  // Fetch contacts
  const { data: contacts = [], isLoading: contactsLoading } = useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .order("name");
      
      if (error) {
        console.error("Error fetching contacts:", error);
        toast.error("Failed to load contacts");
        return [];
      }
      
      return data.map(contact => ({
        id: contact.id,
        name: contact.name,
        email: contact.email || "",
        phone: contact.phone || "",
        lastContacted: contact.last_contacted ? new Date(contact.last_contacted).toLocaleDateString() : null,
        imageUrl: contact.image_url || undefined,
      })) as ContactType[];
    },
    enabled: !!user,
  });

  // Fetch reminders
  const { data: reminders = [], isLoading: remindersLoading } = useQuery({
    queryKey: ["reminders"],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("reminders")
        .select("*")
        .order("date");
      
      if (error) {
        console.error("Error fetching reminders:", error);
        toast.error("Failed to load reminders");
        return [];
      }
      
      return data as Reminder[];
    },
    enabled: !!user,
  });

  // Update reminder completion status
  const updateReminderMutation = useMutation({
    mutationFn: async ({ id, is_completed }: { id: string; is_completed: boolean }) => {
      const { error } = await supabase
        .from("reminders")
        .update({ is_completed })
        .eq("id", id);
        
      if (error) throw error;
      return { id, is_completed };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      toast.success("Reminder updated");
    },
    onError: (error) => {
      console.error("Error updating reminder:", error);
      toast.error("Failed to update reminder");
    },
  });

  // Delete reminder
  const deleteReminderMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("reminders")
        .delete()
        .eq("id", id);
        
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      toast.success("Reminder deleted");
    },
    onError: (error) => {
      console.error("Error deleting reminder:", error);
      toast.error("Failed to delete reminder");
    },
  });

  // Check upcoming reminders manually
  const checkUpcomingReminders = async () => {
    if (!user) return;
    
    setCheckingReminders(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-upcoming-reminders');
      
      if (error) throw error;
      
      const processed = data.results?.filter(r => r.status === 'success').length || 0;
      
      if (processed > 0) {
        toast.success(`Sent ${processed} reminder notification(s)`);
      } else {
        toast.info("No upcoming reminders to send notifications for");
      }
      
    } catch (error) {
      console.error("Error checking reminders:", error);
      toast.error("Failed to check reminders");
    } finally {
      setCheckingReminders(false);
    }
  };

  useEffect(() => {
    if (isLoading) return;
    
    if (!user) {
      navigate("/auth");
    }
  }, [navigate, user, isLoading]);

  if (isLoading || contactsLoading || remindersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  const getContactById = (id: string | null) => {
    if (!id) return { id: "0", name: "No Contact", email: "" };
    const contact = contacts.find(contact => contact.id === id);
    return contact || { id: "0", name: "Unknown", email: "" };
  };

  const upcomingReminders = reminders.filter(r => !r.is_completed);
  const completedReminders = reminders.filter(r => r.is_completed);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  const toggleReminderCompletion = (reminder: Reminder) => {
    updateReminderMutation.mutate({
      id: reminder.id,
      is_completed: !reminder.is_completed,
    });
  };

  const deleteReminder = (id: string) => {
    if (confirm("Are you sure you want to delete this reminder?")) {
      deleteReminderMutation.mutate(id);
    }
  };

  const ReminderCard = ({ reminder }: { reminder: Reminder }) => {
    const contact = getContactById(reminder.contact_id);
    
    return (
      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-brand-300 text-white">
                  {contact.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium">{contact.name}</h3>
                <p className="text-sm text-muted-foreground">{reminder.purpose}</p>
                <div className="flex items-center mt-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>{formatDate(reminder.date)}</span>
                  {reminder.time && (
                    <>
                      <Clock className="h-3 w-3 ml-3 mr-1" />
                      <span>{reminder.time}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {reminder.is_recurring && (
                <Badge variant="outline">
                  {reminder.frequency?.charAt(0).toUpperCase() + reminder.frequency?.slice(1)}
                </Badge>
              )}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => toggleReminderCompletion(reminder)}
              >
                <CheckCircle className={`h-5 w-5 ${reminder.is_completed ? 'text-green-500' : 'text-gray-300'}`} />
              </Button>
              <Button variant="ghost" size="icon">
                <Edit className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => deleteReminder(reminder.id)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex min-h-screen">
      {!isMobile && (
        <div className="w-64 hidden md:block">
          <Sidebar />
        </div>
      )}
      <div className="flex-1">
        <Header userEmail={user.email} />
        <div className="container py-6">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold">Reminders</h1>
              <p className="text-muted-foreground">
                Never forget to stay in touch with your contacts
              </p>
            </div>
            <Button 
              variant="outline" 
              className="gap-2" 
              onClick={checkUpcomingReminders} 
              disabled={checkingReminders}
            >
              {checkingReminders ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4" />
                  Check Reminders
                </>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                <TabsList>
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>

                <TabsContent value="upcoming" className="animate-in">
                  {upcomingReminders.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-muted-foreground">No upcoming reminders</p>
                      <Button className="mt-4" onClick={() => setActiveTab("new")}>
                        Create a reminder
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Alert className="mb-4 bg-muted/50">
                        <Bell className="h-4 w-4" />
                        <AlertDescription>
                          Email notifications for upcoming reminders are sent automatically one day before the reminder date.
                        </AlertDescription>
                      </Alert>
                      {upcomingReminders.map(reminder => (
                        <ReminderCard key={reminder.id} reminder={reminder} />
                      ))}
                    </>
                  )}
                </TabsContent>

                <TabsContent value="completed" className="animate-in">
                  {completedReminders.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-muted-foreground">No completed reminders</p>
                    </div>
                  ) : (
                    completedReminders.map(reminder => (
                      <ReminderCard key={reminder.id} reminder={reminder} />
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>New Reminder</CardTitle>
                </CardHeader>
                <CardContent>
                  <ReminderForm contacts={contacts} />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RemindersPage;
