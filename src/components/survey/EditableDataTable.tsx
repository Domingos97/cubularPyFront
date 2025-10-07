import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, Save, X, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AddRowDialog from './AddRowDialog';
import EditRowDialog from './EditRowDialog';

interface EditableDataTableProps {
  headers: string[];
  rows: string[][];
  totalResponses: number;
  onDataChange: (newRows: string[][]) => void;
}

const EditableDataTable = ({ headers, rows, totalResponses, onDataChange }: EditableDataTableProps) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<{ index: number; data: string[] } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const rowsPerPage = 50;

  const filteredRows = rows.filter(row =>
    row.some(cell => 
      cell.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const paginatedRows = filteredRows.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);

  const handleAddRow = (newRow: string[]) => {
    const updatedRows = [...rows, newRow];
    onDataChange(updatedRows);
    setHasUnsavedChanges(true);
    toast({
      title: "Success",
      description: "New row added successfully",
    });
  };

  const handleEditRow = (index: number, updatedRow: string[]) => {
    const updatedRows = [...rows];
    updatedRows[index] = updatedRow;
    onDataChange(updatedRows);
    setHasUnsavedChanges(true);
    setEditingRow(null);
    toast({
      title: "Success",
      description: "Row updated successfully",
    });
  };

  const handleDeleteRow = (index: number) => {
    const updatedRows = rows.filter((_, i) => i !== index);
    onDataChange(updatedRows);
    setHasUnsavedChanges(true);
    toast({
      title: "Success",
      description: "Row deleted successfully",
    });
  };

  const handleBulkDelete = () => {
    const sortedIndices = Array.from(selectedRows).sort((a, b) => b - a);
    let updatedRows = [...rows];
    
    sortedIndices.forEach(index => {
      updatedRows.splice(index, 1);
    });
    
    onDataChange(updatedRows);
    setSelectedRows(new Set());
    setHasUnsavedChanges(true);
    toast({
      title: "Success",
      description: `${selectedRows.size} rows deleted successfully`,
    });
  };

  const toggleRowSelection = (index: number) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedRows(newSelection);
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
            <Input
              placeholder="Search data..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder-white/50 w-64"
            />
          </div>
          
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-green-600/20 hover:bg-green-600/30 text-green-300 border-green-500/30"
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Row
          </Button>
          
          {selectedRows.size > 0 && (
            <Button
              onClick={handleBulkDelete}
              variant="outline"
              className="bg-red-600/20 hover:bg-red-600/30 text-red-300 border-red-500/30"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected ({selectedRows.size})
            </Button>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {hasUnsavedChanges && (
            <Badge variant="outline" className="bg-yellow-600/20 text-yellow-300 border-yellow-500/30">
              Unsaved Changes
            </Badge>
          )}
          <Badge variant="secondary" className="bg-white/10 text-white">
            {filteredRows.length} of {totalResponses} responses
          </Badge>
        </div>
      </div>

      {/* Data Table */}
      <ScrollArea className="h-[600px] w-full">
        <Table>
          <TableHeader>
            <TableRow className="border-white/20">
              <TableHead className="text-white/70 font-semibold w-12">
                <input
                  type="checkbox"
                  checked={selectedRows.size === paginatedRows.length && paginatedRows.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      const newSelection = new Set<number>();
                      paginatedRows.forEach((_, index) => {
                        newSelection.add((currentPage - 1) * rowsPerPage + index);
                      });
                      setSelectedRows(newSelection);
                    } else {
                      setSelectedRows(new Set());
                    }
                  }}
                  className="rounded"
                />
              </TableHead>
              <TableHead className="text-white/70 font-semibold">#</TableHead>
              {headers.map((header, index) => (
                <TableHead key={index} className="text-white/70 font-semibold">
                  {header}
                </TableHead>
              ))}
              <TableHead className="text-white/70 font-semibold w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRows.map((row, rowIndex) => {
              const actualIndex = (currentPage - 1) * rowsPerPage + rowIndex;
              return (
                <TableRow key={actualIndex} className="border-white/10 hover:bg-white/5">
                  <TableCell className="text-white/80">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(actualIndex)}
                      onChange={() => toggleRowSelection(actualIndex)}
                      className="rounded"
                    />
                  </TableCell>
                  <TableCell className="text-white/80">
                    {actualIndex + 1}
                  </TableCell>
                  {row.map((cell, cellIndex) => (
                    <TableCell key={cellIndex} className="text-white">
                      {cell || '-'}
                    </TableCell>
                  ))}
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Button
                        onClick={() => setEditingRow({ index: actualIndex, data: row })}
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-blue-400 hover:bg-blue-600/20"
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteRow(actualIndex)}
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-red-400 hover:bg-red-600/20"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </ScrollArea>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            variant="outline"
            size="sm"
            className="border-white/20 text-white hover:bg-white/10"
          >
            Previous
          </Button>
          
          <span className="text-white/70">
            Page {currentPage} of {totalPages}
          </span>
          
          <Button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            variant="outline"
            size="sm"
            className="border-white/20 text-white hover:bg-white/10"
          >
            Next
          </Button>
        </div>
      )}

      {/* Dialogs */}
      <AddRowDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        headers={headers}
        onAddRow={handleAddRow}
      />

      {editingRow && (
        <EditRowDialog
          isOpen={!!editingRow}
          onClose={() => setEditingRow(null)}
          headers={headers}
          rowData={editingRow.data}
          onSave={(updatedRow) => handleEditRow(editingRow.index, updatedRow)}
        />
      )}
    </div>
  );
};

export default EditableDataTable;