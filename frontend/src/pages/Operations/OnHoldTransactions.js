import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, PlayCircle, XCircle } from 'lucide-react';

const OnHoldTransactions = () => {
  return (
    <div className="space-y-6" data-testid="on-hold-transactions-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-slate-900">On-Hold Transactions</h1>
          <p className="text-slate-600 mt-1">Manage paused or pending transactions</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pending Transactions</CardTitle>
              <CardDescription>Transactions that are on hold or require attention</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
              <Input placeholder="Search on-hold..." className="pl-9" data-testid="search-onhold-input" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-slate-500">
            <p>On-hold transactions will be displayed here.</p>
            <p className="text-sm mt-2">Fields: Transaction ID, User, Charge Point, Hold Reason, Duration, Actions (Resume/Cancel)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnHoldTransactions;