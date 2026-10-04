import type { MachineFoundation } from '../../domain/foundation';
import type { MachineComponent } from '../../domain/entities';
export function TransportLearning({
  content,
}: {
  readonly content: NonNullable<MachineFoundation['transportCycle']>;
}) {
  return (
    <section className="foundation-learning" aria-label="Транспортный цикл">
      <h2>Транспортный цикл</h2>
      <ol>
        {content.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <dl>
        {content.factors.map((f) => (
          <div key={f.name}>
            <dt>{f.name}</dt>
            <dd>{f.explanation}</dd>
          </div>
        ))}
      </dl>
      <p>{content.distanceExplanation}</p>
      <p>{content.followUp}</p>
    </section>
  );
}
export function WorkingPrinciple({
  content,
  components,
}: {
  readonly content: NonNullable<MachineFoundation['workingPrinciple']>;
  readonly components: readonly MachineComponent[];
}) {
  return (
    <section aria-label="Как работает">
      <h2>Как работает</h2>
      <p>{content.intro}</p>
      {content.paragraphs.map((p) => (
        <p key={p}>{p}</p>
      ))}
      <h3>Функциональная цепочка</h3>
      <ol>
        {content.chain.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
      <h3>Функциональные группы</h3>
      <ul>
        {content.groups.map((g, i) => (
          <li key={i}>
            {g.componentIds
              .map((id) => components.find((c) => c.id === id)?.name)
              .join(' ↔ ')}
            {g.purpose && <> — {g.purpose}</>}
          </li>
        ))}
      </ul>
      {content.explanations.map((p) => (
        <p key={p}>{p}</p>
      ))}
    </section>
  );
}
