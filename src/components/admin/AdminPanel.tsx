import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { 
  Shield, 
  Users, 
  MessageSquare, 
  Settings, 
  BarChart3, 
  Database,
  Activity,
  UserCheck,
  UserX,
  Trash2,
  Edit,
  Eye,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Crown,
  Zap
} from 'lucide-react';
import { blink } from '@/blink/client';

interface User {
  id: string;
  email: string;
  subscriptionTier: string;
  messageCount: number;
  tokenCount: number;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

interface Conversation {
  id: string;
  userId: string;
  userMessage: string;
  aiResponse: string;
  promptTokens: number;
  completionTokens: number;
  model: string;
  createdAt: string;
}

interface AdminLog {
  id: string;
  adminId: string;
  action: string;
  details: string;
  targetUserId?: string;
  timestamp: string;
}

interface SystemSetting {
  id: string;
  settingKey: string;
  settingValue: string;
  updatedBy?: string;
  updatedAt: string;
}

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalMessages: number;
  totalTokens: number;
  freeUsers: number;
  basicUsers: number;
  proUsers: number;
  messagesLast24h: number;
  tokensLast24h: number;
}

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSetting[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalMessages: 0,
    totalTokens: 0,
    freeUsers: 0,
    basicUsers: 0,
    proUsers: 0,
    messagesLast24h: 0,
    tokensLast24h: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingSettings, setEditingSettings] = useState<{ [key: string]: string }>({});

  const loadUsers = async () => {
    try {
      const allUsers = await blink.db.users.list({
        orderBy: { createdAt: 'desc' }
      });
      setUsers(allUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadConversations = async () => {
    try {
      const allConversations = await blink.db.conversations.list({
        orderBy: { createdAt: 'desc' },
        limit: 100
      });
      setConversations(allConversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadAdminLogs = async () => {
    try {
      const logs = await blink.db.adminLogs.list({
        orderBy: { timestamp: 'desc' },
        limit: 50
      });
      setAdminLogs(logs);
    } catch (error) {
      console.error('Failed to load admin logs:', error);
    }
  };

  const loadSystemSettings = async () => {
    try {
      const settings = await blink.db.systemSettings.list({
        orderBy: { settingKey: 'asc' }
      });
      setSystemSettings(settings);
      
      // Initialize editing state
      const editState: { [key: string]: string } = {};
      settings.forEach(setting => {
        editState[setting.settingKey] = setting.settingValue;
      });
      setEditingSettings(editState);
    } catch (error) {
      console.error('Failed to load system settings:', error);
    }
  };

  const loadStats = async () => {
    try {
      const allUsers = await blink.db.users.list();
      const allConversations = await blink.db.conversations.list();
      
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const recentConversations = allConversations.filter(conv => 
        new Date(conv.createdAt) > yesterday
      );

      const newStats: DashboardStats = {
        totalUsers: allUsers.length,
        activeUsers: allUsers.filter(u => Number(u.isActive) > 0).length,
        totalMessages: allConversations.length,
        totalTokens: allConversations.reduce((sum, conv) => 
          sum + (conv.promptTokens || 0) + (conv.completionTokens || 0), 0
        ),
        freeUsers: allUsers.filter(u => u.subscriptionTier === 'free').length,
        basicUsers: allUsers.filter(u => u.subscriptionTier === 'basic').length,
        proUsers: allUsers.filter(u => u.subscriptionTier === 'pro').length,
        messagesLast24h: recentConversations.length,
        tokensLast24h: recentConversations.reduce((sum, conv) => 
          sum + (conv.promptTokens || 0) + (conv.completionTokens || 0), 0
        )
      };
      
      setStats(newStats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadUsers(),
        loadConversations(),
        loadAdminLogs(),
        loadSystemSettings(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Failed to load admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const currentUser = await blink.auth.me();
      
      await blink.db.users.update(userId, { role: newRole });
      
      // Log admin action
      await blink.db.adminLogs.create({
        id: `log_${Date.now()}`,
        adminId: currentUser.id,
        action: 'updated_user_role',
        details: `Changed role to ${newRole}`,
        targetUserId: userId,
        timestamp: new Date().toISOString()
      });
      
      await loadUsers();
      toast.success('User role updated successfully');
    } catch (error) {
      console.error('Failed to update user role:', error);
      toast.error('Failed to update user role');
    }
  };

  const updateUserSubscription = async (userId: string, newTier: string) => {
    try {
      const currentUser = await blink.auth.me();
      
      await blink.db.users.update(userId, { subscriptionTier: newTier });
      
      // Log admin action
      await blink.db.adminLogs.create({
        id: `log_${Date.now()}`,
        adminId: currentUser.id,
        action: 'updated_subscription',
        details: `Changed subscription to ${newTier}`,
        targetUserId: userId,
        timestamp: new Date().toISOString()
      });
      
      await loadUsers();
      await loadStats();
      toast.success('User subscription updated successfully');
    } catch (error) {
      console.error('Failed to update user subscription:', error);
      toast.error('Failed to update user subscription');
    }
  };

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const currentUser = await blink.auth.me();
      
      await blink.db.users.update(userId, { isActive: isActive ? 1 : 0 });
      
      // Log admin action
      await blink.db.adminLogs.create({
        id: `log_${Date.now()}`,
        adminId: currentUser.id,
        action: isActive ? 'activated_user' : 'deactivated_user',
        details: `User ${isActive ? 'activated' : 'deactivated'}`,
        targetUserId: userId,
        timestamp: new Date().toISOString()
      });
      
      await loadUsers();
      await loadStats();
      toast.success(`User ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Failed to toggle user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      const currentUser = await blink.auth.me();
      
      await blink.db.conversations.delete(conversationId);
      
      // Log admin action
      await blink.db.adminLogs.create({
        id: `log_${Date.now()}`,
        adminId: currentUser.id,
        action: 'deleted_conversation',
        details: `Deleted conversation ${conversationId}`,
        timestamp: new Date().toISOString()
      });
      
      await loadConversations();
      await loadStats();
      toast.success('Conversation deleted successfully');
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      toast.error('Failed to delete conversation');
    }
  };

  const updateSystemSetting = async (settingKey: string, settingValue: string) => {
    try {
      const currentUser = await blink.auth.me();
      
      await blink.db.systemSettings.update(
        systemSettings.find(s => s.settingKey === settingKey)?.id || '',
        {
          settingValue,
          updatedBy: currentUser.id,
          updatedAt: new Date().toISOString()
        }
      );
      
      // Log admin action
      await blink.db.adminLogs.create({
        id: `log_${Date.now()}`,
        adminId: currentUser.id,
        action: 'updated_system_setting',
        details: `Updated ${settingKey} to ${settingValue}`,
        timestamp: new Date().toISOString()
      });
      
      await loadSystemSettings();
      toast.success('System setting updated successfully');
    } catch (error) {
      console.error('Failed to update system setting:', error);
      toast.error('Failed to update system setting');
    }
  };

  const getSubscriptionBadge = (tier: string) => {
    const variants = {
      free: { variant: 'secondary' as const, icon: null },
      basic: { variant: 'default' as const, icon: <Zap className="h-3 w-3" /> },
      pro: { variant: 'default' as const, icon: <Crown className="h-3 w-3" /> }
    };
    
    const config = variants[tier as keyof typeof variants] || variants.free;
    
    return (
      <Badge variant={config.variant} className="capitalize">
        {config.icon}
        {tier}
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    return role === 'admin' ? (
      <Badge variant="destructive">
        <Shield className="h-3 w-3 mr-1" />
        Admin
      </Badge>
    ) : (
      <Badge variant="outline">User</Badge>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Admin Panel</h2>
          <Badge variant="destructive" className="ml-2">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Restricted Access
          </Badge>
        </div>
        
        <Button 
          onClick={loadDashboardData} 
          disabled={isLoading}
          variant="outline"
        >
          <Activity className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      <div className="flex-1">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-5 m-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="conversations">Conversations</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>
          
          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="p-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="admin-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.activeUsers} active
                  </p>
                </CardContent>
              </Card>
              
              <Card className="admin-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalMessages}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.messagesLast24h} in last 24h
                  </p>
                </CardContent>
              </Card>
              
              <Card className="admin-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalTokens.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.tokensLast24h.toLocaleString()} in last 24h
                  </p>
                </CardContent>
              </Card>
              
              <Card className="admin-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${(stats.basicUsers * 10 + stats.proUsers * 50).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Monthly estimate
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="admin-card">
                <CardHeader>
                  <CardTitle>Subscription Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Badge variant="secondary">Free</Badge>
                        <span className="text-sm">Free Tier</span>
                      </span>
                      <span className="font-medium">{stats.freeUsers}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Badge variant="default">
                          <Zap className="h-3 w-3 mr-1" />
                          Basic
                        </Badge>
                        <span className="text-sm">$10/month</span>
                      </span>
                      <span className="font-medium">{stats.basicUsers}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Badge variant="default">
                          <Crown className="h-3 w-3 mr-1" />
                          Pro
                        </Badge>
                        <span className="text-sm">$50/month</span>
                      </span>
                      <span className="font-medium">{stats.proUsers}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="admin-card">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-48">
                    <div className="space-y-2">
                      {adminLogs.slice(0, 10).map(log => (
                        <div key={log.id} className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 bg-primary rounded-full" />
                          <span className="font-medium">{log.action.replace('_', ' ')}</span>
                          <span className="text-muted-foreground">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Users Tab */}
          <TabsContent value="users" className="p-4">
            <Card className="admin-card">
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Subscription</TableHead>
                        <TableHead>Messages</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map(user => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.email}</TableCell>
                          <TableCell>{getRoleBadge(user.role)}</TableCell>
                          <TableCell>{getSubscriptionBadge(user.subscriptionTier)}</TableCell>
                          <TableCell>{user.messageCount || 0}</TableCell>
                          <TableCell>
                            {Number(user.isActive) > 0 ? (
                              <Badge variant="default">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <XCircle className="h-3 w-3 mr-1" />
                                Inactive
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Select
                                value={user.role}
                                onValueChange={(value) => updateUserRole(user.id, value)}
                              >
                                <SelectTrigger className="w-20">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">User</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                              
                              <Select
                                value={user.subscriptionTier}
                                onValueChange={(value) => updateUserSubscription(user.id, value)}
                              >
                                <SelectTrigger className="w-20">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="free">Free</SelectItem>
                                  <SelectItem value="basic">Basic</SelectItem>
                                  <SelectItem value="pro">Pro</SelectItem>
                                </SelectContent>
                              </Select>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toggleUserStatus(user.id, Number(user.isActive) === 0)}
                              >
                                {Number(user.isActive) > 0 ? (
                                  <UserX className="h-3 w-3" />
                                ) : (
                                  <UserCheck className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Conversations Tab */}
          <TabsContent value="conversations" className="p-4">
            <Card className="admin-card">
              <CardHeader>
                <CardTitle>Conversation Management</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User Message</TableHead>
                        <TableHead>Model</TableHead>
                        <TableHead>Tokens</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {conversations.map(conv => (
                        <TableRow key={conv.id}>
                          <TableCell className="max-w-xs truncate">
                            {conv.userMessage}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{conv.model}</Badge>
                          </TableCell>
                          <TableCell>
                            {(conv.promptTokens || 0) + (conv.completionTokens || 0)}
                          </TableCell>
                          <TableCell>
                            {new Date(conv.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="outline">
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Conversation Details</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label>User Message</Label>
                                      <div className="p-3 bg-muted rounded-lg">
                                        {conv.userMessage}
                                      </div>
                                    </div>
                                    <div>
                                      <Label>AI Response</Label>
                                      <div className="p-3 bg-muted rounded-lg max-h-48 overflow-y-auto">
                                        {conv.aiResponse}
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <Label>Prompt Tokens</Label>
                                        <p>{conv.promptTokens || 0}</p>
                                      </div>
                                      <div>
                                        <Label>Completion Tokens</Label>
                                        <p>{conv.completionTokens || 0}</p>
                                      </div>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteConversation(conv.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Settings Tab */}
          <TabsContent value="settings" className="p-4">
            <Card className="admin-card">
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {systemSettings.map(setting => (
                    <div key={setting.id} className="flex items-center gap-4">
                      <div className="flex-1">
                        <Label className="capitalize">
                          {setting.settingKey.replace('_', ' ')}
                        </Label>
                        {setting.settingKey === 'system_prompt' ? (
                          <Textarea
                            value={editingSettings[setting.settingKey] || ''}
                            onChange={(e) => setEditingSettings(prev => ({
                              ...prev,
                              [setting.settingKey]: e.target.value
                            }))}
                            rows={3}
                          />
                        ) : (
                          <Input
                            value={editingSettings[setting.settingKey] || ''}
                            onChange={(e) => setEditingSettings(prev => ({
                              ...prev,
                              [setting.settingKey]: e.target.value
                            }))}
                          />
                        )}
                      </div>
                      <Button
                        onClick={() => updateSystemSetting(
                          setting.settingKey,
                          editingSettings[setting.settingKey]
                        )}
                        disabled={editingSettings[setting.settingKey] === setting.settingValue}
                      >
                        Update
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Logs Tab */}
          <TabsContent value="logs" className="p-4">
            <Card className="admin-card">
              <CardHeader>
                <CardTitle>Admin Activity Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Action</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Target User</TableHead>
                        <TableHead>Timestamp</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adminLogs.map(log => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {log.action.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>{log.details}</TableCell>
                          <TableCell>
                            {log.targetUserId ? (
                              <Badge variant="secondary">{log.targetUserId}</Badge>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(log.timestamp).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}