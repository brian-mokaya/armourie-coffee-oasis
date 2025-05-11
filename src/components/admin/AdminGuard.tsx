
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface AdminGuardProps {
  children: React.ReactNode;
}

const AdminGuard = ({ children }: AdminGuardProps) => {
  const { isAdmin, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      // Detailed logging to help debug admin access
      console.log("AdminGuard: isAuthenticated =", isAuthenticated, "isAdmin =", isAdmin);
      
      if (!isAuthenticated) {
        console.log("AdminGuard: Redirecting to login because user is not authenticated");
        navigate('/login');
      } else if (!isAdmin) {
        console.log("AdminGuard: Redirecting to home because user is not an admin");
        navigate('/');
      }
    }
  }, [isAdmin, isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-coffee-dark" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  // Only render children if user is authenticated and is an admin
  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return <>{children}</>;
};

export default AdminGuard;
