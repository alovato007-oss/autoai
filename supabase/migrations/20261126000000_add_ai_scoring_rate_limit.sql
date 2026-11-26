create table if not exists public.ai_scoring_rate_limits (
  user_id uuid primary key references auth.users (id) on delete cascade,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count >= 0)
);

alter table public.ai_scoring_rate_limits enable row level security;
revoke all on table public.ai_scoring_rate_limits from public, anon, authenticated;

create or replace function public.consume_ai_scoring_quota(
  p_limit integer default 10,
  p_window_seconds integer default 3600
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_request_count integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_limit < 1 or p_limit > 100
    or p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'Invalid rate limit configuration';
  end if;

  insert into public.ai_scoring_rate_limits as rate_limit (
    user_id,
    window_started_at,
    request_count
  )
  values (v_user_id, statement_timestamp(), 1)
  on conflict (user_id) do update
  set
    request_count = case
      when rate_limit.window_started_at + make_interval(secs => p_window_seconds) <= statement_timestamp()
        then 1
      else rate_limit.request_count + 1
    end,
    window_started_at = case
      when rate_limit.window_started_at + make_interval(secs => p_window_seconds) <= statement_timestamp()
        then statement_timestamp()
      else rate_limit.window_started_at
    end
  returning request_count into v_request_count;

  return v_request_count <= p_limit;
end;
$$;

revoke all on function public.consume_ai_scoring_quota(integer, integer) from public, anon;
grant execute on function public.consume_ai_scoring_quota(integer, integer) to authenticated;
