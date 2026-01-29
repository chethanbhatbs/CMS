import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

const ReportsLogs = () => {
  return (
    <div className="space-y-6" data-testid="reports-logs-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-slate-900">Reports & Logs</h1>
          <p className="text-slate-600 mt-1">View system reports and activity logs</p>
        </div>
        <Button variant="outline" data-testid="export-report-btn">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Reports</CardTitle>
          <CardDescription>Generate and view various system reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-slate-500">
            <p>This page will display system reports and logs.</p>
            <p className="text-sm mt-2">Audit trails and analytics ready</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsLogs;
