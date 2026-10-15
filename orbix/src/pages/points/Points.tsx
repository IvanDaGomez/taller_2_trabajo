import { useState } from 'react'
import { Link } from 'react-router-dom'
import { routes } from '@/routes'
import { useDocumentTitle } from '@/lib/useDocumentTitle'

/**
 * PASTE YOUR GOOGLE MAPS EMBED "src" URL HERE:
 * (Tutorial: Google Maps -> Search "Universidad de los Andes, Bogotá" -> Share -> Embed a map -> Copy src URL)
 * This default URL already works immediately out-of-the-box without an API key.
 */
const GOOGLE_MAPS_EMBED_SRC =
  'https://maps.google.com/maps?q=Universidad%20de%20los%20Andes%20Edificio%20Mario%20Laserna,%20Bogota,%20Colombia&t=&z=17&ie=UTF8&iwloc=&output=embed'

const GOOGLE_MAPS_DIRECT_LINK =
  'https://www.google.com/maps/search/?api=1&query=Universidad+de+los+Andes+Edificio+Mario+Laserna+Bogota'

interface CampusAccessPoint {
  id: string
  building: string
  reference: string
  acceptedCategories: string
  containmentSpec: string
}

const UNIANDES_DROP_ZONES: CampusAccessPoint[] = [
  {
    id: 'BOG-ANDES-ML',
    building: 'Edificio Mario Laserna (Bloque ML) · Recepción Laboratorios',
    reference: 'Cra. 1E # 19A-40 · Primer piso, acceso por plazoleta técnica',
    acceptedCategories: 'Micromovilidad (E-Bikes, Patinetas), Drones, Portátiles y Paquetes Piloto EV',
    containmentSpec: 'Contenedor ignífugo UN 3480 con vermiculita y estación de pre-diagnóstico óptico',
  },
]

export function Points() {
  useDocumentTitle(routes.points?.title || 'Puntos de Recolección · Orbix')

  // Toggle between dark-themed map filter and standard Google Maps colors
  const [darkMapFilter, setDarkMapFilter] = useState<boolean>(true)
  const [copiedCoords, setCopiedCoords] = useState<boolean>(false)

  const coordinatesText = '4.6026° N, 74.0653° W'

  const handleCopyCoords = async () => {
    try {
      await navigator.clipboard.writeText('4.6026, -74.0653')
      setCopiedCoords(true)
      setTimeout(() => setCopiedCoords(false), 2000)
    } catch {
      setCopiedCoords(false)
    }
  }

  return (
    <section className="mx-auto max-w-page px-5 py-12 sm:px-8 lg:py-20">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-ink/[0.07] px-3.5 py-1.5 text-xs font-medium tracking-wider uppercase">
            <span className="h-2 w-2 rounded-full bg-accent" />
            <span>Fase Piloto Bogotá · Nodo Georreferenciado PostGIS</span>
          </div>

          <h1 className="mt-5 text-[clamp(2.25rem,5.5vw,4rem)] font-semibold leading-[1.04] tracking-display">
            Punto de recolección activo.
          </h1>

          <p className="mt-4 text-base leading-relaxed text-muted">
            Actualmente nuestra operación piloto se concentra en el campus de la{' '}
            <strong>Universidad de los Andes (Bogotá D.C.)</strong>. Aquí recibimos, verificamos y clasificamos las baterías de ion-litio antes de su ingreso a la celda de visión artificial y desensamblaje robótico.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to={routes.dropoff.path}
            className="press inline-flex items-center justify-center rounded-full bg-accent px-6 py-3.5 text-sm font-medium text-accent-ink"
          >
            Generar guía para entregar aquí
          </Link>
        </div>
      </div>

      {/* MAIN GRID: LEFT NODE DETAILS + RIGHT GOOGLE MAPS EMBED */}
      <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Universidad de los Andes Node Card (5 Cols) */}
        <div className="flex flex-col justify-between gap-6 rounded-3xl border border-ink/[0.1] bg-ink/[0.04] p-6 sm:p-8 lg:col-span-5">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-full bg-accent px-3 py-1 font-mono text-xs font-semibold text-accent-ink">
                NODO ACTIVO · PILOTO
              </span>
              <span className="font-mono text-xs text-muted">ID: BOG-ANDES-01</span>
            </div>

            <h2 className="mt-5 text-2xl font-semibold tracking-tight">
              Universidad de los Andes · Sede Central
            </h2>
            <p className="mt-1 text-sm text-muted">
              Cra. 1 # 18A-12 / Cra. 1E # 19A-40 (Edificio Mario Laserna), Bogotá D.C., Colombia
            </p>

            {/* Coordinates & PostGIS Metadata */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-ink/[0.08] bg-ink/[0.03] px-4 py-3 font-mono text-xs">
              <div>
                <span className="block text-[0.6875rem] text-muted uppercase">
                  Coordenadas PostGIS (WGS84)
                </span>
                <span>{coordinatesText}</span>
              </div>
              <button
                type="button"
                onClick={handleCopyCoords}
                className="press rounded-full border border-ink/[0.12] bg-ink/[0.07] px-3 py-1 text-[0.6875rem] font-medium"
              >
                {copiedCoords ? 'Copiado' : 'Copiar GPS'}
              </button>
            </div>

            {/* Operational Details */}
            <dl className="mt-6 space-y-4 border-t border-ink/[0.08] pt-6 text-sm">
              <div>
                <dt className="text-xs font-semibold tracking-wider text-muted uppercase">
                  Horario de recepción
                </dt>
                <dd className="mt-1 font-mono text-sm">
                  Lunes a Viernes · 07:30 – 18:30
                </dd>
                <dd className="font-mono text-xs text-muted">
                  Sábados (entregas programadas) · 08:00 – 13:00
                </dd>
              </div>

              {UNIANDES_DROP_ZONES.map((zone) => (
                <div key={zone.id} className="space-y-3 pt-2">
                  <div>
                    <dt className="text-xs font-semibold tracking-wider text-muted uppercase">
                      Ubicación exacta dentro del campus
                    </dt>
                    <dd className="mt-1 font-medium">{zone.building}</dd>
                    <dd className="text-xs text-muted">{zone.reference}</dd>
                  </div>

                  <div>
                    <dt className="text-xs font-semibold tracking-wider text-muted uppercase">
                      Baterías admitidas en este nodo
                    </dt>
                    <dd className="mt-1 text-xs leading-relaxed text-muted">
                      {zone.acceptedCategories}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs font-semibold tracking-wider text-muted uppercase">
                      Infraestructura de seguridad
                    </dt>
                    <dd className="mt-1 text-xs leading-relaxed text-muted">
                      {zone.containmentSpec}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>

          {/* Direct Action Links */}
          <div className="space-y-3 border-t border-ink/[0.08] pt-6">
            <div className="flex flex-wrap gap-3">
              <Link
                to={routes.dropoff.path}
                className="press flex-1 rounded-full bg-accent px-5 py-3 text-center text-xs font-medium text-accent-ink"
              >
                Registrar entrega en Uniandes
              </Link>
              <a
                href={GOOGLE_MAPS_DIRECT_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="press inline-flex items-center justify-center rounded-full bg-ink/[0.07] px-5 py-3 text-xs font-medium transition-colors hover:bg-ink/[0.12]"
              >
                Abrir ruta en Google Maps ↗
              </a>
            </div>
            <p className="text-[0.6875rem] leading-relaxed text-muted">
              * Recuerda generar tu código <span className="font-mono">OBX-BOG-...</span> antes de acercarte al punto para agilizar el ingreso en portería.
            </p>
          </div>
        </div>

        {/* Right Column: Interactive Google Maps Embed Container (7 Cols) */}
        <div className="flex flex-col justify-between overflow-hidden rounded-3xl border border-ink/[0.1] bg-ink/[0.04] lg:col-span-7">
          {/* Map Top Telemetry Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/[0.08] px-5 py-4">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
              <span className="font-mono text-xs font-medium">
                MAPA INTERACTIVO · UNIVERSIDAD DE LOS ANDES (BOGOTÁ)
              </span>
            </div>

            <button
              type="button"
              onClick={() => setDarkMapFilter((prev) => !prev)}
              className="press rounded-full border border-ink/[0.12] bg-ink/[0.07] px-3.5 py-1 text-xs font-medium text-muted transition-colors hover:text-ink"
            >
              {darkMapFilter ? 'Ver mapa en color original' : 'Activar modo oscuro'}
            </button>
          </div>

          {/* Google Maps Iframe Wrapper */}
          <div className="relative min-h-[420px] w-full flex-1 bg-black sm:min-h-[520px]">
            <iframe
              title="Ubicación Punto de Recolección Orbix - Universidad de los Andes, Bogotá"
              src={GOOGLE_MAPS_EMBED_SRC}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              className={`h-full min-h-[420px] w-full border-0 transition-all duration-300 sm:min-h-[520px]`}
            />

            {/* Floating Bottom Overlay Badge */}
            <div className="pointer-events-none absolute right-4 bottom-4 left-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-ink/[0.12] bg-black/80 px-4 py-3 text-xs backdrop-blur-md">
              <div>
                <span className="font-semibold">Acceso recomendado:</span>{' '}
                <span className="text-muted">
                  Entrada Calle 19A / Carrera 1E (Edificio Mario Laserna)
                </span>
              </div>
              <span className="font-mono text-[0.6875rem] text-muted">
                ZONA DE CARGA TÉCNICA
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM REQUIREMENTS BAR BEFORE ARRIVING AT UNIANDES */}
      <div className="mt-10 grid grid-cols-1 gap-4 rounded-3xl border border-ink/[0.08] bg-ink/[0.03] p-6 sm:grid-cols-3 sm:p-8">
        <div>
          <span className="font-mono text-xs text-muted">REQUISITO 01</span>
          <h3 className="mt-1 text-sm font-semibold">Presenta tu Guía Orbix en Portería</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Muestra el PDF o código <span className="font-mono">OBX-BOG-...</span> enviado a tu correo para autorizar el ingreso del paquete de baterías al laboratorio piloto.
          </p>
        </div>

        <div>
          <span className="font-mono text-xs text-muted">REQUISITO 02</span>
          <h3 className="mt-1 text-sm font-semibold">Terminales Aislados</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Por normativa de seguridad del campus, todo conector expuesto debe venir cubierto con cinta aislante eléctrica antes de su recepción.
          </p>
        </div>

        <div>
          <span className="font-mono text-xs text-muted">REQUISITO 03</span>
          <h3 className="mt-1 text-sm font-semibold">Reporte de Baterías Hinchadas</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Si la celda presenta abombamiento o daño térmico, notifícalo en el formulario para disponer de la bandeja con vermiculita antes de tu llegada.
          </p>
        </div>
      </div>
    </section>
  )
}