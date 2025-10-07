import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, Database, Activity, TrendingUp, Clock, Shield } from 'lucide-react';
import { useTranslation } from '@/resources/i18n';

interface DashboardStats {
  totalUsers: number;
  totalSurveys: number;
  activeUsers: number;
  adminUsers: number;
  recentActivity: ActivityItem[];
  systemHealth: {
    uptime: number;
    responseTime: number;
    errorRate: number;
  };
}

interface ActivityItem {
  id: string;
  type: 'user_created' | 'survey_uploaded' | 'user_login' | 'admin_action';
  description: string;
  timestamp: string;
  user?: string;
}

interface AdminDashboardProps {
  users: any[];
  surveys: any[];
}

export const AdminDashboard = ({ users, surveys }: AdminDashboardProps) => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalSurveys: 0,
    activeUsers: 0,
    adminUsers: 0,
    recentActivity: [],
    systemHealth: {
      uptime: 99.9,
      responseTime: 120,
      errorRate: 0.1
    }
  });

  useEffect(() => {
    // Calculate real stats from data
    const adminCount = users.filter(u => u.role === 'admin').length;
    const userCount = users.filter(u => u.role === 'user').length;
    
    // Simulate recent activity
    const mockActivity: ActivityItem[] = [
      {
        id: '1',
        type: 'user_created',
        description: t('dashboard.activity.types.userCreated'),
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        user: 'john.doe@example.com'
      },
      {
        id: '2',
        type: 'survey_uploaded',
        description: t('dashboard.activity.types.surveyUploaded'),
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        user: 'admin@example.com'
      },
      {
        id: '3',
        type: 'admin_action',
        description: t('dashboard.activity.types.adminAction'),
        timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        user: 'admin@example.com'
      },
      {
        id: '4',
        type: 'user_login',
        description: t('dashboard.activity.types.userLogin'),
        timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        user: 'user@example.com'
      }
    ];

    setStats({
      totalUsers: users.length,
      totalSurveys: surveys.length,
      activeUsers: Math.floor(users.length * 0.7), // Simulate 70% active
      adminUsers: adminCount,
      recentActivity: mockActivity,
      systemHealth: {
        uptime: 99.9,
        responseTime: 120,
        errorRate: 0.1
      }
    });
  }, [users, surveys]);

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'user_created':
        return <Users className="w-4 h-4 text-blue-500" />;
      case 'survey_uploaded':
        return <Database className="w-4 h-4 text-green-500" />;
      case 'user_login':
        return <Activity className="w-4 h-4 text-purple-500" />;
      case 'admin_action':
        return <Shield className="w-4 h-4 text-orange-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'user_created':
        return 'bg-blue-500/10 border-blue-500/20';
      case 'survey_uploaded':
        return 'bg-green-500/10 border-green-500/20';
      case 'user_login':
        return 'bg-purple-500/10 border-purple-500/20';
      case 'admin_action':
        return 'bg-orange-500/10 border-orange-500/20';
      default:
        return 'bg-gray-500/10 border-gray-500/20';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-800/80 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">{t('dashboard.stats.totalUsers')}</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-400">
                {stats.adminUsers} {t('dashboard.stats.admins')}
              </Badge>
              <Badge variant="outline" className="text-xs border-gray-500/30 text-gray-400">
                {stats.totalUsers - stats.adminUsers} {t('dashboard.stats.users')}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/80 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">{t('dashboard.stats.activeUsers')}</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.activeUsers}</div>
            <div className="mt-2">
              <Progress 
                value={(stats.activeUsers / stats.totalUsers) * 100} 
                className="h-2"
              />
              <p className="text-xs text-gray-400 mt-1">
                {Math.round((stats.activeUsers / stats.totalUsers) * 100)}% {t('dashboard.stats.ofTotalUsers')}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/80 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">{t('dashboard.stats.surveyData')}</CardTitle>
            <Database className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalSurveys}</div>
            <p className="text-xs text-gray-400 mt-2">
              {stats.totalSurveys > 0 ? t('dashboard.stats.filesUploaded') : t('dashboard.stats.noSurveys')}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/80 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">{t('dashboard.stats.systemHealth')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{stats.systemHealth.uptime}%</div>
            <p className="text-xs text-gray-400 mt-2">
              {stats.systemHealth.responseTime}ms {t('dashboard.stats.avgResponse')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-gray-800/80 border-gray-700">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-blue-500" />
            <CardTitle className="text-white">{t('dashboard.activity.title')}</CardTitle>
          </div>
          <CardDescription className="text-gray-400">
            {t('dashboard.activity.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.recentActivity.map((activity) => (
              <div 
                key={activity.id} 
                className={`flex items-center space-x-3 p-3 rounded-lg border ${getActivityColor(activity.type)}`}
              >
                {getActivityIcon(activity.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">{activity.description}</p>
                  {activity.user && (
                    <p className="text-xs text-gray-400">{activity.user}</p>
                  )}
                </div>
                <div className="text-xs text-gray-400">
                  {formatTimeAgo(activity.timestamp)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gray-800/80 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-lg">{t('dashboard.performance.uptime')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-400">{stats.systemHealth.uptime}%</div>
            <Progress value={stats.systemHealth.uptime} className="mt-2 h-2" />
            <p className="text-xs text-gray-400 mt-2">{t('dashboard.performance.last30Days')}</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/80 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-lg">{t('dashboard.performance.responseTime')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-400">{stats.systemHealth.responseTime}ms</div>
            <Progress value={Math.max(0, 100 - stats.systemHealth.responseTime / 10)} className="mt-2 h-2" />
            <p className="text-xs text-gray-400 mt-2">{t('dashboard.performance.averageResponseTime')}</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/80 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-lg">{t('dashboard.performance.errorRate')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-400">{stats.systemHealth.errorRate}%</div>
            <Progress value={stats.systemHealth.errorRate * 10} className="mt-2 h-2" />
            <p className="text-xs text-gray-400 mt-2">{t('dashboard.performance.errorRateThreshold')}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};