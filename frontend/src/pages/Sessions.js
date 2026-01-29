import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

const Sessions = () => {
  return (
    <div className="space-y-6" data-testid="sessions-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-slate-900">Charging Sessions</h1>
          <p className="text-slate-600 mt-1">View and manage charging sessions</p>
        </div>
        <Button variant="outline" data-testid="export-sessions-btn">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Session History</CardTitle>
          <CardDescription>All charging sessions with detailed information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-slate-500">
            <p>This page will display charging sessions.</p>
            <p className="text-sm mt-2">Real-time session monitoring ready</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Sessions;