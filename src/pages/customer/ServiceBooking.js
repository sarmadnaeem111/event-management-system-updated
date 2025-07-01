import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { doc, getDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

const ServiceBooking = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const providerId = searchParams.get('providerId');
  const [provider, setProvider] = useState(null);
  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    phone: '',
    customerAddress: '',
    date: '',
    serviceType: '',
    numberOfGuests: '',
    additionalRequirements: '',
    trackingId: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [trackingIdError, setTrackingIdError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [existingBookings, setExistingBookings] = useState([]);
  const [dateError, setDateError] = useState('');

  useEffect(() => {
    fetchProviderDetails();
    generateTrackingId();
    fetchAllBookings();
  }, [providerId]);

  const fetchProviderDetails = async () => {
    try {
      const docRef = doc(db, 'serviceProviders', providerId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const providerData = docSnap.data();
        // Ensure services array exists
        if (!providerData.services || !Array.isArray(providerData.services)) {
          providerData.services = [];
        }
        setProvider(providerData);
      } else {
        setError('Service provider not found');
        setTimeout(() => {
          navigate('/customer/dashboard');
        }, 2000);
      }
    } catch (error) {
      setError('Error fetching provider details');
      setTimeout(() => {
        navigate('/customer/dashboard');
      }, 2000);
    }
  };

  const fetchAllBookings = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'bookings'));
      const bookings = [];
      querySnapshot.forEach((doc) => {
        bookings.push({ id: doc.id, ...doc.data() });
      });
      setExistingBookings(bookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const isDateBooked = (date) => {
    if (!date) return false;
    return existingBookings.some(
      booking => 
        booking.date === date && 
        booking.status !== 'rejected'
    );
  };

  const generateTrackingId = () => {
    const timestamp = new Date().getTime();
    const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const suggestedId = `TRK-${timestamp.toString().slice(-6)}-${randomPart}`;
    
    setFormData(prev => ({
      ...prev,
      trackingId: suggestedId
    }));
  };

  const validatePhone = (value) => {
    // Remove any non-digit characters
    const digitsOnly = value.replace(/\D/g, '');
    
    if (digitsOnly.length !== 11) {
      setPhoneError('Phone number must be exactly 11 digits');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'trackingId') {
      // Clear previous tracking ID error
      setTrackingIdError('');
      
      // Validate tracking ID format (alphanumeric with optional hyphens, min 6 chars)
      if (value && !/^[A-Za-z0-9\-]{6,}$/.test(value)) {
        setTrackingIdError('Tracking ID must be at least 6 characters and contain only letters, numbers, and hyphens');
      }
    }

    if (name === 'phone') {
      // Only allow digits and limit to 11 characters
      const digitsOnly = value.replace(/\D/g, '').slice(0, 11);
      setFormData((prev) => ({
        ...prev,
        [name]: digitsOnly,
      }));
      validatePhone(digitsOnly);
      return;
    }

    if (name === 'date') {
      // Check if date is already booked
      if (isDateBooked(value)) {
        setDateError('This date is already booked');
      } else {
        setDateError('');
      }
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if tracking ID is valid
    if (trackingIdError) {
      setError('Please fix the tracking ID format issues before submitting');
      return;
    }

    // Check if phone number is valid
    if (!validatePhone(formData.phone)) {
      setError('Please enter a valid phone number');
      return;
    }

    // Check if date is already booked
    if (isDateBooked(formData.date)) {
      setError('This date is already booked. Please select a different date.');
      return;
    }
    
    try {
      // Check if tracking ID already exists
      const trackingQuery = query(
        collection(db, 'bookings'),
        where('trackingId', '==', formData.trackingId)
      );
      
      const trackingSnapshot = await getDocs(trackingQuery);
      
      if (!trackingSnapshot.empty) {
        setError('This tracking ID is already in use. Please choose a different one.');
        return;
      }
      
      await addDoc(collection(db, 'bookings'), {
        ...formData,
        serviceProviderId: providerId,
        serviceProviderName: provider.name,
        status: 'pending',
        createdAt: new Date().toISOString(),
        type: 'service',
      });

      setSuccess('Service booking request submitted successfully!');
      setTimeout(() => {
        navigate('/customer/dashboard');
      }, 3000);
    } catch (error) {
      setError('Error submitting booking request');
    }
  };

  if (!provider) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 8, textAlign: 'center' }}>
          <Typography>Loading...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Book Service
          </Typography>
          <Typography variant="h6" gutterBottom align="center" color="primary">
            {provider.name}
          </Typography>
          <Typography variant="body1" gutterBottom align="center" color="text.secondary">
            {provider.email} | {provider.phone}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Your Name"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  error={!!phoneError}
                  helperText={phoneError || "Enter 11 digit phone number"}
                  inputProps={{
                    inputMode: 'numeric',
                    pattern: '[0-9]*'
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  InputLabelProps={{
                    shrink: true,
                  }}
                  error={!!dateError}
                  helperText={dateError || ""}
                  inputProps={{
                    min: new Date().toISOString().split('T')[0]
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  name="customerAddress"
                  value={formData.customerAddress}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Tracking ID"
                  name="trackingId"
                  value={formData.trackingId}
                  onChange={handleChange}
                  required
                  helperText={trackingIdError || "Enter a unique tracking ID of your choice"}
                  error={!!trackingIdError}
                />
              </Grid>
              <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={generateTrackingId}
                  sx={{ mt: 1 }}
                >
                  Generate New Tracking ID
                </Button>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Service Type</InputLabel>
                  <Select
                    name="serviceType"
                    value={formData.serviceType}
                    onChange={handleChange}
                    label="Service Type"
                  >
                    {(provider.services || []).map((service) => (
                      <MenuItem key={service} value={service}>
                        {service}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Number of Guests"
                  name="numberOfGuests"
                  type="number"
                  value={formData.numberOfGuests}
                  onChange={handleChange}
                  required
                  InputProps={{
                    inputProps: { min: 1 }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Additional Requirements"
                  name="additionalRequirements"
                  value={formData.additionalRequirements}
                  onChange={handleChange}
                  multiline
                  rows={4}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={!!dateError}
                >
                  Submit Booking Request
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default ServiceBooking; 