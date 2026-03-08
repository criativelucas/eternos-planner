import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Mail, ArrowLeft } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md glass-card p-8 text-center space-y-4 animate-fade-in">
          <Mail className="w-12 h-12 text-primary mx-auto" />
          <h2 className="font-heading text-2xl text-foreground">Email enviado</h2>
          <p className="text-muted-foreground font-body text-sm">
            Verifique sua caixa de entrada em <strong className="text-foreground">{email}</strong>.
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
        <form onSubmit={handleSubmit} className="glass-card p-8 space-y-5">
          <Link to="/login" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground font-body">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>
          <h2 className="font-heading text-2xl text-foreground">Recuperar Senha</h2>
          <p className="text-sm text-muted-foreground font-body">Informe seu email para receber o link de redefinição.</p>

          <div>
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

          <button
            type="submit"
            disabled={loading}
            className="w-full gradient-rose text-primary-foreground font-body font-medium py-3 rounded-lg disabled:opacity-50"
          >
            {loading ? "Enviando..." : "Enviar Link"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
