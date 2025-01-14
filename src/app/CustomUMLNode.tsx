// src/app/CustomUMLNode.tsx

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import './custom-node-style.css';

interface CustomNodeData {
  id: string;
  className: string;
  attributes: string[];
  methods: string[];
  onSelectSection: (nodeId: string, sectionIndex: number) => void;
  onDeleteClass: (nodeId: string) => void;
  onUpdateNodeData: (nodeId: string, updatedData: NodeDataUpdate) => void;
  selectedSection: number | null;
}

export interface NodeDataUpdate {
  className?: string;
  attributes?: string[];
  methods?: string[];
}

const CustomUMLNode = ({ data, id, isConnectable }: NodeProps<CustomNodeData>) => {
  // Destructure data properties
  const {
    className,
    attributes,
    methods,
    onSelectSection,
    onDeleteClass,
    selectedSection,
    onUpdateNodeData,
  } = data;

  // Local state
  const [isEditingClassName, setIsEditingClassName] = useState(false);
  const [localClassName, setLocalClassName] = useState(className);
  const [localAttributes, setLocalAttributes] = useState(attributes);
  const [localMethods, setLocalMethods] = useState(methods);

  // Refs for focusing
  const classNameInputRef = useRef<HTMLInputElement>(null);
  const attributeInputRefs = useRef<HTMLInputElement[]>([]);
  const methodInputRefs = useRef<HTMLInputElement[]>([]);

  // Sync changes back up
  useEffect(() => {
    onUpdateNodeData(id, {
      className: localClassName,
      attributes: localAttributes,
      methods: localMethods,
    });
  }, [localClassName, localAttributes, localMethods, id, onUpdateNodeData]);

  // Focus management for class name
  useEffect(() => {
    if (isEditingClassName && classNameInputRef.current) {
      classNameInputRef.current.focus();
    }
  }, [isEditingClassName]);

  // Auto-focus on sections
  useEffect(() => {
    if (selectedSection !== null) {
      let sectionIdx = 0;
      if (selectedSection === sectionIdx) {
        // Class frame selected
      } else if (selectedSection === ++sectionIdx) {
        // Class Name selected
        setIsEditingClassName(true);
        setTimeout(() => classNameInputRef.current?.focus(), 0);
      } else {
        // Attributes & Methods
        const attrCount = localAttributes.length || 1;
        const methodCount = localMethods.length || 1;
        if (selectedSection <= sectionIdx + attrCount) {
          const attrIndex = selectedSection - (sectionIdx + 1);
          attributeInputRefs.current[attrIndex]?.focus();
        } else if (selectedSection <= sectionIdx + attrCount + methodCount) {
          const methodIndex = selectedSection - (sectionIdx + attrCount + 1);
          methodInputRefs.current[methodIndex]?.focus();
        }
      }
    }
  }, [selectedSection, localAttributes.length, localMethods.length]);

  // Helpers
  const isSelected = (sectionIdx: number) => selectedSection === sectionIdx;
  let sectionIndex = 0;

  return (
    <div
      className={`react-flow__node-default uml-class-node ${
        isSelected(sectionIndex) ? 'selected' : ''
      }`}
      onClick={() => onSelectSection(id, sectionIndex)}
    >
      {/* Class Name Section */}
      <div
        className={`uml-class-header ${isSelected(++sectionIndex) ? 'selected' : ''}`}
        onClick={() => {
          onSelectSection(id, sectionIndex);
          setIsEditingClassName(true);
        }}
      >
        {isEditingClassName ? (
          <input
            type="text"
            value={localClassName}
            onChange={(e) => setLocalClassName(e.target.value)}
            onKeyDown={handleClassNameEdit}
            onBlur={() => setIsEditingClassName(false)}
            ref={classNameInputRef}
            className="nodrag nopan"
          />
        ) : (
          <strong>{localClassName}</strong>
        )}
      </div>

      {/* Attributes Section */}
      <div className="uml-class-section">
        {localAttributes.length > 0 ? (
          localAttributes.map((attr, index) => {
            const currentIndex = ++sectionIndex;
            return (
              <div
                key={index}
                className={`uml-class-field ${isSelected(currentIndex) ? 'selected' : ''}`}
                onClick={() => {
                  onSelectSection(id, currentIndex);
                  attributeInputRefs.current[index]?.focus();
                }}
              >
                <input
                  type="text"
                  value={attr}
                  onChange={(e) => {
                    const updatedAttributes = [...localAttributes];
                    updatedAttributes[index] = e.target.value;
                    setLocalAttributes(updatedAttributes);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddAttribute(index);
                    } else if (e.key === 'Delete') {
                      handleDeleteAttribute(index);
                    }
                  }}
                  ref={(el) => {
                    if (el) attributeInputRefs.current[index] = el;
                  }}
                  className="nodrag nopan"
                />
              </div>
            );
          })
        ) : (
          <div
            className={`uml-class-field placeholder ${isSelected(++sectionIndex) ? 'selected' : ''}`}
            onClick={() => {
              onSelectSection(id, sectionIndex);
              handleAddAttribute(-1);
            }}
          >
            <em>Add Attribute</em>
          </div>
        )}
      </div>

      <hr />

      {/* Methods Section */}
      <div className="uml-class-section">
        {localMethods.length > 0 ? (
          localMethods.map((method, index) => {
            const currentIndex = ++sectionIndex;
            return (
              <div
                key={index}
                className={`uml-class-field ${isSelected(currentIndex) ? 'selected' : ''}`}
                onClick={() => {
                  onSelectSection(id, currentIndex);
                  methodInputRefs.current[index]?.focus();
                }}
              >
                <input
                  type="text"
                  value={method}
                  onChange={(e) => {
                    const updatedMethods = [...localMethods];
                    updatedMethods[index] = e.target.value;
                    setLocalMethods(updatedMethods);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddMethod(index);
                    } else if (e.key === 'Delete') {
                      handleDeleteMethod(index);
                    }
                  }}
                  ref={(el) => {
                    if (el) methodInputRefs.current[index] = el;
                  }}
                  className="nodrag nopan"
                />
              </div>
            );
          })
        ) : (
          <div
            className={`uml-class-field placeholder ${isSelected(++sectionIndex) ? 'selected' : ''}`}
            onClick={() => {
              onSelectSection(id, sectionIndex);
              handleAddMethod(-1);
            }}
          >
            <em>Add Method</em>
          </div>
        )}
      </div>

      {/*
        Instead of multiple handles on each side, define hidden handles
        to satisfy TS requirements. We set position={Position.Left} (or
        any enum) but override via style so it appears centered & invisible.
      */}
      <Handle
        type="source"
        position={Position.Left} // TS wants a required 'position'
        style={{
          width: 0,
          height: 0,
          border: 'none',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
        isConnectable={isConnectable}
      />
      <Handle
        type="target"
        position={Position.Left} // same trick
        style={{
          width: 0,
          height: 0,
          border: 'none',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
        isConnectable={isConnectable}
      />
    </div>
  );

  // -------------------------------------------
  // Event handlers
  // -------------------------------------------
  function handleClassNameEdit(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      setIsEditingClassName(false);
    } else if (e.key === 'Delete') {
      onDeleteClass(id);
    }
  }

  function handleAddAttribute(index: number) {
    const updatedAttributes = [...localAttributes];
    if (index === -1) {
      updatedAttributes.push('');
      index = updatedAttributes.length - 1;
    } else {
      updatedAttributes.splice(index + 1, 0, '');
      index += 1;
    }
    setLocalAttributes(updatedAttributes);

    // Focus the newly added attribute
    setTimeout(() => {
      attributeInputRefs.current[index]?.focus();
      if (selectedSection !== null) {
        onSelectSection(id, selectedSection + 1);
      }
    }, 0);
  }

  function handleDeleteAttribute(index: number) {
    const updatedAttributes = localAttributes.filter((_, idx) => idx !== index);
    setLocalAttributes(updatedAttributes);
    if (selectedSection !== null) {
      onSelectSection(id, selectedSection - 1);
    }
  }

  function handleAddMethod(index: number) {
    const updatedMethods = [...localMethods];
    if (index === -1) {
      updatedMethods.push('');
      index = updatedMethods.length - 1;
    } else {
      updatedMethods.splice(index + 1, 0, '');
      index += 1;
    }
    setLocalMethods(updatedMethods);

    // Focus the newly added method
    setTimeout(() => {
      methodInputRefs.current[index]?.focus();
      if (selectedSection !== null) {
        onSelectSection(id, selectedSection + 1);
      }
    }, 0);
  }

  function handleDeleteMethod(index: number) {
    const updatedMethods = localMethods.filter((_, idx) => idx !== index);
    setLocalMethods(updatedMethods);
    if (selectedSection !== null) {
      onSelectSection(id, selectedSection - 1);
    }
  }
};

export default CustomUMLNode;