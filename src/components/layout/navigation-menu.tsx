'use client';

import { AlertTriangle, Home, LineChart, PieChart, Settings, Wrench } from 'lucide-react';

import * as React from 'react';

import Image from 'next/image';

import type { User } from '@/lib/types';

import { Users } from '@/components/ui/lucide';
import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

type View =
  | 'dashboard'
  | 'expenses'
  | 'admin'
  | 'analytics'
  | 'community'
  | 'fault-reporting'
  | 'current-faults';

interface NavigationMenuProps {
  user: User | null;
  view: View;
  setView: (view: View) => void;
  role: string;
}

export function NavigationMenu({ user, view, setView, role }: NavigationMenuProps) {
  const { setOpenMobile, isMobile } = useSidebar();

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
        <div className="flex items-center gap-2 p-2 cursor-pointer" onClick={handleLogoNavigation}>
          <Image
            src="/unicorn-logo.png"
            alt="Unicorn Properties Logo"
            width={40}
            height={40}
            className="object-contain rounded bg-white"
            priority
            unoptimized
          />
          <span className="text-lg font-semibold">Unicorn Properties</span>
        </div>
      </SidebarHeader>
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
