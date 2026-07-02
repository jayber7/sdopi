## Context

El sistema actual crea CAOs copiando todos los Items del proyecto en AvanceItems. No existe el concepto de "Planilla Base" como referencia contractual fija. Los CAOs necesitan mostrar datos acumulativos (avance anterior, presente, acumulado) derivados de una Base común.

## Goals / Non-Goals

**Goals:**
- Una Planilla Base por proyecto con datos "Según Contrato" inmutables una vez aprobada
- CAOs heredan items de la Base (no del listado genérico de Items)
- Grid de CAO muestra: Según Contrato, Avance Anterior, Avance Presente, Avance Acumulado, % Periodo, % a la Fecha
- Items extra pueden agregarse en CAOs sin afectar la Base

**Non-Goals:**
- No se cambia el workflow de aprobación (borrador → enviado → aprobado)
- No se agregan roles nuevos
- No se modifica la gestión de Proyectos/Usuarios

## Decisions

1. **`tipo` como columna en `PlanillaCAO` (no entidad separada)**
   - Alternativa considerada: `PlanillaBase` como tabla separada. Se descarta porque comparte el mismo workflow y datos que un CAO. Un campo `tipo` con `BASE | CAO` es más simple y evita duplicación de lógica.

2. **Datos acumulativos computados en backend vía query agregada**
   - Alternativa: pre-calcular y almacenar en DB. Se descarta porque los datos históricos cambian cuando se aprueban nuevos CAOs. Es más simple y correcto calcular al vuelo con `GROUP BY` + `SUM`.

3. **Matching entre AvanceItems de Base y CAO por `itemId`**
   - Los items de la Base tienen `itemId` fijo. Los CAOs copian esos `itemId`. Para items extra en CAOs (sin `itemId`), se matchean por `rubroCodigo + descripcion` o quedan como items del CAO sin correspondencia en Base.

4. **Frontend recibe datos planos + históricos en una sola request**
   - El endpoint `GET /planillas/:id` incluye un campo `historial` con la suma de CAOs previos aprobados. El frontend solo renderiza.

## Risks / Trade-offs

- [Riesgo] Items extra en CAOs sin `itemId` no tendrán correspondencia en Base → se muestran como items "solo de este CAO" sin datos de contrato
- [Riesgo] La query acumulativa puede ser lenta con muchos CAOs → mitigado con índice en `(planillaId, itemId)` y SQLite maneja bien datasets pequeños (<100 CAOs)
- [Trade-off] Los datos de "Avance Anterior" son solo de CAOs aprobados → los CAOs en borrador/enviado no se incluyen en el acumulado
