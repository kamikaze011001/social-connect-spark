
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ContactType } from "./ContactCard";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface AddContactDialogProps {
  onSave: (contact: ContactType) => void;
  onEdit: (contact: ContactType) => void;
  existingContact?: ContactType | null;
  existingGroups?: string[];
}

const AddContactDialog = ({ 
  onSave, 
  onEdit, 
  existingContact = null,
  existingGroups = []
}: AddContactDialogProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [groupInput, setGroupInput] = useState("");
  const [groups, setGroups] = useState<string[]>([]);
  const [errors, setErrors] = useState({ name: "", email: "" });

  useEffect(() => {
    if (existingContact) {
      setName(existingContact.name);
      setEmail(existingContact.email);
      setPhone(existingContact.phone || "");
      setGroups(existingContact.groups || []);
    }
  }, [existingContact]);

  const validateForm = () => {
    const newErrors = { name: "", email: "" };
    let valid = true;

    if (!name.trim()) {
      newErrors.name = "Name is required";
      valid = false;
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const contactData: ContactType = {
      id: existingContact?.id || "",
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      groups: groups,
      lastContacted: existingContact?.lastContacted,
      imageUrl: existingContact?.imageUrl,
    };

    if (existingContact) {
      onEdit(contactData);
    } else {
      onSave(contactData);
    }

    // Reset form
    if (!existingContact) {
      setName("");
      setEmail("");
      setPhone("");
      setGroups([]);
    }
  };

  const handleAddGroup = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && groupInput.trim()) {
      e.preventDefault();
      const newGroup = groupInput.trim();
      
      if (!groups.includes(newGroup)) {
        setGroups([...groups, newGroup]);
      }
      
      setGroupInput("");
    }
  };

  const handleRemoveGroup = (group: string) => {
    setGroups(groups.filter(g => g !== group));
  };

  const handleGroupSuggestionClick = (group: string) => {
    if (!groups.includes(group)) {
      setGroups([...groups, group]);
    }
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{existingContact ? "Edit Contact" : "Add New Contact"}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
          />
          {errors.name && (
            <p className="text-destructive text-sm">{errors.name}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
          />
          {errors.email && (
            <p className="text-destructive text-sm">{errors.email}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (555) 123-4567"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="groups">Groups</Label>
          <div className="flex flex-wrap gap-1 mb-2">
            {groups.map((group) => (
              <Badge key={group} variant="secondary" className="text-sm py-1">
                {group}
                <button 
                  type="button"
                  onClick={() => handleRemoveGroup(group)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <Input
            id="groups"
            value={groupInput}
            onChange={(e) => setGroupInput(e.target.value)}
            onKeyDown={handleAddGroup}
            placeholder="Add a group (press Enter)"
          />
          
          {existingGroups.length > 0 && groupInput === "" && groups.length === 0 && (
            <div className="mt-2">
              <p className="text-sm text-muted-foreground mb-1">Suggestions:</p>
              <div className="flex flex-wrap gap-1">
                {existingGroups.map((group) => (
                  <Badge 
                    key={group} 
                    variant="outline" 
                    className="text-sm cursor-pointer hover:bg-secondary"
                    onClick={() => handleGroupSuggestionClick(group)}
                  >
                    {group}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-4">
          <Button type="submit" className="w-full">
            {existingContact ? "Save Changes" : "Add Contact"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

export default AddContactDialog;
