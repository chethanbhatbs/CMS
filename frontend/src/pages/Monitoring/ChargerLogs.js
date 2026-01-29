import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Download } from 'lucide-react';

const ChargerLogs = () => {
  return (
    <div className="space-y-6" data-testid="charger-logs-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-slate-900">Charger Logs</h1>
          <p className="text-slate-600 mt-1">View detailed logs from charging stations</p>
        </div>
        <Button variant="outline" data-testid="export-logs-btn">
          <Download className="mr-2 h-4 w-4" />
          Export Logs
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Log Filters</CardTitle>
          <CardDescription>Filter logs by various criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="chargepoint-filter">Charge Point</Label>
              <Select>
                <SelectTrigger id="chargepoint-filter" data-testid="chargepoint-filter">
                  <SelectValue placeholder="All charge points" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Charge Points</SelectItem>
                  <SelectItem value="cp1">CP-001</SelectItem>
                  <SelectItem value="cp2">CP-002</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="log-level-filter">Log Level</Label>
              <Select>
                <SelectTrigger id="log-level-filter" data-testid="log-level-filter">
                  <SelectValue placeholder="All levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-from">From Date</Label>
              <Input type="date" id="date-from" data-testid="date-from-input" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-to">To Date</Label>
              <Input type="date" id="date-to" data-testid="date-to-input" />
            </div>
          </div>
          <div className="mt-4">
            <Button data-testid="apply-filters-btn">
              <Filter className="mr-2 h-4 w-4" />
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>System Logs</CardTitle>
              <CardDescription>Real-time logs from charging infrastructure</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
              <Input placeholder="Search logs..." className="pl-9" data-testid="search-logs-input" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-slate-500">
            <p>Filtered logs will be displayed here.</p>
            <p className="text-sm mt-2">Fields: Timestamp, Charge Point, Level, Message, Action</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChargerLogs;