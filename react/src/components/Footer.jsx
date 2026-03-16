import { NavLink } from "react-router-dom";

export default function Footer() {
  const base = {
    flex: 1,
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "12px 10px",
    borderRadius: 12,
    fontWeight: 700,
    fontSize: 14,
  };

  const activeStyle = {
    background: "rgba(79,70,229,.12)",
    color: "#4f46e5",
  };

  const inactiveStyle = {
    color: "#111827",
  };

  return (
    <footer style={styles.footer}>
      <nav style={styles.nav}>
        <NavLink
          to="/chat"
          style={({ isActive }) => ({
            ...base,
            ...(isActive ? activeStyle : inactiveStyle),
          })}
        >
          💬 Chat
        </NavLink>

        <NavLink
          to="/perfil"
          style={({ isActive }) => ({
            ...base,
            ...(isActive ? activeStyle : inactiveStyle),
          })}
        >
          👤 Perfil
        </NavLink>
      </nav>
    </footer>
  );
}

const styles = {
  footer: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    padding: "10px 12px",
    background: "rgba(255,255,255,.85)",
    backdropFilter: "blur(10px)",
    borderTop: "1px solid rgba(17,24,39,.08)",
    zIndex: 50,
  },
  nav: {
    maxWidth: 720,
    margin: "0 auto",
    display: "flex",
    gap: 10,
    background: "#fff",
    borderRadius: 16,
    padding: 8,
    boxShadow: "0 10px 30px rgba(0,0,0,.06)",
  },
};