const { Client } = require('pg');

const client = new Client({
    // aws-0-ap-northeast-2.pooler.supabase.com의 IP 중 하나를 직접 사용
    host: '15.165.245.138',
    port: 6543,
    user: 'postgres.skfsvydgwcntxtmyfaci',
    password: 'dkvkxm806!@',
    database: 'postgres',
    ssl: {
        rejectUnauthorized: false
    }
});

const sql = `
create table if not exists locales (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  description text,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists places (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  category text,
  description text,
  address text,
  image_url text,
  rating decimal,
  map_url text,
  latitude decimal,
  longitude decimal,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists courses (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  locale_id uuid references locales(id) on delete cascade,
  theme text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists course_places (
  id uuid default gen_random_uuid() primary key,
  course_id uuid references courses(id) on delete cascade,
  place_id uuid references places(id) on delete cascade,
  sequence_order int not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (course_id, sequence_order)
);

alter table locales enable row level security;
alter table places enable row level security;
alter table courses enable row level security;
alter table course_places enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Allow public read-only access' and tablename = 'locales') then
    create policy "Allow public read-only access" on locales for select using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow public read-only access' and tablename = 'places') then
    create policy "Allow public read-only access" on places for select using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow public read-only access' and tablename = 'courses') then
    create policy "Allow public read-only access" on courses for select using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow public read-only access' and tablename = 'course_places') then
    create policy "Allow public read-only access" on course_places for select using (true);
  end if;
end
$$;
`;

async function setup() {
    try {
        await client.connect();
        console.log('Connected to Supabase DB');
        await client.query(sql);
        console.log('Database schema created successfully');
    } catch (err) {
        console.error('Error creating database schema:', err);
    } finally {
        await client.end();
    }
}

setup();
