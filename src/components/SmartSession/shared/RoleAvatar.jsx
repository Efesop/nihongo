import { ROLE_AVATARS } from "../../../data/constants.js";

/**
 * Circular role avatar used in branching-conversation and role-play lines.
 * Looks up emoji + tinted background from ROLE_AVATARS (constants.js).
 */
export default function RoleAvatar({ role, size = 32 }) {
  const av = ROLE_AVATARS[role] || { emoji: "💬", bg: "#666" };
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: av.bg + "33", border: "2px solid " + av.bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.5, flexShrink: 0,
    }}>{av.emoji}</div>
  );
}
