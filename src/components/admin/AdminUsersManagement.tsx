import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Eye, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/resources/i18n';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface AdminUsersManagementProps {
  users: User[];
  onUserAdded: () => void;
  onUserDeleted: () => void;
}

export const AdminUsersManagement = ({ users, onUserAdded, onUserDeleted }: AdminUsersManagementProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
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
      const res = await fetch('http://localhost:3000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(newUser)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create user');
      }

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
    if (!confirm(t('admin.users.deleteConfirm'))) return;

    try {
      const res = await fetch(`http://localhost:3000/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete user');
      }

      onUserDeleted();
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-600/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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