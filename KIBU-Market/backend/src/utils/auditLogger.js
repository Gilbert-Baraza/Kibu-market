function getClientIp(req) {
  const forwardedFor = req.headers["x-forwarded-for"];

  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }

  return req.ip ?? null;
}

export function logAuditEvent(req, {
  action,
  status = "success",
  actorId = null,
  actorEmail = null,
  targetType = null,
  targetId = null,
  metadata = {},
}) {
  const entry = {
    type: "audit",
    timestamp: new Date().toISOString(),
    action,
    status,
    actor: {
      id: actorId ?? req.user?.id ?? req.user?._id ?? null,
      email: actorEmail ?? req.user?.email ?? null,
    },
    request: {
      id: req.requestId ?? null,
      method: req.method,
      path: req.originalUrl,
      ip: getClientIp(req),
      userAgent: req.get("user-agent") ?? null,
    },
    target: {
      type: targetType,
      id: targetId,
    },
    metadata,
  };

  console.info(`[audit] ${JSON.stringify(entry)}`);
  return entry;
}
