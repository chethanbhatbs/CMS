import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

const Configuration = () => {
  return (
    <div className="space-y-6" data-testid="configuration-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-slate-900">Configuration</h1>
          <p className="text-slate-600 mt-1">System settings and preferences</p>
        </div>
        <Button data-testid="save-config-btn">
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Configuration</CardTitle>
          <CardDescription>Configure system-wide settings and parameters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-slate-500">
            <p>This page will display system configuration options.</p>
            <p className="text-sm mt-2">OCPP parameters and system settings ready</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Configuration;