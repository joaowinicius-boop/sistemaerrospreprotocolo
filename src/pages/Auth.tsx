import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, ShieldCheck, ClipboardList, BarChart3, Bell, ArrowRight } from "lucide-react";
import logo from "@/assets/logo-nicolas-gomes.jpg";

const FEATURES = [
  { icon: ClipboardList, title: "Erros de pré-protocolo", desc: "Registro, triagem e resolução em um só lugar" },
  { icon: BarChart3, title: "Prioridades e desempenho", desc: "KPIs da equipe em tempo real" },
  { icon: Bell, title: "Notificações", desc: "Acompanhe o que mudou sem perder nada" },
  { icon: ShieldCheck, title: "Auditoria completa", desc: "Toda ação registrada no histórico" },
];

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Login realizado com sucesso!");
      } else {
        if (!displayName.trim()) {
          toast.error("Informe seu nome.");
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName.trim() } },
        });
        if (error) throw error;
        toast.success("Conta criada com sucesso!");
      }
    } catch (err: any) {
      const msg = err?.message === "Invalid login credentials" ? "E-mail ou senha inválidos" : err.message || "Erro na autenticação.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Painel de marca (desktop) */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 border-r border-border relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{ background: "radial-gradient(ellipse 60% 50% at 20% 10%, hsl(199 89% 48% / 0.15), transparent)" }}
        />
        <div className="relative flex items-center gap-3">
          <img src={logo} alt="Nicolas Gomes" className="w-11 h-11 rounded-full object-cover border-2 border-primary/40" />
          <div>
            <p className="font-bold leading-tight">PRÉ-PROTOCOLO</p>
            <p className="text-xs text-muted-foreground">Nicolas Gomes Advogado</p>
          </div>
        </div>

        <div className="relative max-w-lg">
          <p className="text-[11px] font-medium tracking-[2px] text-muted-foreground uppercase mb-2">Gestão da equipe</p>
          <h1 className="text-4xl font-bold leading-tight mb-3">
            Erros de protocolo sob <span className="text-primary">controle</span>.
          </h1>
          <p className="text-muted-foreground mb-8">
            Registre, priorize e resolva os erros de pré-protocolo com visibilidade total do desempenho da equipe.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-xl border border-border bg-card p-4">
                <f.icon className="w-4 h-4 text-primary mb-2" />
                <p className="text-sm font-semibold">{f.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-muted-foreground">© Nicolas Gomes Advogado — uso interno</p>
      </div>

      {/* Formulário */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex justify-center mb-6">
            <img src={logo} alt="Nicolas Gomes" className="w-16 h-16 rounded-full object-cover border-2 border-primary/40" />
          </div>
          <h2 className="text-2xl font-bold text-center lg:text-left">{isLogin ? "Bem-vindo de volta" : "Criar conta"}</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-8 text-center lg:text-left">
            {isLogin ? "Entre com suas credenciais para acessar o sistema" : "Preencha os dados para se cadastrar"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1.5">
                <Label>Nome completo</Label>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Seu nome" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@nicolasgomesadv.com.br" required />
            </div>
            <div className="space-y-1.5">
              <Label>Senha</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? "Aguarde..." : isLogin ? "Entrar" : "Criar Conta"}
              {!loading && <ArrowRight className="w-4 h-4 ml-1" />}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {isLogin ? "Não tem conta?" : "Já tem conta?"}{" "}
              <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-primary font-medium hover:underline">
                {isLogin ? "Cadastre-se" : "Faça login"}
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;
