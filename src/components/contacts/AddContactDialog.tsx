import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ContactType } from "./ContactCard";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { X, Linkedin, Twitter, Instagram, Facebook, Plus } from "lucide-react"; // Removed Calendar as it's not used directly here anymore
import SocialLinksFormSection from "./SocialLinksFormSection";
import SpecialDatesFormSection from "./SpecialDatesFormSection";
import GroupsFormSection from "./GroupsFormSection";

interface AddContactDialogProps {
  onSave: (contact: ContactType) => void;
  onEdit: (contact: ContactType) => void;
  existingContact?: ContactType | null;
  existingGroups?: string[];
}

const AddContactDialog = ({ 
  onSave, 
  onEdit, 
  existingContact, // Default ' = null' removed, useEffect handles undefined/null
  existingGroups = []
}: AddContactDialogProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [groupInput, setGroupInput] = useState("");
  const [groups, setGroups] = useState<string[]>([]);
  const [errors, setErrors] = useState({ name: "", email: "", groups: "" });
  const [socialLinks, setSocialLinks] = useState({
    linkedin: "",
    twitter: "",
    instagram: "",
    facebook: ""
  });
  const [specialDates, setSpecialDates] = useState<Array<{id: string, type: string, date: string, description?: string}>>([]);
  const [specialDateInput, setSpecialDateInput] = useState({
    type: "birthday",
    date: "",
    description: ""
  });

  useEffect(() => {
    if (existingContact) {
      setName(existingContact.name);
      setEmail(existingContact.email || ""); // Ensure email is an empty string if undefined/null
      setPhone(existingContact.phone || "");
      setGroups(existingContact.groups || []);
      setSocialLinks({
        linkedin: existingContact.socialLinks?.linkedin || "",
        twitter: existingContact.socialLinks?.twitter || "",
        instagram: existingContact.socialLinks?.instagram || "",
        facebook: existingContact.socialLinks?.facebook || ""
      });
      setSpecialDates(
        (existingContact.specialDates || []).map(sd => ({
          ...sd,
          id: sd.id || crypto.randomUUID() // Ensure id exists for local state
        }))
      );
    } else {
      // Reset all form fields when there's no existing contact
      setName("");
      setEmail("");
      setPhone("");
      setGroups([]);
      setSocialLinks({
        linkedin: "",
        twitter: "",
        instagram: "",
        facebook: ""
      });
      setSpecialDates([]);
      setErrors({ name: "", email: "", groups: "" });
    }
  }, [existingContact]);

  const validateForm = () => {
    const newErrors = { name: "", email: "", groups: "" };
    let valid = true;

    // Name is required
    if (!name.trim()) {
      newErrors.name = "Name is required";
      valid = false;
    }

    // Groups are required
    if (groups.length === 0) {
      newErrors.groups = "At least one group is required";
      valid = false;
    }

    // Check if at least one other field is filled
    const isEmailFilled = email.trim().length > 0;
    const isPhoneFilled = phone.trim().length > 0;
    const areSocialLinksFilled = Object.values(socialLinks).some(link => link.trim().length > 0);
    const areSpecialDatesFilled = specialDates.length > 0;

    if (!isEmailFilled && !isPhoneFilled && !areSocialLinksFilled && !areSpecialDatesFilled) {
      newErrors.email = "At least one other field must be filled (email, phone, social links, or special dates)";
      valid = false;
    }

    // Only validate email format if email is provided and filled
    if (isEmailFilled && !/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid"; // This might overwrite the "at least one other field" error if email is the only one filled and invalid
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Validating form...");
    const isValid = validateForm();
    console.log("Form validation result:", isValid);
    if (!isValid) return;

    const contactData: ContactType = {
      id: existingContact?.id || "",
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      groups: groups,
      lastContacted: existingContact?.lastContacted,
      imageUrl: existingContact?.imageUrl,
      socialLinks: {
        linkedin: socialLinks.linkedin || undefined,
        twitter: socialLinks.twitter || undefined,
        instagram: socialLinks.instagram || undefined,
        facebook: socialLinks.facebook || undefined
      },
      specialDates: specialDates.length > 0
        ? specialDates.map(({ id, ...rest }) => rest) // Remove id before sending
        : undefined
    };

    console.log("Contact data to be sent to onEdit/onSave:", JSON.stringify(contactData, null, 2));

    if (existingContact) {
      onEdit(contactData);
    } else {
      onSave(contactData);
    }

    // Reset form only after successful submission
    if (!existingContact) {
      setName("");
      setEmail("");
      setPhone("");
      setGroups([]);
      setSocialLinks({
        linkedin: "",
        twitter: "",
        instagram: "",
        facebook: ""
      });
      setSpecialDates([]);
      setErrors({ name: "", email: "", groups: "" });
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

  const handleAddSpecialDate = () => {
    if (specialDateInput.date) {
      setSpecialDates([...specialDates, {
        id: crypto.randomUUID(), 
        type: specialDateInput.type,
        date: specialDateInput.date,
        description: specialDateInput.description || undefined
      }]);
      setSpecialDateInput({
        type: "birthday",
        date: "",
        description: ""
      });
    }
  };

  const handleRemoveSpecialDate = (idToRemove: string) => {
    setSpecialDates(specialDates.filter(sd => sd.id !== idToRemove));
  };

  const handleSocialLinkChange = (platform: keyof typeof socialLinks, value: string) => {
    setSocialLinks(prev => ({
      ...prev,
      [platform]: value
    }));
  };

  return (
    <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{existingContact ? "Edit Contact" : "Add New Contact"}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
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
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (555) 123-4567"
          />
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="social-links">
            <AccordionTrigger>Social Media Links</AccordionTrigger>
            <AccordionContent>
              <SocialLinksFormSection 
                socialLinks={socialLinks} 
                onSocialLinkChange={handleSocialLinkChange} 
              />
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="special-dates">
            <AccordionTrigger>Special Dates</AccordionTrigger>
            <AccordionContent>
              <SpecialDatesFormSection 
                specialDates={specialDates} 
                specialDateInput={specialDateInput} 
                setSpecialDateInput={setSpecialDateInput} 
                onAddSpecialDate={handleAddSpecialDate} 
                onRemoveSpecialDate={handleRemoveSpecialDate} 
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
        <GroupsFormSection 
          groups={groups}
          groupInput={groupInput}
          setGroupInput={setGroupInput}
          onAddGroup={handleAddGroup}
          onRemoveGroup={handleRemoveGroup}
          existingGroups={existingGroups}
          onGroupSuggestionClick={handleGroupSuggestionClick}
          error={errors.groups}
        />

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
