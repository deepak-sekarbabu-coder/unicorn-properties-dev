'use client';

import { format, formatDistanceToNow } from 'date-fns';
import { Bell, Megaphone, Send, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import * as React from 'react';

import type { Announcement, Apartment, Expense, User } from '@/lib/types';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { OutstandingBalance } from '@/components/outstanding-balance';

import { useToast } from '@/hooks/use-toast';

interface DashboardViewProps {
    user: User | null;
    role: string;
    expenses: Expense[];
    announcements: Announcement[];
    apartments: Apartment[];
    currentUserApartment: string | undefined;
    apartmentBalances: Record<string, {
        name: string;
        balance: number;
        owes: Record<string, number>;
        isOwed: Record<string, number>;
    }>;
    announcementMessage: string;
    setAnnouncementMessage: (message: string) => void;
    isSending: boolean;
    onSendAnnouncement: () => void;
    ExpensesList: React.ComponentType<{ expenses: Expense[]; limit?: number }>;
}

export function DashboardView({
    user,
    role,
    expenses,
    announcements,
    apartments,
    currentUserApartment,
    apartmentBalances,
    announcementMessage,
    setAnnouncementMessage,
    isSending,
    onSendAnnouncement,
    ExpensesList,
}: DashboardViewProps) {
    const { toast } = useToast();
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    // Maintain focus during re-renders
    React.useEffect(() => {
        if (textareaRef.current && document.activeElement !== textareaRef.current) {
            const shouldRefocus = textareaRef.current.dataset.wasFocused === 'true';
            if (shouldRefocus) {
                textareaRef.current.focus();
            }
        }
    });

    const currentApartmentBalance = currentUserApartment
        ? apartmentBalances[currentUserApartment]
        : null;

    const loggedInUserBalance = currentApartmentBalance ? currentApartmentBalance.balance : 0;

    const approvedAnnouncements = announcements.filter(a => a.status === 'approved');

    return (
        <div className="grid gap-6">
            {/* Outstanding Balance Alert */}
            <OutstandingBalance expenses={expenses} currentUserApartment={currentUserApartment} />

            {/* Apartment Balances */}
            {currentApartmentBalance && (
                <Card>
                    <CardHeader>
                        <CardTitle>Apartment Balances</CardTitle>
                        <CardDescription>Summary of amounts owed between apartments</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* What you are owed */}
                        {Object.entries(currentApartmentBalance.isOwed).map(
                            ([apartmentId, amount]) =>
                                amount > 0 && (
                                    <div
                                        key={`owed-${apartmentId}`}
                                        className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-full bg-green-100">
                                                <TrendingUp className="h-5 w-5 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium">
                                                    {apartmentBalances[apartmentId]?.name || 'Unknown Apartment'}
                                                </p>
                                                <p className="text-sm text-muted-foreground">owes your apartment</p>
                                            </div>
                                        </div>
                                        <span className="text-lg font-semibold text-green-700">
                                            ₹{amount.toFixed(2)}
                                        </span>
                                    </div>
                                )
                        )}

                        {/* What you owe */}
                        {Object.entries(currentApartmentBalance.owes).map(
                            ([apartmentId, amount]) =>
                                amount > 0 && (
                                    <div
                                        key={`owes-${apartmentId}`}
                                        className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-full bg-red-100">
                                                <TrendingDown className="h-5 w-5 text-red-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium">
                                                    You owe {apartmentBalances[apartmentId]?.name || 'Unknown Apartment'}
                                                </p>
                                                <p className="text-sm text-muted-foreground">for shared expenses</p>
                                            </div>
                                        </div>
                                        <span className="text-lg font-semibold text-red-700">₹{amount.toFixed(2)}</span>
                                    </div>
                                )
                        )}

                        {/* Net balance */}
                        {currentApartmentBalance.balance !== 0 && (
                            <div
                                className={`mt-4 p-4 rounded-lg ${currentApartmentBalance.balance > 0 ? 'bg-green-50' : 'bg-red-50'}`}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">
                                            {currentApartmentBalance.balance > 0
                                                ? 'Your apartment is owed'
                                                : 'Your apartment owes'}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {currentApartmentBalance.balance > 0
                                                ? 'in total across all apartments'
                                                : 'in total to other apartments'}
                                        </p>
                                    </div>
                                    <span
                                        className={`text-xl font-bold ${currentApartmentBalance.balance > 0 ? 'text-green-700' : 'text-red-700'}`}
                                    >
                                        {currentApartmentBalance.balance > 0 ? '+' : ''}₹
                                        {Math.abs(currentApartmentBalance.balance).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Expenses</CardTitle>
                        <CardDescription>The last 5 expenses added to your apartment.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ExpensesList expenses={expenses} limit={5} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Notifications</CardTitle>
                        <CardDescription>Your personal reminders and balance status.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        {approvedAnnouncements
                            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                            .map(ann => (
                                <React.Fragment key={ann.id}>
                                    <div className="flex items-start gap-4">
                                        <Megaphone className="h-6 w-6 text-primary mt-1" />
                                        <div className="grid gap-1">
                                            <p className="text-sm font-medium">New Announcement</p>
                                            <p className="text-sm text-muted-foreground">{ann.message}</p>
                                            <p className="text-xs text-muted-foreground/80 pt-1">
                                                {formatDistanceToNow(new Date(ann.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                    <Separator />
                                </React.Fragment>
                            ))}
                        <div className="flex items-center gap-4">
                            <Bell className="h-6 w-6 text-accent" />
                            <div className="grid gap-1">
                                <p className="text-sm font-medium">Welcome to Unicorn Properties, {user?.name}!</p>
                                <p className="text-sm text-muted-foreground">Here is a summary of your account.</p>
                            </div>
                        </div>
                        <Separator />
                        <div className="flex items-center gap-4">
                            <Wallet
                                className={`h-6 w-6 ${Math.abs(loggedInUserBalance) < 0.01 ? 'text-green-600' : loggedInUserBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}
                            />
                            <div className="grid gap-1">
                                <p className="text-sm font-medium">
                                    Your balance is{' '}
                                    {Math.abs(loggedInUserBalance) < 0.01
                                        ? '₹0.00'
                                        : loggedInUserBalance >= 0
                                            ? `-₹${loggedInUserBalance.toFixed(2)}`
                                            : `+₹${Math.abs(loggedInUserBalance).toFixed(2)}`}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {Math.abs(loggedInUserBalance) < 0.01
                                        ? 'You are all settled up.'
                                        : loggedInUserBalance > 0
                                            ? 'Others owe you money.'
                                            : 'You have outstanding balances.'}
                                </p>
                            </div>
                        </div>
                        {loggedInUserBalance < -0.01 && (
                            <>
                                <Separator />
                                <div className="flex items-center gap-4">
                                    <TrendingUp className="h-6 w-6 text-blue-500" />
                                    <div className="grid gap-1">
                                        <p className="text-sm font-medium">Settle Up Reminder</p>
                                        <p className="text-sm text-muted-foreground">
                                            Please pay your outstanding balance to keep the records updated.
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

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
                    <div className="grid w-full gap-2" style={{ contain: 'layout' }}>
                        <div
                            className="relative"
                            style={{
                                position: 'relative',
                                zIndex: 1,
                                contain: 'layout style',
                            }}
                        >
                            <Textarea
                                ref={textareaRef}
                                placeholder="Type your message here..."
                                maxLength={500}
                                value={announcementMessage}
                                onChange={React.useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
                                    const value = e.target.value;
                                    const cursorPosition = e.target.selectionStart;
                                    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                                    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

                                    if (textareaRef.current) {
                                        textareaRef.current.dataset.wasFocused = 'true';
                                    }

                                    setAnnouncementMessage(value);

                                    requestAnimationFrame(() => {
                                        if (textareaRef.current) {
                                            textareaRef.current.focus();
                                            textareaRef.current.setSelectionRange(cursorPosition, cursorPosition);
                                        }
                                        window.scrollTo(scrollLeft, scrollTop);
                                    });
                                }, [setAnnouncementMessage])}
                                disabled={isSending}
                                className="min-h-[100px] resize-none focus:ring-2 focus:ring-offset-0"
                                rows={4}
                                style={{
                                    position: 'relative',
                                    scrollMarginTop: '0px',
                                }}
                                onFocus={() => {
                                    if (textareaRef.current) {
                                        textareaRef.current.dataset.wasFocused = 'true';
                                    }
                                }}
                                onBlur={() => {
                                    if (textareaRef.current) {
                                        textareaRef.current.dataset.wasFocused = 'false';
                                    }
                                }}
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
        </div>
    );
}