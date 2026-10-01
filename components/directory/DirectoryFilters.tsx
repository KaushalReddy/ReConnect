"use client";

export interface DirectoryFilterState {
  search: string;
  department: string;
  graduationYear: string;
  company: string;
  skill: string;
  location: string;
}

export const EMPTY_FILTERS: DirectoryFilterState = {
  search: "",
  department: "",
  graduationYear: "",
  company: "",
  skill: "",
  location: "",
};

export default function DirectoryFilters({
  filters,
  onChange,
  departments,
  graduationYears,
}: {
  filters: DirectoryFilterState;
  onChange: (next: DirectoryFilterState) => void;
  departments: string[];
  graduationYears: number[];
}) {
  function set<K extends keyof DirectoryFilterState>(key: K, value: string) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="card space-y-4 p-5">
      <input
        className="input-field"
        placeholder="Search by name…"
        value={filters.search}
        onChange={(e) => set("search", e.target.value)}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <select
          className="input-field"
          value={filters.department}
          onChange={(e) => set("department", e.target.value)}
        >
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <select
          className="input-field"
          value={filters.graduationYear}
          onChange={(e) => set("graduationYear", e.target.value)}
        >
          <option value="">Any year</option>
          {graduationYears.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        <input
          className="input-field"
          placeholder="Company"
          value={filters.company}
          onChange={(e) => set("company", e.target.value)}
        />

        <input
          className="input-field"
          placeholder="Skill"
          value={filters.skill}
          onChange={(e) => set("skill", e.target.value)}
        />

        <input
          className="input-field"
          placeholder="Location"
          value={filters.location}
          onChange={(e) => set("location", e.target.value)}
        />
      </div>

      {(filters.search ||
        filters.department ||
        filters.graduationYear ||
        filters.company ||
        filters.skill ||
        filters.location) && (
        <button
          type="button"
          onClick={() => onChange(EMPTY_FILTERS)}
          className="font-body text-xs font-medium text-brass-dark hover:underline"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}
