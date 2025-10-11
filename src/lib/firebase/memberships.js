import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "./firebase.js";

// Obtener todas las membresías del usuario
export const getUserMemberships = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuario no autenticado");

    const membershipsRef = collection(db, `users/${user.uid}/memberships`);
    // Removemos orderBy temporalmente para evitar el error de índice
    const querySnapshot = await getDocs(membershipsRef);

    const memberships = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      memberships.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      });
    });

    // Ordenar en el cliente por createdAt descendente
    return memberships.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error("Error al obtener membresías:", error);
    throw error;
  }
};

// Obtener membresías activas del usuario
export const getActiveMemberships = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuario no autenticado");

    const membershipsRef = collection(db, `users/${user.uid}/memberships`);
    const q = query(membershipsRef, where("status", "==", "active"));
    const querySnapshot = await getDocs(q);

    const memberships = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      memberships.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      });
    });

    return memberships.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error("Error al obtener membresías activas:", error);
    throw error;
  }
};

// Obtener una membresía específica
export const getMembership = async (membershipId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuario no autenticado");

    const membershipRef = doc(
      db,
      `users/${user.uid}/memberships/${membershipId}`
    );
    const membershipDoc = await getDoc(membershipRef);

    if (!membershipDoc.exists()) {
      throw new Error("Membresía no encontrada");
    }

    const data = membershipDoc.data();
    return {
      id: membershipDoc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  } catch (error) {
    console.error("Error al obtener membresía:", error);
    throw error;
  }
};

// Crear una nueva membresía
export const createMembership = async (membershipData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuario no autenticado");

    const membershipsRef = collection(db, `users/${user.uid}/memberships`);
    const newMembership = {
      ...membershipData,
      status: "active",
      cards: membershipData.cards || [], // Usar las tarjetas proporcionadas o array vacío
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    console.log("💾 Guardando membresía en Firestore:", newMembership);
    console.log("💳 Tarjetas que se están guardando:", newMembership.cards);
    
    const docRef = await addDoc(membershipsRef, newMembership);
    return {
      id: docRef.id,
      ...newMembership,
    };
  } catch (error) {
    console.error("Error al crear membresía:", error);
    throw error;
  }
};

// Actualizar una membresía
export const updateMembership = async (membershipId, updateData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuario no autenticado");

    const membershipRef = doc(
      db,
      `users/${user.uid}/memberships/${membershipId}`
    );
    const updatePayload = {
      ...updateData,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(membershipRef, updatePayload);
    return { id: membershipId, ...updatePayload };
  } catch (error) {
    console.error("Error al actualizar membresía:", error);
    throw error;
  }
};

// Eliminar una membresía
export const deleteMembership = async (membershipId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuario no autenticado");

    const membershipRef = doc(
      db,
      `users/${user.uid}/memberships/${membershipId}`
    );
    await deleteDoc(membershipRef);
    return { success: true };
  } catch (error) {
    console.error("Error al eliminar membresía:", error);
    throw error;
  }
};

// Agregar una tarjeta a una membresía
export const addCardToMembership = async (membershipId, cardData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuario no autenticado");

    const membershipRef = doc(
      db,
      `users/${user.uid}/memberships/${membershipId}`
    );
    const membershipDoc = await getDoc(membershipRef);

    if (!membershipDoc.exists()) {
      throw new Error("Membresía no encontrada");
    }

    const membership = membershipDoc.data();
    const newCard = {
      id: Date.now().toString(), // ID temporal, se puede mejorar
      ...cardData,
    };

    const updatedCards = [...membership.cards, newCard];

    await updateDoc(membershipRef, {
      cards: updatedCards,
      updatedAt: serverTimestamp(),
    });

    return newCard;
  } catch (error) {
    console.error("Error al agregar tarjeta:", error);
    throw error;
  }
};

// Actualizar una tarjeta
export const updateCardInMembership = async (
  membershipId,
  cardId,
  cardData
) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuario no autenticado");

    const membershipRef = doc(
      db,
      `users/${user.uid}/memberships/${membershipId}`
    );
    const membershipDoc = await getDoc(membershipRef);

    if (!membershipDoc.exists()) {
      throw new Error("Membresía no encontrada");
    }

    const membership = membershipDoc.data();
    const updatedCards = membership.cards.map((card) =>
      card.id === cardId ? { ...card, ...cardData } : card
    );

    await updateDoc(membershipRef, {
      cards: updatedCards,
      updatedAt: serverTimestamp(),
    });

    return updatedCards.find((card) => card.id === cardId);
  } catch (error) {
    console.error("Error al actualizar tarjeta:", error);
    throw error;
  }
};

// Eliminar una tarjeta
export const deleteCardFromMembership = async (membershipId, cardId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuario no autenticado");

    const membershipRef = doc(
      db,
      `users/${user.uid}/memberships/${membershipId}`
    );
    const membershipDoc = await getDoc(membershipRef);

    if (!membershipDoc.exists()) {
      throw new Error("Membresía no encontrada");
    }

    const membership = membershipDoc.data();
    const updatedCards = membership.cards.filter((card) => card.id !== cardId);

    console.log("🗑️ Eliminando tarjeta:", cardId);
    console.log("📊 Tarjetas restantes:", updatedCards.length);
    console.log("🏦 Membresía:", membership.name, "- Categoría:", membership.category);

    // Si es un banco y no quedan tarjetas, eliminar la membresía completa
    if (membership.category === "banco" && updatedCards.length === 0) {
      console.log("🏦 Banco sin tarjetas - Eliminando membresía completa");
      await deleteDoc(membershipRef);
      console.log("✅ Banco eliminado completamente");
      return { 
        success: true, 
        membershipDeleted: true,
        message: "Banco eliminado (no quedaban tarjetas)"
      };
    } else {
      // Actualizar la membresía con las tarjetas restantes
      await updateDoc(membershipRef, {
        cards: updatedCards,
        updatedAt: serverTimestamp(),
      });
      console.log("✅ Tarjeta eliminada, membresía actualizada");
      return { 
        success: true, 
        membershipDeleted: false,
        remainingCards: updatedCards.length,
        message: `Tarjeta eliminada. Quedan ${updatedCards.length} tarjeta(s)`
      };
    }
  } catch (error) {
    console.error("Error al eliminar tarjeta:", error);
    throw error;
  }
};

// Verificar si una entidad ya existe para el usuario
export const checkMembershipExists = async (name, category) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuario no autenticado");

    const membershipsRef = collection(db, `users/${user.uid}/memberships`);
    const q = query(
      membershipsRef,
      where("name", "==", name),
      where("category", "==", category)
    );
    const querySnapshot = await getDocs(q);

    return !querySnapshot.empty;
  } catch (error) {
    console.error("Error al verificar membresía existente:", error);
    throw error;
  }
};
