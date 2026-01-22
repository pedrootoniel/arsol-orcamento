import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Send } from "lucide-react";

export function BudgetComments({ budgetId }: { budgetId: string }) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);

const loadComments = async () => {
  try {
    // O '!' força o uso do relacionamento correto para evitar o erro 400
    const { data, error } = await supabase
      .from("budget_comments")
      .select(`
        id,
        comment,
        created_at,
        profiles!user_id (
          name
        )
      `)
      .eq("budget_id", budgetId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Erro no Supabase:", error.message);
      return;
    }
    
    setComments(data || []);
  } catch (error: any) {
    console.error("Erro ao carregar:", error.message);
  }
};

  useEffect(() => {
    loadComments();
    
    // Configura o Tempo Real para as mensagens aparecerem instantaneamente
    const subscription = supabase
      .channel(`chat-${budgetId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'budget_comments' }, () => {
        loadComments();
      })
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, [budgetId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || loading) return;

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { error } = await supabase.from("budget_comments").insert({
        budget_id: budgetId,
        user_id: user.id,
        comment: newComment.trim()
      });

      if (!error) {
        setNewComment("");
        loadComments();
      } else {
        alert("Erro ao enviar: " + error.message);
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[450px] bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {comments.length === 0 ? (
          <p className="text-center text-slate-400 text-sm mt-10">Nenhuma mensagem ainda.</p>
        ) : (
          comments.map((msg) => (
            <div key={msg.id} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-600">{msg.profiles?.name || "Usuário"}</span>
                <span className="text-[10px] text-slate-400">{new Date(msg.created_at).toLocaleTimeString()}</span>
              </div>
              <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-200 text-sm shadow-sm max-w-[85%]">
                {msg.comment}
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSend} className="p-3 bg-white border-t flex gap-2">
        <input
          className="flex-1 bg-slate-100 border-none rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          placeholder="Digite sua mensagem..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <button 
          disabled={loading || !newComment.trim()}
          className="bg-emerald-500 text-white p-2 rounded-full hover:bg-emerald-600 disabled:opacity-50 transition-colors shadow-md"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}