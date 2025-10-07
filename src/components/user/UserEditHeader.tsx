import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save } from 'lucide-react';

interface UserEditHeaderProps {
  username: string;
  isSaving: boolean;
  onBack: () => void;
  onSave: () => void;
}

const UserEditHeader: React.FC<UserEditHeaderProps> = ({
  username,
  isSaving,
  onBack,
  onSave
}) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-8 w-8 rounded-full text-gray-400 hover:text-white hover:bg-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Edit User</h1>
          <p className="text-gray-400">
            Manage {username ? `${username}'s` : 'user'} account and permissions
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          onClick={onSave}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isSaving ? (
            <>
              <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default UserEditHeader;