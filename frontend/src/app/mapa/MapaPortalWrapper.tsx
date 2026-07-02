'use client';

import dynamic from 'next/dynamic';

const MapaPortal = dynamic(() => import('./MapaPortal'), { ssr: false });

export default function MapaPortalWrapper() {
  return <MapaPortal />;
}
