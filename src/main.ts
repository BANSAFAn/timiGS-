import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import { router } from "./router";
import { i18n } from "./i18n";
import "./styles/index.css";
import "./styles/view-styles.css";

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(i18n);

// Add global error handler for production debugging
app.config.errorHandler = (err, _vm, info) => {
  console.error('[Vue Error]', err, info);
};

app.mount("#app");

// Log app mount status
console.log('[Main] Application mounted successfully');
console.log('[Main] Router is ready:', !!router);
console.log('[Main] Current route:', router.currentRoute.value?.path);
