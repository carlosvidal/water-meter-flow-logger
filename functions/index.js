// functions/index.js
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const nodemailer = require("nodemailer");

initializeApp();

const db = getFirestore();

// Configuración más detallada del transporte de email
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // usar SSL
  auth: {
    type: "login", // especificar tipo de autenticación
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // solo para desarrollo
  },
});

// Función para verificar la configuración del email
const verifyEmailConfig = async () => {
  try {
    const verify = await transporter.verify();
    console.log("Configuración de email verificada:", verify);
    return verify;
  } catch (error) {
    console.error("Error en configuración de email:", error);
    console.log("Credenciales usadas:", {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS ? "********" : "no configurado",
    });
    throw error;
  }
};

// Verificar configuración al inicio
verifyEmailConfig().catch(console.error);

exports.createInvitation = onCall({ maxInstances: 10 }, async (request) => {
  console.log(
    "Iniciando createInvitation con datos:",
    JSON.stringify(request.data)
  );

  // Verificar autenticación
  if (!request.auth) {
    console.error("Usuario no autenticado");
    throw new HttpsError(
      "unauthenticated",
      "Debes estar autenticado para enviar invitaciones"
    );
  }

  const { email, role, condoId, unitId } = request.data;

  // Validar datos requeridos
  if (!email || !role || !condoId) {
    console.error("Datos faltantes:", { email, role, condoId });
    throw new HttpsError(
      "invalid-argument",
      "Email, rol y condominio son requeridos"
    );
  }

  try {
    console.log("Verificando permisos para usuario:", request.auth.uid);

    // Verificar permisos del usuario
    const userDoc = await db.collection("users").doc(request.auth.uid).get();
    if (!userDoc.exists) {
      throw new HttpsError("not-found", "Usuario no encontrado");
    }

    const userData = userDoc.data();
    console.log("Datos del usuario:", userData);

    if (
      !userData.userType ||
      !["superadmin", "admin"].includes(userData.userType)
    ) {
      throw new HttpsError(
        "permission-denied",
        "No tienes permisos para enviar invitaciones"
      );
    }

    // Verificar si el condominio existe
    const condoDoc = await db.collection("condos").doc(condoId).get();
    if (!condoDoc.exists) {
      throw new HttpsError("not-found", "Condominio no encontrado");
    }

    // Si es una invitación para tenant, verificar la unidad
    if (role === "tenant" && unitId) {
      const unitDoc = await db.collection("units").doc(unitId).get();
      if (!unitDoc.exists) {
        throw new HttpsError("not-found", "Unidad no encontrada");
      }
    }

    console.log("Creando documento de invitación");

    // Crear documento de invitación
    const invitationRef = db.collection("invitations").doc();
    const token = invitationRef.id;

    const invitationData = {
      email,
      role,
      condoId,
      unitId,
      token,
      createdBy: request.auth.uid,
      status: "pending",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };

    await invitationRef.set(invitationData);
    console.log("Invitación creada con ID:", token);

    // Enviar email
    const inviteUrl = `${process.env.APP_URL}/register/invite?token=${token}`;
    console.log("URL de invitación:", inviteUrl);

    const mailOptions = {
      from:
        process.env.EMAIL_FROM ||
        '"Water Meter Flow Logger" <noreply@watermeters.com>',
      to: email,
      subject: "Invitación a Water Meter Flow Logger",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Bienvenido a Water Meter Flow Logger</h2>
          <p>Has sido invitado a unirte como ${role}.</p>
          <p>Para completar tu registro, haz clic en el siguiente enlace:</p>
          <a href="${inviteUrl}" style="display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">
            Completar Registro
          </a>
          <p>Este enlace expirará en 7 días.</p>
          <p><small>Si no esperabas esta invitación, puedes ignorar este email.</small></p>
        </div>
      `,
    };

    console.log(
      "Intentando enviar email con opciones:",
      JSON.stringify(mailOptions)
    );

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log("Email enviado:", info);
    } catch (emailError) {
      console.error("Error enviando email:", emailError);
      await invitationRef.update({
        emailError: emailError.message,
      });
    }

    return { success: true, token };
  } catch (error) {
    console.error("Error en createInvitation:", error);
    throw new HttpsError(
      "internal",
      `Error al crear la invitación: ${error.message}`
    );
  }
});

exports.verifyInvitation = onCall({ maxInstances: 10 }, async (request) => {
  const { token } = request.data;

  try {
    const invitationRef = await db.collection("invitations").doc(token).get();

    if (!invitationRef.exists) {
      throw new HttpsError("not-found", "Invitación no encontrada");
    }

    const invitationData = invitationRef.data();

    if (invitationData.status !== "pending") {
      throw new HttpsError("failed-precondition", "Invitación ya utilizada");
    }

    if (invitationData.expiresAt.toDate() < new Date()) {
      throw new HttpsError("failed-precondition", "Invitación expirada");
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
    throw new HttpsError(
      "internal",
      `Error al verificar la invitación: ${error.message}`
    );
  }
});
