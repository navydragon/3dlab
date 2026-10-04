# Domain Model

Implementation baseline (2026-10-04): both technical product slices are implemented at 793722754797737729bb7db1a9960c0f603477cd. Historical slice definitions below describe milestone scope, not current availability. Actual routes/contracts and unmet full-MVP learning obligations are recorded in [documentation index](../README.md) and [readiness audit](../quality/mvp-readiness-audit.md). Existing document status and accepted decisions are retained.

## Интерактивная цифровая лаборатория машин и механизированных процессов транспортного строительства

**Статус:** Draft  
**Версия:** 0.1  
**Связанные документы:**
- `docs/vision/strategic-vision.md`
- `docs/product/mvp-scope.md`
- `docs/product/learning-goals.md`
- `docs/product/user-flows.md`

---

## 1. Назначение документа

Этот документ определяет предметную модель цифровой лаборатории.

Его задача — зафиксировать:

- какие сущности существуют в системе;
- какие у них устойчивые идентификаторы;
- какие данные принадлежат предметной области;
- какие связи существуют между сущностями;
- где проходит граница между предметными данными, учебным контентом, расчётной моделью и 3D;
- как одна и та же машина переиспользуется в разных учебных контекстах;
- какие правила должна соблюдать будущая программная архитектура.

Этот документ не определяет:

- frontend framework;
- backend framework;
- формат хранения;
- базу данных;
- конкретную библиотеку 3D;
- конкретную систему управления состоянием.

Модель должна быть реализуема как в статическом content-driven MVP, так и в более сложной платформе в будущем.

---

## 2. Основной принцип

Цифровая лаборатория строится не вокруг экранов и не вокруг отдельных учебных курсов.

Она строится вокруг устойчивых предметных сущностей и отношений между ними.

Базовая цепочка:

```text
Machine
→ performs
Operation
→ participates in
ProcessStage
→ belongs to
Process
→ instantiated as
ProductionSystem
→ evaluated through
Scenario
→ calculated by
SimulationModel
```

При этом пользователь может двигаться в обе стороны:

```text
Machine → Process
Process → Machine
```

Обе траектории используют одни и те же сущности.

---

## 3. Уровни модели

В проекте выделяются четыре логических слоя данных.

### 3.1. Domain data

Описывает предметную область:

- машины;
- операции;
- процессы;
- этапы процессов;
- роли машин;
- параметры;
- материалы;
- связи между сущностями.

### 3.2. Learning content

Описывает учебное представление предметных сущностей:

- объяснения;
- подписи;
- подсказки;
- вопросы;
- задания;
- learning goals;
- последовательности демонстрации.

### 3.3. Simulation data

Описывает вычислительную часть:

- входные параметры;
- формулы;
- ограничения;
- единицы измерения;
- сценарии;
- результаты расчётов.

### 3.4. 3D metadata

Связывает предметные сущности с визуальным представлением:

- 3D asset;
- узлы сцены;
- анимации;
- точки взаимодействия;
- camera presets;
- визуальные группы.

Эти слои могут ссылаться друг на друга, но не должны смешиваться.

---

## 4. Идентификаторы

Все ключевые сущности должны иметь устойчивый машиночитаемый `id`.

Рекомендуемый стиль:

```text
kebab-case
```

Примеры:

```text
excavator
dump-truck

excavation
loading
haul
unloading

excavation-haul

excavator-haul-system

base-earthworks-scenario
```

Идентификатор:

- не должен зависеть от языка интерфейса;
- не должен зависеть от названия конкретного производителя;
- не должен содержать UI-маршрут;
- не должен меняться при изменении отображаемого названия;
- должен быть уникален в пределах типа сущности.

---

## 5. Сущность Machine

### Назначение

`Machine` представляет тип строительной машины или учебный цифровой объект машины.

Для MVP:

```text
excavator
dump-truck
```

### Минимальные поля

| Поле | Назначение |
|---|---|
| `id` | устойчивый идентификатор |
| `name` | отображаемое название |
| `shortName` | короткое название при необходимости |
| `description` | краткое предметное описание |
| `category` | категория машины |
| `status` | состояние контента, например draft/active |
| `componentIds` | ссылки на основные узлы |
| `parameterIds` | ссылки на параметры |
| `operationIds` | операции, которые машина может выполнять |
| `asset3dId` | ссылка на 3D asset при наличии |

### Пример

```yaml
id: excavator
name: Гидравлический экскаватор
category: earthmoving-machine
componentIds:
  - undercarriage
  - upperstructure
  - boom
  - stick
  - bucket
operationIds:
  - excavation
  - loading
asset3dId: excavator-main
```

### Инвариант

Экскаватор внутри раздела «Машины» и экскаватор внутри процесса — одна и та же сущность `Machine`.

Не допускается:

```text
excavator-machine-page
excavator-process-version
```

как две разные предметные сущности.

---

## 6. Сущность MachineComponent

### Назначение

`MachineComponent` описывает учебно значимый узел или часть машины.

Для экскаватора MVP:

```text
undercarriage
upperstructure
power-unit
boom
stick
bucket
boom-cylinder
stick-cylinder
bucket-cylinder
```

### Минимальные поля

| Поле | Назначение |
|---|---|
| `id` | идентификатор компонента |
| `machineId` | родительская машина |
| `name` | название |
| `description` | назначение |
| `parentComponentId` | иерархия при необходимости |
| `relatedParameterIds` | связанные параметры |
| `relatedOperationIds` | связанные операции |
| `sceneNodeRefs` | ссылки на 3D nodes через metadata layer |

### Правило

Компонент не должен хранить расчётную формулу только потому, что он визуально с ней связан.

---

## 7. Сущность Operation

### Назначение

`Operation` — минимальная предметная операция, которую выполняет машина или группа машин.

Для MVP:

```text
excavation
loading
haul
unloading
```

### Примеры

```text
excavation
```

означает разработку грунта.

```text
loading
```

означает загрузку грунта в транспортное средство.

### Минимальные поля

| Поле | Назначение |
|---|---|
| `id` | устойчивый идентификатор |
| `name` | название |
| `description` | предметное описание |
| `inputTypes` | входы операции |
| `outputTypes` | результаты операции |
| `machineRoleIds` | роли машин, способных выполнять операцию |

### Важно

`Operation` не является экраном приложения.

Одна операция может использоваться в нескольких процессах.

---

## 8. Сущность Process

### Назначение

`Process` представляет технологический процесс как связанную последовательность этапов.

Для MVP:

```text
excavation-haul
```

Отображаемое название:

**Разработка грунта с погрузкой в автосамосвалы и транспортированием.**

### Минимальные поля

| Поле | Назначение |
|---|---|
| `id` | идентификатор |
| `name` | название |
| `description` | описание |
| `stageIds` | упорядоченный список этапов |
| `category` | категория процесса |
| `relatedMachineIds` | производное представление машин через этапы и роли; не авторитетные сохраняемые данные |

### Инвариант

Процесс не должен содержать копии объектов машин.

В реализации knowledge graph процесс хранит упорядоченные `stageIds`; машины разрешаются через `ProcessStage.machineRoleIds` → `MachineRole.eligibleMachineIds`. `relatedMachineIds` не сохраняется как второй источник связей.

---

## 9. Сущность ProcessStage

### Назначение

`ProcessStage` представляет конкретный этап процесса.

Для MVP:

```text
excavation-stage
loading-stage
haul-stage
unloading-stage
```

### Минимальные поля

| Поле | Назначение |
|---|---|
| `id` | идентификатор |
| `processId` | родительский процесс |
| `operationId` | выполняемая операция |
| `sequence` | порядок |
| `name` | отображаемое название |
| `description` | описание этапа |
| `machineRoleIds` | роли машин на этапе |
| `inputRefs` | входы |
| `outputRefs` | результаты |

### Различие Operation и ProcessStage

`Operation` — абстрактная предметная операция.

`ProcessStage` — использование этой операции внутри конкретного процесса.

Пример:

```text
Operation:
haul

ProcessStage:
haul-stage in excavation-haul
```

В будущем операция `haul` может использоваться и в других процессах.

---

## 10. Сущность MachineRole

### Назначение

`MachineRole` описывает не просто присутствие машины в процессе, а её функцию.

Примеры для MVP:

```text
excavation-lead-machine
soil-haul-vehicle
```

### Минимальные поля

| Поле | Назначение |
|---|---|
| `id` | идентификатор роли |
| `name` | название роли |
| `eligibleMachineIds` | какие машины могут выполнять эту роль |
| `required` | обязательна ли роль для сценария |
| `multiplicity` | допускается ли несколько машин |

### Уточнение для реализации knowledge graph (2026-10-03)

Каноническая операция этапа задаётся только `ProcessStage.operationId`. Роль описывает функцию участника и допустимые машины, а не одну операцию: одна роль может участвовать в нескольких этапах с разными операциями. Сингулярный `MachineRole.operationId` не входит в реализуемый контракт и не используется для проверки равенства операции этапа. Например, `excavation-lead-machine` участвует в разработке и погрузке; `soil-haul-vehicle` — в погрузке, транспортировании и разгрузке. Участие определяется ссылками этапа, допустимость машины — ссылками роли. `required` и `multiplicity` остаются для будущего сценарного слоя; эта задача их не реализует.

### Почему это важно

Процесс не должен жёстко знать:

```text
loading = excavator
```

Лучше:

```text
ProcessStage
→ requires role
→ excavation-lead-machine
→ can be fulfilled by
→ excavator
```

Это позволит позже добавлять альтернативные машины.

---

## 11. Сущность ParameterDefinition

### Назначение

`ParameterDefinition` описывает смысл параметра независимо от конкретного сценария.

Примеры:

```text
bucket-capacity
bucket-fill-factor
excavator-cycle-time
time-utilization-factor

truck-capacity
haul-distance
loaded-speed
empty-speed
unloading-time
truck-count

work-volume
excavator-hourly-cost
truck-hourly-cost
```

### Минимальные поля

| Поле | Назначение |
|---|---|
| `id` | идентификатор |
| `name` | отображаемое название |
| `description` | смысл |
| `quantityType` | тип физической величины |
| `unit` | базовая единица |
| `min` | допустимый минимум, если известен |
| `max` | допустимый максимум, если известен |
| `step` | шаг UI, если нужен |
| `sourceType` | authoritative / illustrative / derived |
| `scope` | machine / process / scenario / economics |

### Правило единиц

У каждого числового параметра должна быть явно задана единица.

Недопустимо хранить:

```text
haulDistance = 5
```

без определения, что это:

```text
km
```

или:

```text
m
```

---

## 12. Сущность ParameterValue

### Назначение

Отделяет определение параметра от его конкретного значения.

Пример:

```text
ParameterDefinition:
truck-count

ParameterValue:
truck-count = 3
```

Это позволяет использовать один и тот же параметр в разных сценариях.

### Минимальные поля

| Поле | Назначение |
|---|---|
| `parameterId` | ссылка на определение |
| `value` | значение |
| `unit` | единица, если допускаются альтернативные единицы |
| `source` | происхождение значения |
| `notes` | комментарий |

---

## 13. Сущность Material

### Назначение

`Material` описывает материал, с которым работает процесс.

Для первого MVP может быть достаточно одной условной сущности:

```text
generic-soil
```

Она не должна имитировать нормативную классификацию, если такая классификация ещё не определена предметными экспертами.

### Минимальные поля

| Поле | Назначение |
|---|---|
| `id` | идентификатор |
| `name` | название |
| `description` | описание |
| `parameterValues` | свойства, если они используются моделью |

---

## 14. Сущность ProductionSystem

### Назначение

`ProductionSystem` представляет состав взаимодействующих машин в рамках процесса.

Для MVP:

```text
excavator-haul-system
```

### Состав

```text
1 × excavator
N × dump-truck
```

### Минимальные поля

| Поле | Назначение |
|---|---|
| `id` | идентификатор |
| `name` | название |
| `processId` | процесс |
| `participantDefinitions` | состав ролей |
| `simulationModelId` | модель расчёта |
| `supportedScenarioIds` | базовые сценарии |

### Важно

`ProductionSystem` задаёт структуру комплекса, но не конкретное количество транспорта для каждого эксперимента.

Количество задаётся в `Scenario`.

Уточнение текущего implementation slice (2026-10-04): `supportedScenarioIds`
ссылаются на существующие численные `SimulationScenario` records из
`content/simulation/`. Для `earthworks-deterministic-v1` число экскаваторов равно
1 по допущению модели, а переменное число автосамосвалов хранится только в
`scenario.input.truck.truckCount`. Полная сущность `Scenario` из раздела 16
остаётся концептуальной; её дополнительные поля и отдельное `participantCounts`
в текущем slice не реализуются. Структура системы не дублирует значения сценария.

---

## 15. Сущность SystemParticipantDefinition

### Назначение

Описывает, какие участники допустимы в производственной системе.

Пример:

```yaml
roleId: excavation-lead-machine
machineId: excavator
minCount: 1
maxCount: 1
```

и:

```yaml
roleId: soil-haul-vehicle
machineId: dump-truck
minCount: 1
maxCount: null
```

Это отделяет структуру системы от конкретной конфигурации сценария.

---

## 16. Сущность Scenario

### Назначение

`Scenario` описывает конкретную конфигурацию для расчёта или эксперимента.

Пример:

```text
base-earthworks-scenario
```

### Минимальные поля

| Поле | Назначение |
|---|---|
| `id` | идентификатор |
| `name` | название |
| `productionSystemId` | связанная система |
| `parameterValues` | входные значения |
| `participantCounts` | число машин |
| `materialId` | материал |
| `scenarioType` | base / exercise / comparison / custom |
| `isIllustrative` | является ли сценарий учебно-иллюстративным |

### Пример

```yaml
id: base-earthworks-scenario
productionSystemId: excavator-haul-system

participantCounts:
  excavator: 1
  dump-truck: 3

parameterValues:
  work-volume: ...
  haul-distance: ...
  bucket-capacity: ...
```

Иллюстративные численные значения определены в `simulation-model.md`; фактический runtime Scenario contract описан в [content schema](content-schema.md).

---

## 17. Сущность SimulationModel

### Назначение

`SimulationModel` представляет вычислительную модель.

Для MVP планируется детерминированная модель.

### Минимальные поля

| Поле | Назначение |
|---|---|
| `id` | идентификатор |
| `name` | название |
| `version` | версия расчётной модели |
| `inputParameterIds` | входные параметры |
| `outputMetricIds` | выходные показатели |
| `assumptions` | допущения |
| `validationRefs` | ссылки на тестовые кейсы и источники |

### Важно

В предметной модели фиксируется существование модели и её контракт.

Формулы и вычислительная логика подробно определяются в:

`docs/domain/simulation-model.md`

---

## 18. Сущность MetricDefinition

### Назначение

Описывает выходной показатель расчёта.

Для MVP канонический словарь выходных показателей определяется в `docs/domain/simulation-model.md` §17:

```text
effective-bucket-volume
bucket-passes
truck-loading-time
loaded-travel-time
empty-travel-time
truck-free-cycle-time
match-factor
balanced-truck-count
excavator-transport-utilization
excavator-idle-share
truck-wait-time
truck-wait-share
excavator-standalone-productivity
system-productivity
project-duration
system-hourly-cost
total-operating-cost
unit-operating-cost
```

Headline KPI: `system-productivity`, `project-duration`, `total-operating-cost`. Остальные показатели используются для объяснения расчёта и подробного сравнения, включая `unit-operating-cost`. Это различие относится к представлению: все перечисленные показатели сохраняют свои канонические ID и входят в результат модели, без изменения формул или ожидаемых значений.

### Минимальные поля

| Поле | Назначение |
|---|---|
| `id` | идентификатор |
| `name` | название |
| `description` | смысл |
| `unit` | единица |
| `format` | правила отображения |
| `interpretation` | краткое учебное объяснение |

---

## 19. Сущность SimulationResult

### Назначение

`SimulationResult` — результат расчёта для конкретного сценария.

Он не является постоянной предметной сущностью каталога.

### Минимальные поля

```text
scenarioId
simulationModelId
simulationModelVersion
inputs
outputs
calculatedAt
```

Для воспроизводимости результат должен содержать версию модели.

---

## 20. Сущность LearningModule

### Назначение

`LearningModule` определяет учебное представление одной или нескольких предметных сущностей.

Примеры:

```text
excavator-learning-module
excavation-haul-learning-module
```

### Важно

`LearningModule` не дублирует `Machine` или `Process`.

Он ссылается на предметную сущность.

Пример:

```yaml
id: excavator-learning-module
subject:
  type: machine
  id: excavator
```

---

## 21. Сущность LearningSection

### Назначение

Описывает учебный раздел внутри модуля.

Для экскаватора:

```text
overview
construction
working-principle
working-cycle
parameters
productivity
applications
```

### Возможные поля

```text
id
moduleId
title
sequence
learningGoalIds
contentBlockIds
interactionIds
```

---

## 22. Сущность ContentBlock

### Назначение

Универсальный учебный блок.

Примеры типов:

```text
text
callout
image
3d-focus
animation-explanation
formula-explanation
question
comparison
```

### Принцип

Предметный факт не должен существовать только внутри случайного HTML/React текста.

Если информация важна для переиспользования, она должна иметь структурированное представление.

---

## 23. Сущность LearningActivity

### Назначение

Представляет учебное действие пользователя.

Примеры:

```text
identify-component
order-cycle-phases
predict-change
change-parameter
compare-scenarios
justify-choice
```

### Связь с learning goals

Каждая activity должна ссылаться на один или несколько `learningGoalIds`.

Пример:

```yaml
id: compare-truck-count-scenarios
learningGoalIds:
  - LG-S02
  - LG-S03
  - LG-E03
```

---

## 24. LearningGoal как ссылочная сущность

Learning goals уже определены в:

`docs/product/learning-goals.md`

В данных допускается использовать их устойчивые идентификаторы:

```text
LG-M01
LG-M02
LG-Q03
LG-S04
LG-E04
```

Не следует дублировать полный текст learning goal в каждом контентном объекте.

---

## 25. Сущность Asset3D

### Назначение

`Asset3D` описывает связь приложения с внешним 3D-файлом.

### Минимальные поля

| Поле | Назначение |
|---|---|
| `id` | идентификатор |
| `subjectType` | тип предметной сущности |
| `subjectId` | связанная сущность |
| `uri` | путь/ссылка |
| `format` | glb/gltf |
| `version` | версия asset |
| `nodeMappings` | связь scene nodes с domain ids |
| `animationMappings` | связь clips с действиями |
| `cameraPresets` | опциональные камеры |

### Инвариант

3D asset является визуальным представлением.

Он не определяет:

- смысл машины;
- учебную структуру;
- параметры производительности;
- формулы;
- связи с процессами.

---

## 26. Сущность SceneNodeMapping

### Назначение

Связывает узел 3D-сцены с предметным компонентом.

Пример:

```yaml
sceneNode: Excavator_Bucket
componentId: bucket
interaction:
  selectable: true
  highlightable: true
```

Если имя node в Blender изменится, предметный `componentId: bucket` должен остаться прежним.

---

## 27. Сущность AnimationMapping

### Назначение

Связывает 3D-анимацию с предметным или учебным действием.

Пример:

```yaml
clip: working_cycle
activity: excavator-working-cycle
```

или:

```yaml
clip: bucket_dump
operationPhase: unloading
```

### Важно

Продолжительность визуальной анимации не обязана автоматически быть расчётным временем рабочего цикла.

Расчётная модель и визуальная анимация — разные слои.

---

## 28. Сущность NavigationContext

### Назначение

`NavigationContext` — runtime-состояние, а не постоянный domain object.

Оно используется для сохранения контекста перехода.

Пример:

```yaml
sourceType: process
processId: excavation-haul
stageId: excavation-stage
openedEntityType: machine
openedEntityId: excavator
```

Это позволяет реализовать:

```text
Процесс
→ Этап
→ Машина
→ Назад
→ тот же Этап
```

---

## 29. Сущность ComparisonSet

### Назначение

Runtime/learning-сущность для сравнения нескольких сценариев.

Минимально:

```text
scenarioResults[]
selectedMetricIds[]
```

Она нужна для flows, где студент сравнивает варианты количества автосамосвалов.

---

## 30. Карта сущностей MVP

```text
Machine
├── excavator
└── dump-truck

MachineComponent
├── undercarriage
├── upperstructure
├── power-unit
├── boom
├── stick
├── bucket
└── hydraulic cylinders

Operation
├── excavation
├── loading
├── haul
└── unloading

Process
└── excavation-haul

ProcessStage
├── excavation-stage
├── loading-stage
├── haul-stage
└── unloading-stage

MachineRole
├── excavation-lead-machine
└── soil-haul-vehicle

ProductionSystem
└── excavator-haul-system

Scenario
├── base-earthworks-scenario
└── user-created scenario state

SimulationModel
└── earthworks-deterministic-v1
```

---

## 31. Основные отношения

### Машина и компоненты

```text
Machine
1
↓
many
MachineComponent
```

### Машина и операции

```text
Machine
many
↔
many
Operation
```

Связь предпочтительно проходит через `MachineRole`, когда важен контекст применения.

### Процесс и этапы

```text
Process
1
↓
many ordered
ProcessStage
```

### Этап и операция

```text
ProcessStage
many
→
1 Operation
```

### Этап и роли машин

```text
ProcessStage
many
↔
many
MachineRole
```

### Роль и допустимые машины

```text
MachineRole
many
↔
many
Machine
```

### Производственная система и процесс

```text
ProductionSystem
many
→
1 Process
```

### Сценарий и производственная система

```text
Scenario
many
→
1 ProductionSystem
```

### Сценарий и модель расчёта

```text
Scenario
→
SimulationModel
→
SimulationResult
```

---

## 32. Главная связь MVP

Конкретная предметная цепочка первого MVP:

```text
Machine: excavator
    ↓ performs
Operation: excavation
    ↓ used in
ProcessStage: excavation-stage
    ↓ belongs to
Process: excavation-haul
    ↓ instantiated as
ProductionSystem: excavator-haul-system
    ↓ configured by
Scenario
    ↓ calculated by
SimulationModel
    ↓ produces
SimulationResult
```

Параллельно:

```text
Machine: dump-truck
    ↓ fulfills
MachineRole: soil-haul-vehicle
    ↓ participates in
ProcessStage: haul-stage
    ↓ belongs to
Process: excavation-haul
```

---

## 33. Разделение источников истины

### Предметные факты

Хранятся в domain/content data.

Пример:

```text
экскаватор участвует в операции разработки грунта
```

### Учебные объяснения

Хранятся в learning content.

Пример:

```text
почему увеличение времени цикла снижает производительность
```

### Формулы

Хранятся или реализуются в simulation layer и документируются в `simulation-model.md`.

### 3D topology

Хранится в GLB/GLTF.

### Связь 3D и предметной модели

Хранится в 3D metadata mapping.

---

## 34. Что запрещено хранить только в UI

Не допускается, чтобы только React/Vue/etc. компонент знал:

- какие операции выполняет машина;
- какие машины относятся к этапу;
- какие параметры участвуют в расчёте;
- какие learning goals связаны с активностью;
- какой процесс связан с машиной;
- какие единицы имеет параметр.

UI должен отображать модель, а не являться её источником.

---

## 35. Что запрещено хранить только в 3D

Не допускается использовать GLB как единственный источник:

- названий компонентов;
- учебных описаний;
- значений параметров;
- связей машина → процесс;
- формул;
- стоимости;
- learning goals.

3D может содержать технические идентификаторы для связывания.

---

## 36. Данные реального мира и учебные данные

Каждое числовое значение, которое может быть воспринято как реальная техническая характеристика, должно иметь происхождение.

Рекомендуемые категории:

```text
authoritative
manufacturer
reference
illustrative
derived
user-input
```

Для MVP допускаются illustrative values, если они явно обозначены как учебные.

Codex не должен самостоятельно придумывать нормативные характеристики.

---

## 37. Версионирование расчётной модели

Расчётная модель должна иметь версию.

Пример:

```text
earthworks-deterministic-v1
```

При изменении формул или существенных допущений должна изменяться версия модели.

Это необходимо для:

- тестирования;
- воспроизводимости;
- сравнения результатов;
- будущего перехода к более точной модели.

---

## 38. Правила расширения

### Добавление новой машины

Для добавления, например, бульдозера должны появиться:

```text
Machine: bulldozer
MachineComponents
ParameterDefinitions
MachineRoles / Operation relations
LearningModule
3D Asset mapping
```

Не должно требоваться изменение фундаментальной модели `Machine`.

---

### Добавление нового процесса

Для нового процесса должны появиться:

```text
Process
ProcessStages
links to Operations
MachineRoles
ProductionSystem definitions
LearningModule
```

---

### Добавление альтернативной машины

Если одну роль может выполнять несколько машин:

```text
MachineRole
→ eligibleMachineIds
```

должна расширяться без переписывания процесса.

---

## 39. Правила переиспользования

Одна сущность `Machine` может быть использована:

- в каталоге машин;
- в учебном модуле;
- в нескольких процессах;
- в нескольких производственных системах;
- в разных учебных заданиях;
- в сравнительных сценариях.

Одна `Operation` может использоваться:

- в разных процессах;
- разными машинами;
- в разных learning modules.

Один `SimulationModel` может обслуживать несколько сценариев, если их математический контракт совпадает.

---

## 40. Контекстные представления

Если один объект нужно показывать по-разному, создаётся не новая domain entity, а новое представление.

Например:

```text
Machine: excavator
```

может иметь:

```text
full learning view
compact process card
comparison view
3D-only focus view
```

Все представления читают данные одной сущности.

---

## 41. Минимальные domain contracts до реализации

До начала полноценной реализации должны быть определены хотя бы следующие contracts:

```text
Machine
MachineComponent
Operation
Process
ProcessStage
MachineRole
ParameterDefinition
ProductionSystem
Scenario
SimulationModel
MetricDefinition
Asset3D
```

Остальные сущности могут появляться по мере необходимости, если это не нарушает базовую модель.

---

## 42. Открытые вопросы

Следующие вопросы сознательно не закрываются этим документом и должны быть решены позже:

1. Будет ли `Operation` отдельным runtime object или только content/domain definition?
2. Нужна ли отдельная сущность `MachineVariant` для конкретных моделей техники?
3. Нужно ли различать геометрическую вместимость и грузоподъёмность через отдельные quantity types?
4. Будет ли material model влиять на MVP-расчёт?
5. Нужна ли отдельная сущность `ProcessInput/ProcessOutput`?
6. Как будет храниться локализация контента?
7. Как будет сериализоваться и валидироваться content schema?
8. Потребуется ли schema version для domain content?
9. Нужно ли сохранять пользовательские сценарии между сессиями?
10. Где будет проходить граница между `Scenario` и runtime state UI?

Эти вопросы не должны блокировать создание следующего документа — `simulation-model.md`.

---

## 43. Acceptance criteria предметной модели

Предметная модель считается подходящей для MVP, если выполняются все условия:

- `excavator` существует как одна сущность;
- `dump-truck` существует как одна сущность;
- процесс ссылается на машины, а не копирует их;
- машина может ссылаться на несколько операций;
- операция может использоваться в нескольких процессах;
- процесс состоит из упорядоченных этапов;
- роли машин отделены от конкретных экземпляров;
- число автосамосвалов задаётся сценарием, а не самой сущностью машины;
- параметры имеют явные единицы;
- расчётная модель отделена от UI;
- 3D asset отделён от domain data;
- learning content отделён от domain facts;
- пользователь может пройти machine → process и process → machine через ссылки предметной модели;
- добавление бульдозера не требует создания нового типа архитектуры.

---

## 44. Следующий документ

Следующим source-of-truth должен стать:

`docs/domain/simulation-model.md`

Он должен конкретизировать:

- входные параметры;
- единицы измерения;
- формулы;
- допущения;
- расчёт рабочего цикла;
- расчёт производительности экскаватора;
- расчёт транспортного цикла;
- модель взаимодействия экскаватора и автосамосвалов;
- загрузку и простои;
- продолжительность выполнения работ;
- укрупнённые эксплуатационные затраты;
- тестовые сценарии с ожидаемыми результатами.
