import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Edit, Trash2, DollarSign, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Breadcrumb from '@/components/Breadcrumb';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const TariffDialog = ({ isOpen, onClose, onSubmit, title, formData, onFieldChange, isEdit }) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update tariff details' : 'Create a new charging tariff'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="tariff_name">Tariff Name <span className="text-red-500">*</span></Label>
            <Input
              id="tariff_name"
              value={formData.tariff_name}
              onChange={(e) => onFieldChange('tariff_name', e.target.value)}
              placeholder="Peak Hours Tariff"
              data-testid="tariff-name-input"
            />
          </div>
          
          <div>
            <Label htmlFor="tariff_type">Tariff Type <span className="text-red-500">*</span></Label>
            <Select value={formData.tariff_type} onValueChange={(value) => onFieldChange('tariff_type', value)}>
              <SelectTrigger data-testid="tariff-type-select">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="energy_based">Energy-Based (per kWh)</SelectItem>
                <SelectItem value="time_based">Time-Based (per minute)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="unit_rate">
                Unit Rate <span className="text-red-500">*</span>
              </Label>
              <Input
                id="unit_rate"
                type="number"
                step="0.01"
                value={formData.unit_rate}
                onChange={(e) => onFieldChange('unit_rate', e.target.value)}
                placeholder="0.35"
                data-testid="unit-rate-input"
              />
              <p className="text-xs text-slate-500 mt-1">
                ${formData.tariff_type === 'energy_based' ? '/kWh' : '/min'}
              </p>
            </div>
            
            <div>
              <Label htmlFor="tax_percentage">Tax %</Label>
              <Input
                id="tax_percentage"
                type="number"
                step="0.1"
                value={formData.tax_percentage}
                onChange={(e) => onFieldChange('tax_percentage', e.target.value)}
                placeholder="10"
                data-testid="tax-input"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => onFieldChange('description', e.target.value)}
              placeholder="Standard daytime charging rate"
              data-testid="description-input"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={!formData.tariff_name || !formData.tariff_type || !formData.unit_rate}
            data-testid="submit-tariff-btn"
          >
            {isEdit ? 'Update Tariff' : 'Create Tariff'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const AssignTariffDialog = ({ isOpen, onClose, onSubmit, formData, onFieldChange, tariffs, locations, chargePoints }) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Assign Tariff</DialogTitle>
          <DialogDescription>Configure tariff assignment with time windows</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>Tariff <span className="text-red-500">*</span></Label>
            <Select value={formData.tariff_id} onValueChange={(value) => onFieldChange('tariff_id', value)}>
              <SelectTrigger data-testid="assign-tariff-select">
                <SelectValue placeholder="Select tariff" />
              </SelectTrigger>
              <SelectContent>
                {tariffs.map((tariff) => (
                  <SelectItem key={tariff.id} value={tariff.id}>
                    {tariff.tariff_name} (${tariff.unit_rate})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Location</Label>
              <Select value={formData.location_id || 'none'} onValueChange={(value) => onFieldChange('location_id', value === 'none' ? null : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">All locations</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Charge Point</Label>
              <Select value={formData.charge_point_id || 'none'} onValueChange={(value) => onFieldChange('charge_point_id', value === 'none' ? null : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All CPs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">All charge points</SelectItem>
                  {chargePoints.map((cp) => (
                    <SelectItem key={cp.id} value={cp.charge_point_id}>{cp.charge_point_id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Effective From <span className="text-red-500">*</span></Label>
              <Input
                type="datetime-local"
                value={formData.effective_from}
                onChange={(e) => onFieldChange('effective_from', e.target.value)}
                data-testid="effective-from-input"
              />
            </div>
            
            <div>
              <Label>Effective To</Label>
              <Input
                type="datetime-local"
                value={formData.effective_to}
                onChange={(e) => onFieldChange('effective_to', e.target.value)}
                data-testid="effective-to-input"
              />
              <p className="text-xs text-slate-500 mt-1">Leave empty for indefinite</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Time Window Start (HH:MM)</Label>
              <Input
                type="time"
                value={formData.time_window_start}
                onChange={(e) => onFieldChange('time_window_start', e.target.value)}
                placeholder="09:00"
              />
            </div>
            
            <div>
              <Label>Time Window End (HH:MM)</Label>
              <Input
                type="time"
                value={formData.time_window_end}
                onChange={(e) => onFieldChange('time_window_end', e.target.value)}
                placeholder="17:00"
              />
            </div>
          </div>
          
          <div>
            <Label>Days of Week</Label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {DAYS_OF_WEEK.map((day, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <Checkbox
                    id={`day-${idx}`}
                    checked={formData.days_of_week.includes(idx)}
                    onCheckedChange={(checked) => {
                      const newDays = checked 
                        ? [...formData.days_of_week, idx]
                        : formData.days_of_week.filter(d => d !== idx);
                      onFieldChange('days_of_week', newDays);
                    }}
                  />
                  <Label htmlFor={`day-${idx}`} className="text-xs">{day.slice(0, 3)}</Label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_peak"
              checked={formData.is_peak_tariff}
              onCheckedChange={(checked) => onFieldChange('is_peak_tariff', checked)}
            />
            <Label htmlFor="is_peak">Peak Tariff (higher rate during specified time window)</Label>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={!formData.tariff_id || !formData.effective_from}
            data-testid="submit-assignment-btn"
          >
            Assign Tariff
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const TariffManagement = () => {
  const { token } = useAuth();
  const [tariffs, setTariffs] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [locations, setLocations] = useState([]);
  const [chargePoints, setChargePoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddTariffOpen, setIsAddTariffOpen] = useState(false);
  const [isEditTariffOpen, setIsEditTariffOpen] = useState(false);
  const [isAssignTariffOpen, setIsAssignTariffOpen] = useState(false);
  const [selectedTariff, setSelectedTariff] = useState(null);
  const [tariffFormData, setTariffFormData] = useState({
    tariff_name: '',
    tariff_type: 'energy_based',
    unit_rate: '',
    tax_percentage: '0',
    description: '',
    is_default: false
  });
  const [assignFormData, setAssignFormData] = useState({
    tariff_id: '',
    location_id: null,
    charge_point_id: null,
    connector_id: null,
    effective_from: '',
    effective_to: '',
    time_window_start: '',
    time_window_end: '',
    days_of_week: [],
    is_peak_tariff: false
  });

  useEffect(() => {
    fetchTariffs();
    fetchAssignments();
    fetchLocations();
    fetchChargePoints();
  }, []);

  const fetchTariffs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/tariffs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTariffs(response.data);
    } catch (error) {
      console.error('Error fetching tariffs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await axios.get(`${API}/tariff-assignments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAssignments(response.data);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

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

  const fetchChargePoints = async () => {
    try {
      const response = await axios.get(`${API}/charge-points`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChargePoints(response.data);
    } catch (error) {
      console.error('Error fetching charge points:', error);
    }
  };

  const handleTariffFieldChange = (field, value) => {
    setTariffFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAssignFieldChange = (field, value) => {
    setAssignFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetTariffForm = () => {
    setTariffFormData({
      tariff_name: '',
      tariff_type: 'energy_based',
      unit_rate: '',
      tax_percentage: '0',
      description: '',
      is_default: false
    });
  };

  const resetAssignForm = () => {
    setAssignFormData({
      tariff_id: '',
      location_id: null,
      charge_point_id: null,
      connector_id: null,
      effective_from: '',
      effective_to: '',
      time_window_start: '',
      time_window_end: '',
      days_of_week: [],
      is_peak_tariff: false
    });
  };

  const handleAddTariff = async () => {
    try {
      const payload = {
        ...tariffFormData,
        unit_rate: parseFloat(tariffFormData.unit_rate),
        tax_percentage: parseFloat(tariffFormData.tax_percentage),
      };

      await axios.post(`${API}/tariffs`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success('Tariff created successfully', {
        description: `${tariffFormData.tariff_name} has been created`,
        style: { '--toast-description-color': 'rgb(71, 85, 105)' }
      });
      setIsAddTariffOpen(false);
      resetTariffForm();
      fetchTariffs();
    } catch (error) {
      console.error('Error creating tariff:', error);
      toast.error('Failed to create tariff', {
        description: error.response?.data?.detail || 'An error occurred',
        style: { '--toast-description-color': 'rgb(71, 85, 105)' }
      });
    }
  };

  const handleAssignTariff = async () => {
    try {
      const payload = {
        ...assignFormData,
        effective_from: new Date(assignFormData.effective_from).toISOString(),
        effective_to: assignFormData.effective_to ? new Date(assignFormData.effective_to).toISOString() : null,
      };

      await axios.post(`${API}/tariff-assignments`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success('Tariff assigned successfully', {
        description: 'Tariff configuration has been saved',
        style: { '--toast-description-color': 'rgb(71, 85, 105)' }
      });
      setIsAssignTariffOpen(false);
      resetAssignForm();
      fetchAssignments();
    } catch (error) {
      console.error('Error assigning tariff:', error);
      toast.error('Failed to assign tariff', {
        description: error.response?.data?.detail || 'An error occurred',
        style: { '--toast-description-color': 'rgb(71, 85, 105)' }
      });
    }
  };

  const handleDeleteTariff = async (tariffId, tariffName) => {
    if (!window.confirm(`Delete "${tariffName}"? This cannot be undone.`)) return;

    try {
      await axios.delete(`${API}/tariffs/${tariffId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success('Tariff deleted', {
        description: `${tariffName} has been removed`,
        style: { '--toast-description-color': 'rgb(71, 85, 105)' }
      });
      fetchTariffs();
    } catch (error) {
      toast.error('Failed to delete tariff');
    }
  };

  const getTariffName = (tariffId) => {
    const tariff = tariffs.find(t => t.id === tariffId);
    return tariff ? tariff.tariff_name : 'Unknown';
  };

  return (
    <div className="space-y-6" data-testid="tariff-management-page">
      <Breadcrumb items={[{ label: 'Tariff Management', href: null }]} />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-slate-900">Tariff Management</h1>
          <p className="text-slate-600 mt-1">Configure pricing and billing tariffs</p>
        </div>
      </div>

      <Tabs defaultValue="tariffs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tariffs">Charging Tariffs</TabsTrigger>
          <TabsTrigger value="assignments">Tariff Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="tariffs">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Tariffs</CardTitle>
                  <CardDescription>{tariffs.length} tariff{tariffs.length !== 1 ? 's' : ''} configured</CardDescription>
                </div>
                <Button onClick={() => setIsAddTariffOpen(true)} data-testid="add-tariff-btn">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Tariff
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">Loading...</div>
              ) : tariffs.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <DollarSign className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                  <p>No tariffs configured.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tariff Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Unit Rate</TableHead>
                      <TableHead>Tax %</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tariffs.map((tariff) => (
                      <TableRow key={tariff.id}>
                        <TableCell className="font-medium">{tariff.tariff_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {tariff.tariff_type === 'energy_based' ? 'Energy (kWh)' : 'Time (min)'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">${tariff.unit_rate.toFixed(2)}</TableCell>
                        <TableCell>{tariff.tax_percentage}%</TableCell>
                        <TableCell>
                          <Badge variant="default">{tariff.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleDeleteTariff(tariff.id, tariff.tariff_name)}>
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
        </TabsContent>

        <TabsContent value="assignments">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tariff Assignments</CardTitle>
                  <CardDescription>{assignments.length} assignment{assignments.length !== 1 ? 's' : ''} configured</CardDescription>
                </div>
                <Button onClick={() => setIsAssignTariffOpen(true)} data-testid="assign-tariff-btn">
                  <Plus className="mr-2 h-4 w-4" />
                  Assign Tariff
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <p>No tariff assignments yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tariff</TableHead>
                      <TableHead>Scope</TableHead>
                      <TableHead>Time Window</TableHead>
                      <TableHead>Effective Period</TableHead>
                      <TableHead>Peak</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell className="font-medium">{getTariffName(assignment.tariff_id)}</TableCell>
                        <TableCell className="text-sm">
                          {assignment.connector_id ? `Connector ${assignment.connector_id}` :
                           assignment.charge_point_id ? `CP: ${assignment.charge_point_id}` :
                           assignment.location_id ? 'Location-wide' : 'Global'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {assignment.time_window_start && assignment.time_window_end
                            ? `${assignment.time_window_start} - ${assignment.time_window_end}`
                            : 'All day'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(assignment.effective_from).toLocaleDateString()}
                          {assignment.effective_to && ` - ${new Date(assignment.effective_to).toLocaleDateString()}`}
                        </TableCell>
                        <TableCell>
                          {assignment.is_peak_tariff && <Badge variant="secondary">Peak</Badge>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <TariffDialog
        isOpen={isAddTariffOpen}
        onClose={() => {
          setIsAddTariffOpen(false);
          resetTariffForm();
        }}
        onSubmit={handleAddTariff}
        title="Create Tariff"
        formData={tariffFormData}
        onFieldChange={handleTariffFieldChange}
        isEdit={false}
      />

      <AssignTariffDialog
        isOpen={isAssignTariffOpen}
        onClose={() => {
          setIsAssignTariffOpen(false);
          resetAssignForm();
        }}
        onSubmit={handleAssignTariff}
        formData={assignFormData}
        onFieldChange={handleAssignFieldChange}
        tariffs={tariffs}
        locations={locations}
        chargePoints={chargePoints}
      />
    </div>
  );
};

export default TariffManagement;
