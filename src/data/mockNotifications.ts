// Mock data for testing hierarchical notifications
import { UserNotification, AdminResponse } from '@/types/notifications';

export const mockAdminResponses: AdminResponse[] = [
  {
    id: 'admin-resp-1',
    notification_id: 'notif-1',
    admin_id: 'admin-001',
    admin_name: 'João Silva',
    response_message: 'Obrigado pela sua solicitação! Estamos analisando a possibilidade de adicionar mais pesquisas na plataforma.',
    response_type: 'reply',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z'
  },
  {
    id: 'admin-resp-2',
    notification_id: 'notif-1',
    admin_id: 'admin-002',
    admin_name: 'Maria Santos',
    response_message: 'Atualizando o status para "em progresso" - nossa equipe técnica já começou a trabalhar na implementação.',
    response_type: 'status_update',
    parent_response_id: 'admin-resp-1',
    created_at: '2024-01-16T14:20:00Z',
    updated_at: '2024-01-16T14:20:00Z'
  },
  {
    id: 'admin-resp-3',
    notification_id: 'notif-1',
    admin_id: 'admin-001',
    admin_name: 'João Silva',
    response_message: 'Ótimas notícias! Adicionamos 5 novas pesquisas na seção de Demografia. Você pode acessá-las agora.',
    response_type: 'resolution',
    parent_response_id: 'admin-resp-2',
    created_at: '2024-01-20T09:15:00Z',
    updated_at: '2024-01-20T09:15:00Z'
  },
  {
    id: 'admin-resp-4',
    notification_id: 'notif-2',
    admin_id: 'admin-002',
    admin_name: 'Maria Santos',
    response_message: 'Recebemos sua sugestão sobre modo escuro. É uma excelente ideia! Vamos incluir no roadmap.',
    response_type: 'reply',
    created_at: '2024-01-18T16:45:00Z',
    updated_at: '2024-01-18T16:45:00Z'
  }
];

export const mockNotifications: UserNotification[] = [
  {
    id: 'notif-1',
    user_id: 'user-123',
    type: 'survey_request',
    title: 'Solicitação de Mais Pesquisas',
    message: 'Gostaria de solicitar mais pesquisas na área de demografia. Apenas 3 estão disponíveis no momento.',
    status: 'resolved',
    priority: 3,
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-01-20T09:15:00Z',
    admin_responses: mockAdminResponses.filter(resp => resp.notification_id === 'notif-1'),
    thread_count: 3,
    last_response_at: '2024-01-20T09:15:00Z'
  },
  {
    id: 'notif-2',
    user_id: 'user-123',
    type: 'feature_request',
    title: 'Modo Escuro para a Interface',
    message: 'Seria possível implementar um modo escuro? Uso muito a plataforma à noite e seria mais confortável.',
    status: 'in_progress',
    priority: 2,
    created_at: '2024-01-18T15:30:00Z',
    updated_at: '2024-01-18T16:45:00Z',
    admin_responses: mockAdminResponses.filter(resp => resp.notification_id === 'notif-2'),
    thread_count: 1,
    last_response_at: '2024-01-18T16:45:00Z'
  },
  {
    id: 'notif-3',
    user_id: 'user-123',
    type: 'support_request',
    title: 'Problema com Login',
    message: 'Estou tendo dificuldades para fazer login na plataforma. O botão não responde.',
    status: 'pending',
    priority: 4,
    created_at: '2024-01-22T11:20:00Z',
    updated_at: '2024-01-22T11:20:00Z',
    admin_responses: [],
    thread_count: 0
  }
];