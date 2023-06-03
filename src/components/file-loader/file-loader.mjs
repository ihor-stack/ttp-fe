export function createFileLoaderComponent({
  createComponent,
  html,
  renderer,
  withEventBus,
  eventBus,
  FileLoaderApi,
}) {
  createComponent(
    'ttp-fileloader',
    withEventBus(eventBus, {
      renderer,
      root: 'shadow',
      state() {
        return {
          file: '',
          urls: [],
        };
      },
      mounted() {},
      submitForm(event) {
        event.preventDefault();

        FileLoaderApi.uploadFile(this.state.file);
      },
      onChange(event) {
        const file = event.target.files[0];

        this.setState(
          state => {
            return { ...state, file: file };
          },
          () => console.log('Component did render!')
        );
      },
      async loadFiles() {
        const files = await FileLoaderApi.getChair();

        this.setState(
          state => {
            return { ...state, urls: [files] };
          },
          () => console.log('Component did render!', this.state.urls[0])
        );
      },
      render() {
        return html`
          <style>
            :host {
              width: 100%;
              height: 100%;
            }
            :host .wrapper {
              width: 100%;
              height: 100%;
            }
          </style>
          <div class="wrapper">
            <div class="preplanner-container" id="preplanner-container">
              <form @submit=${this.submitForm}>
                <div>
                  <label for="file">Choose a chair:</label>
                  <input
                    type="file"
                    id="file"
                    name="file"
                    accept="image/png, image/jpeg"
                    value=${this.state.file}
                    @change=${this.onChange}
                  />
                </div>
                <button type="submit">Upload file</button>
              </form>
              <div>
                <button @click=${this.loadFiles}>Display all Chairs</button>
                ${this.state.urls.map(file => {
                  return html`<img src="${file}" />`;
                })}
              </div>
            </div>
          </div>
        `;
      },
    })
  );
}
