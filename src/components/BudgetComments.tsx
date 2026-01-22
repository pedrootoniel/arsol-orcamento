import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Send, User, Shield } from 'lucide-react';
import type { BudgetComment } from '../lib/database.types';

interface Props {
  budgetId: string;
  isAdmin: boolean;
}

export function BudgetComments({ budgetId, isAdmin }: Props) {
  const [comments, setComments] = useState<any[]>([]); // Alterado para any para aceitar o mock de profiles
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadComments();
  }, [budgetId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments]);

  const loadComments = async () => {
    const { data } = await supabase
      .from('budget_comments')
      .select('*')
      .eq('budget_id', budgetId)
      .order('created_at', { ascending: true });

    if (data) setComments(data);
    setLoading(false);
  };

  const sendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSending(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSending(false);
      return;
    }

    // 1. Inserimos usando a coluna 'comment' (conforme seu banco de dados)
    const { data: insertedData, error: insertError } = await supabase
      .from('budget_comments')
      .insert({
        budget_id: budgetId,
        user_id: user.id,
        comment: newComment.trim(), 
        is_internal: isAdmin, // is_internal identifica se é admin
      })
      .select()
      .single();

    if (insertError) {
      console.error("Erro ao inserir:", insertError.message);
      setSending(false);
      return;
    }

    if (insertedData) {
      // 2. Atualizamos a lista local imediatamente
      setComments([...comments, insertedData]);
      setNewComment('');
    }
    
    setSending(false);

    // 3. Update de data no orçamento
    await supabase
      .from('budgets')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', budgetId);
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-slate-400">Carregando comentários...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <p className="text-slate-500 text-sm sm:text-base">Nenhum comentário ainda</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              // Correção: is_internal define se o balão vai para a direita (admin) ou esquerda (cliente)
              className={`flex ${comment.is_internal ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[90%] sm:max-w-[80%] rounded-xl p-3 sm:p-4 ${
                  comment.is_internal
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white border border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center ${
                      comment.is_internal ? 'bg-emerald-600' : 'bg-slate-100'
                    }`}
                  >
                    {comment.is_internal ? (
                      <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                    ) : (
                      <User className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-500" />
                    )}
                  </div>
                  <span className={`text-xs font-medium ${comment.is_internal ? 'text-emerald-100' : 'text-slate-500'}`}>
                    {comment.is_internal ? 'Administrador' : 'Cliente'}
                  </span>
                  <span className={`text-xs ${comment.is_internal ? 'text-emerald-200' : 'text-slate-400'}`}>
                    {formatTime(comment.created_at)}
                  </span>
                </div>
                {/* CORREÇÃO AQUI: Mudado de comment.content para comment.comment */}
                <p className={`text-sm sm:text-base ${comment.is_internal ? 'text-white' : 'text-slate-700'}`}>
                  {comment.comment}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={sendComment} className="p-3 sm:p-4 bg-white border-t border-slate-200">
        <div className="flex gap-2 sm:gap-3">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={isAdmin ? 'Responder ao cliente...' : 'Digite sua dúvida...'}
            className="flex-1 px-3 sm:px-4 py-2 border border-slate-300 rounded-lg outline-none text-sm"
          />
          <button
            type="submit"
            disabled={sending || !newComment.trim()}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}