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
import { useEffect, useRef, useState } from "react";
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
  const processingRef = useRef(false);

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

    // Protección contra múltiples clics simultáneos
    if (processingRef.current) {
      return;
    }

    // Guardar estado anterior para rollback
    const previousVote = userVote;
    const previousPoints = points;

    // CAMBIOS OPTIMISTAS INMEDIATOS (síncronos, antes de cualquier async)
    if (userVote === voteType) {
      // Si el usuario ya votó lo mismo, eliminar el voto
      setUserVote(null);
      if (voteType === "up") {
        const newPoints = Math.max(0, points - 1);
        setPoints(newPoints);
        onPointsUpdate?.(newPoints);
      } else {
        const newPoints = points + 1;
        setPoints(newPoints);
        onPointsUpdate?.(newPoints);
      }
    } else {
      // Si había un voto diferente o no había voto, crear/actualizar
      const isNewUpVote = voteType === "up";
      const isNewDownVote = voteType === "down";
      const wasUpVote = previousVote === "up";
      const wasDownVote = previousVote === "down";

      setUserVote(voteType);
      
      let newPoints = points;
      if (isNewUpVote) {
        // Nuevo like: +1 si no había voto, +2 si había dislike
        newPoints = wasDownVote ? points + 2 : points + 1;
      } else if (isNewDownVote) {
        // Nuevo dislike: -1 si no había voto, -2 si había like
        newPoints = wasUpVote ? Math.max(0, points - 2) : Math.max(0, points - 1);
      }
      
      setPoints(newPoints);
      onPointsUpdate?.(newPoints);
    }

    // Operaciones async en segundo plano (sin bloquear UI)
    (async () => {
      processingRef.current = true;
      try {
        setLoading(true);

        if (previousVote === voteType) {
          // Eliminar voto
          await Promise.all([
            removeVote(user.uid, discountId),
            setFeedback(user.uid, discountId, 0),
          ]);
        } else {
          // Crear/actualizar voto
          await Promise.all([
            voteDiscount(user.uid, discountId, voteType),
            setFeedback(
              user.uid,
              discountId,
              voteType === "up" ? 1 : -1
            ),
          ]);
        }

        // Sincronizar puntos reales en segundo plano
        const discountRef = doc(db, "discounts", discountId);
        getDoc(discountRef).then((discountDoc) => {
          if (discountDoc.exists()) {
            const data = discountDoc.data();
            setPoints(data.points || 0);
            onPointsUpdate?.(data.points || 0);
          }
        }).catch(() => {
          // Si falla, revertir a puntos anteriores
          setPoints(previousPoints);
          onPointsUpdate?.(previousPoints);
        });
      } catch (error) {
        // Revertir cambios optimistas en caso de error
        setUserVote(previousVote);
        setPoints(previousPoints);
        onPointsUpdate?.(previousPoints);
        console.error("Error al votar:", error);
        toast.error("No se pudo registrar tu voto. Intenta nuevamente.");
      } finally {
        setLoading(false);
        processingRef.current = false;
      }
    })();
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
        disabled={!user}
        className={`h-7 w-7 p-0 transition-all ${
          userVote === "up"
            ? "bg-green-50 text-green-600 hover:bg-green-100"
            : "text-gray-600 hover:bg-gray-100"
        } ${loading ? "opacity-70" : ""}`}
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
        disabled={!user}
        className={`h-7 w-7 p-0 transition-all ${
          userVote === "down"
            ? "bg-red-50 text-red-600 hover:bg-red-100"
            : "text-gray-600 hover:bg-gray-100"
        } ${loading ? "opacity-70" : ""}`}
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
