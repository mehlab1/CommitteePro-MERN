const Footer = () => {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-gray-500 sm:flex-row">
        <p>© {new Date().getFullYear()} CommitteePro. All rights reserved.</p>
        <p>Built for secure rotating savings committees.</p>
      </div>
    </footer>
  );
};

export default Footer;
