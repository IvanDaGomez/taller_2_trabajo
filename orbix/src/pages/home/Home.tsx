import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { routes } from '@/routes'
import { useDocumentTitle } from '@/lib/useDocumentTitle'

const HERO_VIDEO_SRC = '/video.mp4'

interface OrbixStat {
  value: string
  label: string
  context: string
}

const ORBIX_STATS: OrbixStat[] = [
  {
    value: '37% → 80%',
    label: 'Brecha de recolección en Colombia',
    context: 'Hoy solo se recolecta el 37% de las baterías al final de su vida útil; Orbix apunta a las metas globales del 80%.',
  },
  {
    value: '85–95%',
    label: 'Recuperación de materiales críticos',
    context: 'Separación previa de alta pureza para reintegrar litio, cobalto y níquel evitando la trituración masiva sin control.',
  },
  {
    value: '2M L / Ton',
    label: 'Impacto hídrico evitado',
    context: 'Cada tonelada de litio primario extraída en el Triángulo del Litio consume cerca de 2 millones de litros de agua.',
  },
]

interface SystemPillar {
  id: string
  badge: string
  title: string
  description: string
  specs: string[]
}

const ORBIX_PILLARS: SystemPillar[] = [
  {
    id: '01',
    badge: 'RED CIUDADANA & GEOLOCALIZACIÓN',
    title: 'Acopio georreferenciado y trazabilidad en tiempo real',
    description:
      'Conectamos a propietarios de vehículos eléctricos y dispositivos con puntos de recolección accesibles en Bogotá, eliminando las barreras logísticas actuales y registrando cada entrega.',
    specs: ['PostGIS / Geolocalización', 'Trazabilidad de ciclo cerrado', 'Registro de estado de batería'],
  },
  {
    id: '02',
    badge: 'EDGE AI & VISIÓN COMPUTACIONAL',
    title: 'Clasificación inteligente sin latencia en planta',
    description:
      'Modelos de visión artificial (YOLO) desplegados en el edge junto con cámaras de profundidad identifican formatos, marcas y defectos físicos (celdas hinchadas o deformadas) antes del desmonte.',
    specs: ['Inferencia YOLO en el Edge', 'Cámaras de profundidad / espectrales', 'Detección de riesgo térmico'],
  },
  {
    id: '03',
    badge: 'ROBÓTICA AUTÓNOMA (ROS 2)',
    title: 'Desensamblaje minucioso asistido por IA',
    description:
      'Brazos robóticos coordinados desmontan las baterías de forma segura para separar sus componentes internos con alta pureza, reduciendo el riesgo humano y la huella ambiental del reciclaje.',
    specs: ['Orquestación con Linux / ROS 2', 'Coordinación Multi-Agente (MARL)', 'Reintegración directa a producción'],
  },
]

export function Home() {
  useDocumentTitle(routes.home.title)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [isPlaying, setIsPlaying] = useState<boolean>(true)
  // True = inverts white video background to blend seamlessly into dark UI
  // False = keeps raw white video with a heavy dark overlay scrim
  const [blendWhiteBg, setBlendWhiteBg] = useState<boolean>(true)

  const togglePlayback = () => {
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      void video.play()
      setIsPlaying(true)
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }

  return (
    <div className="relative overflow-hidden">
      {/* HERO SECTION WITH BACKGROUND LANDSCAPE VIDEO */}
      <section className="relative isolate flex min-h-[calc(100dvh-3rem)] flex-col justify-center overflow-hidden">
        {/* Background Video Layer */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-black">
          <video
            ref={videoRef}
            src={HERO_VIDEO_SRC}
            autoPlay
            loop
            muted
            playsInline
            className={
              blendWhiteBg
                ? 'h-full w-full object-cover opacity-85 invert hue-rotate-180 mix-blend-screen transition-opacity duration-500'
                : 'h-full w-full object-cover opacity-55 brightness-75 contrast-125 transition-opacity duration-500'
            }
          />

          {/* Directional Dark Gradient Scrims to protect text legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/35" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
        </div>

        {/* Original Hero Content Container */}
        <div className="mx-auto flex w-full max-w-page flex-col justify-center px-5 py-20 sm:px-8">
          <div className="mb-6 inline-flex w-fit items-center gap-2.5 rounded-full border border-ink/[0.12] bg-ink/[0.07] px-4 py-1.5 text-xs font-medium tracking-wider uppercase backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-accent" />
            <span>Orbix · Economía Circular &amp; Robótica Autónoma</span>
          </div>

          <h1 className="max-w-4xl text-[clamp(2.75rem,8.5vw,6rem)] font-semibold leading-[1.02] tracking-display">
            La batería que terminó su vida útil, otra vez en producción.
          </h1>

          <p className="mt-6 max-w-xl text-[1.1875rem] leading-snug text-muted">
            Entrega tu batería de ion-litio en un punto cercano y sigue cómo se recuperan el litio, el cobalto y el níquel mediante visión artificial y desensamblaje robótico.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              to={routes.dropoff.path}
              className="press rounded-full bg-accent px-6 py-3 text-[1.0625rem] font-medium text-accent-ink"
            >
              Entregar una batería
            </Link>
            <Link
              to={routes.points.path}
              className="press rounded-full bg-ink/[0.07] px-6 py-3 text-[1.0625rem] font-medium backdrop-blur-md transition-colors hover:bg-ink/[0.12]"
            >
              Ver puntos de recolección
            </Link>
          </div>
        </div>

        {/* Subtle Video Controls & White-BG Mode Switcher in Hero Corner */}
        <div className="mx-auto flex w-full max-w-page items-center justify-between px-5 pb-6 sm:px-8">
          <div className="hidden items-center gap-3 text-xs text-muted sm:flex">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
            <span>Sistema dual: App de trazabilidad ciudadana + Planta de desensamblaje IA</span>
          </div>

          {/* <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setBlendWhiteBg((prev) => !prev)}
              className="press rounded-full border border-ink/[0.1] bg-ink/[0.07] px-3.5 py-1.5 text-xs font-medium text-muted backdrop-blur-md transition-colors hover:text-ink"
              title="Alternar el tratamiento del fondo blanco del video"
            >
              {blendWhiteBg ? 'Modo: Fondo Invertido' : 'Modo: Video Original'}
            </button>

            <button
              type="button"
              onClick={togglePlayback}
              className="press rounded-full border border-ink/[0.1] bg-ink/[0.07] px-3.5 py-1.5 text-xs font-medium text-muted backdrop-blur-md transition-colors hover:text-ink"
            >
              {isPlaying ? 'Pausar video' : 'Reproducir'}
            </button>
          </div> */}
        </div>
      </section>

      {/* ORBIX INFORMATION & ARCHITECTURE SECTION (DARK UI) */}
      <section className="mx-auto max-w-page border-t border-ink/[0.08] px-5 py-20 sm:px-8">
        {/* Problem & Impact Metrics */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {ORBIX_STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-3xl border border-ink/[0.08] bg-ink/[0.04] p-7 backdrop-blur-sm"
            >
              <p className="text-3xl font-semibold tracking-display sm:text-4xl">{stat.value}</p>
              <h2 className="mt-2 text-base font-medium">{stat.label}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{stat.context}</p>
            </div>
          ))}
        </div>

        {/* Section Header */}
        <div className="mt-20 max-w-2xl">
          <p className="text-xs font-semibold tracking-wider text-muted uppercase">
            ¿Qué es Orbix?
          </p>
          <h2 className="mt-3 text-[clamp(1.875rem,4vw,3rem)] font-semibold leading-[1.08] tracking-display">
            Infraestructura de economía circular para la electromovilidad.
          </h2>
          <p className="mt-4 text-[1.0625rem] leading-relaxed text-muted">
            Con apenas un 1% de recuperación global de materiales en baterías de ion-litio y el crecimiento acelerado de vehículos eléctricos en Colombia, Orbix integra una plataforma digital de recolección con celdas de desensamblaje automatizado para cerrar el ciclo industrial.
          </p>
        </div>

        {/* 3-Column Technical Pillars */}
        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {ORBIX_PILLARS.map((pillar) => (
            <article
              key={pillar.id}
              className="flex flex-col justify-between rounded-3xl border border-ink/[0.08] bg-ink/[0.04] p-7 transition-colors hover:border-ink/[0.15]"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-ink/[0.07] px-3 py-1 text-[0.6875rem] font-medium tracking-wider text-muted uppercase">
                    {pillar.badge}
                  </span>
                  <span className="font-mono text-xs text-muted">{pillar.id}</span>
                </div>

                <h3 className="mt-6 text-xl font-semibold leading-snug">{pillar.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{pillar.description}</p>
              </div>

              <ul className="mt-8 space-y-2 border-t border-ink/[0.08] pt-5">
                {pillar.specs.map((spec) => (
                  <li key={spec} className="flex items-center gap-2.5 text-xs text-muted">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    <span>{spec}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}