# 🗺️ Mapbox Setup Guide

## Getting Your Mapbox Token

1. **Sign up for Mapbox** (if you don't have an account):
   - Go to [https://account.mapbox.com/](https://account.mapbox.com/)
   - Create a free account

2. **Get your access token**:
   - Go to [https://account.mapbox.com/access-tokens/](https://account.mapbox.com/access-tokens/)
   - Copy your default public token

3. **Add the token to your environment**:
   - Open `.env.local` file in your project root
   - Replace `your_mapbox_token_here` with your actual token:
   ```
   NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_actual_token_here
   ```

4. **Restart your development server**:
   ```bash
   npm run dev
   ```

## Features Included

✅ **Interactive Map** - Shows bus routes between Afghan cities  
✅ **City Pins** - Marked departure and destination cities  
✅ **Route Lines** - Visual connection between cities  
✅ **Theme Support** - Automatically switches between dark/light mode  
✅ **Glassmorphism Design** - Beautiful glass-style container  
✅ **Framer Motion** - Smooth animations when map appears  
✅ **Trip Information** - Floating info card with trip details  

## Afghan Cities Supported

- Kabul (کابل)
- Herat (هرات)
- Kandahar (کندهار)
- Mazar-i-Sharif (مزار شریف)
- Jalalabad (جلال آباد)
- Kunduz (کندز)
- Ghazni (غزنی)
- Balkh (بلخ)
- Baghlan (بغلان)
- Gardez (گردیز)

## Usage

1. Go to the `/browse` page
2. Click "🗺️ View Map" on any trip card
3. The map will slide in showing the route
4. Click "✕ Close Map" to hide the map

Enjoy your new map feature! 🎉
