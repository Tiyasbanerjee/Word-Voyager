import { useState } from 'react'
import './App.css'
import StartPage from './StartPage'
import Game1 from './Game_1'

export default function App() {
  const [count, setCount] = useState('Drop_word')

  return (
    <>
     
      {
        count==='startpage' && (
          <StartPage/>
        )
      }

      {
        count==='Drop_word' && (
          <Game1/>
        )
      }
     
    </>
  )
}


