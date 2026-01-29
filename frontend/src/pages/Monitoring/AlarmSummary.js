import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';

const AlarmSummary = () => {
  return (
    <div className="space-y-6" data-testid="alarm-summary-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-slate-900">Alarm Summary</h1>
          <p className="text-slate-600 mt-1">Monitor and manage system alarms</p>
        </div>
      </div>

      {/* Alarm Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Critical Alarms</p>
                <p className="text-3xl font-bold text-red-600 mt-2">3</p>
              </div>
              <div className="p-3 rounded-lg bg-red-50">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Warning Alarms</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">7</p>
              </div>
              <div className="p-3 rounded-lg bg-orange-50">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Resolved Today</p>
                <p className="text-3xl font-bold text-green-600 mt-2">12</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Active Alarms</CardTitle>
              <CardDescription>Current system alarms requiring attention</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
              <Input placeholder="Search alarms..." className="pl-9" data-testid="search-alarms-input" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-slate-500">
            <p>Active alarms will be displayed here.</p>
            <p className="text-sm mt-2">Fields: Severity, Charge Point, Alarm Type, Message, Timestamp, Status, Actions</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AlarmSummary;