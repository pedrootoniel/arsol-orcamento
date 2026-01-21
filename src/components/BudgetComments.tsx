import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Send, User, Shield } from 'lucide-react';
import type { BudgetComment } from '../lib/database.types';

interface Props {
  budgetId: string;
  isAdmin: boolean;
}

export function BudgetComments({ budgetId, isAdmin }: Props) {
  const [comments, setComments] = useState<BudgetComment[]>([]);
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

    const { data, error } = await supabase
      .from('budget_comments')
      .insert({
        budget_id: budgetId,
        user_id: user.id,
        content: newComment.trim(),
        is_admin_reply: isAdmin,
      })
      .select()
      .single();

    if (!error && data) {
      setComments([...comments, data]);
      setNewComment('');

      if (!isAdmin) {
        await supabase
          .from('budgets')
          .update({ status: 'revision', updated_at: new Date().toISOString() })
          .eq('id', budgetId);
      }
    }

    setSending(false);
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
            <p className="text-slate-400 text-xs sm:text-sm">
              {isAdmin
                ? 'O cliente pode enviar comentários e solicitações aqui'
                : 'Envie suas dúvidas ou solicitações de ajuste'}
            </p>
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className={`flex ${comment.is_admin_reply ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[90%] sm:max-w-[80%] rounded-xl p-3 sm:p-4 ${
                  comment.is_admin_reply
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white border border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center ${
                      comment.is_admin_reply ? 'bg-emerald-600' : 'bg-slate-100'
                    }`}
                  >
                    {comment.is_admin_reply ? (
                      <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                    ) : (
                      <User className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-500" />
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      comment.is_admin_reply ? 'text-emerald-100' : 'text-slate-500'
                    }`}
                  >
                    {comment.is_admin_reply ? 'Administrador' : 'Cliente'}
                  </span>
                  <span
                    className={`text-xs ${
                      comment.is_admin_reply ? 'text-emerald-200' : 'text-slate-400'
                    }`}
                  >
                    {formatTime(comment.created_at)}
                  </span>
                </div>
                <p className={`text-sm sm:text-base ${comment.is_admin_reply ? 'text-white' : 'text-slate-700'}`}>
                  {comment.content}
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
            placeholder={
              isAdmin
                ? 'Responder ao cliente...'
                : 'Digite sua dúvida ou solicitação...'
            }
            className="flex-1 px-3 sm:px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm sm:text-base"
          />
          <button
            type="submit"
            disabled={sending || !newComment.trim()}
            className="px-3 sm:px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
