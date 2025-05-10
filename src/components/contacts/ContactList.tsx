import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ContactCard, { ContactType } from "./ContactCard";
import AddContactDialog from "./AddContactDialog";
import { Search, Plus } from "lucide-react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface ContactGroup {
  groups: {
    name: string;
  };
}

interface SupabaseError {
  message: string;
}

const ContactList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGroup, setFilterGroup] = useState<string>("all");
  const [editingContact, setEditingContact] = useState<ContactType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Fetch contacts from Supabase
  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("contacts")
        .select("*, contact_groups!inner(groups(id, name))")
        .eq("user_id", user.id);
      
      if (error) {
        console.error("Error fetching contacts:", error);
        toast.error("Failed to load contacts");
        return [];
      }
      
      // Process the contacts to extract groups
      return data.map((contact) => {
        const contactGroups = contact.contact_groups
          ? Array.isArray(contact.contact_groups)
            ? contact.contact_groups.map((group: ContactGroup) => group.groups.name)
            : []
          : [];
          
        return {
          id: contact.id,
          name: contact.name,
          email: contact.email || "",
          phone: contact.phone || "",
          lastContacted: contact.last_contacted 
            ? new Date(contact.last_contacted).toLocaleDateString() 
            : undefined,
          groups: contactGroups
        };
      });
    },
    enabled: !!user,
  });

  // Fetch groups from Supabase
  const { data: allGroups = [] } = useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .eq("user_id", user.id);
      
      if (error) {
        console.error("Error fetching groups:", error);
        toast.error("Failed to load groups");
        return [];
      }
      
      return data.map(group => group.name);
    },
    enabled: !!user,
  });
  
  // Add contact mutation
  const addContactMutation = useMutation({
    mutationFn: async (newContact: Omit<ContactType, "id">) => {
      const { data, error } = await supabase
        .from("contacts")
        .insert({
          name: newContact.name,
          email: newContact.email,
          phone: newContact.phone,
          user_id: user!.id,
          last_contacted: newContact.lastContacted ? new Date(newContact.lastContacted).toISOString() : null
        })
        .select("*")
        .single();
      
      if (error) throw error;
      
      // If there are groups, create the associations
      if (newContact.groups && newContact.groups.length > 0) {
        // First get or create the groups
        for (const groupName of newContact.groups) {
          // Check if group exists
          let groupId;
          const { data: existingGroups } = await supabase
            .from("groups")
            .select("id")
            .eq("name", groupName)
            .eq("user_id", user!.id);
          if (existingGroups && existingGroups.length > 0) {
            groupId = existingGroups[0].id;
          } else {
            // Create new group
            const { data: newGroup, error: groupError } = await supabase
              .from("groups")
              .insert({ name: groupName, user_id: user!.id })
              .select("*")
              .single();
            
            if (groupError) throw groupError;
            
            groupId = newGroup.id;
          }
          
          // Create contact-group association
          const { error: assocError } = await supabase
            .from("contact_groups")
            .insert({
              contact_id: data.id,
              group_id: groupId
            });
          
          if (assocError) throw assocError;
        }
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      setIsDialogOpen(false);
      toast.success("Contact added successfully");
    },
    onError: (error: SupabaseError) => {
      console.error("Error adding contact:", error);
      toast.error(error.message || "Failed to add contact");
    }
  });
  
  // Edit contact mutation
  const editContactMutation = useMutation({
    mutationFn: async (updatedContact: ContactType) => {
      const { data, error } = await supabase
        .from("contacts")
        .update({
          name: updatedContact.name,
          email: updatedContact.email,
          phone: updatedContact.phone,
          last_contacted: updatedContact.lastContacted ? new Date(updatedContact.lastContacted).toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq("id", updatedContact.id)
        .select("*")
        .single();
      
      if (error) throw error;
      
      // Handle groups update - this requires removing existing associations and adding new ones
      // First, get existing group associations
      const { data: existingAssociations, error: fetchError } = await supabase
        .from("contact_groups")
        .select("*")
        .eq("contact_id", updatedContact.id);
        
      if (fetchError) throw fetchError;
      
      // Remove existing associations
      if (existingAssociations.length > 0) {
        const { error: deleteError } = await supabase
          .from("contact_groups")
          .delete()
          .eq("contact_id", updatedContact.id);
          
        if (deleteError) throw deleteError;
      }
      
      // Add new associations if there are groups
      if (updatedContact.groups && updatedContact.groups.length > 0) {
        for (const groupName of updatedContact.groups) {
          // Check if group exists
          let groupId;
          const { data: existingGroups } = await supabase
            .from("groups")
            .select("id")
            .eq("name", groupName)
            .eq("user_id", user!.id);
          
          if (existingGroups && existingGroups.length > 0) {
            groupId = existingGroups[0].id;
          } else {
            // Create new group
            const { data: newGroup, error: groupError } = await supabase
              .from("groups")
              .insert({ name: groupName, user_id: user!.id })
              .select("*")
              .single();
            
            if (groupError) throw groupError;
            
            groupId = newGroup.id;
          }
          
          // Create contact-group association
          const { error: assocError } = await supabase
            .from("contact_groups")
            .insert({
              contact_id: updatedContact.id,
              group_id: groupId
            });
          
          if (assocError) throw assocError;
        }
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      setEditingContact(null);
      setIsDialogOpen(false);
      toast.success("Contact updated successfully");
    },
    onError: (error: SupabaseError) => {
      console.error("Error updating contact:", error);
      toast.error(error.message || "Failed to update contact");
    }
  });
  
  // Delete contact mutation
  const deleteContactMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("contacts")
        .delete()
        .eq("id", id);
        
      if (error) throw error;
      
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contact deleted");
    },
    onError: (error: SupabaseError) => {
      console.error("Error deleting contact:", error);
      toast.error(error.message || "Failed to delete contact");
    }
  });

  // Filter contacts based on search term and selected group
  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesGroup = filterGroup === "all" || 
                         (contact.groups && contact.groups.includes(filterGroup));
    
    return matchesSearch && matchesGroup;
  });

  const handleAddContact = (newContact: Omit<ContactType, "id">) => {
    addContactMutation.mutate(newContact);
  };

  const handleEditContact = (updatedContact: ContactType) => {
    editContactMutation.mutate(updatedContact);
  };

  const handleDeleteContact = (id: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this contact?");
    if (confirmDelete) {
      deleteContactMutation.mutate(id);
    }
  };

  const handleAddReminder = (contact: ContactType) => {
    toast.info(`Set a reminder for ${contact.name}`);
    // In a real app, this would open a reminder form
  };

  const handleAddConversation = (contact: ContactType) => {
    toast.info(`Add conversation with ${contact.name}`);
    // In a real app, this would open a conversation form
  };

  if (isLoading) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">Loading contacts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Select 
            value={filterGroup} 
            onValueChange={setFilterGroup}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              {allGroups.map((group: string) => (
                <SelectItem key={group} value={group}>
                  {group}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog 
            open={isDialogOpen} 
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingContact(null);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Contact
              </Button>
            </DialogTrigger>
            <AddContactDialog 
              onSave={handleAddContact} 
              onEdit={handleEditContact}
              existingContact={editingContact}
              existingGroups={allGroups}
            />
          </Dialog>
        </div>
      </div>

      {filteredContacts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No contacts found. Try adjusting your search or add a new contact.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onEdit={(contact) => {
                setEditingContact(contact);
                setIsDialogOpen(true);
              }}
              onDelete={handleDeleteContact}
              onAddReminder={handleAddReminder}
              onAddConversation={handleAddConversation}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ContactList;
