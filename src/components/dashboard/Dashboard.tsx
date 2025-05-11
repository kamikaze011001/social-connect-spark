import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, MessageSquare, UserCheck, ArrowRight, Clock } from "lucide-react";
import DashboardSkeleton from "./DashboardSkeleton";
import { ReminderActions } from "./ReminderActions";
import { ContactActions } from "./ContactActions";
import { 
  useContactStats, 
  useReminderStats, 
  useConversationStats,
  useMonthlyConversationData,
  useUpcomingReminders,
  useNeglectedContacts,
  useRecentActivity,
  useAllConversations
} from "@/hooks/use-dashboard-data";
import { ContactType } from "../contacts/ContactCard";

interface DashboardProps {
  contacts?: ContactType[];
}

const Dashboard = ({ contacts = [] }: DashboardProps) => {
  const navigate = useNavigate();
  
  // Fetch dashboard data
  const { data: contactStats, isLoading: loadingContacts } = useContactStats();
  const { data: reminderStats, isLoading: loadingReminders } = useReminderStats();
  const { data: conversationStats, isLoading: loadingConversations } = useConversationStats();
  const { data: monthlyData, isLoading: loadingMonthlyData } = useMonthlyConversationData();
  const { data: upcomingReminders, isLoading: loadingUpcomingReminders } = useUpcomingReminders();
  const { data: neglectedContacts, isLoading: loadingNeglectedContacts } = useNeglectedContacts();
  const { data: recentActivity, isLoading: loadingRecentActivity } = useRecentActivity();
  const { data: allConversations, isLoading: loadingAllConversations } = useAllConversations();
  
  const isLoading = 
    loadingContacts || 
    loadingReminders || 
    loadingConversations || 
    loadingMonthlyData ||
    loadingUpcomingReminders ||
    loadingNeglectedContacts ||
    loadingRecentActivity ||
    loadingAllConversations;
  
  if (isLoading) {
    return <DashboardSkeleton />;
  }
  
  return (
    <div className="space-y-4">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contactStats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{contactStats?.new || 0} from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Reminders</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reminderStats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {reminderStats?.thisWeek || 0} this week, {reminderStats?.nextWeek || 0} next week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recent Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversationStats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{conversationStats?.recent || 0} in the last week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Contact Activity Chart */}
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Contact Activity</CardTitle>
          <CardDescription>
            Number of conversations per month
          </CardDescription>
        </CardHeader>
        <CardContent className="px-2">
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" name="Conversations" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Two column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upcoming reminders */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>Upcoming Reminders</CardTitle>
              <Button variant="ghost" size="sm" className="text-sm" onClick={() => navigate('/reminders')}>
                View All
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!upcomingReminders || upcomingReminders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming reminders</p>
            ) : (
              <div className="space-y-4">
                {upcomingReminders.map((reminder) => (
                  <div key={reminder.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="font-medium">{reminder.contactName}</p>
                        <p className="text-sm text-muted-foreground">{reminder.date}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Badge variant="outline">{reminder.type}</Badge>
                      <ReminderActions 
                        reminderId={reminder.id}
                        contactId={reminder.contactId}
                        contactName={reminder.contactName}
                        hasConversationForContact={
                          !!allConversations?.find(conv => conv.contact_id === reminder.contactId)
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Past Due Reminders (formerly Neglected Contacts) */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>Past Due Reminders</CardTitle>
              <Button variant="ghost" size="sm" className="text-sm" onClick={() => navigate('/reminders')}>
                View All
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!neglectedContacts || neglectedContacts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No past due reminders</p>
            ) : (
              <div className="space-y-4">
                {neglectedContacts.map((item) => (
                  <div key={item.reminderId} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-brand-300 text-white">
                          {item.contactName.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{item.contactName}</p>
                        <p className="text-sm text-muted-foreground">{item.displayDate}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Badge variant="outline">{item.reminderPurpose}</Badge>
                      <ReminderActions 
                        reminderId={item.reminderId}
                        contactId={item.contactId}
                        contactName={item.contactName}
                        hasConversationForContact={
                          !!allConversations?.find(conv => conv.contact_id === item.contactId)
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {!recentActivity || recentActivity.length === 0 ? (
            <p className="text-muted-foreground">No recent activity</p>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center">
                  <div className="h-9 w-1 rounded-full bg-primary mr-3"></div>
                  <div>
                    <p className="font-medium">
                      {activity.action} {activity.contactName}
                    </p>
                    <p className="text-sm text-muted-foreground">{activity.date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
