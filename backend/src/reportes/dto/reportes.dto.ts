export interface AnalisisCaoRow {
  numero: number;
  periodo: string;
  fechaInicio: string;
  fechaFin: string;
  desembolsoEfectuado: number;
  descuentoAnticipo: number;
  descuentoAnticipoAcumulado: number;
  liquidoPagado: number;
  liquidoPagadoAcumulado: number;
  saldoPorEjecutar: number;
  avanceFisico: number;
  avanceFinanciero: number;
}

export interface CertificadoResponse {
  ejecutadoAcumuladoAnterior: number;
  ejecutadoPresentePeriodo: number;
  ejecutadoAcumuladoALaFecha: number;
  descuentoAnticipoAcumuladoAnterior: number;
  interesSegunContrato: number;
  descuentoAnticipoPresentePeriodo: number;
  descuentoAnticipoAcumuladoALaFecha: number;
  multaAnterior: number;
  multaPresentePeriodo: number;
  multaAcumuladoALaFecha: number;
  totalDeducciones: number;
  liquidoPagadoAcumuladoAnterior: number;
  liquidoPagadoAcumuladoALaFecha: number;
  liquidoPagablePlanillaActual: number;
  totalLiquidoPagadoAcumuladoALaFecha: number;
  montoAcumuladoCaosALaFecha: number;
  saldoPorRestituirAnticipo: number;
  saldoEfectivoPorPagar: number;
}

export interface AnalisisCaoResponse {
  proyecto: {
    id: number;
    nombre: string;
    contratoNro: string | null;
    montoContrato: number;
    anticipoPct: number;
    anticipoMonto: number | null;
    ordenProceder: string | null;
    fechaConclusion: string | null;
    contratista: string | null;
    supervisor: string | null;
    fiscal: string | null;
    direccion: string | null;
  };
  tablaFinanciera: AnalisisCaoRow[];
  totales: {
    desembolsoEfectuado: number;
    descuentoAnticipo: number;
    liquidoPagado: number;
    saldoPorEjecutar: number;
    avanceFisico: number;
    avanceFinanciero: number;
  };
  anticipo: {
    monto: number;
    porcentaje: number;
  };
  desgloseContractual: {
    montoContrato: number;
    anticipo: number;
    ordenTrabajoMonto: number | null;
    ordenCambioMonto: number | null;
  };
  retraso: {
    fisico: number;
    financiero: number;
  };
  totalCaos: number;
  certificado?: CertificadoResponse;
}

export interface PlanillaItemRow {
  numero: number;
  descripcion: string;
  unidad: string;
  precioUnitario: number;
  cantidadContrato: number;
  montoOriginal: number;
  ordenTrabajo: {
    cantidad: number | null;
    monto: number | null;
    incrementoPct: number | null;
  } | null;
  caos: {
    numero: number;
    cantidad: number;
    monto: number;
    avancePct: number;
  }[];
  acumulado: {
    cantidad: number;
    monto: number;
  };
  montoFaltante: number;
  pctCantidad: number;
  pctMontoFaltante: number;
}

export interface PlanillaRubroGroup {
  rubroCodigo: string;
  rubroNombre: string;
  items: PlanillaItemRow[];
  subtotal: number;
}

export interface PlanillaDetalleResponse {
  proyecto: {
    id: number;
    nombre: string;
    contratoNro: string | null;
  };
  totalCaos: number;
  rubros: PlanillaRubroGroup[];
}
