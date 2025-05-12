import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ShoppingBag, Menu, X, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { getCartItems } from '@/services/cartService';

interface NavbarProps {
  cartCount?: number;
}

const Navbar = ({ cartCount = 0 }: NavbarProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [dynamicCartCount, setDynamicCartCount] = useState(cartCount);
  const { currentUser, isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch cart items when component mounts or auth state changes
  useEffect(() => {
    const fetchCartItems = async () => {
      if (isAuthenticated) {
        try {
          const items = await getCartItems();
          const count = items.reduce((sum: number, item: any) => sum + item.quantity, 0);
          setDynamicCartCount(count);
        } catch (error) {
          console.error("Error fetching cart items:", error);
        }
      } else {
        setDynamicCartCount(0);
      }
    };

    fetchCartItems();
  }, [isAuthenticated]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out."
      });
      navigate('/');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Check scroll position to change navbar style
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Always use white background and shadow
  const navbarClasses = `fixed w-full z-30 transition-all duration-300 bg-white shadow-md py-2`;

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Menu', path: '/menu' },
    { label: 'Loyalty', path: '/loyalty' },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' },
  ];

  // Add dynamic auth-specific navigation items
  const authNavItems = isAuthenticated
    ? [
        { label: 'My Orders', path: '/my-orders' },
        // { label: 'Track Order', path: '/track-order' }
      ]
    : [];

  // Combine all nav items
  const allNavItems = [...navItems, ...authNavItems];

  // Determine text color based on scroll state
  const textColorClass = 'text-coffee-dark';
  const hoverColorClass = 'hover:text-coffee-medium';

  // Update cart button styling to be visible regardless of scroll state
  const cartButtonClass = "text-coffee-dark border-coffee-dark hover:bg-coffee-light/20";

  return (
    <nav className={navbarClasses}>
      <div className="container mx-auto px-4 flex justify-between items-center max-w-7xl">
        <Link to="/" className="flex items-center space-x-2">
          <div className={`${isScrolled ? 'bg-coffee-dark' : 'bg-coffee-dark'} rounded-full p-1`}>
            <ShoppingBag size={24} className="text-white" />
          </div>
          <span className={`font-bold text-xl ${textColorClass}`}>Café Armourié</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <div className="flex items-center space-x-4">
            {allNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`${textColorClass} ${hoverColorClass} transition-colors font-medium`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <Link to="/cart">
              <Button 
                variant="outline" 
                size="sm"
                className={`relative ${cartButtonClass} border-2`}
              >
                <ShoppingBag className="h-5 w-5" />
                {dynamicCartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
                    {dynamicCartCount}
                  </span>
                )}
              </Button>
            </Link>
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className={`flex items-center space-x-1 ${textColorClass} hover:bg-opacity-20`}
                  onClick={() => navigate('/my-orders')}
                >
                  <User className="h-4 w-4" />
                  <span>{currentUser?.displayName || 'Account'}</span>
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  className={`${isScrolled ? 'bg-coffee-dark hover:bg-coffee-medium' : 'bg-white text-coffee-dark hover:bg-gray-100'}`}
                  onClick={handleSignOut}
                >
                  Logout
                </Button>
              </div>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className={`${textColorClass} hover:bg-opacity-20`}
                  onClick={() => navigate('/login')}
                >
                  Login
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  className={`${isScrolled ? 'bg-coffee-dark hover:bg-coffee-medium' : 'bg-white text-coffee-dark hover:bg-gray-100'}`}
                  onClick={() => navigate('/signup')}
                >
                  Sign up
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Navigation Trigger */}
        <div className="flex items-center space-x-2 md:hidden">
          <Link to="/cart">
            <Button 
              variant="outline" 
              size="sm"
              className={`relative ${cartButtonClass} border-2`}
            >
              <ShoppingBag className="h-5 w-5" />
              {dynamicCartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
                  {dynamicCartCount}
                </span>
              )}
            </Button>
          </Link>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className={textColorClass}
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader className="mb-6">
                <SheetTitle className="text-coffee-dark">Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col space-y-4">
                {allNavItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="text-coffee-dark hover:text-coffee-medium transition-colors py-2 border-b border-gray-100"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                
                {isAuthenticated ? (
                  <>
                    <div className="pt-4">
                      <p className="text-sm text-gray-500 mb-2">Signed in as:</p>
                      <p className="font-medium">{currentUser?.displayName || currentUser?.email}</p>
                    </div>
                    <Button 
                      variant="default" 
                      className="w-full bg-coffee-dark hover:bg-coffee-medium text-white mt-4"
                      onClick={handleSignOut}
                    >
                      Logout
                    </Button>
                  </>
                ) : (
                  <div className="flex flex-col space-y-2 pt-4">
                    <Button 
                      variant="outline" 
                      className="w-full text-coffee-dark border-coffee-dark hover:bg-coffee-light/20"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        navigate('/login');
                      }}
                    >
                      Login
                    </Button>
                    <Button 
                      variant="default" 
                      className="w-full bg-coffee-dark hover:bg-coffee-medium text-white"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        navigate('/signup');
                      }}
                    >
                      Sign up
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
