"use client";

import { useAuth } from "@/hooks/useAuth";
import {
    getUserVote,
    removeVote,
    voteDiscount,
    type VoteType,
} from "@/lib/firebase/discount-votes";
import { db } from "@/lib/firebase/firebase";
import { setFeedback } from "@/lib/firebase/interactions";
import { doc, getDoc } from "firebase/firestore";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "../Share/button";

interface DiscountVoteProps {
  discountId: string;
  currentPoints: number;
  onPointsUpdate?: (newPoints: number) => void;
}

export function DiscountVote({
  discountId,
  currentPoints,
  onPointsUpdate,
}: DiscountVoteProps) {
  const { user } = useAuth();
  const [userVote, setUserVote] = useState<VoteType | null>(null);
  const [points, setPoints] = useState(currentPoints);
  const [loading, setLoading] = useState(false);
  const [loadingVote, setLoadingVote] = useState(true);

  useEffect(() => {
    setPoints(currentPoints);
  }, [currentPoints]);

  useEffect(() => {
    const loadUserVote = async () => {
      if (!user || !discountId) {
        setLoadingVote(false);
        return;
      }

      try {
        const vote = await getUserVote(user.uid, discountId);
        setUserVote(vote);
      } catch (error) {
        console.error("Error cargando voto del usuario:", error);
      } finally {
        setLoadingVote(false);
      }
    };

    loadUserVote();
  }, [user, discountId]);

  const handleVote = async (voteType: VoteType) => {
    if (!user) {
      toast.error("Debes iniciar sesión para votar");
      return;
    }

    if (loading) return;

    try {
      setLoading(true);

      // Si el usuario ya votó lo mismo, eliminar el voto
      if (userVote === voteType) {
        await removeVote(user.uid, discountId);
        await setFeedback(user.uid, discountId, 0);
        setUserVote(null);

        // Obtener los puntos actualizados desde Firestore (ya calculados por removeVote)
        const discountRef = doc(db, "discounts", discountId);
        const discountDoc = await getDoc(discountRef);
        if (discountDoc.exists()) {
          const data = discountDoc.data();
          setPoints(data.points || 0);
          onPointsUpdate?.(data.points || 0);
        }

      } else {
        // Si había un voto diferente, actualizar
        // Si no había voto, crear uno nuevo
        await voteDiscount(user.uid, discountId, voteType);
        await setFeedback(
          user.uid,
          discountId,
          voteType === "up" ? 1 : -1
        );

        // Obtener los puntos actualizados desde Firestore (ya calculados por voteDiscount)
        const discountRef = doc(db, "discounts", discountId);
        const discountDoc = await getDoc(discountRef);
        if (discountDoc.exists()) {
          const data = discountDoc.data();
          setPoints(data.points || 0);
          onPointsUpdate?.(data.points || 0);
        }

        setUserVote(voteType);
      }
    } catch (error) {
      console.error("Error al votar:", error);
      toast.error("No se pudo registrar tu voto. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  if (loadingVote) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 animate-pulse rounded bg-gray-200"></div>
        <div className="h-8 w-8 animate-pulse rounded bg-gray-200"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote("up")}
        disabled={loading || !user}
        className={`h-7 w-7 p-0 transition-all ${
          userVote === "up"
            ? "bg-green-50 text-green-600 hover:bg-green-100"
            : "text-gray-600 hover:bg-gray-100"
        }`}
      >
        <ThumbsUp
          className={`h-4 w-4 ${
            userVote === "up" ? "fill-green-600 text-green-600" : ""
          }`}
        />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote("down")}
        disabled={loading || !user}
        className={`h-7 w-7 p-0 transition-all ${
          userVote === "down"
            ? "bg-red-50 text-red-600 hover:bg-red-100"
            : "text-gray-600 hover:bg-gray-100"
        }`}
      >
        <ThumbsDown
          className={`h-4 w-4 ${
            userVote === "down" ? "fill-red-600 text-red-600" : ""
          }`}
        />
      </Button>
    </div>
  );
}
