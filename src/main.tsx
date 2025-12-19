import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App'
import { ConfigProvider } from 'antd'
import { UnreadProvider } from './app/common/Contexts/UnreadContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider>
      <UnreadProvider>
        <App />
      </UnreadProvider>
    </ConfigProvider>
  </StrictMode>
)
