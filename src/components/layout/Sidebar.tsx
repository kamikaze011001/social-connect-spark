
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  User,
  Calendar,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Users
} from "lucide-react";

interface SidebarNavProps {
  items: {
    href: string;
    title: string;
    icon: React.ReactNode;
  }[];
}

const SidebarNav = ({ items }: SidebarNavProps) => {
  const location = useLocation();

  return (
    <nav className="grid gap-2">
      {items.map((item, index) => {
        const isActive = location.pathname === item.href;
        return (
          <Link
            key={index}
            to={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            {item.icon}
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
};

export function Sidebar() {
  return (
    <div className="h-full flex flex-col bg-sidebar border-r">
      <div className="flex items-center h-14 px-4 border-b">
        <Link to="/dashboard" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-brand-300 to-brand-500 flex items-center justify-center">
            <span className="text-white font-semibold">CR</span>
          </div>
          <span className="font-bold text-xl text-sidebar-foreground">ContactRemind</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-4 px-4">
        <SidebarNav
          items={[
            {
              href: "/dashboard",
              title: "Dashboard",
              icon: <LayoutDashboard className="h-4 w-4" />,
            },
            {
              href: "/contacts",
              title: "Contacts",
              icon: <Users className="h-4 w-4" />,
            },
            {
              href: "/reminders",
              title: "Reminders",
              icon: <Calendar className="h-4 w-4" />,
            },
            {
              href: "/conversations",
              title: "Conversations",
              icon: <MessageSquare className="h-4 w-4" />,
            },
            {
              href: "/profile",
              title: "Profile",
              icon: <User className="h-4 w-4" />,
            },
            {
              href: "/settings",
              title: "Settings",
              icon: <Settings className="h-4 w-4" />,
            },
          ]}
        />
      </div>
    </div>
  );
}
