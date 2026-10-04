# Information architecture — actual and target MVP

Current S1 implementation, based on `3c2371a56293acb084f341eb9d0a1c3e44080743`, 2026-10-04.
Текущая IA основана на [routes.ts](../../src/navigation/routes.ts),
[App](../../src/app/App.tsx), application page queries и фактических страницах.
Целевая учебная глубина задаётся [content spec](mvp-content-spec.md), scope/flows/UX.
Ни один target ниже не является новым реализованным маршрутом.

## Три входа и один граф

Home → **Машины** → `/machines` → canonical Machine detail.
Home → **Процессы** → `/processes` → canonical Process detail → selected stage.
Home → **Производственная задача** → `/systems` → canonical ProductionSystem
overview → explicit supported scenario → experiment/A/B.

На Header также есть Главная/Машины/Процессы/Комплексы. Catalogs получают записи
из repositories. В process catalog один процесс показан напрямую; отдельная
category page «Земляные работы» из ранней схемы не реализована и не нужна для
навигации по единственному MVP процессу. Нет отдельной копии экскаватора в системе.

## Canonical routes

| Route | Контекст сегодня | Builder |
|---|---|---|
| `/` | Home: три семантических входа | `routes.home` |
| `/machines` | Каталог двух Machines | `routes.machines` |
| `/machines/:machineId` | Обзор canonical Machine | `machinePath` |
| `/machines/:machineId/:sectionId` | Только поддерживаемый learning section | `machineSectionPath` |
| `/processes` | Каталог Processes | `routes.processes` |
| `/processes/:processId` | Обзор + ordered stages | `processPath` |
| `/systems` | Каталог ProductionSystems | `routes.systems` |
| `/systems/:systemId?scenario=:scenarioId` | Без query — обзор; с valid supported source — эксперимент | `systemPath` |

ProcessStage адресуется выбором внутри Process, Scenario — источником внутри
ProductionSystem. Отдельных `/stages/:id`, `/scenarios/:id` или assessment routes нет.

## Route identity и domain identity

MachineId `excavator` не является URL `/machines/excavator` и не зависит от section.
OperationId `excavation` не равен ProcessStageId `excavation-stage`. Stage принадлежит
Process `excavation-haul`; role eligibility определяет machine participation.
System `excavator-haul-system` ссылается на тот же процесс и те же Machines.
ScenarioId `base-earthworks-scenario` идентифицирует numerical source record;
Machine/Process/System IDs не меняются при редактировании N.

Section IDs — presentation/navigation identity, не новая Machine. GLB mesh names
и clip names — asset-scoped external identity, не domain IDs. LearningActivityId
`excavator-working-cycle` связывается с exact clip через metadata, не route parser.

## Machine sections: actual → target

Текущие general sections: `overview` / Обзор, `applications` / Где применяется.
При available asset добавляется `construction` / Конструкция; при mapped activity
добавляется `working-cycle` / Рабочий цикл. Validated foundation content с workingPrinciple добавляет `working-principle` / Как работает. Excavator имеет пять;
dump-truck — два текстовых sections без 3D. Applications links также видны ниже
содержимого каждого section. Bare machine path выбирает overview; явный
`/machines/excavator/overview` тоже поддерживается.

Target полного учебного MVP: Обзор, Конструкция, Принцип работы, Рабочий цикл,
Параметры, Производительность, Где применяется и machine-in-process context.
`working-principle` реализован в S1 по learning capability; `parameters` и `productivity` из domain-model §21 пока не поддерживаются: существующая route pattern не делает их реализованными. Будущий exact URL следует существующим helpers после
добавления approved section capability; новые route shapes здесь не предлагаются.
«Контроль знаний» не является обязательным экраном MVP (см. content spec).

## Query semantics и ошибки

- `stageId`: optional selected ProcessStage внутри конкретного Process.
  Отсутствует → обзор с выбором этапа. Malformed, duplicate, unknown или чужой
  stage → visible invalid selection с link к обзору; не другой stage по умолчанию.
- `fromProcess` + `fromStage`: optional pair для return context машины.
  Оба отсутствуют → обычная hierarchy navigation. Неполная/malformed/duplicate
  пара → invalid notice, не redirect. Application проверяет существование,
  ownership stage→process и role participation machine→stage. Valid pair сохраняется
  через все **поддерживаемые** machine sections и reload.
- `fromMachine`: optional process origin. Центральный `parseMachineOrigin` проверяет syntax/duplicates, application query — existence и participation в данном Process через canonical graph. Invalid origin даёт notice без доверенного return; Process остаётся доступен. Valid origin сохраняется при stage selection/overview/reload. Return ведёт в applications section canonical Machine, не arbitrary URL. Это отдельное направление от fromProcess/fromStage.
- `scenario`: absent → system overview; ровно один structurally valid supported
  ID → experiment source; malformed/empty/duplicate → invalid route; valid unknown
  или unsupported-by-system → recoverable unavailable state. Нет hidden default.
  Query не кодирует рабочий N. Reload вновь копирует source input; A/B/notes исчезают.
- Неизвестные query keys parser не использует; они не задают domain relationships.
  Это не обещание strict rejection всех посторонних query keys.

Structurally malformed entity IDs дают invalid address; syntactically valid missing
entities — entity-not-found с catalog recovery. Valid unsupported section даёт
section-not-found с link к обзору машины. Catch-all route — page-not-found.
Invalid core graph блокирует core pages; invalid system content изолировано от
machine/process pages; asset errors не выключают textual learning/navigation.
3D failure не подменяется fallback geometry; calculation error не выдаётся за успех.

## Contextual return и session ownership

Process → selected stage → inline compact machine card → «Изучить машину» открывает
Machine с `fromProcess/fromStage`. Explicit «Назад к этапу» строит process URL со
`stageId`, независимо от browser Back. Back следует реальной history посещений.
Compact cards — native details/summary: canonical имя и роль видны при закрытии; note/factor names и Study action внутри disclosure. Закрытие не меняет stageId, новый stage remounts disclosure.
Обзор процесса доступен отдельным link и не подменяет обязательный semantic return.

Machine → Где применяется → Process использует graph-derived links с fromMachine. Valid origin показывает canonical имя и «Вернуться к машине» в applications. Breadcrumbs — semantic nav/ordered list, canonical current item text/aria-current, не доменные поля. Browser Back остаётся history navigation.

URL owns entity/section/stage/source and return IDs. Page-local state owns selection,
visibility, working N, last calculation, stale/error, predictions, frozen A/B, notes.
Slew/boom transforms, mixer time, camera/Three objects принадлежат renderer.
Cross-page/cross-session UI restoration optional/deferred; URL context работает без storage.

## Delivery и target closures

BrowserRouter требует static-host history fallback и верный base/asset delivery.
Local production-preview tests подтверждают direct load/reload; они не подтверждают
ещё не выбранный внешний hosting. Нет deployment/CI provider requirement в этом task.

Минимальные closures: shallow machine/process explanations; instructional phase
timeline; machine parameters/productivity sections; guided system case и economic
causal explanations. Их содержание задаёт content spec, приоритет — readiness audit.
Не добавляются separate fleet scene, assessment portal, case catalog или LMS routes.
