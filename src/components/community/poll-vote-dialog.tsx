import * as React from 'react';

import { Poll } from '@/lib/types';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface PollVoteDialogProps {
  poll: Poll;
  apartmentId: string;
  onVote: (optionId: string) => Promise<void>;
  hasVoted: boolean;
  votedOptionId?: string;
  disabled?: boolean;
  user?: import('@/lib/types').User | null;
  onDeletePoll?: (pollId: string) => Promise<void>;
}

export function PollVoteDialog({
  poll,
  onVote,
  hasVoted,
  votedOptionId,
  disabled,
  user,
  onDeletePoll,
}: PollVoteDialogProps) {
  const [selected, setSelected] = React.useState<string>(votedOptionId || '');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleVote = async () => {
    if (!selected) return;
    setSubmitting(true);
    setError('');
    try {
      await onVote(selected);
    } catch (e) {
      setError((e as Error).message || 'Vote failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={hasVoted || disabled}>
          {hasVoted ? 'Voted' : 'Vote'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{poll.question}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <RadioGroup value={selected} onValueChange={setSelected} disabled={hasVoted || disabled}>
            {poll.options.map(opt => (
              <label key={opt.id} className="flex items-center gap-2 cursor-pointer">
                <RadioGroupItem value={opt.id} />
                <span>{opt.text}</span>
              </label>
            ))}
          </RadioGroup>
          {error && <div className="text-destructive text-sm">{error}</div>}
        </div>
        <DialogFooter className="flex flex-col gap-y-2 mt-4">
          {user?.role === 'admin' && onDeletePoll && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full" disabled={submitting}>
                  Delete Poll
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete{' '}
                    <strong>this poll</strong> and all its votes.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-destructive text-white hover:bg-destructive/90 border-none">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      await onDeletePoll(poll.id);
                    }}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Delete Poll
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button
            onClick={handleVote}
            disabled={!selected || hasVoted || submitting || disabled}
            className="w-full"
          >
            Submit Vote
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
