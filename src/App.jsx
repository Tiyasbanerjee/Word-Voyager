import { useState } from 'react'
import './App.css'
import StartPage from './StartPage'

export default function App() {
  const [count, setCount] = useState('startpage')

  return (
    <>
     
      {
        count==='startpage' && (
          <StartPage/>
        )
      }
     
    </>
  )
}


