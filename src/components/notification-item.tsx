'use client';

import { format } from 'date-fns';
import { Bell, Check, Clock, Megaphone } from 'lucide-react';

import type { Notification } from '@/lib/types';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
}

export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const getIcon = () => {
    switch (notification.type) {
      case 'reminder':
        return <Clock className="h-5 w-5 text-purple-500" />;
      case 'announcement':
        const priorityColors = {
          high: 'text-red-500',
          medium: 'text-blue-500',
          low: 'text-gray-500',
        };
        const colorClass =
          priorityColors[notification.priority as keyof typeof priorityColors] || 'text-blue-500';
        return <Megaphone className={`h-5 w-5 ${colorClass}`} />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTypeLabel = () => {
    switch (notification.type) {
      case 'reminder':
        return 'Reminder';
      case 'announcement':
        return 'Announcement';
      default:
        return 'Notification';
    }
  };

  const handleMarkAsRead = () => {
    if (onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  return (
    <Card
      className={`mb-2 overflow-hidden ${!notification.isRead ? 'border-l-4 border-l-blue-500' : ''}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">{getIcon()}</div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{notification.title}</h3>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {getTypeLabel()}
                </Badge>
                {!notification.isRead && <span className="h-2 w-2 rounded-full bg-blue-500"></span>}
              </div>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>

            {notification.amount && (
              <div className="mt-2">
                <span className="text-lg font-semibold">
                  {notification.currency || '₹'}
                  {notification.amount.toFixed(2)}
                </span>
                {notification.dueDate && (
                  <span className="ml-2 text-sm text-muted-foreground">
                    Due by {format(new Date(notification.dueDate), 'MMM d, yyyy')}
                  </span>
                )}
              </div>
            )}

            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {format(new Date(notification.createdAt), 'MMM d, yyyy • h:mm a')}
              </span>

              <div className="flex gap-2">
                {!notification.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 text-xs"
                    onClick={handleMarkAsRead}
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only">Mark as Read</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
