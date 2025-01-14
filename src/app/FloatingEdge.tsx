// src/app/FloatingEdge.tsx

'use client';

import React, { useState } from 'react';
import {
  EdgeProps,
  getSmoothStepPath,
  EdgeLabelRenderer,
} from 'reactflow';

interface FloatingEdgeData {
  label?: string;
  relationshipType?: string;
  edgeIndex?: number;
  totalEdges?: number;
  updateEdgeLabel?: (edgeId: string, newLabel: string) => void;
  updateRelationshipType?: (edgeId: string, newType: string) => void;
  setSelectedEdge?: (edgeId: string | null) => void;
}

export default function FloatingEdge(props: EdgeProps<FloatingEdgeData>) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    data,
    style,
  } = props;

  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [isSelected, setIsSelected] = useState(false);

  // Relationship data
  const label = data?.label || 'Association';
  const relationshipType = data?.relationshipType || 'association';

  // Markers for UML
  let markerStart = '';
  let markerEnd = '';
  if (relationshipType === 'inheritance') {
    markerEnd = 'url(#uml-inheritance)';
  } else if (relationshipType === 'aggregation') {
    markerStart = 'url(#uml-aggregation)';
  } else if (relationshipType === 'composition') {
    markerStart = 'url(#uml-composition)';
  } else if (relationshipType === 'dependency') {
    markerEnd = 'url(#uml-dependency)';
  }

  // If this edge is selected, highlight it in blue
  const edgeStyle = {
    ...style,
    stroke: isSelected ? 'blue' : 'black',
    strokeWidth: 2,
    strokeDasharray: relationshipType === 'dependency' ? '6,3' : undefined,
    cursor: 'pointer',
  };

  // For multiple parallel edges between same nodes
  const edgeIndex = data?.edgeIndex || 0;
  const totalEdges = data?.totalEdges || 1;
  const offsetAmount = 20;
  const offset = (edgeIndex - (totalEdges - 1) / 2) * offsetAmount;

  // Get a smooth-step path while letting it "float" (pass undefined positions)
  // borderRadius > 0 => angled corners
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition: undefined,
    targetX,
    targetY,
    targetPosition: undefined,
    borderRadius: 15, // make corners angled
    centerX: (sourceX + targetX) / 2 + offset,
    centerY: (sourceY + targetY) / 2 + offset,
  });

  // Label editing
  const handleLabelClick = () => {
    setIsEditingLabel(true);
  };
  const handleLabelBlur = (newVal: string) => {
    data?.updateEdgeLabel?.(id, newVal);
    setIsEditingLabel(false);
  };
  const handleLabelKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleLabelBlur(e.currentTarget.value);
    }
  };

  return (
    <>
      <defs>
        {/* UML Inheritance */}
        <marker
          id="uml-inheritance"
          markerWidth="12"
          markerHeight="12"
          refX="12"
          refY="6"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L12,6 L0,12 L3,6 z" fill="white" stroke="black" />
        </marker>

        {/* Aggregation */}
        <marker
          id="uml-aggregation"
          markerWidth="12"
          markerHeight="12"
          refX="0"
          refY="6"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M12,6 L6,12 L0,6 L6,0 z" fill="white" stroke="black" />
        </marker>

        {/* Composition */}
        <marker
          id="uml-composition"
          markerWidth="12"
          markerHeight="12"
          refX="0"
          refY="6"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M12,6 L6,12 L0,6 L6,0 z" fill="black" stroke="black" />
        </marker>

        {/* Dependency */}
        <marker
          id="uml-dependency"
          markerWidth="12"
          markerHeight="12"
          refX="12"
          refY="6"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L12,6 L0,12" fill="none" stroke="black" />
        </marker>
      </defs>

      {/* The main path */}
      <path
        id={id}
        d={edgePath}
        className="react-flow__edge-path"
        markerStart={markerStart}
        markerEnd={markerEnd}
        style={edgeStyle}
        onClick={(evt) => {
          evt.stopPropagation();
          setIsSelected(true);
          data?.setSelectedEdge?.(id);
        }}
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: 'translate(-50%, -50%)',
            left: labelX,
            top: labelY,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          {isEditingLabel ? (
            <input
              type="text"
              defaultValue={label}
              onBlur={(e) => handleLabelBlur(e.currentTarget.value)}
              onKeyDown={handleLabelKeyDown}
              autoFocus
              style={{ width: '80px', textAlign: 'center' }}
            />
          ) : (
            <div
              style={{
                padding: '2px 4px',
                background: 'white',
                borderRadius: '2px',
                cursor: 'pointer',
              }}
              onClick={handleLabelClick}
            >
              {label}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>

      {/* Relationship Type Dropdown */}
      {isSelected && (
        <foreignObject
          width={120}
          height={40}
          x={labelX - 60}
          y={labelY - 60}
          requiredExtensions="http://www.w3.org/1999/xhtml"
        >
          <div
            style={{
              background: 'white',
              border: '1px solid #ccc',
              borderRadius: '4px',
              padding: '5px',
            }}
          >
            <select
              value={relationshipType}
              onChange={(e) => {
                data?.updateRelationshipType?.(id, e.target.value);
                setIsSelected(false);
              }}
              onBlur={() => setIsSelected(false)}
              autoFocus
              className="nodrag nopan"
            >
              <option value="association">Association</option>
              <option value="inheritance">Inheritance</option>
              <option value="aggregation">Aggregation</option>
              <option value="composition">Composition</option>
              <option value="dependency">Dependency</option>
            </select>
          </div>
        </foreignObject>
      )}
    </>
  );
}