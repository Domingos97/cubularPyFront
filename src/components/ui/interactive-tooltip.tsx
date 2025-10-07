
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface InteractiveTooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  searchTerm?: string;
}

export function InteractiveTooltip({ children, content, searchTerm }: InteractiveTooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent 
        className="w-72 p-3 bg-gray-800 border-gray-700 text-[11px] text-gray-200 shadow-xl relative"
      >
        <Button
          variant="ghost"
          size="icon" 
          className="absolute right-1 top-1 h-5 w-5 p-0 hover:bg-gray-700 hover:text-gray-300 rounded-full"
          onClick={() => setOpen(false)}
        >
          <X className="h-3 w-3" />
        </Button>
        <div className="mb-1 text-blue-400 text-[10px] font-medium">
          {searchTerm ? `Related to "${searchTerm}"` : 'Information'}
        </div>
        <div className="text-[11px] text-gray-300 max-h-[200px] overflow-y-auto">{content}</div>
      </PopoverContent>
    </Popover>
  );
}
