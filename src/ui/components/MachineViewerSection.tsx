import { lazy, Suspense, useCallback, useMemo, useState } from 'react';
import type { Asset3D } from '../../domain/asset3d';
import type { MachineComponent } from '../../domain/entities';
import type { MachineComponentId } from '../../domain/ids';
import type {
  ViewerLoadState,
  ViewerAnimationState,
  ViewerCommand,
  Visibility,
} from '../../visualization/contracts';
import type {
  PlaybackRate,
  VisualProgress,
} from '../../visualization/contracts';
import type { WorkingCycle, WorkingPhaseId } from '../../domain/working-cycle';
import { resolveWorkingPhase } from '../../application/working-cycle';
import { WorkingCycleLearning } from './WorkingCycleLearning';
import { showAll } from '../../visualization/contracts';
import { EXCAVATOR_WORKING_CYCLE } from '../../domain/activities';
const ProductionViewer = lazy(
  () => import('../../visualization/ProductionViewer'),
);
export function MachineViewerSection({
  asset,
  components,
  cycle,
  learningCycle,
}: {
  readonly asset: Asset3D;
  readonly components: readonly (MachineComponent & {
    readonly explanation?: string | undefined;
  })[];
  readonly cycle: boolean;
  readonly learningCycle?: WorkingCycle | undefined;
}) {
  const [selected, setSelected] = useState<MachineComponentId | null>(null);
  const [visibility, setVisibility] = useState<Visibility>(showAll);
  const [load, setLoad] = useState<ViewerLoadState>({ status: 'loading' });
  const [animation, setAnimation] = useState<ViewerAnimationState>({
    status: 'unsupported',
    reason: 'unmapped',
  });
  const [command, setCommand] = useState<ViewerCommand>({
    kind: 'reset',
    sequence: 0,
  });
  const [phaseId, setPhaseId] = useState<WorkingPhaseId | null>(null);
  const [rate, setRate] = useState<PlaybackRate>(1);
  const [progress, setProgress] = useState<VisualProgress>({
    pose: 'neutral',
    timeSeconds: 0,
    durationSeconds: 0,
  });
  const boundaries = useMemo(
    () => learningCycle?.visual.segments.slice(2).map((s) => s.startSeconds),
    [learningCycle],
  );
  const onProgress = useCallback(
    (value: VisualProgress) => {
      setProgress(value);
      if (value.pose === 'neutral') setPhaseId(null);
      else if (value.pose === 'playing' && learningCycle)
        setPhaseId(resolveWorkingPhase(learningCycle, value.timeSeconds));
    },
    [learningCycle],
  );
  const choosePhase = (id: WorkingPhaseId) => {
    const segment = learningCycle?.visual.segments.find(
      (s) => s.phaseId === id,
    );
    if (!segment) return;
    setPhaseId(id);
    setCommand((previous) => ({
      kind: 'seek',
      timeSeconds: segment.startSeconds,
      sequence: previous.sequence + 1,
    }));
  };
  const changeRate = (value: PlaybackRate) => {
    setRate(value);
    setCommand((previous) => ({
      kind: 'set-playback-rate',
      rate: value,
      sequence: previous.sequence + 1,
    }));
  };
  const onSelect = useCallback(
    (id: MachineComponentId | null) => setSelected(id),
    [],
  );
  const onAnimation = useCallback(
    (state: ViewerAnimationState) => setAnimation(state),
    [],
  );
  const onLoad = useCallback((state: ViewerLoadState) => {
    setLoad(state);
    if (state.status !== 'ready') {
      setCommand((previous) => ({
        kind: 'reset',
        sequence: previous.sequence + 1,
      }));
      setAnimation({ status: 'unsupported', reason: 'unmapped' });
    }
  }, []);
  const send = (kind: 'play' | 'pause' | 'reset') =>
    setCommand((previous) => ({ kind, sequence: previous.sequence + 1 }));
  const component = components.find((component) => component.id === selected);
  const ready = load.status === 'ready';
  const supported = ready && animation.status === 'available';
  return (
    <section
      aria-label={cycle ? 'Демонстрация рабочего цикла' : 'Конструкция машины'}
    >
      <h2>{cycle ? 'Рабочий цикл' : 'Конструкция'}</h2>
      {cycle && (
        <p className="notice">
          {learningCycle?.timingNotice ??
            'Визуальная демонстрация движений; время не используется в инженерных расчётах.'}
        </p>
      )}
      <Suspense fallback={<p role="status">Подготовка 3D-viewer…</p>}>
        <ProductionViewer
          asset={asset}
          activity={EXCAVATOR_WORKING_CYCLE}
          selected={selected}
          visibility={visibility}
          command={command}
          onSelect={onSelect}
          onLoad={onLoad}
          onAnimation={onAnimation}
          onProgress={onProgress}
          progressBoundaries={boundaries}
        />
      </Suspense>
      {cycle && (
        <div
          className="viewer-controls"
          aria-label="Управление воспроизведением"
        >
          <button
            disabled={
              !supported ||
              (animation.status === 'available' &&
                animation.playback === 'playing')
            }
            onClick={() => send('play')}
          >
            Воспроизвести
          </button>
          <button
            disabled={
              !supported ||
              animation.status !== 'available' ||
              animation.playback !== 'playing'
            }
            onClick={() => send('pause')}
          >
            Пауза
          </button>
          <button disabled={!supported} onClick={() => send('reset')}>
            Сбросить в нейтральную позу
          </button>
          <p
            role="status"
            data-pose={
              !supported
                ? 'unavailable'
                : progress.pose === 'neutral'
                  ? 'neutral'
                  : animation.status === 'available'
                    ? animation.playback
                    : 'unsupported'
            }
          >
            {!supported
              ? animation.status === 'unsupported' && ready
                ? animation.reason === 'unmapped'
                  ? 'Анимация не настроена.'
                  : 'Клип анимации недоступен.'
                : 'Воспроизведение недоступно до загрузки 3D.'
              : progress.pose === 'neutral'
                ? 'Нейтральная поза — вне клипа рабочего цикла'
                : animation.playback === 'playing'
                  ? 'Демонстрация воспроизводится'
                  : 'Пауза — текущая поза сохранена'}
          </p>
        </div>
      )}
      {cycle &&
        (learningCycle ? (
          <WorkingCycleLearning
            content={learningCycle}
            components={components}
            phaseId={phaseId}
            onPhase={choosePhase}
            rate={rate}
            onRate={changeRate}
            progress={progress}
            supported={supported}
          />
        ) : (
          <p role="alert">
            Учебные фазы недоступны: контент не прошёл проверку.
          </p>
        ))}
      <h3>Компоненты машины</h3>
      <div className="component-buttons" aria-label="Выбор компонента">
        {components.map((component) => (
          <button
            key={component.id}
            aria-pressed={selected === component.id}
            onClick={() => setSelected(component.id)}
          >
            {component.name}
          </button>
        ))}
        <button onClick={() => setSelected(null)}>Снять выбор</button>
      </div>
      <p role="status">
        {component
          ? `Выбран компонент: ${component.name}`
          : 'Компонент не выбран'}
      </p>
      {component && (
        <article aria-label="Выбранный компонент">
          <h3>{component.name}</h3>
          {component.explanation ? (
            <p>{component.explanation}</p>
          ) : (
            <p>Учебное описание компонента недоступно.</p>
          )}
        </article>
      )}
      <div className="viewer-controls" aria-label="Видимость компонентов">
        <button
          disabled={!selected || !ready}
          onClick={() => {
            if (selected)
              setVisibility((previous) => ({
                ...previous,
                hidden: [...new Set([...previous.hidden, selected])],
              }));
          }}
        >
          Скрыть выбранный
        </button>
        <button
          disabled={!selected || !ready}
          onClick={() => setVisibility({ hidden: [], isolated: selected })}
        >
          Изолировать выбранный
        </button>
        <button disabled={!ready} onClick={() => setVisibility(showAll)}>
          Показать всё
        </button>
        <p role="status">
          {visibility.isolated
            ? 'Показан только выбранный компонент'
            : visibility.hidden.length
              ? `Скрыто компонентов: ${visibility.hidden.length}`
              : 'Показаны все компоненты'}
        </p>
      </div>
    </section>
  );
}
