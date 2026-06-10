-- Wrap auth.uid() in a scalar subselect so it is evaluated once per query
-- instead of once per row (fixes the auth_rls_initplan advisor). Semantics
-- are unchanged: a row is still only visible to its owner.

-- profiles
alter policy "profiles_select_own" on public.profiles using ((select auth.uid()) = id);
alter policy "profiles_insert_own" on public.profiles with check ((select auth.uid()) = id);
alter policy "profiles_update_own" on public.profiles using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- user_devices
alter policy "user_devices_select_own" on public.user_devices using ((select auth.uid()) = user_id);
alter policy "user_devices_insert_own" on public.user_devices with check ((select auth.uid()) = user_id);
alter policy "user_devices_update_own" on public.user_devices using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter policy "user_devices_delete_own" on public.user_devices using ((select auth.uid()) = user_id);

-- encrypted_records
alter policy "encrypted_records_select_own" on public.encrypted_records using ((select auth.uid()) = user_id);
alter policy "encrypted_records_insert_own" on public.encrypted_records with check ((select auth.uid()) = user_id);
alter policy "encrypted_records_update_own" on public.encrypted_records using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter policy "encrypted_records_delete_own" on public.encrypted_records using ((select auth.uid()) = user_id);

-- encrypted_key_backups
alter policy "encrypted_key_backups_select_own" on public.encrypted_key_backups using ((select auth.uid()) = user_id);
alter policy "encrypted_key_backups_insert_own" on public.encrypted_key_backups with check ((select auth.uid()) = user_id);
alter policy "encrypted_key_backups_update_own" on public.encrypted_key_backups using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter policy "encrypted_key_backups_delete_own" on public.encrypted_key_backups using ((select auth.uid()) = user_id);
