import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, UserPlus, CheckCircle, XCircle, MoreVertical, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Breadcrumb from '@/components/Breadcrumb';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MODULES = [
  'Dashboard', 'CRM', 'Charging Network', 'Operations', 
  'Remote Operations', 'Monitoring', 'Administration'
];

const RoleDialog = ({ isOpen, onClose, onSubmit, title, formData, onFieldChange, onPermissionChange }) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Configure role permissions for system modules</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>Role Name <span className="text-red-500">*</span></Label>
            <Input
              value={formData.role_name}
              onChange={(e) => onFieldChange('role_name', e.target.value)}
              placeholder="Operations Manager"
              data-testid="role-name-input"
            />
          </div>
          
          <div>
            <Label>Description</Label>
            <Input
              value={formData.description}
              onChange={(e) => onFieldChange('description', e.target.value)}
              placeholder="Manages daily operations"
              data-testid="role-description-input"
            />
          </div>
          
          <div>
            <Label className="text-base font-semibold">Permissions Matrix</Label>
            <div className="mt-3 border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Module</TableHead>
                    <TableHead className="text-center">View</TableHead>
                    <TableHead className="text-center">Modify</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MODULES.map((module) => (
                    <TableRow key={module}>
                      <TableCell className="font-medium">{module}</TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={formData.permissions[module]?.view || false}
                          onCheckedChange={(checked) => onPermissionChange(module, 'view', checked)}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={formData.permissions[module]?.modify || false}
                          onCheckedChange={(checked) => onPermissionChange(module, 'modify', checked)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={!formData.role_name}
            data-testid="submit-role-btn"
          >
            Create Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const InviteUserDialog = ({ isOpen, onClose, onSubmit, formData, onFieldChange, roles }) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
          <DialogDescription>Send invitation email with 24-hour activation link</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>Full Name <span className="text-red-500">*</span></Label>
            <Input
              value={formData.full_name}
              onChange={(e) => onFieldChange('full_name', e.target.value)}
              placeholder="John Doe"
              data-testid="invite-name-input"
            />
          </div>
          
          <div>
            <Label>Email <span className="text-red-500">*</span></Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => onFieldChange('email', e.target.value)}
              placeholder="john@example.com"
              data-testid="invite-email-input"
            />
          </div>
          
          <div>
            <Label>Phone</Label>
            <Input
              value={formData.phone}
              onChange={(e) => onFieldChange('phone', e.target.value)}
              placeholder="+1234567890"
              data-testid="invite-phone-input"
            />
          </div>
          
          <div>
            <Label>Role <span className="text-red-500">*</span></Label>
            <Input
              value={formData.role}
              onChange={(e) => onFieldChange('role', e.target.value)}
              placeholder="OPERATOR"
              data-testid="invite-role-input"
            />
            <p className="text-xs text-slate-500 mt-1">SUPER_ADMIN, CPO_ADMIN, OPERATOR, FINANCE</p>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={!formData.full_name || !formData.email || !formData.role}
            data-testid="submit-invite-btn"
          >
            Send Invitation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const RoleManagement = () => {
  const { token, user } = useAuth();
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
  const [isInviteUserOpen, setIsInviteUserOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [roleFormData, setRoleFormData] = useState({
    role_name: '',
    description: '',
    permissions: {}
  });
  const [inviteFormData, setInviteFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'OPERATOR'
  });

  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN') {
      fetchRoles();
      fetchUsers();
    }
  }, [user]);

  const fetchRoles = async () => {
    try {
      const response = await axios.get(`${API}/roles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRoles(response.data);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/users/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleFieldChange = (field, value) => {
    setRoleFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePermissionChange = (module, permission, checked) => {
    setRoleFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: {
          ...prev.permissions[module],
          [permission]: checked
        }
      }
    }));
  };

  const handleInviteFieldChange = (field, value) => {
    setInviteFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetRoleForm = () => {
    setRoleFormData({
      role_name: '',
      description: '',
      permissions: {}
    });
  };

  const resetInviteForm = () => {
    setInviteFormData({
      full_name: '',
      email: '',
      phone: '',
      role: 'OPERATOR'
    });
  };

  const handleCreateRole = async () => {
    try {
      await axios.post(`${API}/roles`, roleFormData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success('Role created successfully', {
        description: `${roleFormData.role_name} has been created`,
        style: { '--toast-description-color': 'rgb(71, 85, 105)' }
      });
      setIsCreateRoleOpen(false);
      resetRoleForm();
      fetchRoles();
    } catch (error) {
      toast.error('Failed to create role', {
        description: error.response?.data?.detail || 'An error occurred',
        style: { '--toast-description-color': 'rgb(71, 85, 105)' }
      });
    }
  };

  const handleEditRole = async () => {
    try {
      await axios.put(`${API}/roles/${selectedRole.id}`, roleFormData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success('Role updated successfully', {
        description: `${roleFormData.role_name} has been updated`,
        style: { '--toast-description-color': 'rgb(71, 85, 105)' }
      });
      setIsEditRoleOpen(false);
      setSelectedRole(null);
      resetRoleForm();
      fetchRoles();
    } catch (error) {
      toast.error('Failed to update role', {
        description: error.response?.data?.detail || 'An error occurred',
        style: { '--toast-description-color': 'rgb(71, 85, 105)' }
      });
    }
  };

  const handleDeleteRole = async (roleId, roleName) => {
    // Prevent deletion of system roles
    if (['SUPER_ADMIN', 'CPO_ADMIN', 'OPERATOR', 'FINANCE'].includes(roleName)) {
      toast.error('Cannot delete system role', {
        description: `${roleName} is a protected system role`,
        style: { '--toast-description-color': 'rgb(71, 85, 105)' }
      });
      return;
    }

    // Check if it's user's own role
    if (user.role === roleName) {
      toast.error('Cannot delete your own role', {
        description: 'You cannot delete the role assigned to yourself',
        style: { '--toast-description-color': 'rgb(71, 85, 105)' }
      });
      return;
    }

    if (!window.confirm(`Delete role "${roleName}"? This cannot be undone.`)) return;

    try {
      await axios.delete(`${API}/roles/${roleId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success('Role deleted', {
        description: `${roleName} has been removed`,
        style: { '--toast-description-color': 'rgb(71, 85, 105)' }
      });
      fetchRoles();
    } catch (error) {
      toast.error('Failed to delete role');
    }
  };

  const openEditRole = (role) => {
    setSelectedRole(role);
    setRoleFormData({
      role_name: role.role_name,
      description: role.description,
      permissions: role.permissions || {}
    });
    setIsEditRoleOpen(true);
  };

  const handleInviteUser = async () => {
    try {
      const response = await axios.post(`${API}/users/invite`, inviteFormData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success('Invitation sent', {
        description: `Activation link sent to ${inviteFormData.email} (valid for 24 hours)`,
        style: { '--toast-description-color': 'rgb(71, 85, 105)' }
      });
      setIsInviteUserOpen(false);
      resetInviteForm();
    } catch (error) {
      toast.error('Failed to send invitation', {
        description: error.response?.data?.detail || 'An error occurred',
        style: { '--toast-description-color': 'rgb(71, 85, 105)' }
      });
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      await axios.patch(`${API}/users/${userId}/status`, null, {
        params: { is_active: !currentStatus },
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'}`, {
        style: { '--toast-description-color': 'rgb(71, 85, 105)' }
      });
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  if (user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Access denied. SUPER_ADMIN role required.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="role-management-page">
      <Breadcrumb items={[{ label: 'Role Management', href: null }]} />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-slate-900">Role Management</h1>
          <p className="text-slate-600 mt-1">Configure roles and permissions (SUPER_ADMIN only)</p>
        </div>
      </div>

      <Tabs defaultValue="roles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="users">User Status</TabsTrigger>
          <TabsTrigger value="invite">Invite User</TabsTrigger>
        </TabsList>

        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>System Roles</CardTitle>
                <Button onClick={() => setIsCreateRoleOpen(true)} data-testid="create-role-btn">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Role
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {roles.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <p>No custom roles configured.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>User Count</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell className="font-medium">{role.role_name}</TableCell>
                        <TableCell className="text-sm text-slate-600">{role.description}</TableCell>
                        <TableCell>{role.user_count}</TableCell>
                        <TableCell><Badge>{role.status}</Badge></TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditRole(role)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteRole(role.id, role.role_name)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Status</CardTitle>
              <CardDescription>All system users and their current status</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Email Verified</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((userItem) => (
                      <TableRow key={userItem.id}>
                        <TableCell className="font-medium">{userItem.full_name}</TableCell>
                        <TableCell className="text-sm">{userItem.email}</TableCell>
                        <TableCell className="text-sm">{userItem.phone || '—'}</TableCell>
                        <TableCell><Badge variant="outline">{userItem.role}</Badge></TableCell>
                        <TableCell>
                          {userItem.email_verified ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-slate-400" />
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {userItem.last_login ? new Date(userItem.last_login).toLocaleString() : 'Never'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={userItem.is_active ? 'default' : 'secondary'}>
                            {userItem.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleUserStatus(userItem.id, userItem.is_active)}
                          >
                            {userItem.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invite">
          <Card>
            <CardHeader>
              <CardTitle>Invite New User</CardTitle>
              <CardDescription>Send activation email with 24-hour validity</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setIsInviteUserOpen(true)} data-testid="invite-user-btn">
                <UserPlus className="mr-2 h-4 w-4" />
                Invite User
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <RoleDialog
        isOpen={isCreateRoleOpen}
        onClose={() => {
          setIsCreateRoleOpen(false);
          resetRoleForm();
        }}
        onSubmit={handleCreateRole}
        title="Create Role"
        formData={roleFormData}
        onFieldChange={handleRoleFieldChange}
        onPermissionChange={handlePermissionChange}
      />

      <RoleDialog
        isOpen={isEditRoleOpen}
        onClose={() => {
          setIsEditRoleOpen(false);
          setSelectedRole(null);
          resetRoleForm();
        }}
        onSubmit={handleEditRole}
        title="Edit Role"
        formData={roleFormData}
        onFieldChange={handleRoleFieldChange}
        onPermissionChange={handlePermissionChange}
      />

      <InviteUserDialog
        isOpen={isInviteUserOpen}
        onClose={() => {
          setIsInviteUserOpen(false);
          resetInviteForm();
        }}
        onSubmit={handleInviteUser}
        formData={inviteFormData}
        onFieldChange={handleInviteFieldChange}
        roles={roles}
      />
    </div>
  );
};

export default RoleManagement;
