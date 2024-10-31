/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// functions/src/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

// Configurar el transporte de email (reemplaza con tus credenciales)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: functions.config().email.user,
    pass: functions.config().email.pass,
  },
});

// Función para generar un token de invitación
exports.createInvitation = functions.https.onCall(async (data, context) => {
  // Verificar que el llamador está autorizado
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Usuario no autenticado"
    );
  }

  const { email, role, condoId, unitId = null } = data;

  try {
    // Crear un documento de invitación
    const invitationRef = admin.firestore().collection("invitations").doc();
    const token = invitationRef.id;

    await invitationRef.set({
      email,
      role,
      condoId,
      unitId,
      token,
      createdBy: context.auth.uid,
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días
      ),
    });

    // Enviar email de invitación
    const inviteUrl = `${functions.config().app.url}/register?token=${token}`;

    const mailOptions = {
      from: functions.config().email.from,
      to: email,
      subject: "Invitación a Water Meter Flow Logger",
      html: `
        <h2>Bienvenido a Water Meter Flow Logger</h2>
        <p>Has sido invitado a unirte como ${role}.</p>
        <p>Para completar tu registro, haz clic en el siguiente enlace:</p>
        <a href="${inviteUrl}" style="display:inline-block;padding:12px 24px;background:#4F46E5;color:white;text-decoration:none;border-radius:4px;">
          Completar Registro
        </a>
        <p>Este enlace expirará en 7 días.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return { success: true, token };
  } catch (error) {
    console.error("Error creating invitation:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Error al crear la invitación"
    );
  }
});

// Función para verificar y procesar un token de invitación
exports.verifyInvitation = functions.https.onCall(async (data, context) => {
  const { token } = data;

  try {
    const invitationRef = admin
      .firestore()
      .collection("invitations")
      .doc(token);
    const invitation = await invitationRef.get();

    if (!invitation.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "Invitación no encontrada"
      );
    }

    const invitationData = invitation.data();

    if (invitationData.status !== "pending") {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Invitación ya utilizada"
      );
    }

    if (invitationData.expiresAt.toDate() < new Date()) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Invitación expirada"
      );
    }

    return {
      valid: true,
      data: {
        email: invitationData.email,
        role: invitationData.role,
        condoId: invitationData.condoId,
        unitId: invitationData.unitId,
      },
    };
  } catch (error) {
    console.error("Error verifying invitation:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Error al verificar la invitación"
    );
  }
});

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
} from "firebase/firestore";

const functions = getFunctions();

export const invitationService = {
  // Enviar invitación
  async sendInvitation(email, role, condoId, unitId = null) {
    try {
      const createInvitation = httpsCallable(functions, "createInvitation");
      const result = await createInvitation({ email, role, condoId, unitId });
      return result.data;
    } catch (error) {
      console.error("Error sending invitation:", error);
      throw error;
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
      throw error;
    }
  },

  // Obtener invitaciones pendientes por condominio
  async getPendingInvitations(condoId) {
    try {
      const invitationsRef = collection(db, "invitations");
      const q = query(
        invitationsRef,
        where("condoId", "==", condoId),
        where("status", "==", "pending")
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error getting pending invitations:", error);
      throw error;
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
      throw error;
    }
  },
};
