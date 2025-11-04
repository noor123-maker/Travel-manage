'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { getTripsByCompany, createTrip, updateTrip, deleteTrip } from '@/lib/companyStorage';
import { TripFormData } from '@/types';
import { StoredCompany, StoredTrip } from '@/lib/companyStorage';
import Navbar from '@/components/Navbar';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';
import TripForm from '@/components/TripForm';

export default function CompanyDashboard() {
  const { t, loading: translationsLoading } = useTranslation();
  const router = useRouter();
  const [trips, setTrips] = useState<StoredTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showTripForm, setShowTripForm] = useState(false);
  const [editingTrip, setEditingTrip] = useState<StoredTrip | null>(null);
  const [currentCompany, setCurrentCompany] = useState<StoredCompany | null>(null);

  useEffect(() => {
    // Get current company from sessionStorage
    const storedCompany = sessionStorage.getItem('currentCompany');
    if (storedCompany) {
      setCurrentCompany(JSON.parse(storedCompany));
    } else {
      // Redirect to dashboard (login page removed) if no company
      router.push('/dashboard');
      return;
    }
    
    loadTrips();
  }, [router]);

  const loadTrips = () => {
    try {
      if (currentCompany) {
        const tripsData = getTripsByCompany(currentCompany.id);
        setTrips(tripsData);
      }
    } catch (error: any) {
      setError(`Error loading trips: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTrip = async (tripData: TripFormData) => {
    try {
      if (!currentCompany) {
        throw new Error('No company logged in');
      }
      
      const newTrip = createTrip({
        company_id: currentCompany.id,
        from_city: tripData.from_city,
        to_city: tripData.to_city,
        bus_type: tripData.bus_type,
        departure_time: tripData.departure_time,
        contact_number: tripData.contact_number,
      });
      
      setTrips(prev => [...prev, newTrip]);
      setShowTripForm(false);
      setError('');
    } catch (error: any) {
      setError(`Error creating trip: ${error.message}`);
    }
  };

  const handleUpdateTrip = async (tripId: string, tripData: Partial<TripFormData>) => {
    try {
      updateTrip(tripId, tripData);
      setTrips(prev => prev.map(trip => 
        trip.id === tripId 
          ? { ...trip, ...tripData, updated_at: new Date().toISOString() }
          : trip
      ));
      setEditingTrip(null);
      setError('');
    } catch (error: any) {
      setError(`Error updating trip: ${error.message}`);
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    if (window.confirm(t('areYouSureDelete'))) {
      try {
        deleteTrip(tripId);
        setTrips(prev => prev.filter(trip => trip.id !== tripId));
        setError('');
      } catch (error: any) {
        setError(`Error deleting trip: ${error.message}`);
      }
    }
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString();
  };

  if (translationsLoading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white/80">Loading...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl animate-float"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-blue-400/20 rounded-full blur-lg animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-purple-400/20 rounded-full blur-2xl animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      <Navbar />

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          className="px-4 py-6 sm:px-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">{t('companyDashboard')}</h1>
            <p className="text-white/80 text-lg">
              {t('manageYourTrips')} - {currentCompany?.name || 'Your Company'}
            </p>
          </div>

          {error && (
            <motion.div
              className="mb-4 p-4 bg-red-500/20 text-red-200 border border-red-500/30 rounded-lg"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {error}
            </motion.div>
          )}

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">{t('yourTrips')}</h2>
            <GlassButton
              onClick={() => setShowTripForm(true)}
              className="px-6 py-3"
            >
              + {t('addNewTrip')}
            </GlassButton>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto"></div>
              <p className="mt-4 text-white/80">{t('loadingTrips')}</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {trips.map((trip, index) => (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <GlassCard className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-white">
                          {trip.from_city} → {trip.to_city}
                        </h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-white/70">🚌</span>
                          <p className="text-white/70 font-medium">{trip.bus_type}</p>
                        </div>
                      </div>
                      {/* seats display removed */}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-white/80">{t('departure')}</p>
                        <p className="text-white">{formatDateTime(trip.departure_time)}</p>
                      </div>
                      {/* arrival time removed */}
                    </div>

                    {trip.contact_number && (
                      <div className="mb-4 bg-white/10 backdrop-blur-md p-3 rounded-lg border border-white/20">
                        <p className="text-sm text-white/80 mb-1">{t('contactNumber')}</p>
                        <p className="text-white font-semibold">{trip.contact_number}</p>
                      </div>
                    )}

                    <div className="flex justify-end space-x-2">
                      <GlassButton
                        onClick={() => setEditingTrip(trip)}
                        variant="secondary"
                        className="px-4 py-2"
                      >
                        {t('editTrip')}
                      </GlassButton>
                      <GlassButton
                        onClick={() => handleDeleteTrip(trip.id)}
                        variant="danger"
                        className="px-4 py-2"
                      >
                        {t('deleteTrip')}
                      </GlassButton>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          )}

          {trips.length === 0 && !loading && (
            <motion.div
              className="text-center py-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-white/70 text-lg">{t('noTripsFound')}</p>
              <p className="text-white/50">{t('createFirstTrip')}</p>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Trip Form Modal */}
      {showTripForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            className="w-full max-w-2xl"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <GlassCard className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">{t('addNewTrip')}</h3>
                <button
                  onClick={() => setShowTripForm(false)}
                  className="text-white/70 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
              <TripForm
                onSubmit={handleCreateTrip}
                onCancel={() => setShowTripForm(false)}
              />
            </GlassCard>
          </motion.div>
        </div>
      )}

      {/* Edit Trip Modal */}
      {editingTrip && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            className="w-full max-w-2xl"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <GlassCard className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">{t('editTrip')}</h3>
                <button
                  onClick={() => setEditingTrip(null)}
                  className="text-white/70 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
                <TripForm
                initialData={{
                  from_city: editingTrip.from_city,
                  to_city: editingTrip.to_city,
                  bus_type: editingTrip.bus_type,
                  departure_time: editingTrip.departure_time,
                  contact_number: editingTrip.contact_number || ''
                }}
                onSubmit={(data) => handleUpdateTrip(editingTrip.id, data)}
                onCancel={() => setEditingTrip(null)}
              />
            </GlassCard>
          </motion.div>
        </div>
      )}
    </div>
  );
}
