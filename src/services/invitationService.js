// src/services/invitationService.js
import { getFunctions, httpsCallable } from "firebase/functions";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
  orderBy,
} from "firebase/firestore";

const functions = getFunctions();

export const invitationService = {
  // Enviar una nueva invitación
  async sendInvitation(email, role, condoId, unitId = null) {
    try {
      const createInvitation = httpsCallable(functions, "createInvitation");
      const result = await createInvitation({ email, role, condoId, unitId });
      return result.data;
    } catch (error) {
      console.error("Error sending invitation:", error);
      throw new Error(`Error al enviar la invitación: ${error.message}`);
    }
  },

  // Verificar token de invitación
  async verifyInvitation(token) {
    try {
      const verifyInvitation = httpsCallable(functions, "verifyInvitation");
      const result = await verifyInvitation({ token });
      return result.data;
    } catch (error) {
      console.error("Error verifying invitation:", error);
      throw new Error(`Error al verificar la invitación: ${error.message}`);
    }
  },

  // Obtener invitaciones pendientes por condominio
  async getPendingInvitations(condoId) {
    try {
      const invitationsRef = collection(db, "invitations");
      const q = query(
        invitationsRef,
        where("condoId", "==", condoId),
        where("status", "==", "pending"),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error getting pending invitations:", error);
      throw new Error(
        `Error al obtener invitaciones pendientes: ${error.message}`
      );
    }
  },

  // Cancelar una invitación
  async cancelInvitation(invitationId) {
    try {
      const invitationRef = doc(db, "invitations", invitationId);
      await updateDoc(invitationRef, {
        status: "cancelled",
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error cancelling invitation:", error);
      throw new Error(`Error al cancelar la invitación: ${error.message}`);
    }
  },

  // Completar una invitación
  async completeInvitation(invitationId, userId) {
    try {
      const invitationRef = doc(db, "invitations", invitationId);
      await updateDoc(invitationRef, {
        status: "completed",
        completedBy: userId,
        completedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error completing invitation:", error);
      throw new Error(`Error al completar la invitación: ${error.message}`);
    }
  },
};
