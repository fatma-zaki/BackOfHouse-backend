/*
# Apply RLS policies on core tables

Now that all core tables exist, we add cross-table RLS policies.
- Users: read/update own profile, insert own profile
- Companies: read active companies or member companies; update by company admin
- Company members: read own or fellow members; insert own; delete own
- Professionals: read public or own; insert/update/delete own
*/

-- Users policies
DROP POLICY IF EXISTS "users_select_own" ON users;
CREATE POLICY "users_select_own"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "users_update_own" ON users;
CREATE POLICY "users_update_own"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = auth_user_id)
WITH CHECK (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "users_insert_own" ON users;
CREATE POLICY "users_insert_own"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = auth_user_id);

-- Companies policies
DROP POLICY IF EXISTS "companies_select_all" ON companies;
CREATE POLICY "companies_select_all"
ON companies FOR SELECT
TO authenticated
USING (
  status = 'active' OR EXISTS (
    SELECT 1 FROM company_members cm WHERE cm.company_id = companies.id AND cm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "companies_insert_member" ON companies;
CREATE POLICY "companies_insert_member"
ON companies FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "companies_update_admin" ON companies;
CREATE POLICY "companies_update_admin"
ON companies FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM company_members cm
    WHERE cm.company_id = companies.id AND cm.user_id = auth.uid() AND cm.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM company_members cm
    WHERE cm.company_id = companies.id AND cm.user_id = auth.uid() AND cm.role = 'admin'
  )
);

-- Company members policies
DROP POLICY IF EXISTS "company_members_select" ON company_members;
CREATE POLICY "company_members_select"
ON company_members FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM company_members cm2
    WHERE cm2.company_id = company_members.company_id AND cm2.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "company_members_insert_own" ON company_members;
CREATE POLICY "company_members_insert_own"
ON company_members FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "company_members_delete_own" ON company_members;
CREATE POLICY "company_members_delete_own"
ON company_members FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Professionals policies
DROP POLICY IF EXISTS "professionals_select" ON professionals;
CREATE POLICY "professionals_select"
ON professionals FOR SELECT
TO authenticated
USING (
  profile_visibility = 'public' OR user_id = auth.uid()
);

DROP POLICY IF EXISTS "professionals_insert_own" ON professionals;
CREATE POLICY "professionals_insert_own"
ON professionals FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "professionals_update_own" ON professionals;
CREATE POLICY "professionals_update_own"
ON professionals FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "professionals_delete_own" ON professionals;
CREATE POLICY "professionals_delete_own"
ON professionals FOR DELETE
TO authenticated
USING (user_id = auth.uid());
