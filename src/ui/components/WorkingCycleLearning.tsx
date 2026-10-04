import type { WorkingCycle, WorkingPhaseId } from '../../domain/working-cycle';
import type { MachineComponent } from '../../domain/entities';
import type {
  PlaybackRate,
  VisualProgress,
} from '../../visualization/contracts';

export function WorkingCycleLearning({
  content,
  components,
  phaseId,
  onPhase,
  rate,
  onRate,
  progress,
  supported,
}: {
  readonly content: WorkingCycle;
  readonly components: readonly MachineComponent[];
  readonly phaseId: WorkingPhaseId | null;
  readonly onPhase: (id: WorkingPhaseId) => void;
  readonly rate: PlaybackRate;
  readonly onRate: (rate: PlaybackRate) => void;
  readonly progress: VisualProgress;
  readonly supported: boolean;
}) {
  const index = content.phases.findIndex((p) => p.phaseId === phaseId);
  const phase = content.phases[index];
  return (
    <section aria-label="Учебные фазы рабочего цикла">
      <div
        role="group"
        aria-label="Визуальная скорость воспроизведения"
        className="viewer-controls"
      >
        {([0.5, 1, 2] as const).map((value) => (
          <button
            key={value}
            aria-pressed={rate === value}
            disabled={!supported}
            onClick={() => onRate(value)}
          >
            {value}×
          </button>
        ))}
      </div>
      <h3>Фазы рабочего цикла</h3>
      <p>{content.overlapNotice}</p>
      <ol className="phase-buttons" aria-label="Порядок учебных фаз">
        {content.phases.map((p) => (
          <li key={p.phaseId}>
            <button
              aria-pressed={phaseId === p.phaseId}
              onClick={() => onPhase(p.phaseId)}
            >
              {p.order}. {p.name}
            </button>
          </li>
        ))}
      </ol>
      <div className="viewer-controls">
        <button
          disabled={index <= 0}
          onClick={() => onPhase(content.phases[index - 1]!.phaseId)}
        >
          Предыдущая фаза
        </button>
        <button
          disabled={index < 0 || index === content.phases.length - 1}
          onClick={() => onPhase(content.phases[index + 1]!.phaseId)}
        >
          Следующая фаза
        </button>
      </div>
      <p data-current-phase={phaseId ?? 'none'}>
        Текущая учебная фаза: {phase ? phase.name : 'не выбрана'}
      </p>
      {phase && (
        <article aria-label="Объяснение фазы">
          <h4>
            {phase.order}. {phase.name}
          </h4>
          <p>{phase.goal}</p>
          <p>{phase.movement}</p>
          <p>
            Основные компоненты:{' '}
            {phase.componentIds
              .map((id) => components.find((c) => c.id === id)!.name)
              .join(', ')}
            .
          </p>
          {phase.visualNote && <p className="notice">{phase.visualNote}</p>}
          {content.visual.segments[index]!.milestones.map((m) => (
            <p key={m.timeSeconds}>
              Визуальная отметка {m.timeSeconds.toFixed(3)} с: {m.meaning}
            </p>
          ))}
        </article>
      )}
      <label htmlFor="visual-cycle-progress">
        Визуальный прогресс демонстрации
      </label>
      <progress
        id="visual-cycle-progress"
        max={progress.durationSeconds || 1}
        value={progress.timeSeconds}
      />
      <p data-visual-time={progress.timeSeconds}>
        {progress.pose === 'neutral'
          ? 'Статическая нейтральная поза; визуальное время клипа не активно.'
          : `${progress.timeSeconds.toFixed(3)} / ${progress.durationSeconds.toFixed(3)} с визуальной демонстрации`}
      </p>
    </section>
  );
}
