import { lazy, Suspense, useCallback, useState } from 'react';
import type { Asset3D } from '../../domain/asset3d';
import type { MachineComponent } from '../../domain/entities';
import type { MachineComponentId } from '../../domain/ids';
import type {
  ViewerLoadState,
  ViewerAnimationState,
  ViewerCommand,
  Visibility,
} from '../../visualization/contracts';
import { showAll } from '../../visualization/contracts';
import { EXCAVATOR_WORKING_CYCLE } from '../../domain/activities';
const ProductionViewer = lazy(
  () => import('../../visualization/ProductionViewer'),
);
export function MachineViewerSection({
  asset,
  components,
  cycle,
}: {
  readonly asset: Asset3D;
  readonly components: readonly MachineComponent[];
  readonly cycle: boolean;
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
  const send = (kind: ViewerCommand['kind']) =>
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
          Визуальная демонстрация движений. Скорость воспроизведения не является
          инженерным временем рабочего цикла и не используется в расчётах.
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
                : command.kind === 'reset'
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
              : command.kind === 'reset'
                ? 'Нейтральная поза'
                : animation.playback === 'playing'
                  ? 'Демонстрация воспроизводится'
                  : 'Пауза — текущая поза сохранена'}
          </p>
        </div>
      )}
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
          {component.description && <p>{component.description}</p>}
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
