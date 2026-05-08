const maskIban = (iban) => {
  if (!iban || typeof iban !== "string") {
    return "";
  }

  const cleaned = iban.replace(/\s+/g, "");
  if (cleaned.length <= 8) {
    return cleaned;
  }

  const start = cleaned.slice(0, 4);
  const end = cleaned.slice(-4);
  const masked = "*".repeat(cleaned.length - 8);

  return `${start}${masked}${end}`;
};

module.exports = maskIban;
