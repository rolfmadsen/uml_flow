// src/app/CustomEdge.tsx

'use client';

import React, { useState } from 'react';
import {
  EdgeProps,
  //SmoothStepEdge,
  getSmoothStepPath,
  EdgeLabelRenderer,
} from 'reactflow';

const CustomEdge = (props: EdgeProps) => {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    data,
  } = props;

  const [isEditing, setIsEditing] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const label = data?.label || 'Association';

  const relationshipType = data?.relationshipType || 'association';

  // Determine markers based on relationship type
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

  const edgeStyle = {
    ...style,
    stroke: isSelected ? 'blue' : 'black',
    strokeWidth: 2,
    strokeDasharray: relationshipType === 'dependency' ? '6,3' : undefined,
    cursor: 'pointer',
  };

  // Get edge index and total edges
  const edgeIndex = data?.edgeIndex || 0;
  const totalEdges = data?.totalEdges || 1;

  // Calculate offset for overlapping edges
  const offsetAmount = 20 // Adjust as needed
  const offset = (edgeIndex - (totalEdges - 1) / 2) * offsetAmount;

  // Adjust the path options
  const pathOptions = {
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 0,
    centerX: (sourceX + targetX) / 2 + offset,
    centerY: (sourceY + targetY) / 2 + offset,
  };

  const [edgePath, labelX, labelY] = getSmoothStepPath(pathOptions);

  // Handle label editing
  const handleLabelClick = () => {
    setIsEditing(true);
  };

  const handleLabelBlur = (newValue: string) => {
    if (data?.updateEdgeLabel) {
      data.updateEdgeLabel(id, newValue);
    }
    setIsEditing(false);
  };
  
  const handleLabelKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleLabelBlur(e.currentTarget.value);
    }
  };

  return (
    <>
      <defs>
        {/* Inheritance marker (hollow triangle) */}
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

        {/* Aggregation marker (hollow diamond) */}
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

        {/* Composition marker (filled diamond) */}
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

        {/* Dependency marker (dashed line with open arrow) */}
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

      {/* Edge path with markers */}
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        markerStart={markerStart}
        markerEnd={markerEnd}
        style={edgeStyle}
        onClick={(e) => {
          e.stopPropagation();
          setIsSelected(true);
          if (data?.setSelectedEdge) {
            data.setSelectedEdge(id);
          }
        }}
      />

      {/* Edge label */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%)`,
            left: labelX,
            top: labelY,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          {isEditing ? (
            <input
              type="text"
              defaultValue={label}
              onBlur={(e) => handleLabelBlur(e.currentTarget.value)}
              onKeyDown={handleLabelKeyDown}
              autoFocus
              style={{
                width: '100px',
                textAlign: 'center',
              }}
              className="nodrag nopan"
            />
          ) : (
            <div
              onClick={handleLabelClick}
              style={{
                padding: '2px 4px',
                background: 'white',
                borderRadius: '2px',
                cursor: 'pointer',
              }}
            >
              {label}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>

      {/* Relationship Type Selector */}
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
                const newType = e.target.value;
                if (data?.updateRelationshipType) {
                  data.updateRelationshipType(id, newType);
                }
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
};

export default CustomEdge;