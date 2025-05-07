
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ContactCard, { ContactType } from "./ContactCard";
import AddContactDialog from "./AddContactDialog";
import { Search, Plus } from "lucide-react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
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

const ContactList = () => {
  const [contacts, setContacts] = useState<ContactType[]>(SAMPLE_CONTACTS);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGroup, setFilterGroup] = useState<string>("all");
  const [editingContact, setEditingContact] = useState<ContactType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const allGroups = Array.from(
    new Set(contacts.flatMap((contact) => contact.groups || []))
  );

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          contact.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = filterGroup === "all" || 
                          contact.groups?.includes(filterGroup);
    
    return matchesSearch && matchesGroup;
  });

  const handleAddContact = (newContact: ContactType) => {
    setContacts([...contacts, { ...newContact, id: Date.now().toString() }]);
    setIsDialogOpen(false);
    toast.success(`${newContact.name} added to contacts`);
  };

  const handleEditContact = (updatedContact: ContactType) => {
    setContacts(contacts.map(contact => 
      contact.id === updatedContact.id ? updatedContact : contact
    ));
    setEditingContact(null);
    setIsDialogOpen(false);
    toast.success(`${updatedContact.name} updated`);
  };

  const handleDeleteContact = (id: string) => {
    const contactToDelete = contacts.find(contact => contact.id === id);
    setContacts(contacts.filter(contact => contact.id !== id));
    toast.success(`${contactToDelete?.name || 'Contact'} deleted`);
  };

  const handleAddReminder = (contact: ContactType) => {
    toast.info(`Set a reminder for ${contact.name}`);
    // In a real app, this would open a reminder form
  };

  const handleAddConversation = (contact: ContactType) => {
    toast.info(`Add conversation with ${contact.name}`);
    // In a real app, this would open a conversation form
  };

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
              {allGroups.map((group) => (
                <SelectItem key={group} value={group}>
                  {group}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
      
      {editingContact && (
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingContact(null);
        }}>
          <AddContactDialog 
            onSave={handleAddContact} 
            onEdit={handleEditContact}
            existingContact={editingContact}
            existingGroups={allGroups}
          />
        </Dialog>
      )}
    </div>
  );
};

export default ContactList;
