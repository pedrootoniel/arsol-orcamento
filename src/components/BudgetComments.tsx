import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { Send } from "lucide-react";

export function BudgetComments({ budgetId }: { budgetId: string }) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [sending, setSending] = useState(false);

const loadComments = async () => {
  const { data, error } = await supabase
    .from("budget_comments")
    .select(`
      *,
      profiles:user_id ( name )
    `) // Usar profiles:user_id força o Supabase a entender a relação
    .eq("budget_id", budgetId)
    .order("created_at", { ascending: true });

  if (error) console.error("Erro:", error.message);
  else setComments(data || []);
};

  useEffect(() => { loadComments(); }, [budgetId]);

  const sendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || sending) return;

    setSending(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("budget_comments")
      .insert({
        budget_id: budgetId,
        user_id: user?.id,
        comment: newComment.trim(),
        is_internal: false
      });

    if (!error) {
      setNewComment("");
      loadComments();
    }
    setSending(false);
  };

  return (
    <div className="flex flex-col h-[400px] bg-white rounded-lg border border-slate-200">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {comments.map((c) => (
          <div key={c.id} className="flex flex-col gap-1">
            <span className="text-xs font-bold text-slate-600">
              {c.profiles?.name || "Usuário"}
            </span>
            <div className="bg-slate-100 p-2 rounded-lg text-sm">
              {c.comment}
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={sendComment} className="p-4 border-t flex gap-2">
        <input
          className="flex-1 px-3 py-2 border rounded-md outline-none focus:ring-2 focus:ring-emerald-500"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Digite seu comentário..."
        />
        <button 
          disabled={sending}
          className="bg-emerald-500 text-white p-2 rounded-md hover:bg-emerald-600 disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}