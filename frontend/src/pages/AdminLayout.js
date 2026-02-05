import { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from '../components/AdminSidebar';
import { Toaster } from '../components/ui/sonner';
import { Menu } from 'lucide-react';
import { Button } from '../components/ui/button';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Stabilize the callback to prevent unnecessary re-renders
  const handleCloseSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);
  
  const handleOpenSidebar = useCallback(() => {
    setSidebarOpen(true);
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Mobile Overlay - z-40, below sidebar */}
      <div 
        className={`
          fixed inset-0 bg-black/50 z-40 md:hidden
          transition-opacity duration-300 ease-in-out
          ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        onClick={handleCloseSidebar}
        aria-hidden={!sidebarOpen}
      />
      
      {/* Sidebar Container - z-50, ABOVE overlay */}
      <div 
        className={`
          fixed md:static inset-y-0 left-0 z-50
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        style={{ zIndex: 50 }}
      >
        <AdminSidebar onClose={handleCloseSidebar} />
      </div>
      
      {/* Main Content Area */}
      <main className="flex-1 w-full min-w-0 overflow-x-hidden">
        {/* Mobile Header with Hamburger */}
        <div className="md:hidden sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenSidebar}
            className="p-2"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </Button>
          <span className="font-outfit font-semibold text-slate-900">SPCET Lost & Found</span>
        </div>
        
        {/* Content */}
        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
      
      <Toaster position="top-right" />
    </div>
  );
};

export default AdminLayout;
