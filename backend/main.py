import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from supabase import create_client

STATUSES = {'todo', 'doing', 'done'}

def db():
    url = os.getenv('SUPABASE_URL', '').strip().rstrip('/')
    key = os.getenv('SUPABASE_SERVICE_ROLE_KEY', '').strip()

    if not url or not key:
        raise HTTPException(503, 'Supabase credentials are not configured')

    if not url.startswith('https://') or not url.endswith('.supabase.co'):
        raise HTTPException(503, 'Invalid SUPABASE_URL format')

    return create_client(url, key)

app = FastAPI(title='Kanban Board API')
origins = os.getenv('CORS_ORIGINS', '*').split(',')
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=False, allow_methods=['*'], allow_headers=['*'])

class CardCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(default='', max_length=2000)
    status: str = 'todo'

class CardUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    status: str | None = None

@app.get('/health')
def health():
    return {'ok': True}

@app.get('/cards')
def get_cards():
    try:
        return db().table('cards').select('*').order('created_at').execute().data
    except Exception as exc:
        raise HTTPException(500, str(exc))

@app.post('/cards', status_code=201)
def create_card(card: CardCreate):
    if card.status not in STATUSES:
        raise HTTPException(422, 'Invalid status')
    try:
        return db().table('cards').insert(card.model_dump()).execute().data[0]
    except Exception as exc:
        raise HTTPException(500, str(exc))

@app.patch('/cards/{card_id}')
def update_card(card_id: str, card: CardUpdate):
    changes = card.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(422, 'No changes provided')
    if 'status' in changes and changes['status'] not in STATUSES:
        raise HTTPException(422, 'Invalid status')
    try:
        result = db().table('cards').update(changes).eq('id', card_id).execute().data
        if not result:
            raise HTTPException(404, 'Card not found')
        return result[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(500, str(exc))

@app.delete('/cards/{card_id}', status_code=204)
def delete_card(card_id: str):
    try:
        result = db().table('cards').delete().eq('id', card_id).execute().data
        if not result:
            raise HTTPException(404, 'Card not found')
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(500, str(exc))
