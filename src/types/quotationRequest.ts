
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
  imageUrl?: string; // URL a la imagen del problema adjuntada por el usuario
  professionalId?: string; // ID del profesional si se solicitó a uno específico (opcional)
  handymanId?: string; // Legacy field for professional ID, keep for backward compatibility
  professionalName?: string; // Nombre del profesional si se solicitó a uno específico (opcional)
  status: "Enviada" | "Revisando" | "Cotizada" | "Aceptada" | "En Progreso" | "Finalizada por Profesional" | "Completada" | "Cancelada";
  requestedAt: Timestamp;
  updatedAt: Timestamp;

  // Campos para la cotización del profesional
  quotedAmount?: number;
  quotedCurrency?: string; // e.g., "COP"
  quotationDetails?: string; // Notas adicionales de la cotización

  // Campos para comisiones de la plataforma
  platformCommissionRate?: number; // Tasa de comisión aplicada (ej. 0.15 para 15%)
  platformFeeCalculated?: number; // Monto de la comisión calculada para la plataforma
  handymanEarnings?: number; // Ganancias netas para el profesional (quotedAmount - platformFeeCalculated)
  commissionPaymentStatus?: "Pendiente" | "Pagada"; // Nuevo campo para el estado de pago de la comisión
  isReviewed?: boolean; // Nuevo campo para saber si el cliente ya dejó una reseña
}
