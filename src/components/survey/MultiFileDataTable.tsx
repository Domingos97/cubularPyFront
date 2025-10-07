import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Edit,
  Trash2,
  Plus
} from 'lucide-react';
import { ParsedSurveyData } from '@/types/survey';

// Utility function to count unique participants based on 'Pessoa' column
const getUniqueParticipantCount = (data: ParsedSurveyData, participantColumn: string = 'Pessoa') => {
  if (!data || !data.headers || !data.rows || data.rows.length === 0) return 0;
  const colIndex = data.headers.findIndex(h => h.trim().toLowerCase() === participantColumn.trim().toLowerCase());
  if (colIndex === -1) return 0;
  const participants = new Set<string>();
  for (const row of data.rows) {
    if (row[colIndex]) {
      participants.add(row[colIndex].trim());
    }
  }
  return participants.size;
};

interface MultiFileDataTableProps {
  data: ParsedSurveyData;
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onDataChange?: (newRows: string[][]) => void;
}

export const MultiFileDataTable: React.FC<MultiFileDataTableProps> = ({
  data,
  currentPage,
  itemsPerPage,
  onPageChange,
  onDataChange
}) => {
  const [editingCell, setEditingCell] = useState<{row: number, col: number} | null>(null);
  const [editValue, setEditValue] = useState('');
  
  const totalPages = Math.ceil(data.rows.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRows = data.rows.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  const handleEditCell = (rowIndex: number, colIndex: number, currentValue: string) => {
    const actualRowIndex = startIndex + rowIndex;
    setEditingCell({row: actualRowIndex, col: colIndex});
    setEditValue(currentValue);
  };

  const handleSaveEdit = () => {
    if (editingCell && onDataChange) {
      const newRows = [...data.rows];
      newRows[editingCell.row][editingCell.col] = editValue;
      onDataChange(newRows);
    }
    setEditingCell(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleDeleteRow = (rowIndex: number) => {
    if (onDataChange && window.confirm('Are you sure you want to delete this row?')) {
      const actualRowIndex = startIndex + rowIndex;
      const newRows = data.rows.filter((_, index) => index !== actualRowIndex);
      onDataChange(newRows);
      
      // Adjust current page if we deleted the last item on a page
      const newTotalPages = Math.ceil(newRows.length / itemsPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        onPageChange(newTotalPages);
      }
    }
  };

  const handleAddRow = () => {
    if (onDataChange) {
      // Create a new row with empty values for each column
      const newRow = new Array(data.headers.length).fill('');
      const newRows = [...data.rows, newRow];
      onDataChange(newRows);
      
      // Navigate to the last page to show the new row
      const newTotalPages = Math.ceil(newRows.length / itemsPerPage);
      onPageChange(newTotalPages);
    }
  };

  const isEditing = (rowIndex: number, colIndex: number) => {
    const actualRowIndex = startIndex + rowIndex;
    return editingCell?.row === actualRowIndex && editingCell?.col === colIndex;
  };

  return (
    <div className="space-y-4">
      {/* Data Table */}
      <div className="overflow-x-auto">
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-12">
                  #
                </th>
                {data.headers.map((header, index) => (
                  <th key={index} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {header}
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-20">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {currentRows.map((row, rowIndex) => {
                const actualRowIndex = startIndex + rowIndex;
                return (
                  <tr key={actualRowIndex} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-white font-mono">
                      {actualRowIndex + 1}
                    </td>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-3 text-sm text-gray-300 max-w-xs">
                        {isEditing(rowIndex, cellIndex) ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="h-8 bg-gray-700 border-gray-600 text-white text-sm"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveEdit();
                                } else if (e.key === 'Escape') {
                                  handleCancelEdit();
                                }
                              }}
                              autoFocus
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-green-400 hover:text-green-300"
                              onClick={handleSaveEdit}
                            >
                              ✓
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-red-400 hover:text-red-300"
                              onClick={handleCancelEdit}
                            >
                              ✕
                            </Button>
                          </div>
                        ) : (
                          <div 
                            title={cell} 
                            className="truncate cursor-pointer hover:bg-gray-700/50 p-1 rounded"
                            onClick={() => handleEditCell(rowIndex, cellIndex, cell)}
                          >
                            {cell || '-'}
                          </div>
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-blue-400"
                          onClick={() => handleEditCell(rowIndex, 0, row[0])}
                          title="Edit first cell"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-red-400"
                          onClick={() => handleDeleteRow(rowIndex)}
                          title="Delete row"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Data Summary */}
      <div className="flex items-center justify-between text-sm text-gray-400 py-2 border-t border-gray-700">
        <div>
          {data.rows.length} responses from {getUniqueParticipantCount(data)} unique participants
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          {/* Results info */}
          <div className="text-sm text-gray-400">
            Showing {startIndex + 1} to {Math.min(endIndex, data.rows.length)} of {data.rows.length} entries
          </div>

          {/* Pagination controls */}
          <div className="flex items-center gap-1">
            {/* First page */}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-gray-600 text-gray-300 hover:bg-gray-700"
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>

            {/* Previous page */}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-gray-600 text-gray-300 hover:bg-gray-700"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Page numbers */}
            {getPageNumbers().map((pageNum) => (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? "default" : "outline"}
                size="icon"
                className={`h-8 w-8 ${
                  currentPage === pageNum
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "border-gray-600 text-gray-300 hover:bg-gray-700"
                }`}
                onClick={() => goToPage(pageNum)}
              >
                {pageNum}
              </Button>
            ))}

            {/* Next page */}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-gray-600 text-gray-300 hover:bg-gray-700"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Last page */}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-gray-600 text-gray-300 hover:bg-gray-700"
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Items per page selector could go here in future */}
          <div className="text-sm text-gray-400">
            Page {currentPage} of {totalPages}
          </div>
        </div>
      )}

      {/* Add Row Button */}
      <div className="flex justify-center pt-2">
        <Button
          variant="outline"
          size="sm"
          className="border-gray-600 text-gray-300 hover:bg-gray-700"
          onClick={handleAddRow}
          disabled={!onDataChange}
          title="Add new row to the survey"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Row
        </Button>
      </div>
    </div>
  );
};