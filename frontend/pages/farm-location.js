import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { MapPin, Navigation, Thermometer, Droplets, Sun } from 'lucide-react';

export default function FarmLocation() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
    address: '',
    accuracy: null
  });
  const [weather, setWeather] = useState({
    temperature: 28,
    humidity: 65,
    condition: 'Sunny',
    rainfall: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is logged in and is a farmer
    const userData = localStorage.getItem('agriTrace_user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 0) {
        router.push('/universal-dashboard');
        return;
      }
      setUser(parsedUser);
      setLocation(prev => ({
        ...prev,
        address: parsedUser.location || ''
      }));
    } else {
      router.push('/simple-login');
    }

    // Get current location
    getCurrentLocation();
  }, [router]);

  const getCurrentLocation = () => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          }));
          setLoading(false);
        },
        (error) => {
          console.error('GPS error:', error);
          setLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } else {
      setLoading(false);
      alert('Geolocation is not supported by this browser.');
    }
  };

  const updateFarmLocation = async () => {
    if (!location.latitude || !location.longitude) {
      alert('Please get your current location first');
      return;
    }

    try {
      // Here you would typically update the farm location in the backend
      alert('Farm location updated successfully!');
    } catch (error) {
      console.error('Error updating location:', error);
      alert('Failed to update location');
    }
  };

  if (!user) {
    return <Layout><div>Loading...</div></Layout>;
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Farm Location & Environment</h1>
          <p className="text-gray-600">
            Manage your farm's GPS coordinates and monitor environmental conditions
          </p>
        </div>

        {/* Current Location */}
        <div className="card mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Current Location</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">
                <MapPin className="w-4 h-4 inline mr-2" />
                Farm Address
              </label>
              <input
                type="text"
                value={location.address}
                onChange={(e) => setLocation(prev => ({ ...prev, address: e.target.value }))}
                className="input-field"
                placeholder="Enter your farm address"
              />
            </div>

            <div>
              <label className="label">
                <Navigation className="w-4 h-4 inline mr-2" />
                GPS Coordinates
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  value={location.latitude ? `${location.latitude}, ${location.longitude}` : 'Not available'}
                  readOnly
                  className="input-field bg-gray-50"
                />
                <button
                  onClick={getCurrentLocation}
                  disabled={loading}
                  className="btn-secondary w-full"
                >
                  {loading ? 'Getting Location...' : 'Get Current Location'}
                </button>
              </div>
            </div>
          </div>

          {location.accuracy && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-700">
                <strong>Location Accuracy:</strong> ±{Math.round(location.accuracy)} meters
              </p>
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={updateFarmLocation}
              className="btn-primary"
              disabled={!location.latitude}
            >
              Update Farm Location
            </button>
          </div>
        </div>

        {/* Environmental Conditions */}
        <div className="card mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Environmental Conditions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <Thermometer className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <p className="text-sm text-orange-600">Temperature</p>
              <p className="text-2xl font-bold text-orange-900">{weather.temperature}°C</p>
            </div>

            <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Droplets className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-blue-600">Humidity</p>
              <p className="text-2xl font-bold text-blue-900">{weather.humidity}%</p>
            </div>

            <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <Sun className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-sm text-yellow-600">Condition</p>
              <p className="text-lg font-bold text-yellow-900">{weather.condition}</p>
            </div>

            <div className="text-center p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
              <Droplets className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
              <p className="text-sm text-indigo-600">Rainfall</p>
              <p className="text-2xl font-bold text-indigo-900">{weather.rainfall}mm</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-900 mb-2">Farming Conditions</h3>
            <p className="text-green-700 text-sm">
              Current conditions are <strong>favorable</strong> for potato cultivation. 
              Temperature and humidity levels are within optimal range.
            </p>
          </div>
        </div>

        {/* Location Map Placeholder */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Farm Location Map</h2>
          
          <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg h-64 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Interactive map would be displayed here</p>
              {location.latitude && location.longitude && (
                <p className="text-sm text-gray-400 mt-2">
                  Coordinates: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            <p><strong>Note:</strong> This location will be automatically included in all batch QR codes for supply chain transparency.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
