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
    const querySnapshot = await getDocs(membershipsRef);

    const activeItems = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();

      // Para bancos: agregar solo las tarjetas activas como elementos separados
      if (data.category === "banco" && data.cards && data.cards.length > 0) {
        data.cards.forEach((card) => {
          if (card.status === "active" || card.status === undefined) {
            activeItems.push({
              id: `${doc.id}-${card.id}`,
              membershipId: doc.id,
              membershipName: data.name,
              membershipCategory: data.category,
              card: card,
              isCard: true, // Marcar que es una tarjeta individual
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
            });
          }
        });
      } else {
        // Para otras membresías: agregar la membresía completa si está activa
        if (data.status === "active" || data.status === undefined) {
          activeItems.push({
            id: doc.id,
            membershipId: doc.id,
            membershipName: data.name,
            membershipCategory: data.category,
            isCard: false, // Marcar que es una membresía completa
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          });
        }
      }
    });

    return activeItems.sort(
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

    // Para bancos, verificar si ya existe una membresía con el mismo nombre
    if (membershipData.category === "banco") {
      const existingMembership = await findMembershipByName(
        membershipData.name
      );

      if (existingMembership) {
        // Si ya existe, agregar las tarjetas a la membresía existente
        console.log(
          `🔄 Membresía "${membershipData.name}" ya existe, agregando tarjetas...`
        );
        return await addCardsToExistingMembership(
          existingMembership.id,
          membershipData.cards
        );
      }
    }

    // Si no existe o no es banco, crear nueva membresía
    const membershipsRef = collection(db, `users/${user.uid}/memberships`);
    const newMembership = {
      ...membershipData,
      status: "active",
      cards: membershipData.cards || [], // Usar las tarjetas proporcionadas o array vacío
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

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

// Función helper para encontrar membresía por nombre
const findMembershipByName = async (membershipName) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuario no autenticado");

    const membershipsRef = collection(db, `users/${user.uid}/memberships`);
    const q = query(membershipsRef, where("name", "==", membershipName));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
      };
    }
    return null;
  } catch (error) {
    console.error("Error al buscar membresía por nombre:", error);
    return null;
  }
};

// Función helper para agregar tarjetas a membresía existente
const addCardsToExistingMembership = async (membershipId, newCards) => {
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
    const existingCards = membership.cards || [];

    // Combinar tarjetas existentes con las nuevas
    const allCards = [...existingCards, ...newCards];

    await updateDoc(membershipRef, {
      cards: allCards,
      updatedAt: serverTimestamp(),
    });

    console.log(
      `✅ Agregadas ${newCards.length} tarjetas a "${membership.name}"`
    );
    return {
      id: membershipId,
      ...membership,
      cards: allCards,
    };
  } catch (error) {
    console.error("Error al agregar tarjetas a membresía existente:", error);
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

    // Si es un banco y no quedan tarjetas, eliminar la membresía completa
    if (membership.category === "banco" && updatedCards.length === 0) {
      await deleteDoc(membershipRef);
      return {
        success: true,
        membershipDeleted: true,
        message: "Banco eliminado (no quedaban tarjetas)",
      };
    } else {
      // Actualizar la membresía con las tarjetas restantes
      await updateDoc(membershipRef, {
        cards: updatedCards,
        updatedAt: serverTimestamp(),
      });
      return {
        success: true,
        membershipDeleted: false,
        remainingCards: updatedCards.length,
        message: `Tarjeta eliminada. Quedan ${updatedCards.length} tarjeta(s)`,
      };
    }
  } catch (error) {
    console.error("Error al eliminar tarjeta:", error);
    throw error;
  }
};

// Obtener membresías inactivas del usuario
export const getInactiveMemberships = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuario no autenticado");

    const membershipsRef = collection(db, `users/${user.uid}/memberships`);
    const querySnapshot = await getDocs(membershipsRef);

    const inactiveItems = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();

      // Para bancos: agregar solo las tarjetas inactivas como elementos separados
      if (data.category === "banco" && data.cards && data.cards.length > 0) {
        data.cards.forEach((card) => {
          if (card.status === "inactive") {
            inactiveItems.push({
              id: `${doc.id}-${card.id}`,
              membershipId: doc.id,
              membershipName: data.name,
              membershipCategory: data.category,
              card: card,
              isCard: true, // Marcar que es una tarjeta individual
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
            });
          }
        });
      } else {
        // Para otras membresías: agregar la membresía completa si está inactiva
        if (data.status === "inactive") {
          inactiveItems.push({
            id: doc.id,
            membershipId: doc.id,
            membershipName: data.name,
            membershipCategory: data.category,
            isCard: false, // Marcar que es una membresía completa
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          });
        }
      }
    });

    return inactiveItems.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error("Error al obtener membresías inactivas:", error);
    throw error;
  }
};

// Obtener una membresía específica por ID (función genérica)
export const getMembershipById = async (membershipId) => {
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
      // Aseguramos shape completo esperado por el front
      name: data.name || "",
      category: data.category,
      status: data.status || "active",
      color: data.color || "#6B7280",
      cards: Array.isArray(data.cards) ? data.cards : [],
      logoUrl: data.logoUrl,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  } catch (error) {
    console.error("Error al obtener membresía por ID:", error);
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

// Función para consolidar membresías duplicadas del mismo banco
export const consolidateDuplicateMemberships = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuario no autenticado");

    const membershipsRef = collection(db, `users/${user.uid}/memberships`);
    const querySnapshot = await getDocs(membershipsRef);

    const membershipsByName = {};
    const duplicates = [];

    // Agrupar membresías por nombre
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const membership = { id: doc.id, ...data };

      if (!membershipsByName[membership.name]) {
        membershipsByName[membership.name] = [];
      }
      membershipsByName[membership.name].push(membership);
    });

    // Identificar duplicados
    Object.entries(membershipsByName).forEach(([name, memberships]) => {
      if (memberships.length > 1) {
        duplicates.push({ name, memberships });
      }
    });

    console.log(
      `🔄 Encontrados ${duplicates.length} grupos de membresías duplicadas`
    );

    let consolidated = 0;
    let deleted = 0;

    // Consolidar cada grupo de duplicados
    for (const { name, memberships } of duplicates) {
      // Ordenar por fecha de creación (mantener la más antigua)
      memberships.sort(
        (a, b) =>
          new Date(a.createdAt?.toDate?.() || 0) -
          new Date(b.createdAt?.toDate?.() || 0)
      );

      const [keepMembership, ...deleteMemberships] = memberships;

      // Consolidar todas las tarjetas en la membresía principal
      const allCards = [];
      memberships.forEach((membership) => {
        if (membership.cards && membership.cards.length > 0) {
          allCards.push(...membership.cards);
        }
      });

      // Actualizar la membresía principal con todas las tarjetas
      const membershipRef = doc(
        db,
        `users/${user.uid}/memberships/${keepMembership.id}`
      );
      await updateDoc(membershipRef, {
        cards: allCards,
        updatedAt: serverTimestamp(),
      });

      // Eliminar las membresías duplicadas
      for (const membership of deleteMemberships) {
        const docRef = doc(
          db,
          `users/${user.uid}/memberships/${membership.id}`
        );
        await deleteDoc(docRef);
        deleted++;
      }

      consolidated++;
      console.log(
        `✅ Consolidado "${name}": ${memberships.length} → 1 membresía con ${allCards.length} tarjetas`
      );
    }

    return {
      success: true,
      consolidated,
      deleted,
      message: `Consolidación completada: ${consolidated} grupos consolidados, ${deleted} membresías eliminadas`,
    };
  } catch (error) {
    console.error("Error en consolidación de membresías:", error);
    throw error;
  }
};
