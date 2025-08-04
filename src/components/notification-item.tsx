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
      <CardContent className="p-3">
        <div className="flex items-start gap-2 sm:gap-3">
          <div className="mt-0.5 flex-shrink-0">{getIcon()}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-medium text-sm leading-tight flex-1 break-words">
                {notification.title}
              </h3>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Badge variant="outline" className="text-xs">
                  {getTypeLabel()}
                </Badge>
                {!notification.isRead && <span className="h-2 w-2 rounded-full bg-blue-500"></span>}
              </div>
            </div>

            <p className="text-xs text-muted-foreground mb-2 break-words">{notification.message}</p>

            {notification.amount && (
              <div className="mb-2 p-2 bg-muted/30 rounded">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold">
                    {notification.currency || '₹'}
                    {notification.amount.toFixed(2)}
                  </span>
                  {notification.dueDate && (
                    <span className="text-xs text-muted-foreground">
                      Due {format(new Date(notification.dueDate), 'MMM d')}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground truncate">
                {format(new Date(notification.createdAt), 'MMM d • h:mm a')}
              </span>

              {!notification.isRead && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs px-2"
                  onClick={handleMarkAsRead}
                >
                  <Check className="h-3 w-3" />
                  <span className="hidden sm:inline">Read</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
