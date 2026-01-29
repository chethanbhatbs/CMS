import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Search, Filter } from 'lucide-react';

const ChargingTransactions = () => {
  return (
    <div className="space-y-6" data-testid="charging-transactions-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-slate-900">Charging Transactions</h1>
          <p className="text-slate-600 mt-1">View all completed charging transactions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" data-testid="filter-transactions-btn">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" data-testid="export-transactions-btn">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>All completed charging transactions with payment details</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
              <Input placeholder="Search transactions..." className="pl-9" data-testid="search-transactions-input" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-slate-500">
            <p>Transaction list will be displayed here.</p>
            <p className="text-sm mt-2">Fields: Transaction ID, User, Charge Point, Start/End Time, Energy (kWh), Amount, Status</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChargingTransactions;