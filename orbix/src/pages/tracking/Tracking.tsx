import { FormEvent, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { routes } from '@/routes'
import { useDocumentTitle } from '@/lib/useDocumentTitle'

const LAMBDA_TRACKING_URL =
  import.meta.env.VITE_ORBIX_TRACK_LAMBDA_URL || 'https://api.orbix.co/v1/tracking-status'

const STORAGE_KEY = 'orbix_last_dropoff_guide_v1'

export type PipelineStageIndex = 1 | 2 | 3 | 4 | 5

export interface MaterialRecoveryYield {
  symbol: 'Li' | 'Co' | 'Ni'
  name: string
  targetGrams: number
  recoveredGrams: number
  purityPercent: number
}

export interface StageLog {
  stage: PipelineStageIndex
  title: string
  subtitle: string
  timestamp: string | null
  nodeLocation: string
  telemetryBadge: string
  technicalNotes: string
}

export interface BatteryTrackingRecord {
  batteryId: string
  guideCode: string
  currentStage: PipelineStageIndex
  isQuarantineRoute: boolean
  updatedAtIso: string
  ownerNameMasked: string
  batterySpecs: {
    categoryLabel: string
    chemistry: 'NMC' | 'LFP' | 'LCO' | 'NCA' | 'UNKNOWN'
    brandModel: string
    weightKg: number
    voltageNominal: string
    conditionLabel: string
  }
  collectionNode: {
    id: string
    name: string
    address: string
  }
  edgeAiTelemetry: {
    modelVersion: string
    inferenceLatencyMs: number
    confidenceScore: number
    structuralAnomalyDetected: boolean
    sohEstimatedPercent: number
  }
  roboticsTelemetry: {
    cellId: string
    orchestrator: string
    disassemblyProgressPercent: number
    extractedModulesCount: number
  }
  environmentalImpact: {
    waterSavedLiters: number
    co2AvoidedKg: number
    materials: MaterialRecoveryYield[]
  }
  timeline: StageLog[]
}

// ============================================================================
// MOCK PRESETS FOR DEMO & PRESENTATION
// ============================================================================
const DEMO_RECORDS: Record<string, BatteryTrackingRecord> = {
  'OBX-BOG-261015-A19F': {
    batteryId: 'OBX-BOG-261015-A19F',
    guideCode: 'GUIA-A19F04',
    currentStage: 5,
    isQuarantineRoute: false,
    updatedAtIso: '2026-10-15T11:40:00.000Z',
    ownerNameMasked: 'Iván G.',
    batterySpecs: {
      categoryLabel: 'Vehículo Eléctrico / Híbrido (EV / PHEV)',
      chemistry: 'NMC',
      brandModel: 'BYD Yuan Up · Módulo Tracción',
      weightKg: 38.5,
      voltageNominal: '400V',
      conditionLabel: 'Baja retención de carga (< 70% SoH) sin daño físico',
    },
    collectionNode: {
      id: 'BOG-PUEN-04',
      name: 'Planta Piloto Puente Aranda · Recepción Industrial EV',
      address: 'Calle 13 # 65-10, Bogotá D.C.',
    },
    edgeAiTelemetry: {
      modelVersion: 'YOLOv8n-Orbix-Edge (FP16)',
      inferenceLatencyMs: 11.4,
      confidenceScore: 99.2,
      structuralAnomalyDetected: false,
      sohEstimatedPercent: 64,
    },
    roboticsTelemetry: {
      cellId: 'CELDA-ROS2-BOG-01',
      orchestrator: 'ROS 2 Humble + MARL Dual-Arm',
      disassemblyProgressPercent: 100,
      extractedModulesCount: 16,
    },
    environmentalImpact: {
      waterSavedLiters: 4820,
      co2AvoidedKg: 142.6,
      materials: [
        { symbol: 'Li', name: 'Litio grado batería', targetGrams: 2410, recoveredGrams: 2265, purityPercent: 94.0 },
        { symbol: 'Ni', name: 'Níquel secundario', targetGrams: 11200, recoveredGrams: 10416, purityPercent: 93.0 },
        { symbol: 'Co', name: 'Cobalto refinado', targetGrams: 3400, recoveredGrams: 3128, purityPercent: 92.0 },
      ],
    },
    timeline: [
      {
        stage: 1,
        title: 'Pasaporte Digital y Guía Emitida',
        subtitle: 'Registro sin sesión completado y manifiesto UN 3480 asignado.',
        timestamp: '12 Oct 2026 · 09:14',
        nodeLocation: 'Plataforma Web Orbix',
        telemetryBadge: 'PASSPORT_INIT',
        technicalNotes: 'Token criptográfico generado y enviado por correo electrónico.',
      },
      {
        stage: 2,
        title: 'Recepción Verificada en Punto PostGIS',
        subtitle: 'Entrega física confirmada y aislamiento de bornes validado.',
        timestamp: '13 Oct 2026 · 14:22',
        nodeLocation: 'BOG-PUEN-04 (Puente Aranda)',
        telemetryBadge: 'POSTGIS_CHECKIN',
        technicalNotes: 'Verificación de impedancia inicial completada sin fugas térmicas.',
      },
      {
        stage: 3,
        title: 'Diagnóstico y Clasificación Edge AI (YOLO)',
        subtitle: 'Escaneo óptico/profundidad y estimación de estado de salud (SoH).',
        timestamp: '14 Oct 2026 · 08:05',
        nodeLocation: 'Línea de Visión Artificial · Bogotá',
        telemetryBadge: 'YOLO_EDGE_11.4MS',
        technicalNotes: 'Carcasa íntegra (99.2% confianza). Química NMC confirmada por perfil espectral.',
      },
      {
        stage: 4,
        title: 'Desensamblaje Robótico Autónomo (ROS 2)',
        subtitle: 'Separación mecánica de precisión sin trituración masiva.',
        timestamp: '14 Oct 2026 · 16:48',
        nodeLocation: 'Celda Robótica MARL #01',
        telemetryBadge: 'ROS2_MARL_DONE',
        technicalNotes: '16 submódulos extraídos, desatornillado autónomo y separación de busbars de cobre.',
      },
      {
        stage: 5,
        title: 'Recuperación de Li, Co y Ni Completada',
        subtitle: 'Materiales críticos listos para reintegrarse a producción.',
        timestamp: '15 Oct 2026 · 11:40',
        nodeLocation: 'Unidad de Refinación Circular',
        telemetryBadge: 'YIELD_93.4%_AVG',
        technicalNotes: 'Certificado de cierre de ciclo emitido. Pureza hidrometalúrgica validada.',
      },
    ],
  },

  'OBX-BOG-261015-7C3D': {
    batteryId: 'OBX-BOG-261015-7C3D',
    guideCode: 'GUIA-7C3D88',
    currentStage: 4,
    isQuarantineRoute: false,
    updatedAtIso: '2026-10-15T12:10:00.000Z',
    ownerNameMasked: 'Laura M.',
    batterySpecs: {
      categoryLabel: 'Micromovilidad (Patineta, E-Bike, Moto eléctrica)',
      chemistry: 'NMC',
      brandModel: 'Segway Ninebot Max G30 · Pack 10S6P',
      weightKg: 4.8,
      voltageNominal: '36V',
      conditionLabel: 'Estructura intacta (Fin de vida útil normal)',
    },
    collectionNode: {
      id: 'BOG-CHAP-01',
      name: 'Nodo Central Chapinero · Centro de Acopio Técnico',
      address: 'Cra. 13 # 54-78, Bogotá D.C.',
    },
    edgeAiTelemetry: {
      modelVersion: 'YOLOv8n-Orbix-Edge (FP16)',
      inferenceLatencyMs: 9.8,
      confidenceScore: 98.7,
      structuralAnomalyDetected: false,
      sohEstimatedPercent: 58,
    },
    roboticsTelemetry: {
      cellId: 'CELDA-ROS2-BOG-02',
      orchestrator: 'ROS 2 Humble + Coordinación MARL',
      disassemblyProgressPercent: 68,
      extractedModulesCount: 40,
    },
    environmentalImpact: {
      waterSavedLiters: 640,
      co2AvoidedKg: 19.4,
      materials: [
        { symbol: 'Li', name: 'Litio grado batería', targetGrams: 320, recoveredGrams: 215, purityPercent: 91.5 },
        { symbol: 'Ni', name: 'Níquel secundario', targetGrams: 1450, recoveredGrams: 980, purityPercent: 90.0 },
        { symbol: 'Co', name: 'Cobalto refinado', targetGrams: 480, recoveredGrams: 310, purityPercent: 89.5 },
      ],
    },
    timeline: [
      {
        stage: 1,
        title: 'Pasaporte Digital y Guía Emitida',
        subtitle: 'Manifiesto de entrega generado.',
        timestamp: '14 Oct 2026 · 10:15',
        nodeLocation: 'Plataforma Web Orbix',
        telemetryBadge: 'PASSPORT_INIT',
        technicalNotes: 'Asignado al nodo Chapinero.',
      },
      {
        stage: 2,
        title: 'Recepción Verificada en Punto PostGIS',
        subtitle: 'Ingreso escaneado por operador en Chapinero.',
        timestamp: '14 Oct 2026 · 17:30',
        nodeLocation: 'BOG-CHAP-01 (Chapinero)',
        telemetryBadge: 'POSTGIS_CHECKIN',
        technicalNotes: 'Bornes XT60 aislados correctamente.',
      },
      {
        stage: 3,
        title: 'Diagnóstico y Clasificación Edge AI (YOLO)',
        subtitle: 'Geometría cilíndrica 18650 detectada sin hinchazón.',
        timestamp: '15 Oct 2026 · 09:20',
        nodeLocation: 'Línea de Visión Artificial · Bogotá',
        telemetryBadge: 'YOLO_EDGE_9.8MS',
        technicalNotes: 'Aprobado para desmonte automatizado directo.',
      },
      {
        stage: 4,
        title: 'Desensamblaje Robótico Autónomo (ROS 2)',
        subtitle: 'En proceso: Separación de celdas 18650 y tiras de níquel.',
        timestamp: '15 Oct 2026 · 12:10 (EN CURSO)',
        nodeLocation: 'Celda Robótica MARL #02',
        telemetryBadge: 'ROS2_ACTIVE_68%',
        technicalNotes: '40 de 60 celdas liberadas del soporte polimérico mediante corte asistido.',
      },
      {
        stage: 5,
        title: 'Recuperación de Li, Co y Ni',
        subtitle: 'Pendiente de finalización de desmonte.',
        timestamp: null,
        nodeLocation: 'Unidad de Refinación Circular',
        telemetryBadge: 'PENDING_STAGE_4',
        technicalNotes: 'Programado al completar el lote NMC actual.',
      },
    ],
  },

  'OBX-BOG-261015-9X2E': {
    batteryId: 'OBX-BOG-261015-9X2E',
    guideCode: 'GUIA-9X2E11',
    currentStage: 3,
    isQuarantineRoute: true,
    updatedAtIso: '2026-10-15T11:55:00.000Z',
    ownerNameMasked: 'Carlos R.',
    batterySpecs: {
      categoryLabel: 'Portátiles, Drones o Herramientas Eléctricas',
      chemistry: 'LCO',
      brandModel: 'Batería LiPo 6S Drone Industrial',
      weightKg: 1.9,
      voltageNominal: '22.2V',
      conditionLabel: 'Hinchada, abombada o con deformación mecánica',
    },
    collectionNode: {
      id: 'BOG-ANDES-02',
      name: 'Punto Universitario Centro · Laboratorio Piloto',
      address: 'Cra. 1 # 18A-12, Bogotá D.C.',
    },
    edgeAiTelemetry: {
      modelVersion: 'YOLOv8n-Orbix-Edge + DepthCam',
      inferenceLatencyMs: 14.2,
      confidenceScore: 96.4,
      structuralAnomalyDetected: true,
      sohEstimatedPercent: 22,
    },
    roboticsTelemetry: {
      cellId: 'CELDA-CUARENTENA-01',
      orchestrator: 'ROS 2 Safe-Discharge Protocol',
      disassemblyProgressPercent: 15,
      extractedModulesCount: 0,
    },
    environmentalImpact: {
      waterSavedLiters: 290,
      co2AvoidedKg: 8.7,
      materials: [
        { symbol: 'Li', name: 'Litio grado batería', targetGrams: 145, recoveredGrams: 0, purityPercent: 92.0 },
        { symbol: 'Co', name: 'Cobalto refinado', targetGrams: 520, recoveredGrams: 0, purityPercent: 94.0 },
        { symbol: 'Ni', name: 'Níquel secundario', targetGrams: 95, recoveredGrams: 0, purityPercent: 88.0 },
      ],
    },
    timeline: [
      {
        stage: 1,
        title: 'Pasaporte Digital y Guía Emitida',
        subtitle: 'Alerta preventiva de batería deformada activada desde el formulario.',
        timestamp: '14 Oct 2026 · 15:02',
        nodeLocation: 'Plataforma Web Orbix',
        telemetryBadge: 'QUARANTINE_FLAG',
        technicalNotes: 'Se asignó contenedor con vermiculita en recepción.',
      },
      {
        stage: 2,
        title: 'Recepción en Contenedor Ignífugo',
        subtitle: 'Ingreso bajo protocolo especial en Punto Centro.',
        timestamp: '15 Oct 2026 · 08:40',
        nodeLocation: 'BOG-ANDES-02 (Centro)',
        telemetryBadge: 'SAFE_BOX_UN3480',
        technicalNotes: 'Traslado seguro a planta piloto sin incidentes.',
      },
      {
        stage: 3,
        title: 'Diagnóstico Edge AI: Deformación Confirmada',
        subtitle: 'Cámara de profundidad detectó expansión volumétrica del 18% en celda pouch.',
        timestamp: '15 Oct 2026 · 11:55 (EN CURSO)',
        nodeLocation: 'Celda de Pre-Descarga Segura',
        telemetryBadge: 'ANOMALY_DETECTED',
        technicalNotes: 'Desviada a descarga resistiva controlada antes de ingresar al brazo robótico ROS 2.',
      },
      {
        stage: 4,
        title: 'Desensamblaje Robótico Autónomo (ROS 2)',
        subtitle: 'En espera de estabilización eléctrica (0V).',
        timestamp: null,
        nodeLocation: 'Celda Robótica MARL #01',
        telemetryBadge: 'WAITING_DISCHARGE',
        technicalNotes: 'Se ejecutará apertura criogénica/asistida tras neutralizar energía residual.',
      },
      {
        stage: 5,
        title: 'Recuperación de Li, Co y Ni',
        subtitle: 'Pendiente de desmonte.',
        timestamp: null,
        nodeLocation: 'Unidad de Refinación Circular',
        telemetryBadge: 'PENDING',
        technicalNotes: 'Alta concentración de Cobalto (química LCO).',
      },
    ],
  },
}

/**
 * Builds a tracking record from either a localStorage dropoff guide or an arbitrary user query
 * so the mock works with ANY code entered while the AWS Lambda is still being built.
 */
function resolveMockRecord(rawQuery: string): BatteryTrackingRecord | null {
  const normalized = rawQuery.trim().toUpperCase()
  if (!normalized) return null

  // 1. Check predefined demo records by Battery ID or Guide Code
  for (const record of Object.values(DEMO_RECORDS)) {
    if (record.batteryId === normalized || record.guideCode === normalized) {
      return record
    }
  }

  // 2. Check if it matches the guide generated in Dropoff.tsx (stored in localStorage)
  try {
    const cachedRaw = localStorage.getItem(STORAGE_KEY)
    if (cachedRaw) {
      const parsed = JSON.parse(cachedRaw)
      if (
        parsed?.batteryId?.toUpperCase() === normalized ||
        parsed?.guideCode?.toUpperCase() === normalized
      ) {
        const weight = Number(parsed.battery?.estimatedWeightKg) || 4.5
        const isQuarantine = Boolean(parsed.technicalRouting?.requiresQuarantine)
        return {
          batteryId: parsed.batteryId,
          guideCode: parsed.guideCode,
          currentStage: 2,
          isQuarantineRoute: isQuarantine,
          updatedAtIso: new Date().toISOString(),
          ownerNameMasked: parsed.user?.fullName || 'Usuario Orbix',
          batterySpecs: {
            categoryLabel: parsed.battery?.category || 'Batería Ion-Litio',
            chemistry: parsed.battery?.chemistry || 'NMC',
            brandModel: parsed.battery?.brandModel || 'Registrada en plataforma',
            weightKg: weight,
            voltageNominal: parsed.battery?.voltageNominal || '48V',
            conditionLabel: parsed.technicalRouting?.handlingProtocol || 'Ruta estándar',
          },
          collectionNode: {
            id: parsed.logistics?.collectionPointId || 'BOG-CHAP-01',
            name: parsed.logistics?.collectionPointName || 'Nodo Orbix Bogotá',
            address: parsed.logistics?.collectionPointAddress || 'Bogotá D.C.',
          },
          edgeAiTelemetry: {
            modelVersion: 'YOLOv8n-Orbix-Edge (FP16)',
            inferenceLatencyMs: 10.6,
            confidenceScore: 98.4,
            structuralAnomalyDetected: isQuarantine,
            sohEstimatedPercent: 61,
          },
          roboticsTelemetry: {
            cellId: 'CELDA-ROS2-BOG-01',
            orchestrator: 'ROS 2 Humble + MARL',
            disassemblyProgressPercent: 0,
            extractedModulesCount: 0,
          },
          environmentalImpact: {
            waterSavedLiters: Math.round(weight * 125),
            co2AvoidedKg: Number((weight * 3.7).toFixed(1)),
            materials: [
              {
                symbol: 'Li',
                name: 'Litio grado batería',
                targetGrams: Math.round(weight * 62),
                recoveredGrams: 0,
                purityPercent: 93.5,
              },
              {
                symbol: 'Ni',
                name: 'Níquel secundario',
                targetGrams: Math.round(weight * 280),
                recoveredGrams: 0,
                purityPercent: 92.0,
              },
              {
                symbol: 'Co',
                name: 'Cobalto refinado',
                targetGrams: Math.round(weight * 88),
                recoveredGrams: 0,
                purityPercent: 91.8,
              },
            ],
          },
          timeline: [
            {
              stage: 1,
              title: 'Pasaporte Digital y Guía Emitida',
              subtitle: 'Guía generada recientemente desde este navegador.',
              timestamp: new Date(parsed.createdAtIso).toLocaleString('es-CO', {
                dateStyle: 'medium',
                timeStyle: 'short',
              }),
              nodeLocation: 'Plataforma Web Orbix',
              telemetryBadge: 'PASSPORT_LOCAL',
              technicalNotes: `Asignada al nodo ${parsed.logistics?.collectionPointId}.`,
            },
            {
              stage: 2,
              title: 'Recepción en Punto de Recolección PostGIS',
              subtitle: 'Esperando escaneo físico o en tránsito hacia planta piloto.',
              timestamp: 'Activo ahora',
              nodeLocation: parsed.logistics?.collectionPointName || 'Bogotá D.C.',
              telemetryBadge: 'AWAITING_SCAN',
              technicalNotes: parsed.technicalRouting?.handlingProtocol || 'Protocolo estándar.',
            },
            {
              stage: 3,
              title: 'Diagnóstico y Clasificación Edge AI (YOLO)',
              subtitle: 'Escaneo computacional de formato, química y deformaciones.',
              timestamp: null,
              nodeLocation: 'Línea de Visión Artificial · Bogotá',
              telemetryBadge: 'QUEUED',
              technicalNotes: 'Pendiente de ingreso a banda óptica.',
            },
            {
              stage: 4,
              title: 'Desensamblaje Robótico Autónomo (ROS 2)',
              subtitle: 'Desmonte mecánico asistido por IA.',
              timestamp: null,
              nodeLocation: 'Celda Robótica MARL #01',
              telemetryBadge: 'QUEUED',
              technicalNotes: 'Pendiente de clasificación YOLO.',
            },
            {
              stage: 5,
              title: 'Recuperación de Li, Co y Ni',
              subtitle: 'Extracción de alta pureza para nuevas baterías.',
              timestamp: null,
              nodeLocation: 'Unidad de Refinación Circular',
              telemetryBadge: 'QUEUED',
              technicalNotes: 'Certificado final de impacto hídrico y material.',
            },
          ],
        }
      }
    }
  } catch {
    // Ignore storage read errors
  }

  // 3. Accept any code starting with OBX- or GUIA- so testing arbitrary strings works smoothly
  if (normalized.startsWith('OBX-') || normalized.startsWith('GUIA-')) {
    const base = DEMO_RECORDS['OBX-BOG-261015-7C3D']
    return {
      ...base,
      batteryId: normalized.startsWith('OBX-') ? normalized : `OBX-BOG-261015-${normalized.slice(-4)}`,
      guideCode: normalized.startsWith('GUIA-') ? normalized : `GUIA-${normalized.slice(-6)}`,
    }
  }

  return null
}

/**
 * Helper to dynamically recalculate progress when the presenter clicks the Stage Simulator buttons
 */
function applySimulatedStage(
  record: BatteryTrackingRecord,
  simulatedStage: PipelineStageIndex
): BatteryTrackingRecord {
  const stageRatio =
    simulatedStage === 5 ? 1 : simulatedStage === 4 ? 0.68 : simulatedStage === 3 ? 0.15 : 0

  return {
    ...record,
    currentStage: simulatedStage,
    roboticsTelemetry: {
      ...record.roboticsTelemetry,
      disassemblyProgressPercent:
        simulatedStage >= 5 ? 100 : simulatedStage === 4 ? 68 : simulatedStage === 3 ? 15 : 0,
    },
    environmentalImpact: {
      ...record.environmentalImpact,
      materials: record.environmentalImpact.materials.map((m) => ({
        ...m,
        recoveredGrams: Math.round(m.targetGrams * stageRatio),
      })),
    },
    timeline: record.timeline.map((step) => ({
      ...step,
      timestamp:
        step.stage < simulatedStage
          ? step.timestamp || 'Completado · Verificado'
          : step.stage === simulatedStage
            ? 'EN CURSO · Telemetría activa'
            : null,
    })),
  }
}

export function Tracking() {
  useDocumentTitle(routes.tracking?.title || 'Seguimiento de Batería · Orbix')

  const [searchParams, setSearchParams] = useSearchParams()
  const initialCodeFromUrl = searchParams.get('code') || ''

  const [queryInput, setQueryInput] = useState<string>(initialCodeFromUrl)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [dataSourceMode, setDataSourceMode] = useState<'lambda' | 'mock_fallback'>('mock_fallback')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [baseRecord, setBaseRecord] = useState<BatteryTrackingRecord | null>(null)
  const [simulatedStage, setSimulatedStage] = useState<PipelineStageIndex | null>(null)
  const [localSavedIds, setLocalSavedIds] = useState<{ batteryId: string; guideCode: string } | null>(
    null
  )

  // Check if the user has a recently generated guide in localStorage from Dropoff.tsx
  useEffect(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY)
      if (cached) {
        const parsed = JSON.parse(cached)
        if (parsed?.batteryId && parsed?.guideCode) {
          setLocalSavedIds({
            batteryId: parsed.batteryId,
            guideCode: parsed.guideCode,
          })
          // Auto-populate if no URL query was passed
          if (!initialCodeFromUrl) {
            setQueryInput(parsed.batteryId)
            void executeLookup(parsed.batteryId)
          }
        }
      }
    } catch {
      // Ignore storage errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Run lookup if ?code= is present in URL on mount
  useEffect(() => {
    if (initialCodeFromUrl) {
      void executeLookup(initialCodeFromUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCodeFromUrl])

  const executeLookup = async (codeToFetch: string) => {
    const cleanCode = codeToFetch.trim().toUpperCase()
    if (!cleanCode) return

    setIsLoading(true)
    setErrorMessage(null)
    setSimulatedStage(null)

    try {
      // 1. Attempt real GET request to AWS Lambda
      const controller = new AbortController()
      const timeoutId = window.setTimeout(() => controller.abort(), 1800)

      const response = await fetch(
        `${LAMBDA_TRACKING_URL}?code=${encodeURIComponent(cleanCode)}`,
        {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        }
      )
      window.clearTimeout(timeoutId)

      if (response.ok) {
        const data = (await response.json()) as BatteryTrackingRecord
        setBaseRecord(data)
        setDataSourceMode('lambda')
        setSearchParams({ code: cleanCode }, { replace: true })
        setIsLoading(false)
        return
      }
      throw new Error('Lambda endpoint non-200')
    } catch {
      // 2. Graceful fallback to local deterministic mock while Lambda is not deployed
      await new Promise((resolve) => setTimeout(resolve, 350))
      const mockResult = resolveMockRecord(cleanCode)

      if (mockResult) {
        setBaseRecord(mockResult)
        setDataSourceMode('mock_fallback')
        setSearchParams({ code: cleanCode }, { replace: true })
      } else {
        setBaseRecord(null)
        setErrorMessage(
          `No encontramos ningún registro asociado al código "${cleanCode}". Verifica que comience por OBX-BOG-... o GUIA-... o prueba uno de los códigos de demostración.`
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void executeLookup(queryInput)
  }

  const activeRecord =
    baseRecord && simulatedStage
      ? applySimulatedStage(baseRecord, simulatedStage)
      : baseRecord

  return (
    <section className="mx-auto max-w-page px-5 py-12 sm:px-8 lg:py-20">
      {/* HEADER & SEARCH BAR */}
      <div className="max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full bg-ink/[0.07] px-3.5 py-1.5 text-xs font-medium tracking-wider uppercase">
          <span className="h-2 w-2 rounded-full bg-accent" />
          <span>Trazabilidad en Tiempo Real · PostGIS + YOLO + ROS 2</span>
        </div>

        <h1 className="mt-5 text-[clamp(2.25rem,5.5vw,4rem)] font-semibold leading-[1.04] tracking-display">
          Sigue la recuperación de tu batería.
        </h1>

        <p className="mt-4 text-base leading-relaxed text-muted">
          Ingresa el <strong>ID de Batería</strong> (<span className="font-mono">OBX-BOG-...</span>) o el{' '}
          <strong>Código de Guía</strong> (<span className="font-mono">GUIA-...</span>) que recibiste al registrar la entrega para consultar el diagnóstico por visión artificial y los gramos de litio, cobalto y níquel recuperados.
        </p>

        {/* Search Input Form */}
        <form onSubmit={handleSearchSubmit} className="mt-8 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="Ej. OBX-BOG-261015-A19F o GUIA-7C3D88"
              aria-label="Código de guía o ID de batería"
              className="w-full rounded-full border border-ink/[0.14] bg-ink/[0.05] px-6 py-4 font-mono text-sm uppercase placeholder:font-sans placeholder:normal-case placeholder:text-muted focus:border-accent focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !queryInput.trim()}
            className="press inline-flex items-center justify-center rounded-full bg-accent px-8 py-4 text-sm font-medium text-accent-ink transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? 'Consultando Lambda...' : 'Consultar estado'}
          </button>
        </form>

        {/* Quick-Select Chips (User's Local Guide + 3 Built-in Demo Presets) */}
        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted">Códigos de prueba rápidos:</span>

          {localSavedIds && (
            <button
              type="button"
              onClick={() => {
                setQueryInput(localSavedIds.batteryId)
                void executeLookup(localSavedIds.batteryId)
              }}
              className="press inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-ink/[0.09] px-3 py-1.5 font-mono text-xs font-medium"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              <span>Tu guía reciente: {localSavedIds.batteryId}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setQueryInput('OBX-BOG-261015-A19F')
              void executeLookup('OBX-BOG-261015-A19F')
            }}
            className="press rounded-full border border-ink/[0.1] bg-ink/[0.05] px-3 py-1.5 font-mono text-muted transition-colors hover:text-ink"
          >
            OBX-BOG-261015-A19F (Etapa 5 · 100%)
          </button>

          <button
            type="button"
            onClick={() => {
              setQueryInput('GUIA-7C3D88')
              void executeLookup('GUIA-7C3D88')
            }}
            className="press rounded-full border border-ink/[0.1] bg-ink/[0.05] px-3 py-1.5 font-mono text-muted transition-colors hover:text-ink"
          >
            GUIA-7C3D88 (Etapa 4 · Robot ROS 2)
          </button>

          <button
            type="button"
            onClick={() => {
              setQueryInput('OBX-BOG-261015-9X2E')
              void executeLookup('OBX-BOG-261015-9X2E')
            }}
            className="press rounded-full border border-ink/[0.1] bg-ink/[0.05] px-3 py-1.5 font-mono text-muted transition-colors hover:text-ink"
          >
            OBX-BOG-261015-9X2E (Etapa 3 · Hinchada)
          </button>
        </div>
      </div>

      {/* ERROR STATE */}
      {errorMessage && (
        <div className="mt-10 rounded-3xl border border-ink/[0.12] bg-ink/[0.04] p-6 sm:p-8">
          <p className="text-sm font-medium">{errorMessage}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to={routes.dropoff.path}
              className="press rounded-full bg-accent px-5 py-2.5 text-xs font-medium text-accent-ink"
            >
              Registrar una batería nueva
            </Link>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* ACTIVE TELEMETRY & PIPELINE DASHBOARD                                 */}
      {/* ===================================================================== */}
      {activeRecord && (
        <div className="mt-12 space-y-8">
          {/* Top Status Banner + Live Stage Simulator for Presentation */}
          <div className="flex flex-col justify-between gap-4 rounded-3xl border border-ink/[0.1] bg-ink/[0.04] p-6 lg:flex-row lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-mono text-2xl font-semibold tracking-tight sm:text-3xl">
                  {activeRecord.batteryId}
                </span>
                <span className="rounded-full bg-ink/[0.08] px-3 py-1 font-mono text-xs">
                  {activeRecord.guideCode}
                </span>
                {activeRecord.isQuarantineRoute && (
                  <span className="rounded-full border border-ink/[0.2] bg-ink/[0.1] px-3 py-1 font-mono text-xs font-medium">
                    PROTOCOLO CONTENCIÓN TÉRMICA
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-xs text-muted">
                {activeRecord.batterySpecs.brandModel} · Química{' '}
                <strong className="font-mono">{activeRecord.batterySpecs.chemistry}</strong> · Nodo:{' '}
                {activeRecord.collectionNode.name}
              </p>
            </div>

            {/* Interactive Stage Simulator so you can demo all 5 stages live */}
            <div className="flex flex-col items-start gap-2 lg:items-end">
              <div className="flex items-center gap-2 text-[0.6875rem] text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                <span>
                  {dataSourceMode === 'lambda'
                    ? 'Conectado a AWS Lambda'
                    : 'Simulador de Telemetría (Mock Activo · Cambia la etapa en vivo)'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {([1, 2, 3, 4, 5] as PipelineStageIndex[]).map((stageNum) => {
                  const isCurrent = activeRecord.currentStage === stageNum
                  return (
                    <button
                      key={stageNum}
                      type="button"
                      onClick={() => setSimulatedStage(stageNum)}
                      className={`press rounded-full px-3 py-1 font-mono text-xs transition-colors ${
                        isCurrent
                          ? 'bg-accent font-semibold text-accent-ink'
                          : 'bg-ink/[0.07] text-muted hover:text-ink'
                      }`}
                    >
                      Etapa {stageNum}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* 3-Column Technical Telemetry Cards (PostGIS + Edge AI + ROS 2) */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Card 1: Collection & Physical Specs */}
            <div className="rounded-3xl border border-ink/[0.08] bg-ink/[0.04] p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wider text-muted uppercase">
                  1. Ficha &amp; Acopio PostGIS
                </span>
                <span className="font-mono text-xs text-muted">{activeRecord.collectionNode.id}</span>
              </div>

              <dl className="mt-5 grid grid-cols-2 gap-y-4 text-sm">
                <div>
                  <dt className="text-xs text-muted">Química / Celda</dt>
                  <dd className="mt-0.5 font-mono font-semibold">
                    {activeRecord.batterySpecs.chemistry}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Masa / Voltaje</dt>
                  <dd className="mt-0.5 font-mono">
                    {activeRecord.batterySpecs.weightKg} kg ·{' '}
                    {activeRecord.batterySpecs.voltageNominal}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs text-muted">Punto de Recolección</dt>
                  <dd className="mt-0.5 font-medium">{activeRecord.collectionNode.name}</dd>
                  <dd className="text-xs text-muted">{activeRecord.collectionNode.address}</dd>
                </div>
              </dl>
            </div>

            {/* Card 2: Edge AI Vision Telemetry (YOLO) */}
            <div className="rounded-3xl border border-ink/[0.08] bg-ink/[0.04] p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wider text-muted uppercase">
                  2. Diagnóstico Edge AI (YOLO)
                </span>
                <span className="rounded-full bg-ink/[0.08] px-2.5 py-0.5 font-mono text-[0.6875rem]">
                  {activeRecord.currentStage >= 3
                    ? `${activeRecord.edgeAiTelemetry.inferenceLatencyMs} ms`
                    : 'EN COLA'}
                </span>
              </div>

              {activeRecord.currentStage >= 3 ? (
                <dl className="mt-5 grid grid-cols-2 gap-y-4 text-sm">
                  <div>
                    <dt className="text-xs text-muted">Precisión Clasificación</dt>
                    <dd className="mt-0.5 font-mono text-lg font-semibold">
                      {activeRecord.edgeAiTelemetry.confidenceScore}%
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Estado de Salud (SoH)</dt>
                    <dd className="mt-0.5 font-mono text-lg font-semibold">
                      {activeRecord.edgeAiTelemetry.sohEstimatedPercent}%
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs text-muted">Integridad Estructural (Cámara Profundidad)</dt>
                    <dd className="mt-0.5 text-xs font-medium">
                      {activeRecord.edgeAiTelemetry.structuralAnomalyDetected
                        ? 'Deformación volumétrica detectada → Enviada a pre-descarga controlada'
                        : 'Geometría nominal sin hinchazón → Apta para desmonte robótico directo'}
                    </dd>
                  </div>
                </dl>
              ) : (
                <div className="mt-6 rounded-2xl border border-ink/[0.06] bg-ink/[0.03] p-4 text-xs text-muted">
                  La telemetría de visión computacional (YOLOv8 + sensor espectral) se poblará automáticamente cuando la batería ingrese a la línea óptica en la Etapa 3.
                </div>
              )}
            </div>

            {/* Card 3: Robotic Disassembly (ROS 2 + MARL) */}
            <div className="rounded-3xl border border-ink/[0.08] bg-ink/[0.04] p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wider text-muted uppercase">
                  3. Desensamblaje ROS 2
                </span>
                <span className="font-mono text-xs text-muted">
                  {activeRecord.roboticsTelemetry.cellId}
                </span>
              </div>

              <div className="mt-5">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-xs text-muted">Progreso de separación mecánica</span>
                  <span className="font-mono text-lg font-semibold">
                    {activeRecord.roboticsTelemetry.disassemblyProgressPercent}%
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-ink/[0.08]">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-500"
                    style={{
                      width: `${activeRecord.roboticsTelemetry.disassemblyProgressPercent}%`,
                    }}
                  />
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <dt className="text-muted">Orquestador</dt>
                    <dd className="mt-0.5 font-mono font-medium">
                      {activeRecord.roboticsTelemetry.orchestrator}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Celdas / Módulos extraídos</dt>
                    <dd className="mt-0.5 font-mono font-medium">
                      {activeRecord.currentStage >= 4
                        ? `${activeRecord.roboticsTelemetry.extractedModulesCount} unidades`
                        : 'Pendiente'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          {/* MATERIAL RECOVERY & ENVIRONMENTAL IMPACT SECTION */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Timeline Column (7 cols) */}
            <div className="rounded-3xl border border-ink/[0.08] bg-ink/[0.04] p-6 sm:p-8 lg:col-span-7">
              <h2 className="text-lg font-semibold">Línea de tiempo de trazabilidad circular</h2>
              <p className="mt-1 text-xs text-muted">
                Registro inmutable de cada etapa desde el punto de recolección hasta la recuperación de minerales.
              </p>

              <ol className="mt-8 space-y-6">
                {activeRecord.timeline.map((item) => {
                  const isCompleted = item.stage < activeRecord.currentStage
                  const isCurrent = item.stage === activeRecord.currentStage

                  return (
                    <li
                      key={item.stage}
                      className={`relative rounded-2xl border p-5 transition-colors ${
                        isCurrent
                          ? 'border-accent bg-ink/[0.08]'
                          : isCompleted
                            ? 'border-ink/[0.1] bg-ink/[0.04]'
                            : 'border-ink/[0.05] bg-ink/[0.02] opacity-60'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`flex h-6 w-6 items-center justify-center rounded-full font-mono text-xs font-semibold ${
                              isCurrent || isCompleted
                                ? 'bg-accent text-accent-ink'
                                : 'bg-ink/[0.1] text-muted'
                            }`}
                          >
                            {item.stage}
                          </span>
                          <h3 className="text-sm font-semibold sm:text-base">{item.title}</h3>
                        </div>

                        <span className="rounded-full bg-ink/[0.08] px-2.5 py-0.5 font-mono text-[0.6875rem] text-muted">
                          {item.telemetryBadge}
                        </span>
                      </div>

                      <p className="mt-2 text-xs leading-relaxed text-muted">{item.subtitle}</p>
                      <p className="mt-2 font-mono text-xs text-muted">
                        <strong>Nota técnica:</strong> {item.technicalNotes}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-ink/[0.06] pt-2.5 text-[0.6875rem] text-muted">
                        <span>Ubicación: {item.nodeLocation}</span>
                        <span className="font-mono">{item.timestamp || 'Pendiente'}</span>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </div>

            {/* Critical Materials & Water Impact Column (5 cols) */}
            <div className="flex flex-col justify-between gap-6 rounded-3xl border border-ink/[0.08] bg-ink/[0.04] p-6 sm:p-8 lg:col-span-5">
              <div>
                <span className="text-xs font-semibold tracking-wider text-muted uppercase">
                  Balance de Masa &amp; Pureza (85–95%)
                </span>
                <h2 className="mt-2 text-xl font-semibold">
                  Recuperación de Litio, Cobalto y Níquel
                </h2>
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  Al separar robóticamente las celdas antes del proceso hidrometalúrgico o reciclaje directo, evitamos pérdidas por escoria y elevamos la pureza del material recuperado.
                </p>

                <div className="mt-6 space-y-5">
                  {activeRecord.environmentalImpact.materials.map((mat) => {
                    const pct =
                      mat.targetGrams > 0
                        ? Math.min(100, Math.round((mat.recoveredGrams / mat.targetGrams) * 100))
                        : 0

                    return (
                      <div
                        key={mat.symbol}
                        className="rounded-2xl border border-ink/[0.08] bg-ink/[0.03] p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-ink/[0.1] font-mono text-xs font-bold">
                              {mat.symbol}
                            </span>
                            <div>
                              <p className="text-sm font-medium">{mat.name}</p>
                              <p className="font-mono text-[0.6875rem] text-muted">
                                Pureza estimada: {mat.purityPercent}%
                              </p>
                            </div>
                          </div>

                          <div className="text-right font-mono">
                            <p className="text-sm font-semibold">
                              {mat.recoveredGrams} g{' '}
                              <span className="text-xs font-normal text-muted">
                                / {mat.targetGrams} g
                              </span>
                            </p>
                            <p className="text-[0.6875rem] text-muted">{pct}% recuperado</p>
                          </div>
                        </div>

                        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-ink/[0.08]">
                          <div
                            className="h-full rounded-full bg-accent transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Environmental Footprint Saved (Lithium Triangle Metrics from Actividad 2) */}
              <div className="rounded-2xl border border-ink/[0.1] bg-ink/[0.06] p-5">
                <p className="text-xs font-semibold tracking-wider text-muted uppercase">
                  Huella Ambiental Mitigada (Triángulo del Litio)
                </p>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-mono text-2xl font-semibold">
                      {activeRecord.environmentalImpact.waterSavedLiters.toLocaleString('es-CO')} L
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      Agua subterránea preservada (basado en 2M L / Ton Li primario)
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-2xl font-semibold">
                      {activeRecord.environmentalImpact.co2AvoidedKg} kg
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      Emisiones de CO₂e evitadas frente a minería primaria
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}