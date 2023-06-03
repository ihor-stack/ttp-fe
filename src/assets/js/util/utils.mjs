export const utils = {
  /**
   * @description Converting Feet to PX
   * @param {number} val ft to px (px = inch)  1ft = 12inch;
   * @returns {number} return size in px
   */
  ftToPx: function (val) {
    const px = +val * 12; //eg: 100ft * 12  = 1200 px / 1200 inch
    return px;
  },

  /**
   * @description Converting PX to Feet
   * @param {number} val px
   * @returns {number} return ft value
   */
  pxToFt: function (val) {
    const ft = +val / 12; //eg:  24px / 12 = 2ft
    return ft;
  },

  /**
   * @description getZoomPercentage used in the input field to display to user
   * zooming level in percentage
   * @param {number} zoomLevel display level in % in the input
   * @returns {number} zoomlevel
   */
  getZoomPercentage: function (zoomLevel) {
    return Math.round(zoomLevel * 100);
  },

  calculateZoomLevel: function ({
    roomWidth,
    roomLength,
    canvasWidth,
    canvasHeight,
  }) {
    let zoomLevel = 1;

    let delta = 0.01;
    const paddings = 60;
    const heightRatio = roomWidth / (canvasHeight - paddings);

    const widthRatio = roomLength / (canvasWidth - paddings);

    const getZoomMax = Math.max(heightRatio, widthRatio);

    if (getZoomMax > 1 && getZoomMax < 4) {
      delta = 0.1;
    } else if (getZoomMax > 100) {
      delta = 0.001;
    }

    //If the floorplan size fit in the screen
    if (getZoomMax > 1) {
      zoomLevel = 1 / getZoomMax - delta;
    }

    const yPos =
      (canvasHeight - roomWidth * zoomLevel - paddings / 2) / 2 / zoomLevel;

    const xPos =
      (canvasWidth - roomLength * zoomLevel + paddings / 2) / 2 / zoomLevel;

    return { zoomLevel, yPos, xPos };
  },

  hoursList: function () {
    const STEP = 15;
    let arr = Array.from(
      {
        length: (12 * 60) / STEP,
      },
      (v, i) => {
        let h = Math.floor((i * STEP) / 60);
        let m = i * STEP - h * 60;
        //convert to 12 hours time
        //pad zero to minute
        if (m < 10) {
          m = '0' + m;
        }

        if (h === 0) {
          h = 12;
        }
        return h + ':' + m;
      }
    );
    return arr;
  },

  uniqueid() {
    // always start with a letter (for DOM friendlyness)
    let idstr = String.fromCharCode(Math.floor(Math.random() * 25 + 65));
    do {
      // between numbers and characters (48 is 0 and 90 is Z (42-48 = 90)
      let ascicode = Math.floor(Math.random() * 42 + 48);
      if (ascicode < 58 || ascicode > 64) {
        // exclude all chars between : (58) and @ (64)
        idstr += String.fromCharCode(ascicode);
      }
    } while (idstr.length < 32);

    return idstr;
  },

  formatDate(timestamp, format = 'LL/dd/yyyy') {
    return window.luxon.DateTime.fromSeconds(Number(timestamp)).toFormat(
      format
    );
  },
};
