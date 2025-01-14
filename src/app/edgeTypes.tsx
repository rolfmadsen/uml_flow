// src/app/edgeTypes.ts

'use client';

import FloatingEdge from './FloatingEdge';

/**
 * Named export to avoid "import/no-anonymous-default-export" rule
 */
const edgeTypes = {
  floatingEdge: FloatingEdge,  // references your new smooth-step FloatingEdge
};

export default edgeTypes;