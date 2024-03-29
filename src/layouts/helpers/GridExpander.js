/**
 * Class representing the option to collapse or expand a grid layout.
 *
 * @category Layouts
 * @subcategory Helpers
 * @property {Canvas} canvas The current canvas to render the element on.
 * @property {GridLayoutConfiguration} layoutConfig An object containing visual restrictions.
 */
class GridExpander {
  constructor(canvas, layoutConfig) {
    this.svg = null
    this.canvas = canvas
    this.config = layoutConfig


    // position
    this.finalX = 0
    this.finalY = 0

    // general info
    this.layoutId = null
    this.isLayoutExpanded = false
    this.type = "grid"
  }


  /**
  * Calculates and renders the expander.
  * @param {Object} [opts={ }] An object containing additional information.
  * @param {Number} [opts.cx=0] The layouts center X position.
  * @param {Number} [opts.cy=0] The layouts center Y position.
  * @param {Number} [opts.X=this.finalX] The expanders calculated final X position.
  * @param {Number} [opts.Y=this.finalY] The expanders calculated final Y position.
  */
  render({
    cx = 0, cy = 0, X = this.finalX, Y = this.finalY,
  }) {
    const svg = this.canvas.group()
    svg.css("cursor", "pointer")
    svg.id(`gridExpander#${this.layoutId}`)

    // text representing the expand operation
    const expandText = "Load_more_data"

    // text representing the collapse operation
    const collapseText = "Show_less_data"


    // helper method that creates the expanders text
    const createText = (innerText) => {
      // create a foreign object which holds the label
      const fobj = this.canvas.foreignObject(1, 1)


      // create the label background
      const background = document.createElement("div")
      background.style.background = this.config.expanderTextBackground
      background.style.padding = `${this.config.expanderFontSize / 2}px`
      background.style.textAlign = "center"
      background.style.width = "fit-content"
      background.style.wordWrap = "break-word"


      // create the actual label text
      const label = document.createElement("div")
      label.innerText = innerText
      label.style.color = this.config.expanderTextColor
      label.style.fontSize = `${this.config.expanderFontSize}px`
      label.style.fontFamily = this.config.expanderFontFamily
      label.style.fontWeight = this.config.expanderFontWeight
      label.style.fontStyle = this.config.expanderFontStyle
      label.style.width = "max-content"
      label.style.wordWrap = "break-word"
      label.setAttribute("id", "label")


      // add the label to the background element
      background.appendChild(label)


      // add the HTML to the SVG
      fobj.add(background)


      // disable the user-select css property
      fobj.css("user-select", "none")
      fobj.height(background.clientHeight)


      // set the labels with
      const labelWidth = label.clientWidth + this.config.expanderFontSize
      label.innerText = innerText.replace(/_/g, " ")
      fobj.width(labelWidth)


      // // move the label into position
      // fobj.center(cx, cy - 25 / 1.05 - riskConnectionLineWidth / 2)


      return fobj
    }

    const expand = createText(expandText)
    const collapse = createText(collapseText)


    // only one text representation is active at once
    if (this.isLayoutExpanded === false) {
      expand.attr({ opacity: 1 })
      collapse.attr({ opacity: 0 })
    } else {
      expand.attr({ opacity: 0 })
      collapse.attr({ opacity: 1 })
    }


    svg.add(expand)
    svg.add(collapse)


    // animate expander into position
    svg
      .center(cx, cy)
      .scale(0.001)
      .attr({ opacity: 0 })
      .animate({ duration: this.config.animationSpeed })
      .transform({ scale: 1, position: [X + svg.bbox().w / 2, Y] })
      .attr({ opacity: 1 })


    // add hover focus
    svg.on("mouseover", () => {
      collapse.transform({ scale: 1.025 })
      expand.transform({ scale: 1.025 })
    })


    // remove hover focus
    svg.on("mouseout", () => {
      collapse.transform({ scale: 0.975 })
      expand.transform({ scale: 0.975 })
    })


    this.finalX = svg.bbox().cx
    this.finalY = svg.bbox().cy

    this.svg = svg
  }


  /**
   * Changes the expanders text to collapse.
   */
  changeToShowMoreText() {
    this
      .svg
      .get(0)
      .attr({ opacity: 0 })

    this
      .svg
      .get(1)
      .attr({ opacity: 1 })
  }


  /**
   * Changes the expanders text to expand.
   */
  changeToHideMoreText() {
    this
      .svg
      .get(0)
      .attr({ opacity: 1 })

    this
      .svg
      .get(1)
      .attr({ opacity: 0 })
  }


  /**
   * Transforms the expander from its final position to its initial rendered position.
   * @param {Object} [opts={ }] An object containing additional information.
   * @param {Number} [opts.X=this.finalX] The expanders calculated final X position.
   * @param {Number} [opts.X=this.finalY] The expanders calculated final X position.
   */
  transformToFinalPosition({ X = this.finalX, Y = this.finalY }) {
    this
      .svg
      .animate({ duration: this.config.animationSpeed })
      .transform({ position: [X + this.svg.bbox().w / 2, Y] })
  }


  /**
   * Removes the rendered SVG expander from the canvas.
   * @param {Object} [opts={ }] An object containing additional information.
   * @param {Number} [opts.withAnimation=false] An indication whether to use an animation to remove the SVG object.
   * @param {Number} [opts.X=this.finalX] The calculated final X position.
   * @param {Number} [opts.X=this.finalY] The calculated final X position.
   */
  removeSVG({ withAnimation = false, X = this.finalX, Y = this.finalY }) {
    if (withAnimation === true) {
      if (this.isRendered()) {
        this
          .svg
          .animate({ duration: this.config.animationSpeed })
          .center(X, Y)
          .attr({ opacity: 0 })
          .after(() => {
            this.svg.remove()
            this.svg = null
          })
      }
    } else if (this.isRendered()) {
      this.svg.remove()
      this.svg = null
    }
  }


  /**
   * Determins if the SVG object is rendered.
   * @returns True, if the SVG is rendered, else false.
   */
  isRendered() {
    return this.svg !== null
  }


  setType(type) {
    this.type = type
  }

  getType() {
    return this.type
  }

  setIsLayoutExpanded(isLayoutExpanded) {
    this.isLayoutExpanded = isLayoutExpanded
  }

  setLayoutId(layoutId) {
    this.layoutId = layoutId
  }

  getIsExpanded() {
    return this.isExpanded
  }

  getFinalX() {
    return this.finalX
  }

  setFinalX(finalX) {
    this.finalX = finalX
  }

  getFinalY() {
    return this.finalY
  }

  setFinalY(finalY) {
    this.finalY = finalY
  }
}


export default GridExpander
