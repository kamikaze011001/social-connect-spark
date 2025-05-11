
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
import { Search, Plus } from "lucide-react";
import { ContactType } from "@/components/contacts/ContactCard";
import { ConversationType, ConversationWithContactType } from "@/components/conversations/ConversationType";
import ConversationForm from "@/components/conversations/ConversationForm";
import ConversationCard from "@/components/conversations/ConversationCard";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const ConversationsPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterContact, setFilterContact] = useState<string>("all");
  const [filterMedium, setFilterMedium] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  
  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate("/auth");
    }
  }, [navigate, user, authLoading]);

  // Fetch contacts
  const { data: contacts = [], isLoading: contactsLoading } = useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("user_id", user.id)
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
        phone: contact.phone || ""
      })) as ContactType[];
    },
    enabled: !!user,
  });

  // Fetch conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("conversations")
        .select(`
          *,
          conversation_notes(*)
        `)
        .eq("user_id", user.id)
        .order("date", { ascending: false });
      
      if (error) {
        console.error("Error fetching conversations:", error);
        toast.error("Failed to load conversations");
        return [];
      }
      
      return data.map(conv => ({
        id: conv.id,
        contactId: conv.contact_id,
        date: conv.date,
        medium: conv.medium,
        duration: conv.duration || "",
        summary: conv.summary || "",
        notes: conv.conversation_notes ? conv.conversation_notes.map((note: { id: string; content: string; timestamp: string }) => ({
          id: note.id,
          content: note.content,
          timestamp: note.timestamp
        })) : []
      })) as ConversationType[];
    },
    enabled: !!user,
  });

  // Add conversation mutation
  const addConversationMutation = useMutation({
    mutationFn: async (conversation: Omit<ConversationType, "id">) => {
      // First insert the conversation
      const { data: newConversation, error } = await supabase
        .from("conversations")
        .insert({
          contact_id: conversation.contactId,
          date: conversation.date,
          medium: conversation.medium,
          duration: conversation.duration || null,
          summary: conversation.summary || null,
          user_id: user!.id
        })
        .select("*")
        .single();
      
      if (error) throw error;
      
      // If there are notes, insert them as well
      if (conversation.notes && conversation.notes.length > 0) {
        const notesToInsert = conversation.notes.map(note => ({
          conversation_id: newConversation.id,
          content: note.content,
        }));
        
        const { error: notesError } = await supabase
          .from("conversation_notes")
          .insert(notesToInsert);
        
        if (notesError) throw notesError;
      }
      
      return newConversation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setIsDialogOpen(false);
      toast.success("Conversation saved successfully");
    },
    onError: (error: Error) => {
      console.error("Error adding conversation:", error);
      toast.error(error.message || "Failed to add conversation");
    },
  });

  // Delete conversation mutation
  const deleteConversationMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("conversations")
        .delete()
        .eq("id", id);
        
      if (error) throw error;
      
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      toast.success("Conversation deleted successfully");
    },
    onError: (error: Error) => {
      console.error("Error deleting conversation:", error);
      toast.error(error.message || "Failed to delete conversation");
    },
  });

  if (authLoading || contactsLoading || conversationsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null; // Don't render anything until we've checked auth status
  }

  const getContactById = (id: string) => {
    return contacts.find(contact => contact.id === id) || {
      id: "0",
      name: "Unknown",
      email: "unknown@example.com",
    };
  };

  const handleSaveConversation = (conversation: Omit<ConversationType, "id">) => {
    addConversationMutation.mutate(conversation);
  };

  const handleDeleteConversation = (id: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this conversation?");
    if (confirmDelete) {
      deleteConversationMutation.mutate(id);
    }
  };

  // Enhanced conversations with contact information
  const enhancedConversations: ConversationWithContactType[] = conversations
    .filter(conv => {
      const contact = getContactById(conv.contactId);
      const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (conv.summary && conv.summary.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesContact = filterContact === "all" || conv.contactId === filterContact;
      const matchesMedium = filterMedium === "all" || conv.medium === filterMedium;
      
      return matchesSearch && matchesContact && matchesMedium;
    })
    .map(conv => ({
      ...conv,
      contact: getContactById(conv.contactId)
    }));

  return (
    <div className="flex min-h-screen">
      {!isMobile && (
        <div className="w-64 hidden md:block">
          <Sidebar />
        </div>
      )}
      <div className="flex-1">
        <Header userEmail={user.email || ""} />
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
                
                <div className="flex flex-wrap gap-2 justify-end">
                  <Select 
                    value={filterContact} 
                    onValueChange={setFilterContact}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by contact" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Contacts</SelectItem>
                      {contacts.map((contact) => (
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
                    <DialogContent className="p-4 w-[90vw] max-w-lg max-h-[85vh] overflow-y-auto sm:max-w-[600px] sm:p-6">
                      <ConversationForm 
                        contacts={contacts}
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
                    contacts={contacts}
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
