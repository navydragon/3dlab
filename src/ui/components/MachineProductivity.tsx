import { useState } from 'react';
import { Link } from 'react-router';
import type { ProductivitySource } from '../../application/machine-productivity';
import {
  initialMachineExperiment,
  reduceMachineExperiment,
  sourceParameter,
  parameterPolicy,
  numericalDirection,
} from '../../application/machine-productivity';
import type { ParameterId } from '../../domain/productivity';
import { formatNumber, directionText } from '../presentation/experiment-format';

const predictionLabels = {
  increase: 'Увеличится',
  decrease: 'Уменьшится',
  same: 'Не изменится',
} as const;
const changeText = {
  increase: 'увеличилось',
  decrease: 'уменьшилось',
  same: 'не изменилось',
} as const;
export function MachineProductivity({
  source,
  experiment,
  cyclePath,
  productivityPath,
  systems,
}: {
  readonly source: ProductivitySource;
  readonly experiment: boolean;
  readonly cyclePath: string | undefined;
  readonly productivityPath: string;
  readonly systems: readonly { readonly name: string; readonly path: string }[];
}) {
  const [state, setState] = useState(() => initialMachineExperiment(source));
  const [explanation, setExplanation] = useState('');
  const content = source.learning;
  const parameter = content.parameters.find(
    (p) => p.parameterId === state.selected,
  )!;
  const send = (action: Parameters<typeof reduceMachineExperiment>[2]) =>
    setState((previous) => reduceMachineExperiment(source, previous, action));
  const baselineValue = sourceParameter(source.scenario.input, state.selected);
  const current = state.latest;
  const showCurrent = current && !state.stale && !state.error;
  const display = (value: number) => formatNumber(value, 3);
  return (
    <section
      aria-label={
        experiment
          ? 'Эксперимент с производительностью'
          : 'Параметры экскаватора'
      }
    >
      <h2>{experiment ? 'Производительность' : 'Параметры'}</h2>
      <p className="notice">{content.illustrativeNotice}</p>
      <h3>Исходный сценарий</h3>
      <p>
        {source.scenario.scenarioId}; источник: {source.scenario.source};
        модель: {source.scenario.modelId}.
      </p>
      <dl className="parameter-source">
        {content.parameters.map((p) => (
          <div key={p.parameterId}>
            <dt>
              {p.name} ({p.symbol})
            </dt>
            <dd>
              {display(sourceParameter(source.scenario.input, p.parameterId))}{' '}
              {p.unit}
            </dd>
          </div>
        ))}
      </dl>
      {cyclePath && (
        <p>
          <Link to={cyclePath}>Рабочий цикл</Link>
        </p>
      )}
      {!experiment ? (
        <>
          {content.parameters.map((p) => (
            <article key={p.parameterId} className="card">
              <h3>{p.name}</h3>
              <p>
                {p.symbol} — {p.unit}
              </p>
              <p>{p.definition}</p>
              <p>{p.causalExplanation}</p>
              {p.notes.map((note) => (
                <p key={note}>{note}</p>
              ))}
            </article>
          ))}
          <p>
            <Link to={productivityPath}>
              Перейти к эксперименту с производительностью
            </Link>
          </p>
        </>
      ) : (
        <>
          <h3>Как получается производительность</h3>
          <ol>
            {content.relationships.map((formula) => (
              <li key={formula}>{formula}</li>
            ))}
          </ol>
          <p>{content.theoreticalExplanation}</p>
          <p>
            {content.parameters
              .find((p) => p.parameterId === 'cycle-time')!
              .notes.join(' ')}
          </p>
          <section aria-label="Исходный расчёт">
            <h3>Исходный расчёт</h3>
            <dl className="parameter-source">
              {content.outputs.map((o) => (
                <div key={o.id}>
                  <dt>
                    {o.name} ({o.id})
                  </dt>
                  <dd>
                    {display(source.baseline[o.id])} {o.unit}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              send({ type: 'calculate' });
            }}
          >
            <fieldset>
              <legend>Выберите один параметр</legend>
              {content.parameters.map((p) => (
                <label key={p.parameterId} className="factor-choice">
                  <input
                    type="radio"
                    name="machine-factor"
                    value={p.parameterId}
                    checked={state.selected === p.parameterId}
                    onChange={() => {
                      send({
                        type: 'select',
                        id: p.parameterId as ParameterId,
                      });
                      setExplanation('');
                    }}
                  />{' '}
                  {p.name}
                </label>
              ))}
            </fieldset>
            <p>
              Остальные параметры при каждом расчёте сохраняют исходные
              значения.
            </p>
            <label htmlFor="machine-candidate">
              Новое значение: {parameter.name} ({parameter.unit})
            </label>
            <input
              id="machine-candidate"
              type="number"
              step="any"
              max={parameterPolicy(state.selected).max}
              value={state.candidate}
              onChange={(event) =>
                send({ type: 'edit', value: event.target.value })
              }
              aria-invalid={state.error !== null}
              aria-describedby={state.error ? 'machine-input-error' : undefined}
            />
            {state.error !== null && (
              <p id="machine-input-error" role="alert">
                Не удалось рассчитать:{' '}
                {state.error
                  .map(
                    (issue) =>
                      `${issue.phase}:${issue.code} (${issue.path.join('.')})`,
                  )
                  .join('; ') || 'неподдерживаемая модель'}
                . Требования модели: конечное значение больше 0
                {state.selected === 'time-utilization' ? ', не более 1' : ''}.
              </p>
            )}
            <fieldset>
              <legend>{content.predictionPrompt}</legend>
              {(['increase', 'decrease', 'same'] as const).map((value) => (
                <label key={value} className="factor-choice">
                  <input
                    type="radio"
                    name="machine-prediction"
                    checked={state.prediction === value}
                    onChange={() => send({ type: 'predict', value })}
                  />{' '}
                  {predictionLabels[value]}
                </label>
              ))}
            </fieldset>
            <p>Прогноз не оценивается и не сохраняется.</p>
            <div className="viewer-controls">
              <button type="submit" disabled={state.prediction === null}>
                Рассчитать
              </button>
              <button
                type="button"
                onClick={() => {
                  send({ type: 'reset' });
                  setExplanation('');
                }}
              >
                Вернуть исходное значение
              </button>
            </div>
          </form>
          {state.stale && (
            <p role="status">
              Предыдущий результат устарел. Рассчитайте новое значение явно.
            </p>
          )}
          {showCurrent && (
            <>
              <div className="comparison-scroll">
                <table>
                  <caption>Исходное и после изменения одного параметра</caption>
                  <thead>
                    <tr>
                      <th scope="col">Показатель</th>
                      <th scope="col">Исходное</th>
                      <th scope="col">После изменения</th>
                      <th scope="col">Разница</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row">
                        {parameter.name} ({parameter.symbol}), {parameter.unit}
                      </th>
                      <td>{display(baselineValue)}</td>
                      <td>
                        {display(
                          sourceParameter(current.input, state.selected),
                        )}
                      </td>
                      <td>
                        {formatNumber(
                          sourceParameter(current.input, state.selected) -
                            baselineValue,
                          3,
                          true,
                        )}
                      </td>
                    </tr>
                    {content.outputs.map((o) => (
                      <tr key={o.id}>
                        <th scope="row">
                          {o.name} ({o.id}), {o.unit}
                        </th>
                        <td>{display(source.baseline[o.id])}</td>
                        <td>{display(current.values[o.id])}</td>
                        <td>
                          {formatNumber(
                            current.values[o.id] - source.baseline[o.id],
                            3,
                            true,
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p>
                Учебная эксплуатационная производительность экскаватора:{' '}
                {display(current.values.Q_exc)} м³/ч.
              </p>
              <p>
                Ваш прогноз:{' '}
                {state.prediction
                  ? predictionLabels[state.prediction].toLowerCase()
                  : 'не выбран'}
                . Расчёт: {directionText[current.observed]}.
              </p>
              <section aria-label="Причина изменения">
                <h3>Почему получился такой результат</h3>
                <p>{parameter.causalExplanation}</p>
                <p>
                  {parameter.name}:{' '}
                  {
                    changeText[
                      numericalDirection(
                        baselineValue,
                        sourceParameter(current.input, state.selected),
                      )
                    ]
                  }
                  .
                </p>
                <ul>
                  {content.outputs.map((o) => (
                    <li key={o.id}>
                      {o.name}:{' '}
                      {
                        changeText[
                          numericalDirection(
                            source.baseline[o.id],
                            current.values[o.id],
                          )
                        ]
                      }{' '}
                      ({display(source.baseline[o.id])} →{' '}
                      {display(current.values[o.id])} {o.unit}).
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}
          <label htmlFor="machine-explanation">
            {content.explanationPrompt}
          </label>
          <textarea
            id="machine-explanation"
            value={explanation}
            onChange={(event) => setExplanation(event.target.value)}
          />
          <p className="notice">{content.machineVsSystem}</p>
          {systems.map((system) => (
            <p key={system.path}>
              <Link to={system.path}>
                К производственной системе «{system.name}»
              </Link>
            </p>
          ))}
        </>
      )}
    </section>
  );
}
