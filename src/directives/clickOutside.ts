import type { App, Directive } from 'vue';

// Click Outside Directive
const ClickOutside: Directive = {
  mounted(el: HTMLElement, binding: any) {
    el.clickOutsideEvent = (event: MouseEvent) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event);
      }
    };
    document.addEventListener('click', el.clickOutsideEvent);
  },
  unmounted(el: HTMLElement) {
    document.removeEventListener('click', el.clickOutsideEvent);
  }
};

export function setupDirectives(app: App) {
  app.directive('click-outside', ClickOutside);
}
