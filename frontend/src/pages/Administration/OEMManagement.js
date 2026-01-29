import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Plus, Search, Edit, Trash2, Building2, MoreVertical } from 'lucide-react';
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

const OEMDialog = ({ isOpen, onClose, onSubmit, title, formData, onFieldChange, isEdit }) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update OEM details' : 'Add a new charger manufacturer'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
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
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} data-testid="cancel-oem-btn">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={!formData.oem_name}
            data-testid="submit-oem-btn"
          >
            {isEdit ? 'Update OEM' : 'Add OEM'}
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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedOEM, setSelectedOEM] = useState(null);
  const [formData, setFormData] = useState({
    oem_name: '',
    website: '',
    support_email: '',
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
    });
  };

  const handleAddOEM = async () => {
    try {
      await axios.post(`${API}/oems`, formData, {
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

  const handleEditOEM = async () => {
    try {
      await axios.put(`${API}/oems/${selectedOEM.id}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success('OEM updated successfully!', {
        description: `${formData.oem_name} has been updated`,
      });
      setIsEditDialogOpen(false);
      setSelectedOEM(null);
      resetForm();
      fetchOEMs();
    } catch (error) {
      console.error('Error updating OEM:', error);
      toast.error('Failed to update OEM', {
        description: error.response?.data?.detail || 'An error occurred',
      });
    }
  };

  const handleDeleteOEM = async (oemId, oemName) => {
    if (!window.confirm(`Are you sure you want to delete "${oemName}"?`)) return;

    try {
      await axios.delete(`${API}/oems/${oemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success('OEM deleted successfully!', {
        description: `${oemName} has been removed`,
      });
      fetchOEMs();
    } catch (error) {
      console.error('Error deleting OEM:', error);
      toast.error('Failed to delete OEM', {
        description: error.response?.data?.detail || 'An error occurred',
      });
    }
  };

  const openEditDialog = (oem) => {
    setSelectedOEM(oem);
    setFormData({
      oem_name: oem.oem_name,
      website: oem.website || '',
      support_email: oem.support_email || '',
    });
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-6" data-testid="oem-management-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-slate-900">OEM Management</h1>
          <p className="text-slate-600 mt-1">Manage charger manufacturers</p>
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
                  <TableHead>Website</TableHead>
                  <TableHead>Support Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {oems.map((oem) => (
                  <TableRow key={oem.id} data-testid={`oem-row-${oem.id}`}>
                    <TableCell className="font-medium">{oem.oem_name}</TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {oem.website ? (
                        <a href={oem.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          {oem.website}
                        </a>
                      ) : ('—')}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">{oem.support_email || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="default">{oem.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`oem-actions-${oem.id}`}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(oem)} data-testid="edit-oem-btn">
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteOEM(oem.id, oem.oem_name)}
                            className="text-red-600"
                            data-testid="delete-oem-btn"
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

      <OEMDialog
        isOpen={isAddDialogOpen}
        onClose={() => {
          setIsAddDialogOpen(false);
          resetForm();
        }}
        onSubmit={handleAddOEM}
        title="Add OEM"
        formData={formData}
        onFieldChange={handleFieldChange}
        isEdit={false}
      />

      <OEMDialog
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setSelectedOEM(null);
          resetForm();
        }}
        onSubmit={handleEditOEM}
        title="Edit OEM"
        formData={formData}
        onFieldChange={handleFieldChange}
        isEdit={true}
      />
    </div>
  );
};

export default OEMManagement;