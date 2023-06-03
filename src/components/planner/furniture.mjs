import { ENUM_SHAPES, ENUM_CATEGORY } from './enums.mjs';
import { utils } from '../../util/utils.mjs';

const Draggable = window.Draggable;
const SVG = window.SVG;
const gsap = window.gsap;
// const GRID_SIZE = 60; //Grid is 5ft, 1ft = 12inch, 1inch = 1px
const SPACE_BETWEEN_TABLE_CHAIR = 5;
class Furniture {
  #id;
  #eventBus;
  #readOnly;
  #chairs;
  #tables;
  /**
   * @description Setting main wrappers
   * @param {object} props passed on creation
   * @param {*} props.shadowRoot shadowRoot of the main component
   * @param {string} props.id id of the div where SVG object placed
   * @param {object} props.eventBus eventBus
   * @param {boolean} props.readOnly disable draggable for the readonly mode
   */
  constructor(props) {
    this.#id = props.id;
    this.#eventBus = props.eventBus;
    this.#readOnly = props.readOnly;
    this.#chairs = [];
    this.#tables = [];
  }

  /**
   * @description 'floor-plan-wrapper svg
   * @returns {object} svgJs get the svg main object
   */
  #getMainSvg() {
    const drawFloorPlanSvg = document.querySelector(`#${this.#id} svg`);
    const svgJs = SVG(drawFloorPlanSvg);
    return svgJs;
  }

  #getFloorplanWidthHeigth() {
    const svgJs = this.#getMainSvg();

    const roomGroup = svgJs.findOne('#floor-plan-rect');
    const rect = roomGroup.findOne('rect');
    const width = rect.width();
    const height = rect.height();

    return { width, height };
  }

  /**
   * @description Add Draggable to each parent level
   * @param {object} assetEl element to which add the draggable
   */
  #setEventListeners(assetEl) {
    const elDraggable = Draggable.get(assetEl);

    assetEl.addEventListener('dblclick', event => {
      const target = event.target;
      const group = target.closest('g');
      const id = group.id;

      this.#eventBus.publish('ttp-furniture', {
        method: 'basicEventListeners',
        eventType: 'dblclick',
        assetId: id,
        event,
      });
    });

    // Add click event to the assets/furniture
    // Once clicked, toolbar is open with data passed to it
    elDraggable.addEventListener('click', event => {
      const target = event.target;
      const id = target.id;

      this.#eventBus.publish('ttp-furniture', {
        method: 'basicEventListeners',
        eventType: 'click',
        assetId: id,
        event,
      });
    });

    // Dragging furniture around the floorplan
    elDraggable.addEventListener('dragstart', event => {
      const target = event.target;
      const id = target.id;
      this.#eventBus.publish('ttp-furniture', {
        method: 'basicEventListeners',
        eventType: 'dragstart',
        assetDomId: id,
      });
    });

    elDraggable.addEventListener('dragend', () =>
      this.#eventBus.publish('ttp-furniture', {
        method: 'basicEventListeners',
        eventType: 'dragend',
      })
    );
  }

  /**
   * @description Add the chair when click on floorplan
   * @param {object} object main object
   * @param {object} object.asset chair,round table, rectangular table asset
   * @param {number} object.x x position where to place the chair
   * @param {number} object.y y position where to place the chair
   * @returns {object} assetEl domEl
   */
  #addAssetToPosition({ asset, x, y }) {
    const { id, title, dimensions, category, type, rotation, linen, setup } =
      asset;

    const { width, depth, height, length } = dimensions;
    const svgIdPrefix = `${category}`;

    const svgJs = this.#getMainSvg();

    const roomGroup = svgJs.findOne('#floor-plan-rect');
    const assetGroup = roomGroup.group();

    let assetTypeClassName;
    switch (category) {
      case ENUM_CATEGORY.CHAIR: {
        assetTypeClassName = 'chair';
        break;
      }
      case ENUM_CATEGORY.TABLE: {
        assetTypeClassName = 'table';
        break;
      }
      case ENUM_CATEGORY.SETUP: {
        assetTypeClassName = 'setup';
        break;
      }
    }

    // A unary operator like plus triggers the valueOf method in the Date object
    // and it returns the timestamp (without any alteration).
    const timestamp = +new Date();
    const uniqueid = utils.uniqueid();
    let domId = `${svgIdPrefix}_${uniqueid}_${timestamp}`;

    this.#setBasicAssetGroupAttributes({
      svgEl: assetGroup,
      title,
      className: assetTypeClassName,
      domId: domId,
      objectId: id,
      category: category,
      type: type,
      width: width,
      length: length,
      height: height,
      depth: depth,
      level: 1,
      linen: linen,
      setup: setup,
    });

    let svgAsset;
    let widthS, heightS;
    if (category === ENUM_CATEGORY.CHAIR) {
      svgAsset = this.#svgChair(width, depth, assetGroup);
      const rectChair = assetGroup.rect(`${width}px`, `${depth}px`);
      rectChair.fill('transparent');
      widthS = width;
      heightS = depth;
    } else if (category === ENUM_CATEGORY.TABLE) {
      if (type === ENUM_SHAPES.ROUND) {
        let chairDepth = 0;
        if (typeof asset.children !== 'undefined' && asset.children.length) {
          chairDepth = asset.children[0].depth;
        }
        svgAsset = this.#svgRoundTable(width, chairDepth);
        widthS = width;
        heightS = width;
      } else {
        widthS = length;
        heightS = width;
        svgAsset = this.#svgRectangularTable(width, length);
      }
    } else if (category === ENUM_CATEGORY.SETUP) {
      console.log('category', category);
    }

    assetGroup.add(svgAsset);
    assetGroup.attr({
      // rotate(deg, cx, cy) degree, and the center of rotation
      transform: `translate(${x}, ${y}) rotate(${rotation}, 0, 0)`,
    });

    //Create selection rectangle
    assetGroup
      .rect(`${widthS}px`, `${heightS}px`)
      .stroke({ width: 1 })
      .fill('transparent')
      .addClass('selection-rectangle');

    const assetEl = document.getElementById(domId);

    if (category === ENUM_CATEGORY.TABLE) {
      const svgPathLinen = svgAsset.findOne('[data-is="linen"]');

      if (linen === 'true') {
        svgPathLinen.addClass('show');
      } else {
        svgPathLinen.removeClass('show');
      }
      if (type === ENUM_SHAPES.RECTANGULAR) {
        this.#setRectTableGuidelines(domId);
      }
    }

    return assetEl;
  }

  #addDraggable(el) {
    const boundContainer = document.getElementById('floor-plan-rect');

    Draggable.create(el, {
      type: 'x,y',
      bounds: boundContainer,
      activeCursor: 'grabbing',
      edgeResistance: 1,
      // liveSnap: function (value) {
      //   // return Math.round(value / 2) * 2;
      // },
    });
  }

  #placeChildren({ parentId, children, level = 2 }) {
    const svgJs = this.#getMainSvg();
    const tableGroup = svgJs.findOne(`#${parentId}`);

    children.forEach((child, index) => {
      const { id, category, type, title, width, depth, height, length } = child;

      const svgIdPrefix = `${category}`;
      const currentChairNumber = index + 1;

      const assetGroup = tableGroup.group();

      const assetCategoryClassname = 'chair';

      const domId = `${parentId}-${svgIdPrefix}_${currentChairNumber}`;

      this.#setBasicAssetGroupAttributes({
        svgEl: assetGroup,
        title,
        className: assetCategoryClassname,
        domId: domId,
        objectId: id,
        category: category,
        type: type,
        width: width,
        length: length,
        height: height,
        depth: depth,
        level: level,
        clickable: true,
      });

      let svgAsset;

      if (category === ENUM_CATEGORY.CHAIR) {
        svgAsset = this.#svgChair(width, depth);

        const rectChair = assetGroup.rect(`${width}px`, `${depth}px`);

        rectChair.fill('transparent');
      } else if (category === ENUM_CATEGORY.TABLE) {
        if (type === ENUM_SHAPES.ROUND) {
          let chairDepth = 0;

          svgAsset = this.#svgRoundTable(width, chairDepth);
        } else {
          svgAsset = this.#svgRectangularTable(width, length);
        }
      }

      assetGroup.add(svgAsset);

      assetGroup.attr({
        transform: `translate(${child.x}, ${child.y}) rotate(${child.rotation}, 0, 0)`,
      });

      if (typeof child.children !== 'undefined') {
        this.#placeChildren({
          parentId: domId,
          children: child.children,
          level: 3,
        });
      }

      // chairGroup.addEventListener('dblclick', event => {
      //   console.log('dblclick', event.target);
      // });
    });
  }

  /**
   * @description Setting Basic attributes and classes for svg group elements/assets
   * eg. chairs, tables
   * @param  {object} asset Main object
   * @param  {object} asset.svgEl SvgElement typeof SVG.js
   * @param  {string} asset.title title of the asset
   * @param  {string} asset.domId id of the asset, being generated frontend
   * @param  {string} asset.objectId id of the asset, from the db
   * @param  {string} asset.className additional classname
   * @param  {string} asset.category category of the asset: table, chair
   * @param  {string} asset.type type of the asset: chiavari, round, rectangle
   * @param  {string} asset.width width of the asset
   * @param  {string} asset.length length of the asset
   * @param  {string} asset.height height of the asset
   * @param  {string} asset.depth depth of the asset
   * @param  {number} asset.level set level of the group asset, when adding chairs, they are going to be level 2
   * @param  {string} asset.linen linen of the asset
   * @param {boolean} asset.clickable add clickable attribute to the children
   * @param {object} asset.setup setup options
   */
  #setBasicAssetGroupAttributes({
    svgEl,
    title,
    domId,
    objectId,
    className,
    category,
    type,
    width,
    length,
    height,
    depth,
    level,
    linen,
    clickable = false,
    setup,
  }) {
    svgEl.attr({ title });
    svgEl.attr({ id: domId });

    svgEl.addClass(className);
    svgEl.addClass('svg-asset');

    svgEl.data('js', 'svg-asset', true);
    svgEl.data('level', level, true);

    svgEl.data('category', category, true);
    svgEl.data('type', type, true);

    svgEl.data('id', objectId, true);
    svgEl.data('width', width, true);
    svgEl.data('length', length, true);
    svgEl.data('height', height, true);
    svgEl.data('depth', depth, true);
    svgEl.data('linen', linen, true);
    svgEl.data('clickable', clickable, true);
    svgEl.data('setup', JSON.stringify(setup), true);
  }

  /**
   * @description Generating svg chair
   * @param {number} width of the chair
   * @param {number} depth of the chair
   * @returns {object} the svgchair
   */
  #svgChair(width, depth) {
    width = +width;
    depth = +depth;

    const svgChair = SVG()
      .size(`${width}px`, `${depth}px`)
      .viewbox(0, 0, '18', '20');

    svgChair.attr({ preserveAspectRatio: 'none' });

    const strokeWidth = this.#getChairStrokeWidth(width, depth);

    const chairPath1 = svgChair.path(
      'M14.9378 18.2052C11.0267 18.8086 6.97333 18.8086 3.06222 18.2052C1.85333 18.0406 1 17.1629 1 16.2304L1.78222 9.0443C1.99556 7.01464 4.2 5.42383 6.90222 5.42383H11.0978C13.7289 5.42383 16.0044 7.01464 16.2178 9.0443L17 16.2304C17 17.1629 16.1467 17.9858 14.9378 18.2052Z'
    );

    chairPath1.fill('#f5f5f5f5');
    chairPath1.stroke({
      width: strokeWidth,
      miterlimit: 10,
      linecap: 'round',
      linejoin: 'round',
    });
    // chairPath1.attr('vector-effect', 'non-scaling-stroke');

    const chairPath2 = svgChair.path(
      'M1.00384 3.98097C0.932748 2.7577 1.85697 1.67835 3.06557 1.39052C6.97574 0.598993 11.0281 0.598993 14.9383 1.39052C16.1469 1.67835 17 2.7577 17 3.98097'
    );

    chairPath2.stroke({
      width: strokeWidth,
      miterlimit: 10,
      linecap: 'round',
      linejoin: 'round',
    });

    // chairPath2.attr('vector-effect', 'non-scaling-stroke');
    chairPath2.fill('none');

    return svgChair;
  }

  #getChairStrokeWidth(width, depth) {
    const x = 360; //viewbox 18x20
    const y = width * depth;
    let strokeWidth = x / y + 0.5;
    if (strokeWidth > 1.5) {
      strokeWidth = 1.5;
    }

    return strokeWidth;
  }

  #svgRoundTable(width, chairDepth) {
    width = +width;
    chairDepth = +chairDepth === 0 ? 18 : +chairDepth;

    const svgRoundTable = SVG()
      .size(`${width}px`, `${width}px`)
      .viewbox(0, 0, width, width);

    svgRoundTable.addClass('svg-table-round');

    const linen = svgRoundTable.path(
      'M83 41C83 45.1033 76.5686 48.386 75.3627 52.079C74.1569 56.1824 77.3725 62.3374 74.9608 65.6201C72.549 68.9027 65.7157 67.6717 62.5 70.1337C59.2843 72.5957 58.4804 79.5714 54.4608 80.8024C50.8431 82.0334 46.0196 77.1094 41.598 77.1094C37.5784 77.1094 32.7549 82.0334 28.7353 80.8024C24.7157 79.5714 23.9118 72.5957 20.6961 70.1337C17.4804 67.6717 10.6471 68.9027 8.23529 65.6201C5.82353 62.3374 9.03922 56.1824 7.83333 52.079C7.43137 48.386 1 45.1033 1 41C1 36.8967 7.43137 33.614 8.63725 29.921C9.84314 25.8176 6.62745 19.6626 9.03922 16.3799C11.451 13.0973 18.2843 14.3283 21.5 11.8663C24.7157 9.40426 25.5196 2.42857 29.5392 1.19757C33.1569 -0.0334347 37.9804 4.89058 42 4.89058C46.0196 4.89058 50.8431 -0.0334347 54.8628 1.19757C58.8824 2.42857 59.6863 9.40426 62.902 11.8663C66.1177 14.3283 72.951 13.0973 75.3627 16.3799C77.7745 19.6626 74.5588 25.8176 75.7647 29.921C76.9706 33.614 83 36.8967 83 41Z'
    );

    linen.fill('none');
    linen.stroke({
      width: 1.5,
      miterlimit: 10,
      linecap: 'round',
      linejoin: 'round',
    });

    linen.transform({
      translate: [-6, -4],
    });

    // linen.attr({ opacity: 0.5 });
    linen.addClass('linen');
    linen.data('is', 'linen', true);

    const circle = svgRoundTable.circle(width);

    circle.fill('#f5f5f5f5');
    circle.stroke({
      width: 1.5,
      location: 'inside',
    });

    circle.data('js', 'main-table');

    // Outer circle, guide to setup/add chairs
    const outerDiameter = width + chairDepth + SPACE_BETWEEN_TABLE_CHAIR;
    const circleOut = svgRoundTable.circle(outerDiameter);
    circleOut.fill('none');
    circleOut.stroke({
      width: 1,
      location: 'inside',
      color: 'none',
    });
    circleOut.attr({ cx: width / 2, cy: width / 2 });
    circleOut.data('js', 'table-chair-place');

    return svgRoundTable;
  }

  #svgRectangularTable(width, length) {
    width = +width;
    length = +length;
    const svgTableRectangular = SVG()
      .size(`${length}px`, `${width}px`)
      .viewbox(0, 0, length, width);

    svgTableRectangular.addClass('svg-table-rectangular');

    const linen = svgTableRectangular.path(
      'M1.8277 1.21437C6.38008 0.111626 7.06983 4.52262 11.7602 4.52262C16.4505 4.52262 16.4505 1.21437 21.1408 1.21437C25.8311 1.21437 25.8311 4.52262 30.5214 4.52262C35.2118 4.52262 35.2118 1.21437 39.9021 1.21437C44.5924 1.21437 44.5924 4.52262 49.2827 4.52262C53.9731 4.52262 53.9731 1.21437 58.6634 1.21437C63.3537 1.21437 63.3537 4.52262 68.044 4.52262C72.7344 4.52262 73.4241 -0.0262177 77.9765 1.21437H77.8385C80.5975 2.04144 76.0452 5.07399 76.0452 7.69302C76.0452 10.312 78.9421 10.312 78.9421 12.9311C78.9421 15.5501 75.3554 15.9636 76.1831 18.5827C77.1488 22.0288 80.7355 23.9586 77.9765 24.7856H78.1144C73.7 26.0262 72.8723 21.4774 68.182 21.4774C63.4917 21.4774 63.4917 24.7856 58.8013 24.7856C54.111 24.7856 54.111 21.4774 49.4207 21.4774C44.7304 21.4774 44.7304 24.7856 40.04 24.7856C35.3497 24.7856 35.3497 21.4774 30.6594 21.4774C25.9691 21.4774 25.9691 24.7856 21.2788 24.7856C16.5884 24.7856 16.5884 21.4774 11.8981 21.4774C7.20778 21.4774 6.51803 26.0262 1.96565 24.7856H2.10361C-0.655408 23.9586 3.89696 20.926 3.89696 18.307C3.89696 15.6879 1 15.6879 1 13.0689C1 10.4499 3.89696 10.4499 3.89696 7.83087C3.89696 5.21184 -0.655408 2.04144 2.10361 1.35222'
    );
    linen.fill('none');
    linen.stroke({
      width: 1.4,
      miterlimit: 10,
      linecap: 'round',
      linejoin: 'round',
    });
    linen.transform({
      translate: [-4, -4],
    });
    linen.addClass('linen');
    linen.data('is', 'linen', true);

    const rect = svgTableRectangular.rect(length, width);

    rect.fill('#f5f5f5f5');
    rect.stroke({
      width: 1.4,
    });
    rect.radius(1);
    rect.data('js', 'main-table');

    return svgTableRectangular;
  }

  #setRectTableGuidelines(id) {
    const svgJs = this.#getMainSvg();
    const tableGroup = svgJs.findOne(`#${id}`);

    const tableGroupSvg = tableGroup.findOne('svg');
    const tableGroupSvgRect = tableGroup.findOne('[data-js="main-table"]');
    const rectTableBBox = tableGroupSvgRect.bbox();

    // const length = rectTableBBox.width;
    const tableLength = rectTableBBox.width;
    const height = rectTableBBox.height;
    const length = 53;
    const xPos = (tableLength - length) / 2;

    const lengthXPos = xPos + length;

    tableGroupSvg
      .line(xPos, -4, lengthXPos, -4)
      .stroke({ width: 1, color: 'none' })
      .data('side', '1', true);

    tableGroupSvg
      .line(xPos, height + 4, lengthXPos, height + 4)
      .stroke({ width: 1, color: 'none' })
      .data('side', '2', true);
  }

  #updateRectTableGuidelines(id, chairWidth) {
    const svgJs = this.#getMainSvg();
    const tableGroup = svgJs.findOne(`#${id}`);
    const tableGroupSvgRect = tableGroup.findOne('[data-js="main-table"]');
    const rectTableBBox = tableGroupSvgRect.bbox();
    const side1 = tableGroup.findOne('[data-side="1"]');
    const side2 = tableGroup.findOne('[data-side="2"]');

    const tableLength = rectTableBBox.width;

    const length = chairWidth * 3 + 8; //3 chairs, with a space of 4 between each chair
    const xPos = (tableLength - length) / 2;
    const lengthXPos = xPos + length;

    const plot1 = side1.plot();
    const plot2 = side2.plot();
    const plotYpos = plot1[0][1];
    const plot2Ypos = plot2[0][1];

    side1.plot(xPos, plotYpos, lengthXPos, plotYpos);
    side2.plot(xPos, plot2Ypos, lengthXPos, plot2Ypos);
  }

  #setStrokeWidthChair(svgEl, strokeWidth) {
    const paths = svgEl.find('path');
    paths.forEach(path => {
      path.stroke({ width: strokeWidth });
    });
  }

  /**
   * @description Add chair with preview class
   * @param {object} mainobj main
   * @param {string} mainobj.tableId id of the table where add the chairs
   * @param {number} mainobj.currentChairNumber from 1 to 12
   * @param {object} mainobj.chair asset with all of the dimenstions and descriptions
   * @param {number} mainobj.totalChairs 8,9,10,11,12 (effects the placement and rotation of the chairs)
   * @param {boolean} mainobj.isPreview set preview class if true
   */
  #addChairToTheTable({
    tableId,
    currentChairNumber,
    chair,
    totalChairs,
    isPreview,
  }) {
    const { chairGroup } = this.#generateChair({
      tableId,
      currentChairNumber,
      chair,
      isPreview,
    });

    let { x, y, rotation } = this.#getChairXYRotation(
      tableId,
      totalChairs,
      currentChairNumber
    );

    chairGroup.transform({
      translate: [x, y],
      rotate: rotation,
      position: [0, 0],
    });
  }

  #generateChair({ tableId, currentChairNumber, chair, isPreview }) {
    currentChairNumber = +currentChairNumber;

    const svgJs = this.#getMainSvg();
    const tableGroup = svgJs.find(`#${tableId}`)[0];
    // const svgTable = tableGroup.find('.svg-table-round')[0];
    const svgIdPrefix = `chair`;

    const { id, category, type, dimensions, title } = chair;
    const { width, depth, height, length } = dimensions;

    const chairGroup = tableGroup.group();
    if (isPreview) {
      chairGroup.addClass('preview');
    }

    const assetTypeClassName = 'chair';

    const domId = `${tableId}-${svgIdPrefix}_${currentChairNumber}`;

    this.#setBasicAssetGroupAttributes({
      svgEl: chairGroup,
      title,
      className: assetTypeClassName,
      domId: domId,
      objectId: id,
      category: category,
      type: type,
      width: width,
      length: length,
      height: height,
      depth: depth,
      level: 2,
    });

    const generateSvgChair = this.#svgChair(width, depth);

    const rectChair = chairGroup.rect(`${width}px`, `${depth}px`);
    rectChair.fill('transparent');
    chairGroup.add(generateSvgChair);

    return { chairGroup };
  }

  /**
   * @description Get chair x,y and rotation
   * @param {string} tableId id of the table to which add the chairs
   * @param {number} totalChairs 12 or 8 as of now
   * @param {number} currentChairNumber from 1 to 12
   * @returns {object} x, y, rotation
   */
  #getChairXYRotation(tableId, totalChairs, currentChairNumber) {
    totalChairs = +totalChairs;
    currentChairNumber = +currentChairNumber;

    let CHAIR_ROTATION_DEGREE = 360 / totalChairs;

    const svgJs = this.#getMainSvg();
    const tableGroup = svgJs.find(`#${tableId}`)[0];
    const svgTable = tableGroup.find('.svg-table-round')[0];
    const tableCircle = svgTable.find('[data-js="table-chair-place"')[0];

    let newVal = Furniture.getChairPairVal(totalChairs, currentChairNumber);

    let circleLength = tableCircle.node.getTotalLength();

    const steps = circleLength / totalChairs;

    const perc = (newVal * steps) / circleLength;

    let dist = circleLength * perc;

    let point = tableCircle.node.getPointAtLength(dist);

    let x = point.x,
      y = point.y,
      rotation = 90 + CHAIR_ROTATION_DEGREE * newVal;

    return { x, y, rotation };
  }

  //wip
  #updateChairsPlacement(totalChairs, tableId) {
    totalChairs = +totalChairs;
    const svgJs = this.#getMainSvg();
    const tableGroup = svgJs.findOne(`#${tableId}`);

    const chairAssets = tableGroup.find('[data-js="svg-asset"]');
    // const count = chairAssets.length;
    chairAssets.forEach(chairGroup => {
      const getId = chairGroup.attr('id');

      const idArr = getId.split('_');
      const id = +idArr[idArr.length - 1];

      const currentChairNumber = id;
      const { x, y, rotation } = this.#getChairXYRotation(
        tableId,
        totalChairs,
        currentChairNumber
      );

      chairGroup.transform({
        translate: [x, y],
        rotate: rotation,
        position: [0, 0],
      });
    });
  }

  #adjustSizeOfSelectionRectangle(groupId) {
    const svgJs = this.#getMainSvg();
    const tableGroup = svgJs.find(`#${groupId}`)[0];
    const selectionRect = tableGroup.find('.selection-rectangle');
    const tableGroupRbox = tableGroup.bbox();

    selectionRect.size(tableGroupRbox.w, tableGroupRbox.h);

    selectionRect.transform({
      translate: [tableGroupRbox.x, tableGroupRbox.y],
    });
  }

  #updateTableChairWrapper(id, chairDepth) {
    chairDepth = +chairDepth;

    const svgJs = this.#getMainSvg();

    const svgTableGroup = svgJs.findOne(`#${id}`);
    const mainTable = svgTableGroup.findOne('[data-js="main-table"]');
    const mainTableRadius = mainTable.radius();

    const outerSpace = svgTableGroup.findOne('[data-js="table-chair-place"]');

    const radius =
      (mainTableRadius * 2 + chairDepth) / 2 + SPACE_BETWEEN_TABLE_CHAIR / 2;

    outerSpace.radius(radius);
  }

  /**
   * @description Get chair x,y and rotation
   * @param {string} tableId id of the table to which add the chairs
   * @param {number} currentChairIndex from 0 to 2
   * @param {string} side top or bottom
   * @returns {object} x, y, rotation
   */
  #getChairXYRotationR(tableId, currentChairIndex, side) {
    currentChairIndex = +currentChairIndex;

    let CHAIR_ROTATION_DEGREE = 0;

    const svgJs = this.#getMainSvg();
    const tableGroup = svgJs.find(`#${tableId}`)[0];
    const svgTable = tableGroup.findOne('.svg-table-rectangular');
    const tableSide1 = svgTable.findOne('[data-side="1"]');
    const tableSide2 = svgTable.findOne('[data-side="2"]');

    let point;
    if (side === 'side1') {
      //top side
      let rectLength = tableSide1.node.getTotalLength();

      const steps = rectLength / 3;

      const perc = (currentChairIndex * steps) / rectLength;

      let dist = rectLength * perc;

      point = tableSide1.node.getPointAtLength(dist);
    }

    if (side === 'side2') {
      //bottom
      let rectLength = tableSide2.node.getTotalLength();

      const steps = rectLength / 3;

      const perc = (currentChairIndex * steps) / rectLength;

      let dist = rectLength * perc;

      point = tableSide2.node.getPointAtLength(dist);
      CHAIR_ROTATION_DEGREE = 180;
    }

    let x = point.x,
      y = point.y,
      rotation = CHAIR_ROTATION_DEGREE;

    return { x, y, rotation };
  }

  #previewDuplicateFurniture(id, value, space, zoomLevel) {
    const svgJs = this.#getMainSvg();

    const { f_obj, f_bbox, distance } = this.getFurnitureItem(id, zoomLevel);

    const maxAllowed = Math.floor(distance / (+f_bbox.width + space));

    const generateFurnitureList = [];
    const previewDuplicatePlaced = svgJs.find('[data-preview="true"]');
    const previewDuplicatePlacedTotal = previewDuplicatePlaced.length;

    let from = previewDuplicatePlaced.length
      ? previewDuplicatePlaced.length
      : 0;

    let newVal = value < maxAllowed ? value : maxAllowed;
    console.log('from, newVal', from, newVal);

    if (newVal !== from) {
      if (from < newVal) {
        //add furniture
        console.log('---add');
        for (let i = from; i < newVal; i++) {
          const chairWithSpace = +f_bbox.width + space;
          const xPos = f_obj.x + chairWithSpace + i * chairWithSpace;

          const temp = Object.assign({ ...f_obj }, { x: xPos });

          generateFurnitureList.push(temp);
        }
        this.placeDuplicateFurniture(id, generateFurnitureList);
      } else {
        //remove furniture
        console.log('---remove');
        for (let i = previewDuplicatePlacedTotal; i > newVal; i--) {
          previewDuplicatePlaced[i - 1].remove();
        }
      }
    }
  }

  //wip
  #updateChairsPlacementRectangular(tableId, chairDepth) {
    const svgJs = this.#getMainSvg();
    const tableGroup = svgJs.find(`#${tableId}`)[0];

    const chairAssets = tableGroup.find('[data-js="svg-asset"]');
    // const count = chairAssets.length;
    chairAssets.forEach((chairGroup, index) => {
      const side = index < 3 ? 'side1' : 'side2';
      const yAxis = index < 3 ? -chairDepth : 0;
      const chairIndex = index < 3 ? index : index - 3;

      let { x, y, rotation } = this.#getChairXYRotationR(
        tableId,
        chairIndex,
        side
      );

      chairGroup.transform({
        translate: [x, y],
        rotate: rotation,
        relative: [0, yAxis],
      });
    });
  }

  setChairs(chairs) {
    this.#chairs = [...chairs];
  }

  getChairs() {
    return this.#chairs;
  }

  setTables(tables) {
    this.#tables = [...tables];
  }

  getTables() {
    return this.#tables;
  }

  getChairType(chairType) {
    const chairs = this.getChairs();

    const chair = chairs.filter(chair => {
      return chair.type === chairType;
    })[0];

    return chair;
  }

  /**
   * @description Get the type of the furniture eg: chiavari, round, rectangular
   * @param {string} id of the furniture (group)
   * @returns {string} type of the furniture
   */
  getType(id) {
    const svgJs = this.#getMainSvg();
    const furniture = svgJs.find(`#${id}`)[0];
    const type = furniture.data('type');
    return type;
  }

  /**
   * @description Get the category of the furniture eg: table, chair, setup
   * @param {string} id of the furniture (group)
   * @returns {string} 'round or rectanle' of the furniture
   */
  getCategory(id) {
    const svgJs = this.#getMainSvg();
    const furniture = svgJs.find(`#${id}`)[0];
    const category = furniture.data('category');
    return category;
  }

  /**
   * @description Get the title/name of the furniture eg: Chiavari
   * @param {string} id of the furniture (group)
   * @returns {string} name of the furniture
   */
  getName(id) {
    const svgJs = this.#getMainSvg();
    const furniture = svgJs.find(`#${id}`)[0];

    const name = furniture.attr('title');
    return name;
  }

  /**
   * @description Get the rotation of the furniture eg: 15deg, 45deg
   * @param {string} id of the furniture (group)
   * @returns {string} rotation of the furniture
   */
  getRotation(id) {
    const mainSvg = this.#getMainSvg();
    const assetGroup = mainSvg.find(`#${id}`);
    const rotation = Math.round(assetGroup[0].transform().rotate);
    return rotation;
  }

  /**
   * @typedef {object} ITableChairs
   * @property {number} count - The number of chairs
   * @property {string} name - The name of those chairs
   */
  /**
   * @description Get the chairs that are being placed with the table
   * @param {string} id of the furniture (group)
   * @returns {ITableChairs} count,name Number of chairs placed and their names
   */
  getTableChairs(id) {
    const mainSvg = this.#getMainSvg();
    const assetGroup = mainSvg.find(`#${id}`)[0];
    const chairs = assetGroup.find('[data-js="svg-asset"]');

    const chairsCount = chairs.length || -1;

    let type = 'chiavari';

    // All chairs are the same type, so getting the first title,
    // if the chairs are not default
    if (chairsCount > -1) {
      type = chairs[0].data('type');
    }

    return { count: chairsCount, type };
  }

  /**
   * @description Get the setup options of the furniture eg: {"chairs_total":32,"chair_spacing_inch":2,"chairs_per_row":8,"rows_total":4,"row_spacing_ft":2,"aisles":0,"aisle_width_ft":2,"chair_type":"curve_back"}
   * @param {string} id of the furniture (group)
   * @returns {string} setup options of the furniture
   */
  getSetup(id) {
    const svgJs = this.#getMainSvg();
    const furniture = svgJs.findOne(`#${id}`);
    const setup = furniture.data('setup');
    return setup;
  }

  /**
   * @description Creating new furniture by placing it on the floorplan after selecting from the sidepanel
   * @param {object} mainObject main
   * @param {object} mainObject.asset main asset
   * @param {number} mainObject.x x position
   * @param {number} mainObject.y y position
   */
  addFurniture({ asset, x, y }) {
    const assetWithZeroRotation = Object.assign(asset, { rotation: 0 });
    const assetEl = this.#addAssetToPosition({
      asset: assetWithZeroRotation,
      x,
      y,
    });
    if (!this.#readOnly) {
      this.#addDraggable(assetEl);

      this.#setEventListeners(assetEl);
    }
  }

  /**
   * @description Get the list of the furniture from the DOM, to be later saved in DB
   * @returns {object[]} List of the furniture
   */
  getFurnitureList() {
    const svgJs = this.#getMainSvg();

    const roomGroup = svgJs.findOne('#floor-plan-rect');
    const topLevelAsset = roomGroup.find('[data-level="1"]');

    const furnitureList = [];

    topLevelAsset.forEach(asset => {
      const node = asset.node;
      const children = [];
      const childrenLevel2 = asset.find('[data-level="2"]');

      childrenLevel2.forEach(child => {
        const childNode = child.node;
        const childrenLevel3 = child.find('[data-level="3"]');
        const setupTableChairs = [];

        childrenLevel3.forEach(setupChair => {
          const setupNode = setupChair.node;
          const tempSetupChair = {
            id: setupNode.dataset.id,
            type: setupNode.dataset.type,
            category: setupNode.dataset.category,
            title: setupNode.getAttribute('title'),
            x: setupChair.transform().translateX,
            y: setupChair.transform().translateY,
            rotation: Math.round(setupChair.transform().rotate),
            width: setupNode.dataset.width,
            height: setupNode.dataset.height,
            ...(setupNode.dataset.length && {
              length: setupNode.dataset.length,
            }),
            ...(setupNode.dataset.depth && {
              depth: setupNode.dataset.depth,
            }),
          };
          setupTableChairs.push(tempSetupChair);
        });

        const childTemp = {
          id: childNode.dataset.id,
          type: childNode.dataset.type,
          category: childNode.dataset.category,
          title: childNode.getAttribute('title'),
          x: child.transform().translateX,
          y: child.transform().translateY,
          rotation: Math.round(child.transform().rotate),
          width: childNode.dataset.width,
          height: childNode.dataset.height,
          ...(childNode.dataset.length && {
            length: childNode.dataset.length,
          }),
          ...(childNode.dataset.depth && {
            depth: childNode.dataset.depth,
          }),
          ...(setupTableChairs.length && {
            children: setupTableChairs,
          }),
        };

        children.push(childTemp);
      });

      const temp = {
        category: node.dataset.category,
        type: node.dataset.type,
        title: node.getAttribute('title'),
        x: asset.transform().translateX,
        y: asset.transform().translateY,
        rotation: Math.round(asset.transform().rotate),
        ...(node.dataset.setup && {
          setup: JSON.parse(node.dataset.setup),
        }),
        ...(node.dataset.id && {
          id: node.dataset.id,
        }),
        ...(node.dataset.width && {
          width: node.dataset.width,
        }),
        ...(node.dataset.height && {
          height: node.dataset.height,
        }),
        ...(node.dataset.linen && {
          linen: node.dataset.linen,
        }),
        ...(node.dataset.length && {
          length: node.dataset.length,
        }),
        ...(node.dataset.depth && {
          depth: node.dataset.depth,
        }),
        ...(children.length && {
          children,
        }),
      };

      furnitureList.push(temp);
    });

    return furnitureList;
  }

  /**
   * @description After retrieving the furniture from DB, it need to be placed in DOM
   * @param {object[]} furnitureList list of the furniture to be placed
   */
  placeFurniture(furnitureList) {
    furnitureList.forEach(furniture => {
      const asset = {
        id: furniture.id,
        type: furniture.type,
        category: furniture.category,
        title: furniture.title,
        rotation: furniture.rotation,
        linen: furniture.linen,
        setup: furniture.setup,
        dimensions: {
          width: furniture.width,
          height: furniture.height,
          ...(furniture.length && {
            length: furniture.length,
          }),
          ...(furniture.depth && {
            depth: furniture.depth,
          }),
        },
        ...(furniture.children && {
          children: furniture.children,
        }),
      };

      const assetEl = this.#addAssetToPosition({
        asset,
        x: furniture.x,
        y: furniture.y,
      });

      const parentId = assetEl.id;

      if (typeof asset.children !== 'undefined' && asset.children.length) {
        //add children
        this.#placeChildren({ parentId, children: asset.children });
        this.#adjustSizeOfSelectionRectangle(parentId);
      }

      if (!this.#readOnly) {
        this.#addDraggable(assetEl);

        this.#setEventListeners(assetEl);
      }
    });
  }

  /**
   * @description Changing the furniture from the toolbar, eg: chair: Chiavari to Curve Back
   * or round to rectange etc.
   * @param {object} furniture main object
   * @param {string} furniture.assetDomId id of the asset in the dom
   * @param {object} furniture.asset asset object with all specs
   */
  changeFurnitureType({ assetDomId, asset }) {
    const { dimensions, title, id, type, category } = asset;
    const { width, height, depth, length } = dimensions;

    const mainSvg = this.#getMainSvg();
    const assetGroup = mainSvg.find(`#${assetDomId}`);
    const svgEl = mainSvg.find(`#${assetDomId} svg`);
    const rect = mainSvg.find(`#${assetDomId} rect`);

    assetGroup.attr({ title });
    assetGroup.data('id', id, true);
    assetGroup.data('width', width, true);
    assetGroup.data('length', length, true);
    assetGroup.data('height', height, true);
    assetGroup.data('depth', depth, true);

    assetGroup.data('type', type, true);
    assetGroup.data('category', category, true);

    let widthS, heightS;
    let svgAsset;
    if (category === ENUM_CATEGORY.CHAIR) {
      widthS = width;
      heightS = depth;
      const strokeWidth = this.#getChairStrokeWidth(widthS, heightS);
      this.#setStrokeWidthChair(svgEl, strokeWidth);
    } else {
      const tableChairs = this.getTableChairs(assetDomId); //{count, type}
      const linen = this.getTableLinen(assetDomId); //true, false
      const chairsList = this.getChairs();
      const findChair = chairsList.filter(
        chair => chair.type === tableChairs.type
      )[0];
      const chairWidth = findChair.dimensions.width;
      const chairDepth = findChair.dimensions.depth;

      if (type === ENUM_SHAPES.ROUND) {
        widthS = width;
        heightS = width;
        svgAsset = this.#svgRoundTable(width, chairDepth);
        svgEl.remove();
        assetGroup.add(svgAsset);

        if (tableChairs.count > 0) {
          this.removeTableChairs(assetDomId);

          this.previewChairsOnRoundTable({
            value: tableChairs.count,
            tableId: assetDomId,
            chair: findChair,
          });

          this.confirmChairsOnRoundTable(assetDomId, tableChairs.count);
        }

        this.setTableLinen(assetDomId, linen);
      } else {
        widthS = length;
        heightS = width;
        svgAsset = this.#svgRectangularTable(width, length);
        svgEl.remove();

        assetGroup.add(svgAsset);
        this.#setRectTableGuidelines(assetDomId);
        this.#updateRectTableGuidelines(assetDomId, chairWidth);

        if (tableChairs.count > 0) {
          this.removeTableChairs(assetDomId);
          const value = tableChairs.count > 6 ? 6 : tableChairs.count;
          this.previewChairsOnRectTable({
            value,
            tableId: assetDomId,
            chair: findChair,
          });
          this.confirmChairsOnRectTable(assetDomId, value);
        }

        this.setTableLinen(assetDomId, linen);
      }
    }

    // Change width and height of the svg furniture holder
    svgEl.attr({ width: widthS, height: heightS });

    // Adjust both of the rectangles within the group:
    // for the selection and for drag handler
    rect.forEach(r => {
      r.size(width, depth);
    });

    this.#adjustSizeOfSelectionRectangle(assetDomId);
  }

  /**
   * @description rotating furniture in place
   * @param {object} furniture main object
   * @param {string} furniture.assetDomId id of the asset in the Dom
   * @param {number} furniture.degree degree to rotate the asset
   */
  rotateFurniture({ assetDomId, degree }) {
    const assetEl = document.querySelector(`#${assetDomId}`);
    // this.smoothOriginChange(assetEl, 'center center');
    gsap.to(assetEl, {
      rotation: degree,
      transformOrigin: 'center center',
    });
  }

  //wip
  previewChairsOnRoundTable({ value, tableId, chair }) {
    value = +value;
    // const SPACE_BETWEEN_CHAIRS_AND_TABLE = 4; // Space from table to chair in inch
    // const SPACE_BETWEEN_CHAIRS = 2; // 2inch ~ 5cm
    // If chairs less then 4 devide table into 8 parts, and place chairs accordinly, else spread equally
    const totalChairs = value <= 4 ? 8 : value;

    const svgJs = this.#getMainSvg();
    const tableGroup = svgJs.find(`#${tableId}`)[0];

    const chairAssets = tableGroup.find('[data-js="svg-asset"]');

    let totalPrevChairsCount = chairAssets.length;

    // Update chairs in the current value is different then previous
    if (totalPrevChairsCount !== value) {
      // If there are no chairs placed yet, eg: Preview mode
      if (totalPrevChairsCount < value) {
        const isPreview = true;
        const start = totalPrevChairsCount;
        const end = value;

        for (let i = start; i < end; i++) {
          const currentChairNumber = i + 1;

          this.#addChairToTheTable({
            tableId,
            currentChairNumber,
            chair,
            totalChairs,
            isPreview,
          });
        }
      } else {
        // Remove Chairs
        for (let i = totalPrevChairsCount; i > value; i--) {
          chairAssets[i - 1].remove();
        }
      }

      this.#updateChairsPlacement(totalChairs, tableId);
    }
  }

  /**
   * @description if chairs <= 4 devide table in to 8 part and place chairs first in vertical
   * then in horizontal, else place equally around the table
   * @param {number} totalChairs total amount of the chairs
   * @param {number} currentChairNumber chair
   * @returns {number} val converted chair number
   */
  static getChairPairVal(totalChairs, currentChairNumber) {
    totalChairs = +totalChairs;
    currentChairNumber = +currentChairNumber;

    let chairPair = {
      1: 6,
      2: 2,
      3: 0,
      4: 4,
      5: 7,
      6: 3,
      7: 5,
      8: 1,
    };

    let val = chairPair[currentChairNumber];

    if (totalChairs !== 8) {
      val = currentChairNumber - 1;
    }

    return val;
  }

  //wip
  confirmChairsOnRoundTable(tableId, value) {
    value = +value;
    const svgJs = this.#getMainSvg();
    const tableGroup = svgJs.find(`#${tableId}`)[0];
    const chairAssets = tableGroup.find('[data-js="svg-asset"]');
    chairAssets.forEach(chair => {
      chair.removeClass('preview');
    });
    this.#adjustSizeOfSelectionRectangle(tableId);

    if (value === 0) {
      // Reset outerWrapper of the table
      const chair = this.getChairType('chiavari');

      const depth = chair.dimensions.depth; //18
      this.#updateTableChairWrapper(tableId, depth);
    }
  }

  //wip
  resetChairsOnRoundTable(tableId, value, chair) {
    value = +value;
    const svgJs = this.#getMainSvg();
    const tableGroup = svgJs.find(`#${tableId}`)[0];
    const chairAssets = tableGroup.find('[data-js="svg-asset"]');
    const totalChairs = value <= 4 ? 8 : value;

    chairAssets.forEach(chair => {
      chair.remove();
    });

    for (let i = 0; i < value; i++) {
      const currentChairNumber = i + 1;

      this.#addChairToTheTable({
        tableId,
        currentChairNumber,
        chair,
        totalChairs,
        isPreview: false,
      });
    }
  }

  removePreviewChairs(tableId) {
    const svgJs = this.#getMainSvg();
    const tableGroup = svgJs.findOne(`#${tableId}`);
    const chairs = tableGroup.find('[data-js="svg-asset"]');

    chairs.forEach(chair => {
      if (chair.hasClass('preview')) {
        chair.remove();
      }
    });
  }

  changeTableChairsType({ assetDomId, asset }) {
    const mainSvg = this.#getMainSvg();
    const assetGroup = mainSvg.find(`#${assetDomId}`);
    const chairs = assetGroup.find('[data-js="svg-asset"]')[0];
    const chairDepth = asset.dimensions.depth;

    const totalChairs = chairs.length <= 4 ? 8 : +chairs.length;
    chairs.forEach(chair => {
      const id = chair.attr('id');
      this.changeFurnitureType({ assetDomId: id, asset });
    });

    this.#updateTableChairWrapper(assetDomId, chairDepth);
    this.#updateChairsPlacement(totalChairs, assetDomId);
  }

  //wip
  previewChairsOnRectTable({ value, tableId, chair }) {
    value = +value;
    // const SPACE_BETWEEN_CHAIRS_AND_TABLE = 4; // Space from table to chair in inch
    // const SPACE_BETWEEN_CHAIRS = 2; // 2inch ~ 5cm
    // If chairs less then 4 devide table into 8 parts, and place chairs accordinly, else spread equally

    const svgJs = this.#getMainSvg();
    const tableGroup = svgJs.find(`#${tableId}`)[0];

    const chairAssets = tableGroup.find('[data-js="svg-asset"]');

    let totalPrevChairsCount = chairAssets.length;

    // Update chairs in the current value is different then previous
    if (totalPrevChairsCount !== value) {
      // If there are no chairs placed yet, eg: Preview mode
      if (totalPrevChairsCount < value) {
        const isPreview = true;
        const start = totalPrevChairsCount;
        const end = value;

        for (let i = start; i < end; i++) {
          const currentChairNumber = i + 1;

          const { chairGroup } = this.#generateChair({
            tableId,
            currentChairNumber,
            chair,
            isPreview,
          });

          const chairbbox = chairGroup.bbox();
          const height = chairbbox.height;

          if (i <= 2) {
            let { x, y, rotation } = this.#getChairXYRotationR(
              tableId,
              currentChairNumber - 1,
              'side1'
            );
            chairGroup.transform({
              translate: [x, y],
              rotate: rotation,
              relative: [0, -height],
            });
          } else {
            let cur = currentChairNumber - 1;
            const number = cur - 3;
            let { x, y, rotation } = this.#getChairXYRotationR(
              tableId,
              number,
              'side2'
            );
            chairGroup.transform({
              translate: [x, y],
              rotate: rotation,
              relative: [0, 0],
            });
          }
        }
      } else {
        // Remove Chairs
        for (let i = totalPrevChairsCount; i > value; i--) {
          chairAssets[i - 1].remove();
        }
      }

      // this.#updateChairsPlacement(totalChairs, tableId, 'rectangular');
    }
  }

  changeChairsTypeOnRectTable({ assetDomId, asset }) {
    const mainSvg = this.#getMainSvg();
    const assetGroup = mainSvg.find(`#${assetDomId}`);
    const chairs = assetGroup.find('[data-js="svg-asset"]')[0];
    const chairDepth = asset.dimensions.depth;
    const chairWidth = asset.dimensions.width;

    chairs.forEach(chair => {
      const id = chair.attr('id');
      this.changeFurnitureType({ assetDomId: id, asset });
    });

    this.#updateRectTableGuidelines(assetDomId, chairWidth);
    this.#updateChairsPlacementRectangular(assetDomId, chairDepth);
  }

  //wip
  confirmChairsOnRectTable(tableId, value) {
    value = +value;
    const svgJs = this.#getMainSvg();
    const tableGroup = svgJs.find(`#${tableId}`)[0];
    const chairAssets = tableGroup.find('[data-js="svg-asset"]');
    chairAssets.forEach(chair => {
      chair.removeClass('preview');
    });

    if (value === 0) {
      // Reset outerWrapper of the table
      const defaultChairDepth = 18;
      this.#updateChairsPlacementRectangular(tableId, defaultChairDepth);
    }
  }

  //wip
  resetChairsOnRectTable(tableId, value, chair) {
    value = +value;
    const svgJs = this.#getMainSvg();
    const tableGroup = svgJs.findOne(`#${tableId}`);
    const chairAssets = tableGroup.find('[data-js="svg-asset"]');

    chairAssets.forEach(chair => {
      chair.remove();
    });
    const isPreview = false;
    for (let i = 0; i < value; i++) {
      const currentChairNumber = i + 1;

      const { chairGroup } = this.#generateChair({
        tableId,
        currentChairNumber,
        chair,
        isPreview,
      });

      const chairbbox = chairGroup.bbox();
      const height = chairbbox.height;

      if (i <= 2) {
        let { x, y, rotation } = this.#getChairXYRotationR(
          tableId,
          currentChairNumber - 1,
          'side1'
        );
        chairGroup.transform({
          translate: [x, y],
          rotate: rotation,
          relative: [0, -height],
        });
      } else {
        let cur = currentChairNumber - 1;
        const number = cur - 3;
        let { x, y, rotation } = this.#getChairXYRotationR(
          tableId,
          number,
          'side2'
        );
        chairGroup.transform({
          translate: [x, y],
          rotate: rotation,
          relative: [0, 0],
        });
      }
    }
  }

  setTableLinen(id, isLinen) {
    const svgJs = this.#getMainSvg();
    const tableGroup = svgJs.findOne(`#${id}`);
    const svgPathLinen = tableGroup.findOne('[data-is="linen"]');

    if (isLinen) {
      tableGroup.data('linen', 'true', true);
      svgPathLinen.addClass('show');
    } else {
      tableGroup.data('linen', 'false', true);
      svgPathLinen.removeClass('show');
    }
  }

  getTableLinen(id) {
    const svgJs = this.#getMainSvg();
    const tableGroup = svgJs.findOne(`#${id}`);
    const linen =
      tableGroup.data('linen') === undefined ? false : tableGroup.data('linen');

    return linen;
  }

  previewDuplicateFurniture({ id, value, category, zoomLevel }) {
    let space = 4;
    if (category === ENUM_CATEGORY.TABLE) {
      space = 30;
      const tableHasChairs = this.getTableChairs(id);
      if (tableHasChairs.count > 0) {
        space = 42; //42 inches between each chair at the end of each table
      }
    }
    this.#previewDuplicateFurniture(id, value, space, zoomLevel);
  }

  confirmDuplicateFurniture() {
    const svgJs = this.#getMainSvg();
    const previewDuplicatePlaced = svgJs.find('[data-preview="true"]');

    previewDuplicatePlaced.forEach(item => {
      item.removeClass('preview');
      item.removeClass('active');
      item.data('preview', 'false', true);

      const id = item.attr('id');

      const assetEl = document.querySelector(`#${id}`);

      this.#addDraggable(assetEl);

      this.#setEventListeners(assetEl);
    });
  }

  /**
   * @description Get the furniture object
   * @param {string} domId of the group
   * @param {number} zoomLevel value
   * @returns {object} Furniture Object
   */
  getFurnitureItem(domId, zoomLevel) {
    const svgJs = this.#getMainSvg();
    // const floorplan = svgJs.findOne('text');

    const roomGroup = svgJs.findOne('#floor-plan-rect');

    const topLevelAsset = roomGroup.findOne(`#${domId}`);
    const topLevelBBox = topLevelAsset.bbox();
    const topLevelRBox = topLevelAsset.rbox();

    //Distance from rigth side of the floorplan to the furniture object
    const distance = (roomGroup.rbox().x2 - topLevelRBox.x2) / zoomLevel;

    const node = topLevelAsset.node;
    const children = [];
    const findChildren = topLevelAsset.find('[data-js="svg-asset"]');

    findChildren.forEach(child => {
      const childNode = child.node;
      const childTemp = {
        id: childNode.dataset.id,
        type: childNode.dataset.type,
        category: childNode.dataset.category,
        title: childNode.getAttribute('title'),
        x: child.transform().translateX,
        y: child.transform().translateY,
        rotation: Math.round(child.transform().rotate),
        width: childNode.dataset.width,
        height: childNode.dataset.height,
        ...(childNode.dataset.length && {
          length: childNode.dataset.length,
        }),
        ...(childNode.dataset.depth && {
          depth: childNode.dataset.depth,
        }),
      };

      children.push(childTemp);
    });

    const furnitureObject = {
      id: node.dataset.id,
      category: node.dataset.category,
      type: node.dataset.type,
      title: node.getAttribute('title'),
      x: topLevelAsset.transform().translateX,
      y: topLevelAsset.transform().translateY,
      rotation: Math.round(topLevelAsset.transform().rotate),
      width: node.dataset.width,
      height: node.dataset.height,
      ...(node.dataset.linen && {
        linen: node.dataset.linen,
      }),
      ...(node.dataset.length && {
        length: node.dataset.length,
      }),
      ...(node.dataset.depth && {
        depth: node.dataset.depth,
      }),
      ...(children.length && {
        children,
      }),
      ...(node.dataset.setup && {
        setup: JSON.parse(node.dataset.setup),
      }),
    };

    return { f_obj: furnitureObject, f_bbox: topLevelBBox, distance };
  }

  placeDuplicateFurniture(originalId, furnitureList) {
    const svgJs = this.#getMainSvg();
    furnitureList.forEach(furniture => {
      const asset = {
        id: furniture.id,
        type: furniture.type,
        category: furniture.category,
        title: furniture.title,
        rotation: furniture.rotation,
        linen: furniture.linen,
        setup: furniture.setup,
        dimensions: {
          width: furniture.width,
          height: furniture.height,
          ...(furniture.length && {
            length: furniture.length,
          }),
          ...(furniture.depth && {
            depth: furniture.depth,
          }),
        },
        ...(furniture.children && {
          children: furniture.children,
        }),
      };

      const assetEl = this.#addAssetToPosition({
        asset,
        x: furniture.x,
        y: furniture.y,
      });

      const parentId = assetEl.id;
      const svgJsO = svgJs.findOne(`#${parentId}`);
      svgJsO.data('preview', 'true', true);
      svgJsO.addClass('preview');
      svgJsO.addClass('active');
      svgJsO.data('original', originalId, true);

      if (typeof asset.children !== 'undefined' && asset.children.length) {
        //add children
        this.#placeChildren({ parentId, children: asset.children });
        this.#adjustSizeOfSelectionRectangle(parentId);
      }
    });
  }

  resetDuplicateFurniture() {
    const svgJs = this.#getMainSvg();
    const previewDuplicatePlaced = svgJs.find('[data-preview="true"]');

    if (previewDuplicatePlaced.length) {
      previewDuplicatePlaced.forEach(item => {
        item.remove();
      });
    }
  }

  removeTableChairsResetType(id) {
    const svgJs = this.#getMainSvg();
    const table = svgJs.findOne(`#${id}`);
    const chairs = table.find('[data-js="svg-asset"]');

    const chair = this.getChairType('chiavari');

    const depth = chair.dimensions.depth;

    const tableType = this.getType(id);

    if (tableType === ENUM_SHAPES.ROUND) {
      this.#updateTableChairWrapper(id, depth);
    }

    if (chairs.length) {
      chairs.forEach(item => {
        item.remove();
      });
    }
  }

  removeTableChairs(id) {
    const svgJs = this.#getMainSvg();
    const table = svgJs.findOne(`#${id}`);
    const chairs = table.find('[data-js="svg-asset"]');

    if (chairs.length) {
      chairs.forEach(item => {
        item.remove();
      });
    }
  }

  getAllObjects() {
    const svgJs = this.#getMainSvg();

    const roomGroup = svgJs.findOne('#floor-plan-rect');
    const topLevelAsset = roomGroup.find('[data-level="1"]');

    return topLevelAsset;
  }

  duplicateFurnitureBulk({ ids, zoomLevel }) {
    const space = 10;
    const value = 1;

    const { f_bbox: mainSelectionBbox, distance: mainSelectionDistance } =
      this.getFurnitureItem('main-selection', zoomLevel);

    ids.map(id => {
      const { f_obj } = this.getFurnitureItem(id, zoomLevel);

      const maxAllowed = Math.floor(
        mainSelectionDistance / (+mainSelectionBbox.width + space)
      );

      const generateFurnitureList = [];

      if (maxAllowed >= value) {
        const box = +mainSelectionBbox.width + space;
        const spaceFromLeftSelctionToFurniture = f_obj.x - mainSelectionBbox.x;
        const xPos =
          box + mainSelectionBbox.x + spaceFromLeftSelctionToFurniture;

        const temp = Object.assign({ ...f_obj }, { x: xPos });

        generateFurnitureList.push(temp);
      }
      this.placeDuplicateFurniture(id, generateFurnitureList);
      this.confirmDuplicateFurniture();
    });
  }

  /**
   * @description Generating setup object, and then placing it in DOM
   * @param {object} setup setup theater object
   * @param {number} setup.chairsTotal total number of chairs received from the modal
   * @param {number} setup.chairSpacing chair spacing in inches = px
   * @param {number} setup.chairsPerRow how many chairs should be set in a row, from modal
   * @param {number} setup.rowsTotal total of the rows, get from modal
   * @param {number} setup.rowSpacing spacing between the rows, already converted to Px from FT, eg 2ft -> 24px
   * @param {number} setup.aisles how many aisles to be set
   * @param {number} setup.aisleWidth width of the aisle, converted to PX from FT
   */
  placeTheaterSetup({
    chairsTotal,
    chairSpacing,
    chairsPerRow,
    rowsTotal,
    rowSpacing,
    aisles,
    aisleWidth,
  }) {
    const { width, height } = this.#getFloorplanWidthHeigth();

    const chairsList = this.getChairs();
    const findChair = chairsList.filter(
      chair => chair.type === 'curve_back'
    )[0];

    const { chairs, setup } = this.#generateTheaterSetup({
      floorPlanWidth: width,
      floorPlanHeight: height,
      chairsTotal,
      chairSpacing,
      chairsPerRow,
      rowsTotal,
      rowSpacing,
      aisles,
      aisleWidth,
      chair: findChair,
    });

    let group = [];

    let groupTemp = {
      category: 'setup',
      type: 'theater',
      title: 'Theater',
      x: 10,
      y: 10,
      rotation: 0,
      // width: node.dataset.width,
      // height: node.dataset.height,

      children: chairs,
      setup: setup,
    };

    group.push(groupTemp);
    this.placeFurniture(group);
  }

  #generateTheaterSetup({
    floorPlanWidth,
    floorPlanHeight,
    chairsTotal,
    chairSpacing,
    chairsPerRow,
    rowsTotal,
    rowSpacing,
    aisles,
    aisleWidth,
    chair,
  }) {
    const chairsList = [];

    const chairWidth = +chair.dimensions.width;
    const chairDepth = +chair.dimensions.depth;

    let addAislesAtThisChairs = [];

    let blocksOfChairs;

    let chairsPerRowBasedOnChairsTotal =
      chairsPerRow > chairsTotal ? chairsTotal : chairsPerRow;

    if (aisles !== 0) {
      if (aisles === 1) {
        blocksOfChairs = Math.round(chairsPerRowBasedOnChairsTotal / 2);
      } else {
        blocksOfChairs = Math.round(
          chairsPerRowBasedOnChairsTotal / (aisles + 1)
        );
      }

      for (let i = 1; i <= aisles; i++) {
        addAislesAtThisChairs.push(i * blocksOfChairs + 1);
      }
    }

    let xPos = 0;
    let yPos = 0;
    let currentChairInARow = 1;
    const floorPlanWidthWithDeltas = floorPlanWidth - 20; // 10 inches from each side
    const floorPlanHeightWidthDeltas = floorPlanHeight - 20;
    // let totalSetupWidth = 0;
    let isExceed = false;
    let actualAmountOfRows = 1;
    for (let i = 0; i < chairsTotal; i++) {
      const currentChair = i + 1;
      currentChairInARow++;

      let temp = {
        id: chair.id,
        type: 'curve_back',
        category: 'chair',
        title: 'Curve Back',
        x: xPos,
        y: yPos,
        rotation: 0,
        width: chairWidth,
        depth: chairDepth,
      };

      if (aisles !== 0) {
        addAislesAtThisChairs.map(spaceAtChair => {
          if (currentChairInARow === spaceAtChair) {
            xPos += aisleWidth;
          }
        });
      }

      xPos = xPos + chairWidth + chairSpacing;
      // totalSetupWidth = Math.max(totalSetupWidth, xPos);

      // Finding new row
      // 1. iF the last chair xPos exceed the width of the floorplan
      // 2. If there are rows definied in the modal

      // New Row if the chairs exceed the width of the floorplan
      if (xPos + chairWidth > floorPlanWidthWithDeltas) {
        isExceed = true;
      }

      // Defining new row

      if (
        (isExceed && xPos + chairWidth > floorPlanWidthWithDeltas) ||
        (currentChair % chairsPerRowBasedOnChairsTotal === 0 && !isExceed)
      ) {
        yPos = yPos + chairDepth + rowSpacing;
        xPos = 0;
        currentChairInARow = 1;
        if (currentChair !== chairsTotal) {
          actualAmountOfRows++;
        }
      }

      chairsList.push(temp);
    }

    // Filtering out chairs if exceed the  width of the floorplan
    // Not in use now, as decided to move the chairs to a new row
    const newListWidth = chairsList.filter(chair => {
      if (chair.x < floorPlanWidthWithDeltas) return chair;
    });

    // Filtering our chairs if they exceed in height of the floorplan

    const newListHeight = newListWidth.filter(chair => {
      if (chair.y < floorPlanHeightWidthDeltas) return chair;
    });

    const rowSpacingFT = utils.pxToFt(rowSpacing);
    const aisleWidthFt = utils.pxToFt(aisleWidth);

    const setup = {
      chairs_total: +chairsTotal,
      chair_spacing_inch: +chairSpacing,
      chairs_per_row: +chairsPerRow,
      rows_total: actualAmountOfRows,
      row_spacing_ft: rowSpacingFT,
      aisles: +aisles,
      aisle_width_ft: aisleWidthFt,
      // default chair type on initial creation of the theater setup
      chair_type: 'curve_back',
    };

    return { chairs: newListHeight, setup };
  }

  placeClassroomSetup({
    tablesTotal,
    tableSpacing,
    tablesPerRow,
    rowsTotal,
    rowSpacing,
    chairsPerTable,
    aisles,
    aisleWidth,
  }) {
    const { width, height } = this.#getFloorplanWidthHeigth();

    const chairsList = this.getChairs();
    const findChair = chairsList.filter(
      chair => chair.type === 'curve_back'
    )[0];

    const tableList = this.getTables();
    const findTable = tableList.filter(
      table => table.type === ENUM_SHAPES.RECTANGULAR
    )[0];

    const { classroom, setup } = this.#generateClassroomSetup({
      floorPlanWidth: width,
      floorPlanHeight: height,
      tablesTotal,
      tableSpacing,
      tablesPerRow,
      rowsTotal,
      rowSpacing,
      chairsPerTable,
      aisles,
      aisleWidth,
      table: findTable,
      chair: findChair,
    });

    let group = [];

    let xGroupPos = 10;
    let yGroupPos = 10;

    if (chairsPerTable !== 0) {
      yGroupPos = 10 + +findChair.dimensions.depth;
    }

    let groupTemp = {
      category: 'setup',
      type: 'classroom',
      title: 'Classroom',
      x: xGroupPos,
      y: yGroupPos,
      rotation: 0,
      // width: node.dataset.width,
      // height: node.dataset.height,
      children: classroom,
      setup: setup,
    };

    group.push(groupTemp);

    this.placeFurniture(group);
  }

  #generateClassroomSetup({
    floorPlanWidth,
    floorPlanHeight,
    tablesTotal,
    tableSpacing,
    tablesPerRow,
    rowsTotal,
    rowSpacing,
    chairsPerTable,
    aisles,
    aisleWidth,
    table,
    chair,
  }) {
    console.log(floorPlanWidth, floorPlanHeight, chair, table);
    const classroomList = [];

    let addAislesAtThisTables = [];

    let blocksOfTables;

    let tablesPerRowBasedOnTablesTotal =
      tablesPerRow > tablesTotal ? tablesTotal : tablesPerRow;

    if (aisles !== 0) {
      if (aisles === 1) {
        blocksOfTables = Math.round(tablesPerRowBasedOnTablesTotal / 2);
      } else {
        blocksOfTables = Math.round(
          tablesPerRowBasedOnTablesTotal / (aisles + 1)
        );
      }

      for (let i = 1; i <= aisles; i++) {
        addAislesAtThisTables.push(i * blocksOfTables + 1);
      }
    }

    let xPos = 0;
    let yPos = 0;
    let currentTableInARow = 1;
    const floorPlanWidthWithDeltas = floorPlanWidth - 20; // 10 inches from each side
    // const floorPlanHeightWidthDeltas = floorPlanHeight - 20;
    // let totalSetupWidth = 0;
    let isExceed = false;

    const tableLength = +table.dimensions.length;
    const tableWidth = +table.dimensions.width;
    const tableHeight = +table.dimensions.height;

    const chairWidth = +chair.dimensions.width;
    const chairDepth = +chair.dimensions.depth;
    const chairHeight = +chair.dimensions.height;

    let chairsList = [];
    let xChairPos = 5;
    let chairSpace = 2;
    let chairRotation = 0;

    if (chairsPerTable === 2) {
      xChairPos = 15;
      chairSpace = 8;
    } else if (chairsPerTable === 1) {
      xChairPos = 28;
      chairSpace = 0;
    }

    let yChairPos = -(chairDepth + 2);

    for (let j = 0; j < chairsPerTable; j++) {
      let tempChair = {
        id: chair.id,
        type: chair.type,
        category: chair.category,
        title: chair.title,
        width: chairWidth,
        height: chairHeight,
        depth: chairDepth,
        x: xChairPos,
        y: yChairPos,
        rotation: chairRotation,
      };

      xChairPos = xChairPos + chairWidth + chairSpace;

      if (j === 2) {
        if (chairsPerTable === 5) {
          xChairPos = 15 + chairWidth;
          chairSpace = 8;
        } else if (chairsPerTable === 4) {
          xChairPos = 28 + chairWidth;
          chairSpace = 0;
        } else {
          xChairPos = 5 + chairWidth;
          chairSpace = 2;
        }
        yChairPos = 2 * chairDepth - 3;
        chairRotation = 180;
      }
      chairsList.push(tempChair);
    }

    let actualAmountOfRows = 1;
    for (let i = 0; i < tablesTotal; i++) {
      const currentTable = i + 1;
      currentTableInARow++;

      let temp = {
        id: table.id,
        type: table.type,
        category: table.category,
        title: table.title,
        linen: false,
        x: xPos,
        y: yPos,
        rotation: 0,
        width: tableWidth,
        length: tableLength,
        height: tableHeight,
        children: chairsList,
      };

      if (aisles !== 0) {
        addAislesAtThisTables.map(spaceAtTable => {
          if (currentTableInARow === spaceAtTable) {
            xPos += aisleWidth;
          }
        });
      }

      xPos = xPos + tableLength + tableSpacing;

      if (xPos + tableLength > floorPlanWidthWithDeltas) {
        isExceed = true;
      }

      if (
        (isExceed && xPos + tableLength > floorPlanWidthWithDeltas) ||
        (currentTable % tablesPerRowBasedOnTablesTotal === 0 && !isExceed)
      ) {
        switch (chairsPerTable) {
          case 0:
            yPos = yPos + tableWidth + rowSpacing;
            break;
          case 1:
          case 2:
          case 3:
            yPos = yPos + tableWidth + rowSpacing + chairDepth;
            break;
          case 4:
          case 5:
          case 6:
            yPos = yPos + tableWidth + rowSpacing + 2 * chairDepth;
            break;
        }

        xPos = 0;
        currentTableInARow = 1;

        if (currentTable !== tablesTotal) {
          actualAmountOfRows++;
        }
      }

      classroomList.push(temp);
    }

    // Filtering out chairs if exceed the  width of the floorplan
    // Not in use now, as decided to move the chairs to a new row
    // const newListWidth = classroomList.filter(chair => {
    //   if (chair.x < floorPlanWidthWithDeltas) return chair;
    // });

    // Filtering our chairs if they exceed in height of the floorplan

    // const newListHeight = newListWidth.filter(chair => {
    //   if (chair.y < floorPlanHeightWidthDeltas) return chair;
    // });

    const rowSpacingFT = utils.pxToFt(rowSpacing);
    const aisleWidthFt = utils.pxToFt(aisleWidth);

    const setup = {
      tables_total: +tablesTotal,
      table_spacing_inch: +tableSpacing,
      tables_per_row: +tablesPerRow,
      rows_total: actualAmountOfRows,
      row_spacing_ft: rowSpacingFT,
      aisles: +aisles,
      aisle_width_ft: aisleWidthFt,
      // default chair type on initial creation of the theater setup
      chair_type: 'curve_back',
      table_type: 'rectangular',
      chairs_per_table: chairsPerTable,
      table_linen: false,
    };

    return { classroom: classroomList, setup: setup };
  }

  placeBanquetSetup({
    isAligned,
    tablesTotal,
    tableSpacing,
    rowsTotal,
    chairsPerTable,
  }) {
    const { width, height } = this.#getFloorplanWidthHeigth();

    //default chair: curve back chair
    const chairsList = this.getChairs();
    const findChair = chairsList.filter(
      chair => chair.type === 'curve_back'
    )[0];

    const tableList = this.getTables();
    const findTable = tableList.filter(
      table => table.type === ENUM_SHAPES.ROUND
    )[0];

    const { banquet, setup } = this.#generateBanquetSetup({
      isAligned,
      floorPlanWidth: width,
      floorPlanHeight: height,
      tablesTotal,
      tableSpacing,
      rowsTotal,
      chairsPerTable,
      table: findTable,
      chair: findChair,
    });

    let group = [];

    let xGroupPos = 20;
    let yGroupPos = 20;

    if (chairsPerTable !== 0) {
      yGroupPos = 20 + +findChair.dimensions.depth;
      xGroupPos = 20 + +findChair.dimensions.depth;
    }

    let groupTemp = {
      category: 'setup',
      type: 'banquet',
      title: 'Banquet',
      x: xGroupPos,
      y: yGroupPos,
      rotation: 0,
      // width: node.dataset.width,
      // height: node.dataset.height,
      children: banquet,
      setup: setup,
    };

    group.push(groupTemp);

    this.placeFurniture(group);
  }

  #generateBanquetSetup({
    isAligned,
    floorPlanWidth,
    floorPlanHeight,
    tablesTotal,
    tableSpacing,
    rowsTotal,
    chairsPerTable,
    table,
    chair,
  }) {
    const banquetList = [];

    let xPos = 0;
    let yPos = 0;
    const floorPlanWidthWithDeltas = floorPlanWidth - 40; // 10 inches from each side
    const floorPlanHeightWidthDeltas = floorPlanHeight - 40;
    // let totalSetupWidth = 0;
    let isExceed = false;

    let tablesPerRowBasedOnTablesTotal =
      rowsTotal > 0 ? Math.round(tablesTotal / rowsTotal) : 1;

    const tableLength = +table.dimensions.length;
    const tableWidth = +table.dimensions.width;
    const tableHeight = +table.dimensions.height;

    const chairWidth = +chair.dimensions.width;
    const chairDepth = +chair.dimensions.depth;
    const chairHeight = +chair.dimensions.height;

    const CHAIR_ROTATION_DEGREE = 360 / chairsPerTable;
    const INITIAL_CHAIR_ROTATION = 96;
    let chairRotation = INITIAL_CHAIR_ROTATION;
    let currentAngle = 0;
    let chairsList = [];
    let originX = tableWidth / 2;
    let originY = tableWidth / 2;

    const spaceFromTableToChair = 2;

    const tableRadiusWidthChairs =
      tableWidth / 2 + chairDepth + spaceFromTableToChair;

    const setupWidth = tableWidth + 2 * chairDepth + 2 * spaceFromTableToChair;

    const PointOnCircle = (radius, angleInDegrees, origin) => {
      // Convert from degrees to radians via multiplication by PI/180
      const x = radius * Math.cos((angleInDegrees * Math.PI) / 180) + origin.x;
      const y = radius * Math.sin((angleInDegrees * Math.PI) / 180) + origin.y;

      return { x, y };
    };

    for (let i = 0; i < chairsPerTable; i++) {
      const { x, y } = PointOnCircle(tableRadiusWidthChairs, currentAngle, {
        x: originX,
        y: originY,
      });
      const currentChairNUmber = i + 1;

      let tempChair = {
        id: chair.id,
        type: chair.type,
        category: chair.category,
        title: chair.title,
        width: chairWidth,
        height: chairHeight,
        depth: chairDepth,
        x: x,
        y: y,
        rotation: chairRotation,
      };

      chairRotation =
        INITIAL_CHAIR_ROTATION + CHAIR_ROTATION_DEGREE * currentChairNUmber;

      currentAngle = currentAngle + CHAIR_ROTATION_DEGREE;

      chairsList.push(tempChair);
    }

    let isShifted = false;
    let actualAmountOfRows = 1;
    if (isAligned) {
      // ALIGNED
      for (let i = 0; i < tablesTotal; i++) {
        const currentTable = i + 1;
        let temp = {
          id: table.id,
          type: table.type,
          category: table.category,
          title: table.title,
          linen: false,
          x: xPos,
          y: yPos,
          rotation: 0,
          width: tableWidth,
          length: tableLength,
          height: tableHeight,
          children: chairsList,
          row: actualAmountOfRows,
        };

        xPos = xPos + setupWidth + tableSpacing;

        if (xPos + setupWidth > floorPlanWidthWithDeltas) {
          isExceed = true;
        }

        if (
          (isExceed && xPos + setupWidth > floorPlanWidthWithDeltas) ||
          (currentTable % tablesPerRowBasedOnTablesTotal === 0 && !isExceed)
        ) {
          if (chairsPerTable === 0) {
            yPos = yPos + tableWidth + tableSpacing;
          } else {
            yPos = yPos + setupWidth + tableSpacing;
          }
          if (currentTable !== tablesTotal) {
            actualAmountOfRows++;
          }
          xPos = 0;
        }

        banquetList.push(temp);
      }
    } else {
      // OFFSET
      const tablesPerRow = Math.round(tablesTotal / rowsTotal);

      const lastTableInARow = [tablesPerRow];

      if (tablesPerRow === 1) {
        for (let i = 1; i < tablesTotal; i++) {
          lastTableInARow.push(i + 1);
        }
      } else {
        for (let i = 1; i <= rowsTotal; i++) {
          const prevValue = lastTableInARow[i - 1];
          if (i % 2) {
            const val = tablesPerRow - 1 + prevValue;
            lastTableInARow.push(val);
          } else {
            const val = tablesPerRow + prevValue;
            lastTableInARow.push(val);
          }
        }
      }

      const lastTableInARowSorted = lastTableInARow.sort((a, b) => a - b);

      let isExceedCurrentRow = 1;
      for (let i = 0; i < tablesTotal; i++) {
        let temp = {
          id: table.id,
          type: table.type,
          category: table.category,
          title: table.title,
          linen: false,
          x: xPos,
          y: yPos,
          rotation: 0,
          width: tableWidth,
          length: tableLength,
          height: tableHeight,
          children: chairsList,
          row: isExceedCurrentRow,
        };

        xPos = xPos + setupWidth + tableSpacing;

        if (xPos + setupWidth > floorPlanWidthWithDeltas) {
          isExceed = true;
        }

        if (
          (isExceed && xPos + tableLength > floorPlanWidthWithDeltas) ||
          (isExceed &&
            isExceedCurrentRow % 2 === 0 &&
            xPos > floorPlanHeightWidthDeltas) ||
          (lastTableInARowSorted.includes(i + 1) && !isExceed)
        ) {
          if (chairsPerTable === 0) {
            yPos = yPos + tableWidth + tableSpacing;
          } else {
            yPos = yPos + setupWidth + tableSpacing;
          }
          // Add Shift
          if (!isShifted) {
            xPos = (2 * setupWidth + tableSpacing) / 2 - setupWidth / 2;
            isShifted = true;
          } else {
            xPos = 0;
            isShifted = false;
          }
          isExceedCurrentRow++;
        }

        banquetList.push(temp);
      }
    }

    const newListHeight = banquetList.filter(chair => {
      if (chair.y < floorPlanHeightWidthDeltas) return chair;
    });

    const tableSpacingFt = utils.pxToFt(tableSpacing);
    const setup = {
      tables_total: newListHeight.length,
      table_spacing_ft: tableSpacingFt,
      rows_total: newListHeight[newListHeight.length - 1].row,
      // default chair type on initial creation of the theater setup
      chair_type: 'curve_back',
      table_type: 'round',
      chairs_per_table: chairsPerTable,
      table_linen: false,
    };

    return { banquet: newListHeight, setup };
  }
}

export default Furniture;
