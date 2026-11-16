export default function SectionHeading({ eyebrow, title, description, align = 'left' }) {
  return (
    <div className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-xl'}>
      <span className="stat-chip" style={{ marginBottom: '0.9rem' }}>{eyebrow}</span>
      <h2 className="text-3xl font-bold tracking-tight text-forest md:text-4xl">{title}</h2>
      {description ? <p className="mt-4 text-base leading-7 text-secondaryText">{description}</p> : null}
    </div>
  );
}
