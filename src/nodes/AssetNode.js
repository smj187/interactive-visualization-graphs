import clamp from "clamp-js"
import BaseNode from "./BaseNode"
import AssetNodeConfiguration from "../configuration/AssetNodeConfiguration"


/**
 * This class is responsible for the visual representation of assets.
 *
 * @category SVG Representations
 * @subcategory Nodes
 * @property {Data} data The loaded data element from a database.
 * @property {Canvas} canvas The nested canvas to render the node on.
 * @property {Object} customRepresentation An optional object that contains information to override default
 *                                        representations.
 *
 * @see AssetNodeConfiguration
 * @see https://svgjs.com/docs/3.0/container-elements/#svg-svg
 */
class AssetNode extends BaseNode {
  constructor(data, canvas, customRepresentation = {}) {
    super(data, canvas)

    this.config = { ...AssetNodeConfiguration, ...data.config, ...customRepresentation }
  }


  /**
   * Creates the asset details description.
   *
   * @return {ForeignObject} A foreign object containing some html and the node's label.
   */
  createAssetDetails() {
    const fobj = this.canvas.foreignObject(this.config.maxTextWidth, this.config.maxTextHeight)

    // add text background
    const background = document.createElement("div")
    fobj.add(background)
    background.style.width = `${this.config.maxTextWidth}px`
    background.style.height = `${this.config.maxTextHeight}px`
    background.style.display = "grid"
    background.style.gridTemplateColumns = "50% 50%"
    background.setAttribute("id", "label")


    // add label background
    const labelBg = document.createElement("div")
    labelBg.style.gridColumn = "1 / 3"
    labelBg.style.display = "flex"
    labelBg.style.justifyContent = "center"
    background.appendChild(labelBg)

    // add label
    const label = document.createElement("p")
    label.innerHTML = this.label
    label.style.textAlign = "center"
    label.style.background = this.config.labelBackground
    label.style.margin = `${this.config.offset * 2}px 0 ${this.config.offset}px`
    label.style.color = this.config.labelColor
    label.style.fontSize = `${this.config.labelFontSize + 4}px`
    label.style.fontFamily = this.config.labelFontFamily
    label.style.fontWeight = this.config.labelFontWeight
    label.style.fontStyle = this.config.labelFontStyle
    clamp(label, { clamp: this.config.maxLabelLineClamp })
    labelBg.appendChild(label)

    // add description background
    const descriptionBg = document.createElement("div")
    if (this.keyValuePairs.length === 0) {
      descriptionBg.style.gridRow = "2"
      descriptionBg.style.gridColumn = "1 / 3"
    }
    descriptionBg.style.overflow = "hidden"
    background.appendChild(descriptionBg)

    // add description text
    const description = document.createElement("p")
    description.style.background = this.config.detailsBackground
    description.style.padding = `${this.config.offset / 2}px 0 ${this.config.offset / 2}px ${this.config.offset}px`
    description.style.color = this.config.detailsColor
    description.style.fontSize = `${this.config.detailsFontSize}px`
    description.style.fontFamily = this.config.detailsFontFamily
    description.style.fontWeight = this.config.detailsFontWeight
    description.style.fontStyle = this.config.detailsFontStyle
    description.innerText = this.description
    descriptionBg.appendChild(description)
    const maxH = this.config.maxTextHeight - label.clientHeight - this.config.offset * 5
    clamp(description, { clamp: `${maxH}px` })
    descriptionBg.style.height = `${description.clientHeight - 2}px`

    // add key-value pair background
    const kvBg = document.createElement("div")
    kvBg.style.overflow = "hidden"
    background.appendChild(kvBg)
    let kvH = 0

    // add each key value pair entry
    this.keyValuePairs.forEach((elem) => {
      const key = document.createElement("p")
      key.innerText = `• ${elem.key}`
      key.style.color = this.config.detailsColor
      key.style.fontSize = `${this.config.detailsFontSize + 1}px`
      key.style.fontFamily = this.config.detailsFontFamily
      key.style.fontWeight = this.config.detailsFontWeight
      key.style.fontStyle = this.config.detailsFontStyle
      kvBg.appendChild(key)

      const value = document.createElement("p")
      value.innerText = `${elem.value}`
      value.style.color = this.config.detailsColor
      value.style.fontSize = `${this.config.detailsFontSize}px`
      value.style.fontFamily = this.config.detailsFontFamily
      value.style.fontWeight = this.config.detailsFontWeight - 200
      value.style.fontStyle = this.config.detailsFontStyle
      value.style.marginBottom = `${this.config.offset / 2}px`
      value.style.marginLeft = `${this.config.offset}px`
      kvBg.appendChild(value)

      kvH += key.clientHeight + value.clientHeight
      if (kvH > maxH) {
        kvBg.removeChild(key)
        kvBg.removeChild(value)
      }
    })

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
  * Renders an asset node in minimal representation.
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
      .center(IX, IY)
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
  * Renders an asset node in detailed representation.
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
    const text = this.createAssetDetails()

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
    const text = this.createAssetDetails()

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


export default AssetNode
