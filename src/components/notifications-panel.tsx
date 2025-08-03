'use client';

import {
  DocumentData,
  QuerySnapshot,
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { Bell, BellOff, X } from 'lucide-react';

import { useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase';
import type { Notification } from '@/lib/types';

import { NotificationItem } from '@/components/notification-item';
import { Button, type ButtonProps } from '@/components/ui/button';
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
    if (!user?.apartment) {
      console.log('No user apartment found:', user);
      return;
    }

    console.log('Setting up notifications listener for apartment:', user.apartment);

    // Query for both old structure (toApartmentId as string) and new structure (toApartmentId as array)
    const q1 = query(collection(db, 'notifications'), where('toApartmentId', '==', user.apartment));
    const q2 = query(
      collection(db, 'notifications'),
      where('toApartmentId', 'array-contains', user.apartment)
    );

    let unsubscribe2: (() => void) | null = null;

    const unsubscribe1 = onSnapshot(
      q1,
      (snapshot1: QuerySnapshot<DocumentData>) => {
        unsubscribe2 = onSnapshot(
          q2,
          (snapshot2: QuerySnapshot<DocumentData>) => {
            console.log(
              'Notifications snapshots received - q1:',
              snapshot1.size,
              'q2:',
              snapshot2.size
            );

            const notifs: Notification[] = [];
            const seenIds = new Set<string>();
            let unread = 0;
            const now = new Date();

            // Process both snapshots
            [snapshot1, snapshot2].forEach((snapshot: QuerySnapshot<DocumentData>) => {
              snapshot.forEach((doc: DocumentData) => {
                // Avoid duplicates
                if (seenIds.has(doc.id)) return;
                seenIds.add(doc.id);

                const data = doc.data() as Omit<Notification, 'id'>;
                console.log('Processing notification:', doc.id, data);

                // Filter out expired announcements
                if (data.type === 'announcement' && data.expiresAt) {
                  const expiryDate = new Date(data.expiresAt);
                  if (expiryDate < now) {
                    console.log('Skipping expired announcement:', doc.id);
                    return; // Skip expired announcements
                  }
                }

                // Handle read status for announcements with object-based isRead
                let isReadForUser = false;
                if (
                  data.type === 'announcement' &&
                  typeof data.isRead === 'object' &&
                  data.isRead !== null
                ) {
                  isReadForUser = data.isRead[user.apartment] || false;
                } else {
                  isReadForUser = Boolean(data.isRead);
                }

                notifs.push({ ...data, id: doc.id, isRead: isReadForUser });
                if (!isReadForUser) unread++;
              });
            });

            // Sort by created date (newest first)
            notifs.sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            console.log('Final notifications:', notifs);
            console.log('Unread count:', unread);

            setNotifications(notifs);
            setUnreadCount(unread);
          },
          (error: unknown) => {
            console.error('Error in notifications listener 2:', error);
          }
        );
      },
      (error: unknown) => {
        console.error('Error in notifications listener 1:', error);
      }
    );

    return () => {
      unsubscribe1();
      if (unsubscribe2) {
        unsubscribe2();
      }
    };
  }, [user?.apartment, user]);

  const markAsRead = async (notificationId: string) => {
    if (!user || !user.apartment) return;
    try {
      const notification = notifications.find(n => n.id === notificationId);
      if (!notification) return;

      // Handle different isRead structures
      if (notification.type === 'announcement' && typeof notification.isRead === 'object') {
        // For announcements with object-based isRead, update the specific apartment
        const updatedIsRead = { ...notification.isRead, [user.apartment]: true };
        await updateDoc(doc(db, 'notifications', notificationId), {
          isRead: updatedIsRead,
        });
      } else {
        // For regular notifications with boolean isRead
        await updateDoc(doc(db, 'notifications', notificationId), {
          isRead: true,
        });
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user || !user.apartment) return;
    const batch = notifications
      .filter(n => !n.isRead)
      .map(async n => {
        if (n.type === 'announcement' && typeof n.isRead === 'object') {
          // For announcements with object-based isRead
          const updatedIsRead = { ...n.isRead, [user.apartment]: true };
          return updateDoc(doc(db, 'notifications', n.id), { isRead: updatedIsRead });
        } else {
          // For regular notifications
          return updateDoc(doc(db, 'notifications', n.id), { isRead: true });
        }
      });

    try {
      await Promise.all(batch);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <Button
        {...({
          variant: 'ghost',
          size: 'icon',
          className: 'relative',
          onClick: () => setIsOpen(!isOpen),
        } as ButtonProps)}
      >
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
                <Button
                  {...({
                    variant: 'ghost',
                    size: 'sm',
                    className: 'h-8 text-xs',
                    onClick: markAllAsRead,
                  } as ButtonProps)}
                >
                  Mark all as read
                </Button>
              )}
              <Button
                {...({
                  variant: 'ghost',
                  size: 'icon',
                  className: 'h-8 w-8',
                  onClick: () => setIsOpen(false),
                } as ButtonProps)}
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
