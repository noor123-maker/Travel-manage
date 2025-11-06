'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { getTripsGroupedByCompany } from '@/lib/trips';
import { useTranslation } from '@/hooks/useTranslation';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';
import { formatJalaaliFromISO } from '@/lib/jalaali';

export default function BrowsePage() {
  const { t, loading: translationsLoading } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [companies, setCompanies] = useState<any[]>([]);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const companiesData = await getTripsGroupedByCompany();
      setCompanies(companiesData);
    } catch (error: any) {
      setError(`Error loading companies: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateTime: string) => {
    if (!dateTime) return '';
    const d = new Date(dateTime);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => n.toString().padStart(2, '0');
    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = pad(d.getMinutes());
    const seconds = pad(d.getSeconds());
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    const hourStr = pad(hours);
    return `${day}/${month}/${year}, ${hourStr}:${minutes}:${seconds} ${ampm}`;
  };
  const formatDateOnly = (dateTime: string) => {
    if (!dateTime) return '';
    const d = new Date(dateTime);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  };
  const formatTimeOnly = (dateTime: string) => {
    if (!dateTime) return '';
    const d = new Date(dateTime);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => n.toString().padStart(2, '0');
    let hours = d.getHours();
    const minutes = pad(d.getMinutes());
    const seconds = pad(d.getSeconds());
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    const hourStr = pad(hours);
    return `${hourStr}:${minutes}:${seconds} ${ampm}`;
  };

  const handleCompanySelect = (companyName: string) => {
    setSelectedCompany(companyName);
  };

  const handleBackToCompanies = () => {
    setSelectedCompany(null);
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
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              {selectedCompany ? `${selectedCompany} - ${t('trips')}` : t('busCompanies')}
            </h1>
            <p className="text-white/80 text-lg">
              {selectedCompany ? t('selectTripFromCompany') : t('selectCompanyToViewTrips')}
            </p>
            {selectedCompany && (
              <button
                onClick={handleBackToCompanies}
                className="mt-4 text-blue-400 hover:text-blue-300 flex items-center space-x-2"
              >
                <span>←</span>
                <span>{t('backToCompanies')}</span>
              </button>
            )}
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

          {!selectedCompany ? (
            // Companies View
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {companies.map((company, index) => (
                <motion.div
                  key={company.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <GlassCard className="p-6 cursor-pointer hover:bg-white/15 transition-all duration-300" onClick={() => handleCompanySelect(company.name)}>
                    <div className="text-center">
                      <div className="text-4xl mb-4">🚌</div>
                      <h3 className="text-xl font-semibold text-white mb-2">{company.name}</h3>
                      <p className="text-white/70 mb-4">{company.trips.length} {t('availableTrips')}</p>
                      
                      {company.contact_number && (
                        <div className="bg-white/10 backdrop-blur-md p-3 rounded-lg border border-white/20">
                          <p className="text-sm text-white/80 mb-1">{t('contactNumber')}</p>
                          <p className="text-white font-semibold">{company.contact_number}</p>
                        </div>
                      )}
                      
                      <div className="mt-4">
                        <GlassButton className="w-full">
                          {t('viewTrips')}
                        </GlassButton>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          ) : (
            // Trips View for Selected Company
            <div className="grid gap-6">
              {companies.find(c => c.name === selectedCompany)?.trips.map((trip: any, index: number) => (
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 items-stretch">
                      <div>
                        <p className="text-sm font-medium text-white/80">{t('departure')}</p>
                        <div className="mt-2 p-3 rounded-lg bg-white/5 border border-white/10">
                          <p className="text-white font-semibold">{formatDateOnly(trip.departure_time)}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-white/80">{t('solar')}</p>
                        <div className="mt-2 p-3 rounded-lg bg-white/5 border border-white/10">
                          <p className="text-white font-semibold">{formatJalaaliFromISO(trip.departure_time)}</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-center justify-center">
                        <p className="text-sm font-medium text-white/80">{t('time')}</p>
                        <div className="mt-2 px-5 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-500 text-white font-extrabold text-2xl shadow-lg">
                          {formatTimeOnly(trip.departure_time)}
                        </div>
                      </div>
                    </div>

                    {trip.contact_number && (
                      <motion.div 
                        className="mb-4 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium text-white/80 mb-1">{t('contactNumber')}</p>
                            <p className="text-white font-semibold text-lg">{trip.contact_number}</p>
                            <p className="text-xs text-white/60 mt-1">📱 {t('tapToCall')}</p>
                          </div>
                          <a 
                            href={`tel:${trip.contact_number}`}
                            className="bg-green-500/20 hover:bg-green-500/30 text-green-300 px-4 py-2 rounded-lg border border-green-500/30 transition-all duration-200 hover:scale-105 flex items-center space-x-2 shadow-lg hover:shadow-green-500/20"
                            title={`${t('callNow')} ${trip.contact_number}`}
                          >
                            <span className="text-lg">📞</span>
                            <span className="font-medium">{t('callNow')}</span>
                          </a>
                        </div>
                      </motion.div>
                    )}
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          )}

          {companies.length === 0 && !error && (
            <motion.div
              className="text-center py-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-white/70 text-lg">{t('noCompaniesAvailable')}</p>
              <p className="text-white/50">{t('checkBackLater')}</p>
            </motion.div>
          )}

          {selectedCompany && companies.find(c => c.name === selectedCompany)?.trips.length === 0 && (
            <motion.div
              className="text-center py-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-white/70 text-lg">{t('noTripsForCompany')}</p>
              <p className="text-white/50">{t('checkBackLater')}</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

