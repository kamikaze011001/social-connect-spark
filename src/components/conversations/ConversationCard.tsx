
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MessageSquare, Phone, Mail, User, Edit, Trash } from "lucide-react";
import { ConversationType, NoteType } from "./ConversationType";
import { ContactType } from "../contacts/ContactCard";
import { format } from "date-fns";

interface ConversationCardProps {
  conversation: ConversationType;
  contact: ContactType;
  onEdit?: (conversation: ConversationType) => void;
  onDelete?: (id: string) => void;
}

const ConversationCard = ({ conversation, contact, onEdit, onDelete }: ConversationCardProps) => {
  const [expandedNotes, setExpandedNotes] = useState(false);
  
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };
  
  const getMediumIcon = (medium: string) => {
    switch (medium) {
      case 'phone':
        return <Phone className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'social':
        return <MessageSquare className="h-4 w-4" />;
      case 'in-person':
        return <User className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };
  
  const getMediumLabel = (medium: string) => {
    switch (medium) {
      case 'phone':
        return 'Phone Call';
      case 'email':
        return 'Email';
      case 'social':
        return 'Social Media';
      case 'in-person':
        return 'In Person';
      default:
        return 'Other';
    }
  };
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PP');
    } catch (error) {
      return dateString;
    }
  };

  return (
    <Card className="mb-4 hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-2">
        <div className="flex justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-brand-300 text-white">{getInitials(contact.name)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">{contact.name}</CardTitle>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <Calendar className="h-3 w-3 mr-1" />
                <span>{formatDate(conversation.date)}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-start space-x-2">
            <Badge variant="outline" className="flex items-center gap-1">
              {getMediumIcon(conversation.medium)}
              <span>{getMediumLabel(conversation.medium)}</span>
            </Badge>
            
            {conversation.duration && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{conversation.duration}</span>
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm">{conversation.summary}</p>
          
          {conversation.notes.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Notes</h4>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setExpandedNotes(!expandedNotes)} 
                  className="text-xs h-7 px-2"
                >
                  {expandedNotes ? "Hide Notes" : `View ${conversation.notes.length} Note${conversation.notes.length > 1 ? "s" : ""}`}
                </Button>
              </div>
              
              {expandedNotes && (
                <div className="space-y-2 pl-3 border-l-2 border-muted">
                  {conversation.notes.map((note: NoteType) => (
                    <div key={note.id} className="text-sm">
                      <p className="text-muted-foreground text-xs">{format(new Date(note.timestamp), 'PP')}</p>
                      <p>{note.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {(onEdit || onDelete) && (
            <div className="flex justify-end gap-2 pt-2">
              {onEdit && (
                <Button variant="ghost" size="sm" onClick={() => onEdit(conversation)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onDelete(conversation.id)}>
                  <Trash className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ConversationCard;
