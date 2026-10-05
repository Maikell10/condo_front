import { Pipe, PipeTransform } from '@angular/core';

/**
 * Fechas DATE de MySQL (`YYYY-MM-DD`). El DatePipe en UTC-4 resta un día
 * si se parsean como medianoche UTC; aquí se muestra el día del string.
 */
@Pipe({ name: 'dateOnly', standalone: true })
export class DateOnlyPipe implements PipeTransform {
  transform(value: string | Date | null | undefined, format: 'short' | 'long' = 'long'): string {
    if (value == null || value === '') {
      return '—';
    }

    const iso =
      typeof value === 'string'
        ? value.trim()
        : value.toISOString();

    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) {
      return '—';
    }

    const [, y, mo, d] = m;
    if (format === 'short') {
      return `${d}/${mo}/${y.slice(-2)}`;
    }
    return `${d}/${mo}/${y}`;
  }
}
