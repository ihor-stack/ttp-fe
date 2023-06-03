export function createSvgIconLoaderComponent({
  createComponent,
  html,
  renderer,
  withEventBus,
  eventBus,
}) {
  createComponent(
    'ttp-svg-icon-loader',
    withEventBus(eventBus, {
      renderer,
      root: 'shadow',

      async mounted() {
        const placeholder = this.shadowRoot.getElementById('svg-placeholder');
        placeholder.innerHTML = await (await fetch(this.props.src)).text();
        this.replaceWith(...placeholder.childNodes);
      },

      props: {
        src: {
          type: String,
          default: '',
          required: true,
        },
      },
      render() {
        return html`<div id="svg-placeholder"></div>`;
      },
    })
  );
}
