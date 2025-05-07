
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import Dashboard from "@/components/dashboard/Dashboard";
import { useIsMobile } from "@/hooks/use-mobile";

const DashboardPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/auth");
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

  if (!user) {
    return null; // Don't render anything until we've checked auth status
  }

  return (
    <div className="flex min-h-screen">
      {!isMobile && (
        <div className="w-64 hidden md:block">
          <Sidebar />
        </div>
      )}
      <div className="flex-1">
        <Header userEmail={user.email} />
        <div className="container py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user.email.split('@')[0]}</p>
          </div>
          <Dashboard />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
