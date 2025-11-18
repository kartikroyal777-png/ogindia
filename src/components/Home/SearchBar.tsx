import { useState } from 'react';
import { Search, MapPin } from 'lucide-react';

export const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search logic here
    console.log('Searching for:', searchTerm, 'in', location);
  };

  return (
    <form 
      onSubmit={handleSearch} 
      className="bg-white/20 backdrop-blur-md p-3 md:p-2 rounded-2xl md:rounded-full shadow-lg w-full"
    >
      <div className="flex flex-col md:flex-row items-center w-full gap-3 md:gap-0">
        <div className="flex items-center w-full md:w-1/2">
          <Search className="text-white/80 h-5 w-5 mx-3 flex-shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="What are you looking for?"
            className="bg-transparent text-white placeholder-white/80 focus:outline-none w-full"
          />
        </div>
        <div className="w-full h-px md:w-px md:h-6 bg-white/30"></div>
        <div className="flex items-center w-full md:w-1/2 md:pl-2">
          <MapPin className="text-white/80 h-5 w-5 mx-3 flex-shrink-0" />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location"
            className="bg-transparent text-white placeholder-white/80 focus:outline-none w-full"
          />
        </div>
        <button 
          type="submit" 
          className="bg-orange-500 text-white p-3 rounded-full hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-opacity-75 transition-colors w-full md:w-auto md:ml-2 flex-shrink-0 flex items-center justify-center"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
          <span className="md:hidden ml-2">Search</span>
        </button>
      </div>
    </form>
  );
};
