import clamp from "clamp-js"
import BaseNode from "./BaseNode"


/**
 * Default configuration for asset nodes
 * @typedef {ControlConfig} ControlConfig
 *
 * @param {Number} [maxWidth=400] The nodes maximal width
 * @param {Number} [maxHeight=190] The nodes maximal height
 * @param {Number} [minWidth=150] The nodes minimal width
 * @param {Number} [minHeight=80] The nodes minimal height
 *
 * @param {String} [iconUrl=null] The path to the image icon (if this value is null, the default icon is used)
 * @param {Number} [minIconOpacity=0.5] The basic visibility of the icon
 * @param {Number} [minIconSize=64] The width and height for the image icon
 * @param {Number} [minIconTranslateX=0] Moves the icon horizontally
 * @param {Number} [minIconTranslateY=0] Moves the icon vertically
 * @param {Number} [maxIconOpacity=0.75] The basic visibility of the icon
 * @param {Number} [maxIconSize=180] The width and height for the image icon
 * @param {Number} [maxIconTranslateX=-100] Moves the icon horizontally
 * @param {Number} [maxIconTranslateY=0] Moves the icon vertically
 *
 * @param {Number} [offset=8] The spacing used by padding and margin
 * @param {Number} [animationSpeed=300] The animation in milliseconds
 * @param {Number} [borderRadius=5] The border radius
 * @param {Number} [borderStrokeWidth=1] The border stroke width
 * @param {String} [borderStrokeColor="#7daed6"] The border color
 * @param {String} [borderStrokeDasharray="0"] Gaps inside border
 * @param {String} [backgroundColor="#ffffff"] The background color for the rendered node
 *
 * @param {Number} [minTextWidth=145] The minimal text width for the label
 * @param {Number} [minTextHeight=75] The minimal text height for the label
 * @param {Number} [minTextTranslateX=0] Moves the label horizontally
 * @param {Number} [minTextTranslateY=0] The the label vertically
 * @param {Number} [maxTextWidth=395] The maximal text width for the description
 * @param {Number} [maxTextHeight=185] The maximal text height for the description
 * @param {Number} [maxTextTranslateX=100] The the description horizontally
 * @param {Number} [maxTextTranslateY=0] The the description vertically
 * @param {String} [labelColor="#5b91b5"] The label text color
 * @param {String} [labelFontFamily="Montserrat"] The label font family
 * @param {Number} [labelFontSize=16] The label font size
 * @param {Number} [labelFontWeight=600] The label font weight
 * @param {String} [labelFontStyle="normal"] The label font style
 * @param {String} [labelBackground="#ffffffcc"] The label background color
 * @param {String} [detailsColor="#5b91b5"] The details text color
 * @param {String} [detailsFontFamily="Montserrat"] The details family
 * @param {Number} [detailsFontSize=12] The details font size
 * @param {Number} [detailsFontWeight=600] The details font weight
 * @param {String} [detailsFontStyle="normal"] The details font style
 * @param {String} [detailsBackground="#ffffff"] The details text background color
 */
const ControlConfig = {
  // large node
  maxWidth: 400,
  maxHeight: 190,


  // small node
  minWidth: 150,
  minHeight: 80,


  // icon
  iconUrl: null,
  minIconOpacity: 0.5,
  minIconSize: 64,
  minIconTranslateX: 0,
  minIconTranslateY: 0,
  maxIconOpacity: 0.75,
  maxIconSize: 180,
  maxIconTranslateX: -100,
  maxIconTranslateY: 0,


  // node
  offset: 8,
  animationSpeed: 300,
  borderRadius: 5,
  borderStrokeWidth: 1,
  borderStrokeColor: "#7daed6",
  borderStrokeDasharray: "0",
  backgroundColor: "#ffffff",


  // text
  minTextWidth: 145,
  minTextHeight: 75,
  minTextTranslateX: 0,
  minTextTranslateY: 0,
  maxTextWidth: 395,
  maxTextHeight: 185,
  maxTextTranslateX: 100,
  maxTextTranslateY: 0,
  labelColor: "#5b91b5",
  labelFontFamily: "Montserrat",
  labelFontSize: 16,
  labelFontWeight: 600,
  labelFontStyle: "normal",
  labelBackground: "#ffffffcc",
  detailsColor: "#5b91b5",
  detailsFontFamily: "Montserrat",
  detailsFontSize: 12,
  detailsFontWeight: 600,
  detailsFontStyle: "normal",
  detailsBackground: "#ffffff",
}


/**
 * Class representing the visualization of controls
 * @param {Data} data the raw node data
 * @param {Canvas} canvas the canvas to render the node on
 * @param {ControlConfig} customControlConfig custom config to override default values
 *
 * @example
 * const control1 = NodeFactory.create(data.find(d => d.type === "control"), canvas)
 * control1.setInitialXY(700, 150)
 * control1.renderAsMin()
 *
 * const control2 = NodeFactory.create(data.find(d => d.type === "control"), canvas)
 * control2.setInitialXY(500, 450)
 * control2.renderAsMax()
 *
 * setTimeout(() => control1.transformToMax(500, 450), 500)
 * setTimeout(() => control2.transformToMin(700, 150), 500)
 *
 */
class ControlNode extends BaseNode {
  constructor(data, canvas, customControlConfig) {
    super(data, canvas)

    this.config = { ...ControlConfig, ...customControlConfig }
  }


  /**
   * Creates the control details description
   * @private
   */
  createControlDetails() {
    const text = this.canvas.foreignObject(this.config.maxTextWidth / 2, this.config.maxTextHeight)
    const background = document.createElement("div")
    background.style.width = `${this.config.maxTextWidth / 2}px`
    background.style.height = `${this.config.maxTextHeight}px`
    text.add(background)

    // add label
    const label = document.createElement("p")
    label.innerText = this.label
    label.style.padding = `${this.config.offset * 1.5}px ${this.config.offset / 2}px ${this.config.offset / 2}px 0px`
    label.style.color = this.config.labelColor
    label.style.fontSize = `${this.config.labelFontSize + 4}px`
    label.style.fontFamily = this.config.labelFontFamily
    label.style.fontWeight = this.config.labelFontWeight
    label.style.fontStyle = this.config.labelFontStyle
    label.style.textAlign = "left"
    background.appendChild(label)

    // add description
    const descriptionBg = document.createElement("div")
    descriptionBg.style.overflow = "hidden"
    descriptionBg.style.margin = `${this.config.offset}px ${this.config.offset}px ${this.config.offset}px 0`
    background.appendChild(descriptionBg)

    const description = document.createElement("p")
    description.innerText = this.description
    description.style.color = this.config.detailsColor
    description.style.fontSize = `${this.config.detailsFontSize}px`
    description.style.fontFamily = this.config.detailsFontFamily
    description.style.fontWeight = this.config.detailsFontWeight
    description.style.fontStyle = this.config.detailsFontStyle
    descriptionBg.appendChild(description)

    // fix overflow text
    clamp(description, { clamp: `${this.config.maxTextHeight - label.clientHeight - this.config.offset * 2.5}px` })
    return text
  }


  /**
   * Renders a control node in minimal version
   * @param {Number} [X=initialX] the initial X render position
   * @param {Number} [Y=initialY] the initial Y render position
   */
  renderAsMin(X = this.initialX, Y = this.initialY) {
    // create svg elements
    const svg = this.createSVGElement()
    const node = this.createNode()
    const icon = this.createIcon()
    const text = this.createLabel()

    svg.add(node)
    svg.add(icon)
    svg.add(text)


    // animate new elements into position
    svg
      .center(X, Y)

    node
      .center(X, Y)
      .animate({ duration: this.config.animationSpeed })
      .width(this.config.minWidth)
      .height(this.config.minHeight)
      .dmove(-this.config.minWidth / 2, -this.config.minHeight / 2)

    icon
      .center(X, Y)
      .attr({ opacity: 0 })
      .animate({ duration: this.config.animationSpeed })
      .attr({ opacity: this.config.minIconOpacity })
      .size(this.config.minIconSize, this.config.minIconSize)
      .dx(-this.config.minIconSize / 2 + this.config.minIconTranslateX)
      .dy(-this.config.minIconSize / 2 + this.config.minIconTranslateY)

    text
      .size(this.config.minTextWidth, text.children()[0].node.clientHeight)
      .center(X, Y)
      .scale(0.001)
      .attr({ opacity: 0 })
      .animate({ duration: this.config.animationSpeed })
      .attr({ opacity: 1 })
      .transform({ scale: 1, translate: [this.config.minTextTranslateX, this.config.minTextTranslateY] })


    this.currentWidth = this.config.minWidth
    this.currentHeight = this.config.minHeight
    this.nodeSize = "min"
    this.currentX = X
    this.currentY = Y
    this.opacity = 1
    this.isHidden = false
    this.svg = svg
  }


  /**
   * Renders a control node in maximal version
   * @param {Number} [X=initialX] the initial X render position
   * @param {Number} [Y=initialY] the initial Y render position
   */
  renderAsMax(X = this.initialX, Y = this.initialY) {
    // create svg elements
    const svg = this.createSVGElement()
    const node = this.createNode()
    const icon = this.createIcon()
    const text = this.createControlDetails()

    svg.add(node)
    svg.add(icon)
    svg.add(text)


    // animate new elements into position
    svg
      .center(X, Y)

    node
      .center(X, Y)
      .animate({ duration: this.config.animationSpeed })
      .width(this.config.maxWidth)
      .height(this.config.maxHeight)
      .dmove(-this.config.maxWidth / 2, -this.config.maxHeight / 2)

    icon
      .center(X, Y)
      .attr({ opacity: 0 })
      .animate({ duration: this.config.animationSpeed })
      .attr({ opacity: this.config.maxIconOpacity })
      .size(this.config.maxIconSize, this.config.maxIconSize)
      .dx(-this.config.maxIconSize / 2 + this.config.maxIconTranslateX)
      .dy(-this.config.maxIconSize / 2 + this.config.maxIconTranslateY)

    text
      .center(X, Y)
      .scale(0.001)
      .attr({ opacity: 0 })
      .animate({ duration: this.config.animationSpeed })
      .attr({ opacity: 1 })
      .transform({ scale: 1, translate: [this.config.maxTextTranslateX, this.config.maxTextTranslateY] })


    this.currentWidth = this.config.maxWidth
    this.currentHeight = this.config.maxHeight
    this.nodeSize = "max"
    this.currentX = X
    this.currentY = Y
    this.opacity = 1
    this.isHidden = false
    this.svg = svg
  }


  /**
   * Transforms a node from minimal version to maximal version
   * @param {Number} [X=finalX] the final X render position
   * @param {Number} [Y=finaY] the final Y render position
   */
  transformToMax(X = this.finalX, Y = this.finalY) {
    // update current elements
    this
      .svg
      .get(0)
      .animate({ duration: this.config.animationSpeed })
      .width(this.config.maxWidth)
      .height(this.config.maxHeight)
      .center(X, Y)

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
    const text = this.createControlDetails()

    this.svg.add(icon)
    this.svg.add(text)


    // put new elements into position
    icon
      .center(this.initialX, this.initialY)
      .attr({ opacity: 0 })
      .animate({ duration: this.config.animationSpeed })
      .attr({ opacity: this.config.maxIconOpacity })
      .size(this.config.maxIconSize, this.config.maxIconSize)
      .cx(X - this.config.maxIconSize / 2 + this.config.maxIconTranslateX + this.config.maxIconSize / 2)
      .cy(Y - this.config.maxIconSize / 2 + this.config.maxIconTranslateY + this.config.maxIconSize / 2)

    text
      .center(this.initialX, this.initialY)
      .scale(0.001)
      .attr({ opacity: 0 })
      .animate({ duration: this.config.animationSpeed })
      .attr({ opacity: 1 })
      .transform({ scale: 1, translate: [this.config.maxTextTranslateX, this.config.maxTextTranslateY] })
      .center(X, Y)


    this.currentWidth = this.config.minWidth
    this.currentHeight = this.config.minHeight
    this.nodeSize = "max"
    this.currentX = X
    this.currentY = Y
  }


  /**
   * Transforms a node from maximal version to minimal version
   * @param {Number} [X=finalX] the final X render position
   * @param {Number} [Y=finaY] the final Y render position
   */
  transformToMin(X = this.finalX, Y = this.finalY) {
    // update current elements
    this
      .svg
      .get(0)
      .animate({ duration: this.config.animationSpeed })
      .width(this.config.minWidth)
      .height(this.config.minHeight)
      .center(X, Y)

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
    icon
      .center(this.initialX, this.initialY)
      .attr({ opacity: 0 })
      .animate({ duration: this.config.animationSpeed })
      .attr({ opacity: this.config.minIconOpacity })
      .size(this.config.minIconSize, this.config.minIconSize)
      .dx(-this.config.minIconSize / 2 + this.config.minIconTranslateX)
      .dy(-this.config.minIconSize / 2 + this.config.minIconTranslateY)
      .center(X, Y)

    text
      .center(this.initialX, this.initialY)
      .size(this.config.minTextWidth, text.children()[0].node.clientHeight)
      .scale(0.001)
      .attr({ opacity: 0 })
      .animate({ duration: this.config.animationSpeed })
      .attr({ opacity: 1 })
      .transform({ scale: 1, translate: [this.config.minTextTranslateX, this.config.minTextTranslateY] })
      .center(X, Y)


    this.currentWidth = this.config.minWidth
    this.currentHeight = this.config.minHeight
    this.nodeSize = "min"
    this.currentX = X
    this.currentY = Y
  }
}


export default ControlNode
