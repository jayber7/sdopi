## 1. Base de datos Neon

- [ ] 1.1 Crear proyecto Neon y obtener `DATABASE_URL`
- [ ] 1.2 Configurar `DATABASE_URL` en `backend/.env` local apuntando a Neon
- [ ] 1.3 Ejecutar `npx prisma migrate deploy` contra Neon desde el directorio `backend/`
- [ ] 1.4 Verificar que las tablas y datos seed existen en Neon

## 2. Backend en Vercel

- [ ] 2.1 Configurar variables de entorno en Vercel dashboard para `sdopi-backend`: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `CLOUDINARY_*`, `SKIP_EVIDENCE_CHECK`
- [ ] 2.2 Verificar que `backend/vercel.json` tiene el build command correcto (`npm run build && npx prisma generate`)
- [ ] 2.3 Verificar que `backend/src/main.ts` exporta `handler` para serverless y que el bootstrap lazy funciona
- [ ] 2.4 Hacer deploy a Vercel (push a main o `vercel --prod`)
- [ ] 2.5 Verificar que los endpoints API responden desde `https://sdopi-backend.vercel.app/api/*`

## 3. Frontend en Vercel

- [ ] 3.1 Crear nuevo proyecto Vercel apuntando al directorio `frontend/`
- [ ] 3.2 Configurar variable de entorno `NEXT_PUBLIC_API_URL=/api` en Vercel
- [ ] 3.3 Verificar que `next.config.ts` tiene rewrites apuntando a la URL del backend en producción
- [ ] 3.4 Hacer deploy del frontend (push a main o `vercel --prod`)
- [ ] 3.5 Verificar que el frontend carga y las llamadas API funcionan

## 4. CORS y conectividad

- [ ] 4.1 Actualizar `CORS_ORIGIN` en Vercel backend con la URL del frontend desplegado
- [ ] 4.2 Verificar que el frontend puede autenticarse y consultar datos desde producción
- [ ] 4.3 Verificar que los endpoints de reportes (PDF, JSON) funcionan correctamente

## 5. Documentación

- [ ] 5.1 Actualizar `openspec/config.yaml` para reflejar Neon en lugar de SQLite
- [ ] 5.2 Documentar en README el proceso de deploy: Neon setup, Vercel projects, env vars, migraciones
- [ ] 5.3 Documentar actualización de CORS cuando cambia la URL del frontend (deploy previews)
