-- =============================================================================
-- Wellexus Dev Seed Data
-- Requires a user to exist in auth.users first.
-- Replace <YOUR_USER_ID> with your actual Supabase user UUID.
-- =============================================================================

-- Example: insert a test user row (the trigger does this automatically on signup)
-- insert into public.users (id, email) values ('<YOUR_USER_ID>', 'test@wellexus.app');

-- Seed mood logs for the past 7 days
do $$
declare
  uid uuid := (select id from public.users limit 1);
begin
  if uid is null then
    raise notice 'No users found — sign up first, then re-run seed.sql';
    return;
  end if;

  insert into public.mood_logs (user_id, mood, intensity, date) values
    (uid, 'happy',     4, current_date - 6),
    (uid, 'motivated', 5, current_date - 5),
    (uid, 'anxious',   3, current_date - 4),
    (uid, 'tired',     2, current_date - 3),
    (uid, 'happy',     4, current_date - 2),
    (uid, 'sad',       2, current_date - 1),
    (uid, 'motivated', 4, current_date)
  on conflict do nothing;

  -- Seed a sample plan for today
  insert into public.plans (user_id, mood_log_id, meal, workout, mindfulness, date)
  values (
    uid,
    (select id from public.mood_logs where user_id = uid and date = current_date limit 1),
    '{"id":716429,"title":"Pasta with Garlic, Scallions, Cauliflower & Breadcrumbs","image":"https://img.spoonacular.com/recipes/716429-556x370.jpg","readyInMinutes":45,"servings":2,"calories":543}'::jsonb,
    '{"id":"0001","name":"push-up","bodyPart":"chest","equipment":"body weight","gifUrl":"","target":"pectorals","instructions":["Start in plank.","Lower chest to floor.","Push back up.","Keep core engaged."]}'::jsonb,
    'Take a moment to breathe deeply. Inhale for 4 counts, hold for 4, exhale for 4. Repeat 5 times and feel your body relax.',
    current_date
  )
  on conflict do nothing;

  -- Seed nexi_stats
  insert into public.nexi_stats (user_id, xp, level, streak, last_active)
  values (uid, 45, 1, 7, current_date)
  on conflict (user_id) do update
    set xp = 45, level = 1, streak = 7, last_active = current_date;

  raise notice 'Seed complete for user %', uid;
end;
$$;
