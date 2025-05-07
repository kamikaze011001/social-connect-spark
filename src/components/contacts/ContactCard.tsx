
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  User, Phone, Mail, Calendar, MoreVertical, MessageSquare, 
  Edit, Trash, Clock, Linkedin, Twitter, Instagram, Facebook
} from "lucide-react";

export interface ContactType {
  id: string;
  name: string;
  email: string;
  phone?: string;
  lastContacted?: string;
  imageUrl?: string;
  groups?: string[];
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    instagram?: string;
    facebook?: string;
  };
  specialDates?: {
    type: string;
    date: string;
    description?: string;
  }[];
}

interface ContactCardProps {
  contact: ContactType;
  onEdit: (contact: ContactType) => void;
  onDelete: (id: string) => void;
  onAddReminder: (contact: ContactType) => void;
  onAddConversation: (contact: ContactType) => void;
}

const ContactCard = ({ 
  contact, 
  onEdit, 
  onDelete, 
  onAddReminder,
  onAddConversation
}: ContactCardProps) => {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'linkedin':
        return <Linkedin className="h-4 w-4" />;
      case 'twitter':
        return <Twitter className="h-4 w-4" />;
      case 'instagram':
        return <Instagram className="h-4 w-4" />;
      case 'facebook':
        return <Facebook className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <Card className="h-full hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              {contact.imageUrl && <AvatarImage src={contact.imageUrl} alt={contact.name} />}
              <AvatarFallback className="bg-brand-300 text-white">{getInitials(contact.name)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{contact.name}</CardTitle>
              {contact.groups && contact.groups.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {contact.groups.map((group) => (
                    <Badge key={group} variant="outline" className="text-xs">
                      {group}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(contact)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddReminder(contact)}>
                <Calendar className="mr-2 h-4 w-4" />
                Set Reminder
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddConversation(contact)}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Add Conversation
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(contact.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-2 text-sm">
          <div className="flex items-center text-muted-foreground">
            <Mail className="h-4 w-4 mr-2" />
            <span>{contact.email}</span>
          </div>
          {contact.phone && (
            <div className="flex items-center text-muted-foreground">
              <Phone className="h-4 w-4 mr-2" />
              <span>{contact.phone}</span>
            </div>
          )}
          {contact.lastContacted && (
            <div className="flex items-center text-muted-foreground">
              <Clock className="h-4 w-4 mr-2" />
              <span>Last contacted {contact.lastContacted}</span>
            </div>
          )}
          {contact.socialLinks && Object.entries(contact.socialLinks).length > 0 && (
            <div className="flex items-center space-x-2 mt-2">
              {Object.entries(contact.socialLinks).map(([platform, url]) => url && (
                <a 
                  key={platform} 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {getSocialIcon(platform)}
                </a>
              ))}
            </div>
          )}
          {contact.specialDates && contact.specialDates.length > 0 && (
            <div className="mt-2">
              {contact.specialDates.map((specialDate, index) => (
                <div key={index} className="flex items-center text-muted-foreground mt-1">
                  <Calendar className="h-4 w-4 mr-2 text-primary" />
                  <span>{specialDate.type}: {new Date(specialDate.date).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-1">
        <div className="flex space-x-2 w-full">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => onAddReminder(contact)}>
            <Calendar className="h-4 w-4 mr-2" />
            <span>Remind</span>
          </Button>
          <Button variant="outline" size="sm" className="flex-1" onClick={() => onAddConversation(contact)}>
            <MessageSquare className="h-4 w-4 mr-2" />
            <span>Chat</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ContactCard;
