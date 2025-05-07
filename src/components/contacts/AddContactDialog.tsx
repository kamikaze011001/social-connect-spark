
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ContactType } from "./ContactCard";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { X, Linkedin, Twitter, Instagram, Facebook, Calendar, Plus } from "lucide-react";

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
  const [socialLinks, setSocialLinks] = useState({
    linkedin: "",
    twitter: "",
    instagram: "",
    facebook: ""
  });
  const [specialDates, setSpecialDates] = useState<Array<{type: string, date: string, description?: string}>>([]);
  const [specialDateInput, setSpecialDateInput] = useState({
    type: "birthday",
    date: "",
    description: ""
  });

  useEffect(() => {
    if (existingContact) {
      setName(existingContact.name);
      setEmail(existingContact.email);
      setPhone(existingContact.phone || "");
      setGroups(existingContact.groups || []);
      setSocialLinks({
        linkedin: existingContact.socialLinks?.linkedin || "",
        twitter: existingContact.socialLinks?.twitter || "",
        instagram: existingContact.socialLinks?.instagram || "",
        facebook: existingContact.socialLinks?.facebook || ""
      });
      setSpecialDates(existingContact.specialDates || []);
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
      socialLinks: {
        linkedin: socialLinks.linkedin || undefined,
        twitter: socialLinks.twitter || undefined,
        instagram: socialLinks.instagram || undefined,
        facebook: socialLinks.facebook || undefined
      },
      specialDates: specialDates.length > 0 ? specialDates : undefined
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
      setSocialLinks({
        linkedin: "",
        twitter: "",
        instagram: "",
        facebook: ""
      });
      setSpecialDates([]);
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

  const handleRemoveSpecialDate = (index: number) => {
    const newDates = [...specialDates];
    newDates.splice(index, 1);
    setSpecialDates(newDates);
  };

  const handleSocialLinkChange = (platform: keyof typeof socialLinks, value: string) => {
    setSocialLinks(prev => ({
      ...prev,
      [platform]: value
    }));
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

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="social-links">
            <AccordionTrigger>Social Media Links</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Linkedin className="h-4 w-4 mr-2 text-blue-600" />
                    <Label htmlFor="linkedin">LinkedIn</Label>
                  </div>
                  <Input
                    id="linkedin"
                    value={socialLinks.linkedin}
                    onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Twitter className="h-4 w-4 mr-2 text-blue-400" />
                    <Label htmlFor="twitter">Twitter</Label>
                  </div>
                  <Input
                    id="twitter"
                    value={socialLinks.twitter}
                    onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                    placeholder="https://twitter.com/username"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Instagram className="h-4 w-4 mr-2 text-pink-500" />
                    <Label htmlFor="instagram">Instagram</Label>
                  </div>
                  <Input
                    id="instagram"
                    value={socialLinks.instagram}
                    onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                    placeholder="https://instagram.com/username"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Facebook className="h-4 w-4 mr-2 text-blue-500" />
                    <Label htmlFor="facebook">Facebook</Label>
                  </div>
                  <Input
                    id="facebook"
                    value={socialLinks.facebook}
                    onChange={(e) => handleSocialLinkChange('facebook', e.target.value)}
                    placeholder="https://facebook.com/username"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="special-dates">
            <AccordionTrigger>Special Dates</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                {specialDates.map((date, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                    <div>
                      <p className="font-medium">{date.type}</p>
                      <p className="text-sm text-muted-foreground">{new Date(date.date).toLocaleDateString()}</p>
                      {date.description && <p className="text-xs italic">{date.description}</p>}
                    </div>
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleRemoveSpecialDate(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <div className="space-y-3 border-t pt-3">
                  <div className="space-y-2">
                    <Label htmlFor="specialDateType">Type</Label>
                    <select
                      id="specialDateType"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={specialDateInput.type}
                      onChange={(e) => setSpecialDateInput({...specialDateInput, type: e.target.value})}
                    >
                      <option value="birthday">Birthday</option>
                      <option value="anniversary">Anniversary</option>
                      <option value="important date">Important Date</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="specialDate">Date</Label>
                    <Input
                      id="specialDate"
                      type="date"
                      value={specialDateInput.date}
                      onChange={(e) => setSpecialDateInput({...specialDateInput, date: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="specialDateDescription">Description (optional)</Label>
                    <Input
                      id="specialDateDescription"
                      value={specialDateInput.description}
                      onChange={(e) => setSpecialDateInput({...specialDateInput, description: e.target.value})}
                      placeholder="Description"
                    />
                  </div>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={handleAddSpecialDate} 
                    disabled={!specialDateInput.date}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Date
                  </Button>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
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
