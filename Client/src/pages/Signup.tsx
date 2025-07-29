import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { API } from '../ApiUri';

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    longitude: '',
    latitude: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      toast.loading('Getting your location...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            longitude: position.coords.longitude.toString(),
            latitude: position.coords.latitude.toString(),
          });
          toast.dismiss();
          toast.success('Location obtained successfully!');
        },
        (error) => {
          toast.dismiss();
          toast.error('Could not get your location. Please enter manually.');
          console.error('Geolocation error:', error);
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate coordinates
    const longitude = parseFloat(formData.longitude);
    const latitude = parseFloat(formData.latitude);
    
    if (isNaN(longitude) || isNaN(latitude)) {
      toast.error('Please enter valid longitude and latitude coordinates');
      setIsLoading(false);
      return;
    }

    if (longitude < -180 || longitude > 180) {
      toast.error('Longitude must be between -180 and 180');
      setIsLoading(false);
      return;
    }

    if (latitude < -90 || latitude > 90) {
      toast.error('Latitude must be between -90 and 90');
      setIsLoading(false);
      return;
    }

    const payload = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude],
      },
    };
    
    try {
      const response = await axios.post(`${API}/signupUser`, payload);
      
      if (response.status === 201) {
        toast.success('Signup successful! Please login to continue.');
        navigate('/login');
      } else {
        toast.error('Signup failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      
      if (error.response) {
        // Server responded with error status
        const errorMessage = error.response.data?.message || 'Signup failed. Please try again.';
        toast.error(errorMessage);
      } else if (error.request) {
        // Network error
        toast.error('Network error. Please check your connection and try again.');
      } else {
        // Other error
        toast.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-[#f5f4ea] px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-md">
        <h2 className="text-3xl font-bold text-center mb-6 font-serif">Sign Up</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            name="name" 
            type="text" 
            placeholder="Your Name" 
            value={formData.name} 
            onChange={handleChange} 
            className="w-full border rounded-md px-3 py-2" 
            required 
            disabled={isLoading}
          />
          <input 
            name="email" 
            type="email" 
            placeholder="you@example.com" 
            value={formData.email} 
            onChange={handleChange} 
            className="w-full border rounded-md px-3 py-2" 
            required 
            disabled={isLoading}
          />
          <input 
            name="password" 
            type="password" 
            placeholder="••••••••" 
            value={formData.password} 
            onChange={handleChange} 
            className="w-full border rounded-md px-3 py-2" 
            required 
            disabled={isLoading}
            minLength={6}
          />
          <input 
            name="phone" 
            type="text" 
            placeholder="Aadhar number" 
            value={formData.phone} 
            onChange={handleChange} 
            className="w-full border rounded-md px-3 py-2" 
            required 
            disabled={isLoading}
          />
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Location</label>
              <button
                type="button"
                onClick={getCurrentLocation}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
                disabled={isLoading}
              >
                Get My Location
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input 
                name="longitude" 
                type="number" 
                step="any" 
                placeholder="Longitude" 
                value={formData.longitude} 
                onChange={handleChange} 
                className="w-full border rounded-md px-3 py-2" 
                required 
                disabled={isLoading}
              />
              <input 
                name="latitude" 
                type="number" 
                step="any" 
                placeholder="Latitude" 
                value={formData.latitude} 
                onChange={handleChange} 
                className="w-full border rounded-md px-3 py-2" 
                required 
                disabled={isLoading}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className={`w-full py-2 rounded-md transition ${
              isLoading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
            disabled={isLoading}
          >
            {isLoading ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          Already have an account?{' '}
          <a href="/login" className="text-gray-900 font-semibold hover:underline">Log in</a>
        </p>
      </div>
    </div>
  );
};

export default Signup;
