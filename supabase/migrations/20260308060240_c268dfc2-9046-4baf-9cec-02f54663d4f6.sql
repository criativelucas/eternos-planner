-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add user_id and partner_id to wedding_config
ALTER TABLE public.wedding_config ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.wedding_config ADD COLUMN partner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add config_id to wedding_items to link items to a specific wedding
ALTER TABLE public.wedding_items ADD COLUMN config_id UUID REFERENCES public.wedding_config(id) ON DELETE CASCADE;

-- Security definer function to check couple access (avoids recursion)
CREATE OR REPLACE FUNCTION public.has_wedding_access(_user_id UUID, _config_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.wedding_config
    WHERE id = _config_id
    AND (user_id = _user_id OR partner_id = _user_id)
  )
$$;

-- Function to get user's config id
CREATE OR REPLACE FUNCTION public.get_user_config_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.wedding_config
  WHERE user_id = _user_id OR partner_id = _user_id
  LIMIT 1
$$;

-- Drop old permissive policies
DROP POLICY IF EXISTS "Allow all access to wedding_config" ON public.wedding_config;
DROP POLICY IF EXISTS "Allow all access to wedding_items" ON public.wedding_items;

-- New RLS for wedding_config: owner or partner can access
CREATE POLICY "Users can view own wedding config" ON public.wedding_config
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = partner_id);

CREATE POLICY "Users can update own wedding config" ON public.wedding_config
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = partner_id);

CREATE POLICY "Users can insert own wedding config" ON public.wedding_config
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- New RLS for wedding_items: check couple access via config_id
CREATE POLICY "Users can view wedding items" ON public.wedding_items
  FOR SELECT USING (public.has_wedding_access(auth.uid(), config_id));

CREATE POLICY "Users can insert wedding items" ON public.wedding_items
  FOR INSERT WITH CHECK (public.has_wedding_access(auth.uid(), config_id));

CREATE POLICY "Users can update wedding items" ON public.wedding_items
  FOR UPDATE USING (public.has_wedding_access(auth.uid(), config_id));

CREATE POLICY "Users can delete wedding items" ON public.wedding_items
  FOR DELETE USING (public.has_wedding_access(auth.uid(), config_id));

-- Create couple_invites table for partner invitations
CREATE TABLE public.couple_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  config_id UUID NOT NULL REFERENCES public.wedding_config(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_email TEXT NOT NULL,
  accepted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.couple_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage invites" ON public.couple_invites
  FOR ALL USING (auth.uid() = invited_by);

CREATE POLICY "Invited user can view invite" ON public.couple_invites
  FOR SELECT USING (invite_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Function to accept invite (called after login)
CREATE OR REPLACE FUNCTION public.accept_couple_invite(_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _email TEXT;
  _invite RECORD;
BEGIN
  SELECT email INTO _email FROM auth.users WHERE id = _user_id;
  
  SELECT * INTO _invite FROM public.couple_invites
  WHERE invite_email = _email AND accepted = false
  LIMIT 1;
  
  IF _invite IS NOT NULL THEN
    UPDATE public.wedding_config SET partner_id = _user_id WHERE id = _invite.config_id;
    UPDATE public.couple_invites SET accepted = true WHERE id = _invite.id;
  END IF;
END;
$$;