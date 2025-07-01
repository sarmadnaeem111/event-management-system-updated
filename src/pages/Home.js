import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Divider,
} from '@mui/material';
import weddingHallImage from '../wedding_hall.jpg';
import eventImage from '../event.png';
import bookingImage from '../booking.jpg';
import backgroundImage from '../background.png';

const Home = () => {
  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 8,
          mb: 6,
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)', // Dark overlay with 60% opacity
            zIndex: 1,
          },
        }}
      >
        <Container 
          maxWidth="md" 
          sx={{ 
            position: 'relative',
            zIndex: 2 
          }}
        >
          <Typography
            component="h1"
            variant="h2"
            align="center"
            gutterBottom
            sx={{ 
              fontWeight: 'bold',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
            }}
          >
            Welcome to Event Management System
          </Typography>
          <Typography variant="h5" align="center" paragraph
            sx={{
              textShadow: '1px 1px 3px rgba(0, 0, 0, 0.5)',
              fontWeight: 500
            }}
          >
            Your one-stop solution for wedding hall bookings and event services
          </Typography>
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Button
              component={RouterLink}
              to="/customer/dashboard"
              variant="contained"
              color="secondary"
              size="large"
              sx={{ mb: { xs: 2, md: 0 } }}
            >
              Browse Wedding Halls
            </Button>
            {/* <Button
              component={RouterLink}
              to="/service-provider/register"
              variant="contained"
              color="secondary"
              size="large"
              sx={{ mb: { xs: 2, md: 0 } }}
            >
              Register as Service Provider
            </Button> */}
            {/* <Button
              component={RouterLink}
              to="/hall-manager/register"
              variant="contained"
              color="secondary"
              size="large"
            >
              Register Wedding Hall
            </Button> */}
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ mb: 6 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardMedia
                component="img"
                height="200"
                image={weddingHallImage}
                alt="Wedding Hall"
              />
              <CardContent>
                <Typography gutterBottom variant="h5" component="h2">
                  Wedding Halls
                </Typography>
                <Typography>
                  Browse through our collection of beautiful wedding halls and find the perfect venue for your special day.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardMedia
                component="img"
                height="200"
                image={eventImage}
                alt="Decoration"
              />
              <CardContent>
                <Typography gutterBottom variant="h5" component="h2">
                  Event Services
                </Typography>
                <Typography>
                  Access a wide range of professional services including decoration, photography, and catering.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardMedia
                component="img"
                height="200"
                image={bookingImage}
                alt="Planning"
              />
              <CardContent>
                <Typography gutterBottom variant="h5" component="h2">
                  Easy Booking
                </Typography>
                <Typography>
                  Simple and hassle-free booking process for both wedding halls and services.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* For Businesses Section */}
      <Box sx={{ bgcolor: '#f5f5f5', py: 6, mb: 6 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" align="center" gutterBottom>
            For Businesses
          </Typography>
          <Divider sx={{ mb: 4, width: '100px', mx: 'auto', borderColor: 'primary.main', borderWidth: 2 }} />
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent sx={{ p: 4 }}>
                  <Typography gutterBottom variant="h5" component="h2">
                    Wedding Hall Owners
                  </Typography>
                  <Typography variant="body1" paragraph>
                    Own a wedding hall? Register your venue on our platform to reach more customers and manage bookings efficiently.
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    • Showcase your hall with multiple images<br />
                    • Set your own pricing and availability<br />
                    • Manage booking requests<br />
                    • Get approved by our admin team
                  </Typography>
                  {/* <Button
                    component={RouterLink}
                    to="/hall-manager/register"
                    variant="contained"
                    color="primary"
                  >
                    Register Your Hall
                  </Button> */}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent sx={{ p: 4 }}>
                  <Typography gutterBottom variant="h5" component="h2">
                    Service Providers
                  </Typography>
                  <Typography variant="body1" paragraph>
                    Offer wedding services? Join our platform to connect with customers planning their special day.
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    • List your services<br />
                    • Set your own rates<br />
                    • Receive booking requests<br />
                    • Grow your business
                  </Typography>
                  {/* <Button
                    component={RouterLink}
                    to="/service-provider/register"
                    variant="contained"
                    color="primary"
                  >
                    Register as Provider
                  </Button> */}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default Home; 