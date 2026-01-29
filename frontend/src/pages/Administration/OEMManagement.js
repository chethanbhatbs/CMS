import React, { useState, useEffect } from 'react';
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
import { Plus, Search, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const OEMDialog = ({ isOpen, onClose, onSubmit, formData, onFieldChange }) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Add OEM</DialogTitle>
          <DialogDescription>Add a new charger manufacturer</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="col-span-2">
            <Label htmlFor="oem_name">OEM Name *</Label>
            <Input
              id="oem_name"
              value={formData.oem_name}
              onChange={(e) => onFieldChange('oem_name', e.target.value)}
              placeholder="ABB"
              data-testid="oem-name-input"
            />
          </div>
          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={formData.website}
              onChange={(e) => onFieldChange('website', e.target.value)}
              placeholder="https://abb.com"
              data-testid="oem-website-input"
            />
          </div>
          <div>
            <Label htmlFor="support_email">Support Email</Label>
            <Input
              id="support_email"
              type="email"
              value={formData.support_email}
              onChange={(e) => onFieldChange('support_email', e.target.value)}
              placeholder="support@abb.com"
              data-testid="oem-email-input"
            />
          </div>
          <div>
            <Label htmlFor="protocol">Protocol *</Label>
            <Select value={formData.protocol} onValueChange={(value) => onFieldChange('protocol', value)}>
              <SelectTrigger data-testid="protocol-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OCPP 1.6">OCPP 1.6</SelectItem>
                <SelectItem value="OCPP 2.0.1">OCPP 2.0.1</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="charger_type">Charger Type *</Label>
            <Select value={formData.charger_type} onValueChange={(value) => onFieldChange('charger_type', value)}>
              <SelectTrigger data-testid="charger-type-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AC">AC</SelectItem>
                <SelectItem value="DC">DC</SelectItem>
                <SelectItem value="HYBRID">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="max_power_kw">Max Power (kW) *</Label>
            <Input
              id="max_power_kw"
              value={formData.max_power_kw}
              onChange={(e) => onFieldChange('max_power_kw', e.target.value)}
              placeholder="150"
              data-testid="oem-power-input"
            />
          </div>
          <div>
            <Label htmlFor="max_voltage_v">Max Voltage (V) *</Label>
            <Input
              id="max_voltage_v"
              value={formData.max_voltage_v}
              onChange={(e) => onFieldChange('max_voltage_v', e.target.value)}
              placeholder="480"
              data-testid="oem-voltage-input"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} data-testid="cancel-oem-btn">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={!formData.oem_name || !formData.protocol || !formData.charger_type || !formData.max_power_kw || !formData.max_voltage_v}
            data-testid="submit-oem-btn"
          >
            Add OEM
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const OEMManagement = () => {
  const { token } = useAuth();
  const [oems, setOems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    oem_name: '',
    website: '',
    support_email: '',
    protocol: 'OCPP 1.6',
    charger_type: 'DC',
    max_power_kw: '',
    max_voltage_v: '',
  });

  useEffect(() => {
    fetchOEMs();
  }, []);

  const fetchOEMs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/oems`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOems(response.data);
    } catch (error) {
      console.error('Error fetching OEMs:', error);
      toast.error('Failed to fetch OEMs');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      oem_name: '',
      website: '',
      support_email: '',
      protocol: 'OCPP 1.6',
      charger_type: 'DC',
      max_power_kw: '',
      max_voltage_v: '',
    });
  };

  const handleAddOEM = async () => {
    try {
      const payload = {
        ...formData,
        max_power_kw: parseFloat(formData.max_power_kw),
        max_voltage_v: parseFloat(formData.max_voltage_v),
      };

      await axios.post(`${API}/oems`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success('OEM added successfully!', {
        description: `${formData.oem_name} has been added`,
      });
      setIsAddDialogOpen(false);
      resetForm();
      fetchOEMs();
    } catch (error) {
      console.error('Error adding OEM:', error);
      toast.error('Failed to add OEM', {
        description: error.response?.data?.detail || 'An error occurred',
      });
    }
  };

  return (
    <div className="space-y-6" data-testid="oem-management-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-slate-900">OEM Management</h1>
          <p className="text-slate-600 mt-1">Manage charger manufacturers and their models</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} data-testid="add-oem-btn">
          <Plus className="mr-2 h-4 w-4" />
          Add OEM
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All OEMs</CardTitle>
          <CardDescription>
            {oems.length} manufacturer{oems.length !== 1 ? 's' : ''} registered
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-slate-500">Loading OEMs...</div>
          ) : oems.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Building2 className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <p>No OEMs found.</p>
              <p className="text-sm mt-1">Add your first OEM to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>OEM Name</TableHead>
                  <TableHead>Protocol</TableHead>
                  <TableHead>Charger Type</TableHead>
                  <TableHead>Max Power (kW)</TableHead>
                  <TableHead>Max Voltage (V)</TableHead>
                  <TableHead>Support Email</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {oems.map((oem) => (
                  <TableRow key={oem.id} data-testid={`oem-row-${oem.id}`}>
                    <TableCell className="font-medium">{oem.oem_name}</TableCell>
                    <TableCell>{oem.protocol}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{oem.charger_type}</Badge>
                    </TableCell>
                    <TableCell>{oem.max_power_kw} kW</TableCell>
                    <TableCell>{oem.max_voltage_v} V</TableCell>
                    <TableCell className="text-sm text-slate-600">{oem.support_email || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="default">{oem.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <OEMDialog
        isOpen={isAddDialogOpen}
        onClose={() => {
          setIsAddDialogOpen(false);
          resetForm();
        }}
        onSubmit={handleAddOEM}
        formData={formData}
        onFieldChange={handleFieldChange}
      />
    </div>
  );
};

export default OEMManagement;