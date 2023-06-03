import { createModalComponent } from '../../../elements/elements.mjs';
import {
  createInputComponent,
  createInputSelectComponent,
  createButtonSelectComponent,
} from '../../../elements/elements.mjs';

import { utils } from '../../../../util/utils.mjs';

const luxon = window.luxon;

/**
 * @param  {object} webcomponent Main WebComponent
 * @param  {object} webcomponent.createComponent createComponent
 * @param  {object} webcomponent.html html compiler
 * @param  {object} webcomponent.renderer rendering the thml
 * @param  {object} webcomponent.withEventBus eventBus wrapper
 * @param  {object} webcomponent.eventBus eventBus instance
 */
export function createEventDuplicateModalComponent({
  createComponent,
  html,
  renderer,
  withEventBus,
  eventBus,
}) {
  createComponent(
    'ttp-event-duplicate-modal',
    withEventBus(eventBus, {
      renderer,
      props: {
        isModalVisible: {
          type: Boolean,
          default: false,
        },
        event: {
          type: String,
          default: '',
        },
      },
      computed: {
        getTimes() {
          return utils.hoursList();
        },
        getTimeNotation() {
          const timeNotation = this.getArrayOfTimesNotations().map(notation => {
            return { value: notation, title: notation };
          });
          return JSON.stringify(timeNotation);
        },

        getEventRoom() {
          const event = this.getEvent();
          if (Object.keys(event).length) {
            return event.roomName;
          }
          return '';
        },

        getEventRoomWidth() {
          const event = this.getEvent();
          if (Object.keys(event).length) {
            return `${event.roomWidth} FT`;
          }
          return '';
        },

        getEventRoomLength() {
          const event = this.getEvent();
          if (Object.keys(event).length) {
            return `${event.roomLength} FT`;
          }
          return '';
        },

        getStartDate() {
          const event = this.getEvent();
          if (Object.keys(event).length) {
            const dateObj = new Date(event.startDate);
            const formatted = dateObj.toLocaleDateString('en-US', {
              month: '2-digit',
              day: '2-digit',
              year: 'numeric',
            });
            return formatted;
          }
          return '';
        },

        getStartTimeWithNotation() {
          const event = this.getEvent();
          if (Object.keys(event).length) {
            const time = this.getFormattedTime(event.startDate, 'hh:mm a');
            return time;
          }
          return '';
        },

        getEndDate() {
          const event = this.getEvent();
          if (Object.keys(event).length) {
            const dateObj = new Date(event.endDate);
            const formatted = dateObj.toLocaleDateString('en-US', {
              month: '2-digit',
              day: '2-digit',
              year: 'numeric',
            });
            return formatted;
          }
          return '';
        },

        getEndTimeWithNotation() {
          const event = this.getEvent();
          if (Object.keys(event).length) {
            const time = this.getFormattedTime(event.endDate, 'hh:mm a');
            return time;
          }
          return '';
        },
      },
      state() {
        return {
          recipientCount: 1,
          animationIsDone: false,
          currentTimeZoneFormatted: '',
          eventTitle: '',
          startDate: '',
          endDate: '',
          startTime: '',
          endTime: '',
          startTimeNotation: 'AM',
          endTimeNotation: 'AM',
        };
      },

      async created() {
        const propsForComponents = {
          createComponent,
          html,
          renderer,
          withEventBus,
          eventBus,
        };
        createModalComponent({ ...propsForComponents });
        createInputComponent({ ...propsForComponents });
        createInputSelectComponent({ ...propsForComponents });
        createButtonSelectComponent({ ...propsForComponents });

        const shortDate = new Date().toLocaleTimeString('en-us', {
          timeZoneName: 'short',
        });

        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        const timezoneFormatted = timezone.replace(/\//g, ' ');

        const fullTime = shortDate.split(' ')[0].split(':');
        const timeHr = fullTime[0];
        const timeMin = fullTime[1];
        const timeNotation = shortDate.split(' ')[1];
        const shortTimeZ = shortDate.split(' ')[2];

        const combinedTimeZone = `${shortTimeZ} - ${timeHr}:${timeMin}${timeNotation} (${timezoneFormatted})`;

        const local = luxon.DateTime.local();

        local.zoneName; //=> 'America/New_York'

        this.setState(state => {
          return {
            ...state,
            currentTimeZoneFormatted: combinedTimeZone,
            timeZone: local.zoneName,
          };
        });

        const event = this.getEvent();

        const startTime = this.getFormattedTime(event.startDate, 'h:mm');
        const endTime = this.getFormattedTime(event.endDate, 'h:mm');
        const startTimeNotation = this.getFormattedTime(event.startDate, 'a');
        const endTimeNotation = this.getFormattedTime(event.endDate, 'a');

        const startDate = new Date(event.startDate);
        const formatted = startDate.toLocaleDateString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric',
        });
        const endDate = new Date(event.endDate);
        const formattedEnd = endDate.toLocaleDateString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric',
        });

        this.setState(state => {
          return {
            ...state,
            eventTitle: event.title,
            endTime: endTime,
            startTime: startTime,
            startTimeNotation: startTimeNotation,
            endTimeNotation: endTimeNotation,
            startDate: formatted,
            endDate: formattedEnd,
          };
        });
        this.dateValidation();
      },

      mounted() {
        this.createDatePickers();

        this.ttpInputUnsubscribe = eventBus.subscribe('ttp-input', data => {
          if (data.method === 'onInput') {
            if (data.name === 'eventTitle') {
              this.setState(state => {
                return { ...state, eventTitle: data.value };
              });
            }
          }
        });

        this.inputSelectUnsubscribe = eventBus.subscribe(
          'input-select',
          data => {
            this.setState(state => {
              return {
                ...state,
                [data.name]: data.value,
              };
            });

            this.dateValidation();

            if (data.name == 'startTime') {
              this.setState(state => {
                return {
                  ...state,
                  endTime: '',
                };
              });
            }
          }
        );

        this.ttpButtonSelectUnsubscribe = eventBus.subscribe(
          'ttp-button-select',
          data => {
            this.setState(state => {
              return { ...state, [data.name]: data.value };
            });
            this.dateValidation();
          }
        );
      },

      updated() {
        if (this.props.isModalVisible) {
          setTimeout(() => {
            this.setState(state => {
              return { ...state, animationIsDone: true };
            });
          }, 300);
        }
      },

      removed() {
        this.clearDatePicker();
        this.ttpInputUnsubscribe();
        this.inputSelectUnsubscribe();
        this.ttpButtonSelectUnsubscribe();
      },

      getEvent() {
        if (!this.props.event.length) return '';
        return JSON.parse(this.props.event);
      },

      clearDatePicker() {
        if (this.startDatePicker) {
          this.startDatePicker.remove();
        }
        if (this.endDatePicker) {
          this.endDatePicker.remove();
        }
      },

      createDatePickers() {
        this.clearDatePicker();

        const startSelector = this.querySelector('#start-date');

        const endSelector = this.querySelector('#end-date');

        const event = this.getEvent();
        const startSelectedDate = new Date(event.startDate);
        const endSelectedDate = new Date(event.endDate);

        let startInRange = true;
        let endInRange = true;

        if (startSelectedDate < new Date()) {
          startInRange = false;
        }

        if (endSelectedDate < new Date()) {
          endInRange = false;
        }

        if (startSelector && endSelector) {
          const dateFormatter = {
            formatter: (input, date, instance) => {
              const value = date.toLocaleDateString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric',
              });
              input.value = value; // => '04/23/2022'
            },
          };
          // eslint-disable-next-line no-undef
          this.startDatePicker = datepicker(startSelector, {
            id: 1,
            ...dateFormatter,
            ...(startInRange && { dateSelected: startSelectedDate }),
            onSelect: (instance, date) => {
              if (typeof date !== 'undefined') {
                const dateObj = new Date(date);
                const formatted = dateObj.toLocaleDateString('en-US', {
                  month: '2-digit',
                  day: '2-digit',
                  year: 'numeric',
                });
                this.setState(state => {
                  return {
                    ...state,
                    startDate: formatted,
                    startTime: '',
                    endTime: '',
                    selectedStartDate: date,
                  };
                });
              } else {
                this.setState(state => {
                  return {
                    ...state,
                    startDate: '',
                    startTime: '',
                    endTime: '',
                    selectedStartDate: '',
                  };
                });
              }
              this.dateValidation();
            },
          });

          this.startDatePicker.setMin(new Date());

          // eslint-disable-next-line no-undef
          this.endDatePicker = datepicker(endSelector, {
            id: 1,
            ...dateFormatter,
            position: 'tl',
            ...(endInRange && { dateSelected: endSelectedDate }),
            onSelect: (instance, date) => {
              if (typeof date !== 'undefined') {
                const dateObj = new Date(date);
                const formatted = dateObj.toLocaleDateString('en-US', {
                  month: '2-digit',
                  day: '2-digit',
                  year: 'numeric',
                });
                this.setState(state => {
                  return {
                    ...state,
                    endDate: formatted,
                    endTime: '',
                    endTimeNotation: 'AM',
                    selectedEndDate: date,
                  };
                });
              } else {
                this.setState(state => {
                  return {
                    ...state,
                    endDate: '',
                    endTime: '',
                    endTimeNotation: 'AM',
                    selectedEndDate: '',
                  };
                });
              }
              this.dateValidation();
            },
          });
        }
      },

      dateValidation() {
        //If the same day selected
        if (
          this.state.startDate === this.state.endDate ||
          this.state.endDate === ''
        ) {
          const listOfTimes = utils.hoursList();
          const findIndex = listOfTimes.findIndex(
            el => el === this.state.startTime
          );

          this.updateList(findIndex, listOfTimes);
          // Start time in PM, but endTime not, change endTime to PM if its the same day, and update the timelist
          if (this.state.startTimeNotation === 'PM') {
            const listOfNotations = this.getArrayOfTimesNotations();
            const findIndexNotation = listOfNotations.findIndex(
              el => el === this.state.startTimeNotation
            );

            this.setState(state => {
              return { ...state, endTimeNotation: 'PM' };
            });
            this.updateEndTimeNotation(findIndexNotation, listOfNotations);
          } else {
            this.resetNotationList();
          }
        } else {
          this.resetList();
          this.resetNotationList();
        }
      },

      // format eg: h:mm a
      getFormattedTime(date, format) {
        const time = luxon.DateTime.fromISO(date).toFormat(format);
        return time;
      },

      getArrayOfTimesNotations() {
        return ['AM', 'PM'];
      },

      closeModal(event) {
        event.preventDefault();
        eventBus.publish('ttp-event-duplicate-modal', {
          method: 'hideEventPlanModal',
          value: false,
        });
      },

      onSubmit(event) {
        event.preventDefault();
        const eventData = this.getEvent();

        const titleValid = this.validateTitleLength();
        if (!titleValid) {
          const ttpInputTitle = this.querySelector('ttp-input#ttp-eventTitle');
          ttpInputTitle.isError = true;
          ttpInputTitle.errorMessage =
            'Title should be less than 60 characters*';

          return;
        }

        //save form
        const startDateLuxon = luxon.DateTime.fromFormat(
          `${this.state.startDate} ${this.state.startTime} ${this.state.startTimeNotation} ${this.state.timeZone}`,
          'LL/dd/yyyy h:mm a z',
          {
            setZone: true,
          }
        ).toString();

        const endDateLuxon = luxon.DateTime.fromFormat(
          `${this.state.endDate} ${this.state.endTime} ${this.state.endTimeNotation} ${this.state.timeZone}`,
          'LL/dd/yyyy h:mm a z',
          {
            setZone: true,
          }
        ).toString();

        eventBus.publish('ttp-event-duplicate-modal', {
          method: 'duplicateEvent',
          data: {
            id: eventData.id,
            title: this.state.eventTitle,
            startDate: startDateLuxon,
            endDate: endDateLuxon,
          },
        });
      },

      validateTitleLength() {
        const title = this.state.eventTitle;
        const titleLength = title.length;

        if (titleLength <= 60) {
          return true;
        }

        return false;
      },

      updateList(index, listOfTimes) {
        const newListOfEndTimes = listOfTimes.slice(index + 1);

        const getEndTimesComponent = this.querySelector('#endTime');
        if (getEndTimesComponent) {
          getEndTimesComponent.list = newListOfEndTimes.toString();
        }
      },

      resetList() {
        const listOfTimes = utils.hoursList();
        const getEndTimesComponent = this.querySelector('#endTime');
        if (getEndTimesComponent) {
          getEndTimesComponent.list = listOfTimes.toString();
        }
      },

      updateEndTimeNotation(index, listOfNotations) {
        const newListEndNotation = listOfNotations.slice(index);

        const newListEndNotationV = this.formatListNotation(newListEndNotation);

        const getEndTimesComponent = this.querySelector('#endTimeNotation');
        if (getEndTimesComponent) {
          getEndTimesComponent.list = JSON.stringify(newListEndNotationV);
        }
      },

      resetNotationList() {
        const listOfTimes = this.getArrayOfTimesNotations();
        const listOfNotation = this.formatListNotation(listOfTimes);

        const getEndTimesNotation = this.querySelector('#endTimeNotation');
        if (getEndTimesNotation) {
          getEndTimesNotation.list = JSON.stringify(listOfNotation);
        }
      },

      formatListNotation(list) {
        const newList = list.map(notation => {
          return { value: notation, title: notation };
        });

        return newList;
      },

      render() {
        return html`
          <ttp-modal is-modal-visible=${this.props.isModalVisible}>
            <div slot="body">
              <div class="eventplan-modal-body">
                <div class="eventplan-modal-body__header">
                  <h3>Event Details</h3>
                  <div
                    class="eventplan-modal-body__close"
                    @click=${this.closeModal}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M0.793256 1.47099C0.614576 1.29231 0.628018 0.98917 0.82328 0.793908C1.01854 0.598645 1.32168 0.585203 1.50036 0.763884L11.2062 10.4698C11.3849 10.6484 11.3715 10.9516 11.1762 11.1468C10.981 11.3421 10.6778 11.3556 10.4991 11.1769L0.793256 1.47099Z"
                        fill="#333333"
                      />
                      <path
                        d="M10.4987 0.823529C10.6774 0.644849 10.9806 0.658291 11.1758 0.853553C11.3711 1.04882 11.3845 1.35196 11.2058 1.53064L1.49996 11.2365C1.32128 11.4152 1.01814 11.4018 0.822878 11.2065C0.627616 11.0112 0.614174 10.7081 0.792854 10.5294L10.4987 0.823529Z"
                        fill="#333333"
                      />
                    </svg>
                  </div>
                </div>
                <div class="eventplan-modal-body__body">
                  <div class="plan-event-container">
                    <div class="plan-title">${this.getModalTitle}</div>
                    <div class="plan-event-form-container">
                      <form class="plan-event-form" @submit=${this.onSubmit}>
                        <div class="inputs-group">
                          <ttp-input
                            name="eventTitle"
                            label="Event Title"
                            value="${this.state.eventTitle}"
                            input-id="event-title"
                            maxlength="60"
                            required="true"
                            id="ttp-eventTitle"
                          ></ttp-input>
                        </div>

                        <div
                          class="inputs-group inputs-group--row-room inputs-group--no-edit"
                        >
                          <ttp-input
                            name="roomTitle"
                            label="Room Title"
                            value=${this.getEventRoom}
                            input-id="room-title"
                            no-user-type-in="true"
                            disabled="true"
                          ></ttp-input>

                          <ttp-input
                            name="roomWidth"
                            label="Width"
                            value=${this.getEventRoomWidth}
                            input-id="room-width"
                            no-user-type-in="true"
                            disabled="true"
                          ></ttp-input>

                          <ttp-input
                            name="roomLength"
                            label="Length"
                            value=${this.getEventRoomLength}
                            input-id="room-length"
                            no-user-type-in="true"
                            disabled="true"
                          ></ttp-input>
                        </div>

                        <div class="inputs-group inputs-group--no-edit">
                          <ttp-input
                            name="eventTimeZone"
                            label="Time Zone"
                            value=${this.state.currentTimeZoneFormatted}
                            input-id="event-timezon"
                            maxlength="60"
                            disabled="true"
                          ></ttp-input>
                        </div>

                        <div class="inputs-group inputs-group--row">
                          <ttp-input
                            name="startDate"
                            label="Start Date"
                            value=${this.getStartDate}
                            input-id="start-date"
                            required="true"
                            no-user-type-in="true"
                          ></ttp-input>

                          <ttp-input-select
                            name="startTime"
                            label="Start Time"
                            value=${this.state.startTime}
                            input-id="start-time"
                            list=${this.getTimes}
                            required="true"
                            id="startTime"
                          ></ttp-input-select>

                          <ttp-button-select
                            name="startTimeNotation"
                            value=${this.state.startTimeNotation}
                            list=${this.getTimeNotation}
                            id="startTimeNotation"
                          ></ttp-button-select>
                        </div>

                        <div class="inputs-group inputs-group--row">
                          <ttp-input
                            name="endDate"
                            label="End Date"
                            value=${this.getEndDate}
                            input-id="end-date"
                            no-user-type-in="true"
                          ></ttp-input>

                          <ttp-input-select
                            name="endTime"
                            label="End Time"
                            value=${this.state.endTime}
                            input-id="end-time"
                            list=${this.getTimes}
                            required="true"
                            id="endTime"
                          ></ttp-input-select>

                          <ttp-button-select
                            name="endTimeNotation"
                            value=${this.state.endTimeNotation}
                            list=${this.getTimeNotation}
                            id="endTimeNotation"
                          ></ttp-button-select>
                        </div>

                        <div class="form-button-group">
                          <button class="btn-cancel" @click=${this.closeModal}>
                            Cancel
                          </button>
                          <button type="submit" class="btn-edit">
                            Save Changes
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ttp-modal>
        `;
      },
    })
  );
}
