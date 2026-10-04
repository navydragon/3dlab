# S2 Working Cycle Content Pack v1.0

Six pedagogical phases below are reviewed and approved. The production asset is an illustrative visual demonstration with no soil, soil resistance or physical separation model. Visual anchors come only from immutable authored frames 1–281 @ 24 fps and the actual production clip endpoint. They are not engineering phase durations. `t_cycle` remains an independent simulation input. Digging/filling have no independently validated visual boundary. Reset restores static neutral (source frame 0), outside the clip; seek(0) displays digging.

Шкала показывает визуальное время учебной 3D-демонстрации. Оно не является инженерной продолжительностью рабочего цикла и не используется при расчёте производительности. Расчётное время цикла задаётся отдельно в сценарии.

Разработка и заполнение связаны и могут перекрываться. Текущая демонстрация начинается с условной позы разработки и не задаёт между ними инженерной временной границы.

## 1. excavation — Разработка грунта

"Обеспечить взаимодействие ковша с грунтом и начало его захвата."

"На этом этапе рабочее оборудование находится в положении разработки. В реальной операции ковш взаимодействует с грунтом; текущая 3D-демонстрация начинается с условной позы разработки и не моделирует грунт, сопротивление среды или физический процесс его отделения."

Components: boom, stick, bucket, boom-cylinder, stick-cylinder, bucket-cylinder.

Visual anchor: 0 s.

"Это стартовая визуальная поза, а не измеренная длительность этапа."

## 2. bucket-filling — Заполнение ковша

"Заполнить ковш и перевести его в положение удержания материала."

"Положение ковша изменяется при согласованном движении рабочего оборудования. Ковш переходит из условной позы разработки в положение удержания захваченного материала."

Components: bucket, bucket-cylinder, stick, stick-cylinder.

Visual range: 0 → 1.6666666666666667 s.

"Разработка и заполнение в реальной операции связаны и могут перекрываться; текущая учебная анимация не задаёт между ними инженерной временной границы."

## 3. lifting — Подъём

"Вывести наполненный ковш из зоны разработки и подготовить его к переносу."

"Рабочее оборудование поднимается, при этом положение ковша сохраняет возможность удерживать захваченный материал."

Components: boom, boom-cylinder, stick, stick-cylinder, bucket.

Visual range: 1.6666666666666667 → 3.3333333333333335 s.

## 4. swing-to-dump — Поворот к разгрузке

"Перенести поднятый ковш от зоны разработки к месту разгрузки."

"Поворотная платформа вращается относительно ходовой части, перенося поднятое рабочее оборудование к месту разгрузки."

Components: upperstructure, boom, stick, bucket.

Visual range: 3.3333333333333335 → 5.416666666666667 s.

## 5. unloading — Разгрузка

"Передать материал из ковша в транспортное средство или заданную зону."

"Положение ковша изменяется для разгрузки; стрела и рукоять обеспечивают необходимое положение рабочего оборудования."

Components: bucket, bucket-cylinder, boom, stick.

Visual range: 5.416666666666667 → 7.916666666666667 s.

"Визуальный интервал включает переход в позу разгрузки и авторскую выдержку. Выдержка не является измеренным временем разгрузки."

## 6. return — Обратный поворот и возврат

"Вернуть машину в положение для начала следующего рабочего цикла."

"Сначала поворотная платформа возвращает поднятое рабочее оборудование к зоне разработки, затем стрела, рукоять и ковш возвращаются к исходной рабочей позе."

Components: upperstructure, boom, boom-cylinder, stick, stick-cylinder, bucket, bucket-cylinder.

Visual range: 7.916666666666667 → 11.666666984558105 s.

Visual milestone at 9.791666666666666 s:

"Обратный поворот завершён; рабочее оборудование ещё находится в поднятом положении."

Dump milestone: 6.875 s; slew-back-complete milestone: 9.791666666666666 s. The latter remains within return, not a seventh phase.
