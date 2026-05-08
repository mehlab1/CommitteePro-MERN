const generateTransactionId = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const random4digits = String(Math.floor(Math.random() * 10000)).padStart(4, "0");

  return `TXN-${year}${month}${day}-${random4digits}`;
};

module.exports = generateTransactionId;
