import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import {data} from './Components/data.js'


export default function App() {
  
  return (
    <div>
    <Header />
    <main>
      <div className='card'>
          <table>
        <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Group</th>
        </tr>
        </thead>
        <tbody>
          {data.map((item, i) =>(
            <Table key = {i} {...item} />
          ))}
        </tbody>
      </table>
      </div>
    
    </main>
    </div>
  )
}


function Header(){
  return(
    <div>
    <header className="header">
      <div><h1>User List</h1></div>
      <input type="text" name="" id="search" />
      <button>Add</button>
    </header>
    </div>  
  )
}  

function Table({name, email, group}){
  return(
    
        <><tr>
          <td>{name}</td>
          <td>{email}</td>
          <td>{group}</td>
          </tr>
        </>
    

  )

}