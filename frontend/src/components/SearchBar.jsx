import { useEffect, useState } from 'react';

export default function SearchBar({ initialValue = '', onSearch, placeholder = 'Search products…', className = '' }) {
  const [value, setValue] = useState(initialValue);
  useEffect(() => setValue(initialValue), [initialValue]);

  const submit = (e) => {
    e.preventDefault();
    onSearch(value.trim());
  };

  return (
    <form className={`searchbar ${className}`} onSubmit={submit} role="search">
      <label htmlFor="search-input" className="sr-only">Search products</label>
      <input id="search-input" type="search" value={value} maxLength={100} placeholder={placeholder} onChange={(e) => setValue(e.target.value)} />
      <button type="submit" className="btn btn-primary btn-sm">Search</button>
    </form>
  );
}
