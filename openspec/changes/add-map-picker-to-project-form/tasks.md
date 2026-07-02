## 1. Componente MapPicker

- [ ] 1.1 Crear `frontend/src/lib/coords-services.ts` con funciones Nominatim (geocoding + reverse geocoding)
- [ ] 1.2 Crear `frontend/src/app/proyectos/MapPicker.tsx` con Leaflet map, click handler, marcador arrastrable, inputs sincronizados, campo de búsqueda
- [ ] 1.3 Verificar SSR-safe con dynamic import

## 2. Integración en Creación

- [ ] 2.1 Agregar `MapPicker` a `frontend/src/app/proyectos/page.tsx` en el modal de creación, dentro del bloque de modo coordenadas
- [ ] 2.2 Conectar `onChange` del MapPicker al form state (`latitud`, `longitud`, `direccion`)
- [ ] 2.3 Verificar que toggle Calles/Coordenadas muestra/oculta el mapa correctamente

## 3. Integración en Edición

- [ ] 3.1 Agregar `MapPicker` a `frontend/src/app/proyectos/[id]/page.tsx` en el modal de edición
- [ ] 3.2 Precargar coordenadas del proyecto en el mapa cuando se abre el modal en modo coordenadas
- [ ] 3.3 Verificar que toggle detecta modo correcto según `latitud !== null`

## 4. Verificación

- [ ] 4.1 Build de frontend sin errores (`npx next build`)
- [ ] 4.2 Probar flujo completo: crear proyecto con coordenadas desde mapa, editar coordenadas, cambiar a calles y viceversa
