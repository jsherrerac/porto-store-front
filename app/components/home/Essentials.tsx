const FACTS = [
  {
    title: 'Algodón de 240 g',
    body: 'Tela pesada que cae recta y no se transparenta. Se lava en frío y no encoge.',
  },
  {
    title: 'Costuras reforzadas',
    body: 'Doble pespunte en hombros y cuello, que es donde una camiseta se rinde primero.',
  },
  {
    title: 'Un corte por prenda',
    body: 'Cada modelo tiene una silueta y nos quedamos con ella. Sin versiones por temporada.',
  },
];

/** Tres datos concretos sobre la ropa. Sin animación: aquí se lee. */
export function Essentials() {
  return (
    <section className="essentials" aria-labelledby="essentials-title">
      <h2 id="essentials-title" className="essentials__title">
        Lo esencial, en serio
      </h2>
      <dl className="essentials__list">
        {FACTS.map((fact) => (
          <div key={fact.title} className="essentials__item">
            <dt>{fact.title}</dt>
            <dd>{fact.body}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
