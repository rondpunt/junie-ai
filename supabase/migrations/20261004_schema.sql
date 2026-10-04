-- Supabase Schema for Nexus AI (Chat App)

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Projects table
create table projects (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) not null,
    name text not null,
    created_at timestamp with time zone default now()
);

-- Chats table
create table chats (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) not null,
    project_id uuid references projects(id),
    title text not null default 'Nieuw gesprek',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Messages table
create table messages (
    id uuid primary key default uuid_generate_v4(),
    chat_id uuid references chats(id) on delete cascade not null,
    user_id uuid references auth.users(id) not null,
    role text not null check (role in ('user', 'assistant', 'system')),
    content text not null,
    created_at timestamp with time zone default now()
);

-- Memory / RAG (Documents & Chat embeddings)
-- Requires pgvector extension for Supabase
create extension if not exists vector;

create table memories (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) not null,
    project_id uuid references projects(id),
    content text not null,
    embedding vector(768), -- adjust based on embedding model, 768 is common for nomic-embed-text / mxbai
    created_at timestamp with time zone default now()
);

-- RLS (Row Level Security)
alter table projects enable row level security;
alter table chats enable row level security;
alter table messages enable row level security;
alter table memories enable row level security;

create policy "Users can only see their own projects" on projects for all using (auth.uid() = user_id);
create policy "Users can only see their own chats" on chats for all using (auth.uid() = user_id);
create policy "Users can only see their own messages" on messages for all using (auth.uid() = user_id);
create policy "Users can only see their own memories" on memories for all using (auth.uid() = user_id);
