import BaseLayout from "./BaseLayout"
import TreeLeaf from "./helpers/TreeLeaf"
import TreeLayoutConfiguration from "../configuration/TreeLayoutConfiguration"
import { buildTreeFromNodes } from "../utils/TreeConstruction"
import { calculateDistance } from "../utils/Calculations"


/**
 * This class depicts given data within a tree layout. The algorithm to achieve this visualization is based on the
 * Reingold-Tilford Algorithm. The main calculation process is based on the initial work found in an article, but
 * extended in such a way that it fits the needs for the defined scope of this project.
 *
 * @category Layouts
 * @param {Object} [customConfig={ }] Overrides default layout configuration properties.
 *                                    Available options: {@link TreeLayoutConfiguration}
 * @param {Object} [customEvents={ }] Overrides event listener configuration properties.
 * @param {Object} [customNodes={ }] Overrides default node representation properties.
 * @param {Object} [customEdges={ }] Overrides default edge representation properties.
 *
 * @see https://rachel53461.wordpress.com/2014/04/20/algorithm-for-drawing-trees/
 */
class TreeLayout extends BaseLayout {
  constructor(customConfig = {}, customEventlisteners = [], customNodes = {}, customEdges = {}) {
    super(customNodes, customEdges)


    if (customConfig.rootId === undefined) {
      throw new Error("No root element reference id provided")
    }

    this.config = { ...TreeLayoutConfiguration, ...customConfig }


    // layout specific
    this.rootId = customConfig.rootId
    this.renderDepth = customConfig.renderDepth || 0
    this.leafs = []

    // events
    this.events = [
      {
        event: "click",
        modifier: undefined,
        func: "expandOrCollapseEvent",
        defaultEvent: true,
      },
    ]
    customEventlisteners.forEach((event) => {
      this.registerEventListener(event.event, event.modifier, event.func)
    })
  }


  /**
   * Event method which either loads more data or removes existing data.
   * @param {BaseNode} node The node that recieved the event.
   * @async
   */
  async expandOrCollapseDataAsyncEvent(node) {
    // remove clicked leaf indication
    const leaf = this.leafs.find((l) => l.id === node.id)
    if (leaf !== undefined) {
      leaf.removeSVG()
      this.leafs = this.leafs.filter((l) => l.id !== node.id)
    }

    // update the underlying data structure
    await this.updateTreeDataAsync({ clickedNode: node })
  }


  /**
   * Calculates the tree layout based on an underlying algorithm.
   *
   * @param {Object} [opts={ }] An object containing additional information.
   * @param {Number} [opts.offset=0] Determines the space the layout has to shift in order to avoid overlapping layouts.
   * @param {Boolean} [opts.isReRender=false] Determines if the layout is rerenderd.
   */
  calculateLayout({ offset = 0, isReRender = false }) {
    const isVertical = this.config.orientation === "vertical"
    this.currentOffset = offset


    // initialize the tree with required information
    const initializeNodes = (node, parent = null, prevSibling = null, depth = 0) => {
      // set required information
      node.setDepth(depth)
      node.setParent(parent)
      node.setPrevSibling(prevSibling)


      // set intial X or Y value
      if (isVertical) {
        node.setFinalY(depth + this.config.translateY)
      } else {
        node.setFinalX(depth + this.config.translateX)
      }


      // set an empty array of children, if they do not already exist
      if (node.getChildren() === undefined) {
        node.setChildren([])
      }


      node.getChildren().forEach((child, i) => {
        // the previouse node to the left or null
        const prevNode = i >= 1 ? node.getChildren()[i - 1] : null
        initializeNodes(child, node, prevNode, depth + 1)
      })
    }


    // start calculating the X and Y positions recursively
    const calculateXYPositions = (node) => {
      node.getChildren().forEach((child) => {
        calculateXYPositions(child)
      })


      // get the node sizes based on the current layout rendering size
      let w = this.config.renderingSize === "max" ? node.getMaxWidth() : node.getMinWidth()
      let h = this.config.renderingSize === "max" ? node.getMaxHeight() : node.getMinHeight()
      w += this.config.hSpacing
      h += this.config.vSpacing


      // calculate the Y position for the vertical tree
      if (isVertical) {
        node.setFinalY(node.getDepth() * h)

        // if node has no children
        if (node.getChildren().length === 0) {
          // set x to prev siblings x, or 0 for first node in row
          if (!node.isLeftMost()) {
            node.setFinalX(node.getPrevSibling().getFinalX() + w)
          } else {
            node.setFinalX(0)
          }
        } else if (node.getChildren().length === 1) {
          if (node.isLeftMost()) {
            node.setFinalX(node.getChildren()[0].getFinalX())
          } else {
            node.setFinalX(node.getPrevSibling().getFinalX() + w)
            node.setModifier(node.getFinalX() - node.getChildren()[0].getFinalX())
          }
        } else { // center node on 2+ nodes
          const left = node.getLeftMostChild()
          const right = node.getRightMostChild()
          const mid = (left.getFinalX() + right.getFinalX()) / 2

          if (node.isLeftMost()) {
            node.setFinalX(mid)
          } else {
            node.setFinalX(node.getPrevSibling().getFinalX() + w)
            node.setModifier(node.getFinalX() - mid)
          }
        }
      } else {
        node.setFinalX(node.getDepth() * w)

        // if node has no children
        if (node.getChildren().length === 0) {
          // set y to prev siblings y, or 0 for first node in col
          if (!node.isLeftMost()) {
            node.setFinalY(node.getPrevSibling().getFinalY() + h)
          } else {
            node.setFinalY(0)
          }
        } else if (node.getChildren().length === 1) {
          if (node.isLeftMost()) {
            node.setFinalY(node.getChildren()[0].getFinalY())
          } else {
            node.setFinalY(node.getPrevSibling().getFinalY() + h)
            node.setModifier(node.getFinalY() - node.getChildren()[0].getFinalY())
          }
        } else {
          // center node on 2+ nodes
          const leftNode = node.getLeftMostChild()
          const rightNode = node.getRightMostChild()
          const mid = (leftNode.getFinalY() + rightNode.getFinalY()) / 2

          if (node.isLeftMost()) {
            node.setFinalY(mid)
          } else {
            node.setFinalY(node.getPrevSibling().getFinalY() + h)
            node.setModifier(node.getFinalY() - mid)
          }
        }
      }
    }


    // apply shift modifier recursively
    const calculateModifier = (node, modifier = 0) => {
      if (isVertical) {
        node.setFinalX(node.getFinalX() + modifier)
      } else {
        node.setFinalY(node.getFinalY() + modifier)
      }

      node.getChildren().forEach((child) => {
        calculateModifier(child, node.getModifier() + modifier)
      })
    }


    // fixes any possible node overlapps recursively
    const fixConflicts = (node) => {
      node.getChildren().forEach((child) => {
        fixConflicts(child)
      })

      const getLeftContour = (current) => {
        let value = -Infinity
        const queue = [current]
        while (queue.length !== 0) {
          const deq = queue.shift()
          deq.children.forEach((child) => {
            queue.push(child)
          })
          if (isVertical) {
            value = Math.max(value, deq.getFinalX())
          } else {
            value = Math.max(value, deq.getFinalY())
          }
        }
        return value
      }

      const getRightContour = (current) => {
        let value = Infinity
        const queue = [current]
        while (queue.length !== 0) {
          const deq = queue.shift()
          deq.children.forEach((child) => {
            queue.push(child)
          })
          if (isVertical) {
            value = Math.min(value, deq.getFinalX())
          } else {
            value = Math.min(value, deq.getFinalY())
          }
        }
        return value
      }

      const shiftPosition = (current, value) => {
        const queue = [current]
        while (queue.length !== 0) {
          const deq = queue.shift()
          deq.children.forEach((child) => {
            queue.push(child)
          })

          if (isVertical) {
            deq.setFinalX(deq.getFinalX() + value)
          } else {
            deq.setFinalY(deq.getFinalY() + value)
          }
        }
      }

      const w = this.config.renderingSize === "max" ? node.getMaxWidth() : node.getMinWidth()
      const h = this.config.renderingSize === "max" ? node.getMaxHeight() : node.getMinHeight()

      // the distance to shift a node
      let distance = 0
      if (isVertical) {
        distance = w + this.config.hSpacing
      } else {
        distance = h + this.config.vSpacing
      }

      // fix spacing issues for 2+ child nodes only
      for (let i = 0; i < node.getChildren().length - 1; i += 1) {
        const c1 = getLeftContour(node.getChildren()[i])
        const c2 = getRightContour(node.getChildren()[i + 1])

        if (c1 >= c2) {
          shiftPosition(node.getChildren()[i + 1], c1 - c2 + distance)
        }
      }


      // fix spacing issue for 1 child
      if (node.getChildren().length === 1) {
        // ignore this operation on re-rendering and id its the only node in the given depth
        if (isReRender) {
          const depthNodes = this.nodes.filter((n) => n.getDepth() === node.getDepth() + 1)
          if (depthNodes.length === 1) {
            return
          }
        }


        // find parent nodes
        let nodes = []
        const addParents = (n) => {
          nodes.push(n)
          if (n.getParent() !== null) {
            addParents(n.getParent())
          }
        }


        // find children nodes
        const addChildren = (n) => {
          nodes.push(n)
          n.getChildren().forEach((child) => {
            addChildren(child)
          })
        }

        addParents(node)
        addChildren(node)


        // remove root and dupplicate
        nodes = [...new Set(nodes)]


        // get all siblings and update them
        const siblings = []
        let sibling = node.getNextSibling()
        while (sibling) {
          siblings.push(sibling)
          sibling = sibling.getNextSibling()
        }

        // dont adjust the right most node
        if (siblings.length === 0) {
          return
        }

        siblings.forEach((s) => {
          if (s.getChildren().length === 0) {
            s.setFinalX(s.getFinalX() + w / 2 + this.config.hSpacing / 2)
          }
        })


        nodes.forEach((n) => {
          if (isVertical) {
            n.setFinalX(n.getFinalX() + w / 2 + this.config.hSpacing / 2)
          } else {
            n.setFinalY(n.getFinalY() + h / 2 + this.config.vSpacing / 2)
          }
        })
      }
    }


    // center node between two nodes if it does not have any children but left and right do
    const fixZeroChildProblem = (node) => {
      node.getChildren().forEach((child) => {
        fixZeroChildProblem(child)
      })

      // return if there are no children the the currents node depth is different to the render depth
      if (node.getChildren().length > 0 || node.getDepth() >= this.getRenderDepth()) {
        return
      }


      // find prev and next sibling
      const prevNode = node.prevSibling || null
      const nextNode = node.getNextSibling() || null

      // skip this opteration if one of them is null
      if (nextNode === null || prevNode === null) {
        return
      }


      // update them
      if (isVertical) {
        node.setFinalX((prevNode.getFinalX() + nextNode.getFinalX()) / 2)
      } else {
        node.setFinalY((prevNode.getFinalY() + nextNode.getFinalY()) / 2)
      }
    }


    // fix root and move it to the absolute layout center
    const centerRootNode = (node) => {
      let min = 0
      let max = 0
      const queue = [node]
      while (queue.length) {
        const currentNode = queue.shift()

        if (isVertical) {
          min = Math.min(currentNode.getFinalX(), min)
          max = Math.max(currentNode.getFinalX(), max)
        } else {
          min = Math.min(currentNode.getFinalY(), min)
          max = Math.max(currentNode.getFinalY(), max)
        }

        currentNode.children.forEach((child) => {
          queue.push(child)
        })
      }

      if (isVertical) {
        node.setFinalX((min + max) / 2)
      } else {
        node.setFinalY((min + max) / 2)
      }
    }


    // helper method to tell each edge to calculate its position
    const calculateEdgePositions = (edges) => {
      edges.forEach((edge) => {
        edge.calculateEdge({})
      })
    }


    // inform nodes about incoming and outgoing edges
    const addEdgeReferences = (node) => {
      node.getChildren().forEach((child) => {
        const func = (edge) => edge.getFromNode().getId() === child.getId() && edge.getToNode().getId() === node.getId()
        const e = this.edges.find((edge) => func(edge))

        // add references for incoming edges
        node.addIncomingEdge(e)

        // add references for outgoing edges
        child.addOutgoingEdge(e)

        addEdgeReferences(child)
      })
    }


    // add a visual indication that there is more data available
    const calculateLeafs = (node) => {
      // skip this method if showLeafIndications is set to false
      if (this.config.showLeafIndications === false) {
        return
      }


      const root = node


      // adds leafs to a given node if necessary
      const addLeaf = (currentNode) => {
        const hasNoChildren = currentNode.hasNoChildren()
        const hasInvisibleChildren = currentNode.getInvisibleChildren().length >= this.config.visibleNodeLimit
        const hasChildIds = currentNode.hasChildrenIds()
        if (hasNoChildren && (hasChildIds || hasInvisibleChildren)) {
          if (currentNode.getInvisibleChildren().length > 0) {
            currentNode.setChildrenIds(currentNode.getInvisibleChildren())
          }

          // find existing leaf
          const existing = this.leafs.find((l) => l.id === currentNode.getId())

          // only create a leaf once per node
          if (existing === undefined) {
            const leaf = new TreeLeaf(this.canvas, currentNode, this.config)
            leaf.setLayoutId(this.layoutIdentifier)
            this.leafs.push(leaf)
          }
        }
        currentNode.getChildren().forEach((child) => {
          addLeaf(child, root)
        })
      }


      // remove existing leafs that aren't used anymore
      const removeLeaf = () => {
        const toRemove = []
        const existingNodeIds = this.nodes.map((n) => n.getId())
        this.leafs.forEach((leaf) => {
          if (!existingNodeIds.includes(leaf.getId())) {
            toRemove.push(leaf)
          }
        })

        toRemove.forEach((leaf) => {
          leaf.removeSVG()
        })
        this.leafs = this.leafs.filter((leaf) => !toRemove.map((l) => l.getId()).includes(leaf.getId()))
      }


      addLeaf(node)
      removeLeaf(node)
    }


    // calculate the layout dimensions and move objects that are not on the screen into the screen
    const calculateLayoutInfo = (tree) => {
      const toRender = [tree]
      const rendered = []

      // de-flatten the current tree
      while (toRender.length) {
        const current = toRender.shift()
        const node = this.nodes.find((n) => n.id === current.id)
        rendered.push(node)

        current.children.forEach((child) => {
          toRender.push(child)
        })
      }

      // calculate the vertical adjustment
      const hAdjustment = Math.min(...rendered.map((node) => {
        const w = this.config.renderingSize === "max" ? node.getMaxWidth() : node.getMinWidth()
        return node.getFinalX() - w
      }))

      // calculate the horizontal adjustment
      const vAdjustment = Math.min(...rendered.map((node) => {
        const h = this.config.renderingSize === "max" ? node.getMaxHeight() : node.getMinHeight()
        return node.getFinalY() - h
      }))


      // update nodes
      rendered.forEach((node) => {
        const x = ((node.getFinalX() - hAdjustment) + offset) + this.config.translateX
        const y = (node.getFinalY() - vAdjustment) + this.config.translateY
        node.setFinalX(x)
        node.setFinalY(y)
      })

      // update edges
      this.edges.forEach((edge) => {
        edge.setFinalToX((edge.getFinalToX() - hAdjustment) + offset + this.config.translateX)
        edge.setFinalToY(edge.getFinalToY() - vAdjustment + this.config.translateY)
        edge.setFinalFromX((edge.getFinalFromX() - hAdjustment) + offset + this.config.translateX)
        edge.setFinalFromY(edge.getFinalFromY() - vAdjustment + this.config.translateY)
      })

      // calculate the layout info by gathering information about three points
      const x0 = Math.min(...rendered.map((n) => {
        const w = this.config.renderingSize === "max" ? n.getMaxWidth() : n.getMinWidth()
        return n.getFinalX() - w
      }))
      const y0 = 0

      const x1 = Math.max(...rendered.map((n) => {
        const w = this.config.renderingSize === "max" ? n.getMaxWidth() : n.getMinWidth()
        return n.getFinalX() + w
      }))
      const y1 = 0

      const x2 = x1
      const y2 = Math.max(...rendered.map((n) => {
        const h = this.config.renderingSize === "max" ? n.getMaxHeight() : n.getMinHeight()
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
    }


    // initial calculations
    const tree = buildTreeFromNodes(this.nodes)[0]
    initializeNodes(tree)
    calculateXYPositions(tree)
    calculateModifier(tree)

    // visual improvements
    fixConflicts(tree)
    fixZeroChildProblem(tree)
    centerRootNode(tree)

    // edges
    calculateEdgePositions(this.edges)
    addEdgeReferences(tree)

    // leafs
    calculateLeafs(tree)

    // layout info
    calculateLayoutInfo(tree)


    return this.layoutInfo
  }


  /**
   * Renders the tree layout by creating SVG objects representing nodes, leafs and edges.
   * @param {Object} [opts={ }] An object containing additional information.
   * @param {Boolean} [opts.isReRender=false] Determines if the layout is rerenderd.
   * @param {Number} [opts.x=null] The x coordinate for the clicked node.
   * @param {Number} [opts.y=null] The y coordinate for the clicked node.
   */
  renderLayout({ isReRender = false, x = null, y = null }) {
    // get the position where to start rendering the nodes from
    const X = x || this.nodes.find((n) => n.id === this.rootId).getFinalX()
    const Y = y || this.nodes.find((n) => n.id === this.rootId).getFinalY()


    // render nodes and edges
    const renderNodes = () => {
      this.nodes.forEach((node) => {
        // render nodes
        if (node.isRendered() === false) {
          if (this.config.renderingSize === "max") node.renderAsMax({ IX: X, IY: Y })
          if (this.config.renderingSize === "min") node.renderAsMin({ IX: X, IY: Y })

          // find provided events
          const eventStr = [...new Set(this.events.map((e) => e.event))].toString().split(",")

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
            this.events.forEach((myevent) => {
              if (myevent.event === type && myevent.modifier === modifier) {
                this.expandOrCollapseDataAsyncEvent(node)
              }
            })
          })


          // render edge references
          node.getOutgoingEdges().forEach((edge) => {
            if (edge.isRendered() === false) edge.render({ X, Y })
          })

          // or transform nodes into position
        } else if (node.isRendered() === true) {
          node.transformToFinalPosition({})
        }
      })
    }


    // render possible leafs
    const renderLeafs = () => {
      this.leafs.forEach((leaf) => {
        // only render leaf one time
        if (leaf.isRendered() === false) leaf.render(isReRender === true)

        // else, if its already rendered, transform the leaf to its final position
        else if (leaf.isRendered() === true) leaf.transformToFinalPosition({})
      })
    }


    // update edges
    const renderEdges = () => {
      this.edges.forEach((edge) => {
        // if edge is rendered, transform it to its final position
        if (edge.isRendered() === true) edge.transformToFinalPosition({ isReRender })
      })
    }

    renderNodes()
    renderLeafs()
    renderEdges()
  }
}


export default TreeLayout
