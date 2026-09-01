/*
# Système Staff/Rôles réel — remplace le module qui avait été retiré car
purement décoratif. Cette fois, réellement persisté ET réellement appliqué
(pas juste une UI de gestion sans effet).

## Modèle
- staff_roles: rôles configurables par le Super Admin (nom, description,
  permissions par module en jsonb)
- staff_members: association user_id <-> rôle, gérée par le Super Admin
- has_staff_permission(module, action): fonction utilisée par les policies
  RLS pour vérifier si l'utilisateur courant (super admin OU membre staff
  avec la permission adéquate) peut agir.

## Application réelle (pas décorative)
Étend les policies UPDATE de seller_documents et return_requests pour
accepter aussi un staff qualifié, pas seulement is_platform_admin().

## Vérifié réellement
has_staff_permission() confirmé via fonction de debug temporaire
(SECURITY DEFINER) retourne true pour un staff qualifié ne connaissant pas
is_platform_admin(). Nettoyage complet effectué après tests.
*/

CREATE TABLE IF NOT EXISTS staff_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  permissions jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staff_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES staff_roles(id) ON DELETE RESTRICT,
  added_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE staff_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_staff_roles" ON staff_roles;
CREATE POLICY "admin_manage_staff_roles" ON staff_roles FOR ALL
  TO authenticated USING (is_platform_admin()) WITH CHECK (is_platform_admin());

DROP POLICY IF EXISTS "staff_read_roles" ON staff_roles;
CREATE POLICY "staff_read_roles" ON staff_roles FOR SELECT
  TO authenticated USING (
    is_platform_admin() OR EXISTS (SELECT 1 FROM staff_members sm WHERE sm.user_id = (select auth.uid()))
  );

DROP POLICY IF EXISTS "admin_manage_staff_members" ON staff_members;
CREATE POLICY "admin_manage_staff_members" ON staff_members FOR ALL
  TO authenticated USING (is_platform_admin()) WITH CHECK (is_platform_admin());

DROP POLICY IF EXISTS "staff_read_own_membership" ON staff_members;
CREATE POLICY "staff_read_own_membership" ON staff_members FOR SELECT
  TO authenticated USING (user_id = (select auth.uid()) OR is_platform_admin());

CREATE OR REPLACE FUNCTION has_staff_permission(p_module text, p_action text)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  perms jsonb;
  perm jsonb;
BEGIN
  IF is_platform_admin() THEN
    RETURN true;
  END IF;

  SELECT sr.permissions INTO perms
  FROM staff_members sm
  JOIN staff_roles sr ON sr.id = sm.role_id
  WHERE sm.user_id = auth.uid();

  IF perms IS NULL THEN
    RETURN false;
  END IF;

  FOR perm IN SELECT * FROM jsonb_array_elements(perms)
  LOOP
    IF perm->>'module' = p_module AND coalesce((perm->>p_action)::boolean, false) THEN
      RETURN true;
    END IF;
  END LOOP;

  RETURN false;
END;
$$;

GRANT EXECUTE ON FUNCTION has_staff_permission(text, text) TO authenticated;

DROP POLICY IF EXISTS "seller_update_own_documents" ON seller_documents;
CREATE POLICY "seller_update_own_documents" ON seller_documents FOR UPDATE
  TO authenticated
  USING (
    seller_id IN (SELECT id FROM sellers WHERE user_id = (select auth.uid()))
    OR has_staff_permission('kyc', 'write')
  )
  WITH CHECK (
    seller_id IN (SELECT id FROM sellers WHERE user_id = (select auth.uid()))
    OR has_staff_permission('kyc', 'write')
  );

CREATE OR REPLACE FUNCTION protect_document_status_field()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (is_platform_admin() OR has_staff_permission('kyc', 'write')) THEN
    NEW.status := OLD.status;
  END IF;
  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS "admin_manage_returns" ON return_requests;
CREATE POLICY "admin_manage_returns" ON return_requests FOR ALL
  TO authenticated
  USING (is_platform_admin() OR has_staff_permission('disputes', 'write'))
  WITH CHECK (is_platform_admin() OR has_staff_permission('disputes', 'write'));

CREATE OR REPLACE FUNCTION protect_return_decision_fields()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_seller boolean;
BEGIN
  IF is_platform_admin() OR has_staff_permission('disputes', 'write') THEN
    RETURN NEW;
  END IF;
  is_seller := EXISTS (SELECT 1 FROM sellers WHERE id = OLD.seller_id AND user_id = auth.uid());
  IF NOT is_seller THEN
    NEW := OLD;
  END IF;
  RETURN NEW;
END;
$$;

INSERT INTO staff_roles (name, description, permissions) VALUES
  ('Support', 'Customer support agents', '[{"module":"sellers","read":true,"write":false,"delete":false},{"module":"products","read":true,"write":false,"delete":false},{"module":"disputes","read":true,"write":true,"delete":false}]'),
  ('KYC Verifier', 'Verify seller documents', '[{"module":"kyc","read":true,"write":true,"delete":false}]'),
  ('Product Moderator', 'Moderate product listings', '[{"module":"products","read":true,"write":true,"delete":true}]'),
  ('Ads Manager', 'Manage ad slots and campaigns', '[{"module":"ads","read":true,"write":true,"delete":true}]')
ON CONFLICT (name) DO NOTHING;
