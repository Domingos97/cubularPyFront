import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Eye, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/resources/i18n';
import { authenticatedApiRequest } from '@/utils/api';
import { API_CONFIG, buildApiUrl } from '@/config';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface AdminUsersManagementProps {
  users: User[];
  onUserAdded: () => void;
  onUserDeleted: (userId?: string) => void;
}

export const AdminUsersManagement = ({ users, onUserAdded, onUserDeleted }: AdminUsersManagementProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user'
  });

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.email || !newUser.password) {
      toast({
        title: t('admin.toast.error'),
        description: t('admin.users.fillAllFields'),
        variant: 'destructive'
      });
      return;
    }

    try {
      const data = await authenticatedApiRequest(buildApiUrl(API_CONFIG.ENDPOINTS.USERS.BASE), {
        method: 'POST',
        body: JSON.stringify(newUser)
      });

      setIsAddUserOpen(false);
      setNewUser({ username: '', email: '', password: '', role: 'user' });
      onUserAdded();
      toast({
        title: t('admin.toast.success'),
        description: t('admin.users.userCreated')
      });
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: t('admin.toast.error'),
        description: error instanceof Error ? error.message : t('admin.users.createFailed'),
        variant: 'destructive'
      });
    }
  };

  const handleEditUser = (user: User) => {
    navigate(`/admin/users/${user.id}/edit`);
  };

  const handleDeleteUser = async (userId: string) => {
    if (deletingUserId) return; // Prevent multiple simultaneous deletions

    try {
      setDeletingUserId(userId);
      
      await authenticatedApiRequest(`${buildApiUrl(API_CONFIG.ENDPOINTS.USERS.BASE)}/${userId}`, {
        method: 'DELETE'
      });

      // Pass the userId to the parent for optimistic updates
      onUserDeleted(userId);
      toast({
        title: t('admin.toast.success'),
        description: t('admin.users.userDeleted')
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: t('admin.toast.error'),
        description: error instanceof Error ? error.message : t('admin.users.deleteFailed'),
        variant: 'destructive'
      });
    } finally {
      setDeletingUserId(null);
    }
  };

  return (
    <Card className="bg-gray-800/80 border-gray-700">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-white">{t('admin.users.title')}</CardTitle>
            <CardDescription className="text-gray-400">
              {t('admin.users.description')}
            </CardDescription>
          </div>
          <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                {t('admin.users.addUser')}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-800 border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-white">{t('admin.users.addNewUser')}</DialogTitle>
                <DialogDescription className="text-gray-400">
                  {t('admin.users.createNewAccount')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder={t('admin.users.username')}
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <Input
                  placeholder={t('admin.users.email')}
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <Input
                  placeholder={t('admin.users.password')}
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="user">{t('admin.users.user')}</SelectItem>
                    <SelectItem value="admin">{t('admin.users.admin')}</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleAddUser} className="w-full bg-blue-600 hover:bg-blue-700">
                  {t('admin.users.createUser')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-gray-700">
              <TableHead className="text-gray-300">{t('admin.users.username')}</TableHead>
              <TableHead className="text-gray-300">{t('admin.users.email')}</TableHead>
              <TableHead className="text-gray-300">{t('admin.users.role')}</TableHead>
              <TableHead className="text-gray-300">{t('admin.users.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} className="border-gray-700">
                <TableCell className="text-white">{user.username}</TableCell>
                <TableCell className="text-gray-300">{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-600/20"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      {t('admin.users.edit')}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={deletingUserId === user.id}
                          className="text-red-400 hover:text-red-300 hover:bg-red-600/20 disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-gray-800 border-gray-700">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-white">
                            {t('admin.users.deleteConfirm')}
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-400">
                            Are you sure you want to delete user "{user.username}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={deletingUserId === user.id}
                            className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
                          >
                            {deletingUserId === user.id ? 'Deleting...' : 'Delete'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
