/**
 * Botón flotante que abre un chat de WhatsApp con un mensaje ya escrito.
 * Es un enlace normal a wa.me: no hay API, token ni backend de por medio.
 */
export function WhatsAppButton({href}: {href: string}) {
  return (
    <a
      className="whatsapp-button"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp (se abre en otra pestaña)"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      >
        <path d="M12 3.5a8.500 8.500 0 0 0-7.300 12.850L3.500 20.500l4.300-1.150A8.500 8.500 0 1 0 12 3.500Z" />
      </svg>
      <span>WhatsApp</span>
    </a>
  );
}
