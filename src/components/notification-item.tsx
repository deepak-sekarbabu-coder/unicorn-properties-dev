'use client';

import { format } from 'date-fns';
import { AlertCircle, Bell, Check, CheckCircle2, Clock } from 'lucide-react';

import type { Notification } from '@/lib/types';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onPayNow?: (notification: Notification) => void;
}

export function NotificationItem({ notification, onMarkAsRead, onPayNow }: NotificationItemProps) {
  const getIcon = () => {
    switch (notification.type) {
      case 'payment_request':
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case 'payment_received':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'announcement':
        return <Bell className="h-5 w-5 text-blue-500" />;
      case 'reminder':
        return <Clock className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTypeLabel = () => {
    switch (notification.type) {
      case 'payment_request':
        return 'Payment Request';
      case 'payment_received':
        return 'Payment Received';
      case 'announcement':
        return 'Announcement';
      case 'reminder':
        return 'Reminder';
      default:
        return 'Notification';
    }
  };

  const handleMarkAsRead = () => {
    if (onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  const handlePayNow = () => {
    if (onPayNow) {
      onPayNow(notification);
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
                  {notification.currency || '$'}
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

                {notification.type === 'payment_request' && onPayNow && (
                  <Button size="sm" className="h-8 text-xs" onClick={handlePayNow}>
                    Pay Now
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
