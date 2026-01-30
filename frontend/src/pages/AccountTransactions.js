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
import { Plus, Download, Search, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import Breadcrumb from '@/components/Breadcrumb';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TransactionDialog = ({ isOpen, onClose, onSubmit, formData, onFieldChange }) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription>Record a manual account transaction</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>User ID <span className="text-red-500">*</span></Label>
            <Input
              value={formData.user_id}
              onChange={(e) => onFieldChange('user_id', e.target.value)}
              placeholder="user-123"
              data-testid="user-id-input"
            />
          </div>
          
          <div>
            <Label>User Name <span className="text-red-500">*</span></Label>
            <Input
              value={formData.user_name}
              onChange={(e) => onFieldChange('user_name', e.target.value)}
              placeholder="John Doe"
              data-testid="user-name-input"
            />
          </div>
          
          <div>
            <Label>Phone</Label>
            <Input
              value={formData.phone}
              onChange={(e) => onFieldChange('phone', e.target.value)}
              placeholder="+1234567890"
              data-testid="phone-input"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Transaction Type <span className="text-red-500">*</span></Label>
              <Select value={formData.transaction_type} onValueChange={(value) => onFieldChange('transaction_type', value)}>
                <SelectTrigger data-testid="type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CREDIT">Credit (Top-up)</SelectItem>
                  <SelectItem value="DEBIT">Debit (Payment)</SelectItem>
                </SelectContent>
              </Select>
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
          </div>
          
          <div>
            <Label>Gateway ID</Label>
            <Input
              value={formData.gateway_id}
              onChange={(e) => onFieldChange('gateway_id', e.target.value)}
              placeholder="stripe_pi_abc123"
              data-testid="gateway-id-input"
            />
          </div>
          
          <div>
            <Label>Payment Method</Label>
            <Select value={formData.payment_method} onValueChange={(value) => onFieldChange('payment_method', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CARD">Credit/Debit Card</SelectItem>
                <SelectItem value="WALLET">Digital Wallet</SelectItem>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
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
            disabled={!formData.user_id || !formData.user_name || !formData.transaction_type || !formData.amount}
            data-testid="submit-transaction-btn"
          >
            Add Transaction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const AccountTransactions = () => {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    user_id: '',
    user_name: '',
    phone: '',
    gateway_id: '',
    session_id: '',
    transaction_type: 'CREDIT',
    amount: '',
    payment_method: '',
    description: ''
  });

  useEffect(() => {
    fetchTransactions();
  }, [filterType, filterStatus]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterType !== 'all') params.transaction_type = filterType;
      if (filterStatus !== 'all') params.status = filterStatus;
      
      const response = await axios.get(`${API}/account-transactions`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      user_id: '',
      user_name: '',
      phone: '',
      gateway_id: '',
      session_id: '',
      transaction_type: 'CREDIT',
      amount: '',
      payment_method: '',
      description: ''
    });
  };

  const handleAddTransaction = async () => {
    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount)
      };

      await axios.post(`${API}/account-transactions`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success('Transaction recorded', {
        description: `${formData.transaction_type} of $${formData.amount} added`,
        style: { '--toast-description-color': 'rgb(71, 85, 105)' }
      });
      setIsAddDialogOpen(false);
      resetForm();
      fetchTransactions();
    } catch (error) {
      toast.error('Failed to add transaction', {
        description: error.response?.data?.detail || 'An error occurred',
        style: { '--toast-description-color': 'rgb(71, 85, 105)' }
      });
    }
  };

  const handleDownloadInvoice = async (transactionId) => {
    try {
      const response = await axios.get(`${API}/account-transactions/${transactionId}/invoice`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      toast.info('Invoice generation', {
        description: response.data.message,
        style: { '--toast-description-color': 'rgb(71, 85, 105)' }
      });
    } catch (error) {
      toast.error('Failed to download invoice');
    }
  };

  const filteredTransactions = transactions.filter(txn => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return txn.user_name.toLowerCase().includes(query) ||
             txn.transaction_id.toLowerCase().includes(query) ||
             (txn.phone && txn.phone.includes(query));
    }
    return true;
  });

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  const getStatusBadge = (status) => {
    const variants = {
      'COMPLETED': 'default',
      'PENDING': 'secondary',
      'FAILED': 'destructive',
      'REFUNDED': 'outline'
    };
    return variants[status] || 'secondary';
  };

  return (
    <div className="space-y-6" data-testid="account-transactions-page">
      <Breadcrumb items={[{ label: 'Account Transactions', href: null }]} />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-slate-900">Account Transactions</h1>
          <p className="text-slate-600 mt-1">Track admin top-ups and user payments</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} data-testid="add-transaction-btn">
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>All Transactions</CardTitle>
              <CardDescription>
                {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} recorded
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="CREDIT">Credit Only</SelectItem>
                  <SelectItem value="DEBIT">Debit Only</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                <Input
                  placeholder="Search transactions..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="search-transactions-input"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : paginatedTransactions.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p>No transactions found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Gateway ID</TableHead>
                  <TableHead>Session ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTransactions.map((txn) => (
                  <TableRow key={txn.id}>
                    <TableCell className="font-mono text-sm">{txn.transaction_id.slice(0, 8)}...</TableCell>
                    <TableCell className="font-medium">{txn.user_name}</TableCell>
                    <TableCell className="text-sm">{txn.phone || '—'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {txn.transaction_type === 'CREDIT' ? (
                          <ArrowUpCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <ArrowDownCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="text-sm">{txn.transaction_type}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      ${txn.amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">{txn.gateway_id || '—'}</TableCell>
                    <TableCell className="text-sm text-slate-600">{txn.session_id || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadge(txn.status)}>
                        {txn.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(txn.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadInvoice(txn.transaction_id)}
                        data-testid={`download-invoice-${txn.id}`}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          
          {paginatedTransactions.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-slate-600">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredTransactions.length)} of {filteredTransactions.length}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="flex items-center px-3 text-sm text-slate-600">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <TransactionDialog
        isOpen={isAddDialogOpen}
        onClose={() => {
          setIsAddDialogOpen(false);
          resetForm();
        }}
        onSubmit={handleAddTransaction}
        formData={formData}
        onFieldChange={handleFieldChange}
      />
    </div>
  );
};

export default AccountTransactions;
