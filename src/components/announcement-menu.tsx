import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Megaphone, Send } from 'lucide-react';

interface AnnouncementMenuProps {
  role: string;
  announcementMessage: string;
  setAnnouncementMessage: (message: string) => void;
  isSending: boolean;
  onSendAnnouncement: () => void;
}

export function AnnouncementMenu({
  role,
  announcementMessage,
  setAnnouncementMessage,
  isSending,
  onSendAnnouncement,
}: AnnouncementMenuProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit an Announcement</CardTitle>
        <CardDescription>
          {role === 'admin'
            ? 'Send a notification to all users. It will disappear after 2 days.'
            : 'Submit an announcement for admin approval. It will be reviewed shortly.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid w-full gap-2">
          <div className="relative">
            <textarea
              maxLength={500}
              value={announcementMessage}
              onChange={e => setAnnouncementMessage(e.target.value)}
              disabled={isSending}
              rows={4}
              className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Type your message here..."
            />
          </div>
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{announcementMessage.length} / 500</p>
            <Button
              onClick={e => {
                e.preventDefault();
                onSendAnnouncement();
              }}
              disabled={isSending || !announcementMessage.trim()}
            >
              {role === 'admin' ? (
                <Megaphone className="mr-2 h-4 w-4" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {isSending
                ? 'Sending...'
                : role === 'admin'
                  ? 'Send Announcement'
                  : 'Submit for Review'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
