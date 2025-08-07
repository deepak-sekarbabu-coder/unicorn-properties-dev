'use client';

import { AlertTriangle, BookOpen, Home, LineChart, PieChart, Settings, Wrench } from 'lucide-react';

import * as React from 'react';

import Image from 'next/image';

import type { User, View } from '@/lib/types';

import { Users } from '@/components/ui/lucide';
import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { ThemeSwitch } from '@/components/ui/theme-switch';

interface NavigationMenuProps {
  user: User | null;
  view: View;
  setView: (view: View) => void;
  role: string;
}

export function NavigationMenu({ user, view, setView, role }: NavigationMenuProps) {
  const { setOpenMobile, isMobile } = useSidebar();
  // Removed isClient state and useEffect as role is already available from props

  const handleNavigation = (newView: View) => {
    setView(newView);
    // Close mobile sidebar when navigating
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleLogoNavigation = () => {
    if (user) {
      setView('dashboard');
      if (isMobile) {
        setOpenMobile(false);
      }
    }
    // If user is not logged in, the parent component should handle navigation
  };

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center justify-between gap-1 px-3 py-2 w-full border-b">
          <div
            className="flex items-center gap-1.5 min-w-0 cursor-pointer flex-1"
            onClick={handleLogoNavigation}
          >
            <Image
              src="/unicorn-logo.png"
              alt="Unicorn Properties Logo"
              width={24}
              height={24}
              className="object-contain rounded bg-white flex-shrink-0"
              priority
              unoptimized
            />
            <span className="text-sm font-semibold truncate">Unicorn Properties</span>
          </div>
          <div className="flex-shrink-0">
            <ThemeSwitch />
          </div>
        </div>
      </SidebarHeader>
      {/* Navigation menu remains unchanged */}
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => handleNavigation('dashboard')}
              isActive={view === 'dashboard'}
              tooltip="Dashboard"
            >
              <Home />
              Dashboard
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => handleNavigation('expenses')}
              isActive={view === 'expenses'}
              tooltip="All Expenses"
            >
              <LineChart />
              All Expenses
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => handleNavigation('analytics')}
              isActive={view === 'analytics'}
              tooltip="Analytics"
            >
              <PieChart />
              Analytics
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => handleNavigation('community')}
              isActive={view === 'community'}
              tooltip="Community"
            >
              <Users />
              Community
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => handleNavigation('fault-reporting')}
              isActive={view === 'fault-reporting'}
              tooltip="Report a Fault"
            >
              <AlertTriangle />
              Fault Reporting
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => handleNavigation('current-faults')}
              isActive={view === 'current-faults'}
              tooltip="Current Faults"
            >
              <Wrench />
              Current Faults
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => handleNavigation('ledger')}
              isActive={view === 'ledger'}
              tooltip="Ledger"
            >
              <BookOpen />
              Ledger
            </SidebarMenuButton>
          </SidebarMenuItem>
          {role === 'admin' && (
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => handleNavigation('admin')}
                isActive={view === 'admin'}
                tooltip="Admin"
              >
                <Settings />
                Admin
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarContent>
    </>
  );
}
