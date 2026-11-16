import Link from 'next/link';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Building2,
  Check,
  CheckCircle2,
  CircleDot,
  ClipboardCheck,
  FileImage,
  Layers3,
  MapPin,
  MapPinned,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Users
} from 'lucide-react';
import SectionHeading from '@/components/ui/SectionHeading';

const steps = [
  {
    icon: UploadCloud,
    number: '01',
    title: 'Upload a road image',
    description: 'Share a clear photo of the road issue from your phone or computer.'
  },
  {
    icon: ScanSearch,
    number: '02',
    title: 'AI detects potholes',
    description: 'Computer vision scans the image and highlights potential potholes.'
  },
  {
    icon: ClipboardCheck,
    number: '03',
    title: 'Generate a report',
    description: 'Review the detection and create a trackable road issue report.'
  },
  {
    icon: MapPinned,
    number: '04',
    title: 'Map and track',
    description: 'Follow the report as it moves through verification and repair.'
  }
];

const capabilities = [
  {
    icon: ScanSearch,
    eyebrow: 'Computer vision',
    title: 'AI pothole detection',
    description: 'Turn road photos into clear, reviewable detections with confidence details.'
  },
  {
    icon: MapPinned,
    eyebrow: 'Location intelligence',
    title: 'GIS mapping',
    description: 'Bring reported issues together in a geographic view for better context.'
  },
  {
    icon: Users,
    eyebrow: 'Community powered',
    title: 'Citizen reporting',
    description: 'Give road users a straightforward way to share evidence of road hazards.'
  },
  {
    icon: Building2,
    eyebrow: 'Municipal operations',
    title: 'Repair tracking',
    description: 'Move issues through a visible workflow from report to resolution.'
  }
];

const previewReports = [
  { title: 'Pothole detected', location: 'Oak Street · East District', status: 'Reported', tone: 'reported' },
  { title: 'Road surface damage', location: 'Riverside Avenue', status: 'In progress', tone: 'progress' },
  { title: 'Pothole repair', location: 'Cedar Lane · North Ward', status: 'Resolved', tone: 'resolved' }
];

function DetectionScene() {
  return (
    <div
      className="road-scene card-shadow"
      role="img"
      aria-label="Road image illustration showing three potholes identified by AI detection boxes"
    >
      <svg className="road-scene__art" viewBox="0 0 760 590" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <linearGradient id="sceneSky" x1="380" y1="0" x2="380" y2="310" gradientUnits="userSpaceOnUse">
            <stop stopColor="#829078" />
            <stop offset="1" stopColor="#D6D1B9" />
          </linearGradient>
          <linearGradient id="roadSurface" x1="380" y1="185" x2="380" y2="590" gradientUnits="userSpaceOnUse">
            <stop stopColor="#475149" />
            <stop offset=".48" stopColor="#343C37" />
            <stop offset="1" stopColor="#252D29" />
          </linearGradient>
          <linearGradient id="roadEdge" x1="380" y1="170" x2="380" y2="590" gradientUnits="userSpaceOnUse">
            <stop stopColor="#C8B48A" stopOpacity=".18" />
            <stop offset="1" stopColor="#C8B48A" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="pothole" cx="0" cy="0" r="1" gradientTransform="matrix(0 29 -48 0 0 0)" gradientUnits="userSpaceOnUse">
            <stop stopColor="#111815" />
            <stop offset=".68" stopColor="#1B211E" />
            <stop offset="1" stopColor="#727267" stopOpacity=".72" />
          </radialGradient>
          <pattern id="roadGrain" width="38" height="38" patternUnits="userSpaceOnUse">
            <circle cx="5" cy="8" r="1" fill="#F5F0E6" fillOpacity=".1" />
            <circle cx="24" cy="20" r=".8" fill="#F5F0E6" fillOpacity=".09" />
            <circle cx="13" cy="32" r=".7" fill="#F5F0E6" fillOpacity=".08" />
          </pattern>
          <filter id="softShadow" x="-30%" y="-30%" width="160%" height="180%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
        </defs>
        <rect width="760" height="590" fill="url(#sceneSky)" />
        <path d="M0 245 161 173l94 52 117-75 102 73 127-77 159 84v91H0v-76Z" fill="#596B54" />
        <path d="m0 282 160-73 93 47 120-75 104 73 126-75 157 80v65H0v-42Z" fill="#7B8467" />
        <path d="M0 280h760v57H0z" fill="#C5C1A9" fillOpacity=".52" />
        <path d="M240 250h280l280 340H0l240-340Z" fill="url(#roadSurface)" />
        <path d="M240 250h280l280 340H0l240-340Z" fill="url(#roadGrain)" />
        <path d="M240 250 0 590h22l250-340h-32ZM520 250l240 340h-22L488 250h32Z" fill="url(#roadEdge)" />
        <path d="M376 251h8l10 78h-27l9-78Zm-28 122h64l9 76H338l10-76Zm-43 123h150l14 94H292l13-94Z" fill="#F5F0E6" fillOpacity=".72" />
        <path d="M258 279 102 480M502 279l156 201" stroke="#E8DFC8" strokeOpacity=".16" strokeWidth="3" />
        <path d="M93 326h80m-101 26h70m446-26h80m-61 26h70" stroke="#F5F0E6" strokeOpacity=".24" strokeWidth="3" strokeLinecap="round" />
        <ellipse cx="292" cy="438" rx="72" ry="29" fill="#101613" fillOpacity=".36" filter="url(#softShadow)" />
        <path d="M246 434c9-15 28-23 51-20 21 3 37 15 44 29-8 12-28 19-50 17-22-2-39-12-45-26Z" fill="url(#pothole)" />
        <ellipse cx="459" cy="365" rx="46" ry="20" fill="#111714" fillOpacity=".28" filter="url(#softShadow)" />
        <path d="M425 364c7-11 20-17 36-15 16 1 29 9 34 19-7 9-21 14-37 13-16-1-28-7-33-17Z" fill="url(#pothole)" />
        <ellipse cx="405" cy="508" rx="55" ry="21" fill="#101613" fillOpacity=".34" filter="url(#softShadow)" />
        <path d="M366 505c7-13 22-20 41-18 18 2 32 10 38 21-7 10-23 16-42 14-18-1-32-8-37-17Z" fill="url(#pothole)" />
        <g stroke="#C8B48A" strokeWidth="2">
          <rect x="227" y="406" width="127" height="63" rx="8" />
          <rect x="411" y="340" width="92" height="49" rx="7" />
          <rect x="350" y="481" width="119" height="54" rx="8" />
        </g>
        <g fontFamily="Arial, sans-serif" fontSize="12" fontWeight="700">
          <rect x="227" y="383" width="112" height="23" rx="6" fill="#C8B48A" />
          <text x="237" y="399" fill="#1E3B2F">POTHOLE · 94%</text>
          <rect x="411" y="317" width="112" height="23" rx="6" fill="#C8B48A" />
          <text x="421" y="333" fill="#1E3B2F">POTHOLE · 87%</text>
          <rect x="350" y="458" width="112" height="23" rx="6" fill="#C8B48A" />
          <text x="360" y="474" fill="#1E3B2F">POTHOLE · 91%</text>
        </g>
        <path d="M0 0h760v590H0z" fill="url(#sceneSky)" fillOpacity=".04" />
      </svg>

      <div className="road-scene__topbar">
        <span className="road-scene__status"><span /> AI VISION PREVIEW</span>
        <span className="road-scene__frame">FRAME 014 · ROAD SURFACE</span>
      </div>
      <div className="road-scene__scanline" />
      <div className="road-scene__caption">
        <span className="road-scene__caption-icon"><ScanSearch size={17} /></span>
        <span>
          <strong>Detection overlay</strong>
          <small>Illustrative visualization</small>
        </span>
        <span className="road-scene__count">03 <small>issues</small></span>
      </div>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="preview-window">
      <div className="preview-window__topbar">
        <div className="preview-dots" aria-hidden="true"><i /><i /><i /></div>
        <span>ROAD EYE / CITIZEN WORKSPACE</span>
        <span className="preview-window__sample">ILLUSTRATIVE PREVIEW</span>
      </div>
      <div className="preview-dashboard">
        <aside className="preview-sidebar" aria-label="Illustrative dashboard navigation">
          <div className="preview-brand">
            <span>R</span>
            <strong>RoadEye <small>AI</small></strong>
          </div>
          <div className="preview-nav-item preview-nav-item--active"><Layers3 size={15} /> Overview</div>
          <div className="preview-nav-item"><ScanSearch size={15} /> Detect issue</div>
          <div className="preview-nav-item"><MapPinned size={15} /> Road map</div>
          <div className="preview-nav-item"><ClipboardCheck size={15} /> My reports</div>
          <div className="preview-sidebar__note">
            <Sparkles size={14} />
            <span>Every report helps make roads safer.</span>
          </div>
        </aside>
        <div className="preview-main">
          <div className="preview-main__heading">
            <div>
              <span>YOUR ROAD IMPACT</span>
              <h3>Good morning, Alex</h3>
              <p>A clear view of the road issues you have shared.</p>
            </div>
            <span className="preview-avatar">A</span>
          </div>
          <div className="preview-metrics">
            <div><small>My reports</small><strong>08</strong><span><FileImage size={13} /> submitted</span></div>
            <div><small>In progress</small><strong>03</strong><span><CircleDot size={13} /> being reviewed</span></div>
            <div><small>Resolved</small><strong>05</strong><span><CheckCircle2 size={13} /> completed</span></div>
          </div>
          <div className="preview-report-panel">
            <div className="preview-report-panel__heading">
              <div><strong>Recent reports</strong><small>Sample information for interface preview</small></div>
              <span>VIEW ALL <ArrowUpRight size={13} /></span>
            </div>
            <div className="preview-report-list">
              {previewReports.map((report) => (
                <div className="preview-report" key={report.title + report.location}>
                  <span className="preview-report__icon"><MapPin size={14} /></span>
                  <span className="preview-report__details"><strong>{report.title}</strong><small>{report.location}</small></span>
                  <span className={`preview-report__status preview-report__status--${report.tone}`}><i />{report.status}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="preview-map-strip">
            <div className="preview-map-strip__graphic" aria-hidden="true">
              <span /><span /><span /><i /><i /><i />
            </div>
            <div><strong>Road issues, in context</strong><small>Keep reports and places connected.</small></div>
            <MapPinned size={18} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="page-bg landing-page">
      <header className="container-shell sticky top-0 z-20 py-5 backdrop-blur" style={{ background: 'rgba(249, 246, 242, 0.75)' }}>
        <div className="mx-auto flex max-w-[1200px] items-center justify-between rounded-[24px] border border-border bg-white/70 px-4 py-3 shadow-card">
          <Link href="/" className="flex items-center gap-3" aria-label="RoadEye AI home">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-forest text-base font-bold text-white">R</span>
            <span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-sage">Road intelligence</span>
              <span className="block text-lg font-bold text-forest">RoadEye AI</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-darkText md:flex" aria-label="Main navigation">
            <Link href="#how-it-works">How it works</Link>
            <Link href="#platform">Platform</Link>
            <Link href="#map">Map</Link>
            <Link href="#municipal">Municipal</Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="secondary-btn px-3 py-2.5 text-sm sm:px-4">Login</Link>
            <Link href="/register" className="primary-btn px-3 py-2.5 text-sm sm:px-4">Get started</Link>
          </div>
        </div>
      </header>

      <main>
        <section className="container-shell section-shell landing-hero pt-8 md:pt-14">
          <div className="mx-auto grid max-w-[1200px] items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
            <div className="landing-reveal">
              <span className="stat-chip"><Sparkles size={14} /> AI-powered road monitoring</span>
              <h1 className="mt-6 max-w-xl text-4xl font-black leading-[1.02] tracking-[-0.06em] text-forest sm:text-5xl lg:text-[3rem] xl:text-[3.75rem]">
                Smarter Roads.<br />Safer Journeys.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-secondaryText">
                AI-powered road intelligence that detects potholes, maps infrastructure risks and helps communities build safer roads.
              </p>

              <div className="mt-8 flex flex-wrap gap-3 sm:gap-4">
                <Link href="/register" className="primary-btn">
                  Report a Road Issue <ArrowRight className="ml-2" size={18} />
                </Link>
                <Link href="#platform" className="secondary-btn">Explore the Platform</Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-secondaryText">
                <span className="flex items-center gap-2"><CheckCircle2 className="text-sage" size={18} /> AI detection</span>
                <span className="flex items-center gap-2"><CheckCircle2 className="text-sage" size={18} /> GIS mapping</span>
                <span className="flex items-center gap-2"><CheckCircle2 className="text-sage" size={18} /> Repair tracking</span>
              </div>
              <a href="#how-it-works" className="landing-scroll-cue mt-10 hidden items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-sage sm:inline-flex">
                See how it works <ArrowDown size={14} />
              </a>
            </div>

            <div className="landing-reveal landing-reveal--delayed">
              <DetectionScene />
            </div>
          </div>
        </section>

        <section id="platform" className="container-shell section-shell landing-platform">
          <div className="mx-auto max-w-[1200px]">
            <div className="mb-9 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <SectionHeading
                eyebrow="The citizen workspace"
                title="A clear path from report to repair"
                description="A focused dashboard helps citizens see what they have reported and follow each issue’s progress."
              />
              <span className="illustrative-note"><Sparkles size={14} /> Illustrative preview · Sample data</span>
            </div>
            <div className="landing-reveal">
              <DashboardPreview />
            </div>
          </div>
        </section>

        <section id="how-it-works" className="container-shell section-shell">
          <div className="mx-auto max-w-[1200px]">
            <SectionHeading
              eyebrow="How it works"
              title="From road photo to tracked action"
              description="A simple, connected workflow gives communities and municipal teams a shared view of road issues."
              align="center"
            />
            <div className="landing-steps mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map(({ icon: Icon, number, title, description }) => (
                <article key={number} className="landing-step landing-reveal">
                  <div className="landing-step__top">
                    <span className="landing-step__icon"><Icon size={21} /></span>
                    <span className="landing-step__number">{number}</span>
                  </div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                  <span className="landing-step__bottom" aria-hidden="true"><ArrowRight size={15} /></span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="container-shell section-shell landing-capabilities">
          <div className="mx-auto max-w-[1200px]">
            <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
              <SectionHeading
                eyebrow="A connected platform"
                title="Road intelligence, built for everyone"
                description="Bring detection, location, community evidence and repair workflows together in one considered experience."
              />
              <div className="landing-capability-grid grid gap-3 sm:grid-cols-2">
                {capabilities.map(({ icon: Icon, eyebrow, title, description }) => (
                  <article key={title} className="landing-feature landing-reveal">
                    <div className="landing-feature__icon"><Icon size={20} /></div>
                    <span>{eyebrow}</span>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="map" className="container-shell section-shell">
          <div className="mx-auto grid max-w-[1200px] items-center gap-9 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="landing-map-panel landing-reveal" role="img" aria-label="Illustrative road issue map with location pins">
              <div className="landing-map-panel__roads" aria-hidden="true">
                <span className="landing-road landing-road--one" />
                <span className="landing-road landing-road--two" />
                <span className="landing-road landing-road--three" />
                <span className="landing-road landing-road--four" />
                <span className="landing-map-pin landing-map-pin--one"><MapPin size={17} /></span>
                <span className="landing-map-pin landing-map-pin--two"><MapPin size={17} /></span>
                <span className="landing-map-pin landing-map-pin--three"><MapPin size={17} /></span>
              </div>
              <span className="landing-map-label"><MapPinned size={15} /> ROAD ISSUE MAP · ILLUSTRATION</span>
              <div className="landing-map-legend">
                <span><i className="legend-dot legend-dot--reported" /> Reported</span>
                <span><i className="legend-dot legend-dot--progress" /> In progress</span>
                <span><i className="legend-dot legend-dot--resolved" /> Resolved</span>
              </div>
            </div>
            <div className="landing-reveal">
              <SectionHeading
                eyebrow="Location intelligence"
                title="See the issue in its neighbourhood"
                description="GIS mapping connects each road report to place, helping citizens follow local issues and helping repair teams understand where attention is needed."
              />
              <ul className="landing-check-list mt-7">
                <li><Check size={17} /> View road reports alongside nearby issues.</li>
                <li><Check size={17} /> Follow status from report through repair.</li>
                <li><Check size={17} /> Keep community and municipal work in context.</li>
              </ul>
              <Link href="/map" className="landing-text-link mt-7">Explore the road map <ArrowRight size={16} /></Link>
            </div>
          </div>
        </section>

        <section id="municipal" className="container-shell section-shell landing-community">
          <div className="mx-auto grid max-w-[1200px] gap-4 md:grid-cols-2">
            <article className="landing-audience-card landing-audience-card--dark landing-reveal">
              <span className="landing-audience-card__icon"><Users size={21} /></span>
              <span className="landing-audience-card__eyebrow">For communities</span>
              <h2>Make every report count.</h2>
              <p>Share road evidence, keep an eye on progress and help your community surface the issues that matter.</p>
              <Link href="/register">Start reporting <ArrowRight size={15} /></Link>
            </article>
            <article className="landing-audience-card landing-reveal">
              <span className="landing-audience-card__icon"><Building2 size={21} /></span>
              <span className="landing-audience-card__eyebrow">For municipal teams</span>
              <h2>Turn visibility into action.</h2>
              <p>Bring reports, verification and repair status into a clearer operational workflow.</p>
              <Link href="/login">Open your workspace <ArrowRight size={15} /></Link>
            </article>
          </div>
        </section>

        <section className="container-shell pb-16 pt-4 md:pb-20">
          <div className="landing-cta mx-auto max-w-[1200px] landing-reveal">
            <div className="landing-cta__orb" aria-hidden="true"><BadgeCheck size={34} /></div>
            <span className="landing-cta__eyebrow">A better road starts with a clear report</span>
            <h2>Build safer roads together.</h2>
            <p>Help bring road issues into view—and keep every report moving toward a response.</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link href="/register" className="landing-cta__button">Report a road issue <ArrowRight size={17} /></Link>
              <Link href="/login" className="landing-cta__secondary">Sign in to RoadEye</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="container-shell mx-auto max-w-[1200px] py-8">
          <div className="landing-footer__main">
            <Link href="/" className="flex items-center gap-3" aria-label="RoadEye AI home">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-forest text-base font-bold text-white">R</span>
              <span>
                <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-sage">Road intelligence</span>
                <span className="block text-lg font-bold text-forest">RoadEye AI</span>
              </span>
            </Link>
            <p>Clearer road data. More connected communities.</p>
            <nav aria-label="Footer navigation">
              <Link href="#how-it-works">How it works</Link>
              <Link href="#platform">Platform</Link>
              <Link href="#map">Map</Link>
              <Link href="/login">Login</Link>
              <Link href="/register">Get started</Link>
            </nav>
          </div>
          <div className="landing-footer__bottom">
            <span>RoadEye AI · Road intelligence platform</span>
            <span><ShieldCheck size={14} /> Road intelligence for safer journeys</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
