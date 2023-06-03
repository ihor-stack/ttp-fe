const SVG = window.SVG;
const GRID_SIZE = 60; //Grid is 5ft, 1ft = 12inch, 1inch = 1px

class Floorplan {
  /**
   * @description Initialize SVG.js object
   * @param {*} shadowRoot shadowRoot of the main component
   * @param {string} id id of the div where to append the SVG
   * @param {number} canvasWidth width of the canvas: #floor-plan-wrapper
   * @param {number} canvasHeight height of the canvas: #floor-plan-wrapper
   * @returns {object} Returns SVG.js object
   */
  drawFloorPlanSvg;
  #eventBus;
  constructor(props) {
    this.#eventBus = props.eventBus;
  }

  init = (shadowRoot, id, canvasWidth, canvasHeight) => {
    this.shadowRoot = shadowRoot;
    this.id = id;
    const floorPlanWrapper = this.shadowRoot.querySelector(`#${id}`);

    const panZoomConfig = {
      panning: true,
      pinchZoom: true,
      wheelZoom: true,
      zoomMin: 0.02,
      zoomMax: 1,
      panButton: 1,
    };

    this.drawFloorPlanSvg = SVG()
      .addTo(floorPlanWrapper)
      .size('100%', '100%')
      .viewbox(0, 0, canvasWidth, canvasHeight)
      .panZoom({ ...panZoomConfig });

    this.drawFloorPlanSvg.on('zoom', ev => {
      const { level } = ev.detail;

      this.drawFloorPlanSvg.zoom(level);

      this.#eventBus.publish('ttp-floorplan', {
        method: 'zoom',
        level: level,
      });
    });

    this.drawFloorPlanSvg.on('panning', ev => {
      this.#eventBus.publish('ttp-floorplan', {
        method: 'panning',
      });
    });

    // this.drawFloorPlanSvg.on('pinchZoomStart', ev => {
    //   // console.log('ev', ev);
    // });

    return this.drawFloorPlanSvg;
  };

  /**
   * @description 'floor-plan-wrapper svg
   * @returns {object} svgJs get the svg main object
   */
  getMainSvg = () => {
    return this.drawFloorPlanSvg;
  };

  onZooming(oldZoom, newZoom) {
    this.drawFloorPlanSvg.zoom(oldZoom).animate().zoom(newZoom);

    setTimeout(() => {
      this.adjustWidthLengthText(newZoom);
    }, 400);
  }

  selectMode() {
    this.drawFloorPlanSvg.panZoom({
      panButton: 1,
      zoomMin: 0.02,
      zoomMax: 1,
    });
  }

  dragMode() {
    this.drawFloorPlanSvg.panZoom({
      panButton: 0,
      zoomMin: 0.02,
      zoomMax: 1,
    });
  }

  getFtfromPx = px => {
    const ft = +px / 12;
    return ft;
  };

  getRoomRect = () => {
    const drawFloorPlanSvg = this.getMainSvg();
    const roomGroup = drawFloorPlanSvg.find('#floor-plan-rect');
    return roomGroup[0];
  };

  /**
   * @description Draw the floorplan /rectangle
   * @param {number} roomWidth width of the room in px
   * @param {number} roomLength length of the room in px
   * @param {number} zoomLevel zoomLevel 0.02 to 1
   * @param {number} yPos y pos to center the floorplan
   * @param {number} xPos x pos to center the floorplan
   */
  drawFloorPlan = (roomWidth, roomLength, zoomLevel, yPos, xPos) => {
    const drawFloorPlanSvg = this.getMainSvg();
    const room = drawFloorPlanSvg.rect(roomLength, roomWidth);

    const roomGroup = drawFloorPlanSvg.group();

    roomGroup.attr({ id: 'floor-plan-rect' });
    roomGroup.add(room);

    const clipRect = drawFloorPlanSvg
      .rect(roomLength + 2, roomWidth + 2)
      .fill('#fff')
      .x(-1)
      .y(-1);

    const clip = drawFloorPlanSvg.clip().add(clipRect);

    roomGroup.clipWith(clip);

    const roomWidthInFt = this.getFtfromPx(roomWidth);
    const roomLengthInFt = this.getFtfromPx(roomLength);
    const textWidth = drawFloorPlanSvg.text(
      roomWidthInFt + ' FT' //original width in FT
    );
    const textlength = drawFloorPlanSvg.text(roomLengthInFt + ' FT');

    const strokeWidth = 2 / zoomLevel;
    room.fill('rgba(255,255,255,.5)');
    room.stroke({
      color: '#333',
      width: strokeWidth,
      miterlimit: 10,
    });

    // Align the floorplan with the grid
    const isAlignedWithGridX = GRID_SIZE - (xPos % GRID_SIZE);

    const isAlignedWithGridY = GRID_SIZE + (yPos % GRID_SIZE);

    const xCenterWithGridAligned = xPos + isAlignedWithGridX;

    const yCenterWithGridAligned = yPos - isAlignedWithGridY;

    roomGroup.attr({
      transform: `translate(${xCenterWithGridAligned},${yCenterWithGridAligned})`,
    });

    // Get the size of the transformed room/floorplan/rectangle

    const rbox = roomGroup.rbox(textWidth);

    const fontSize = 12 / zoomLevel;

    textWidth.attr({
      'font-size': `${fontSize}px`,
    });
    textWidth.data('js', 'text-width', true);

    textlength.css({
      'font-size': `${fontSize}px`,
    });

    textlength.data('js', 'text-length', true);

    const rBoxTextWidth = textWidth.rbox();
    const rBoxTextLength = textlength.rbox();

    textWidth.move(
      rbox.x - rBoxTextWidth.width - 16,
      rbox.cy - rBoxTextWidth.height / 2
    );
    textlength.move(
      rbox.cx - rBoxTextLength.width / 2,
      rbox.y - rBoxTextLength.height - 5
    );

    drawFloorPlanSvg.zoom(zoomLevel, {});
  };

  adjustWidthLengthText(zoomLevel) {
    const mainSvg = this.getMainSvg();

    const roomGroup = this.getRoomRect();

    const textWidth = mainSvg.findOne('[data-js="text-width"]');
    const textLength = mainSvg.findOne('[data-js="text-length"]');

    const fontSize = 12 / zoomLevel;

    textWidth.attr({
      'font-size': `${fontSize}px`,
    });

    textLength.css({
      'font-size': `${fontSize}px`,
    });
    const rbox = roomGroup.rbox(textWidth);

    const rBoxTextWidth = textWidth.rbox();
    const rBoxTextLength = textLength.rbox();

    textWidth.move(
      rbox.x - rBoxTextWidth.width / zoomLevel - 16,
      rbox.cy - rBoxTextWidth.height / zoomLevel / 2
    );

    // textWidth.move(rbox.x - rBoxTextWidth.width - 10, rbox.cy);
    textLength.move(
      rbox.cx - rBoxTextLength.width / zoomLevel / 2,
      rbox.y - rBoxTextLength.height / zoomLevel - 5
    );

    const rect = roomGroup.findOne('rect');
    const strokeWidth = 2 / zoomLevel;
    rect.stroke({
      width: strokeWidth,
    });
  }

  /**
   * @description Draw the grid
   * @param {number} canvasWidth width of the canvas: #floor-plan-wrapper
   * @param {number} canvasHeight height of the canvas: #floor-plan-wrapper
   */
  drawGrid(canvasWidth, canvasHeight) {
    const mainSvg = this.getMainSvg();
    const gridGroup = mainSvg.group();
    gridGroup.attr({ id: 'grid-wrapper' });
    gridGroup.addClass('grid');

    const gridWidth = canvasWidth * 100;
    const gridHeight = canvasHeight * 100;
    const gridRect = gridGroup.rect(`${gridWidth}px`, `${gridHeight}px`);

    gridGroup.add(gridRect);

    const patternSmallGrid = gridGroup.pattern(
      GRID_SIZE,
      GRID_SIZE,
      function (add) {
        add
          .path(`M ${GRID_SIZE} 0 L 0 0 L 0 ${GRID_SIZE}`)
          .stroke({
            color: '#ccc',
            width: 2,
          })
          .fill('none');
      }
    );

    gridGroup.add(patternSmallGrid);

    gridRect.attr({ fill: patternSmallGrid });
    gridRect.move(`${-gridWidth / 4}px`, `${-gridHeight / 4}px`);
  }
}

export default Floorplan;
