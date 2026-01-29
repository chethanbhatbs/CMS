import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';

const RoleManagement = () => {
  return (
    <div className="space-y-6" data-testid="role-management-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-slate-900">Role Management</h1>
          <p className="text-slate-600 mt-1">Configure roles and permissions</p>
        </div>
        <Button data-testid="add-role-btn">
          <Plus className="mr-2 h-4 w-4" />
          Add Role
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>System Roles</CardTitle>
              <CardDescription>Define roles and their access permissions</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
              <Input placeholder="Search roles..." className="pl-9" data-testid="search-roles-input" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center py-8 text-slate-500">
              <p>Role management interface will be displayed here.</p>
              <p className="text-sm mt-2">Fields: Role Name, Description, Permissions, User Count, Status</p>
            </div>
            <div className="border-t border-slate-200 pt-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Current System Roles:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3 border border-slate-200 rounded-lg">
                  <p className="font-medium text-slate-900">SUPER_ADMIN</p>
                  <p className="text-xs text-slate-500 mt-1">Full system access</p>
                </div>
                <div className="p-3 border border-slate-200 rounded-lg">
                  <p className="font-medium text-slate-900">CPO_ADMIN</p>
                  <p className="text-xs text-slate-500 mt-1">Charge Point Operator</p>
                </div>
                <div className="p-3 border border-slate-200 rounded-lg">
                  <p className="font-medium text-slate-900">OPERATOR</p>
                  <p className="text-xs text-slate-500 mt-1">Operations staff</p>
                </div>
                <div className="p-3 border border-slate-200 rounded-lg">
                  <p className="font-medium text-slate-900">FINANCE</p>
                  <p className="text-xs text-slate-500 mt-1">Financial management</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleManagement;