import React from 'react'
import ReactDOM from 'react-dom/client'
import TensorDemo from '../pages/TensorDemo'
import '../index.css'

ReactDOM.createRoot(document.getElementById('tensor-demo-root')!).render(
  <React.StrictMode>
    <TensorDemo />
  </React.StrictMode>,
)
