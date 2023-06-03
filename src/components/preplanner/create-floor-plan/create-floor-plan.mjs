import { createSwitchComponent } from '../../elements/elements.mjs';

const SVG = window.SVG;
const GRID_SIZE = 60; //Grid is 5ft, 1ft = 12inch, 1inch = 1px
import { utils } from '../../../util/utils.mjs';
/**
 * @param  {object} webcomponent Main WebComponent
 * @param  {object} webcomponent.createComponent createComponent
 * @param  {object} webcomponent.html html compiler
 * @param  {object} webcomponent.renderer rendering the thml
 * @param  {object} webcomponent.withEventBus eventBus wrapper
 * @param  {object} webcomponent.eventBus eventBus instance
 * @param  {object} webcomponent.prePlannerApi planner api
 */
export function createFloorPlanComponent({
  createComponent,
  html,
  renderer,
  withEventBus,
  eventBus,
  prePlannerApi,
}) {
  createComponent(
    'ttp-create-floor-plan',
    withEventBus(eventBus, {
      renderer,
      state() {
        return {
          roomWidth: 0,
          roomLength: 0,
          roomName: '',
          eventTitle: '',
          isGrid: true,
          zoomLevel: 1,
        };
      },

      async created() {
        this.search = window.location.search;

        let params = new URLSearchParams(this.search);
        this.eventId = params.get('id');

        const propsForComponents = {
          createComponent,
          html,
          renderer,
          withEventBus,
          eventBus,
        };
        createSwitchComponent({ ...propsForComponents });
      },

      async mounted() {
        const getEvent = await prePlannerApi.getEvent(this.eventId);

        if (getEvent) {
          this.setState(state => {
            return {
              ...state,
              roomName: getEvent.roomName,
              roomWidth: getEvent.roomWidth,
              roomLength: getEvent.roomLength,
              eventTitle: getEvent.title,
            };
          });

          const panZoomConfig = {
            panning: false,
            pinchZoom: false,
            wheelZoom: false,
          };
          const gridWrapper = this.querySelector('#grid');
          const floorPlanWrapper = this.querySelector('#floor-plan');
          const floorPlanSizedWrapper = this.querySelector('#floor-plan-sizes');

          const { canvasWidth, canvasHeight } = this.getCanvasSizes();

          this.drawFloorPlanSvg = SVG()
            .addTo(floorPlanWrapper)
            .size('100%', '100%')
            .viewbox(0, 0, canvasWidth, canvasHeight)
            .panZoom({ ...panZoomConfig });

          this.drawGrid = SVG().addTo(gridWrapper).size('100%', '100%');

          const widthPx = utils.ftToPx(this.state.roomWidth);
          const lengthPx = utils.ftToPx(this.state.roomLength);
          const oldZoom = this.state.zoomLevel;

          const { zoomLevel, yPos, xPos } = utils.calculateZoomLevel({
            roomWidth: widthPx,
            roomLength: lengthPx,
            canvasWidth: canvasWidth,
            canvasHeight: canvasHeight,
          });

          this.setState(state => {
            return { ...state, zoomLevel: zoomLevel };
          });

          this.drawGridPattern();

          const room = this.drawFloorPlanSvg.rect(lengthPx, widthPx);
          room.attr({ id: 'room-rect' });

          room.fill('rgba(255,255,255,.5)');
          room.stroke({
            color: '#333',
            width: 2,
            miterlimit: 10,
          });

          this.drawSizes = SVG()
            .addTo(floorPlanSizedWrapper)
            .size('100%', '100%');
          const foreignObjectLength = this.drawSizes.foreignObject(110, 28);
          // Pass true as second parameter to SVG() to create an html in the html-namespace
          foreignObjectLength.add(
            SVG(
              `<div class="svg-foreignObject svg-foreignObject--length"><label>Length</label>
                          <div class="input-block"><input id="roomLength" type="text" class="svg-input" value=${this.state.roomLength} maxlength="4"><div class="postfix">FT</div></div>
                         </div>`,
              true
            )
          );

          this.lengthGroup = this.drawSizes.group();
          this.lengthGroup.add(foreignObjectLength);
          this.lengthGroup.addClass('group-length-block');

          const foreignObjectWidth = this.drawSizes.foreignObject(70, 50);
          // Pass true as second parameter to SVG() to create an html in the html-namespace
          foreignObjectWidth.add(
            SVG(
              `<div class="svg-foreignObject svg-foreignObject--width"><label>Width</label>
                          <div class="input-block"><input id="roomWidth" type="text" class="svg-input" value=${this.state.roomWidth} maxlength="4"><div class="postfix">FT</div></div>
                         </div>`,
              true
            )
          );

          this.widthGroup = this.drawSizes.group();
          this.widthGroup.add(foreignObjectWidth);
          this.widthGroup.addClass('group-width-block');

          this.redrawFloorPlan(
            zoomLevel,
            this.state.roomWidth,
            this.state.roomLength,
            oldZoom,
            xPos,
            yPos
          );
        } else {
          // Redirect to home page
          const fromHref = window.location.pathname;
          eventBus.publish('navigation', {
            toHref: '', // to login '/'
            fromHref: fromHref,
          });
        }

        this.subscribedEvents();
      },

      removed() {
        this.checkBoxUnsubscribe();
      },

      launchPlanner() {
        eventBus.publish('navigation', {
          toHref: '/planner',
          params: this.search,
        });
      },

      subscribedEvents() {
        const inputRoomWidth = this.querySelector('#roomWidth');
        const inputRoomLength = this.querySelector('#roomLength');
        const gridWrapper = this.querySelector('#grid');

        const canvasWidth = gridWrapper.getBoundingClientRect().width;
        const canvasHeight = gridWrapper.getBoundingClientRect().height;

        this.checkBoxUnsubscribe = eventBus.subscribe(
          'ttp-ev-checkbox',
          data => {
            this.setState(state => {
              return { ...state, [data.name]: data.checked };
            });
          }
        );

        if (inputRoomWidth) {
          inputRoomWidth.addEventListener('keydown', e =>
            this.onFloorplanResize(e, canvasWidth, canvasHeight)
          );
        }

        if (inputRoomLength) {
          inputRoomLength.addEventListener('keydown', e => {
            this.onFloorplanResize(e, canvasWidth, canvasHeight);
          });
        }
      },

      getCanvasSizes() {
        const floorPlanWrapper = this.querySelector('#grid');

        const canvasWidth = floorPlanWrapper.getBoundingClientRect().width;
        const canvasHeight = floorPlanWrapper.getBoundingClientRect().height;

        console.log('width, height', canvasWidth, canvasHeight);
        return { canvasWidth, canvasHeight };
      },

      onFloorplanResize(event, canvasWidth, canvasHeight) {
        if (event.key === 'Enter') {
          const target = event.target;
          const id = target.id;
          const isWidth = id === 'roomWidth' || false;

          const value = target.value;

          const roomWidth = isWidth ? value : this.state.roomWidth;
          const roomLength = isWidth ? this.state.roomLength : value;

          const roomWidthPx = isWidth
            ? utils.ftToPx(value)
            : utils.ftToPx(this.state.roomWidth);
          const roomLengthPx = isWidth
            ? utils.ftToPx(this.state.roomLength)
            : utils.ftToPx(value);

          const oldZoom = this.state.zoomLevel;

          const { zoomLevel, xPos, yPos } = utils.calculateZoomLevel({
            roomWidth: roomWidthPx,
            roomLength: roomLengthPx,
            canvasWidth: canvasWidth,
            canvasHeight: canvasHeight,
          });

          this.setState(state => {
            return {
              ...state,
              zoomLevel,
              ...(isWidth
                ? {
                    roomWidth: value,
                  }
                : {
                    roomLength: value,
                  }),
            };
          });

          this.redrawFloorPlan(
            zoomLevel,
            roomWidth,
            roomLength,
            oldZoom,
            xPos,
            yPos
          );

          if (isWidth) {
            prePlannerApi.updateEvent(this.eventId, { roomWidth: value });
          } else {
            prePlannerApi.updateEvent(this.eventId, { roomLength: value });
          }
        }
      },

      redrawFloorPlan(zoomLevel, roomWidth, roomLength, oldZoom, xPos, yPos) {
        const room = this.drawFloorPlanSvg.findOne('#room-rect');

        const roomWidthPx = utils.ftToPx(roomWidth);
        const roomLengthPx = utils.ftToPx(roomLength);

        room.size(roomLengthPx, roomWidthPx);

        room.attr({ transform: `translate(${xPos}, ${yPos})` });

        room.stroke({
          width: 2 / zoomLevel,
        });

        this.drawFloorPlanSvg.zoom(oldZoom).zoom(zoomLevel, {});

        const roomRBoxL = room.rbox(this.drawSizes);

        this.lengthGroup.attr({
          transform: `translate(${roomRBoxL.x + roomRBoxL.width / 2 - 55}, ${
            roomRBoxL.y - 34
          })`,
        });
        this.widthGroup.attr({
          transform: `translate(${roomRBoxL.x - 75}, ${roomRBoxL.cy - 25})`,
        });
      },

      drawGridPattern() {
        const rect = this.drawGrid.rect('100%', '100%');

        const patternSmallGrid = this.drawGrid.pattern(
          GRID_SIZE,
          GRID_SIZE,
          function (add) {
            add
              .path(`M ${GRID_SIZE} 0 L 0 0 L 0 ${GRID_SIZE}`)
              .stroke({ color: '#ccc', width: 1 })
              .fill('none');
          }
        );

        rect.attr({ fill: patternSmallGrid });
      },

      render() {
        return html`
          <div class="floor-plan-wrapper">
            <div class="preplanner-header">
              <div class="preplanner-info">
                <div class="preplanner-info preplanner-info__company">
                  ${this.state.eventTitle}
                </div>
                <div class="preplanner-info preplanner-info__room-name">
                  ${this.state.roomName}
                </div>
              </div>
              <div class="preplanner-actions">
                <button class="btn-primary" @click=${this.launchPlanner}>
                  Launch Planner
                </button>
              </div>
            </div>
            <div class="working-area-wrapper">
              <div class="top-actions">
                <ttp-switch
                  label="SHOW GRID"
                  name="isGrid"
                  checked=${this.state.isGrid}
                  switch-id="is-grid"
                ></ttp-switch>
              </div>
              <div
                class="grid ${!this.state.isGrid ? ' hide' : ''}"
                id="grid"
              ></div>
              <div class="floor-plan" id="floor-plan"></div>
              <div class="floor-plan-sizes" id="floor-plan-sizes"></div>
            </div>
          </div>
        `;
      },
    })
  );
}
