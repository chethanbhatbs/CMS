import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';

const GroupUsers = () => {
  return (
    <div className="space-y-6" data-testid="group-users-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-slate-900">Group Users</h1>
          <p className="text-slate-600 mt-1">Manage corporate and fleet accounts</p>
        </div>
        <Button data-testid="add-group-user-btn">
          <Plus className="mr-2 h-4 w-4" />
          Add Group User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Group User Accounts</CardTitle>
              <CardDescription>Corporate clients and fleet management accounts</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
              <Input placeholder="Search groups..." className="pl-9" data-testid="search-groups-input" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-slate-500">
            <p>Group user management interface will be displayed here.</p>
            <p className="text-sm mt-2">Fields: Company Name, Contact Person, Email, Phone, Member Count, Billing Plan</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GroupUsers;