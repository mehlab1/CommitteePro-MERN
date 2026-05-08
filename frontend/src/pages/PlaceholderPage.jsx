import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import EmptyState from "../components/EmptyState";

const PlaceholderPage = ({ title }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <div className="mt-4">
          <EmptyState title={`${title} coming soon`} description="This section will be implemented in upcoming phases." />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PlaceholderPage;
