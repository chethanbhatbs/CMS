import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const RFIDManagement = () => {
  return (
    <div className="space-y-6" data-testid="rfid-management-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-slate-900">RFID Management</h1>
          <p className="text-slate-600 mt-1">Manage RFID cards and access control</p>
        </div>
        <Button data-testid="add-rfid-btn">
          <Plus className="mr-2 h-4 w-4" />
          Add RFID Card
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>RFID Cards</CardTitle>
          <CardDescription>Manage all RFID cards for charging access</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-slate-500">
            <p>This page will display RFID cards.</p>
            <p className="text-sm mt-2">Card management and validation ready</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RFIDManagement;