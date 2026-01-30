import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Breadcrumb from '@/components/Breadcrumb';
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
import { Plus, Search, Edit, Trash2, Zap, MoreVertical, Info } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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
  oems,
  chargerModels,
  onOEMChange,
  selectedModelDetails
}) => {
  const isFormValid = () => {
    return formData.charge_point_id && 
           formData.name && 
           formData.location_id && 
           formData.oem_id && 
           formData.charger_model_id;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Charge Point Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="charge_point_id">Charge Point ID (OCPP) <span className="text-red-500">*</span></Label>
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
              <Label htmlFor="name">Charge Point Name <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => onFieldChange('name', e.target.value)}
                placeholder="Fast Charger 1"
                data-testid="chargepoint-name-input"
              />
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="location_id">Location <span className="text-red-500">*</span></Label>
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
          </div>

          {/* OEM & Model Selection */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Charger Configuration</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="oem_id">Vendor (OEM) <span className="text-red-500">*</span></Label>
                <Select value={formData.oem_id} onValueChange={onOEMChange}>
                  <SelectTrigger data-testid="oem-select">
                    <SelectValue placeholder="Select OEM" />
                  </SelectTrigger>
                  <SelectContent>
                    {oems.map((oem) => (
                      <SelectItem key={oem.id} value={oem.id}>
                        {oem.oem_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="charger_model_id">Charger Model <span className="text-red-500">*</span></Label>
                <Select 
                  value={formData.charger_model_id} 
                  onValueChange={(value) => onFieldChange('charger_model_id', value)}
                  disabled={!formData.oem_id}
                >
                  <SelectTrigger data-testid="model-select">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {chargerModels.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.model_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!formData.oem_id && (
                  <p className="text-xs text-slate-500 mt-1">Select OEM first</p>
                )}
              </div>
            </div>
          </div>

          {/* Auto-populated fields from Charger Model */}
          {selectedModelDetails && (
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-slate-700">
                <strong>Auto-populated from {selectedModelDetails.model_name}:</strong>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-sm">
                  <div>Protocol: <strong>{selectedModelDetails.protocol}</strong></div>
                  <div>Type: <strong>{selectedModelDetails.charger_type}</strong></div>
                  <div>Max Power: <strong>{selectedModelDetails.max_power_kw} kW</strong></div>
                  <div>Max Voltage: <strong>{selectedModelDetails.max_voltage_v} V</strong></div>
                  <div className="col-span-2">Connectors: <strong>{selectedModelDetails.connector_configs?.length || 0} configured</strong></div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Connectors from Model (Read-only display) */}
          {selectedModelDetails && selectedModelDetails.connector_configs?.length > 0 && (
            <div className="border-t pt-4">
              <Label className="text-sm font-semibold">Connector Configuration (from model)</Label>
              <div className="mt-2 space-y-2">
                {selectedModelDetails.connector_configs.map((conn, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded border text-sm">
                    <div className="flex gap-6">
                      <span><strong>Connector {conn.connector_number}:</strong> {conn.connector_type}</span>
                      <span>{conn.max_power_kw} kW</span>
                      <span>{conn.max_voltage_v} V</span>
                      <span>{conn.frequency_hz} Hz</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Optional fields */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Optional Details</h3>
            <div className="grid grid-cols-2 gap-4">
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

              <div>
                <Label htmlFor="go_live_date">Go-Live Date</Label>
                <Input
                  id="go_live_date"
                  type="date"
                  value={formData.go_live_date || ''}
                  onChange={(e) => onFieldChange('go_live_date', e.target.value)}
                  data-testid="golive-date-input"
                />
                <p className="text-xs text-slate-500 mt-1">Date when charge point went live</p>
              </div>
            </div>
          </div>

          {/* Availability Schedule */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Availability Schedule</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_24x7"
                  checked={formData.is_24x7}
                  onChange={(e) => onFieldChange('is_24x7', e.target.checked)}
                  className="h-4 w-4"
                  data-testid="24x7-checkbox"
                />
                <Label htmlFor="is_24x7" className="font-medium">
                  24×7 Availability
                </Label>
              </div>
              
              {!formData.is_24x7 && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="availability_from">Available From</Label>
                    <Input
                      id="availability_from"
                      type="time"
                      value={formData.availability_from || ''}
                      onChange={(e) => onFieldChange('availability_from', e.target.value)}
                      data-testid="availability-from-input"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="availability_to">Available To</Label>
                    <Input
                      id="availability_to"
                      type="time"
                      value={formData.availability_to || ''}
                      onChange={(e) => onFieldChange('availability_to', e.target.value)}
                      data-testid="availability-to-input"
                    />
                  </div>
                </div>
              )}
              <p className="text-xs text-slate-500">
                {formData.is_24x7 
                  ? 'Charge point is available 24 hours a day, 7 days a week'
                  : 'Charge point will only accept sessions during specified time window'}
              </p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} data-testid="cancel-chargepoint-btn">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={!isFormValid()}
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
  const [oems, setOems] = useState([]);
  const [allChargerModels, setAllChargerModels] = useState([]);
  const [filteredChargerModels, setFilteredChargerModels] = useState([]);
  const [selectedModelDetails, setSelectedModelDetails] = useState(null);
  const [tariffAssignments, setTariffAssignments] = useState([]);
  const [tariffs, setTariffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedChargePoint, setSelectedChargePoint] = useState(null);
  const [formData, setFormData] = useState({
    charge_point_id: '',
    name: '',
    location_id: '',
    oem_id: '',
    charger_model_id: '',
    serial_number: '',
    firmware_version: '',
    go_live_date: '',
    is_24x7: true,
    availability_from: '',
    availability_to: '',
  });

  useEffect(() => {
    fetchLocations();
    fetchOEMs();
    fetchAllChargerModels();
    fetchTariffs();
    fetchTariffAssignments();
  }, []);

  useEffect(() => {
    fetchChargePoints(selectedLocation, searchQuery);
  }, [currentPage]);

  useEffect(() => {
    if (formData.oem_id) {
      const filtered = allChargerModels.filter(m => m.oem_id === formData.oem_id);
      setFilteredChargerModels(filtered);
    } else {
      setFilteredChargerModels([]);
    }
  }, [formData.oem_id, allChargerModels]);

  useEffect(() => {
    if (formData.charger_model_id) {
      const model = allChargerModels.find(m => m.id === formData.charger_model_id);
      setSelectedModelDetails(model);
    } else {
      setSelectedModelDetails(null);
    }
  }, [formData.charger_model_id, allChargerModels]);

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

  const fetchOEMs = async () => {
    try {
      const response = await axios.get(`${API}/oems`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOems(response.data);
    } catch (error) {
      console.error('Error fetching OEMs:', error);
    }
  };

  const fetchAllChargerModels = async () => {
    try {
      const response = await axios.get(`${API}/charger-models`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllChargerModels(response.data);
    } catch (error) {
      console.error('Error fetching charger models:', error);
    }
  };

  const fetchTariffs = async () => {
    try {
      const response = await axios.get(`${API}/tariffs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTariffs(response.data);
    } catch (error) {
      console.error('Error fetching tariffs:', error);
    }
  };

  const fetchTariffAssignments = async () => {
    try {
      const response = await axios.get(`${API}/tariff-assignments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTariffAssignments(response.data);
    } catch (error) {
      console.error('Error fetching tariff assignments:', error);
    }
  };

  const fetchChargePoints = async (locationId = '', search = '') => {
    try {
      setLoading(true);
      const params = {
        skip: (currentPage - 1) * itemsPerPage,
        limit: itemsPerPage
      };
      if (locationId) params.location_id = locationId;
      if (search) params.search = search;
      
      const response = await axios.get(`${API}/charge-points`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      setChargePoints(response.data);
      setTotalItems(response.data.length);
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
    const locationId = value === 'all' ? '' : value;
    fetchChargePoints(locationId, searchQuery);
  };

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleOEMChange = (oemId) => {
    setFormData(prev => ({ 
      ...prev, 
      oem_id: oemId, 
      charger_model_id: '',
    }));
    
    // Filter models by selected OEM
    const filtered = allChargerModels.filter(m => m.oem_id === oemId);
    setFilteredChargerModels(filtered);
    setSelectedModelDetails(null);
  };

  const resetForm = () => {
    setFormData({
      charge_point_id: '',
      name: '',
      location_id: '',
      oem_id: '',
      charger_model_id: '',
      serial_number: '',
      firmware_version: '',
      go_live_date: '',
      is_24x7: true,
      availability_from: '',
      availability_to: '',
    });
    setFilteredChargerModels([]);
    setSelectedModelDetails(null);
  };

  const handleAddChargePoint = async () => {
    if (!selectedModelDetails) {
      toast.error('Validation failed', {
        description: 'Please select a charger model',
        style: { '--toast-description-color': 'rgb(71, 85, 105)' }
      });
      return;
    }

    try {
      const payload = {
        charge_point_id: formData.charge_point_id,
        name: formData.name,
        location_id: formData.location_id,
        oem_id: formData.oem_id,
        charger_model_id: formData.charger_model_id,
        vendor: oems.find(o => o.id === formData.oem_id)?.oem_name || '',
        model: selectedModelDetails.model_name,
        serial_number: formData.serial_number || null,
        firmware_version: formData.firmware_version || null,
        protocol: selectedModelDetails.protocol,
        connectors: selectedModelDetails.connector_configs.map(config => ({
          connector_id: config.connector_number,
          connector_type: config.connector_type,
          power_kw: config.max_power_kw,
          status: 'AVAILABLE'
        }))
      };

      await axios.post(`${API}/charge-points`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success('Charge point added successfully', {
        description: `${formData.name} has been added with ${payload.connectors.length} connectors`,
        style: { '--toast-description-color': 'rgb(71, 85, 105)' }
      });
      setIsAddDialogOpen(false);
      resetForm();
      fetchChargePoints(selectedLocation, searchQuery);
    } catch (error) {
      console.error('Error adding charge point:', error);
      toast.error('Failed to add charge point', {
        description: error.response?.data?.detail || 'An error occurred',
        style: { '--toast-description-color': 'rgb(71, 85, 105)' }
      });
    }
  };

  const handleEditChargePoint = async () => {
    try {
      const { charge_point_id, ...updateData } = formData;
      await axios.put(`${API}/charge-points/${selectedChargePoint.id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success('Charge point updated successfully', {
        description: `${formData.name} has been updated`,
        style: { '--toast-description-color': 'rgb(71, 85, 105)' }
      });
      setIsEditDialogOpen(false);
      setSelectedChargePoint(null);
      resetForm();
      fetchChargePoints(selectedLocation, searchQuery);
    } catch (error) {
      console.error('Error updating charge point:', error);
      toast.error('Failed to update charge point', {
        description: error.response?.data?.detail || 'An error occurred',
        style: { '--toast-description-color': 'rgb(71, 85, 105)' }
      });
    }
  };

  const handleDeleteChargePoint = async (chargePointId, cpName) => {
    if (!window.confirm(`Are you sure you want to delete "${cpName}"? This action cannot be undone.`)) return;

    try {
      await axios.delete(`${API}/charge-points/${chargePointId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success('Charge point deleted successfully', {
        description: `${cpName} has been removed`,
        style: { '--toast-description-color': 'rgb(71, 85, 105)' }
      });
      fetchChargePoints(selectedLocation, searchQuery);
    } catch (error) {
      console.error('Error deleting charge point:', error);
      toast.error('Failed to delete charge point', {
        description: error.response?.data?.detail || 'An error occurred',
        style: { '--toast-description-color': 'rgb(71, 85, 105)' }
      });
    }
  };

  const openEditDialog = (cp) => {
    setSelectedChargePoint(cp);
    const goLiveDate = cp.go_live_date ? new Date(cp.go_live_date).toISOString().split('T')[0] : '';
    setFormData({
      charge_point_id: cp.charge_point_id,
      name: cp.name,
      location_id: cp.location_id,
      oem_id: cp.oem_id || '',
      charger_model_id: cp.charger_model_id || '',
      serial_number: cp.serial_number || '',
      firmware_version: cp.firmware_version || '',
      go_live_date: goLiveDate,
      is_24x7: cp.is_24x7 !== undefined ? cp.is_24x7 : true,
      availability_from: cp.availability_from || '',
      availability_to: cp.availability_to || '',
    });
    
    // Trigger model filtering for edit mode
    if (cp.oem_id) {
      const filtered = allChargerModels.filter(m => m.oem_id === cp.oem_id);
      setFilteredChargerModels(filtered);
    }
    
    setIsEditDialogOpen(true);
  };

  const totalPages = Math.ceil(chargePoints.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedChargePoints = chargePoints.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const getLocationName = (locationId) => {
    const location = locations.find(l => l.id === locationId);
    return location ? location.name : 'Unknown';
  };

  const getAssignedTariff = (cpId) => {
    const assignment = tariffAssignments.find(a => a.charge_point_id === cpId);
    if (assignment) {
      const tariff = tariffs.find(t => t.id === assignment.tariff_id);
      return tariff ? tariff.tariff_name : 'Unknown';
    }
    return null;
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
      <Breadcrumb items={[
        { label: 'Charge Points', href: null }
      ]} />
      
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
                  <TableHead>Vendor</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Connectors</TableHead>
                  <TableHead>Assigned Tariff</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedChargePoints.map((cp) => (
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
                    <TableCell className="text-sm">
                      <Link
                        to={`/charging-locations/${cp.location_id}`}
                        className="text-primary hover:underline"
                      >
                        {getLocationName(cp.location_id)}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">{cp.vendor}</TableCell>
                    <TableCell className="text-sm text-slate-600">{cp.model}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {cp.connectors.map((conn, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {conn.connector_type}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {getAssignedTariff(cp.charge_point_id) ? (
                        <button
                          onClick={() => navigate('/admin/tariffs')}
                          className="text-primary hover:underline font-medium"
                        >
                          {getAssignedTariff(cp.charge_point_id)}
                        </button>
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {cp.connectors.map((conn, idx) => {
                          const color = conn.status === 'Available' ? 'bg-green-500' : 
                                      conn.status === 'Charging' || conn.status === 'Preparing' || conn.status === 'Finishing' ? 'bg-orange-500' :
                                      conn.status === 'Faulted' ? 'bg-red-500' : 'bg-slate-400';
                          return (
                            <div
                              key={idx}
                              className={`w-3 h-3 rounded-full ${color}`}
                              title={`Connector ${conn.connector_id} (${conn.connector_type}): ${conn.status}`}
                            />
                          );
                        })}
                      </div>
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
                            onClick={() => handleDeleteChargePoint(cp.id, cp.name)}
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
          
          {/* Pagination */}
          {!loading && chargePoints.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-slate-600">
                Showing {startIndex + 1}-{Math.min(endIndex, chargePoints.length)} of {chargePoints.length}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  data-testid="prev-page-btn"
                >
                  Previous
                </Button>
                <span className="flex items-center px-3 text-sm text-slate-600">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  data-testid="next-page-btn"
                >
                  Next
                </Button>
              </div>
            </div>
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
        description="Create a new charge point from a charger model"
        isEdit={false}
        formData={formData}
        onFieldChange={handleFieldChange}
        locations={locations}
        oems={oems}
        chargerModels={filteredChargerModels}
        onOEMChange={handleOEMChange}
        selectedModelDetails={selectedModelDetails}
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
        description="Update charge point details"
        isEdit={true}
        formData={formData}
        onFieldChange={handleFieldChange}
        locations={locations}
        oems={oems}
        chargerModels={filteredChargerModels}
        onOEMChange={handleOEMChange}
        selectedModelDetails={selectedModelDetails}
      />
    </div>
  );
};

export default ChargePoints;
