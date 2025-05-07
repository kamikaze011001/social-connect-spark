
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ContactType } from "../contacts/ContactCard";
import { ConversationType, NoteType } from "./ConversationType";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

interface ConversationFormProps {
  contacts: ContactType[];
  onSave: (conversation: ConversationType) => void;
  initialContactId?: string;
}

const ConversationForm = ({ contacts, onSave, initialContactId }: ConversationFormProps) => {
  const [selectedContact, setSelectedContact] = useState<string>(initialContactId || "");
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [medium, setMedium] = useState<"phone" | "email" | "social" | "in-person" | "other">("phone");
  const [duration, setDuration] = useState("");
  const [summary, setSummary] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [notes, setNotes] = useState<NoteType[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddNote = () => {
    if (noteContent.trim()) {
      const newNote: NoteType = {
        id: uuidv4(),
        content: noteContent.trim(),
        timestamp: new Date().toISOString()
      };
      setNotes([...notes, newNote]);
      setNoteContent("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (!selectedContact || !summary.trim()) {
      toast.error("Please fill in all required fields");
      setIsLoading(false);
      return;
    }

    const conversation: ConversationType = {
      id: uuidv4(),
      contactId: selectedContact,
      date,
      medium,
      duration: duration || undefined,
      summary: summary.trim(),
      notes
    };
    
    // Simulate API call delay
    setTimeout(() => {
      onSave(conversation);
      
      // Reset form after successful save
      if (!initialContactId) {
        setSelectedContact("");
      }
      setDate(new Date().toISOString().split('T')[0]);
      setMedium("phone");
      setDuration("");
      setSummary("");
      setNotes([]);
      
      setIsLoading(false);
      
      const contactName = contacts.find(c => c.id === selectedContact)?.name || "your contact";
      toast.success(`Conversation with ${contactName} saved successfully`);
    }, 500);
  };

  const removeNote = (id: string) => {
    setNotes(notes.filter(note => note.id !== id));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Conversation</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contact">Contact</Label>
            <Select 
              value={selectedContact} 
              onValueChange={setSelectedContact} 
              disabled={!!initialContactId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a contact" />
              </SelectTrigger>
              <SelectContent>
                {contacts.map(contact => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="medium">Communication Medium</Label>
            <Select value={medium} onValueChange={(value: any) => setMedium(value)}>
              <SelectTrigger id="medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="phone">Phone Call</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="social">Social Media</SelectItem>
                <SelectItem value="in-person">In Person</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (optional)</Label>
            <Input
              id="duration"
              placeholder="e.g. 30 minutes"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="summary">Summary</Label>
            <Textarea
              id="summary"
              placeholder="What was discussed?"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          
          <div className="space-y-2 border-t pt-4">
            <Label>Notes</Label>
            
            {notes.length > 0 && (
              <div className="space-y-2 mb-4">
                {notes.map((note) => (
                  <div key={note.id} className="bg-muted p-3 rounded-md relative">
                    <p className="pr-6">{note.content}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => removeNote(note.id)}
                    >
                      <span className="sr-only">Remove note</span>
                      <span aria-hidden="true">&times;</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex gap-2">
              <Textarea
                placeholder="Add a note about this conversation"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
            
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleAddNote}
              disabled={!noteContent.trim()}
            >
              Add Note
            </Button>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading || !selectedContact || !summary.trim()}>
            {isLoading ? "Saving..." : "Save Conversation"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default ConversationForm;
