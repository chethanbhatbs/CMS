import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, StopCircle } from 'lucide-react';

const ActiveSessions = () => {
  return (
    <div className="space-y-6" data-testid="active-sessions-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-slate-900">Active Sessions</h1>
          <p className="text-slate-600 mt-1">Monitor real-time charging sessions</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
          8 Active
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Live Charging Sessions</CardTitle>
              <CardDescription>Currently active charging sessions across the network</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
              <Input placeholder="Search sessions..." className="pl-9" data-testid="search-sessions-input" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-slate-500">
            <p>Active sessions will be displayed here with real-time updates.</p>
            <p className="text-sm mt-2">Fields: Session ID, User, Charge Point, Start Time, Duration, Current Power (kW), Energy (kWh), Actions (Stop)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActiveSessions;