// src/app/CustomUMLNode.tsx

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

  // State and refs
  const [isEditingClassName, setIsEditingClassName] = useState(false);
  const [localClassName, setLocalClassName] = useState(className);
  const [localAttributes, setLocalAttributes] = useState(attributes);
  const [localMethods, setLocalMethods] = useState(methods);

  const classNameInputRef = useRef<HTMLInputElement>(null);
  const attributeInputRefs = useRef<HTMLInputElement[]>([]);
  const methodInputRefs = useRef<HTMLInputElement[]>([]);

  // Effect to synchronize data back to parent
  useEffect(() => {
    onUpdateNodeData(id, {
      className: localClassName,
      attributes: localAttributes,
      methods: localMethods,
    });
  }, [localClassName, localAttributes, localMethods, id, onUpdateNodeData]);

  // Focus management
  useEffect(() => {
    if (isEditingClassName && classNameInputRef.current) {
      classNameInputRef.current.focus();
    }
  }, [isEditingClassName]);

  useEffect(() => {
    if (selectedSection !== null) {
      let sectionIdx = 0;
      if (selectedSection === sectionIdx) {
        // Class Frame selected, do nothing
      } else if (selectedSection === ++sectionIdx) {
        // Class Name selected
        setIsEditingClassName(true);
        setTimeout(() => classNameInputRef.current?.focus(), 0);
      } else {
        // Attributes and Methods
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

  // Helper function
  const isSelected = (sectionIdx: number) => selectedSection === sectionIdx;

  // Declare sectionIndex before using it
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

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="top-target"
        style={{ left: '50%' }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top-source"
        style={{ left: '50%' }}
        isConnectable={isConnectable}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right-target"
        style={{ top: '50%' }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        style={{ top: '50%' }}
        isConnectable={isConnectable}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-target"
        style={{ left: '50%' }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-source"
        style={{ left: '50%' }}
        isConnectable={isConnectable}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        style={{ top: '50%' }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-source"
        style={{ top: '50%' }}
        isConnectable={isConnectable}
      />
    </div>
  );

  // Event handlers
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
    setTimeout(() => {
      attributeInputRefs.current[index]?.focus();
      onSelectSection(id, selectedSection! + 1);
    }, 0);
  }

  function handleDeleteAttribute(index: number) {
    const updatedAttributes = localAttributes.filter((_, idx) => idx !== index);
    setLocalAttributes(updatedAttributes);
    onSelectSection(id, selectedSection! - 1);
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
    setTimeout(() => {
      methodInputRefs.current[index]?.focus();
      onSelectSection(id, selectedSection! + 1);
    }, 0);
  }

  function handleDeleteMethod(index: number) {
    const updatedMethods = localMethods.filter((_, idx) => idx !== index);
    setLocalMethods(updatedMethods);
    onSelectSection(id, selectedSection! - 1);
  }
};

export default CustomUMLNode;