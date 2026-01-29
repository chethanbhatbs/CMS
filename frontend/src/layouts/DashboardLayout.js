import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import {
  LayoutDashboard,
  Users,
  UsersRound,
  MapPin,
  Zap,
  Receipt,
  Activity,
  Pause,
  PlayCircle,
  FileText,
  Bell,
  Shield,
  Building2,
  UserCog,
  CreditCard,
  DollarSign,
  Package,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  User,
  Menu,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const menuStructure = [
  {
    type: 'single',
    icon: LayoutDashboard,
    label: 'Dashboard',
    path: '/dashboard',
  },
  {
    type: 'section',
    label: 'CRM',
    items: [
      { icon: Users, label: 'Retail Users', path: '/crm/retail-users' },
      { icon: UsersRound, label: 'Group Users', path: '/crm/group-users' },
    ],
  },
  {
    type: 'section',
    label: 'Charging Network',
    items: [
      { icon: MapPin, label: 'Charging Locations', path: '/charging-locations' },
      { icon: Zap, label: 'Charge Points', path: '/charge-points' },
    ],
  },
  {
    type: 'section',
    label: 'Operations',
    items: [
      { icon: Receipt, label: 'Charging Transactions', path: '/operations/transactions' },
      { icon: Activity, label: 'Active Sessions', path: '/operations/active-sessions' },
      { icon: Pause, label: 'On-Hold Transactions', path: '/operations/on-hold' },
    ],
  },
  {
    type: 'section',
    label: 'Remote Operations',
    items: [
      { icon: PlayCircle, label: 'Start Remote Session', path: '/remote-operations/start-session' },
    ],
  },
  {
    type: 'section',
    label: 'Monitoring',
    items: [
      { icon: FileText, label: 'Charger Logs', path: '/monitoring/charger-logs' },
      { icon: Bell, label: 'Alarm Summary', path: '/monitoring/alarms' },
      { icon: FileText, label: 'Reports & Logs', path: '/monitoring/reports' },
    ],
  },
  {
    type: 'section',
    label: 'Administration',
    items: [
      { icon: Shield, label: 'Admin User Management', path: '/admin/users' },
      { icon: Building2, label: 'Franchise Management', path: '/admin/franchises' },
      { icon: UserCog, label: 'Role Management', path: '/admin/roles' },
      { icon: Building2, label: 'OEM Management', path: '/admin/oems' },
      { icon: Zap, label: 'Charger Models', path: '/admin/charger-models' },
      { icon: CreditCard, label: 'RFID Management', path: '/admin/rfid' },
      { icon: DollarSign, label: 'Tariff Management', path: '/admin/tariffs' },
      { icon: Package, label: 'Asset Management', path: '/admin/assets' },
      { icon: Settings, label: 'Configuration', path: '/admin/configuration' },
    ],
  },
];

const SidebarContent = ({ collapsed, onNavigate, searchQuery }) => {
  const location = useLocation();
  const [openSections, setOpenSections] = useState(
    menuStructure.reduce((acc, item) => {
      if (item.type === 'section') {
        acc[item.label] = true;
      }
      return acc;
    }, {})
  );

  const toggleSection = (label) => {
    setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  // Filter menu items based on search
  const filterMenuItems = (items) => {
    if (!searchQuery) return items;
    
    const query = searchQuery.toLowerCase();
    return items.filter(item => {
      if (item.type === 'single') {
        return item.label.toLowerCase().includes(query);
      }
      if (item.type === 'section') {
        const hasMatchingItems = item.items.some(subItem => 
          subItem.label.toLowerCase().includes(query)
        );
        return hasMatchingItems || item.label.toLowerCase().includes(query);
      }
      return false;
    }).map(item => {
      if (item.type === 'section' && searchQuery) {
        return {
          ...item,
          items: item.items.filter(subItem => 
            subItem.label.toLowerCase().includes(query)
          )
        };
      }
      return item;
    });
  };

  const filteredMenu = filterMenuItems(menuStructure);

  return (
    <nav className="flex-1 overflow-y-auto py-4">
      <ul className="space-y-1 px-2">
        {filteredMenu.map((item, index) => {
          if (item.type === 'single') {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={onNavigate}
                  data-testid={`nav-link-${item.path.slice(1)}`}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
                    isActive
                      ? 'bg-primary text-white shadow-md'
                      : 'hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon size={20} />
                  {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                </Link>
              </li>
            );
          }

          if (item.type === 'section') {
            return (
              <li key={item.label}>
                <Collapsible
                  open={openSections[item.label]}
                  onOpenChange={() => toggleSection(item.label)}
                >
                  {!collapsed && (
                    <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-200 transition-colors">
                      <span>{item.label}</span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          openSections[item.label] ? 'rotate-180' : ''
                        }`}
                      />
                    </CollapsibleTrigger>
                  )}
                  <CollapsibleContent className="space-y-1 mt-1">
                    {item.items.map((subItem) => {
                      const SubIcon = subItem.icon;
                      const isActive = location.pathname === subItem.path;
                      return (
                        <Link
                          key={subItem.path}
                          to={subItem.path}
                          onClick={onNavigate}
                          data-testid={`nav-link-${subItem.path.slice(1).replace(/\//g, '-')}`}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
                            isActive
                              ? 'bg-primary text-white shadow-md'
                              : 'hover:bg-slate-800 hover:text-white'
                          } ${!collapsed && 'ml-2'}`}
                        >
                          <SubIcon size={20} />
                          {!collapsed && <span className="text-sm font-medium">{subItem.label}</span>}
                        </Link>
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>
              </li>
            );
          }

          return null;
        })}
      </ul>
    </nav>
  );
};

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getPageTitle = () => {
    for (const item of menuStructure) {
      if (item.type === 'single' && item.path === location.pathname) {
        return item.label;
      }
      if (item.type === 'section') {
        const found = item.items.find((subItem) => subItem.path === location.pathname);
        if (found) return found.label;
      }
    }
    return 'Dashboard';
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar - Desktop */}
      <aside
        data-testid="sidebar-desktop"
        className={`hidden lg:flex flex-col bg-slate-900 text-slate-300 transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Logo/Brand */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          {!collapsed && (
            <h1 className="text-xl font-heading font-bold text-white" data-testid="sidebar-logo">
              EV CMS
            </h1>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="text-slate-400 hover:text-white hover:bg-slate-800"
            data-testid="sidebar-toggle-btn"
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </Button>
        </div>

        {/* Global Menu Search */}
        {!collapsed && (
          <div className="px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
              <Input
                placeholder="Search menu..."
                className="pl-9 bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500 h-9"
                value={menuSearchQuery}
                onChange={(e) => setMenuSearchQuery(e.target.value)}
                data-testid="menu-search-input"
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <SidebarContent collapsed={collapsed} onNavigate={() => {}} searchQuery={menuSearchQuery} />
      </aside>

      {/* Sidebar - Mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside
            data-testid="sidebar-mobile"
            className="absolute left-0 top-0 bottom-0 w-64 bg-slate-900 text-slate-300"
          >
            {/* Logo/Brand */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
              <h1 className="text-xl font-heading font-bold text-white">EV CMS</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(false)}
                className="text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <ChevronLeft size={20} />
              </Button>
            </div>

            {/* Global Menu Search */}
            <div className="px-4 py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                <Input
                  placeholder="Search menu..."
                  className="pl-9 bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500 h-9"
                  value={menuSearchQuery}
                  onChange={(e) => setMenuSearchQuery(e.target.value)}
                  data-testid="menu-search-mobile-input"
                />
              </div>
            </div>

            {/* Navigation */}
            <SidebarContent collapsed={false} onNavigate={() => setMobileOpen(false)} searchQuery={menuSearchQuery} />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden"
              data-testid="mobile-menu-btn"
            >
              <Menu size={24} />
            </Button>
            <h2 className="text-lg font-heading font-semibold text-slate-900" data-testid="page-title">
              {getPageTitle()}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2"
                  data-testid="user-menu-btn"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-white text-sm">
                      {user ? getInitials(user.full_name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-slate-900">{user?.full_name}</p>
                    <p className="text-xs text-slate-500">{user?.role}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div>
                    <p className="font-medium">{user?.full_name}</p>
                    <p className="text-xs text-slate-500 font-normal">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem data-testid="profile-menu-item">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem data-testid="settings-menu-item">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} data-testid="logout-menu-item">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;