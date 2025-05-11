import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Plus } from "lucide-react";

interface SpecialDate {
  id: string;
  type: string;
  date: string;
  description?: string;
}

interface SpecialDateInput {
  type: string;
  date: string;
  description: string;
}

interface SpecialDatesFormSectionProps {
  specialDates: SpecialDate[];
  specialDateInput: SpecialDateInput;
  setSpecialDateInput: React.Dispatch<React.SetStateAction<SpecialDateInput>>;
  onAddSpecialDate: () => void;
  onRemoveSpecialDate: (idToRemove: string) => void;
}

const SpecialDatesFormSection = ({
  specialDates,
  specialDateInput,
  setSpecialDateInput,
  onAddSpecialDate,
  onRemoveSpecialDate,
}: SpecialDatesFormSectionProps) => {
  return (
    <div className="space-y-4">
      {specialDates.map((date) => (
        <div key={date.id} className="flex items-center justify-between p-2 border rounded-md bg-muted/50 dark:bg-muted/20">
          <div>
            <p className="font-medium">{date.type.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</p>
            <p className="text-sm text-muted-foreground">{new Date(date.date).toLocaleDateString()}</p>
            {date.description && <p className="text-xs italic">{date.description}</p>}
          </div>
          <Button 
            type="button"
            variant="ghost" 
            size="icon"
            onClick={() => onRemoveSpecialDate(date.id)}
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
          onClick={onAddSpecialDate} 
          disabled={!specialDateInput.date}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-1" /> Add Date
        </Button>
      </div>
    </div>
  );
};

export default SpecialDatesFormSection;
