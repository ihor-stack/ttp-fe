import {
  createSwitchComponent,
  createInputComponent,
  createButtonSelectComponent,
} from '../elements/elements.mjs';

import { createSideNavComponent } from './elements/sidebar/sidenav.mjs';
import { createShareModalComponent } from './elements/sharemodal.mjs';
import { createToolbarAssetComponent } from './elements/toolbar/toolbar-asset.mjs';
import { createTooltipComponent } from '../elements/tooltip/tooltip.mjs';

import Floorplan from './floorplan.mjs';
import Furniture from './furniture.mjs';

import { ENUM_CATEGORY, ENUM_SHAPES, ENUM_SETUP_TYPE } from './enums.mjs';
import { utils } from '../../util/utils.mjs';

// const GRID_SIZE = 60; //Grid is 5ft, 1ft = 12inch, 1inch = 1px
const ZOOM_STEP = 0.25; //0.02, 25%, 50%, 75%, 100%

const Draggable = window.Draggable;
const gsap = window.gsap;

const ENUM_APP_NAVIGATION_MODE = {
  SELECT: 'select',
  DRAG: 'drag',
};
/**
 * @param  {object} webcomponent Main WebComponent
 * @param  {object} webcomponent.createComponent createComponent
 * @param  {object} webcomponent.html html compiler
 * @param  {object} webcomponent.renderer rendering the thml
 * @param  {object} webcomponent.withEventBus eventBus wrapper
 * @param  {object} webcomponent.eventBus eventBus instance
 * @param  {object} webcomponent.loadStyles loadstyle func
 * @param  {object} webcomponent.plannerApi planner api
 */
export function createPlannerComponent({
  createComponent,
  html,
  renderer,
  withEventBus,
  eventBus,
  loadStyles,
  plannerApi,
}) {
  createComponent(
    'ttp-planner',
    withEventBus(eventBus, {
      renderer,
      props: {
        readOnly: {
          type: Boolean,
          default: false,
        },
      },
      state() {
        return {
          roomName: '',
          eventTitle: '',
          isGrid: true,
          isShareModal: false,
          isShareModalAnimate: false,
          zoomLevel: 1,
          chairs: [],
          tables: [],
          linens: ['None', 'House Linen'],
          // the asset that being selected on the sidenav to be placed on the floorplan
          selectedAsset: {},
          isToolbar: false, // is toolbar on/off
          appNavigationMode: ENUM_APP_NAVIGATION_MODE.SELECT,
        };
      },

      async created() {
        this.floorplan = new Floorplan({
          eventBus: eventBus,
        });

        this.furniture = new Furniture({
          id: 'floor-plan-wrapper',
          eventBus: eventBus,
          readOnly: this.props.readOnly,
        });

        this.search = window.location.search;

        let params = new URLSearchParams(this.search);
        this.eventId = params.get('id');

        this.readOnlyEventId = params.get('e');

        const propsForComponents = {
          createComponent,
          html,
          renderer,
          withEventBus,
          eventBus,
        };
        //Do not load children component, when in read only (share view)
        if (!this.props.readOnly) {
          createSwitchComponent({ ...propsForComponents });
          createInputComponent({ ...propsForComponents });
          createButtonSelectComponent({ ...propsForComponents });
          createShareModalComponent({ ...propsForComponents });
          createSideNavComponent({ ...propsForComponents });
          createToolbarAssetComponent({ ...propsForComponents });
          createTooltipComponent({ ...propsForComponents });

          gsap.registerPlugin(Draggable);
        } else {
          createInputComponent({ ...propsForComponents });
        }
      },

      async mounted() {
        let getEvent = {};
        getEvent =
          !this.props.readOnly &&
          this.eventId &&
          (await plannerApi.getEvent(this.eventId));

        getEvent =
          this.props.readOnly && this.readOnlyEventId
            ? await plannerApi.getEventByShareId(this.readOnlyEventId)
            : getEvent;

        const getTables = await plannerApi.getTables();

        const getChairs = await plannerApi.getChairs();

        if (!this.props.readOnly) {
          if (getTables && getTables.length) {
            this.furniture.setTables(getTables);
            this.setState(state => {
              return { ...state, tables: [...getTables] };
            });
          }

          if (getChairs && getChairs.length) {
            this.furniture.setChairs(getChairs);
            this.setState(state => {
              return { ...state, chairs: [...getChairs] };
            });
          }
        }

        loadStyles({
          component: this,
          src: ['/assets/css/components/planner.css'],
        });

        this.ttpStylesLoadedUnsubscribe = eventBus.subscribe(
          'ttp-styles-loaded',
          () => {
            // If event exits, display it
            if (getEvent) {
              const furnitureList = JSON.parse(getEvent.furniture);

              const shareUrl = `${window.location.origin}/event/?e=${getEvent.shareId}`;
              this.setState(state => {
                return {
                  ...state,
                  roomName: getEvent.roomName,
                  roomWidth: getEvent.roomWidth,
                  roomLength: getEvent.roomLength,
                  eventTitle: getEvent.title,
                  shareUrl,
                };
              });

              const { canvasWidth, canvasHeight } = this.getCanvasSizes();

              const roomWidthPx = utils.ftToPx(this.state.roomWidth);
              const roomLengthPx = utils.ftToPx(this.state.roomLength);

              const { zoomLevel, yPos, xPos } = utils.calculateZoomLevel({
                roomWidth: roomWidthPx,
                roomLength: roomLengthPx,
                canvasWidth: canvasWidth,
                canvasHeight: canvasHeight,
              });

              this.setState(state => {
                return { ...state, zoomLevel: zoomLevel };
              });

              this.floorplan.init(
                this,
                'floor-plan-wrapper',
                canvasWidth,
                canvasHeight
              );

              const drawFloorPlanSvg = this.floorplan.getMainSvg();

              this.floorplan.drawGrid(canvasWidth, canvasHeight);

              const rectWidth = canvasWidth * 100;
              const rectHeight = canvasHeight * 100;
              const rectSelection = drawFloorPlanSvg.rect(
                rectWidth,
                rectHeight
              );

              rectSelection.fill('transparent');

              const rectTranslateX = -rectWidth / 4;
              const rectTranslateY = -rectHeight / 4;

              rectSelection.transform({
                translate: [rectTranslateX, rectTranslateY],
              });

              const selectionWrapperGroup = drawFloorPlanSvg.group();
              selectionWrapperGroup.attr({ id: 'floor-plan-selection' });

              this.floorplan.drawFloorPlan(
                roomWidthPx,
                roomLengthPx,
                zoomLevel,
                yPos,
                xPos
              );

              if (this.props.readOnly) {
                this.dragMode();
              }

              // If there is already furniture in the database, display it.
              if (furnitureList && furnitureList.length) {
                this.furniture.placeFurniture(furnitureList);
              }

              const roomGroup = this.floorplan.getRoomRect();

              selectionWrapperGroup.add(rectSelection);
              selectionWrapperGroup.add(roomGroup);

              let mouseSelectionBox;
              let selectedMainGroup;
              let xStart, yStart;
              let sRectangle;
              let isMultipleSelected = false;
              let isDragging = false;

              //DRAG FUNCTIONS
              //when mouse goes down over background, start drawing selection box
              const selectstart = event => {
                event.preventDefault();
                // Exclude objects, selections from this event
                if (
                  event.buttons === 1 &&
                  this.state.appNavigationMode ===
                    ENUM_APP_NAVIGATION_MODE.SELECT &&
                  !this.props.readOnly
                ) {
                  // console.log('DRAG_START', event);

                  const currentTargetBounding =
                    event.currentTarget.getBoundingClientRect();

                  xStart =
                    (event.clientX - currentTargetBounding.left) /
                    this.state.zoomLevel;
                  yStart =
                    (event.clientY - currentTargetBounding.top) /
                    this.state.zoomLevel;

                  xStart = xStart + rectTranslateX;
                  yStart = yStart + rectTranslateY;

                  // console.log('x', xStart, 'y', yStart);

                  //Mouse Selection Rectangle
                  mouseSelectionBox = selectionWrapperGroup
                    .rect(0, 0)
                    .x(xStart)
                    .y(yStart)
                    .stroke({ width: 1, color: '#9999FF', linecap: 'round' })
                    .fill('none');

                  const findIfSelectionExist = roomGroup.find(
                    '[data-js="main-selection"]'
                  );

                  this.hideToolBar();

                  if (findIfSelectionExist.length) {
                    this.resetSelection();
                    isMultipleSelected = false;
                  }

                  //Create a group within the floorplan to add the selection objects to
                  selectedMainGroup = roomGroup.group();
                  selectedMainGroup.addClass('main-selection');
                  selectedMainGroup.data('js', 'main-selection', true);
                  selectedMainGroup.attr('id', 'main-selection', true);

                  // Biding the mouseUp event to the document, handle the case when the mouse
                  // is out of the window
                  document.addEventListener('mouseup', selectend, {
                    once: true,
                  });
                }
              };

              //when mouse moves during drag, adjust box. If to left or above original point, you have to translate the whole box and invert the dx or dy values since .rect() doesn't take negative width or height
              const selectmove = event => {
                event.preventDefault();
                // if the mouse pressed
                // event.which in Firefox always shows as 1, so event.buttons instead
                if (
                  event.buttons === 1 &&
                  this.state.appNavigationMode ===
                    ENUM_APP_NAVIGATION_MODE.SELECT
                ) {
                  const currentTargetBounding =
                    event.currentTarget.getBoundingClientRect();

                  let dx =
                    (event.clientX - currentTargetBounding.left) /
                    this.state.zoomLevel;
                  let dy =
                    (event.clientY - currentTargetBounding.top) /
                    this.state.zoomLevel;

                  dx = dx + rectTranslateX;
                  dy = dy + rectTranslateY;

                  // rect size
                  let width = dx - xStart;
                  let height = dy - yStart;

                  let xoffset = 0,
                    yoffset = 0;

                  // If selecting to opposite side, need to transform
                  if (width < 0) {
                    xoffset = width;
                    width = -1 * width;
                  }

                  if (height < 0) {
                    yoffset = height;
                    height = -1 * height;
                  }

                  // Start selection if mouse move more then 3px
                  if (width > 3 || height > 3) {
                    // console.log('DRAG_MOVE xStart, yStart', xStart, yStart);

                    isDragging = true;
                    // console.log('move width, height', width, height);

                    if (mouseSelectionBox) {
                      mouseSelectionBox.transform({
                        translateX: xoffset,
                        translateY: yoffset,
                      });

                      mouseSelectionBox.size(width, height);
                      const getBoundingBox = mouseSelectionBox.rbox();

                      const selections = roomGroup.find('[data-level="1"]');

                      selections.forEach(el => {
                        //here, we want to get the x,y vales of each object regardless of what sort of shape it is, but rect uses rx and ry, circle uses cx and cy, etc
                        //so we'll see if the bounding boxes intercept instead
                        let mybounds = el.rbox();

                        const checkIfElInside = !(
                          mybounds.y > getBoundingBox.y2 ||
                          mybounds.x2 < getBoundingBox.x ||
                          mybounds.y2 < getBoundingBox.y ||
                          mybounds.x > getBoundingBox.x2
                        );

                        if (checkIfElInside) {
                          selectedMainGroup.add(el);
                          this.addSelectionItemBox(el);
                        } else {
                          this.removeSelectionItemBox(el);
                          el.toParent(roomGroup);
                        }
                      });
                    }
                  }
                }
              };

              const selectend = () => {
                // console.log('DRAG_END');
                mouseSelectionBox.remove();

                if (isDragging) {
                  // console.log('DRAG_END: isDragging', isDragging);
                  // Add Drag behaviour to the main selected group
                  const floorPlanGroup = this.querySelector('#floor-plan-rect');

                  const selectedMainGroupEl = this.querySelector(
                    '[data-js="main-selection"]'
                  );

                  if (selectedMainGroup.children().length) {
                    const selectedMainGroupBoundingBox =
                      selectedMainGroup.rbox(roomGroup); //relative to the floorplan square

                    sRectangle = selectedMainGroup
                      .rect(0, 0)
                      .stroke({ width: 1, color: '#9999ff' })
                      .fill('transparent');

                    sRectangle.data('js', 'selected-group');

                    sRectangle.size(
                      selectedMainGroupBoundingBox.w,
                      selectedMainGroupBoundingBox.h
                    );
                    sRectangle.x(selectedMainGroupBoundingBox.x);
                    sRectangle.y(selectedMainGroupBoundingBox.y);

                    isMultipleSelected = true;

                    // Disable Drag on the object that are within the selected area
                    const children = selectedMainGroup.find('[data-level="1"]');

                    children.forEach(svgAsset => {
                      const elDraggable = Draggable.get(svgAsset.node);
                      if (elDraggable) {
                        elDraggable.disable();
                      }
                    });

                    const ttpPlaner = this;

                    this.showToolbarAfterSelection();

                    Draggable.create(selectedMainGroupEl, {
                      type: 'x,y',
                      bounds: floorPlanGroup,
                      activeCursor: 'grabbing',
                      onDragStart: function (event, target) {
                        ttpPlaner.hideToolBar();
                      },
                      onDragEnd: function (event) {
                        console.log('event', event.clientX, event.clientY);
                        // Update the position of still selected objects

                        ttpPlaner.resetSelection();

                        ttpPlaner.save();
                      },
                      onClick: function () {},
                    });
                  } else {
                    // console.log('else ondragend');
                    // If nothing was selected, clear out
                    selectedMainGroup.remove();
                    isMultipleSelected = false;
                  }

                  isDragging = false;
                } else {
                  // console.log('DRAG_END: else isDragging', isDragging);

                  const findSelectedMainGroup = roomGroup.find(
                    '[data-js="main-selection"]'
                  )[0];

                  selectedMainGroup.remove();

                  if (findSelectedMainGroup && isMultipleSelected) {
                    this.resetSelection();
                    isMultipleSelected = false;
                  }
                  // console.log('DRAG_END RESET X,Y');
                  xStart = undefined;
                  yStart = undefined;
                  // this.save();
                }
              };

              const floorPlanSelection = this.querySelector(
                `#floor-plan-selection`
              );

              const floorPlanWrapper =
                this.querySelector(`#floor-plan-wrapper`);

              floorPlanSelection.addEventListener('mousedown', selectstart);
              floorPlanSelection.addEventListener('mousemove', selectmove);

              floorPlanWrapper.addEventListener('click', event => {
                if (!isDragging) {
                  xStart = undefined;
                  yStart = undefined;
                }

                // Handling adding assets to the floorplan
                if (Object.keys(this.state.selectedAsset).length) {
                  const roomRBox2 = roomGroup.rbox();
                  const findXPos =
                    (event.clientX - roomRBox2.x) / this.state.zoomLevel;
                  const findYPos =
                    (event.clientY - roomRBox2.y) / this.state.zoomLevel;

                  console.log('roomrbox', roomRBox2, findXPos, findYPos);

                  const isInside = roomGroup.inside(findXPos, findYPos);

                  if (isInside) {
                    this.furniture.addFurniture({
                      asset: this.state.selectedAsset,
                      x: findXPos,
                      y: findYPos,
                    });

                    // reset asset after click/place an object to the floorplan
                    this.setState(state => {
                      return {
                        ...state,
                        selectedAsset: {},
                      };
                    });

                    this.save();
                  }
                }
              });
              this.subscribedEvents();
            } else {
              // Redirect to home page
              const fromHref = window.location.pathname;
              eventBus.publish('navigation', {
                toHref: '', // to login '/'
                fromHref: fromHref,
              });
            }
            //Hide loader has a delay of 300ms
            eventBus.publish('ttp-hide-loader', {
              component: 'ttp-planner',
              resp: 'OK',
            });
          }
        );
      },

      updated() {
        // console.log('updated');
        const floorplan = this.floorplan.getMainSvg();
        if (typeof floorplan !== 'undefined') {
          // Setting up cursor when the asset is selected
          if (Object.keys(this.state.selectedAsset).length) {
            if (this.state.selectedAsset.type.length) {
              this.setCursor({
                category: this.state.selectedAsset.category,
                type: this.state.selectedAsset.type,
              });
            }
          } else {
            this.resetCursor();
          }
        }
      },

      removed() {
        // delete this.drawFloorPlanSvg;
        if (typeof this.ttpCheckboxUnsubscribe !== 'undefined') {
          this.ttpCheckboxUnsubscribe();
        }

        if (typeof this.ttpInputUnsubscribe !== 'undefined') {
          this.ttpInputUnsubscribe();
        }

        if (typeof this.ttpZoomUnsubscribe !== 'undefined') {
          this.ttpZoomUnsubscribe();
        }

        if (typeof this.ttpSidenavUnsubscribe !== 'undefined') {
          this.ttpSidenavUnsubscribe();
        }

        if (typeof this.ttpShareModalUnsubscribe !== 'undefined') {
          this.ttpShareModalUnsubscribe();
        }

        if (typeof this.ttpFurnitureUnsubscribe !== 'undefined') {
          this.ttpFurnitureUnsubscribe();
        }
        if (typeof this.ttpStylesLoadedUnsubscribe !== 'undefined') {
          this.ttpStylesLoadedUnsubscribe();
        }

        if (typeof this.ttpToolbarAssetUnsubscribe !== 'undefined') {
          this.ttpToolbarAssetUnsubscribe();
        }

        if (typeof this.ttpFloorplanUnscubsribe !== 'undefined') {
          this.ttpFloorplanUnscubsribe();
        }
      },

      subscribedEvents() {
        this.ttpFloorplanUnscubsribe = eventBus.subscribe(
          'ttp-floorplan',
          data => {
            if (data.method === 'zoom') {
              const level = data.level;

              this.setState(state => {
                return { ...state, zoomLevel: level };
              });

              this.floorplan.adjustWidthLengthText(level);
            }

            if (data.method === 'panning') {
              this.hideToolBar();
            }
          }
        );

        this.ttpCheckboxUnsubscribe = eventBus.subscribe(
          'ttp-ev-checkbox',
          data => {
            this.setState(state => {
              return { ...state, [data.name]: data.checked };
            });

            this.toggleGrid(data.checked);
          }
        );

        this.ttpInputUnsubscribe = eventBus.subscribe('ttp-input', data => {
          // Fire this event only for the input field with the name: zoomLevel
          if (data.eventKey === 'enter' && data.name === 'zoomLevel') {
            const oldZoomLevel = this.state.zoomLevel;
            this.setState(state => {
              return {
                ...state,
                [data.name]: -1,
              };
            });
            const valueSplit = data.value.split('%');
            const value = +valueSplit[0];
            const regENumbersOnly = new RegExp('^[0-9]+$', 'g');
            const isNumbersOnly = regENumbersOnly.test(value);

            if (isNumbersOnly) {
              const valueValidation = value > 100 ? 100 : value < 2 ? 2 : value;

              const valueFormatted = valueValidation / 100;

              this.setState(state => {
                return {
                  ...state,
                  [data.name]: valueFormatted,
                };
              });
            } else {
              this.setState(state => {
                return {
                  ...state,
                  [data.name]: oldZoomLevel, //reset to the preced value
                };
              });
            }
            eventBus.publish('ttp-zoom', { oldZoomLevel });
          }
        });

        this.ttpZoomUnsubscribe = eventBus.subscribe('ttp-zoom', data => {
          const oldZoomLevel = data.oldZoomLevel;
          const zoomLevel = this.state.zoomLevel;

          this.floorplan.onZooming(oldZoomLevel, zoomLevel);
        });

        this.ttpSidenavUnsubscribe = eventBus.subscribe('ttp-sidenav', data => {
          if (
            data.method === 'ttp-add-chair' ||
            data.method === 'ttp-add-table' ||
            data.method === 'ttp-reset'
          ) {
            // Allow placing furniture only if the app in the select mode.
            if (
              this.state.appNavigationMode === ENUM_APP_NAVIGATION_MODE.SELECT
            ) {
              this.setState(state => {
                return { ...state, selectedAsset: data.selectedAsset };
              });
            }
          }

          if (data.method === 'ttp-add-setup') {
            if (data.type === ENUM_SETUP_TYPE.THEATER) {
              const {
                chairsTotal,
                chairSpacing,
                chairsPerRow,
                rowsTotal,
                rowSpacing,
                aisles,
                aisleWidth,
              } = data.data;

              const rowSpacingFt = utils.ftToPx(rowSpacing);
              const aisleWidthFt = utils.ftToPx(aisleWidth);

              this.furniture.placeTheaterSetup({
                chairsTotal,
                chairSpacing,
                chairsPerRow,
                rowsTotal,
                rowSpacing: rowSpacingFt,
                aisles,
                aisleWidth: aisleWidthFt,
              });
              this.save();
            }

            if (data.type === ENUM_SETUP_TYPE.CLASSROOM) {
              const {
                tablesTotal,
                tableSpacing,
                tablesPerRow,
                rowsTotal,
                rowSpacing,
                chairsPerTable,
                aisles,
                aisleWidth,
              } = data.data;

              const rowSpacingFt = utils.ftToPx(rowSpacing);
              const aisleWidthFt = utils.ftToPx(aisleWidth);

              this.furniture.placeClassroomSetup({
                tablesTotal,
                tableSpacing,
                tablesPerRow,
                rowsTotal,
                rowSpacing: rowSpacingFt,
                chairsPerTable,
                aisles,
                aisleWidth: aisleWidthFt,
              });
              this.save();
            }

            if (data.type === ENUM_SETUP_TYPE.BANQUET) {
              const {
                isAligned,
                tablesTotal,
                tableSpacing,
                rowsTotal,
                chairsPerTable,
              } = data.data;

              const tableSpacingFt = utils.ftToPx(tableSpacing);

              this.furniture.placeBanquetSetup({
                isAligned,
                tablesTotal,
                tableSpacing: tableSpacingFt,
                rowsTotal,
                chairsPerTable,
              });
              this.save();
            }
          }
        });

        this.ttpShareModalUnsubscribe = eventBus.subscribe(
          'ttp-share-modal',
          data => {
            if (data.method === 'hideShareModal') {
              this.setState(state => {
                return { ...state, isShareModalAnimate: false };
              });
              setTimeout(() => {
                this.setState(state => {
                  return { ...state, isShareModal: false };
                });
              }, 200);
            }
          }
        );

        this.ttpFurnitureUnsubscribe = eventBus.subscribe(
          'ttp-furniture',
          data => {
            if (
              this.state.appNavigationMode === ENUM_APP_NAVIGATION_MODE.SELECT
            ) {
              // Click on furniture brings toolbar
              if (data.eventType === 'click') {
                const assetId = data.assetId;

                this.showToolbar(assetId);
              }

              if (data.eventType === 'dblclick') {
                this.resetSelection();
                this.hideToolBar();
                this.resetDbClickClass();
                this.setDblckickClass(data.assetId);
                const assetId = data.assetId;

                const assetCategory = this.furniture.getCategory(assetId);
                const assetType = this.furniture.getType(assetId);
                const assetRotation = this.furniture.getRotation(assetId);
                const linen = this.furniture.getTableLinen(assetId);
                console.log(
                  assetId,
                  assetCategory,
                  assetType,
                  assetRotation,
                  linen
                );

                this.setToolbarProps({
                  assetId,
                  assetCategory,
                  assetType,
                  assetRotation,
                  tableLinen: linen ? 'House Linen' : 'None',
                });
              }

              if (data.eventType === 'dragstart') {
                const iconId = data.assetDomId;

                this.hideToolBar();
                this.setActiveAssetClass({ id: iconId });
                this.resetSelection();
              }

              if (
                data.eventType === 'assetAdded' ||
                data.eventType === 'dragend'
              ) {
                this.removeActiveAssetClass();
                this.resetDbClickClass();
                this.save();
              }
            }
          }
        );

        this.ttpToolbarAssetUnsubscribe = eventBus.subscribe(
          'ttp-toolbar-asset',
          data => {
            if (data.method === 'onRemoveAsset') {
              const assetId = data.assetId;
              const isBulk = data.isBulk;

              if (isBulk) {
                const bulkAssetsIds = JSON.parse(data.bulkAssetsIds);
                this.resetSelection();
                bulkAssetsIds.map(id => {
                  const assetEl = this.querySelector(`#${id}`);
                  const drg = Draggable.get(assetEl);

                  if (typeof drg !== 'undefined') {
                    drg.kill();
                  }
                  assetEl.remove();
                });
              } else {
                const assetEl = this.querySelector(`#${assetId}`);
                const drg = Draggable.get(assetEl);

                if (typeof drg !== 'undefined') {
                  drg.kill();
                }
                assetEl.remove();
              }
              this.hideToolBar();
              this.save();
            }

            if (data.method === 'onChangeChairType') {
              const assetId = data.data.id;
              const assetType = data.data.type;
              const isBulk = data.data.isBulk;

              const getAsset = this.state.chairs.filter(
                chair => chair.type === assetType
              )[0];

              if (isBulk) {
                const bulkAssetsIds = JSON.parse(data.data.bulkAssetsIds);
                bulkAssetsIds.map(assetId => {
                  this.furniture.changeFurnitureType({
                    assetDomId: assetId,
                    asset: getAsset,
                  });

                  this.setToolbarProps({
                    assetType: assetType,
                    assetCategory: ENUM_CATEGORY.CHAIR,
                  });
                });
              } else {
                this.furniture.changeFurnitureType({
                  assetDomId: assetId,
                  asset: getAsset,
                });

                this.setToolbarProps({
                  assetType: assetType,
                  assetCategory: ENUM_CATEGORY.CHAIR,
                });
              }

              this.save();
            }

            if (data.method === 'onChangeTableType') {
              const assetId = data.data.id;
              const assetType = data.data.type;
              const isBulk = data.data.isBulk;

              const getAsset = this.state.tables.filter(
                table => table.type === assetType
              )[0];

              if (isBulk) {
                const bulkAssetsIds = JSON.parse(data.data.bulkAssetsIds);
                bulkAssetsIds.map(assetId => {
                  this.furniture.changeFurnitureType({
                    assetDomId: assetId,
                    asset: getAsset,
                  });

                  const { count } = this.furniture.getTableChairs(assetId);

                  this.setToolbarProps({
                    assetType: getAsset.type,
                    assetCategory: ENUM_CATEGORY.TABLE,
                    tableChairsCount: count,
                  });
                });
              } else {
                this.furniture.changeFurnitureType({
                  assetDomId: assetId,
                  asset: getAsset,
                });

                const { count } = this.furniture.getTableChairs(assetId);

                this.setToolbarProps({
                  assetType: getAsset.type,
                  assetCategory: ENUM_CATEGORY.TABLE,
                  tableChairsCount: count,
                });
              }

              this.save();
            }

            if (data.method === 'onAssetRotation') {
              const assetId = data.data.id;
              const rotationDegree = data.data.rotation;
              const isBulk = data.data.isBulk;

              if (isBulk) {
                const bulkAssetsIds = JSON.parse(data.data.bulkAssetsIds);
                bulkAssetsIds.map(assetId => {
                  this.furniture.rotateFurniture({
                    assetDomId: assetId,
                    degree: rotationDegree,
                  });

                  this.setToolbarProps({ assetRotation: rotationDegree });
                });
              } else {
                this.furniture.rotateFurniture({
                  assetDomId: assetId,
                  degree: rotationDegree,
                });

                this.setToolbarProps({ assetRotation: rotationDegree });
              }

              this.save();
            }

            if (data.method === 'onChairsPreview') {
              const assetId = data.data.id;
              const value = data.data.value;
              const chairType = data.data.chairType;
              const type = data.data.type;

              const isBulk = data.data.isBulk;

              if (isBulk) {
                const bulkAssetsIds = JSON.parse(data.data.bulkAssetsIds);
                bulkAssetsIds.map(assetId => {
                  this.onChairsPreview(assetId, value, chairType, type);
                });
              } else {
                this.onChairsPreview(assetId, value, chairType, type);
              }
            }

            if (data.method === 'onTableChairsRemove') {
              const assetId = data.data.id;
              const isBulk = data.data.isBulk;

              if (isBulk) {
                const bulkAssetsIds = JSON.parse(data.data.bulkAssetsIds);
                bulkAssetsIds.map(assetId => {
                  this.furniture.removeTableChairsResetType(assetId);
                });
              } else {
                this.furniture.removeTableChairsResetType(assetId);
              }
              this.setToolbarProps({
                tableChairsCount: -1,
                tableChairsType: 'chiavari',
              });
            }

            if (data.method === 'onTableChairsConfirm') {
              const assetId = data.data.id;
              const value = data.data.value;
              const type = data.data.type;
              let chairType = data.data.chairType;
              const isBulk = data.data.isBulk;

              if (type === ENUM_SHAPES.ROUND) {
                if (value > 0 && value <= 12) {
                  if (isBulk) {
                    const bulkAssetsIds = JSON.parse(data.data.bulkAssetsIds);
                    bulkAssetsIds.map(assetId => {
                      this.furniture.confirmChairsOnRoundTable(assetId, value);
                    });
                  } else {
                    this.furniture.confirmChairsOnRoundTable(assetId, value);
                  }
                  chairType = value === 0 ? 'chiavari' : chairType;

                  // update props
                  this.setToolbarProps({
                    tableChairsCount: value,
                    tableChairsType: chairType,
                  });

                  this.save();
                }
              }

              if (type === ENUM_SHAPES.RECTANGULAR) {
                if (value > 0 && value <= 6) {
                  if (isBulk) {
                    const bulkAssetsIds = JSON.parse(data.data.bulkAssetsIds);
                    bulkAssetsIds.map(assetId => {
                      this.furniture.confirmChairsOnRectTable(assetId, value);
                    });
                  } else {
                    this.furniture.confirmChairsOnRectTable(assetId, value);
                  }
                  chairType = value === 0 ? 'chiavari' : chairType;
                  // update props
                  this.setToolbarProps({
                    tableChairsCount: value,
                    tableChairsType: chairType,
                  });

                  this.save();
                }
              }
            }

            if (data.method === 'onResetChairs') {
              const assetId = data.data.id;
              const value = data.data.value;

              const isBulk = data.data.isBulk;

              const chairType = data.data.chairType;
              const type = data.data.type;
              const defaultChair = this.state.chairs.filter(
                chair => chair.type === chairType && chair
              )[0];

              this.setToolbarProps({ tableChairsCount: value });

              if (type === ENUM_SHAPES.ROUND) {
                if (isBulk) {
                  const bulkAssetsIds = JSON.parse(data.data.bulkAssetsIds);
                  bulkAssetsIds.map(assetId => {
                    this.furniture.resetChairsOnRoundTable(
                      assetId,
                      value,
                      defaultChair
                    );
                  });
                } else {
                  this.furniture.resetChairsOnRoundTable(
                    assetId,
                    value,
                    defaultChair
                  );
                }
              }

              if (type === ENUM_SHAPES.RECTANGULAR) {
                if (isBulk) {
                  const bulkAssetsIds = JSON.parse(data.data.bulkAssetsIds);
                  bulkAssetsIds.map(assetId => {
                    this.furniture.resetChairsOnRectTable(
                      assetId,
                      value,
                      defaultChair
                    );
                  });
                } else {
                  this.furniture.resetChairsOnRectTable(
                    assetId,
                    value,
                    defaultChair
                  );
                }
              }
            }

            if (data.method === 'onChangeTableChairType') {
              const assetId = data.data.id;
              const chairType = data.data.chairType;
              const type = data.data.type;

              const isBulk = data.data.isBulk;

              const getAsset = this.state.chairs.filter(
                chair => chair.type === chairType
              )[0];

              if (type === ENUM_SHAPES.ROUND) {
                if (isBulk) {
                  const bulkAssetsIds = JSON.parse(data.data.bulkAssetsIds);
                  bulkAssetsIds.map(assetId => {
                    this.furniture.changeTableChairsType({
                      assetDomId: assetId,
                      asset: getAsset,
                    });
                  });
                } else {
                  this.furniture.changeTableChairsType({
                    assetDomId: assetId,
                    asset: getAsset,
                  });
                }
              }

              if (type === ENUM_SHAPES.RECTANGULAR) {
                if (isBulk) {
                  const bulkAssetsIds = JSON.parse(data.data.bulkAssetsIds);
                  bulkAssetsIds.map(assetId => {
                    this.furniture.changeChairsTypeOnRectTable({
                      assetDomId: assetId,
                      asset: getAsset,
                    });
                  });
                } else {
                  this.furniture.changeChairsTypeOnRectTable({
                    assetDomId: assetId,
                    asset: getAsset,
                  });
                }
              }

              this.setToolbarProps({
                tableChairsType: chairType,
                assetCategory: ENUM_CATEGORY.TABLE,
              });

              this.save();
            }

            if (data.method === 'onChangeTableLinen') {
              const assetId = data.data.id;
              const value = data.data.value;
              const isBulk = data.data.isBulk;

              let isLinen = false;
              if (value === 'House Linen') {
                isLinen = true;
              }

              if (isBulk) {
                const bulkAssetsIds = JSON.parse(data.data.bulkAssetsIds);
                bulkAssetsIds.map(assetId => {
                  this.furniture.setTableLinen(assetId, isLinen);

                  this.setToolbarProps({
                    tableLinen: value,
                  });
                });
              } else {
                this.furniture.setTableLinen(assetId, isLinen);

                this.setToolbarProps({
                  tableLinen: value,
                });
              }

              this.save();
            }

            if (data.method === 'onDuplicateFurniturePreview') {
              const domId = data.data.id;
              const value = data.data.value;
              const category = data.data.category; // chair, table

              this.furniture.previewDuplicateFurniture({
                id: domId,
                value,
                category,
                zoomLevel: this.state.zoomLevel,
              });
            }

            if (data.method === 'onDuplicateFurniture') {
              // const id = data.data.id;
              // const value = data.data.value;
              // const category = data.data.type; // chair, table
              // const type = data.data.type;

              this.furniture.confirmDuplicateFurniture();
              this.save();
            }

            if (data.method === 'onDuplicateFurnitureReset') {
              this.furniture.resetDuplicateFurniture();
            }

            if (data.method === 'onDuplicateFurnitureBulk') {
              const domIds = JSON.parse(data.data.ids);

              this.furniture.duplicateFurnitureBulk({
                ids: domIds,
                zoomLevel: this.state.zoomLevel,
              });

              this.save();
            }
          }
        );
      },

      resetSelection() {
        const roomGroup = this.floorplan.getRoomRect();
        const draggableChildrenToUpdate = [];
        const findSelectedMainGroup = roomGroup.find(
          '[data-js="main-selection"]'
        );

        if (findSelectedMainGroup.length) {
          const selectionMainGroup = findSelectedMainGroup[0];
          const sRectangle = selectionMainGroup.find(
            '[data-js="selected-group"]'
          )[0];

          const children = selectionMainGroup.find('[data-level="1"]');

          const killMainDrag = Draggable.get(selectionMainGroup.node);
          killMainDrag.kill();

          children.forEach(svgAsset => {
            const id = svgAsset.node.id;
            draggableChildrenToUpdate.push(id);
            this.removeSelectionItemBox(svgAsset);
          });

          selectionMainGroup.ungroup();
          sRectangle.remove();

          draggableChildrenToUpdate.forEach(svgAssetId => {
            const el = this.querySelector(`#${svgAssetId}`);
            const elDraggable = Draggable.get(el);

            this.smoothOriginChange(el, 'top left', this.state.zoomLevel);

            if (elDraggable) {
              elDraggable.enable();
            }
          });
        }
      },

      smoothOriginChange(targets, transformOrigin, zoomLevel) {
        gsap.utils.toArray(targets).forEach(function (target) {
          const before = target.getBoundingClientRect();
          gsap.set(target, { transformOrigin: transformOrigin });
          const after = target.getBoundingClientRect();
          gsap.set(target, {
            x: '+=' + (before.left - after.left) / zoomLevel,
            y: '+=' + (before.top - after.top) / zoomLevel,
          });
        });
      },

      addSelectionItemBox(el) {
        const selectionRectangle = el.find('.selection-rectangle')[0];
        selectionRectangle.addClass('show');
      },

      removeSelectionItemBox(el) {
        const selectionRectangle = el.find('.selection-rectangle')[0];
        selectionRectangle.removeClass('show');
      },

      getCanvasSizes() {
        const floorPlanWrapper = this.querySelector('.working-area-wrapper');

        const canvasWidth = floorPlanWrapper.getBoundingClientRect().width;
        const canvasHeight = floorPlanWrapper.getBoundingClientRect().height;

        console.log('width, height', canvasWidth, canvasHeight);
        return { canvasWidth, canvasHeight };
      },

      hideToolBar() {
        if (this.state.isToolbar) {
          console.log('hideToolbar');

          const id = this.getActiveAssetId();

          if (id) {
            this.furniture.removePreviewChairs(id);

            // When hidding the toolbar, remove all duplicates if they werent confirmed
            this.furniture.resetDuplicateFurniture();
          }

          const roomGroup = this.floorplan.getRoomRect();
          const findSelectedMainGroup = roomGroup.find(
            '[data-js="main-selection"]'
          )[0];

          if (typeof findSelectedMainGroup !== 'undefined') {
            const children = findSelectedMainGroup.find('g[data-level="1"]');

            if (children.length) {
              children.map(child => {
                let id = child.node.id;
                this.furniture.removePreviewChairs(id);
              });
            }
          }

          this.removeActiveAssetClass();
          this.resetDbClickClass();
          this.setState(state => {
            return {
              ...state,
              isToolbar: false,
            };
          });

          this.setToolbarProps({
            assetId: '',
            assetCategory: '',
            assetType: '',
            assetRotation: 0,
            tableChairsCount: -1,
            tableChairsType: 'chiavari',
            isBulk: false,
            bulkAssetsIds: '',
            isSimpleToolbar: false,
          });
        }
      },

      showToolbar(assetId) {
        const id = this.getActiveAssetId();

        if (id !== assetId) {
          this.resetDbClickClass();
          this.resetSelection();
          this.hideToolBar();

          const assetCategory = this.furniture.getCategory(assetId);
          const assetType = this.furniture.getType(assetId);
          const assetRotation = this.furniture.getRotation(assetId);
          const linen = this.furniture.getTableLinen(assetId);
          const { count, type } = this.furniture.getTableChairs(assetId);

          const setup = this.furniture.getSetup(assetId);

          this.setToolbarProps({
            assetId,
            assetCategory,
            assetType,
            assetRotation,
            tableChairsCount: count,
            tableChairsType: type,
            tableLinen: linen ? 'House Linen' : 'None',
            setup: setup,
          });
          // Get chairs count and name if any added to the table

          //Set toolbar visibility at last, once all animations are done and props are set
          setTimeout(() => {
            this.setState(state => {
              return {
                ...state,
                isToolbar: true,
              };
            });
          }, 0);

          this.setActiveAssetClass({ id: assetId });
        }
      },

      showToolbarAfterSelection() {
        // 1. Verify if the assets are the same
        const mainSelection = this.querySelector('[data-js="main-selection"]');
        const children = Array.from(mainSelection.children);
        const furnitureList = children.filter(child => child.tagName === 'g');

        let isFurnitureSame = true;
        let bulkAssetsIds = [];

        let hash = {
          category: undefined,
          type: undefined,
          linen: undefined,
          chairsCount: undefined,
          chairsType: undefined,
          rotate: undefined,
        };

        const verify = (prop, val) => {
          if (hash[prop] === undefined) {
            hash[prop] = val;
          } else {
            if (hash[prop] !== val) {
              isFurnitureSame = false;
              return;
            }
          }
        };

        furnitureList.map(furniture => {
          const assetId = furniture.id;
          bulkAssetsIds.push(assetId);
        });

        furnitureList.map(furniture => {
          const assetId = furniture.id;
          const assetCategory = this.furniture.getCategory(assetId);
          const assetType = this.furniture.getType(assetId);
          const linen = this.furniture.getTableLinen(assetId);

          const rotation = this.furniture.getRotation(assetId);

          const { count, type } = this.furniture.getTableChairs(assetId);

          verify('category', assetCategory);
          verify('type', assetType);
          verify('linen', linen);
          verify('rotate', rotation);
          verify('chairsCount', count);
          verify('chairsType', type);
        });

        if (isFurnitureSame) {
          // Show toolbar for type...
          this.showGeneralToolbar({
            bulkAssetsIds,
            assetCategory: hash.category,
            assetType: hash.type,
            assetRotation: hash.rotate,
            tableChairsCount: hash.chairsCount,
            tableChairsType: hash.chairsType,
            tableLinen: hash.linen,
          });
        } else {
          // Show general toolbar with duplicate and delete only
          this.showSimpleToolbar(bulkAssetsIds);
        }

        console.log('isFurnitureSame', isFurnitureSame, hash);
      },

      showSimpleToolbar(bulkAssetsIds) {
        this.setToolbarProps({
          isBulk: true,
          bulkAssetsIds,
          isSimpleToolbar: true,
        });

        //Set toolbar visibility at last, once all animations are done and props are set
        setTimeout(() => {
          this.setState(state => {
            return {
              ...state,
              isToolbar: true,
            };
          });
        }, 0);
      },

      showGeneralToolbar({
        bulkAssetsIds,
        assetCategory,
        assetType,
        assetRotation,
        tableChairsCount,
        tableChairsType,
        tableLinen,
      }) {
        this.setToolbarProps({
          isBulk: true,
          bulkAssetsIds,
          isSimpleToolbar: false,
          assetCategory,
          assetType,
          assetRotation,
          tableChairsCount: tableChairsCount,
          tableChairsType,
          tableLinen: tableLinen ? 'House Linen' : 'None',
        });

        //Set toolbar visibility at last, once all animations are done and props are set
        setTimeout(() => {
          this.setState(state => {
            return {
              ...state,
              isToolbar: true,
            };
          });
        }, 0);
      },

      /**
       * @description Toggling the Grid
       * @param {boolean} isOn value to toggle the grid
       */
      toggleGrid(isOn) {
        const grid = this.querySelector('#grid-wrapper');

        if (isOn) {
          grid.classList.remove('hide');
        } else {
          grid.classList.add('hide');
        }
      },

      /**
       * @description Display tooltip
       * @param {object} event event that has target element
       * @param {number} distance how far tooltip shown from the triggered element
       */
      onShowTooltip(event, distance) {
        const target = event.currentTarget;

        const tooltip = target.querySelector('ttp-tooltip');

        tooltip.distance = distance;
        tooltip.visible = true;
      },

      /**
       * @description  Hide tooltip
       * @param {object} event event that has target element
       */
      onHideTooltip(event) {
        const target = event.currentTarget;
        const tooltip = target.querySelector('ttp-tooltip');

        tooltip.distance = 0;
        tooltip.visible = false;
      },

      /**
       * @description Set cursor icon based on the selected asset type
       * eg: chair, table-round, table-rectange, which comes from the
       * ttp-sidenav component
       * @param {object} asset main asset
       * @param {string} asset.category asset category eg chair, table, setup
       * @param {string} asset.type asset type : chiavari, round, rectangle
       */
      setCursor({ category, type }) {
        this.resetCursor();
        const drawFloorPlanSvg = this.floorplan.getMainSvg();
        const floorPlanGroup = drawFloorPlanSvg.findOne('#floor-plan-rect');

        const floorPlanSelection = drawFloorPlanSvg.findOne(
          '#floor-plan-selection'
        );

        floorPlanSelection.addClass('no-drop');
        floorPlanGroup.addClass(`cursor--${category} ${type}`);
      },

      resetCursor() {
        const drawFloorPlanSvg = this.floorplan.getMainSvg();
        const floorPlanGroup = drawFloorPlanSvg.findOne('#floor-plan-rect');
        const floorPlanSelection = drawFloorPlanSvg.findOne(
          '#floor-plan-selection'
        );
        if (floorPlanGroup) {
          const getClasses = floorPlanGroup.classes();
          getClasses.map(floorPlanCursorClass => {
            floorPlanGroup.removeClass(floorPlanCursorClass);
          });
        }

        if (floorPlanSelection) {
          floorPlanSelection.removeClass('no-drop');
        }
      },

      /**
       * @description Onclick event for the zoom in button
       */
      onZoomIn() {
        const currentZoomLevel = this.state.zoomLevel;
        let newZoomLevel = currentZoomLevel + ZOOM_STEP;

        newZoomLevel = newZoomLevel > 1 ? 1 : newZoomLevel;
        if (newZoomLevel !== this.state.zoomLevel) {
          this.setState(state => {
            return { ...state, zoomLevel: newZoomLevel };
          });

          eventBus.publish('ttp-zoom', {
            type: 'zoomin',
            oldZoomLevel: currentZoomLevel,
          });

          this.hideToolBar();
        }
      },

      /**
       * @description Onclick for the zoom out button
       */
      onZoomOut() {
        const currentZoomLevel = this.state.zoomLevel;
        let newZoomLevel = currentZoomLevel - ZOOM_STEP;

        newZoomLevel = newZoomLevel < 0.02 ? 0.02 : newZoomLevel;

        if (newZoomLevel !== this.state.zoomLevel) {
          this.setState(state => {
            return { ...state, zoomLevel: newZoomLevel };
          });

          eventBus.publish('ttp-zoom', {
            type: 'zoomout',
            oldZoomLevel: currentZoomLevel,
          });

          this.hideToolBar();
        }
      },

      getActiveAssetId() {
        const drawFloorPlanSvg = this.floorplan.getMainSvg();
        const getAllAssets = drawFloorPlanSvg.find('[data-level="1"]');

        let id = false;
        getAllAssets.forEach(asset => {
          if (asset.hasClass('active')) {
            id = asset.attr('id');
          }
        });
        return id;
      },
      /**
       * @description Set active class to the svg group eg: chair,
       * table to change the color of it to red
       * @param  {object} asset svg group element
       * @param {string} asset.id id of the group element
       */
      setActiveAssetClass({ id }) {
        const svgAsset = this.querySelector(`#${id}`);
        svgAsset.classList.add('active');
      },

      /**
       * @description Removing active class from the furniture
       */
      removeActiveAssetClass() {
        const drawFloorPlanSvg = this.floorplan.getMainSvg();
        const getAllAssets = drawFloorPlanSvg.find('[data-js="svg-asset"]');
        getAllAssets.forEach(asset => {
          asset.removeClass('active');
        });
      },

      openShareModal() {
        this.setState(state => {
          return { ...state, isShareModal: true };
        });
        setTimeout(() => {
          this.setState(state => {
            return { ...state, isShareModalAnimate: true };
          });
        }, 0);
      },

      /**
       * @description Preview chairs on the table
       * @param {string} tableId domId of the table where to preview the chairs
       * @param {number} value amount of the chairs to preview, max 12, default is Chiavari
       * @param {string} chairType  default is chiavari
       * @param {string} tableType  round, rectangular
       */
      onChairsPreview(tableId, value, chairType, tableType) {
        const max = tableType === ENUM_SHAPES.ROUND ? 12 : 6;
        if (value >= 0 && value <= max) {
          const defaultChair = this.state.chairs.filter(
            chair => chair.type === chairType && chair
          )[0];

          if (tableType === ENUM_SHAPES.ROUND) {
            this.furniture.previewChairsOnRoundTable({
              value,
              tableId,
              chair: defaultChair,
            });
          }

          if (tableType === ENUM_SHAPES.RECTANGULAR) {
            this.furniture.previewChairsOnRectTable({
              value,
              tableId,
              chair: defaultChair,
            });
          }
        }
      },

      setToolbarProps({
        assetId,
        assetCategory,
        assetType,
        assetRotation,
        tableChairsCount,
        tableChairsType,
        tableLinen,
        isBulk,
        bulkAssetsIds,
        isSimpleToolbar,
        setup,
      }) {
        // console.log('setToolbarProps: tableChairsCount', tableChairsCount);
        const ttpToolbar = this.querySelector('ttp-toolbar-asset');

        if (typeof assetId !== 'undefined') {
          ttpToolbar.assetId = assetId;
        }

        if (typeof assetCategory !== 'undefined') {
          ttpToolbar.assetCategory = assetCategory;
        }

        if (typeof assetType !== 'undefined') {
          ttpToolbar.assetType = assetType;
        }

        if (typeof assetRotation !== 'undefined') {
          ttpToolbar.assetRotation = assetRotation;
        }

        if (this.state.chairs.length) {
          ttpToolbar.chairs = JSON.stringify(this.state.chairs);
        }

        if (this.state.tables.length) {
          ttpToolbar.tables = JSON.stringify(this.state.tables);
        }

        if (typeof tableChairsCount !== 'undefined') {
          ttpToolbar.tableChairsCount = tableChairsCount;
        }

        if (typeof tableChairsType !== 'undefined') {
          ttpToolbar.tableChairsType = tableChairsType;
        }

        if (this.state.linens.length) {
          ttpToolbar.linens = JSON.stringify(this.state.linens);
        }

        if (typeof tableLinen !== 'undefined') {
          ttpToolbar.tableLinen = tableLinen;
        }

        if (typeof isBulk !== 'undefined') {
          ttpToolbar.isBulk = isBulk;
        }

        if (typeof bulkAssetsIds !== 'undefined') {
          ttpToolbar.bulkAssetsIds = JSON.stringify(bulkAssetsIds);
        }

        if (typeof isSimpleToolbar !== 'undefined') {
          ttpToolbar.isSimpleToolbar = isSimpleToolbar;
        }

        if (typeof setup !== 'undefined') {
          ttpToolbar.setup = JSON.stringify(setup);
        }
      },

      setDblckickClass(assetId) {
        const assetEl = this.querySelector(`#${assetId}`);
        const assetParent = assetEl.parentElement;
        assetParent.classList.add('dblclick');
        assetEl.classList.add('dblclick-selected');
      },

      resetDbClickClass() {
        const drawFloorPlanSvg = this.floorplan.getMainSvg();
        const getAllAssets = drawFloorPlanSvg.find('[data-js="svg-asset"]');
        getAllAssets.forEach(asset => {
          asset.removeClass('dblclick');
          asset.removeClass('dblclick-selected');
        });
      },

      /**
       * @description Activate select mode
       * @param {*} event object
       */
      onSelectMode(event) {
        event.preventDefault();

        if (this.state.appNavigationMode !== ENUM_APP_NAVIGATION_MODE.SELECT) {
          this.setState(state => {
            return {
              ...state,
              appNavigationMode: ENUM_APP_NAVIGATION_MODE.SELECT,
            };
          });

          this.enableDragOnObjects();
          this.floorplan.selectMode();
        }
      },

      /**
       * @description Activate drag mode
       * @param {*} event object
       */
      onDragMode(event) {
        event.preventDefault();
        this.dragMode();
      },

      dragMode() {
        if (this.state.appNavigationMode !== ENUM_APP_NAVIGATION_MODE.DRAG) {
          this.setState(state => {
            return {
              ...state,
              appNavigationMode: ENUM_APP_NAVIGATION_MODE.DRAG,
            };
          });

          this.resetSelection();
          this.hideToolBar();
          this.disableDragOnObjects();
          this.floorplan.dragMode();
        }
      },

      disableDragOnObjects() {
        const firstLevel = this.furniture.getAllObjects();

        firstLevel.forEach(svgAsset => {
          const elDraggable = Draggable.get(svgAsset.node);
          if (elDraggable) {
            elDraggable.disable();
          }
        });
      },

      enableDragOnObjects() {
        const firstLevel = this.furniture.getAllObjects();

        firstLevel.forEach(svgAsset => {
          const elDraggable = Draggable.get(svgAsset.node);
          if (elDraggable) {
            elDraggable.enable();
          }
        });
      },

      /**
       * @description Saving furniture to the database on adding asset,
       * removing asset, moving around, etc.
       */
      async save() {
        console.log('--save');
        const getList = this.furniture.getFurnitureList();
        await plannerApi.saveFurniture(this.eventId, getList);
      },

      render() {
        return html`
          <div class="wrapper">
            <div class="planner-container">
              <div class="planner-header">
                <div class="planner-info">
                  <div class="planner-info planner-info__company">
                    ${this.state.eventTitle}
                  </div>
                  <div class="planner-info planner-info__room-name">
                    ${this.state.roomName}
                  </div>
                  <div class="planner-info planner-info__room-name">
                    ${this.state.date}
                  </div>
                </div>
                <div class="planner-actions">
                  ${!this.props.readOnly
                    ? html`<div
                        @mouseenter=${ev => this.onShowTooltip(ev, 5)}
                        @mouseleave=${this.onHideTooltip}
                        class="btn-icon"
                        id="btn-icon"
                      >
                        <ttp-svg-icon-loader
                          src="/assets/icons/undo.svg"
                        ></ttp-svg-icon-loader>
                        <ttp-tooltip
                          title="Undo"
                          position="bottom"
                        ></ttp-tooltip>
                      </div>`
                    : ''}
                  <div
                    @mouseenter=${ev => this.onShowTooltip(ev, 5)}
                    @mouseleave=${this.onHideTooltip}
                    class="btn-icon"
                  >
                    <ttp-svg-icon-loader
                      src="/assets/icons/export.svg"
                    ></ttp-svg-icon-loader>
                    <ttp-tooltip title="Export" position="bottom"></ttp-tooltip>
                  </div>
                  <button
                    class="btn-primary btn-outline"
                    @click=${this.openShareModal}
                  >
                    Share
                  </button>
                </div>
              </div>

              <div class="working-area-wrapper" id="working-area-wrapper">
                ${!this.props.readOnly
                  ? html`<ttp-sidenav
                      chairs=${this.state.chairs.length
                        ? JSON.stringify(this.state.chairs)
                        : ''}
                      tables=${this.state.tables.length
                        ? JSON.stringify(this.state.tables)
                        : ''}
                    ></ttp-sidenav>`
                  : ``}

                <div class="top-actions">
                  <div class="top-navigation-wrapper">
                    ${!this.props.readOnly
                      ? html`<button
                            class="nav-btn ${this.state.appNavigationMode ===
                            ENUM_APP_NAVIGATION_MODE.SELECT
                              ? 'active'
                              : ''}"
                            @click=${this.onSelectMode}
                            data-mode="select"
                            @mouseenter=${ev => this.onShowTooltip(ev, 5)}
                            @mouseleave=${this.onHideTooltip}
                          >
                            <ttp-svg-icon-loader
                              src="/assets/icons/select.svg"
                            ></ttp-svg-icon-loader>
                            <ttp-tooltip
                              title="Select"
                              position="top"
                            ></ttp-tooltip>
                          </button>
                          <button
                            class="nav-btn ${this.state.appNavigationMode ===
                            ENUM_APP_NAVIGATION_MODE.DRAG
                              ? 'active'
                              : ''}"
                            @click=${this.onDragMode}
                            data-mode="drag"
                            @mouseenter=${ev => this.onShowTooltip(ev, 5)}
                            @mouseleave=${this.onHideTooltip}
                          >
                            <ttp-svg-icon-loader
                              src="/assets/icons/hand.svg"
                            ></ttp-svg-icon-loader>
                            <ttp-tooltip
                              title="Move"
                              position="top"
                            ></ttp-tooltip>
                          </button>`
                      : ''}
                  </div>
                  <div class="zoom-wrapper">
                    <button
                      class="zoom-btn"
                      @click=${this.onZoomIn}
                      type="button"
                    >
                      <ttp-svg-icon-loader
                        src="/assets/icons/plus.svg"
                      ></ttp-svg-icon-loader>
                    </button>
                    <button class="zoom-btn" @click=${this.onZoomOut}>
                      <ttp-svg-icon-loader
                        src="/assets/icons/minus.svg"
                      ></ttp-svg-icon-loader>
                    </button>
                    <div class="zoom-wrapper__input">
                      <ttp-input
                        name="zoomLevel"
                        value="${utils.getZoomPercentage(
                          this.state.zoomLevel
                        )}%"
                        input-id="zoom-level"
                        maxlength="4"
                      ></ttp-input>
                    </div>
                  </div>
                  <ttp-switch
                    label="SHOW GRID"
                    name="isGrid"
                    switch-id="is-grid"
                    checked=${this.state.isGrid}
                  ></ttp-switch>
                </div>

                <div
                  class="floor-plan ${this.state.appNavigationMode ===
                  ENUM_APP_NAVIGATION_MODE.DRAG
                    ? 'drag'
                    : ''}"
                  id="floor-plan-wrapper"
                ></div>

                <ttp-toolbar-asset
                  is-toolbar-visible=${this.state.isToolbar}
                ></ttp-toolbar-asset>
              </div>
            </div>

            <div
              class="icon-info"
              @mouseenter=${ev => this.onShowTooltip(ev, 10)}
              @mouseleave=${this.onHideTooltip}
            >
              <ttp-svg-icon-loader
                src="/assets/icons/info.svg"
              ></ttp-svg-icon-loader>
              <ttp-tooltip title="Room Details" position="right"></ttp-tooltip>
            </div>
            <div
              class="icon-help"
              @mouseenter=${ev => this.onShowTooltip(ev, 10)}
              @mouseleave=${this.onHideTooltip}
            >
              <ttp-svg-icon-loader
                src="/assets/icons/help.svg"
              ></ttp-svg-icon-loader>
              <ttp-tooltip title="Tips" position="top"></ttp-tooltip>
            </div>

            ${this.state.isShareModal
              ? html`<ttp-share-modal
                  is-modal-visible=${this.state.isShareModalAnimate}
                  share-url=${this.state.shareUrl}
                ></ttp-share-modal>`
              : ''}
          </div>
        `;
      },
    })
  );
}
