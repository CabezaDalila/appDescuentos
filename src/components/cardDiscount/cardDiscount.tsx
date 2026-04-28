import { useAuth } from "@/hooks/useAuth";
import { isLocationPermissionEnabled } from "@/hooks/useGeolocation";
import {
  getUserInteraction,
  toggleFavorite as toggleFavoriteInteraction,
} from "@/lib/firebase/interactions";
import {
  bankDisplayName,
  bankInitialsAvatar,
  resolveBankLogoPath,
} from "@/utils/bank-logo";
import { normalizeBankKey } from "@/utils/membership-match";
import { cn } from "@/utils/css";
import { CreditCard, Sparkles, Users } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Badge } from "../Share/badge";

interface CredentialRow {
  bank: string;
  type: string;
  brand: string;
  level: string;
}

interface CardDiscountProps {
  id?: string;
  title: string;
  image: string;
  description: string;
  availableMemberships?: string[];
  availableCredentials?: CredentialRow[];
  category: string;
  points: number;
  countComments: number;
  distance: string;
  expiration: string;
  discountPercentage: string;
  discountAmount?: number;
  terms?: string;
  renderVote?: React.ReactNode;
}

function dedupeCredentials(rows: CredentialRow[]): CredentialRow[] {
  const seen = new Set<string>();
  const out: CredentialRow[] = [];
  for (const c of rows) {
    const k = `${c.type}|${c.brand}|${c.level}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(c);
  }
  return out;
}

const CardDiscount: React.FC<CardDiscountProps> = ({
  id,
  title,
  image,
  description,
  availableMemberships,
  availableCredentials,
  category,
  points,
  countComments: _countComments,
  distance,
  expiration,
  discountPercentage,
  discountAmount,
  terms,
  renderVote,
}) => {
  const rawHighlights = description
    ? description
        .split("·")
        .map((part) => part.trim())
        .filter(Boolean)
    : [];
  const highlights: string[] = [];
  for (let index = 0; index < rawHighlights.length; index++) {
    const line = rawHighlights[index];
    const nextLine = rawHighlights[index + 1];

    if (/^exclusivo con$/i.test(line) && nextLine && /^con\s+/i.test(nextLine)) {
      highlights.push(`Exclusivo ${nextLine}`);
      index++;
      continue;
    }
    if (/^exclusivo con$/i.test(line)) {
      continue;
    }

    highlights.push(line);
  }
  const normalizedTerms = (terms || "").toLowerCase();
  const hasTopeInHighlights = highlights.some((line) =>
    /tope|sin tope/i.test(line)
  );

  const credentialsByBank = useMemo(() => {
    const list = availableCredentials ?? [];
    const map = new Map<string, CredentialRow[]>();
    for (const c of list) {
      const key =
        normalizeBankKey(c.bank) || c.bank.trim().toLowerCase() || c.bank;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return [...map.entries()].sort(([a], [b]) =>
      a.localeCompare(b, "es", { sensitivity: "base" })
    );
  }, [availableCredentials]);

  const HIGHLIGHT_PREVIEW = 2;
  const [highlightsExpanded, setHighlightsExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [isSharing, setIsSharing] = useState(false);
  const { user } = useAuth();

  const highlightsToShow =
    highlightsExpanded || highlights.length <= HIGHLIGHT_PREVIEW
      ? highlights
      : highlights.slice(0, HIGHLIGHT_PREVIEW);
  const highlightsHiddenCount = Math.max(
    0,
    highlights.length - HIGHLIGHT_PREVIEW
  );

  useEffect(() => {
    const loadFavorite = async () => {
      if (!user || !id) {
        setIsLiked(false);
        return;
      }

      try {
        const interaction = await getUserInteraction(user.uid, id);
        setIsLiked(!!interaction?.favorite);
      } catch (error) {
        console.error("Error cargando favorito del descuento:", error);
        setIsLiked(false);
      }
    };

    loadFavorite();
  }, [user, id]);

  const handleLike = async () => {
    if (!id) {
      return;
    }

    if (!user) {
      toast.error("Debes iniciar sesión para guardar favoritos");
      return;
    }

    try {
      const nowLiked = await toggleFavoriteInteraction(user.uid, id);
      setIsLiked(nowLiked);
    } catch (error) {
      console.error("Error al actualizar favorito:", error);
      toast.error("No se pudo guardar tu favorito. Intenta nuevamente.");
    }
  };

  const handleShare = async () => {
    if (isSharing) {
      return;
    }

    try {
      setIsSharing(true);

      if (navigator.share) {
        await navigator.share({
          title: title,
          text: description,
          url: window.location.href,
        });
      } else {
        const shareText = `${title}\n\n${description}\n\n${window.location.href}`;
        await navigator.clipboard.writeText(shareText);
        toast.success("Enlace copiado al portapapeles");
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("Error al compartir:", error);
        try {
          const shareText = `${title}\n\n${description}\n\n${window.location.href}`;
          await navigator.clipboard.writeText(shareText);
          toast.success("Enlace copiado al portapapeles");
        } catch {
          toast.error("No se pudo compartir el descuento");
        }
      }
    } finally {
      setIsSharing(false);
    }
  };

  const hasMemberships =
    Array.isArray(availableMemberships) && availableMemberships.length > 0;
  const hasCredentials =
    Array.isArray(availableCredentials) && availableCredentials.length > 0;
  const noRequirements = !hasMemberships && !hasCredentials;

  const multiBankScroll =
    credentialsByBank.length > 1
      ? "flex overflow-x-auto snap-x snap-mandatory gap-2 pb-0.5 -mx-1 px-1 sm:flex-wrap sm:overflow-x-visible sm:pb-0"
      : "flex flex-col gap-2";

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
      <div className="relative h-40 w-full shrink-0 sm:h-44">
        <Image
          src={image}
          alt=""
          fill
          className="object-cover"
          priority={false}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/35" />

        <div className="absolute left-2 right-2 top-2 z-10 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {discountPercentage ? (
              <Badge className="border-0 bg-gradient-to-r from-purple-600 to-purple-500 px-2 py-0.5 text-xs font-bold text-white shadow-md">
                {discountPercentage}
              </Badge>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-0.5 rounded-full bg-white/95 py-0.5 pl-1 pr-0.5 shadow-md ring-1 ring-black/5 backdrop-blur-sm">
            {renderVote ? (
              <span className="flex scale-90 items-center">{renderVote}</span>
            ) : null}
            <button
              type="button"
              onClick={handleShare}
              disabled={isSharing}
              className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-gray-100 disabled:opacity-50"
              aria-label="Compartir"
            >
              <Image src="/share.png" alt="" width={16} height={16} />
            </button>
            <button
              type="button"
              onClick={handleLike}
              className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
              aria-label={isLiked ? "Quitar favorito" : "Guardar favorito"}
            >
              <Image
                src={isLiked ? "/loveRed.png" : "/love.png"}
                alt=""
                width={16}
                height={16}
              />
            </button>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-3 pb-2 pt-10">
          <h1 className="text-base font-bold leading-tight text-white drop-shadow-sm line-clamp-2 sm:text-lg">
            {title}
          </h1>
          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="max-w-[72%] truncate rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm sm:text-[11px]">
              {category}
            </span>
            <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium text-white sm:text-[11px]">
              <Image src="/star.png" alt="" width={10} height={10} />
              {points}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2.5 p-3 sm:p-3.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-600 sm:text-xs">
          {isLocationPermissionEnabled() && distance && distance !== "" && (
            <span className="inline-flex items-center gap-1">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-50">
                <Image src="/distance.png" alt="" width={11} height={11} />
              </span>
              <span className="max-w-[42vw] truncate sm:max-w-none">{distance}</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-50">
              <Image src="/expiration.png" alt="" width={11} height={11} />
            </span>
            <span>{expiration}</span>
          </span>
        </div>

        {highlights.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-gray-50/90 p-2.5 shadow-sm">
            <ul className="space-y-1">
              {highlightsToShow.map((line, idx) => (
                <li
                  key={`${idx}-${line.slice(0, 48)}`}
                  className="flex gap-2 text-[11px] leading-snug text-gray-800 sm:text-xs"
                >
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-purple-500" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            {highlightsHiddenCount > 0 ? (
              <button
                type="button"
                className="mt-1.5 text-left text-[11px] font-semibold text-purple-600 hover:text-purple-700 sm:text-xs"
                onClick={() => setHighlightsExpanded((v) => !v)}
              >
                {highlightsExpanded
                  ? "Ver menos"
                  : `+${highlightsHiddenCount} más`}
              </button>
            ) : null}
            {(((discountAmount && discountAmount > 0) || terms) &&
              !hasTopeInHighlights) ? (
              <div className="mt-1.5 border-t border-gray-200/80 pt-1.5">
                <span className="text-[10px] leading-snug text-gray-600 sm:text-[11px]">
                  {terms && /tope|sin tope/i.test(normalizedTerms) ? (
                    <span className="font-medium text-gray-800">{terms}</span>
                  ) : (
                    <>
                      Tope:{" "}
                      <span className="font-medium text-gray-800">
                        ${discountAmount?.toLocaleString("es-AR")}
                      </span>
                    </>
                  )}
                </span>
              </div>
            ) : null}
          </div>
        )}

        <section className="space-y-2 rounded-lg border border-gray-200 bg-gray-50/70 p-2.5 sm:p-3">
          <h2 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-800 sm:text-xs">
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-purple-600" />
            Quién puede usarlo
          </h2>

          {noRequirements && (
            <div className="rounded-md border border-emerald-200/80 bg-emerald-50/90 px-2 py-1.5">
              <span className="text-[11px] font-medium text-emerald-800 sm:text-xs">
                Sin requisitos especiales
              </span>
            </div>
          )}

          {hasMemberships && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                <Users className="h-3 w-3" />
                Membresías
              </div>
              <div className="flex flex-wrap gap-1">
                {availableMemberships!.map((membership, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center rounded-md border border-gray-200 bg-white px-2 py-0.5 text-[10px] font-medium text-gray-800 shadow-sm sm:text-[11px]"
                  >
                    {membership}
                  </span>
                ))}
              </div>
            </div>
          )}

          {hasCredentials && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                <CreditCard className="h-3 w-3" />
                Tarjetas
              </div>
              <div className={multiBankScroll}>
                {credentialsByBank.map(([groupKey, rows]) => {
                  const sampleBank = rows[0]?.bank ?? groupKey;
                  const displayName = bankDisplayName(sampleBank);
                  const logoSrc = resolveBankLogoPath(sampleBank);
                  const avatar = bankInitialsAvatar(sampleBank);
                  const uniqueRows = dedupeCredentials(rows);
                  const bankCardWide =
                    credentialsByBank.length > 1
                      ? "min-w-[min(88vw,18rem)] shrink-0 snap-start sm:min-w-0 sm:max-w-[min(100%,20rem)] sm:flex-1"
                      : "";

                  return (
                    <div
                      key={groupKey}
                      className={cn(
                        "flex gap-2 rounded-lg border border-gray-100 bg-white p-2 shadow-sm",
                        bankCardWide
                      )}
                    >
                      <div
                        className={cn(
                          "relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg",
                          logoSrc
                            ? "bg-white ring-1 ring-gray-100"
                            : cn("text-[10px] font-bold", avatar.className)
                        )}
                      >
                        {logoSrc ? (
                          <Image
                            src={logoSrc}
                            alt=""
                            width={40}
                            height={40}
                            className="object-contain p-1"
                          />
                        ) : (
                          <span>{avatar.initials}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-xs font-semibold leading-tight text-gray-900">
                          {displayName}
                        </p>
                        <div className="flex flex-col gap-1">
                          {uniqueRows.map((cred, idx) => (
                            <div
                              key={`${groupKey}-${idx}`}
                              className="flex flex-wrap items-center gap-1"
                            >
                              <span className="inline-flex rounded border border-gray-200 bg-gray-50 px-1.5 py-px text-[10px] font-medium text-gray-700">
                                {cred.type}
                              </span>
                              <span className="inline-flex rounded border border-gray-200 bg-white px-1.5 py-px text-[10px] font-medium text-gray-800">
                                {cred.brand}
                              </span>
                              <span className="inline-flex rounded border border-purple-100 bg-purple-50 px-1.5 py-px text-[10px] font-medium text-purple-900">
                                {cred.level}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default CardDiscount;
