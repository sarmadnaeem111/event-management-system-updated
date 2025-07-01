import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Grid,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import { collection, doc, getDoc, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

const WeddingHallBooking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const hallId = queryParams.get('hallId');
  const isManager = queryParams.get('isManager') === 'true';

  const [hallData, setHallData] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [guestCount, setGuestCount] = useState('');
  const [eventType, setEventType] = useState('');
  const [serviceType, setServiceType] = useState('hall');
  const [additionalRequirements, setAdditionalRequirements] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [existingBookings, setExistingBookings] = useState([]);
  const [trackingId, setTrackingId] = useState('');
  const [trackingIdError, setTrackingIdError] = useState('');

  useEffect(() => {
    if (!hallId) {
      navigate('/customer/dashboard');
      return;
    }
    fetchHallData();
    fetchExistingBookings();
    generateTrackingId();
  }, [hallId, navigate]);

  const fetchHallData = async () => {
    try {
      const hallRef = doc(db, isManager ? 'hallManagers' : 'weddingHalls', hallId);
      const hallDoc = await getDoc(hallRef);
      if (hallDoc.exists()) {
        setHallData({ id: hallDoc.id, ...hallDoc.data() });
      } else {
        setError('Wedding hall not found');
        navigate('/customer/dashboard');
      }
    } catch (error) {
      console.error('Error fetching hall data:', error);
      setError('Error fetching hall data');
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingBookings = async () => {
    try {
      const q = query(
        collection(db, 'bookings'),
        where(isManager ? 'hallManagerId' : 'hallId', '==', hallId)
      );
      const querySnapshot = await getDocs(q);
      const bookings = [];
      querySnapshot.forEach((doc) => {
        bookings.push({ id: doc.id, ...doc.data() });
      });
      setExistingBookings(bookings);
    } catch (error) {
      console.error('Error fetching existing bookings:', error);
    }
  };

  const generateTrackingId = () => {
    const timestamp = new Date().getTime();
    const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const suggestedId = `TRK-${timestamp.toString().slice(-6)}-${randomPart}`;
    setTrackingId(suggestedId);
  };

  const validateTrackingId = (value) => {
    if (value && !/^[A-Za-z0-9\-]{6,}$/.test(value)) {
      setTrackingIdError('Tracking ID must be at least 6 characters and contain only letters, numbers, and hyphens');
      return false;
    }
    setTrackingIdError('');
    return true;
  };

  const handleTrackingIdChange = (e) => {
    const value = e.target.value;
    setTrackingId(value);
    validateTrackingId(value);
  };

  const isDateBooked = (date) => {
    if (!date) return false;
    return existingBookings.some(
      booking => 
        booking.date === date && 
        booking.status !== 'rejected'
    );
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setBookingDate(newDate);
    if (isDateBooked(newDate)) {
      setError('This date is already booked');
    } else {
      setError('');
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bookingDate) {
      setError('Please select a booking date');
      return;
    }

    if (isDateBooked(bookingDate)) {
      setError('This date is already booked');
      return;
    }

    if (!validatePhone(phone)) {
      setError('Please enter a valid phone number');
      return;
    }

    if (!validateTrackingId(trackingId)) {
      setError('Please fix the tracking ID format issues before submitting');
      return;
    }

    try {
      // Check if tracking ID already exists
      const trackingQuery = query(
        collection(db, 'bookings'),
        where('trackingId', '==', trackingId)
      );
      
      const trackingSnapshot = await getDocs(trackingQuery);
      
      if (!trackingSnapshot.empty) {
        setError('This tracking ID is already in use. Please choose a different one.');
        return;
      }

      const bookingData = {
        hallId: isManager ? null : hallId,
        hallManagerId: isManager ? hallId : null,
        hallName: hallData.hallName || hallData.name,
        customerName,
        email,
        phone,
        date: bookingDate,
        guestCount: parseInt(guestCount),
        eventType,
        serviceType,
        additionalRequirements,
        status: 'pending',
        createdAt: new Date().toISOString(),
        price: hallData.hallPrice || hallData.price,
        trackingId,
      };

      await addDoc(collection(db, 'bookings'), bookingData);
      setSuccess('Booking request submitted successfully!');
      setOpenDialog(true);
    } catch (error) {
      console.error('Error submitting booking:', error);
      setError('Error submitting booking request');
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    navigate('/customer/dashboard');
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Book Wedding Hall
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        {hallData && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6">{hallData.hallName || hallData.name}</Typography>
            <Typography>Capacity: {hallData.hallCapacity || hallData.capacity} guests</Typography>
            <Typography>Price: ${hallData.hallPrice || hallData.price}/day</Typography>
            {hallData.hallDescription && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                {hallData.hallDescription}
              </Typography>
            )}
          </Box>
        )}

        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Existing Bookings
        </Typography>
        <TableContainer component={Paper} sx={{ mb: 4 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Tracking ID</TableCell>
                <TableCell>Event Type</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {existingBookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No existing bookings
                  </TableCell>
                </TableRow>
              ) : (
                existingBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>{booking.date}</TableCell>
                    <TableCell>{booking.trackingId || 'N/A'}</TableCell>
                    <TableCell>{booking.eventType}</TableCell>
                    <TableCell>${booking.price}</TableCell>
                    <TableCell>
                      <Chip
                        label={booking.status}
                        color={
                          booking.status === 'approved'
                            ? 'success'
                            : booking.status === 'rejected'
                            ? 'error'
                            : 'warning'
                        }
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Customer Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Phone"
                value={phone}
                onChange={(e) => {
                  const value = e.target.value;
                  // Only allow digits and limit to 11 characters
                  const digitsOnly = value.replace(/\D/g, '').slice(0, 11);
                  setPhone(digitsOnly);
                  validatePhone(digitsOnly);
                }}
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
                required
                fullWidth
                label="Booking Date"
                type="date"
                value={bookingDate}
                onChange={handleDateChange}
                InputLabelProps={{
                  shrink: true,
                }}
                error={isDateBooked(bookingDate)}
                helperText={isDateBooked(bookingDate) ? 'Date is already booked' : ''}
                inputProps={{
                  min: new Date().toISOString().split('T')[0]
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Number of Guests"
                type="number"
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Event Type</InputLabel>
                <Select
                  value={eventType}
                  label="Event Type"
                  onChange={(e) => setEventType(e.target.value)}
                >
                  <MenuItem value="Wedding">Wedding</MenuItem>
                  <MenuItem value="Reception">Reception</MenuItem>
                  <MenuItem value="Engagement">Engagement</MenuItem>
                  <MenuItem value="Birthday">Birthday</MenuItem>
                  <MenuItem value="Corporate">Corporate Event</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Service Type</InputLabel>
                <Select
                  value={serviceType}
                  label="Service Type"
                  onChange={(e) => setServiceType(e.target.value)}
                >
                  <MenuItem value="hall">Hall Service</MenuItem>
                  <MenuItem value="external">External Service</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Tracking ID"
                value={trackingId}
                onChange={handleTrackingIdChange}
                error={!!trackingIdError}
                helperText={trackingIdError || "Enter a unique tracking ID of your choice"}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
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
              <TextField
                fullWidth
                label="Additional Requirements"
                multiline
                rows={4}
                value={additionalRequirements}
                onChange={(e) => setAdditionalRequirements(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={isDateBooked(bookingDate)}
              >
                Submit Booking Request
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Booking Submitted</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Your booking request has been submitted successfully. The hall manager will review your request and confirm the booking.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} variant="contained">
            Return to Dashboard
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default WeddingHallBooking; 