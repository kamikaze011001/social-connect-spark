
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, Menu, Search as SearchIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  userEmail?: string;
}

const Header = ({ userEmail = "user@example.com" }: HeaderProps) => {
  const [search, setSearch] = useState("");
  const isMobile = useIsMobile();
  
  const handleLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem("user");
    // Redirect to login page
    window.location.href = "/auth";
  };

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
                <Badge className="h-5 w-5 absolute -right-0.5 -top-0.5 flex items-center justify-center p-0 text-xs">
                  3
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-80 overflow-auto">
                <DropdownMenuItem className="cursor-pointer py-2">
                  <div className="flex flex-col space-y-1">
                    <span className="font-medium">Reminder: Call Jane Smith</span>
                    <span className="text-xs text-muted-foreground">Today at 10:00 AM</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer py-2">
                  <div className="flex flex-col space-y-1">
                    <span className="font-medium">John Doe's Birthday</span>
                    <span className="text-xs text-muted-foreground">Tomorrow</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer py-2">
                  <div className="flex flex-col space-y-1">
                    <span className="font-medium">Follow-up with Alex Johnson</span>
                    <span className="text-xs text-muted-foreground">2 days ago</span>
                  </div>
                </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="cursor-pointer justify-center text-center">
                <Link to="/reminders" className="w-full">View all notifications</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative h-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-brand-400 text-white">
                    {userEmail.charAt(0).toUpperCase()}
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
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
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
