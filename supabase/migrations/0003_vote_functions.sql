-- Votos de descuentos: funciones SECURITY DEFINER para que un usuario común
-- pueda votar (upsert en discount_votes vía RLS) y que los contadores
-- denormalizados en discounts (upvotes/downvotes) se actualicen aunque la RLS
-- de discounts sea solo-admin. Los contadores se recalculan desde los votos
-- (evita drift).

create or replace function public.vote_discount(p_discount_id uuid, p_vote text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'no autenticado'; end if;
  if p_vote not in ('up', 'down') then raise exception 'voto inválido'; end if;

  insert into public.discount_votes (user_id, discount_id, vote)
  values (v_user, p_discount_id, p_vote)
  on conflict (user_id, discount_id)
    do update set vote = excluded.vote, created_at = now();

  update public.discounts d set
    upvotes = (select count(*) from public.discount_votes v
               where v.discount_id = p_discount_id and v.vote = 'up'),
    downvotes = (select count(*) from public.discount_votes v
                 where v.discount_id = p_discount_id and v.vote = 'down'),
    updated_at = now()
  where d.id = p_discount_id;
end;
$$;

create or replace function public.remove_vote(p_discount_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'no autenticado'; end if;

  delete from public.discount_votes
  where user_id = v_user and discount_id = p_discount_id;

  update public.discounts d set
    upvotes = (select count(*) from public.discount_votes v
               where v.discount_id = p_discount_id and v.vote = 'up'),
    downvotes = (select count(*) from public.discount_votes v
                 where v.discount_id = p_discount_id and v.vote = 'down'),
    updated_at = now()
  where d.id = p_discount_id;
end;
$$;

grant execute on function public.vote_discount(uuid, text) to authenticated;
grant execute on function public.remove_vote(uuid) to authenticated;
