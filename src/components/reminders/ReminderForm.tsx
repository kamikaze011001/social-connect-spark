
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ContactType } from "../contacts/ContactCard";
import { Calendar as CalendarIcon, Clock, Gift } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ReminderFormProps {
  contacts: ContactType[];
}

const ReminderForm = ({ contacts }: ReminderFormProps) => {
  const [activeTab, setActiveTab] = useState<string>("standard");
  const [selectedContact, setSelectedContact] = useState<string>("");
  const [date, setDate] = useState<Date | undefined>();
  const [purpose, setPurpose] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState("weekly");
  const [isLoading, setIsLoading] = useState(false);
  
  // Special date specific fields
  const [specialDateType, setSpecialDateType] = useState<string>("birthday");
  const [notifyInAdvance, setNotifyInAdvance] = useState<string>("7");
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const contactName = contacts.find(c => c.id === selectedContact)?.name || "your contact";
      
      if (activeTab === "standard") {
        if (isRecurring) {
          toast.success(`Recurring reminder set for ${contactName} ${recurringFrequency}`);
        } else {
          toast.success(`Reminder set for ${contactName} on ${date ? format(date, "PPP") : "selected date"}`);
        }
      } else {
        toast.success(`${specialDateType} reminder set for ${contactName} with ${notifyInAdvance} days advance notice`);
      }
      
      // Reset form
      setSelectedContact("");
      setDate(undefined);
      setPurpose("");
      setIsRecurring(false);
      setRecurringFrequency("weekly");
      setSpecialDateType("birthday");
      setNotifyInAdvance("7");
      setIsLoading(false);
    }, 1000);
  };

  // Find any special dates for the selected contact
  const selectedContactData = selectedContact ? 
    contacts.find(c => c.id === selectedContact) : null;
    
  const specialDates = selectedContactData?.specialDates || [];

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
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="standard">Standard Reminder</TabsTrigger>
              <TabsTrigger value="special">Special Date</TabsTrigger>
            </TabsList>
            
            <TabsContent value="standard" className="space-y-4 pt-2">
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
            </TabsContent>
            
            <TabsContent value="special" className="space-y-4 pt-2">
              {selectedContact && specialDates.length > 0 ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="specialDate">Existing Special Dates</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a special date" />
                      </SelectTrigger>
                      <SelectContent>
                        {specialDates.map((date, index) => (
                          <SelectItem key={index} value={`${index}`}>
                            {date.type}: {new Date(date.date).toLocaleDateString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Or set a reminder for a new special date below
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-md bg-muted p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <Gift className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium">No special dates found</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Add special dates like birthdays, anniversaries, etc. when editing contacts.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="specialDateType">Type</Label>
                <Select value={specialDateType} onValueChange={setSpecialDateType}>
                  <SelectTrigger id="specialDateType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="birthday">Birthday</SelectItem>
                    <SelectItem value="anniversary">Anniversary</SelectItem>
                    <SelectItem value="important_date">Important Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notifyInAdvance">Notify in advance</Label>
                <Select value={notifyInAdvance} onValueChange={setNotifyInAdvance}>
                  <SelectTrigger id="notifyInAdvance">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">On the day</SelectItem>
                    <SelectItem value="1">1 day before</SelectItem>
                    <SelectItem value="3">3 days before</SelectItem>
                    <SelectItem value="7">1 week before</SelectItem>
                    <SelectItem value="14">2 weeks before</SelectItem>
                    <SelectItem value="30">1 month before</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </Tabs>
          
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
          <Button type="submit" className="w-full" disabled={
            isLoading || 
            !selectedContact || 
            (activeTab === "standard" && !isRecurring && !date)
          }>
            {isLoading ? "Setting reminder..." : "Set Reminder"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default ReminderForm;
