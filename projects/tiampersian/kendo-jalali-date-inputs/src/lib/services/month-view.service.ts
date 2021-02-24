import { addMonths, getDate, addDays, dayOfWeek } from '@progress/kendo-date-math';
import { Inject, Injectable } from '@angular/core';
import { MonthViewService } from '@progress/kendo-angular-dateinputs';
import { CldrIntlService, IntlService } from '@progress/kendo-angular-intl';
import moment from 'jalali-moment';
import { firstDayOfMonth, getToday, isInSelectionRange, lastDayOfMonth, range } from './utils';
import { JalaliCldrIntlService } from './locale.service';
const EMPTY_DATA = [[]];
const CELLS_LENGTH = 7;
const ROWS_LENGTH = 6;

@Injectable()
export class JalaliMonthViewService extends MonthViewService {
  constructor(
    @Inject(IntlService) protected intlService: JalaliCldrIntlService
  ) {
    super(intlService);
  }

  value(current) {
    if (!current) {
      return '';
    }
    const res = this.getValue(current).format('DD').toString();
    return res;
  }

  abbrMonthNames2() {
    if (this.intlService.isJalali) {
      return moment().locale(this.intlService.localeId).localeData().jMonthsShort();
    }
    return moment().locale(this.intlService.localeId).localeData().monthsShort();
  }

  navigationTitle(value) {
    if (!value) {
      return '';
    }

    if (this.isRangeStart(value)) {
      return this.getValue(value).format('yyyy');
    }
    return this.abbrMonthNames2()[this.getValue(value).month()];
  }

  isRangeStart(value) {
    if (!value) { return false; }
    return this.getValue(value).month() === 0;
  }

  private getValue(value: any) {
    return moment(value).locale(this.intlService.localeIdByDatePickerType);
  }

  title(current) {
    const value = this.getValue(current);
    return `${this.abbrMonthNames2()[value.month()]} ${value.format('YYYY')}`;
  }

  datesList(start, count) {
    return range(0, count).map(i => addMonths(start, i));
  }
  data(options) {
    const { cellUID, focusedDate, isActiveView, max, min, selectedDate, selectionRange = [], viewDate, isDateDisabled = () => false } = options;
    if (!viewDate) {
      return EMPTY_DATA;
    }
    const dt = this.getValue(viewDate);
    const firstMonthDate = firstDayOfMonth(dt,this.intlService.localeIdByDatePickerType);
    const firstMonthDay = getDate(firstMonthDate);
    const lastMonthDate = lastDayOfMonth(dt,this.intlService.localeIdByDatePickerType);
    const lastMonthDay = getDate(lastMonthDate);
    const backward = -1;
    const isSelectedDateInRange = moment(selectedDate).isBetween(min, max);
    const date = dayOfWeek(firstMonthDate, this.intlService.firstDay(), backward);
    const cells = range(0, CELLS_LENGTH);
    const today = getToday();
    return range(0, ROWS_LENGTH).map(rowOffset => {
      const baseDate = addDays(date, rowOffset * CELLS_LENGTH);
      return cells.map(cellOffset => {
        const cellDate = this['normalize'](addDays(baseDate, cellOffset), min, max);
        const cellDay = getDate(cellDate);
        const otherMonth = cellDay < firstMonthDay || cellDay > lastMonthDay;
        const outOfRange = cellDate < min || cellDate > max;
        if (outOfRange) {
          return null;
        }
        const isRangeStart = this.isEqual(cellDate, selectionRange.start);
        const isRangeEnd = this.isEqual(cellDate, selectionRange.end);
        const isInMiddle = !isRangeStart && !isRangeEnd;
        const isRangeMid = isInMiddle && isInSelectionRange(cellDate, selectionRange);
        return {
          formattedValue: this.value(cellDate),
          id: `${cellUID}${cellDate.getTime()}`,
          isFocused: this.isEqual(cellDate, focusedDate),
          isSelected: isActiveView && isSelectedDateInRange && this.isEqual(cellDate, selectedDate),
          isWeekend: this.isWeekend(cellDate),
          isRangeStart,
          isRangeMid,
          isRangeEnd,
          isRangeSplitStart: isRangeMid && this.isEqual(cellDate, firstMonthDate),
          isRangeSplitEnd: isRangeMid && this.isEqual(cellDate, lastMonthDate),
          isToday: this.isEqual(cellDate, today),
          title: this.cellTitle(cellDate),
          value: cellDate,
          isDisabled: isDateDisabled(cellDate),
          isOtherMonth: otherMonth
        };
      });
    });
  }

}
