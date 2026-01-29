import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Breadcrumb from '@/components/Breadcrumb';
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
import { Plus, Search, Edit, Trash2, MapPin, MoreVertical } from 'lucide-react';
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

const ADDRESS_MAX_LENGTH = 255;

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'IN', name: 'India' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
];

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const CANADA_PROVINCES = [
  'AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'
];

const UK_COUNTIES = [
  'England', 'Scotland', 'Wales', 'Northern Ireland'
];

const INDIA_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

const getStatesForCountry = (countryCode) => {
  switch (countryCode) {
    case 'US':
      return US_STATES;
    case 'CA':
      return CANADA_PROVINCES;
    case 'GB':
      return UK_COUNTIES;
    case 'IN':
      return INDIA_STATES;
    default:
      return [];
  }
};

const LocationFormDialog = ({ isOpen, onClose, onSubmit, title, description, formData, onFieldChange }) => {
  const [availableStates, setAvailableStates] = useState([]);
  const [isLoadingCity, setIsLoadingCity] = useState(false);

  useEffect(() => {
    if (formData.country) {
      const countryCode = COUNTRIES.find(c => c.name === formData.country)?.code || '';
      setAvailableStates(getStatesForCountry(countryCode));
    }
  }, [formData.country]);

  const fetchCityFromPostalCode = async (postalCode, country) => {
    if (!postalCode || postalCode.length < 3) return;

    setIsLoadingCity(true);
    try {
      const countryCode = COUNTRIES.find(c => c.name === country)?.code || 'US';
      const response = await axios.get(`https://api.zippopotam.us/${countryCode.toLowerCase()}/${postalCode}`);
      
      if (response.data && response.data.places && response.data.places.length > 0) {
        const place = response.data.places[0];
        onFieldChange('city', place['place name']);
        onFieldChange('state', place['state abbreviation'] || place['state']);
        
        if (place.latitude && place.longitude) {
          onFieldChange('latitude', parseFloat(place.latitude).toFixed(5));
          onFieldChange('longitude', parseFloat(place.longitude).toFixed(5));
        }
        
        toast.success('City auto-filled from postal code');
      }
    } catch (error) {
      console.log('Could not fetch city from postal code');
    } finally {
      setIsLoadingCity(false);
    }
  };

  const handlePostalCodeChange = (value) => {
    onFieldChange('postal_code', value);
    
    if (value.length >= 5 && formData.country) {
      fetchCityFromPostalCode(value, formData.country);
    }
  };

  const handleCountryChange = (value) => {
    onFieldChange('country', value);
    onFieldChange('state', '');
    onFieldChange('city', '');
    onFieldChange('postal_code', '');
  };

  const validateLatLong = (value, field) => {
    if (!value) return true;
    
    const num = parseFloat(value);
    if (isNaN(num)) return false;
    
    const parts = value.split('.');
    if (parts.length === 2 && parts[1].length > 5) {
      const truncated = num.toFixed(5);
      onFieldChange(field, truncated);
      toast.info(`${field === 'latitude' ? 'Latitude' : 'Longitude'} rounded to 5 decimal places`);
    }
    
    return true;
  };

  const addressRemaining = ADDRESS_MAX_LENGTH - (formData.address?.length || 0);

  if (!isOpen) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="col-span-2">
            <Label htmlFor="name">Location Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => onFieldChange('name', e.target.value)}
              placeholder="Downtown Charging Hub"
              data-testid="location-name-input"
              autoComplete="off"
            />
          </div>

          <div className="col-span-2">
            <Label htmlFor="country">Country *</Label>
            <Select value={formData.country} onValueChange={handleCountryChange}>
              <SelectTrigger data-testid="country-select">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((country) => (
                  <SelectItem key={country.code} value={country.name}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="state">State / Province *</Label>
            {availableStates.length > 0 ? (
              <Select value={formData.state} onValueChange={(value) => onFieldChange('state', value)}>
                <SelectTrigger data-testid="state-select">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {availableStates.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => onFieldChange('state', e.target.value)}
                placeholder="Enter state"
                data-testid="location-state-input"
                autoComplete="off"
              />
            )}
          </div>

          <div>
            <Label htmlFor="postal_code">Postal Code *</Label>
            <Input
              id="postal_code"
              value={formData.postal_code}
              onChange={(e) => handlePostalCodeChange(e.target.value)}
              placeholder="94102"
              data-testid="location-postal-input"
              autoComplete="off"
            />
            {isLoadingCity && (
              <p className="text-xs text-slate-500 mt-1">Fetching city...</p>
            )}
          </div>

          <div className="col-span-2">
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => onFieldChange('city', e.target.value)}
              placeholder="San Francisco"
              data-testid="location-city-input"
              autoComplete="off"
            />
            <p className="text-xs text-slate-500 mt-1">City is auto-filled from postal code but can be edited if needed</p>
          </div>

          <div className="col-span-2">
            <Label htmlFor="address">Address *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => {
                if (e.target.value.length <= ADDRESS_MAX_LENGTH) {
                  onFieldChange('address', e.target.value);
                }
              }}
              placeholder="123 Main Street"
              data-testid="location-address-input"
              autoComplete="off"
              maxLength={ADDRESS_MAX_LENGTH}
            />
            <p className={`text-xs mt-1 ${addressRemaining < 20 ? 'text-orange-600' : 'text-slate-500'}`}>
              {addressRemaining} characters remaining
            </p>
          </div>

          <div>
            <Label htmlFor="latitude">Latitude</Label>
            <Input
              id="latitude"
              value={formData.latitude}
              onChange={(e) => onFieldChange('latitude', e.target.value)}
              onBlur={(e) => validateLatLong(e.target.value, 'latitude')}
              placeholder="37.77490"
              data-testid="location-latitude-input"
              autoComplete="off"
            />
            <p className="text-xs text-slate-400 mt-1">
              Enter latitude up to 5 decimal places for better precision.
            </p>
          </div>

          <div>
            <Label htmlFor="longitude">Longitude</Label>
            <Input
              id="longitude"
              value={formData.longitude}
              onChange={(e) => onFieldChange('longitude', e.target.value)}
              onBlur={(e) => validateLatLong(e.target.value, 'longitude')}
              placeholder="-122.41940"
              data-testid="location-longitude-input"
              autoComplete="off"
            />
            <p className="text-xs text-slate-400 mt-1">
              Enter longitude up to 5 decimal places for better precision.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} data-testid="cancel-location-btn">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={!formData.name || !formData.address || !formData.city || !formData.state || !formData.postal_code || !formData.country}
            data-testid="submit-location-btn"
          >
            {title.includes('Add') ? 'Add Location' : 'Update Location'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ChargingLocations = () => {
  const { token } = useAuth();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    latitude: '',
    longitude: '',
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async (search = '') => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/locations`, {
        params: { search: search || undefined },
        headers: { Authorization: `Bearer ${token}` },
      });
      setLocations(response.data);
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast.error('Failed to fetch locations');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    fetchLocations(value);
  };

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      city: '',
      state: '',
      postal_code: '',
      country: '',
      latitude: '',
      longitude: '',
    });
  };

  const handleAddLocation = async () => {
    try {
      const payload = {
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      };

      await axios.post(`${API}/locations`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success('Location added successfully!', {
        description: `${formData.name} has been added to your network`,
      });
      setIsAddDialogOpen(false);
      resetForm();
      fetchLocations(searchQuery);
    } catch (error) {
      console.error('Error adding location:', error);
      const errorMsg = error.response?.data?.detail || 'Failed to add location';
      toast.error('Failed to add location', {
        description: errorMsg,
      });
    }
  };

  const handleEditLocation = async () => {
    try {
      const payload = {
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      };

      await axios.put(`${API}/locations/${selectedLocation.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success('Location updated successfully!', {
        description: `${formData.name} has been updated`,
      });
      setIsEditDialogOpen(false);
      setSelectedLocation(null);
      resetForm();
      fetchLocations(searchQuery);
    } catch (error) {
      console.error('Error updating location:', error);
      const errorMsg = error.response?.data?.detail || 'Failed to update location';
      toast.error('Failed to update location', {
        description: errorMsg,
      });
    }
  };

  const handleDeleteLocation = async (locationId, locationName) => {
    if (!window.confirm(`Are you sure you want to delete "${locationName}"? This action cannot be undone.`)) return;

    try {
      await axios.delete(`${API}/locations/${locationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success('Location deleted successfully!', {
        description: `${locationName} has been removed from your network`,
      });
      fetchLocations(searchQuery);
    } catch (error) {
      console.error('Error deleting location:', error);
      const errorMsg = error.response?.data?.detail || 'Failed to delete location';
      toast.error('Failed to delete location', {
        description: errorMsg,
      });
    }
  };

  const handleToggleStatus = async (locationId, currentStatus, locationName) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const action = newStatus === 'ACTIVE' ? 'enable' : 'disable';

    if (!window.confirm(`Are you sure you want to ${action} "${locationName}"?`)) return;

    try {
      await axios.patch(
        `${API}/locations/${locationId}/status`,
        null,
        {
          params: { status: newStatus },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success(`Location ${action}d successfully!`, {
        description: `${locationName} is now ${newStatus}`,
      });
      fetchLocations(searchQuery);
    } catch (error) {
      console.error('Error toggling status:', error);
      const errorMsg = error.response?.data?.detail || 'Failed to update status';
      toast.error(`Failed to ${action} location`, {
        description: errorMsg,
      });
    }
  };

  const openEditDialog = (location) => {
    setSelectedLocation(location);
    setFormData({
      name: location.name,
      address: location.address,
      city: location.city,
      state: location.state,
      postal_code: location.postal_code,
      country: location.country,
      latitude: location.latitude ? location.latitude.toString() : '',
      longitude: location.longitude ? location.longitude.toString() : '',
    });
    setIsEditDialogOpen(true);
  };

  const totalPages = Math.ceil(locations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLocations = locations.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  return (
    <div className="space-y-6" data-testid="charging-locations-page">
      <Breadcrumb items={[
        { label: 'Charging Network', href: null },
        { label: 'Charging Locations', href: null }
      ]} />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-slate-900">Charging Locations</h1>
          <p className="text-slate-600 mt-1">Manage physical locations of charging stations</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} data-testid="add-location-btn">
          <Plus className="mr-2 h-4 w-4" />
          Add Location
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Locations</CardTitle>
              <CardDescription>
                {locations.length} location{locations.length !== 1 ? 's' : ''} in your network
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
              <Input
                placeholder="Search locations..."
                className="pl-9"
                value={searchQuery}
                onChange={handleSearch}
                data-testid="search-locations-input"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-slate-500">Loading locations...</div>
          ) : locations.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <MapPin className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <p>No locations found.</p>
              <p className="text-sm mt-1">Add your first charging location to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Coordinates</TableHead>
                  <TableHead>Charge Points</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.map((location) => (
                  <TableRow key={location.id} data-testid={`location-row-${location.id}`}>
                    <TableCell className="font-medium">{location.name}</TableCell>
                    <TableCell className="text-sm text-slate-600 max-w-xs truncate">{location.address}</TableCell>
                    <TableCell>{location.city}</TableCell>
                    <TableCell>{location.state}</TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {location.latitude && location.longitude
                        ? `${parseFloat(location.latitude).toFixed(5)}, ${parseFloat(location.longitude).toFixed(5)}`
                        : '—'}
                    </TableCell>
                    <TableCell>{location.total_charge_points}</TableCell>
                    <TableCell>
                      <Badge variant={location.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {location.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`location-actions-${location.id}`}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(location)} data-testid="edit-location-btn">
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(location.id, location.status, location.name)}
                            data-testid="toggle-status-btn"
                          >
                            {location.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteLocation(location.id, location.name)}
                            className="text-red-600"
                            data-testid="delete-location-btn"
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

      <LocationFormDialog
        isOpen={isAddDialogOpen}
        onClose={() => {
          setIsAddDialogOpen(false);
          resetForm();
        }}
        onSubmit={handleAddLocation}
        title="Add Location"
        description="Create a new charging location in your network"
        formData={formData}
        onFieldChange={handleFieldChange}
      />

      <LocationFormDialog
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setSelectedLocation(null);
          resetForm();
        }}
        onSubmit={handleEditLocation}
        title="Edit Location"
        description="Update charging location details"
        formData={formData}
        onFieldChange={handleFieldChange}
      />
    </div>
  );
};

export default ChargingLocations;
