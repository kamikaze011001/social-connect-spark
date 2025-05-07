
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
import { Calendar, Clock, Trash, Edit } from "lucide-react";
import { ContactType } from "@/components/contacts/ContactCard";

// Sample data for reminders
const sampleContacts: ContactType[] = [
  {
    id: "1",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    phone: "+1 (555) 123-4567",
    lastContacted: "3 days ago",
    groups: ["Friends", "Work"],
  },
  {
    id: "2",
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 987-6543",
    lastContacted: "1 week ago",
    groups: ["Family"],
  },
  {
    id: "3",
    name: "Alex Johnson",
    email: "alex@example.com",
    phone: "+1 (555) 555-5555",
    lastContacted: "2 weeks ago",
    groups: ["Friends"],
  },
];

const reminders = [
  { 
    id: "1", 
    contactId: "1", 
    date: "2025-05-08", 
    time: "10:00", 
    purpose: "Catch up call",
    isRecurring: false,
    isCompleted: false,
  },
  { 
    id: "2", 
    contactId: "2", 
    date: "2025-05-10", 
    purpose: "Birthday wishes",
    isRecurring: true,
    frequency: "yearly",
    isCompleted: false,
  },
  { 
    id: "3", 
    contactId: "3", 
    date: "2025-05-15", 
    time: "14:30", 
    purpose: "Follow-up on project",
    isRecurring: false,
    isCompleted: false,
  },
  { 
    id: "4", 
    contactId: "1", 
    date: "2025-04-30", 
    time: "09:00", 
    purpose: "Quarterly check-in",
    isRecurring: true,
    frequency: "quarterly",
    isCompleted: true,
  },
];

const RemindersPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("upcoming");

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/auth");
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

  if (!user) {
    return null; // Don't render anything until we've checked auth status
  }

  const getContactById = (id: string) => {
    return sampleContacts.find(contact => contact.id === id) || {
      id: "0",
      name: "Unknown",
      email: "unknown@example.com",
    };
  };

  const upcomingReminders = reminders.filter(r => !r.isCompleted);
  const completedReminders = reminders.filter(r => r.isCompleted);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const ReminderCard = ({ reminder }: { reminder: typeof reminders[0] }) => {
    const contact = getContactById(reminder.contactId);
    
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
              {reminder.isRecurring && (
                <Badge variant="outline">
                  {reminder.frequency?.charAt(0).toUpperCase() + reminder.frequency?.slice(1)}
                </Badge>
              )}
              <Button variant="ghost" size="icon">
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
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
          <div className="mb-6">
            <h1 className="text-2xl font-semibold">Reminders</h1>
            <p className="text-muted-foreground">
              Never forget to stay in touch with your contacts
            </p>
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
                    upcomingReminders.map(reminder => (
                      <ReminderCard key={reminder.id} reminder={reminder} />
                    ))
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
                  <ReminderForm contacts={sampleContacts} />
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
