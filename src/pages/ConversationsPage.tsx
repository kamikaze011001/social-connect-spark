
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Search, Plus, Calendar } from "lucide-react";
import { ContactType } from "@/components/contacts/ContactCard";
import { ConversationType, ConversationWithContactType } from "@/components/conversations/ConversationType";
import ConversationForm from "@/components/conversations/ConversationForm";
import ConversationCard from "@/components/conversations/ConversationCard";
import { toast } from "sonner";

// Sample data for demonstration
const SAMPLE_CONTACTS: ContactType[] = [
  {
    id: "1",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    phone: "+1 (555) 123-4567",
    lastContacted: "3 days ago",
    groups: ["Friends", "Work"],
    socialLinks: {
      linkedin: "https://linkedin.com/in/janesmith",
      twitter: "https://twitter.com/janesmith"
    }
  },
  {
    id: "2",
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 987-6543",
    lastContacted: "1 week ago",
    groups: ["Family"],
    socialLinks: {
      facebook: "https://facebook.com/johndoe"
    }
  },
  {
    id: "3",
    name: "Alex Johnson",
    email: "alex@example.com",
    phone: "+1 (555) 555-5555",
    lastContacted: "2 weeks ago",
    groups: ["Friends"],
    socialLinks: {
      instagram: "https://instagram.com/alexj"
    }
  },
];

// Sample conversations
const SAMPLE_CONVERSATIONS: ConversationType[] = [
  {
    id: "1",
    contactId: "1",
    date: "2025-05-01",
    medium: "phone",
    duration: "30 minutes",
    summary: "Discussed upcoming project collaboration and next steps. Jane will send the proposal by next week.",
    notes: [
      { id: "n1", content: "Follow up about the budget estimates", timestamp: "2025-05-01T14:30:00Z" },
      { id: "n2", content: "Share the project timeline document", timestamp: "2025-05-01T14:35:00Z" }
    ]
  },
  {
    id: "2",
    contactId: "2",
    date: "2025-04-28",
    medium: "email",
    summary: "John shared family photos from the recent vacation. Mentioned they're planning to visit in July.",
    notes: [
      { id: "n3", content: "Check calendar for July availability", timestamp: "2025-04-28T09:15:00Z" }
    ]
  },
  {
    id: "3",
    contactId: "3",
    date: "2025-04-25",
    medium: "in-person",
    duration: "2 hours",
    summary: "Coffee meetup to catch up. Alex is starting a new job next month and moving to Seattle.",
    notes: []
  }
];

const ConversationsPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<ConversationType[]>(SAMPLE_CONVERSATIONS);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterContact, setFilterContact] = useState<string>("all");
  const [filterMedium, setFilterMedium] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
    return SAMPLE_CONTACTS.find(contact => contact.id === id) || {
      id: "0",
      name: "Unknown",
      email: "unknown@example.com",
    };
  };

  const handleSaveConversation = (conversation: ConversationType) => {
    setConversations([...conversations, conversation]);
    setIsDialogOpen(false);
    
    // Update the lastContacted field of the contact
    const contactName = getContactById(conversation.contactId).name;
    toast.success(`Conversation with ${contactName} saved successfully`);
  };

  const handleDeleteConversation = (id: string) => {
    setConversations(conversations.filter(conv => conv.id !== id));
    toast.success("Conversation deleted successfully");
  };

  // Filtered and enhanced conversations
  const enhancedConversations: ConversationWithContactType[] = conversations
    .filter(conv => {
      const contact = getContactById(conv.contactId);
      const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          conv.summary.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesContact = filterContact === "all" || conv.contactId === filterContact;
      const matchesMedium = filterMedium === "all" || conv.medium === filterMedium;
      
      return matchesSearch && matchesContact && matchesMedium;
    })
    .map(conv => ({
      ...conv,
      contact: getContactById(conv.contactId)
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort by newest first

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
            <h1 className="text-2xl font-semibold">Conversations</h1>
            <p className="text-muted-foreground">
              Track your interactions with contacts
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Select 
                    value={filterContact} 
                    onValueChange={setFilterContact}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by contact" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Contacts</SelectItem>
                      {SAMPLE_CONTACTS.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select 
                    value={filterMedium} 
                    onValueChange={setFilterMedium}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by medium" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Mediums</SelectItem>
                      <SelectItem value="phone">Phone Call</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="social">Social Media</SelectItem>
                      <SelectItem value="in-person">In Person</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>

                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Conversation
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                      <ConversationForm 
                        contacts={SAMPLE_CONTACTS}
                        onSave={handleSaveConversation}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {enhancedConversations.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No conversations found. Try adjusting your search or add a new conversation.</p>
                  <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add a conversation
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {enhancedConversations.map((conversation) => (
                    <ConversationCard
                      key={conversation.id}
                      conversation={conversation}
                      contact={conversation.contact}
                      onDelete={handleDeleteConversation}
                    />
                  ))}
                </div>
              )}
            </div>

            <div>
              <Card>
                <CardContent className="pt-6">
                  <ConversationForm
                    contacts={SAMPLE_CONTACTS}
                    onSave={handleSaveConversation}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationsPage;
