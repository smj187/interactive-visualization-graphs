import BaseLayout from "./BaseLayout"
import ContextualContainer from "./helpers/ContextualContainer"
import GridExpander from "./helpers/GridExpander"
import ContextualRiskConnection from "./helpers/ContextualRiskConnection"
import ContextualContainerConnection from "./helpers/ContextualContainerConnection"
import ContextualLayoutConfiguration from "../configuration/ContextualLayoutConfiguration"
import ContextualassignedConnection from "./helpers/ContextualAssginedConnection"
import { calculateDistance } from "../utils/Calculations"
import BoldEdge from "../edges/BoldEdge"


/**
 * This class calculates and renders the contextual layout. It consists of the following elements
 *  - focusNode: the node on which the layout is constructed on
 *  - parentNodes: the focusNodes' parents
 *  - childNodes: the focusNodes' children
 *  - assignedNode: an external assigned node
 *  - assignedParentNodes: the parent nodes for the assigned node
 *  - assignedChildNodes: the child nodes for the assigned node
 *
 * @category Layouts
 * @param {Object} [customConfig={ }] Overrides default layout configuration properties.
 *                                    Available options: {@link TreeLayoutConfiguration}
 * @param {Object} [customEvents={ }] Overrides event listener configuration properties.
 * @param {Object} [customNodes={ }] Overrides default node representation properties.
 * @param {Object} [customEdges={ }] Overrides default edge representation properties.
 */
class ContextualLayout extends BaseLayout {
  constructor(customConfig = {}, customEventlisteners = [], customNodes = {}, customEdges = {}) {
    super(customNodes, customEdges)


    if (customConfig.focusId === undefined) {
      throw new Error("No Focus element reference id provided")
    }

    this.config = { ...ContextualLayoutConfiguration, ...customConfig }


    // layout specific
    this.focusId = customConfig.focusId
    this.areChildrenExpanded = false
    this.areParentsExpanded = false
    this.areRisksExpanded = false
    this.areAssignedParentExpanded = false
    this.areAssignedChildrenExpanded = false
    this.assignedInfo = null
    this.riskConnection = null
    this.assignedConnection = null
    this.containerConnections = []
    this.containers = []
    this.expanders = []


    // events
    this.events = [
      {
        event: "click",
        modifier: undefined,
        func: "expandOrCollapseGridEvent",
        defaultEvent: true,
      },
      {
        event: "click",
        modifier: undefined,
        func: "traverseInLayoutEvent",
        defaultEvent: true,
      },
    ]
    customEventlisteners.forEach((event) => {
      this.registerEventListener(event.event, event.modifier, event.func)
    })
  }


  /**
   * Event method which either loads more data or removes existing data form a group of nodes.
   * @async
   * @param {Object} [opts={ }] An object containing additional information.
   * @param {Number} [opts.isParentOperation=false] Determines where nodes originate from.
   * @param {Number} [opts.type=parent] Determines which container loads more data.
   */
  async expandOrCollapseGridEvent({ isParentOperation = false, type = "parent" }) {
    // node references
    const { childNodes } = this
    const { parentNodes } = this
    const { riskNodes } = this
    const { assignedChildNodes } = this
    const { assignedParentNodes } = this


    const addOrRemoveNodes = (upperLimit, currentLimit, offset, nodes) => {
      // add new nodes
      if (upperLimit >= currentLimit) {
        const notRenderedNodes = nodes.filter((n) => n.isRendered() === false)

        // create new SVGs
        notRenderedNodes.forEach((node) => {
          node.setInitialX(node.getFinalX())
          node.setInitialY(node.getFinalY() + offset)
          node.renderAsMin({})
        })
      } else {
        // else, remove nodes again
        const nodesToHide = nodes.filter((c, i) => i >= upperLimit)

        // remove SVGs
        nodesToHide.forEach((node) => {
          node.removeSVG({ isContextualNode: true, isContextualParentOperation: isParentOperation })
        })
      }
    }

    const updateContainer = (containerName, opts) => {
      const container = this.containers.find((c) => c.type === containerName)
      container.update(opts)
    }


    if (type === "parent") {
      // determines how far down nodes animate in
      const offset = isParentOperation ? -50 : 50

      // limitations
      const upperLimit = this.config.parentContainerNodeLimit
      const currentLimit = parentNodes.filter((n) => n.isRendered() === true).length
      addOrRemoveNodes(upperLimit, currentLimit, offset, parentNodes)
      updateContainer("parent", { areParentsExpanded: this.areParentsExpanded })



    }

    if (type === "child") {
      // determines how far down nodes animate in
      const offset = isParentOperation ? -50 : 50


      // limitations
      const upperLimit = this.config.childContainerNodeLimit
      const currentLimit = childNodes.filter((n) => n.isRendered() === true).length

      addOrRemoveNodes(upperLimit, currentLimit, offset, childNodes)
      updateContainer("child", { areChildrenExpanded: this.areChildrenExpanded })
    }

    if (type === "risk") {
      // determines how far down nodes animate in
      const offset = isParentOperation ? -50 : 50

      // limitations
      const upperLimit = this.config.riskContainerNodeLimit
      const currentLimit = riskNodes.filter((n) => n.isRendered() === true).length


      addOrRemoveNodes(upperLimit, currentLimit, offset, riskNodes)
      updateContainer("risk", { areRisksExpanded: this.areRisksExpanded })
    }

    if (type === "assignedChild") {
      // determines how far down nodes animate in
      const offset = isParentOperation ? -50 : 50

      // limitations
      const upperLimit = this.config.assignedChildContainerNodeLimit
      const currentLimit = assignedChildNodes.filter((n) => n.isRendered() === true).length
      addOrRemoveNodes(upperLimit, currentLimit, offset, assignedChildNodes)
      updateContainer("assignedChild", { areAssignedChildrenExpanded: this.areAssignedChildrenExpanded })
    }

    if (type === "assignedParent") {
      // determines how far down nodes animate in
      const offset = isParentOperation ? -50 : 50

      // limitations
      const upperLimit = this.config.assignedParentContainerNodeLimit
      const currentLimit = assignedParentNodes.filter((n) => n.isRendered() === true).length
      addOrRemoveNodes(upperLimit, currentLimit, offset, assignedParentNodes)
      updateContainer("assignedParent", { areAssignedParentExpanded: this.areAssignedParentExpanded })
    }
  }


  /**
   * Event method which either loads more data or removes existing data.
   * @async
   * @param {Object} [opts={ }] An object containing additional information.
   * @param {Number} [opts.node=null] The clicked node.
   * @param {Number} [opts.isParentOperation=false] Determines where nodes originate from.
   */
  async traverseInLayoutEvent({ node = null, isParentOperation = false }) {
    if (node.id === this.focusId) {
      return
    }

    await this.updateContextualDataAsync({ clickedNode: node, isParentOperation })
  }


  /**
   * Calculates the contextual layout.
   *
   * @param {Object} [opts={ }] An object containing additional information.
   * @param {Number} [opts.offset=0] Determines the space the layout has to shift in order to avoid overlapping layouts.
   * @param {Number} [opts.isReRender=false] Determines if the layout is rerenderd.
   */
  calculateLayout({ offset = 0, isReRender = false }) {
    this.currentOffset = offset


    const { focusNode } = this
    const { assignedNode } = this
    const { childNodes } = this
    const { parentNodes } = this
    const { riskNodes } = this
    const { assignedChildNodes } = this
    const { assignedParentNodes } = this


    // calculate focus position
    const calculateFocusPosition = () => {
      // the focus element area takes 3/2 of available space


      const x = offset + this.config.focusXShift + this.config.translateX
      const y = (this.config.layoutHeight / 2) + this.config.translateY

      focusNode.setInitialX(x)
      focusNode.setInitialY(y + 50)

      focusNode.setFinalX(x)
      focusNode.setFinalY(y)

      focusNode.setNodeSize("max")
    }

    // caculate assigned node position
    const calculateAssignedPosition = () => {
      // skip this method if no assigned information is provided
      if (this.assignedInfo === null) {
        return
      }

      const x = focusNode.getFinalX() + this.config.focusAssignedDistance
      const y = (this.config.layoutHeight / 2) + this.config.translateY

      assignedNode.setInitialX(x)
      assignedNode.setInitialY(y + 50)

      assignedNode.setFinalX(x)
      assignedNode.setFinalY(y)
      assignedNode.setNodeSize("min")
    }


    // calculate the connection between the focus and assigned nodes
    const calculateAssignedConnection = () => {
      // skip this method if no assigned information is provided
      if (this.assignedInfo === null) {
        return
      }

      const assignedConnection = new ContextualassignedConnection(this.canvas, focusNode, assignedNode, this.config)
      assignedConnection.setLayoutId(this.layoutIdentifier)
      this.assignedConnection = assignedConnection
    }


    // calculate node positions
    const calculateNodePositions = (nodes, type) => {
      // skip this method if no assigned information is provided
      if (nodes.length === 0) {
        return
      }

      // only show a restricted amount of nodes
      let limitedNodes
      let cols
      let containerLimitation
      let showExpander


      if (type === "child") {
        limitedNodes = nodes.slice(0, this.config.childContainerNodeLimit)
        cols = this.config.childContainerColumns
        containerLimitation = this.config.childContainerColumns
        showExpander = this.config.showChildExpander
      }

      if (type === "parent") {
        limitedNodes = nodes.slice(0, this.config.parentContainerNodeLimit)
        cols = this.config.parentContainerColumns
        containerLimitation = this.config.parentContainerColumns
        showExpander = this.config.showParentExpander
      }

      if (type === "risk") {
        limitedNodes = nodes.slice(0, this.config.riskContainerNodeLimit)
        cols = this.config.riskContainerColumns
        containerLimitation = this.config.riskContainerColumns
        showExpander = this.config.showRiskExpander
      }

      if (type === "assignedParent") {
        limitedNodes = nodes.slice(0, this.config.assignedParentContainerNodeLimit)
        cols = this.config.assignedParentContainerColumns
        containerLimitation = this.config.assignedParentContainerColumns
        showExpander = this.config.showAssignedParentExpander

        if (this.config.showAssignedParentNodes === false) {
          return
        }
      }

      if (type === "assignedChild") {
        limitedNodes = nodes.slice(0, this.config.assignedChildContainerNodeLimit)
        cols = this.config.assignedChildContainerColumns
        containerLimitation = this.config.assignedChildContainerColumns
        showExpander = this.config.showAssignedChildExpander

        if (this.config.showAssignedChildNodes === false) {
          return
        }
      }


      let nodeIndex = 0
      const nodeCols = []
      const nodeRows = []


      // divide nodes into sets of rows
      for (let i = 0; i < nodes.length; i += 1) {
        const row = []
        for (let j = 0; j < cols; j += 1) {
          const node = nodes[nodeIndex]
          if (node !== undefined) {
            row.push(node)
            nodeIndex += 1
          }
        }
        if (row.length) {
          nodeRows.push(row)
        }
      }

      // divide nodes into sets of columns
      nodeIndex = 0
      for (let i = 0; i < cols; i += 1) {
        nodeCols.push([])
      }
      nodes.forEach((node, i) => {
        const col = nodeCols[i % cols]
        col.push(node)
      })


      // calculate initial position
      nodes.forEach((node) => {
        const w = node.getMinWidth()
        const h = node.getMinHeight()


        let x
        let y

        if (type === "child") {
          x = this.config.contextualNodeSpacing + w / 2
          y = this.config.contextualNodeSpacing
            + focusNode.getFinalY()
            + focusNode.getMaxHeight() / 2
            + this.config.childrenFocusDistance
            + this.config.contextualNodeSpacing * 2
            + h / 2
        }

        if (type === "parent") {
          x = this.config.contextualNodeSpacing + node.getMinWidth() / 2
          y = focusNode.getFinalY()
            - focusNode.getMaxHeight() / 2
            - this.config.parentFocusDistance
            - this.config.contextualNodeSpacing * 3
            - node.getMinHeight() / 2
        }

        if (type === "risk") {
          x = this.config.contextualNodeSpacing + w / 2
          y = this.config.contextualNodeSpacing
            + focusNode.getFinalY()
            + this.config.riskConnectionDistance
            + this.config.contextualNodeSpacing
            + h / 2
        }

        if (type === "assignedParent") {
          x = assignedNode.getFinalX()
          y = assignedNode.getFinalY()
            - this.config.assignedParentConnectionDistance
        }

        if (type === "assignedChild") {
          x = assignedNode.getFinalX()
          y = assignedNode.getFinalY()
            + this.config.assignedParentConnectionDistance
        }


        node.setFinalX(x)
        node.setFinalY(y)
      })


      // find row spacing
      let rowSpacing = 0
      nodeRows.forEach((row) => {
        const h = row.map((n) => n.getMinHeight())
        const max = Math.max(...h)
        rowSpacing = Math.max(rowSpacing, max)
      })

      // calculate y positions
      nodeRows.forEach((row, i) => {
        if (i >= 1) {
          row.forEach((n) => {
            const h = (rowSpacing + this.config.contextualNodeSpacing) * i

            if (type === "child") {
              n.setFinalY(n.getFinalY() + h)
            }
            if (type === "parent") {
              n.setFinalY(n.getFinalY() - h)
            }
            if (type === "risk") {
              n.setFinalY(n.getFinalY() + h)
            }
            if (type === "assignedParent") {
              n.setFinalY(n.getFinalY() - h)
            }
            if (type === "assignedChild") {
              n.setFinalY(n.getFinalY() + h)
            }
          })
        }
      })


      // find col spacing
      let columnSpacing = 0
      nodeRows.forEach((row) => {
        const w = row.map((n) => n.getMinWidth())
        const max = Math.max(...w)
        columnSpacing = Math.max(columnSpacing, max)
      })

      // calculate x positions
      nodeCols.forEach((column, i) => {
        if (i >= 1) {
          column.forEach((n) => {
            const w = (columnSpacing + this.config.contextualNodeSpacing) * i
            n.setFinalX(n.getFinalX() + w)
          })
        }
      })


      // calculate container
      // top left
      let x0 = Math.min(...nodes.map((n) => {
        const w = n.getMinWidth()
        return n.getFinalX() - w / 2 - this.config.contextualNodeSpacing / 1
      }))

      let y0 = Math.min(...nodes.map((n) => {
        const h = n.getMinHeight()
        return n.getFinalY() - h / 2 - this.config.contextualNodeSpacing / 1
      }))


      // top right
      let x1 = Math.max(...nodes.map((n) => {
        const w = n.getMinWidth()
        return n.getFinalX() + w / 2 + this.config.contextualNodeSpacing / 1
      }))

      let y1 = y0


      // adjust X position
      let adjustment = focusNode.getFinalX() - (x0 + x1) / 2
      if (type === "assignedChild" || type === "assignedParent") {
        adjustment = assignedNode.getFinalX() - (x0 + x1) / 2
      }
      if (type === "risk") {
        adjustment += this.config.riskFocusDistance
      }
      nodes.forEach((node) => {
        node.setFinalX(node.getFinalX() + adjustment)
      })


      // absolute bottom right
      let x2 = x1
      const y2 = Math.max(...nodes.map((n) => {
        const h = n.getMinHeight()
        return n.getFinalY() + h / 2 + this.config.contextualNodeSpacing / 1
      }))

      // absolute bottom left
      let x3 = x0
      const y3 = y2

      let maxcx = (x0 + x2) / 2
      const maxcy = (y0 + y2) / 2


      // minimal button left
      let x4 = x0
      const y4 = Math.max(...limitedNodes.map((n) => {
        const h = n.getMinHeight()
        return n.getFinalY() + h / 2 + this.config.contextualNodeSpacing / 1
      }))

      // minimal button right
      let x5 = x1
      const y5 = y4

      let mincx = (x0 + x5) / 2
      let mincy = (y0 + y5) / 2


      // the same, but in reverse for the parent container
      let x6 = x0
      const y6 = Math.min(...limitedNodes.map((n) => {
        const h = n.getMinHeight()
        return n.getFinalY() - h / 2 - this.config.contextualNodeSpacing / 1
      }))

      let x7 = x1
      const y7 = y6


      x0 += adjustment
      x1 += adjustment
      x2 += adjustment
      x3 += adjustment
      x4 += adjustment
      x5 += adjustment
      x6 += adjustment
      x7 += adjustment
      maxcx += adjustment
      mincx += adjustment


      const xx0 = x0
      const yy0 = y0
      if (type === "parent" || type === "assignedParent") {
        x0 = x6
        y0 = y6

        x1 = x7
        y1 = y7

        mincx = (x6 + x5) / 2
        mincy = (y6 + y5) / 2
      }

      const maxHeight = (type === "child" || type === "risk" || type === "assignedChild")
        ? calculateDistance(x1, y1, x2, y2)
        : calculateDistance(xx0, yy0, x4, y4)


      // set initial render position
      nodes.forEach((node) => {
        if (type === "assignedChild" || type === "assignedParent") {
          node.setInitialX(assignedNode.getFinalX())
          node.setInitialY(assignedNode.getFinalY())
        } else {
          node.setInitialX(focusNode.getFinalX())
          node.setInitialY(focusNode.getFinalY())
        }


        node.setNodeSize("min")
      })


      // calculate container
      if (limitedNodes.length <= containerLimitation && (type !== "assignedChild" && type !== "assignedParent")) {
        return
      }


      // we only want the limited amount of nodes to calculate the container info
      const containerInfo = {
        type,
        maxcx,
        maxcy,
        mincx,
        mincy,
        minHeight: calculateDistance(x0, y0, x4, y4),
        maxHeight,
        width: calculateDistance(x0, y0, x1, y1),
      }

      let container
      if (type === "assignedChild" || type === "assignedParent") {
        container = new ContextualContainer(this.canvas, assignedNode, containerInfo, this.config)
      } else {
        container = new ContextualContainer(this.canvas, focusNode, containerInfo, this.config)
      }

      container.setLayoutId(this.layoutIdentifier)
      container.setType(type)
      this.containers.push(container)


      // calculate expander
      if (showExpander === false) {
        return
      }

      // calculate expander
      if (nodes.length > limitedNodes.length) {
        const expander = new GridExpander(this.canvas, this.config)
        expander.setLayoutId(this.layoutIdentifier)
        expander.setType(type)

        if (type === "child") {
          expander.setIsLayoutExpanded(this.areChildrenExpanded)
        }
        if (type === "parent") {
          expander.setIsLayoutExpanded(this.areParentsExpanded)
        }
        if (type === "risk") {
          expander.setIsLayoutExpanded(this.areRisksExpanded)
        }

        if (type === "assignedParent") {
          expander.setIsLayoutExpanded(this.areAssignedParentExpanded)
        }

        if (type === "assignedChild") {
          expander.setIsLayoutExpanded(this.areAssignedChildrenExpanded)
        }

        // expander on top
        if (type === "risk" || type === "child" || type === "assignedChild") {
          const ex = x0 + this.config.contextualNodeSpacing
          const ey = y0 - this.config.contextualNodeSpacing * 1.5

          expander.setFinalX(ex)
          expander.setFinalY(ey)
        } else {
          const ex = x0 + this.config.contextualNodeSpacing
          const ey = y3 + this.config.contextualNodeSpacing * 1.5

          expander.setFinalX(ex)
          expander.setFinalY(ey)
        }

        this.expanders.push(expander)
      }
    }


    // calculate the small connection between risk nodes and the assigned connection arrow
    const calculateRiskConnection = () => {
      if (this.assignedInfo === null || riskNodes.length === 0) {
        return
      }
      const contextualRiskConnection = new ContextualRiskConnection(
        this.canvas,
        riskNodes,
        this.containers.find((c) => c.type === "risk"),
        focusNode,
        assignedNode,
        this.assignedConnection,
        this.config,
      )
      contextualRiskConnection.setLayoutId(this.layoutIdentifier)
      this.riskConnection = contextualRiskConnection
    }


    // calculate edges
    const calculateEdges = () => {
      const parentContainer = this.containers.find((c) => c.type === "parent") || null
      const childContainer = this.containers.find((c) => c.type === "child") || null


      // calculate container edges
      if (parentContainer !== null) {
        const containerConnection = new ContextualContainerConnection(this.canvas, focusNode, parentContainer, parentNodes, this.config)
        containerConnection.setLayoutId(this.layoutIdentifier)
        containerConnection.setType("parent")
        this.containerConnections.push(containerConnection)
      }

      if (childContainer !== null) {
        const containerConnection = new ContextualContainerConnection(this.canvas, focusNode, childContainer, childNodes, this.config)
        containerConnection.setLayoutId(this.layoutIdentifier)
        containerConnection.setType("child")
        this.containerConnections.push(containerConnection)
      }

      // calculate assigned node connections
      if (assignedChildNodes.length > 0) {
        const assignedChildContainer = this.containers.find((c) => c.type === "assignedChild")
        const containerConnection = new ContextualContainerConnection(this.canvas, assignedNode, assignedChildContainer, assignedChildNodes, this.config)
        containerConnection.setLayoutId(this.layoutIdentifier)
        containerConnection.setType("assignedChild")
        this.containerConnections.push(containerConnection)
      }
      if (assignedParentNodes.length > 0) {
        const assignedChildContainer = this.containers.find((c) => c.type === "assignedParent")
        const containerConnection = new ContextualContainerConnection(this.canvas, assignedNode, assignedChildContainer, assignedParentNodes, this.config)
        containerConnection.setLayoutId(this.layoutIdentifier)
        containerConnection.setType("assignedParent")
        this.containerConnections.push(containerConnection)
      }


      // calculate parent edges
      const parentEdges = this.edges.filter((e) => e.fromNode.id === focusNode.id)
      const childEdges = this.edges.filter((e) => e.toNode.id === focusNode.id)
      if (parentContainer === null) {
        parentEdges.forEach((edge) => {
          // update fromNode X position only for bold edges
          edge.calculateEdge({ isContextualParent: true, isReRender })
        })
      } else {
        this.edges = this.edges.filter((e) => e.fromNode.id !== focusNode.id)
      }


      // calculate child edges
      if (childContainer === null) {
        childEdges.forEach((edge) => {
          // update toNode X position only for bold edges


          edge.calculateEdge({ isContextualChild: true, isReRender })
        })
      } else {
        this.edges = this.edges.filter((e) => e.toNode.id !== focusNode.id)
      }


      // calculate assigned edges
    }


    // calculate the layout dimensions
    const calculateLayoutInfo = () => {
      // calculate the layout info by gathering information about three points
      const x0 = Math.min(...this.nodes.map((n) => {
        const w = n.getNodeSize() === "min" ? n.config.minWidth : n.config.maxWidth
        return n.getFinalX() - w
      }))
      const y0 = 0

      const x1 = Math.max(...this.nodes.map((n) => {
        const w = n.getNodeSize() === "min" ? n.config.minWidth : n.config.maxWidth
        return n.getFinalX() + w
      }))
      const y1 = 0

      const x2 = x1
      const y2 = Math.max(...this.nodes.map((n) => {
        const h = n.getNodeSize() === "min" ? n.config.minHeight : n.config.maxHeight
        return n.getFinalY() + h
      }))


      // create the layout info object
      this.layoutInfo = {
        x: x0,
        y: y0,
        cx: (x0 + x2) / 2,
        cy: (y0 + y2) / 2,
        w: calculateDistance(x0, y0, x1, y1),
        h: calculateDistance(x1, y1, x2, y2),
      }

      this.canvas.circle(5).center(x0 + 30, 10).fill("red")
      this.canvas.circle(5).center(x0 + this.layoutInfo.w, 10).fill("red")
    }


    calculateFocusPosition()
    calculateAssignedPosition()
    calculateAssignedConnection()

    calculateNodePositions(childNodes, "child")
    calculateNodePositions(parentNodes, "parent")
    calculateNodePositions(riskNodes, "risk")

    calculateNodePositions(assignedParentNodes, "assignedParent")
    calculateNodePositions(assignedChildNodes, "assignedChild")

    calculateRiskConnection()

    calculateEdges()


    calculateLayoutInfo()


    return this.layoutInfo
  }


  /**
   * Renders the contextual layout.
   * @param {Object} [opts={ }] An object containing additional information.
   * @param {Boolean} [opts.isReRender=false] Determines if the layout is rerenderd.
   * @param {Boolean} [opts.isParentOperation=false] Determines where nodes originate from.
   * @param {Boolean} [opts.oldFocusNode=false] A reference to the old focus node.
   */
  renderLayout({
    isReRender = false, isParentOperation = false, oldFocusNode = null, updateSVGs = false, prevLayoutWidth = 0,
  }) {
    const { focusNode } = this
    const { assignedNode } = this
    const { childNodes } = this
    const { parentNodes } = this
    const { riskNodes } = this
    const { assignedChildNodes } = this
    const { assignedParentNodes } = this

    const X = focusNode.getFinalX()
    const Y = focusNode.getFinalY()


    // renders all node containers
    const renderContainers = () => {
      this.containers.forEach((container) => {
        container.render({ isParentOperation })
      })
    }


    // renders an expander for each container (but only if required)
    const renderExpanders = () => {
      this.expanders.forEach((expander) => {
        const assignedNode = this.getContextualAssignedNode()

        // assigned nodes come from a different origin
        if (expander.type === "assignedParent" || expander.type === "assignedChild") {
          expander.render({ cx: assignedNode.getFinalX(), cy: assignedNode.getFinalY() })
        } else {
          expander.render({ cx: X, cy: Y })
        }

        // find expander events
        const events = this.events.filter((e) => e.func === "expandOrCollapseGridEvent")
        const eventStr = [...new Set(events.map((e) => e.event))].toString().split(",")

        // attach events to SVG object
        expander.svg.on(eventStr, (e) => {
          const { type } = e
          let modifier
          if (e.altKey === true) {
            modifier = "altKey"
          } else if (e.ctrlKey === true) {
            modifier = "ctrlKey"
          } else if (e.shiftKey === true) {
            modifier = "shiftKey"
          }
          // add provided events
          events.forEach((myevent) => {
            if (myevent.event === type && myevent.modifier === modifier) {
              if (expander.type === "child") {
                // change the current expand state
                this.areChildrenExpanded = !this.areChildrenExpanded

                // update the expanders text
                if (this.areChildrenExpanded === true) {
                  expander.changeToShowMoreText()
                } else {
                  expander.changeToHideMoreText()
                }
              }

              if (expander.type === "parent") {
                // change the current expand state
                this.areParentsExpanded = !this.areParentsExpanded

                // update the expanders text
                if (this.areParentsExpanded === true) {
                  expander.changeToShowMoreText()
                } else {
                  expander.changeToHideMoreText()
                }
              }


              if (expander.type === "risk") {
                // change the current expand state
                this.areRisksExpanded = !this.areRisksExpanded

                // update the expanders text
                if (this.areRisksExpanded === true) {
                  expander.changeToShowMoreText()
                } else {
                  expander.changeToHideMoreText()
                }
              }

              if (expander.type === "assignedParent") {
                // change the current expand state
                this.areAssignedParentExpanded = !this.areAssignedParentExpanded

                // update the expanders text
                if (this.areAssignedParentExpanded === true) {
                  expander.changeToShowMoreText()
                } else {
                  expander.changeToHideMoreText()
                }
              }

              if (expander.type === "assignedChild") {
                // change the current expand state
                this.areAssignedChildrenExpanded = !this.areAssignedChildrenExpanded

                // update the expanders text
                if (this.areAssignedChildrenExpanded === true) {
                  expander.changeToShowMoreText()
                } else {
                  expander.changeToHideMoreText()
                }
              }

              this.expandOrCollapseGridEvent({ isParentOperation, type: expander.type })
            }
          })
        })
      })
    }


    // renders the connection between the assigned node and the focus node
    const renderConnections = () => {
      if (this.assignedConnection) {
        this.assignedConnection.render({ isParentOperation })
      }

      if (this.riskConnection) {
        this.riskConnection.render({ isParentOperation: false })
      }
    }


    // renders all required nodes
    const renderNodes = () => {
      // render the main assigned node
      if (assignedNode !== null) {
        assignedNode.renderAsMin({})
      }

      // render its parents and children
      assignedChildNodes.forEach((child, i) => {
        if (i < this.config.assignedChildContainerNodeLimit) {
          child.renderAsMin({})
        }
      })

      assignedParentNodes.forEach((parent, i) => {
        if (i < this.config.assignedParentContainerNodeLimit) {
          parent.renderAsMin({})
        }
      })


      // render child nodes or transform a clicked child into the new focus node
      childNodes.forEach((child, i) => {
        if (i < this.config.childContainerNodeLimit) {
          if (child.isRendered() === false) {
            child.renderAsMin({})
          } else {
            child.transformToMin({ IX: focusNode.getFinalX(), IY: focusNode.getFinalY() })
          }
        }
      })

      // render parent nodes or transform a clicked parent into the new focus node
      parentNodes.forEach((parent, i) => {
        if (i < this.config.parentContainerNodeLimit) {
          if (parent.isRendered() === false) {
            parent.renderAsMin({})
          } else {
            parent.transformToMin({ IX: focusNode.getFinalX(), IY: focusNode.getFinalY() })
          }
        }
      })


      // render risks
      riskNodes.forEach((risk, i) => {
        if (i < this.config.riskContainerNodeLimit) {
          risk.renderAsMin({})
        }
      })


      // attach traversal events to each parent and child node
      const attachEvents = (nodes, isParentOperation) => {
        nodes.forEach((node) => {
          if (node.isRendered() === true) {
            // find provided events
            const events = this.events.filter((e) => e.func === "traverseInLayoutEvent")
            const eventStr = [...new Set(events.map((e) => e.event))].toString().split(",")

            // attach events to SVG object
            node.svg.on(eventStr, (e) => {
              const { type } = e
              let modifier
              if (e.altKey === true) {
                modifier = "altKey"
              } else if (e.ctrlKey === true) {
                modifier = "ctrlKey"
              } else if (e.shiftKey === true) {
                modifier = "shiftKey"
              }
              // add provided events
              events.forEach((myevent) => {
                if (myevent.event === type && myevent.modifier === modifier) {
                  this.traverseInLayoutEvent({ node, isParentOperation })
                }
              })
            })
          }
        })
      }

      attachEvents(parentNodes, true)
      attachEvents(childNodes, false)


      if (focusNode.isRendered() === false) {
        focusNode.renderAsMax({})
      } else {
        focusNode.transformToMax({})
      }


      // FIXME: bug: sometimes the focus node gets removed
      if (isReRender === true && oldFocusNode !== null) {
        // remove none-needed nodes
        const relevantNodes = [...parentNodes, ...childNodes]
        if (relevantNodes.find((n) => n.id === oldFocusNode.id) === undefined) {
          console.log("remove focus", oldFocusNode)
          oldFocusNode.removeSVG({})
        }
      }
    }


    // renders required edges
    const renderEdges = () => {
      this.edges.forEach((edge) => {
        const isContextualBoldEdge = edge instanceof BoldEdge
        if (edge.isHidden === false) {
          if (edge.isRendered() === false) edge.render({ X, Y, isContextualBoldEdge })
        }
      })
    }


    // update the container connections
    const renderContainerConnections = () => {
      this.containerConnections.forEach((con) => {
        con.render({ isParentOperation })
      })
    }


    // rendering

    renderContainers()
    renderExpanders()
    renderConnections()
    renderNodes()
    renderContainerConnections()
    renderEdges()
  }


  /**
   * Returns the currently active focus node.
   * @return {BaseNode} The focus node.
   */
  getContextualFocusNode() {
    return this.nodes.find((n) => n.getId() === this.focusId)
  }


  /**
   * Returns the currently active assigned node.
   * @returns {BaseNode|null} The assigned node.
   */
  getContextualAssignedNode() {
    if (this.assignedInfo !== null) {
      return this.nodes.find((n) => n.getId() === this.assignedInfo.assigned)
    }
    return null
  }


  /**
   * Returns all currently active focus child node.
   * @param {BaseNode} focusNode The current focus node.
   * @returns {Array.<BaseNode>} The child nodes.
   */
  getContextualChildNodes(focusNode) {
    return this.nodes.filter((n) => focusNode.childrenIds.includes(n.id))
  }


  /**
   * Returns an array containing parents for the focus node.
   * @param {BaseNode} focusNode The current focus node.
   * @returns {Array.<BaseNode>|[]} The parent nodes.
   */
  getContextualParentNodes(focusNode) {
    const parentIds = focusNode.parentId !== null
      ? focusNode.parentId instanceof Array ? focusNode.parentId : [focusNode.parentId]
      : []
    return this.nodes.filter((n) => parentIds.includes(n.id))
  }


  /**
   * Returns an array of risks between the focus and assigned node.
   * @param {BaseNode} focusNode The current focus node.
   * @returns {Array.<BaseNode>|[]} The risk nodes.
   */
  getContextualRiskNodes() {
    if (this.assignedInfo !== null) {
      return this.nodes.filter((n) => this.assignedInfo.risks.includes(n.id))
    }
    return []
  }


  /**
   * Returns all parents the assigned node has.
   * @param {BaseNode} focusNode The current focus node.
   * @returns {Array.<BaseNode>|[]} The parent nodes.
   */
  getAssignedParentNodes(assignedNode) {
    if (this.assignedInfo !== null) {
      const pIds = assignedNode.parentId !== null ? assignedNode.parentId instanceof Array ? assignedNode.parentId : [assignedNode.parentId] : []
      return this.nodes.filter((n) => pIds.includes(n.id))
    }
    return []
  }


  /**
   * Returns all children the assigned node has.
   * @param {BaseNode} focusNode The current focus node.
   * @returns {Array.<BaseNode>|[]} The children nodes.
   */
  getAssignedChildNodes(assignedNode) {
    if (this.assignedInfo !== null) {
      return this.nodes.filter((n) => assignedNode.childrenIds.includes(n.id))
    }
    return []
  }
}


export default ContextualLayout
