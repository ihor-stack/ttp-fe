export function createLoaderComponent({
  createComponent,
  html,
  renderer,
  withEventBus,
  eventBus,
}) {
  createComponent(
    'ttp-loader',
    withEventBus(eventBus, {
      renderer,
      root: 'shadow',
      created() {},
      mounted() {},
      props: {
        isLoading: {
          type: Boolean,
          default: true,
          required: true,
        },
        isFullScreen: {
          type: Boolean,
          default: false,
          required: true,
        },
        isError: {
          type: Boolean,
          default: false,
        },
        isTransparent: {
          type: Boolean,
          default: false,
        },
      },
      render() {
        return html`
          <style>
            :host .loader-main-wrapper {
              width: 100vw;
              height: 100vh;
              position: absolute;
              top: 0;
              left: 0;
              background: #f5f5f5;
              display: none;
              z-index: 999;
              overflow: hidden;
            }

            :host .top-logo {
              padding-top: 30px;
            }
            :host .loader-main-wrapper.show {
              display: block;
            }

            :host .loader-main-wrapper.no-bg {
              background: transparent;
            }

            :host .loader-wrapper {
              display: flex;
              flex-flow: column;
              row-gap: 50px;
              height: 100%;
              width: 400px;
              margin: auto;
              align-items: center;
              row-gap: 60px;
            }
            :host .truetourLogo {
              flex-basis: 40%;
              align-items: flex-end;
              display: flex;
            }
            :host .loader-wrapper .loader {
              width: 70px;
              height: 70px;
            }

            :host .loader-main-wrapper.only-loader {
              width: 100%;
              height: 100%;
            }
            :host .loader-main-wrapper .only-loader {
              width: 70px;
              height: 70px;
              position: absolute;
              left: 50%;
              top: 40%;
            }

            :host .error-wrapper {
              display: flex;
              flex-flow: column;
              row-gap: 50px;
              height: 100%;
              width: 100%;
              max-width: 500px;
              margin: auto;
              align-items: center;
              row-gap: 40%;
            }
            :host .error-message {
              text-align: center;
            }
            :host .error-message h3 {
              font-weight: 400;
              font-size: 36px;
              line-height: 36px;
              letter-spacing: -1px;
              color: #333333;
              margin: 0;
            }
            :host .error-message p {
              font-weight: 400;
              font-size: 16px;
              line-height: 16px;
            }
          </style>
          <div
            class=${`loader-main-wrapper ${
              this.props.isLoading ? 'show' : ''
            } ${this.props.isTransparent ? 'no-bg' : ''} ${
              !this.props.isFullScreen ? 'only-loader' : ''
            }`}
          >
            ${this.props.isError
              ? html` <div class="error-wrapper">
                  <div class="top-logo">
                    <ttp-svg-icon-loader
                      src="/assets/img/logo-visiting-media.svg"
                    ></ttp-svg-icon-loader>
                  </div>
                  <div class="error-message">
                    <h3>uh oh!</h3>
                    <p>
                      An Error occurred, please refresh the page and try again.
                    </p>
                  </div>
                </div>`
              : this.props.isFullScreen
              ? html`<div class="loader-wrapper">
                  <div class="top-logo">
                    <ttp-svg-icon-loader
                      src="/assets/img/logo-visiting-media.svg"
                    ></ttp-svg-icon-loader>
                  </div>
                  <div class="truetourLogo">
                    <ttp-svg-icon-loader
                      src="/assets/img/logo-truetour-splash.svg"
                    ></ttp-svg-icon-loader>
                  </div>
                  <div class="loader">
                    <ttp-svg-icon-loader
                      src="/assets/icons/loader.svg"
                    ></ttp-svg-icon-loader>
                  </div>
                </div> `
              : html`<div class="only-loader">
                  <svg
                    version="1.1"
                    id="L9"
                    xmlns="http://www.w3.org/2000/svg"
                    xmlns:xlink="http://www.w3.org/1999/xlink"
                    x="0px"
                    y="0px"
                    viewBox="0 0 100 100"
                    enable-background="new 0 0 0 0"
                    xml:space="preserve"
                  >
                    <path
                      fill="#8F0339"
                      d="M73,50c0-12.7-10.3-23-23-23S27,37.3,27,50 M30.9,50c0-10.5,8.5-19.1,19.1-19.1S69.1,39.5,69.1,50"
                    >
                      <animateTransform
                        attributeName="transform"
                        attributeType="XML"
                        type="rotate"
                        dur="1s"
                        from="0 50 50"
                        to="360 50 50"
                        repeatCount="indefinite"
                      />
                    </path>
                  </svg>
                </div>`}
          </div>
        `;
      },
    })
  );
}
