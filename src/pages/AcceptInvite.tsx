import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Heart, Lock } from "lucide-react";

const AcceptInvite = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    // Listen for auth state changes (the invite link sets a recovery/invite session)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth event on accept-invite:", event);
      if (session) {
        setHasSession(true);
        setCheckingSession(false);

        // If this is an existing user who already has a password, just accept and redirect
        if (event === "SIGNED_IN") {
          await acceptInvite(session.user.id);
          navigate("/", { replace: true });
        }
      } else {
        setCheckingSession(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setHasSession(true);
      }
      setCheckingSession(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const acceptInvite = async (userId: string) => {
    try {
      await supabase.rpc("accept_couple_invite", { _user_id: userId });
      toast({ title: "Convite aceito! 💍", description: "Agora vocês podem planejar juntos!" });
    } catch (err) {
      console.error("Error accepting invite:", err);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "Senha muito curta", description: "Use pelo menos 6 caracteres.", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast({ title: "Erro ao definir senha", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    if (data.user) {
      await acceptInvite(data.user.id);
    }

    toast({ title: "Conta configurada! ✨" });
    navigate("/", { replace: true });
    setLoading(false);
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground font-body animate-pulse">Processando convite...</p>
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md glass-card p-8 text-center space-y-4 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-rose glow-primary">
            <Heart className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="font-heading text-2xl text-foreground">Link expirado</h2>
          <p className="text-muted-foreground font-body text-sm">
            Este link de convite expirou ou é inválido. Peça ao seu parceiro(a) para enviar um novo convite.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="gradient-rose text-primary-foreground font-body font-medium px-6 py-2.5 rounded-lg text-sm"
          >
            Ir para Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-rose glow-primary">
            <Heart className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-heading text-3xl text-gradient-rose">Bem-vindo(a)!</h1>
          <p className="text-muted-foreground font-body text-sm">
            Você foi convidado(a) para planejar um casamento juntos. Defina sua senha para continuar.
          </p>
        </div>

        <form onSubmit={handleSetPassword} className="glass-card p-8 space-y-5">
          <h2 className="font-heading text-xl text-foreground text-center">Defina sua senha</h2>

          <div>
            <label className="text-xs text-muted-foreground font-body uppercase tracking-wider block mb-1.5">
              Nova Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                className="w-full bg-secondary border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full gradient-rose text-primary-foreground font-body font-medium py-3 rounded-lg disabled:opacity-50 transition-opacity"
          >
            {loading ? "Configurando..." : "Entrar no Planejamento 💍"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AcceptInvite;
