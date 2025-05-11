import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

interface GroupsFormSectionProps {
  groups: string[];
  groupInput: string;
  setGroupInput: React.Dispatch<React.SetStateAction<string>>;
  onAddGroup: (e: React.KeyboardEvent<HTMLInputElement>) => void; // Corrected event type
  onRemoveGroup: (group: string) => void;
  existingGroups: string[];
  onGroupSuggestionClick: (group: string) => void;
  error?: string;
}

const GroupsFormSection = ({
  groups,
  groupInput,
  setGroupInput,
  onAddGroup,
  onRemoveGroup,
  existingGroups,
  onGroupSuggestionClick,
  error,
}: GroupsFormSectionProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="groups">Groups *</Label>
      <div className="flex flex-wrap gap-1 mb-2">
        {groups.map((group) => (
          <Badge key={group} variant="secondary" className="text-sm py-1">
            {group}
            <button 
              type="button"
              onClick={() => onRemoveGroup(group)}
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
        onKeyDown={onAddGroup}
        placeholder="Add a group (press Enter)"
      />
      <p className="text-xs text-muted-foreground mt-1">Press Enter after typing to add a group.</p>
      {error && (
        <p className="text-destructive text-sm">{error}</p>
      )}
      
      {existingGroups.length > 0 && groupInput === "" && groups.length === 0 && (
        <div className="mt-2">
          <p className="text-sm text-muted-foreground mb-1">Suggestions:</p>
          <div className="flex flex-wrap gap-1">
            {existingGroups.map((group) => (
              <Badge 
                key={group} 
                variant="outline" 
                className="text-sm cursor-pointer hover:bg-secondary"
                onClick={() => onGroupSuggestionClick(group)}
              >
                {group}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupsFormSection;
