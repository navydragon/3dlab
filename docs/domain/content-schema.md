# Checked-in content schema

Текущий descriptive contract на baseline
`793722754797737729bb7db1a9960c0f603477cd`, 2026-10-04.
Это описание действующих datasets, а не реализация всех conceptual fields из
[domain model](domain-model.md). Будущие fields нельзя добавлять в JSON только
потому, что они упомянуты в концептуальной модели: strict schemas их отвергнут.

## Общие правила

IDs — stable kebab-case, уникальны внутри record type, независимы от названия/языка,
URL и производителя. Reference arrays duplicate-free; имена nonblank. Domain JSON
проходит strict Zod shape checks, затем graph validation; validated records и
reference arrays deeply frozen. Runtime repositories не expose mutable indexes.
Проверка схемы не подтверждает учебную полноту, физическую точность или права на asset.
Большинство legacy descriptions optional в **реальной** схеме. Образовательный минимум требует пояснений, но не заполнения именно этих полей: approved S1 prose owns отдельный learning pack; см. [content spec](../product/mvp-content-spec.md).

## Domain graph: шесть коллекций

Источник файлов — [local manifest](../../src/content/adapters/local/manifest.ts);
shape — [domain schema](../../src/content/schemas/domain.ts);
references — [validation](../../src/content/validation.ts).

| Файл / record | Identity и обязательные fields | References, ownership и ответственность |
|---|---|---|
| `content/domain/machines.json` / Machine | `id`, `name`, `componentIds`, `operationIds`; optional `description` | Machine owns ordered component references и capability operation references. Компоненты существуют и принадлежат машине; operations существуют. Один объект используется во всех contexts. Не хранит scenario numbers, URLs, duplicate process machines или renderer objects |
| `machine-components.json` / MachineComponent | `id`, `machineId`, `name`; optional `description` | Component owner существует и включает его в componentIds; обратная проверка исключает unlisted components. Функция/название canonical; mesh mapping хранится отдельно |
| `operations.json` / Operation | `id`, `name`; optional `description` | Абстрактная capability/operation, переиспользуемая stages. Не screen и не sequence. Текущая схема не имеет inputTypes/outputTypes |
| `machine-roles.json` / MachineRole | `id`, `name`, `eligibleMachineIds` | Eligible Machines существуют. Role owns eligibility; не owns одну operation. Participation задают stages; required/multiplicity отсутствуют в текущем record |
| `processes.json` / Process | `id`, `name`, `stageIds`; optional `description` | Process owns ordered stage list, каждый stage принадлежит ему; не хранит copied Machines или authoritative relatedMachineIds |
| `process-stages.json` / ProcessStage | `id`, `processId`, `operationId`, positive integer `sequence`, `name`, `machineRoleIds`; optional `description` | Stage owner/operation/roles существуют, owner включает stage обратно. Sequence уникален внутри процесса, stageIds согласованы с возрастающим sequence; непрерывные номера без пропусков не требуются. Stage owns operation/participating roles; Machines выводятся через eligibility |

Machine → components/operations; Process → ordered stages → operation + roles →
eligible Machines. Capability operationIds машины и role participation — разные
связи. Валидатор не требует сингулярного role.operationId и не проверяет равенство
stage.operationId одному operation роли. Это не отсутствующая проверка, а принятая
семантика domain-model §§8/10.

Сегодня: 2 Machines, 9 excavator components, 4 Operations, 2 Roles, 1 Process,
4 stages. Empty reference collections допускаются, например dump-truck.componentIds.
Descriptions: 8 компонентов из 9; power-unit без текста; обе машины/процесс/все
stages без description; только loading Operation имеет explanation. Наличие
имени/связи не заменяет недостающее учебное содержание.

## ProductionSystem

Файл `content/domain/production-systems.json` — отдельная коллекция, не седьмое
поле DomainGraph. Contract/schema/validator:
[production-system](../../src/domain/production-system.ts),
[shape](../../src/content/schemas/production-system.ts),
[references](../../src/content/production-system-validation.ts).

Required: `id`, `name`, `processId`, nonempty `participantDefinitions`,
`simulationModelId`, nonempty unique `supportedScenarioIds`.
Participant required: `roleId`, `machineId`, positive integer `minCount`,
`maxCount` (positive integer ≥ min, либо explicit null). Pair role+machine уникален.
Null — отсутствие верхней границы, не zero/unknown guessed cap.

Проверяются Process/Machine/Role existence, role eligibility, supported model,
структура участников по model adapter, scenario existence/model compatibility и
scenario participant counts against bounds. Валидация не добавляет недокументированное
равенство всех system roles набору stage roles; связи имеют отдельную ответственность.

System owns allowed composition/bounds, process/model/scenario references; scenario
owns experimental numbers. Current system — `excavator-haul-system`:
single excavator 1..1, transport 1..null, model `earthworks-deterministic-v1`,
supported source `base-earthworks-scenario`. Model-specific role/machine matching
сосредоточен в [supported-model adapter](../../src/content/supported-simulation-models.ts),
не в React или общем repository. Нет общего reflection/plugin engine.

## SimulationScenario

`content/simulation/` зарезервирован для одного scenario record на JSON file,
включая nested folders. Vite и Node discovery сортируют/валидируют все records.
Shape: [simulation-scenario](../../src/content/simulation-scenario.ts).
Required: `scenarioId`, literal supported `modelId`, boolean `isIllustrative`,
nonblank `source`, explicit `input` (excavator/truck/task).
Scenario identity — поле scenarioId, не обязательно filename. IDs unique across
collection; invalid record/duplicate не yield partial successful repository.

Input имеет 13 явных чисел с unit-bearing names: пять excavator, семь truck
(включая truckCount), один task. Объёмы loose m³; cycle seconds, unloading minutes,
distance km, speeds km/h, costs CU/h, work volume loose m³. Truck count positive
integer; finite/positive/nonnegative constraints приходят из pure validation,
не из выдуманного диапазона UI. Fill factor не имеет invented maximum; time
utilization 0 < value ≤ 1. В scenario нет независимого participantCounts.

Source record immutable; пользовательская working copy и calculated snapshots
не дописываются в content. Full conceptual Scenario (name, systemId, material,
timestamps, stored user variants) не реализован. System establishes association
через supportedScenarioIds; Scenario input сам по себе не является Machine fact.
isIllustrative=false разрешён схемой, но не доказывает manufacturer authority.

## Asset3D

`content/3d/`: один record на JSON file, nested folders поддерживаются. Источники:
[domain contract](../../src/domain/asset3d.ts),
[shape](../../src/content/schemas/asset3d.ts),
[reference validation](../../src/content/asset3d-validation.ts),
[delivery contract](../3d/3d-asset-spec.md).

Required: `id`, `subjectType` (currently machine), `subjectId`, `uri`, `format`,
`version`, `nodeMappings`, `animationMappings`. Optional: `cameraPresets`, `production`.
URI — base-relative `assets/3d/...glb|gltf`, согласован с format; workstation paths,
traversal, query/fragment и arbitrary external URLs отвергаются.

Node mapping: one canonical componentId → nonempty unique exact sceneNodes.
Subject Machine существует, component существует/принадлежит subject; один
component mapping и один owner для каждого mapped name. Animation mapping:
stable LearningActivityId → exact clip name; activities unique. Camera preset:
stable id, finite position/target triples, разные points; preset IDs unique.
Activity branded ID не означает существование полной LearningActivity collection:
текущая schema проверяет структуру/uniqueness, capability связывается с domain constant.

Production evidence optional в общем contract, присутствует у XE215C: SHA256,
bytes, meters/Y-up, canonical nodes, counts, clip duration/animated nodes/rest
semantics, mapping notes/limitations. Metadata не является controller/geometry.
Shape/domain validation не проверяет topology, license или binary appearance.
Asset tooling проверяет real GLB/name mappings/hierarchy/clip/public copy и hashes
immutable stages; runtime checks exact nodes/clips при загрузке.

Current XE215C metadata maps все девять canonical компонентов на 101 meshes.
Six nonselectable auxiliary linkage meshes входят в bucket-cylinder assembly
mapping для highlight/visibility, но direct hit учитывает edu_selectable=false.
Это явная asset policy, а не domain meaning inferred from extras/names.
Adjacent public manifest — generated copy того же record, не второй источник.

## Responsibility и расширение

**GLB node names не являются domain IDs. Simulation values не являются Machine
specification facts. Scenario data не является автоматически manufacturer data.**
Formulas/units/assumptions принадлежат simulation-model и pure core; learning text
— [content spec](../product/mvp-content-spec.md), definitions/relationships — JSON,
geometry — GLB, bridge — Asset3D. Full LearningModule/ContentBlock/ParameterDefinition/Material datasets по-прежнему отсутствуют. Узкий S1 foundation pack реализован отдельно и описан ниже. Их conceptual existence не следует
выдавать за checked-in schemas или educational implementation.

Новый content field требует согласованного contract/schema/validator/consumer и
provenance review. Этот docs task не мигрирует ни один record. Runtime/read-model
boundaries см. [data contracts](../architecture/data-contracts.md).

## S1 foundation learning pack v1.0

`content/learning/foundation.json` — единственный focused pack, не CMS/block language. [Plain contracts](../../src/domain/foundation.ts), [strict schema/validation/repository](../../src/content/foundation-repository.ts) и [reviewed pack](../product/s1-foundation-content-pack.md).

- `version` = 1.0; четыре source records: stable id, title, location, scope. Reviewed S1 document, accepted illustrative model, generic Komatsu hydraulics corroboration, XE215C visual-only reference. URL — metadata, не runtime dependency.
- MachineFoundation: canonical machineId, sourceRefs, overview purpose/systemContext/scopeNote; optional workingPrinciple (paragraphs/chain/groups/explanations), transportCycle (steps/factor explanations/distance/follow-up), approved construction/applications intro. Block prose inherits its owning record provenance; nested group/factor records also have sourceRefs. No numeric Machine specs.
- ComponentFoundation: machineId/componentId, sourceRefs, approved explanation. Identity/name/ownership остаются в canonical graph; все девять имеют ровно одну запись. Functional groups reference canonical components, не создают новый ownership graph.
- ProcessFoundation: processId/sourceRefs/introduction, two machine cycles/synthesis/causal-chain/system-link intro. Ordered technological stages по-прежнему owns Process, не learning pack.
- StageFoundation: processId/stageId/sourceRefs, goal/input/activity/result/handoff, modelNotes и participantNotes (roleId/machineId/note/factor names/sourceRefs). Participant pair обязан существовать в данном stage через canonical role eligibility. Input/result — учебный текст, не новые Material entities.

Все objects strict, text nonblank, IDs structural; sourceRefs resolve; duplicate records/reference IDs отвергаются; owners/participants сверяются с DomainRepository. Delivery completeness требует обоих approved Machines, девяти компонентов, одного процесса, четырёх stages и всех approved participant notes. Optional capabilities explicit: отсутствие workingPrinciple у truck не подменяется текстом. Parsed nested records/arrays frozen, source JSON не мутируется. `npm run content:validate` использует тот же factory. Validation не доказывает инженерную истину: authority — approved pack, не schema/GLB.

## S2 working-cycle learning overlay

content/learning/working-cycle.json is a separate narrow WorkingCycle record: version, machineId, accepted LearningActivityId, reviewed sources/sourceRefs, timingNotice, overlapNotice and exactly six ordered phases (phaseId, order, name, goal, movement, canonical componentIds, optional visualNote). Visual mapping is distinct: assetId/version/activity/sourceRefs and ordered segments with startSeconds, optional endSeconds and authored milestones. Component names resolve from MachineComponent, never duplicate in learning JSON.

Strict Zod shape and frozen nested records, canonical machine/component ownership, unique sources/references/phases/components, unique asset resolution with subject/version, mapped evidenced clip, finite nonnegative approved ordered anchors and actual endpoint (1e-6 floating tolerance only at returned) are required. CLI verifies provenance files exist; assets:validate verifies the actual mapped binary clip. No Three dependency is introduced.

Asset/version: excavator-main/1.0.0; activity resolves through existing Asset3D.animationMappings. excavation anchor 0; bucket-filling 0 → 1.6666666666666667; lifting 1.6666666666666667 → 3.3333333333333335; swing-to-dump 3.3333333333333335 → 5.416666666666667; unloading 5.416666666666667 → 7.916666666666667 (dump milestone 6.875); return 7.916666666666667 → 11.666666984558105 (slew-back-complete milestone 9.791666666666666).

Excavation has no visual duration; filling starts at the same anchor intentionally. These are learning phases, not ProcessStage or engineering timing. No phase metadata is added to Asset3D, manifest, GLB or userData. S1 pack is unchanged.

## S3 productivity learning

content/learning/productivity.json stores focused reviewed records (one canonical excavator record), not numerical scenarios or a CMS. Fields: machineId, sourceScenarioId, simulationModelId, sources/sourceRefs, illustrativeNotice, four ordered parameter records, display-only relationships, four output labels/units, theoretical explanation, machine-vs-system note and learner prompts. Parameter IDs: bucket-capacity, bucket-fill-factor, cycle-time, time-utilization. Output IDs: q_eff, cycles_per_hour_60, Q_exc_60, Q_exc.

Strict Zod validation rejects unknown fields/IDs, duplicates/missing parameters or records, blank prose, invalid provenance, unknown machines/scenarios and incompatible supported model/machine/scenario pairs. Sources and nested records are frozen; repository get/list are read-only. CLI checks referenced files exist. Scenario remains the sole numerical source; schema does not prove engineering truth. No manufacturer or practical range metadata. The supported-model boundary declares the canonical standalone machine capability.
