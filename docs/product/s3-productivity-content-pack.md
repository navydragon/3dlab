# S3 Excavator Productivity Content Pack v1.0

Reviewed educational content and experiment semantics. Numerical source: `base-earthworks-scenario`, illustrative values, not XE215C passport specifications. Visual animation duration is independent from `t_cycle`. Calculation authority: `earthworks-deterministic-v1`. No expert-approved practical min/max ranges exist beyond model validation. Exactly one excavator factor changes per experiment; source is immutable. Display formulas are explanatory strings, never a second calculator.

## bucket-capacity — Вместимость ковша

q_bucket; м³ (рыхл.).

"Геометрическая вместимость ковша в объёмной базе принятой учебной модели."

"При неизменных коэффициенте наполнения, времени цикла и использовании рабочего времени увеличение вместимости ковша увеличивает объём материала за один цикл и расчётную производительность."



## bucket-fill-factor — Коэффициент наполнения

k_fill; безразмерный.

"Коэффициент фактического наполнения ковша."

"При неизменных остальных параметрах увеличение коэффициента наполнения увеличивает фактический объём материала за цикл и расчётную производительность."

"Вместимость ковша сама по себе не определяет объём материала за цикл. В модели фактический объём материала в ковше определяется произведением вместимости ковша и коэффициента наполнения."

## cycle-time — Продолжительность рабочего цикла

t_cycle; с.

"Продолжительность одного полного рабочего цикла экскаватора."

"При неизменном объёме материала за цикл более продолжительный цикл означает меньше циклов за один час и, следовательно, меньшую производительность."

"Расчётное время рабочего цикла не определяется длительностью 3D-анимации. 3D-демонстрация показывает последовательность движений, а время цикла в численном сценарии является отдельным иллюстративным входным параметром."

## time-utilization — Коэффициент использования рабочего времени

k_time; безразмерный.

"Коэффициент перехода от условного непрерывного 60-минутного часа к учебной эксплуатационной производительности."

"Коэффициент использования рабочего времени уменьшает теоретическую производительность с учётом принятой в учебной модели доли эффективно используемого времени."



## Productivity chain

q_eff = q_bucket × k_fill

cycles_per_hour_60 = 3600 / t_cycle

Q_exc_60 = q_eff × 3600 / t_cycle

Q_exc = Q_exc_60 × k_time

q_eff: "Фактический объём материала за цикл" — м³ (рыхл.)

cycles_per_hour_60: "Число циклов за условные 60 минут" — циклов/ч

Q_exc_60: "Теоретическая производительность" — м³/ч

Q_exc: "Учебная эксплуатационная производительность экскаватора" — м³/ч

"Производительность для условного непрерывного 60-минутного часа без дополнительных потерь времени."

## Machine versus system

"Этот результат описывает производительность экскаватора как отдельной машины. В составе механизированного комплекса итоговая производительность может дополнительно ограничиваться процессом загрузки и работой транспортного звена."

## Learner prompts

"Как изменится эксплуатационная производительность?"

Увеличится / Уменьшится / Не изменится. Prediction is ephemeral, ungraded.

"Почему производительность изменилась именно так?"

## Model-only validation

Finite >0: capacity, filling and cycle time. Time utilization: finite 0<k_time<=1. No fill<=1 constraint, no sliders, practical limits or presets. Numeric source values resolve from scenario; outputs resolve from calculate(). Switch factor discards old candidate/prediction/latest; new calculation rebuilds input from source. Edits make previous results stale. Reset clears comparison and restores selected source candidate.
