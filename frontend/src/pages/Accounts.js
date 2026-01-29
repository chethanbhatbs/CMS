import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const Accounts = () => {
  return (
    <div className="space-y-6" data-testid="accounts-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-slate-900">Accounts</h1>
          <p className="text-slate-600 mt-1">Manage user accounts and permissions</p>
        </div>
        <Button data-testid="add-account-btn">
          <Plus className="mr-2 h-4 w-4" />
          Add Account
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Accounts</CardTitle>
          <CardDescription>Manage all user accounts and their roles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-slate-500">
            <p>This page will display user accounts.</p>
            <p className="text-sm mt-2">Role-based access control ready</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Accounts;