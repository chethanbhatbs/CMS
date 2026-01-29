import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';

const AdminUserManagement = () => {
  return (
    <div className="space-y-6" data-testid="admin-users-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-slate-900">Admin User Management</h1>
          <p className="text-slate-600 mt-1">Manage system administrators and staff accounts</p>
        </div>
        <Button data-testid="add-admin-user-btn">
          <Plus className="mr-2 h-4 w-4" />
          Add Admin User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>System Users</CardTitle>
              <CardDescription>Administrators and staff with system access</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
              <Input placeholder="Search users..." className="pl-9" data-testid="search-admin-users-input" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-slate-500">
            <p>Admin user management interface will be displayed here.</p>
            <p className="text-sm mt-2">Fields: Name, Email, Role, Franchise, Status, Last Login, Actions</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUserManagement;