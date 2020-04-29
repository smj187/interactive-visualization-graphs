import BaseEdge from "./BaseEdge"
import ThinEdgeConfiguration from "../configuration/ThinEdgeConfiguration"


/**
 * This class is responsible for the visual representation of bold edges.
 * @property {Data} data The loaded data element from a database.
 * @property {Canvas} canvas The nested canvas to render the edge on.
 * @property {BaseEdge} fromNode The starting node reference.
 * @property {BaseEdge} toNode The ending node reference.
 * @property {Object} customThinEdgeConfig An object containing information to change the default visualization.
 *
 */
class ThinEdge extends BaseEdge {
  constructor(data, canvas, fromNode, toNode, customThinEdgeConfig = {}) {
    super(data, canvas, fromNode, toNode)

    this.config = { ...ThinEdgeConfiguration, ...this.config, ...customThinEdgeConfig }


    this.animation = null
  }


  /**
   * Creates the initial SVG element and adds hover effect.
   */
  render(X, Y) {

    const svg = this.canvas.group() // .draggable()
    svg.css("cursor", "default")
    svg.id(`edge#${this.fromNode.id}_${this.toNode.id}`)

    const line = `M${this.finalFromX},${this.finalFromY} L${this.finalToX},${this.finalToY}`
    const dasharray = this.config.type === "dashed" ? this.config.strokeDasharray : "0"
    const path = this.canvas.path(line).stroke({
      width: this.config.strokeWidth,
      color: this.config.strokeColor,
      dasharray,
    })

    // create a re-useable marker
    const i = [...this.canvas.defs().node.childNodes].findIndex((d) => d.id === "defaultThinMarker")
    if (i === -1) {
      const marker = this.canvas.marker(12, 6, (add) => {
        add.path(this.config.marker).fill(this.config.strokeColor).dx(1)
      })
      marker.id("defaultThinMarker")
      this.canvas.defs().add(marker)
      path.marker("end", marker)
    } else {
      const marker = this.canvas.defs().get(i)
      path.marker("end", marker)
    }


    svg.add(path)

    if (this.label !== null) {
      const label = this.createLabel()
      svg.add(label)
    }

    svg.center(X, Y)


    svg
      .back()

    svg
      .scale(0.001)
      .attr({ opacity: 1 })
      .animate({ duration: this.config.animationSpeed })
      .transform({ scale: 1 })


    svg
      .get(0)
      .attr({ opacity: 0 })
      .animate({ duration: this.config.animationSpeed })
      .plot(`M${this.finalFromX},${this.finalFromY} L${this.finalToX},${this.finalToY}`)
      .attr({ opacity: 1 })

    if (this.label) {
      const x = (this.finalFromX + this.finalToX) / 2 + this.config.labelTranslateX
      const y = (this.finalFromY + this.finalToY) / 2 + this.config.labelTranslateY
      svg
        .get(1)
        .attr({ opacity: 0 })
        .animate({ duration: this.config.animationSpeed })
        .center(x, y)
        .attr({ opacity: 1 })
    }
    this.svg = svg
  }



  /**
   * Transforms an edge to its final rendered position.
   */
  transformToFinalPosition(opts = { isReRender: false }) {



    if (opts.isReRender === true) {
      this
        .svg
        .back()

      // console.log("isReRender")

      // this
      // .svg
      // .scale(0.001)
      // .attr({ opacity: 1 })
      // .animate({ duration: this.config.animationSpeed })
      // .transform({ scale: 1 })

      if (this.animation !== null) {
        this.animation.unschedule()
      }
      this.animation = this.svg.get(0)
        .animate({ duration: this.config.animationSpeed })
        .plot(`M${this.finalFromX},${this.finalFromY} L${this.finalToX},${this.finalToY}`)
        .after(() => {
          this.animation = null
        })

      // console.log("isReRender", this.config.animationSpeed, this.toNode.id, "<-", this.fromNode.id)
      if (this.animation) {
        // this.animation.finish()
      }
      // const res = this
      // .svg
      // .get(0)
      // .attr({ opacity: 0 })
      // .animate({ duration: this.config.animationSpeed })
      // .plot(`M${this.finalFromX},${this.finalFromY} L${this.finalToX},${this.finalToY}`)
      // .attr({ opacity: 1 })
      // console.log(this.svg.get(0))
      // console.log(this.toNode.id, "<-", this.fromNode.id, this.animation, )
      if (this.label) {

        const x = (this.finalFromX + this.finalToX) / 2 + this.config.labelTranslateX
        const y = (this.finalFromY + this.finalToY) / 2 + this.config.labelTranslateY
        this
          .svg
          .get(1)
          // .attr({ opacity: 0 })
          .animate({ duration: this.config.animationSpeed })
          .center(x, y)
        // .attr({ opacity: 1 })
      }
    } else {

      this
        .svg
        .back()


      this
        .svg
      // .scale(0.001)
      // .attr({ opacity: 1 })
      // .animate({ duration: this.config.animationSpeed })
      // .transform({ scale: 1 })


      this.animation = this
        .svg
        .get(0)
        // .attr({ opacity: 0 })
        .animate({ duration: this.config.animationSpeed })
        .plot(`M${this.finalFromX},${this.finalFromY} L${this.finalToX},${this.finalToY}`)
        .after(() => {
          this.animation = null
        })
      // .attr({ opacity: 1 })


      if (this.label) {
        this
          .svg
          .get(1)
          // .attr({ opacity: 0 })
          .animate({ duration: this.config.animationSpeed })
          .center((this.finalFromX + this.finalToX) / 2, (this.finalFromY + this.finalToY) / 2)
          .attr({ opacity: 1 })
      }
    }
  }


  /**
   * Transforms an edge from its visible position to its initial rendered position.
   * @param {Number} X=finalFromX The X position the edge will be translated.
   * @param {Number} Y=finalFromY The Y position the edge will be translated.
   */
  transformToInitialPosition(X = this.finalFromX, Y = this.finalFromY) {
    this
      .svg
      .back()

    this
      .svg
      .get(0)
      .attr({ opacity: 1 })
      .animate({ duration: this.config.animationSpeed })
      .plot(`M${X},${Y} L${X},${Y}`)
      .attr({ opacity: 0 })

    if (this.label) {
      this
        .svg
        .get(1)
        .attr({ opacity: 1 })
        .animate({ duration: this.config.animationSpeed })
        .center(X, Y)
        .attr({ opacity: 0 })
    }
  }
}


export default ThinEdge
