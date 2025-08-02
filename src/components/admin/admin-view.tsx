import { CheckCircle, PlusCircle, Search, Trash2, XCircle } from 'lucide-react';

import type { Category, PollOption, User } from '@/lib/types';
import type { Announcement } from '@/lib/types';

import { AddCategoryDialog } from '@/components/add-category-dialog';
import { AddUserDialog } from '@/components/add-user-dialog';
import { CategoryIcon } from '@/components/category-icon';
import { EditCategoryDialog } from '@/components/edit-category-dialog';
import { EditUserDialog } from '@/components/edit-user-dialog';
import { Icons } from '@/components/icons';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { AddPollDialog } from './add-poll-dialog';

interface AdminViewProps {
  users: User[];
  categories: Category[];
  userSearch: string;
  setUserSearch: (search: string) => void;
  filteredUsers: User[];
  pendingAnnouncements: Announcement[];
  onAddUser: (userData: Omit<User, 'id'>) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onAddCategory: (categoryData: Omit<Category, 'id'>) => void;
  onUpdateCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
  onAnnouncementDecision: (announcementId: string, decision: 'approved' | 'rejected') => void;
  getUserById: (id: string) => User | undefined;
  onAddPoll: (data: { question: string; options: PollOption[]; expiresAt?: string }) => void;
}

export function AdminView({
  categories,
  userSearch,
  setUserSearch,
  filteredUsers,
  pendingAnnouncements,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onAnnouncementDecision,
  getUserById,
  onAddPoll,
}: AdminViewProps) {
  pendingAnnouncements = pendingAnnouncements || [];

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Add, edit, or remove users from the system.</CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search users..."
                  className="pl-8 w-full sm:w-[200px] lg:w-[300px]"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                />
              </div>
              <AddUserDialog onAddUser={onAddUser}>
                <Button className="w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add User
                </Button>
              </AddUserDialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Mobile Card Layout */}
          <div className="block md:hidden space-y-4">
            {filteredUsers.map(u => (
              <Card key={u.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={u.avatar} alt={u.name} />
                      <AvatarFallback>{u.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{u.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {u.apartment || 'N/A'}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">{u.phone || 'N/A'}</p>
                      <div className="flex gap-1 flex-wrap mt-2">
                        <Badge
                          variant={u.role === 'admin' ? 'default' : 'secondary'}
                          className="capitalize text-xs"
                        >
                          {u.role}
                        </Badge>
                        {u.propertyRole && (
                          <Badge variant="outline" className="capitalize text-xs">
                            {u.propertyRole}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <EditUserDialog user={u} onUpdateUser={onUpdateUser}>
                      <Button variant="ghost" size="sm" className="h-8 px-2">
                        Edit
                      </Button>
                    </EditUserDialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive h-8 px-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete{' '}
                            <strong>{u.name}</strong>&apos;s account.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDeleteUser(u.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Delete User
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Apartment</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Approval</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={u.avatar} alt={u.name} />
                          <AvatarFallback>{u.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span>{u.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{u.apartment || 'N/A'}</TableCell>
                    <TableCell>{u.phone || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        <Badge
                          variant={u.role === 'admin' ? 'default' : 'secondary'}
                          className="capitalize"
                        >
                          {u.role}
                        </Badge>
                        {u.propertyRole && (
                          <Badge variant="outline" className="capitalize">
                            {u.propertyRole}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {u.isApproved ? (
                        <Badge variant="default">Approved</Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => onUpdateUser({ ...u, isApproved: true })}
                        >
                          Approve
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <EditUserDialog user={u} onUpdateUser={onUpdateUser}>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </EditUserDialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete{' '}
                              <strong>{u.name}</strong>&apos;s account.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDeleteUser(u.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Delete User
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {pendingAnnouncements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Announcements</CardTitle>
            <CardDescription>
              Review and approve or reject announcements submitted by users.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {pendingAnnouncements.map(ann => (
                <li key={ann.id} className="rounded-lg border p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">
                        From:{' '}
                        <span className="font-medium text-foreground">
                          {getUserById(ann.createdBy)?.name || 'Unknown User'}
                        </span>
                      </p>
                      <p className="text-sm break-words">{ann.message}</p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:gap-2 sm:shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50 w-full sm:w-auto"
                        onClick={() => onAnnouncementDecision(ann.id, 'approved')}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full sm:w-auto"
                        onClick={() => onAnnouncementDecision(ann.id, 'rejected')}
                      >
                        <XCircle className="mr-2 h-4 w-4" /> Reject
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Poll Management</CardTitle>
              <CardDescription>Create and manage polls for the community.</CardDescription>
            </div>
            <AddPollDialog onAddPoll={onAddPoll} />
          </div>
        </CardHeader>
        <CardContent>{/* Poll list and management UI will go here */}</CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Category Management</CardTitle>
              <CardDescription>Manage expense categories for the group.</CardDescription>
            </div>
            <AddCategoryDialog onAddCategory={onAddCategory}>
              <Button className="w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Category
              </Button>
            </AddCategoryDialog>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div>
            <ul className="space-y-2">
              {categories.map(cat => (
                <li
                  key={cat.id}
                  className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <CategoryIcon name={cat.icon as keyof typeof Icons} className="flex-shrink-0" />
                    <span className="truncate">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-2 sm:flex-shrink-0">
                    <EditCategoryDialog category={cat} onUpdateCategory={onUpdateCategory}>
                      <Button variant="ghost" size="sm" className="flex-1 sm:flex-initial">
                        Edit
                      </Button>
                    </EditCategoryDialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive flex-1 sm:flex-initial"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the{' '}
                            <strong>{cat.name}</strong> category.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDeleteCategory(cat.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminView;
