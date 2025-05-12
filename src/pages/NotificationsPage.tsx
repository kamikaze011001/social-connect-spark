import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications, Notification } from '@/hooks/use-notifications';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from "@/components/ui/scroll-area";
import Header from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { BellOff, Calendar, MessageSquare, Bell } from 'lucide-react'; // Import icons
import { cn } from '@/lib/utils'; // Import cn utility

// Helper function to get icon based on notification type
const getNotificationIcon = (type: string): React.ReactNode => {
  switch (type) {
    case 'reminder':
      return <Calendar className="h-4 w-4 mr-2" />;
    case 'conversation':
      return <MessageSquare className="h-4 w-4 mr-2" />;
    default:
      return <Bell className="h-4 w-4 mr-2" />;
  }
};

const NotificationsPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user, isLoading: authLoading } = useAuth();
  const {
    notifications,
    unreadCount,
    isLoading: notificationsLoading,
    markAsRead,
    markAllAsRead,
    isMarkingAsRead,
    isMarkingAllAsRead,
  } = useNotifications();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
    }
  }, [navigate, user, authLoading]);

  const isLoading = authLoading || notificationsLoading;

  if (authLoading) {
    // Show a basic loading state while checking auth
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null; // Don't render if not authenticated
  }

  return (
    <div className="flex min-h-screen">
      {!isMobile && (
        <div className="w-64 hidden md:block">
          <Sidebar />
        </div>
      )}
      <div className="flex-1 flex flex-col">
        <Header userEmail={user.email || ""} />
        <main className="flex-1 overflow-y-auto"> {/* Remove padding from main */}
          <div className="container py-6"> {/* Add container div with padding */}
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Notifications</h1>
              <Button
              variant="outline"
              onClick={() => markAllAsRead()}
              disabled={isMarkingAllAsRead || unreadCount === 0}
            >
              Mark All as Read ({unreadCount})
            </Button>
          </div>

          {isLoading ? (
            // Improved Loading State with Skeletons
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                  <CardContent className="flex justify-between items-center">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-8 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            // Improved Empty State
            <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
              <BellOff className="h-16 w-16 mb-4" />
              <p className="text-lg">No notifications yet.</p>
              <p className="text-sm">We'll let you know when something comes up.</p>
            </div>
          ) : (
            // Display Notifications
            <ScrollArea className="h-[calc(100vh-200px)] pr-4"> {/* Adjust height as needed */}
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={cn(
                      "transition-colors",
                      !notification.is_read && "bg-muted/50 border-primary/20" // Style for unread
                    )}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        {getNotificationIcon(notification.type)}
                        {notification.title}
                      </CardTitle>
                      <CardDescription>{notification.message}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-between items-center">
                      <p className="text-sm text-muted-foreground">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                      {!notification.is_read && ( // Only show button if unread
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          disabled={isMarkingAsRead}
                        >
                          Mark as Read
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
          </div> {/* Close container div */}
        </main>
      </div>
    </div>
  );
};

export default NotificationsPage;
