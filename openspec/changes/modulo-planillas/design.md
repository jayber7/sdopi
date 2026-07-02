# Design: modulo-planillas

## Backend API

```
GET    /planillas?proyectoId=N     — Lista planillas con resumen de avance
GET    /planillas/:id              — Planilla completa con items×rubros×avances
POST   /planillas                  — Crear planilla + init avances en 0
PATCH  /planillas/:id              — Actualizar periodo/fechas
PATCH  /planillas/:id/items        — Actualizar cantidades batch [{itemId, cantidad}]
DELETE /planillas/:id              — Eliminar planilla (cascade avances)
```

## Frontend Routes

```
/proyectos/[id]          — Detalle proyecto con selector de planilla + grid
```

## Componentes

- ProyectoDetailPage — layout con cabecera y selector de planilla
- PlanillaGrid — grid items agrupados por rubro con subtotales
- PlanillaFormModal — crear/editar planilla y cantidades
- PlanillaDeleteConfirm — confirmacion de eliminacion

## Data Flow

1. GET /proyectos/:id → cabecera + lista planillas
2. Click planilla → GET /planillas/:id → grid con items×avances
3. Crear → POST /planillas {proyectoId, periodo, fechaInicio, fechaFin} → init avances
4. Editar → PATCH /planillas/:id/items [{itemId, cantidad}] → recalcular montos
5. Eliminar → DELETE /planillas/:id
