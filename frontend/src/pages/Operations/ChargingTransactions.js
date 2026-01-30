import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Search, FileText, Download } from 'lucide-react';
import Breadcrumb from '@/components/Breadcrumb';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const InvoicePreviewDialog = ({ isOpen, onClose, invoiceData }) => {
  if (!invoiceData) return null;

  const { transaction, location, charge_point, tariff, invoice_details } = invoiceData;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Charging Invoice</DialogTitle>
          <DialogDescription>Transaction ID: {transaction.transaction_id}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Transaction Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Transaction Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500">Transaction ID</p>
                  <p className="text-sm font-mono font-medium">{transaction.transaction_id}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Session Type</p>
                  <Badge variant="outline">{transaction.session_type}</Badge>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Start Time</p>
                  <p className="text-sm">{new Date(transaction.start_time).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">End Time</p>
                  <p className="text-sm">{new Date(transaction.end_time).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Duration</p>
                  <p className="text-sm font-medium">{transaction.duration_minutes} minutes</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Status</p>
                  <Badge variant="default">{transaction.status}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location & Charge Point */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Location & Charge Point</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500">Location</p>
                  <p className="text-sm font-medium">{transaction.location_name}</p>
                  {location && (
                    <p className="text-xs text-slate-600">{location.city}, {location.state}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-slate-500">Charge Point</p>
                  <p className="text-sm font-mono font-medium">{transaction.charge_point_id}</p>
                  {charge_point && (
                    <p className="text-xs text-slate-600">{charge_point.vendor} {charge_point.model}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-slate-500">Connector</p>
                  <p className="text-sm font-medium">Connector {transaction.connector_id}</p>
                </div>
                {transaction.user_name && (
                  <div>
                    <p className="text-xs text-slate-500">User</p>
                    <p className="text-sm font-medium">{transaction.user_name}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Meter Values */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Meter Values</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-slate-500">Start Meter</p>
                  <p className="text-sm font-medium">{invoice_details.meter_start.toFixed(2)} kWh</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Stop Meter</p>
                  <p className="text-sm font-medium">{invoice_details.meter_stop.toFixed(2)} kWh</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Energy Consumed</p>
                  <p className="text-lg font-bold text-primary">{invoice_details.energy_consumed_kwh.toFixed(2)} kWh</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Billing Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Billing Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tariff && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Tariff Applied</span>
                  <span className="font-medium">{transaction.tariff_name}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Unit Rate</span>
                <span className="font-medium">${invoice_details.unit_rate.toFixed(2)} / kWh</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Energy Cost</span>
                <span className="font-medium">${invoice_details.base_cost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Tax</span>
                <span className="font-medium">${invoice_details.tax_amount.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold text-primary">${invoice_details.total_cost.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ChargingTransactions = () => {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterLocation, setFilterLocation] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    fetchTransactions();
    fetchLocations();
  }, [filterLocation]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterLocation !== 'all') params.location_id = filterLocation;
      
      const response = await axios.get(`${API}/charging-transactions`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to fetch charging transactions');
    } finally {
      setLoading(false);
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

  const handleViewInvoice = async (transactionId) => {
    try {
      const response = await axios.get(`${API}/charging-transactions/${transactionId}/invoice`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedInvoice(response.data);
      setIsInvoiceOpen(true);
    } catch (error) {
      toast.error('Failed to load invoice', {
        description: error.response?.data?.detail || 'An error occurred',
        style: { '--toast-description-color': 'rgb(71, 85, 105)' }
      });
    }
  };

  const filteredTransactions = transactions.filter(txn => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return txn.transaction_id.toLowerCase().includes(query) ||
             txn.charge_point_id.toLowerCase().includes(query) ||
             (txn.user_name && txn.user_name.toLowerCase().includes(query));
    }
    return true;
  });

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  return (
    <div className="space-y-6" data-testid="charging-transactions-page">
      <Breadcrumb items={[{ label: 'Charging Transactions', href: null }]} />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-slate-900">Charging Transactions</h1>
          <p className="text-slate-600 mt-1">View completed charging sessions and billing</p>
        </div>
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
              <Select value={filterLocation} onValueChange={setFilterLocation}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                  ))}
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
              <FileText className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <p>No charging transactions found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>CP ID</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>kWh</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Session Type</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTransactions.map((txn) => (
                  <TableRow key={txn.id}>
                    <TableCell>
                      <button
                        onClick={() => handleViewInvoice(txn.transaction_id)}
                        className="font-mono text-sm text-primary hover:underline"
                        data-testid={`txn-link-${txn.id}`}
                      >
                        {txn.transaction_id.slice(0, 12)}...
                      </button>
                    </TableCell>
                    <TableCell className="text-sm">{txn.location_name}</TableCell>
                    <TableCell className="font-mono text-sm">{txn.charge_point_id}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(txn.start_time).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-medium">{txn.energy_kwh.toFixed(2)}</TableCell>
                    <TableCell className="text-sm">{txn.duration_minutes} min</TableCell>
                    <TableCell>
                      <Badge variant="outline">{txn.session_type}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">${txn.total_cost.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="default">{txn.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewInvoice(txn.transaction_id)}
                        data-testid={`view-invoice-${txn.id}`}
                      >
                        <FileText className="h-4 w-4" />
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

      <InvoicePreviewDialog
        isOpen={isInvoiceOpen}
        onClose={() => {
          setIsInvoiceOpen(false);
          setSelectedInvoice(null);
        }}
        invoiceData={selectedInvoice}
      />
    </div>
  );
};

export default ChargingTransactions;
