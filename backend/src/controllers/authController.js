import User from "../models/User.js";
import {
  loginUser,
  refreshUserSession,
  registerUser,
  revokeUserSession,
} from "../services/authService.js";
import { logAuditEvent } from "../utils/auditLogger.js";
import { pick } from "../utils/pick.js";

function buildAuthResponse(message, session, statusCode = 200) {
  return {
    statusCode,
    body: {
      message,
      token: session.token,
      refreshToken: session.refreshToken,
      accessTokenExpiresAt: session.accessTokenExpiresAt,
      user: session.user,
      data: session.user,
    },
  };
}

export async function register(req, res) {
  const session = await registerUser(req.body);
  const response = buildAuthResponse("Account created successfully.", session, 201);

  res.status(response.statusCode).json(response.body);
}

export async function login(req, res) {
  try {
    const session = await loginUser(req.body);
    const response = buildAuthResponse("Logged in successfully.", session);

    logAuditEvent(req, {
      action: "auth.login",
      status: "success",
      actorId: session.user.id,
      actorEmail: session.user.email,
      targetType: "user",
      targetId: session.user.id,
      metadata: {
        email: session.user.email,
      },
    });

    res.json(response.body);
  } catch (error) {
    logAuditEvent(req, {
      action: "auth.login",
      status: "failure",
      actorEmail: req.body?.email?.toLowerCase?.() ?? null,
      targetType: "user",
      metadata: {
        email: req.body?.email?.toLowerCase?.() ?? null,
        reason: error.message,
      },
    });

    throw error;
  }
}

export async function refreshSession(req, res) {
  const session = await refreshUserSession(req.body.refreshToken);
  const response = buildAuthResponse("Session refreshed successfully.", session);

  res.json(response.body);
}

export async function logout(req, res) {
  await revokeUserSession(req.user.id);

  logAuditEvent(req, {
    action: "auth.logout",
    status: "success",
    targetType: "user",
    targetId: req.user.id,
  });

  res.json({
    message: "Signed out successfully.",
  });
}

export async function getCurrentUser(req, res) {
  res.json(req.user);
}

export async function updateCurrentUser(req, res) {
  const updates = pick(req.body, ["name", "avatar", "phone", "university"]);

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  logAuditEvent(req, {
    action: "user.profile.update",
    status: "success",
    targetType: "user",
    targetId: user.id,
    metadata: {
      changedFields: Object.keys(updates),
    },
  });

  res.json({
    message: "Profile updated successfully.",
    user,
    data: user,
  });
}
