
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://tcbmqlkejoejfrouoqfv.supabase.co";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    // Format dates for database query
    const todayStr = today.toISOString().split("T")[0];
    const tomorrowStr = tomorrow.toISOString().split("T")[0];
    
    console.log(`Checking for reminders between ${todayStr} and ${tomorrowStr}`);
    
    // Get upcoming reminders that are due within the next 24 hours and not completed
    const { data: upcomingReminders, error } = await supabase
      .from("reminders")
      .select(`
        id,
        date,
        time,
        purpose,
        is_completed,
        contacts(name, email),
        user_id
      `)
      .gte("date", todayStr)
      .lte("date", tomorrowStr)
      .eq("is_completed", false);

    if (error) {
      throw new Error(`Error fetching reminders: ${error.message}`);
    }

    console.log(`Found ${upcomingReminders?.length || 0} upcoming reminders`);
    
    // If no reminders, return early
    if (!upcomingReminders || upcomingReminders.length === 0) {
      return new Response(JSON.stringify({ message: "No upcoming reminders found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Process each reminder and send notification
    const results = await Promise.all(
      upcomingReminders.map(async (reminder) => {
        // Get user email from auth.users table
        const { data: userData, error: userError } = await supabase
          .from("auth.users")
          .select("email")
          .eq("id", reminder.user_id)
          .single();
          
        if (userError || !userData?.email) {
          console.error(`Could not find email for user: ${reminder.user_id}`);
          return {
            id: reminder.id,
            status: "error",
            message: "Could not find user email",
          };
        }
        
        // Send email notification
        const contactName = reminder.contacts?.name || "your contact";
        
        try {
          const response = await fetch(`${supabaseUrl}/functions/v1/send-reminder-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              contactName,
              recipientEmail: userData.email,
              reminderDate: reminder.date,
              reminderTime: reminder.time,
              purpose: reminder.purpose,
            }),
          });
          
          if (!response.ok) {
            throw new Error(`Failed to send email: ${await response.text()}`);
          }
          
          return {
            id: reminder.id,
            status: "success",
            contact: contactName,
            email: userData.email,
          };
        } catch (error) {
          console.error(`Error sending notification for reminder ${reminder.id}:`, error);
          return {
            id: reminder.id,
            status: "error",
            message: error.message,
          };
        }
      })
    );
    
    return new Response(JSON.stringify({ 
      message: "Processed upcoming reminders",
      results 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in check-upcoming-reminders function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
