
import { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
  cartCount?: number;
}

const Layout = ({ children, cartCount = 0 }: LayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar cartCount={cartCount} />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
