import { eventBus } from '../main.mjs';

/**
 * @description loading styles and emitting event
 * @param {object} loadStyles main object
 * @param {object} loadStyles.component main component that loads all  styles
 * @param {string} loadStyles.src of the css file to load
 */
export function loadStyles({ component, src }) {
  let componentStylesheet;
  const componentName = component.tagName.toLowerCase();

  const stylesId = `${componentName}-styles`;

  src.forEach((source, index) => {
    const id = `${stylesId}_${index}`;
    let cssLink = document.createElement('link');
    cssLink.setAttribute('rel', 'stylesheet');
    cssLink.setAttribute('type', 'text/css');
    cssLink.setAttribute('id', id);
    cssLink.setAttribute('href', source);

    const hasShaddow = !!component.shadowRoot;
    const comp = hasShaddow ? component.shadowRoot : component;

    comp.prepend(cssLink);

    componentStylesheet = hasShaddow
      ? comp.getElementById(id)
      : document.getElementById(id);
  });

  componentStylesheet.onload = function () {
    // console.info(`${componentName} styles are loaded ${src} ${this}`);
    setTimeout(() => {
      eventBus.publish('ttp-styles-loaded', { data: true });
    }, 100);
  };

  componentStylesheet.onerror = function () {
    console.error('An error occurred loading the stylesheet!');
  };
}
