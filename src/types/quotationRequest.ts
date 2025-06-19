// src/types/quotationRequest.ts
import type { Timestamp } from 'firebase/firestore';

export interface QuotationRequest {
  id: string; // Firestore document ID
  userId?: string; // ID del usuario autenticado que solicita
  userFullName?: string; // Nombre del usuario autenticado
  userEmail?: string; // Email del usuario autenticado
  contactFullName: string; // Nombre del formulario
  contactEmail: string; // Email del formulario
  contactPhone?: string; // Teléfono del formulario (opcional)
  address: string; // Dirección del formulario
  serviceId: string; // ID del servicio seleccionado
  serviceName: string; // Nombre del servicio
  problemDescription: string;
  preferredDate?: string; // Fecha preferida (opcional)
  handymanId?: string; // ID del operario si se solicitó a uno específico (opcional)
  handymanName?: string; // Nombre del operario si se solicitó a uno específico (opcional)
  status: "Enviada" | "Revisando" | "Cotizada" | "Programada" | "Completada" | "Cancelada";
  requestedAt: Timestamp;
  updatedAt: Timestamp;

  // Campos para la cotización del operario
  quotedAmount?: number;
  quotedCurrency?: string; // e.g., "COP"
  quotationDetails?: string; // Notas adicionales de la cotización

  // Campos para comisiones de la plataforma
  platformCommissionRate?: number; // Tasa de comisión aplicada (ej. 0.15 para 15%)
  platformFeeCalculated?: number; // Monto de la comisión calculada para la plataforma
  handymanEarnings?: number; // Ganancias netas para el operario (quotedAmount - platformFeeCalculated)
  commissionPaymentStatus?: "Pendiente" | "Pagada"; // Nuevo campo para el estado de pago de la comisión
}
