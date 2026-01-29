import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Breadcrumb from '@/components/Breadcrumb';
import {
  ArrowLeft,
  MapPin,
  Zap,
  Edit,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LocationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [location, setLocation] = useState(null);
  const [chargePoints, setChargePoints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLocationDetails();
  }, [id]);

  const fetchLocationDetails = async () => {
    try {
      setLoading(true);
      
      const locResponse = await axios.get(`${API}/locations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLocation(locResponse.data);

      const cpResponse = await axios.get(`${API}/locations/${id}/charge-points`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChargePoints(cpResponse.data);
    } catch (error) {
      console.error('Error fetching location:', error);
      toast.error('Failed to load location details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status) => {
    const variants = {
      'AVAILABLE': 'default',
      'OCCUPIED': 'secondary',
      'UNAVAILABLE': 'outline',
      'FAULTED': 'destructive',
      'OFFLINE': 'secondary'
    };
    return variants[status] || 'default';
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

  if (!location) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Location not found</p>
        <Button onClick={() => navigate('/charging-locations')} className="mt-4">
          Back to Locations
        </Button>
      </div>
    );
  }

  const activeCP = chargePoints.filter(cp => cp.status === 'AVAILABLE').length;
  const occupiedCP = chargePoints.filter(cp => cp.status === 'OCCUPIED').length;
  const faultedCP = chargePoints.filter(cp => cp.status === 'FAULTED').length;

  return (
    <div className="space-y-6" data-testid="location-details-page">
      <Breadcrumb items={[
        { label: 'Charging Network', href: null },
        { label: 'Charging Locations', href: '/charging-locations' },
        { label: location.name, href: null }
      ]} />
      
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/charging-locations')} data-testid="back-btn">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-heading font-bold text-slate-900">{location.name}</h1>
          <p className="text-slate-600 mt-1">
            {location.city}, {location.state} • {location.country}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate(`/charging-locations?edit=${location.id}`)} data-testid="edit-location-btn">
          <Edit className="mr-2 h-4 w-4" />
          Edit Location
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            {location.image_url ? (
              <img
                src={location.image_url}
                alt={location.name}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
            ) : (
              <div className="w-full h-48 bg-slate-100 rounded-lg mb-4 flex items-center justify-center">
                <MapPin className="h-12 w-12 text-slate-300" />
              </div>
            )}
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500">Address</p>
                <p className="text-sm font-medium text-slate-900">{location.address}</p>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-slate-500">City, State</p>
                <p className="text-sm font-medium text-slate-900">{location.city}, {location.state}</p>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-slate-500">Postal Code</p>
                <p className="text-sm font-medium text-slate-900">{location.postal_code}</p>
              </div>
              {location.latitude && location.longitude && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-slate-500">Coordinates</p>
                    <p className="text-sm font-mono text-slate-900">
                      {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                    </p>
                    <a
                      href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                    >
                      View on Map <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Location Statistics</CardTitle>
            <CardDescription>Overview of charging infrastructure</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold text-slate-900">{location.total_charge_points}</p>
                <p className="text-xs text-slate-600 mt-1">Total Charge Points</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{activeCP}</p>
                <p className="text-xs text-slate-600 mt-1">Available</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">{occupiedCP}</p>
                <p className="text-xs text-slate-600 mt-1">Occupied</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{faultedCP}</p>
                <p className="text-xs text-slate-600 mt-1">Faulted</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Charge Points at this Location</CardTitle>
          <CardDescription>
            {chargePoints.length} charge point{chargePoints.length !== 1 ? 's' : ''} installed
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chargePoints.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Zap className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <p>No charge points at this location yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CP ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Vendor / Model</TableHead>
                  <TableHead>Connectors</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chargePoints.map((cp) => (
                  <TableRow key={cp.id}>
                    <TableCell className="font-mono text-sm">
                      <Link
                        to={`/charge-points/${cp.id}`}
                        className="text-primary hover:underline font-medium"
                        data-testid={`cp-link-${cp.id}`}
                      >
                        {cp.charge_point_id}
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium">{cp.name}</TableCell>
                    <TableCell className="text-sm text-slate-600">{cp.vendor} / {cp.model}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {cp.connectors.map((conn, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {conn.connector_type} ({conn.power_kw}kW)
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusBadgeVariant(cp.status)}>
                          {cp.status}
                        </Badge>
                        <div className="flex gap-1">
                          {cp.connectors.map((conn, idx) => {
                            const color = conn.status === 'AVAILABLE' ? 'bg-green-500' : 
                                        conn.status === 'OCCUPIED' ? 'bg-orange-500' :
                                        conn.status === 'FAULTED' ? 'bg-red-500' : 'bg-slate-400';
                            return (
                              <div
                                key={idx}
                                className={`w-2 h-2 rounded-full ${color}`}
                                title={`Connector ${conn.connector_id}: ${conn.status}`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LocationDetails;
