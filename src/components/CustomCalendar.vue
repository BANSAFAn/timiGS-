<template>
  <div class="custom-calendar">
    <div class="calendar-header">
      <button class="cal-nav-btn" @click="prevMonth">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      <div class="calendar-month-year" @click="showYearPicker = !showYearPicker">
        <span class="month-name">{{ monthNames[currentMonth] }}</span>
        <span class="year">{{ currentYear }}</span>
        <svg class="dropdown-icon" :class="{ 'rotated': showYearPicker }" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
      <button class="cal-nav-btn" @click="nextMonth">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
    </div>

    <!-- Year Picker Dropdown -->
    <div v-if="showYearPicker" class="year-picker-dropdown">
      <div class="year-picker-header">
        <button @click="yearPickerStart -= 12">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <span>{{ yearPickerStart }} - {{ yearPickerStart + 11 }}</span>
        <button @click="yearPickerStart += 12">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>
      <div class="year-grid">
        <button
          v-for="year in yearPickerYears"
          :key="year"
          class="year-item"
          :class="{ 'current-year': year === currentYear }"
          @click="selectYear(year)"
        >
          {{ year }}
        </button>
      </div>
    </div>

    <div class="calendar-weekdays">
      <div v-for="day in weekDays" :key="day" class="weekday">{{ day }}</div>
    </div>

    <div class="calendar-days">
      <button
        v-for="day in calendarDays"
        :key="day.date"
        class="calendar-day"
        :class="{
          'other-month': !day.isCurrentMonth,
          'today': day.isToday,
          'selected': day.isSelected,
          'has-sessions': day.hasSessions
        }"
        @click="selectDate(day)"
      >
        <span class="day-number">{{ day.day }}</span>
        <span v-if="day.hasSessions" class="session-dot"></span>
      </button>
    </div>

    <div class="calendar-footer">
      <button class="footer-btn" @click="clearSelection">
        {{ $t('calendar.clear') || 'Clear' }}
      </button>
      <button class="footer-btn today-btn" @click="goToToday">
        {{ $t('calendar.today') || 'Today' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

const props = defineProps<{
  modelValue: Date;
  sessionsByDate?: Record<string, boolean>;
}>();

const emit = defineEmits<{
  'update:modelValue': [date: Date];
}>();

const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const currentDate = ref(new Date(props.modelValue));
const currentMonth = ref(currentDate.value.getMonth());
const currentYear = ref(currentDate.value.getFullYear());
const showYearPicker = ref(false);
const yearPickerStart = ref(Math.floor(currentYear.value / 12) * 12);

const yearPickerYears = computed(() => {
  return Array.from({ length: 12 }, (_, i) => yearPickerStart.value + i);
});

const calendarDays = computed(() => {
  const days = [];
  const firstDay = new Date(currentYear.value, currentMonth.value, 1);
  // lastDay not needed — we iterate 42 days from startDate
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  const today = new Date();
  const selectedDate = props.modelValue;

  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);

    const dateStr = date.toISOString().split('T')[0];
    const isCurrentMonth = date.getMonth() === currentMonth.value;
    const isToday = date.toDateString() === today.toDateString();
    const isSelected = date.toDateString() === selectedDate.toDateString();
    const hasSessions = props.sessionsByDate?.[dateStr] || false;

    days.push({
      date: dateStr,
      day: date.getDate(),
      isCurrentMonth,
      isToday,
      isSelected,
      hasSessions,
      fullDate: new Date(date)
    });

    if (days.length > 35 && days[days.length - 7].isCurrentMonth) {
      break;
    }
  }

  return days;
});

function prevMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11;
    currentYear.value--;
  } else {
    currentMonth.value--;
  }
  showYearPicker.value = false;
}

function nextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
  showYearPicker.value = false;
}

function selectYear(year: number) {
  currentYear.value = year;
  showYearPicker.value = false;
}

function selectDate(day: any) {
  currentDate.value = day.fullDate;
  currentMonth.value = day.fullDate.getMonth();
  currentYear.value = day.fullDate.getFullYear();
  emit('update:modelValue', day.fullDate);
}

function clearSelection() {
  const today = new Date();
  emit('update:modelValue', today);
}

function goToToday() {
  const today = new Date();
  currentMonth.value = today.getMonth();
  currentYear.value = today.getFullYear();
  emit('update:modelValue', today);
}

watch(() => props.modelValue, (newDate) => {
  currentDate.value = newDate;
  currentMonth.value = newDate.getMonth();
  currentYear.value = newDate.getFullYear();
});
</script>

<style scoped>
.custom-calendar {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 16px;
  min-width: 280px;
  box-shadow: var(--shadow-lg);
  position: relative;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

.cal-nav-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition-fast);
}

.cal-nav-btn:hover {
  background: var(--bg-hover);
  color: var(--color-primary);
}

.calendar-month-year {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: var(--radius-md);
  transition: var(--transition-fast);
  position: relative;
}

.calendar-month-year:hover {
  background: var(--bg-hover);
}

.month-name {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--text-main);
}

.year {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.dropdown-icon {
  transition: transform 0.2s ease;
  color: var(--text-muted);
}

.dropdown-icon.rotated {
  transform: rotate(180deg);
}

/* Year Picker Dropdown */
.year-picker-dropdown {
  position: absolute;
  top: 60px;
  left: 16px;
  right: 16px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 12px;
  z-index: 10;
  box-shadow: var(--shadow-lg);
  animation: slideDown 0.2s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.year-picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

.year-picker-header button {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: var(--radius-sm);
  transition: var(--transition-fast);
}

.year-picker-header button:hover {
  background: var(--bg-hover);
  color: var(--color-primary);
}

.year-picker-header span {
  font-size: 0.85rem;
  color: var(--text-muted);
  font-weight: 500;
}

.year-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.year-item {
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-muted);
  padding: 8px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition-fast);
  font-size: 0.85rem;
}

.year-item:hover {
  background: var(--bg-hover);
  border-color: var(--border-color);
}

.year-item.current-year {
  background: var(--color-primary);
  color: white;
  font-weight: 600;
}

/* Weekdays */
.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 8px;
}

.weekday {
  text-align: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  padding: 8px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Calendar Days */
.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 16px;
}

.calendar-day {
  position: relative;
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-main);
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition-fast);
  margin: 0 auto;
  gap: 2px;
}

.calendar-day:hover {
  background: var(--bg-hover);
  border-color: var(--border-color);
}

.calendar-day.other-month {
  color: var(--text-muted);
  opacity: 0.4;
}

.calendar-day.today {
  background: var(--bg-tertiary);
  border-color: var(--color-primary);
  font-weight: 700;
}

.calendar-day.selected {
  background: var(--color-primary);
  color: white;
  font-weight: 700;
  border-color: var(--color-primary);
}

.calendar-day.selected .session-dot {
  background: white;
}

.day-number {
  font-size: 0.9rem;
  line-height: 1;
}

.session-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--color-primary);
  position: absolute;
  bottom: 4px;
}

/* Calendar Footer */
.calendar-footer {
  display: flex;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

.footer-btn {
  background: transparent;
  border: none;
  color: var(--color-primary);
  font-size: 0.85rem;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition-fast);
}

.footer-btn:hover {
  background: var(--bg-hover);
}

.today-btn {
  font-weight: 600;
}

/* Responsive */
@media (max-width: 768px) {
  .custom-calendar {
    min-width: 260px;
    padding: 12px;
  }

  .calendar-day {
    width: 32px;
    height: 32px;
  }

  .day-number {
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .custom-calendar {
    min-width: 240px;
    padding: 10px;
  }

  .calendar-day {
    width: 28px;
    height: 28px;
  }

  .day-number {
    font-size: 0.8rem;
  }

  .month-name {
    font-size: 0.85rem;
  }

  .year {
    font-size: 0.75rem;
  }
}
</style>
