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
import { Plus, Edit, Trash2, CreditCard, MoreVertical } from 'lucide-react';
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

const RFIDDialog = ({ isOpen, onClose, onSubmit, title, formData, onFieldChange, isEdit }) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update RFID card details' : 'Register a new RFID card'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>RFID Tag ID <span className="text-red-500">*</span></Label>
            <Input
              value={formData.rfid_tag}
              onChange={(e) => onFieldChange('rfid_tag', e.target.value)}
              placeholder="04A1B2C3D4E5F6"
              disabled={isEdit}
              data-testid="rfid-tag-input"
            />
            <p className="text-xs text-slate-500 mt-1">Unique RFID identifier from card</p>
          </div>
          
          <div>
            <Label>Serial Number</Label>
            <Input
              value={formData.serial_number}
              onChange={(e) => onFieldChange('serial_number', e.target.value)}
              placeholder="SN-12345"
              data-testid="serial-input"
            />
          </div>
          
          <div>
            <Label>User ID</Label>
            <Input
              value={formData.user_id}
              onChange={(e) => onFieldChange('user_id', e.target.value)}
              placeholder="user-123"
              data-testid="user-id-input"
            />
          </div>
          
          <div>
            <Label>User Name</Label>
            <Input
              value={formData.user_name}
              onChange={(e) => onFieldChange('user_name', e.target.value)}
              placeholder="John Doe"
              data-testid="user-name-input"
            />
          </div>
          
          <div>
            <Label>Expiry Date</Label>
            <Input
              type="date"
              value={formData.expiry_date}
              onChange={(e) => onFieldChange('expiry_date', e.target.value)}
              data-testid="expiry-date-input"
            />
            <p className="text-xs text-slate-500 mt-1">Leave empty for no expiry</p>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={!formData.rfid_tag}
            data-testid="submit-rfid-btn"
          >
            {isEdit ? 'Update RFID' : 'Add RFID'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const RFIDManagement = () => {
  const { token } = useAuth();
  const [rfidCards, setRfidCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [formData, setFormData] = useState({
    rfid_tag: '',
    serial_number: '',
    user_id: '',
    user_name: '',
    expiry_date: ''
  });

  useEffect(() => {
    fetchRFIDCards();
  }, [filterStatus]);

  const fetchRFIDCards = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus !== 'all') params.status = filterStatus;
      
      const response = await axios.get(`${API}/rfid-cards`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      setRfidCards(response.data);
    } catch (error) {
      console.error('Error fetching RFID cards:', error);
      toast.error('Failed to fetch RFID cards');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      rfid_tag: '',
      serial_number: '',
      user_id: '',
      user_name: '',
      expiry_date: ''
    });
  };

  const handleAddRFID = async () => {
    try {
      const payload = {
        ...formData,
        expiry_date: formData.expiry_date ? new Date(formData.expiry_date).toISOString() : null
      };

      await axios.post(`${API}/rfid-cards`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success('RFID card added', {
        description: `${formData.rfid_tag} registered successfully`,
        style: { '--toast-description-color': 'rgb(71, 85, 105)' }
      });
      setIsAddDialogOpen(false);
      resetForm();
      fetchRFIDCards();
    } catch (error) {
      toast.error('Failed to add RFID card', {
        description: error.response?.data?.detail || 'An error occurred',
        style: { '--toast-description-color': 'rgb(71, 85, 105)' }
      });
    }
  };

  const handleEditRFID = async () => {
    try {
      const payload = {
        ...formData,
        expiry_date: formData.expiry_date ? new Date(formData.expiry_date).toISOString() : null
      };

      await axios.put(`${API}/rfid-cards/${selectedCard.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success('RFID card updated', {
        description: `${formData.rfid_tag} has been updated`,
        style: { '--toast-description-color': 'rgb(71, 85, 105)' }
      });
      setIsEditDialogOpen(false);
      setSelectedCard(null);
      resetForm();
      fetchRFIDCards();
    } catch (error) {
      toast.error('Failed to update RFID card');
    }
  };

  const handleToggleStatus = async (cardId, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    
    try {
      await axios.patch(`${API}/rfid-cards/${cardId}/status`, null, {
        params: { status: newStatus },
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success(`RFID ${newStatus.toLowerCase()}`, {
        style: { '--toast-description-color': 'rgb(71, 85, 105)' }
      });
      fetchRFIDCards();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDeleteRFID = async (cardId, rfidTag) => {
    if (!window.confirm(`Delete RFID "${rfidTag}"? This cannot be undone.`)) return;

    try {
      await axios.delete(`${API}/rfid-cards/${cardId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success('RFID card deleted', {
        style: { '--toast-description-color': 'rgb(71, 85, 105)' }
      });
      fetchRFIDCards();
    } catch (error) {
      toast.error('Failed to delete RFID card');
    }
  };

  const openEditDialog = (card) => {
    setSelectedCard(card);
    setFormData({
      rfid_tag: card.rfid_tag,
      serial_number: card.serial_number || '',
      user_id: card.user_id || '',
      user_name: card.user_name || '',
      expiry_date: card.expiry_date ? new Date(card.expiry_date).toISOString().split('T')[0] : ''
    });
    setIsEditDialogOpen(true);
  };

  const getStatusBadge = (status, expiryDate) => {
    if (status === 'EXPIRED' || (expiryDate && new Date(expiryDate) < new Date())) {
      return <Badge variant="destructive">EXPIRED</Badge>;
    }
    if (status === 'ACTIVE') {
      return <Badge variant="default">ACTIVE</Badge>;
    }
    return <Badge variant="secondary">INACTIVE</Badge>;
  };

  return (
    <div className="space-y-6" data-testid="rfid-management-page">
      <Breadcrumb items={[{ label: 'RFID Management', href: null }]} />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-slate-900">RFID Management</h1>
          <p className="text-slate-600 mt-1">Manage RFID cards and access control</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} data-testid="add-rfid-btn">
          <Plus className="mr-2 h-4 w-4" />
          Add RFID Card
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All RFID Cards</CardTitle>
              <CardDescription>
                {rfidCards.length} card{rfidCards.length !== 1 ? 's' : ''} registered
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="h-9 px-3 border rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Inactive Only</option>
                <option value="EXPIRED">Expired Only</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : rfidCards.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <CreditCard className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <p>No RFID cards registered.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>RFID Tag</TableHead>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rfidCards.map((card) => (
                  <TableRow key={card.id}>
                    <TableCell className="font-mono font-medium">{card.rfid_tag}</TableCell>
                    <TableCell className="text-sm">{card.serial_number || '—'}</TableCell>
                    <TableCell className="text-sm">
                      {card.user_name || '—'}
                      {card.user_id && <p className="text-xs text-slate-500">ID: {card.user_id}</p>}
                    </TableCell>
                    <TableCell className="text-sm">
                      {card.expiry_date ? new Date(card.expiry_date).toLocaleDateString() : 'No expiry'}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(card.status, card.expiry_date)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(card)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(card.id, card.status)}>
                            {card.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteRFID(card.id, card.rfid_tag)}
                            className="text-red-600"
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

      <RFIDDialog
        isOpen={isAddDialogOpen}
        onClose={() => {
          setIsAddDialogOpen(false);
          resetForm();
        }}
        onSubmit={handleAddRFID}
        title="Add RFID Card"
        formData={formData}
        onFieldChange={handleFieldChange}
        isEdit={false}
      />

      <RFIDDialog
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setSelectedCard(null);
          resetForm();
        }}
        onSubmit={handleEditRFID}
        title="Edit RFID Card"
        formData={formData}
        onFieldChange={handleFieldChange}
        isEdit={true}
      />
    </div>
  );
};

export default RFIDManagement;
