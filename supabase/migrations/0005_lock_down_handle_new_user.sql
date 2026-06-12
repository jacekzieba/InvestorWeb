-- handle_new_user() is a SECURITY DEFINER function meant to run only from the
-- on_auth_user_created trigger, but the default PUBLIC grant exposed it at
-- /rest/v1/rpc/handle_new_user (security advisor 0028/0029). Keep EXECUTE for
-- supabase_auth_admin, which performs the auth.users insert that fires the trigger.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to supabase_auth_admin;
