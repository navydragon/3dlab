# Interactive Digital Laboratory

## Интерактивная цифровая лаборатория машин и механизированных процессов транспортного строительства

Экспериментальная цифровая образовательная платформа для изучения:

- строительных машин и механизмов;
- их конструкции и принципов работы;
- технологических процессов;
- взаимодействия машин в составе механизированных комплексов;
- производительности;
- сроков;
- эксплуатационных затрат;
- инженерно-экономических решений.

Ключевой принцип платформы:

> Два входа — машины и процессы.  
> Одна связанная предметная модель.  
> Один уровень выше — принятие инженерно-экономических решений.

## Current stage

Project foundation and MVP definition.

Application implementation has not started yet.

## Documentation

Strategic product vision:

`docs/vision/strategic-vision.md`

Current MVP scope:

`docs/product/mvp-scope.md`

Planned documentation:

```text
docs/product/learning-goals.md
docs/product/user-flows.md
docs/domain/domain-model.md
docs/domain/simulation-model.md
docs/design/ui-ux-spec.md
docs/architecture/system-architecture.md
```

## First MVP

The initial vertical slice focuses on:

```text
Hydraulic excavator
+
Dump trucks
+
Excavation and soil transportation
```

The MVP will demonstrate:

```text
machine
→ working principle
→ working cycle
→ productivity
→ technological process
→ machine system
→ duration and cost
```

as well as navigation in the opposite direction:

```text
process
→ operation
→ machine
→ machine learning module
→ return to process
```

## Development approach

The project follows a documentation-first and domain-driven approach.

Product semantics, educational logic and mathematical models should be defined before they are encoded into application components.

See `AGENTS.md` for repository-wide development instructions.
