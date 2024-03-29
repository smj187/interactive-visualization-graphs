import BaseEdge from "./BaseEdge"
import BoldEdgeConfiguration from "../configuration/BoldEdgeConfiguration"
import { calculateDistance } from "../utils/Calculations"


/**
 * This class is responsible for the visual representation of bold edges.
 *
 * @category SVG Representations
 * @subcategory Edges
 * @property {Data} data The loaded data element from a database.
 * @property {Canvas} canvas The nested canvas to render the edge on.
 * @property {BaseEdge} fromNode The starting node reference.
 * @property {BaseEdge} toNode The ending node reference.
 * @property {Object} customRepresentation An object containing information to change the default visualization.
 *
 * @see BoldEdgeConfiguration
 *
 */
class BoldEdge extends BaseEdge {
  constructor(data, canvas, fromNode, toNode, customRepresentation = {}) {
    super(data, canvas, fromNode, toNode)

    this.config = { ...BoldEdgeConfiguration, ...this.config, ...customRepresentation }
  }


  /**
  * Calculates and renders a bold edge between two given nodes.
  *
  * @param {Object} [opts={ }] An object containing additional information.
  * @param {Number} [opts.FX=this.finalFromX] The final X render position.
  * @param {Number} [opts.FY=this.finalFromY] The final Y render position.
  */
  render({ X = this.finalFromX, Y = this.finalFromY, isContextualBoldEdge = false }) {
    const svg = this.createSVGElement(`boldEdge#${this.layoutId}_${this.fromNode.id}_${this.toNode.id}`)

    const x0 = this.finalToX
    const y0 = this.finalToY
    const x1 = this.finalFromX
    const y1 = this.finalFromY


    // the calculate bold arrow
    const plot = isContextualBoldEdge === true ? this.generateContextualArrow() : this.generateBoldArrow()


    // create the SVG edge
    const path = this.canvas.path(plot).stroke({
      color: this.config.strokeColor,
      width: this.config.strokeWidth,
      dasharray: this.config.strokeDasharray,
    })


    // color the edge
    if (isContextualBoldEdge === true) {
      if (this.config.color === "inherit") {
        const toColor = this.toNode.config.borderStrokeColor
        const fromColor = this.fromNode.config.borderStrokeColor

        const gradient = this.canvas.gradient("linear", (add) => {
          add.stop(0, fromColor)
          add.stop(1, toColor)
        })

        // svgdotjs bug: if a gradient gets an id, there is no way to create a gradient with a different color pairing
        // gradient.id("defaultBoldGradient")
        path.fill(gradient)
      } else {
        path.fill(this.config.color)
      }

      // move the edge into its initial position
      path.center((x0 + x1) / 2, (y0 + y1) / 2)
      path.rotate(-90)
    } else {
      if (this.config.color !== "inherit") {
        path.fill(this.config.color)
      } else {
        const theta = Math.atan2(this.finalToY - this.finalFromY, this.finalToX - this.finalFromX)
        path.rotate(-(theta) * (180 / Math.PI))
        let c1 = this.fromNode.config.borderStrokeColor
        let c2 = this.toNode.config.borderStrokeColor
        if ((-(theta) * (180 / Math.PI)) > 90) {
          const t = c1
          c1 = c2
          c2 = t
        }
        const gradient = this.canvas.gradient("linear", (add) => {
          add.stop(0, c1)
          add.stop(1, c2)
        })

        // svgdotjs bug: if a gradient gets an id, there is no way to create a gradient with a different color pairing
        // gradient.id("defaultBoldGradient")
        path.fill(gradient)
        path.rotate((theta) * (180 / Math.PI))
      }

      path.center(X, Y)
    }


    svg.add(path)


    // add label
    if (this.label !== null) {
      const label = this.createLabel()
      svg.add(label)
    }


    // final label position
    const cx = (x0 + x1) / 2
    const cy = (y0 + y1) / 2
    const duration = this.config.animationSpeed


    if (isContextualBoldEdge === true) {
      // parent edge
      if (this.fromNode.getNodeSize() === "max") {
        // center (dx=dy and dy=dx since its 90 degree rotated)
        const dx = this.fromNode.getFinalX() - x0
        const dy = (y0 + y1) / 2 - this.fromNode.getFinalY() - 50

        // initial label position
        const lx = this.fromNode.getFinalX()
        const ly = this.fromNode.getFinalY()

        svg.get(0).dmove(dy, dx).attr({ opacity: 0 }).animate({ duration })
          .dmove(-dy, -dx)
          .attr({ opacity: 1 })
        if (this.label !== null) {
          svg.get(1).center(lx, ly).attr({ opacity: 0 }).animate({ duration })
            .center(cx, cy)
            .attr({ opacity: 1 })
        }
      }
      // child edge
      if (this.toNode.getNodeSize() === "max") {
        // center (dx=dy and dy=dx since its 90 degree rotated)
        const dx = this.toNode.getFinalX() - x0
        const dy = (y0 + y1) / 2 - this.toNode.getFinalY() + 50

        // initial label position
        const lx = this.toNode.getFinalX()
        const ly = this.toNode.getFinalY()

        svg.get(0).dmove(dy, dx).attr({ opacity: 0 }).animate({ duration })
          .dmove(-dy, -dx)
          .attr({ opacity: 1 })
        if (this.label !== null) {
          svg.get(1).center(lx, ly).attr({ opacity: 0 }).animate({ duration })
            .center(cx, cy)
            .attr({ opacity: 1 })
        }
      }
    } else if (this.label !== null) {
      svg
        .get(1)
        .attr({ opacity: 0 })
        .animate({ duration: this.config.animationSpeed })
        .attr({ opacity: 1 })
        .center(cx + this.config.labelTranslateX, cy + this.config.labelTranslateY)
    }


    this.svg = svg
  }


  /**
   * Transforms the edge to its final rendered position.
   */
  transformToFinalPosition({ isContextualBoldEdge = false }) {
    this.svg.back()


    const cx = (this.finalFromX + this.finalToX) / 2
    const cy = (this.finalFromY + this.finalToY) / 2
    if (isContextualBoldEdge === true) {
      this
        .svg
        .get(0)
        .animate({ duration: this.config.animationSpeed })
        .dy(cx - this.svg.bbox().cx)

      if (this.label !== null) {
        this
          .svg
          .get(1)
          .animate({ duration: this.config.animationSpeed })
          .center(cx + this.config.labelTranslateX, cy + this.config.labelTranslateY)
      }
    } else {
      this
        .svg
        .get(0)
        .animate({ duration: this.config.animationSpeed })
        .plot(this.generateBoldArrow())

      if (this.label !== null) {
        this
          .svg
          .get(1)
          .animate({ duration: this.config.animationSpeed })
          .center(cx + this.config.labelTranslateX, cy + this.config.labelTranslateY)
      }
    }
  }


  /**
  * Helper method to create a bold contextual edge.
  * @return {String} The path in string format
  */
  generateContextualArrow() {
    const { lineWidth } = this.config
    const { arrowWidth } = this.config
    const { arrowHeight } = this.config

    const x0 = this.finalToX
    const y0 = this.finalToY
    const x1 = this.finalFromX
    const y1 = this.finalFromY

    const dist1 = calculateDistance(x1, y1, x0, y0)


    // calculate points forming the connection
    const a0 = (x0 + x1) / 2
    const b0 = (y0 + y1) / 2

    const a1 = a0 + dist1
    const b1 = b0

    const a2 = a0
    const b2 = b0 + lineWidth / 2

    const a3 = a2 + (dist1 - arrowHeight)
    const b3 = b2

    const a4 = a3
    const b4 = b2 + (-lineWidth / 2) + arrowWidth / 2

    const a5 = a1
    const b5 = b1

    const a6 = a3
    const b6 = b4 - arrowWidth

    const a7 = a3
    const b7 = b0 - lineWidth / 2

    const a8 = a0
    const b8 = b0 - lineWidth / 2

    // the actual connection as path argument
    const plot = `
      M ${a2},${b2}
      L ${a3},${b3}
      L ${a4},${b4}
      L ${a5},${b5}
      L ${a6},${b6}
      L ${a7},${b7}
      L ${a8},${b8}
      L ${a2},${b2}
    `
    return plot
  }


  /**
  * Helper method to create a bold arrow based on the SVG path.
  * @return {String} The path in string format
  */
  generateBoldArrow() {
    const { lineWidth } = this.config
    const { arrowWidth } = this.config
    const { arrowHeight } = this.config


    const dx = this.finalToX - this.finalFromX
    const dy = this.finalToY - this.finalFromY
    const length = Math.sqrt(dx * dx + dy * dy)

    const delta = (Math.PI / 180) * 90
    const theta = Math.atan2(this.finalToY - this.finalFromY, this.finalToX - this.finalFromX)


    // calculate points forming the connection
    const x0 = this.finalFromX
    const y0 = this.finalFromY

    const x1 = x0 + (lineWidth / 2) * Math.cos(theta + delta)
    const y1 = y0 + (lineWidth / 2) * Math.sin(theta + delta)

    const x2 = x1 + (length - arrowHeight) * Math.cos(theta)
    const y2 = y1 + (length - arrowHeight) * Math.sin(theta)

    const x3 = x2 + ((arrowWidth - lineWidth) / 2) * Math.cos(theta + delta)
    const y3 = y2 + ((arrowWidth - lineWidth) / 2) * Math.sin(theta + delta)

    const x4 = this.finalToX
    const y4 = this.finalToY

    const x5 = x3 + arrowWidth * Math.cos(theta - delta)
    const y5 = y3 + arrowWidth * Math.sin(theta - delta)

    const x6 = x5 + ((arrowWidth - lineWidth) / 2) * Math.cos(theta + delta)
    const y6 = y5 + ((arrowWidth - lineWidth) / 2) * Math.sin(theta + delta)

    const x7 = x0 + (lineWidth / 2) * Math.cos(theta + delta * -1)
    const y7 = y0 + (lineWidth / 2) * Math.sin(theta + delta * -1)

    // the actual connection as path argument
    const plot = `
      M ${x0},${y0}
      L ${x1},${y1}
      L ${x2},${y2}
      L ${x3},${y3}
      L ${x4},${y4}
      L ${x5},${y5}
      L ${x6},${y6}
      L ${x7},${y7}
      L ${x0},${y0}
    `
    return plot
  }
}

export default BoldEdge
