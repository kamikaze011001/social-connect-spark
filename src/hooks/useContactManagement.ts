import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ContactType } from "@/components/contacts/ContactCard"; // Assuming ContactType is exported from ContactCard
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Types previously in ContactList.tsx
interface ContactGroup {
  groups: {
    name: string;
  };
}

interface SupabaseError {
  message: string;
  // Add other Supabase error properties if needed, e.g., code, details, hint
}

interface FetchedSpecialDate {
  id: string;
  type: string;
  date: string;
  description?: string;
}

export const useContactManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch contacts
  const { data: contacts = [], isLoading: isLoadingContacts } = useQuery({
    queryKey: ["contacts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("contacts")
        .select("*, social_links, contact_groups!inner(groups(id, name)), special_dates(*)")
        .eq("user_id", user.id);
      
      if (error) {
        console.error("Error fetching contacts:", error);
        toast.error("Failed to load contacts");
        return [];
      }
      
      return data.map((contact) => {
        const contactGroups = contact.contact_groups
          ? Array.isArray(contact.contact_groups)
            ? contact.contact_groups.map((group: ContactGroup) => group.groups.name)
            : []
          : [];
          
        return {
          id: contact.id,
          name: contact.name,
          email: contact.email || undefined,
          phone: contact.phone || "",
          lastContacted: contact.last_contacted 
            ? new Date(contact.last_contacted).toLocaleDateString() 
            : undefined,
          groups: contactGroups,
          socialLinks: (() => {
            const rawSocialLinks = contact.social_links;
            let processedSocialLinks: ContactType['socialLinks'] | undefined = undefined;
            if (rawSocialLinks) {
              if (typeof rawSocialLinks === 'string') {
                try {
                  processedSocialLinks = JSON.parse(rawSocialLinks) as ContactType['socialLinks'];
                } catch (parseError) {
                  console.error("Error parsing social_links JSON string:", parseError, rawSocialLinks);
                }
              } else if (typeof rawSocialLinks === 'object' && rawSocialLinks !== null) {
                processedSocialLinks = rawSocialLinks as ContactType['socialLinks'];
              } else {
                console.warn("Unexpected type for social_links:", typeof rawSocialLinks, rawSocialLinks);
              }
            }
            return processedSocialLinks;
          })(),
          specialDates: contact.special_dates 
            ? contact.special_dates.map((sd: FetchedSpecialDate) => ({ 
                id: sd.id,
                type: sd.type, 
                date: sd.date, 
                description: sd.description 
              })) 
            : []
        } as ContactType; // Assert as ContactType
      });
    },
    enabled: !!user,
  });

  // Fetch all groups
  const { data: allGroups = [] } = useQuery({
    queryKey: ["groups", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("groups")
        .select("name") // Only select name
        .eq("user_id", user.id);
      
      if (error) {
        console.error("Error fetching groups:", error);
        toast.error("Failed to load groups");
        return [];
      }
      
      return data.map(group => group.name);
    },
    enabled: !!user,
  });

  // Add contact mutation
  const addContactMutation = useMutation({
    mutationFn: async (newContact: Omit<ContactType, "id" | "lastContacted"> & { lastContacted?: string }) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("contacts")
        .insert({
          name: newContact.name,
          email: newContact.email,
          phone: newContact.phone,
          user_id: user.id,
          last_contacted: newContact.lastContacted ? new Date(newContact.lastContacted).toISOString() : null,
          social_links: newContact.socialLinks 
        })
        .select("id") // Only select id
        .single();
      
      if (error) throw error;

      const contactId = data.id;
      
      if (newContact.groups && newContact.groups.length > 0) {
        for (const groupName of newContact.groups) {
          let groupId;
          const { data: existingGroupsData } = await supabase
            .from("groups")
            .select("id")
            .eq("name", groupName)
            .eq("user_id", user.id)
            .maybeSingle(); // Use maybeSingle to handle null or one row

          if (existingGroupsData) {
            groupId = existingGroupsData.id;
          } else {
            const { data: newGroupData, error: groupError } = await supabase
              .from("groups")
              .insert({ name: groupName, user_id: user.id })
              .select("id")
              .single();
            if (groupError) throw groupError;
            groupId = newGroupData.id;
          }
          
          const { error: assocError } = await supabase
            .from("contact_groups")
            .insert({ contact_id: contactId, group_id: groupId });
          if (assocError) throw assocError;
        }
      }

      if (newContact.specialDates && newContact.specialDates.length > 0) {
        const specialDatesToInsert = newContact.specialDates.map(sd => ({
          contact_id: contactId,
          user_id: user.id,
          type: sd.type,
          date: sd.date,
          description: sd.description
        }));
        const { error: specialDatesError } = await supabase
          .from("special_dates")
          .insert(specialDatesToInsert);
        if (specialDatesError) {
          console.error("Detailed error inserting special dates (add):", JSON.stringify(specialDatesError, null, 2));
          toast.error(`Failed to save special dates: ${specialDatesError.message}`);
          throw specialDatesError;
        }
      }
      return data; // Return the contact id or minimal data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["groups", user?.id] });
      toast.success("Contact added successfully");
    },
    onError: (error: SupabaseError) => {
      console.error("Error adding contact:", error);
      toast.error(error.message || "Failed to add contact");
    }
  });

  // Edit contact mutation
  const editContactMutation = useMutation({
    mutationFn: async (updatedContact: ContactType) => {
      if (!user) throw new Error("User not authenticated");

      const { error: updateError } = await supabase
        .from("contacts")
        .update({
          name: updatedContact.name,
          email: updatedContact.email,
          phone: updatedContact.phone,
          last_contacted: updatedContact.lastContacted ? new Date(updatedContact.lastContacted).toISOString() : null,
          social_links: updatedContact.socialLinks,
          updated_at: new Date().toISOString()
        })
        .eq("id", updatedContact.id);
      
      if (updateError) throw updateError;
      
      // Handle groups update
      const { error: deleteGroupAssocError } = await supabase
        .from("contact_groups")
        .delete()
        .eq("contact_id", updatedContact.id);
      if (deleteGroupAssocError) throw deleteGroupAssocError;
      
      if (updatedContact.groups && updatedContact.groups.length > 0) {
        for (const groupName of updatedContact.groups) {
          let groupId;
          const { data: existingGroupsData } = await supabase
            .from("groups")
            .select("id")
            .eq("name", groupName)
            .eq("user_id", user.id)
            .maybeSingle();

          if (existingGroupsData) {
            groupId = existingGroupsData.id;
          } else {
            const { data: newGroupData, error: groupError } = await supabase
              .from("groups")
              .insert({ name: groupName, user_id: user.id })
              .select("id")
              .single();
            if (groupError) throw groupError;
            groupId = newGroupData.id;
          }
          
          const { error: groupAssocError } = await supabase
            .from("contact_groups")
            .insert({ contact_id: updatedContact.id, group_id: groupId });
          if (groupAssocError) throw groupAssocError;
        }
      }

      // Handle special dates update
      const { error: deleteSpecialDatesError } = await supabase
        .from("special_dates")
        .delete()
        .eq("contact_id", updatedContact.id);
      if (deleteSpecialDatesError) throw deleteSpecialDatesError;

      if (updatedContact.specialDates && updatedContact.specialDates.length > 0) {
        const specialDatesToInsert = updatedContact.specialDates.map(sd => ({
          contact_id: updatedContact.id,
          user_id: user.id,
          type: sd.type,
          date: sd.date,
          description: sd.description
        }));
        const { error: insertSpecialDatesError } = await supabase
          .from("special_dates")
          .insert(specialDatesToInsert);
        
        if (insertSpecialDatesError) {
          console.error("Detailed error inserting special dates (edit):", JSON.stringify(insertSpecialDatesError, null, 2));
          toast.error(`Failed to save special dates: ${insertSpecialDatesError.message}`);
          throw insertSpecialDatesError;
        }
      }
      // Return minimal data or void
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["groups", user?.id] });
      toast.success("Contact updated successfully");
    },
    onError: (error: SupabaseError) => {
      console.error("Error updating contact:", error);
      toast.error(error.message || "Failed to update contact");
    }
  });

  // Delete contact mutation
  const deleteContactMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("contacts")
        .delete()
        .eq("id", id);
      if (error) throw error;
      // return id; // Not strictly necessary to return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts", user?.id] });
      toast.success("Contact deleted");
    },
    onError: (error: SupabaseError) => {
      console.error("Error deleting contact:", error);
      toast.error(error.message || "Failed to delete contact");
    }
  });

  return {
    contacts,
    isLoadingContacts,
    allGroups,
    addContact: addContactMutation.mutate,
    editContact: editContactMutation.mutate,
    deleteContact: deleteContactMutation.mutate,
    isAddingContact: addContactMutation.isPending,
    isEditingContact: editContactMutation.isPending,
    isDeletingContact: deleteContactMutation.isPending,
  };
};
