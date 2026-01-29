import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const ChargingLocations = () => {
  return (
    <div className="space-y-6" data-testid="charging-locations-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-slate-900">Charging Locations</h1>
          <p className="text-slate-600 mt-1">Manage physical locations of charging stations</p>
        </div>
        <Button data-testid="add-location-btn">
          <Plus className="mr-2 h-4 w-4" />
          Add Location
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Locations</CardTitle>
          <CardDescription>All charging station locations in your network</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-slate-500">
            <p>This page will display your charging locations.</p>
            <p className="text-sm mt-2">Map integration ready</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChargingLocations;