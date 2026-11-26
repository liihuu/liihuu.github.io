import React from 'react'
import { createRoot } from 'react-dom/client'
import Studio from './Studio'
import { applyTheme, getStoredTheme } from './themes'
import './styles.css'

applyTheme(getStoredTheme())

const rootElement = document.getElementById('root')
const root = rootElement.__reactRoot ?? createRoot(rootElement)
rootElement.__reactRoot = root
root.render(<Studio />)
