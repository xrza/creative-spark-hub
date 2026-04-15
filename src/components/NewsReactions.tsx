/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const REACTIONS = [
    { key: 'like',  emoji: '👍', label: 'Нравится' },
    { key: 'love',  emoji: '❤️', label: 'Люблю' },
    { key: 'wow',   emoji: '😮', label: 'Вау' },
    { key: 'sad',   emoji: '😢', label: 'Грустно' },
    { key: 'angry', emoji: '😡', label: 'Злюсь' },
];

interface Props { newsId: string; }

export function NewsReactions({ newsId }: Props) {
    const [user, setUser] = useState<any>(null);
    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    }, []);

    const [counts, setCounts] = useState<Record<string, number>>({});
    const [myReaction, setMyReaction] = useState<string | null>(null);

    useEffect(() => {
        fetchReactions();
    }, [newsId]);

    async function fetchReactions() {
        const { data } = await (supabase as any)
            .from('news_reactions')
            .select('reaction, user_id')
            .eq('news_id', newsId);

        if (!data) return;
        const c: Record<string, number> = {};
        data.forEach((r: any) => { c[r.reaction] = (c[r.reaction] || 0) + 1; });
        setCounts(c);
        if (user) {
            const mine = data.find((r: any) => r.user_id === user.id);
            setMyReaction(mine?.reaction || null);
        }
    }

    async function handleReaction(key: string) {
        if (!user) return alert('Войдите, чтобы ставить реакции');

        if (myReaction === key) {
            await (supabase as any).from('news_reactions')
                .delete().eq('news_id', newsId).eq('user_id', user.id);
        } else if (myReaction) {
            await (supabase as any).from('news_reactions')
                .update({ reaction: key })
                .eq('news_id', newsId).eq('user_id', user.id);
        } else {
            await (supabase as any).from('news_reactions')
                .insert({ news_id: newsId, user_id: user.id, reaction: key });
        }
        fetchReactions();
    }

    return (
        <div className="flex flex-wrap gap-2 mt-4">
            {REACTIONS.map(r => (
                <button
                    key={r.key}
                    onClick={() => handleReaction(r.key)}
                    title={r.label}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full border text-sm transition
            ${myReaction === r.key
                        ? 'bg-blue-100 border-blue-400 text-blue-700 font-semibold'
                        : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'}`}
                >
                    <span>{r.emoji}</span>
                    {counts[r.key] ? <span>{counts[r.key]}</span> : null}
                </button>
            ))}
        </div>
    );
}