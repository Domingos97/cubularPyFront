import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { authenticatedFetch } from '@/utils/api';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Search,
  Calendar,
  Filter,
  AlertCircle,
  Info,
  AlertTriangle,
  Bug,
  Trash2,
  Eye,
  Copy,
  X
} from 'lucide-react';
import { buildApiUrl, API_CONFIG } from '@/config';

interface Log {
  id: string;
  action: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  method?: string;
  endpoint?: string;
  status_code?: number;
  user_id?: string;
  session_id?: string;
  request_body?: any;
  response_body?: any;
  response_time?: number;
  ip_address?: string;
  user_agent?: string;
  error_message?: string;
  stack_trace?: string;
  api_key_used?: string;
  provider?: string;
  model?: string;
  tokens_used?: number;
  cost?: number;
  priority?: 'high' | 'normal' | 'low';
  resource?: string;
  resource_id?: string;
  details?: any;
  created_at: string;
}

const AdminLogsManagement = () => {
  const { toast } = useToast();
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(50);
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    level: '',
    method: '',
    endpoint: '',
    startDate: '',
    endDate: '',
  });

  const totalPages = Math.ceil(totalCount / pageSize);

  useEffect(() => {
    fetchLogs();
  }, [currentPage, filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: ((currentPage - 1) * pageSize).toString(),
      });

      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value.trim()) {
          params.append(key, value);
        }
      });

      const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.LOGS}?${params}`);
      console.log('🔍 LOGS - Fetching:', url);

      const response = await authenticatedFetch(url);
      console.log('🔍 LOGS - Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 LOGS - Error:', errorText);
        throw new Error(`Failed to fetch logs: ${response.status}`);
      }

      const data = await response.json();
      console.log('🔍 LOGS - Data received:', {
        hasData: 'data' in data,
        dataCount: data.data?.length || 0,
        totalCount: data.pagination?.total || 0
      });
      
      setLogs(data.data || []);
      setTotalCount(data.pagination?.total || 0);
    } catch (error) {
      console.error('🔍 LOGS - Fetch error:', error);
      toast({
        title: 'Error',
        description: `Failed to fetch logs: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warn':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
      case 'debug':
        return <Bug className="w-4 h-4 text-gray-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getLevelBadgeVariant = (level: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (level) {
      case 'error':
        return 'destructive';
      case 'warn':
        return 'outline';
      case 'info':
        return 'secondary';
      case 'debug':
        return 'outline';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-PT', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setFilters({
      level: '',
      method: '',
      endpoint: '',
      startDate: '',
      endDate: '',
    });
    setCurrentPage(1);
  };

  const deleteAllLogs = async () => {
    if (!window.confirm('Tem certeza que deseja deletar TODOS os logs? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      setLoading(true);
      
      // Use a future date to delete all logs
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1); // One year from now
      
      const response = await authenticatedFetch(buildApiUrl(API_CONFIG.ENDPOINTS.LOGS), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirm: true,
          olderThan: futureDate.toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to delete logs');
      }

      const result = await response.json();

      toast({
        title: 'Sucesso',
        description: `${result.deletedCount || 'Todos os'} logs foram deletados com sucesso`,
        variant: 'default',
      });

      // Refresh the logs list
      await fetchLogs();
    } catch (error) {
      console.error('Error deleting logs:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao deletar os logs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogClick = (log: Log) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copiado',
        description: 'Texto copiado para a área de transferência',
        variant: 'default',
      });
    } catch (error) {
      console.error('Failed to copy text:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao copiar texto',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Logs do Sistema
              </CardTitle>
              <CardDescription className="text-gray-300">
                Visualize e monitore todos os logs do sistema com paginação e filtros
              </CardDescription>
            </div>
            <Button
              onClick={deleteAllLogs}
              variant="destructive"
              size="sm"
              disabled={loading || totalCount === 0}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Deletar Todos
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            <Select value={filters.level || 'all'} onValueChange={(value) => handleFilterChange('level', value === 'all' ? '' : value)}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Nível" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">Todos os níveis</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="warn">Warning</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.method || 'all'} onValueChange={(value) => handleFilterChange('method', value === 'all' ? '' : value)}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Método" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">Todos os métodos</SelectItem>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Endpoint..."
              value={filters.endpoint}
              onChange={(e) => handleFilterChange('endpoint', e.target.value)}
              className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
            />

            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="bg-gray-700 border-gray-600 text-white"
            />

            <div className="flex gap-2">
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
              <Button onClick={clearFilters} variant="outline" size="sm">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-white">{totalCount}</div>
              <div className="text-sm text-gray-300">Total de Logs</div>
            </div>
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-white">{totalPages}</div>
              <div className="text-sm text-gray-300">Páginas</div>
            </div>
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-white">{currentPage}</div>
              <div className="text-sm text-gray-300">Página Atual</div>
            </div>
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-white">{pageSize}</div>
              <div className="text-sm text-gray-300">Logs por Página</div>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border border-gray-700 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700 hover:bg-gray-700/20">
                  <TableHead className="text-gray-300">Nível</TableHead>
                  <TableHead className="text-gray-300">Data/Hora</TableHead>
                  <TableHead className="text-gray-300">Método</TableHead>
                  <TableHead className="text-gray-300">Endpoint</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Usuário</TableHead>
                  <TableHead className="text-gray-300">IP</TableHead>
                  <TableHead className="text-gray-300">Tempo (ms)</TableHead>
                  <TableHead className="text-gray-300">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-gray-400 py-8">
                      Carregando logs...
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-gray-400 py-8">
                      Nenhum log encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id} className="border-gray-700 hover:bg-gray-700/20">
                      <TableCell className="text-white">
                        <div className="flex items-center gap-2">
                          {getLevelIcon(log.level)}
                          <Badge variant={getLevelBadgeVariant(log.level)}>
                            {log.level}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-300 font-mono text-sm">
                        {formatDate(log.timestamp || log.created_at)}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {log.method && (
                          <Badge variant="outline" className="text-xs">
                            {log.method}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-300 font-mono text-sm table-cell-truncate">
                        {log.endpoint || log.action}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {log.status_code && (
                          <Badge 
                            variant={log.status_code < 400 ? "secondary" : "destructive"}
                            className="text-xs"
                          >
                            {log.status_code}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-300 text-sm">
                        {log.user_id || '-'}
                      </TableCell>
                      <TableCell className="text-gray-300 font-mono text-sm">
                        {log.ip_address || '-'}
                      </TableCell>
                      <TableCell className="text-gray-300 text-sm">
                        {log.response_time ? `${log.response_time}ms` : '-'}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        <Button
                          onClick={() => handleLogClick(log)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-gray-600"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-gray-400">
              Mostrando {logs.length} de {totalCount} logs
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1 || loading}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || loading}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1 text-sm text-gray-300">
                <span>Página</span>
                <span className="font-medium">{currentPage}</span>
                <span>de</span>
                <span className="font-medium">{totalPages}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || loading}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages || loading}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              {selectedLog && getLevelIcon(selectedLog.level)}
              Detalhes do Log
              {selectedLog && (
                <Badge variant={getLevelBadgeVariant(selectedLog.level)} className="ml-2">
                  {selectedLog.level}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Informações completas sobre o log selecionado
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-300 block mb-1">ID</label>
                    <div className="flex items-center gap-2">
                      <code className="bg-gray-700 px-2 py-1 rounded text-sm text-green-400 flex-1">
                        {selectedLog.id}
                      </code>
                      <Button
                        onClick={() => copyToClipboard(selectedLog.id)}
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 hover:bg-gray-600"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 block mb-1">Ação/Mensagem</label>
                    <div className="flex items-center gap-2">
                      <div className="bg-gray-700 px-3 py-2 rounded text-sm text-blue-300 flex-1 break-all">
                        {selectedLog.action || 'Nenhuma ação especificada'}
                      </div>
                      {selectedLog.action && (
                        <Button
                          onClick={() => copyToClipboard(selectedLog.action)}
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 hover:bg-gray-600"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 block mb-1">Data/Hora</label>
                    <div className="bg-gray-700 px-3 py-2 rounded text-sm">
                      {formatDate(selectedLog.timestamp || selectedLog.created_at)}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 block mb-1">Nível</label>
                    <div className="flex items-center gap-2">
                      {getLevelIcon(selectedLog.level)}
                      <Badge variant={getLevelBadgeVariant(selectedLog.level)}>
                        {selectedLog.level}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {selectedLog.method && (
                    <div>
                      <label className="text-sm font-medium text-gray-300 block mb-1">Método HTTP</label>
                      <Badge variant="outline" className="text-sm">
                        {selectedLog.method}
                      </Badge>
                    </div>
                  )}

                  {selectedLog.status_code && (
                    <div>
                      <label className="text-sm font-medium text-gray-300 block mb-1">Status Code</label>
                      <Badge 
                        variant={selectedLog.status_code < 400 ? "secondary" : "destructive"}
                        className="text-sm"
                      >
                        {selectedLog.status_code}
                      </Badge>
                    </div>
                  )}

                  {selectedLog.response_time && (
                    <div>
                      <label className="text-sm font-medium text-gray-300 block mb-1">Tempo de Resposta</label>
                      <div className="bg-gray-700 px-3 py-2 rounded text-sm">
                        {selectedLog.response_time}ms
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Endpoint/Action */}
              {(selectedLog.endpoint || selectedLog.action) && (
                <div>
                  <label className="text-sm font-medium text-gray-300 block mb-1">
                    {selectedLog.endpoint ? 'Endpoint' : 'Ação'}
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="bg-gray-700 px-3 py-2 rounded text-sm text-blue-400 flex-1 break-all">
                      {selectedLog.endpoint || selectedLog.action}
                    </code>
                    <Button
                      onClick={() => copyToClipboard(selectedLog.endpoint || selectedLog.action || '')}
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-gray-600"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}

              {/* User Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedLog.user_id && (
                  <div>
                    <label className="text-sm font-medium text-gray-300 block mb-1">ID do Usuário</label>
                    <div className="flex items-center gap-2">
                      <code className="bg-gray-700 px-3 py-2 rounded text-sm text-yellow-400 flex-1">
                        {selectedLog.user_id}
                      </code>
                      <Button
                        onClick={() => copyToClipboard(selectedLog.user_id || '')}
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 hover:bg-gray-600"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}

                {selectedLog.session_id && (
                  <div>
                    <label className="text-sm font-medium text-gray-300 block mb-1">ID da Sessão</label>
                    <div className="flex items-center gap-2">
                      <code className="bg-gray-700 px-3 py-2 rounded text-sm text-purple-400 flex-1 break-all">
                        {selectedLog.session_id}
                      </code>
                      <Button
                        onClick={() => copyToClipboard(selectedLog.session_id || '')}
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 hover:bg-gray-600"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Network Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedLog.ip_address && (
                  <div>
                    <label className="text-sm font-medium text-gray-300 block mb-1">Endereço IP</label>
                    <div className="flex items-center gap-2">
                      <code className="bg-gray-700 px-3 py-2 rounded text-sm text-cyan-400 flex-1">
                        {selectedLog.ip_address}
                      </code>
                      <Button
                        onClick={() => copyToClipboard(selectedLog.ip_address || '')}
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 hover:bg-gray-600"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}

                {(selectedLog.provider || selectedLog.model) && (
                  <div className="space-y-2">
                    {selectedLog.provider && (
                      <div>
                        <label className="text-sm font-medium text-gray-300 block mb-1">Provider</label>
                        <div className="bg-gray-700 px-3 py-2 rounded text-sm">
                          {selectedLog.provider}
                        </div>
                      </div>
                    )}
                    {selectedLog.model && (
                      <div>
                        <label className="text-sm font-medium text-gray-300 block mb-1">Modelo</label>
                        <div className="bg-gray-700 px-3 py-2 rounded text-sm">
                          {selectedLog.model}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* User Agent */}
              {selectedLog.user_agent && (
                <div>
                  <label className="text-sm font-medium text-gray-300 block mb-1">User Agent</label>
                  <div className="flex items-center gap-2">
                    <div className="bg-gray-700 px-3 py-2 rounded text-sm text-gray-300 flex-1 break-all">
                      {selectedLog.user_agent}
                    </div>
                    <Button
                      onClick={() => copyToClipboard(selectedLog.user_agent || '')}
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-gray-600"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {selectedLog.error_message && (
                <div>
                  <label className="text-sm font-medium text-gray-300 block mb-1">Mensagem de Erro</label>
                  <div className="flex items-start gap-2">
                    <div className="bg-red-900/20 border border-red-500/30 px-3 py-2 rounded text-sm text-red-400 flex-1 break-all">
                      {selectedLog.error_message}
                    </div>
                    <Button
                      onClick={() => copyToClipboard(selectedLog.error_message || '')}
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-gray-600 mt-1"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Stack Trace */}
              {selectedLog.stack_trace && (
                <div>
                  <label className="text-sm font-medium text-gray-300 block mb-1">Stack Trace</label>
                  <div className="flex items-start gap-2">
                    <pre className="bg-red-900/10 border border-red-500/20 px-3 py-2 rounded text-xs text-red-300 flex-1 overflow-x-auto whitespace-pre-wrap max-h-40 overflow-y-auto">
                      {selectedLog.stack_trace}
                    </pre>
                    <Button
                      onClick={() => copyToClipboard(selectedLog.stack_trace || '')}
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-gray-600 mt-1"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}

              {/* API and Authentication */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedLog.api_key_used && (
                  <div>
                    <label className="text-sm font-medium text-gray-300 block mb-1">API Key Utilizada</label>
                    <div className="flex items-center gap-2">
                      <code className="bg-gray-700 px-3 py-2 rounded text-sm text-orange-400 flex-1 break-all">
                        {selectedLog.api_key_used}
                      </code>
                      <Button
                        onClick={() => copyToClipboard(selectedLog.api_key_used || '')}
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 hover:bg-gray-600"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}

                {selectedLog.priority && (
                  <div>
                    <label className="text-sm font-medium text-gray-300 block mb-1">Prioridade</label>
                    <Badge 
                      variant={selectedLog.priority === 'high' ? 'destructive' : selectedLog.priority === 'normal' ? 'secondary' : 'outline'}
                      className="text-sm"
                    >
                      {selectedLog.priority}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Resource Information */}
              {(selectedLog.resource || selectedLog.resource_id) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedLog.resource && (
                    <div>
                      <label className="text-sm font-medium text-gray-300 block mb-1">Recurso</label>
                      <div className="bg-gray-700 px-3 py-2 rounded text-sm">
                        {selectedLog.resource}
                      </div>
                    </div>
                  )}

                  {selectedLog.resource_id && (
                    <div>
                      <label className="text-sm font-medium text-gray-300 block mb-1">ID do Recurso</label>
                      <div className="flex items-center gap-2">
                        <code className="bg-gray-700 px-3 py-2 rounded text-sm text-pink-400 flex-1 break-all">
                          {selectedLog.resource_id}
                        </code>
                        <Button
                          onClick={() => copyToClipboard(selectedLog.resource_id || '')}
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 hover:bg-gray-600"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* AI/LLM Information */}
              {(selectedLog.tokens_used || selectedLog.cost) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedLog.tokens_used && (
                    <div>
                      <label className="text-sm font-medium text-gray-300 block mb-1">Tokens Utilizados</label>
                      <div className="bg-gray-700 px-3 py-2 rounded text-sm">
                        {selectedLog.tokens_used.toLocaleString()} tokens
                      </div>
                    </div>
                  )}

                  {selectedLog.cost && (
                    <div>
                      <label className="text-sm font-medium text-gray-300 block mb-1">Custo</label>
                      <div className="bg-gray-700 px-3 py-2 rounded text-sm text-green-400">
                        ${selectedLog.cost.toFixed(6)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Request/Response Bodies */}
              {selectedLog.request_body && (
                <div>
                  <label className="text-sm font-medium text-gray-300 block mb-1">Corpo da Requisição</label>
                  <div className="flex items-start gap-2">
                    <pre className="bg-blue-900/10 border border-blue-500/20 px-3 py-2 rounded text-xs text-blue-300 flex-1 overflow-x-auto whitespace-pre-wrap max-h-40 overflow-y-auto">
                      {typeof selectedLog.request_body === 'string' 
                        ? selectedLog.request_body 
                        : JSON.stringify(selectedLog.request_body, null, 2)}
                    </pre>
                    <Button
                      onClick={() => copyToClipboard(
                        typeof selectedLog.request_body === 'string' 
                          ? selectedLog.request_body 
                          : JSON.stringify(selectedLog.request_body, null, 2)
                      )}
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-gray-600 mt-1"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}

              {selectedLog.response_body && (
                <div>
                  <label className="text-sm font-medium text-gray-300 block mb-1">Corpo da Resposta</label>
                  <div className="flex items-start gap-2">
                    <pre className="bg-green-900/10 border border-green-500/20 px-3 py-2 rounded text-xs text-green-300 flex-1 overflow-x-auto whitespace-pre-wrap max-h-40 overflow-y-auto">
                      {typeof selectedLog.response_body === 'string' 
                        ? selectedLog.response_body 
                        : JSON.stringify(selectedLog.response_body, null, 2)}
                    </pre>
                    <Button
                      onClick={() => copyToClipboard(
                        typeof selectedLog.response_body === 'string' 
                          ? selectedLog.response_body 
                          : JSON.stringify(selectedLog.response_body, null, 2)
                      )}
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-gray-600 mt-1"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Additional Details */}
              {selectedLog.details && (
                <div>
                  <label className="text-sm font-medium text-gray-300 block mb-1">Detalhes Adicionais</label>
                  <div className="flex items-start gap-2">
                    <pre className="bg-purple-900/10 border border-purple-500/20 px-3 py-2 rounded text-xs text-purple-300 flex-1 overflow-x-auto whitespace-pre-wrap max-h-40 overflow-y-auto">
                      {typeof selectedLog.details === 'string' 
                        ? selectedLog.details 
                        : JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                    <Button
                      onClick={() => copyToClipboard(
                        typeof selectedLog.details === 'string' 
                          ? selectedLog.details 
                          : JSON.stringify(selectedLog.details, null, 2)
                      )}
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-gray-600 mt-1"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button
              onClick={() => setIsModalOpen(false)}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <X className="w-4 h-4 mr-2" />
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLogsManagement;
