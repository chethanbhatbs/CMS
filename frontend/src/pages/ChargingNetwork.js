import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const ChargingNetwork = () => {
  return (
    <div className="space-y-6" data-testid="charging-network-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-slate-900">Charging Network</h1>
          <p className="text-slate-600 mt-1">Manage your charging network infrastructure</p>
        </div>
        <Button data-testid="add-network-btn">
          <Plus className="mr-2 h-4 w-4" />
          Add Network
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Network Overview</CardTitle>
          <CardDescription>View and manage all networks in your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-slate-500">
            <p>This page will display your charging networks.</p>
            <p className="text-sm mt-2">Ready for OCPP integration</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChargingNetwork;