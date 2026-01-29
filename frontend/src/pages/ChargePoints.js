import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Zap, MoreVertical, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CONNECTOR_TYPES = ['Type2', 'CCS', 'CHAdeMO', 'Type1'];

const ChargePointFormDialog = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  title, 
  description, 
  isEdit, 
  formData, 
  onFieldChange,
  locations,
  onAddConnector,
  onRemoveConnector,
  onUpdateConnector
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="col-span-2">
            <Label htmlFor="charge_point_id">Charge Point ID (OCPP) *</Label>
            <Input
              id="charge_point_id"
              value={formData.charge_point_id}
              onChange={(e) => onFieldChange('charge_point_id', e.target.value)}
              placeholder="CP001"
              disabled={isEdit}
              data-testid="chargepoint-id-input"
            />
          </div>
          <div className="col-span-2">
            <Label htmlFor="name">Charge Point Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => onFieldChange('name', e.target.value)}
              placeholder="Fast Charger 1"
              data-testid="chargepoint-name-input"
            />
          </div>
          <div className="col-span-2">
            <Label htmlFor="location_id">Location *</Label>
            <Select value={formData.location_id} onValueChange={(value) => onFieldChange('location_id', value)}>
              <SelectTrigger data-testid="location-select">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="vendor">Vendor *</Label>
            <Input
              id="vendor"
              value={formData.vendor}
              onChange={(e) => onFieldChange('vendor', e.target.value)}
              placeholder="ABB"
              data-testid="vendor-input"
            />
          </div>
          <div>
            <Label htmlFor="model">Model *</Label>
            <Input
              id="model"
              value={formData.model}
              onChange={(e) => onFieldChange('model', e.target.value)}
              placeholder="Terra 54"
              data-testid="model-input"
            />
          </div>
          <div>
            <Label htmlFor="serial_number">Serial Number</Label>
            <Input
              id="serial_number"
              value={formData.serial_number}
              onChange={(e) => onFieldChange('serial_number', e.target.value)}
              placeholder="SN123456"
              data-testid="serial-input"
            />
          </div>
          <div>
            <Label htmlFor="firmware_version">Firmware Version</Label>
            <Input
              id="firmware_version"
              value={formData.firmware_version}
              onChange={(e) => onFieldChange('firmware_version', e.target.value)}
              placeholder="1.2.3"
              data-testid="firmware-input"
            />
          </div>
          
          <div className="col-span-2 mt-4">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base">Connectors</Label>
              <Button type="button" size="sm" onClick={onAddConnector} data-testid="add-connector-btn">
                <Plus className="h-4 w-4 mr-1" /> Add Connector
              </Button>
            </div>
            {formData.connectors.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4 border border-dashed rounded-md">
                No connectors added. Click "Add Connector" to add one.
              </p>
            ) : (
              <div className="space-y-3">
                {formData.connectors.map((connector, index) => (
                  <div key={index} className="p-4 border rounded-md relative">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => onRemoveConnector(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">Connector ID</Label>
                        <Input
                          type="text"
                          value={connector.connector_id}
                          onChange={(e) => onUpdateConnector(index, 'connector_id', parseInt(e.target.value) || 1)}
                          className="h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Type</Label>
                        <Select
                          value={connector.connector_type}
                          onValueChange={(value) => onUpdateConnector(index, 'connector_type', value)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CONNECTOR_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Max Power (kW)</Label>
                        <Input
                          type="text"
                          value={connector.power_kw}
                          onChange={(e) => onUpdateConnector(index, 'power_kw', parseFloat(e.target.value) || 0)}
                          className="h-9"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} data-testid="cancel-chargepoint-btn">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={!formData.charge_point_id || !formData.name || !formData.location_id || !formData.vendor || !formData.model}
            data-testid="submit-chargepoint-btn"
          >
            {isEdit ? 'Update Charge Point' : 'Add Charge Point'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ChargePoints = () => {
  const { token } = useAuth();
  const [chargePoints, setChargePoints] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedChargePoint, setSelectedChargePoint] = useState(null);
  const [formData, setFormData] = useState({
    charge_point_id: '',
    name: '',
    location_id: '',
    vendor: '',
    model: '',
    serial_number: '',
    firmware_version: '',
    connectors: []
  });

  useEffect(() => {
    fetchLocations();
    fetchChargePoints();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await axios.get(`${API}/locations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLocations(response.data);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const fetchChargePoints = async (locationId = '', search = '') => {
    try {
      setLoading(true);
      const params = {};
      if (locationId) params.location_id = locationId;
      if (search) params.search = search;
      
      const response = await axios.get(`${API}/charge-points`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      setChargePoints(response.data);
    } catch (error) {
      console.error('Error fetching charge points:', error);
      toast.error('Failed to fetch charge points');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    fetchChargePoints(selectedLocation, value);
  };

  const handleLocationFilter = (value) => {
    setSelectedLocation(value);
    fetchChargePoints(value, searchQuery);
  };

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      charge_point_id: '',
      name: '',
      location_id: '',
      vendor: '',
      model: '',
      serial_number: '',
      firmware_version: '',
      connectors: []
    });
  };

  const handleAddConnector = () => {
    setFormData(prev => ({
      ...prev,
      connectors: [
        ...prev.connectors,
        { connector_id: prev.connectors.length + 1, connector_type: 'Type2', power_kw: 22, status: 'AVAILABLE' }
      ]
    }));
  };

  const handleRemoveConnector = (index) => {
    setFormData(prev => ({
      ...prev,
      connectors: prev.connectors.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateConnector = (index, field, value) => {
    setFormData(prev => {
      const newConnectors = [...prev.connectors];
      newConnectors[index] = { ...newConnectors[index], [field]: value };
      return { ...prev, connectors: newConnectors };
    });
  };

  const handleAddChargePoint = async () => {
    try {
      await axios.post(`${API}/charge-points`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success('Charge point added successfully!');
      setIsAddDialogOpen(false);
      resetForm();
      fetchChargePoints(selectedLocation, searchQuery);
    } catch (error) {
      console.error('Error adding charge point:', error);
      toast.error(error.response?.data?.detail || 'Failed to add charge point');
    }
  };

  const handleEditChargePoint = async () => {
    try {
      const { charge_point_id, ...updateData } = formData;
      await axios.put(`${API}/charge-points/${selectedChargePoint.id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success('Charge point updated successfully!');
      setIsEditDialogOpen(false);
      setSelectedChargePoint(null);
      resetForm();
      fetchChargePoints(selectedLocation, searchQuery);
    } catch (error) {
      console.error('Error updating charge point:', error);
      toast.error(error.response?.data?.detail || 'Failed to update charge point');
    }
  };

  const handleDeleteChargePoint = async (chargePointId) => {
    if (!window.confirm('Are you sure you want to delete this charge point?')) return;

    try {
      await axios.delete(`${API}/charge-points/${chargePointId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success('Charge point deleted successfully!');
      fetchChargePoints(selectedLocation, searchQuery);
    } catch (error) {
      console.error('Error deleting charge point:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete charge point');
    }
  };

  const openEditDialog = (cp) => {
    setSelectedChargePoint(cp);
    setFormData({
      charge_point_id: cp.charge_point_id,
      name: cp.name,
      location_id: cp.location_id,
      vendor: cp.vendor,
      model: cp.model,
      serial_number: cp.serial_number || '',
      firmware_version: cp.firmware_version || '',
      connectors: cp.connectors || []
    });
    setIsEditDialogOpen(true);
  };

  const getLocationName = (locationId) => {
    const location = locations.find(l => l.id === locationId);
    return location ? location.name : 'Unknown';
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

  return (
    <div className="space-y-6" data-testid="charge-points-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-slate-900">Charge Points</h1>
          <p className="text-slate-600 mt-1">Manage individual charging points and their connectors</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} data-testid="add-chargepoint-btn">
          <Plus className="mr-2 h-4 w-4" />
          Add Charge Point
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>All Charge Points</CardTitle>
              <CardDescription>
                {chargePoints.length} charge point{chargePoints.length !== 1 ? 's' : ''} across your network
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={selectedLocation} onValueChange={handleLocationFilter}>
                <SelectTrigger className="w-48" data-testid="location-filter">
                  <SelectValue placeholder="Filter by location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                <Input
                  placeholder="Search charge points..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={handleSearch}
                  data-testid="search-chargepoints-input"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-slate-500">Loading charge points...</div>
          ) : chargePoints.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Zap className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <p>No charge points found.</p>
              <p className="text-sm mt-1">Add your first charge point to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CP ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Vendor / Model</TableHead>
                  <TableHead>Connectors</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Online</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chargePoints.map((cp) => (
                  <TableRow key={cp.id} data-testid={`chargepoint-row-${cp.id}`}>
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
                    <TableCell className="text-sm">{getLocationName(cp.location_id)}</TableCell>
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
                      <Badge variant={getStatusBadgeVariant(cp.status)}>
                        {cp.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={cp.is_online ? 'default' : 'secondary'}>
                        {cp.is_online ? 'Online' : 'Offline'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`chargepoint-actions-${cp.id}`}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(cp)} data-testid="edit-chargepoint-btn">
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteChargePoint(cp.id)}
                            className="text-red-600"
                            data-testid="delete-chargepoint-btn"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ChargePointFormDialog
        isOpen={isAddDialogOpen}
        onClose={() => {
          setIsAddDialogOpen(false);
          resetForm();
        }}
        onSubmit={handleAddChargePoint}
        title="Add Charge Point"
        description="Create a new charge point with connectors"
        isEdit={false}
        formData={formData}
        onFieldChange={handleFieldChange}
        locations={locations}
        onAddConnector={handleAddConnector}
        onRemoveConnector={handleRemoveConnector}
        onUpdateConnector={handleUpdateConnector}
      />

      <ChargePointFormDialog
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setSelectedChargePoint(null);
          resetForm();
        }}
        onSubmit={handleEditChargePoint}
        title="Edit Charge Point"
        description="Update charge point details and connectors"
        isEdit={true}
        formData={formData}
        onFieldChange={handleFieldChange}
        locations={locations}
        onAddConnector={handleAddConnector}
        onRemoveConnector={handleRemoveConnector}
        onUpdateConnector={handleUpdateConnector}
      />
    </div>
  );
};

export default ChargePoints;
