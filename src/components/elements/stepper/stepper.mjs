/**
 *
 * @param root0
 * @param root0.createComponent
 * @param root0.html
 * @param root0.renderer
 * @param root0.withEventBus
 * @param root0.eventBus
 */
export function createStepperComponent({
  createComponent,
  html,
  renderer,
  withEventBus,
  eventBus,
}) {
  createComponent(
    'ttp-stepper',
    withEventBus(eventBus, {
      renderer,
      computed: {},
      props: {
        step: {
          type: Number,
          default: 1,
        },
      },
      mounted() {
        const stepper = this.querySelectorAll('.stepper__item');

        stepper[this.props.step - 1].classList.add('step-active')
      },
      render() {
        return html` <div class="stepper-container">
          <ul class="stepper">
            <li class='stepper__item'>
              <p class="stepper__title">CREATE PROFILE</p>
            </li>
            <li class="stepper__item">
              <p class="stepper__title">SET UP PROPERTY</p>
            </li>
            <li class="stepper__item">
              <p class="stepper__title">SET UP SPACES</p>
            </li>
            <li class="stepper__item">
              <p class="stepper__title">UPLOAD FLOOD PLANS</p>
            </li>
            <li class="stepper__item">
              <p class="stepper__title">IMPORT ASSETS</p>
            </li>
            <li class="stepper__item">
              <p class="stepper__title">REVIEW PROPERTY</p>
            </li>
          </ul>
        </div>`;
      },
    })
  );
}
