import type { MetricId } from '../../simulation/contracts';

export const primaryMetrics = [
  'system-productivity',
  'project-duration',
  'total-operating-cost',
] as const;
export const secondaryMetrics = [
  'excavator-transport-utilization',
  'excavator-idle-share',
  'truck-wait-time',
  'truck-wait-share',
  'match-factor',
  'system-hourly-cost',
] as const;
export const detailMetrics = [
  'unit-operating-cost',
  'balanced-truck-count',
  'excavator-standalone-productivity',
] as const;
export const comparisonMetrics = [
  ...primaryMetrics,
  'excavator-transport-utilization',
  'excavator-idle-share',
  'truck-wait-time',
  'truck-wait-share',
  'system-hourly-cost',
  'unit-operating-cost',
] as const;
export const metricLabels: Record<MetricId, string> = {
  'effective-bucket-volume': 'Фактический объём в ковше',
  'bucket-passes': 'Ковшей на автомобиль',
  'truck-loading-time': 'Время загрузки',
  'loaded-travel-time': 'Движение с грузом',
  'empty-travel-time': 'Возврат',
  'truck-free-cycle-time': 'Свободный цикл автомобиля',
  'match-factor': 'Match factor',
  'balanced-truck-count': 'Число машин для насыщения',
  'excavator-transport-utilization': 'Загрузка экскаватора',
  'excavator-idle-share': 'Простой экскаватора',
  'truck-wait-time': 'Ожидание автосамосвала за цикл',
  'truck-wait-share': 'Доля ожидания автосамосвала',
  'excavator-standalone-productivity':
    'Отдельная производительность экскаватора',
  'system-productivity': 'Производительность комплекса',
  'project-duration': 'Продолжительность работ',
  'system-hourly-cost': 'Часовая стоимость комплекса',
  'total-operating-cost': 'Общие эксплуатационные затраты',
  'unit-operating-cost': 'Стоимость единицы объёма',
};
const ratios: readonly MetricId[] = [
  'excavator-transport-utilization',
  'excavator-idle-share',
  'truck-wait-share',
];
const units: Record<MetricId, string> = {
  'effective-bucket-volume': 'м³ (рыхл.)',
  'bucket-passes': 'шт.',
  'truck-loading-time': 'мин',
  'loaded-travel-time': 'мин',
  'empty-travel-time': 'мин',
  'truck-free-cycle-time': 'мин',
  'match-factor': '',
  'balanced-truck-count': 'шт.',
  'excavator-transport-utilization': '%',
  'excavator-idle-share': '%',
  'truck-wait-time': 'мин',
  'truck-wait-share': '%',
  'excavator-standalone-productivity': 'м³ (рыхл.)/ч',
  'system-productivity': 'м³ (рыхл.)/ч',
  'project-duration': 'ч',
  'system-hourly-cost': 'CU/ч',
  'total-operating-cost': 'CU',
  'unit-operating-cost': 'CU/м³ (рыхл.)',
};
export function formatNumber(value: number, digits = 2, signed = false) {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    useGrouping: false,
    signDisplay: signed ? 'exceptZero' : 'auto',
  }).format(value);
}
export function formatMetric(id: MetricId, value: number, delta = false) {
  const ratio = ratios.includes(id);
  const count = id === 'bucket-passes' || id === 'balanced-truck-count';
  return `${formatNumber(ratio ? value * 100 : value, count ? 0 : ratio ? 1 : 2, delta)} ${ratio && delta ? 'п.п.' : units[id]}`.trim();
}
export const directionText = {
  increase: 'производительность увеличилась',
  decrease: 'производительность уменьшилась',
  same: 'производительность не изменилась',
} as const;
