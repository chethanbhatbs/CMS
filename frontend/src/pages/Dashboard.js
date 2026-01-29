import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Zap, MapPin, DollarSign } from 'lucide-react';

const Dashboard = () => {
  const stats = [
    {
      title: 'Total Charge Points',
      value: '24',
      change: '+2 this month',
      icon: Zap,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Active Sessions',
      value: '8',
      change: '3 pending',
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Locations',
      value: '6',
      change: 'Across network',
      icon: MapPin,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Revenue (MTD)',
      value: '$12,450',
      change: '+18% from last month',
      icon: DollarSign,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="space-y-8" data-testid="dashboard-page">
      <div>
        <h1 className="text-3xl font-heading font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-1">Overview of your charging network</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="border-slate-200 hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 font-medium">{stat.title}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-2">{stat.value}</p>
                    <p className="text-xs text-slate-500 mt-1">{stat.change}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Recent Sessions</CardTitle>
            <CardDescription>Latest charging sessions across your network</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-900">CP-{i.toString().padStart(3, '0')}</p>
                    <p className="text-xs text-slate-500">Location {i}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900">{(Math.random() * 50).toFixed(2)} kWh</p>
                    <p className="text-xs text-slate-500">{Math.floor(Math.random() * 60)} min ago</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Current status of your charging infrastructure</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Operational</span>
                <span className="text-sm font-medium text-green-600">20 / 24</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '83%' }} />
              </div>
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">20</p>
                  <p className="text-xs text-slate-500 mt-1">Available</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">3</p>
                  <p className="text-xs text-slate-500 mt-1">In Use</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">1</p>
                  <p className="text-xs text-slate-500 mt-1">Offline</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;