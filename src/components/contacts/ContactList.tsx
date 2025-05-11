import { useState } from "react"; // Removed useEffect as it's not directly used now
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ContactCard, { ContactType } from "./ContactCard";
import AddContactDialog from "./AddContactDialog";
import { Search, Plus } from "lucide-react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner"; // Keep toast for local messages if any
import { useContactManagement } from "@/hooks/useContactManagement"; // Corrected path

const ContactList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGroup, setFilterGroup] = useState<string>("all");
  const [editingContact, setEditingContact] = useState<ContactType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const {
    contacts,
    isLoadingContacts: isLoading, // Renamed for consistency with original
    allGroups,
    addContact,
    editContact,
    deleteContact,
    // isAddingContact, // Available if needed for UI
    // isEditingContact, // Available if needed for UI
    // isDeletingContact, // Available if needed for UI
  } = useContactManagement();
  
  // Filter contacts based on search term and selected group
  const filteredContacts = contacts.filter((contact: ContactType) => { // Added type for contact
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesGroup = filterGroup === "all" || 
                         (contact.groups && contact.groups.includes(filterGroup));
    
    return matchesSearch && matchesGroup;
  });

  const handleAddContact = (newContact: Omit<ContactType, "id" | "lastContacted"> & { lastContacted?: string }) => {
    addContact(newContact, {
      onSuccess: () => {
        setIsDialogOpen(false);
      }
    });
  };

  const handleEditContact = (updatedContact: ContactType) => {
    editContact(updatedContact, {
      onSuccess: () => {
        setEditingContact(null);
        setIsDialogOpen(false);
      }
    });
  };

  const handleDeleteContact = (id: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this contact?");
    if (confirmDelete) {
      deleteContact(id);
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
