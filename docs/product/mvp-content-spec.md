# MVP educational content specification

Статус: текущая спецификация минимального учебного наполнения, а не утверждение
готовности продукта. Проверенный implementation baseline:
S1 implementation based on `3c2371a56293acb084f341eb9d0a1c3e44080743` (2026-10-04). Approved prose: [S1 pack](s1-foundation-content-pack.md).

## Источники и границы

[MVP scope](mvp-scope.md) §§2–14 определяет объём MVP;
[learning goals](learning-goals.md) — ожидаемые действия студента;
[user flows](user-flows.md) A–J и [UI/UX](../design/ui-ux-spec.md) §§8–24/28–38
— учебные контексты. Эта спецификация конкретизирует минимальный контент внутри
этих границ; она не добавляет машины, процессы, формулы или обязательную LMS.
Фактическая готовность и доказательства находятся в
[readiness audit](../quality/mvp-readiness-audit.md).

Категории контента:

- **A — реализовано:** доступно пользователю в текущем продукте.
- **B — структура реализована, учебно неглубока:** есть экран/связь/механика,
  но нет достаточного объяснения для указанного learning goal.
- **C — требуется до учебного MVP:** отсутствующий контент или поведение,
  непосредственно требуемое scope/learning goals/flows.
- **D — после MVP:** необязательное или исключённое текущим scope содержание.

Категория описывает предоставленную учебную возможность, а не доказанное усвоение.
Наличие TypeScript-типа, формулы или анимации само по себе не означает A.

## Экскаватор: минимальный модуль

Каждый блок должен иметь связь с canonical `excavator`, целью обучения и источником.
Название раздела не обязывает создавать новую страницу: UI/UX §8 допускает вкладки,
навигацию или секции. Target section IDs из domain-model §21 не являются уже
поддерживаемыми URL. Для текущих адресов см. [information architecture](information-architecture.md).

| Раздел | Назначение / LG | Минимальные блоки | Взаимодействие | Источники / состояние сегодня |
|---|---|---|---|---|
| Обзор | Назначение, операции, место машины; LG-P02/P04 | Краткое назначение; операции разработки/погрузки; ориентир по доступным учебным разделам; связанные процессы | Канонические ссылки в разделы и процесс | Scope §3A; flows A2; UX §9. **A** для S1: approved purpose/system context/scope и canonical operations/implemented section links; key parameters реализованы в S3 |
| Конструкция | Распознать узел и объяснить функцию; LG-M01/M02 | Все девять canonical компонентов; название и краткая функция каждого; связь рабочих органов/цилиндров с движениями без внутреннего устройства двигателя/гидросистемы | Уже есть mesh/list selection, highlight, orbit/zoom/fit, hide/isolate/show-all и текстовая карточка | LG §4; UX §§10–13; domain §6. **A:** выбор и девять reviewed functions, включая power-unit и отдельные цилиндры, доступны из learning pack |
| Принцип работы / Как работает | Связать узлы с движениями; LG-M02/M04 | Краткое объяснение движений стрелы, рукояти, ковша и платформы; названные связанные компоненты; различие движения и технологической фазы | Последовательное объяснение/фокус на существующей 3D; отдельный сложный rig не требуется | UX §14; LG §3/4. **A:** content-derived working-principle section «Как работает», approved paragraphs/chain/functional references |
| Рабочий цикл | Порядок и смысл фаз; LG-M03/M04/M05 | Шесть названных фаз; по одной краткой цели/движению/связанным компонентам; порядок, активная фаза, объяснение выбранной фазы; отдельная оговорка visual time ≠ engineering cycle time | Существующие Play/Pause/neutral Reset; требуется instructional timeline, выбор/previous-next фаз, отображение активной фазы и playback speed по UX §§15–17 | Scope §6; LG-M03/M04; flow D. **A:** reviewed six-phase model, timeline/seek/navigation/rates delivered in S2 |
| Основные параметры | Понимать смысл входов; LG-M05/M06/Q01 | Четыре параметра: вместимость ковша, наполнение, продолжительность цикла, использование времени; смысл, единица, источник/тип значения; явное отличие учебных входов от паспорта | Read-only объяснение, связанное с небольшим экспериментом; не добавлять неутверждённые нормы/диапазоны | UX §18; simulation §§4–6; LG-Q01. **A:** S3 Parameters shows reviewed definitions and source values, model-only ranges |
| Производительность | Один параметр → результат → причина; LG-M05/M06/Q01–Q03 | Объём за цикл, циклы в час, standalone Q; объяснение зависимости от четырёх входов; distinction standalone/комплекс; единицы и provenance | Изменить один из четырёх входов при фиксированных остальных; явный расчёт, исходное/новое значение и причинное объяснение; прогноз допустим без grading | Flow E; UX §§19–21/47; simulation §§7/16–17. **A:** S3 standalone one-factor experiment reuses the real core with prediction/comparison/causes |
| Области применения / Где применяется | Связать машину с операциями и процессом; LG-P04 | Canonical процесс, его этапы и роли машины; короткое объяснение производственного назначения | Уже есть process/stage links, связи вычисляются из graph | UX §22; flow A6–A8. **A:** graph links, approved applications intro, stage role/learning cards; fromMachine trusted return |
| Машина в процессе | Изучить один объект в производственном контексте; LG-P02/P03 | Контекст выбранного этапа; роль; ссылка на тот же Machine; возврат к тому же stage; параметры только с явно указанным источником | Native details с participant note/factor names, close keeps stage; full-module detour с URL return IDs; не нужен дубликат машины | Scope §11; flows B/C/J; ADR 0005. **A** для возврата/participant content; machine module S1–S3 реализован; S4 system task остаётся открытым |
| Контроль знаний | Проверить понимание, не угадать интерфейс | Необязательные вопросы/ordering/prediction; обязательна возможность объяснить и обосновать, а не отдельный quiz engine | Существуют selection, прогноз направления и ungraded A/B justification; assessment screen не требуется scope §14 | LG §§12–15; UX §38; vision §10. **D** для отдельного экрана/graded workflow; это не отменяет учебных проверяемых действий |

Названия переиспользуются из canonical domain content, approved функции — из S1 learning pack; новые длинные
объяснения должны быть отдельным учебным содержанием с provenance. Описание power-unit нельзя дополнять вымышленными характеристиками двигателя.
Не требуются разрезы двигателя, детальная гидравлика, сварные швы или CAD-точность.

## Автосамосвал: намеренно небольшая глубина

Источник: scope §2/3B–C, LG-T01–T03 и simulation §§8–9. Достаточный минимум:

1. Назначение транспортного звена и связь места погрузки с местом доставки.
2. Порядок загрузка → движение с грузом → разгрузка → возврат; объяснение
   каждого слагаемого транспортного цикла и ожидания загрузки.
3. Смысл вместимости, расстояния, скоростей, времени разгрузки и числа машин;
   единицы и учебное происхождение чисел. Текущий loose-volume model не является
   моделью грузоподъёмности по массе; массу/плотность не добавлять.
4. Качественное объяснение distance → longer absence → transport need, без
   нового численного сценария или обязательного distance control.
5. Canonical ссылки на haul/unloading stages и system experiment.

Сегодня **A** для shallow S1 depth: approved purpose/system role, transport sequence, шесть factor explanations, distance/fleet causal explanation/follow-up, canonical where-used. Небольшой truck content slice реализован; truck 3D и экскаваторная глубина не требуются.

## Визуальный цикл и учебная phase model

Минимальная последовательность scope §6/UX §15:
копание/разработка → заполнение ковша → подъём → поворот к разгрузке → разгрузка
→ обратный поворот. LG-M03 объединяет разработку/наполнение в одну описательную
фазу и отдельно называет начало следующего цикла. Это совместимые уровни объяснения,
а не шесть независимых инженерных интервалов; перекрытие копания/наполнения следует
явно пояснить при предметной проверке. Возврат ведёт к следующему копанию.

Сегодня Asset3D связывает `excavator-working-cycle` с `excavator_work_cycle_demo`;
продолжительность clip — 11.666666984558105 visual seconds. Scenario cycle input
24 s — отдельный иллюстративный расчётный параметр. Ни одно из этих чисел не задаёт
инженерных длительностей отдельных фаз.

S2 реализует reviewed учебную последовательность и проверенные визуальные anchors из immutable авторских кадров, не равное деление clip/scenario time. Mapping фазы к clip не является Operation.id или ProcessStage.id. Если digging/filling невозможно достоверно
разделить визуально, обозначить перекрытие; не обещать отсутствующее состояние.
Инженерная синхронизация, покадровая физическая достоверность и отдельные t_phase
не требуются. Любая реальная несовместимость clip с целями должна быть предъявлена
на review, а не устранена неявным изменением immutable authoring stages.

## Процесс: схема плюс объяснение

LG-P01/P02, flows B3/B4 и UX §§24–26 требуют для каждого из четырёх существующих
stages: цель, входное состояние/материал, результат, роль машин, причина порядка,
связанные параметры и переход в общий комплекс. Минимум — короткая проверенная
карточка на этапе, без нового ProcessInput/Output engine.

- `excavation-stage`: что выполняется при разработке и какой результат нужен
  для погрузки; функция excavator role и рабочий орган.
- `loading-stage`: передача грунта в транспорт; совместные роли машины/транспорта;
  связь вместимости/циклов с загрузкой (формулы только из simulation model).
- `haul-stage`: перемещение к месту доставки; расстояние/скорости и возврат.
  Возврат — часть transport cycle, не новый пятый ProcessStage.
- `unloading-stage`: результат доставки/разгрузки, роль транспорта и последующий
  возврат. Не добавлять отдельную модель затора на разгрузке в steady-state v1.

Сегодня **A** для S1 process depth: graph/order/context links сохраняются, approved learning pack добавляет process intro и четыре stage cards с целью/исходным состоянием/действием/результатом/продолжением, participant notes и factor names. Legacy Process/Stage.description не заполнены: учебные объяснения разрешаются через отдельный validated learning repository.

## Производственная система и экономика

Сегодня **A** для scope §3C и UX §§28–36: repository composition, explicit supported
scenario, editable N, calculation, primary/secondary KPI, MF/queue explanation,
work/idle/wait bars, frozen A/B, percent-point deltas, illustrative notice и source.
Error/stale/reset состояния явные; максимум транспорта не выдуман.

**B** для полной объяснимости (simulation §36, UX §47, LG-E01/E02/Q03): к имеющимся
MF/queue explanations требуется добавить короткие связи fixed V → V/Q → duration,
hourly costs + N → hourly system cost, duration × hourly cost → total, total/V →
unit cost. Объяснить standalone Q versus system loading ceiling/transport limitation,
включая дискретные ковши, не объявляя MF ≥ 1 равенством двух Q. Формулы/assumptions
берутся исключительно из принятой модели, расчёты не дублируются в prose code.

Минимальный case framing по flow H/UX §§37–38: назвать цель эксперимента, исходный
объём/условия **из выбранного scenario**, предложить сравнить два N, выбрать вариант
и аргументировать компромисс. Текущее textarea уже удовлетворяет форме ответа;
отдельный case route/assessment platform не требуется. Выбор студента не получает
автоматической оценки «оптимально»; критерия оптимальности нет.

## Provenance и review

Для каждого нового explanation нужны цель, canonical subject, source reference и
предметный review. Existing source docs допускаются для уже утверждённых общих
функций; отсутствующие инженерные утверждения нельзя выводить из GLB. Для чисел
нужны units/volume basis и классификация illustrative/authoritative/derived/user-input.
`isIllustrative=false` само по себе не доказывает manufacturer provenance.
Вместимость/скорости/cost/cycle из baseline не являются спецификацией XE215C.
Визуальный prototype/master sheet устанавливает геометрию, а не учебные тарифы.

## Assessment и после MVP

Отдельный экран «Контроль знаний» — **DEFERRED / OPTIONAL**, не MISSING REQUIRED:
scope §§3/14 не требует quiz screen, LG §13 допускает selection, prediction,
experiment и короткое обоснование, UX §38 ограничивается выбранным вариантом и
текстом. Vision case/control/instructor analytics шире согласованного scope.
Проверяемые действия LG-M01/M03/M04 и аргументация остаются обязательными учебными
возможностями. Их усвоение проверяется апробацией; UI-тесты его не доказывают.

После MVP: глубокий dump-truck module, grading/LMS, teacher reports, stored attempts,
full Material/density model, множество машин/процессов, DES, optimization,
fleet 3D и advanced exploded/transparency. Необходимые до demo slices перечислены
в [аудите](../quality/mvp-readiness-audit.md#минимальные-оставшиеся-срезы).

## S1 delivery status

Reviewed foundation pack реализует purpose/9 component functions/principle, shallow truck и четыре stage cards с goal/input/activity/result/handoff/participant notes. Три учебные последовательности различаются; empty return не добавляет stage. Native compact disclosure, breadcrumbs и validated fromMachine закрыты. Canonical legacy description fields не заменены: approved learning prose имеет отдельный provenance boundary. S2 phase UI реализован; S3 machine factors/experiment реализован; S4 guided economic explanation остаётся незавершённым.

## S2 delivery status

[Reviewed S2 pack](s2-working-cycle-content-pack.md) and the separately validated learning overlay deliver six ordered phases, approved goal/movement/component explanation, selection/previous-next, live current phase, visual progress and 0.5×/1×/2× speed. excavation anchor 0; bucket-filling 0 → 1.6666666666666667; lifting 1.6666666666666667 → 3.3333333333333335; swing-to-dump 3.3333333333333335 → 5.416666666666667; unloading 5.416666666666667 → 7.916666666666667 (dump milestone 6.875); return 7.916666666666667 → 11.666666984558105 (slew-back-complete milestone 9.791666666666666).

Authored evidence is frames 1,41,81,131,166,191,236,281 @24 fps with actual production endpoint. Excavation is an anchor only; filling owns the first transition and the overlap notice is explicit. No equal-sixths or engineering phase durations. Dump hold is authored visual hold, not measured unloading time. Return includes swing back and workgroup lowering without a seventh phase. Reset neutral differs from clip start. LG-M03/M04 are now supported; S3 delivered below; S4 economic goals remain open.

## S3 delivered parameters and standalone productivity

[Reviewed S3 pack](s3-productivity-content-pack.md) supplies four definitions/symbols/units/causal explanations and explicit illustrative provenance, separate from passport/visual data. Parameters show source scenario values and cycle-time/animation distinction. Productivity offers one-factor choice, free decimal input, prediction, explicit calculation, baseline/current/delta comparison of q_eff/cycles/Q_exc_60/Q_exc, observed causal changes and learner explanation.

Numerical source is immutable base-earthworks-scenario, calculated only via earthworks-deterministic-v1. Baseline and every changed input/result remain separate. Switch discards prior edits/result/prediction, reset restores selected source candidate, edit hides stale comparison. No sliders, practical limits/presets, fill<=1 bound, engineering recommendations or second calculator. Approved machine-vs-system note and repository-derived link bridge to existing transport experiment; no system metrics are shown as machine Q. S4 economic/task teaching remains open.
