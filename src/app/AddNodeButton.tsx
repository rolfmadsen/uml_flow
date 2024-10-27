// src/app/AddNodeButton.tsx

import React from 'react';

interface AddNodeButtonProps {
  onClick: () => void;
}

const AddNodeButton: React.FC<AddNodeButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation(); // Prevent click from affecting the canvas
        onClick();
      }}
      style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        backgroundColor: '#28a745', // Green color
        color: 'white',
        border: 'none',
        fontSize: '30px',
        cursor: 'pointer',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        zIndex: 4,
      }}
      aria-label="Add Node"
    >
      +
    </button>
  );
};

export default AddNodeButton;