// src/app/page.tsx

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Node,
  Connection,
  Background,
  useReactFlow,
  Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import AddNodeButton from './AddNodeButton';
import nodeTypes from './nodeTypes';
import edgeTypes from './edgeTypes';
import { NodeDataUpdate } from './CustomUMLNode';

let classCounter = 1;

interface CustomEdgeData {
  label?: string;
  relationshipType?: string;
  edgeIndex?: number;
  totalEdges?: number;
  // Functions are excluded from serialization
  updateEdgeLabel?: (edgeId: string, newLabel: string) => void;
  updateRelationshipType?: (edgeId: string, newType: string) => void;
  setSelectedEdge?: (edgeId: string | null) => void;
}

type CustomEdge = Edge<CustomEdgeData>;

interface CustomNodeData {
  id: string;
  className: string;
  attributes: string[];
  methods: string[];
  selectedSection: number | null;
  // Functions are excluded from serialization
  onSelectSection?: (nodeId: string, sectionIndex: number) => void;
  onDeleteClass?: (nodeId: string) => void;
  onUpdateNodeData?: (nodeId: string, updatedData: NodeDataUpdate) => void;
}

type CustomNode = Node<CustomNodeData>;

function FlowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState<CustomNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<CustomEdgeData>([]);
  const { project } = useReactFlow();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [selectedSectionIndex, setSelectedSectionIndex] = useState<number>(0);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // New state variable to track initialization
  const [isInitialized, setIsInitialized] = useState(false);

  // Functions for edge and node updates (excluded from serialization)
  const updateEdgeLabel = useCallback(
    (edgeId: string, newLabel: string) => {
      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.id === edgeId) {
            const data: CustomEdgeData = {
              ...edge.data,
              label: newLabel,
            };
            return {
              ...edge,
              data,
            };
          }
          return edge;
        })
      );
    },
    [setEdges]
);

const updateRelationshipType = useCallback(
    (edgeId: string, newType: string) => {
      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.id === edgeId) {
            const data: CustomEdgeData = {
              ...edge.data,
              relationshipType: newType,
            };
            return {
              ...edge,
              data,
            };
          }
          return edge;
        })
      );
    },
    [setEdges]
);

  const handleSelectSection = useCallback(
    (nodeId: string, section: number) => {
      setSelectedNodeId(nodeId);
      setSelectedSectionIndex(section);
      setNodes((prevNodes) =>
        prevNodes.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  selectedSection: section,
                },
              }
            : {
                ...node,
                data: {
                  ...node.data,
                  selectedSection: null,
                },
              }
        )
      );
    },
    [setNodes]
  );

  const handleUpdateNodeData = useCallback(
    (nodeId: string, updatedData: NodeDataUpdate) => {
      setNodes((prevNodes) =>
        prevNodes.map((node) =>
          node.id === nodeId ? { ...node, data: { ...node.data, ...updatedData } } : node
        )
      );
    },
    [setNodes]
  );

  const handleDeleteClass = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    },
    [setNodes, setEdges]
  );

  // Save diagram to localStorage (exclude functions)
  const saveDiagram = useCallback(() => {
    const nodesToSave = nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        onSelectSection: undefined,
        onDeleteClass: undefined,
        onUpdateNodeData: undefined,
      },
    }));

    const edgesToSave = edges.map((edge) => ({
      ...edge,
      data: {
        ...edge.data,
        updateEdgeLabel: undefined,
        updateRelationshipType: undefined,
        setSelectedEdge: undefined,
      },
    }));

    const flow = {
      nodes: nodesToSave,
      edges: edgesToSave,
    };
    localStorage.setItem('diagram-flow', JSON.stringify(flow));
}, [nodes, edges]); // Only nodes and edges should be dependencies

  // Load diagram from localStorage and reassign functions
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedFlow = localStorage.getItem('diagram-flow');
        if (storedFlow) {
          const parsedFlow = JSON.parse(storedFlow);

          // Reassign functions and set nodes
          const loadedNodes: CustomNode[] = parsedFlow.nodes.map((node: CustomNode) => ({
            ...node,
            data: {
              ...node.data,
              onSelectSection: handleSelectSection,
              onDeleteClass: handleDeleteClass,
              onUpdateNodeData: handleUpdateNodeData,
            },
          }));

          // Reassign functions and set edges
          const loadedEdges: CustomEdge[] = parsedFlow.edges.map((edge: CustomEdge) => ({
            ...edge,
            data: {
              label: edge.data?.label || 'Association',
              relationshipType: edge.data?.relationshipType || 'association',
              edgeIndex: edge.data?.edgeIndex || 0,
              totalEdges: edge.data?.totalEdges || 1,
              updateEdgeLabel,
              updateRelationshipType,
              setSelectedEdge: setSelectedEdgeId,
            },
          }));          

          setNodes(loadedNodes);
          setEdges(loadedEdges);

          // Update classCounter to prevent ID collisions
          if (loadedNodes.length > 0) {
            const maxId = Math.max(...loadedNodes.map((node) => parseInt(node.id, 10)));
            classCounter = maxId + 1;
          }
        } else {
          // Initialize with default nodes
          const initialNode: CustomNode = {
            id: '1',
            type: 'umlClass',
            position: { x: 250, y: 5 },
            data: {
              id: '1',
              className: 'Class 1',
              attributes: ['attribute: Type'],
              methods: ['method(): ReturnType'],
              selectedSection: 0,
              onSelectSection: handleSelectSection,
              onDeleteClass: handleDeleteClass,
              onUpdateNodeData: handleUpdateNodeData,
            },
          };
          setNodes([initialNode]);
        }
      } catch (error) {
        console.error('Error loading diagram:', error);
        localStorage.removeItem('diagram-flow');
        setNodes([]);
        setEdges([]);
      } finally {
        setIsInitialized(true); // Mark initialization as complete
      }
    }
    // Include the functions in the dependency array to ensure they are up to date
  }, [
    handleSelectSection,
    handleDeleteClass,
    handleUpdateNodeData,
    updateEdgeLabel,
    updateRelationshipType,
    setSelectedEdgeId,
    setEdges,
    setNodes,
  ]);

  // Save diagram whenever nodes or edges change, after initialization
  useEffect(() => {
    if (isInitialized) {
        saveDiagram();
    }
  }, [isInitialized, nodes, edges, saveDiagram]);
  
  // Clear diagram function
  const clearDiagram = useCallback(() => {
    localStorage.removeItem('diagram-flow');
    setNodes([]);
    setEdges([]);
  }, [setNodes, setEdges]);

  // Function to update edge indices between two nodes
  const updateEdgeIndicesBetweenNodes = useCallback(
    (sourceId: string, targetId: string) => {
        setEdges((prevEdges) => {
            // Identify edges connecting the same nodes
            const sameEdges = prevEdges.filter(
                (edge) =>
                    (edge.source === sourceId && edge.target === targetId) ||
                    (edge.source === targetId && edge.target === sourceId)
            );

            return prevEdges.map((edge) => {
                if (sameEdges.includes(edge)) {
                    return {
                        ...edge,
                        data: {
                            ...edge.data,
                            edgeIndex: sameEdges.indexOf(edge), // Index within `sameEdges`
                            totalEdges: sameEdges.length,
                        },
                    };
                }
                return edge;
            });
        });
    },
    [setEdges]
);

const onConnect = useCallback(
  (params: Connection) => {
      if (!params.source || !params.target) return;

      const newEdge: CustomEdge = {
          id: `edge-${params.source}-${params.sourceHandle}-${params.target}-${params.targetHandle}-${Date.now()}`,
          type: 'customEdge',
          source: params.source,
          sourceHandle: params.sourceHandle, // Ensures handle ID is used
          target: params.target,
          targetHandle: params.targetHandle, // Ensures handle ID is used
          data: {
              label: 'Association',
              relationshipType: 'association',
              edgeIndex: 0,
              totalEdges: 1,
              updateEdgeLabel,
              updateRelationshipType,
              setSelectedEdge: setSelectedEdgeId,
          },
      };

      setEdges((eds) => addEdge(newEdge, eds));
      updateEdgeIndicesBetweenNodes(params.source, params.target);
  },
  [setEdges, updateEdgeLabel, updateRelationshipType, updateEdgeIndicesBetweenNodes, setSelectedEdgeId]
); 

  const handleAddNode = useCallback(() => {
    if (!reactFlowWrapper.current) return;

    const bounds = reactFlowWrapper.current.getBoundingClientRect();

    // Get center position of the React Flow wrapper
    const position = project({
      x: bounds.width / 2,
      y: bounds.height / 2,
    });

    const newNode: CustomNode = {
      id: `${classCounter}`,
      type: 'umlClass',
      position,
      data: {
        id: `${classCounter}`,
        className: `Class ${classCounter}`,
        attributes: ['attribute: Type'],
        methods: ['method(): ReturnType'],
        selectedSection: 0,
        onSelectSection: handleSelectSection,
        onDeleteClass: handleDeleteClass,
        onUpdateNodeData: handleUpdateNodeData,
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setSelectedNodeId(`${classCounter}`);
    setSelectedSectionIndex(0);
    classCounter++;
  }, [project, setNodes, handleSelectSection, handleDeleteClass, handleUpdateNodeData]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete') {
        if (selectedEdgeId) {
          // Delete the selected edge
          if (selectedEdgeId !== null) {
            const edgeToDelete = edges.find((edge) => edge.id === selectedEdgeId);
            if (edgeToDelete) {
              setEdges((eds) => eds.filter((edge) => edge.id !== selectedEdgeId));
              setSelectedEdgeId(null);
              updateEdgeIndicesBetweenNodes(edgeToDelete.source as string, edgeToDelete.target as string);
            }
          }
          
        } else if (selectedNodeId) {
          // Existing node deletion logic
          const currentNodeIndex = nodes.findIndex((node) => node.id === selectedNodeId);
          if (currentNodeIndex !== -1) {
            const currentNode = nodes[currentNodeIndex];
            const attributeCount = currentNode.data.attributes.length || 1;
            
            if (selectedSectionIndex === 0 || selectedSectionIndex === 1) {
              handleDeleteClass(currentNode.id);
            } else {
              if (selectedSectionIndex < 2 + attributeCount) {
                const attributeIndex = selectedSectionIndex - 2;
                currentNode.data.attributes.splice(attributeIndex, 1);
              } else {
                const methodIndex = selectedSectionIndex - 2 - attributeCount;
                currentNode.data.methods.splice(methodIndex, 1);
              }
              setNodes([...nodes]);
            }
          }
        }
      }

      if (event.key === 'Tab') {
        event.preventDefault();
        (document.activeElement as HTMLElement).blur();

        let currentNodeIndex = nodes.findIndex((node) => node.id === selectedNodeId);
        if (currentNodeIndex === -1) {
          currentNodeIndex = 0;
          setSelectedNodeId(nodes[0]?.id || null);
        }

        let currentNode = nodes[currentNodeIndex];
        const attributeCount = currentNode.data.attributes.length || 1;
        const methodCount = currentNode.data.methods.length || 1;
        const totalSections = 2 + attributeCount + methodCount;

        let newSectionIndex = selectedSectionIndex + (event.shiftKey ? -1 : 1);

        if (newSectionIndex >= totalSections) {
          newSectionIndex = 0;
          currentNodeIndex = (currentNodeIndex + 1) % nodes.length;
          currentNode = nodes[currentNodeIndex];
          setSelectedNodeId(currentNode.id);
        } else if (newSectionIndex < 0) {
          currentNodeIndex = (currentNodeIndex - 1 + nodes.length) % nodes.length;
          currentNode = nodes[currentNodeIndex];
          const newTotalSections =
            2 + currentNode.data.attributes.length + currentNode.data.methods.length;
          newSectionIndex = newTotalSections - 1;
          setSelectedNodeId(currentNode.id);
        }

        setSelectedSectionIndex(newSectionIndex);

        setNodes((prevNodes) =>
          prevNodes.map((node) =>
            node.id === currentNode.id
              ? {
                  ...node,
                  data: { ...node.data, selectedSection: newSectionIndex },
                }
              : {
                  ...node,
                  data: { ...node.data, selectedSection: null },
                }
          )
        );
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    nodes,
    edges,
    selectedNodeId,
    selectedEdgeId,
    selectedSectionIndex,
    setNodes,
    setEdges,
    handleDeleteClass,
    updateEdgeIndicesBetweenNodes,
  ]);

  return (
    <>
      <div ref={reactFlowWrapper} style={{ width: '100%', height: '100%' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          snapToGrid={true}
          snapGrid={[15, 15]}
          fitView
          nodesDraggable={true}
          nodesConnectable={true}
          tabIndex={0}
          onPaneClick={() => {
            setSelectedEdgeId(null);
            setSelectedNodeId(null);
            setNodes((prevNodes) =>
              prevNodes.map((node) => ({
                ...node,
                data: { ...node.data, selectedSection: null },
              }))
            );
          }}
        >
          <Background gap={15} size={0.5} />
          <AddNodeButton onClick={handleAddNode} />
        </ReactFlow>
      </div>
      <button onClick={clearDiagram} style={{ position: 'absolute', top: 10, right: 10 }}>
        Clear Diagram
      </button>
    </>
  );
}

export default function Home() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlowProvider>
        <FlowCanvas />
      </ReactFlowProvider>
    </div>
  );
}