import React, {useEffect, useState} from 'react'
import {createRoot} from 'react-dom/client'
import {Plus, Trash2, ArrowRight, ArrowLeft, LayoutDashboard, RefreshCw, X} from 'lucide-react'
import './style.css'

type Status = 'todo'|'doing'|'done'
type Card = {id:string;title:string;description:string;status:Status;created_at:string}
const API = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/,'')
const columns:{id:Status;label:string;hint:string}[] = [
  {id:'todo',label:'To Do',hint:'Ideas & upcoming tasks'},
  {id:'doing',label:'Doing',hint:'Work in progress'},
  {id:'done',label:'Done',hint:'Completed tasks'}]
async function request(path:string, options?:RequestInit){
  const r = await fetch(`${API}${path}`,{...options,headers:{'Content-Type':'application/json',...options?.headers}})
  if(!r.ok){const error = await r.text();throw new Error(`${r.status}: ${error.slice(0,250)}`)}
  return r.status===204 ? null : r.json()
}
function App(){
  const [cards,setCards]=useState<Card[]>([])
  const [loading,setLoading]=useState(true)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [adding,setAdding]=useState<Status|null>(null)
  const [title,setTitle]=useState('')
  const [description,setDescription]=useState('')
  const [dragging,setDragging]=useState<string|null>(null)
  async function refresh(){setLoading(true);try{setCards(await request('/cards'));setError('')}catch(e){setError(String(e))}finally{setLoading(false)}}
  useEffect(()=>{void refresh()},[])
  async function add(e:React.FormEvent){e.preventDefault();if(!title.trim()||!adding)return;setBusy(true);try{const c=await request('/cards',{method:'POST',body:JSON.stringify({title:title.trim(),description:description.trim(),status:adding})});setCards(old=>[...old,c]);setTitle('');setDescription('');setAdding(null);setError('')}catch(e){setError(String(e))}finally{setBusy(false)}}
  async function move(card:Card,status:Status){if(card.status===status)return;setBusy(true);try{const c=await request(`/cards/${card.id}`,{method:'PATCH',body:JSON.stringify({status})});setCards(old=>old.map(x=>x.id===c.id?c:x));setError('')}catch(e){setError(String(e))}finally{setBusy(false)}}
  async function remove(card:Card){if(!window.confirm(`Delete "${card.title}"?`))return;setBusy(true);try{await request(`/cards/${card.id}`,{method:'DELETE'});setCards(old=>old.filter(x=>x.id!==card.id));setError('')}catch(e){setError(String(e))}finally{setBusy(false)}}
  return <div className="app"><header><div className="brand"><div className="logo"><LayoutDashboard size={23}/></div><div><strong>FlowBoard</strong><span>YOUR PRODUCTIVITY SPACE</span></div></div><div className="header-right"><span className="live"><i/> Project workspace</span><button className="refresh" onClick={()=>void refresh()} title="Refresh" aria-label="Refresh"><RefreshCw size={18}/></button></div></header>
    <main><section className="intro"><div className="eyebrow">WORKSPACE / OVERVIEW</div><div className="intro-line"><div><h1>Project Board <span>✦</span></h1><p>Organize your tasks, track progress, and get things done.</p></div><button className="primary" onClick={()=>setAdding('todo')}><Plus size={18}/> New task</button></div></section>
    <div className="stats"><div><b>{cards.length}</b><span>Total tasks</span></div><div><b>{cards.filter(x=>x.status==='doing').length}</b><span>In progress</span></div><div><b>{cards.filter(x=>x.status==='done').length}</b><span>Completed</span></div></div>
    {error&&<div className="error" role="alert">Could not sync with server: {error} <button onClick={()=>void refresh()}>Retry</button></div>}
    <section className="board">{columns.map((col,i)=><div key={col.id} className={'column '+col.id} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const c=cards.find(x=>x.id===dragging);if(c)void move(c,col.id);setDragging(null)}}><div className="colhead"><div className="coltitle"><span className="dot"/><h2>{col.label}</h2><span className="count">{cards.filter(x=>x.status===col.id).length}</span></div><button title={`Add to ${col.label}`} aria-label={`Add to ${col.label}`} onClick={()=>setAdding(col.id)}><Plus size={20}/></button></div><p className="hint">{col.hint}</p><div className="cardlist">{cards.filter(x=>x.status===col.id).map(card=><article key={card.id} className="task" draggable={!busy} onDragStart={()=>setDragging(card.id)} onDragEnd={()=>setDragging(null)}><div className="tasktop"><span className={'tag '+card.status}>{col.label}</span><button className="delete" title="Delete task" aria-label="Delete task" disabled={busy} onClick={()=>void remove(card)}><Trash2 size={16}/></button></div><h3>{card.title}</h3>{card.description&&<p>{card.description}</p>}<div className="taskbottom"><span>{new Date(card.created_at).toLocaleDateString()}</span><div>{i>0&&<button disabled={busy} title="Move left" aria-label="Move left" onClick={()=>void move(card,columns[i-1].id)}><ArrowLeft size={16}/></button>}{i<2&&<button disabled={busy} title="Move right" aria-label="Move right" onClick={()=>void move(card,columns[i+1].id)}><ArrowRight size={16}/></button>}</div></div></article>)}{!loading&&cards.filter(x=>x.status===col.id).length===0&&<div className="empty">Drop a task here<br/>or create a new one</div>}</div><button className="add-inline" onClick={()=>setAdding(col.id)}><Plus size={17}/> Add a task</button></div>)}</section>
    {loading&&<p className="loading">Loading tasks...</p>}
    </main><footer>FlowBoard · Built with React, FastAPI & Supabase</footer>
    {adding&&<div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setAdding(null)}}><form className="modal" onSubmit={e=>void add(e)}><div className="modalhead"><div><span className="eyebrow">CREATE TASK</span><h2>New task</h2></div><button type="button" className="close" onClick={()=>setAdding(null)}><X size={20}/></button></div><label>Task title<input required maxLength={200} autoFocus placeholder="What needs to be done?" value={title} onChange={e=>setTitle(e.target.value)}/></label><label>Description (optional)<textarea maxLength={2000} rows={4} placeholder="Add some details..." value={description} onChange={e=>setDescription(e.target.value)}/></label><label>Column<select value={adding} onChange={e=>setAdding(e.target.value as Status)}>{columns.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select></label><button className="primary submit" type="submit" disabled={busy}>{busy?'Saving...':'Create task'}</button></form></div>}
  </div>
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>)
