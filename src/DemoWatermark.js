import React from 'react';
import { getDbPool } from './variables';

function DemoWatermark() {

  if (getDbPool() !== 'demoPool') {
    return null;
  }

  return (
    <div className='demo-watermark'>
      DEMO
    </div>
  );
}

export default DemoWatermark;