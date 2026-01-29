import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const ChargePoints = () => {
  return (
    <div className="space-y-6" data-testid="charge-points-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-slate-900">Charge Points</h1>
          <p className="text-slate-600 mt-1">Manage individual charging points and their status</p>
        </div>
        <Button data-testid="add-chargepoint-btn">
          <Plus className="mr-2 h-4 w-4" />
          Add Charge Point
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Charge Points</CardTitle>
          <CardDescription>Monitor and control all charging points</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-slate-500">
            <p>This page will display your charge points.</p>
            <p className="text-sm mt-2">OCPP protocol integration ready</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChargePoints;