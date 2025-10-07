import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, Shield, Eye, Edit } from 'lucide-react';

interface AccessExpirationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (expiresAt: string | null) => Promise<void>;
  type: 'survey' | 'file';
  itemName: string;
  accessType: 'read' | 'write' | 'admin';
}

const AccessExpirationDialog: React.FC<AccessExpirationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  type,
  itemName,
  accessType
}) => {
  const [expiresAt, setExpiresAt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const getAccessTypeIcon = (accessType: 'read' | 'write' | 'admin') => {
    switch (accessType) {
      case 'read': return <Eye className="h-4 w-4 text-blue-400" />;
      case 'write': return <Edit className="h-4 w-4 text-orange-400" />;
      case 'admin': return <Shield className="h-4 w-4 text-red-400" />;
    }
  };

  const getAccessTypeColor = (accessType: 'read' | 'write' | 'admin') => {
    switch (accessType) {
      case 'read': return 'text-blue-400 bg-blue-400/10';
      case 'write': return 'text-orange-400 bg-orange-400/10';
      case 'admin': return 'text-red-400 bg-red-400/10';
    }
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm(expiresAt || null);
      onClose();
      setExpiresAt('');
    } catch (error) {
      console.error('Error confirming access:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      onClose();
      setExpiresAt('');
    }
  };

  // Get current date and time for minimum datetime-local value
  const now = new Date();
  const minDateTime = now.toISOString().slice(0, 16);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-gray-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-gray-100">
            <div className="p-2 rounded-lg bg-green-600/20">
              <Calendar className="h-5 w-5 text-green-400" />
            </div>
            Grant Access - Set Expiration
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Access Details */}
          <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-300">Access Type:</span>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${getAccessTypeColor(accessType)}`}>
                  {getAccessTypeIcon(accessType)}
                  {accessType.charAt(0).toUpperCase() + accessType.slice(1)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-300">
                {type === 'survey' ? 'Survey' : 'File'}:
              </span>
              <span className="text-sm text-gray-100 font-medium">{itemName}</span>
            </div>
          </div>

          {/* Expiration Date Input */}
          <div className="space-y-2">
            <Label htmlFor="expiration" className="text-gray-300 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Expiration Date & Time (Optional)
            </Label>
            <Input
              id="expiration"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              min={minDateTime}
              className="bg-gray-800 border-gray-600 text-gray-100 focus:border-gray-500"
              placeholder="Leave empty for permanent access"
            />
            <p className="text-xs text-gray-400">
              Leave empty to grant permanent access, or set a specific expiration date and time.
            </p>
          </div>

          {/* Preview */}
          <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-600">
            <div className="text-sm">
              <span className="text-gray-400">Access will be granted </span>
              {expiresAt ? (
                <>
                  <span className="text-orange-400 font-medium">until </span>
                  <span className="text-gray-100 font-medium">
                    {new Date(expiresAt).toLocaleString()}
                  </span>
                </>
              ) : (
                <span className="text-green-400 font-medium">permanently</span>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isProcessing}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isProcessing}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isProcessing ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                Granting Access...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Grant Access
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AccessExpirationDialog;