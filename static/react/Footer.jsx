function Footer() {
  return (
    <footer className="footer">
      <button onClick={() => window.location.href = "/chat"}>
        💬 Chat
      </button>

      <button onClick={() => window.location.href = "/perfil"}>
        👤 Perfil
      </button>
    </footer>
  );
}

export default Footer;
