import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  TextField,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  IconButton,
  FormHelperText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ImageList,
  ImageListItem,
  CircularProgress,
  Avatar,
  Divider,
  MenuItem,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth, db, storage } from '../../firebase';
import { uploadImageToCloudinary } from '../../utils/cloudinaryUtils';
import DarkModeToggle from '../../components/DarkModeToggle';

const HallManagerDashboard = () => {
  const navigate = useNavigate();
  const [hallData, setHallData] = useState(null);
  const [hallId, setHallId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [bookings, setBookings] = useState([]);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [serviceBookings, setServiceBookings] = useState([]);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openPriceDialog, setOpenPriceDialog] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [bookingPrice, setBookingPrice] = useState('');
  const [editFormData, setEditFormData] = useState({
    hallName: '',
    hallAddress: '',
    hallDescription: '',
    hallCapacity: '',
    hallPrice: '',
    hallPhone: '',
  });
  const [newImages, setNewImages] = useState([]);
  const [newImageUrls, setNewImageUrls] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [useCloudinary, setUseCloudinary] = useState(true); // Default to using Cloudinary for new uploads
  const [bookingActionLoading, setBookingActionLoading] = useState(false);
  
  // New state for profile
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
  });
  const [openProfileDialog, setOpenProfileDialog] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    fullName: '',
    hallName: '',
    hallAddress: '',
    hallDescription: '',
    hallCapacity: '',
    hallPrice: '',
    hallPhone: '',
  });
  const [profileImages, setProfileImages] = useState([]);
  const [profileImageUrls, setProfileImageUrls] = useState([]);
  const [profileImagesToDelete, setProfileImagesToDelete] = useState([]);

  // Add new state for reports
  const [reportFilter, setReportFilter] = useState('all');
  const [reportDateRange, setReportDateRange] = useState({
    startDate: '',
    endDate: '',
  });
  const [filteredReports, setFilteredReports] = useState([]);
  const [bookingTypeFilter, setBookingTypeFilter] = useState('all'); // New state for booking type filter

  useEffect(() => {
    const checkAuth = async () => {
      const user = auth.currentUser;
      const hallManagerId = sessionStorage.getItem('hallManagerId');
      const userType = sessionStorage.getItem('userType');

      if (!user || !hallManagerId || userType !== 'hallManager') {
        navigate('/hall-manager/login');
        return;
      }

      setHallId(hallManagerId);
      await fetchHallData(hallManagerId);
      await fetchBookings(hallManagerId);
    };

    checkAuth();
  }, [navigate]);

  const fetchHallData = async (id) => {
    try {
      setLoading(true);
      const hallManagerRef = doc(db, 'hallManagers', id);
      const hallManagerSnap = await getDoc(hallManagerRef);

      if (hallManagerSnap.exists()) {
        const data = hallManagerSnap.data();
        setHallData(data);
        setEditFormData({
          hallName: data.hallName || '',
          hallAddress: data.hallAddress || '',
          hallDescription: data.hallDescription || '',
          hallCapacity: data.hallCapacity || '',
          hallPrice: data.hallPrice || '',
          hallPhone: data.hallPhone || '',
        });
        
        // Set profile data
        setProfileData({
          fullName: data.name || '',
          email: data.email || '',
        });
        
        setProfileFormData({
          fullName: data.name || '',
          hallName: data.hallName || '',
          hallAddress: data.hallAddress || '',
          hallDescription: data.hallDescription || '',
          hallCapacity: data.hallCapacity || '',
          hallPrice: data.hallPrice || '',
          hallPhone: data.hallPhone || '',
        });
        
        // Reset profile image states
        setProfileImagesToDelete([]);
        setProfileImages([]);
        setProfileImageUrls([]);
      } else {
        setError('Hall manager data not found');
      }
    } catch (error) {
      setError('Error fetching hall data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async (hallManagerId) => {
    try {
      const q = query(
        collection(db, 'bookings'),
        where('hallManagerId', '==', hallManagerId)
      );
      const querySnapshot = await getDocs(q);
      const bookingsData = [];
      const pendingBookingsData = [];
      const allBookingsForReports = [];

      querySnapshot.forEach((doc) => {
        const booking = { id: doc.id, ...doc.data() };
        
        // Add to all bookings for reports
        allBookingsForReports.push({
          ...booking,
          type: booking.type || 'hall' // Default to hall if type is not specified
        });
        
        if (booking.type !== 'service') {
          bookingsData.push(booking);
          if (booking.status === 'pending') {
            pendingBookingsData.push(booking);
          }
        }
      });

      // Fetch service bookings
      const serviceQ = query(
        collection(db, 'bookings'),
        where('type', '==', 'service')
      );
      const serviceSnapshot = await getDocs(serviceQ);
      const serviceBookingsData = [];

      serviceSnapshot.forEach((doc) => {
        const booking = { id: doc.id, ...doc.data() };
        serviceBookingsData.push(booking);
        
        // Also add to all bookings for reports if not already added
        if (!allBookingsForReports.some(b => b.id === booking.id)) {
          allBookingsForReports.push({
            ...booking,
            type: 'service'
          });
        }
      });

      setBookings(allBookingsForReports); // Use all bookings for reports
      setPendingBookings(pendingBookingsData);
      setServiceBookings(serviceBookingsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setLoading(false);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value,
    });
  };

  const handleImageChange = (e) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setNewImages(selectedFiles);
      
      // Create preview URLs
      const newUrls = selectedFiles.map(file => URL.createObjectURL(file));
      setNewImageUrls(newUrls);
    }
  };

  const handleDeleteImage = (imageUrl, index) => {
    // Mark image for deletion
    setImagesToDelete([...imagesToDelete, { url: imageUrl, index }]);
  };

  const handleEditSubmit = async () => {
    try {
      setLoading(true);
      
      // Upload new images if any
      const uploadedImageUrls = [];
      
      for (const image of newImages) {
        try {
          // Upload to Cloudinary
          const result = await uploadImageToCloudinary(image, `hall_images/${hallId}`);
          uploadedImageUrls.push({
            url: result.url,
            publicId: result.publicId,
            provider: 'cloudinary'
          });
        } catch (error) {
          console.error('Error uploading to Cloudinary:', error);
          // Fallback to Firebase if Cloudinary fails
          const storageRef = ref(storage, `hallImages/${hallId}/${Date.now()}_${image.name}`);
          await uploadBytes(storageRef, image);
          const downloadURL = await getDownloadURL(storageRef);
          uploadedImageUrls.push({
            url: downloadURL,
            provider: 'firebase'
          });
        }
      }
      
      // Filter out images marked for deletion
      const updatedImages = (hallData.images || []).filter((_, index) => 
        !imagesToDelete.some(img => img.index === index)
      );
      
      // Combine existing and new images
      const finalImages = [...updatedImages, ...uploadedImageUrls];
      
      // Update hall data in Firestore
      const hallManagerRef = doc(db, 'hallManagers', hallId);
      await updateDoc(hallManagerRef, {
        hallName: editFormData.hallName,
        hallAddress: editFormData.hallAddress,
        hallDescription: editFormData.hallDescription,
        hallCapacity: parseInt(editFormData.hallCapacity) || 0,
        hallPrice: parseFloat(editFormData.hallPrice) || 0,
        hallPhone: editFormData.hallPhone,
        images: finalImages,
      });
      
      // Delete images from storage if needed - but only Firebase images can be deleted directly
      for (const image of imagesToDelete) {
        if (!hallData.images || !hallData.images[image.index]) continue;
        
        const imgData = hallData.images[image.index];
        
        // Check if image is from Firebase - we can delete these
        if (imgData && typeof imgData === 'string' && imgData.includes('firebase')) {
          const imageRef = ref(storage, imgData);
          try {
            await deleteObject(imageRef);
          } catch (error) {
            console.error('Error deleting image from Firebase:', error);
          }
        }
      }
      
      // Refresh hall data
      await fetchHallData(hallId);
      
      setSuccess('Hall information updated successfully');
      setOpenEditDialog(false);
      setNewImages([]);
      setNewImageUrls([]);
      setImagesToDelete([]);
    } catch (error) {
      setError('Error updating hall information');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    auth.signOut().then(() => {
      sessionStorage.removeItem('hallManagerId');
      sessionStorage.removeItem('userType');
      navigate('/hall-manager/login');
    });
  };

  const handleBookingAction = async (bookingId, status) => {
    if (status === 'approved') {
      setSelectedBookingId(bookingId);
      setOpenPriceDialog(true);
      return;
    }

    setBookingActionLoading(true);
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: status,
        updatedAt: new Date().toISOString(),
      });
      
      // Update local state
      setBookings(bookings.map(booking => 
        booking.id === bookingId ? { ...booking, status } : booking
      ));
      
      setPendingBookings(pendingBookings.filter(booking => booking.id !== bookingId));
      
      setSuccess(`Booking ${status === 'approved' ? 'approved' : 'rejected'} successfully!`);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      console.error(`Error ${status} booking:`, error);
      setError(`Failed to ${status} booking. Please try again.`);
      
      // Clear error message after 3 seconds
      setTimeout(() => {
        setError('');
      }, 3000);
    } finally {
      setBookingActionLoading(false);
    }
  };

  const handlePriceSubmit = async () => {
    if (!bookingPrice || isNaN(bookingPrice) || parseFloat(bookingPrice) <= 0) {
      setError('Please enter a valid price');
      return;
    }

    setBookingActionLoading(true);
    try {
      await updateDoc(doc(db, 'bookings', selectedBookingId), {
        status: 'approved',
        price: parseFloat(bookingPrice),
        updatedAt: new Date().toISOString(),
      });
      
      // Update local state
      setBookings(bookings.map(booking => 
        booking.id === selectedBookingId 
          ? { ...booking, status: 'approved', price: parseFloat(bookingPrice) } 
          : booking
      ));
      
      setPendingBookings(pendingBookings.filter(booking => booking.id !== selectedBookingId));
      
      setSuccess('Booking approved successfully!');
      setOpenPriceDialog(false);
      setBookingPrice('');
      setSelectedBookingId(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Error approving booking:', error);
      setError('Failed to approve booking. Please try again.');
      
      // Clear error message after 3 seconds
      setTimeout(() => {
        setError('');
      }, 3000);
    } finally {
      setBookingActionLoading(false);
    }
  };

  const handlePriceDialogClose = () => {
    setOpenPriceDialog(false);
    setBookingPrice('');
    setSelectedBookingId(null);
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileFormData({
      ...profileFormData,
      [name]: value,
    });
  };
  
  const handleProfileImageChange = (e) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setProfileImages(selectedFiles);
      
      // Create preview URLs
      const newUrls = selectedFiles.map(file => URL.createObjectURL(file));
      setProfileImageUrls(newUrls);
    }
  };

  const handleProfileImageDelete = (imageUrl, index) => {
    // Mark image for deletion
    setProfileImagesToDelete([...profileImagesToDelete, { url: imageUrl, index }]);
  };

  const handleProfileSubmit = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Upload new images if any
      const uploadedImageUrls = [];
      
      // Use Cloudinary for all new image uploads
      for (const image of profileImages) {
        try {
          // Upload to Cloudinary
          const result = await uploadImageToCloudinary(image, `hall_images/${hallId}`);
          uploadedImageUrls.push({
            url: result.url,
            publicId: result.publicId,
            provider: 'cloudinary'
          });
        } catch (error) {
          console.error('Error uploading to Cloudinary:', error);
          setError('Error uploading images. Please try again.');
          setLoading(false);
          return;
        }
      }
      
      // Filter out images marked for deletion
      const currentImages = hallData.images || [];
      const updatedImages = currentImages.filter((_, index) => 
        !profileImagesToDelete.some(img => img.index === index)
      );
      
      // Combine existing and new images
      const finalImages = [...updatedImages, ...uploadedImageUrls];
      
      // Update hall manager profile in Firestore
      const hallManagerRef = doc(db, 'hallManagers', hallId);
      await updateDoc(hallManagerRef, {
        name: profileFormData.fullName,
        hallName: profileFormData.hallName,
        hallAddress: profileFormData.hallAddress,
        hallDescription: profileFormData.hallDescription,
        hallCapacity: parseInt(profileFormData.hallCapacity) || 0,
        hallPrice: parseFloat(profileFormData.hallPrice) || 0,
        hallPhone: profileFormData.hallPhone,
        images: finalImages,
      });
      
      // Refresh hall data
      await fetchHallData(hallId);
      
      setSuccess('Profile updated successfully');
      setOpenProfileDialog(false);
      setProfileImages([]);
      setProfileImageUrls([]);
      setProfileImagesToDelete([]);
    } catch (error) {
      setError('Error updating profile information');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filterReports = () => {
    let filtered = [...bookings];
    
    // First filter by date
    if (reportFilter !== 'all') {
      const today = new Date();
      const startOfPeriod = new Date();
      
      switch (reportFilter) {
        case 'day':
          startOfPeriod.setHours(0, 0, 0, 0);
          filtered = bookings.filter(booking => {
            const bookingDate = new Date(booking.date);
            return bookingDate >= startOfPeriod && bookingDate <= today;
          });
          break;
        case 'month':
          startOfPeriod.setDate(1);
          startOfPeriod.setHours(0, 0, 0, 0);
          filtered = bookings.filter(booking => {
            const bookingDate = new Date(booking.date);
            return bookingDate >= startOfPeriod && bookingDate <= today;
          });
          break;
        case 'year':
          startOfPeriod.setMonth(0, 1);
          startOfPeriod.setHours(0, 0, 0, 0);
          filtered = bookings.filter(booking => {
            const bookingDate = new Date(booking.date);
            return bookingDate >= startOfPeriod && bookingDate <= today;
          });
          break;
        case 'custom':
          if (reportDateRange.startDate && reportDateRange.endDate) {
            const start = new Date(reportDateRange.startDate);
            const end = new Date(reportDateRange.endDate);
            end.setHours(23, 59, 59, 999);
            filtered = bookings.filter(booking => {
              const bookingDate = new Date(booking.date);
              return bookingDate >= start && bookingDate <= end;
            });
          }
          break;
        default:
          break;
      }
    }
    
    // Then filter by booking type
    if (bookingTypeFilter !== 'all') {
      filtered = filtered.filter(booking => {
        if (bookingTypeFilter === 'hall') {
          return booking.type !== 'service';
        } else if (bookingTypeFilter === 'service') {
          return booking.type === 'service';
        }
        return true;
      });
    }
    
    setFilteredReports(filtered);
  };

  useEffect(() => {
    filterReports();
  }, [reportFilter, reportDateRange, bookings, bookingTypeFilter]);

  const TabPanel = (props) => {
    const { children, value, index, ...other } = props;
    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`simple-tabpanel-${index}`}
        aria-labelledby={`simple-tab-${index}`}
        {...other}
      >
        {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
      </div>
    );
  };

  if (loading && !hallData) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">Wedding Hall Manager Dashboard</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <DarkModeToggle type="switch" />
          <Button variant="outlined" color="error" onClick={handleLogout}>
            Logout
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Hall Information" />
          <Tab label="Bookings" />
          <Tab label="Pending Requests" />
          <Tab label="Service Bookings" />
          <Tab label="Profile" icon={<PersonIcon />} iconPosition="start" />
          <Tab label="Reports" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {hallData && (
          <Paper elevation={3} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5">{hallData.hallName}</Typography>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => setOpenProfileDialog(true)}
              >
                Edit Information
              </Button>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="bold">Address:</Typography>
                <Typography paragraph>{hallData.hallAddress}</Typography>

                <Typography variant="subtitle1" fontWeight="bold">Description:</Typography>
                <Typography paragraph>{hallData.hallDescription}</Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">Capacity:</Typography>
                    <Typography>{hallData.hallCapacity} people</Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">Price per day:</Typography>
                    <Typography>${hallData.hallPrice}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">Contact:</Typography>
                    <Typography>{hallData.hallPhone}</Typography>
                  </Box>
                </Box>

                <Typography variant="subtitle1" fontWeight="bold">Status:</Typography>
                <Chip
                  label={hallData.status}
                  color={hallData.status === 'approved' ? 'success' : 'warning'}
                  size="small"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Hall Images:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {hallData.images && hallData.images.map((image, index) => (
                    <Box
                      key={index}
                      sx={{
                        position: 'relative',
                        width: 150,
                        height: 150,
                      }}
                    >
                      <img
                        src={image.url || image}
                        alt={`Hall ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: '4px',
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Paper>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Typography variant="h6" gutterBottom>
          All Bookings
        </Typography>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : bookings.length === 0 ? (
          <Typography>No bookings found.</Typography>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Event Type</TableCell>
                  <TableCell>Guests</TableCell>
                  <TableCell>Service Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Contact</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>{booking.date}</TableCell>
                    <TableCell>{booking.customerName}</TableCell>
                    <TableCell>{booking.eventType}</TableCell>
                    <TableCell>{booking.guestCount}</TableCell>
                    <TableCell>
                      <Chip
                        label={booking.serviceType === 'hall' ? 'Hall Service' : 'External Service'}
                        color={booking.serviceType === 'hall' ? 'primary' : 'secondary'}
                        size="small"
                      />
                    </TableCell>
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
                    <TableCell>
                      {booking.phone}
                      <br />
                      {booking.email}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6" gutterBottom>
          Pending Booking Requests
        </Typography>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : pendingBookings.length === 0 ? (
          <Typography>No pending booking requests.</Typography>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Event Type</TableCell>
                  <TableCell>Guests</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Requirements</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>{booking.date}</TableCell>
                    <TableCell>{booking.customerName}</TableCell>
                    <TableCell>{booking.eventType}</TableCell>
                    <TableCell>{booking.guestCount}</TableCell>
                    <TableCell>
                      {booking.phone} <br /> {booking.email}
                    </TableCell>
                    <TableCell>
                      {booking.additionalRequirements || 'None'}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          onClick={() => handleBookingAction(booking.id, 'approved')}
                          disabled={bookingActionLoading}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          size="small"
                          onClick={() => handleBookingAction(booking.id, 'rejected')}
                          disabled={bookingActionLoading}
                        >
                          Reject
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Typography variant="h6" gutterBottom>
          Service Bookings
        </Typography>
        {serviceBookings.length > 0 ? (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tracking ID</TableCell>
                  <TableCell>Customer Name</TableCell>
                  <TableCell>Service Provider</TableCell>
                  <TableCell>Service Date</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Additional Requirements</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {serviceBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>{booking.trackingId}</TableCell>
                    <TableCell>{booking.customerName}</TableCell>
                    <TableCell>{booking.serviceProviderName}</TableCell>
                    <TableCell>{booking.date}</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        Email: {booking.email}<br />
                        Phone: {booking.phone}<br />
                        Address: {booking.customerAddress}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={booking.status}
                        color={
                          booking.status === 'confirmed'
                            ? 'success'
                            : booking.status === 'pending'
                            ? 'warning'
                            : 'error'
                        }
                      />
                    </TableCell>
                    <TableCell>{booking.additionalRequirements || 'None'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography variant="body1" color="text.secondary" align="center">
            No service bookings found
          </Typography>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        {hallData && (
          <Paper elevation={3} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5">Profile Information</Typography>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => setOpenProfileDialog(true)}
              >
                Edit Profile
              </Button>
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Avatar
                  sx={{ 
                    width: 120, 
                    height: 120, 
                    bgcolor: 'primary.main',
                    fontSize: '3rem',
                    mb: 2
                  }}
                >
                  {profileData.fullName ? profileData.fullName.charAt(0).toUpperCase() : 'H'}
                </Avatar>
                <Typography variant="h6">{profileData.fullName}</Typography>
                <Typography variant="body2" color="textSecondary">{profileData.email}</Typography>
              </Grid>
              
              <Grid item xs={12} md={8}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>Personal Information</Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="subtitle2" color="textSecondary">Full Name</Typography>
                      <Typography variant="body1">{profileData.fullName}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={8}>
                      <Typography variant="subtitle2" color="textSecondary">Email Address</Typography>
                      <Typography variant="body1">{profileData.email}</Typography>
                    </Grid>
                  </Grid>
                </Box>
                
                <Box>
                  <Typography variant="h6" gutterBottom>Hall Information</Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="textSecondary">Hall Name</Typography>
                      <Typography variant="body1">{hallData.hallName}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="textSecondary">Contact Phone</Typography>
                      <Typography variant="body1">{hallData.hallPhone}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="textSecondary">Hall Address</Typography>
                      <Typography variant="body1">{hallData.hallAddress}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="textSecondary">Capacity</Typography>
                      <Typography variant="body1">{hallData.hallCapacity} people</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="textSecondary">Price per day</Typography>
                      <Typography variant="body1">${hallData.hallPrice}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="textSecondary">Description</Typography>
                      <Typography variant="body1">{hallData.hallDescription}</Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
              
              <Grid item xs={12} sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>Hall Images</Typography>
                <Divider sx={{ mb: 2 }} />
                
                {hallData.images && hallData.images.length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    {hallData.images.map((image, index) => (
                      <Box
                        key={index}
                        sx={{
                          width: 200,
                          height: 150,
                          borderRadius: 1,
                          overflow: 'hidden',
                          boxShadow: 1,
                        }}
                      >
                        <img
                          src={image.url || image}
                          alt={`Hall ${index + 1}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography color="textSecondary">No images uploaded yet.</Typography>
                )}
              </Grid>
            </Grid>
          </Paper>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={5}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Generate Reports
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Filter Period"
                value={reportFilter}
                onChange={(e) => setReportFilter(e.target.value)}
              >
                <MenuItem value="all">All Time</MenuItem>
                <MenuItem value="day">Today</MenuItem>
                <MenuItem value="month">This Month</MenuItem>
                <MenuItem value="year">This Year</MenuItem>
                <MenuItem value="custom">Custom Range</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Booking Type"
                value={bookingTypeFilter}
                onChange={(e) => setBookingTypeFilter(e.target.value)}
              >
                <MenuItem value="all">All Bookings</MenuItem>
                <MenuItem value="hall">Wedding Hall Bookings</MenuItem>
                <MenuItem value="service">Service Bookings</MenuItem>
              </TextField>
            </Grid>
            {reportFilter === 'custom' && (
              <>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Start Date"
                    value={reportDateRange.startDate}
                    onChange={(e) => setReportDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    type="date"
                    label="End Date"
                    value={reportDateRange.endDate}
                    onChange={(e) => setReportDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </Paper>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Customer Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Event/Service</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No bookings found for the selected period
                  </TableCell>
                </TableRow>
              ) : (
                filteredReports.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>{booking.date}</TableCell>
                    <TableCell>{booking.customerName}</TableCell>
                    <TableCell>{booking.type === 'service' ? 'Service' : 'Wedding Hall'}</TableCell>
                    <TableCell>{booking.type === 'service' ? booking.serviceType : booking.eventType}</TableCell>
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

        {filteredReports.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Summary
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Bookings
                  </Typography>
                  <Typography variant="h4">
                    {filteredReports.length}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Hall: {filteredReports.filter(b => b.type !== 'service').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Service: {filteredReports.filter(b => b.type === 'service').length}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Approved Bookings
                  </Typography>
                  <Typography variant="h4">
                    {filteredReports.filter(b => b.status === 'approved').length}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Hall: {filteredReports.filter(b => b.type !== 'service' && b.status === 'approved').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Service: {filteredReports.filter(b => b.type === 'service' && b.status === 'approved').length}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Revenue
                  </Typography>
                  <Typography variant="h4">
                    ${filteredReports
                      .filter(b => b.status === 'approved')
                      .reduce((sum, b) => sum + (parseFloat(b.price) || 0), 0)
                      .toFixed(2)}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Hall: ${filteredReports
                        .filter(b => b.type !== 'service' && b.status === 'approved')
                        .reduce((sum, b) => sum + (parseFloat(b.price) || 0), 0)
                        .toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Service: ${filteredReports
                        .filter(b => b.type === 'service' && b.status === 'approved')
                        .reduce((sum, b) => sum + (parseFloat(b.price) || 0), 0)
                        .toFixed(2)}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}
      </TabPanel>

      {/* Edit Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Hall Information</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Hall Name"
                name="hallName"
                value={editFormData.hallName}
                onChange={handleEditChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Hall Address"
                name="hallAddress"
                value={editFormData.hallAddress}
                onChange={handleEditChange}
                required
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Hall Description"
                name="hallDescription"
                value={editFormData.hallDescription}
                onChange={handleEditChange}
                required
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Capacity (people)"
                name="hallCapacity"
                type="number"
                value={editFormData.hallCapacity}
                onChange={handleEditChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Price per day"
                name="hallPrice"
                type="number"
                value={editFormData.hallPrice}
                onChange={handleEditChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Contact Phone"
                name="hallPhone"
                value={editFormData.hallPhone}
                onChange={handleEditChange}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Current Images:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {hallData && hallData.images && hallData.images.map((image, index) => (
                  <Box
                    key={index}
                    sx={{
                      position: 'relative',
                      width: 100,
                      height: 100,
                    }}
                  >
                    <img
                      src={image.url || image}
                      alt={`Hall ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '4px',
                      }}
                    />
                    {!imagesToDelete.some(img => img.index === index) && (
                      <IconButton
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          backgroundColor: 'rgba(255, 255, 255, 0.7)',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 0, 0, 0.7)',
                            color: 'white',
                          },
                        }}
                        onClick={() => handleDeleteImage(image, index)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                    {imagesToDelete.some(img => img.index === index) && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: 'rgba(0, 0, 0, 0.5)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          borderRadius: '4px',
                        }}
                        onClick={() => setImagesToDelete(imagesToDelete.filter(img => img.index !== index))}
                      >
                        <Typography variant="caption">Marked for deletion</Typography>
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="contained"
                component="label"
                startIcon={<CloudUploadIcon />}
                sx={{ mt: 1 }}
              >
                Upload New Images
                <input
                  type="file"
                  hidden
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </Button>
              <FormHelperText>Upload multiple images of your wedding hall</FormHelperText>
              
              {newImageUrls.length > 0 && (
                <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {newImageUrls.map((url, index) => (
                    <Box
                      key={index}
                      component="img"
                      src={url}
                      sx={{
                        width: 100,
                        height: 100,
                        objectFit: 'cover',
                        borderRadius: 1,
                      }}
                    />
                  ))}
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button onClick={handleEditSubmit} variant="contained" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Profile Edit Dialog */}
      <Dialog open={openProfileDialog} onClose={() => setOpenProfileDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Profile Information</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Personal Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Full Name"
                name="fullName"
                value={profileFormData.fullName}
                onChange={handleProfileChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                value={profileData.email}
                disabled
                helperText="Email cannot be changed"
              />
            </Grid>
            
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Hall Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Hall Name"
                name="hallName"
                value={profileFormData.hallName}
                onChange={handleProfileChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Hall Address"
                name="hallAddress"
                value={profileFormData.hallAddress}
                onChange={handleProfileChange}
                required
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Hall Description"
                name="hallDescription"
                value={profileFormData.hallDescription}
                onChange={handleProfileChange}
                required
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Capacity (people)"
                name="hallCapacity"
                type="number"
                value={profileFormData.hallCapacity}
                onChange={handleProfileChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Price per day"
                name="hallPrice"
                type="number"
                value={profileFormData.hallPrice}
                onChange={handleProfileChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Contact Phone"
                name="hallPhone"
                value={profileFormData.hallPhone}
                onChange={handleProfileChange}
                required
              />
            </Grid>

            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Hall Images
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Current Images:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {hallData && hallData.images && hallData.images.map((image, index) => (
                  <Box
                    key={index}
                    sx={{
                      position: 'relative',
                      width: 100,
                      height: 100,
                    }}
                  >
                    <img
                      src={image.url || image}
                      alt={`Hall ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '4px',
                      }}
                    />
                    {!profileImagesToDelete.some(img => img.index === index) && (
                      <IconButton
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          backgroundColor: 'rgba(255, 255, 255, 0.7)',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 0, 0, 0.7)',
                            color: 'white',
                          },
                        }}
                        onClick={() => handleProfileImageDelete(image, index)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                    {profileImagesToDelete.some(img => img.index === index) && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: 'rgba(0, 0, 0, 0.5)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          borderRadius: '4px',
                        }}
                        onClick={() => setProfileImagesToDelete(profileImagesToDelete.filter(img => img.index !== index))}
                      >
                        <Typography variant="caption">Marked for deletion</Typography>
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="contained"
                component="label"
                startIcon={<CloudUploadIcon />}
                sx={{ mt: 1 }}
              >
                Upload New Images
                <input
                  type="file"
                  hidden
                  multiple
                  accept="image/*"
                  onChange={handleProfileImageChange}
                />
              </Button>
              <FormHelperText>Upload multiple images of your wedding hall (Images will be stored in Cloudinary)</FormHelperText>
              
              {profileImageUrls.length > 0 && (
                <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {profileImageUrls.map((url, index) => (
                    <Box
                      key={index}
                      component="img"
                      src={url}
                      sx={{
                        width: 100,
                        height: 100,
                        objectFit: 'cover',
                        borderRadius: 1,
                      }}
                    />
                  ))}
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenProfileDialog(false)}>Cancel</Button>
          <Button onClick={handleProfileSubmit} variant="contained" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Price Dialog */}
      <Dialog open={openPriceDialog} onClose={handlePriceDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Approve Booking</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Enter Booking Price"
            type="number"
            value={bookingPrice}
            onChange={(e) => setBookingPrice(e.target.value)}
            margin="normal"
            required
            InputProps={{
              startAdornment: <Typography>Rs.</Typography>
            }}
            helperText="Please enter the final booking price"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePriceDialogClose}>Cancel</Button>
          <Button 
            onClick={handlePriceSubmit} 
            variant="contained" 
            color="primary"
            disabled={bookingActionLoading || !bookingPrice || isNaN(bookingPrice) || parseFloat(bookingPrice) <= 0}
          >
            {bookingActionLoading ? 'Approving...' : 'Approve'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default HallManagerDashboard; 