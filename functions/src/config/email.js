// functions/src/config/email.js
const functions = require("firebase-functions");
const nodemailer = require("nodemailer");

const emailConfig = {
  transport: nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: functions.config().email.user,
      pass: functions.config().email.pass,
    },
  }),
  from: functions.config().email.from,
};

module.exports = emailConfig;

// functions/src/utils/emailTemplates.js
const getInvitationEmailTemplate = (inviteUrl, role) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        .button {
            background-color: #4F46E5;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            display: inline-block;
            margin: 20px 0;
        }
        .container {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>Bienvenido a Water Meter Flow Logger</h2>
        <p>Has sido invitado a unirte como ${role}.</p>
        <p>Para completar tu registro, haz clic en el siguiente enlace:</p>
        <a href="${inviteUrl}" class="button">Completar Registro</a>
        <p>Este enlace expirará en 7 días.</p>
        <p>Si no esperabas esta invitación, puedes ignorar este email.</p>
    </div>
</body>
</html>
`;

module.exports = {
  getInvitationEmailTemplate,
};

// functions/src/services/invitations.js
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const emailConfig = require("../config/email");
const { getInvitationEmailTemplate } = require("../utils/emailTemplates");

const createInvitation = async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Usuario no autenticado"
    );
  }

  const { email, role, condoId, unitId = null } = data;

  try {
    // Crear documento de invitación
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
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      ),
    });

    // Enviar email
    const inviteUrl = `${functions.config().app.url}/register?token=${token}`;
    const mailOptions = {
      from: emailConfig.from,
      to: email,
      subject: "Invitación a Water Meter Flow Logger",
      html: getInvitationEmailTemplate(inviteUrl, role),
    };

    await emailConfig.transport.sendMail(mailOptions);
    return { success: true, token };
  } catch (error) {
    console.error("Error creating invitation:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Error al crear la invitación"
    );
  }
};

const verifyInvitation = async (data) => {
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
};

module.exports = {
  createInvitation,
  verifyInvitation,
};

// functions/index.js
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const invitationService = require("./src/services/invitations");

admin.initializeApp();

exports.createInvitation = functions.https.onCall(
  invitationService.createInvitation
);
exports.verifyInvitation = functions.https.onCall(
  invitationService.verifyInvitation
);
