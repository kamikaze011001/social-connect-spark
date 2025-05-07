
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Calendar, MessageSquare, UserCheck, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ContactType } from "../contacts/ContactCard";

// Sample data for the dashboard
const contactsData = [
  { name: "Jan", count: 15 },
  { name: "Feb", count: 8 },
  { name: "Mar", count: 22 },
  { name: "Apr", count: 13 },
  { name: "May", count: 18 },
  { name: "Jun", count: 12 },
];

const upcomingReminders = [
  { id: "1", contactName: "Jane Smith", date: "Tomorrow at 10:00 AM", type: "Call" },
  { id: "2", contactName: "John Doe", date: "May 10, 2025", type: "Birthday" },
  { id: "3", contactName: "Alex Johnson", date: "May 15, 2025", type: "Follow-up" },
];

const neglectedContacts = [
  { id: "1", name: "Michael Brown", email: "michael@example.com", lastContacted: "3 months ago" },
  { id: "2", name: "Sarah Wilson", email: "sarah@example.com", lastContacted: "2 months ago" },
];

const recentActivity = [
  { id: "1", contactName: "Jane Smith", action: "Called", date: "2 days ago" },
  { id: "2", contactName: "John Doe", action: "Emailed", date: "5 days ago" },
];

interface DashboardProps {
  contacts?: ContactType[];
}

const Dashboard = ({ contacts = [] }: DashboardProps) => {
  const navigate = useNavigate();
  
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
            <div className="text-2xl font-bold">{contacts.length || 25}</div>
            <p className="text-xs text-muted-foreground">
              +5 from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Reminders</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              3 this week, 5 next week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recent Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              +3 from last week
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
              <BarChart data={contactsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
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
            {upcomingReminders.length === 0 ? (
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
                    <Badge variant="outline">{reminder.type}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Neglected contacts */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>Neglected Contacts</CardTitle>
              <Button variant="ghost" size="sm" className="text-sm" onClick={() => navigate('/contacts')}>
                View All
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {neglectedContacts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No neglected contacts</p>
            ) : (
              <div className="space-y-4">
                {neglectedContacts.map((contact) => (
                  <div key={contact.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-brand-300 text-white">
                          {contact.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{contact.name}</p>
                        <p className="text-sm text-muted-foreground">{contact.lastContacted}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">Reach Out</Button>
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
          {recentActivity.length === 0 ? (
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
