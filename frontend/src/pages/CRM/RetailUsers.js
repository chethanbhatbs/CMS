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
import { Plus, Search, Users, DollarSign } from 'lucide-react';
import Breadcrumb from '@/components/Breadcrumb';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AddUserDialog = ({ isOpen, onClose, onSubmit, formData, onFieldChange }) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Add Retail User</DialogTitle>
          <DialogDescription>Register a new customer manually</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>Full Name <span className="text-red-500">*</span></Label>
            <Input
              value={formData.full_name}
              onChange={(e) => onFieldChange('full_name', e.target.value)}
              placeholder="John Doe"
              data-testid="name-input"
            />
          </div>
          
          <div>
            <Label>Email <span className="text-red-500">*</span></Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => onFieldChange('email', e.target.value)}
              placeholder="john@example.com"
              data-testid="email-input"
            />
          </div>
          
          <div>
            <Label>Phone <span className="text-red-500">*</span></Label>
            <Input
              value={formData.phone}
              onChange={(e) => onFieldChange('phone', e.target.value)}
              placeholder="+1234567890"
              data-testid="phone-input"
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
            disabled={!formData.full_name || !formData.email || !formData.phone}
            data-testid="submit-user-btn"
          >
            Add User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const WalletDialog = ({ isOpen, onClose, onSubmit, userId, userName, currentBalance, formData, onFieldChange }) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Update Wallet</DialogTitle>
          <DialogDescription>
            Current balance: ${currentBalance?.toFixed(2) || '0.00'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>Transaction Type <span className="text-red-500">*</span></Label>
            <select
              value={formData.transaction_type}
              onChange={(e) => onFieldChange('transaction_type', e.target.value)}
              className="w-full h-10 px-3 border rounded-md"
            >
              <option value="CREDIT">Credit (Add funds)</option>
              <option value="DEBIT">Debit (Deduct funds)</option>
            </select>
          </div>
          
          <div>
            <Label>Amount <span className="text-red-500">*</span></Label>
            <Input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => onFieldChange('amount', e.target.value)}
              placeholder="50.00"
              data-testid="amount-input"
            />
          </div>
          
          <div>
            <Label>Description</Label>
            <Input
              value={formData.description}
              onChange={(e) => onFieldChange('description', e.target.value)}
              placeholder="Manual top-up"
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
            disabled={!formData.amount}
          >
            Update Wallet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const RetailUsers = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isWalletDialogOpen, setIsWalletDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: ''
  });
  const [walletFormData, setWalletFormData] = useState({
    transaction_type: 'CREDIT',
    amount: '',
    description: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/retail-users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch retail users');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleWalletFieldChange = (field, value) => {
    setWalletFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      phone: ''
    });
  };

  const resetWalletForm = () => {
    setWalletFormData({
      transaction_type: 'CREDIT',
      amount: '',
      description: ''
    });
  };

  const handleAddUser = async () => {
    try {
      await axios.post(`${API}/retail-users`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success('Retail user added', {
        description: `${formData.full_name} has been registered`,
        style: { '--toast-description-color': 'rgb(71, 85, 105)' }
      });
      setIsAddDialogOpen(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      toast.error('Failed to add user', {
        description: error.response?.data?.detail || 'An error occurred',
        style: { '--toast-description-color': 'rgb(71, 85, 105)' }
      });
    }
  };

  const handleUpdateWallet = async () => {
    try {
      const response = await axios.patch(
        `${API}/retail-users/${selectedUser.user_id}/wallet`,
        null,
        {
          params: {
            amount: parseFloat(walletFormData.amount),
            transaction_type: walletFormData.transaction_type,
            description: walletFormData.description || 'Manual adjustment'
          },
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success('Wallet updated', {
        description: `New balance: $${response.data.new_balance.toFixed(2)}`,
        style: { '--toast-description-color': 'rgb(71, 85, 105)' }
      });
      setIsWalletDialogOpen(false);
      setSelectedUser(null);
      resetWalletForm();
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update wallet', {
        description: error.response?.data?.detail || 'An error occurred',
        style: { '--toast-description-color': 'rgb(71, 85, 105)' }
      });
    }
  };

  const openWalletDialog = (user) => {
    setSelectedUser(user);
    setIsWalletDialogOpen(true);
  };

  const filteredUsers = users.filter(user => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return user.full_name.toLowerCase().includes(query) ||
             user.email.toLowerCase().includes(query) ||
             user.phone.includes(query) ||
             user.user_id.toLowerCase().includes(query);
    }
    return true;
  });

  return (
    <div className="space-y-6" data-testid="retail-users-page">
      <Breadcrumb items={[{ label: 'Retail Users', href: null }]} />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-slate-900">Retail Users</h1>
          <p className="text-slate-600 mt-1">Manage individual customer accounts</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} data-testid="add-user-btn">
          <Plus className="mr-2 h-4 w-4" />
          Add Retail User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Retail Users</CardTitle>
              <CardDescription>
                {users.length} customer{users.length !== 1 ? 's' : ''} registered
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
              <Input
                placeholder="Search users..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="search-users-input"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Users className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <p>No retail users found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>RFID Cards</TableHead>
                  <TableHead>Wallet Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono text-sm">{user.user_id}</TableCell>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell className="text-sm">{user.email}</TableCell>
                    <TableCell className="text-sm">{user.phone}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{user.rfid_cards.length} card{user.rfid_cards.length !== 1 ? 's' : ''}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">${user.wallet_balance.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={user.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openWalletDialog(user)}
                      >
                        <DollarSign className="mr-1 h-4 w-4" />
                        Wallet
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AddUserDialog
        isOpen={isAddDialogOpen}
        onClose={() => {
          setIsAddDialogOpen(false);
          resetForm();
        }}
        onSubmit={handleAddUser}
        formData={formData}
        onFieldChange={handleFieldChange}
      />

      <WalletDialog
        isOpen={isWalletDialogOpen}
        onClose={() => {
          setIsWalletDialogOpen(false);
          setSelectedUser(null);
          resetWalletForm();
        }}
        onSubmit={handleUpdateWallet}
        userId={selectedUser?.user_id}
        userName={selectedUser?.full_name}
        currentBalance={selectedUser?.wallet_balance}
        formData={walletFormData}
        onFieldChange={handleWalletFieldChange}
      />
    </div>
  );
};

export default RetailUsers;
