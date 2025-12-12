import { useState } from "react";
import { Card } from "../components/Card";
import { useGlobal } from "../contexts/GlobalContext";

const HomePage = () => {
  const { shows } = useGlobal();
  const [activeFilter, setActiveFilter] = useState<string>("All");

  const categories = ["All", "IMAX", "3D", "4DX", "Standard"];

  const filteredShows =
    activeFilter === "All"
      ? shows
      : shows.filter((show) => show.type === activeFilter);

  return (
    <div className="flex flex-col justify-center p-4">
      {/* this is the heading a part  */}
      <div>
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6 mt-10">
          <div>
            <h1 className="text-4xl md:text-6xl font-display font-medium text-stone-900 mb-4 tracking-tight">
              Book Your Experience
            </h1>
            <p className="text-stone-500 text-lg max-w-md">
              Book cinema tickets for the latest movies - all in
              one place.
            </p>
          </div>
        </header>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-3 mb-8 border-b border-stone-200 pb-4">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveFilter(category)}
            className={`
              px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300
              ${
                activeFilter === category
                  ? "bg-stone-900 text-white shadow-lg"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }
            `}
          >
            {category}
            {category !== "All" && (
              <span
                className={`ml-2 text-xs ${
                  activeFilter === category
                    ? "text-stone-300"
                    : "text-stone-400"
                }`}
              >
                ({shows.filter((s) => s.type === category).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* this is the Grid Part */}
      {filteredShows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-2xl font-medium text-stone-700 mb-2">
            No {activeFilter !== "All" ? activeFilter : ""} events available
          </h3>
          <p className="text-stone-500">
            Check back later for new listings.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 auto-rows-fr">
          {filteredShows.map((event, index) => (
            <Card key={event.id} show={event} index={index} />
          ))}
        </div>
      )}
    </div>
  );
};

export default HomePage;
