import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, Heart, User } from "lucide-react";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      toast({ title: "Erro ao criar conta", description: error.message, variant: "destructive" });
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md glass-card p-8 text-center space-y-4 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-rose glow-primary">
            <Mail className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="font-heading text-2xl text-foreground">Verifique seu email</h2>
          <p className="text-muted-foreground font-body text-sm">
            Enviamos um link de confirmação para <strong className="text-foreground">{email}</strong>. Clique no link para ativar sua conta.
          </p>
          <Link to="/login" className="inline-block text-primary hover:underline font-body text-sm">
            Voltar ao login
          </Link>
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
          <h1 className="font-heading text-4xl text-gradient-rose">Eternos</h1>
          <p className="text-muted-foreground font-body text-sm">Crie sua conta e comece a planejar</p>
        </div>

        <form onSubmit={handleSignup} className="glass-card p-8 space-y-5">
          <h2 className="font-heading text-2xl text-foreground text-center">Criar Conta</h2>

          <div>
            <label className="text-xs text-muted-foreground font-body uppercase tracking-wider block mb-1.5">Seu Nome</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Como quer ser chamado(a)"
                required
                className="w-full bg-secondary border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground font-body uppercase tracking-wider block mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full bg-secondary border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground font-body uppercase tracking-wider block mb-1.5">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
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
            {loading ? "Criando conta..." : "Criar Conta"}
          </button>

          <p className="text-center text-sm text-muted-foreground font-body">
            Já tem conta?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;
