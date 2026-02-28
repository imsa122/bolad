'use client';

import { useMemo } from 'react';

// ============================================
// TYPES
// ============================================
interface PropertyByType {
  type: string;
  _count: { type: number };
}

interface PropertyByCity {
  city: string;
  _count: { city: number };
}

interface BookingByStatus {
  status: string;
  _count: { status: number };
}

interface MonthlyBooking {
  month: string; // "2024-01"
  count: number;
}

interface AnalyticsChartsProps {
  propertiesByType: PropertyByType[];
  propertiesByCity: PropertyByCity[];
  bookingsByStatus: BookingByStatus[];
  monthlyBookings: MonthlyBooking[];
  locale: 'ar' | 'en';
}

// ============================================
// HELPERS
// ============================================
const COLORS = {
  primary: '#0c8fe7',
  gold: '#f59e0b',
  emerald: '#10b981',
  red: '#ef4444',
  purple: '#8b5cf6',
  pink: '#ec4899',
  cyan: '#06b6d4',
};

const CITY_COLORS = [
  '#0c8fe7', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4',
];

const STATUS_CONFIG: Record<string, { color: string; ar: string; en: string }> = {
  PENDING:   { color: '#f59e0b', ar: 'قيد الانتظار', en: 'Pending' },
  CONFIRMED: { color: '#10b981', ar: 'مؤكد',         en: 'Confirmed' },
  CANCELLED: { color: '#ef4444', ar: 'ملغي',          en: 'Cancelled' },
  COMPLETED: { color: '#6b7280', ar: 'مكتمل',         en: 'Completed' },
};

function formatMonthLabel(month: string, locale: 'ar' | 'en'): string {
  const [year, m] = month.split('-');
  const date = new Date(parseInt(year), parseInt(m) - 1, 1);
  return date.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
    month: 'short',
    year: '2-digit',
  });
}

// ============================================
// DONUT CHART — Property Types
// ============================================
function DonutChart({ data, locale }: { data: PropertyByType[]; locale: 'ar' | 'en' }) {
  const total = data.reduce((s, d) => s + d._count.type, 0);
  const size = 140;
  const cx = size / 2;
  const cy = size / 2;
  const r = 52;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * r;

  const segments = useMemo(() => {
    let offset = 0;
    return data.map((d, i) => {
      const pct = total > 0 ? d._count.type / total : 0;
      const dash = pct * circumference;
      const gap = circumference - dash;
      const color = d.type === 'SALE' ? COLORS.primary : COLORS.gold;
      const seg = { offset, dash, gap, color, type: d.type, count: d._count.type, pct };
      offset += dash;
      return seg;
    });
  }, [data, total, circumference]);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-36 text-dark-400 text-sm">
        {locale === 'ar' ? 'لا توجد بيانات' : 'No data'}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6">
      {/* SVG Donut */}
      <div className="relative flex-shrink-0">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background circle */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
          {segments.map((seg, i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${seg.dash} ${seg.gap}`}
              strokeDashoffset={-seg.offset + circumference * 0.25}
              strokeLinecap="butt"
              style={{ transition: 'stroke-dasharray 0.6s ease' }}
            />
          ))}
          {/* Center text */}
          <text x={cx} y={cy - 6} textAnchor="middle" className="fill-dark-800" fontSize="20" fontWeight="700">
            {total}
          </text>
          <text x={cx} y={cy + 12} textAnchor="middle" className="fill-dark-400" fontSize="9">
            {locale === 'ar' ? 'عقار' : 'total'}
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="space-y-3 flex-1">
        {segments.map((seg) => (
          <div key={seg.type}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
                <span className="text-sm text-dark-600">
                  {seg.type === 'SALE'
                    ? (locale === 'ar' ? 'للبيع' : 'For Sale')
                    : (locale === 'ar' ? 'للإيجار' : 'For Rent')}
                </span>
              </div>
              <span className="text-sm font-bold text-dark-800">{seg.count}</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${seg.pct * 100}%`, backgroundColor: seg.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// HORIZONTAL BAR CHART — Properties by City
// ============================================
function CityBarChart({ data, locale }: { data: PropertyByCity[]; locale: 'ar' | 'en' }) {
  const max = Math.max(...data.map((d) => d._count.city), 1);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-36 text-dark-400 text-sm">
        {locale === 'ar' ? 'لا توجد بيانات' : 'No data'}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((d, i) => {
        const pct = (d._count.city / max) * 100;
        const color = CITY_COLORS[i % CITY_COLORS.length];
        return (
          <div key={d.city}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm text-dark-600 font-medium">{d.city}</span>
              <span className="text-sm font-bold text-dark-800">{d._count.city}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// BOOKING STATUS PIE BADGES
// ============================================
function BookingStatusChart({ data, locale }: { data: BookingByStatus[]; locale: 'ar' | 'en' }) {
  const total = data.reduce((s, d) => s + d._count.status, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-36 text-dark-400 text-sm">
        {locale === 'ar' ? 'لا توجد حجوزات' : 'No bookings yet'}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((d) => {
        const cfg = STATUS_CONFIG[d.status] || { color: '#6b7280', ar: d.status, en: d.status };
        const pct = total > 0 ? Math.round((d._count.status / total) * 100) : 0;
        return (
          <div key={d.status} className="flex items-center gap-3">
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: cfg.color }}
            />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-dark-600">{locale === 'ar' ? cfg.ar : cfg.en}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-dark-400">{pct}%</span>
                  <span className="text-sm font-bold text-dark-800">{d._count.status}</span>
                </div>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, backgroundColor: cfg.color }}
                />
              </div>
            </div>
          </div>
        );
      })}
      <p className="text-xs text-dark-400 pt-1">
        {locale === 'ar' ? `الإجمالي: ${total} حجز` : `Total: ${total} bookings`}
      </p>
    </div>
  );
}

// ============================================
// LINE / AREA CHART — Monthly Bookings
// ============================================
function MonthlyLineChart({ data, locale }: { data: MonthlyBooking[]; locale: 'ar' | 'en' }) {
  const W = 320;
  const H = 120;
  const PAD = { top: 12, right: 12, bottom: 28, left: 28 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const maxVal = Math.max(...data.map((d) => d.count), 1);
  const minVal = 0;

  const points = data.map((d, i) => ({
    x: PAD.left + (i / Math.max(data.length - 1, 1)) * chartW,
    y: PAD.top + chartH - ((d.count - minVal) / (maxVal - minVal)) * chartH,
    count: d.count,
    label: formatMonthLabel(d.month, locale),
  }));

  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');
  const areaPath = points.length > 0
    ? `M ${points[0].x},${PAD.top + chartH} L ${polyline.split(' ').map((pt, i) => (i === 0 ? `${points[0].x},${points[0].y}` : pt)).join(' L ')} L ${points[points.length - 1].x},${PAD.top + chartH} Z`
    : '';

  // Build area path properly
  const areaD = points.length > 1
    ? `M ${points[0].x},${PAD.top + chartH} ` +
      points.map((p) => `L ${p.x},${p.y}`).join(' ') +
      ` L ${points[points.length - 1].x},${PAD.top + chartH} Z`
    : '';

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-36 text-dark-400 text-sm">
        {locale === 'ar' ? 'لا توجد بيانات' : 'No data'}
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ minWidth: '240px' }}
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = PAD.top + chartH * (1 - t);
          const val = Math.round(minVal + t * (maxVal - minVal));
          return (
            <g key={t}>
              <line
                x1={PAD.left} y1={y} x2={PAD.left + chartW} y2={y}
                stroke="#f1f5f9" strokeWidth="1"
              />
              <text x={PAD.left - 4} y={y + 4} textAnchor="end" fontSize="8" fill="#94a3b8">
                {val}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        {areaD && (
          <path d={areaD} fill={COLORS.primary} fillOpacity="0.08" />
        )}

        {/* Line */}
        {points.length > 1 && (
          <polyline
            points={polyline}
            fill="none"
            stroke={COLORS.primary}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {/* Data points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="white" stroke={COLORS.primary} strokeWidth="2" />
            {/* Tooltip on hover via title */}
            <title>{`${p.label}: ${p.count}`}</title>
            {/* X-axis label */}
            <text
              x={p.x}
              y={H - 4}
              textAnchor="middle"
              fontSize="8"
              fill="#94a3b8"
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function AnalyticsCharts({
  propertiesByType,
  propertiesByCity,
  bookingsByStatus,
  monthlyBookings,
  locale,
}: AnalyticsChartsProps) {
  const isRTL = locale === 'ar';

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-5">
      <h2 className="font-semibold text-dark-800 text-lg">
        {locale === 'ar' ? 'التحليلات والإحصاءات' : 'Analytics & Statistics'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* ── Chart 1: Property Types Donut ── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-dark-700 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary-500 inline-block" />
            {locale === 'ar' ? 'العقارات حسب النوع' : 'Properties by Type'}
          </h3>
          <DonutChart data={propertiesByType} locale={locale} />
        </div>

        {/* ── Chart 2: Properties by City ── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-dark-700 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gold-500 inline-block" />
            {locale === 'ar' ? 'العقارات حسب المدينة' : 'Properties by City'}
          </h3>
          <CityBarChart data={propertiesByCity} locale={locale} />
        </div>

        {/* ── Chart 3: Booking Status ── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-dark-700 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            {locale === 'ar' ? 'حالة الحجوزات' : 'Booking Status'}
          </h3>
          <BookingStatusChart data={bookingsByStatus} locale={locale} />
        </div>
      </div>

      {/* ── Chart 4: Monthly Bookings Line Chart ── */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-dark-700 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary-500 inline-block" />
          {locale === 'ar' ? 'الحجوزات الشهرية (آخر 6 أشهر)' : 'Monthly Bookings (Last 6 Months)'}
        </h3>
        <MonthlyLineChart data={monthlyBookings} locale={locale} />
      </div>
    </div>
  );
}
