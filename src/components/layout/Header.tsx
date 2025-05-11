
import { useState, Fragment } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, Menu, Search as SearchIcon, CheckCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications, Notification } from "@/hooks/use-notifications";
import { formatDistanceToNow } from 'date-fns';

interface HeaderProps {
  userEmail?: string;
}

const Header = ({ userEmail = "user@example.com" }: HeaderProps) => {
  const [search, setSearch] = useState("");
  const isMobile = useIsMobile();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead,
    isLoading: notificationsLoading 
  } = useNotifications();
  
  const email = user?.email || userEmail;
  const userInitial = email.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="flex items-center space-x-4">
          {isMobile && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0">
                <Sidebar />
              </SheetContent>
            </Sheet>
          )}
          <Link to="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-brand-300 to-brand-500 flex items-center justify-center">
              <span className="text-white font-semibold">CR</span>
            </div>
            <span className="font-bold text-xl hidden sm:inline-block">ContactRemind</span>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-end space-x-4">
          <div className="relative hidden md:flex items-center">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-[200px] lg:w-[300px] pl-9"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge className="h-5 w-5 absolute -right-0.5 -top-0.5 flex items-center justify-center p-0 text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 md:w-96">
              <DropdownMenuLabel className="flex justify-between items-center">
                <span>Notifications</span>
                {Array.isArray(notifications) && notifications.length > 0 && unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => markAllAsRead()} className="text-xs h-auto py-1 px-2">
                    <CheckCheck className="h-3 w-3 mr-1" />
                    Mark all read
                  </Button>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-80 overflow-auto">
                {notificationsLoading ? (
                  <DropdownMenuItem disabled>Loading notifications...</DropdownMenuItem>
                ) : !Array.isArray(notifications) || notifications.length === 0 ? (
                  <DropdownMenuItem disabled className="text-center py-4">
                    No notifications yet.
                  </DropdownMenuItem>
                ) : (
                  notifications.map((notification: Notification) => (
                    <Fragment key={notification.id}>
                      <DropdownMenuItem
                        className={`cursor-pointer py-2 ${!notification.is_read ? 'font-semibold' : ''}`}
                        onClick={() => {
                          if (!notification.is_read) {
                            markAsRead(notification.id);
                          }
                          if (notification.data?.path) {
                            navigate(notification.data.path);
                          }
                        }}
                      >
                        <div className="flex flex-col space-y-1 w-full">
                          <div className="flex justify-between items-start">
                            <span className={`text-sm ${!notification.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {notification.title}
                            </span>
                            {!notification.is_read && (
                              <div className="h-2 w-2 rounded-full bg-primary mt-1 ml-2 flex-shrink-0"></div>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{notification.message}</p>
                          <span className="text-xs text-muted-foreground/80">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="last:hidden" />
                    </Fragment>
                  ))
                )}
              </div>
              {Array.isArray(notifications) && notifications.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer justify-center text-center">
                    <Link to="/reminders" className="w-full text-sm py-2">View all reminders</Link> 
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative h-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-brand-400 text-white">
                    {userInitial}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="cursor-pointer">
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
