import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';

const FranchiseManagement = () => {
  return (
    <div className="space-y-6" data-testid="franchise-management-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-slate-900">Franchise Management</h1>
          <p className="text-slate-600 mt-1">Manage franchise partners and their networks</p>
        </div>
        <Button data-testid="add-franchise-btn">
          <Plus className="mr-2 h-4 w-4" />
          Add Franchise
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Franchise Partners</CardTitle>
              <CardDescription>Organizations operating charging networks under franchise</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
              <Input placeholder="Search franchises..." className="pl-9" data-testid="search-franchises-input" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-slate-500">
            <p>Franchise management interface will be displayed here.</p>
            <p className="text-sm mt-2">Fields: Franchise Name, Contact Person, Email, Phone, Locations, Charge Points, Status</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FranchiseManagement;