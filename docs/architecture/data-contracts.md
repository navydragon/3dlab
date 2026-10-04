# Implemented data boundaries

Baseline: `793722754797737729bb7db1a9960c0f603477cd`, 2026-10-04.
Descriptive source of truth для существующих runtime contracts. Intended entities
и future obligations остаются в [domain model](../domain/domain-model.md) и
[accepted architecture](system-architecture.md). Здесь не создаётся API platform.
Checked-in records подробно описаны в [content schema](../domain/content-schema.md).

## Validation boundary и immutable definitions

External JSON является unknown до strict Zod shape validation в `src/content` и
explicit graph/reference checks. Accepted content records/reference arrays deeply
frozen; private repository maps не передаются callers. Domain contracts plain
TypeScript, без Zod/React/Three. В calculation core numerical validation plain/pure,
без Zod; scenario ingestion переиспользует её rules. Схема не подтверждает
manufacturer truth, instructional sufficiency или asset license.

### DomainRepository

[repository](../../src/content/repository.ts): loaded + repository либо invalid +
structured issues (shape/graph/load path/code/message). Read-only machine/process
catalogs; lookups Machine/Operation/Process/Stage/Role, machine components, ordered
process stages и derived where-used. Missing ID → undefined; known entity with no
relationships → empty array. Queries возвращают shared canonical records. Where-used
выводится через process/stage/role eligibility, не persisted second relationship.

### AssetRepository

[asset repository](../../src/content/asset-repository.ts) resolves by MachineId:
available + metadata, unavailable, invalid либо ambiguous. Несколько assets для
одной Machine не выбираются через first-record fallback. Metadata/domain validation
предшествует resolution; actual binary topology checks — tooling/runtime boundary.
Asset failure не делает canonical Machine недоступной.

### SimulationScenarioRepository

[scenario repository](../../src/content/simulation-scenario-repository.ts): valid
repository или invalid collection issues; frozen list/get, explicit missing IDs,
no selected/default scenario, no calculation. Record owns scenarioId/modelId/
illustrative status/source и explicit input. Query/URL выбирает source только через
поддержку ProductionSystem; repository не хранит working UI values.

### ProductionSystemRepository

[system repository](../../src/content/production-system-repository.ts): valid
repository либо invalid issues. Frozen list/get/getByProcess/getSupportedScenarios;
missing system/process → undefined, known process without systems → empty array.
Join resolves supported scenario records canonically. Local adapter валидирует
domain + scenarios до systems; App SystemsContext принимает valid/invalid state
отдельно от core DomainContext и AssetContext.

ProductionSystem owns allowed participant composition/bounds, process/model/source
references. SystemParticipantDefinition owns roleId/machineId/minCount/maxCount;
не текущий actual count. Model adapter interprets single excavator=1, truckCount
from numerical input и identifies editable participant; React не сравнивает
systemId для dispatch и не изобретает upper bound when maxCount=null.

## Page read models

[page queries](../../src/application/page-queries.ts) join canonical Machine,
components/operations/where-used и available section capability. Missing machine
и unsupported section различаются. Default **presentation section** overview
не является default numerical scenario. Origin context valid/none/invalid проверяет
process/stage ownership и eligible Machine participation.

Process read model joins ordered stages, Operation, participating Roles и Machines;
stage selection none/selected/invalid. System overview joins system/process/
participants/supported scenarios; experiment resolution returns overview,
experiment, missing-system, invalid-dependencies, scenario-unavailable или
unsupported-model. Тип view не доказывает наличие текста в optional descriptions.

## Calculation boundary

[SimulationInput/Result](../../src/simulation/contracts.ts) и
[calculator](../../src/simulation/calculate.ts): explicit excavator/truck/task
numbers → validation → deterministic result. Units: loose volumes, seconds/minutes/
hours, km/kmh, CU; no inferred units, default values, timestamps, random values,
scene transforms или animation time. Exact constraints/assumptions/formulas
установлены [simulation model](../domain/simulation-model.md).

Success contains modelId, all 18 canonical metric keys and six intermediates;
error contains modelId + structured phase/code/path issues. Fractions остаются
fractions. Derived overflow/underflow/unsafe discrete counts явно отвергаются.
Pure result сам не является deep-frozen exported domain ScenarioResult; application
создаёт отдельную immutable snapshot. Не считать calculation validation capability
manufacturer range, например k_fill не ограничивается автоматически единицей.

**Conceptual/runtime distinction:** domain-model §19 описывает более полный
SimulationResult с scenarioId/simulationModelId/simulationModelVersion/inputs/outputs/calculatedAt;
system-architecture §9.2 предусматривает timestamp вне core. Текущий accepted
bounded slice имеет narrower core Result и SavedVariant envelope без result ID,
timestamp или stored interpretation. Scenario/system IDs и input snapshot есть
в SavedVariant; interpretation derived on demand. Это явное непокрытие полного
conceptual result contract, не скрытая clock dependency и не образовательный
блокер self-contained local comparison. До введения persisted/exported results
нужно согласовать envelope/provenance contract; не внедрять его в чистую формулу.

## Experiment source / working input / saved variant

[application experiment](../../src/application/system-experiment.ts) owns orchestration:

- Source = canonical immutable ProductionSystem + supported SimulationScenario.
  System modelId выбирает registry implementation, scenario/model compatibility
  и participant bounds проверяются; нет branch по имени машины.
- Working input = fresh nested copy source.input; reducer заменяет immutable-style
  working values, меняет только truck count. Source/repository никогда не мутируются.
- Latest calculation = exact successfully run snapshot. Edits/reset сохраняют его
  как stale; новый failed calculation очищает latest success, сохраняя saved A/B.
- SavedVariant = deeply frozen systemId/scenarioId/input/result; scalar metrics/
  intermediates и nested input copied/frozen. Не reference на mutable form.
- Comparison = ровно два local slots A/B. Save only successful fresh result;
  full slots cannot overwrite silently; explicit clear frees them. Deltas B−A
  computed from exact metrics; compare checks same system/source/model.
- Prediction/actual exact direction и justification ephemeral, no grading/storage.
  Source key change/unmount/reload создаёт новую session; reset keeps A/B.

Numeric result formatting и Russian labels —
[presentation helper](../../src/ui/presentation/experiment-format.ts): counts,
units, precision, fractions×100 and percentage-point differences. Результаты не
round при сохранении. Neutral interpretation использует только MF<1/MF≥1 и wait>0;
near-balance bound/optimum отсутствуют.

## Asset/viewer boundary

Asset3D passes plain identity/location/mappings/camera/production evidence, не
Object3D. [Viewer contracts](../../src/visualization/contracts.ts) pass selected
MachineComponentId, visibility, play/pause/reset sequence и loading/animation events.
UI resolves text from domain content, viewer resolves external names from metadata.
Three geometry/materials/mixer/raycasters/camera live only inside renderer.
Runtime scene/material clones owned/disposed per viewer; downloaded bytes reused.
Reset restores captured static local TRS rather than clip time-zero digging pose.
Visual playback time does not determine SimulationInput.cycleTimeSeconds.

## Navigation boundary

Structural URL parsing — [route helpers](../../src/navigation/routes.ts);
semantic identity/ownership checks — application repositories. URL owns current
entity/section/stage/source and fromProcess/fromStage pair. Browser Back follows
history; explicit return follows valid semantic origin. No external return URL
accepted. Full NavigationContext conceptual fields не persisted domain records;
actual return pair — достаточная сериализация implemented process detour.
Подробные error/source semantics — [information architecture](../product/information-architecture.md).

## Target learning-content boundary

Full LearningModule/Section/ContentBlock/ParameterDefinition/Material records и
runtime Markdown renderer сейчас отсутствуют. Some short canonical prose lives
в description JSON; calculation labels/interpretation text lives в UI/application.
Это bounded implementation, не утверждение о полном content-driven learning layer.
Предлагаемое расширение требует reviewed reusable prose/LG references, без нового
generic CMS/block engine или переноса формул/relationships в educational JSX.
