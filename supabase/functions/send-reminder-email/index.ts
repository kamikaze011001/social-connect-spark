
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReminderEmailRequest {
  contactName: string;
  recipientEmail: string;
  reminderDate: string;
  reminderTime: string | null;
  purpose: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contactName, recipientEmail, reminderDate, reminderTime, purpose }: ReminderEmailRequest = await req.json();

    const timeInfo = reminderTime ? `at ${reminderTime}` : "";
    
    const emailResponse = await resend.emails.send({
      from: "ContactRemind <onboarding@resend.dev>",
      to: [recipientEmail],
      subject: `Reminder: Connect with ${contactName}`,
      html: `
        <h1>Reminder: Connect with ${contactName}</h1>
        <p>This is a reminder that you have scheduled to connect with ${contactName} on ${reminderDate} ${timeInfo}.</p>
        <p><strong>Purpose:</strong> ${purpose}</p>
        <p>Don't forget to update your conversation history after connecting!</p>
        <hr />
        <p style="color: #666; font-size: 12px;">This email was sent from your ContactRemind application.</p>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-reminder-email function:", error);
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
