import clamp from "clamp-js"
import BaseNode from "./BaseNode"
import RiskNodeConfiguration from "../configuration/RiskNodeConfiguration"


/**
 * This class is responsible for the visual representation of risks.
 *
 * @category SVG Representations
 * @subcategory Nodes
 * @property {Data} data Loaded data from a database.
 * @property {Canvas} canvas The nested canvas to render the node on.
 * @property {Object} customRepresentation An optional object that contains information to override default representations.
 *
 * @see RiskNodeConfiguration
 */
class RiskNode extends BaseNode {
  constructor(data, canvas, customRepresentation = {}) {
    super(data, canvas)

    this.config = { ...RiskNodeConfiguration, ...data.config, ...customRepresentation }
  }


  /**
   * Creates the risk details description.
   *
   * @return {ForeignObject} A foreign object containing some html and the node's label.
   */
  createRiskDetails() {
    const fobj = this.canvas.foreignObject(this.config.maxTextWidth, this.config.maxTextHeight)

    // add text background
    const background = document.createElement("div")
    background.style.width = `${this.config.maxTextWidth}px`
    background.style.height = `${this.config.maxTextHeight}px`
    background.style.display = "grid"
    background.style.alignItems = "center"
    background.style.gridTemplateColumns = "auto 10px auto"
    background.style.gridTemplateRows = `${this.config.labelFontSize + 4 + this.config.offset * 2}px auto`
    background.setAttribute("id", "label")
    fobj.add(background)

    // add label
    const label = document.createElement("p")
    label.innerText = this.label
    label.style.background = this.config.labelBackground
    label.style.padding = `
      ${this.config.offset}px 
      ${this.config.offset / 2}px 
      ${this.config.offset / 1.5}px 
      ${this.config.offset / 2}px
    `
    label.style.color = this.config.labelColor
    label.style.fontSize = `${this.config.labelFontSize + 4}px`
    label.style.fontFamily = this.config.labelFontFamily
    label.style.fontWeight = this.config.labelFontWeight
    label.style.fontStyle = this.config.labelFontStyle
    if (this.state !== null) {
      label.style.textAlign = "left"
    } else {
      label.style.width = "inherit"
      label.style.textAlign = "center"
    }


    label.style.marginTop = `${this.config.offset}px`
    label.style.height = "fit-content"
    label.style.gridRow = "1"
    label.style.gridColumn = "1"
    clamp(label, { clamp: this.config.maxLabelLineClamp })
    background.appendChild(label)

    // add status, if any exists
    if (this.state !== null) {
      const seperator = document.createElement("p")
      seperator.innerText = "•"

      seperator.style.background = this.config.labelBackground
      seperator.style.padding = `
        ${this.config.offset}px 
        ${this.config.offset / 2}px 
        ${this.config.offset / 1.5}px 
        ${this.config.offset / 2}px
      `
      seperator.style.color = this.config.labelColor
      seperator.style.fontSize = `${this.config.labelFontSize + 4}px`
      seperator.style.fontFamily = this.config.labelFontFamily
      seperator.style.fontWeight = "900"
      seperator.style.fontStyle = this.config.labelFontStyle
      seperator.style.marginTop = `${this.config.offset}px`
      seperator.style.height = "fit-content"
      seperator.style.gridRow = "1"
      seperator.style.gridColumn = "2"
      background.appendChild(seperator)

      const status = document.createElement("p")
      status.innerText = this.state

      status.style.background = this.config.labelBackground
      status.style.padding = `
        ${this.config.offset}px 
        ${this.config.offset / 2}px 
        ${this.config.offset / 1.5}px 
        ${this.config.offset / 2}px
      `
      status.style.color = this.config.labelColor
      status.style.fontSize = `${this.config.labelFontSize + 4}px`
      status.style.fontFamily = this.config.labelFontFamily
      status.style.fontWeight = this.config.labelFontWeight
      status.style.fontStyle = this.config.labelFontStyle
      // status.style.fontStyle = "italic"
      status.style.marginTop = `${this.config.offset}px`
      status.style.height = "fit-content"
      status.style.gridRow = "1"
      status.style.gridColumn = "3"
      background.appendChild(status)
    }

    // add description background
    const descriptionBg = document.createElement("div")
    descriptionBg.style.gridRow = "2"
    descriptionBg.style.gridColumn = "1 / 4"
    descriptionBg.style.width = "fit-content"
    background.appendChild(descriptionBg)

    // add description text
    const description = document.createElement("p")
    description.innerText = this.description
    description.style.background = this.config.detailsBackground
    description.style.height = `${this.config.maxTextHeight - label.clientHeight - this.config.offset * 2}px`
    description.style.padding = `0 ${this.config.offset * 1.5}px`
    description.style.color = this.config.detailsColor
    description.style.fontSize = `${this.config.detailsFontSize}px`
    description.style.fontFamily = this.config.detailsFontFamily
    description.style.fontWeight = this.config.detailsFontWeight
    description.style.fontStyle = this.config.detailsFontStyle
    descriptionBg.appendChild(description)

    clamp(description, { clamp: `${this.config.maxTextHeight - label.clientHeight - this.config.offset * 2}px` })
    return fobj
  }


  /**
  * Transforms the node to its final rendered position.
  *
  * @param {Object} [opts={ }] An object containing additional information.
  * @param {Number} [opts.FX=this.finalY] The final X render position.
  * @param {Number} [opts.FY=this.finalY] The final Y render position.
  */
  transformToFinalPosition({ X = this.finalX, Y = this.finalY }) {
    if (this.isRendered() === false) {
      return
    }

    this.currentX = X
    this.currentY = Y
    this.coords.push([this.currentX, this.currentY])

    if (this.getNodeSize() === "min") {
      this.svg.get(0).animate({ duration: this.config.animationSpeed }).center(X, Y)
      const ix = X + this.config.minIconTranslateX
      const iy = Y + this.config.minIconTranslateY
      this.svg.get(1).animate({ duration: this.config.animationSpeed }).center(ix, iy)
      this.svg.get(2).animate({ duration: this.config.animationSpeed }).center(X, Y)
    } else {
      this.svg.get(0).animate({ duration: this.config.animationSpeed }).center(X, Y)
      const ix = X + this.config.maxIconTranslateX
      const iy = Y + this.config.maxIconTranslateY
      this.svg.get(1).animate({ duration: this.config.animationSpeed }).center(ix, iy)
      this.svg.get(2).animate({ duration: this.config.animationSpeed }).center(X, Y)
    }
  }


  /**
  * Renders a risk node in minimal representation.
  *
  * @param {Object} [opts={ }] An object containing additional information.
  * @param {Number} [opts.IX=this.initialX] The initial X render position.
  * @param {Number} [opts.IY=this.initialY] The initial Y render position.
  * @param {Number} [opts.FX=this.finalY] The final X render position.
  * @param {Number} [opts.FY=this.finalY] The final Y render position.
  */
  renderAsMin({
    IX = this.initialX, IY = this.initialY, FX = this.finalX, FY = this.finalY,
  }) {
    // create svg elements
    const svg = this.createSVGElement()
    const node = this.createNode()
    const icon = this.createIcon()
    const text = this.createLabel()

    svg.add(node)
    svg.add(icon)
    svg.add(text)


    // animate new elements into position
    node
      .center(IX, IY)
      .width(this.config.minWidth)
      .height(this.config.minHeight)
      .dmove(-this.config.minWidth / 2, -this.config.minHeight / 2)
      .animate({ duration: this.config.animationSpeed })
      .center(FX, FY)

    icon
      .center(IX + this.config.minIconTranslateX, IY + this.config.minIconTranslateY)
      .attr({ opacity: this.config.minIconOpacity })
      .size(this.config.minIconSize, this.config.minIconSize)
      .dx(-this.config.minIconSize / 2)
      .dy(-this.config.minIconSize / 2)
      .animate({ duration: this.config.animationSpeed })
      .center(FX + this.config.minIconTranslateX, FY + this.config.minIconTranslateY)

    text
      .size(this.config.minTextWidth, text.children()[0].node.clientHeight)
      .center(IX, IY)
      .scale(0.001)
      .transform({ scale: 1, translate: [this.config.minTextTranslateX, this.config.minTextTranslateY] })
      .animate({ duration: this.config.animationSpeed })
      .center(FX, FY)


    this.currentWidth = this.config.minWidth
    this.currentHeight = this.config.minHeight
    this.nodeSize = "min"

    this.currentX = FX
    this.currentY = FY
    this.coords.push([this.finalX, this.finalY])


    this.svg = svg
    this.checkZoomLevel()
  }


  /**
  * Renders a risk node in detailed representation.
  *
  * @param {Object} [opts={ }] An object containing additional information.
  * @param {Number} [opts.IX=this.initialX] The initial X render position.
  * @param {Number} [opts.IY=this.initialY] The initial Y render position.
  * @param {Number} [opts.FX=this.finalY] The final X render position.
  * @param {Number} [opts.FY=this.finalY] The final Y render position.
  */
  renderAsMax({
    IX = this.initialX, IY = this.initialY, FX = this.finalX, FY = this.finalY,
  }) {
    // create svg elements
    const svg = this.createSVGElement()
    const node = this.createNode()
    const icon = this.createIcon()
    const text = this.createRiskDetails()

    svg.add(node)
    svg.add(icon)
    svg.add(text)


    // animate new elements into position
    node
      .center(IX, IY)
      .width(this.config.maxWidth)
      .height(this.config.maxHeight)
      .dmove(-this.config.maxWidth / 2, -this.config.maxHeight / 2)
      .animate({ duration: this.config.animationSpeed })
      .center(FX, FY)

    icon
      .center(IX + this.config.maxIconTranslateX, IY + this.config.maxIconTranslateY)
      .attr({ opacity: this.config.maxIconOpacity })
      .size(this.config.maxIconSize, this.config.maxIconSize)
      .dx(-this.config.maxIconSize / 2)
      .dy(-this.config.maxIconSize / 2)
      .animate({ duration: this.config.animationSpeed })
      .center(FX + this.config.maxIconTranslateX, FY + this.config.maxIconTranslateY)

    text
      .center(IX, IY)
      .scale(0.001)
      .transform({ scale: 1, translate: [this.config.maxTextTranslateX, this.config.maxTextTranslateY] })
      .animate({ duration: this.config.animationSpeed })
      .center(FX, FY)


    this.currentWidth = this.config.maxWidth
    this.currentHeight = this.config.maxHeight
    this.nodeSize = "max"

    this.currentX = FX
    this.currentY = FY
    this.coords.push([this.finalX, this.finalY])


    this.svg = svg
    this.checkZoomLevel()
  }


  /**
  * Transforms a node from minimal version to detailed representation.
  *
  * @param {Object} [opts={ }] An object containing additional information.
  * @param {Number} [opts.FX=this.finalY] The final X render position.
  * @param {Number} [opts.FY=this.finalY] The final Y render position.
  */
  transformToMax({ X = this.finalX, Y = this.finalY }) {
    // update current elements
    this
      .svg
      .get(0)
      .animate({ duration: this.config.animationSpeed })
      .width(this.config.maxWidth)
      .height(this.config.maxHeight)
      .center(X, Y)

    // old icon position
    const ix = this.svg.get(1).bbox().cx
    const iy = this.svg.get(1).bbox().cy

    // old text position
    const tx = this.svg.get(2).bbox().cx
    const ty = this.svg.get(2).bbox().cy

    this
      .svg
      .get(2)
      .remove()

    this
      .svg
      .get(1)
      .remove()


    // create new elements
    const icon = this.createIcon()
    const text = this.createRiskDetails()

    this.svg.add(icon)
    this.svg.add(text)


    // put new elements into position
    let iconBlurRemoved = false
    let textBlurRemoved = false

    icon
      .attr({ opacity: 0 })
      .size(1, 1)
      .center(ix, iy)
      .filterWith((add) => { add.gaussianBlur(25, 25); add.id(`transformBlurIcon${this.id}`) })
      .animate({ duration: this.config.animationSpeed })
      .attr({ opacity: this.config.maxIconOpacity })
      .size(this.config.maxIconSize, this.config.maxIconSize)
      .cx(X - this.config.maxIconSize / 2 + this.config.maxIconTranslateX + this.config.maxIconSize / 2)
      .cy(Y - this.config.maxIconSize / 2 + this.config.maxIconTranslateY + this.config.maxIconSize / 2)
      .during((time = this) => {
        if (time > 0.85 && iconBlurRemoved === false) {
          iconBlurRemoved = true
          icon.unfilter()
          const filters = [...this.canvas.defs().node.childNodes].find((d) => d.id === `transformBlurIcon${this.id}`)
          filters.remove()
        }
      })

    const tw = text.bbox().w
    const th = text.bbox().h
    text
      .size(1, 1)
      .center(tx, ty)
      .attr({ opacity: 0 })
      .filterWith((add) => { add.gaussianBlur(11, 11); add.id(`transformBlurText${this.id}`) })
      .animate({ duration: this.config.animationSpeed })
      .attr({ opacity: 1 })
      .size(tw, th)
      .center(X + this.config.maxTextTranslateX, Y + this.config.maxTextTranslateY)
      .during((time = this) => {
        if (time > 0.85 && textBlurRemoved === false) {
          textBlurRemoved = true
          text.unfilter()
          const filters = [...this.canvas.defs().node.childNodes].find((d) => d.id === `transformBlurText${this.id}`)
          filters.remove()
        }
      })


    this.currentWidth = this.config.minWidth
    this.currentHeight = this.config.minHeight
    this.nodeSize = "max"
    this.currentX = X
    this.currentY = Y
    this.checkZoomLevel()
  }


  /**
  * Transforms a node from detailed representation to minimal version.
  *
  * @param {Object} [opts={ }] An object containing additional information.
  * @param {Number} [opts.FX=this.finalY] The final X render position.
  * @param {Number} [opts.FY=this.finalY] The final Y render position.
  */
  transformToMin({ X = this.finalX, Y = this.finalY }) {
    // update current elements
    this
      .svg
      .get(0)
      .animate({ duration: this.config.animationSpeed })
      .width(this.config.minWidth)
      .height(this.config.minHeight)
      .center(X, Y)

    // old icon position
    const ix = this.svg.get(1).bbox().cx
    const iy = this.svg.get(1).bbox().cy

    // old text position
    const tx = this.svg.get(2).bbox().cx
    const ty = this.svg.get(2).bbox().cy

    this
      .svg
      .get(2)
      .remove()

    this
      .svg
      .get(1)
      .remove()


    // create new elements
    const icon = this.createIcon()
    const text = this.createLabel()

    this.svg.add(icon)
    this.svg.add(text)


    // put new elements into position
    let iconBlurRemoved = false
    icon
      .attr({ opacity: 0 })
      .size(1, 1)
      .center(ix, iy)
      .filterWith((add) => { add.gaussianBlur(25, 25); add.id(`transformBlurIcon${this.id}`) })
      .animate({ duration: this.config.animationSpeed })
      .attr({ opacity: this.config.minIconOpacity })
      .size(this.config.minIconSize, this.config.minIconSize)
      .cx(X - this.config.minIconSize / 2 + this.config.minIconTranslateX + this.config.minIconSize / 2)
      .cy(Y - this.config.minIconSize / 2 + this.config.minIconTranslateY + this.config.minIconSize / 2)
      .during((time = this) => {
        if (time > 0.85 && iconBlurRemoved === false) {
          iconBlurRemoved = true
          icon.unfilter()
          const filters = [...this.canvas.defs().node.childNodes].find((d) => d.id === `transformBlurIcon${this.id}`)
          filters.remove()
        }
      })

    let textBlurRemoved = false
    const tw = this.config.minTextWidth
    const th = text.children()[0].node.clientHeight

    text
      .size(1, 1)
      .center(tx, ty)
      .attr({ opacity: 0 })
      .filterWith((add) => { add.gaussianBlur(11, 11); add.id(`transformBlurText${this.id}`) })
      .animate({ duration: this.config.animationSpeed })
      .attr({ opacity: 1 })
      .size(tw, th)
      .center(X + this.config.minTextTranslateX, Y + this.config.minTextTranslateY)
      .during((time = this) => {
        if (time > 0.85 && textBlurRemoved === false) {
          textBlurRemoved = true
          text.unfilter()
          const filters = [...this.canvas.defs().node.childNodes].find((d) => d.id === `transformBlurText${this.id}`)
          filters.remove()
        }
      })

    this.currentWidth = this.config.minWidth
    this.currentHeight = this.config.minHeight
    this.nodeSize = "min"
    this.currentX = X
    this.currentY = Y
    this.checkZoomLevel()
  }
}


export default RiskNode
