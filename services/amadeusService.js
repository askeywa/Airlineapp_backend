// Amadeus API Service - services/amadeusService.js (Optimized)
const axios = require('axios');

class AmadeusService {
  constructor() {
    this.clientId = process.env.AMADEUS_CLIENT_ID;
    this.clientSecret = process.env.AMADEUS_CLIENT_SECRET;
    this.baseUrl = process.env.AMADEUS_BASE_URL || 'https://test.api.amadeus.com';
    this.accessToken = null;
    this.tokenExpiry = null;
    
    // Validate configuration
    if (!this.clientId || !this.clientSecret) {
      console.error('❌ Amadeus API credentials not configured');
      throw new Error('Amadeus API credentials missing');
    }
    
    // Configure axios defaults
    this.axiosConfig = {
      timeout: 30000, // 30 second timeout
      headers: {
        'User-Agent': 'WhatsApp-Airline-Bot/1.0'
      }
    };
    
    console.log('✅ Amadeus service initialized');
  }

  // Get access token for Amadeus API
  async getAccessToken() {
    try {
      // Check if token is still valid (with 5 minute buffer)
      if (this.accessToken && this.tokenExpiry && new Date() < new Date(this.tokenExpiry - 300000)) {
        return this.accessToken;
      }

      console.log('🔑 Requesting new Amadeus access token...');

      const tokenData = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret
      });

      const response = await axios.post(
        `${this.baseUrl}/v1/security/oauth2/token`,
        tokenData,
        {
          ...this.axiosConfig,
          headers: {
            ...this.axiosConfig.headers,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      if (!response.data.access_token) {
        throw new Error('Invalid token response from Amadeus API');
      }

      this.accessToken = response.data.access_token;
      // Token expires in seconds, convert to milliseconds and add to current time
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);

      console.log('✅ Amadeus access token obtained successfully');
      return this.accessToken;

    } catch (error) {
      console.error('❌ Error getting Amadeus access token:', error.response?.data || error.message);
      
      // Clear invalid token
      this.accessToken = null;
      this.tokenExpiry = null;
      
      if (error.response?.status === 401 || error.response?.status === 400) {
        throw new Error('Invalid Amadeus API credentials');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Amadeus API timeout - please try again');
      } else {
        throw new Error('Failed to authenticate with Amadeus API');
      }
    }
  }

  // Search for flights using Amadeus API
  async searchFlights(searchParams) {
    try {
      const { origin, destination, departureDate, returnDate, adults = 1 } = searchParams;

      // Validate input parameters
      if (!origin || !destination || !departureDate) {
        throw new Error('Missing required search parameters: origin, destination, departureDate');
      }

      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(departureDate)) {
        throw new Error('Invalid departure date format. Use YYYY-MM-DD');
      }

      if (returnDate && !dateRegex.test(returnDate)) {
        throw new Error('Invalid return date format. Use YYYY-MM-DD');
      }

      // Get valid access token
      const token = await this.getAccessToken();

      console.log(`🔍 Searching flights: ${origin} → ${destination} on ${departureDate}`);

      // Build search parameters
      const params = {
        originLocationCode: origin.toUpperCase(),
        destinationLocationCode: destination.toUpperCase(),
        departureDate: departureDate,
        adults: Math.max(1, Math.min(9, parseInt(adults))), // Limit adults 1-9
        max: 10, // Get maximum 10 results
        currencyCode: 'USD'
      };

      // Add return date for round trip
      if (returnDate) {
        params.returnDate = returnDate;
      }

      // Make API call to search flights
      const response = await axios.get(`${this.baseUrl}/v2/shopping/flight-offers`, {
        params: params,
        ...this.axiosConfig,
        headers: {
          ...this.axiosConfig.headers,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const flights = response.data.data || [];
      console.log(`✅ Found ${flights.length} flight options`);

      if (flights.length === 0) {
        return [];
      }

      // Sort flights by price (lowest first) and enhance data
      const sortedFlights = flights
        .filter(flight => flight.price && flight.price.total) // Filter out flights without price
        .map(flight => this.enhanceFlightData(flight))
        .sort((a, b) => {
          const priceA = parseFloat(a.price?.total || 999999);
          const priceB = parseFloat(b.price?.total || 999999);
          return priceA - priceB;
        });

      return sortedFlights;

    } catch (error) {
      console.error('❌ Error searching flights:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        // Token expired, clear it
        this.accessToken = null;
        this.tokenExpiry = null;
        throw new Error('Authentication failed. Please check your Amadeus credentials.');
      } else if (error.response?.status === 400) {
        const errorMsg = error.response.data?.errors?.[0]?.detail || 'Invalid flight search parameters';
        throw new Error(`Invalid search parameters: ${errorMsg}`);
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Flight search timeout - please try again');
      } else if (error.response?.status >= 500) {
        throw new Error('Amadeus API is temporarily unavailable');
      } else {
        throw new Error('Flight search service is temporarily unavailable');
      }
    }
  }

  // Enhance flight data with formatted information
  enhanceFlightData(flight) {
    try {
      const enhanced = { ...flight };
      
      // Add formatted duration
      if (flight.itineraries?.[0]?.duration) {
        enhanced.formattedDuration = this.formatDuration(flight.itineraries[0].duration);
      }
      
      // Add airline name
      if (flight.validatingAirlineCodes?.[0]) {
        enhanced.airlineName = this.getAirlineName(flight.validatingAirlineCodes[0]);
      }
      
      // Add route information
      const segments = flight.itineraries?.[0]?.segments || [];
      if (segments.length > 0) {
        enhanced.route = {
          departure: {
            airport: segments[0].departure?.iataCode,
            city: segments[0].departure?.cityCode,
            time: segments[0].departure?.at
          },
          arrival: {
            airport: segments[segments.length - 1].arrival?.iataCode,
            city: segments[segments.length - 1].arrival?.cityCode,
            time: segments[segments.length - 1].arrival?.at
          },
          stops: segments.length - 1
        };
      }
      
      return enhanced;
    } catch (error) {
      console.error('Error enhancing flight data:', error.message);
      return flight; // Return original flight data if enhancement fails
    }
  }

  // Get airport/city suggestions (optional - for autocomplete)
  async getLocationSuggestions(keyword) {
    try {
      if (!keyword || keyword.length < 2) {
        return [];
      }

      const token = await this.getAccessToken();

      const response = await axios.get(`${this.baseUrl}/v1/reference-data/locations`, {
        params: {
          keyword: keyword.trim(),
          subType: 'AIRPORT,CITY',
          'page[limit]': 5
        },
        ...this.axiosConfig,
        headers: {
          ...this.axiosConfig.headers,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return (response.data.data || []).map(location => ({
        iataCode: location.iataCode,
        name: location.name,
        city: location.address?.cityName,
        country: location.address?.countryName
      }));

    } catch (error) {
      console.error('Error getting location suggestions:', error.response?.data || error.message);
      return [];
    }
  }

  // Format flight duration (convert from ISO 8601 to readable format)
  formatDuration(duration) {
    if (!duration) return 'N/A';
    
    try {
      // Duration comes as PT2H30M (2 hours 30 minutes)
      const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
      if (!match) return duration;
      
      const hours = match[1] ? parseInt(match[1]) : 0;
      const minutes = match[2] ? parseInt(match[2]) : 0;
      
      if (hours > 0 && minutes > 0) {
        return `${hours}h ${minutes}m`;
      } else if (hours > 0) {
        return `${hours}h`;
      } else if (minutes > 0) {
        return `${minutes}m`;
      }
      
      return duration;
    } catch (error) {
      return duration;
    }
  }

  // Get airline name from code (expanded mapping)
  getAirlineName(code) {
    const airlines = {
      'AA': 'American Airlines',
      'DL': 'Delta Air Lines', 
      'UA': 'United Airlines',
      'BA': 'British Airways',
      'LH': 'Lufthansa',
      'AF': 'Air France',
      'KL': 'KLM',
      'EK': 'Emirates',
      'QR': 'Qatar Airways',
      'SG': 'SpiceJet',
      'AI': 'Air India',
      '6E': 'IndiGo',
      'UK': 'Vistara',
      'G8': 'Go Air',
      'I5': 'AirAsia India',
      'SJ': 'SpiceJet'
    };
    
    return airlines[code] || code;
  }
}

// Export singleton instance
module.exports = new AmadeusService();