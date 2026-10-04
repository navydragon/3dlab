import { useReducer, useState } from 'react';
import {
  compareVariants,
  explainResult,
  getParticipantCounts,
  initialExperiment,
  reduceExperiment,
} from '../../application/system-experiment';
import type {
  ExperimentSource,
  Prediction,
  SavedVariant,
} from '../../application/system-experiment';
import type { SystemParticipantDefinition } from '../../domain/production-system';
import type { Machine, MachineRole } from '../../domain/entities';
import {
  comparisonMetrics,
  detailMetrics,
  directionText,
  formatMetric,
  formatNumber,
  metricLabels,
  primaryMetrics,
  secondaryMetrics,
} from '../presentation/experiment-format';

function Result({ variant }: { readonly variant: SavedVariant }) {
  const m = variant.result.metrics;
  const explanation = explainResult(variant);
  return (
    <>
      <h2>Результат расчёта</h2>
      <p>Рассчитано для {variant.input.truck.truckCount} автосамосвалов.</p>
      <p className="muted">Значения округлены только для отображения.</p>
      <div className="kpi-grid">
        {primaryMetrics.map((id) => (
          <article className="kpi" aria-label={metricLabels[id]} key={id}>
            <h3>{metricLabels[id]}</h3>
            <p>{formatMetric(id, m[id])}</p>
          </article>
        ))}
      </div>
      <dl className="metric-list">
        {secondaryMetrics.map((id) => (
          <div key={id}>
            <dt>{metricLabels[id]}</dt>
            <dd>{formatMetric(id, m[id])}</dd>
          </div>
        ))}
      </dl>
      <section aria-label="Работа и ожидание">
        <h3>Работа и ожидание</h3>
        {(
          [
            'excavator-transport-utilization',
            'excavator-idle-share',
            'truck-wait-share',
          ] as const
        ).map((id) => (
          <div className="share-bar" key={id}>
            <label htmlFor={'bar-' + id}>
              {metricLabels[id]}: {formatMetric(id, m[id])}
            </label>
            <progress id={'bar-' + id} max={1} value={m[id]} />
          </div>
        ))}
      </section>
      <h3>Почему?</h3>
      <p>
        {explanation.transportLimited
          ? 'MF < 1: транспорта недостаточно для непрерывной загрузки; экскаватор ожидает возврата автомобилей.'
          : 'MF ≥ 1: транспорта достаточно для загрузки экскаватора.'}
      </p>
      {explanation.waiting && (
        <p>Автосамосвалы ожидают в очереди на загрузку.</p>
      )}
      <details>
        <summary>Дополнительные показатели</summary>
        <dl className="metric-list">
          {detailMetrics.map((id) => (
            <div key={id}>
              <dt>{metricLabels[id]}</dt>
              <dd>{formatMetric(id, m[id])}</dd>
            </div>
          ))}
        </dl>
        <p>
          Число машин для насыщения — показатель модели, а не рекомендация по
          выбору парка.
        </p>
      </details>
    </>
  );
}
function Comparison({
  a,
  b,
}: {
  readonly a: SavedVariant;
  readonly b: SavedVariant;
}) {
  const comparison = compareVariants(a, b);
  if (comparison.status !== 'available')
    return <p role="alert">Варианты имеют несовместимые источники.</p>;
  return (
    <>
      <div
        className="comparison-scroll"
        tabIndex={0}
        role="region"
        aria-label="Таблица сравнения"
      >
        <table>
          <caption>Сравнение сохранённых вариантов; изменение = B − A</caption>
          <thead>
            <tr>
              <th scope="col">Показатель</th>
              <th scope="col">Вариант A</th>
              <th scope="col">Вариант B</th>
              <th scope="col">Изменение</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Количество автосамосвалов</th>
              <td>{a.input.truck.truckCount}</td>
              <td>{b.input.truck.truckCount}</td>
              <td>{formatNumber(comparison.truckCountDelta, 0, true)}</td>
            </tr>
            {comparisonMetrics.map((id) => (
              <tr key={id}>
                <th scope="row">{metricLabels[id]}</th>
                <td>{formatMetric(id, a.result.metrics[id])}</td>
                <td>{formatMetric(id, b.result.metrics[id])}</td>
                <td>{formatMetric(id, comparison.deltas[id], true)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        Разница производительности:{' '}
        {formatMetric(
          'system-productivity',
          comparison.deltas['system-productivity'],
          true,
        )}
        . Разница общих затрат:{' '}
        {formatMetric(
          'total-operating-cost',
          comparison.deltas['total-operating-cost'],
          true,
        )}
        . Доли сравниваются в процентных пунктах.
      </p>
    </>
  );
}
export function SystemExperiment({
  source,
  editable,
  participants,
}: {
  readonly source: ExperimentSource;
  readonly editable: SystemParticipantDefinition;
  readonly participants: readonly {
    readonly definition: SystemParticipantDefinition;
    readonly machine: Machine;
    readonly role: MachineRole;
  }[];
}) {
  const [state, dispatch] = useReducer(
    (
      state: ReturnType<typeof initialExperiment>,
      action: Parameters<typeof reduceExperiment>[2],
    ) => reduceExperiment(source, state, action),
    source,
    initialExperiment,
  );
  const [reason, setReason] = useState('');
  const input = source.scenario.input;
  const counts = getParticipantCounts(source, state.working);
  const n = state.working.truck.truckCount;
  const context = [
    ['Вместимость ковша', input.excavator.bucketCapacityM3Loose, 'м³ (рыхл.)'],
    ['Коэффициент наполнения', input.excavator.bucketFillFactor, ''],
    ['Цикл экскаватора', input.excavator.cycleTimeSeconds, 'с'],
    [
      'Коэффициент использования времени',
      input.excavator.timeUtilizationFactor,
      '',
    ],
    ['Стоимость экскаватора', input.excavator.hourlyCostCU, 'CU/ч'],
    ['Вместимость автосамосвала', input.truck.capacityM3Loose, 'м³ (рыхл.)'],
    ['Расстояние перевозки', input.truck.haulDistanceKm, 'км'],
    ['Скорость с грузом', input.truck.loadedSpeedKmh, 'км/ч'],
    ['Скорость возврата', input.truck.emptySpeedKmh, 'км/ч'],
    ['Время разгрузки', input.truck.unloadingTimeMinutes, 'мин'],
    ['Стоимость автосамосвала', input.truck.hourlyCostCU, 'CU/ч'],
    ['Объём работ', input.task.workVolumeM3Loose, 'м³ (рыхл.)'],
  ] as const;
  const saveDisabled =
    !state.latest || state.stale || !!state.error || !!state.saved[1];
  return (
    <>
      <aside className="illustrative">
        <strong>
          {source.scenario.isIllustrative
            ? 'Иллюстративный учебный сценарий'
            : 'Исходный сценарий'}
        </strong>
        <p>
          Это расчётные условия сценария, а не паспортные характеристики XCMG
          XE215C. CU — условные денежные единицы. Все объёмы относятся к рыхлому
          грунту.
        </p>
        <p>
          Источник: {source.scenario.source}. Сценарий:{' '}
          {source.scenario.scenarioId}.
        </p>
      </aside>
      <div className="experiment-grid">
        <section aria-label="Условия эксперимента">
          <h2>Условия эксперимента</h2>
          <dl className="metric-list">
            {context.map(([label, value, unit]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>
                  {formatNumber(value)} {unit}
                </dd>
              </div>
            ))}
          </dl>
          <h3>Рабочий состав</h3>
          <ul>
            {participants.map((p, i) => (
              <li key={p.definition.roleId}>
                {p.machine.name} — {p.role.name}:{' '}
                {Number.isFinite(counts[i]) ? counts[i] : 'не задано'}
              </li>
            ))}
          </ul>
          <label htmlFor="truck-count">Количество автосамосвалов</label>
          <div className="count-control">
            <button
              type="button"
              aria-label="Уменьшить количество автосамосвалов"
              disabled={
                !Number.isFinite(n) || n <= editable.minCount || n - 1 === n
              }
              onClick={() => dispatch({ type: 'count', value: n - 1 })}
            >
              −
            </button>
            <input
              id="truck-count"
              type="number"
              step={1}
              min={editable.minCount}
              max={editable.maxCount ?? undefined}
              value={Number.isNaN(n) ? '' : n}
              onChange={(e) =>
                dispatch({
                  type: 'count',
                  value: e.currentTarget.valueAsNumber,
                })
              }
              aria-describedby="count-help"
            />
            <button
              type="button"
              aria-label="Увеличить количество автосамосвалов"
              disabled={
                !Number.isFinite(n) ||
                (editable.maxCount !== null && n >= editable.maxCount) ||
                n + 1 === n
              }
              onClick={() => dispatch({ type: 'count', value: n + 1 })}
            >
              +
            </button>
          </div>
          <p id="count-help">
            Целое число от {editable.minCount}
            {editable.maxCount === null
              ? '; верхняя граница не задана.'
              : ` до ${editable.maxCount}.`}{' '}
            Остальные условия фиксированы источником.
          </p>
          {state.latest && state.stale && (
            <>
              <label htmlFor="prediction">
                Как изменится производительность?
              </label>
              <select
                id="prediction"
                value={state.prediction}
                onChange={(e) =>
                  dispatch({
                    type: 'predict',
                    value: e.currentTarget.value as Prediction,
                  })
                }
              >
                <option value="none">Без предположения</option>
                <option value="increase">Увеличится</option>
                <option value="decrease">Уменьшится</option>
                <option value="same">Не изменится</option>
              </select>
            </>
          )}
          <div className="experiment-actions">
            <button
              type="button"
              onClick={() => dispatch({ type: 'calculate' })}
            >
              Рассчитать
            </button>
            <button type="button" onClick={() => dispatch({ type: 'reset' })}>
              Сбросить к источнику
            </button>
          </div>
        </section>
        <section
          className="experiment-results"
          aria-label="Результаты эксперимента"
        >
          <div role="status">
            {state.stale &&
              'Параметры изменены — рассчитайте заново. Показан предыдущий результат.'}
            {state.observed &&
              !state.stale &&
              `По сравнению с предыдущим расчётом ${directionText[state.observed]}.`}
          </div>
          {state.error && (
            <p role="alert">
              {state.error.code === 'unsupported-model'
                ? 'Расчётная модель не поддерживается.'
                : state.error.code === 'count-constraints'
                  ? 'Количество машин выходит за ограничения комплекса.'
                  : state.error.code === 'invalid-input'
                    ? 'Введите конечное положительное целое количество автосамосвалов.'
                    : 'Числа выходят за вычислимый диапазон модели. Уменьшите количество и повторите расчёт.'}{' '}
              Текущий результат недоступен.
            </p>
          )}
          {state.latest ? (
            <Result variant={state.latest} />
          ) : (
            !state.error && (
              <p>Задайте количество машин и нажмите «Рассчитать».</p>
            )
          )}
          <button
            type="button"
            disabled={saveDisabled}
            onClick={() => dispatch({ type: 'save' })}
          >
            Сохранить вариант
          </button>
          {state.saved[1] && (
            <p>
              Оба слота заняты. Очистите сравнение для сохранения новых
              вариантов.
            </p>
          )}
        </section>
      </div>
      <section aria-label="Сохранённые варианты">
        <h2>Сохранённые варианты</h2>
        <p>
          Снимки A/B не меняются при правке или сбросе условий. Они доступны
          только до ухода со страницы или перезагрузки.
        </p>
        <h3>Вариант A</h3>
        <p>
          {state.saved[0]
            ? `${state.saved[0].input.truck.truckCount} автосамосвалов`
            : 'не сохранён'}
        </p>
        <h3>Вариант B</h3>
        <p>
          {state.saved[1]
            ? `${state.saved[1].input.truck.truckCount} автосамосвалов`
            : 'не сохранён'}
        </p>
        <button
          type="button"
          disabled={!state.saved[0]}
          onClick={() => {
            dispatch({ type: 'clear' });
            setReason('');
          }}
        >
          Очистить сравнение
        </button>
        {state.saved[0] && state.saved[1] && (
          <>
            <Comparison a={state.saved[0]} b={state.saved[1]} />
            <label htmlFor="variant-reason">
              Какой вариант вы бы выбрали и почему?
            </label>
            <textarea
              id="variant-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.currentTarget.value)}
            />
            <p className="muted">
              Ваше обоснование не оценивается и не сохраняется после ухода со
              страницы.
            </p>
          </>
        )}
      </section>
    </>
  );
}
