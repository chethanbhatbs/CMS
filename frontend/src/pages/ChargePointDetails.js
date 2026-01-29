import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Zap,
  Activity,
  AlertTriangle,
  FileText,
  Power,
  RotateCw,
  RefreshCw,
  PowerOff,
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CONNECTOR_IMAGES = {
  Type2: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=200&h=200&fit=crop',
  CCS: 'https://images.unsplash.com/photo-1609976378583-02dca7b6fde1?w=200&h=200&fit=crop',
  CHAdeMO: 'https://images.unsplash.com/photo-1609976378618-b0f0b8ac7b3a?w=200&h=200&fit=crop',
  Type1: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=200&h=200&fit=crop',
};

const ChargePointDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [chargePoint, setChargePoint] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChargePointDetails();
  }, [id]);

  const fetchChargePointDetails = async () => {
    try {
      setLoading(true);
      const cpResponse = await axios.get(`${API}/charge-points/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChargePoint(cpResponse.data);

      const locResponse = await axios.get(`${API}/locations/${cpResponse.data.location_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLocation(locResponse.data);
    } catch (error) {
      console.error('Error fetching charge point:', error);
      toast.error('Failed to load charge point details');
    } finally {
      setLoading(false);
    }
  };

  const handleOCPPCommand = (command) => {
    toast.info(`${command} command`, {
      description: 'OCPP integration will be implemented in next phase',
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      AVAILABLE: 'bg-green-50 text-green-700 border-green-200',
      OCCUPIED: 'bg-orange-50 text-orange-700 border-orange-200',
      UNAVAILABLE: 'bg-slate-50 text-slate-700 border-slate-200',
      FAULTED: 'bg-red-50 text-red-700 border-red-200',
      OFFLINE: 'bg-slate-50 text-slate-700 border-slate-200',
    };
    return colors[status] || 'bg-slate-50 text-slate-700 border-slate-200';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!chargePoint) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Charge point not found</p>
        <Button onClick={() => navigate('/charge-points')} className="mt-4">
          Back to Charge Points
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="chargepoint-details-page">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/charge-points')} data-testid="back-btn">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-heading font-bold text-slate-900">{chargePoint.name}</h1>
          <p className="text-slate-600 mt-1">
            {location?.name} • {chargePoint.charge_point_id}
          </p>
        </div>
        <Badge className={`text-lg px-4 py-2 ${getStatusColor(chargePoint.status)}`}>
          {chargePoint.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Connectors Overview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Connectors</CardTitle>
            <CardDescription>Available charging connectors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {chargePoint.connectors.map((connector, idx) => (
                <div key={idx} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <img
                      src={CONNECTOR_IMAGES[connector.connector_type] || CONNECTOR_IMAGES.Type2}
                      alt={connector.connector_type}
                      className="w-20 h-20 rounded-md object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-slate-900">Connector {connector.connector_id}</h3>
                        <Badge variant="outline">{connector.status}</Badge>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">{connector.connector_type}</p>
                      <p className="text-sm text-slate-600 mt-1">
                        <strong>{connector.power_kw} kW</strong>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Analytics */}
        <Card>
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
            <CardDescription>Usage statistics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-600">Total Energy</p>
              <p className="text-2xl font-bold text-slate-900">{chargePoint.total_energy_kwh ? chargePoint.total_energy_kwh.toFixed(2) : '0.00'} kWh</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-slate-600">Total Sessions</p>
              <p className="text-2xl font-bold text-slate-900">{chargePoint.total_sessions || 0}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-slate-600">Online Status</p>
              <Badge variant={chargePoint.is_online ? 'default' : 'secondary'}>
                {chargePoint.is_online ? 'Online' : 'Offline'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charger Information */}
      <Card>
        <CardHeader>
          <CardTitle>Charger Information</CardTitle>
          <CardDescription>Technical specifications and details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-slate-600">OEM</p>
              <p className="text-sm font-medium text-slate-900 mt-1">{chargePoint.vendor}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Model</p>
              <p className="text-sm font-medium text-slate-900 mt-1">{chargePoint.model}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Protocol</p>
              <p className="text-sm font-medium text-slate-900 mt-1">{chargePoint.protocol || 'OCPP 1.6'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Serial Number</p>
              <p className="text-sm font-medium text-slate-900 mt-1">{chargePoint.serial_number || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Firmware Version</p>
              <p className="text-sm font-medium text-slate-900 mt-1">{chargePoint.firmware_version || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">WebSocket ID</p>
              <p className="text-sm font-mono text-xs text-slate-900 mt-1">{chargePoint.websocket_id || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Go-Live Date</p>
              <p className="text-sm font-medium text-slate-900 mt-1">
                {chargePoint.go_live_date ? new Date(chargePoint.go_live_date).toLocaleDateString() : '—'}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Last Heartbeat</p>
              <p className="text-sm font-medium text-slate-900 mt-1">
                {chargePoint.last_heartbeat ? new Date(chargePoint.last_heartbeat).toLocaleString() : 'Never'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CMS Actions (OCPP 1.6) */}
      <Card>
        <CardHeader>
          <CardTitle>CMS Actions</CardTitle>
          <CardDescription>OCPP 1.6 compatible remote commands</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant="outline"
              onClick={() => handleOCPPCommand('Trigger Message')}
              data-testid="trigger-message-btn"
            >
              <FileText className="mr-2 h-4 w-4" />
              Trigger Message
            </Button>
            <Button
              variant="outline"
              onClick={() => handleOCPPCommand('Soft Reset')}
              data-testid="soft-reset-btn"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Soft Reset
            </Button>
            <Button
              variant="outline"
              onClick={() => handleOCPPCommand('Hard Reset')}
              data-testid="hard-reset-btn"
            >
              <Power className="mr-2 h-4 w-4" />
              Hard Reset
            </Button>
            <Button
              variant="outline"
              onClick={() => handleOCPPCommand('Change Availability')}
              data-testid="change-availability-btn"
            >
              <PowerOff className="mr-2 h-4 w-4" />
              Change Availability
            </Button>
          </div>
          <div className="mt-4">
            <Link to="/monitoring/charger-logs">
              <Button variant="secondary" data-testid="view-logs-btn">
                <FileText className="mr-2 h-4 w-4" />
                View Charger Logs
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChargePointDetails;