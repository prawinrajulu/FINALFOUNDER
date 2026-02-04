import { useState, useEffect, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { itemsAPI } from '../services/api';
import { 
  Home, Search, Package, ClipboardList, User, LogOut, Megaphone,
  AlertTriangle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';

/**
 * Student Navigation with:
 * - Real-time notification badges for Lost/Found items
 * - Logout confirmation dialog
 */

const StudentNav = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [itemCounts, setItemCounts] = useState({ lost: 0, found: 0 });
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Fetch item counts
  const fetchItemCounts = useCallback(async () => {
    try {
      const response = await itemsAPI.getPublicItems();
      const items = response.data || [];
      const lost = items.filter(item => item.item_type === 'lost').length;
      const found = items.filter(item => item.item_type === 'found').length;
      setItemCounts({ lost, found });
    } catch (error) {
      console.error('Failed to fetch item counts');
    }
  }, []);

  useEffect(() => {
    fetchItemCounts();
    // Refresh every 30 seconds
    const interval = setInterval(fetchItemCounts, 30000);
    return () => clearInterval(interval);
  }, [fetchItemCounts]);

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleLogoutConfirm = () => {
    setLoggingOut(true);
    setTimeout(() => {
      logout();
      navigate('/');
    }, 500);
  };

  const navItems = [
    { to: '/student', icon: Home, label: 'Home', exact: true },
    { to: '/feed', icon: Megaphone, label: 'Campus Feed' },
    { to: '/student/lost-items', icon: Search, label: 'Lost Items', count: itemCounts.lost, color: 'orange' },
    { to: '/student/found-items', icon: Package, label: 'Found Items', count: itemCounts.found, color: 'emerald' },
    { to: '/student/my-items', icon: ClipboardList, label: 'My Items' },
    { to: '/student/profile', icon: User, label: 'Profile' },
  ];

  return (
    <>
      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Confirm Logout
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to logout? You will need to login again to access your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowLogoutDialog(false)}
              disabled={loggingOut}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogoutConfirm}
              disabled={loggingOut}
              className="bg-red-600 hover:bg-red-700"
            >
              {loggingOut ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Logging out...
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4 mr-2" />
                  Yes, Logout
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Navigation items are used by both mobile and desktop nav */}
      {navItems}
    </>
  );
};

export const StudentMobileNav = () => {
  const [itemCounts, setItemCounts] = useState({ lost: 0, found: 0 });

  const fetchItemCounts = useCallback(async () => {
    try {
      const response = await itemsAPI.getPublicItems();
      const items = response.data || [];
      const lost = items.filter(item => item.item_type === 'lost').length;
      const found = items.filter(item => item.item_type === 'found').length;
      setItemCounts({ lost, found });
    } catch (error) {
      console.error('Failed to fetch item counts');
    }
  }, []);

  useEffect(() => {
    fetchItemCounts();
    const interval = setInterval(fetchItemCounts, 30000);
    return () => clearInterval(interval);
  }, [fetchItemCounts]);

  const navItems = [
    { to: '/student', icon: Home, label: 'Home', exact: true },
    { to: '/feed', icon: Megaphone, label: 'Feed' },
    { to: '/student/lost-items', icon: Search, label: 'Lost', count: itemCounts.lost, color: 'orange' },
    { to: '/student/found-items', icon: Package, label: 'Found', count: itemCounts.found, color: 'emerald' },
    { to: '/student/my-items', icon: ClipboardList, label: 'My Items' },
    { to: '/student/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="mobile-nav md:hidden" data-testid="student-mobile-nav">
      <div className="flex justify-around">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) =>
              `mobile-nav-item relative ${isActive ? 'active' : ''}`
            }
            data-testid={`mobile-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <div className="relative">
              <item.icon className="w-5 h-5 mb-1" />
              {/* Real-time count badge */}
              {item.count > 0 && (
                <span className={`absolute -top-2 -right-2 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white rounded-full ${
                  item.color === 'orange' ? 'bg-orange-500' : 'bg-emerald-500'
                }`}>
                  {item.count > 99 ? '99+' : item.count}
                </span>
              )}
            </div>
            <span className="text-xs">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export const StudentDesktopNav = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [itemCounts, setItemCounts] = useState({ lost: 0, found: 0 });
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const fetchItemCounts = useCallback(async () => {
    try {
      const response = await itemsAPI.getPublicItems();
      const items = response.data || [];
      const lost = items.filter(item => item.item_type === 'lost').length;
      const found = items.filter(item => item.item_type === 'found').length;
      setItemCounts({ lost, found });
    } catch (error) {
      console.error('Failed to fetch item counts');
    }
  }, []);

  useEffect(() => {
    fetchItemCounts();
    const interval = setInterval(fetchItemCounts, 30000);
    return () => clearInterval(interval);
  }, [fetchItemCounts]);

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleLogoutConfirm = () => {
    setLoggingOut(true);
    setTimeout(() => {
      logout();
      navigate('/');
    }, 500);
  };

  const navItems = [
    { to: '/student', icon: Home, label: 'Home', exact: true },
    { to: '/feed', icon: Megaphone, label: 'Campus Feed' },
    { to: '/student/lost-items', icon: Search, label: 'Lost Items', count: itemCounts.lost, color: 'orange' },
    { to: '/student/found-items', icon: Package, label: 'Found Items', count: itemCounts.found, color: 'emerald' },
    { to: '/student/my-items', icon: ClipboardList, label: 'My Items' },
    { to: '/student/profile', icon: User, label: 'Profile' },
  ];

  return (
    <>
      <nav className="hidden md:flex items-center gap-1 bg-white border-b border-slate-200 px-4" data-testid="student-desktop-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) =>
              `relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                isActive 
                  ? 'text-slate-900 border-b-2 border-slate-900' 
                  : 'text-slate-600 hover:text-slate-900'
              }`
            }
            data-testid={`desktop-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
            {/* Real-time count badge */}
            {item.count > 0 && (
              <span className={`min-w-[20px] h-5 flex items-center justify-center text-xs font-bold text-white rounded-full px-1.5 ${
                item.color === 'orange' ? 'bg-orange-500' : 'bg-emerald-500'
              }`}>
                {item.count > 99 ? '99+' : item.count}
              </span>
            )}
          </NavLink>
        ))}
        <button
          onClick={handleLogoutClick}
          className="ml-auto flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-600 hover:text-red-600 transition-colors"
          data-testid="logout-btn"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </nav>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Confirm Logout
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to logout? You will need to login again to access your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowLogoutDialog(false)}
              disabled={loggingOut}
            >
              Cancel
            </Button>
            <Button
              onClick={handleLogoutConfirm}
              disabled={loggingOut}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loggingOut ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Logging out...
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4 mr-2" />
                  Yes, Logout
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
