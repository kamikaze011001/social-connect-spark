
import { ContactType } from "../contacts/ContactCard";

export interface NoteType {
  id: string;
  content: string;
  timestamp: string;
}

export interface ConversationType {
  id: string;
  contactId: string;
  date: string;
  medium: "phone" | "email" | "social" | "in-person" | "other";
  duration?: string;
  summary: string;
  notes: NoteType[];
}

export type ConversationWithContactType = ConversationType & {
  contact: ContactType;
};
