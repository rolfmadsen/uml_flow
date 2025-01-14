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

// Keep these regex at top so no missing dependency warnings
const classRegex = /class\s+(\S+)\s*\{([\s\S]*?)\}/g;
const relationshipRegex = /(\w+)\s+([-\|<:o>\.*]+)\s+(\w+)/g;

let classCounter = 1;

interface CustomEdgeData {
  label?: string;
  relationshipType?: string;
  edgeIndex?: number;
  totalEdges?: number;
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
  onSelectSection?: (nodeId: string, sectionIndex: number) => void;
  onDeleteClass?: (nodeId: string) => void;
  onUpdateNodeData?: (nodeId: string, updatedData: NodeDataUpdate) => void;
}
type CustomNode = Node<CustomNodeData>;

function FlowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState<CustomNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<CustomEdgeData>([]);
  const { project, fitView } = useReactFlow();

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [selectedSectionIndex, setSelectedSectionIndex] = useState<number>(0);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // -----------------------------------------
  // 1) Define callbacks
  // -----------------------------------------
  const updateEdgeLabel = useCallback(
    (edgeId: string, newLabel: string) => {
      setEdges((eds) =>
        eds.map((edge) =>
          edge.id === edgeId
            ? { ...edge, data: { ...edge.data, label: newLabel } }
            : edge
        )
      );
    },
    [setEdges]
  );

  const updateRelationshipType = useCallback(
    (edgeId: string, newType: string) => {
      setEdges((eds) =>
        eds.map((edge) =>
          edge.id === edgeId
            ? { ...edge, data: { ...edge.data, relationshipType: newType } }
            : edge
        )
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
                data: { ...node.data, selectedSection: section },
              }
            : {
                ...node,
                data: { ...node.data, selectedSection: null },
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
          node.id === nodeId
            ? { ...node, data: { ...node.data, ...updatedData } }
            : node
        )
      );
    },
    [setNodes]
  );

  const handleDeleteClass = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    },
    [setNodes, setEdges]
  );

  // -----------------------------------------
  // 2) Export / Import PlantUML
  // -----------------------------------------
  const exportToPlantUML = useCallback(() => {
    const umlHeader = '@startuml\n';
    const umlFooter = '@enduml\n';

    const nodeDeclarations = nodes.map((n) => {
      const attrs = n.data.attributes.map((a) => `  ${a}`).join('\n');
      const meths = n.data.methods.map((m) => `  ${m}`).join('\n');
      return `class ${n.data.className} {\n${attrs}\n${meths}\n}`;
    });

    const edgeDeclarations = edges.map((edge) => {
      const sourceName = nodes.find((n) => n.id === edge.source)?.data.className;
      const targetName = nodes.find((n) => n.id === edge.target)?.data.className;
      if (!sourceName || !targetName) return '';

      const rt = edge.data?.relationshipType || 'association';
      switch (rt) {
        case 'inheritance':
          return `${sourceName} <|-- ${targetName}`;
        case 'aggregation':
          return `${sourceName} o-- ${targetName}`;
        case 'composition':
          return `${sourceName} *-- ${targetName}`;
        case 'dependency':
          return `${sourceName} ..> ${targetName}`;
        default:
          return `${sourceName} --> ${targetName}`;
      }
    });

    const plantUML = [
      umlHeader,
      ...nodeDeclarations,
      ...edgeDeclarations.filter((line) => line.trim() !== ''),
      umlFooter,
    ].join('\n');

    const blob = new Blob([plantUML], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'diagram.puml';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [nodes, edges]);

  const importFromPlantUML = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        console.log('PlantUML text:\n', text);

        const newNodes: CustomNode[] = [];
        const newEdges: CustomEdge[] = [];

        let match: RegExpExecArray | null;

        // parse classes
        while ((match = classRegex.exec(text)) !== null) {
          const [, className, body] = match;
          const attributes = body
            .split('\n')
            .filter((line) => line.trim() && !line.includes('()'))
            .map((a) => a.trim());
          const methods = body
            .split('\n')
            .filter((line) => line.trim() && line.includes('()'))
            .map((m) => m.trim());

          newNodes.push({
            id: `${newNodes.length + 1}`,
            type: 'umlClass',
            position: { x: Math.random() * 500, y: Math.random() * 500 },
            data: {
              id: `${newNodes.length + 1}`,
              className,
              attributes,
              methods,
              selectedSection: null,
              onSelectSection: handleSelectSection,
              onDeleteClass: handleDeleteClass,
              onUpdateNodeData: handleUpdateNodeData,
            },
          });
        }

        // parse relationships
        while ((match = relationshipRegex.exec(text)) !== null) {
          const [, sourceClass, relation, targetClass] = match;
          const sourceId = newNodes.find((n) => n.data.className === sourceClass)?.id;
          const targetId = newNodes.find((n) => n.data.className === targetClass)?.id;
          if (sourceId && targetId) {
            const relationshipType = relation.includes('o') ? 'aggregation' : 'association';
            newEdges.push({
              id: `edge-${sourceId}-${targetId}`,
              source: sourceId,
              target: targetId,
              type: 'floatingEdge', // keep using 'floatingEdge'
              data: {
                label: relation.includes(':') ? relation.split(':')[1] : 'Association',
                relationshipType,
              },
            });
          }
        }

        setNodes(newNodes);
        setEdges(newEdges);

        // Clear input so re-uploading same file triggers onChange
        event.target.value = '';

        setTimeout(() => {
          fitView();
        }, 100);
      };

      reader.readAsText(file);
    },
    [
      fitView,
      handleSelectSection,
      handleDeleteClass,
      handleUpdateNodeData,
      setNodes,
      setEdges,
    ]
  );

  // -----------------------------------------
  // 3) Local Storage
  // -----------------------------------------
  const saveDiagram = useCallback(() => {
    const nodesToSave = nodes.map((n) => ({
      ...n,
      data: {
        ...n.data,
        onSelectSection: undefined,
        onDeleteClass: undefined,
        onUpdateNodeData: undefined,
      },
    }));
    const edgesToSave = edges.map((e) => ({
      ...e,
      data: {
        ...e.data,
        updateEdgeLabel: undefined,
        updateRelationshipType: undefined,
        setSelectedEdge: undefined,
      },
    }));
    const flow = { nodes: nodesToSave, edges: edgesToSave };
    localStorage.setItem('diagram-flow', JSON.stringify(flow));
  }, [nodes, edges]);

  useEffect(() => {
    try {
      const storedFlow = localStorage.getItem('diagram-flow');
      if (storedFlow) {
        const parsed = JSON.parse(storedFlow);
        const loadedNodes: CustomNode[] = parsed.nodes.map((node: CustomNode) => ({
          ...node,
          data: {
            ...node.data,
            onSelectSection: handleSelectSection,
            onDeleteClass: handleDeleteClass,
            onUpdateNodeData: handleUpdateNodeData,
          },
        }));

        const loadedEdges: CustomEdge[] = parsed.edges.map((edge: CustomEdge) => ({
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

        if (loadedNodes.length > 0) {
          const maxId = Math.max(...loadedNodes.map((n) => parseInt(n.id, 10) || 1));
          classCounter = maxId + 1;
        }
      } else {
        // Default node
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
    } catch (err) {
      console.error('Error loading diagram:', err);
      localStorage.removeItem('diagram-flow');
      setNodes([]);
      setEdges([]);
    } finally {
      setIsInitialized(true);
    }
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

  useEffect(() => {
    if (isInitialized) {
      saveDiagram();
    }
  }, [isInitialized, nodes, edges, saveDiagram]);

  // -----------------------------------------
  // 4) Clear Diagram
  // -----------------------------------------
  const clearDiagram = useCallback(() => {
    localStorage.removeItem('diagram-flow');
    setNodes([]);
    setEdges([]);
  }, [setNodes, setEdges]);

  // -----------------------------------------
  // 5) Connect + Edge Offsets
  // -----------------------------------------
  const updateEdgeIndicesBetweenNodes = useCallback(
    (sourceId: string, targetId: string) => {
      setEdges((prev) => {
        const sameEdges = prev.filter(
          (edge) =>
            (edge.source === sourceId && edge.target === targetId) ||
            (edge.source === targetId && edge.target === sourceId)
        );
        return prev.map((edge) => {
          if (sameEdges.includes(edge)) {
            return {
              ...edge,
              data: {
                ...edge.data,
                edgeIndex: sameEdges.indexOf(edge),
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

      // Use 'floatingEdge' so we get the smooth-step floating edge
      const newEdge: CustomEdge = {
        id: `edge-${params.source}-${params.sourceHandle}-${params.target}-${params.targetHandle}-${Date.now()}`,
        type: 'floatingEdge',
        source: params.source,
        sourceHandle: params.sourceHandle,
        target: params.target,
        targetHandle: params.targetHandle,
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
    [
      setEdges,
      updateEdgeLabel,
      updateRelationshipType,
      setSelectedEdgeId,
      updateEdgeIndicesBetweenNodes,
    ]
  );

  // -----------------------------------------
  // 6) Add Node
  // -----------------------------------------
  const handleAddNode = useCallback(() => {
    if (!reactFlowWrapper.current) return;
    const bounds = reactFlowWrapper.current.getBoundingClientRect();

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
    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(`${classCounter}`);
    setSelectedSectionIndex(0);
    classCounter++;
  }, [project, setNodes, handleSelectSection, handleDeleteClass, handleUpdateNodeData]);

  // -----------------------------------------
  // 7) KeyDown Logic
  // -----------------------------------------
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete') {
        if (selectedEdgeId) {
          const edgeToDelete = edges.find((edge) => edge.id === selectedEdgeId);
          if (edgeToDelete) {
            setEdges((eds) => eds.filter((e) => e.id !== selectedEdgeId));
            setSelectedEdgeId(null);
            updateEdgeIndicesBetweenNodes(edgeToDelete.source, edgeToDelete.target);
          }
        } else if (selectedNodeId) {
          const currentNodeIndex = nodes.findIndex((n) => n.id === selectedNodeId);
          if (currentNodeIndex !== -1) {
            const currentNode = nodes[currentNodeIndex];
            const attrCount = currentNode.data.attributes.length || 1;

            if (selectedSectionIndex === 0 || selectedSectionIndex === 1) {
              handleDeleteClass(currentNode.id);
            } else {
              // remove attribute or method
              if (selectedSectionIndex < 2 + attrCount) {
                const attrIndex = selectedSectionIndex - 2;
                currentNode.data.attributes.splice(attrIndex, 1);
              } else {
                const methIndex = selectedSectionIndex - 2 - attrCount;
                currentNode.data.methods.splice(methIndex, 1);
              }
              setNodes([...nodes]);
            }
          }
        }
      }

      if (event.key === 'Tab') {
        event.preventDefault();
        (document.activeElement as HTMLElement).blur();

        let currentNodeIndex = nodes.findIndex((n) => n.id === selectedNodeId);
        if (currentNodeIndex === -1 && nodes.length > 0) {
          currentNodeIndex = 0;
          setSelectedNodeId(nodes[0].id);
        }

        if (currentNodeIndex !== -1) {
          let currentNode = nodes[currentNodeIndex];
          const attrCount = currentNode.data.attributes.length || 1;
          const methodCount = currentNode.data.methods.length || 1;
          const totalSections = 2 + attrCount + methodCount;

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

          setNodes((prev) =>
            prev.map((n) =>
              n.id === currentNode.id
                ? { ...n, data: { ...n.data, selectedSection: newSectionIndex } }
                : { ...n, data: { ...n.data, selectedSection: null } }
            )
          );
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    edges,
    nodes,
    selectedEdgeId,
    selectedNodeId,
    selectedSectionIndex,
    handleDeleteClass,
    updateEdgeIndicesBetweenNodes,
    setEdges,
    setNodes,
  ]);

  // -----------------------------------------
  // Render
  // -----------------------------------------
  return (
    <>
      <div ref={reactFlowWrapper} style={{ width: '100%', height: '100%' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          snapToGrid
          snapGrid={[15, 15]}
          fitView
          tabIndex={0}
          onPaneClick={() => {
            setSelectedEdgeId(null);
            setSelectedNodeId(null);
            setNodes((prev) =>
              prev.map((n) => ({ ...n, data: { ...n.data, selectedSection: null } }))
            );
          }}
        >
          <Background gap={15} size={0.5} />
          <AddNodeButton onClick={handleAddNode} />
        </ReactFlow>
      </div>

      <button
        onClick={clearDiagram}
        style={{ position: 'absolute', top: 10, right: 10 }}
      >
        Clear Diagram
      </button>
      <button
        onClick={exportToPlantUML}
        style={{ position: 'absolute', top: 50, right: 10 }}
      >
        Export to PlantUML
      </button>
      <input
        type="file"
        accept=".puml"
        onChange={importFromPlantUML}
        style={{ position: 'absolute', top: 90, right: 10 }}
      />
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