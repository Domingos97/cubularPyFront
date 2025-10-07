import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Users, Database, Settings, Trash2, Upload, Download, Eye, MoreHorizontal, BarChart3, Edit, Brain } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { AdminSettings } from '@/components/admin/AdminSettings';
import { CSVUpload } from '@/components/admin/CSVUpload';
import { AIPersonalityManager } from '@/components/admin/AIPersonalityManager';


interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface Survey {
  fileid: string;
  filename: string;
  createdat: string;
  category?: string;
  storage_path?: string;
}

const Admin = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isCSVUploadOpen, setIsCSVUploadOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Use the new security definer function to get all users
      const { data: usersData, error: usersError } = await supabase
        .rpc('get_all_users_for_admin');

      if (usersError) {
        console.error('Error fetching users:', usersError);
        setError('Failed to load users');
      } else {
        setUsers(usersData || []);
      }

      // Fetch surveys
      const { data: surveysData, error: surveysError } = await supabase
        .from('surveys')
        .select('fileid, filename, createdat, category, storage_path')
        .order('createdat', { ascending: false });

      if (surveysError) {
        console.error('Error fetching surveys:', surveysError);
        setError('Failed to load surveys');
      } else {
        setSurveys(surveysData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    try {
      setError('');
      
      if (!newUser.username || !newUser.email || !newUser.password) {
        setError('All fields are required');
        return;
      }

      // Hash password
      const { data: hashedData, error: hashError } = await supabase.functions.invoke('hash-password', {
        body: { password: newUser.password }
      });

      if (hashError) {
        setError('Failed to process password');
        return;
      }

      // Insert new user
      const { error: insertError } = await supabase
        .from('users')
        .insert([
          {
            username: newUser.username,
            email: newUser.email,
            password: hashedData.hashedPassword,
            role: newUser.role
          }
        ]);

      if (insertError) {
        if (insertError.code === '23505') {
          setError('Email or username already exists');
        } else {
          setError('Failed to create user');
        }
        return;
      }

      // Reset form and close dialog
      setNewUser({
        username: '',
        email: '',
        password: '',
        role: 'user'
      });
      setIsAddUserOpen(false);
      fetchData();
      toast({
        title: "Success",
        description: "User created successfully",
      });
    } catch (error) {
      console.error('Error adding user:', error);
      setError('Failed to create user');
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsEditUserOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      setError('');
      
      const { error: updateError } = await supabase
        .from('users')
        .update({
          username: editingUser.username,
          email: editingUser.email,
          role: editingUser.role
        })
        .eq('id', editingUser.id);

      if (updateError) {
        if (updateError.code === '23505') {
          setError('Email or username already exists');
        } else {
          setError('Failed to update user');
        }
        return;
      }

      setIsEditUserOpen(false);
      setEditingUser(null);
      fetchData();
      toast({
        title: "Success",
        description: "User updated successfully",
      });
    } catch (error) {
      console.error('Error updating user:', error);
      setError('Failed to update user');
    }
  };


  const handleDeleteSurvey = async (fileid: string) => {
    if (!confirm('Are you sure you want to delete this survey?')) return;

    try {
      const { error } = await supabase
        .from('surveys')
        .delete()
        .eq('fileid', fileid);

      if (error) {
        setError('Failed to delete survey');
        return;
      }

      fetchData();
      toast({
        title: "Success",
        description: "Survey deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting survey:', error);
      setError('Failed to delete survey');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) {
        setError('Failed to delete user');
        return;
      }

      fetchData();
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Failed to delete user');
    }
  };

  const handleViewSurveyDetails = (survey: Survey) => {
    navigate(`/admin/survey/${survey.fileid}`);
  };

  const handleExportSurveyData = async (survey: Survey) => {
    try {
      // Use storage_path if available, fallback to fileid for old records
      const storagePath = (survey as any).storage_path || survey.fileid;
      
      // Download the original CSV file from storage
      const { data, error } = await supabase.storage
        .from('survey-uploads')
        .download(storagePath);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch survey file for export",
          variant: "destructive"
        });
        return;
      }

      // Create blob and download the original file
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = survey.filename || `survey-${survey.fileid}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Original survey file downloaded successfully",
      });
    } catch (error) {
      console.error('Error exporting survey data:', error);
      toast({
        title: "Error",
        description: "Failed to export survey data",
        variant: "destructive"
      });
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  const [language, setLanguage] = useState('en');
  const [pendingLanguage, setPendingLanguage] = useState<string | null>(null);
  const [showLangActions, setShowLangActions] = useState(false);

  // Load language from DB on mount
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('users')
      .select('language')
      .eq('id', user.id)
      .single()
      .then((result) => {
        if (result && result.data && typeof result.data === 'object' && 'language' in result.data) {
          setLanguage(result.data?.language ?? 'en');
        }
      });
  }, [user?.id]);

  // Update language in DB when changed
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('users')
      .update({ language })
      .eq('id', user.id);
  }, [language, user?.id]);
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-gray-400 mt-1">Welcome back, {user?.email}</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center gap-2">
              <Select value={pendingLanguage ?? language} onValueChange={value => {
                setPendingLanguage(value);
                setShowLangActions(true);
              }}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="pt">Português</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
              {showLangActions && (
                <>
                  <Button size="icon" variant="outline" className="border-green-600 text-green-500" onClick={async () => {
                    if (!user?.id || !pendingLanguage) return;
                    setLanguage(pendingLanguage);
                    setShowLangActions(false);
                    setPendingLanguage(null);
                    await supabase
                      .from('users')
                      .update({ language: pendingLanguage })
                      .eq('id', user.id);
                  }}>
                    {/* Confirm icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </Button>
                  <Button size="icon" variant="outline" className="border-red-600 text-red-500" onClick={() => {
                    setPendingLanguage(null);
                    setShowLangActions(false);
                  }}>
                    {/* Cancel icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </Button>
                </>
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => {
                // Clear session storage to ensure survey selection view
                sessionStorage.removeItem('searchTerm');
                sessionStorage.removeItem('selectedSurveys');
                navigate('/', { state: { resetSearch: true } });
              }}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Back to App
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Logout
            </Button>
          </div>
        </div>

        {error && (
          <Alert className="bg-red-900/50 border-red-700 mb-6">
            <AlertDescription className="text-red-200">{error}</AlertDescription>
          </Alert>
        )}

        {/* Admin Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-gray-800/80 border-gray-700">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-gray-700">
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-gray-700">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="ai-personalities" className="data-[state=active]:bg-gray-700">
              <Brain className="w-4 h-4 mr-2" />
              AI Personalities
            </TabsTrigger>
            <TabsTrigger value="surveys" className="data-[state=active]:bg-gray-700">
              <Database className="w-4 h-4 mr-2" />
              Surveys
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-gray-700">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            <AdminDashboard users={users} surveys={surveys} />
          </TabsContent>

          {/* Users Management Tab */}
          <TabsContent value="users">
            <Card className="bg-gray-800/80 border-gray-700">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-white">Users Management</CardTitle>
                <CardDescription className="text-gray-400">
                  Manage user accounts and permissions
                </CardDescription>
              </div>
              <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-800 border-gray-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">Add New User</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Create a new user account
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Username"
                      value={newUser.username}
                      onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                    <Input
                      placeholder="Email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                    <Input
                      placeholder="Password"
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
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleAddUser} className="w-full bg-blue-600 hover:bg-blue-700">
                      Create User
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
                  <TableHead className="text-gray-300">Username</TableHead>
                  <TableHead className="text-gray-300">Email</TableHead>
                  <TableHead className="text-gray-300">Role</TableHead>
                  <TableHead className="text-gray-300">Actions</TableHead>
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
                          className="text-gray-400 hover:text-white"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-400 hover:text-red-300"
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

          </TabsContent>

          {/* AI Personalities Management Tab */}
          <TabsContent value="ai-personalities">
            <AIPersonalityManager />
          </TabsContent>

          {/* Surveys Management Tab */}
          <TabsContent value="surveys">
            <Card className="bg-gray-800/80 border-gray-700">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-white">Survey Data</CardTitle>
                <CardDescription className="text-gray-400">
                  Uploaded survey files and data
                </CardDescription>
              </div>
              <Dialog open={isCSVUploadOpen} onOpenChange={setIsCSVUploadOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Survey
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-white">Upload Survey Data</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Upload a CSV or Excel file containing survey data (fileid, filename columns required)
                    </DialogDescription>
                  </DialogHeader>
                  <CSVUpload onUploadComplete={() => {
                    setIsCSVUploadOpen(false);
                    fetchData();
                  }} />
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
               <TableHeader>
                 <TableRow className="border-gray-700">
                   <TableHead className="text-gray-300">File ID</TableHead>
                   <TableHead className="text-gray-300">Filename</TableHead>
                   <TableHead className="text-gray-300">Category</TableHead>
                   <TableHead className="text-gray-300">Created</TableHead>
                   <TableHead className="text-gray-300">Actions</TableHead>
                 </TableRow>
               </TableHeader>
              <TableBody>
                 {surveys.map((survey) => (
                   <TableRow key={survey.fileid} className="border-gray-700">
                     <TableCell className="text-white font-mono text-sm">{survey.fileid}</TableCell>
                     <TableCell className="text-gray-300">{survey.filename || 'Unnamed'}</TableCell>
                     <TableCell className="text-gray-300">
                       {survey.category ? (
                         <Badge variant="secondary" className="capitalize">
                           {survey.category.replace('-', ' ')}
                         </Badge>
                       ) : (
                         <span className="text-gray-500">No category</span>
                       )}
                     </TableCell>
                     <TableCell className="text-gray-300">
                       {survey.createdat ? new Date(survey.createdat).toLocaleDateString() : 'Unknown'}
                     </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-gray-700 border-gray-600">
                           <DropdownMenuItem 
                             className="text-gray-300 hover:bg-gray-600"
                             onClick={() => handleViewSurveyDetails(survey)}
                           >
                             <Eye className="w-4 h-4 mr-2" />
                             View Details
                           </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-gray-300 hover:bg-gray-600"
                            onClick={() => handleExportSurveyData(survey)}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Export Data
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-400 hover:bg-gray-600"
                            onClick={() => handleDeleteSurvey(survey.fileid)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <AdminSettings />
          </TabsContent>
        </Tabs>

        {/* Edit User Dialog */}
        <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
          <DialogContent className="bg-gray-800 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Edit User</DialogTitle>
              <DialogDescription className="text-gray-400">
                Update user account details
              </DialogDescription>
            </DialogHeader>
            {editingUser && (
              <div className="space-y-4">
                <Input
                  placeholder="Username"
                  value={editingUser.username}
                  onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <Select value={editingUser.role} onValueChange={(value) => setEditingUser({ ...editingUser, role: value })}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleUpdateUser} className="w-full bg-blue-600 hover:bg-blue-700">
                  Update User
                </Button>
              </div>
            )}
           </DialogContent>
         </Dialog>

       </div>
         
     </div>
  );
};

export default Admin;