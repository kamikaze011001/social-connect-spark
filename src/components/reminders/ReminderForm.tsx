
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ContactType } from "../contacts/ContactCard";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { toast } from "sonner";

interface ReminderFormProps {
  contacts: ContactType[];
}

const ReminderForm = ({ contacts }: ReminderFormProps) => {
  const [selectedContact, setSelectedContact] = useState<string>("");
  const [date, setDate] = useState<Date | undefined>();
  const [purpose, setPurpose] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState("weekly");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const contactName = contacts.find(c => c.id === selectedContact)?.name || "your contact";
      
      if (isRecurring) {
        toast.success(`Recurring reminder set for ${contactName} ${recurringFrequency}`);
      } else {
        toast.success(`Reminder set for ${contactName} on ${date ? format(date, "PPP") : "selected date"}`);
      }
      
      // Reset form
      setSelectedContact("");
      setDate(undefined);
      setPurpose("");
      setIsRecurring(false);
      setRecurringFrequency("weekly");
      setIsLoading(false);
    }, 1000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set a Reminder</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contact">Contact</Label>
            <Select value={selectedContact} onValueChange={setSelectedContact}>
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
            <div className="flex items-center justify-between">
              <Label htmlFor="recurring">Recurring Reminder</Label>
              <Switch 
                id="recurring" 
                checked={isRecurring} 
                onCheckedChange={setIsRecurring} 
              />
            </div>
          </div>
          
          {isRecurring ? (
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select value={recurringFrequency} onValueChange={setRecurringFrequency}>
                <SelectTrigger id="frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Select a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose</Label>
            <Textarea
              id="purpose"
              placeholder="What's this reminder for?"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading || !selectedContact || ((!date && !isRecurring))}>
            {isLoading ? "Setting reminder..." : "Set Reminder"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default ReminderForm;
