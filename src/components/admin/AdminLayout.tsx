
import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarInset,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { Package, Tag, Truck, Settings, Users, ShoppingBag, BarChart3, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSidebar } from '@/components/ui/sidebar';

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
}

// Define sidebar menu items
const adminMenuItems = [
  {
    title: "Dashboard",
    path: "/admin",
    icon: BarChart3
  },
  {
    title: "Products",
    path: "/admin/products",
    icon: Package
  },
  {
    title: "Offers",
    path: "/admin/offers",
    icon: Tag,
    badge: "New"
  },
  {
    title: "Orders",
    path: "/admin/orders",
    icon: Truck,
    badge: "3"
  },
  {
    title: "Customers",
    path: "/admin/customers",
    icon: Users
  }
];

// Define sidebar secondary menu items
const adminSecondaryMenuItems = [
  {
    title: "Settings",
    path: "/admin/settings",
    icon: Settings
  }
];

const AdminSidebar = () => {
  const location = useLocation();
  const { state } = useSidebar();
  
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2">
          {state === "expanded" ? (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-coffee-medium flex items-center justify-center">
                <ShoppingBag className="h-4 w-4 text-white" />
              </div>
              <h2 className="font-bold">Café Admin</h2>
            </div>
          ) : (
            <div className="h-8 w-8 rounded-full bg-coffee-medium flex items-center justify-center mx-auto">
              <ShoppingBag className="h-4 w-4 text-white" />
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {adminMenuItems.map((item) => (
            <SidebarMenuItem key={item.path}>
              <SidebarMenuButton 
                asChild 
                isActive={location.pathname === item.path}
                tooltip={item.title}
              >
                <Link to={item.path}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
              {item.badge && (
                <Badge variant="default" className="bg-coffee-dark hover:bg-coffee-dark text-white">
                  {item.badge}
                </Badge>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        
        <SidebarMenu className="mt-auto">
          {adminSecondaryMenuItems.map((item) => (
            <SidebarMenuItem key={item.path}>
              <SidebarMenuButton 
                asChild 
                isActive={location.pathname === item.path}
                tooltip={item.title}
              >
                <Link to={item.path}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Logout">
              <Link to="/login">
                <LogOut />
                <span>Logout</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

const AdminLayout = ({ children, title }: AdminLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-gray-100">
        <AdminSidebar />
        
        <SidebarInset>
          <div className="h-16 border-b bg-background flex items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              {title && <h1 className="text-xl font-semibold">{title}</h1>}
            </div>
            <div>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-muted-foreground"
                asChild
              >
                <Link to="/">View Store</Link>
              </Button>
            </div>
          </div>
          <div className="p-4 md:p-6">
            {children}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
