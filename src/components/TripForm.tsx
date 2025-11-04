'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { TripFormData } from '@/types';
import { formatJalaaliFromISO } from '@/lib/jalaali';
import { useTranslation } from '@/hooks/useTranslation';
import GlassButton from './GlassButton';

interface TripFormProps {
  initialData?: Partial<TripFormData>;
  onSubmit: (data: TripFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function TripForm({ initialData, onSubmit, onCancel, isLoading }: TripFormProps) {
  const { t, loading: translationsLoading } = useTranslation();
  const [formData, setFormData] = useState<TripFormData>({
    from_city: initialData?.from_city || '',
    to_city: initialData?.to_city || '',
    bus_type: initialData?.bus_type || '',
    departure_time: initialData?.departure_time || '',
  contact_number: initialData?.contact_number || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.from_city.trim()) {
      newErrors.from_city = t('fromCityRequired');
    }
    if (!formData.to_city.trim()) {
      newErrors.to_city = t('toCityRequired');
    }
    if (!formData.bus_type.trim()) {
      newErrors.bus_type = t('busTypeRequired');
    }
    if (!formData.departure_time) {
      newErrors.departure_time = t('departureTimeRequired');
    }
    // arrival time removed from form
    

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setIsSubmitting(true);
      try {
      await onSubmit(formData);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (translationsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        <span className="ml-2 text-white/80">Loading...</span>
      </div>
    );
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="from_city" className="block text-sm font-medium text-white/80 mb-2">
            {t('from')} *
          </label>
          <select
            id="from_city"
            name="from_city"
            value={formData.from_city}
            onChange={handleChange}
            className={`w-full px-4 py-3 rounded-lg backdrop-blur-md bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.from_city ? 'border-red-400' : ''
            }`}
          >
            <option value="" className="bg-gray-800">{t('selectDepartureCity')}</option>
            <option value="Herat" className="bg-gray-800">Herat</option>
            <option value="Kandahar" className="bg-gray-800">Kandahar</option>
            <option value="Kabul" className="bg-gray-800">Kabul</option>
            <option value="Farah" className="bg-gray-800">Farah</option>
            <option value="Nimroz" className="bg-gray-800">Nimroz</option>
          </select>
          {errors.from_city && <p className="mt-1 text-sm text-red-300">{errors.from_city}</p>}
        </div>

        <div>
          <label htmlFor="to_city" className="block text-sm font-medium text-white/80 mb-2">
            {t('to')} *
          </label>
          <select
            id="to_city"
            name="to_city"
            value={formData.to_city}
            onChange={handleChange}
            className={`w-full px-4 py-3 rounded-lg backdrop-blur-md bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.to_city ? 'border-red-400' : ''
            }`}
          >
            <option value="" className="bg-gray-800">{t('selectDestinationCity')}</option>
            <option value="Herat" className="bg-gray-800">Herat</option>
            <option value="Kandahar" className="bg-gray-800">Kandahar</option>
            <option value="Kabul" className="bg-gray-800">Kabul</option>
            <option value="Farah" className="bg-gray-800">Farah</option>
            <option value="Nimroz" className="bg-gray-800">Nimroz</option>
          </select>
          {errors.to_city && <p className="mt-1 text-sm text-red-300">{errors.to_city}</p>}
        </div>

        <div>
          <label htmlFor="bus_type" className="block text-sm font-medium text-white/80 mb-2">
            {t('busType')} *
          </label>
          <select
            id="bus_type"
            name="bus_type"
            value={formData.bus_type}
            onChange={handleChange}
            className={`w-full px-4 py-3 rounded-lg backdrop-blur-md bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.bus_type ? 'border-red-400' : ''
            }`}
          >
            <option value="" className="bg-gray-800">{t('selectBusType')}</option>
            <option value="VIP" className="bg-gray-800">VIP</option>
            <option value="580 Bus" className="bg-gray-800">580 Bus</option>
          </select>
          {errors.bus_type && <p className="mt-1 text-sm text-red-300">{errors.bus_type}</p>}
        </div>

        <div>
          <label htmlFor="contact_number" className="block text-sm font-medium text-white/80 mb-2">
            {t('contactNumber')}
          </label>
          <input
            type="tel"
            id="contact_number"
            name="contact_number"
            value={formData.contact_number}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg backdrop-blur-md bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={t('enterContactNumber')}
          />
        </div>

        <div>
          <label htmlFor="departure_time" className="block text-sm font-medium text-white/80 mb-2">
            {t('departureTime')} *
          </label>
          <input
            type="datetime-local"
            id="departure_time"
            name="departure_time"
            value={formData.departure_time}
            onChange={handleChange}
            className={`w-full px-4 py-3 rounded-lg backdrop-blur-md bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.departure_time ? 'border-red-400' : ''
            }`}
          />
          {/* Solar (Jalaali) date display */}
          {formData.departure_time && (
            <p className="mt-2 text-sm text-white/70">{t('solar')}: {formatJalaaliFromISO(formData.departure_time)}</p>
          )}
          {errors.departure_time && <p className="mt-1 text-sm text-red-300">{errors.departure_time}</p>}
        </div>

        {/* arrival time removed */}


        {/* seats field removed per design */}
      </div>

      <div className="flex justify-end space-x-3">
        <GlassButton
          type="button"
          onClick={onCancel}
          variant="secondary"
          className="px-6 py-3"
        >
          {t('cancel')}
        </GlassButton>
        <GlassButton
          type="submit"
          disabled={isSubmitting || !!isLoading}
          className="px-6 py-3"
        >
          {isSubmitting ? t('saving') : t('saveTrip')}
        </GlassButton>
      </div>
    </motion.form>
  );
}
