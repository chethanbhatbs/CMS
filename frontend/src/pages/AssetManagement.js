import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const AssetManagement = () => {
  return (
    <div className="space-y-6" data-testid="asset-management-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-slate-900">Asset Management</h1>
          <p className="text-slate-600 mt-1">Track and manage charging infrastructure assets</p>
        </div>
        <Button data-testid="add-asset-btn">
          <Plus className="mr-2 h-4 w-4" />
          Add Asset
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assets</CardTitle>
          <CardDescription>Inventory and maintenance tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-slate-500">
            <p>This page will display infrastructure assets.</p>
            <p className="text-sm mt-2">Asset tracking and maintenance scheduling ready</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssetManagement;