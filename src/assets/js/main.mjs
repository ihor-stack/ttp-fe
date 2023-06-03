import { env } from './util/env.mjs';
import SPArouter from './util/spa-router.mjs';
import routes from './routes.mjs';
import {
  createComponent,
  html,
  renderer,
  createEventBus,
  withEventBus,
  use,
} from './util/ficus.mjs';
import { loadStyles } from './util/loadStyles.mjs';

import { createHeaderComponent } from './components/header/header.mjs';
import { createLoaderComponent } from './components/loader/loader.mjs';
import { createSvgIconLoaderComponent } from './components/elements/svg-loader/svg-loader.mjs';

env();
// Loading scripts based on path
const path = window.location.pathname;
routes(path);

// EventBus to talk between components
const eventBus = createEventBus();

// Spa for smooth navigation between pages
new SPArouter();

// Loading Roboto font from google
import './util/fonts.mjs';

// Svg File Loader to be available on each page
createSvgIconLoaderComponent({
  createComponent,
  html,
  renderer,
  eventBus,
  withEventBus,
});

// Loader to be available on each page,
// infinite loader to be shown when navigating between the views
createLoaderComponent({
  createComponent,
  html,
  renderer,
  eventBus,
  withEventBus,
});

// Top navigation component
createHeaderComponent({
  createComponent,
  html,
  renderer,
  eventBus,
  withEventBus,
});

export {
  createComponent,
  html,
  renderer,
  loadStyles,
  createEventBus,
  withEventBus,
  eventBus,
  routes,
  use,
};
