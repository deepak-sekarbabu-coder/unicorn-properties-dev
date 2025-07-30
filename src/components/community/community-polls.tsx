import { useAuth } from '@/context/auth-context';

import * as React from 'react';

import { deletePoll, listenToPolls, voteOnPoll } from '@/lib/firestore';
import { Apartment, Poll } from '@/lib/types';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { PollResults } from './poll-results';
import { PollVoteDialog } from './poll-vote-dialog';

interface CommunityPollsProps {
  apartments: Apartment[];
}

export function CommunityPolls({ apartments }: CommunityPollsProps) {
  const { user } = useAuth();
  const [polls, setPolls] = React.useState<Poll[]>([]);
  const [loading, setLoading] = React.useState(true);
  const apartmentId = user?.apartment;

  React.useEffect(() => {
    setLoading(true);
    const unsub = listenToPolls(polls => {
      setPolls(polls.filter(p => p.isActive));
      setLoading(false);
    }, true);
    return () => unsub();
  }, []);

  if (loading) return <div>Loading polls...</div>;
  if (!apartmentId)
    return <div className="text-destructive">You must be assigned to an apartment to vote.</div>;

  return (
    <div className="grid gap-6">
      {polls.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No active polls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground">There are currently no polls to vote on.</div>
          </CardContent>
        </Card>
      ) : (
        polls.map(poll => {
          const hasVoted = !!poll.votes[apartmentId];
          const votedOptionId = poll.votes[apartmentId];
          return (
            <Card key={poll.id} className="w-full max-w-xl mx-auto">
              <CardHeader>
                <CardTitle>{poll.question}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!hasVoted ? (
                  <PollVoteDialog
                    poll={poll}
                    apartmentId={apartmentId}
                    hasVoted={hasVoted}
                    votedOptionId={votedOptionId}
                    user={user}
                    onVote={async optionId => {
                      await voteOnPoll(poll.id, apartmentId, optionId);
                    }}
                    onDeletePoll={async pollId => {
                      await deletePoll(pollId);
                      setPolls(prev => prev.filter(p => p.id !== pollId));
                    }}
                  />
                ) : (
                  <PollResults
                    poll={poll}
                    apartmentCount={apartments.length}
                    user={user}
                    onDeletePoll={async pollId => {
                      await deletePoll(pollId);
                      setPolls(prev => prev.filter(p => p.id !== pollId));
                    }}
                  />
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
