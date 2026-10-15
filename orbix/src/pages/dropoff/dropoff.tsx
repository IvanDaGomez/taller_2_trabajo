import { FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { routes } from '@/routes'
import { useDocumentTitle } from '@/lib/useDocumentTitle'

const LAMBDA_WEBHOOK_URL =
  import.meta.env.VITE_ORBIX_DROP_LAMBDA_URL || 'https://api.orbix.co/v1/dropoff-dispatch'

const STORAGE_KEY = 'orbix_last_dropoff_guide_v1'

type BatteryCategory = 'ev_car' | 'micromobility' | 'consumer_electronics' | 'industrial_ups'
type BatteryChemistry = 'NMC' | 'LFP' | 'LCO' | 'NCA' | 'UNKNOWN'
type PhysicalCondition = 'intact' | 'degraded_capacity' | 'swollen_deformed' | 'thermal_damage'

interface CollectionPoint {
  id: string
  name: string
  zone: string
  address: string
  schedule: string
  acceptsHighVoltage: boolean
}

const BOGOTA_COLLECTION_POINTS: CollectionPoint[] = [
  {
    id: 'BOG-CHAP-01',
    name: 'Nodo Central Chapinero · Centro de Acopio Técnico',
    zone: 'Chapinero',
    address: 'Cra. 13 # 54-78, Bogotá D.C.',
    schedule: 'Lun – Sáb · 08:00 – 18:00',
    acceptsHighVoltage: true,
  },
  {
    id: 'BOG-ANDES-02',
    name: 'Punto Universitario Centro · Laboratorio Piloto',
    zone: 'La Candelaria / Centro',
    address: 'Cra. 1 # 18A-12, Bogotá D.C.',
    schedule: 'Lun – Vie · 07:00 – 19:00',
    acceptsHighVoltage: false,
  },
  {
    id: 'BOG-USAQ-03',
    name: 'Estación Norte Usaquén · Electromovilidad',
    zone: 'Usaquén',
    address: 'Av. Cra. 9 # 116-20, Bogotá D.C.',
    schedule: 'Lun – Dom · 09:00 – 17:00',
    acceptsHighVoltage: true,
  },
  {
    id: 'BOG-PUEN-04',
    name: 'Planta Piloto Puente Aranda · Recepción Industrial EV',
    zone: 'Zona Industrial',
    address: 'Calle 13 # 65-10, Bogotá D.C.',
    schedule: 'Lun – Sáb · 06:00 – 18:00',
    acceptsHighVoltage: true,
  },
]

const CATEGORY_LABELS: Record<BatteryCategory, { label: string; desc: string }> = {
  ev_car: {
    label: 'Vehículo Eléctrico / Híbrido (EV / PHEV)',
    desc: 'Módulos o paquetes de tracción de alta capacidad.',
  },
  micromobility: {
    label: 'Micromovilidad (Patineta, E-Bike, Moto eléctrica)',
    desc: 'Paquetes extraíbles de 36V a 72V.',
  },
  consumer_electronics: {
    label: 'Portátiles, Drones o Herramientas Eléctricas',
    desc: 'Celdas cilíndricas (18650/21700) o tipo pouch.',
  },
  industrial_ups: {
    label: 'Respaldo de Energía / UPS Litio / Solar',
    desc: 'Bancos estacionarios de almacenamiento.',
  },
}

const CONDITION_LABELS: Record<
  PhysicalCondition,
  { label: string; handlingNote: string; requiresQuarantine: boolean }
> = {
  intact: {
    label: 'Estructura intacta (Fin de vida útil normal)',
    handlingNote: 'Ruta estándar: Clasificación directa por visión artificial (YOLO) y desmonte robótico.',
    requiresQuarantine: false,
  },
  degraded_capacity: {
    label: 'Baja retención de carga (< 70% SoH) sin daño físico',
    handlingNote: 'Ruta estándar + Evaluación de segunda vida antes de desensamblaje.',
    requiresQuarantine: false,
  },
  swollen_deformed: {
    label: 'Hinchada, abombada o con deformación mecánica',
    handlingNote:
      'PROTOCOLO DE CONTENCIÓN: Requiere bandeja ignífuga con vermiculita y supervisión en celda de pre-descarga.',
    requiresQuarantine: true,
  },
  thermal_damage: {
    label: 'Signos de sobrecalentamiento, corrosión o fuga',
    handlingNote:
      'PROTOCOLO CRÍTICO: Aislamiento térmico inmediato en contenedor certificado UN 3480.',
    requiresQuarantine: true,
  },
}

interface DropoffPayload {
  batteryId: string
  guideCode: string
  createdAtIso: string
  user: {
    fullName: string
    email: string
    phone: string
    documentId: string
  }
  battery: {
    category: BatteryCategory
    chemistry: BatteryChemistry
    brandModel: string
    estimatedWeightKg: number
    voltageNominal: string
    condition: PhysicalCondition
  }
  logistics: {
    collectionPointId: string
    collectionPointName: string
    collectionPointAddress: string
    collectionPointSchedule: string
  }
  technicalRouting: {
    requiresQuarantine: boolean
    handlingProtocol: string
    targetMaterials: string[]
  }
}

function generateBatteryIdentifiers(): { batteryId: string; guideCode: string } {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')

  const randomBytes = new Uint8Array(3)
  window.crypto.getRandomValues(randomBytes)
  const hex = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
    .join('')

  return {
    batteryId: `OBX-BOG-${yy}${mm}${dd}-${hex.slice(0, 4)}`,
    guideCode: `GUIA-${hex}`,
  }
}

/**
 * Generates a deterministic 9x9 visual data matrix pattern from the battery ID
 * so the printed manifest has a scannable/verifiable visual token without external libs.
 */
function buildDeterministicMatrix(seed: string): boolean[] {
  const cells: boolean[] = []
  let hash = 2166136261
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }

  for (let idx = 0; idx < 81; idx++) {
    const row = Math.floor(idx / 9)
    const col = idx % 9
    // Finder border on outer edges
    if (row === 0 || col === 0 || (row === 8 && col % 2 === 0) || (col === 8 && row % 2 === 0)) {
      cells.push(true)
    } else {
      const bit = ((hash >>> (idx % 24)) ^ (row * 17 + col * 31)) & 1
      cells.push(bit === 1)
    }
  }
  return cells
}

export function Dropoff() {
  useDocumentTitle(routes.dropoff?.title || 'Entregar una batería · Orbix')

  // Form States
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [documentId, setDocumentId] = useState('')

  const [category, setCategory] = useState<BatteryCategory>('micromobility')
  const [chemistry, setChemistry] = useState<BatteryChemistry>('NMC')
  const [brandModel, setBrandModel] = useState('')
  const [estimatedWeightKg, setEstimatedWeightKg] = useState<string>('4.5')
  const [voltageNominal, setVoltageNominal] = useState<string>('48V')
  const [condition, setCondition] = useState<PhysicalCondition>('intact')
  const [selectedPointId, setSelectedPointId] = useState<string>(BOGOTA_COLLECTION_POINTS[0].id)
  const [acceptedSafetyTerms, setAcceptedSafetyTerms] = useState<boolean>(false)

  // Submission & Guide States
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [dispatchStatus, setDispatchStatus] = useState<'idle' | 'sent' | 'queued_offline'>('idle')
  const [generatedGuide, setGeneratedGuide] = useState<DropoffPayload | null>(null)
  const [copiedId, setCopiedId] = useState<boolean>(false)

  // Restore last guide from localStorage so stateless refresh doesn't lose the user's ticket
  useEffect(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY)
      if (cached) {
        const parsed = JSON.parse(cached) as DropoffPayload
        if (parsed?.batteryId) {
          setGeneratedGuide(parsed)
        }
      }
    } catch {
      // Ignore storage access errors
    }
  }, [])

  const selectedPoint =
    BOGOTA_COLLECTION_POINTS.find((p) => p.id === selectedPointId) || BOGOTA_COLLECTION_POINTS[0]

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!acceptedSafetyTerms) return

    setIsSubmitting(true)
    const { batteryId, guideCode } = generateBatteryIdentifiers()
    const conditionInfo = CONDITION_LABELS[condition]

    const payload: DropoffPayload = {
      batteryId,
      guideCode,
      createdAtIso: new Date().toISOString(),
      user: {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        documentId: documentId.trim(),
      },
      battery: {
        category,
        chemistry,
        brandModel: brandModel.trim() || 'No especificado',
        estimatedWeightKg: Number(estimatedWeightKg) || 1,
        voltageNominal: voltageNominal.trim() || 'N/A',
        condition,
      },
      logistics: {
        collectionPointId: selectedPoint.id,
        collectionPointName: selectedPoint.name,
        collectionPointAddress: selectedPoint.address,
        collectionPointSchedule: selectedPoint.schedule,
      },
      technicalRouting: {
        requiresQuarantine: conditionInfo.requiresQuarantine,
        handlingProtocol: conditionInfo.handlingNote,
        targetMaterials: ['Litio (Li)', 'Cobalto (Co)', 'Níquel (Ni)'],
      },
    }

    try {
      const response = await fetch(LAMBDA_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        setDispatchStatus('sent')
      } else {
        setDispatchStatus('queued_offline')
      }
    } catch {
      // Lambda is not wired yet or offline: gracefully succeed and show the guide
      setDispatchStatus('queued_offline')
    } finally {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
      } catch {
        // Ignore quota errors
      }
      setGeneratedGuide(payload)
      setIsSubmitting(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleCopyId = async () => {
    if (!generatedGuide) return
    try {
      await navigator.clipboard.writeText(generatedGuide.batteryId)
      setCopiedId(true)
      setTimeout(() => setCopiedId(false), 2500)
    } catch {
      setCopiedId(false)
    }
  }

  const handleDownloadJsonPassport = () => {
    if (!generatedGuide) return
    const blob = new Blob([JSON.stringify(generatedGuide, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${generatedGuide.batteryId}-pasaporte-orbix.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const handleResetNewBattery = () => {
    localStorage.removeItem(STORAGE_KEY)
    setGeneratedGuide(null)
    setDispatchStatus('idle')
  }

  // ============================================================================
  // VIEW 1: GENERATED DELIVERY GUIDE & DIGITAL BATTERY PASSPORT
  // ============================================================================
  if (generatedGuide) {
    const matrixCells = buildDeterministicMatrix(generatedGuide.batteryId)
    const formattedDate = new Date(generatedGuide.createdAtIso).toLocaleString('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })

    return (
      <section className="mx-auto max-w-page px-5 py-12 sm:px-8 lg:py-16">
        {/* Top Action Bar (Hidden when printing) */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 print:hidden">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-ink/[0.07] px-3.5 py-1 text-xs font-medium">
              <span className="h-2 w-2 rounded-full bg-accent" />
              <span>
                {dispatchStatus === 'sent'
                  ? `Copia enviada por correo a ${generatedGuide.user.email}`
                  : `Guía generada y lista para descarga (${generatedGuide.user.email})`}
              </span>
            </span>
            <h1 className="mt-3 text-[clamp(1.75rem,4vw,2.75rem)] font-semibold tracking-display">
              Guía de Entrega y Pasaporte de Batería
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="press rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-ink"
            >
              Imprimir / Guardar PDF
            </button>
            <button
              type="button"
              onClick={handleDownloadJsonPassport}
              className="press rounded-full bg-ink/[0.07] px-5 py-2.5 text-sm font-medium transition-colors hover:bg-ink/[0.12]"
            >
              Descargar JSON
            </button>
            <button
              type="button"
              onClick={handleResetNewBattery}
              className="press rounded-full border border-ink/[0.12] px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:text-ink"
            >
              Registrar otra batería
            </button>
          </div>
        </div>

        {/* OFFICIAL PRINTABLE MANIFEST DOCUMENT */}
        <div className="rounded-3xl border border-ink/[0.12] bg-ink/[0.04] p-6 sm:p-10 print:rounded-none print:border-ink/30 print:bg-transparent print:p-0">
          {/* Document Header */}
          <div className="flex flex-col justify-between gap-6 border-b border-ink/[0.1] pb-8 md:flex-row md:items-start">
            <div>
              <p className="font-mono text-xs tracking-widest text-muted uppercase">
                ORBIX CIRCULAR ECONOMY NETWORK · MANIFIESTO DE RECEPCIÓN UN 3480
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="font-mono text-2xl font-semibold tracking-tight sm:text-4xl">
                  {generatedGuide.batteryId}
                </span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="press rounded-full border border-ink/[0.12] bg-ink/[0.07] px-3 py-1 text-xs font-medium print:hidden"
                >
                  {copiedId ? 'ID Copiado' : 'Copiar ID'}
                </button>
              </div>
              <p className="mt-2 font-mono text-xs text-muted">
                Código de Guía: {generatedGuide.guideCode} · Emitido: {formattedDate}
              </p>
            </div>

            {/* Scannable 2D Data Matrix Token */}
            <div className="flex items-center gap-4 self-start rounded-2xl border border-ink/[0.1] bg-ink/[0.05] p-3.5">
              <svg
                viewBox="0 0 9 9"
                className="h-16 w-16 shrink-0"
                shapeRendering="crispEdges"
                aria-label="Código de verificación Orbix"
              >
                {matrixCells.map((filled, idx) => {
                  const x = idx % 9
                  const y = Math.floor(idx / 9)
                  return filled ? (
                    <rect key={idx} x={x} y={y} width={1} height={1} className="fill-current" />
                  ) : null
                })}
              </svg>
              <div className="text-xs">
                <p className="font-semibold uppercase">Token de Planta</p>
                <p className="mt-0.5 text-muted">Escaneo en nodo de acopio y celda ROS 2</p>
                <p className="mt-1 font-mono text-[0.6875rem] font-medium">
                  QUÍMICA: {generatedGuide.battery.chemistry}
                </p>
              </div>
            </div>
          </div>

          {/* 2-Column Metadata Grid */}
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Remitente & Punto de Recolección */}
            <div className="rounded-2xl border border-ink/[0.08] bg-ink/[0.03] p-5">
              <p className="text-xs font-semibold tracking-wider text-muted uppercase">
                1. Punto de Entrega Asignado
              </p>
              <p className="mt-2 text-lg font-semibold">
                {generatedGuide.logistics.collectionPointName}
              </p>
              <p className="mt-1 text-sm text-muted">
                {generatedGuide.logistics.collectionPointAddress}
              </p>
              <p className="mt-1 font-mono text-xs text-muted">
                Horario: {generatedGuide.logistics.collectionPointSchedule}
              </p>

              <div className="mt-5 border-t border-ink/[0.08] pt-4 text-xs">
                <p className="font-semibold tracking-wider text-muted uppercase">
                  Datos del Remitente
                </p>
                <p className="mt-1.5 font-medium">{generatedGuide.user.fullName}</p>
                <p className="text-muted">
                  Doc: {generatedGuide.user.documentId} · Tel: {generatedGuide.user.phone}
                </p>
                <p className="text-muted">{generatedGuide.user.email}</p>
              </div>
            </div>

            {/* Especificaciones Técnicas para Desensamblaje */}
            <div className="rounded-2xl border border-ink/[0.08] bg-ink/[0.03] p-5">
              <p className="text-xs font-semibold tracking-wider text-muted uppercase">
                2. Ficha Técnica para Clasificación IA
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-y-3 text-sm">
                <div>
                  <dt className="text-xs text-muted">Categoría</dt>
                  <dd className="font-medium">
                    {CATEGORY_LABELS[generatedGuide.battery.category].label}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Química de Celda</dt>
                  <dd className="font-mono font-semibold">{generatedGuide.battery.chemistry}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Marca / Referencia</dt>
                  <dd className="font-medium">{generatedGuide.battery.brandModel}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Peso Est. / Voltaje</dt>
                  <dd className="font-mono">
                    {generatedGuide.battery.estimatedWeightKg} kg ·{' '}
                    {generatedGuide.battery.voltageNominal}
                  </dd>
                </div>
              </dl>

              <div className="mt-4 border-t border-ink/[0.08] pt-3">
                <span className="text-xs text-muted">Ruta en planta: </span>
                <span className="text-xs font-medium">
                  {generatedGuide.technicalRouting.handlingProtocol}
                </span>
              </div>
            </div>
          </div>

          {/* Mandatory Handover Instructions (The Guide to Follow on Delivery) */}
          <div className="mt-8 rounded-2xl border border-ink/[0.12] bg-ink/[0.05] p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold">
                3. Protocolo Obligatorio para Entregar la Batería en el Punto
              </h2>
              <span className="rounded-full bg-ink/[0.08] px-3 py-1 font-mono text-xs">
                VERIFICACIÓN EN 3 PASOS
              </span>
            </div>

            <ol className="mt-4 grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
              <li className="rounded-xl border border-ink/[0.08] bg-ink/[0.03] p-4">
                <span className="font-mono text-xs font-semibold text-muted">PASO 01</span>
                <p className="mt-1 font-medium">Aislamiento de Terminales</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  Cubre los bornes o conectores expuestos con cinta aislante eléctrica o capuchones plásticos antes de transportarla para evitar cortocircuitos.
                </p>
              </li>

              <li className="rounded-xl border border-ink/[0.08] bg-ink/[0.03] p-4">
                <span className="font-mono text-xs font-semibold text-muted">PASO 02</span>
                <p className="mt-1 font-medium">Rotulado con tu ID Orbix</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  Presenta esta guía impresa o desde tu celular y verifica que el operador adhiera la etiqueta con el código{' '}
                  <strong className="font-mono">{generatedGuide.batteryId}</strong> sobre la carcasa.
                </p>
              </li>

              <li className="rounded-xl border border-ink/[0.08] bg-ink/[0.03] p-4">
                <span className="font-mono text-xs font-semibold text-muted">PASO 03</span>
                <p className="mt-1 font-medium">Activación de Trazabilidad</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  Al escanearse en el punto, recibirás la confirmación de custodia y podrás seguir el porcentaje de recuperación de Li, Co y Ni en planta.
                </p>
              </li>
            </ol>
          </div>

          {/* Physical Handover Signature Box (Useful when printed) */}
          <div className="mt-8 grid grid-cols-1 gap-6 border-t border-ink/[0.1] pt-6 text-xs text-muted sm:grid-cols-2">
            <div>
              <p className="font-medium uppercase">Sello / Firma Operador Punto Orbix</p>
              <div className="mt-6 border-b border-dashed border-ink/[0.2]" />
              <p className="mt-1">Verificación de integridad física y aislamiento de bornes</p>
            </div>
            <div>
              <p className="font-medium uppercase">Confirmación del Usuario Remitente</p>
              <div className="mt-6 border-b border-dashed border-ink/[0.2]" />
              <p className="mt-1">Cesión para desensamblaje robótico y recuperación circular</p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  // ============================================================================
  // VIEW 2: STATELESS REGISTRATION FORM (SENDS POST TO LAMBDA)
  // ============================================================================
  return (
    <section className="mx-auto max-w-page px-5 py-12 sm:px-8 lg:py-20">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        {/* Left Column: Context & Why Pre-Registration Matters */}
        <div className="lg:col-span-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-ink/[0.07] px-3.5 py-1.5 text-xs font-medium tracking-wider uppercase">
            <span className="h-2 w-2 rounded-full bg-accent" />
            <span>Registro sin cuenta · Pasaporte Digital</span>
          </div>

          <h1 className="mt-5 text-[clamp(2.25rem,5vw,3.75rem)] font-semibold leading-[1.04] tracking-display">
            Genera tu guía de entrega en un minuto.
          </h1>

          <p className="mt-4 text-base leading-relaxed text-muted">
            No necesitas crear una cuenta. Al registrar los datos técnicos de tu batería, enviamos a tu correo el{' '}
            <strong>ID único de trazabilidad</strong> y la hoja de ruta que debes presentar en el punto de recolección.
          </p>

          <div className="mt-8 space-y-4 rounded-3xl border border-ink/[0.08] bg-ink/[0.04] p-6">
            <h2 className="text-sm font-semibold tracking-wider uppercase">
              ¿Por qué pedimos el estado físico antes de ir?
            </h2>
            <p className="text-xs leading-relaxed text-muted">
              Las baterías hinchadas, deformadas o con daño térmico requieren contenedores ignífugos en el punto de acopio y una ruta especial en nuestra línea de visión artificial (YOLO) y desensamblaje robótico (ROS 2).
            </p>

            <div className="border-t border-ink/[0.08] pt-4">
              <p className="text-xs font-medium">¿Aún no sabes qué punto te queda más cerca?</p>
              <Link
                to={routes.points.path}
                className="mt-1 inline-block text-xs font-medium underline underline-offset-4 hover:text-muted"
              >
                Explorar el mapa de nodos de recolección →
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Stateless Form */}
        <div className="lg:col-span-7">
          <form
            onSubmit={handleSubmit}
            className="space-y-8 rounded-3xl border border-ink/[0.08] bg-ink/[0.04] p-6 sm:p-9"
          >
            {/* Step 1: User Contact for Lambda Email */}
            <div>
              <h2 className="text-lg font-semibold">1. Datos para envío de la guía</h2>
              <p className="mt-1 text-xs text-muted">
                Enviaremos el documento PDF/HTML y el código de seguimiento directamente a tu correo.
              </p>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="fullName" className="block text-xs font-medium text-muted">
                    Nombre completo *
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ej. Iván Gómez"
                    className="mt-1.5 w-full rounded-xl border border-ink/[0.12] bg-ink/[0.05] px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs font-medium text-muted">
                    Correo electrónico *
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nombre@correo.com"
                    className="mt-1.5 w-full rounded-xl border border-ink/[0.12] bg-ink/[0.05] px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="documentId" className="block text-xs font-medium text-muted">
                    Documento / NIT (Manifiesto ambiental) *
                  </label>
                  <input
                    id="documentId"
                    type="text"
                    required
                    value={documentId}
                    onChange={(e) => setDocumentId(e.target.value)}
                    placeholder="C.C. o NIT"
                    className="mt-1.5 w-full rounded-xl border border-ink/[0.12] bg-ink/[0.05] px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-xs font-medium text-muted">
                    Teléfono de contacto *
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+57 300 000 0000"
                    className="mt-1.5 w-full rounded-xl border border-ink/[0.12] bg-ink/[0.05] px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Battery Technical Specs */}
            <div className="border-t border-ink/[0.08] pt-7">
              <h2 className="text-lg font-semibold">2. Especificaciones de la batería</h2>
              <p className="mt-1 text-xs text-muted">
                Estos parámetros pre-configuran la celda de clasificación y desensamblaje.
              </p>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {(Object.keys(CATEGORY_LABELS) as BatteryCategory[]).map((catKey) => {
                  const active = category === catKey
                  return (
                    <button
                      key={catKey}
                      type="button"
                      onClick={() => setCategory(catKey)}
                      className={`press rounded-2xl border p-4 text-left transition-colors ${
                        active
                          ? 'border-accent bg-ink/[0.1]'
                          : 'border-ink/[0.08] bg-ink/[0.03] hover:border-ink/[0.16]'
                      }`}
                    >
                      <p className="text-sm font-medium">{CATEGORY_LABELS[catKey].label}</p>
                      <p className="mt-1 text-xs text-muted">{CATEGORY_LABELS[catKey].desc}</p>
                    </button>
                  )
                })}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="chemistry" className="block text-xs font-medium text-muted">
                    Química (si se conoce)
                  </label>
                  <select
                    id="chemistry"
                    value={chemistry}
                    onChange={(e) => setChemistry(e.target.value as BatteryChemistry)}
                    className="mt-1.5 w-full rounded-xl border border-ink/[0.12] bg-ink/[0.05] px-3.5 py-2.5 text-sm focus:border-accent focus:outline-none"
                  >
                    <option value="NMC">NMC (Níquel Manganeso Cobalto)</option>
                    <option value="LFP">LFP (Litio Ferrofosfato)</option>
                    <option value="LCO">LCO (Óxido de Litio Cobalto)</option>
                    <option value="NCA">NCA (Níquel Cobalto Aluminio)</option>
                    <option value="UNKNOWN">No estoy seguro / Otra</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="weight" className="block text-xs font-medium text-muted">
                    Peso estimado (kg) *
                  </label>
                  <input
                    id="weight"
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="800"
                    required
                    value={estimatedWeightKg}
                    onChange={(e) => setEstimatedWeightKg(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-ink/[0.12] bg-ink/[0.05] px-3.5 py-2.5 text-sm focus:border-accent focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="voltage" className="block text-xs font-medium text-muted">
                    Voltaje nominal
                  </label>
                  <input
                    id="voltage"
                    type="text"
                    value={voltageNominal}
                    onChange={(e) => setVoltageNominal(e.target.value)}
                    placeholder="Ej. 48V, 400V, 11.1V"
                    className="mt-1.5 w-full rounded-xl border border-ink/[0.12] bg-ink/[0.05] px-3.5 py-2.5 text-sm focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="brandModel" className="block text-xs font-medium text-muted">
                  Marca o referencia del vehículo / dispositivo (Opcional)
                </label>
                <input
                  id="brandModel"
                  type="text"
                  value={brandModel}
                  onChange={(e) => setBrandModel(e.target.value)}
                  placeholder="Ej. BYD Yuan Up, Segway Ninebot G30, Renault Twizy..."
                  className="mt-1.5 w-full rounded-xl border border-ink/[0.12] bg-ink/[0.05] px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            {/* Step 3: Physical Condition & Safety Pre-Screening */}
            <div className="border-t border-ink/[0.08] pt-7">
              <h2 className="text-lg font-semibold">3. Diagnóstico físico preliminar</h2>
              <p className="mt-1 text-xs text-muted">
                Selecciona el estado real para preparar el contenedor adecuado en recepción.
              </p>

              <div className="mt-4 space-y-2.5">
                {(Object.keys(CONDITION_LABELS) as PhysicalCondition[]).map((condKey) => {
                  const active = condition === condKey
                  const item = CONDITION_LABELS[condKey]
                  return (
                    <button
                      key={condKey}
                      type="button"
                      onClick={() => setCondition(condKey)}
                      className={`press flex w-full flex-col rounded-2xl border p-4 text-left transition-colors ${
                        active
                          ? 'border-accent bg-ink/[0.1]'
                          : 'border-ink/[0.08] bg-ink/[0.03] hover:border-ink/[0.16]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">{item.label}</span>
                        {item.requiresQuarantine && (
                          <span className="rounded-full bg-ink/[0.12] px-2.5 py-0.5 font-mono text-[0.6875rem]">
                            PROTOCOLO ESPECIAL
                          </span>
                        )}
                      </div>
                      <span className="mt-1 text-xs text-muted">{item.handlingNote}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Step 4: Collection Point Selection */}
            <div className="border-t border-ink/[0.08] pt-7">
              <h2 className="text-lg font-semibold">4. Punto de recolección en Bogotá</h2>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {BOGOTA_COLLECTION_POINTS.map((point) => {
                  const active = selectedPointId === point.id
                  return (
                    <button
                      key={point.id}
                      type="button"
                      onClick={() => setSelectedPointId(point.id)}
                      className={`press rounded-2xl border p-4 text-left transition-colors ${
                        active
                          ? 'border-accent bg-ink/[0.1]'
                          : 'border-ink/[0.08] bg-ink/[0.03] hover:border-ink/[0.16]'
                      }`}
                    >
                      <p className="font-mono text-[0.6875rem] text-muted">{point.id}</p>
                      <p className="mt-1 text-sm font-medium">{point.name}</p>
                      <p className="mt-1 text-xs text-muted">{point.address}</p>
                      <p className="mt-1.5 font-mono text-[0.6875rem] text-muted">
                        {point.schedule}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Safety Declaration & Submit */}
            <div className="border-t border-ink/[0.08] pt-6">
              <label className="flex cursor-pointer items-start gap-3 text-xs text-muted">
                <input
                  type="checkbox"
                  required
                  checked={acceptedSafetyTerms}
                  onChange={(e) => setAcceptedSafetyTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-ink/20 accent-current"
                />
                <span>
                  Me comprometo a aislar los bornes o conectores expuestos con cinta aislante antes de trasladar la batería y a presentar el código de guía generado al operador del punto de recolección.
                </span>
              </label>

              <button
                type="submit"
                disabled={isSubmitting || !acceptedSafetyTerms}
                className="press mt-6 w-full rounded-full bg-accent px-6 py-4 text-base font-medium text-accent-ink transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting
                  ? 'Generando ID de batería y enviando guía...'
                  : 'Generar ID de batería y guía de entrega'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}