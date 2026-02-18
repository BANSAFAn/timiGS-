import type { App, Directive } from 'vue';

// Extend HTMLElement to store the event handler
interface HTMLElementWithClickOutside extends HTMLElement {
  _clickOutsideEvent?: (event: MouseEvent) => void;
}

// Click Outside Directive
const ClickOutside: Directive = {
  mounted(el: HTMLElementWithClickOutside, binding: any) {
    el._clickOutsideEvent = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!(el === target || el.contains(target))) {
        binding.value(event);
      }
    };
    document.addEventListener('click', el._clickOutsideEvent);
  },
  unmounted(el: HTMLElementWithClickOutside) {
    if (el._clickOutsideEvent) {
      document.removeEventListener('click', el._clickOutsideEvent);
    }
  }
};

export function setupDirectives(app: App) {
  app.directive('click-outside', ClickOutside);
}
