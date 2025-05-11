import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

// Hook to fetch contact statistics
export const useContactStats = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["contact-stats", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
      // Get total contacts count
      const { count: totalContacts, error: contactsError } = await supabase
        .from("contacts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      
      if (contactsError) throw contactsError;
      
      // Get new contacts in last month
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      const { count: newContacts, error: newContactsError } = await supabase
        .from("contacts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", oneMonthAgo.toISOString());
      
      if (newContactsError) throw newContactsError;
      
      return {
        total: totalContacts || 0,
        new: newContacts || 0
      };
    },
    enabled: !!user,
  });
};

// Hook to fetch reminder statistics
export const useReminderStats = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["reminder-stats", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
      // Get upcoming reminders count
      const today = new Date();
      const nextWeekDate = new Date();
      nextWeekDate.setDate(today.getDate() + 7);
      
      const { count: thisWeek, error: thisWeekError } = await supabase
        .from("reminders")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_completed", false)
        .gte("date", today.toISOString().split('T')[0])
        .lt("date", nextWeekDate.toISOString().split('T')[0]);
      
      if (thisWeekError) throw thisWeekError;
      
      const twoWeeks = new Date();
      twoWeeks.setDate(today.getDate() + 14);
      
      const { count: nextWeekCount, error: nextWeekError } = await supabase
        .from("reminders")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_completed", false)
        .gte("date", nextWeekDate.toISOString().split('T')[0])
        .lt("date", twoWeeks.toISOString().split('T')[0]);
      
      if (nextWeekError) throw nextWeekError;
      
      return {
        total: (thisWeek || 0) + (nextWeekCount || 0),
        thisWeek: thisWeek || 0,
        nextWeek: nextWeekCount || 0
      };
    },
    enabled: !!user,
  });
};

// Hook to fetch conversation statistics
export const useConversationStats = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["conversation-stats", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
      // Get total conversations
      const { count: totalConversations, error: conversationsError } = await supabase
        .from("conversations")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      
      if (conversationsError) throw conversationsError;
      
      // Get conversations in last week
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      
      const { count: recentConversations, error: recentError } = await supabase
        .from("conversations")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", lastWeek.toISOString());
      
      if (recentError) throw recentError;
      
      return {
        total: totalConversations || 0,
        recent: recentConversations || 0
      };
    },
    enabled: !!user,
  });
};

// Hook to fetch monthly conversation data for the chart
export const useMonthlyConversationData = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["monthly-conversations", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
      const months = [];
      const today = new Date();
      
      // Generate last 6 months
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(today, i);
        months.push({
          name: format(date, 'MMM'),
          startDate: startOfMonth(date).toISOString(),
          endDate: endOfMonth(date).toISOString()
        });
      }
      
      const result = [];
      
      // Get conversation count for each month
      for (const month of months) {
        const { count, error } = await supabase
          .from("conversations")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("created_at", month.startDate)
          .lte("created_at", month.endDate);
        
        if (error) throw error;
        
        result.push({
          name: month.name,
          count: count || 0
        });
      }
      
      return result;
    },
    enabled: !!user,
  });
};

// Hook to fetch upcoming reminders
export const useUpcomingReminders = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["upcoming-reminders", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
      const today = new Date();
      const inTwoWeeks = new Date();
      inTwoWeeks.setDate(today.getDate() + 14);
      
      const { data, error } = await supabase
        .from("reminders")
        .select(`
          id,
          purpose,
          date,
          time,
          contact_id,
          contacts (
            id,
            name
          )
        `)
        .eq("user_id", user.id)
        .eq("is_completed", false)
        .gte("date", today.toISOString().split('T')[0])
        .lte("date", inTwoWeeks.toISOString().split('T')[0])
        .order("date", { ascending: true })
        .limit(3);
      
      if (error) throw error;
      
      return data.map(reminder => ({
        id: reminder.id,
        contactName: reminder.contacts?.name || "No contact",
        contactId: reminder.contact_id,
        date: formatReminderDate(reminder.date, reminder.time),
        type: reminder.purpose
      }));
    },
    enabled: !!user,
  });
};

// Hook to fetch contacts with nearest past due, uncompleted reminders
export const useNeglectedContacts = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["neglected-contacts-past-due-reminders", user?.id], // Updated queryKey
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      const today = new Date().toISOString().split('T')[0];

      // Get contacts with the most recent past due, non-completed reminders
      const { data, error } = await supabase
        .from("reminders")
        .select(`
          id, 
          date,
          time,
          purpose,
          contact_id,
          contacts (
            id,
            name
          )
        `)
        .eq("user_id", user.id)
        .eq("is_completed", false)
        .lte("date", today) // Reminder date is less than or equal to today (in the past or today)
        .order("date", { ascending: false }) // Most recent past dates first
        .order("time", { ascending: false, nullsFirst: false }) // Most recent past times first
        .limit(2); 

      if (error) {
        console.error("Error fetching contacts with past due reminders:", error);
        throw error;
      }

      return data.map(reminder => ({
        contactId: reminder.contacts?.id,
        contactName: reminder.contacts?.name || "Unknown Contact",
        reminderId: reminder.id,
        reminderDate: reminder.date,
        reminderTime: reminder.time,
        reminderPurpose: reminder.purpose,
        displayDate: formatReminderDate(reminder.date, reminder.time), 
      }));
    },
    enabled: !!user,
  });
};

// Hook to fetch recent activity
export const useRecentActivity = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["recent-activity", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
      // Get recent conversations
      const { data, error } = await supabase
        .from("conversations")
        .select(`
          id,
          medium,
          date,
          created_at,
          contact_id,
          contacts (
            id,
            name
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(2);
      
      if (error) throw error;
      
      return data.map(conversation => ({
        id: conversation.id,
        contactName: conversation.contacts?.name || "Unknown contact",
        action: getMediumAction(conversation.medium),
        date: formatActivityDate(new Date(conversation.created_at))
      }));
    },
    enabled: !!user,
  });
};

// Hook to fetch all conversations
export const useAllConversations = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["all-conversations", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("conversations")
        .select("id, contact_id")
        .eq("user_id", user.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

// Helper functions
const formatReminderDate = (date: string, time: string | null) => {
  if (!date) return "";
  
  const reminderDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (reminderDate.getTime() === today.getTime()) {
    return time ? `Today at ${formatTime(time)}` : "Today";
  } else if (reminderDate.getTime() === tomorrow.getTime()) {
    return time ? `Tomorrow at ${formatTime(time)}` : "Tomorrow";
  } else {
    return format(reminderDate, "MMM d, yyyy") + (time ? ` at ${formatTime(time)}` : "");
  }
};

const formatTime = (time: string) => {
  if (!time) return "";
  try {
    const [hours, minutes] = time.split(":");
    const h = parseInt(hours);
    const period = h >= 12 ? "PM" : "AM";
    const formattedHour = h > 12 ? h - 12 : (h === 0 ? 12 : h);
    return `${formattedHour}:${minutes} ${period}`;
  } catch (e) {
    return time;
  }
};

const formatLastContactedDate = (date: Date) => {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
  return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''} ago`;
};

const formatActivityDate = (date: Date) => {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
};

const getMediumAction = (medium: string) => {
  switch (medium) {
    case "phone":
      return "Called";
    case "email":
      return "Emailed";
    case "social":
      return "Messaged";
    case "in-person":
      return "Met";
    default:
      return "Contacted";
  }
};
