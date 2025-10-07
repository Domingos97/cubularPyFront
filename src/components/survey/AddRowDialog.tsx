import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, X } from 'lucide-react';

interface AddRowDialogProps {
  isOpen: boolean;
  onClose: () => void;
  headers: string[];
  onAddRow: (rowData: string[]) => void;
}

const AddRowDialog = ({ isOpen, onClose, headers, onAddRow }: AddRowDialogProps) => {
  const [formData, setFormData] = useState<string[]>(new Array(headers.length).fill(''));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddRow(formData);
    setFormData(new Array(headers.length).fill(''));
    onClose();
  };

  const handleInputChange = (index: number, value: string) => {
    const newFormData = [...formData];
    newFormData[index] = value;
    setFormData(newFormData);
  };

  const handleReset = () => {
    setFormData(new Array(headers.length).fill(''));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] bg-black/90 border-white/20">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center">
            <Plus className="w-5 h-5 mr-2 text-green-400" />
            Add New Row
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <ScrollArea className="max-h-[400px] pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {headers.map((header, index) => (
                <div key={index} className="space-y-2">
                  <Label className="text-white/80 text-sm font-medium">
                    {header}
                  </Label>
                  <Input
                    value={formData[index]}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    placeholder={`Enter ${header.toLowerCase()}`}
                    className="bg-white/10 border-white/20 text-white placeholder-white/50"
                  />
                </div>
              ))}
            </div>
          </ScrollArea>
          
          <div className="flex items-center justify-between pt-4 border-t border-white/20">
            <Button
              type="button"
              onClick={handleReset}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <X className="w-4 h-4 mr-2" />
              Reset
            </Button>
            
            <div className="flex space-x-2">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Row
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddRowDialog;