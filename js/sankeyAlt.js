d3.sankey = function() {
  var sankey = {},
      nodeWidth = 24,
      nodePadding = 8,
      size = [1, 1],
      nodes = [],
      links = [],
      adding = [],
      loss = [],
      loop = [],
      other=[];

  sankey.nodeWidth = function(_) {
    if (!arguments.length) return nodeWidth;
    nodeWidth = +_;
    return sankey;
  };

  sankey.nodePadding = function(_) {
    if (!arguments.length) return nodePadding;
    nodePadding = +_;
    return sankey;
  };

  sankey.nodes = function(_) {
    if (!arguments.length) return nodes;
    nodes = _;
    return sankey;
  };

  sankey.links = function(_) {
    if (!arguments.length) return links;
    links = _;
    return sankey;
  };

  sankey.adding = function(_) {
    if (!arguments.length) return adding;
    adding = _;
    return sankey;
  };

  sankey.loss = function(_) {
    if (!arguments.length) return loss;
    loss = _;
    return sankey;
  };

  sankey.loop = function(_) {
    if (!arguments.length) return loop;
    loop = _;
    return sankey;
  };

  sankey.other = function(_) {
    if (!arguments.length) return loop;
    other = _;
    return sankey;
  };

  var h='';
  sankey.size = function(_) {
    if (!arguments.length) return size;
    size = _;
    h=size[1];
    return sankey;
  };


  sankey.layout = function(iterations) {
    computeNodeLinks();
    /*computeNodeAdd();
    computeNodeLoss();
    computeNodeLoop();*/
    computeNodeValues();
    computeNodeBreadths();
    computeNodeDepths(iterations);
    computeLinkDepths();
    return sankey;
  };

  sankey.relayout = function() {
    computeLinkDepths();
    return sankey;
  };

  sankey.link = function() {
    var curvature = .5;

    function link(d) {
      var x0 = d.source.x + d.source.dx,
          x1 = d.target.x,
          xi = d3.interpolateNumber(x0, x1),
          x2 = xi(curvature),
          x3 = xi(1 - curvature),
          y0 = d.source.y + d.sy + d.dy / 2,
          y1 = d.target.y + d.ty + d.dy / 2;
      return "M" + x0 + "," + y0
           + "C" + x2 + "," + y0
           + " " + x3 + "," + y1
           + " " + x1 + "," + y1;
    }

    link.curvature = function(_) {
      if (!arguments.length) return curvature;
      curvature = +_;
      return link;
    };
    return link;
  };

  sankey.addingCurve = function() {
  var sy=0;
  var n=0;
  var nodeThis='';

    adding.forEach(function(d){
      var nodeC=d.target;
          if (nodeC!==nodeThis){
            nodeThis=nodeC;
            sy=0;
            n=0;
          } else {
            n++;
          };
          
      var fbV=0;
      loop.forEach(function(feedback){
          if (nodes[feedback.target].name===nodeC.name){
            fbV+=feedback.value;
          };
      });

      var xPos=nodeC.x;
      var yPos=nodeC.y+nodeC.dy-(nodeC.dy/nodeC.value*fbV)-(nodeC.dy/nodeC.value*d.value/2)-sy; 
      sy+=(nodeC.dy/nodeC.value*d.value); //top+depth-half of value
      d.stroke = nodeC.dy/nodeC.value*d.value; 

      var xStart=[0];
      nodeC.targetLinks.forEach(function(targetL, i){
        if ((targetL.source.x+targetL.source.dx)>xStart[0]){
          xStart[0]=(targetL.source.x+targetL.source.dx);
        };
      });

      var xPos0=(xPos-Number(xStart))/2+Number(xStart)-n*50;

      var curvature = .5;

          var x0 = xPos0,
              x01= xPos0-10,
              x1 = xPos,
              xi = d3.interpolateNumber(x0, x1),
              x2 = xi(curvature),
              x3 = xi(1 - curvature),
              y0 = height + 0,
              y01= height + 0-20,
              y1 = yPos;
           d.path="M" + x0 + "," + y0
                //+ "C" + x0+","+y0
               + "C" + x2 + "," + y01
               + " " + x3 + "," + y1
               + " " + x1 + "," + y1;    
    });

};

  sankey.lossCurve = function(){
  var sy=0,
      n=0,
      nodeThis=''; // start counters

  loss.forEach(function(d){
          var nodeC=d.source;

          if (nodeC!==nodeThis){
            nodeThis=nodeC;
            sy=0;
            n=0;
          } else {
            n++;
          };

          var xPos=nodeC.x+nodeC.dx;
          var yPos=sy+nodeC.y+(nodeC.dy/nodeC.value*d.value/2);
          sy+=(nodeC.dy/nodeC.value*d.value);
          d.stroke = nodeC.dy/nodeC.value*d.value; //top+depth-half of value

          var xStart=[width];
          nodeC.sourceLinks.forEach(function(targetL, i){
            if ((targetL.target.x)>xPos&(targetL.target.x)<xStart[0]){
              xStart[0]=(targetL.target.x);
            };
          });

          var xPos0=(Number(xStart)-xPos)/2+Number(xPos)+n*50;

          var curvature = .5;

              var x0 = xPos,
                  x1 = xPos0,
                  xi = d3.interpolateNumber(x0, x1),
                  x2 = xi(curvature),
                  x3 = xi(1 - curvature),
                  y0 = yPos,
                  y01= 20,
                  y1 = 0;
               d.path="M" + x0 + "," + y0
                   + "C" + x2 + "," + y0
                   + " " + x3 + "," + y1
                   //+ " " + x3 + "," + y01
                   + " " + x1 + "," + y1;    
    });
  };

sankey.loopCurve=function() {
  var ssy=0,
      sn=0,
      strokeSt=0;
      snodeThis=''; // start counters
  var esy=0,
      en=0,
      strokeEn=0;
      enodeThis=''; // end counters

  loop.forEach(function(d){ // rework from here

          var nodeSt=d.source;
          //d.source=graph.nodes[nodeSt];
          var nodeEn=d.target;
          //d.target=graph.nodes[nodeEn];


          if (nodeSt!==snodeThis){
            snodeThis=nodeSt;
            ssy=0;
            sn=0;
            strokeSt=0;
          } else {
            sn++;
          };

          if (nodeEn!==enodeThis){
            enodeThis=nodeEn;
            esy=0;
            en=0;
            strokeEn=0;
          } else {
            en++;
          };


      nodeSt=nodes[nodeSt];
      nodeEn=nodes[nodeEn];
      d.nameEnd=nodeEn.name;

      var xsPos=nodeSt.x+nodeSt.dx; 
      var ysPos=nodeSt.y+nodeSt.dy-(nodeSt.dy/nodeSt.value*d.value/2)-ssy; 
      ssy+=(nodeSt.dy/nodeSt.value*d.value); //top+depth-half of value
      d.stroke = nodeSt.dy/nodeSt.value*d.value;
      var ysPos0 = nodeSt.y+nodeSt.dy+ d.stroke;

      var xePos=nodeEn.x;
      var yePos=nodeEn.y+nodeEn.dy-(nodeEn.dy/nodeEn.value*d.value/2)-esy; 
      esy+=(nodeEn.dy/nodeEn.value*d.value);
      var yePos0 = nodeEn.y+nodeEn.dy+ d.stroke; //top+depth-half of value

      var xsPosAnc1=xsPos+nodeSt.dx;
      if (sn=0){
        var ysPosAnc1=0;
      } else {
        var xsPosAnc2=0;
      };
      var xsPosArm=xsPos-nodeSt.dx/3;


      if ((nodeEn.x + nodeEn.dx*3)>=nodeSt.x 
        //&& (nodeEn.x - nodeEn.dx*4)<nodeSt.x
        ){
        // && nodeSt.y<nodeEn.y){ // top node to bottom
        d.path="M" + xsPos + "," + ysPos
                +"C" + (xsPos+nodeSt.dx*3) + ","+ ysPos
                +" "+ (xePos-nodeEn.dx*3)+","+(yePos)
                +" "+ (xePos)+","+(yePos);
                
      } else {
           d.path="M" + xsPos + "," + ysPos
                +"C" + (xsPos+d.stroke*1.5) + ","+ (ysPos)
                +" "+ (xsPos+d.stroke*1.5)+","+(ysPos0)
                +" "+ xsPos+","+(ysPos0)
                +"L"+(xsPos-nodeSt.dx/3)+","+(ysPos0)
                +"C"+(xsPos-nodeSt.dx*3)+","+(ysPos0)
                +" "+ (xePos+nodeEn.dx*3)+","+(yePos0)
                +" "+ (xePos+nodeEn.dx/3)+","+(yePos0)
                +"L"+xePos+","+(yePos0)
                +"C" + (xePos-d.stroke*1.5) + ","+ (yePos0)
                +" "+ (xePos-d.stroke*1.5)+","+yePos
                +" "+ xePos+","+yePos;
                
      };
        
    });
};

sankey.otherCurve=function(){

  other.forEach(function(d){
      //Mx1,y1 x2,x2
      var stNode;
      var enNode;

      nodes.forEach(function(node){
        //console.log(node.name, d.source, d.target);
        if (node.name===d.source){stNode=node};
        if (node.name===d.target){enNode=node};
      });

      var x1=stNode.dx+stNode.x+2;
      var y1=stNode.dy/2+stNode.y;
      var x2=enNode.x-2;
      var y2=enNode.dy/2+enNode.y;
      //console.log(x1,y1,x2,y2);

      d.path="M" + x1 + "," + y1
          + " " + x2 + "," + y2;

  });

};






  // Populate the sourceLinks and targetLinks for each node. 
  // this is where to set up the number or percent function... and make sure you are starting from input numbers.
  // Also, if the source and target are not objects, assume they are indices. 
  function computeNodeLinks() {
    //console.log(nodes);

    nodes.forEach(function(node) {
      node.sourceLinks = [];
      node.targetLinks = [];
    });

    links.forEach(function(link) {
      var source = link.source,
          target = link.target;
      if (typeof source === "number") source = link.source = nodes[link.source]; //making sure to get objects not numbers
      if (typeof target === "number") target = link.target = nodes[link.target];
      source.sourceLinks.push(link);
      target.targetLinks.push(link);
    });

    adding.forEach(function(addition) {
          //source = addition.source,
          targetA = addition.target;
          //console.log(targetA);
      if (typeof targetA === "number") targetA = addition.target = nodes[addition.target];
      targetA.targetLinks.push(addition);

    });

    loss.forEach(function(waste) {
          //source = addition.source,
          sourceL = waste.source;
          //console.log(waste);
      if (typeof sourceL === "number") sourceL = waste.source = nodes[waste.source];
      sourceL.sourceLinks.push(waste);
          
    });

   loop.forEach(function(circular) {
        var sourceC = circular.source,
            targetC = circular.target;

            //rework later;


    });

    nodes.forEach(function(node){
        //console.log(node);
    });
  } // end of ComputeNodeLinks

  // Compute the value (size) of each node by summing the associated links.
  function computeNodeValues() {
    nodes.forEach(function(node) {
      node.value = Math.max(
        d3.sum(node.sourceLinks, value),//+d3.sum(node.sourceAdds, value),
        d3.sum(node.targetLinks, value)//+d3.sum(node.sourceLosses, value)
      );
    });
  }

  // Iteratively assign the breadth (x-position) for each node.
  // Nodes are assigned the maximum breadth of incoming neighbors plus one;
  // nodes with no incoming links are assigned breadth zero, while
  // nodes with no outgoing links are assigned the maximum breadth.
  function computeNodeBreadths() {
    var remainingNodes = nodes,
        nextNodes,
        x = 0;

    while (remainingNodes.length) {
      nextNodes = [];
      remainingNodes.forEach(function(node) {
        node.x = x;
        node.dx = nodeWidth;
        node.sourceLinks.forEach(function(link) {
          if (link.target!==-1){
          nextNodes.push(link.target);
        };
        });
      });
      remainingNodes = nextNodes;
      ++x;
    }

    //
    moveSinksRight(x);
    scaleNodeBreadths((width - nodeWidth) / (x - 1));
  }

  function moveSourcesRight() {
    nodes.forEach(function(node) {
      if (!node.targetLinks.length) {
        node.x = d3.min(node.sourceLinks, function(d) { return d.target.x; }) - 1;
      }
    });
  }

  function moveSinksRight(x) {
    nodes.forEach(function(node) {
      if (!node.sourceLinks.length) {
        node.x = x - 1;
      }
    });
  }

  function scaleNodeBreadths(kx) {
    nodes.forEach(function(node) {
      node.x *= kx;
    });
  }

  function computeNodeDepths(iterations) {
    var nodesByBreadth = d3.nest()
        .key(function(d) { return d.x; })
        .sortKeys(d3.ascending)
        .entries(nodes)
        .map(function(d) { return d.values; });

    //
    initializeNodeDepth();
    resolveCollisions();
    for (var alpha = 1; iterations > 0; --iterations) {
      relaxRightToLeft(alpha *= .99);
      resolveCollisions();
      relaxLeftToRight(alpha);
      resolveCollisions();
    }

    function initializeNodeDepth() {
      var ky = d3.min(nodesByBreadth, function(nodes) {
        return (size[1] - (nodes.length - 1) * nodePadding) / d3.sum(nodes, value);
      });

      nodesByBreadth.forEach(function(nodes) {
        nodes.forEach(function(node, i) {
          node.y = i;
          node.dy = node.value * ky;
        });
      });

      links.forEach(function(link) {
        link.dy = link.value * ky;
      });
    }

    function relaxLeftToRight(alpha) {
      nodesByBreadth.forEach(function(nodes, breadth) {
        nodes.forEach(function(node) {
          if (node.targetLinks.length) {
            var y = d3.sum(node.targetLinks, weightedSource) / d3.sum(node.targetLinks, value);
            node.y += (y - center(node)) * alpha;
          }
        });
      });

      function weightedSource(link) {
        return center(link.source) * link.value;
      }
    }

    function relaxRightToLeft(alpha) {
      nodesByBreadth.slice().reverse().forEach(function(nodes) {
        nodes.forEach(function(node) {
          if (node.sourceLinks.length) {
            var y = d3.sum(node.sourceLinks, weightedTarget) / d3.sum(node.sourceLinks, value);
            node.y += (y - center(node)) * alpha;
          }
        });
      });

      function weightedTarget(link) {
        return center(link.target) * link.value;
      }
    }

    function resolveCollisions() {
      nodesByBreadth.forEach(function(nodes) {
        var node,
            dy,
            y0 = 0,
            n = nodes.length,
            i;

        // Push any overlapping nodes down.
        nodes.sort(ascendingDepth);
        for (i = 0; i < n; ++i) {
          node = nodes[i];
          dy = y0 - node.y;
          if (dy > 0) node.y += dy;
          y0 = node.y + node.dy + nodePadding;
        }

        // If the bottommost node goes outside the bounds, push it back up.
        dy = y0 - nodePadding - size[1];
        if (dy > 0) {
          y0 = node.y -= dy;

          // Push any overlapping nodes back up.
          for (i = n - 2; i >= 0; --i) {
            node = nodes[i];
            dy = node.y + node.dy + nodePadding - y0;
            if (dy > 0) node.y -= dy;
            y0 = node.y;
          }
        }
      });
    }

    function ascendingDepth(a, b) {
      return a.y - b.y;
    }
  }

  function computeLinkDepths() {
    nodes.forEach(function(node) {
      node.sourceLinks.sort(ascendingTargetDepth);
      node.targetLinks.sort(ascendingSourceDepth);
    });

    nodes.forEach(function(node) {
      var sy = 0, ty = 0;
            var posLinks=[],
                fb = 0;
      loop.forEach(function(feedback){
        if (feedback.name===node.name){
          fb += feedback.value;
        };
      });

      node.sourceLinks.forEach(function(link) {
        //console.log(link);
        if (link.dy){
          posLinks.push(link.dy);
        }; // full value is full height, need from zero to start at dy+loss.dy
      });
          //console.log(node.name,node.value,d3.sum(posLinks),fb/node.value*node.dy);
          sy=node.dy-d3.sum(posLinks)-(fb/node.value*node.dy);
      //take out the undefined additions here....

      node.sourceLinks.forEach(function(link) {
        link.sy = sy;
        sy += link.dy;
      });

      node.targetLinks.forEach(function(link) {
        link.ty = ty;
        ty += link.dy;
      });
    });

    function ascendingSourceDepth(a, b) {
      return a.source.y - b.source.y;
    }

    function ascendingTargetDepth(a, b) {
      return a.target.y - b.target.y;
    }
  }

  function center(node) {
    return node.y + node.dy / 2;
  }

  function value(link) {
    return link.value;
  }


  return sankey;
};
