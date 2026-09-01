-- Le frontend n'a pas accès à auth.users pour retrouver un user_id à partir
-- d'un email. Cette fonction (Super Admin uniquement) le fait de façon
-- sécurisée côté serveur.
--
-- Vérifié réellement : appelée avec un vrai email existant -> membre staff
-- réellement créé en base ; nettoyage effectué après test.
CREATE OR REPLACE FUNCTION add_staff_member_by_email(p_email text, p_role_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  IF NOT is_platform_admin() THEN
    RETURN jsonb_build_object('error', 'Réservé au Super Admin');
  END IF;

  SELECT id INTO target_user_id FROM auth.users WHERE email = p_email;
  IF target_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Aucun compte trouvé avec cet email');
  END IF;

  INSERT INTO staff_members (user_id, role_id, added_by)
  VALUES (target_user_id, p_role_id, auth.uid())
  ON CONFLICT (user_id) DO UPDATE SET role_id = excluded.role_id;

  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION add_staff_member_by_email(text, uuid) TO authenticated;
