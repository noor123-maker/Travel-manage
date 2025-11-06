'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { getCompanyTrips, createTrip, updateTrip, deleteTrip } from '@/lib/trips';
import { Trip, TripFormData } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';
import TripForm from '@/components/TripForm';

export default function DashboardPage() {
  const { t, loading: translationsLoading } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [message, setMessage] = useState('');
  const pathname = usePathname();

  useEffect(() => {
    const getUser = async () => {
      if (!supabase) {
        // Supabase not configured — attempt to read our fallback token cookie via /api/auth/me
        try {
          const r = await fetch('/api/auth/me', { credentials: 'include' });
          const txt = await r.text();
          let data: any = null;
          try { data = txt ? JSON.parse(txt) : null; } catch {}
          const fetchedUser = data?.user ?? null;
          setUser(fetchedUser);
        } catch (e) {
          console.warn('Failed to fetch fallback user:', e);
          setUser(null);
        }
        setLoading(false);
        return;
      }

      const result = await supabase.auth.getUser();
      // result shape: { data: { user } }
      const user = result?.data?.user ?? null;
      setUser(user);
      setLoading(false);
    };

    getUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadTrips();
    }
  }, [user]);

  // If we've finished loading translations and auth but found no user,
  // redirect to the login page so we don't show an access-denied card.
  useEffect(() => {
    if (!loading && !translationsLoading && user === null) {
      const nextPath = pathname || '/dashboard';
      const safeNext = nextPath.startsWith('/') ? nextPath : '/dashboard';
      window.location.href = `/login?mode=signin&next=${encodeURIComponent(safeNext)}`;
    }
  }, [loading, translationsLoading, user, pathname]);

  const loadTrips = async () => {
    try {
      const tripsData = await getCompanyTrips();
      setTrips(tripsData);
    } catch (error: any) {
      setMessage(`Error loading trips: ${error.message}`);
    }
  };

  const handleSignOut = async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut();
      } else {
        // If Supabase isn't configured, attempt to hit the local sign-out API (if present)
        try {
          await fetch('/api/auth/signout', { method: 'POST', credentials: 'include' });
        } catch (e) {
          // ignore
        }
      }
    } finally {
      // Always redirect back to home
      window.location.href = '/';
    }
  };

  const handleCreateTrip = async (tripData: TripFormData) => {
    setFormLoading(true);
    try {
      // Client-side enforcement: if user has allowed_trips defined, check before attempting
      const userAllowed = (() => {
        if (!user) return null;
        const top = (user as any).allowed_trips;
        const meta = (user as any).user_metadata?.allowed_trips;
        // prefer numeric values; metadata might be string
        if (typeof top === 'number') return top;
        if (typeof meta === 'number') return meta;
        if (typeof meta === 'string' && meta !== '') {
          const n = Number(meta);
          return Number.isFinite(n) ? n : null;
        }
        return null;
      })();

      if (userAllowed !== null && typeof userAllowed === 'number') {
        if (trips.length >= userAllowed) {
          setMessage(t('tripLimitReached') || `You have reached your trip limit.`);
          setFormLoading(false);
          return;
        }
      }

      await createTrip(tripData);
      await loadTrips();
      setShowForm(false);
      setMessage('Trip created successfully!');
    } catch (error: any) {
      setMessage(`Error creating trip: ${error.message}`);
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateTrip = async (tripData: TripFormData) => {
    if (!editingTrip) return;
    
    setFormLoading(true);
    try {
      await updateTrip(editingTrip.id, tripData);
      await loadTrips();
      setEditingTrip(null);
      setShowForm(false);
      setMessage('Trip updated successfully!');
    } catch (error: any) {
      setMessage(`Error updating trip: ${error.message}`);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    if (!confirm(t('areYouSureDelete') || 'Are you sure you want to delete this trip?')) return;

    // Pre-check ownership in demo mode to show friendly error immediately
    try {
      if (!supabase) {
        const stored = typeof window !== 'undefined' ? sessionStorage.getItem('currentCompany') : null;
        const company = stored ? JSON.parse(stored as string) : null;
        if (!company) {
          setMessage(t('notAuthorizedDelete') || 'Not authorized to delete this trip');
          return;
        }
        const allTrips = (await import('@/lib/companyStorage')).getAllTrips();
        const trip = allTrips.find((t: any) => t.id === tripId);
        if (!trip) {
          setMessage(t('errorDeletingTrip', { error: 'Trip not found' }) || 'Trip not found');
          return;
        }
        if (trip.company_id !== company.id) {
          setMessage(t('notAuthorizedDelete') || 'Not authorized to delete this trip');
          return;
        }
      }

      await deleteTrip(tripId);
      await loadTrips();
      setMessage(t('tripDeletedSuccessfully') || 'Trip deleted successfully!');
    } catch (error: any) {
      setMessage(error?.message ? t('errorDeletingTrip', { error: error.message }) || `Error deleting trip: ${error.message}` : (t('errorDeletingTrip', { error: 'Unknown' }) || 'Error deleting trip'));
    }
  };

  const handleEditTrip = (trip: Trip) => {
    try {
      let isOwner = false;
      if (supabase) {
        isOwner = (user as any)?.id === trip.company_id;
      } else {
        const stored = typeof window !== 'undefined' ? sessionStorage.getItem('currentCompany') : null;
        const company = stored ? JSON.parse(stored as string) : null;
        isOwner = !!(company && company.id === trip.company_id);
      }
      if (!isOwner) {
        setMessage(t('notAuthorizedEdit') || 'Not authorized to edit this trip');
        return;
      }
    } catch (e) {
      setMessage(t('notAuthorizedEdit') || 'Not authorized to edit this trip');
      return;
    }

    setEditingTrip(trip);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingTrip(null);
  };

  const formatDateTime = (dateTime: string) => {
    if (!dateTime) return '';
    const d = new Date(dateTime);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => n.toString().padStart(2, '0');
    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = d.getFullYear();

    // 12-hour time with seconds and AM/PM
    let hours = d.getHours();
    const minutes = pad(d.getMinutes());
    const seconds = pad(d.getSeconds());
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    const hourStr = pad(hours);

    return `${day}/${month}/${year}, ${hourStr}:${minutes}:${seconds} ${ampm}`;
  };

  if (loading || translationsLoading) {
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

  if (!user) {
    // we've triggered a redirect in useEffect above; render nothing while redirecting
    return null;
  }

  return (
    <div className="min-h-screen gradient-bg relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl animate-float"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-blue-400/20 rounded-full blur-lg animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-purple-400/20 rounded-full blur-2xl animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          className="px-4 py-6 sm:px-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-white">{t('tripManagement')}</h2>
            <GlassButton
              onClick={() => setShowForm(true)}
              className="text-lg px-6 py-3"
            >
              {t('addNewTrip')}
            </GlassButton>
          </div>

          {/* Trips usage notice */}
          <div className="mb-4 text-sm text-white/70">
            {(() => {
              const top = (user as any).allowed_trips;
              const meta = (user as any).user_metadata?.allowed_trips;
              let allowed: number | null = null;
              if (typeof top === 'number') allowed = top;
              else if (typeof meta === 'number') allowed = meta;
              else if (typeof meta === 'string' && meta !== '') {
                const n = Number(meta);
                allowed = Number.isFinite(n) ? n : null;
              }

              return allowed !== null && typeof allowed === 'number'
                ? t('tripsUsedOfAllowed', { used: trips.length, allowed })
                : t('tripsUsedUnlimited', { used: trips.length });
            })()}
          </div>

          {message && (
            <motion.div
              className={`mb-4 p-4 rounded-lg ${
                message.includes('Error') 
                  ? 'bg-red-500/20 text-red-200 border border-red-500/30' 
                  : 'bg-green-500/20 text-green-200 border border-green-500/30'
              }`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {message}
            </motion.div>
          )}

          {showForm && (
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <GlassCard className="p-6">
                <h3 className="text-xl font-semibold text-white mb-4">
                  {editingTrip ? t('editTrip') : t('addNewTrip')}
                </h3>
                <TripForm
                  initialData={editingTrip || undefined}
                  onSubmit={editingTrip ? handleUpdateTrip : handleCreateTrip}
                  onCancel={handleCancelForm}
                  isLoading={formLoading}
                />
              </GlassCard>
            </motion.div>
          )}

          <GlassCard className="overflow-hidden">
            {trips.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-white/70 text-lg">{t('noTripsFound')}</p>
                <p className="text-white/50">{t('createFirstTrip')}</p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {trips.map((trip, index) => (
                  <motion.div
                    key={trip.id}
                    className="px-6 py-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-medium text-white">
                            {trip.from_city} → {trip.to_city}
                          </h3>
                          <div className="flex space-x-2">
                            <GlassButton
                              onClick={() => handleEditTrip(trip)}
                              variant="secondary"
                              className="text-sm px-3 py-1"
                            >
                              {t('editTrip')}
                            </GlassButton>
                            <GlassButton
                              onClick={() => handleDeleteTrip(trip.id)}
                              variant="danger"
                              className="text-sm px-3 py-1"
                            >
                              {t('deleteTrip')}
                            </GlassButton>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-white/70">
                          <div>
                            <span className="font-medium text-white">{t('busTypeLabel')}:</span> {trip.bus_type}
                          </div>
                          <div>
                            <span className="font-medium text-white">{t('departure')}:</span> {formatDateTime(trip.departure_time)}
                          </div>
                          <div>
                            {/* arrival time removed */}
                          </div>
                          {/* seats removed */}
                        </div>
                        {trip.price && (
                          <div className="mt-2">
                            <span className="text-lg font-semibold text-green-400">
                              ${trip.price}
                            </span>
                            <span className="text-white/70 ml-1">{t('perPerson')}</span>
                          </div>
                        )}
                        {trip.contact_number && (
                          <div className="mt-2 text-sm text-white/70">
                            <span className="font-medium text-white">{t('contact')}:</span> {trip.contact_number}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
