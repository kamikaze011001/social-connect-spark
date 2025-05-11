/// <reference lib="deno.ns" />
// @deno-types="https://deno.land/x/xhr@0.1.0/mod.d.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts";
// @deno-types="https://deno.land/std@0.168.0/http/server.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @deno-types="https://esm.sh/@supabase/supabase-js@2.39.0/dist/module/index.d.ts"
import { createClient, SupabaseClient, PostgrestError } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// Supabase connection details
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function parseDateTimeSafe(dateStr: string, timeStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  const time = timeStr || "00:00:00";
  try {
    return new Date(`${dateStr}T${time}`);
  } catch (e) {
    console.error(`Error parsing date-time: ${dateStr}T${time}`, e);
    return null;
  }
}

function addInterval(date: Date, frequency: string): Date {
  const newDate = new Date(date);
  switch (frequency?.toLowerCase()) {
    case "daily": newDate.setDate(newDate.getDate() + 1); break;
    case "weekly": newDate.setDate(newDate.getDate() + 7); break;
    case "monthly": newDate.setMonth(newDate.getMonth() + 1); break;
    case "yearly": newDate.setFullYear(newDate.getFullYear() + 1); break;
    default: console.warn(`Unknown frequency: ${frequency}. Not advancing date.`); return date;
  }
  return newDate;
}

interface Reminder {
  id: string;
  date: string;
  time: string | null;
  purpose: string;
  is_recurring?: boolean | null;
  frequency?: string | null;
  user_id: string;
  contact_id?: string | null;
  send_email_notification: boolean; // Added back, NOT NULL DEFAULT FALSE
  contacts?: { name: string; email: string | null } | null;
}

interface SpecialDate {
  id: string;
  date: string;
  description?: string | null;
  type?: string | null;
  user_id: string;
  contact_id?: string | null;
  contacts?: { name: string; email: string | null } | null;
}

interface UpcomingEvent {
  id: string;
  type: 'reminder' | 'special_date';
  userId: string;
  userEmail?: string;
  contactName?: string;
  title: string;
  messageBody: string;
  eventDateTime: Date;
  sendEmailNotificationSetting?: boolean; // For reminders, this will be the direct value
  globalEmailPreference?: boolean | null; // For special dates, or as a fallback if reminder's setting was nullable
  path: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const now = new Date();
    const twentyFourHoursLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    console.log(`Checking for events between ${now.toISOString()} and ${twentyFourHoursLater.toISOString()}`);
    const upcomingEventsToNotify: UpcomingEvent[] = [];

    const { data: activeReminders, error: remindersError } = await supabase
      .from("reminders")
      .select(`
        id, date, time, purpose, is_recurring, frequency, user_id, contact_id, send_email_notification,
        contacts (name, email)
      `)
      .or("is_recurring.eq.true,and(is_recurring.is.false,is_completed.eq.false),and(is_recurring.is.null,is_completed.eq.false)") as { data: Reminder[] | null, error: PostgrestError | null };

    if (remindersError) throw new Error(`Error fetching reminders: ${remindersError.message}`);

    const { data: specialDatesData, error: specialDatesError } = await supabase
      .from("special_dates")
      .select(`
        id, date, description, type, user_id, contact_id,
        contacts (name, email)
      `) as { data: SpecialDate[] | null, error: PostgrestError | null };
      
    if (specialDatesError) throw new Error(`Error fetching special dates: ${specialDatesError.message}`);

    if (activeReminders) {
      for (const reminder of activeReminders) {
        // globalEmailPref is fetched but might not be used if send_email_notification is definitive
        let globalEmailPref: boolean | null = null; 
        if (reminder.user_id) {
          const { data: settings, error: settingsError } = await supabase
            .from('user_settings')
            .select('email_notifications')
            .eq('id', reminder.user_id)
            .single();
          if (settingsError) console.warn(`Could not fetch user_settings for user ${reminder.user_id} (reminder ${reminder.id}): ${settingsError.message}`);
          else if (settings) globalEmailPref = settings.email_notifications;
        }
        const contactName = reminder.contacts?.name || "your contact";

        if (reminder.is_recurring && reminder.frequency) {
          let occurrenceDateTime = parseDateTimeSafe(reminder.date, reminder.time);
          if (!occurrenceDateTime) continue;
          for (let i = 0; i < 366 && occurrenceDateTime && occurrenceDateTime <= twentyFourHoursLater; i++) {
            if (occurrenceDateTime >= now) {
              upcomingEventsToNotify.push({
                id: reminder.id, type: 'reminder', userId: reminder.user_id, contactName,
                title: `Reminder: ${reminder.purpose} with ${contactName}`,
                messageBody: `Your recurring reminder for ${contactName} regarding "${reminder.purpose}" is due.`,
                eventDateTime: new Date(occurrenceDateTime),
                sendEmailNotificationSetting: reminder.send_email_notification, // Pass the direct setting
                globalEmailPreference: globalEmailPref, // Pass for context, though direct setting takes precedence
                path: `/reminders/${reminder.id}`
              });
            }
            const nextOccurrence = addInterval(occurrenceDateTime, reminder.frequency);
            if (nextOccurrence.getTime() === occurrenceDateTime.getTime()) break;
            occurrenceDateTime = nextOccurrence;
          }
        } else {
          const reminderDateTime = parseDateTimeSafe(reminder.date, reminder.time);
          if (reminderDateTime && reminderDateTime >= now && reminderDateTime <= twentyFourHoursLater) {
            upcomingEventsToNotify.push({
              id: reminder.id, type: 'reminder', userId: reminder.user_id, contactName,
              title: `Reminder: ${reminder.purpose} with ${contactName}`,
              messageBody: `Your reminder for ${contactName} regarding "${reminder.purpose}" is scheduled for ${reminder.date}${reminder.time ? ` at ${reminder.time}` : ''}.`,
              eventDateTime: reminderDateTime,
              sendEmailNotificationSetting: reminder.send_email_notification, // Pass the direct setting
              globalEmailPreference: globalEmailPref, // Pass for context
              path: `/reminders/${reminder.id}`
            });
          }
        }
      }
    }

    if (specialDatesData) {
      const currentYear = now.getFullYear();
      const advancePeriods = [
        { days: 30, label: "30 days away", suffix: "30d" },
        { days: 7, label: "1 week away", suffix: "7d" },
        { days: 1, label: "1 day away", suffix: "1d" }
      ];
      for (const sd of specialDatesData) {
        let globalEmailPref: boolean | null = null;
        if (sd.user_id) {
          const { data: settings, error: settingsError } = await supabase
            .from('user_settings').select('email_notifications').eq('id', sd.user_id).single();
          if (settingsError) console.warn(`Could not fetch user_settings for user ${sd.user_id} (special date ${sd.id}): ${settingsError.message}`);
          else if (settings) globalEmailPref = settings.email_notifications;
        }
        const contactName = sd.contacts?.name || "your contact";
        const originalDateParts = sd.date.split('-');
        if (originalDateParts.length !== 3) { console.warn(`Invalid date format for special date ${sd.id}: ${sd.date}`); continue; }
        const originalMonth = parseInt(originalDateParts[1], 10) - 1;
        const originalDay = parseInt(originalDateParts[2], 10);
        let targetEventDate = new Date(currentYear, originalMonth, originalDay);
        targetEventDate.setHours(0,0,0,0);
        const todayMidnight = new Date(now); todayMidnight.setHours(0,0,0,0);
        if (targetEventDate < todayMidnight) {
          targetEventDate = new Date(currentYear + 1, originalMonth, originalDay);
          targetEventDate.setHours(0,0,0,0);
        }
        for (const period of advancePeriods) {
          const notificationTimestamp = targetEventDate.getTime() - period.days * 24 * 60 * 60 * 1000;
          const notificationDate = new Date(notificationTimestamp);
          notificationDate.setHours(0,0,0,0);
          const nowDayStart = new Date(now); nowDayStart.setHours(0,0,0,0);
          if (notificationDate.getTime() === nowDayStart.getTime()) {
            upcomingEventsToNotify.push({
              id: `${sd.id}_adv_${period.suffix}`, type: 'special_date', userId: sd.user_id, contactName,
              title: `${sd.type || 'Special Date'} Approaching: ${contactName}`,
              messageBody: `${contactName}'s ${sd.type || 'special date'}${sd.description ? ` (${sd.description})` : ''} is ${period.label}! (Event on ${targetEventDate.toLocaleDateString()})`,
              eventDateTime: notificationDate, globalEmailPreference: globalEmailPref, path: `/contacts/${sd.contact_id}`
            });
          }
        }
      }
    }
    
    console.log(`Found ${upcomingEventsToNotify.length} total upcoming events to process.`);
    if (upcomingEventsToNotify.length === 0) {
      return new Response(JSON.stringify({ message: "No upcoming events found in the next 24 hours" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = await Promise.all(
      upcomingEventsToNotify.map(async (event) => {
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('get_user_email_by_id', { user_id_input: event.userId })
          .maybeSingle();

        let userData: { email: string | null } | null = null;
        const userError: PostgrestError | null = rpcError;

        if (!rpcError && rpcData) {
          userData = { email: rpcData.email };
        } else if (!rpcError && !rpcData) {
          userData = null; 
        }
        
        if (userError) {
          console.error(`Error fetching email via RPC for user: ${event.userId} (event ${event.id}):`, userError);
        } else if (!userData?.email) {
          console.error(`Email not found or is empty via RPC for user: ${event.userId} (event ${event.id}). UserData:`, userData);
        }
        event.userEmail = userData?.email ?? undefined;

        let attemptEmail = false;
        if (event.type === 'reminder') {
          // Since send_email_notification is NOT NULL DEFAULT FALSE, it will always be true or false.
          attemptEmail = event.sendEmailNotificationSetting === true;
        } else { // Special Date advance notification
          attemptEmail = event.globalEmailPreference === true;
        }

        let emailSent = false; let inAppNotificationCreated = false;
        if (attemptEmail && event.userEmail) {
          try {
            const emailPayload = {
              recipientEmail: event.userEmail, contactName: event.contactName,
              reminderDate: event.eventDateTime.toISOString().split("T")[0],
              reminderTime: event.eventDateTime.toTimeString().split(" ")[0].substring(0,5),
              purpose: event.title,
            };
            console.log(`Attempting to send email for event ${event.id} to ${event.userEmail}`, emailPayload);
            const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-reminder-email`, {
              method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${supabaseServiceKey}` },
              body: JSON.stringify(emailPayload),
            });
            if (!emailResponse.ok) console.error(`Failed to send email for event ${event.id}: ${await emailResponse.text()}`);
            else { emailSent = true; console.log(`Email sent successfully for event ${event.id}`); }
          } catch (emailError) { console.error(`Error sending email notification for event ${event.id}:`, emailError); }
        } else if (attemptEmail && !event.userEmail) {
          console.warn(`Wanted to send email for event ${event.id}, but user email was not found.`);
        }

        try {
          const { error: notificationError } = await supabase.from("notifications").insert({
            user_id: event.userId,
            reminder_id: event.type === 'reminder' ? event.id : null,
            type: event.type === 'reminder' ? "reminder_due" : "special_date_advance",
            title: event.title, message: event.messageBody,
            data: { path: event.path, original_event_id: event.type === 'special_date' ? event.id.split('_adv_')[0] : null },
          });
          if (notificationError) console.error(`Failed to create in-app notification for event ${event.id}:`, notificationError);
          else inAppNotificationCreated = true;
        } catch (inAppError) { console.error(`Error creating in-app notification for event ${event.id}:`, inAppError); }
        
        let status = "error"; let message = "";
        if (attemptEmail) {
          if (emailSent && inAppNotificationCreated) { status = "success"; message = "Email and in-app notification processed."; }
          else if (emailSent) { status = "partial_success"; message = "Email sent, but failed to create in-app notification."; }
          else if (inAppNotificationCreated) { status = "partial_success"; message = "In-app notification created, but failed to send email."; }
          else { message = "Failed to send email and create in-app notification."; }
        } else {
          if (inAppNotificationCreated) { status = "success_no_email"; message = "In-app notification created. Email not requested."; }
          else { message = "Failed to create in-app notification. Email not requested."; }
        }
        return { id: event.id, type: event.type, status, message, contact: event.contactName, processed_at: new Date().toISOString() };
      })
    );
    return new Response(JSON.stringify({ message: "Processed upcoming events", results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    console.error("Error in check-upcoming-events function:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
