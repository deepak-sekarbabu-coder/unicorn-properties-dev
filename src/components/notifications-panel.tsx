'use client';

import { collection, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { Bell, BellOff, X } from 'lucide-react';

import { useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase';
import type { Notification } from '@/lib/types';

import { NotificationItem } from '@/components/notification-item';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NotificationsPanelProps {
  className?: string;
}

export function NotificationsPanel({ className }: NotificationsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  // Fetch notifications for the current user
  useEffect(() => {
    if (!user?.apartment) return;

    const q = query(collection(db, 'notifications'), where('toApartmentId', '==', user.apartment));

    const unsubscribe = onSnapshot(q, snapshot => {
      const notifs: Notification[] = [];
      let unread = 0;

      snapshot.forEach(doc => {
        const data = doc.data() as Omit<Notification, 'id'>;
        notifs.push({ ...data, id: doc.id });
        if (!data.isRead) unread++;
      });

      // Sort by created date (newest first)
      notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setNotifications(notifs);
      setUnreadCount(unread);
    });

    return () => unsubscribe();
  }, [user?.apartment]);

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        isRead: true,
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    const batch = notifications
      .filter(n => !n.isRead)
      .map(n => updateDoc(doc(db, 'notifications', n.id), { isRead: true }));

    try {
      await Promise.all(batch);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handlePayNow = (notification: Notification) => {
    // Handle payment logic here
    console.log('Initiating payment for notification:', notification);
    // This would typically open a payment modal or redirect to a payment page
  };

  return (
    <div className={`relative ${className}`}>
      <Button variant="ghost" size="icon" className="relative" onClick={() => setIsOpen(!isOpen)}>
        {unreadCount > 0 ? (
          <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center">
            <span className="text-xs font-medium text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </div>
        ) : null}
        <Bell className="h-5 w-5" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-md border bg-background shadow-lg z-50">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="font-medium">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={markAllAsRead}>
                  Mark all as read
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {notifications.length > 0 ? (
            <ScrollArea className="h-96">
              <div className="p-2">
                {notifications.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onPayNow={handlePayNow}
                  />
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="p-6 text-center text-muted-foreground">
              <BellOff className="mx-auto h-8 w-8 mb-2 opacity-30" />
              <p>No notifications yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
