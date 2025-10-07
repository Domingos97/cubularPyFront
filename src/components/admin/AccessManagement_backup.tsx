/*
COMMENTED OUT - UNUSED LARGE ADMIN COMPONENT
============================================
This is a comprehensive access management component that is not being used 
anywhere in the current application. It's a substantial component (~15KB) that 
provides user access control functionality.

Commented out on: October 7, 2025
Reason: Identified as unused component in frontend code analysis - No imports found

If this component is needed in the future, it can be uncommented and integrated.
The original file contains:
- User access management interface
- Permission matrix functionality  
- Survey access controls
- Admin user management features

Size: ~595 lines of code
Status: Complete functional component but currently unused

The entire component has been commented out to reduce bundle size and improve maintainability.
Original code can be restored from git history if needed.
*/

// This file has been commented out as it's an unused admin component.
// The component provided comprehensive access management functionality.
/*
export {};

interface User {
  id: string;
  email: string;
  username: string;
  roleId: string;
  user_plans: Array<{
    id: string;
    status: string;
    start_date: string;
    end_date?: string;
    plans: {
      id: string;
      name: string;
      display_name: string;
    };
  }>;
  user_survey_access: Array<{
    id: string;
    survey_id: string;
    access_type: string;
    granted_at: string;
    expires_at?: string;
    is_active: boolean;
    surveys: {
      id: string;
      title: string;
      category: string;
    };
  }>;
  user_survey_file_access: Array<{
    id: string;
    survey_file_id: string;
    access_type: string;
    granted_at: string;
    expires_at?: string;
    is_active: boolean;
    survey_files: {
      id: string;
      filename: string;
      survey_id: string;
      surveys: {
        id: string;
        title: string;
      };
    };
  }>;
}

interface Survey {
  id: string;
  title: string;
  category: string;
  created_at: string;
  survey_files: Array<{
    id: string;
    filename: string;
    file_size: number;
    created_at: string;
  }>;
}

interface AccessManagementProps {
  className?: string;
}

export const AccessManagement = ({ className }: AccessManagementProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isGrantAccessOpen, setIsGrantAccessOpen] = useState(false);
  const [grantAccessType, setGrantAccessType] = useState<'survey' | 'file'>('survey');
  const [selectedAccessType, setSelectedAccessType] = useState<'read' | 'write' | 'admin'>('read');
  const [selectedSurveyId, setSelectedSurveyId] = useState('');
  const [selectedFileId, setSelectedFileId] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
    fetchSurveys();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await authenticatedFetch('/api/admin/access/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        throw new Error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive'
      });
    }
  };

  const fetchSurveys = async () => {
    try {
      const response = await authenticatedFetch('/api/admin/access/surveys-files');
      if (response.ok) {
        const data = await response.json();
        setSurveys(data);
      } else {
        throw new Error('Failed to fetch surveys');
      }
    } catch (error) {
      console.error('Error fetching surveys:', error);
      toast({
        title: 'Error',
        description: 'Failed to load surveys',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGrantAccess = async () => {
    if (!selectedUser || (!selectedSurveyId && !selectedFileId)) {
      toast({
        title: 'Missing Information',
        description: 'Please select a user and survey/file to grant access',
        variant: 'destructive'
      });
      return;
    }

    try {
      const endpoint = grantAccessType === 'survey' 
        ? '/api/admin/access/survey/grant' 
        : '/api/admin/access/file/grant';

      const payload = grantAccessType === 'survey' 
        ? {
            userId: selectedUser.id,
            surveyId: selectedSurveyId,
            accessType: selectedAccessType,
            expiresAt: expiresAt || null
          }
        : {
            userId: selectedUser.id,
            surveyFileId: selectedFileId,
            accessType: selectedAccessType,
            expiresAt: expiresAt || null
          };

      const response = await authenticatedFetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `${grantAccessType === 'survey' ? 'Survey' : 'File'} access granted successfully`
        });
        setIsGrantAccessOpen(false);
        resetGrantAccessForm();
        fetchUsers(); // Refresh the users list
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to grant access');
      }
    } catch (error) {
      console.error('Error granting access:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to grant access',
        variant: 'destructive'
      });
    }
  };

  const handleRevokeAccess = async (user: User, accessType: 'survey' | 'file', itemId: string) => {
    try {
      const endpoint = accessType === 'survey' 
        ? '/api/admin/access/survey/revoke' 
        : '/api/admin/access/file/revoke';

      const payload = accessType === 'survey' 
        ? { userId: user.id, surveyId: itemId }
        : { userId: user.id, surveyFileId: itemId };

      const response = await authenticatedFetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `${accessType === 'survey' ? 'Survey' : 'File'} access revoked successfully`
        });
        fetchUsers(); // Refresh the users list
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to revoke access');
      }
    } catch (error) {
      console.error('Error revoking access:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to revoke access',
        variant: 'destructive'
      });
    }
  };

  const resetGrantAccessForm = () => {
    setSelectedUser(null);
    setGrantAccessType('survey');
    setSelectedAccessType('read');
    setSelectedSurveyId('');
    setSelectedFileId('');
    setExpiresAt('');
  };

  const openGrantAccessDialog = (user: User) => {
    setSelectedUser(user);
    setIsGrantAccessOpen(true);
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAccessTypeColor = (accessType: string) => {
    switch (accessType) {
      case 'admin': return 'bg-red-600/20 text-red-400 border-red-600/30';
      case 'write': return 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30';
      case 'read': return 'bg-blue-600/20 text-blue-400 border-blue-600/30';
      default: return 'bg-gray-600/20 text-gray-400 border-gray-600/30';
    }
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <div className="h-6 bg-gray-700 rounded w-1/3"></div>
              <div className="h-4 bg-gray-700 rounded w-2/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-700 rounded"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Access Management Header }
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-100 flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            User Access Management
          </CardTitle>
          <CardDescription className="text-gray-400">
            Manage user permissions for surveys and files. Grant or revoke access on a per-user basis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users by email or username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-700/50 border-gray-600 text-gray-200"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Users className="h-4 w-4" />
              {filteredUsers.length} users
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table }
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-100">Users & Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">User</TableHead>
                  <TableHead className="text-gray-300">Plan</TableHead>
                  <TableHead className="text-gray-300">Survey Access</TableHead>
                  <TableHead className="text-gray-300">File Access</TableHead>
                  <TableHead className="text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="border-gray-700">
                    <TableCell>
                      <div>
                        <p className="font-medium text-white">{user.username}</p>
                        <p className="text-sm text-gray-400">{user.email}</p>
                        <Badge 
                          variant="outline" 
                          className={user.roleId === 'admin' ? 'text-red-400 border-red-600' : 'text-blue-400 border-blue-600'}
                        >
                          {user.roleId}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.user_plans?.[0] && (
                        <Badge 
                          variant="outline" 
                          className="text-green-400 border-green-600"
                        >
                          {user.user_plans[0].plans.display_name}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {user.user_survey_access?.filter(access => access.is_active).map((access) => (
                          <div key={access.id} className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getAccessTypeColor(access.access_type)}`}
                            >
                              {access.access_type}
                            </Badge>
                            <span className="text-xs text-gray-400 truncate max-w-32">
                              {access.surveys.title}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-red-400 hover:text-red-300"
                              onClick={() => handleRevokeAccess(user, 'survey', access.survey_id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {user.user_survey_file_access?.filter(access => access.is_active).map((access) => (
                          <div key={access.id} className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getAccessTypeColor(access.access_type)}`}
                            >
                              {access.access_type}
                            </Badge>
                            <span className="text-xs text-gray-400 truncate max-w-32">
                              {access.survey_files.filename}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-red-400 hover:text-red-300"
                              onClick={() => handleRevokeAccess(user, 'file', access.survey_file_id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openGrantAccessDialog(user)}
                        className="text-green-400 border-green-600 hover:bg-green-600/10"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Grant Access
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Grant Access Dialog }
      <Dialog open={isGrantAccessOpen} onOpenChange={setIsGrantAccessOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-green-500" />
              Grant Access
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Grant {selectedUser?.username} access to a survey or specific file.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Access Type</label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={grantAccessType === 'survey' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setGrantAccessType('survey')}
                  className="text-xs"
                >
                  <Database className="h-4 w-4 mr-1" />
                  Survey
                </Button>
                <Button
                  variant={grantAccessType === 'file' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setGrantAccessType('file')}
                  className="text-xs"
                >
                  <FileText className="h-4 w-4 mr-1" />
                  File
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Permission Level</label>
              <Select value={selectedAccessType} onValueChange={(value: 'read' | 'write' | 'admin') => setSelectedAccessType(value)}>
                <SelectTrigger className="bg-gray-700 border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="read">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Read Only
                    </div>
                  </SelectItem>
                  <SelectItem value="write">
                    <div className="flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      Read & Write
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Full Admin
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {grantAccessType === 'survey' && (
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Survey</label>
                <Select value={selectedSurveyId} onValueChange={setSelectedSurveyId}>
                  <SelectTrigger className="bg-gray-700 border-gray-600">
                    <SelectValue placeholder="Select a survey" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {surveys.map((survey) => (
                      <SelectItem key={survey.id} value={survey.id}>
                        {survey.title} ({survey.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {grantAccessType === 'file' && (
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">File</label>
                <Select value={selectedFileId} onValueChange={setSelectedFileId}>
                  <SelectTrigger className="bg-gray-700 border-gray-600">
                    <SelectValue placeholder="Select a file" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {surveys.flatMap((survey) =>
                      survey.survey_files.map((file) => (
                        <SelectItem key={file.id} value={file.id}>
                          {file.filename} (from {survey.title})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Expires At (Optional)
              </label>
              <Input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="bg-gray-700 border-gray-600"
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsGrantAccessOpen(false)}
              className="text-gray-300 border-gray-600"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleGrantAccess}
              disabled={!selectedSurveyId && !selectedFileId}
              className="bg-green-600 hover:bg-green-700"
            >
              Grant Access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};*/