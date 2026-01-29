import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlayCircle } from 'lucide-react';

const StartRemoteSession = () => {
  return (
    <div className="space-y-6" data-testid="start-remote-session-page">
      <div>
        <h1 className="text-3xl font-heading font-bold text-slate-900">Start Remote Session</h1>
        <p className="text-slate-600 mt-1">Initiate charging sessions remotely</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Session Details</CardTitle>
            <CardDescription>Configure and start a new remote charging session</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-select">Select User</Label>
              <Select>
                <SelectTrigger id="user-select" data-testid="user-select">
                  <SelectValue placeholder="Choose user..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user1">John Doe (john@example.com)</SelectItem>
                  <SelectItem value="user2">Jane Smith (jane@example.com)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="chargepoint-select">Select Charge Point</Label>
              <Select>
                <SelectTrigger id="chargepoint-select" data-testid="chargepoint-select">
                  <SelectValue placeholder="Choose charge point..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cp1">CP-001 - Location A</SelectItem>
                  <SelectItem value="cp2">CP-002 - Location B</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="connector-select">Connector</Label>
              <Select>
                <SelectTrigger id="connector-select" data-testid="connector-select">
                  <SelectValue placeholder="Choose connector..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Connector 1 (Available)</SelectItem>
                  <SelectItem value="2">Connector 2 (Available)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rfid-input">RFID / ID Tag (Optional)</Label>
              <Input
                id="rfid-input"
                placeholder="Enter RFID or ID tag"
                data-testid="rfid-input"
              />
            </div>

            <Button className="w-full" data-testid="start-session-btn">
              <PlayCircle className="mr-2 h-4 w-4" />
              Start Remote Session
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Session Preview</CardTitle>
            <CardDescription>Review session configuration before starting</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">User:</span>
                <span className="text-sm font-medium text-slate-900">Not selected</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">Charge Point:</span>
                <span className="text-sm font-medium text-slate-900">Not selected</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">Connector:</span>
                <span className="text-sm font-medium text-slate-900">Not selected</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">Estimated Start:</span>
                <span className="text-sm font-medium text-slate-900">Immediate</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StartRemoteSession;