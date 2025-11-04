'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface GlassButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  className?: string;
  variant?: 'primary' | 'secondary' | 'danger';
}

export default function GlassButton({ 
  children, 
  onClick, 
  type = 'button', 
  disabled = false, 
  className = '',
  variant = 'primary'
}: GlassButtonProps) {
  // map variant to semantic class names; visual styles are in globals.css and use CSS variables
  const variantClass = variant === 'secondary' ? 'secondary' : variant === 'danger' ? 'danger' : 'primary';

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn ${variantClass} rounded-xl px-6 py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      whileHover={!disabled ? { scale: 1.04, y: -1 } : {}}
      whileTap={!disabled ? { scale: 0.96 } : {}}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.28 }}
    >
      {children}
    </motion.button>
  );
}
