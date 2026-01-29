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

const ChargerModelDialog = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  title, 
  formData, 
  onFieldChange, 
  oems,
  onAddConnector,
  onRemoveConnector,
  onUpdateConnector,
  isEdit
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update charger model details' : 'Create a new charger model with connector configurations'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="col-span-2">
            <Label htmlFor="oem_id">OEM *</Label>
            <Select value={formData.oem_id} onValueChange={(value) => onFieldChange('oem_id', value)}>
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
          <div className="col-span-2">
            <Label htmlFor="model_name">Charger Model Name *</Label>
            <Input
              id="model_name"
              value={formData.model_name}
              onChange={(e) => onFieldChange('model_name', e.target.value)}
              placeholder="Terra 54"
              data-testid="model-name-input"
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
              data-testid="power-input"
            />
          </div>
          <div>
            <Label htmlFor="max_voltage_v">Max Voltage (V) *</Label>
            <Input
              id="max_voltage_v"
              value={formData.max_voltage_v}
              onChange={(e) => onFieldChange('max_voltage_v', e.target.value)}
              placeholder="480"
              data-testid="voltage-input"
            />
          </div>
          <div className="col-span-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => onFieldChange('description', e.target.value)}
              placeholder="50kW DC fast charger"
              data-testid="description-input"
            />
          </div>

          <div className="col-span-2 mt-4">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base">Connector Configurations (Max 4)</Label>
              <Button 
                type="button" 
                size="sm" 
                onClick={onAddConnector} 
                disabled={formData.connector_configs.length >= 4}
                data-testid="add-connector-config-btn"
              >
                <Plus className="h-4 w-4 mr-1" /> Add Connector
              </Button>
            </div>
            {formData.connector_configs.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4 border border-dashed rounded-md">
                No connectors configured. Add at least one connector.
              </p>
            ) : (
              <div className="space-y-3">
                {formData.connector_configs.map((connector, index) => (
                  <div key={index} className="p-4 border rounded-md relative bg-slate-50">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => onRemoveConnector(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <div className="grid grid-cols-5 gap-3">
                      <div>
                        <Label className="text-xs">Connector #</Label>
                        <Input
                          type="text"
                          value={connector.connector_number}
                          onChange={(e) => onUpdateConnector(index, 'connector_number', parseInt(e.target.value) || 1)}
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
                          value={connector.max_power_kw}
                          onChange={(e) => onUpdateConnector(index, 'max_power_kw', parseFloat(e.target.value) || 0)}
                          className="h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Max Voltage (V)</Label>
                        <Input
                          type="text"
                          value={connector.max_voltage_v}
                          onChange={(e) => onUpdateConnector(index, 'max_voltage_v', parseFloat(e.target.value) || 0)}
                          className="h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Frequency (Hz)</Label>
                        <Input
                          type="text"
                          value={connector.frequency_hz || ''}
                          onChange={(e) => onUpdateConnector(index, 'frequency_hz', parseInt(e.target.value) || 50)}
                          placeholder="50"
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
          <Button type="button" variant="outline" onClick={onClose} data-testid="cancel-model-btn">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={!formData.oem_id || !formData.model_name || !formData.protocol || !formData.charger_type || !formData.max_power_kw || !formData.max_voltage_v}
            data-testid="submit-model-btn"
          >
            {isEdit ? 'Update Model' : 'Add Model'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ChargerModelManagement = () => {
  const { token } = useAuth();
  const [models, setModels] = useState([]);
  const [oems, setOems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOEM, setSelectedOEM] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  const [formData, setFormData] = useState({
    oem_id: '',
    model_name: '',
    description: '',
    protocol: 'OCPP 1.6',
    charger_type: 'DC',
    max_power_kw: '',
    max_voltage_v: '',
    connector_configs: []
  });

  useEffect(() => {
    fetchOEMs();
    fetchModels();
  }, []);

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

  const fetchModels = async (oemId = '') => {
    try {
      setLoading(true);
      const params = {};
      if (oemId) params.oem_id = oemId;
      
      const response = await axios.get(`${API}/charger-models`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      setModels(response.data);
    } catch (error) {
      console.error('Error fetching models:', error);
      toast.error('Failed to fetch charger models');
    } finally {
      setLoading(false);
    }
  };

  const handleOEMFilter = (value) => {
    setSelectedOEM(value);
    fetchModels(value === 'all' ? '' : value);
  };

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      oem_id: '',
      model_name: '',
      description: '',
      protocol: 'OCPP 1.6',
      charger_type: 'DC',
      max_power_kw: '',
      max_voltage_v: '',
      connector_configs: []
    });
  };

  const handleAddConnector = () => {
    if (formData.connector_configs.length >= 4) {
      toast.error('Maximum 4 connectors allowed');
      return;
    }
    setFormData(prev => ({
      ...prev,
      connector_configs: [
        ...prev.connector_configs,
        { 
          connector_number: prev.connector_configs.length + 1, 
          connector_type: 'Type2', 
          max_power_kw: 22, 
          max_voltage_v: 400,
          frequency_hz: 50
        }
      ]
    }));
  };

  const handleRemoveConnector = (index) => {
    setFormData(prev => ({
      ...prev,
      connector_configs: prev.connector_configs.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateConnector = (index, field, value) => {
    setFormData(prev => {
      const newConfigs = [...prev.connector_configs];
      newConfigs[index] = { ...newConfigs[index], [field]: value };
      return { ...prev, connector_configs: newConfigs };
    });
  };

  const handleAddModel = async () => {
    try {
      const payload = {
        ...formData,
        max_power_kw: parseFloat(formData.max_power_kw),
        max_voltage_v: parseFloat(formData.max_voltage_v),
      };

      await axios.post(`${API}/charger-models`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success('Charger model added successfully!', {
        description: `${formData.model_name} has been added`,
      });
      setIsAddDialogOpen(false);
      resetForm();
      fetchModels(selectedOEM === 'all' ? '' : selectedOEM);
    } catch (error) {
      console.error('Error adding model:', error);
      toast.error('Failed to add charger model', {
        description: error.response?.data?.detail || 'An error occurred',
      });
    }
  };

  const handleEditModel = async () => {
    try {
      const payload = {
        ...formData,
        max_power_kw: parseFloat(formData.max_power_kw),
        max_voltage_v: parseFloat(formData.max_voltage_v),
      };

      await axios.put(`${API}/charger-models/${selectedModel.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success('Charger model updated successfully!', {
        description: `${formData.model_name} has been updated`,
      });
      setIsEditDialogOpen(false);
      setSelectedModel(null);
      resetForm();
      fetchModels(selectedOEM === 'all' ? '' : selectedOEM);
    } catch (error) {
      console.error('Error updating model:', error);
      toast.error('Failed to update charger model', {
        description: error.response?.data?.detail || 'An error occurred',
      });
    }
  };

  const handleDeleteModel = async (modelId, modelName) => {
    if (!window.confirm(`Are you sure you want to delete \"${modelName}\"?`)) return;

    try {
      await axios.delete(`${API}/charger-models/${modelId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success('Charger model deleted successfully!', {
        description: `${modelName} has been removed`,
      });
      fetchModels(selectedOEM === 'all' ? '' : selectedOEM);
    } catch (error) {
      console.error('Error deleting model:', error);
      toast.error('Failed to delete charger model', {
        description: error.response?.data?.detail || 'An error occurred',
      });
    }
  };

  const openEditDialog = (model) => {
    setSelectedModel(model);
    setFormData({
      oem_id: model.oem_id,
      model_name: model.model_name,
      description: model.description || '',
      protocol: model.protocol,
      charger_type: model.charger_type,
      max_power_kw: model.max_power_kw.toString(),
      max_voltage_v: model.max_voltage_v.toString(),
      connector_configs: model.connector_configs || []
    });
    setIsEditDialogOpen(true);
  };

  const getOEMName = (oemId) => {
    const oem = oems.find(o => o.id === oemId);
    return oem ? oem.oem_name : 'Unknown';
  };

  return (
    <div className="space-y-6" data-testid="charger-model-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-slate-900">Charger Model Management</h1>
          <p className="text-slate-600 mt-1">Manage charger models and connector configurations</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} data-testid="add-model-btn">
          <Plus className="mr-2 h-4 w-4" />
          Add Charger Model
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Charger Models</CardTitle>
              <CardDescription>
                {models.length} charger model{models.length !== 1 ? 's' : ''} configured
              </CardDescription>
            </div>
            <Select value={selectedOEM} onValueChange={handleOEMFilter}>
              <SelectTrigger className="w-48" data-testid="oem-filter">
                <SelectValue placeholder="Filter by OEM" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All OEMs</SelectItem>
                {oems.map((oem) => (
                  <SelectItem key={oem.id} value={oem.id}>
                    {oem.oem_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-slate-500">Loading charger models...</div>
          ) : models.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Zap className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <p>No charger models found.</p>
              <p className="text-sm mt-1">Add your first charger model to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model Name</TableHead>
                  <TableHead>OEM</TableHead>
                  <TableHead>Protocol</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Max Power</TableHead>
                  <TableHead>Max Voltage</TableHead>
                  <TableHead>Connectors</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {models.map((model) => (
                  <TableRow key={model.id} data-testid={`model-row-${model.id}`}>
                    <TableCell className="font-medium">{model.model_name}</TableCell>
                    <TableCell>{getOEMName(model.oem_id)}</TableCell>
                    <TableCell><Badge variant="outline">{model.protocol}</Badge></TableCell>
                    <TableCell><Badge variant="outline">{model.charger_type}</Badge></TableCell>
                    <TableCell>{model.max_power_kw} kW</TableCell>
                    <TableCell>{model.max_voltage_v} V</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{model.connector_configs.length} connectors</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`model-actions-${model.id}`}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(model)} data-testid="edit-model-btn">
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteModel(model.id, model.model_name)}
                            className="text-red-600"
                            data-testid="delete-model-btn"
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

      <ChargerModelDialog
        isOpen={isAddDialogOpen}
        onClose={() => {
          setIsAddDialogOpen(false);
          resetForm();
        }}
        onSubmit={handleAddModel}
        title="Add Charger Model"
        formData={formData}
        onFieldChange={handleFieldChange}
        oems={oems}
        onAddConnector={handleAddConnector}
        onRemoveConnector={handleRemoveConnector}
        onUpdateConnector={handleUpdateConnector}
        isEdit={false}
      />

      <ChargerModelDialog
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setSelectedModel(null);
          resetForm();
        }}
        onSubmit={handleEditModel}
        title="Edit Charger Model"
        formData={formData}
        onFieldChange={handleFieldChange}
        oems={oems}
        onAddConnector={handleAddConnector}
        onRemoveConnector={handleRemoveConnector}
        onUpdateConnector={handleUpdateConnector}
        isEdit={true}
      />
    </div>
  );
};

export default ChargerModelManagement;
