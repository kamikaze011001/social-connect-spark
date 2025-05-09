
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Bell, Clock, Globe, Moon, Palette, Save, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface UserSettings {
  id: string;
  email_notifications: boolean | null;
  theme: string | null;
  reminder_advance_notice: number | null;
  timezone: string | null;
}

const SettingsPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user, isLoading: authLoading } = useAuth();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [theme, setTheme] = useState<string>("light");
  const [reminderAdvanceNotice, setReminderAdvanceNotice] = useState<number>(24);
  const [timezone, setTimezone] = useState<string>("UTC");
  const queryClient = useQueryClient();

  const timezones = [
    "UTC",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Asia/Tokyo",
    "Asia/Shanghai",
    "Australia/Sydney",
    "Pacific/Auckland"
  ];

  const reminderOptions = [
    { value: 6, label: "6 hours before" },
    { value: 12, label: "12 hours before" },
    { value: 24, label: "1 day before" },
    { value: 48, label: "2 days before" },
    { value: 72, label: "3 days before" },
    { value: 168, label: "1 week before" }
  ];

  // Fetch user settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["userSettings"],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("id", user.id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No settings found, need to create default settings
          await createDefaultSettings();
          return null;
        }
        throw error;
      }
      
      return data as UserSettings;
    },
    enabled: !!user,
    onSuccess: (data) => {
      if (data) {
        setEmailNotifications(data.email_notifications ?? true);
        setTheme(data.theme ?? "light");
        setReminderAdvanceNotice(data.reminder_advance_notice ?? 24);
        setTimezone(data.timezone ?? "UTC");
      }
    },
    onError: (error) => {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load settings");
    }
  });

  // Create default settings
  const createDefaultSettings = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from("user_settings")
        .insert({
          id: user.id,
          email_notifications: true,
          theme: "light",
          reminder_advance_notice: 24,
          timezone: "UTC"
        });
      
      if (error) throw error;
      
      // Refetch settings
      queryClient.invalidateQueries({ queryKey: ["userSettings"] });
    } catch (error) {
      console.error("Error creating settings:", error);
      toast.error("Failed to create settings");
    }
  };

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
      const { error } = await supabase
        .from("user_settings")
        .update({
          email_notifications: emailNotifications,
          theme: theme,
          reminder_advance_notice: reminderAdvanceNotice,
          timezone: timezone,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id);
      
      if (error) throw error;
      
      return {
        email_notifications: emailNotifications,
        theme,
        reminder_advance_notice: reminderAdvanceNotice,
        timezone
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userSettings"] });
      toast.success("Settings saved successfully");
    },
    onError: (error: any) => {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    }
  });

  const handleSaveSettings = () => {
    saveSettingsMutation.mutate();
  };

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate("/auth");
    }
  }, [navigate, user, authLoading]);

  if (authLoading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      {!isMobile && (
        <div className="w-64 hidden md:block">
          <Sidebar />
        </div>
      )}
      <div className="flex-1">
        <Header userEmail={user.email || ""} />
        <div className="container py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold">Settings</h1>
            <p className="text-muted-foreground">Manage your application preferences</p>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Configure how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <Label htmlFor="email-notifications" className="font-medium">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive email alerts for upcoming reminders
                      </p>
                    </div>
                  </div>
                  <Switch 
                    id="email-notifications" 
                    checked={emailNotifications} 
                    onCheckedChange={setEmailNotifications} 
                  />
                </div>
                
                <div className="flex items-start space-x-4">
                  <Clock className="h-5 w-5 text-muted-foreground mt-1" />
                  <div className="grid w-full gap-1.5">
                    <Label htmlFor="reminder-advance">Reminder Advance Notice</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      How far in advance should we notify you about upcoming reminders
                    </p>
                    <Select 
                      value={String(reminderAdvanceNotice)} 
                      onValueChange={(value) => setReminderAdvanceNotice(Number(value))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select how far in advance" />
                      </SelectTrigger>
                      <SelectContent>
                        {reminderOptions.map(option => (
                          <SelectItem key={option.value} value={String(option.value)}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>Customize your application experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start space-x-4">
                  <Palette className="h-5 w-5 text-muted-foreground mt-1" />
                  <div className="grid w-full gap-1.5">
                    <Label htmlFor="theme">Theme</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Choose your preferred visual theme
                    </p>
                    <Select value={theme} onValueChange={setTheme}>
                      <SelectTrigger id="theme" className="w-full">
                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <Globe className="h-5 w-5 text-muted-foreground mt-1" />
                  <div className="grid w-full gap-1.5">
                    <Label htmlFor="timezone">Timezone</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Choose your timezone for accurate reminder times
                    </p>
                    <Select value={timezone} onValueChange={setTimezone}>
                      <SelectTrigger id="timezone" className="w-full">
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent className="max-h-80 overflow-y-auto">
                        {timezones.map((tz) => (
                          <SelectItem key={tz} value={tz}>
                            {tz.replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Button 
              onClick={handleSaveSettings} 
              disabled={saveSettingsMutation.isPending} 
              className="w-full max-w-xs ml-auto"
            >
              {saveSettingsMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
