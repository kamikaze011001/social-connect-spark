
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="w-20 h-20 rounded-full bg-gradient-to-r from-brand-300 to-brand-500 flex items-center justify-center mb-6">
        <span className="text-white font-bold text-3xl">404</span>
      </div>
      <h1 className="text-4xl font-bold mb-2">Page not found</h1>
      <p className="text-xl text-muted-foreground mb-6">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Button asChild>
        <Link to="/dashboard">Return to Dashboard</Link>
      </Button>
    </div>
  );
};

export default NotFound;
